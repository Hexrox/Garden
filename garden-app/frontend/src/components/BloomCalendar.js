import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Flower, ChevronRight, AlertTriangle, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import axios from '../config/axios';

// Month names constants
const monthNames = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

const monthNamesEn = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

// Helper function to filter plants by month
const filterByMonth = (plants, month) => {
  const monthNamePl = monthNames[month - 1].toLowerCase();
  const monthNameEn = monthNamesEn[month - 1].toLowerCase();

  return plants.filter(plant => {
    if (!plant.bloom_season) return false;

    const bloomSeason = plant.bloom_season.toLowerCase();

    // Check if month name is in bloom_season string
    // Examples: "czerwiec-wrzesień", "maj-czerwiec", "lato", "cały sezon"
    return (
      bloomSeason.includes(monthNamePl) ||
      bloomSeason.includes(monthNameEn) ||
      (month >= 6 && month <= 8 && bloomSeason.includes('lato')) ||
      (month >= 3 && month <= 5 && bloomSeason.includes('wiosna')) ||
      (month >= 9 && month <= 11 && bloomSeason.includes('jesień')) ||
      bloomSeason.includes('cały sezon')
    );
  });
};

// Analyze bloom gaps and provide suggestions
const analyzeBloomGaps = (allPlants) => {
  const analysis = [];

  // Check each month (focus on March-October for gardening season)
  for (let month = 3; month <= 10; month++) {
    const bloomingPlants = filterByMonth(allPlants, month);

    if (bloomingPlants.length === 0) {
      // Find suggestions for this month
      const suggestions = allPlants
        .filter(p => {
          if (!p.bloom_season) return false;
          const season = p.bloom_season.toLowerCase();
          const monthPl = monthNames[month - 1].toLowerCase();
          return season.includes(monthPl) ||
            (month >= 6 && month <= 8 && season.includes('lato')) ||
            (month >= 3 && month <= 5 && season.includes('wiosna'));
        })
        .slice(0, 3);

      analysis.push({
        month,
        monthName: monthNames[month - 1],
        count: 0,
        gap: true,
        suggestions
      });
    } else if (bloomingPlants.length < 3) {
      // Low bloom month
      analysis.push({
        month,
        monthName: monthNames[month - 1],
        count: bloomingPlants.length,
        gap: false,
        low: true,
        plants: bloomingPlants
      });
    }
  }

  return analysis;
};

/**
 * BloomCalendar - Widget showing what's blooming now and next month
 * @param {boolean} horizontal - If true, renders in horizontal layout
 */
