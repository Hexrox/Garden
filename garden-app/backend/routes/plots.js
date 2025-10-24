const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../db');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

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

// Get plot with all beds and spray history
router.get('/plots/:id/details', auth, (req, res) => {
  const plotId = req.params.id;

  db.get('SELECT * FROM plots WHERE id = ? AND user_id = ?', [plotId, req.user.id], (err, plot) => {
    if (err) {
      return res.status(500).json({ error: 'Błąd serwera' });
    }
    if (!plot) {
      return res.status(404).json({ error: 'Poletko nie znalezione' });
    }

    // Get beds for this plot
    db.all('SELECT * FROM beds WHERE plot_id = ? ORDER BY row_number', [plotId], (err, beds) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }

      // Get spray history for each bed
      const bedsWithSprays = beds.map(bed => {
        return new Promise((resolve) => {
          db.all(
            'SELECT * FROM spray_history WHERE bed_id = ? ORDER BY spray_date DESC',
            [bed.id],
            (err, sprays) => {
              if (err) {
                resolve({ ...bed, sprays: [] });
              } else {
                resolve({ ...bed, sprays });
              }
            }
          );
        });
      });

      Promise.all(bedsWithSprays).then(bedsWithSprayData => {
        res.json({
          ...plot,
          beds: bedsWithSprayData
        });
      });
    });
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
