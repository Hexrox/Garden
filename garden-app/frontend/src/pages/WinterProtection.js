import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import { Snowflake, Shield, AlertTriangle, CheckCircle2, Plus, Info } from 'lucide-react';

/**
 * Winter Protection - Zabezpieczanie roślin na zimę
 *
 * Pomaga śledzić, które rośliny zostały zabezpieczone na zimę
 */
const WinterProtection = () => {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // all, protected, unprotected

  useEffect(() => {
    fetchPlants();
  }, []);

  const fetchPlants = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/plots');

      // Extract all beds from all plots
      const allPlants = [];
      for (const plot of response.data) {
        const detailsResponse = await axios.get(`/api/plots/${plot.id}/details`);
        const beds = detailsResponse.data.beds || [];

        // Filter plants that need winter protection
        const needsProtection = beds.filter(bed =>
          bed.plant_name &&
          (bed.category === 'flower_perennial' ||
           bed.category === 'flower_bulb' ||
           bed.category === 'fruit_tree' ||
           bed.category === 'fruit_bush' ||
           bed.category === 'herb')
        );

        needsProtection.forEach(bed => {
          allPlants.push({
            id: bed.id,
            name: bed.plant_name,
            variety: bed.plant_variety,
            category: bed.category,
            plot_name: plot.name,
            row_number: bed.row_number,
            note: bed.note
          });
        });
      }

      setPlants(allPlants);
    } catch (err) {
      console.error('Error fetching plants:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get protection recommendations based on plant category
   */
  const getProtectionRecommendations = (category) => {
    const recommendations = {
      'flower_perennial': [
        'Ściółkowanie korą lub liśćmi (10-15cm)',
        'Okrycie agrowłókniną dla wrażliwych gatunków',
        'Cięcie suchych pędów (zostawić 5-10cm)'
      ],
      'flower_bulb': [
        'Wykopanie wrażliwych cebul (dalie, begonie, kanny)',
        'Przechowywanie w piwnicy w suchym piasku/torfie',
        'Temperatura 5-10°C'
      ],
      'fruit_tree': [
        'Bielenie pni wapnem (ochrona przed mrozem)',
        'Owijanie młodych drzew agrowłókniną',
        'Okrycie podstawy kopczykiem ziemi'
      ],
      'fruit_bush': [
        'Ściółkowanie korzeni korą',
        'Przygięcie do ziemi i okrycie (maliny)',
        'Owijanie wrażliwych krzewów (np. borówki)'
      ],
      'herb': [
        'Ściółkowanie wieloletnich ziół',
        'Przeniesienie doniczek do pomieszczenia (bazylia, rozmaryn)',
        'Okrycie agrowłókniną (szałwia, tymianek)'
      ]
    };

    return recommendations[category] || ['Sprawdź wymagania dla tego gatunku'];
  };

  /**
   * Get category name in Polish
   */
  const getCategoryName = (category) => {
    const names = {
      'flower_perennial': 'Byliny',
      'flower_bulb': 'Cebulowe',
      'fruit_tree': 'Drzewa owocowe',
      'fruit_bush': 'Krzewy owocowe',
      'herb': 'Zioła wieloletnie'
    };

    return names[category] || category;
  };

  /**
   * Get category emoji
   */
  const getCategoryEmoji = (category) => {
    const emojis = {
      'flower_perennial': '🌸',
      'flower_bulb': '🌷',
      'fruit_tree': '🌳',
      'fruit_bush': '🍇',
      'herb': '🌿'
    };

    return emojis[category] || '🌱';
  };

  /**
   * Get current month to show relevant advice
   */
  const getCurrentMonth = () => {
    return new Date().getMonth() + 1; // 1-12
  };

  /**
   * Check if it's winter protection season (October-November)
   */
  const isProtectionSeason = () => {
    const month = getCurrentMonth();
    return month >= 10 && month <= 11;
  };

  /**
   * Check if it's time to remove protection (March-April)
   */
  const isRemovalSeason = () => {
    const month = getCurrentMonth();
    return month >= 3 && month <= 4;
  };

  /**
   * Group plants by category
   */
  const plantsByCategory = plants.reduce((acc, plant) => {
    if (!acc[plant.category]) {
      acc[plant.category] = [];
    }
    acc[plant.category].push(plant);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Snowflake size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Zabezpieczanie na Zimę</h1>
              <p className="text-blue-100 text-sm">Chroń swoje rośliny przed mrozem</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-2xl font-bold">{plants.length}</div>
              <div className="text-xs text-blue-100">Roślin do ochrony</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-2xl font-bold">
                {Object.keys(plantsByCategory).length}
              </div>
              <div className="text-xs text-blue-100">Kategorii</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-2xl font-bold">
                {isProtectionSeason() ? 'Październik-Listopad' : isRemovalSeason() ? 'Marzec-Kwiecień' : 'Poza sezonem'}
              </div>
              <div className="text-xs text-blue-100">Sezon</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-2xl font-bold">-5°C</div>
              <div className="text-xs text-blue-100">Temperatura krytyczna</div>
            </div>
          </div>
        </div>

        {/* Season Alert */}
        {isProtectionSeason() && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-orange-600 dark:text-orange-400 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                  Czas zabezpieczyć rośliny!
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  Październik i listopad to najlepszy czas na zabezpieczenie roślin przed zimą. Zacznij od najbardziej wrażliwych gatunków.
                </p>
              </div>
            </div>
          </div>
        )}

        {isRemovalSeason() && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-green-600 dark:text-green-400 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100">
                  Czas usunąć zabezpieczenia!
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Marzec i kwiecień to pora na stopniowe odkrywanie roślin. Usuń okrycia zimowe, gdy minie ryzyko silnych przymrozków.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* General Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" size={20} />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-semibold mb-1">Ogólne zasady zabezpieczania</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                <li>Zabezpieczaj gdy temperatura spada poniżej -5°C</li>
                <li>Nie okrywaj zbyt wcześnie - rośliny muszą się zahartować</li>
                <li>Usuń zabezpieczenia stopniowo wiosną</li>
                <li>Ściółka chroni korzenie, agrowłóknina nadziemne części</li>
                <li>Młode rośliny potrzebują więcej ochrony niż dojrzałe</li>
              </ul>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Ładowanie...</p>
          </div>
        ) : plants.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <Snowflake size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Brak roślin wymagających ochrony
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Twoje rośliny roczne nie wymagają zabezpieczenia zimowego
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Plants by Category */}
            {Object.entries(plantsByCategory).map(([category, categoryPlants]) => (
              <div key={category} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                {/* Category Header */}
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getCategoryEmoji(category)}</span>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-white">
                        {getCategoryName(category)}
                      </h2>
                      <p className="text-blue-100 text-sm">
                        {categoryPlants.length} {categoryPlants.length === 1 ? 'roślina' : 'roślin'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Protection Recommendations */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Shield size={18} className="text-blue-600 dark:text-blue-400" />
                    Zalecana ochrona
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    {getProtectionRecommendations(category).map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>

                {/* Plants List */}
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {categoryPlants.map(plant => (
                      <div
                        key={plant.id}
                        className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{getCategoryEmoji(plant.category)}</span>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {plant.name}
                            </h3>
                            {plant.variety && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {plant.variety}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              {plant.plot_name} → Rząd {plant.row_number}
                            </p>
                            {plant.note && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
                                {plant.note}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Zapisz postępy zabezpieczania
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Użyj sekcji Zadania, aby utworzyć listę kontrolną zabezpieczenia wszystkich roślin
          </p>
          <button
            onClick={() => window.location.href = '/tasks'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Przejdź do Zadań
          </button>
        </div>
      </div>
    </div>
  );
};

export default WinterProtection;
