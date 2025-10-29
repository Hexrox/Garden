const fs = require('fs');
const path = require('path');

// Load harvest data
const harvestDataPath = path.join(__dirname, '../data/harvest_data.json');
let harvestData = {};

try {
  const rawData = fs.readFileSync(harvestDataPath, 'utf8');
  harvestData = JSON.parse(rawData);
} catch (error) {
  console.error('Error loading harvest data:', error.message);
}

/**
 * Calculate expected harvest date based on plant name and planted date
 * @param {string} plantName - Name of the plant
 * @param {string} plantedDate - Date when plant was planted (YYYY-MM-DD)
 * @returns {object} { expectedDate, daysToHarvest, range } or null
 */
function calculateHarvestDate(plantName, plantedDate) {
  if (!plantName || !plantedDate) {
    return null;
  }

  // Normalize plant name (lowercase, trim)
  const normalizedName = plantName.toLowerCase().trim();

  // Find plant data
  const plantData = harvestData.vegetables[normalizedName];

  if (!plantData) {
    // No data for this plant
    return null;
  }

  // Parse planted date
  const planted = new Date(plantedDate);
  if (isNaN(planted.getTime())) {
    return null;
  }

  // Calculate expected harvest date
  const expectedDate = new Date(planted);
  expectedDate.setDate(expectedDate.getDate() + plantData.daysToHarvest);

  // Calculate range (min/max dates)
  const minDate = new Date(planted);
  minDate.setDate(minDate.getDate() + plantData.rangeMin);

  const maxDate = new Date(planted);
  maxDate.setDate(maxDate.getDate() + plantData.rangeMax);

  return {
    expectedDate: expectedDate.toISOString().split('T')[0],
    minDate: minDate.toISOString().split('T')[0],
    maxDate: maxDate.toISOString().split('T')[0],
    daysToHarvest: plantData.daysToHarvest,
    range: {
      min: plantData.rangeMin,
      max: plantData.rangeMax
    },
    notes: plantData.notes
  };
}

/**
 * Get days until harvest from today
 * @param {string} expectedHarvestDate - Expected harvest date (YYYY-MM-DD)
 * @returns {number} Days until harvest (negative if overdue)
 */
function getDaysUntilHarvest(expectedHarvestDate) {
  if (!expectedHarvestDate) {
    return null;
  }

  const expected = new Date(expectedHarvestDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = expected - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Get harvest status
 * @param {string} expectedHarvestDate - Expected harvest date
 * @param {string} actualHarvestDate - Actual harvest date (if harvested)
 * @returns {string} 'harvested', 'ready', 'soon', 'growing', 'overdue'
 */
function getHarvestStatus(expectedHarvestDate, actualHarvestDate) {
  if (actualHarvestDate) {
    return 'harvested';
  }

  if (!expectedHarvestDate) {
    return 'unknown';
  }

  const daysUntil = getDaysUntilHarvest(expectedHarvestDate);

  if (daysUntil < 0) {
    return 'overdue';
  } else if (daysUntil === 0) {
    return 'ready';
  } else if (daysUntil <= 7) {
    return 'soon';
  } else {
    return 'growing';
  }
}

/**
 * Get all available plants with harvest data
 * @returns {array} Array of plant names
 */
function getAvailablePlants() {
  return Object.keys(harvestData.vegetables).map(key => ({
    name: key,
    displayName: harvestData.vegetables[key].name,
    daysToHarvest: harvestData.vegetables[key].daysToHarvest
  }));
}

/**
 * Get plant info
 * @param {string} plantName - Name of the plant
 * @returns {object} Plant data or null
 */
function getPlantInfo(plantName) {
  const normalizedName = plantName.toLowerCase().trim();
  const plantData = harvestData.vegetables[normalizedName];

  if (!plantData) {
    return null;
  }

  return {
    name: normalizedName,
    displayName: plantData.name,
    daysToHarvest: plantData.daysToHarvest,
    rangeMin: plantData.rangeMin,
    rangeMax: plantData.rangeMax,
    notes: plantData.notes
  };
}

module.exports = {
  calculateHarvestDate,
  getDaysUntilHarvest,
  getHarvestStatus,
  getAvailablePlants,
  getPlantInfo
};
