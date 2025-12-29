#!/usr/bin/env node

/**
 * Migration script: Import 641 plants from plants_data_full.json into SQLite
 *
 * This script:
 * 1. Adds missing columns to plants table
 * 2. Imports all plants from JSON file
 * 3. Sets them as default (non-custom) plants
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../garden.db');
const JSON_PATH = path.join(__dirname, '../data/plants_data_full.json');

console.log('🌱 Garden App - Plants Database Migration');
console.log('==========================================\n');

// Connect to database
const db = new sqlite3.Database(DB_PATH);

// Load plants data
console.log('📖 Loading plants data from JSON...');
const plantsData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
console.log(`✅ Loaded ${plantsData.plants.length} plants from JSON\n`);

db.serialize(() => {
  console.log('🔧 Adding missing columns to plants table...');

  // Add missing columns (ignore errors if they already exist)
  const newColumns = [
    'subcategory TEXT',
    'hardiness_zone TEXT',
    'is_fragrant BOOLEAN DEFAULT 0',
    'is_bee_friendly BOOLEAN DEFAULT 0',
    'planting_depth TEXT',
    'spacing TEXT',
    'origin TEXT',
    'uses TEXT'  // JSON array as string
  ];

  newColumns.forEach(column => {
    const columnName = column.split(' ')[0];
    db.run(`ALTER TABLE plants ADD COLUMN ${column}`, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error(`❌ Error adding ${columnName}:`, err.message);
      } else if (!err) {
        console.log(`  ✓ Added column: ${columnName}`);
      }
    });
  });

  // Wait a bit for ALTER TABLE commands to complete
  setTimeout(() => {
    console.log('\n🗑️  Clearing existing default plants...');

    db.run('DELETE FROM plants WHERE is_custom = 0 OR user_id IS NULL', function(err) {
      if (err) {
        console.error('❌ Error clearing plants:', err.message);
        process.exit(1);
      }

      console.log(`  ✓ Deleted ${this.changes} existing default plants\n`);

      console.log('📥 Importing plants to database...');

      const stmt = db.prepare(`
        INSERT INTO plants (
          user_id,
          name,
          display_name,
          days_to_harvest,
          notes,
          is_custom,
          category,
          subcategory,
          flower_color,
          bloom_season,
          height,
          sun_requirement,
          is_perennial,
          latin_name,
          npk_needs,
          npk_ratio_recommended,
          fertilization_frequency,
          soil_type,
          water_needs,
          planting_depth,
          spacing,
          hardiness_zone,
          is_fragrant,
          is_bee_friendly,
          origin,
          uses
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      let inserted = 0;
      let errors = 0;

      plantsData.plants.forEach((plant, index) => {
        stmt.run(
          null,                                           // user_id (NULL for default plants)
          plant.name,                                     // name
          plant.name,                                     // display_name (same as name)
          plant.days_to_harvest || 0,                     // days_to_harvest (0 for perennials/non-veggies)
          plant.care_notes,                               // notes
          0,                                              // is_custom (0 = default plant)
          plant.category,                                 // category
          plant.subcategory,                              // subcategory
          plant.flower_color,                             // flower_color
          plant.bloom_season,                             // bloom_season
          plant.height,                                   // height
          plant.sun_requirement,                          // sun_requirement
          plant.is_perennial ? 1 : 0,                     // is_perennial
          plant.name_latin,                               // latin_name
          plant.fertilization_needs,                      // npk_needs
          plant.npk,                                      // npk_ratio_recommended
          plant.fertilization_frequency,                  // fertilization_frequency
          plant.soil_preference,                          // soil_type
          plant.watering_needs,                           // water_needs
          plant.planting_depth,                           // planting_depth
          plant.spacing,                                  // spacing
          plant.hardiness_zone,                           // hardiness_zone
          plant.is_fragrant ? 1 : 0,                      // is_fragrant
          plant.is_bee_friendly ? 1 : 0,                  // is_bee_friendly
          plant.origin,                                   // origin
          JSON.stringify(plant.uses)                      // uses (as JSON string)
        , (err) => {
          if (err) {
            console.error(`  ❌ Error inserting plant #${index + 1} (${plant.name}):`, err.message);
            errors++;
          } else {
            inserted++;
            if (inserted % 100 === 0) {
              console.log(`  ⏳ Inserted ${inserted}/${plantsData.plants.length} plants...`);
            }
          }
        });
      });

      stmt.finalize((err) => {
        if (err) {
          console.error('\n❌ Error finalizing statement:', err.message);
          process.exit(1);
        }

        setTimeout(() => {
          console.log('\n✅ Migration completed!');
          console.log(`   📊 Inserted: ${inserted} plants`);
          if (errors > 0) {
            console.log(`   ⚠️  Errors: ${errors} plants`);
          }

          // Verify the data
          db.get('SELECT COUNT(*) as count FROM plants WHERE is_custom = 0', (err, row) => {
            if (err) {
              console.error('\n❌ Error verifying:', err.message);
            } else {
              console.log(`\n🔍 Verification: ${row.count} default plants in database`);
            }

            db.close(() => {
              console.log('\n✨ Database migration complete!\n');
              process.exit(0);
            });
          });
        }, 1000);
      });
    });
  }, 500);
});
