/**
 * Custom hook for handling URL-based entity navigation
 * 
 * This hook provides a generic way to handle direct navigation to entity details
 * from search results or other parts of the application.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface EntityUrlNavigationConfig<T> {
  /**
   * API function to get entity by ID
   */
  getEntityById: (id: number) => Promise<{ success: boolean; data?: T }>;
  
  /**
   * Callback when entity is loaded successfully
   */
  onEntityLoaded: (entity: T) => void;
  
  /**
   * Optional callback for additional actions (like loading relations)
   */
  onAdditionalAction?: (entity: T, entityId: number) => void;
}

/**
 * Hook to handle URL parameters for direct entity navigation
 */
export const useEntityUrlNavigation = <T>({
  getEntityById,
  onEntityLoaded,
  onAdditionalAction,
}: EntityUrlNavigationConfig<T>) => {
  const location = useLocation();

  useEffect(() => {
    console.log('useEntityUrlNavigation: checking URL params:', location.search);
    const searchParams = new URLSearchParams(location.search);
    const entityId = searchParams.get('id');
    const action = searchParams.get('action');
    
    console.log('useEntityUrlNavigation: entityId =', entityId, 'action =', action);
    
    if (entityId && (action === 'view' || action === 'detail')) {
      console.log('useEntityUrlNavigation: conditions met, loading entity...');
      const loadSpecificEntity = async () => {
        try {
          console.log(`Loading entity with ID: ${entityId}`);
          const response = await getEntityById(parseInt(entityId));
          
          console.log('API response:', response);
          if (response.success && response.data) {
            console.log('Entity loaded successfully:', response.data);
            onEntityLoaded(response.data);
            
            // Execute additional action if provided
            if (onAdditionalAction) {
              console.log('Executing additional action...');
              onAdditionalAction(response.data, parseInt(entityId));
            }
          } else {
            console.warn('Entity not found:', entityId);
          }
        } catch (err) {
          console.error('Error loading specific entity:', err);
        }
      };
      
      loadSpecificEntity();
    } else {
      console.log('useEntityUrlNavigation: conditions not met, skipping...');
    }
    // Remove function dependencies to prevent infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);
};

export default useEntityUrlNavigation;