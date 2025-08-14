/**
 * Instruments Page Component
 * 
 * This page provides a comprehensive interface for managing musical instruments
 * including listing, creating, editing, and viewing instrument details.
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useEntityUrlNavigation from '../../hooks/useEntityUrlNavigation';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Alert,
  Checkbox,
  Collapse,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  MusicNote,
  Search,
  FilterList,
  Timeline,
  AccountTree,
  Close,
  ArrowForward,
  ArrowBack,
} from '@mui/icons-material';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorMessage from '../../components/Common/ErrorMessage';
import SearchBar from '../../components/Common/SearchBar';
import { 
  instrumentsApi, 
  famillesApi, 
  groupesEthniquesApi,
  artisansApi,
  relationsApi,
  Instrument, 
  Famille,
  GroupeEthnique,
  Artisan,
  ApiListResponse 
} from '../../services/api';

// Form data interface for create/edit
interface InstrumentFormData {
  nomInstrument: string;
  description: string;
  anneeCreation: number | '';
}

// Form validation errors
interface FormErrors {
  nomInstrument?: string;
  description?: string;
  anneeCreation?: string;
}


/**
 * Instruments management page
 */
// @ts-ignore
const InstrumentsPage: React.FC = () => {
  const location = useLocation();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [familles, setFamilles] = useState<Famille[]>([]);
  const [groupesEthniques, setGroupesEthniques] = useState<GroupeEthnique[]>([]);
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<string>('');
  const [selectedGroupeEthnique, setSelectedGroupeEthnique] = useState<string>('');
  const [selectedArtisan, setSelectedArtisan] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [yearFrom, setYearFrom] = useState<string>('');
  const [yearTo, setYearTo] = useState<string>('');
  const [selectedInstruments, setSelectedInstruments] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);
  const [formData, setFormData] = useState<InstrumentFormData>({
    nomInstrument: '',
    description: '',
    anneeCreation: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [relations, setRelations] = useState<any[]>([]);
  const [showRelations, setShowRelations] = useState(false);
  const [relationsLoading, setRelationsLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Get display name for an entity based on its properties
   */
  const getEntityDisplayName = (entity: any): string => {
    if (!entity) return 'Entité inconnue';
    
    // Try different name properties based on entity type
    return entity.nomInstrument || 
           entity.nomFamille || 
           entity.nomGroupe || 
           entity.nomLocalite || 
           entity.nomMateriau || 
           entity.nomTechnique || 
           entity.nomArtisan || 
           entity.nomPatrimoine ||
           entity.nomRythme ||
           entity.descriptionTimbre ||
           entity.nom ||
           `Entité ${entity.id}`;
  };

  /**
   * Get additional details for an entity
   */
  const getEntityDetails = (entity: any): string => {
    if (!entity) return '';
    
    const details = [];
    if (entity.description) details.push(entity.description);
    if (entity.descriptionFamille) details.push(entity.descriptionFamille);
    if (entity.langue) details.push(`Langue: ${entity.langue}`);
    if (entity.coordonnees) details.push(`Coord: ${entity.coordonnees}`);
    if (entity.type) details.push(`Type: ${entity.type}`);
    if (entity.specialite) details.push(`Spécialité: ${entity.specialite}`);
    if (entity.anneesExperience) details.push(`Exp: ${entity.anneesExperience} ans`);
    if (entity.tempoBPM) details.push(`Tempo: ${entity.tempoBPM} BPM`);
    if (entity.frequence) details.push(`Freq: ${entity.frequence} Hz`);
    if (entity.intensite) details.push(`Int: ${entity.intensite}`);
    
    return details.slice(0, 2).join(' | ') || 'Aucun détail disponible';
  };

  /**
   * Load instruments data
   */
  useEffect(() => {
    loadInstruments();
    loadFamilles();
    loadGroupesEthniques();
    loadArtisans();
  }, [page, rowsPerPage, searchQuery, selectedFamily, selectedGroupeEthnique, selectedArtisan, yearFrom, yearTo]);

  /**
   * Handle URL parameters for direct navigation to instrument details using custom hook
   */
  useEntityUrlNavigation({
    getEntityById: instrumentsApi.getById,
    onEntityLoaded: (instrument: Instrument) => {
      console.log('InstrumentsPage: onEntityLoaded called with:', instrument);
      setSelectedInstrument(instrument);
      
      // Get action from URL to decide which dialog to open
      const searchParams = new URLSearchParams(location.search);
      const action = searchParams.get('action');
      
      // Use setTimeout to ensure this happens after other useEffects
      setTimeout(() => {
        if (action === 'detail') {
          setShowDetail(true); // Open the detail dialog
          console.log('InstrumentsPage: showDetail set to true (delayed)');
        } else if (action === 'view') {
          setShowRelations(true); // Open the relations dialog
          console.log('InstrumentsPage: showRelations set to true (delayed)');
        }
      }, 100);
    },
    onAdditionalAction: (instrument: Instrument, instrumentId: number) => {
      console.log('InstrumentsPage: onAdditionalAction called for instrument ID:', instrumentId);
      const searchParams = new URLSearchParams(location.search);
      const action = searchParams.get('action');
      
      // Only load relations if action is 'view' (relations view)
      if (action === 'view') {
        loadInstrumentRelations(instrumentId);
      }
    },
  });

  /**
   * Load instruments with filters and pagination
   */
  const loadInstruments = async () => {
    console.log('🔄 loadInstruments called with filters:', {
      searchQuery,
      selectedFamily,
      selectedGroupeEthnique,
      selectedArtisan,
      yearFrom,
      yearTo,
      page,
      rowsPerPage
    });
    
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(searchQuery && { search: searchQuery }),
        ...(selectedFamily && { famille: selectedFamily }),
        ...(selectedGroupeEthnique && { groupeEthnique: selectedGroupeEthnique }),
        ...(selectedArtisan && { artisan: selectedArtisan }),
        ...(yearFrom && { anneeMin: parseInt(yearFrom) }),
        ...(yearTo && { anneeMax: parseInt(yearTo) }),
      };

      console.log('📡 API call params:', params);
      const response = await instrumentsApi.getAll(params);
      console.log('📥 API response:', response);
      
      if (response.success) {
        // Handle the smart API response structure
        const instruments = Array.isArray(response.data) 
          ? response.data 
          : (response.data?.data ? response.data.data : []);
        
        console.log('✅ Frontend: Setting instruments:', instruments.length, 'items');
        setInstruments(instruments);
        
        const totalCount = response.total || 
                          response.data?.total || 
                          response.pagination?.total || 
                          instruments.length || 
                          0;
        
        console.log('📊 Frontend: Setting totalCount:', totalCount);
        setTotalCount(totalCount);
      } else {
        console.error('❌ API error:', response.error);
        setError(response.error || 'Erreur lors du chargement des instruments');
      }
    } catch (err) {
      console.error('💥 Exception in loadInstruments:', err);
      setError('Erreur lors du chargement des instruments');
    } finally {
      console.log('✨ Setting loading to false');
      setLoading(false);
    }
  };

  /**
   * Load families for filtering
   */
  const loadFamilles = async () => {
    try {
      const response = await famillesApi.getAll();
      if (response.success) {
        // Handle different response structures safely
        const data = response.data?.data || response.data || [];
        const familles = Array.isArray(data) ? data : [];
        setFamilles(familles);
      }
    } catch (err) {
      console.error('Error loading families:', err);
    }
  };

  /**
   * Load groupes ethniques for filtering
   */
  const loadGroupesEthniques = async () => {
    try {
      const response = await groupesEthniquesApi.getAll({ limit: 100 });
      if (response.success) {
        // Handle different response structures safely
        const data = response.data?.data || response.data || [];
        const groupes = Array.isArray(data) ? data : [];
        setGroupesEthniques(groupes);
      }
    } catch (err) {
      console.error('Error loading ethnic groups:', err);
    }
  };

  /**
   * Load artisans for filtering
   */
  const loadArtisans = async () => {
    try {
      const response = await artisansApi.getAll({ limit: 100 });
      if (response.success) {
        // Handle different response structures safely
        const data = response.data?.data || response.data || [];
        const artisans = Array.isArray(data) ? data : [];
        setArtisans(artisans);
      }
    } catch (err) {
      console.error('Error loading artisans:', err);
    }
  };

  /**
   * Handle page change
   */
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  /**
   * Handle rows per page change
   */
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  /**
   * Handle search
   */
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(0);
  };

  /**
   * Handle family filter change
   */
  const handleFamilyFilterChange = (family: string) => {
    console.log('🎯 Family filter changed to:', family);
    setSelectedFamily(family);
    setPage(0);
  };

  /**
   * Handle groupe ethnique filter change
   */
  const handleGroupeEthniqueFilterChange = (groupe: string) => {
    console.log('🌍 Groupe ethnique filter changed to:', groupe);
    setSelectedGroupeEthnique(groupe);
    setPage(0);
  };

  /**
   * Handle artisan filter change
   */
  const handleArtisanFilterChange = (artisan: string) => {
    setSelectedArtisan(artisan);
    setPage(0);
  };

  /**
   * Clear all filters
   */
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedFamily('');
    setSelectedGroupeEthnique('');
    setSelectedArtisan('');
    setYearFrom('');
    setYearTo('');
    setPage(0);
  };

  /**
   * Apply advanced filters
   */
  const handleApplyFilters = () => {
    setPage(0);
    loadInstruments();
  };

  /**
   * Handle instrument selection
   */
  const handleSelectInstrument = (instrumentId: number) => {
    setSelectedInstruments(prev => 
      prev.includes(instrumentId)
        ? prev.filter(id => id !== instrumentId)
        : [...prev, instrumentId]
    );
  };

  /**
   * Handle select all instruments
   */
  const handleSelectAll = () => {
    if (selectedInstruments.length === instruments.length) {
      setSelectedInstruments([]);
    } else {
      setSelectedInstruments(instruments.map(i => i.id));
    }
  };

  /**
   * Handle bulk delete
   */
  const handleBulkDelete = async () => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedInstruments.length} instruments ?`)) {
      return;
    }

    try {
      setLoading(true);
      let successCount = 0;
      let errorCount = 0;

      for (const id of selectedInstruments) {
        try {
          await instrumentsApi.delete(id);
          successCount++;
        } catch {
          errorCount++;
        }
      }

      setSelectedInstruments([]);
      loadInstruments();
      
      if (errorCount === 0) {
        setSuccessMessage(`${successCount} instruments supprimés avec succès`);
      } else {
        setError(`${successCount} instruments supprimés, ${errorCount} erreurs`);
      }
      
      setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 5000);
    } catch (err) {
      setError('Erreur lors de la suppression en lot');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load instrument relations
   */
  const loadInstrumentRelations = async (instrumentId: number) => {
    setRelationsLoading(true);
    try {
      console.log('Loading relations for instrument ID:', instrumentId);
      
      // Based on the API test, we know that the entity ID should just be the numeric ID
      const relationsResponse = await relationsApi.getForEntity(`${instrumentId}`);
      console.log('API Response:', relationsResponse);
      
      if (relationsResponse.success && relationsResponse.data) {
        const data = relationsResponse.data;
        let allRelations: any[] = [];
        
        // The API returns relations in the format: { relations: { incoming: [], outgoing: [] } }
        if (data.relations) {
          const incoming = data.relations.incoming || [];
          const outgoing = data.relations.outgoing || [];
          
          // The relations already come with direction and proper entity info
          allRelations = [...incoming, ...outgoing];
        }
        
        console.log('Processed relations:', allRelations);
        setRelations(allRelations);
      } else {
        setRelations([]);
        console.warn('No relations found for instrument:', instrumentId);
      }
    } catch (err) {
      console.error('Error loading relations:', err);
      setRelations([]);
      setError('Erreur lors du chargement des relations');
    } finally {
      setRelationsLoading(false);
    }
  };

  /**
   * Open create dialog
   */
  const handleCreate = () => {
    setDialogMode('create');
    setFormData({
      nomInstrument: '',
      description: '',
      anneeCreation: '',
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  /**
   * Open edit dialog
   */
  const handleEdit = (instrument: Instrument) => {
    setDialogMode('edit');
    setSelectedInstrument(instrument);
    setFormData({
      nomInstrument: instrument.nomInstrument,
      description: instrument.description || '',
      anneeCreation: instrument.anneeCreation || '',
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  /**
   * Open view dialog
   */
  const handleView = (instrument: Instrument) => {
    setDialogMode('view');
    setSelectedInstrument(instrument);
    setFormData({
      nomInstrument: instrument.nomInstrument,
      description: instrument.description || '',
      anneeCreation: instrument.anneeCreation || '',
    });
    setFormErrors({});
    loadInstrumentRelations(instrument.id);
    setOpenDialog(true);
  };

  /**
   * Handle view relations
   */
  const handleViewRelations = (instrument: Instrument) => {
    setSelectedInstrument(instrument);
    setShowRelations(true);
    loadInstrumentRelations(instrument.id);
  };

  /**
   * Handle form input changes
   */
  const handleFormChange = (field: keyof InstrumentFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    // Validate instrument name
    if (!formData.nomInstrument.trim()) {
      errors.nomInstrument = 'Le nom de l\'instrument est requis';
    } else if (formData.nomInstrument.trim().length < 2) {
      errors.nomInstrument = 'Le nom doit contenir au moins 2 caractères';
    } else if (formData.nomInstrument.trim().length > 100) {
      errors.nomInstrument = 'Le nom ne peut pas dépasser 100 caractères';
    }
    
    // Validate description
    if (formData.description && formData.description.length > 500) {
      errors.description = 'La description ne peut pas dépasser 500 caractères';
    }
    
    // Validate year
    if (formData.anneeCreation !== '') {
      const year = Number(formData.anneeCreation);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1 || year > currentYear) {
        errors.anneeCreation = `L'année doit être entre 1 et ${currentYear}`;
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleFormSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setFormLoading(true);

    try {
      const submitData = {
        ...formData,
        anneeCreation: formData.anneeCreation === '' ? undefined : Number(formData.anneeCreation),
      };

      if (dialogMode === 'create') {
        const response = await instrumentsApi.create(submitData);
        if (response.success) {
          setOpenDialog(false);
          loadInstruments();
          setFormData({ nomInstrument: '', description: '', anneeCreation: '' });
          setFormErrors({});
          setSuccessMessage(`Instrument "${response.data.nomInstrument}" créé avec succès`);
          setTimeout(() => setSuccessMessage(null), 5000);
        } else {
          setFormErrors({ nomInstrument: response.error || 'Erreur lors de la création' });
        }
      } else if (dialogMode === 'edit' && selectedInstrument) {
        const response = await instrumentsApi.update(selectedInstrument.id, submitData);
        if (response.success) {
          setOpenDialog(false);
          loadInstruments();
          setFormData({ nomInstrument: '', description: '', anneeCreation: '' });
          setFormErrors({});
          setSuccessMessage(`Instrument "${response.data.nomInstrument}" modifié avec succès`);
          setTimeout(() => setSuccessMessage(null), 5000);
        } else {
          setFormErrors({ nomInstrument: response.error || 'Erreur lors de la modification' });
        }
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setFormErrors({ nomInstrument: 'Erreur lors de la soumission du formulaire' });
    } finally {
      setFormLoading(false);
    }
  };

  /**
   * Handle delete
   */
  const handleDelete = async (instrument: Instrument) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${instrument.nomInstrument}" ?`)) {
      return;
    }

    try {
      const response = await instrumentsApi.delete(instrument.id);
      if (response.success) {
        loadInstruments();
        setSuccessMessage(`Instrument "${instrument.nomInstrument}" supprimé avec succès`);
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setError(response.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Erreur lors de la suppression');
    }
  };

  /**
   * Render loading state
   */
  if (loading && instruments.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <LoadingSpinner message="Chargement des instruments..." />
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Instruments de Musique
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gérez les instruments de musique de votre ontologie
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreate}
            size="large"
          >
            Ajouter un Instrument
          </Button>
        </Box>
        
        {/* Quick Stats */}
        <Card sx={{ background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)', color: 'white' }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item>
                <MusicNote sx={{ fontSize: 40, opacity: 0.8 }} />
              </Grid>
              <Grid item xs>
                <Typography variant="h6">
                  {totalCount} instruments au total
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {familles.length > 0 ? `Répartis dans ${familles.length} familles` : 'Chargement des familles...'}
                  {groupesEthniques.length > 0 && (
                    <span> • {groupesEthniques.length} groupes ethniques • {artisans.length} artisans</span>
                  )}
                </Typography>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  sx={{ color: 'white', borderColor: 'white' }}
                  onClick={() => handleFamilyFilterChange('')}
                >
                  Voir tout
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* Success Alert */}
      {successMessage && (
        <Box sx={{ mb: 3 }}>
          <Alert severity="success" onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        </Box>
      )}

      {/* Error Alert */}
      {error && (
        <Box sx={{ mb: 3 }}>
          <ErrorMessage
            message={error}
            showRetry
            onRetry={loadInstruments}
          />
        </Box>
      )}

      {/* Search and Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Search Bar */}
          <Grid item xs={12} lg={4}>
            <SearchBar
              placeholder="Rechercher par nom d'instrument..."
              onSearch={handleSearch}
              fullWidth
              enableAutocomplete={false}
            />
          </Grid>
          
          {/* Famille Filter */}
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Famille</InputLabel>
              <Select
                value={selectedFamily}
                // @ts-ignore
                onChange={(e) => handleFamilyFilterChange(e.target.value)}
                label="Famille"
              >
                <MenuItem value="">Toutes</MenuItem>
                {familles && familles.length > 0 ? familles.map((famille) => (
                  <MenuItem key={famille.id} value={famille.nomFamille}>
                    {famille.nomFamille}
                  </MenuItem>
                )) : null}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Groupe Ethnique Filter */}
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Groupe Ethnique</InputLabel>
              <Select
                value={selectedGroupeEthnique}
                // @ts-ignore
                onChange={(e) => handleGroupeEthniqueFilterChange(e.target.value)}
                label="Groupe Ethnique"
              >
                <MenuItem value="">Tous</MenuItem>
                {groupesEthniques && groupesEthniques.length > 0 ? groupesEthniques.map((groupe) => (
                  <MenuItem key={groupe.id} value={groupe.nomGroupe}>
                    {groupe.nomGroupe} ({groupe.langue})
                  </MenuItem>
                )) : null}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Artisan Filter */}
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Artisan</InputLabel>
              <Select
                value={selectedArtisan}
                // @ts-ignore
                onChange={(e) => handleArtisanFilterChange(e.target.value)}
                label="Artisan"
              >
                <MenuItem value="">Tous</MenuItem>
                {artisans && artisans.length > 0 ? artisans.map((artisan) => (
                  <MenuItem key={artisan.id} value={artisan.nomArtisan}>
                    {artisan.nomArtisan}
                  </MenuItem>
                )) : null}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Actions */}
          <Grid item xs={12} sm={6} md={8} lg={2}>
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              justifyContent: { xs: 'stretch', lg: 'flex-end' }, 
              alignItems: 'center',
              flexDirection: { xs: 'column', sm: 'row', lg: 'column', xl: 'row' }
            }}>
              <Button
                variant={showAdvancedFilters ? 'contained' : 'outlined'}
                size="small"
                startIcon={<FilterList />}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                // @ts-ignore
                fullWidth={{ xs: true, sm: false, lg: true, xl: false }}
              >
                Filtres avancés
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={handleClearFilters}
                disabled={!searchQuery && !selectedFamily && !selectedGroupeEthnique && !selectedArtisan && !yearFrom && !yearTo}
                // @ts-ignore
                fullWidth={{ xs: true, sm: false, lg: true, xl: false }}
              >
                Effacer
              </Button>
            </Box>
            <Box sx={{ 
              textAlign: { xs: 'center', lg: 'right' }, 
              mt: 1,
              display: { xs: 'none', sm: 'block' }
            }}>
              <Typography variant="h6" color="primary">
                {totalCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                résultat{totalCount > 1 ? 's' : ''}
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        {/* Results counter for mobile */}
        <Box sx={{ 
          display: { xs: 'block', sm: 'none' }, 
          textAlign: 'center',
          mt: 2,
          p: 2,
          backgroundColor: 'grey.50',
          borderRadius: 1
        }}>
          <Typography variant="h6" color="primary">
            {totalCount} résultat{totalCount > 1 ? 's' : ''}
          </Typography>
        </Box>
        
        {/* Advanced Filters */}
        <Collapse in={showAdvancedFilters}>
          <Box sx={{ 
            mt: 2, 
            p: 2, 
            border: 1, 
            borderColor: 'divider', 
            borderRadius: 1,
            backgroundColor: 'grey.50'
          }}>
            <Typography variant="subtitle2" gutterBottom color="primary" sx={{ fontWeight: 600 }}>
              Filtres avancés par année
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Année minimum"
                  type="number"
                  size="small"
                  value={yearFrom}
                  // @ts-ignore
                  onChange={(e) => setYearFrom(e.target.value)}
                  inputProps={{ min: 1, max: new Date().getFullYear() }}
                  placeholder="Ex: 1900"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Année maximum"
                  type="number"
                  size="small"
                  value={yearTo}
                  // @ts-ignore
                  onChange={(e) => setYearTo(e.target.value)}
                  inputProps={{ min: 1, max: new Date().getFullYear() }}
                  placeholder="Ex: 2024"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  variant="contained"
                  onClick={handleApplyFilters}
                  fullWidth
                  size="small"
                >
                  Appliquer les filtres d'année
                </Button>
              </Grid>
            </Grid>
            
            {/* Active filters summary */}
            {(selectedFamily || selectedGroupeEthnique || selectedArtisan || yearFrom || yearTo) && (
              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Filtres actifs :
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedFamily && (
                    <Chip 
                      label={`Famille: ${selectedFamily}`} 
                      size="small" 
                      onDelete={() => handleFamilyFilterChange('')}
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {selectedGroupeEthnique && (
                    <Chip 
                      label={`Groupe: ${selectedGroupeEthnique}`} 
                      size="small" 
                      onDelete={() => handleGroupeEthniqueFilterChange('')}
                      color="secondary"
                      variant="outlined"
                    />
                  )}
                  {selectedArtisan && (
                    <Chip 
                      label={`Artisan: ${selectedArtisan}`} 
                      size="small" 
                      onDelete={() => handleArtisanFilterChange('')}
                      color="info"
                      variant="outlined"
                    />
                  )}
                  {(yearFrom || yearTo) && (
                    <Chip 
                      label={`Années: ${yearFrom || '...'} - ${yearTo || '...'}`} 
                      size="small" 
                      onDelete={() => {
                        setYearFrom('');
                        setYearTo('');
                        setPage(0);
                      }}
                      color="warning"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </Collapse>
      </Paper>

      {/* Bulk Actions Bar */}
      <Collapse in={selectedInstruments.length > 0}>
        <Paper sx={{ p: 2, mb: 2, backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1">
              {selectedInstruments.length} instrument{selectedInstruments.length > 1 ? 's' : ''} sélectionné{selectedInstruments.length > 1 ? 's' : ''}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setSelectedInstruments([])}
                sx={{ color: 'primary.contrastText', borderColor: 'primary.contrastText' }}
              >
                Désélectionner
              </Button>
              <Button
                variant="contained"
                size="small"
                color="error"
                startIcon={<Delete />}
                onClick={handleBulkDelete}
              >
                Supprimer
              </Button>
            </Box>
          </Box>
        </Paper>
      </Collapse>

      {/* Instruments Table */}
      <TableContainer component={Paper} sx={{ 
        boxShadow: 3,
        maxHeight: { xs: '70vh', md: 'none' },
        overflow: 'auto'
      }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 'bold', width: { xs: '40px', md: '48px' } }}>
                <Checkbox
                  checked={instruments.length > 0 && selectedInstruments.length === instruments.length}
                  indeterminate={selectedInstruments.length > 0 && selectedInstruments.length < instruments.length}
                  onChange={handleSelectAll}
                  size="small"
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: { xs: '120px', md: '150px' } }}>Nom</TableCell>
              <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', md: 'table-cell' }, minWidth: '200px' }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: { xs: '80px', md: '120px' } }}>Année</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', minWidth: { xs: '100px', md: '160px' } }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {instruments && instruments.length > 0 ? instruments.map((instrument) => (
              <TableRow key={instrument.id} hover selected={selectedInstruments.includes(instrument.id)}>
                <TableCell>
                  <Checkbox
                    checked={selectedInstruments.includes(instrument.id)}
                    onChange={() => handleSelectInstrument(instrument.id)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: { xs: 'column', md: 'row' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 0.5, md: 0 } }}>
                      <MusicNote sx={{ mr: 1, color: 'primary.main', fontSize: { xs: '1.2rem', md: '1.5rem' } }} />
                      <Typography variant="subtitle2" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                        {instrument.nomInstrument}
                      </Typography>
                    </Box>
                    {/* Show description on mobile below the name */}
                    <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        {instrument.description ? 
                          (instrument.description.length > 50 ? 
                            `${instrument.description.substring(0, 50)}...` : 
                            instrument.description
                          ) : 
                          'Aucune description'
                        }
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                  <Typography variant="body2" color="text.secondary">
                    {instrument.description ? 
                      (instrument.description.length > 100 ? 
                        `${instrument.description.substring(0, 100)}...` : 
                        instrument.description
                      ) : 
                      'Aucune description'
                    }
                  </Typography>
                </TableCell>
                <TableCell>
                  {instrument.anneeCreation ? (
                    <Chip 
                      label={instrument.anneeCreation} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontSize: { xs: '0.75rem', md: '0.8125rem' } }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                      N/A
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    gap: { xs: 0, md: 0.5 },
                    flexWrap: { xs: 'wrap', md: 'nowrap' }
                  }}>
                    <Tooltip title="Voir les détails">
                      <IconButton 
                        onClick={() => handleView(instrument)}
                        size="small"
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Modifier">
                      <IconButton 
                        onClick={() => handleEdit(instrument)}
                        size="small"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Relations" sx={{ display: { xs: 'none', sm: 'block' } }}>
                      <IconButton 
                        onClick={() => handleViewRelations(instrument)}
                        size="small"
                        color="info"
                      >
                        <Timeline fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer">
                      <IconButton 
                        onClick={() => handleDelete(instrument)}
                        size="small"
                        color="error"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <MusicNote sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Aucun instrument trouvé
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Essayez de modifier vos critères de recherche ou de supprimer des filtres.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Lignes par page:"
          // @ts-ignore
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
          }
        />
      </TableContainer>

      {/* Relations Dialog */}
      <Dialog
        open={showRelations}
        onClose={() => setShowRelations(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { minHeight: '600px' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountTree color="primary" />
            <Typography variant="h6">
              Relations - {selectedInstrument?.nomInstrument}
            </Typography>
          </Box>
          <IconButton onClick={() => setShowRelations(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {relationsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <LoadingSpinner message="Chargement des relations..." />
            </Box>
          ) : relations.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <AccountTree sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Aucune relation trouvée
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cet instrument n'a pas encore de relations définies avec d'autres entités.
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Relations sémantiques de cet instrument avec d'autres entités :
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {relations.map((relation, index) => (
                  <Grid item xs={12} key={index}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        '&:hover': { 
                          bgcolor: 'action.hover',
                          boxShadow: 1 
                        }
                      }}
                    >
                      <CardContent sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', color: relation.direction === 'incoming' ? 'success.main' : 'info.main' }}>
                            {relation.direction === 'incoming' ? <ArrowBack /> : <ArrowForward />}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="subtitle1">
                                <strong>{relation.sourceLabel || (relation.direction === 'outgoing' ? selectedInstrument?.nomInstrument : getEntityDisplayName(relation.entity))}</strong>
                              </Typography>
                              <Chip 
                                label={relation.type || 'relation'} 
                                size="small" 
                                color="primary" 
                                sx={{ mx: 1 }}
                              />
                              <Typography variant="subtitle1">
                                <strong>{relation.targetLabel || (relation.direction === 'incoming' ? selectedInstrument?.nomInstrument : getEntityDisplayName(relation.entity))}</strong>
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                              <Chip
                                label={relation.direction === 'incoming' ? 'Entrant' : 'Sortant'}
                                size="small"
                                color={relation.direction === 'incoming' ? 'success' : 'info'}
                                variant="outlined"
                              />
                              {relation.entityLabels && relation.entityLabels.length > 0 && (
                                <Chip
                                  label={relation.entityLabels.join(', ')}
                                  size="small"
                                  color="secondary"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                            {relation.entity && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                ID: {relation.entity.id} | {getEntityDetails(relation.entity)}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 'auto' }}>
            {relations.length} relation{relations.length !== 1 ? 's' : ''} trouvée{relations.length !== 1 ? 's' : ''}
          </Typography>
          <Button onClick={() => setShowRelations(false)} variant="outlined">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog
        open={showDetail}
        onClose={() => setShowDetail(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '400px' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Visibility color="primary" />
            <Typography variant="h6">
              Détails - {selectedInstrument?.nomInstrument}
            </Typography>
          </Box>
          <IconButton onClick={() => setShowDetail(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedInstrument ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedInstrument.nomInstrument}
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>ID:</strong> {selectedInstrument.id}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Année de création:</strong> {selectedInstrument.anneeCreation || 'Non spécifiée'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Description:</strong>
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {selectedInstrument.description || 'Aucune description disponible'}
                  </Typography>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<Timeline />}
                  onClick={() => {
                    setShowDetail(false);
                    setShowRelations(true);
                    loadInstrumentRelations(selectedInstrument.id);
                  }}
                >
                  Voir les relations
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => {
                    setShowDetail(false);
                    handleEdit(selectedInstrument);
                  }}
                >
                  Modifier
                </Button>
              </Box>
            </Box>
          ) : (
            <Typography>Aucun instrument sélectionné</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetail(false)} variant="outlined">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '500px' }
        }}
      >
        <DialogTitle>
          {dialogMode === 'create' && 'Créer un Instrument'}
          {dialogMode === 'edit' && 'Modifier l\'Instrument'}
          {dialogMode === 'view' && 'Détails de l\'Instrument'}
        </DialogTitle>
        
        <DialogContent dividers>
          {dialogMode === 'view' && selectedInstrument ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedInstrument.nomInstrument}
              </Typography>
              <Typography variant="body1" paragraph>
                {selectedInstrument.description || 'Aucune description disponible'}
              </Typography>
              {selectedInstrument.anneeCreation && (
                <Typography variant="body2" color="text.secondary">
                  Année de création: {selectedInstrument.anneeCreation}
                </Typography>
              )}
            </Box>
          ) : (
            <Box component="form" sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nom de l'instrument"
                    value={formData.nomInstrument}
                    // @ts-ignore
                    onChange={(e) => handleFormChange('nomInstrument', e.target.value)}
                    error={!!formErrors.nomInstrument}
                    helperText={formErrors.nomInstrument || 'Nom unique de l\'instrument'}
                    required
                    disabled={dialogMode === 'view'}
                    inputProps={{ maxLength: 100 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={3}
                    value={formData.description}
                    // @ts-ignore
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    error={!!formErrors.description}
                    helperText={formErrors.description || `${formData.description.length}/500 caractères`}
                    disabled={dialogMode === 'view'}
                    inputProps={{ maxLength: 500 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Année de création"
                    type="number"
                    value={formData.anneeCreation}
                    // @ts-ignore
                    onChange={(e) => handleFormChange('anneeCreation', e.target.value)}
                    error={!!formErrors.anneeCreation}
                    helperText={formErrors.anneeCreation || 'Année de création ou de première utilisation (optionnel)'}
                    disabled={dialogMode === 'view'}
                    inputProps={{ min: 1, max: new Date().getFullYear() }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            {dialogMode === 'view' ? 'Fermer' : 'Annuler'}
          </Button>
          {dialogMode !== 'view' && (
            <Button
              onClick={handleFormSubmit}
              variant="contained"
              disabled={formLoading}
            >
              {formLoading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InstrumentsPage;