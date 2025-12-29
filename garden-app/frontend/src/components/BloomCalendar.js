import React, { useState, useEffect } from 'react';
import { Calendar, Flower, ChevronRight } from 'lucide-react';
import axios from '../config/axios';

/**
 * BloomCalendar - Widget showing what's blooming now and next month
 */
const BloomCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [bloomingNow, setBloomingNow] = useState([]);
  const [bloomingNext, setBloomingNext] = useState([]);
  const [loading, setLoading] = useState(true);

  const monthNames = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
  ];

  const monthNamesEn = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];

  useEffect(() => {
    fetchBloomingPlants();
  }, []);

  const fetchBloomingPlants = async () => {
    try {
      const response = await axios.get('/api/plants');
      const plants = response.data;

      // Filter plants blooming this month
      const now = filterByMonth(plants, currentMonth);
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const next = filterByMonth(plants, nextMonth);

      setBloomingNow(now.slice(0, 5)); // Top 5
      setBloomingNext(next.slice(0, 3)); // Top 3
      setLoading(false);
    } catch (error) {
      console.error('Error fetching blooming plants:', error);
      setLoading(false);
    }
  };

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

  const getFlowerIcon = (category) => {
    if (category === 'flower_perennial') return '🌸';
    if (category === 'flower_bulb') return '🌷';
    if (category === 'flower_annual') return '🌼';
    if (category === 'fruit_tree') return '🌳';
    if (category === 'fruit_bush') return '🌺';
    return '🌱';
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
            Brak roślin kwitnących w tym miesiącu w bazie
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
    </div>
  );
};

export default BloomCalendar;
