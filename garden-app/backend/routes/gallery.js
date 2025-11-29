const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Get all photos for user (unified gallery)
router.get('/', auth, (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  // Filters
  const { plant, plot, year, source_type, show_deleted } = req.query;

  let query = `
    SELECT
      p.*,
      CASE
        WHEN p.bed_id IS NOT NULL THEN 'active'
        ELSE 'deleted'
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

  if (show_deleted !== 'true') {
    query += ` AND p.bed_id IS NOT NULL`; // Only active beds
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

module.exports = router;
