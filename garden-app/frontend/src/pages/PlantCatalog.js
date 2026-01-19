import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Leaf, Droplets, Sun, Sprout, AlertCircle, Plus } from 'lucide-react';
import axios from '../config/axios';
import PlantingWizard from '../components/PlantingWizard';

const PlantCatalog = () => {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState(['Warzywa']);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [plantingPlant, setPlantingPlant] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Mapowanie kategorii na polski
  const translateCategory = (category) => {
    const translations = {
      'vegetable': 'Warzywa',
      'flower_perennial': 'Byliny',
      'flower_bulb': 'Kwiaty cebulowe',
      'flower_annual': 'Kwiaty jednoroczne',
      'fruit_tree': 'Drzewa owocowe',
      'fruit_bush': 'Krzewy owocowe',
      'herb': 'Zioła'
    };
    return translations[category] || category;
  };

  useEffect(() => {
    fetchPlants();
  }, []);

  const fetchPlants = async () => {
    try {
      const response = await axios.get('/api/plants');
      setPlants(response.data);
    } catch (error) {
      console.error('Error fetching plants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportDefaults = async () => {
    if (!window.confirm('Zaimportować rozszerzoną bazę roślin? To doda ~80 roślin z pełnymi informacjami.')) return;
    try {
      setLoading(true);
      const response = await axios.post('/api/plants/import-defaults');
      alert(response.data.message);
      fetchPlants();
    } catch (error) {
      alert(error.response?.data?.error || 'Błąd importu');
    } finally {
      setLoading(false);
    }
  };

  // Group plants by category
  const plantsByCategory = plants.reduce((acc, plant) => {
    const category = translateCategory(plant.category) || 'Inne';
    if (!acc[category]) acc[category] = [];
    acc[category].push(plant);
    return acc;
  }, {});

  // Filter by search term
  const filteredCategories = Object.entries(plantsByCategory).reduce((acc, [category, categoryPlants]) => {
    const filtered = categoryPlants.filter(plant =>
      plant.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plant.latin_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {});

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
      'Zioła': '🌿'
    };
    return icons[category] || '🌱';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
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
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Dodaj roślinę
          </button>
          {plants.length < 20 && (
            <button
              onClick={handleImportDefaults}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              📥 Importuj bazę
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Szukaj rośliny... (nazwa polska, łacińska)"
          className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <Leaf className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
      </div>

      {/* Categories Accordion */}
      <div className="space-y-3">
        {Object.keys(filteredCategories).length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Nie znaleziono roślin pasujących do wyszukiwania
          </div>
        ) : (
          Object.entries(filteredCategories)
            .sort(([a], [b]) => {
              const order = ['Warzywa', 'Byliny', 'Kwiaty cebulowe', 'Kwiaty jednoroczne', 'Drzewa owocowe', 'Krzewy owocowe', 'Zioła'];
              return order.indexOf(a) - order.indexOf(b);
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
                        {categoryPlants.length} {categoryPlants.length === 1 ? 'roślina' : 'roślin'}
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
                {expandedCategories.includes(category) && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                      {categoryPlants.map((plant) => (
                        <PlantCard
                          key={plant.id}
                          plant={plant}
                          onClick={() => setSelectedPlant(plant)}
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
          onClose={() => setSelectedPlant(null)}
          onPlant={(plant) => {
            setPlantingPlant(plant);
            setSelectedPlant(null);
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

      {/* Add Plant Modal */}
      {showAddModal && (
        <AddPlantModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchPlants();
          }}
        />
      )}
    </div>
  );
};

// Plant Card Component
const PlantCard = ({ plant, onClick }) => {
  // Validate days_to_harvest - show only if it's a meaningful positive number
  const hasValidHarvest = plant.days_to_harvest &&
    plant.days_to_harvest > 0 &&
    String(plant.days_to_harvest) !== '00';

  return (
    <button
      onClick={onClick}
      className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left w-full min-w-0"
    >
      <div className="flex items-start justify-between mb-2 min-w-0">
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
        {plant.category && (
          <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded text-xs whitespace-nowrap">
            {plant.category === 'flower_perennial' && '🌸'}
            {plant.category === 'flower_annual' && '🌼'}
            {plant.category === 'flower_bulb' && '🌷'}
            {plant.category === 'fruit_tree' && '🌳'}
            {plant.category === 'fruit_bush' && '🍇'}
            {plant.category === 'herb' && '🌿'}
            {plant.category === 'vegetable' && '🥕'}
          </span>
        )}
        {plant.flower_color && (
          <span className="px-1.5 py-0.5 bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200 rounded text-xs truncate max-w-[80px]" title={plant.flower_color}>
            {plant.flower_color.split(',')[0]}
          </span>
        )}
      </div>
    </button>
  );
};

// Plant Detail Modal Component
const PlantDetailModal = ({ plant, onClose, onPlant }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 pb-24 lg:pb-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-full overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-2xl">
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
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info - Extended */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {plant.days_to_harvest && plant.days_to_harvest > 0 && String(plant.days_to_harvest) !== '00' && (
              <InfoBox
                icon={<Sprout className="w-5 h-5" />}
                label="Dni do zbioru"
                value={`${plant.days_to_harvest} dni`}
                sublabel={plant.range_min && plant.range_max ? `(${plant.range_min}-${plant.range_max})` : null}
              />
            )}
            {plant.sun_requirement && (
              <InfoBox
                icon={<Sun className="w-5 h-5" />}
                label="Światło"
                value={plant.sun_requirement}
              />
            )}
            {(plant.water_needs || plant.watering_needs) && (
              <InfoBox
                icon={<Droplets className="w-5 h-5" />}
                label="Potrzeby wodne"
                value={plant.water_needs || plant.watering_needs}
              />
            )}
            {plant.soil_ph && (
              <InfoBox
                icon="🧪"
                label="pH gleby"
                value={plant.soil_ph}
              />
            )}
            {(plant.soil_type || plant.soil_preference) && (
              <InfoBox
                icon="🌍"
                label="Gleba"
                value={plant.soil_type || plant.soil_preference}
              />
            )}
            {plant.height && (
              <InfoBox
                icon="📏"
                label="Wysokość"
                value={plant.height}
              />
            )}
            {plant.planting_depth && (
              <InfoBox
                icon="🌱"
                label="Głębokość sadzenia"
                value={plant.planting_depth}
              />
            )}
            {plant.spacing && (
              <InfoBox
                icon="↔️"
                label="Rozstaw"
                value={plant.spacing}
              />
            )}
            {plant.hardiness_zone && (
              <InfoBox
                icon="❄️"
                label="Strefa USDA"
                value={plant.hardiness_zone}
              />
            )}
            {plant.origin && (
              <InfoBox
                icon="🌏"
                label="Pochodzenie"
                value={plant.origin}
              />
            )}
          </div>

          {/* Flower-specific info */}
          {(plant.flower_color || plant.bloom_season || plant.is_fragrant || plant.is_bee_friendly || plant.is_perennial) && (
            <Section title="🌸 Informacje o kwiatach">
              <div className="flex flex-wrap gap-2">
                {plant.flower_color && (
                  <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded min-w-0 max-w-full">
                    <span className="text-xs font-semibold text-pink-900 dark:text-pink-100 block">Kolor</span>
                    <span className="text-sm text-pink-800 dark:text-pink-200 break-words">{plant.flower_color}</span>
                  </div>
                )}
                {plant.bloom_season && (
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded min-w-0 max-w-full">
                    <span className="text-xs font-semibold text-purple-900 dark:text-purple-100 block">Kwitnienie</span>
                    <span className="text-sm text-purple-800 dark:text-purple-200 break-words">{plant.bloom_season}</span>
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
                {plant.is_bee_friendly && (
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
                    <span className="text-sm text-amber-800 dark:text-amber-200">🐝 Miododajna</span>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Uses */}
          {plant.uses && (
            <Section title="🍴 Zastosowanie">
              <div className="flex flex-wrap gap-2">
                {(() => {
                  // Parse uses - handle JSON string, array, or comma-separated string
                  let usesArray = [];
                  if (typeof plant.uses === 'string') {
                    // Remove brackets if present and try to parse as JSON
                    const cleanedUses = plant.uses.trim();
                    if (cleanedUses.startsWith('[')) {
                      try {
                        usesArray = JSON.parse(cleanedUses);
                      } catch {
                        // If JSON parse fails, treat as comma-separated
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
            </Section>
          )}

          {/* Fertilization */}
          {(plant.fertilization_needs || plant.npk_needs || plant.npk || plant.npk_ratio_recommended || plant.fertilization_frequency || plant.organic_fertilizer || plant.mineral_fertilizer) && (
            <Section title="🌱 Nawożenie" icon="💚">
              {(plant.fertilization_needs || plant.npk_needs) && (
                <div className="mb-3">
                  <span className="font-semibold text-gray-900 dark:text-white">Potrzeby pokarmowe:</span>
                  <span className="ml-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-sm">
                    {plant.fertilization_needs || plant.npk_needs}
                  </span>
                </div>
              )}
              {(plant.npk || plant.npk_ratio_recommended) && (
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  <strong>NPK zalecane:</strong> {plant.npk || plant.npk_ratio_recommended}
                </p>
              )}
              {plant.fertilization_frequency && (
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Częstość:</strong> {plant.fertilization_frequency}
                </p>
              )}
              {plant.organic_fertilizer && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                    💚 Organicznie:
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    {plant.organic_fertilizer}
                  </p>
                </div>
              )}
              {plant.mineral_fertilizer && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    ⚗️ Mineralnie:
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {plant.mineral_fertilizer}
                  </p>
                </div>
              )}
            </Section>
          )}

          {/* Companion Planting */}
          {(plant.companion_plants || plant.avoid_plants) && (
            <Section title="🌿 Sąsiedztwo">
              {plant.companion_plants && (
                <div className="mb-3">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    ✅ Dobre sąsiedztwo:
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {plant.companion_plants}
                  </p>
                </div>
              )}
              {plant.avoid_plants && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    ❌ Złe sąsiedztwo:
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {plant.avoid_plants}
                  </p>
                </div>
              )}
            </Section>
          )}

          {/* Care Instructions */}
          {(plant.pruning_needs || plant.winter_care || plant.propagation_method) && (
            <Section title="🛠️ Pielęgnacja">
              {plant.pruning_needs && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Przycinanie:</strong> {plant.pruning_needs}
                </p>
              )}
              {plant.winter_care && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Zimowanie:</strong> {plant.winter_care}
                </p>
              )}
              {plant.propagation_method && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Rozmnażanie:</strong> {plant.propagation_method}
                </p>
              )}
            </Section>
          )}

          {/* Care Notes */}
          {plant.care_notes && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-1">
                    📖 Szczegółowe informacje o hodowli:
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-line">
                    {plant.care_notes}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {plant.notes && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-400">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-900 dark:text-yellow-100 text-sm mb-1">
                    💡 Wskazówki:
                  </p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    {plant.notes}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900 rounded-b-2xl">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Zamknij
            </button>
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
    is_bee_friendly: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Prepare data - only send non-empty fields
      const plantData = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== false) {
          plantData[key] = value;
        }
      });

      // Set name based on display_name (required by backend)
      plantData.name = formData.display_name.toLowerCase().replace(/\s+/g, '_');

      // Convert days_to_harvest to number or 0
      if (plantData.days_to_harvest) {
        plantData.days_to_harvest = parseInt(plantData.days_to_harvest) || 0;
      } else {
        plantData.days_to_harvest = 0;
      }

      await axios.post('/api/plants', plantData);
      onSuccess();
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
    { value: 'herb', label: '🌿 Zioło', needsHarvest: true }
  ];

  const selectedCategory = categories.find(c => c.value === formData.category);
  const isFlower = formData.category.startsWith('flower_');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 pb-24 lg:pb-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-full overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">Dodaj własną roślinę</h2>
              <p className="text-green-100 mt-1">Stwórz własny wpis w katalogu</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
