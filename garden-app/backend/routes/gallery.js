const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../db');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');
const { generateThumbnails, deleteAllVersions } = require('../utils/imageProcessor');

// Allowed photo tags
const ALLOWED_TAGS = ['warzywa', 'kwiaty', 'zioła', 'owoce', 'siew', 'zbiór',
                      'podlewanie', 'problem', 'pielęgnacja', 'pogoda', 'sukces', 'ogólne'];

// Get all photos for user (unified gallery)
router.get('/', auth, (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  // Filters
  const { plant, plot, year, source_type, tag, show_deleted } = req.query;

  let query = `
    SELECT
      p.*,
      CASE
        WHEN p.bed_id IS NOT NULL THEN 'active'
        WHEN p.bed_id IS NULL AND (p.bed_plant_name IS NOT NULL OR p.bed_row_number IS NOT NULL) THEN 'deleted'
        ELSE 'general'
      END as status
    FROM plant_photos p
    WHERE p.user_id = ?
  `;

  const params = [req.user.id];

  // Apply filters
  if (plant) {
    query += ` AND p.bed_plant_name = ?`;
    params.push(plant);
  }

  if (plot) {
    query += ` AND p.plot_name = ?`;
    params.push(plot);
  }

  if (year) {
    if (!/^\d{4}$/.test(year)) {
      return res.status(400).json({ error: 'Nieprawidłowy format roku' });
    }
    query += ` AND strftime('%Y', p.created_at) = ?`;
    params.push(year);
  }

  if (source_type) {
    query += ` AND p.source_type = ?`;
    params.push(source_type);
  }

  if (tag) {
    query += ` AND p.tag = ?`;
    params.push(tag);
  }

  // Filter deleted photos (from removed beds) but keep general photos
  if (show_deleted !== 'true') {
    query += ` AND NOT (p.bed_id IS NULL AND (p.bed_plant_name IS NOT NULL OR p.bed_row_number IS NOT NULL))`;
  }

  query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  db.all(query, params, (err, photos) => {
    if (err) {
      console.error('Gallery error:', err);
      return res.status(500).json({ error: 'Błąd pobierania galerii' });
    }
    res.json(photos);
  });
});

