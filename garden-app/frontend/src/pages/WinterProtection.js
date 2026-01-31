import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Snowflake, Shield, AlertTriangle, CheckCircle2, Plus, Info, AlertCircle, Calendar } from 'lucide-react';
import usePlotDetails from '../hooks/usePlotDetails';
import PlanForm from '../components/PlanForm';
import axios from '../config/axios';

// Protection recommendations moved outside component to prevent re-creation
const PROTECTION_RECOMMENDATIONS = {
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
  ],
  'tree_ornamental': [
    'Bielenie pni wapnem',
    'Owijanie młodych drzew agrowłókniną',
    'Ściółkowanie wokół pnia (10-15cm)'
  ],
  'shrub_ornamental': [
    'Ściółkowanie korzeni korą lub liśćmi',
    'Okrycie agrowłókniną wrażliwych gatunków',
    'Owijanie krzewów jutą (np. różaneczniki)'
  ],
  'climber': [
    'Owijanie pędów agrowłókniną',
    'Ściółkowanie podstawy rośliny',
    'Ochrona młodych pędów przed mrozem'
  ],
  'groundcover': [
    'Ściółkowanie liśćmi lub korą',
    'Okrycie agrowłókniną wrażliwych gatunków'
  ],
  'fern': [
    'Ściółkowanie liśćmi (15-20cm)',
    'Pozostawienie suchych liści jako naturalnej ochrony',
    'Okrycie agrowłókniną w surowym klimacie'
  ],
  'succulent': [
    'Przeniesienie do pomieszczenia (większość gatunków)',
    'Ograniczenie podlewania',
    'Temperatura min. 5°C dla zimujących na zewnątrz'
  ]
};

const getProtectionRecommendations = (category) => {
  return PROTECTION_RECOMMENDATIONS[category] || ['Sprawdź wymagania dla tego gatunku'];
};

/**
 * Winter Protection - Zabezpieczanie roślin na zimę
 *
 * Pomaga śledzić, które rośliny zostały zabezpieczone na zimę
 */
