import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronUp, Leaf, Droplets, Sun, Sprout, AlertCircle, Plus, X, Clock, XCircle, Upload, Camera, Filter, Heart, SortAsc, SortDesc, RotateCcw, Calculator } from 'lucide-react';
import axios, { getImageUrl } from '../config/axios';
import PlantingWizard from '../components/PlantingWizard';
import SpacingCalculator from '../components/SpacingCalculator';
import PersonalizedDates from '../components/PersonalizedDates';
import { useToast } from '../context/ToastContext';

const PlantCatalog = () => {
  const { showToast } = useToast();
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [plantingPlant, setPlantingPlant] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [userZone, setUserZone] = useState(null);
  const [userFrostDates, setUserFrostDates] = useState({ lastFrost: null, firstFrost: null });
  const [importConfirm, setImportConfirm] = useState(false);

  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    sunRequirement: '',
    waterNeeds: '',
    soilPh: '',
    flowerColor: '',
    beeFriendly: false,
    favoritesOnly: false
  });
  const [sortBy, setSortBy] = useState('name'); // name, name_desc, days_to_harvest, date_added
  const [favorites, setFavorites] = useState([]);
  const [calculatorPlant, setCalculatorPlant] = useState(null);

  // Mapowanie kategorii na polski
  const translateCategory = (category) => {
    const translations = {
      'vegetable': 'Warzywa',
      'flower_perennial': 'Byliny',
      'flower_bulb': 'Kwiaty cebulowe',
      'flower_annual': 'Kwiaty jednoroczne',
      'fruit_tree': 'Drzewa owocowe',
      'fruit_bush': 'Krzewy owocowe',
      'herb': 'Zioła',
      'grass': 'Trawy ozdobne',
      'tree_ornamental': 'Drzewa ozdobne',
      'shrub_ornamental': 'Krzewy ozdobne',
      'climber': 'Pnącza',
      'groundcover': 'Rośliny okrywowe',
      'fern': 'Paprocie',
      'succulent': 'Sukulenty'
    };
    return translations[category] || category;
  };

  const fetchPlants = useCallback(async (signal) => {
    try {
      const response = await axios.get('/api/plants', { signal });
      setPlants(response.data);
    } catch (error) {
      if (error.name !== 'CanceledError') {
        console.error('Error fetching plants:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserZone = useCallback(async (signal) => {
    try {
      const response = await axios.get('/api/auth/profile', { signal });
      if (response.data?.hardiness_zone) {
        setUserZone(response.data.hardiness_zone);
      }
      if (response.data?.last_frost_date || response.data?.first_frost_date) {
        setUserFrostDates({
          lastFrost: response.data.last_frost_date,
          firstFrost: response.data.first_frost_date
        });
      }
    } catch (error) {
      // User may not be logged in - ignore
    }
  }, []);

  const fetchFavorites = useCallback(async (signal) => {
    try {
      const response = await axios.get('/api/plants/favorites', { signal });
      setFavorites(response.data.map(f => f.plant_id));
    } catch (error) {
      // User may not be logged in - ignore
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchPlants(controller.signal);
    fetchUserZone(controller.signal);
    fetchFavorites(controller.signal);
    return () => controller.abort();
  }, [fetchPlants, fetchUserZone, fetchFavorites]);

  const toggleFavorite = async (plantId, e) => {
    e.stopPropagation();
    try {
      if (favorites.includes(plantId)) {
        await axios.delete(`/api/plants/${plantId}/favorite`);
        setFavorites(prev => prev.filter(id => id !== plantId));
        showToast('Usunięto z ulubionych', 'success');
      } else {
        await axios.post(`/api/plants/${plantId}/favorite`);
        setFavorites(prev => [...prev, plantId]);
        showToast('Dodano do ulubionych', 'success');
      }
    } catch (error) {
      showToast('Musisz być zalogowany', 'error');
    }
  };

  // Get unique filter values from plants
  const filterOptions = useMemo(() => {
    const sunOptions = new Set();
    const waterOptions = new Set();
    const phOptions = new Set();
    const colorOptions = new Set();

    plants.forEach(plant => {
      if (plant.sun_requirement) sunOptions.add(plant.sun_requirement);
      if (plant.water_needs || plant.watering_needs) waterOptions.add(plant.water_needs || plant.watering_needs);
      if (plant.soil_ph) phOptions.add(plant.soil_ph);
      if (plant.flower_color) {
        plant.flower_color.split(',').forEach(c => colorOptions.add(c.trim()));
      }
    });

    return {
      sun: Array.from(sunOptions).sort(),
      water: Array.from(waterOptions).sort(),
      ph: Array.from(phOptions).sort(),
      colors: Array.from(colorOptions).sort()
    };
  }, [plants]);

  const resetFilters = () => {
    setFilters({
      sunRequirement: '',
      waterNeeds: '',
      soilPh: '',
      flowerColor: '',
      beeFriendly: false,
      favoritesOnly: false
    });
    setSortBy('name');
  };

  const hasActiveFilters = filters.sunRequirement || filters.waterNeeds || filters.soilPh || filters.flowerColor || filters.beeFriendly || filters.favoritesOnly;

  const handleImportDefaults = async () => {
    setImportConfirm(false);
    try {
      setLoading(true);
      const response = await axios.post('/api/plants/import-defaults');
      showToast(response.data.message || 'Import zakończony pomyślnie', 'success');
      const controller = new AbortController();
      fetchPlants(controller.signal);
    } catch (error) {
      showToast(error.response?.data?.error || 'Błąd importu', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter plants
  const filteredPlants = useMemo(() => {
    return plants.filter(plant => {
      // Search term
      const matchesSearch = !searchTerm ||
        plant.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plant.latin_name?.toLowerCase().includes(searchTerm.toLowerCase());

      // Sun requirement
      const matchesSun = !filters.sunRequirement ||
        plant.sun_requirement === filters.sunRequirement;

      // Water needs
      const matchesWater = !filters.waterNeeds ||
        plant.water_needs === filters.waterNeeds ||
        plant.watering_needs === filters.waterNeeds;

      // Soil pH
      const matchesPh = !filters.soilPh ||
        plant.soil_ph === filters.soilPh;

      // Flower color
      const matchesColor = !filters.flowerColor ||
        (plant.flower_color && plant.flower_color.toLowerCase().includes(filters.flowerColor.toLowerCase()));

      // Bee friendly
      const matchesBee = !filters.beeFriendly || plant.is_bee_friendly;

      // Favorites only
      const matchesFavorites = !filters.favoritesOnly || favorites.includes(plant.id);

      return matchesSearch && matchesSun && matchesWater && matchesPh && matchesColor && matchesBee && matchesFavorites;
    });
  }, [plants, searchTerm, filters, favorites]);

  // Sort plants
  const sortedPlants = useMemo(() => {
    const sorted = [...filteredPlants];
    switch (sortBy) {
      case 'name':
        sorted.sort((a, b) => (a.display_name || a.name).localeCompare(b.display_name || b.name, 'pl'));
        break;
      case 'name_desc':
        sorted.sort((a, b) => (b.display_name || b.name).localeCompare(a.display_name || a.name, 'pl'));
        break;
      case 'days_to_harvest':
        sorted.sort((a, b) => (a.days_to_harvest || 999) - (b.days_to_harvest || 999));
        break;
      case 'date_added':
        sorted.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        break;
      default:
        break;
    }
    return sorted;
  }, [filteredPlants, sortBy]);

  // Group plants by category
  const plantsByCategory = sortedPlants.reduce((acc, plant) => {
    const category = translateCategory(plant.category) || 'Inne';
    if (!acc[category]) acc[category] = [];
    acc[category].push(plant);
    return acc;
  }, {});

  // Use plantsByCategory directly (already filtered and sorted)
  const filteredCategories = plantsByCategory;

  const toggleCategory = (category) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Warzywa': '🥕',
      'Byliny': '🌸',
      'Kwiaty cebulowe': '🌷',
      'Kwiaty jednoroczne': '🌼',
      'Drzewa owocowe': '🌳',
      'Krzewy owocowe': '🍇',
      'Zioła': '🌿',
      'Trawy ozdobne': '🌾',
      'Drzewa ozdobne': '🌲',
      'Krzewy ozdobne': '🌺',
      'Pnącza': '🪴',
      'Rośliny okrywowe': '🍀',
      'Paprocie': '☘️',
      'Sukulenty': '🌵'
    };
    return icons[category] || '🌱';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 dark:border-green-400 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Ładowanie katalogu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Katalog Roślin</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Pełna baza wiedzy ogrodniczej - {plants.length} roślin
            {filteredPlants.length !== plants.length && (
              <span className="ml-2 text-green-600 dark:text-green-400">
                (wyświetlono: {filteredPlants.length})
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Dodaj roślinę
          </button>
          <button
            onClick={() => setImportConfirm(true)}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
            title="Importuj domyślną bazę roślin"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Importuj bazę</span>
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Szukaj rośliny... (nazwa polska, łacińska)"
              className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <Leaf className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          </div>

          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 min-w-[160px]"
          >
            <option value="name">A-Z</option>
            <option value="name_desc">Z-A</option>
            <option value="days_to_harvest">Dni do zbioru</option>
            <option value="date_added">Ostatnio dodane</option>
          </select>

          {/* Filter toggle button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-xl flex items-center gap-2 font-medium transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-green-600 text-white'
                : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Filter className="w-5 h-5" />
            <span className="hidden sm:inline">Filtry</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-white rounded-full" />
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Zaawansowane filtry
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
                >
                  <RotateCcw className="w-4 h-4" />
                  Wyczyść filtry
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Sun requirement */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  <Sun className="w-3 h-3 inline mr-1" />
                  Światło
                </label>
                <select
                  value={filters.sunRequirement}
                  onChange={(e) => setFilters(prev => ({ ...prev, sunRequirement: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Wszystkie</option>
                  {filterOptions.sun.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Water needs */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  <Droplets className="w-3 h-3 inline mr-1" />
                  Woda
                </label>
                <select
                  value={filters.waterNeeds}
                  onChange={(e) => setFilters(prev => ({ ...prev, waterNeeds: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Wszystkie</option>
                  {filterOptions.water.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Soil pH */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  🧪 pH gleby
                </label>
                <select
                  value={filters.soilPh}
                  onChange={(e) => setFilters(prev => ({ ...prev, soilPh: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Wszystkie</option>
                  {filterOptions.ph.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Flower color */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  🌸 Kolor kwiatów
                </label>
                <select
                  value={filters.flowerColor}
                  onChange={(e) => setFilters(prev => ({ ...prev, flowerColor: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Wszystkie</option>
                  {filterOptions.colors.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Bee friendly checkbox */}
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={filters.beeFriendly}
                    onChange={(e) => setFilters(prev => ({ ...prev, beeFriendly: e.target.checked }))}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    🐝 Miododajne
                  </span>
                </label>
              </div>

              {/* Favorites only checkbox */}
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={filters.favoritesOnly}
                    onChange={(e) => setFilters(prev => ({ ...prev, favoritesOnly: e.target.checked }))}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    <Heart className="w-3 h-3 inline mr-1 text-red-500" />
                    Ulubione
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Categories Accordion */}
      <div className="space-y-3">
        {Object.keys(filteredCategories).length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Nie znaleziono roślin pasujących do wyszukiwania
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
              >
                Wyczyść wyszukiwanie
              </button>
            )}
          </div>
        ) : (
          Object.entries(filteredCategories)
            .sort(([a], [b]) => {
              const order = [
                'Warzywa', 'Byliny', 'Kwiaty cebulowe', 'Kwiaty jednoroczne',
                'Drzewa owocowe', 'Krzewy owocowe', 'Zioła', 'Trawy ozdobne',
                'Drzewa ozdobne', 'Krzewy ozdobne', 'Pnącza', 'Rośliny okrywowe',
                'Paprocie', 'Sukulenty'
              ];
              const indexA = order.indexOf(a);
              const indexB = order.indexOf(b);
              // Nieznane kategorie na końcu
              if (indexA === -1 && indexB === -1) return a.localeCompare(b);
              if (indexA === -1) return 1;
              if (indexB === -1) return -1;
              return indexA - indexB;
            })
            .map(([category, categoryPlants]) => (
              <div
                key={category}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
              >
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCategoryIcon(category)}</span>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {category}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {categoryPlants.length} {categoryPlants.length === 1 ? 'roślina' : (categoryPlants.length >= 2 && categoryPlants.length <= 4) ? 'rośliny' : 'roślin'}
                      </p>
                    </div>
                  </div>
                  {expandedCategories.includes(category) ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Category Content */}
                {(expandedCategories.includes(category) || searchTerm.length > 0) && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                      {categoryPlants.map((plant) => (
                        <PlantCard
                          key={plant.id}
                          plant={plant}
                          onClick={() => setSelectedPlant(plant)}
                          isFavorite={favorites.includes(plant.id)}
                          onToggleFavorite={toggleFavorite}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
        )}
      </div>

      {/* Plant Detail Modal */}
      {selectedPlant && (
        <PlantDetailModal
          plant={selectedPlant}
          userZone={userZone}
          userFrostDates={userFrostDates}
          onClose={() => setSelectedPlant(null)}
          onPlant={(plant) => {
            setPlantingPlant(plant);
            setSelectedPlant(null);
          }}
          onCalculateSpacing={(plant) => {
            setCalculatorPlant(plant);
          }}
        />
      )}

      {/* Planting Wizard */}
      {plantingPlant && (
        <PlantingWizard
          plant={plantingPlant}
          onClose={() => setPlantingPlant(null)}
        />
      )}

      {/* Spacing Calculator */}
      {calculatorPlant && (
        <SpacingCalculator
          plant={calculatorPlant}
          onClose={() => setCalculatorPlant(null)}
        />
      )}

      {/* Add Plant Modal */}
      {showAddModal && (
        <AddPlantModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            const controller = new AbortController();
            fetchPlants(controller.signal);
          }}
        />
      )}

      {/* Import Confirmation Modal */}
      {importConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📥</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Importuj bazę roślin?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                To doda ~80 roślin z pełnymi informacjami o uprawie, nawożeniu i pielęgnacji.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setImportConfirm(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleImportDefaults}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Importuj
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Plant Card Component
const PlantCard = ({ plant, onClick, isFavorite, onToggleFavorite }) => {
  // Validate days_to_harvest - show only if it's a meaningful positive number
  const hasValidHarvest = plant.days_to_harvest &&
    plant.days_to_harvest > 0 &&
    String(plant.days_to_harvest) !== '00';

  const isPending = plant.status === 'pending';
  const isRejected = plant.status === 'rejected';

  return (
    <div
      onClick={onClick}
      className={`p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left w-full min-w-0 relative cursor-pointer ${
        isPending ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''
      } ${isRejected ? 'ring-2 ring-red-400 ring-opacity-50' : ''}`}
    >
      {/* Favorite Button */}
      <button
        onClick={(e) => onToggleFavorite(plant.id, e)}
        className={`absolute top-2 right-2 p-1.5 rounded-full transition-all z-10 ${
          isFavorite
            ? 'text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/30'
            : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30'
        }`}
        title={isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
      >
        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
      </button>

      {/* Status Badge */}
      {isPending && (
        <div className="absolute -top-2 left-2 px-2 py-0.5 bg-yellow-500 text-white text-xs font-semibold rounded-full flex items-center gap-1 shadow-sm">
          <Clock className="w-3 h-3" />
          Oczekuje
        </div>
      )}
      {isRejected && (
        <div className="absolute -top-2 left-2 px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center gap-1 shadow-sm">
          <XCircle className="w-3 h-3" />
          Odrzucono
        </div>
      )}

      <div className="flex items-start gap-3 mb-2 min-w-0 pr-8">
        {plant.photo_thumb && (
          <img
            src={getImageUrl(plant.photo_thumb)}
            alt=""
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug break-words">
            {plant.display_name || plant.name}
          </h4>
          {plant.latin_name && (
            <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1 truncate">
              {plant.latin_name}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 mt-2">
        {hasValidHarvest && (
          <span className="flex items-center gap-1 whitespace-nowrap">
            <Sprout className="w-3 h-3 flex-shrink-0" />
            {plant.days_to_harvest}d
          </span>
        )}
        {plant.is_bee_friendly && (
          <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded text-xs">
            🐝
          </span>
        )}
        {plant.flower_color && (
          <span className="px-1.5 py-0.5 bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200 rounded text-xs truncate max-w-[80px]" title={plant.flower_color}>
            {plant.flower_color.split(',')[0]}
          </span>
        )}
      </div>
    </div>
  );
};

// Helper function to check zone compatibility
const checkZoneCompatibility = (plantZone, userZone) => {
  if (!plantZone || !userZone) return null;

  // Parse zone numbers (e.g., "6a" -> 6, "7b" -> 7)
  const parseZone = (zone) => {
    const match = zone.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  };

  const plantZoneNum = parseZone(plantZone);
  const userZoneNum = parseZone(userZone);

  if (!plantZoneNum || !userZoneNum) return null;

  // Plant zone indicates minimum cold tolerance
  // If user's zone number >= plant's zone number, plant should survive
  if (userZoneNum >= plantZoneNum) {
    return { compatible: true, message: 'Odpowiednia dla Twojej strefy' };
  } else {
    return { compatible: false, message: 'Może wymagać ochrony zimowej' };
  }
};

// Accordion Section Component for collapsible sections
const AccordionSection = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="font-semibold text-gray-900 dark:text-white text-sm">
          {title}
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 py-3 bg-white dark:bg-gray-800">
          {children}
        </div>
      )}
    </div>
  );
};

// Plant Detail Modal Component
const PlantDetailModal = ({ plant, onClose, onPlant, onCalculateSpacing, userZone, userFrostDates }) => {
  const zoneCompatibility = checkZoneCompatibility(plant.hardiness_zone, userZone);

  // Check which sections have content
  const hasFlowerInfo = plant.flower_color || plant.bloom_season || plant.is_fragrant || plant.is_bee_friendly || plant.is_perennial;
  const hasUses = plant.uses;
  const hasFertilization = plant.fertilization_needs || plant.npk_needs || plant.npk || plant.npk_ratio_recommended || plant.fertilization_frequency || plant.organic_fertilizer || plant.mineral_fertilizer;
  const hasCompanion = plant.companion_plants || plant.avoid_plants;
  const hasCare = plant.pruning_needs || plant.winter_care || plant.propagation_method;
  const hasCareNotes = plant.care_notes;
  const hasNotes = plant.notes;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 pb-24 lg:pb-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-full overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">
                {plant.display_name || plant.name}
              </h2>
              {plant.latin_name && (
                <p className="text-green-100 italic">
                  {plant.latin_name}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Zamknij"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Status Alerts */}
          {plant.status === 'pending' && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-800 dark:text-yellow-200">Oczekuje na moderację</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Ta roślina została dodana przez Ciebie i czeka na zatwierdzenie przez administratora.
                  </p>
                </div>
              </div>
            </div>
          )}

          {plant.status === 'rejected' && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800 dark:text-red-200">Roślina odrzucona</p>
                  {plant.rejection_reason && (
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      <strong>Powód:</strong> {plant.rejection_reason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Plant Images */}
          <PlantImages plant={plant} />

          {/* Basic Info - Always visible, compact grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {plant.days_to_harvest && plant.days_to_harvest > 0 && String(plant.days_to_harvest) !== '00' && (
              <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                <Sprout className="w-4 h-4 mx-auto text-gray-500 mb-1" />
                <p className="text-xs text-gray-500 dark:text-gray-400">Zbiór</p>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{plant.days_to_harvest}d</p>
              </div>
            )}
            {plant.sun_requirement && (
              <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                <Sun className="w-4 h-4 mx-auto text-yellow-500 mb-1" />
                <p className="text-xs text-gray-500 dark:text-gray-400">Słońce</p>
                <p className="font-semibold text-gray-900 dark:text-white text-xs">{plant.sun_requirement}</p>
              </div>
            )}
            {(plant.water_needs || plant.watering_needs) && (
              <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                <Droplets className="w-4 h-4 mx-auto text-blue-500 mb-1" />
                <p className="text-xs text-gray-500 dark:text-gray-400">Woda</p>
                <p className="font-semibold text-gray-900 dark:text-white text-xs">{plant.water_needs || plant.watering_needs}</p>
              </div>
            )}
            {plant.height && (
              <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                <span className="text-sm">📏</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">Wys.</p>
                <p className="font-semibold text-gray-900 dark:text-white text-xs">{plant.height}</p>
              </div>
            )}
            {plant.spacing && (
              <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                <span className="text-sm">↔️</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">Rozstaw</p>
                <p className="font-semibold text-gray-900 dark:text-white text-xs">{plant.spacing}</p>
              </div>
            )}
            {plant.hardiness_zone && (
              <div className={`p-2 rounded-lg text-center ${
                zoneCompatibility?.compatible === true
                  ? 'bg-green-50 dark:bg-green-900/20'
                  : zoneCompatibility?.compatible === false
                  ? 'bg-orange-50 dark:bg-orange-900/20'
                  : 'bg-gray-50 dark:bg-gray-700/50'
              }`}>
                <span className="text-sm">❄️</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">USDA</p>
                <p className="font-semibold text-gray-900 dark:text-white text-xs">{plant.hardiness_zone}</p>
              </div>
            )}
            {plant.is_bee_friendly && (
              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center">
                <span className="text-lg">🐝</span>
                <p className="text-xs text-amber-700 dark:text-amber-300">Miododajna</p>
              </div>
            )}
          </div>

          {/* Personalized Planting Dates */}
          <PersonalizedDates
            plant={plant}
            lastFrostDate={userFrostDates?.lastFrost}
            firstFrostDate={userFrostDates?.firstFrost}
          />

          {/* Collapsible Sections */}
          <div className="space-y-2">
            {/* Flower Info */}
            {hasFlowerInfo && (
              <AccordionSection title="🌸 Informacje o kwiatach" defaultOpen={true}>
                <div className="flex flex-wrap gap-2">
                  {plant.flower_color && (
                    <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded">
                      <span className="text-xs font-semibold text-pink-900 dark:text-pink-100 block">Kolor</span>
                      <span className="text-sm text-pink-800 dark:text-pink-200">{plant.flower_color}</span>
                    </div>
                  )}
                  {plant.bloom_season && (
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                      <span className="text-xs font-semibold text-purple-900 dark:text-purple-100 block">Kwitnienie</span>
                      <span className="text-sm text-purple-800 dark:text-purple-200">{plant.bloom_season}</span>
                    </div>
                  )}
                  {plant.is_perennial && (
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                      <span className="text-sm text-green-800 dark:text-green-200">🌿 Bylina</span>
                    </div>
                  )}
                  {plant.is_fragrant && (
                    <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                      <span className="text-sm text-yellow-800 dark:text-yellow-200">🌺 Zapachowa</span>
                    </div>
                  )}
                </div>
              </AccordionSection>
            )}

            {/* Uses */}
            {hasUses && (
              <AccordionSection title="🍴 Zastosowanie">
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    let usesArray = [];
                    if (typeof plant.uses === 'string') {
                      const cleanedUses = plant.uses.trim();
                      if (cleanedUses.startsWith('[')) {
                        try {
                          usesArray = JSON.parse(cleanedUses);
                        } catch {
                          usesArray = cleanedUses.replace(/[[\]"]/g, '').split(',');
                        }
                      } else {
                        usesArray = cleanedUses.split(',');
                      }
                    } else if (Array.isArray(plant.uses)) {
                      usesArray = plant.uses;
                    }
                    return usesArray
                      .map(use => (typeof use === 'string' ? use.trim() : use))
                      .filter(use => use && use.length > 0)
                      .map((use, idx) => (
                        <span key={idx} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                          {use}
                        </span>
                      ));
                  })()}
                </div>
              </AccordionSection>
            )}

            {/* Growing conditions */}
            {(plant.soil_ph || plant.soil_type || plant.soil_preference || plant.planting_depth || plant.origin) && (
              <AccordionSection title="🌍 Warunki uprawy">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {plant.soil_ph && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">pH gleby:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">{plant.soil_ph}</span>
                    </div>
                  )}
                  {(plant.soil_type || plant.soil_preference) && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Gleba:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">{plant.soil_type || plant.soil_preference}</span>
                    </div>
                  )}
                  {plant.planting_depth && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Głębokość:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">{plant.planting_depth}</span>
                    </div>
                  )}
                  {plant.origin && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Pochodzenie:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">{plant.origin}</span>
                    </div>
                  )}
                </div>
              </AccordionSection>
            )}

            {/* Fertilization */}
            {hasFertilization && (
              <AccordionSection title="🌱 Nawożenie">
                <div className="space-y-2 text-sm">
                  {(plant.fertilization_needs || plant.npk_needs) && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400">Potrzeby:</span>
                      <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded text-xs">
                        {plant.fertilization_needs || plant.npk_needs}
                      </span>
                    </div>
                  )}
                  {(plant.npk || plant.npk_ratio_recommended) && (
                    <p><span className="text-gray-500 dark:text-gray-400">NPK:</span> <span className="font-medium text-gray-900 dark:text-white">{plant.npk || plant.npk_ratio_recommended}</span></p>
                  )}
                  {plant.fertilization_frequency && (
                    <p><span className="text-gray-500 dark:text-gray-400">Częstość:</span> <span className="font-medium text-gray-900 dark:text-white">{plant.fertilization_frequency}</span></p>
                  )}
                  {plant.organic_fertilizer && (
                    <p className="text-green-700 dark:text-green-300">💚 {plant.organic_fertilizer}</p>
                  )}
                  {plant.mineral_fertilizer && (
                    <p className="text-blue-700 dark:text-blue-300">⚗️ {plant.mineral_fertilizer}</p>
                  )}
                </div>
              </AccordionSection>
            )}

            {/* Companion Planting */}
            {hasCompanion && (
              <AccordionSection title="🌿 Sąsiedztwo">
                <div className="space-y-2 text-sm">
                  {plant.companion_plants && (
                    <p><span className="text-green-600 dark:text-green-400">✅ Dobre:</span> <span className="text-gray-700 dark:text-gray-300">{plant.companion_plants}</span></p>
                  )}
                  {plant.avoid_plants && (
                    <p><span className="text-red-600 dark:text-red-400">❌ Złe:</span> <span className="text-gray-700 dark:text-gray-300">{plant.avoid_plants}</span></p>
                  )}
                </div>
              </AccordionSection>
            )}

            {/* Care Instructions */}
            {hasCare && (
              <AccordionSection title="🛠️ Pielęgnacja">
                <div className="space-y-2 text-sm">
                  {plant.pruning_needs && (
                    <p><span className="text-gray-500 dark:text-gray-400">Przycinanie:</span> <span className="text-gray-700 dark:text-gray-300">{plant.pruning_needs}</span></p>
                  )}
                  {plant.winter_care && (
                    <p><span className="text-gray-500 dark:text-gray-400">Zimowanie:</span> <span className="text-gray-700 dark:text-gray-300">{plant.winter_care}</span></p>
                  )}
                  {plant.propagation_method && (
                    <p><span className="text-gray-500 dark:text-gray-400">Rozmnażanie:</span> <span className="text-gray-700 dark:text-gray-300">{plant.propagation_method}</span></p>
                  )}
                </div>
              </AccordionSection>
            )}

            {/* Care Notes */}
            {hasCareNotes && (
              <AccordionSection title="📖 Szczegóły hodowli">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {plant.care_notes}
                </p>
              </AccordionSection>
            )}

            {/* Notes */}
            {hasNotes && (
              <AccordionSection title="💡 Wskazówki">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {plant.notes}
                </p>
              </AccordionSection>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900 rounded-b-2xl">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Zamknij
            </button>
            {plant.spacing && (
              <button
                onClick={() => onCalculateSpacing(plant)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                title="Oblicz ile roślin zmieści się na grządce"
              >
                <Calculator className="w-4 h-4" />
                <span className="hidden sm:inline">Kalkulator</span>
              </button>
            )}
            <button
              onClick={() => onPlant(plant)}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <Sprout className="w-4 h-4" />
              Posadź
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const InfoBox = ({ icon, label, value, sublabel }) => (
  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg min-w-0">
    <div className="flex items-center gap-2 mb-1">
      {typeof icon === 'string' ? <span className="flex-shrink-0">{icon}</span> : <span className="text-gray-600 dark:text-gray-400 flex-shrink-0">{icon}</span>}
      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</span>
    </div>
    <p className="font-semibold text-gray-900 dark:text-white text-sm break-words leading-snug">
      {value}
    </p>
    {sublabel && (
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 break-words">
        {sublabel}
      </p>
    )}
  </div>
);

const Section = ({ title, children, icon }) => (
  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
      {title}
    </h3>
    <div>{children}</div>
  </div>
);

// Plant Images Component - displays photo and/or illustration with attribution
const PlantImages = ({ plant }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL || '';

  const images = [];
  if (plant.photo_path) {
    images.push({
      type: 'photo',
      label: 'Zdjęcie',
      path: plant.photo_path,
      thumb: plant.photo_thumb,
      author: plant.photo_author,
      source: plant.photo_source,
      license: plant.photo_license,
      sourceUrl: plant.photo_source_url
    });
  }
  if (plant.illustration_path) {
    images.push({
      type: 'illustration',
      label: 'Ilustracja botaniczna',
      path: plant.illustration_path,
      thumb: plant.illustration_thumb,
      author: plant.illustration_author,
      source: plant.illustration_source,
      license: plant.illustration_license,
      sourceUrl: plant.illustration_source_url
    });
  }

  if (images.length === 0) return null;

  return (
    <>
      <div className={'grid gap-4 ' + (images.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
        {images.map((img) => (
          <div key={img.type} className="relative group">
            <button
              onClick={() => setSelectedImage(img)}
              className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 hover:ring-2 ring-green-500 transition-all"
            >
              <img
                src={getImageUrl(img.thumb || img.path)}
                alt={plant.display_name + ' - ' + img.label}
                className="w-full h-full object-cover"
              />
            </button>
            <div className="absolute bottom-2 left-2 right-2 text-xs text-white bg-black/60 rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="font-medium">{img.label}</span>
              {img.author && <span className="ml-1">• {img.author}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <img
              src={getImageUrl(selectedImage.path)}
              alt={plant.display_name + ' - ' + selectedImage.label}
              className="w-full max-h-[80vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white"
              aria-label="Zamknij"
            >
              <X className="w-5 h-5" />
            </button>
            {/* Attribution */}
            <div className="mt-3 text-center text-white/80 text-sm">
              <p className="font-medium">{selectedImage.label}</p>
              {selectedImage.author && <p>Autor: {selectedImage.author}</p>}
              {selectedImage.source && <p>Źródło: {selectedImage.source}</p>}
              {selectedImage.license && <p>Licencja: {selectedImage.license}</p>}
              {selectedImage.sourceUrl && (
                <a
                  href={selectedImage.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 hover:text-green-300 underline"
                >
                  Zobacz oryginał
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Add Plant Modal Component
const AddPlantModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    latin_name: '',
    category: 'vegetable',
    days_to_harvest: '',
    notes: '',
    sun_requirement: '',
    water_needs: '',
    soil_type: '',
    height: '',
    spacing: '',
    npk_needs: '',
    fertilization_frequency: '',
    // Flower specific
    flower_color: '',
    bloom_season: '',
    is_perennial: false,
    is_fragrant: false,
    is_bee_friendly: false,
    // Photo info
    photo_author: '',
    photo_license: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Dozwolone są tylko pliki JPEG, PNG i WebP');
        return;
      }
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Plik jest za duży. Maksymalny rozmiar to 10MB');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormData(prev => ({ ...prev, photo_author: '', photo_license: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    // Validate photo_author if photo is uploaded
    if (photoFile && !formData.photo_author.trim()) {
      setError('Autor zdjęcia jest wymagany gdy dodajesz zdjęcie');
      setLoading(false);
      return;
    }

    try {
      // Use FormData for file upload
      const submitData = new FormData();

      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== false) {
          submitData.append(key, value);
        }
      });

      // Set name based on display_name
      submitData.set('name', formData.display_name.toLowerCase().replace(/\s+/g, '_'));

      // Convert days_to_harvest to number
      if (formData.days_to_harvest) {
        submitData.set('days_to_harvest', parseInt(formData.days_to_harvest) || 0);
      } else {
        submitData.set('days_to_harvest', 0);
      }

      // Add photo if selected
      if (photoFile) {
        submitData.append('photo', photoFile);
      }

      const response = await axios.post('/api/plants', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccessMessage(response.data.message);

      // Auto close after showing success message
      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (err) {
      console.error('Error adding plant:', err);
      setError(err.response?.data?.error || 'Błąd podczas dodawania rośliny');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'vegetable', label: '🥕 Warzywo', needsHarvest: true },
    { value: 'flower_perennial', label: '🌸 Bylina', needsHarvest: false },
    { value: 'flower_bulb', label: '🌷 Kwiat cebulowy', needsHarvest: false },
    { value: 'flower_annual', label: '🌼 Kwiat jednoroczny', needsHarvest: false },
    { value: 'fruit_tree', label: '🌳 Drzewo owocowe', needsHarvest: false },
    { value: 'fruit_bush', label: '🍇 Krzew owocowy', needsHarvest: false },
    { value: 'herb', label: '🌿 Zioło', needsHarvest: true },
    { value: 'grass', label: '🌾 Trawa ozdobna', needsHarvest: false },
    { value: 'tree_ornamental', label: '🌲 Drzewo ozdobne', needsHarvest: false },
    { value: 'shrub_ornamental', label: '🌺 Krzew ozdobny', needsHarvest: false },
    { value: 'climber', label: '🪴 Pnącze', needsHarvest: false },
    { value: 'groundcover', label: '🍀 Roślina okrywowa', needsHarvest: false },
    { value: 'fern', label: '☘️ Paproć', needsHarvest: false },
    { value: 'succulent', label: '🌵 Sukulent', needsHarvest: false }
  ];

  const selectedCategory = categories.find(c => c.value === formData.category);
  const isFlower = formData.category.startsWith('flower_');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 pb-24 lg:pb-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-full overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">Dodaj własną roślinę</h2>
              <p className="text-green-100 mt-1">Stwórz własny wpis w katalogu</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Zamknij"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {successMessage && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 dark:text-green-300 text-lg">✓</span>
                </div>
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-200">Sukces!</p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Podstawowe informacje</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nazwa rośliny *
              </label>
              <input
                type="text"
                name="display_name"
                value={formData.display_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                placeholder="np. Pomidor malinowy"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nazwa łacińska
              </label>
              <input
                type="text"
                name="latin_name"
                value={formData.latin_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                placeholder="np. Solanum lycopersicum"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Kategoria *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {selectedCategory?.needsHarvest && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Dni do zbioru
                </label>
                <input
                  type="number"
                  name="days_to_harvest"
                  value={formData.days_to_harvest}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  placeholder="np. 75"
                />
              </div>
            )}
          </div>

          {/* Growing Conditions */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Warunki uprawy</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Wymagania świetlne
                </label>
                <select
                  name="sun_requirement"
                  value={formData.sun_requirement}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Wybierz...</option>
                  <option value="pełne słońce">Pełne słońce</option>
                  <option value="częściowe słońce">Częściowe słońce</option>
                  <option value="półcień">Półcień</option>
                  <option value="cień">Cień</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Potrzeby wodne
                </label>
                <select
                  name="water_needs"
                  value={formData.water_needs}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Wybierz...</option>
                  <option value="niskie">Niskie</option>
                  <option value="średnie">Średnie</option>
                  <option value="wysokie">Wysokie</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Typ gleby
              </label>
              <input
                type="text"
                name="soil_type"
                value={formData.soil_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                placeholder="np. próchnicza, przepuszczalna"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Wysokość
                </label>
                <input
                  type="text"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  placeholder="np. 120-150 cm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rozstaw
                </label>
                <input
                  type="text"
                  name="spacing"
                  value={formData.spacing}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  placeholder="np. 50x60 cm"
                />
              </div>
            </div>
          </div>

          {/* Fertilization */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Nawożenie</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Potrzeby pokarmowe
                </label>
                <select
                  name="npk_needs"
                  value={formData.npk_needs}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Wybierz...</option>
                  <option value="niskie">Niskie</option>
                  <option value="średnie">Średnie</option>
                  <option value="wysokie">Wysokie</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Częstość nawożenia
                </label>
                <input
                  type="text"
                  name="fertilization_frequency"
                  value={formData.fertilization_frequency}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  placeholder="np. co 2 tygodnie"
                />
              </div>
            </div>
          </div>

          {/* Flower specific fields */}
          {isFlower && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Informacje o kwiatach</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kolor kwiatu
                  </label>
                  <input
                    type="text"
                    name="flower_color"
                    value={formData.flower_color}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                    placeholder="np. różowy, biały"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sezon kwitnienia
                  </label>
                  <input
                    type="text"
                    name="bloom_season"
                    value={formData.bloom_season}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                    placeholder="np. maj-lipiec"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_perennial"
                    checked={formData.is_perennial}
                    onChange={handleChange}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Bylina wieloletnia</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_fragrant"
                    checked={formData.is_fragrant}
                    onChange={handleChange}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Aromatyczna</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_bee_friendly"
                    checked={formData.is_bee_friendly}
                    onChange={handleChange}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Przyjazna pszczołom</span>
                </label>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Uwagi i porady
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              placeholder="Dodatkowe informacje o uprawie..."
            />
          </div>

          {/* Photo Upload */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Zdjęcie rośliny (opcjonalne)
            </h3>

            {!photoPreview ? (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-green-500 transition-colors bg-gray-50 dark:bg-gray-700/50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Kliknij aby dodać zdjęcie</span>
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    JPEG, PNG lub WebP (max 10MB)
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                />
              </label>
            ) : (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Podgląd"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Photo author field - required when photo is uploaded */}
            {photoPreview && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Autor zdjęcia *
                  </label>
                  <input
                    type="text"
                    name="photo_author"
                    value={formData.photo_author}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                    placeholder="np. Jan Kowalski lub własne"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Wymagane dla praw autorskich
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Licencja / źródło
                  </label>
                  <input
                    type="text"
                    name="photo_license"
                    value={formData.photo_license}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                    placeholder="np. CC BY-SA 4.0, własne"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Moderation Info */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-800 dark:text-blue-200">Moderacja roślin</p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Dodana roślina zostanie wysłana do moderacji. Po zatwierdzeniu przez administratora
                  będzie widoczna dla wszystkich użytkowników w katalogu.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Zapisywanie...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Dodaj roślinę
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlantCatalog;
