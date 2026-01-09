import React, { useMemo } from 'react';
import { Flower, Scissors, Calendar, Info, Sparkles, AlertCircle } from 'lucide-react';
import usePlotDetails from '../hooks/usePlotDetails';

// Plant priority arrays moved outside to prevent re-creation
const HIGH_PRIORITY_PLANTS = ['róża', 'petunia', 'surfinia', 'begonia', 'pelargonia', 'cynia', 'kosmos', 'nagietki', 'dalila', 'dalia'];
const MEDIUM_PRIORITY_PLANTS = ['lawenda', 'goździk', 'ostróżka', 'rudbekia', 'jeżówka', 'piwonia', 'liliowiec', 'floks', 'mieczyk'];
const LOW_PRIORITY_PLANTS = ['hortensja', 'hiacynt', 'tulipan', 'narcyz', 'krokusy'];

/**
 * Get deadheading requirement level based on plant name
 */
const getDeadheadingRequirement = (plantName) => {
  const name = plantName.toLowerCase();

  if (HIGH_PRIORITY_PLANTS.some(plant => name.includes(plant))) {
    return {
      level: 'high',
      frequency: '2-3 razy w tygodniu',
      benefit: 'Znacząco wydłuża kwitnienie',
      priority: 'Wysoki',
      color: 'red'
    };
  } else if (MEDIUM_PRIORITY_PLANTS.some(plant => name.includes(plant))) {
    return {
      level: 'medium',
      frequency: 'Raz w tygodniu',
      benefit: 'Poprawia wygląd i kwitnienie',
      priority: 'Średni',
      color: 'yellow'
    };
  } else if (LOW_PRIORITY_PLANTS.some(plant => name.includes(plant))) {
    return {
      level: 'low',
      frequency: 'Opcjonalnie',
      benefit: 'Poprawia wygląd',
      priority: 'Niski',
      color: 'green'
    };
  } else {
    return {
      level: 'unknown',
      frequency: 'Do ustalenia',
      benefit: 'Sprawdź dla tego gatunku',
      priority: 'Nieznany',
      color: 'gray'
    };
  }
};

/**
 * Deadheading Reminders - Przypomnienia o usuwaniu przekwitniętych kwiatów
 *
 * Pomaga śledzić, które kwiaty wymagają regularnego usuwania przekwitniętych kwiatostanów
 */
