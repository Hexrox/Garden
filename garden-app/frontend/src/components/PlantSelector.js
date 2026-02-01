import React, { useState, useEffect, useMemo } from 'react';
import { Search, Info, Filter } from 'lucide-react';
import axios from '../config/axios';

/**
 * PlantSelector Component
 *
 * Komponent do wyboru rośliny z autouzupełnianiem i automatycznym obliczaniem daty zbioru
 * Pobiera dane z API (641 roślin)
 */
const PlantSelector = ({ value, onChange, plantedDate, onHarvestDateCalculated }) => {
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [allPlants, setAllPlants] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  // Kategorie z polskimi nazwami
  const categories = [
    { value: 'all', label: '🌱 Wszystkie', emoji: '🌱' },
    { value: 'vegetable', label: '🥕 Warzywa', emoji: '🥕' },
    { value: 'herb', label: '🌿 Zioła', emoji: '🌿' },
    { value: 'flower_perennial', label: '🌸 Byliny', emoji: '🌸' },
    { value: 'flower_annual', label: '🌼 Kwiaty jednoroczne', emoji: '🌼' },
    { value: 'flower_bulb', label: '🌷 Kwiaty cebulowe', emoji: '🌷' },
    { value: 'fruit_tree', label: '🌳 Drzewa owocowe', emoji: '🌳' },
    { value: 'fruit_bush', label: '🍇 Krzewy owocowe', emoji: '🍇' },
  ];

  // Pobierz rośliny z API
  useEffect(() => {
    const fetchPlants = async () => {
      try {
        const response = await axios.get('/api/plants');
        setAllPlants(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching plants:', error);
        setLoading(false);
      }
    };
    fetchPlants();
  }, []);

  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  // Filtruj rośliny po wyszukiwaniu i kategorii (memoized)
  const filteredSuggestions = useMemo(() => {
    if (searchTerm.length < 2) return [];
    const term = searchTerm.toLowerCase();
    let filtered = allPlants.filter(plant =>
      plant.name.toLowerCase().includes(term) ||
      (plant.display_name && plant.display_name.toLowerCase().includes(term)) ||
      (plant.latin_name && plant.latin_name.toLowerCase().includes(term))
    );
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(plant => plant.category === selectedCategory);
    }
    return filtered.slice(0, 20);
  }, [searchTerm, selectedCategory, allPlants]);

  useEffect(() => {
    setSuggestions(filteredSuggestions);
    setShowSuggestions(filteredSuggestions.length > 0);
  }, [filteredSuggestions]);

  const calculateHarvestDate = (plantedDate, daysToHarvest) => {
    if (!plantedDate || !daysToHarvest || daysToHarvest === 0) return null;
    const planted = new Date(plantedDate);
    const harvest = new Date(planted);
    harvest.setDate(harvest.getDate() + daysToHarvest);
    return harvest.toISOString().split('T')[0];
  };

  const handlePlantSelect = (plant) => {
    const plantName = plant.display_name || plant.name;
    setSearchTerm(plantName);
    onChange(plantName);
    setShowSuggestions(false);

    // Automatycznie oblicz datę zbioru jeśli jest data posadzenia
    if (plantedDate && onHarvestDateCalculated && plant.days_to_harvest) {
      const harvestDate = calculateHarvestDate(plantedDate, plant.days_to_harvest);
      if (harvestDate) {
        onHarvestDateCalculated(harvestDate, plant.days_to_harvest);
      }
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onChange(value);
  };

  const getCategoryLabel = (categoryCode) => {
    const translations = {
      'vegetable': 'Warzywa',
      'herb': 'Zioła',
      'flower_perennial': 'Byliny',
      'flower_annual': 'Kwiaty jednoroczne',
      'flower_bulb': 'Kwiaty cebulowe',
      'fruit_tree': 'Drzewa owocowe',
      'fruit_bush': 'Krzewy owocowe',
      'grass': 'Trawy ozdobne',
      'tree_ornamental': 'Drzewa ozdobne',
      'shrub_ornamental': 'Krzewy ozdobne',
      'climber': 'Pnącza',
      'groundcover': 'Rośliny okrywowe',
      'fern': 'Paprocie',
      'succulent': 'Sukulenty'
    };
    return translations[categoryCode] || categoryCode;
  };

  if (loading) {
    return (
      <div className="text-sm text-gray-500 py-2">
        Ładowanie roślin...
      </div>
    );
  }

  return (
    <div className="relative space-y-2">
      {/* Category Filter */}
      <div className="flex items-center gap-2">
        <Filter className="text-gray-400" size={16} />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
        >
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
          placeholder={`Wpisz nazwę rośliny... (${allPlants.length} dostępnych)`}
          className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={18}
        />
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-64 overflow-y-auto">
          {suggestions.map((plant, index) => (
            <button
              key={plant.id || index}
              type="button"
              onClick={() => handlePlantSelect(plant)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {plant.display_name || plant.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                    <span>{getCategoryLabel(plant.category)}</span>
                    {plant.latin_name && (
                      <span className="italic">• {plant.latin_name}</span>
                    )}
                  </div>

                  {/* Flower-specific data */}
                  {(plant.flower_color || plant.bloom_season) && (
                    <div className="flex gap-2 mt-1">
                      {plant.flower_color && (
                        <span className="text-xs bg-pink-100 dark:bg-pink-900 px-2 py-0.5 rounded">
                          🌸 {plant.flower_color.split(',')[0]}
                        </span>
                      )}
                      {plant.bloom_season && (
                        <span className="text-xs bg-green-100 dark:bg-green-900 px-2 py-0.5 rounded">
                          📅 {plant.bloom_season}
                        </span>
                      )}
                    </div>
                  )}

                  {plant.notes && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-start gap-1">
                      <Info size={12} className="mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{plant.notes}</span>
                    </div>
                  )}
                </div>
                {plant.days_to_harvest > 0 && (
                  <div className="ml-4 text-right flex-shrink-0">
                    <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {plant.days_to_harvest} dni
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      do zbioru
                    </div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Categories Helper */}
      {!showSuggestions && searchTerm.length < 2 && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1 mb-1">
            <Info size={12} />
            <span>Wybierz kategorię lub wpisz nazwę rośliny</span>
          </div>
          <div className="text-xs mt-1">
            Dostępne rośliny: <span className="font-semibold text-green-600 dark:text-green-400">{allPlants.length}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantSelector;
