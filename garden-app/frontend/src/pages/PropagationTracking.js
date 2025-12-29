import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import { Scissors, Calendar, CheckCircle, Clock, Info, AlertCircle } from 'lucide-react';

/**
 * Propagation Tracking - Śledzenie dzielenia bylin
 *
 * Pomaga śledzić, kiedy byliny zostały podzielone i kiedy trzeba je znowu podzielić
 */
const PropagationTracking = () => {
  const [perennials, setPerennials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerennials();
  }, []);

  const fetchPerennials = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/plots');

      // Extract all perennial plants from all plots
      const allPerennials = [];
      for (const plot of response.data) {
        const detailsResponse = await axios.get(`/api/plots/${plot.id}/details`);
        const beds = detailsResponse.data.beds || [];

        // Filter only perennials
        const perennialBeds = beds.filter(bed =>
          bed.plant_name && bed.category === 'flower_perennial'
        );

        perennialBeds.forEach(bed => {
          const plantedDate = bed.planted_date ? new Date(bed.planted_date) : null;
          const yearsOld = plantedDate ? Math.floor((new Date() - plantedDate) / (365.25 * 24 * 60 * 60 * 1000)) : null;

          allPerennials.push({
            id: bed.id,
            name: bed.plant_name,
            variety: bed.plant_variety,
            plot_name: plot.name,
            row_number: bed.row_number,
            planted_date: bed.planted_date,
            years_old: yearsOld,
            note: bed.note
          });
        });
      }

      setPerennials(allPerennials);
    } catch (err) {
      console.error('Error fetching perennials:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get division recommendation based on plant age
   */
  const getDivisionRecommendation = (yearsOld) => {
    if (!yearsOld) return { status: 'unknown', text: 'Nieznany wiek', color: 'gray' };

    if (yearsOld >= 5) {
      return { status: 'urgent', text: 'Trzeba podzielić!', color: 'red' };
    } else if (yearsOld >= 3) {
      return { status: 'soon', text: 'Wkrótce podzielić', color: 'yellow' };
    } else {
      return { status: 'good', text: 'Nie wymaga', color: 'green' };
    }
  };

  /**
   * Get best time to divide based on current month
   */
  const getBestDivisionTime = () => {
    const month = new Date().getMonth() + 1; // 1-12

    if (month >= 3 && month <= 4) {
      return { current: true, season: 'Wiosna', months: 'Marzec-Kwiecień' };
    } else if (month >= 9 && month <= 10) {
      return { current: true, season: 'Jesień', months: 'Wrzesień-Październik' };
    } else {
      return { current: false, season: 'Wiosna lub Jesień', months: 'Marzec-Kwiecień lub Wrzesień-Październik' };
    }
  };

  const divisionTime = getBestDivisionTime();

  /**
   * Group perennials by division urgency
   */
  const urgentPerennials = perennials.filter(p => getDivisionRecommendation(p.years_old).status === 'urgent');
  const soonPerennials = perennials.filter(p => getDivisionRecommendation(p.years_old).status === 'soon');
  const goodPerennials = perennials.filter(p => getDivisionRecommendation(p.years_old).status === 'good');
  const unknownPerennials = perennials.filter(p => getDivisionRecommendation(p.years_old).status === 'unknown');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
      <div className="max-w-6xl mx-auto p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl shadow-lg p-4 sm:p-6 text-white">
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Scissors size={24} className="sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold truncate">Dzielenie Bylin</h1>
              <p className="text-purple-100 text-xs sm:text-sm">Śledź wiek i potrzeby twoich roślin</p>
            </div>
          </div>

          {/* Stats - Responsive Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <div className="bg-white/10 rounded-lg p-2 sm:p-3">
              <div className="text-lg sm:text-2xl font-bold">{perennials.length}</div>
              <div className="text-xs text-purple-100 truncate">Bylin</div>
            </div>
            <div className="bg-white/10 rounded-lg p-2 sm:p-3">
              <div className="text-lg sm:text-2xl font-bold">{urgentPerennials.length}</div>
              <div className="text-xs text-purple-100 truncate">Do podziału</div>
            </div>
            <div className="bg-white/10 rounded-lg p-2 sm:p-3">
              <div className="text-lg sm:text-2xl font-bold">{soonPerennials.length}</div>
              <div className="text-xs text-purple-100 truncate">Wkrótce</div>
            </div>
            <div className="bg-white/10 rounded-lg p-2 sm:p-3 col-span-2 sm:col-span-1">
              <div className="text-lg sm:text-2xl font-bold truncate">{divisionTime.season}</div>
              <div className="text-xs text-purple-100 truncate">Sezon</div>
            </div>
          </div>
        </div>

        {/* Season Alert - Mobile Optimized */}
        {divisionTime.current && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <CheckCircle className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" size={18} />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-green-900 dark:text-green-100 text-sm sm:text-base">
                  Idealny czas na dzielenie!
                </h3>
                <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 mt-1">
                  {divisionTime.months} to najlepszy czas na dzielenie bylin. Rośliny szybko się zakorzenią.
                </p>
              </div>
            </div>
          </div>
        )}

        {!divisionTime.current && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <Clock className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" size={18} />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm sm:text-base">
                  Poza sezonem dzielenia
                </h3>
                <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Najlepszy czas: {divisionTime.months}. Zaplanuj dzielenie z wyprzedzeniem.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Box - Mobile Optimized */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <Info className="text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" size={18} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-purple-900 dark:text-purple-100 text-sm sm:text-base mb-1">
                Dlaczego dzielić byliny?
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-purple-800 dark:text-purple-200">
                <li>Odmłodzenie starych roślin</li>
                <li>Lepsze kwitnienie</li>
                <li>Darmowe nowe rośliny</li>
                <li>Zapobieganie przeciążeniu</li>
                <li>Idealnie co 3-5 lat</li>
              </ul>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">Ładowanie...</p>
          </div>
        ) : perennials.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 sm:p-12 text-center">
            <Scissors size={48} className="sm:w-16 sm:h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Brak bylin w ogrodzie
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Zasadź byliny, aby śledzić ich wiek i potrzeby dzielenia
            </p>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {/* Urgent Division - Mobile Cards */}
            {urgentPerennials.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="bg-gradient-to-r from-red-500 to-orange-500 p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <AlertCircle className="text-white flex-shrink-0" size={20} />
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base sm:text-xl font-bold text-white truncate">
                        Pilne! Wymaga podziału
                      </h2>
                      <p className="text-red-100 text-xs sm:text-sm">
                        {urgentPerennials.length} {urgentPerennials.length === 1 ? 'bylina' : 'bylin'} (5+ lat)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 sm:p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {urgentPerennials.map(plant => (
                      <div
                        key={plant.id}
                        className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 sm:p-4 border-2 border-red-300 dark:border-red-700"
                      >
                        <div className="flex items-start gap-2 sm:gap-3">
                          <span className="text-xl sm:text-2xl flex-shrink-0">🌸</span>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                              {plant.name}
                            </h3>
                            {plant.variety && (
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                                {plant.variety}
                              </p>
                            )}
                            <div className="mt-2 space-y-1">
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {plant.plot_name} → Rząd {plant.row_number}
                              </p>
                              {plant.years_old && (
                                <p className="text-xs font-semibold text-red-700 dark:text-red-300">
                                  ⏰ {plant.years_old} {plant.years_old === 1 ? 'rok' : 'lat'}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Soon Division */}
            {soonPerennials.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-400 p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Clock className="text-white flex-shrink-0" size={20} />
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base sm:text-xl font-bold text-white truncate">
                        Wkrótce do podziału
                      </h2>
                      <p className="text-yellow-100 text-xs sm:text-sm">
                        {soonPerennials.length} {soonPerennials.length === 1 ? 'bylina' : 'bylin'} (3-4 lata)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 sm:p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {soonPerennials.map(plant => (
                      <div
                        key={plant.id}
                        className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 sm:p-4 border border-yellow-300 dark:border-yellow-700"
                      >
                        <div className="flex items-start gap-2 sm:gap-3">
                          <span className="text-xl sm:text-2xl flex-shrink-0">🌸</span>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                              {plant.name}
                            </h3>
                            {plant.variety && (
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                                {plant.variety}
                              </p>
                            )}
                            <div className="mt-2 space-y-1">
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {plant.plot_name} → Rząd {plant.row_number}
                              </p>
                              {plant.years_old && (
                                <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">
                                  ⏰ {plant.years_old} {plant.years_old === 1 ? 'rok' : 'lata'}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Good Condition */}
            {goodPerennials.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle className="text-white flex-shrink-0" size={20} />
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base sm:text-xl font-bold text-white truncate">
                        W dobrej kondycji
                      </h2>
                      <p className="text-green-100 text-xs sm:text-sm">
                        {goodPerennials.length} {goodPerennials.length === 1 ? 'bylina' : 'bylin'} ({'<'} 3 lata)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 sm:p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {goodPerennials.map(plant => (
                      <div
                        key={plant.id}
                        className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 sm:p-4 border border-green-300 dark:border-green-700"
                      >
                        <div className="flex items-start gap-2 sm:gap-3">
                          <span className="text-xl sm:text-2xl flex-shrink-0">🌸</span>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                              {plant.name}
                            </h3>
                            {plant.variety && (
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                                {plant.variety}
                              </p>
                            )}
                            <div className="mt-2 space-y-1">
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {plant.plot_name} → Rząd {plant.row_number}
                              </p>
                              {plant.years_old !== null && (
                                <p className="text-xs font-semibold text-green-700 dark:text-green-300">
                                  ✓ {plant.years_old} {plant.years_old === 1 ? 'rok' : plant.years_old < 5 ? 'lata' : 'lat'}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Unknown Age */}
            {unknownPerennials.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">
                  Byliny bez daty sadzenia ({unknownPerennials.length})
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Dodaj datę sadzenia, aby śledzić wiek roślin
                </p>
                <div className="flex flex-wrap gap-2">
                  {unknownPerennials.map(plant => (
                    <span
                      key={plant.id}
                      className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm text-gray-700 dark:text-gray-300"
                    >
                      🌸 {plant.name}
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

export default PropagationTracking;
