/**
 * Advanced Search Page Component
 * 
 * This page provides comprehensive search functionality including:
 * - Global text search across all entities
 * - Geographic search with map integration
 * - Semantic relationship exploration
 * - Cultural pattern analysis
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Tabs,
  Tab,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Search,
  LocationOn,
  Timeline,
  TrendingUp,
  MusicNote,   
  Language,
  Category,
  AccountBalance,
  Build,
  Palette,
  TouchApp,
  Person,
  Code,
  PlayArrow,
  Clear,
} from '@mui/icons-material';
import { useSearchParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorMessage from '../../components/Common/ErrorMessage';
import SearchBar from '../../components/Common/SearchBar';
import { 
  searchApi, 
  SearchResult,
  relationsApi 
} from '../../services/api';

// Tab panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`search-tabpanel-${index}`}
    aria-labelledby={`search-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

// Search result item component
interface SearchResultItemProps {
  result: SearchResult;
  onClick?: (result: SearchResult) => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ result, onClick }) => {
  const getEntityIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      'Instrument': <MusicNote color="primary" />,
      'Famille': <Category color="secondary" />,
      'GroupeEthnique': <Language color="success" />,
      'Localite': <LocationOn color="info" />,
      'PatrimoineCulturel': <AccountBalance color="warning" />,
      'Materiau': <Build color="inherit" />,
      'Timbre': <Palette color="inherit" />,
      'TechniqueDeJeu': <TouchApp color="inherit" />,
      'Artisan': <Person color="inherit" />,
    };
    return icons[type] || <Search />;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, any> = {
      'Instrument': 'primary',
      'Famille': 'secondary',
      'GroupeEthnique': 'success',
      'Localite': 'info',
      'PatrimoineCulturel': 'warning',
    };
    return colors[type] || 'default';
  };

  return (
    <Card 
      sx={{ 
        mb: 2, 
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { 
          transform: 'translateY(-1px)',
          boxShadow: 2 
        } : {}
      }}
      onClick={() => onClick?.(result)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {getEntityIcon(result.type)}
          <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>
            {result.name}
          </Typography>
          <Chip 
            label={result.type} 
            size="small" 
            color={getTypeColor(result.type)}
            variant="outlined"
          />
        </Box>
        
        {/* Description */}
        {result.entity?.description && (
          <Typography variant="body2" color="text.secondary" paragraph>
            {result.entity.description}
          </Typography>
        )}
        
        {/* Propriétés spécifiques selon le type */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
          {result.entity?.distance && (
            <Chip size="small" label={`Distance: ${result.entity.distance.toFixed(1)} km`} variant="outlined" color="info" />
          )}
          {result.entity?.nomLocalite && (
            <Chip size="small" label={`Localité: ${result.entity.nomLocalite}`} variant="outlined" />
          )}
          {result.entity?.anneeCreation && (
            <Chip size="small" label={`Année: ${result.entity.anneeCreation}`} variant="outlined" />
          )}
          {result.entity?.langue && (
            <Chip size="small" label={`Langue: ${result.entity.langue}`} variant="outlined" />
          )}
          {result.entity?.latitude && result.entity?.longitude && (
            <Chip size="small" label={`Coord: ${result.entity.latitude.toFixed(2)}, ${result.entity.longitude.toFixed(2)}`} variant="outlined" />
          )}
          {result.entity?.nomFamille && (
            <Chip size="small" label={`Famille: ${result.entity.nomFamille}`} variant="outlined" />
          )}
          {result.entity?.nomGroupe && (
            <Chip size="small" label={`Groupe: ${result.entity.nomGroupe}`} variant="outlined" />
          )}
          {result.entity?.tempoBPM && (
            <Chip size="small" label={`Tempo: ${result.entity.tempoBPM} BPM`} variant="outlined" />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * Advanced search page component
 */
const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Global search state
  const [globalQuery, setGlobalQuery] = useState(searchParams.get('q') || '');
  const [globalResults, setGlobalResults] = useState<SearchResult[]>([]);
  
  // Geographic search state - with test coordinates (Paris, France)
  const [geoParams, setGeoParams] = useState({
    latitude: '48.8566',    // Paris latitude for testing
    longitude: '2.3522',    // Paris longitude for testing
    radius: '100',
  });
  const [geoResults, setGeoResults] = useState<SearchResult[]>([]);
  
  // Semantic search state
  const [similarityParams, setSimilarityParams] = useState({
    entityId: '',
    entityType: 'Instrument',
  });
  const [similarResults, setSimilarResults] = useState<SearchResult[]>([]);
  
  // Cultural patterns state
  const [culturalPatterns, setCulturalPatterns] = useState<any[]>([]);
  
  // Centrality analysis state
  const [centralityData, setCentralityData] = useState<any[]>([]);
  
  // Cypher query state
  const [cypherQuery, setCypherQuery] = useState('MATCH (n) RETURN n LIMIT 10');
  const [cypherParameters, setCypherParameters] = useState('{}');
  const [cypherResults, setCypherResults] = useState<any[]>([]);
  const [cypherHistory, setCypherHistory] = useState<string[]>([]);

  /**
   * Load initial search if query parameter exists
   */
  useEffect(() => {
    if (globalQuery) {
      performGlobalSearch(globalQuery);
    }
  }, []);

  /**
   * Perform global search
   */
  const performGlobalSearch = async (query: string) => {
    if (!query.trim()) {
      setGlobalResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await searchApi.global(query);
      console.log('Search response:', response); // Debug log
      
      if (response.success) {
        setGlobalResults(response.data || []);
      } else {
        setError(response.error || 'Erreur lors de la recherche');
        setGlobalResults([]);
      }
    } catch (err) {
      console.error('Global search error:', err);
      setError('Erreur lors de la recherche globale');
      setGlobalResults([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Perform geographic search
   */
  const performGeographicSearch = async () => {
    const { latitude, longitude, radius } = geoParams;
    
    console.log('Geographic search params:', { latitude, longitude, radius });
    
    if (!latitude || !longitude) {
      setError('Veuillez saisir une latitude et une longitude');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = {
        lat: parseFloat(latitude),
        lng: parseFloat(longitude),
        radius: parseInt(radius),
      };
      
      console.log('Calling geographic search API with params:', params);
      const response = await searchApi.geographic(params);
      console.log('Geographic search API response:', response);
      
      if (response.success) {
        const responseData = response.data || {};
        const rawResults = responseData.results || [];
        console.log('Geographic search raw results:', rawResults);
        
        // Transform the nested structure to match SearchResult interface
        const transformedResults: SearchResult[] = [];
        
        rawResults.forEach((geoResult, index) => {
          console.log(`Processing geo result ${index}:`, geoResult);
          
          // Add instruments from this location
          if (geoResult.instruments && geoResult.instruments.length > 0) {
            geoResult.instruments.forEach((instrument: any) => {
              transformedResults.push({
                type: 'Instrument',
                name: instrument.nomInstrument,
                entity: {
                  id: instrument.id,
                  ...instrument,
                  latitude: geoResult.localite?.latitude,
                  longitude: geoResult.localite?.longitude,
                  nomLocalite: geoResult.localite?.nomLocalite,
                  distance: geoResult.distance
                },
                labels: ['Instrument']
              });
            });
          }
          
          // Add the location itself
          if (geoResult.localite) {
            transformedResults.push({
              type: 'Localite',
              name: geoResult.localite.nomLocalite,
              entity: {
                id: geoResult.localite.id,
                ...geoResult.localite,
                distance: geoResult.distance
              },
              labels: ['Localite']
            });
          }
          
          // Add groupes ethniques from this location
          if (geoResult.groupesEthniques && geoResult.groupesEthniques.length > 0) {
            geoResult.groupesEthniques.forEach((groupe: any) => {
              transformedResults.push({
                type: 'GroupeEthnique',
                name: groupe.nomGroupe,
                entity: {
                  id: groupe.id,
                  ...groupe,
                  latitude: geoResult.localite?.latitude,
                  longitude: geoResult.localite?.longitude,
                  distance: geoResult.distance
                },
                labels: ['GroupeEthnique']
              });
            });
          }
        });
        
        console.log('Transformed results for display:', transformedResults);
        setGeoResults(transformedResults);
        
        if (transformedResults.length === 0) {
          setError('Aucun résultat trouvé dans cette zone géographique');
        }
      } else {
        console.error('Geographic search failed:', response.error);
        setError(response.error || 'Erreur lors de la recherche géographique');
        setGeoResults([]);
      }
    } catch (err) {
      console.error('Geographic search error:', err);
      setError(`Erreur lors de la recherche géographique: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      setGeoResults([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Perform similarity search
   */
  const performSimilaritySearch = async () => {
    const { entityId, entityType } = similarityParams;
    
    if (!entityId) {
      setError('Veuillez saisir un ID d\'entité');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await searchApi.similar(entityId, entityType);
      if (response.success) {
        setSimilarResults(response.data || []);
      } else {
        setError(response.error || 'Erreur lors de la recherche de similarité');
        setSimilarResults([]);
      }
    } catch (err) {
      console.error('Similarity search error:', err);
      setError('Erreur lors de la recherche de similarité');
      setSimilarResults([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load cultural patterns
   */
  const loadCulturalPatterns = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await searchApi.culturalPatterns();
      if (response.success) {
        setCulturalPatterns(response.data);
      } else {
        setError(response.error || 'Erreur lors du chargement des patterns culturels');
      }
    } catch (err) {
      console.error('Cultural patterns error:', err);
      setError('Erreur lors du chargement des patterns culturels');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load centrality analysis
   */
  const loadCentralityAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await searchApi.centrality();
      if (response.success) {
        setCentralityData(response.data);
      } else {
        setError(response.error || 'Erreur lors de l\'analyse de centralité');
      }
    } catch (err) {
      console.error('Centrality analysis error:', err);
      setError('Erreur lors de l\'analyse de centralité');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Execute Cypher query
   */
  const executeCypherQuery = async () => {
    if (!cypherQuery.trim()) {
      setError('Veuillez saisir une requête Cypher');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let parameters = {};
      try {
        parameters = cypherParameters.trim() ? JSON.parse(cypherParameters) : {};
      } catch (parseError) {
        setError('Paramètres JSON invalides');
        setLoading(false);
        return;
      }

      const response = await searchApi.executeCypher(cypherQuery, parameters);
      console.log('Frontend received response:', response);
      
      if (response.success) {
        console.log('Response data:', response.data);
        setCypherResults(response.data || []);
        
        // Add to history if not already present
        if (!cypherHistory.includes(cypherQuery)) {
          setCypherHistory(prev => [cypherQuery, ...prev.slice(0, 9)]); // Keep last 10 queries
        }
      } else {
        console.error('Query failed:', response.error);
        setError(response.error || 'Erreur lors de l\'exécution de la requête');
        setCypherResults([]);
      }
    } catch (err) {
      console.error('Cypher execution error:', err);
      setError('Erreur lors de l\'exécution de la requête Cypher');
      setCypherResults([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load predefined Cypher query
   */
  const loadPredefinedQuery = (query: string) => {
    setCypherQuery(query);
    setCypherParameters('{}');
  };

  /**
   * Test with fake data for debugging
   */
  const testWithFakeData = () => {
    const fakeResults = [
      { "nom": "Djembe", "description": "Tambour africain" },
      { "nom": "Kora", "description": "Harpe-luth" },
      { "nom": "Balafon", "description": "Xylophone" }
    ];
    setCypherResults(fakeResults);
    console.log('Set fake results:', fakeResults);
  };

  /**
   * Clear Cypher results
   */
  const clearCypherResults = () => {
    setCypherResults([]);
    setError(null);
  };

  /**
   * Handle tab change
   */
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setError(null);
    
    // Load data for specific tabs
    if (newValue === 3) {
      loadCulturalPatterns();
    } else if (newValue === 4) {
      loadCentralityAnalysis();
    }
  };

  /**
   * Handle search result selection - Navigate to entity detail page
   */
  const handleResultSelect = (result: SearchResult) => {
    console.log('Selected search result:', result);
    
    // Comprehensive mapping of all entity types to their routes
    const entityRouteMap: Record<string, string> = {
      // Main entities
      'Instrument': '/instruments',
      'Famille': '/familles', 
      'GroupeEthnique': '/groupes-ethniques',
      'Localite': '/localites',
      'Materiau': '/materiaux',
      'Timbre': '/timbres',
      'TechniqueDeJeu': '/techniques',
      'Artisan': '/artisans',
      'PatrimoineCulturel': '/patrimoines',
      
      // Alternative naming variations
      'Familles': '/familles',
      'GroupesEthniques': '/groupes-ethniques', 
      'Localites': '/localites',
      'Materiaux': '/materiaux',
      'Timbres': '/timbres',
      'Techniques': '/techniques',
      'TechniquesDeJeu': '/techniques',
      'Artisans': '/artisans',
      'Patrimoines': '/patrimoines',
      'PatrimoinesCulturels': '/patrimoines',
    };

    // Determine the route based on result type or labels
    const resultType = result.type || (result.labels && result.labels[0]);
    const route = entityRouteMap[resultType];
    
    if (route && result.entity?.id) {
      // Navigate to the entity page with ID and action parameters
      console.log(`Navigating to: ${route}?id=${result.entity.id}&action=view`);
      navigate(`${route}?id=${result.entity.id}&action=view`);
    } else if (route) {
      // Navigate to the entity page without specific ID
      console.log(`Navigating to: ${route}`);
      navigate(route);
    } else {
      // Fallback: show more info in current page or navigate to search
      console.log('No specific route found, showing details in place');
      // Could open a modal or expand the result card here
    }
  };

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Recherche Avancée
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Explorez l'ontologie musicale avec nos outils de recherche sémantique
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Box sx={{ mb: 3 }}>
          <ErrorMessage message={error} />
        </Box>
      )}

      {/* Search Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Recherche Globale" icon={<Search />} />
          <Tab label="Recherche Géographique" icon={<LocationOn />} />
          <Tab label="Similarité" icon={<Timeline />} />
          <Tab label="Patterns Culturels" icon={<Language />} />
          <Tab label="Analyse de Centralité" icon={<TrendingUp />} />
          <Tab label="Requêtes Cypher" icon={<Code />} />
        </Tabs>

        {/* Global Search Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ mb: 3 }}>
            <SearchBar
              placeholder="Rechercher dans toute l'ontologie..."
              initialValue={globalQuery}
              fullWidth
              enableAutocomplete={true}
              onSearch={(query) => {
                setGlobalQuery(query);
                performGlobalSearch(query);
                setSearchParams(query ? { q: query } : {});
              }}
              onResultSelect={handleResultSelect}
            />
          </Box>

          {loading ? (
            <LoadingSpinner message="Recherche en cours..." />
          ) : (
            <Box>
              {globalResults.length > 0 ? (
                <>
                  <Typography variant="h6" gutterBottom>
                    {globalResults.length} résultat{globalResults.length > 1 ? 's' : ''} trouvé{globalResults.length > 1 ? 's' : ''}
                  </Typography>
                  {globalResults.map((result, index) => (
                    <SearchResultItem
                      key={index}
                      result={result}
                      onClick={handleResultSelect}
                    />
                  ))}
                </>
              ) : globalQuery ? (
                <Alert severity="info">
                  Aucun résultat trouvé pour "{globalQuery}"
                </Alert>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  Saisissez un terme de recherche pour explorer l'ontologie
                </Typography>
              )}
            </Box>
          )}
        </TabPanel>

        {/* Geographic Search Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Paramètres de Recherche
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Latitude"
                      type="number"
                      value={geoParams.latitude}
                      onChange={(e) => setGeoParams(prev => ({ ...prev, latitude: e.target.value }))}
                      inputProps={{ step: 'any' }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Longitude"
                      type="number"
                      value={geoParams.longitude}
                      onChange={(e) => setGeoParams(prev => ({ ...prev, longitude: e.target.value }))}
                      inputProps={{ step: 'any' }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Rayon (km)"
                      type="number"
                      value={geoParams.radius}
                      onChange={(e) => setGeoParams(prev => ({ ...prev, radius: e.target.value }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={performGeographicSearch}
                      disabled={loading}
                    >
                      Rechercher
                    </Button>
                  </Grid>
                  
                  {/* Boutons de coordonnées prédéfinies pour tests */}
                  <Grid size={12}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Coordonnées de test :
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setGeoParams({ latitude: '48.8566', longitude: '2.3522', radius: '100' })}
                      >
                        Paris
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setGeoParams({ latitude: '14.7167', longitude: '-17.4677', radius: '200' })}
                      >
                        Dakar
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setGeoParams({ latitude: '12.6392', longitude: '-8.0029', radius: '300' })}
                      >
                        Bamako
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setGeoParams({ latitude: '5.3600', longitude: '-4.0083', radius: '150' })}
                      >
                        Abidjan
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ minHeight: '300px' }}>
                {loading ? (
                  <LoadingSpinner message="Recherche géographique en cours..." />
                ) : geoResults.length > 0 ? (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {geoResults.length} résultat{geoResults.length > 1 ? 's' : ''} dans la zone
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Rayon de {geoParams.radius} km autour de ({parseFloat(geoParams.latitude).toFixed(4)}, {parseFloat(geoParams.longitude).toFixed(4)})
                    </Typography>
                    {console.log('Rendering geographic results:', geoResults)}
                    {geoResults.map((result, index) => {
                      console.log(`Rendering result ${index}:`, result);
                      return (
                        <SearchResultItem
                          key={index}
                          result={result}
                          onClick={handleResultSelect}
                        />
                      );
                    })}
                  </Box>
                ) : error ? (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                ) : (
                  <Alert severity="info">
                    Utilisez les coordonnées prédéfinies ou saisissez vos propres coordonnées pour rechercher des entités dans une zone géographique.
                  </Alert>
                )}
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Similarity Search Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Recherche de Similarité
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <TextField
                      fullWidth
                      label="ID de l'entité"
                      value={similarityParams.entityId}
                      onChange={(e) => setSimilarityParams(prev => ({ ...prev, entityId: e.target.value }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Type d'entité</InputLabel>
                      <Select
                        value={similarityParams.entityType}
                        onChange={(e) => setSimilarityParams(prev => ({ ...prev, entityType: e.target.value }))}
                        label="Type d'entité"
                      >
                        <MenuItem value="Instrument">Instrument</MenuItem>
                        <MenuItem value="Famille">Famille</MenuItem>
                        <MenuItem value="GroupeEthnique">Groupe Ethnique</MenuItem>
                        <MenuItem value="Localite">Localité</MenuItem>
                        <MenuItem value="Materiau">Matériau</MenuItem>
                        <MenuItem value="Timbre">Timbre</MenuItem>
                        <MenuItem value="TechniqueDeJeu">Technique de Jeu</MenuItem>
                        <MenuItem value="Artisan">Artisan</MenuItem>
                        <MenuItem value="PatrimoineCulturel">Patrimoine Culturel</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={performSimilaritySearch}
                      disabled={loading}
                    >
                      Trouver Similaires
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              {loading ? (
                <LoadingSpinner />
              ) : similarResults.length > 0 ? (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Entités Similaires
                  </Typography>
                  {similarResults.map((result, index) => (
                    <SearchResultItem
                      key={index}
                      result={result}
                      onClick={handleResultSelect}
                    />
                  ))}
                </Box>
              ) : (
                <Alert severity="info">
                  Aucune entité similaire trouvée
                </Alert>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        {/* Cultural Patterns Tab */}
        <TabPanel value={activeTab} index={3}>
          {loading ? (
            <LoadingSpinner message="Chargement des patterns culturels..." />
          ) : culturalPatterns.length > 0 ? (
            <Grid container spacing={3}>
              {culturalPatterns.map((pattern, index) => (
                <Grid size={{ xs: 12, md: 6 }} key={index}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Language color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6" component="div">
                          {pattern.patrimoine}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Groupe ethnique:</strong> {pattern.groupe}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Localité:</strong> {pattern.localite}
                        </Typography>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      {/* Instruments */}
                      {pattern.instruments && pattern.instruments.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            <MusicNote sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                            Instruments ({pattern.instruments.length})
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {pattern.instruments.map((instrument: string, idx: number) => (
                              <Chip key={idx} label={instrument} size="small" color="primary" variant="outlined" />
                            ))}
                          </Box>
                        </Box>
                      )}

                      {/* Rythmes */}
                      {pattern.rythmes && pattern.rythmes.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            <Timeline sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                            Rythmes ({pattern.rythmes.length})
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {pattern.rythmes.map((rythme: string, idx: number) => (
                              <Chip key={idx} label={rythme} size="small" color="secondary" variant="outlined" />
                            ))}
                          </Box>
                        </Box>
                      )}

                      {/* Matériaux */}
                      {pattern.materiaux && pattern.materiaux.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            <Build sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                            Matériaux ({pattern.materiaux.length})
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {pattern.materiaux.map((materiau: string, idx: number) => (
                              <Chip key={idx} label={materiau} size="small" color="success" variant="outlined" />
                            ))}
                          </Box>
                        </Box>
                      )}

                      {/* Familles */}
                      {pattern.familles && pattern.familles.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            <Category sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                            Familles ({pattern.familles.length})
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {pattern.familles.map((famille: string, idx: number) => (
                              <Chip key={idx} label={famille} size="small" color="info" variant="outlined" />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info">
              Aucun pattern culturel disponible
            </Alert>
          )}
        </TabPanel>

        {/* Centrality Analysis Tab */}
        <TabPanel value={activeTab} index={4}>
          {loading ? (
            <LoadingSpinner message="Analyse de centralité en cours..." />
          ) : centralityData.length > 0 ? (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Analyse de Centralité - {centralityData.length} entités
              </Typography>
              
              {/* Top entities */}
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Entités les plus centrales
                </Typography>
                <Grid container spacing={2}>
                  {centralityData.slice(0, 3).map((item, index) => (
                    <Grid size={{ xs: 12, md: 4 }} key={index}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Chip 
                              label={`#${index + 1}`} 
                              size="small" 
                              color={index === 0 ? 'primary' : index === 1 ? 'secondary' : 'default'}
                            />
                            <Typography variant="h4" sx={{ ml: 'auto', fontWeight: 'bold' }}>
                              {item.centrality}
                            </Typography>
                          </Box>
                          
                          <Typography variant="h6" gutterBottom>
                            {item.entity.nomInstrument || item.entity.nomGroupe || item.entity.nomLocalite || item.entity.nomRythme}
                          </Typography>
                          
                          <Chip 
                            label={item.type} 
                            size="small" 
                            color={
                              item.type === 'Instrument' ? 'primary' :
                              item.type === 'GroupeEthnique' ? 'success' :
                              item.type === 'Localite' ? 'info' :
                              item.type === 'Rythme' ? 'secondary' : 'default'
                            }
                            variant="outlined"
                          />
                          
                          {item.entity.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {item.entity.description}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>

              {/* All entities table */}
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Rang</TableCell>
                      <TableCell>Entité</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Score de Centralité</TableCell>
                      <TableCell>Détails</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {centralityData.map((item, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Chip 
                            label={index + 1} 
                            size="small" 
                            color={index < 3 ? 'primary' : 'default'}
                            variant={index < 3 ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2">
                              {item.entity.nomInstrument || item.entity.nomGroupe || item.entity.nomLocalite || item.entity.nomRythme}
                            </Typography>
                            {item.entity.description && (
                              <Typography variant="caption" color="text.secondary">
                                {item.entity.description.substring(0, 80)}
                                {item.entity.description.length > 80 ? '...' : ''}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={item.type} 
                            size="small" 
                            color={
                              item.type === 'Instrument' ? 'primary' :
                              item.type === 'GroupeEthnique' ? 'success' :
                              item.type === 'Localite' ? 'info' :
                              item.type === 'Rythme' ? 'secondary' : 'default'
                            }
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="h6" color="primary">
                            {item.centrality}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {item.entity.anneeCreation && (
                              <Chip label={`${item.entity.anneeCreation}`} size="small" variant="outlined" />
                            )}
                            {item.entity.langue && (
                              <Chip label={item.entity.langue} size="small" variant="outlined" />
                            )}
                            {item.entity.tempoBPM && (
                              <Chip label={`${item.entity.tempoBPM} BPM`} size="small" variant="outlined" />
                            )}
                            {item.entity.latitude && item.entity.longitude && (
                              <Chip 
                                label={`${item.entity.latitude.toFixed(2)}, ${item.entity.longitude.toFixed(2)}`} 
                                size="small" 
                                variant="outlined" 
                              />
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : (
            <Alert severity="info">
              Aucune donnée de centralité disponible
            </Alert>
          )}
        </TabPanel>

        {/* Cypher Query Tab */}
        <TabPanel value={activeTab} index={5}>
          <Grid container spacing={3}>
            {/* Query Editor */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <Code sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Éditeur de Requêtes Cypher
                </Typography>
                
                {/* Predefined queries */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Requêtes prédéfinies :
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => loadPredefinedQuery('MATCH (n) RETURN n LIMIT 10')}
                    >
                      Tous les nœuds
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => loadPredefinedQuery('MATCH (i:Instrument) RETURN i.nomInstrument, i.description LIMIT 20')}
                    >
                      Instruments
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => loadPredefinedQuery('MATCH (i:Instrument)-[r]->(n) RETURN i.nomInstrument, type(r), n LIMIT 15')}
                    >
                      Relations
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => loadPredefinedQuery('MATCH (l:Localite) WHERE l.latitude IS NOT NULL RETURN l.nomLocalite, l.latitude, l.longitude')}
                    >
                      Localités géo
                    </Button>
                  </Box>
                </Box>

                <TextField
                  fullWidth
                  multiline
                  rows={8}
                  label="Requête Cypher"
                  value={cypherQuery}
                  onChange={(e) => setCypherQuery(e.target.value)}
                  sx={{ mb: 2, fontFamily: 'monospace' }}
                  placeholder="Saisissez votre requête Cypher ici..."
                />

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Paramètres (JSON)"
                  value={cypherParameters}
                  onChange={(e) => setCypherParameters(e.target.value)}
                  sx={{ mb: 2, fontFamily: 'monospace' }}
                  placeholder='{"param1": "value1", "param2": 123}'
                />

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<PlayArrow />}
                    onClick={executeCypherQuery}
                    disabled={loading}
                  >
                    Exécuter
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Clear />}
                    onClick={clearCypherResults}
                  >
                    Effacer
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={testWithFakeData}
                    sx={{ ml: 2 }}
                  >
                    Test
                  </Button>
                </Box>

                {/* Query History */}
                {cypherHistory.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Historique des requêtes
                    </Typography>
                    <List dense>
                      {cypherHistory.slice(0, 5).map((query, index) => (
                        <ListItem
                          key={index}
                          button
                          onClick={() => setCypherQuery(query)}
                          sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 0.5 }}
                        >
                          <ListItemText
                            primary={query.substring(0, 60) + (query.length > 60 ? '...' : '')}
                            sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
            </Grid>

            {/* Results */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ minHeight: '400px' }}>
                <Typography variant="h6" gutterBottom>
                  Résultats
                </Typography>
                
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Debug: cypherResults.length = {cypherResults.length}, loading = {loading.toString()}
                </Typography>
                
                {loading ? (
                  <LoadingSpinner message="Exécution de la requête..." />
                ) : cypherResults.length > 0 ? (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {cypherResults.length} résultat{cypherResults.length > 1 ? 's' : ''} trouvé{cypherResults.length > 1 ? 's' : ''}
                    </Typography>
                    
                    <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                      <Table stickyHeader>
                        <TableHead>
                          <TableRow>
                            {cypherResults.length > 0 && Object.keys(cypherResults[0]).map((key) => (
                              <TableCell key={key}>{key}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {cypherResults.map((result, index) => (
                            <TableRow key={index} hover>
                              {Object.values(result).map((value: any, valueIndex) => (
                                <TableCell key={valueIndex}>
                                  {typeof value === 'object' && value !== null ? (
                                    <Box sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                      <details>
                                        <summary style={{ cursor: 'pointer', color: 'primary.main' }}>
                                          {Array.isArray(value) ? `Array(${value.length})` : 'Object'}
                                        </summary>
                                        <pre style={{ marginTop: '8px', fontSize: '0.75rem' }}>
                                          {JSON.stringify(value, null, 2)}
                                        </pre>
                                      </details>
                                    </Box>
                                  ) : (
                                    <Typography variant="body2">
                                      {String(value)}
                                    </Typography>
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                ) : (
                  <Alert severity="info">
                    Saisissez et exécutez une requête Cypher pour voir les résultats ici.
                    <br />
                    <strong>Note:</strong> Seules les requêtes de lecture (MATCH, RETURN, WHERE, etc.) sont autorisées pour des raisons de sécurité.
                  </Alert>
                )}
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default SearchPage;