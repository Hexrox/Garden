const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../garden.db');
const JSON_PATH = path.join(__dirname, '../../../NOWE_ROSLINY_DO_DODANIA.json');

const db = new sqlite3.Database(DB_PATH);
const plantsData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

console.log(`📦 Importing ${plantsData.length} plants...`);

const insertSQL = `
  INSERT INTO plants (
    user_id, name, display_name, latin_name, category, subcategory,
    flower_color, bloom_season, height, sun_requirement, water_needs,
    soil_ph, soil_type, days_to_harvest, range_min, range_max,
    uses, companion_plants, avoid_plants, notes, npk_needs,
    is_perennial, is_bee_friendly, is_edible, is_fragrant,
    origin, hardiness_zone, propagation_method, is_custom
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

let successCount = 0;
let errorCount = 0;

db.serialize(() => {
  db.run('BEGIN TRANSACTION');

  plantsData.forEach(plant => {
    // Combine notes + care_notes + difficulty
    const combinedNotes = [
      plant.notes || '',
      plant.care_notes ? `\n\nPielęgnacja: ${plant.care_notes}` : '',
      plant.difficulty ? `\nTrudność: ${plant.difficulty}` : ''
    ].join('').trim();

    const values = [
      null, // user_id = NULL (system plant)
      plant.name,
      plant.display_name,
      plant.name_latin,
      plant.category,
      plant.subcategory || null,
      plant.flower_color || null,
      plant.bloom_season || null,
      plant.height || null,
      plant.sun_requirement || null,
      plant.water_needs || null,
      plant.soil_ph || null,
      plant.soil_preference || null,
      plant.days_to_harvest || 0, // 0 for non-vegetables
      plant.range_min || null,
      plant.range_max || null,
      plant.uses || null,
      plant.companion_plants || null,
      plant.avoid_plants || null,
      combinedNotes,
      plant.fertilization_needs || null,
      plant.is_perennial || 0,
      plant.is_bee_friendly || 0,
      plant.is_edible || 0,
      plant.is_fragrant || 0,
      plant.origin || null,
      plant.hardiness_zone || null,
      plant.propagation_method || null,
      0 // is_custom = 0
    ];

    db.run(insertSQL, values, function(err) {
      if (err) {
        console.error(`❌ ${plant.name}:`, err.message);
        errorCount++;
      } else {
        successCount++;
        console.log(`✓ ${plant.name} (ID: ${this.lastID})`);
      }

      if (successCount + errorCount === plantsData.length) {
        db.run('COMMIT', (err) => {
          if (err) {
            console.error('Commit failed:', err);
            db.run('ROLLBACK');
          } else {
            console.log(`\n✅ Success: ${successCount}, Errors: ${errorCount}`);
            console.log(`📊 Total plants: ${641 + successCount}`);
          }
          db.close();
        });
      }
    });
  });
});