const WinterProtection = () => {
  const navigate = useNavigate();
  const { beds, loading, error, refetch } = usePlotDetails();
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planPrefill, setPlanPrefill] = useState(null);
  const [plots, setPlots] = useState([]);
  const [userFrostInfo, setUserFrostInfo] = useState(null);

  // Pobierz listę poletek i dane o przymrozkach użytkownika
  useEffect(() => {
    axios.get('/api/plots')
      .then(res => setPlots(res.data))
      .catch(() => setPlots([]));

    // Pobierz datę pierwszego przymrozku jesiennego użytkownika
    axios.get('/api/auth/profile')
      .then(res => {
        if (res.data) {
          setUserFrostInfo({
            firstFrost: res.data.first_frost_date,
            lastFrost: res.data.last_frost_date,
            zone: res.data.hardiness_zone
          });
        }
      })
      .catch(() => {});
  }, []);

  // Obsługa planowania zabezpieczenia rośliny
  const handlePlanProtection = (plant, actionType = 'protect') => {
    const now = new Date();
    const month = now.getMonth() + 1;
    let plannedDate;

    // Użyj daty pierwszego przymrozku użytkownika jeśli dostępna
    if (userFrostInfo?.firstFrost) {
      const frostDate = new Date(userFrostInfo.firstFrost);
      // Ustaw datę na 2 tygodnie przed przymrozkiem (czas na zabezpieczenie)
      const twoWeeksBefore = new Date(frostDate);
      twoWeeksBefore.setDate(twoWeeksBefore.getDate() - 14);

      // Jeśli ta data już minęła w tym roku, ustaw na za tydzień
      if (twoWeeksBefore < now) {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        plannedDate = nextWeek.toISOString().split('T')[0];
      } else {
        plannedDate = twoWeeksBefore.toISOString().split('T')[0];
      }
    } else if (month >= 10 && month <= 11) {
      // W sezonie - za tydzień
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      plannedDate = nextWeek.toISOString().split('T')[0];
    } else {
      // Poza sezonem - 15 października tego lub następnego roku
      const year = month > 11 ? now.getFullYear() + 1 : now.getFullYear();
      plannedDate = `${year}-10-15`;
    }

    const title = actionType === 'dig_up'
      ? `Wykopać ${plant.name}`
      : `Zabezpieczyć ${plant.name} na zimę`;

    setPlanPrefill({
      action_type: actionType,
      title,
      planned_date: plannedDate,
      plant_id: plant.plant_id || null,
      bed_id: plant.id,
      plot_id: plant.plot_id || '',
      notes: `${plant.plot_name} → Rząd ${plant.row_number}`,
      weather_dependent: true,
      reminder_days: 7
    });
    setShowPlanForm(true);
  };

  const handlePlanSuccess = () => {
    setShowPlanForm(false);
    setPlanPrefill(null);
  };

  // Filter plants that need winter protection
  const plants = useMemo(() => {
    const winterCategories = [
      'flower_perennial', 'flower_bulb', 'fruit_tree', 'fruit_bush', 'herb',
      'tree_ornamental', 'shrub_ornamental', 'climber', 'groundcover', 'fern', 'succulent'
    ];
    return beds.filter(bed =>
      bed.plant_name && winterCategories.includes(bed.category)
    ).map(bed => ({
      id: bed.id,
      plant_id: bed.plant_id,
      plot_id: bed.plot_id,
      name: bed.plant_name,
      variety: bed.plant_variety,
      category: bed.category,
      plot_name: bed.plot_name,
      row_number: bed.row_number,
      note: bed.note
    }));
  }, [beds]);

  /**
   * Get category name in Polish
   */
  const getCategoryName = (category) => {
    const names = {
      'flower_perennial': 'Byliny',
      'flower_bulb': 'Cebulowe',
      'fruit_tree': 'Drzewa owocowe',
      'fruit_bush': 'Krzewy owocowe',
      'herb': 'Zioła wieloletnie',
      'tree_ornamental': 'Drzewa ozdobne',
      'shrub_ornamental': 'Krzewy ozdobne',
      'climber': 'Pnącza',
      'groundcover': 'Rośliny okrywowe',
      'fern': 'Paprocie',
      'succulent': 'Sukulenty'
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
      'herb': '🌿',
      'tree_ornamental': '🌲',
      'shrub_ornamental': '🌺',
      'climber': '🪴',
      'groundcover': '🍀',
      'fern': '☘️',
      'succulent': '🌵'
    };

    return emojis[category] || '🌱';
  };

  /**
   * Get current month with memoization to avoid redundant Date() calls
   */
  const currentMonth = useMemo(() => new Date().getMonth() + 1, []); // 1-12

  /**
   * Check if it's winter protection season (October-November)
   */
  const isProtectionSeason = useMemo(() =>
    currentMonth >= 10 && currentMonth <= 11,
    [currentMonth]
  );

  /**
   * Check if it's time to remove protection (March-April)
   */
  const isRemovalSeason = useMemo(() =>
    currentMonth >= 3 && currentMonth <= 4,
    [currentMonth]
  );

  /**
   * Group plants by category with memoization
   */
  const plantsByCategory = useMemo(() =>
    plants.reduce((acc, plant) => {
      if (!acc[plant.category]) {
        acc[plant.category] = [];
      }
      acc[plant.category].push(plant);
      return acc;
    }, {}),
    [plants]
  );

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
                {isProtectionSeason ? 'Październik-Listopad' : isRemovalSeason ? 'Marzec-Kwiecień' : 'Poza sezonem'}
              </div>
              <div className="text-xs text-blue-100">Sezon</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              {userFrostInfo?.firstFrost ? (
                <>
                  <div className="text-2xl font-bold">
                    {Math.max(0, Math.ceil((new Date(userFrostInfo.firstFrost) - new Date()) / (1000 * 60 * 60 * 24)))} dni
                  </div>
                  <div className="text-xs text-blue-100">Do przymrozku ({new Date(userFrostInfo.firstFrost).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })})</div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">-5°C</div>
                  <div className="text-xs text-blue-100">Temperatura krytyczna</div>
                </>
              )}
            </div>
          </div>

          {/* Frost Date Info */}
          {userFrostInfo?.firstFrost && (
            <div className="mt-4 p-3 bg-white/10 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={16} />
                <span>
                  Twoja data pierwszego przymrozku jesiennego: <strong>{new Date(userFrostInfo.firstFrost).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}</strong>
                  {userFrostInfo.zone && <span className="ml-2 px-2 py-0.5 bg-white/20 rounded text-xs">Strefa {userFrostInfo.zone}</span>}
                </span>
              </div>
            </div>
          )}
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

        {/* Season Alert */}
        {isProtectionSeason && (
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

        {isRemovalSeason && (
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
                            {/* Przyciski planowania */}
                            <div className="mt-3 flex flex-wrap gap-2">
                              {plant.category === 'flower_bulb' ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handlePlanProtection(plant, 'dig_up')}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/30 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                                  >
                                    <Calendar size={12} />
                                    Zaplanuj wykopanie
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handlePlanProtection(plant, 'protect')}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                >
                                  <Calendar size={12} />
                                  Zaplanuj zabezpieczenie
                                </button>
                              )}
                            </div>
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
            Zaplanuj zabezpieczanie w Planerze
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Użyj Planera ogrodnika, aby zaplanować zabezpieczenie wszystkich roślin z przypomnieniami
          </p>
          <button
            type="button"
            onClick={() => navigate('/planner')}
            aria-label="Przejdź do Planera"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Calendar size={20} />
            Przejdź do Planera
          </button>
        </div>
      </div>

      {/* Modal formularza planowania */}
      <PlanForm
        isOpen={showPlanForm}
        onClose={() => {
          setShowPlanForm(false);
          setPlanPrefill(null);
        }}
        onSuccess={handlePlanSuccess}
        plots={plots}
        prefillData={planPrefill}
      />
    </div>
  );
};

export default WinterProtection;