const DeadheadingReminders = () => {
  const { beds, loading, error, refetch } = usePlotDetails();

  // Filter only flowering plants
  const flowers = useMemo(() => {
    return beds.filter(bed =>
      bed.plant_name &&
      bed.bloom_season &&
      (bed.category === 'flower_perennial' ||
       bed.category === 'flower_annual' ||
       bed.category === 'flower_bulb')
    ).map(bed => ({
      id: bed.id,
      name: bed.plant_name,
      variety: bed.plant_variety,
      category: bed.category,
      bloom_season: bed.bloom_season,
      flower_color: bed.flower_color,
      plot_name: bed.plot_name,
      row_number: bed.row_number
    }));
  }, [beds]);

  /**
   * Check if plant is currently blooming
   */
  const isCurrentlyBlooming = (bloomSeason) => {
    if (!bloomSeason) return false;

    const currentMonth = new Date().getMonth() + 1; // 1-12
    const season = bloomSeason.toLowerCase();

    const monthNames = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
                        'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];

    // Check if current month is in the bloom season
    const currentMonthName = monthNames[currentMonth - 1];

    // Simple check if season contains current month
    if (season.includes(currentMonthName)) return true;

    // Check for season names
    if (season.includes('wiosna') && currentMonth >= 3 && currentMonth <= 5) return true;
    if (season.includes('lato') && currentMonth >= 6 && currentMonth <= 8) return true;
    if (season.includes('jesień') && currentMonth >= 9 && currentMonth <= 11) return true;
    if (season.includes('zima') && (currentMonth === 12 || currentMonth <= 2)) return true;

    return false;
  };

  /**
   * Get category emoji
   */
  const getCategoryEmoji = (category) => {
    switch (category) {
      case 'flower_perennial': return '🌸';
      case 'flower_annual': return '🌼';
      case 'flower_bulb': return '🌷';
      default: return '🌺';
    }
  };

  /**
   * Group flowers by deadheading priority with memoization
   */
  const categorizedFlowers = useMemo(() => ({
    high: flowers.filter(f => getDeadheadingRequirement(f.name).level === 'high'),
    medium: flowers.filter(f => getDeadheadingRequirement(f.name).level === 'medium'),
    low: flowers.filter(f => getDeadheadingRequirement(f.name).level === 'low'),
    unknown: flowers.filter(f => getDeadheadingRequirement(f.name).level === 'unknown')
  }), [flowers]);

  const { high: highPriorityFlowers, medium: mediumPriorityFlowers, low: lowPriorityFlowers, unknown: unknownFlowers } = categorizedFlowers;

  /**
   * Count currently blooming flowers with memoization
   */
  const bloomingNow = useMemo(() =>
    flowers.filter(f => isCurrentlyBlooming(f.bloom_season)),
    [flowers]
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
      <div className="max-w-6xl mx-auto p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl shadow-lg p-4 sm:p-6 text-white">
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Scissors size={24} className="sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold truncate">Usuwanie Przekwitniętych</h1>
              <p className="text-pink-100 text-xs sm:text-sm">Deadheading - więcej kwiatów!</p>
            </div>
          </div>

          {/* Stats - Responsive */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <div className="bg-white/10 rounded-lg p-2 sm:p-3">
              <div className="text-lg sm:text-2xl font-bold">{flowers.length}</div>
              <div className="text-xs text-pink-100 truncate">Kwiatów</div>
            </div>
            <div className="bg-white/10 rounded-lg p-2 sm:p-3">
              <div className="text-lg sm:text-2xl font-bold">{bloomingNow.length}</div>
              <div className="text-xs text-pink-100 truncate">Kwitnie teraz</div>
            </div>
            <div className="bg-white/10 rounded-lg p-2 sm:p-3">
              <div className="text-lg sm:text-2xl font-bold">{highPriorityFlowers.length}</div>
              <div className="text-xs text-pink-100 truncate">Wysoki priorytet</div>
            </div>
            <div className="bg-white/10 rounded-lg p-2 sm:p-3 col-span-2 sm:col-span-1">
              <div className="text-lg sm:text-2xl font-bold truncate">2-3x/tydz.</div>
              <div className="text-xs text-pink-100 truncate">Częstotliwość</div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100">Błąd</h3>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                <button
                  type="button"
                  onClick={refetch}
                  aria-label="Spróbuj ponownie załadować dane"
                  className="mt-2 px-3 py-1 text-sm text-white bg-red-600 hover:bg-red-700 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Spróbuj ponownie
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info Box - Mobile Optimized */}
        <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-700 rounded-lg p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <Info className="text-pink-600 dark:text-pink-400 mt-0.5 flex-shrink-0" size={18} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-pink-900 dark:text-pink-100 text-sm sm:text-base mb-1">
                Czym jest deadheading?
              </p>
              <p className="text-xs sm:text-sm text-pink-800 dark:text-pink-200 mb-2">
                Usuwanie przekwitniętych kwiatów, aby zachęcić roślinę do produkcji nowych pąków zamiast nasion.
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-pink-800 dark:text-pink-200">
                <li>Wydłuża okres kwitnienia</li>
                <li>Poprawia wygląd rośliny</li>
                <li>Kieruje energię na nowe kwiaty</li>
                <li>Szczególnie ważne dla róż, petunii, dalii</li>
              </ul>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">Ładowanie...</p>
          </div>
        ) : flowers.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 sm:p-12 text-center">
            <Flower size={48} className="sm:w-16 sm:h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Brak kwiatów w ogrodzie
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Zasadź kwiaty, aby śledzić potrzeby deadheadingu
            </p>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {/* High Priority Flowers */}
            {highPriorityFlowers.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="bg-gradient-to-r from-red-500 to-pink-500 p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Sparkles className="text-white flex-shrink-0" size={20} />
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base sm:text-xl font-bold text-white truncate">
                        Wysoki Priorytet
                      </h2>
                      <p className="text-red-100 text-xs sm:text-sm">
                        {highPriorityFlowers.length} {highPriorityFlowers.length === 1 ? 'roślina' : 'roślin'} - wymagają częstego deadheadingu
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 sm:p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {highPriorityFlowers.map(flower => {
                      const req = getDeadheadingRequirement(flower.name);
                      const blooming = isCurrentlyBlooming(flower.bloom_season);

                      return (
                        <div
                          key={flower.id}
                          className={`rounded-lg p-3 sm:p-4 border-2 ${
                            blooming
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600'
                              : 'bg-gray-50 dark:bg-gray-900 border-red-300 dark:border-red-700'
                          }`}
                        >
                          <div className="flex items-start gap-2 sm:gap-3">
                            <span className="text-xl sm:text-2xl flex-shrink-0">
                              {getCategoryEmoji(flower.category)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                                  {flower.name}
                                </h3>
                                {blooming && (
                                  <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                                    Kwitnie!
                                  </span>
                                )}
                              </div>
                              {flower.variety && (
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                                  {flower.variety}
                                </p>
                              )}
                              <div className="mt-2 space-y-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {flower.plot_name} → Rząd {flower.row_number}
                                </p>
                                <div className="flex items-center gap-1 text-xs font-semibold text-red-700 dark:text-red-300">
                                  <Calendar size={12} />
                                  <span className="truncate">{req.frequency}</span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {req.benefit}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Medium Priority Flowers */}
            {mediumPriorityFlowers.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-400 p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Scissors className="text-white flex-shrink-0" size={20} />
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base sm:text-xl font-bold text-white truncate">
                        Średni Priorytet
                      </h2>
                      <p className="text-yellow-100 text-xs sm:text-sm">
                        {mediumPriorityFlowers.length} {mediumPriorityFlowers.length === 1 ? 'roślina' : 'roślin'} - raz w tygodniu
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 sm:p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {mediumPriorityFlowers.map(flower => {
                      const req = getDeadheadingRequirement(flower.name);
                      const blooming = isCurrentlyBlooming(flower.bloom_season);

                      return (
                        <div
                          key={flower.id}
                          className={`rounded-lg p-3 sm:p-4 border ${
                            blooming
                              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-600'
                              : 'bg-gray-50 dark:bg-gray-900 border-yellow-300 dark:border-yellow-700'
                          }`}
                        >
                          <div className="flex items-start gap-2 sm:gap-3">
                            <span className="text-xl sm:text-2xl flex-shrink-0">
                              {getCategoryEmoji(flower.category)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                                  {flower.name}
                                </h3>
                                {blooming && (
                                  <span className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                                    Kwitnie
                                  </span>
                                )}
                              </div>
                              {flower.variety && (
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                                  {flower.variety}
                                </p>
                              )}
                              <div className="mt-2 space-y-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {flower.plot_name} → Rząd {flower.row_number}
                                </p>
                                <div className="flex items-center gap-1 text-xs font-semibold text-yellow-700 dark:text-yellow-300">
                                  <Calendar size={12} />
                                  <span className="truncate">{req.frequency}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Low & Unknown Priority - Collapsed */}
            {(lowPriorityFlowers.length > 0 || unknownFlowers.length > 0) && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm sm:text-base">
                  Niski priorytet lub opcjonalnie ({lowPriorityFlowers.length + unknownFlowers.length})
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Te rośliny mniej korzystają z deadheadingu lub są samoczyszczące
                </p>
                <div className="flex flex-wrap gap-2">
                  {[...lowPriorityFlowers, ...unknownFlowers].map(flower => (
                    <span
                      key={flower.id}
                      className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm text-gray-700 dark:text-gray-300"
                    >
                      {getCategoryEmoji(flower.category)} {flower.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeadheadingReminders;
