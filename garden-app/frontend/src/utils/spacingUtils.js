/**
 * Parsuj rozstaw roślin z tekstu (np. "50x60 cm", "30 cm", "50-60 cm")
 * @param {string} spacingStr - Tekst z informacją o rozstawie
 * @returns {{ row: number, plant: number } | null} Rozstaw w cm lub null
 */
export const parseSpacing = (spacingStr) => {
  if (!spacingStr) return null;

  const str = spacingStr.toLowerCase();
  // Wzorzec "50x60 cm" lub "50 x 60 cm" lub "50-60 cm"
  const match = str.match(/(\d+)[\sx-]+(\d+)?\s*cm/i);
  if (match) {
    return {
      row: parseInt(match[1]),
      plant: parseInt(match[2] || match[1])
    };
  }
  // Wzorzec "30 cm"
  const singleMatch = str.match(/(\d+)\s*cm/i);
  if (singleMatch) {
    const val = parseInt(singleMatch[1]);
    return { row: val, plant: val };
  }
  return null;
};

/**
 * Oblicz średni rozstaw w cm
 * @param {string} spacingStr - Tekst z informacją o rozstawie
 * @param {number} defaultCm - Wartość domyślna
 * @returns {number} Rozstaw w cm
 */
export const getAverageSpacing = (spacingStr, defaultCm = 30) => {
  const parsed = parseSpacing(spacingStr);
  if (!parsed) return defaultCm;
  return Math.round((parsed.row + parsed.plant) / 2);
};

/**
 * Oblicz ile roślin zmieści się na grządce
 * @param {{ row: number, plant: number }} spacing - Rozstaw
 * @param {number} lengthCm - Długość grządki w cm
 * @param {number} widthCm - Szerokość grządki w cm
 * @returns {{ rows: number, plantsPerRow: number, total: number }}
 */
export const calculatePlantCount = (spacing, lengthCm, widthCm) => {
  if (!spacing || !lengthCm || !widthCm) return null;
  const rows = Math.floor(widthCm / spacing.row);
  const plantsPerRow = Math.floor(lengthCm / spacing.plant);
  return {
    rows,
    plantsPerRow,
    total: rows * plantsPerRow
  };
};
