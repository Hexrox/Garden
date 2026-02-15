#!/usr/bin/env node

/**
 * Skrypt importu odmian roślin z katalogu PNOS
 * (Polskie Nasiennictwo Ogrodnicze Spółdzielcze, Ożarów Mazowiecki)
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../garden.db');
const DATA_DIR = path.join(__dirname, '../data');

const FILES = [
  'pnos_warzywa_pomidory.json',
  'pnos_warzywa_ogorki.json',
  'pnos_warzywa_papryki.json',
  'pnos_warzywa_kapustne.json',
  'pnos_warzywa_korzeniowe.json',
  'pnos_warzywa_dyniowate.json',
  'pnos_warzywa_straczkowe.json',
  'pnos_warzywa_inne.json',
  'pnos_kwiaty_jednoroczne.json',
  'pnos_kwiaty_wieloletnie.json',
  'pnos_ziola.json'
];

console.log('🌱 Garden App - Import odmian PNOS');
console.log('====================================\n');

const db = new sqlite3.Database(DB_PATH);

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function importFile(filename) {
  const filepath = path.join(DATA_DIR, filename);

  if (!fs.existsSync(filepath)) {
    console.log(`❌ Plik nie istnieje: ${filename}`);
    return { inserted: 0, skipped: 0, errors: 0 };
  }

  console.log(`📖 Wczytywanie: ${filename}`);
  const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  console.log(`   Znaleziono ${data.plants.length} roślin\n`);

  // Pobranie istniejących nazw i nazw łacińskich
  const existingPlants = await dbAll('SELECT name, latin_name FROM plants');
  const existingNames = new Set(existingPlants.map(p => p.name.toLowerCase()));
  const existingLatinNames = new Set(
    existingPlants
      .filter(p => p.latin_name)
      .map(p => p.latin_name.toLowerCase())
  );

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const plant of data.plants) {
    // Kontrola duplikatów po polskiej nazwie
    if (existingNames.has(plant.name.toLowerCase())) {
      console.log(`   ⏭️  Pominięto (duplikat): ${plant.name}`);
      skipped++;
      continue;
    }

    // Ostrzeżenie jeśli nazwa łacińska już istnieje (inna polska nazwa)
    if (plant.name_latin && existingLatinNames.has(plant.name_latin.toLowerCase())) {
      console.log(`   ⚠️  Uwaga: nazwa łacińska "${plant.name_latin}" już istnieje w bazie (pod inną polską nazwą)`);
    }

    try {
      await dbRun(`
        INSERT INTO plants (
          user_id, name, display_name, days_to_harvest, notes, is_custom,
          category, subcategory, flower_color, bloom_season, height,
          sun_requirement, is_perennial, latin_name, npk_needs,
          npk_ratio_recommended, fertilization_frequency, soil_type,
          water_needs, planting_depth, spacing, hardiness_zone,
          is_fragrant, is_bee_friendly, is_edible, origin, uses,
          planting_time, companion_plants, avoid_plants,
          propagation_method, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        null,                                          // user_id
        plant.name,                                    // name
        plant.name,                                    // display_name
        plant.days_to_harvest || 0,                    // days_to_harvest
        plant.care_notes || '',                        // notes
        0,                                             // is_custom
        plant.category,                                // category
        plant.subcategory || null,                      // subcategory
        plant.flower_color || null,                     // flower_color
        plant.bloom_season || null,                     // bloom_season
        plant.height || null,                           // height
        plant.sun_requirement || null,                  // sun_requirement
        plant.is_perennial ? 1 : 0,                    // is_perennial
        plant.name_latin || null,                       // latin_name
        plant.fertilization_needs || null,              // npk_needs
        plant.npk || null,                              // npk_ratio_recommended
        plant.fertilization_frequency || null,          // fertilization_frequency
        plant.soil_preference || null,                  // soil_type
        plant.watering_needs || null,                   // water_needs
        plant.planting_depth || null,                   // planting_depth
        plant.spacing || null,                          // spacing
        plant.hardiness_zone || null,                   // hardiness_zone
        plant.is_fragrant ? 1 : 0,                     // is_fragrant
        plant.is_bee_friendly ? 1 : 0,                  // is_bee_friendly
        plant.is_edible ? 1 : 0,                        // is_edible
        plant.origin || null,                           // origin
        Array.isArray(plant.uses) ? JSON.stringify(plant.uses) : plant.uses || null,  // uses
        plant.planting_time || null,                    // planting_time
        Array.isArray(plant.companion_plants) ? plant.companion_plants.join(',') : plant.companion_plants || null,  // companion_plants
        Array.isArray(plant.avoid_plants) ? plant.avoid_plants.join(',') : plant.avoid_plants || null,  // avoid_plants
        plant.propagation_method || null,               // propagation_method
        'approved'                                      // status
      ]);

      inserted++;
      existingNames.add(plant.name.toLowerCase());
      if (plant.name_latin) {
        existingLatinNames.add(plant.name_latin.toLowerCase());
      }

    } catch (err) {
      console.log(`   ❌ Błąd: ${plant.name} - ${err.message}`);
      errors++;
    }
  }

  return { inserted, skipped, errors };
}

async function main() {
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  // Stan przed importem
  const before = await dbGet('SELECT COUNT(*) as count FROM plants');
  console.log(`📊 Roślin w bazie przed importem: ${before.count}\n`);

  for (const file of FILES) {
    const result = await importFile(file);
    totalInserted += result.inserted;
    totalSkipped += result.skipped;
    totalErrors += result.errors;
    console.log(`   ✅ Dodano: ${result.inserted}, pominięto: ${result.skipped}, błędy: ${result.errors}\n`);
  }

  console.log('====================================');
  console.log('📊 PODSUMOWANIE:');
  console.log(`   ✅ Dodano łącznie: ${totalInserted} roślin`);
  console.log(`   ⏭️  Pominięto (duplikaty): ${totalSkipped}`);
  if (totalErrors > 0) {
    console.log(`   ⚠️  Błędy: ${totalErrors}`);
  }

  // Stan po imporcie
  const after = await dbGet('SELECT COUNT(*) as count FROM plants');
  console.log(`\n🔢 Roślin w bazie po imporcie: ${after.count} (było: ${before.count}, przyrost: ${after.count - before.count})`);

  // Sprawdzenie duplikatów
  const dupes = await dbAll(`
    SELECT name, COUNT(*) as cnt
    FROM plants
    GROUP BY name
    HAVING cnt > 1
  `);
  if (dupes.length > 0) {
    console.log('\n⚠️  Znalezione duplikaty nazw:');
    dupes.forEach(d => console.log(`   - "${d.name}" (×${d.cnt})`));
  } else {
    console.log('\n✅ Brak duplikatów nazw');
  }

  // Sprawdzenie kompletności care_notes
  const emptyNotes = await dbGet(`
    SELECT COUNT(*) as count FROM plants
    WHERE notes IS NULL OR notes = ''
  `);
  if (emptyNotes.count > 0) {
    console.log(`⚠️  Roślin bez opisu (notes): ${emptyNotes.count}`);
  }

  // Statystyki kategorii
  const stats = await dbAll(`
    SELECT category, COUNT(*) as count
    FROM plants
    GROUP BY category
    ORDER BY count DESC
  `);

  const names = {
    'vegetable': '🥕 Warzywa',
    'flower_perennial': '🌸 Byliny',
    'flower_annual': '🌻 Jednoroczne',
    'flower_bulb': '🌷 Cebulowe',
    'fruit_tree': '🍎 Drzewa owocowe',
    'fruit_bush': '🫐 Krzewy owocowe',
    'tree_ornamental': '🌳 Drzewa ozdobne',
    'shrub_ornamental': '🌺 Krzewy ozdobne',
    'climber': '🧗 Pnącza',
    'grass': '🌾 Trawy ozdobne',
    'fern': '🌿 Paprocie',
    'succulent': '🪴 Sukulenty',
    'groundcover': '🟢 Okrywowe',
    'herb': '🌿 Zioła'
  };

  console.log('\n📈 Rośliny według kategorii:');
  stats.forEach(s => {
    const name = names[s.category] || s.category;
    console.log(`   ${name}: ${s.count}`);
  });

  console.log('\n💡 Następne kroki:');
  console.log('   1. node scripts/download_plant_photos.js vegetable');
  console.log('   2. node scripts/download_plant_photos.js flower_annual');
  console.log('   3. node scripts/download_plant_photos.js flower_perennial');
  console.log('   4. node scripts/download_plant_photos.js herb');
  console.log('   5. node scripts/download_vintage_illustrations.js vegetable');
  console.log('   6. node scripts/download_vintage_illustrations.js flower_annual');
  console.log('   ... i tak dalej dla każdej kategorii\n');

  db.close();
}

main().catch(err => {
  console.error('Błąd krytyczny:', err);
  db.close();
  process.exit(1);
});
