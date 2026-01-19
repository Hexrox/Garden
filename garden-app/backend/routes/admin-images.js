const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Ścieżki do zdjęć
const UPLOAD_BASE = path.join(__dirname, '../uploads/plants');

/**
 * Middleware - tylko admin
 */
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Wymagane zalogowanie' });
  }

  // Sprawdź rolę admina
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Brak uprawnień. Wymagana rola administratora.' });
  }

  next();
};

/**
 * GET /api/admin/images/plants
 * Lista roślin z kandydatami do zatwierdzenia
 */
router.get('/plants', auth, adminOnly, async (req, res) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];

    if (status === 'pending') {
      whereConditions.push("(image_candidates IS NOT NULL AND image_candidates != '[]' AND photo_path IS NULL)");
    } else if (status === 'approved') {
      whereConditions.push("(photo_path IS NOT NULL OR illustration_path IS NOT NULL)");
    } else if (status === 'no-candidates') {
      whereConditions.push("(image_candidates IS NULL OR image_candidates = '[]')");
    }

    if (category) {
      whereConditions.push("category = ?");
      params.push(category);
    }

    const whereClause = whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Pobierz rośliny
    const plants = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, display_name, latin_name, category,
               image_candidates, photo_path, photo_thumb, photo_author, photo_source, photo_license,
               illustration_path, illustration_thumb, illustration_author, illustration_source, illustration_license
        FROM plants
        ${whereClause}
        ORDER BY
          CASE WHEN image_candidates IS NOT NULL AND image_candidates != '[]' AND photo_path IS NULL THEN 0 ELSE 1 END,
          category, display_name
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Policz statystyki
    const stats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN image_candidates IS NOT NULL AND image_candidates != '[]' AND photo_path IS NULL THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN photo_path IS NOT NULL OR illustration_path IS NOT NULL THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN (image_candidates IS NULL OR image_candidates = '[]') AND photo_path IS NULL THEN 1 ELSE 0 END) as no_candidates
        FROM plants
      `, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    // Parsuj candidates JSON
    const plantsWithParsedCandidates = plants.map(p => ({
      ...p,
      image_candidates: p.image_candidates ? JSON.parse(p.image_candidates) : []
    }));

    res.json({
      plants: plantsWithParsedCandidates,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: stats.total
      }
    });
  } catch (error) {
    console.error('Error fetching plants for admin:', error);
    res.status(500).json({ error: 'Błąd pobierania roślin' });
  }
});

/**
 * POST /api/admin/images/approve/:plantId
 * Zatwierdź wybrane zdjęcie
 */
router.post('/approve/:plantId', auth, adminOnly, async (req, res) => {
  try {
    const { plantId } = req.params;
    const { candidate, type } = req.body; // type: 'photo' lub 'illustration'

    if (!candidate || !type) {
      return res.status(400).json({ error: 'Wymagane: candidate i type' });
    }

    if (!['photo', 'illustration'].includes(type)) {
      return res.status(400).json({ error: 'Type musi być: photo lub illustration' });
    }

    // Pobierz roślinę
    const plant = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM plants WHERE id = ?', [plantId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!plant) {
      return res.status(404).json({ error: 'Roślina nie znaleziona' });
    }

    // Generuj nazwy plików
    const safeFileName = plant.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = Date.now();
    const ext = path.extname(candidate.url) || '.jpg';

    const fullFileName = `${safeFileName}_${timestamp}${ext}`;
    const thumbFileName = `${safeFileName}_${timestamp}_thumb${ext}`;

    const fullDir = path.join(UPLOAD_BASE, type, 'full');
    const thumbDir = path.join(UPLOAD_BASE, type, 'thumb');

    // Upewnij się że katalogi istnieją
    if (!fs.existsSync(fullDir)) fs.mkdirSync(fullDir, { recursive: true });
    if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

    const fullPath = path.join(fullDir, fullFileName);
    const thumbPath = path.join(thumbDir, thumbFileName);

    // Pobierz zdjęcie
    console.log(`📥 Pobieranie: ${candidate.url}`);
    const imageBuffer = await downloadImage(candidate.url);

    // Zapisz pełny rozmiar (max 1200px szerokości)
    await sharp(imageBuffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(fullPath);

    // Generuj miniaturkę (200x200)
    await sharp(imageBuffer)
      .resize(200, 200, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(thumbPath);

    // Zapisz w bazie
    const relativePath = `plants/${type}/full/${fullFileName}`;
    const relativeThumb = `plants/${type}/thumb/${thumbFileName}`;

    const updateFields = type === 'photo'
      ? {
          photo_path: relativePath,
          photo_thumb: relativeThumb,
          photo_author: candidate.author || 'Unknown',
          photo_source: candidate.source || 'Wikimedia Commons',
          photo_license: candidate.license || 'Unknown',
          photo_source_url: candidate.sourceUrl || candidate.url
        }
      : {
          illustration_path: relativePath,
          illustration_thumb: relativeThumb,
          illustration_author: candidate.author || 'Unknown',
          illustration_source: candidate.source || 'Wikimedia Commons',
          illustration_license: candidate.license || 'Unknown',
          illustration_source_url: candidate.sourceUrl || candidate.url
        };

    const setClauses = Object.keys(updateFields).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(updateFields), plantId];

    await new Promise((resolve, reject) => {
      db.run(`UPDATE plants SET ${setClauses} WHERE id = ?`, values, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Usuń zatwierdzony kandydat z listy
    if (plant.image_candidates) {
      const candidates = JSON.parse(plant.image_candidates);
      const remaining = candidates.filter(c => c.url !== candidate.url);
      await new Promise((resolve, reject) => {
        db.run('UPDATE plants SET image_candidates = ? WHERE id = ?',
          [JSON.stringify(remaining), plantId],
          (err) => err ? reject(err) : resolve()
        );
      });
    }

    console.log(`✅ Zatwierdzono ${type} dla: ${plant.display_name}`);

    res.json({
      success: true,
      message: `Zatwierdzono ${type === 'photo' ? 'zdjęcie' : 'ilustrację'}`,
      paths: {
        full: relativePath,
        thumb: relativeThumb
      }
    });
  } catch (error) {
    console.error('Error approving image:', error);
    res.status(500).json({ error: 'Błąd zatwierdzania zdjęcia: ' + error.message });
  }
});

/**
 * POST /api/admin/images/reject/:plantId
 * Odrzuć kandydata
 */
router.post('/reject/:plantId', auth, adminOnly, async (req, res) => {
  try {
    const { plantId } = req.params;
    const { candidateUrl } = req.body;

    if (!candidateUrl) {
      return res.status(400).json({ error: 'Wymagane: candidateUrl' });
    }

    const plant = await new Promise((resolve, reject) => {
      db.get('SELECT image_candidates FROM plants WHERE id = ?', [plantId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!plant) {
      return res.status(404).json({ error: 'Roślina nie znaleziona' });
    }

    const candidates = plant.image_candidates ? JSON.parse(plant.image_candidates) : [];
    const remaining = candidates.filter(c => c.url !== candidateUrl);

    await new Promise((resolve, reject) => {
      db.run('UPDATE plants SET image_candidates = ? WHERE id = ?',
        [JSON.stringify(remaining), plantId],
        (err) => err ? reject(err) : resolve()
      );
    });

    res.json({
      success: true,
      message: 'Kandydat odrzucony',
      remainingCandidates: remaining.length
    });
  } catch (error) {
    console.error('Error rejecting candidate:', error);
    res.status(500).json({ error: 'Błąd odrzucania kandydata' });
  }
});

/**
 * DELETE /api/admin/images/:plantId/:type
 * Usuń zatwierdzone zdjęcie
 */
router.delete('/:plantId/:type', auth, adminOnly, async (req, res) => {
  try {
    const { plantId, type } = req.params;

    if (!['photo', 'illustration'].includes(type)) {
      return res.status(400).json({ error: 'Type musi być: photo lub illustration' });
    }

    const plant = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM plants WHERE id = ?', [plantId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!plant) {
      return res.status(404).json({ error: 'Roślina nie znaleziona' });
    }

    const pathField = type === 'photo' ? 'photo_path' : 'illustration_path';
    const thumbField = type === 'photo' ? 'photo_thumb' : 'illustration_thumb';

    // Usuń pliki
    if (plant[pathField]) {
      const fullPath = path.join(__dirname, '../uploads', plant[pathField]);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }
    if (plant[thumbField]) {
      const thumbPath = path.join(__dirname, '../uploads', plant[thumbField]);
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
    }

    // Wyczyść w bazie
    const clearFields = type === 'photo'
      ? 'photo_path = NULL, photo_thumb = NULL, photo_author = NULL, photo_source = NULL, photo_license = NULL, photo_source_url = NULL'
      : 'illustration_path = NULL, illustration_thumb = NULL, illustration_author = NULL, illustration_source = NULL, illustration_license = NULL, illustration_source_url = NULL';

    await new Promise((resolve, reject) => {
      db.run(`UPDATE plants SET ${clearFields} WHERE id = ?`, [plantId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({
      success: true,
      message: `Usunięto ${type === 'photo' ? 'zdjęcie' : 'ilustrację'}`
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Błąd usuwania zdjęcia' });
  }
});

/**
 * POST /api/admin/images/search/:plantId
 * Wyszukaj nowych kandydatów dla rośliny
 */
router.post('/search/:plantId', auth, adminOnly, async (req, res) => {
  try {
    const { plantId } = req.params;
    const { query } = req.body;

    const plant = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM plants WHERE id = ?', [plantId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!plant) {
      return res.status(404).json({ error: 'Roślina nie znaleziona' });
    }

    const searchQuery = query || plant.latin_name;
    if (!searchQuery) {
      return res.status(400).json({ error: 'Brak nazwy do wyszukania' });
    }

    // Wyszukaj w Wikimedia
    const results = await searchWikimediaImages(searchQuery);

    // Zapisz kandydatów
    const existing = plant.image_candidates ? JSON.parse(plant.image_candidates) : [];
    const existingUrls = new Set(existing.map(c => c.url));
    const newCandidates = results.filter(r => !existingUrls.has(r.url));

    const allCandidates = [...existing, ...newCandidates];

    await new Promise((resolve, reject) => {
      db.run('UPDATE plants SET image_candidates = ? WHERE id = ?',
        [JSON.stringify(allCandidates), plantId],
        (err) => err ? reject(err) : resolve()
      );
    });

    res.json({
      success: true,
      query: searchQuery,
      found: results.length,
      newCandidates: newCandidates.length,
      totalCandidates: allCandidates.length,
      candidates: allCandidates
    });
  } catch (error) {
    console.error('Error searching images:', error);
    res.status(500).json({ error: 'Błąd wyszukiwania: ' + error.message });
  }
});

/**
 * Helper: Pobierz obraz z URL
 */
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, { headers: { 'User-Agent': 'GardenApp/1.0' } }, (res) => {
      // Obsłuż przekierowania
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadImage(res.headers.location).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }

      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Helper: Wyszukaj obrazy w Wikimedia Commons
 */
function searchWikimediaImages(query) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      generator: 'search',
      gsrsearch: `File:${query}`,
      gsrlimit: '15',
      gsrnamespace: '6',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata|size|mime',
      iiurlwidth: '400'
    });

    const url = `https://commons.wikimedia.org/w/api.php?${params}`;

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

                if (!info.mime || !info.mime.startsWith('image/')) return;

                const license = meta.LicenseShortName?.value || meta.License?.value || 'Unknown';
                const isFreeLicense = /cc|public domain|pd|cc0|gfdl/i.test(license);

                if (!isFreeLicense) return;

                const title = page.title.toLowerCase();
                const desc = (meta.ImageDescription?.value || '').toLowerCase();
                const isIllustration = /illustration|drawing|botanical|vintage|engraving|lithograph/i.test(title + ' ' + desc);

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

module.exports = router;
