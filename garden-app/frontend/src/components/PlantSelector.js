import React, { useState, useEffect } from 'react';
import { Search, Info } from 'lucide-react';
import {
  getAllCategories,
  getPlantsByCategory,
  searchPlants,
  calculateExpectedHarvestDate,
} from '../features/growth-tracking/plantGrowthData';

/**
 * PlantSelector Component
 *
 * Komponent do wyboru rośliny z autouzupełnianiem i automatycznym obliczaniem daty zbioru
 */
const PlantSelector = ({ value, onChange, plantedDate, onHarvestDateCalculated }) => {
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [categories] = useState(getAllCategories());

  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const results = searchPlants(searchTerm);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm]);

  const handlePlantSelect = (plantName, daysToHarvest) => {
    setSearchTerm(plantName);
    onChange(plantName);
    setShowSuggestions(false);

    // Automatycznie oblicz datę zbioru jeśli jest data posadzenia
    if (plantedDate && onHarvestDateCalculated) {
      const harvestDate = calculateExpectedHarvestDate(plantedDate, plantName);
      if (harvestDate) {
        onHarvestDateCalculated(harvestDate, daysToHarvest);
      }
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onChange(value);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => searchTerm.length >= 2 && setSuggestions(searchPlants(searchTerm))}
          placeholder="Wpisz nazwę rośliny..."
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
              key={index}
              type="button"
              onClick={() => handlePlantSelect(plant.name, plant.daysToHarvest)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white capitalize">
                    {plant.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {plant.category}
                  </div>
                  {plant.notes && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-start gap-1">
                      <Info size={12} className="mt-0.5 flex-shrink-0" />
                      <span>{plant.notes}</span>
                    </div>
                  )}
                </div>
                <div className="ml-4 text-right flex-shrink-0">
                  <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {plant.daysToHarvest} dni
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    do zbioru
                  </div>
                </div>
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
            <span>Kategorie roślin w bazie:</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {categories.map((category, index) => (
              <span
                key={index}
                className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantSelector;
