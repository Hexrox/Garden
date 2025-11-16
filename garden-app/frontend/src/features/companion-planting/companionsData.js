/**
 * Companion Planting Database
 *
 * Based on research from companion planting guides and garden planning apps.
 * Each plant has a list of good companions, bad companions (antagonists),
 * with reasons and recommended distances.
 */

export const companionData = {
  // Vegetables
  pomidor: {
    good: [
      {
        plant: 'bazylia',
        reason: 'Odpędza szkodniki, poprawia smak pomidorów',
        distance: '20-30cm',
      },
      {
        plant: 'marchew',
        reason: 'Marchew poprawia strukturę gleby, pomidory odpędzają muszki marchewkowe',
        distance: '30cm',
      },
      {
        plant: 'cebula',
        reason: 'Odpędza mszyce i inne szkodniki',
        distance: '25cm',
      },
      {
        plant: 'sałata',
        reason: 'Wykorzystuje cień pomidorów, oszczędza miejsce',
        distance: '20cm',
      },
      {
        plant: 'nagietek',
        reason: 'Odpędza stonkę ziemniaczaną i mszyce',
        distance: '30cm',
      },
    ],
    bad: [
      {
        plant: 'ziemniak',
        reason: 'Obie rośliny przyciągają zarazy i stonki, konkurują o składniki',
        distance: 'min 100cm',
      },
      {
        plant: 'koperkułata',
        reason: 'Hamuje wzrost pomidorów',
        distance: 'min 50cm',
      },
      {
        plant: 'kapusta',
        reason: 'Konkurują o składniki odżywcze, zaburzają wzrost',
        distance: 'min 80cm',
      },
    ],
  },

  ogórek: {
    good: [
      {
        plant: 'fasola',
        reason: 'Wzbogaca glebę w azot, poprawia wzrost ogórków',
        distance: '30-40cm',
      },
      {
        plant: 'groszek',
        reason: 'Podobnie jak fasola, dostarcza azot',
        distance: '30cm',
      },
      {
        plant: 'rzodkiewka',
        reason: 'Odpędza stonki, szybko się zbiera',
        distance: '15-20cm',
      },
      {
        plant: 'kapusta',
        reason: 'Dobre współdziałanie, nie konkurują o składniki',
        distance: '40cm',
      },
    ],
    bad: [
      {
        plant: 'ziemniak',
        reason: 'Przyciąga zarazy, konkuruje o wodę',
        distance: 'min 100cm',
      },
      {
        plant: 'pomidor',
        reason: 'Różne potrzeby wodne, zaburzają wzrost',
        distance: 'min 80cm',
      },
    ],
  },

  marchew: {
    good: [
      {
        plant: 'cebula',
        reason: 'Klasyczne połączenie - odpiędza muchy marchewkowe i cebulowe',
        distance: '10-15cm (naprzemiennie)',
      },
      {
        plant: 'pomidor',
        reason: 'Pomidory odpędzają muchy marchewkowe',
        distance: '30cm',
      },
      {
        plant: 'groszek',
        reason: 'Dostarcza azot, poprawia wzrost marchewki',
        distance: '25cm',
      },
    ],
    bad: [
      {
        plant: 'koper',
        reason: 'Hamuje wzrost marchewki, przyciąga te same szkodniki',
        distance: 'min 50cm',
      },
    ],
  },

  cebula: {
    good: [
      {
        plant: 'marchew',
        reason: 'Odpędza muchy cebulowe i marchewkowe',
        distance: '10-15cm',
      },
      {
        plant: 'pomidor',
        reason: 'Odpędza mszyce',
        distance: '25cm',
      },
      {
        plant: 'sałata',
        reason: 'Nie konkurują, dobrze się uzupełniają',
        distance: '20cm',
      },
    ],
    bad: [
      {
        plant: 'fasola',
        reason: 'Cebula hamuje wzrost fasoli',
        distance: 'min 60cm',
      },
      {
        plant: 'groszek',
        reason: 'Podobny efekt jak z fasolą',
        distance: 'min 60cm',
      },
    ],
  },

  kapusta: {
    good: [
      {
        plant: 'ogórek',
        reason: 'Dobre współdzałanie, nie konkurują',
        distance: '40cm',
      },
      {
        plant: 'sałata',
        reason: 'Wykorzystuje przestrzeń między kapustą',
        distance: '25cm',
      },
      {
        plant: 'mięta',
        reason: 'Odpędza szkodniki kapusty',
        distance: '30cm',
      },
    ],
    bad: [
      {
        plant: 'pomidor',
        reason: 'Konkurują o składniki odżywcze',
        distance: 'min 80cm',
      },
      {
        plant: 'truskawka',
        reason: 'Hamują wzrost nawzajem',
        distance: 'min 100cm',
      },
    ],
  },

  ziemniak: {
    good: [
      {
        plant: 'fasola',
        reason: 'Fasola wzbogaca glebę w azot, korzystny dla ziemniaków',
        distance: '30cm',
      },
      {
        plant: 'kapusta',
        reason: 'Dobre współdziałanie, różne wymagania pokarmowe',
        distance: '40cm',
      },
      {
        plant: 'szpinak',
        reason: 'Szybko rośnie, nie konkuruje z ziemniakami',
        distance: '25cm',
      },
    ],
    bad: [
      {
        plant: 'pomidor',
        reason: 'Obie rośliny przyciągają zarazy i stonki',
        distance: 'min 100cm',
      },
      {
        plant: 'ogórek',
        reason: 'Konkurują o wodę i składniki',
        distance: 'min 80cm',
      },
      {
        plant: 'słonecznik',
        reason: 'Hamuje wzrost ziemniaków',
        distance: 'min 100cm',
      },
    ],
  },

  papryka: {
    good: [
      {
        plant: 'bazylia',
        reason: 'Odpędza szkodniki, poprawia smak',
        distance: '25cm',
      },
      {
        plant: 'cebula',
        reason: 'Odpędza mszyce',
        distance: '25cm',
      },
    ],
    bad: [
      {
        plant: 'fasola',
        reason: 'Fasola może hamować wzrost papryki',
        distance: 'min 50cm',
      },
    ],
  },

  fasola: {
    good: [
      {
        plant: 'ogórek',
        reason: 'Dostarcza azot, poprawia wzrost',
        distance: '30-40cm',
      },
      {
        plant: 'marchew',
        reason: 'Wzbogaca glebę w azot',
        distance: '30cm',
      },
      {
        plant: 'rzodkiewka',
        reason: 'Odpędza szkodniki fasoli',
        distance: '20cm',
      },
    ],
    bad: [
      {
        plant: 'cebula',
        reason: 'Cebula hamuje wzrost fasoli',
        distance: 'min 60cm',
      },
      {
        plant: 'czosnek',
        reason: 'Podobny efekt jak cebula',
        distance: 'min 60cm',
      },
    ],
  },

  sałata: {
    good: [
      {
        plant: 'pomidor',
        reason: 'Wykorzystuje cień pomidorów',
        distance: '20cm',
      },
      {
        plant: 'ogórek',
        reason: 'Dobrze się uzupełniają',
        distance: '25cm',
      },
      {
        plant: 'rzodkiewka',
        reason: 'Znacznikowa - pokazuje gdzie rośnie sałata',
        distance: '15cm',
      },
    ],
    bad: [],
  },

  // Herbs
  bazylia: {
    good: [
      {
        plant: 'pomidor',
        reason: 'Klasyczne połączenie - odpędza szkodniki, poprawia smak',
        distance: '20-30cm',
      },
      {
        plant: 'papryka',
        reason: 'Odpędza mszyce i inne szkodniki',
        distance: '25cm',
      },
    ],
    bad: [],
  },

  nagietek: {
    good: [
      {
        plant: 'pomidor',
        reason: 'Odpędza stonkę ziemniaczaną, mszyce, nicienie',
        distance: '30cm',
      },
      {
        plant: 'kapusta',
        reason: 'Odpędza szkodniki kapusty',
        distance: '30cm',
      },
    ],
    bad: [],
  },

  burak: {
    good: [
      {
        plant: 'cebula',
        reason: 'Dobra kombinacja, nie konkurują o składniki',
        distance: '20cm',
      },
      {
        plant: 'sałata',
        reason: 'Wykorzystują przestrzeń efektywnie',
        distance: '25cm',
      },
      {
        plant: 'kapusta',
        reason: 'Dobre współdziałanie, różne systemy korzeniowe',
        distance: '30cm',
      },
    ],
    bad: [
      {
        plant: 'fasola',
        reason: 'Fasola hamuje wzrost buraków',
        distance: 'min 50cm',
      },
      {
        plant: 'szpinak',
        reason: 'Konkurują o te same składniki',
        distance: 'min 40cm',
      },
    ],
  },

  por: {
    good: [
      {
        plant: 'marchew',
        reason: 'Klasyczna kombinacja - odpędzają szkodniki nawzajem',
        distance: '15cm',
      },
      {
        plant: 'seler',
        reason: 'Odpędzają muszki porowe',
        distance: '20cm',
      },
      {
        plant: 'truskawka',
        reason: 'Por odpędza szkodniki truskawek',
        distance: '25cm',
      },
    ],
    bad: [
      {
        plant: 'fasola',
        reason: 'Hamują wzrost nawzajem',
        distance: 'min 60cm',
      },
      {
        plant: 'groszek',
        reason: 'Podobny efekt jak z fasolą',
        distance: 'min 60cm',
      },
    ],
  },

  czosnek: {
    good: [
      {
        plant: 'pomidor',
        reason: 'Odpędza mszyce, poprawia wzrost pomidorów',
        distance: '25cm',
      },
      {
        plant: 'marchew',
        reason: 'Odpędza muszki marchewkowe',
        distance: '20cm',
      },
      {
        plant: 'truskawka',
        reason: 'Odpędza szkodniki, zapobiega chorobom grzybowym',
        distance: '30cm',
      },
      {
        plant: 'róża',
        reason: 'Klasyczne połączenie - odpędza mszyce',
        distance: '25cm',
      },
    ],
    bad: [
      {
        plant: 'fasola',
        reason: 'Czosnek hamuje wzrost roślin strączkowych',
        distance: 'min 60cm',
      },
      {
        plant: 'groszek',
        reason: 'Hamuje wzrost',
        distance: 'min 60cm',
      },
      {
        plant: 'kapusta',
        reason: 'Może hamować wzrost kapusty',
        distance: 'min 50cm',
      },
    ],
  },

  szpinak: {
    good: [
      {
        plant: 'truskawka',
        reason: 'Doskonałe połączenie - poprawiają wzrost nawzajem',
        distance: '20cm',
      },
      {
        plant: 'rzodkiewka',
        reason: 'Szybko się zbierają, nie konkurują',
        distance: '15cm',
      },
      {
        plant: 'sałata',
        reason: 'Podobne wymagania, dobrze się uzupełniają',
        distance: '20cm',
      },
    ],
    bad: [
      {
        plant: 'burak',
        reason: 'Konkurują o składniki odżywcze',
        distance: 'min 40cm',
      },
    ],
  },

  dynia: {
    good: [
      {
        plant: 'kukurydza',
        reason: 'Klasyczna "Trzy Siostry" - dynia osłania glebę',
        distance: '50cm',
      },
      {
        plant: 'fasola',
        reason: 'Fasola dostarcza azot',
        distance: '40cm',
      },
      {
        plant: 'nagietek',
        reason: 'Odpędza szkodniki dyni',
        distance: '30cm',
      },
    ],
    bad: [
      {
        plant: 'ziemniak',
        reason: 'Konkurują o przestrzeń i składniki',
        distance: 'min 100cm',
      },
    ],
  },

  kabaczek: {
    good: [
      {
        plant: 'kukurydza',
        reason: 'Dobre współdziałanie, kabaczek osłania glebę',
        distance: '50cm',
      },
      {
        plant: 'fasola',
        reason: 'Fasola wzbogaca glebę',
        distance: '40cm',
      },
      {
        plant: 'cebula',
        reason: 'Odpędza szkodniki',
        distance: '30cm',
      },
    ],
    bad: [
      {
        plant: 'ziemniak',
        reason: 'Konkurują o składniki',
        distance: 'min 80cm',
      },
    ],
  },

  truskawka: {
    good: [
      {
        plant: 'szpinak',
        reason: 'Doskonałe połączenie - poprawiają wzrost',
        distance: '20cm',
      },
      {
        plant: 'czosnek',
        reason: 'Odpędza szkodniki, zapobiega chorobom',
        distance: '30cm',
      },
      {
        plant: 'por',
        reason: 'Por odpędza szkodniki truskawek',
        distance: '25cm',
      },
      {
        plant: 'boraż',
        reason: 'Przyciąga zapylacze, poprawia plony',
        distance: '30cm',
      },
    ],
    bad: [
      {
        plant: 'kapusta',
        reason: 'Hamują wzrost nawzajem',
        distance: 'min 100cm',
      },
    ],
  },

  koper: {
    good: [
      {
        plant: 'ogórek',
        reason: 'Poprawia smak i wzrost ogórków',
        distance: '30cm',
      },
      {
        plant: 'sałata',
        reason: 'Dobre współdziałanie',
        distance: '25cm',
      },
    ],
    bad: [
      {
        plant: 'marchew',
        reason: 'Hamuje wzrost marchewki',
        distance: 'min 50cm',
      },
      {
        plant: 'pomidor',
        reason: 'Hamuje wzrost pomidorów',
        distance: 'min 50cm',
      },
    ],
  },

  mięta: {
    good: [
      {
        plant: 'kapusta',
        reason: 'Odpędza szkodniki kapusty',
        distance: '30cm',
      },
      {
        plant: 'pomidor',
        reason: 'Odpędza mszyce',
        distance: '30cm',
      },
    ],
    bad: [
      {
        plant: 'pietruszka',
        reason: 'Mięta jest inwazyjna, wypiera pietruszki',
        distance: 'min 100cm (sadzić w doniczce)',
      },
    ],
  },

  pietruszka: {
    good: [
      {
        plant: 'pomidor',
        reason: 'Przyciąga pożyteczne owady',
        distance: '25cm',
      },
      {
        plant: 'szparagi',
        reason: 'Klasyczna kombinacja',
        distance: '30cm',
      },
    ],
    bad: [
      {
        plant: 'mięta',
        reason: 'Mięta wypiera pietruszkę',
        distance: 'min 100cm',
      },
      {
        plant: 'sałata',
        reason: 'Może hamować kiełkowanie sałaty',
        distance: 'min 40cm',
      },
    ],
  },

  rzodkiewka: {
    good: [
      {
        plant: 'ogórek',
        reason: 'Odpędza stonki',
        distance: '15-20cm',
      },
      {
        plant: 'fasola',
        reason: 'Odpędza szkodniki fasoli',
        distance: '20cm',
      },
      {
        plant: 'sałata',
        reason: 'Znacznikowa - pokazuje gdzie rośnie sałata',
        distance: '15cm',
      },
      {
        plant: 'szpinak',
        reason: 'Szybko się zbiera, nie konkuruje',
        distance: '15cm',
      },
    ],
    bad: [],
  },

  groszek: {
    good: [
      {
        plant: 'marchew',
        reason: 'Dostarcza azot, poprawia wzrost marchewki',
        distance: '25cm',
      },
      {
        plant: 'ogórek',
        reason: 'Wzbogaca glebę w azot',
        distance: '30cm',
      },
      {
        plant: 'rzodkiewka',
        reason: 'Dobra kombinacja',
        distance: '20cm',
      },
    ],
    bad: [
      {
        plant: 'cebula',
        reason: 'Cebula hamuje wzrost groszku',
        distance: 'min 60cm',
      },
      {
        plant: 'czosnek',
        reason: 'Hamuje wzrost',
        distance: 'min 60cm',
      },
      {
        plant: 'por',
        reason: 'Podobny efekt jak cebula',
        distance: 'min 60cm',
      },
    ],
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
 * Get companions for a plant
 * @param {string} plantName - Plant name
 * @returns {Object} { good: [], bad: [] }
 */
export const getCompanions = (plantName) => {
  const normalized = normalizePlantName(plantName);
  const data = companionData[normalized];

  if (!data) {
    return { good: [], bad: [] };
  }

  return {
    good: data.good || [],
    bad: data.bad || [],
  };
};

/**
 * Check if two plants are good/bad companions
 * @param {string} plant1 - First plant name
 * @param {string} plant2 - Second plant name
 * @returns {string} 'good', 'bad', or 'neutral'
 */
export const checkCompatibility = (plant1, plant2) => {
  const companions = getCompanions(plant1);
  const normalized2 = normalizePlantName(plant2);

  const isGood = companions.good.some((c) => normalizePlantName(c.plant) === normalized2);
  const isBad = companions.bad.some((c) => normalizePlantName(c.plant) === normalized2);

  if (isGood) return 'good';
  if (isBad) return 'bad';
  return 'neutral';
};
