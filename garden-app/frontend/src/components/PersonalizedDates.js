import React from 'react';
import { Calendar, Thermometer, AlertTriangle, Snowflake, Sun } from 'lucide-react';

/**
 * Calculate personalized planting dates based on user's frost dates and plant category
 * Uses typical timing offsets for Polish climate zones (6a-7b)
 */
const isValidDate = (date) => {
  return date instanceof Date && !isNaN(date.getTime());
};

const calculatePlantingDates = (plant, lastFrostDate, firstFrostDate) => {
  if (!lastFrostDate) return null;

  const lastFrost = new Date(lastFrostDate);
  if (!isValidDate(lastFrost)) return null;

  const firstFrost = firstFrostDate ? new Date(firstFrostDate) : null;
  if (firstFrost && !isValidDate(firstFrost)) return null;

  const category = plant.category || 'vegetable';

  // Typical timing offsets (weeks relative to last frost)
  const timings = {
    // Vegetables
    vegetable: {
      indoor: { weeks: -8, label: 'Wysiew pod osłonami' },
      outdoor: { weeks: 2, label: 'Sadzenie na zewnątrz' },
      directSow: { weeks: 0, label: 'Wysiew bezpośredni' }
    },
    herb: {
      indoor: { weeks: -6, label: 'Wysiew w domu' },
      outdoor: { weeks: 2, label: 'Sadzenie na zewnątrz' }
    },
    // Flowers
    flower_annual: {
      indoor: { weeks: -8, label: 'Wysiew w domu' },
      outdoor: { weeks: 2, label: 'Sadzenie na zewnątrz' }
    },
    flower_perennial: {
      outdoor: { weeks: 2, label: 'Sadzenie sadzonek' },
      autumn: { weeks: null, label: 'Sadzenie jesienne' } // September
    },
    flower_bulb: {
      spring: { weeks: null, label: 'Sadzenie cebul wiosennych' }, // October-November
      autumn: { weeks: 2, label: 'Sadzenie cebul letnich' }
    },
    // Trees and shrubs
    fruit_tree: {
      spring: { weeks: -2, label: 'Sadzenie wiosenne' },
      autumn: { weeks: null, label: 'Sadzenie jesienne' }
    },
    fruit_bush: {
      spring: { weeks: -2, label: 'Sadzenie wiosenne' },
      autumn: { weeks: null, label: 'Sadzenie jesienne' }
    },
    tree_ornamental: {
      spring: { weeks: -2, label: 'Sadzenie wiosenne' },
      autumn: { weeks: null, label: 'Sadzenie jesienne' }
    },
    shrub_ornamental: {
      spring: { weeks: -2, label: 'Sadzenie wiosenne' },
      autumn: { weeks: null, label: 'Sadzenie jesienne' }
    },
    // Others
    climber: {
      outdoor: { weeks: 2, label: 'Sadzenie' }
    },
    grass: {
      spring: { weeks: 0, label: 'Sadzenie wiosenne' },
      autumn: { weeks: null, label: 'Sadzenie jesienne' }
    },
    groundcover: {
      outdoor: { weeks: 2, label: 'Sadzenie' }
    },
    fern: {
      outdoor: { weeks: 2, label: 'Sadzenie' }
    },
    succulent: {
      outdoor: { weeks: 4, label: 'Wystawianie na zewnątrz' }
    }
  };

  const plantTiming = timings[category] || timings.vegetable;
  const dates = [];

  // Special handling for specific plants based on name
  const plantName = (plant.display_name || plant.name || '').toLowerCase();

  // Cold-hardy vegetables that can be sown earlier
  const coldHardy = ['groch', 'sałata', 'szpinak', 'rzodkiewka', 'marchew', 'cebula', 'czosnek', 'bob', 'kapusta', 'brokuł', 'kalafior'];
  const warmLoving = ['pomidor', 'papryka', 'ogórek', 'dynia', 'cukinia', 'bakłażan', 'fasola', 'kukurydza'];

  const isColdHardy = coldHardy.some(name => plantName.includes(name));
  const isWarmLoving = warmLoving.some(name => plantName.includes(name));

  // Calculate dates based on timing type
  Object.entries(plantTiming).forEach(([type, timing]) => {
    if (timing.weeks !== null) {
      const date = new Date(lastFrost);
      let weeksOffset = timing.weeks;

      // Adjust for cold-hardy vs warm-loving
      if (isColdHardy && type === 'outdoor') {
        weeksOffset -= 2; // 2 weeks earlier
      }
      if (isWarmLoving && type === 'outdoor') {
        weeksOffset += 1; // 1 week later for safety
      }

      date.setDate(date.getDate() + (weeksOffset * 7));
      dates.push({
        type,
        label: timing.label,
        date: date,
        isRecommended: type === 'outdoor' || type === 'spring'
      });
    } else {
      // Autumn dates - use first frost or estimate
      if (type === 'autumn' && firstFrost) {
        const date = new Date(firstFrost);
        date.setDate(date.getDate() - 42); // 6 weeks before first frost
        dates.push({
          type,
          label: timing.label,
          date: date,
          isRecommended: false
        });
      } else if (type === 'spring' && category === 'flower_bulb') {
        // Spring-flowering bulbs planted in October-November
        const year = lastFrost.getFullYear();
        dates.push({
          type,
          label: timing.label,
          date: new Date(year - 1, 9, 15), // October 15 of previous year
          isRecommended: false,
          note: 'październik-listopad poprzedniego roku'
        });
      }
    }
  });

  return dates.sort((a, b) => a.date - b.date);
};

