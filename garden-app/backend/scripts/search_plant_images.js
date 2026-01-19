#!/usr/bin/env node

/**
 * Skrypt wyszukiwania zdjęć roślin z Wikimedia Commons
 *
 * Wyszukuje zdjęcia po nazwie łacińskiej i zapisuje kandydatów do bazy
 * Kandydaci są później zatwierdzani w panelu admina
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const https = require('https');

const DB_PATH = path.join(__dirname, '../garden.db');

console.log('🔍 Garden App - Wyszukiwanie Zdjęć Roślin');
console.log('==========================================\n');

const db = new sqlite3.Database(DB_PATH);

// Wikimedia Commons API
const WIKIMEDIA_API = 'https://commons.wikimedia.org/w/api.php';

// Limity
const MAX_CANDIDATES_PER_PLANT = 6; // 3 foto + 3 ilustracje
const DELAY_BETWEEN_REQUESTS = 500; // ms - szanujemy API

/**
 * Wyszukaj obrazy w Wikimedia Commons
 */
async function searchWikimedia(query, type = 'photo') {
  return new Promise((resolve, reject) => {
    // Dodaj filtry do zapytania
    let searchQuery = query;
    if (type === 'illustration') {
      searchQuery += ' botanical illustration OR drawing OR vintage';
    }

    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      generator: 'search',
      gsrsearch: `File:${searchQuery}`,
      gsrlimit: '10',
      gsrnamespace: '6', // File namespace
      prop: 'imageinfo',
      iiprop: 'url|extmetadata|size|mime',
      iiurlwidth: '800'
    });

    const url = `${WIKIMEDIA_API}?${params}`;

    https.get(url, { headers: { 'User-Agent': 'GardenApp/1.0 (contact@gardenapp.pl)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const results = [];

          if (json.query && json.query.pages) {
            Object.values(json.query.pages).forEach(page => {
              if (page.imageinfo && page.imageinfo[0]) {
                const info = page.imageinfo[0];
                const meta = info.extmetadata || {};

                // Filtruj tylko obrazy
                if (!info.mime || !info.mime.startsWith('image/')) return;

                // Sprawdź licencję
                const license = meta.LicenseShortName?.value || meta.License?.value || 'Unknown';
                const isFreeLicense = /cc|public domain|pd|cc0|gfdl/i.test(license);

                if (!isFreeLicense) return;

                // Określ typ obrazu
                const title = page.title.toLowerCase();
                const desc = (meta.ImageDescription?.value || '').toLowerCase();
                const isIllustration = /illustration|drawing|botanical|vintage|engraving|lithograph|woodcut/i.test(title + ' ' + desc);

                results.push({
                  title: page.title.replace('File:', ''),
                  url: info.url,
                  thumbUrl: info.thumburl,
                  width: info.width,
                  height: info.height,
                  author: meta.Artist?.value?.replace(/<[^>]*>/g, '') || 'Unknown',
                  license: license,
                  description: meta.ImageDescription?.value?.replace(/<[^>]*>/g, '').substring(0, 200) || '',
                  source: 'Wikimedia Commons',
                  sourceUrl: info.descriptionurl,
                  type: isIllustration ? 'illustration' : 'photo'
                });
              }
            });
          }

          resolve(results);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

/**
 * Przetwórz jedną roślinę
 */
async function processPlant(plant) {
  if (!plant.latin_name) {
    return { id: plant.id, name: plant.display_name, status: 'skip', reason: 'Brak nazwy łacińskiej' };
  }

  // Już ma kandydatów?
  if (plant.image_candidates) {
    const existing = JSON.parse(plant.image_candidates);
    if (existing.length > 0) {
      return { id: plant.id, name: plant.display_name, status: 'skip', reason: 'Ma już kandydatów' };
    }
  }

  // Już ma zatwierdzone zdjęcia?
  if (plant.photo_path || plant.illustration_path) {
    return { id: plant.id, name: plant.display_name, status: 'skip', reason: 'Ma już zdjęcia' };
  }

  try {
    // Wyciągnij nazwę gatunku (bez odmiany)
    const latinParts = plant.latin_name.split("'")[0].trim();
    const genusSpecies = latinParts.split(' ').slice(0, 2).join(' ');

    // Szukaj zdjęć
    const allResults = await searchWikimedia(genusSpecies);

    // Podziel na typy
    const photos = allResults.filter(r => r.type === 'photo').slice(0, 3);
    const illustrations = allResults.filter(r => r.type === 'illustration').slice(0, 3);

    // Jeśli brak ilustracji, szukaj osobno
    if (illustrations.length === 0) {
      await sleep(DELAY_BETWEEN_REQUESTS);
      const illustrationResults = await searchWikimedia(genusSpecies, 'illustration');
      illustrations.push(...illustrationResults.filter(r => r.type === 'illustration').slice(0, 3));
    }

    const candidates = [...photos, ...illustrations];

    if (candidates.length === 0) {
      return { id: plant.id, name: plant.display_name, status: 'empty', reason: 'Nie znaleziono zdjęć' };
    }

    // Zapisz kandydatów
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE plants SET image_candidates = ? WHERE id = ?',
        [JSON.stringify(candidates), plant.id],
        (err) => err ? reject(err) : resolve()
      );
    });

    return {
      id: plant.id,
      name: plant.display_name,
      status: 'found',
      photos: photos.length,
      illustrations: illustrations.length
    };
  } catch (error) {
    return { id: plant.id, name: plant.display_name, status: 'error', reason: error.message };
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Główna funkcja
 */
async function main() {
  // Pobierz argumenty
  const args = process.argv.slice(2);
  const limitArg = args.find(a => a.startsWith('--limit='));
  const categoryArg = args.find(a => a.startsWith('--category='));
  const forceArg = args.includes('--force');

  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 50;
  const category = categoryArg ? categoryArg.split('=')[1] : null;

  console.log(`📋 Parametry:`);
  console.log(`   Limit: ${limit} roślin`);
  console.log(`   Kategoria: ${category || 'wszystkie'}`);
  console.log(`   Force: ${forceArg ? 'tak' : 'nie'}\n`);

  // Pobierz rośliny do przetworzenia
  let sql = `
    SELECT id, display_name, latin_name, category, image_candidates, photo_path, illustration_path
    FROM plants
    WHERE latin_name IS NOT NULL AND latin_name != ''
  `;

  if (category) {
    sql += ` AND category = '${category}'`;
  }

  if (!forceArg) {
    sql += ` AND (image_candidates IS NULL OR image_candidates = '[]')
             AND photo_path IS NULL AND illustration_path IS NULL`;
  }

  sql += ` ORDER BY category, display_name LIMIT ${limit}`;

  const plants = await new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => err ? reject(err) : resolve(rows));
  });

  console.log(`🌱 Znaleziono ${plants.length} roślin do przetworzenia\n`);

  if (plants.length === 0) {
    console.log('✅ Wszystkie rośliny mają już kandydatów lub zdjęcia!');
    db.close();
    return;
  }

  const stats = { found: 0, empty: 0, skip: 0, error: 0 };
  let processed = 0;

  for (const plant of plants) {
    const result = await processPlant(plant);
    stats[result.status]++;
    processed++;

    const icon = {
      found: '✅',
      empty: '⚠️',
      skip: '⏭️',
      error: '❌'
    }[result.status];

    const detail = result.status === 'found'
      ? `(📷${result.photos} 🎨${result.illustrations})`
      : `(${result.reason})`;

    console.log(`${icon} [${processed}/${plants.length}] ${result.name} ${detail}`);

    if (result.status !== 'skip') {
      await sleep(DELAY_BETWEEN_REQUESTS);
    }
  }

  console.log('\n==========================================');
  console.log('📊 PODSUMOWANIE');
  console.log(`   ✅ Znaleziono kandydatów: ${stats.found}`);
  console.log(`   ⚠️  Brak wyników: ${stats.empty}`);
  console.log(`   ⏭️  Pominięto: ${stats.skip}`);
  console.log(`   ❌ Błędy: ${stats.error}`);

  // Statystyki ogólne
  const totalStats = await new Promise((resolve, reject) => {
    db.get(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN image_candidates IS NOT NULL AND image_candidates != '[]' THEN 1 ELSE 0 END) as with_candidates,
        SUM(CASE WHEN photo_path IS NOT NULL THEN 1 ELSE 0 END) as with_photo,
        SUM(CASE WHEN illustration_path IS NOT NULL THEN 1 ELSE 0 END) as with_illustration
      FROM plants
    `, (err, row) => err ? reject(err) : resolve(row));
  });

  console.log(`\n📈 Stan bazy:`);
  console.log(`   Wszystkich roślin: ${totalStats.total}`);
  console.log(`   Z kandydatami: ${totalStats.with_candidates}`);
  console.log(`   Ze zdjęciem: ${totalStats.with_photo}`);
  console.log(`   Z ilustracją: ${totalStats.with_illustration}`);

  db.close(() => {
    console.log('\n✨ Gotowe! Użyj panelu admina aby zatwierdzić zdjęcia.\n');
  });
}

main().catch(err => {
  console.error('❌ Błąd:', err);
  process.exit(1);
});
