#!/usr/bin/env node

/**
 * Migracja bazy danych - dodanie kolumn na zdjęcia roślin
 *
 * Dodaje kolumny:
 * - photo_* - zdjęcie fotograficzne
 * - illustration_* - ilustracja botaniczna
 * - image_candidates - JSON z kandydatami do zatwierdzenia
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../garden.db');

console.log('🌱 Garden App - Migracja: Zdjęcia Roślin');
console.log('========================================\n');

const db = new sqlite3.Database(DB_PATH);

const migrations = [
  // Zdjęcie fotograficzne
  `ALTER TABLE plants ADD COLUMN photo_path TEXT`,
  `ALTER TABLE plants ADD COLUMN photo_thumb TEXT`,
  `ALTER TABLE plants ADD COLUMN photo_author TEXT`,
  `ALTER TABLE plants ADD COLUMN photo_source TEXT`,
  `ALTER TABLE plants ADD COLUMN photo_license TEXT`,
  `ALTER TABLE plants ADD COLUMN photo_source_url TEXT`,

  // Ilustracja botaniczna
  `ALTER TABLE plants ADD COLUMN illustration_path TEXT`,
  `ALTER TABLE plants ADD COLUMN illustration_thumb TEXT`,
  `ALTER TABLE plants ADD COLUMN illustration_author TEXT`,
  `ALTER TABLE plants ADD COLUMN illustration_source TEXT`,
  `ALTER TABLE plants ADD COLUMN illustration_license TEXT`,
  `ALTER TABLE plants ADD COLUMN illustration_source_url TEXT`,

  // Kandydaci do zatwierdzenia (JSON)
  `ALTER TABLE plants ADD COLUMN image_candidates TEXT`
];

// Utwórz katalogi na zdjęcia
const uploadDirs = [
  path.join(__dirname, '../uploads/plants'),
  path.join(__dirname, '../uploads/plants/photo'),
  path.join(__dirname, '../uploads/plants/photo/full'),
  path.join(__dirname, '../uploads/plants/photo/thumb'),
  path.join(__dirname, '../uploads/plants/illustration'),
  path.join(__dirname, '../uploads/plants/illustration/full'),
  path.join(__dirname, '../uploads/plants/illustration/thumb')
];

console.log('📁 Tworzenie katalogów na zdjęcia...');
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`   ✅ Utworzono: ${dir}`);
  } else {
    console.log(`   ⏭️  Istnieje: ${dir}`);
  }
});

console.log('\n📊 Wykonywanie migracji bazy danych...\n');

let successCount = 0;
let skipCount = 0;

function runMigration(index) {
  if (index >= migrations.length) {
    finalize();
    return;
  }

  const sql = migrations[index];
  const columnMatch = sql.match(/ADD COLUMN (\w+)/);
  const columnName = columnMatch ? columnMatch[1] : 'unknown';

  db.run(sql, (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log(`   ⏭️  Kolumna już istnieje: ${columnName}`);
        skipCount++;
      } else {
        console.error(`   ❌ Błąd przy ${columnName}: ${err.message}`);
      }
    } else {
      console.log(`   ✅ Dodano kolumnę: ${columnName}`);
      successCount++;
    }
    runMigration(index + 1);
  });
}

function finalize() {
  console.log('\n========================================');
  console.log('✅ MIGRACJA ZAKOŃCZONA!');
  console.log(`   📊 Dodano kolumn: ${successCount}`);
  console.log(`   ⏭️  Pominięto (już istnieją): ${skipCount}`);

  // Pokaż aktualną strukturę
  db.all("PRAGMA table_info(plants)", (err, columns) => {
    if (!err) {
      const imageColumns = columns.filter(c =>
        c.name.startsWith('photo_') ||
        c.name.startsWith('illustration_') ||
        c.name === 'image_candidates'
      );
      console.log(`\n📸 Kolumny obrazów w bazie: ${imageColumns.length}`);
      imageColumns.forEach(c => {
        console.log(`   - ${c.name} (${c.type})`);
      });
    }

    db.close(() => {
      console.log('\n✨ Gotowe!\n');
      process.exit(0);
    });
  });
}

runMigration(0);
