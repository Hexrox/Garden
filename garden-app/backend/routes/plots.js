const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../db');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { deleteFile } = require('../utils/fileCleanup');

// Get all plots for logged-in user
router.get('/plots', auth, (req, res) => {
  db.all('SELECT * FROM plots WHERE user_id = ? ORDER BY created_at DESC', [req.user.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Błąd serwera' });
    }
    res.json(rows);
  });
});

// Get single plot by ID
router.get('/plots/:id', auth, (req, res) => {
  db.get('SELECT * FROM plots WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err, plot) => {
    if (err) {
      return res.status(500).json({ error: 'Błąd serwera' });
    }
    if (!plot) {
      return res.status(404).json({ error: 'Poletko nie znalezione' });
    }
    res.json(plot);
  });
});

// Get plot with all beds and spray history (optimized - single JOIN query)
router.get('/plots/:id/details', auth, (req, res) => {
  const plotId = req.params.id;

  // Single optimized query with JOINs instead of N+1 queries
  const query = `
    SELECT
      p.*,
      b.id as bed_id,
      b.row_number,
      b.plant_name,
      b.plant_variety,
      b.planted_date,
      b.note as bed_note,
      b.image_path as bed_image,
      b.created_at as bed_created,
      sh.id as spray_id,
      sh.spray_name,
      sh.spray_type,
      sh.spray_date,
      sh.withdrawal_period,
      sh.safe_harvest_date,
      sh.dosage,
      sh.weather_conditions,
      sh.note as spray_note,
      sh.created_at as spray_created
    FROM plots p
    LEFT JOIN beds b ON p.id = b.plot_id
    LEFT JOIN spray_history sh ON b.id = sh.bed_id
    WHERE p.id = ? AND p.user_id = ?
    ORDER BY b.row_number, sh.spray_date DESC
  `;

  db.all(query, [plotId, req.user.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Błąd serwera' });
    }

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Poletko nie znalezione' });
    }

    // Transform flat rows into nested structure
    const plot = {
      id: rows[0].id,
      user_id: rows[0].user_id,
      name: rows[0].name,
      description: rows[0].description,
      image_path: rows[0].image_path,
      created_at: rows[0].created_at,
      beds: []
    };

    const bedsMap = new Map();

    rows.forEach(row => {
      // Add bed if not already in map
      if (row.bed_id && !bedsMap.has(row.bed_id)) {
        bedsMap.set(row.bed_id, {
          id: row.bed_id,
          plot_id: plotId,
          row_number: row.row_number,
          plant_name: row.plant_name,
          plant_variety: row.plant_variety,
          planted_date: row.planted_date,
          note: row.bed_note,
          image_path: row.bed_image,
          created_at: row.bed_created,
          sprays: []
        });
      }

      // Add spray to bed if exists
      if (row.spray_id && bedsMap.has(row.bed_id)) {
        const bed = bedsMap.get(row.bed_id);
        // Avoid duplicate sprays (can happen with JOIN)
        if (!bed.sprays.find(s => s.id === row.spray_id)) {
          bed.sprays.push({
            id: row.spray_id,
            bed_id: row.bed_id,
            spray_name: row.spray_name,
            spray_type: row.spray_type,
            spray_date: row.spray_date,
            withdrawal_period: row.withdrawal_period,
            safe_harvest_date: row.safe_harvest_date,
            dosage: row.dosage,
            weather_conditions: row.weather_conditions,
            note: row.spray_note,
            created_at: row.spray_created
          });
        }
      }
    });

    plot.beds = Array.from(bedsMap.values());
    res.json(plot);
  });
});

// Create new plot
router.post('/plots',
  auth,
  upload.single('image'),
  [
    body('name').trim().notEmpty().withMessage('Nazwa jest wymagana'),
    body('description').optional()
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;
    const imagePath = req.file ? req.file.path : null;

    db.run(
      'INSERT INTO plots (user_id, name, description, image_path) VALUES (?, ?, ?, ?)',
      [req.user.id, name, description, imagePath],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Błąd podczas tworzenia poletka' });
        }

        res.status(201).json({
          message: 'Poletko utworzone pomyślnie',
          plot: {
            id: this.lastID,
            user_id: req.user.id,
            name,
            description,
            image_path: imagePath
          }
        });
      }
    );
  }
);

// Update plot
router.put('/plots/:id',
  auth,
  upload.single('image'),
  [
    body('name').optional().trim().notEmpty().withMessage('Nazwa nie może być pusta'),
    body('description').optional()
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;
    const imagePath = req.file ? req.file.path : undefined;

    // If new image uploaded, delete old image first
    if (imagePath) {
      db.get('SELECT image_path FROM plots WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err, plot) => {
        if (!err && plot && plot.image_path) {
          deleteFile(plot.image_path);
        }
      });
    }

    // Build update query dynamically
    let updateFields = [];
    let values = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      values.push(description);
    }
    if (imagePath !== undefined) {
      updateFields.push('image_path = ?');
      values.push(imagePath);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Brak danych do aktualizacji' });
    }

    values.push(req.params.id, req.user.id);

    db.run(
      `UPDATE plots SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
      values,
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Błąd podczas aktualizacji' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Poletko nie znalezione' });
        }

        res.json({ message: 'Poletko zaktualizowane pomyślnie' });
      }
    );
  }
);

// Delete plot
router.delete('/plots/:id', auth, (req, res) => {
  db.run('DELETE FROM plots WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Błąd podczas usuwania' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Poletko nie znalezione' });
    }

    res.json({ message: 'Poletko usunięte pomyślnie' });
  });
});

module.exports = router;
