/**
 * Plant Growth Database
 *
 * Domyślne czasy wzrostu dla popularnych roślin (w dniach)
 * Based on typical growth periods for Polish climate
 */

export const plantGrowthData = {
  // Warzywa owocowe
  pomidor: {
    daysToHarvest: 75,
    category: 'Warzywa owocowe',
    notes: 'Od przesadzenia rozsady, odmiany wczesne 60-70 dni, późne 80-90 dni',
  },
  papryka: {
    daysToHarvest: 70,
    category: 'Warzywa owocowe',
    notes: 'Od przesadzenia rozsady, odmiany czerwone dłużej niż zielone',
  },
  ogórek: {
    daysToHarvest: 50,
    category: 'Warzywa owocowe',
    notes: 'Odmiany wczesne 45-50 dni, późne 55-65 dni',
  },
  dynia: {
    daysToHarvest: 100,
    category: 'Warzywa owocowe',
    notes: 'Odmiany letnie 80-90 dni, zimowe 110-120 dni',
  },
  kabaczek: {
    daysToHarvest: 50,
    category: 'Warzywa owocowe',
    notes: 'Pierwsze zbiory już po 45 dniach',
  },

  // Warzywa korzeniowe
  marchew: {
    daysToHarvest: 70,
    category: 'Warzywa korzeniowe',
    notes: 'Odmiany wczesne 60-70 dni, późne 90-110 dni',
  },
  burak: {
    daysToHarvest: 60,
    category: 'Warzywa korzeniowe',
    notes: 'Odmiany wczesne 55-60 dni, późne 70-80 dni',
  },
  rzodkiewka: {
    daysToHarvest: 25,
    category: 'Warzywa korzeniowe',
    notes: 'Jedna z najszybciej rosnących roślin, 20-30 dni',
  },
  ziemniak: {
    daysToHarvest: 90,
    category: 'Warzywa korzeniowe',
    notes: 'Odmiany wczesne 70-90 dni, późne 110-130 dni',
  },
  pietruszka: {
    daysToHarvest: 80,
    category: 'Warzywa korzeniowe',
    notes: 'Korzeń 75-85 dni, naciowa krócej',
  },

  // Warzywa cebulowe
  cebula: {
    daysToHarvest: 100,
    category: 'Warzywa cebulowe',
    notes: 'Z sadzonki 90-110 dni, z nasion 140-160 dni',
  },
  czosnek: {
    daysToHarvest: 240,
    category: 'Warzywa cebulowe',
    notes: 'Jary 90-100 dni, ozimy 240-270 dni (od jesiennego sadzenia)',
  },
  por: {
    daysToHarvest: 120,
    category: 'Warzywa cebulowe',
    notes: 'Od przesadzenia rozsady 100-120 dni',
  },

  // Warzywa kapustne
  kapusta: {
    daysToHarvest: 90,
    category: 'Warzywa kapustne',
    notes: 'Wczesna 60-80 dni, późna 100-120 dni od rozsady',
  },
  kalafior: {
    daysToHarvest: 75,
    category: 'Warzywa kapustne',
    notes: 'Od przesadzenia rozsady 70-85 dni',
  },
  brokuły: {
    daysToHarvest: 70,
    category: 'Warzywa kapustne',
    notes: 'Od przesadzenia rozsady 60-75 dni',
  },

  // Warzywa liściowe
  sałata: {
    daysToHarvest: 45,
    category: 'Warzywa liściowe',
    notes: 'Odmiany wczesne 30-45 dni, późne 60-70 dni',
  },
  szpinak: {
    daysToHarvest: 40,
    category: 'Warzywa liściowe',
    notes: 'Młode liście po 30 dniach, pełny wzrost 40-50 dni',
  },

  // Warzywa strączkowe
  fasola: {
    daysToHarvest: 60,
    category: 'Warzywa strączkowe',
    notes: 'Szparagowa 55-65 dni, na suche nasiona 85-100 dni',
  },
  groszek: {
    daysToHarvest: 60,
    category: 'Warzywa strączkowe',
    notes: 'Cukrowy 55-65 dni, łuskowy 65-75 dni',
  },
  bób: {
    daysToHarvest: 90,
    category: 'Warzywa strączkowe',
    notes: 'Na zielono 85-95 dni, na suche nasiona 110-120 dni',
  },

  // Zioła
  bazylia: {
    daysToHarvest: 40,
    category: 'Zioła',
    notes: 'Pierwsze zbiory po 30-40 dniach, regularnie przez sezon',
  },
  koper: {
    daysToHarvest: 50,
    category: 'Zioła',
    notes: 'Na zielonkę 40-50 dni, na nasiona 90-110 dni',
  },
  pietruszka_natka: {
    daysToHarvest: 60,
    category: 'Zioła',
    notes: 'Naciowa 50-60 dni, regularnie przez sezon',
  },

  // Owoce
  truskawka: {
    daysToHarvest: 365,
    category: 'Owoce',
    notes: 'Od przesadzenia około 12 miesięcy, potem co roku',
  },

  // Kwiaty jednoroczne
  słonecznik: {
    daysToHarvest: 90,
    category: 'Kwiaty jednoroczne',
    notes: 'Kwitnie po 80-100 dniach, wysokość do 2m',
    flowerColor: 'Żółty',
    bloomSeason: 'Lato-Jesień',
    height: '150-200cm',
    sunRequirement: 'Pełne słońce',
  },
  aksamitka: {
    daysToHarvest: 50,
    category: 'Kwiaty jednoroczne',
    notes: 'Szybko kwitnie, odpędza szkodniki',
    flowerColor: 'Żółty, Pomarańczowy, Czerwony',
    bloomSeason: 'Lato-Jesień',
    height: '20-40cm',
    sunRequirement: 'Pełne słońce',
  },
  cynnia: {
    daysToHarvest: 60,
    category: 'Kwiaty jednoroczne',
    notes: 'Długie kwitnienie, doskonałe na kwiaty cięte',
    flowerColor: 'Różne kolory',
    bloomSeason: 'Lato-Jesień',
    height: '30-90cm',
    sunRequirement: 'Pełne słońce',
  },
  petunie: {
    daysToHarvest: 70,
    category: 'Kwiaty jednoroczne',
    notes: 'Bogate kwitnienie przez cały sezon',
    flowerColor: 'Różne kolory',
    bloomSeason: 'Lato-Jesień',
    height: '20-40cm',
    sunRequirement: 'Pełne słońce do półcienia',
  },
  bratek: {
    daysToHarvest: 65,
    category: 'Kwiaty jednoroczne',
    notes: 'Kwitnie wiosną i jesienią, odporne na chłód',
    flowerColor: 'Różne kolory',
    bloomSeason: 'Wiosna-Jesień',
    height: '15-25cm',
    sunRequirement: 'Pełne słońce do półcienia',
  },
  kosmos: {
    daysToHarvest: 70,
    category: 'Kwiaty jednoroczne',
    notes: 'Łatwy w uprawie, przyciąga motyle',
    flowerColor: 'Różowy, Biały, Fioletowy',
    bloomSeason: 'Lato-Jesień',
    height: '60-120cm',
    sunRequirement: 'Pełne słońce',
  },

  // Kwiaty wieloletnie
  lawenda: {
    daysToHarvest: 365,
    category: 'Kwiaty wieloletnie',
    notes: 'Kwitnie w 2 roku, piękny zapach, odpędza komary',
    flowerColor: 'Fioletowy',
    bloomSeason: 'Lato',
    height: '40-60cm',
    sunRequirement: 'Pełne słońce',
    isPerennial: true,
  },
  róża: {
    daysToHarvest: 730,
    category: 'Kwiaty wieloletnie',
    notes: 'Kwitnie w 2 roku, wymaga cięcia i pielęgnacji',
    flowerColor: 'Różne kolory',
    bloomSeason: 'Lato',
    height: '60-150cm',
    sunRequirement: 'Pełne słońce',
    isPerennial: true,
  },
  piwonia: {
    daysToHarvest: 730,
    category: 'Kwiaty wieloletnie',
    notes: 'Kwitnie w 2-3 roku, długowieczna roślina',
    flowerColor: 'Różowy, Biały, Czerwony',
    bloomSeason: 'Wiosna-Wczesne lato',
    height: '60-90cm',
    sunRequirement: 'Pełne słońce do półcienia',
    isPerennial: true,
  },
  irys: {
    daysToHarvest: 365,
    category: 'Kwiaty wieloletnie',
    notes: 'Kwitnie wiosną, wymaga przepuszczalnej gleby',
    flowerColor: 'Różne kolory',
    bloomSeason: 'Wiosna',
    height: '40-80cm',
    sunRequirement: 'Pełne słońce',
    isPerennial: true,
  },
  hosta: {
    daysToHarvest: 365,
    category: 'Kwiaty wieloletnie',
    notes: 'Roślina cienioznośna, piękne liście',
    flowerColor: 'Biały, Fioletowy',
    bloomSeason: 'Lato',
    height: '30-60cm',
    sunRequirement: 'Cień do półcienia',
    isPerennial: true,
  },
  rudbeckia: {
    daysToHarvest: 100,
    category: 'Kwiaty wieloletnie',
    notes: 'Łatwa w uprawie, długie kwitnienie',
    flowerColor: 'Żółty',
    bloomSeason: 'Lato-Jesień',
    height: '60-100cm',
    sunRequirement: 'Pełne słońce',
    isPerennial: true,
  },
  echinacea: {
    daysToHarvest: 120,
    category: 'Kwiaty wieloletnie',
    notes: 'Przyciąga motyle, właściwości lecznicze',
    flowerColor: 'Różowy, Fioletowy, Biały',
    bloomSeason: 'Lato',
    height: '60-120cm',
    sunRequirement: 'Pełne słońce',
    isPerennial: true,
  },
  dzwonek: {
    daysToHarvest: 90,
    category: 'Kwiaty wieloletnie',
    notes: 'Łatwy w uprawie, długie kwitnienie',
    flowerColor: 'Niebieski, Biały, Fioletowy',
    bloomSeason: 'Lato',
    height: '30-100cm',
    sunRequirement: 'Pełne słońce do półcienia',
    isPerennial: true,
  },

  // Kwiaty cebulowe
  tulipan: {
    daysToHarvest: 180,
    category: 'Kwiaty cebulowe',
    notes: 'Sadzenie jesienią, kwitnie wiosną',
    flowerColor: 'Różne kolory',
    bloomSeason: 'Wiosna',
    height: '30-60cm',
    sunRequirement: 'Pełne słońce',
    plantingTime: 'Jesień',
  },
  narcyz: {
    daysToHarvest: 180,
    category: 'Kwiaty cebulowe',
    notes: 'Sadzenie jesienią, bardzo trwałe',
    flowerColor: 'Żółty, Biały',
    bloomSeason: 'Wiosna',
    height: '30-50cm',
    sunRequirement: 'Pełne słońce do półcienia',
    plantingTime: 'Jesień',
  },
  krokus: {
    daysToHarvest: 150,
    category: 'Kwiaty cebulowe',
    notes: 'Pierwsze kwiaty wiosny, sadzenie jesienią',
    flowerColor: 'Fioletowy, Żółty, Biały',
    bloomSeason: 'Wczesna wiosna',
    height: '10-15cm',
    sunRequirement: 'Pełne słońce',
    plantingTime: 'Jesień',
  },
  hiacynt: {
    daysToHarvest: 180,
    category: 'Kwiaty cebulowe',
    notes: 'Piękny zapach, sadzenie jesienią',
    flowerColor: 'Różne kolory',
    bloomSeason: 'Wiosna',
    height: '20-30cm',
    sunRequirement: 'Pełne słońce',
    plantingTime: 'Jesień',
  },
  dalia: {
    daysToHarvest: 90,
    category: 'Kwiaty cebulowe',
    notes: 'Długie kwitnienie, wymaga podpór',
    flowerColor: 'Różne kolory',
    bloomSeason: 'Lato-Jesień',
    height: '60-150cm',
    sunRequirement: 'Pełne słońce',
    plantingTime: 'Wiosna',
  },
  mieczyk: {
    daysToHarvest: 90,
    category: 'Kwiaty cebulowe',
    notes: 'Doskonałe na kwiaty cięte',
    flowerColor: 'Różne kolory',
    bloomSeason: 'Lato',
    height: '80-120cm',
    sunRequirement: 'Pełne słońce',
    plantingTime: 'Wiosna',
  },
};

