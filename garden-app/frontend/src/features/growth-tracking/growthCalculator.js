/**
 * Growth Calculator
 *
 * Calculates plant growth progress, stages, and harvest predictions
 */

/**
 * Calculate growth progress for a plant
 * @param {string} plantedDate - ISO date string when plant was planted
 * @param {number} daysToHarvest - Expected days until harvest
 * @returns {Object} Growth progress data
 */
export const calculateGrowthProgress = (plantedDate, daysToHarvest) => {
  if (!plantedDate || !daysToHarvest) {
    return {
      progress: 0,
      daysElapsed: 0,
      daysRemaining: daysToHarvest || 0,
      currentStage: getGrowthStages()[0],
      isReady: false,
      isOverdue: false,
    };
  }

  const today = new Date();
  const planted = new Date(plantedDate);
  const daysElapsed = Math.floor((today - planted) / (1000 * 60 * 60 * 24));
  const progress = Math.min((daysElapsed / daysToHarvest) * 100, 100);
  const daysRemaining = Math.max(daysToHarvest - daysElapsed, 0);
  const isOverdue = daysElapsed > daysToHarvest;

  const stages = getGrowthStages();
  const currentStage = stages.findLast(s => progress >= s.threshold) || stages[0];

  return {
    progress,
    daysElapsed,
    daysRemaining,
    currentStage,
    isReady: progress >= 100,
    isOverdue,
    variant: getProgressVariant(progress, isOverdue),
  };
};

/**
 * Get growth stages with thresholds
 * @returns {Array} Array of growth stage objects
 */
export const getGrowthStages = () => [
  {
    name: 'Kiełkowanie',
    threshold: 0,
    icon: '🌱',
    description: 'Nasiona kiełkują',
  },
  {
    name: 'Wzrost',
    threshold: 25,
    icon: '🌿',
    description: 'Roślina intensywnie rośnie',
  },
  {
    name: 'Dojrzewanie',
    threshold: 60,
    icon: '🌾',
    description: 'Roślina dojrzewa',
  },
  {
    name: 'Gotowe',
    threshold: 100,
    icon: '✅',
    description: 'Gotowe do zbioru!',
  },
];

/**
 * Get progress bar variant based on progress
 * @param {number} progress - Progress percentage
 * @param {boolean} isOverdue - Whether harvest is overdue
 * @returns {string} Variant name
 */
export const getProgressVariant = (progress, isOverdue) => {
  if (isOverdue) return 'danger';
  if (progress >= 100) return 'success';
  if (progress >= 80) return 'warning';
  return 'primary';
};

/**
 * Format days remaining text
 * @param {number} days - Number of days
 * @returns {string} Formatted text
 */
export const formatDaysRemaining = (days) => {
  if (days === 0) return 'Dziś!';
  if (days === 1) return 'Jutro';
  if (days < 0) return `Spóźnione ${Math.abs(days)} dni`;
  if (days <= 7) return `Za ${days} dni`;
  if (days <= 30) return `Za ${Math.floor(days / 7)} tygodni`;
  return `Za ${Math.floor(days / 30)} miesięcy`;
};

/**
 * Get harvest status
 * @param {number} daysRemaining - Days until harvest
 * @returns {string} Status: 'ready', 'soon', 'growing', 'overdue'
 */
export const getHarvestStatus = (daysRemaining) => {
  if (daysRemaining < 0) return 'overdue';
  if (daysRemaining === 0) return 'ready';
  if (daysRemaining <= 7) return 'soon';
  return 'growing';
};