// Get gallery statistics (optimized with parallel queries)
router.get('/stats', auth, async (req, res) => {
  const userId = req.user.id;

  const dbGet = (sql, params) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
  });

  const dbAll = (sql, params) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
  });

  try {
    const [totalRow, byPlant, byPlot, deletedRow] = await Promise.all([
      dbGet('SELECT COUNT(*) as count FROM plant_photos WHERE user_id = ?', [userId]),
      dbAll(`SELECT bed_plant_name as plant, COUNT(*) as count
             FROM plant_photos
             WHERE user_id = ? AND bed_plant_name IS NOT NULL
             GROUP BY bed_plant_name ORDER BY count DESC LIMIT 10`, [userId]),
      dbAll(`SELECT plot_name as plot, COUNT(*) as count
             FROM plant_photos
             WHERE user_id = ? AND plot_name IS NOT NULL
             GROUP BY plot_name ORDER BY count DESC`, [userId]),
      dbGet('SELECT COUNT(*) as count FROM plant_photos WHERE user_id = ? AND bed_id IS NULL', [userId])
    ]);

    res.json({
      total: totalRow.count,
      byPlant,
      byPlot,
      deletedCount: deletedRow.count
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Update photo metadata (caption, bed, plot, tag, date)
router.put('/:photoId', auth, (req, res) => {
  const { caption, bed_id, tag, taken_date } = req.body;
  const photoId = req.params.photoId;

  // If bed_id is provided, fetch bed info to update related fields
  if (bed_id) {
    db.get(
      `SELECT b.*, p.name as plot_name, p.user_id
       FROM beds b
       JOIN plots p ON b.plot_id = p.id
       WHERE b.id = ? AND p.user_id = ?`,
      [bed_id, req.user.id],
      (err, bed) => {
        if (err) {
          return res.status(500).json({ error: 'Błąd serwera' });
        }
        if (!bed) {
          return res.status(404).json({ error: 'Grządka nie znaleziona' });
        }

        // Update with bed context
        db.run(
          `UPDATE plant_photos
           SET caption = ?,
               bed_id = ?,
               bed_row_number = ?,
               bed_plant_name = ?,
               bed_plant_variety = ?,
               plot_name = ?,
               tag = ?,
               taken_date = ?
           WHERE id = ? AND user_id = ?`,
          [
            caption,
            bed_id,
            bed.row_number,
            bed.plant_name,
            bed.plant_variety,
            bed.plot_name,
            tag || null,
            taken_date || null,
            photoId,
            req.user.id
          ],
          function (err) {
            if (err) {
              console.error('Update photo error:', err);
              return res.status(500).json({ error: 'Błąd aktualizacji' });
            }
            if (this.changes === 0) {
              return res.status(404).json({ error: 'Zdjęcie nie znalezione' });
            }
            res.json({ message: 'Zdjęcie zaktualizowane' });
          }
        );
      }
    );
  } else {
    // Update without bed context (general photo or remove bed assignment)
    db.run(
      `UPDATE plant_photos
       SET caption = ?,
           bed_id = NULL,
           bed_row_number = NULL,
           bed_plant_name = NULL,
           bed_plant_variety = NULL,
           plot_name = NULL,
           tag = ?,
           taken_date = ?
       WHERE id = ? AND user_id = ?`,
      [caption, tag || null, taken_date || null, photoId, req.user.id],
      function (err) {
        if (err) {
          console.error('Update photo error:', err);
          return res.status(500).json({ error: 'Błąd aktualizacji' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Zdjęcie nie znalezione' });
        }
        res.json({ message: 'Zdjęcie zaktualizowane' });
      }
    );
  }
});

// Bulk delete photos
router.delete('/bulk', auth, (req, res) => {
  const { photoIds } = req.body;

  if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
    return res.status(400).json({ error: 'Brak ID zdjęć do usunięcia' });
  }

  // Get all photos to delete their files
  const placeholders = photoIds.map(() => '?').join(',');
  db.all(
    `SELECT photo_path FROM plant_photos WHERE id IN (${placeholders}) AND user_id = ?`,
    [...photoIds, req.user.id],
    (err, photos) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }

      // Delete from database
      db.run(
        `DELETE FROM plant_photos WHERE id IN (${placeholders}) AND user_id = ?`,
        [...photoIds, req.user.id],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'Błąd usuwania' });
          }

          // Delete all versions of files from disk
          photos.forEach(photo => {
            deleteAllVersions(photo.photo_path);
          });

          res.json({
            message: 'Zdjęcia usunięte',
            deletedCount: this.changes
          });
        }
      );
    }
  );
});

// Delete photo
router.delete('/:photoId', auth, (req, res) => {
  // First get photo path to delete file
  db.get(
    `SELECT photo_path FROM plant_photos WHERE id = ? AND user_id = ?`,
    [req.params.photoId, req.user.id],
    (err, photo) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      if (!photo) {
        return res.status(404).json({ error: 'Zdjęcie nie znalezione' });
      }

      // Delete from database
      db.run(
        `DELETE FROM plant_photos WHERE id = ? AND user_id = ?`,
        [req.params.photoId, req.user.id],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'Błąd usuwania' });
          }

          // Delete all versions of the file from disk (original, thumb, medium)
          deleteAllVersions(photo.photo_path);

          res.json({ message: 'Zdjęcie usunięte' });
        }
      );
    }
  );
});