/**
 * Normalize plant name for lookup
 * @param {string} plantName - Plant name
 * @returns {string} Normalized name
 */
export const normalizePlantName = (plantName) => {
  if (!plantName) return '';
  return plantName.toLowerCase().trim();
};

/**
 * Get growth data for a plant
 * @param {string} plantName - Plant name
 * @returns {Object|null} Growth data or null if not found
 */
export const getPlantGrowthData = (plantName) => {
  const normalized = normalizePlantName(plantName);
  return plantGrowthData[normalized] || null;
};

/**
 * Calculate expected harvest date
 * @param {string} plantedDate - ISO date string when planted
 * @param {string} plantName - Plant name
 * @returns {string|null} Expected harvest date ISO string or null
 */
export const calculateExpectedHarvestDate = (plantedDate, plantName) => {
  const growthData = getPlantGrowthData(plantName);
  if (!growthData || !plantedDate) return null;

  const planted = new Date(plantedDate);
  const harvest = new Date(planted);
  harvest.setDate(harvest.getDate() + growthData.daysToHarvest);

  return harvest.toISOString().split('T')[0];
};

/**
 * Get all plants by category
 * @param {string} category - Category name
 * @returns {Array} Array of plant objects
 */
export const getPlantsByCategory = (category) => {
  return Object.entries(plantGrowthData)
    .filter(([_, data]) => data.category === category)
    .map(([name, data]) => ({ name, ...data }));
};

/**
 * Get all categories
 * @returns {Array} Array of unique category names
 */
export const getAllCategories = () => {
  const categories = new Set(
    Object.values(plantGrowthData).map((data) => data.category)
  );
  return Array.from(categories).sort();
};

/**
 * Search plants by name
 * @param {string} searchTerm - Search term
 * @returns {Array} Array of matching plant objects
 */
export const searchPlants = (searchTerm) => {
  if (!searchTerm) return [];

  const term = searchTerm.toLowerCase();
  return Object.entries(plantGrowthData)
    .filter(([name]) => name.includes(term))
    .map(([name, data]) => ({ name, ...data }));
};
