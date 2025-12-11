const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../db');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

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

// Get gallery statistics
router.get('/stats', auth, (req, res) => {
  const queries = {
    total: `SELECT COUNT(*) as count FROM plant_photos WHERE user_id = ?`,

    byPlant: `
      SELECT bed_plant_name as plant, COUNT(*) as count
      FROM plant_photos
      WHERE user_id = ? AND bed_plant_name IS NOT NULL
      GROUP BY bed_plant_name
      ORDER BY count DESC
      LIMIT 10
    `,

    byPlot: `
      SELECT plot_name as plot, COUNT(*) as count
      FROM plant_photos
      WHERE user_id = ? AND plot_name IS NOT NULL
      GROUP BY plot_name
      ORDER BY count DESC
    `,

    deletedCount: `
      SELECT COUNT(*) as count
      FROM plant_photos
      WHERE user_id = ? AND bed_id IS NULL
    `
  };

  const stats = {};

  // Total
  db.get(queries.total, [req.user.id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Błąd serwera' });
    stats.total = row.count;

    // By plant
    db.all(queries.byPlant, [req.user.id], (err, rows) => {
      if (err) return res.status(500).json({ error: 'Błąd serwera' });
      stats.byPlant = rows;

      // By plot
      db.all(queries.byPlot, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Błąd serwera' });
        stats.byPlot = rows;

        // Deleted count
        db.get(queries.deletedCount, [req.user.id], (err, row) => {
          if (err) return res.status(500).json({ error: 'Błąd serwera' });
          stats.deletedCount = row.count;

          res.json(stats);
        });
      });
    });
  });
});

// Update photo caption
router.put('/:photoId', auth, (req, res) => {
  const { caption } = req.body;

  db.run(
    `UPDATE plant_photos
     SET caption = ?
     WHERE id = ? AND user_id = ?`,
    [caption, req.params.photoId, req.user.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Błąd aktualizacji' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Zdjęcie nie znalezione' });
      }
      res.json({ message: 'Opis zaktualizowany' });
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

          // Delete file from disk
          const fs = require('fs');
          const path = require('path');
          const filePath = path.join(__dirname, '..', photo.photo_path);

          fs.unlink(filePath, (err) => {
            if (err) {
              console.error('Error deleting file:', err);
              // Don't fail - file might already be deleted
            }
          });

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
], (req, res) => {
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
  const photoPath = `uploads/${req.file.filename}`;

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
            user_id, bed_id, photo_path, caption, tag, source_type,
            bed_row_number, bed_plant_name, bed_plant_variety, plot_name, taken_date
          ) VALUES (?, ?, ?, ?, ?, 'quick', ?, ?, ?, ?, date('now'))`,
          [
            req.user.id,
            bed_id,
            photoPath,
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
              photoPath: photoPath
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
            user_id, photo_path, caption, tag, source_type, plot_name, taken_date
          ) VALUES (?, ?, ?, ?, 'quick', ?, date('now'))`,
          [req.user.id, photoPath, caption || null, tag || null, plot.name],
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
    );
  } else {
    // No location context - general photo
    db.run(
      `INSERT INTO plant_photos (
        user_id, photo_path, caption, tag, source_type, taken_date
      ) VALUES (?, ?, ?, ?, 'quick', date('now'))`,
      [req.user.id, photoPath, caption || null, tag || null],
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