const formatDate = (date) => {
  return date.toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long'
  });
};

const getSeasonIcon = (date) => {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return <Sun className="w-4 h-4 text-yellow-500" />;
  if (month >= 5 && month <= 7) return <Sun className="w-4 h-4 text-orange-500" />;
  if (month >= 8 && month <= 10) return <Snowflake className="w-4 h-4 text-blue-400" />;
  return <Snowflake className="w-4 h-4 text-blue-600" />;
};

const PersonalizedDates = ({ plant, lastFrostDate, firstFrostDate, compact = false }) => {
  if (!lastFrostDate) {
    return compact ? null : (
      <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>Ustaw datę ostatniego przymrozku w profilu, aby zobaczyć personalizowane daty sadzenia.</span>
        </div>
      </div>
    );
  }

  const dates = calculatePlantingDates(plant, lastFrostDate, firstFrostDate);

  if (!dates || dates.length === 0) return null;

  if (compact) {
    // Compact view for PlantCard or quick info
    const mainDate = dates.find(d => d.isRecommended) || dates[0];
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <Calendar className="w-3 h-3 text-green-600" />
        <span className="text-gray-600 dark:text-gray-400">
          {mainDate.label}: <span className="font-medium text-gray-900 dark:text-white">{formatDate(mainDate.date)}</span>
        </span>
      </div>
    );
  }

  // Full view for PlantDetailModal
  return (
    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-green-100 dark:bg-green-800 rounded-lg">
          <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h4 className="font-semibold text-green-900 dark:text-green-100 text-sm">
            Personalizowane daty sadzenia
          </h4>
          <p className="text-xs text-green-700 dark:text-green-300">
            Na podstawie Twojej lokalizacji
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {dates.map((item, idx) => (
          <div
            key={idx}
            className={`flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-2.5 rounded-lg gap-1 sm:gap-2 ${
              item.isRecommended
                ? 'bg-white dark:bg-gray-800 shadow-sm border border-green-200 dark:border-green-700'
                : 'bg-green-100/50 dark:bg-green-900/30'
            }`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              {getSeasonIcon(item.date)}
              <span className={`text-xs sm:text-sm ${
                item.isRecommended
                  ? 'font-medium text-gray-900 dark:text-white'
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                {item.label}
              </span>
              {item.isRecommended && (
                <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 text-xs rounded">
                  zalecane
                </span>
              )}
            </div>
            <div className="text-left sm:text-right pl-6 sm:pl-0">
              <span className={`text-xs sm:text-sm ${
                item.isRecommended
                  ? 'font-semibold text-green-700 dark:text-green-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {item.note || formatDate(item.date)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-green-700 dark:text-green-300">
          <div className="flex items-center gap-1">
            <Thermometer className="w-3 h-3 flex-shrink-0" />
            <span>Ostatni przymrozek: {formatDate(new Date(lastFrostDate))}</span>
          </div>
          {firstFrostDate && (
            <span className="pl-4 sm:pl-0">• Pierwszy przymrozek: {formatDate(new Date(firstFrostDate))}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalizedDates;
