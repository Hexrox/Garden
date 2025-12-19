import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Leaf, Droplets, Sun, Sprout, AlertCircle } from 'lucide-react';
import axios from '../config/axios';
import PlantingWizard from '../components/PlantingWizard';

const PlantCatalog = () => {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState(['Warzywa owocowe']);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [plantingPlant, setPlantingPlant] = useState(null);

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
    const category = plant.category || 'Inne';
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
    if (category.includes('Warzywa')) return '🥕';
    if (category.includes('Kwiaty')) return '🌸';
    if (category.includes('Zioła')) return '🌿';
    if (category.includes('Owoce')) return '🍓';
    if (category.includes('Krzewy')) return '🌳';
    return '🌱';
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
        {plants.length < 20 && (
          <button
            onClick={handleImportDefaults}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            📥 Importuj rozszerzoną bazę
          </button>
        )}
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
            .sort(([a], [b]) => a.localeCompare(b))
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
    </div>
  );
};

// Plant Card Component
const PlantCard = ({ plant, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left w-full"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {plant.display_name || plant.name}
          </h4>
          {plant.latin_name && (
            <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1">
              {plant.latin_name}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-2">
        <span className="flex items-center gap-1">
          <Sprout className="w-3 h-3" />
          {plant.days_to_harvest} dni
        </span>
        {plant.soil_ph && (
          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded">
            pH {plant.soil_ph}
          </span>
        )}
      </div>
    </button>
  );
};

// Plant Detail Modal Component
const PlantDetailModal = ({ plant, onClose, onPlant }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
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
          {/* Basic Info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <InfoBox
              icon={<Sprout className="w-5 h-5" />}
              label="Dni do zbioru"
              value={`${plant.days_to_harvest} dni`}
              sublabel={plant.range_min && plant.range_max ? `(${plant.range_min}-${plant.range_max})` : null}
            />
            {plant.soil_ph && (
              <InfoBox
                icon="🧪"
                label="pH gleby"
                value={plant.soil_ph}
              />
            )}
            {plant.water_needs && (
              <InfoBox
                icon={<Droplets className="w-5 h-5" />}
                label="Potrzeby wodne"
                value={plant.water_needs}
              />
            )}
            {plant.sun_requirement && (
              <InfoBox
                icon={<Sun className="w-5 h-5" />}
                label="Światło"
                value={plant.sun_requirement}
              />
            )}
            {plant.height && (
              <InfoBox
                icon="📏"
                label="Wysokość"
                value={plant.height}
              />
            )}
            {plant.soil_type && (
              <InfoBox
                icon="🌍"
                label="Typ gleby"
                value={plant.soil_type}
              />
            )}
          </div>

          {/* Fertilization */}
          {(plant.npk_needs || plant.organic_fertilizer || plant.mineral_fertilizer) && (
            <Section title="🌱 Nawożenie" icon="💚">
              {plant.npk_needs && (
                <div className="mb-3">
                  <span className="font-semibold text-gray-900 dark:text-white">Potrzeby pokarmowe:</span>
                  <span className="ml-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-sm">
                    {plant.npk_needs}
                  </span>
                </div>
              )}
              {plant.npk_ratio_recommended && (
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  <strong>NPK zalecane:</strong> {plant.npk_ratio_recommended}
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
  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
    <div className="flex items-center gap-2 mb-1">
      {typeof icon === 'string' ? <span>{icon}</span> : <span className="text-gray-600 dark:text-gray-400">{icon}</span>}
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
    </div>
    <p className="font-semibold text-gray-900 dark:text-white text-sm">
      {value}
    </p>
    {sublabel && (
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
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

export default PlantCatalog;
