import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import { Flower2, Info, Calendar } from 'lucide-react';

/**
 * Bloom Timeline - Wizualizacja kwitnienia przez cały rok
 *
 * Pokazuje wykres w stylu Gantt chart z kwitnieniem wszystkich kwiatów w ogrodzie
 */
const BloomTimeline = () => {
  const [flowers, setFlowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(null);

  const months = [
    { num: 1, name: 'Styczeń', short: 'Sty' },
    { num: 2, name: 'Luty', short: 'Lut' },
    { num: 3, name: 'Marzec', short: 'Mar' },
    { num: 4, name: 'Kwiecień', short: 'Kwi' },
    { num: 5, name: 'Maj', short: 'Maj' },
    { num: 6, name: 'Czerwiec', short: 'Cze' },
    { num: 7, name: 'Lipiec', short: 'Lip' },
    { num: 8, name: 'Sierpień', short: 'Sie' },
    { num: 9, name: 'Wrzesień', short: 'Wrz' },
    { num: 10, name: 'Październik', short: 'Paź' },
    { num: 11, name: 'Listopad', short: 'Lis' },
    { num: 12, name: 'Grudzień', short: 'Gru' }
  ];

  const monthNameToNumber = {
    'styczeń': 1, 'stycznia': 1,
    'luty': 2, 'lutego': 2,
    'marzec': 3, 'marca': 3,
    'kwiecień': 4, 'kwietnia': 4,
    'maj': 5, 'maja': 5,
    'czerwiec': 6, 'czerwca': 6,
    'lipiec': 7, 'lipca': 7,
    'sierpień': 8, 'sierpnia': 8,
    'wrzesień': 9, 'września': 9,
    'październik': 10, 'października': 10,
    'listopad': 11, 'listopada': 11,
    'grudzień': 12, 'grudnia': 12
  };

  useEffect(() => {
    fetchFlowers();
  }, []);

  const fetchFlowers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/plots');

      // Extract all beds from all plots
      const allFlowers = [];
      for (const plot of response.data) {
        const detailsResponse = await axios.get(`/api/plots/${plot.id}/details`);
        const beds = detailsResponse.data.beds || [];

        // Filter only flowering plants
        const floweringBeds = beds.filter(bed =>
          bed.bloom_season &&
          (bed.category === 'flower_perennial' ||
           bed.category === 'flower_annual' ||
           bed.category === 'flower_bulb')
        );

        floweringBeds.forEach(bed => {
          allFlowers.push({
            id: bed.id,
            name: bed.plant_name,
            variety: bed.plant_variety,
            bloom_season: bed.bloom_season,
            flower_color: bed.flower_color,
            plot_name: plot.name,
            row_number: bed.row_number,
            category: bed.category
          });
        });
      }

      setFlowers(allFlowers);
    } catch (err) {
      console.error('Error fetching flowers:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Parse bloom season and return array of month numbers [start, end]
   * Examples: "maj-czerwiec" -> [5, 6]
   *           "lato" -> [6, 8]
   *           "czerwiec-październik" -> [6, 10]
   */
  const parseBloomSeason = (bloomSeason) => {
    if (!bloomSeason) return [];

    const season = bloomSeason.toLowerCase().trim();

    // Check for seasons
    if (season.includes('wiosna')) return [3, 5];
    if (season.includes('lato')) return [6, 8];
    if (season.includes('jesień') || season.includes('jesien')) return [9, 11];
    if (season.includes('zima')) return [12, 2];
    if (season === 'cały rok' || season === 'całoroczne') return [1, 12];

    // Parse month ranges like "maj-czerwiec"
    const parts = season.split('-');

    if (parts.length === 2) {
      const start = monthNameToNumber[parts[0].trim()];
      const end = monthNameToNumber[parts[1].trim()];

      if (start && end) {
        return [start, end];
      }
    }

    // Single month like "maj"
    const singleMonth = monthNameToNumber[season];
    if (singleMonth) {
      return [singleMonth, singleMonth];
    }

    return [];
  };

  /**
   * Check if a flower blooms in a specific month
   */
  const bloomsInMonth = (flower, monthNum) => {
    const [start, end] = parseBloomSeason(flower.bloom_season);

    if (!start || !end) return false;

    // Handle wrap-around (e.g., December-February)
    if (start > end) {
      return monthNum >= start || monthNum <= end;
    }

    return monthNum >= start && monthNum <= end;
  };

  /**
   * Get the color for the bloom bar
   */
  const getBloomColor = (flower) => {
    if (!flower.flower_color) return 'bg-pink-400';

    const color = flower.flower_color.toLowerCase().split(',')[0].trim();

    const colorMap = {
      'biały': 'bg-gray-100 border-2 border-gray-300',
      'biała': 'bg-gray-100 border-2 border-gray-300',
      'żółty': 'bg-yellow-400',
      'żółta': 'bg-yellow-400',
      'pomarańczowy': 'bg-orange-400',
      'pomarańczowa': 'bg-orange-400',
      'czerwony': 'bg-red-500',
      'czerwona': 'bg-red-500',
      'różowy': 'bg-pink-400',
      'różowa': 'bg-pink-400',
      'fioletowy': 'bg-purple-500',
      'fioletowa': 'bg-purple-500',
      'niebieski': 'bg-blue-500',
      'niebieska': 'bg-blue-500',
      'bordowy': 'bg-red-800',
      'bordowa': 'bg-red-800',
      'wielobarwny': 'bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400',
      'wielobarwna': 'bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400'
    };

    return colorMap[color] || 'bg-pink-400';
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
   * Filter flowers by selected month
   */
  const getFlowersForMonth = (monthNum) => {
    return flowers.filter(flower => bloomsInMonth(flower, monthNum));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Flower2 size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Kalendarz Kwitnienia</h1>
              <p className="text-pink-100 text-sm">Wizualizacja kwitnienia kwiatów przez cały rok</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-2xl font-bold">{flowers.length}</div>
              <div className="text-xs text-pink-100">Kwiatów</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-2xl font-bold">
                {new Set(flowers.map(f => f.name)).size}
              </div>
              <div className="text-xs text-pink-100">Gatunków</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-2xl font-bold">
                {getFlowersForMonth(new Date().getMonth() + 1).length}
              </div>
              <div className="text-xs text-pink-100">Kwitnie teraz</div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Ładowanie...</p>
          </div>
        ) : flowers.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <Flower2 size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Brak kwiatów w ogrodzie
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Zasadź pierwsze kwiaty, aby zobaczyć kalendarz kwitnienia
            </p>
          </div>
        ) : (
          <>
            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" size={20} />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-semibold mb-1">Jak czytać wykres?</p>
                  <p>Każdy wiersz to jeden kwiat w Twoim ogrodzie. Kolorowe paski pokazują miesiące kwitnienia. Kliknij miesiąc, aby zobaczyć szczegóły.</p>
                </div>
              </div>
            </div>

            {/* Timeline Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Month Headers */}
                <div className="grid grid-cols-13 gap-px bg-gray-200 dark:bg-gray-700 border-b-2 border-gray-300 dark:border-gray-600">
                  <div className="col-span-1 bg-gray-100 dark:bg-gray-800 p-3 font-semibold text-sm text-gray-700 dark:text-gray-300">
                    Roślina
                  </div>
                  {months.map(month => (
                    <div
                      key={month.num}
                      className={`bg-gray-100 dark:bg-gray-800 p-3 text-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                        month.num === new Date().getMonth() + 1
                          ? 'bg-pink-100 dark:bg-pink-900/30 font-bold'
                          : ''
                      } ${
                        selectedMonth === month.num
                          ? 'ring-2 ring-pink-500 ring-inset'
                          : ''
                      }`}
                      onClick={() => setSelectedMonth(selectedMonth === month.num ? null : month.num)}
                    >
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {month.short}
                      </div>
                      {month.num === new Date().getMonth() + 1 && (
                        <div className="text-xs text-pink-600 dark:text-pink-400">●</div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Flower Rows */}
                {flowers.map((flower, idx) => (
                  <div
                    key={flower.id}
                    className={`grid grid-cols-13 gap-px bg-gray-200 dark:bg-gray-700 ${
                      idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900' : ''
                    }`}
                  >
                    {/* Flower Name Cell */}
                    <div className="col-span-1 bg-white dark:bg-gray-800 p-3">
                      <div className="flex items-start gap-2">
                        <span className="text-xl flex-shrink-0">
                          {getCategoryEmoji(flower.category)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {flower.name}
                          </div>
                          {flower.variety && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {flower.variety}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {flower.plot_name} / R{flower.row_number}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Month Cells with Bloom Bars */}
                    {months.map(month => {
                      const blooming = bloomsInMonth(flower, month.num);
                      return (
                        <div
                          key={month.num}
                          className={`bg-white dark:bg-gray-800 p-1 flex items-center justify-center ${
                            selectedMonth === month.num
                              ? 'ring-2 ring-pink-500 ring-inset'
                              : ''
                          }`}
                        >
                          {blooming && (
                            <div
                              className={`w-full h-8 rounded ${getBloomColor(flower)} shadow-sm`}
                              title={`${flower.name} kwitnie w ${month.name.toLowerCase()}`}
                            ></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Month Details */}
            {selectedMonth && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="text-pink-600 dark:text-pink-400" size={24} />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Kwitnienie w {months.find(m => m.num === selectedMonth)?.name.toLowerCase()}
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {getFlowersForMonth(selectedMonth).map(flower => (
                    <div
                      key={flower.id}
                      className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 flex items-start gap-3"
                    >
                      <span className="text-2xl">{getCategoryEmoji(flower.category)}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {flower.name}
                        </h3>
                        {flower.variety && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {flower.variety}
                          </p>
                        )}
                        {flower.flower_color && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className={`w-4 h-4 rounded-full ${getBloomColor(flower)}`}></div>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {flower.flower_color.split(',')[0]}
                            </span>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {flower.plot_name} → Rząd {flower.row_number}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BloomTimeline;
