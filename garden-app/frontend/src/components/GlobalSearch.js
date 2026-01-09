import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Image, Sprout, CheckSquare, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../config/axios';

const GlobalSearch = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    photos: [],
    beds: [],
    tasks: [],
    plots: []
  });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search on query change (debounced)
  useEffect(() => {
    if (!query.trim()) {
      setResults({ photos: [], beds: [], tasks: [], plots: [] });
      return;
    }

    const timer = setTimeout(async () => {
      await performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (searchQuery) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      setResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAllResults = () => {
    const all = [];

    results.photos?.forEach(photo => all.push({ type: 'photo', data: photo }));
    results.beds?.forEach(bed => all.push({ type: 'bed', data: bed }));
    results.tasks?.forEach(task => all.push({ type: 'task', data: task }));
    results.plots?.forEach(plot => all.push({ type: 'plot', data: plot }));

    return all;
  };

  const allResults = getAllResults();

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && allResults[selectedIndex]) {
      e.preventDefault();
      handleSelectResult(allResults[selectedIndex]);
    }
  };

  const handleSelectResult = (result) => {
    switch (result.type) {
      case 'photo':
        navigate('/gallery');
        break;
      case 'bed':
        navigate(`/plots/${result.data.plot_id}`);
        break;
      case 'task':
        navigate('/tasks');
        break;
      case 'plot':
        navigate(`/plots/${result.data.id}`);
        break;
      default:
        break;
    }
    onClose();
  };

  if (!isOpen) return null;

  const totalResults = allResults.length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Search Modal */}
      <div className="relative min-h-screen flex items-start justify-center p-4 pt-[10vh]">
        <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Szukaj roślin, zdjęć, zadań, poletka..."
              className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none text-lg"
            />
            {loading && (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {query && !loading && totalResults === 0 && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                Brak wyników dla "{query}"
              </div>
            )}

            {/* Photos */}
            {results.photos && results.photos.length > 0 && (
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Zdjęcia ({results.photos.length})
                </div>
                {results.photos.map((photo, index) => {
                  const globalIndex = allResults.findIndex(r => r.type === 'photo' && r.data.id === photo.id);
                  return (
                    <button
                      key={`photo-${photo.id}`}
                      onClick={() => handleSelectResult({ type: 'photo', data: photo })}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        globalIndex === selectedIndex
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded flex items-center justify-center flex-shrink-0">
                        <Image className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {photo.bed_plant_name || 'Zdjęcie'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {photo.plot_name} • {new Date(photo.created_at).toLocaleDateString('pl-PL')}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Beds */}
            {results.beds && results.beds.length > 0 && (
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Grządki ({results.beds.length})
                </div>
                {results.beds.map((bed, index) => {
                  const globalIndex = allResults.findIndex(r => r.type === 'bed' && r.data.id === bed.id);
                  return (
                    <button
                      key={`bed-${bed.id}`}
                      onClick={() => handleSelectResult({ type: 'bed', data: bed })}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        globalIndex === selectedIndex
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded flex items-center justify-center flex-shrink-0">
                        <Sprout className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {bed.plant_name} {bed.plant_variety && `- ${bed.plant_variety}`}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {bed.plot_name} • Rząd #{bed.row_number}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Tasks */}
            {results.tasks && results.tasks.length > 0 && (
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Zadania ({results.tasks.length})
                </div>
                {results.tasks.map((task, index) => {
                  const globalIndex = allResults.findIndex(r => r.type === 'task' && r.data.id === task.id);
                  return (
                    <button
                      key={`task-${task.id}`}
                      onClick={() => handleSelectResult({ type: 'task', data: task })}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        globalIndex === selectedIndex
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center flex-shrink-0">
                        <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {task.description}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {task.due_date && new Date(task.due_date).toLocaleDateString('pl-PL')}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Plots */}
            {results.plots && results.plots.length > 0 && (
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Poletka ({results.plots.length})
                </div>
                {results.plots.map((plot, index) => {
                  const globalIndex = allResults.findIndex(r => r.type === 'plot' && r.data.id === plot.id);
                  return (
                    <button
                      key={`plot-${plot.id}`}
                      onClick={() => handleSelectResult({ type: 'plot', data: plot })}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        globalIndex === selectedIndex
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {plot.name}
                        </div>
                        {plot.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {plot.description}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <span>↑↓ Nawiguj</span>
              <span>Enter Otwórz</span>
              <span>Esc Zamknij</span>
            </div>
            {totalResults > 0 && (
              <span>{totalResults} wyników</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
