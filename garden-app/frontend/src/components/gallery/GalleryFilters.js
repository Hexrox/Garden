import React from 'react';
import { X } from 'lucide-react';

const PHOTO_TAGS = [
  { emoji: '🥕', label: 'Warzywa', value: 'warzywa' },
  { emoji: '🌸', label: 'Kwiaty', value: 'kwiaty' },
  { emoji: '🌿', label: 'Zioła', value: 'zioła' },
  { emoji: '🍎', label: 'Owoce', value: 'owoce' },
  { emoji: '🌱', label: 'Siew', value: 'siew' },
  { emoji: '🌾', label: 'Zbiór', value: 'zbiór' },
  { emoji: '💧', label: 'Podlewanie', value: 'podlewanie' },
  { emoji: '🐛', label: 'Problem', value: 'problem' },
  { emoji: '✂️', label: 'Pielęgnacja', value: 'pielęgnacja' },
  { emoji: '🌤️', label: 'Pogoda', value: 'pogoda' },
  { emoji: '🏆', label: 'Sukces', value: 'sukces' },
  { emoji: '📸', label: 'Ogólne', value: 'ogólne' }
];

const GalleryFilters = ({ filters, setFilters, stats, onClose }) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const activeFiltersCount = Object.values(filters).filter(v => v).length;

  const handleClear = () => {
    setFilters({
      plant: '',
      plot: '',
      year: '',
      source_type: '',
      tag: '',
      show_deleted: false,
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          🔍 Filtry
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <X size={20} className="text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Plant filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            🌱 Roślina
          </label>
          <select
            value={filters.plant}
            onChange={(e) => setFilters({ ...filters, plant: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="">Wszystkie</option>
            {stats?.byPlant?.map((item) => (
              <option key={item.plant} value={item.plant}>
                {item.plant} ({item.count})
              </option>
            ))}
          </select>
        </div>

        {/* Plot filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            📍 Poletko
          </label>
          <select
            value={filters.plot}
            onChange={(e) => setFilters({ ...filters, plot: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="">Wszystkie</option>
            {stats?.byPlot?.map((item) => (
              <option key={item.plot} value={item.plot}>
                {item.plot} ({item.count})
              </option>
            ))}
          </select>
        </div>

        {/* Year filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            📅 Rok
          </label>
          <select
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="">Wszystkie lata</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Tag filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            🏷️ Kategoria
          </label>
          <select
            value={filters.tag}
            onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="">Wszystkie</option>
            {PHOTO_TAGS.map((tag) => (
              <option key={tag.value} value={tag.value}>
                {tag.emoji} {tag.label}
              </option>
            ))}
          </select>
        </div>

        {/* Source type filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            📦 Źródło
          </label>
          <select
            value={filters.source_type}
            onChange={(e) => setFilters({ ...filters, source_type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="">Wszystkie</option>
            <option value="progress">Galeria wzrostu</option>
            <option value="quick">Szybkie zdjęcia</option>
            <option value="bed_main">Główne zdjęcia grządek</option>
            <option value="plot_main">Główne zdjęcia poletek</option>
            <option value="manual">Dodane ręcznie</option>
          </select>
        </div>
      </div>

      {/* Show deleted checkbox */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.show_deleted}
            onChange={(e) => setFilters({ ...filters, show_deleted: e.target.checked })}
            className="w-4 h-4 text-purple-600 rounded"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Pokaż zdjęcia z usuniętych grządek
            {stats?.deletedCount > 0 && (
              <span className="ml-1 text-gray-500">({stats.deletedCount})</span>
            )}
          </span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleClear}
          disabled={activeFiltersCount === 0}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Wyczyść
        </button>
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Zastosuj {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </button>
      </div>
    </div>
  );
};

export default GalleryFilters;