const BloomCalendar = ({ horizontal = false, showAnalysis = false }) => {
  const [currentMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [bloomingNow, setBloomingNow] = useState([]);
  const [bloomingNext, setBloomingNext] = useState([]);
  const [allPlants, setAllPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGapAnalysis, setShowGapAnalysis] = useState(showAnalysis);

  const fetchBloomingPlants = useCallback(async () => {
    try {
      const response = await axios.get('/api/plants');
      const plants = response.data;
      setAllPlants(plants);

      // Filter plants blooming this month
      const now = filterByMonth(plants, currentMonth);
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const next = filterByMonth(plants, nextMonth);

      // More items for horizontal layout
      setBloomingNow(horizontal ? now.slice(0, 8) : now.slice(0, 5));
      setBloomingNext(horizontal ? next.slice(0, 6) : next.slice(0, 3));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching blooming plants:', error);
      setLoading(false);
    }
  }, [currentMonth, horizontal]);

  // Calculate bloom gaps
  const bloomGaps = useMemo(() => {
    if (allPlants.length === 0) return [];
    return analyzeBloomGaps(allPlants);
  }, [allPlants]);

  useEffect(() => {
    fetchBloomingPlants();
  }, [fetchBloomingPlants]);

  const getFlowerIcon = (category) => {
    const icons = {
      'flower_perennial': '🌸',
      'flower_bulb': '🌷',
      'flower_annual': '🌼',
      'fruit_tree': '🌳',
      'fruit_bush': '🍇',
      'herb': '🌿',
      'vegetable': '🥕',
      'grass': '🌾',
      'tree_ornamental': '🌲',
      'shrub_ornamental': '🌺',
      'climber': '🪴',
      'groundcover': '🍀',
      'fern': '☘️',
      'succulent': '🌵'
    };
    return icons[category] || '🌱';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-green-600 dark:text-green-400" size={20} />
          <h3 className="font-semibold text-gray-900 dark:text-white">Kalendarz kwitnienia</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Ładowanie...</p>
      </div>
    );
  }

  // Horizontal layout for dashboard
  if (horizontal) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-green-600 dark:text-green-400" size={20} />
            <h3 className="font-semibold text-gray-900 dark:text-white">Kalendarz kwitnienia</h3>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {monthNames[currentMonth - 1]} {new Date().getFullYear()}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* What's blooming now */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Kwitnie teraz
            </h4>
            {bloomingNow.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {bloomingNow.map((plant, index) => (
                  <span
                    key={plant.id || index}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                    title={plant.bloom_season}
                  >
                    {getFlowerIcon(plant.category)} {plant.display_name || plant.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic py-2">
                Zimowa przerwa - rośliny odpoczywają 🌨️
              </p>
            )}
          </div>

          {/* Coming next month */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <ChevronRight size={14} className="text-blue-500" />
              Za miesiąc ({monthNames[currentMonth === 12 ? 0 : currentMonth]})
            </h4>
            {bloomingNext.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {bloomingNext.map((plant, index) => (
                  <span
                    key={plant.id || index}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    title={plant.bloom_season}
                  >
                    {getFlowerIcon(plant.category)} {plant.display_name || plant.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic py-2">
                Jeszcze za wcześnie na kwitnienie
              </p>
            )}
          </div>
        </div>

        {/* Compact gap indicator for horizontal layout */}
        {bloomGaps.filter(g => g.gap).length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span className="text-xs text-amber-800 dark:text-amber-200">
                Brak kwitnących roślin w: {bloomGaps.filter(g => g.gap).map(g => g.monthName).join(', ')}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Original vertical layout
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="text-green-600 dark:text-green-400" size={20} />
        <h3 className="font-semibold text-gray-900 dark:text-white">Kalendarz kwitnienia</h3>
      </div>

      {/* What's blooming now */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          🌸 Co kwitnie teraz? ({monthNames[currentMonth - 1]})
        </h4>
        {bloomingNow.length > 0 ? (
          <div className="space-y-2">
            {bloomingNow.map((plant, index) => (
              <div
                key={plant.id || index}
                className="flex items-start gap-2 p-2 rounded bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <span className="text-lg flex-shrink-0">{getFlowerIcon(plant.category)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {plant.display_name || plant.name}
                  </p>
                  <div className="flex gap-2 mt-0.5">
                    {plant.flower_color && (
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        🎨 {plant.flower_color.split(',')[0]}
                      </span>
                    )}
                    {plant.bloom_season && (
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        📅 {plant.bloom_season}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            Zimowa przerwa - rośliny odpoczywają 🌨️
          </p>
        )}
      </div>

      {/* Coming next month */}
      {bloomingNext.length > 0 && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
            <ChevronRight size={14} />
            Za miesiąc ({monthNames[currentMonth === 12 ? 0 : currentMonth]})
          </h4>
          <div className="flex flex-wrap gap-2">
            {bloomingNext.map((plant, index) => (
              <span
                key={plant.id || index}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full"
              >
                {getFlowerIcon(plant.category)} {plant.display_name || plant.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Info footer */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <Flower size={12} />
          Dane z bazy {bloomingNow.length + bloomingNext.length} roślin kwitnących
        </p>
      </div>

      {/* Bloom Gap Analysis */}
      {bloomGaps.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowGapAnalysis(!showGapAnalysis)}
            className="w-full flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {bloomGaps.filter(g => g.gap).length > 0
                  ? `${bloomGaps.filter(g => g.gap).length} miesięcy bez kwitnących roślin`
                  : `${bloomGaps.length} miesięcy z małą ilością kwiatów`
                }
              </span>
            </div>
            {showGapAnalysis ? (
              <ChevronUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            )}
          </button>

          {showGapAnalysis && (
            <div className="mt-3 space-y-3">
              {bloomGaps.map((gap, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg ${
                    gap.gap
                      ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                      : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-medium text-sm ${
                      gap.gap
                        ? 'text-red-800 dark:text-red-200'
                        : 'text-yellow-800 dark:text-yellow-200'
                    }`}>
                      {gap.monthName}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      gap.gap
                        ? 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200'
                        : 'bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-200'
                    }`}>
                      {gap.gap ? 'Brak kwitnących' : `Tylko ${gap.count}`}
                    </span>
                  </div>

                  {gap.suggestions && gap.suggestions.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1 mb-1.5">
                        <Lightbulb className="w-3 h-3 text-green-600 dark:text-green-400" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">Sugestie:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {gap.suggestions.map((plant, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded"
                          >
                            {plant.display_name || plant.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                Dodaj rośliny z sugestii, aby mieć kwitnący ogród przez cały sezon!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BloomCalendar;