// Quick photo upload (for mobile users in garden)
router.post('/quick', auth, upload.single('photo'), [
  body('tag').optional().isIn(ALLOWED_TAGS).withMessage('Nieprawidłowy tag'),
  body('caption').optional().trim().isLength({ max: 200 }).escape().withMessage('Opis może mieć maksymalnie 200 znaków'),
  body('bed_id').optional().isInt().withMessage('Nieprawidłowe ID grządki'),
  body('plot_id').optional().isInt().withMessage('Nieprawidłowe ID poletka')
], async (req, res) => {
  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Clean up uploaded file on validation error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Failed to cleanup file:', err);
      });
    }
    return res.status(400).json({ errors: errors.array() });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Brak zdjęcia' });
  }

  const { tag, caption, bed_id, plot_id } = req.body;

  // Generate thumbnails
  let thumbnails;
  try {
    thumbnails = await generateThumbnails(req.file.path, req.file.filename);
  } catch (error) {
    console.error('Error generating thumbnails:', error);
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Failed to cleanup file:', err);
      });
    }
    return res.status(500).json({ error: 'Błąd przetwarzania zdjęcia' });
  }

  // If bed_id provided, get context from bed
  if (bed_id) {
    db.get(
      `SELECT b.*, p.name as plot_name, p.user_id
       FROM beds b
       JOIN plots p ON b.plot_id = p.id
       WHERE b.id = ? AND p.user_id = ?`,
      [bed_id, req.user.id],
      (err, bed) => {
        if (err) {
          return res.status(500).json({ error: 'Błąd serwera' });
        }
        if (!bed) {
          return res.status(404).json({ error: 'Grządka nie znaleziona' });
        }

        // Insert with bed context
        db.run(
          `INSERT INTO plant_photos (
            user_id, bed_id, photo_path, thumb_path, medium_path, caption, tag, source_type,
            bed_row_number, bed_plant_name, bed_plant_variety, plot_name, taken_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'quick', ?, ?, ?, ?, date('now'))`,
          [
            req.user.id,
            bed_id,
            thumbnails.original,
            thumbnails.thumb,
            thumbnails.medium,
            caption || null,
            tag || null,
            bed.row_number,
            bed.plant_name,
            bed.plant_variety,
            bed.plot_name
          ],
          function (err) {
            if (err) {
              // Clean up uploaded file on database error
              if (req.file && req.file.path) {
                fs.unlink(req.file.path, (unlinkErr) => {
                  if (unlinkErr) console.error('Failed to cleanup file:', unlinkErr);
                });
              }
              console.error('Quick photo insert error:', err);
              return res.status(500).json({ error: 'Błąd zapisywania zdjęcia' });
            }
            res.status(201).json({
              message: 'Zdjęcie dodane!',
              photoId: this.lastID,
              photoPath: thumbnails.original
            });
          }
        );
      }
    );
  } else if (plot_id) {
    // Just plot context, no bed
    db.get(
      `SELECT name, user_id FROM plots WHERE id = ? AND user_id = ?`,
      [plot_id, req.user.id],
      (err, plot) => {
        if (err) {
          return res.status(500).json({ error: 'Błąd serwera' });
        }
        if (!plot) {
          return res.status(404).json({ error: 'Poletko nie znalezione' });
        }

        db.run(
          `INSERT INTO plant_photos (
            user_id, photo_path, thumb_path, medium_path, caption, tag, source_type, plot_name, taken_date
          ) VALUES (?, ?, ?, ?, ?, ?, 'quick', ?, date('now'))`,
          [req.user.id, thumbnails.original, thumbnails.thumb, thumbnails.medium, caption || null, tag || null, plot.name],
          function (err) {
            if (err) {
              // Clean up uploaded file on database error
              if (req.file && req.file.path) {
                fs.unlink(req.file.path, (unlinkErr) => {
                  if (unlinkErr) console.error('Failed to cleanup file:', unlinkErr);
                });
              }
              return res.status(500).json({ error: 'Błąd zapisywania zdjęcia' });
            }
            res.status(201).json({
              message: 'Zdjęcie dodane!',
              photoId: this.lastID,
              photoPath: thumbnails.original
            });
          }
        );
      }
    );
  } else {
    // No location context - general photo
    db.run(
      `INSERT INTO plant_photos (
        user_id, photo_path, thumb_path, medium_path, caption, tag, source_type, taken_date
      ) VALUES (?, ?, ?, ?, ?, ?, 'quick', date('now'))`,
      [req.user.id, thumbnails.original, thumbnails.thumb, thumbnails.medium, caption || null, tag || null],
      function (err) {
        if (err) {
          // Clean up uploaded file on database error
          if (req.file && req.file.path) {
            fs.unlink(req.file.path, (unlinkErr) => {
              if (unlinkErr) console.error('Failed to cleanup file:', unlinkErr);
            });
          }
          return res.status(500).json({ error: 'Błąd zapisywania zdjęcia' });
        }
        res.status(201).json({
          message: 'Zdjęcie dodane!',
          photoId: this.lastID,
          photoPath: photoPath
        });
      }
    );
  }
});

module.exports = router;
