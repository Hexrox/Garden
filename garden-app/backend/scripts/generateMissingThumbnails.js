#!/usr/bin/env node

/**
 * Skrypt do generowania brakujących miniaturek dla istniejących zdjęć
 *
 * Przeszukuje bazę danych w poszukiwaniu zdjęć bez miniaturek (thumb_path IS NULL)
 * i generuje dla nich thumb (200x200) i medium (800x600) wersje.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { generateThumbnails } = require('../utils/imageProcessor');

const DB_PATH = path.join(__dirname, '../garden.db');
const UPLOADS_DIR = process.env.NODE_ENV === 'production'
  ? '/var/www/garden-uploads'
  : path.join(__dirname, '../uploads');

console.log('🖼️  Generowanie miniaturek dla istniejących zdjęć');
console.log('=====================================================\n');
console.log(`📂 Katalog uploadów: ${UPLOADS_DIR}`);
console.log(`💾 Baza danych: ${DB_PATH}\n`);

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  // Znajdź wszystkie zdjęcia bez miniaturek
  db.all(
    `SELECT id, photo_path FROM plant_photos
     WHERE thumb_path IS NULL OR medium_path IS NULL`,
    [],
    async (err, photos) => {
      if (err) {
        console.error('❌ Błąd pobierania zdjęć:', err.message);
        db.close();
        process.exit(1);
      }

      console.log(`🔍 Znaleziono ${photos.length} zdjęć bez miniaturek\n`);

      if (photos.length === 0) {
        console.log('✅ Wszystkie zdjęcia mają miniaturki!');
        db.close();
        process.exit(0);
      }

      let processed = 0;
      let errors = 0;
      let skipped = 0;

      // Przetwarzamy sekwencyjnie (żeby nie przeciążyć CPU)
      for (const photo of photos) {
        const filename = path.basename(photo.photo_path);
        const originalPath = path.join(UPLOADS_DIR, filename);

        console.log(`📸 [${processed + errors + skipped + 1}/${photos.length}] ${filename}`);

        // Sprawdź czy plik istnieje
        if (!fs.existsSync(originalPath)) {
          console.log(`   ⚠️  Plik nie istnieje, pomijam`);
          skipped++;
          continue;
        }

        try {
          // Generuj miniaturki
          const thumbnails = await generateThumbnails(originalPath, filename);

          // Zaktualizuj bazę danych
          await new Promise((resolve, reject) => {
            db.run(
              `UPDATE plant_photos
               SET thumb_path = ?, medium_path = ?
               WHERE id = ?`,
              [thumbnails.thumb, thumbnails.medium, photo.id],
              function(err) {
                if (err) {
                  reject(err);
                } else {
                  resolve();
                }
              }
            );
          });

          console.log(`   ✅ Wygenerowano miniaturki`);
          processed++;
        } catch (error) {
          console.log(`   ❌ Błąd: ${error.message}`);
          errors++;
        }
      }

      console.log('\n=====================================================');
      console.log('📊 PODSUMOWANIE:');
      console.log(`   ✅ Przetworzone: ${processed}`);
      console.log(`   ❌ Błędy: ${errors}`);
      console.log(`   ⚠️  Pominięte: ${skipped}`);
      console.log('=====================================================\n');

      // Weryfikacja
      db.get(
        `SELECT
          COUNT(*) as total,
          COUNT(thumb_path) as with_thumb,
          COUNT(medium_path) as with_medium
         FROM plant_photos`,
        [],
        (err, stats) => {
          if (!err) {
            console.log('🔍 Stan bazy danych:');
            console.log(`   📊 Wszystkich zdjęć: ${stats.total}`);
            console.log(`   🖼️  Z miniaturkami: ${stats.with_thumb}/${stats.total} (${Math.round(stats.with_thumb/stats.total*100)}%)`);
            console.log(`   🖼️  Z medium: ${stats.with_medium}/${stats.total} (${Math.round(stats.with_medium/stats.total*100)}%)\n`);
          }

          db.close();
          console.log('✨ Zakończono!');
          process.exit(errors > 0 ? 1 : 0);
        }
      );
    }
  );
});
