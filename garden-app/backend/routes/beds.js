const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../db');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Get all beds for a plot
router.get('/plots/:plotId/beds', auth, (req, res) => {
  // First verify user owns this plot
  db.get('SELECT * FROM plots WHERE id = ? AND user_id = ?', [req.params.plotId, req.user.id], (err, plot) => {
    if (err) {
      return res.status(500).json({ error: 'Błąd serwera' });
    }
    if (!plot) {
      return res.status(404).json({ error: 'Poletko nie znalezione' });
    }

    db.all('SELECT * FROM beds WHERE plot_id = ? ORDER BY row_number', [req.params.plotId], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      res.json(rows);
    });
  });
});

// Get single bed
router.get('/beds/:id', auth, (req, res) => {
  db.get(
    `SELECT b.* FROM beds b
     JOIN plots p ON b.plot_id = p.id
     WHERE b.id = ? AND p.user_id = ?`,
    [req.params.id, req.user.id],
    (err, bed) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      if (!bed) {
        return res.status(404).json({ error: 'Grządka nie znaleziona' });
      }
      res.json(bed);
    }
  );
});

// Create new bed
router.post('/plots/:plotId/beds',
  auth,
  upload.single('image'),
  [
    body('row_number').isInt({ min: 1 }).withMessage('Numer rzędu musi być liczbą większą od 0'),
    body('plant_name').optional().trim(),
    body('plant_variety').optional().trim(),
    body('planted_date').optional().isDate().withMessage('Nieprawidłowa data'),
    body('note').optional()
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verify user owns this plot
    db.get('SELECT * FROM plots WHERE id = ? AND user_id = ?', [req.params.plotId, req.user.id], (err, plot) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      if (!plot) {
        return res.status(404).json({ error: 'Poletko nie znalezione' });
      }

      const { row_number, plant_name, plant_variety, planted_date, note } = req.body;
      const imagePath = req.file ? req.file.path : null;

      db.run(
        `INSERT INTO beds (plot_id, row_number, plant_name, plant_variety, planted_date, note, image_path)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [req.params.plotId, row_number, plant_name, plant_variety, planted_date, note, imagePath],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'Błąd podczas tworzenia grządki' });
          }

          res.status(201).json({
            message: 'Grządka utworzona pomyślnie',
            bed: {
              id: this.lastID,
              plot_id: req.params.plotId,
              row_number,
              plant_name,
              plant_variety,
              planted_date,
              note,
              image_path: imagePath
            }
          });
        }
      );
    });
  }
);

// Update bed
router.put('/beds/:id',
  auth,
  upload.single('image'),
  [
    body('row_number').optional().isInt({ min: 1 }).withMessage('Numer rzędu musi być liczbą większą od 0'),
    body('plant_name').optional().trim(),
    body('plant_variety').optional().trim(),
    body('planted_date').optional().isDate().withMessage('Nieprawidłowa data'),
    body('note').optional()
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { row_number, plant_name, plant_variety, planted_date, note } = req.body;
    const imagePath = req.file ? req.file.path : undefined;

    // Build update query dynamically
    let updateFields = [];
    let values = [];

    if (row_number !== undefined) {
      updateFields.push('row_number = ?');
      values.push(row_number);
    }
    if (plant_name !== undefined) {
      updateFields.push('plant_name = ?');
      values.push(plant_name);
    }
    if (plant_variety !== undefined) {
      updateFields.push('plant_variety = ?');
      values.push(plant_variety);
    }
    if (planted_date !== undefined) {
      updateFields.push('planted_date = ?');
      values.push(planted_date);
    }
    if (note !== undefined) {
      updateFields.push('note = ?');
      values.push(note);
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
      `UPDATE beds SET ${updateFields.join(', ')}
       WHERE id = ? AND plot_id IN (SELECT id FROM plots WHERE user_id = ?)`,
      values,
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Błąd podczas aktualizacji' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Grządka nie znaleziona' });
        }

        res.json({ message: 'Grządka zaktualizowana pomyślnie' });
      }
    );
  }
);

// Delete bed
router.delete('/beds/:id', auth, (req, res) => {
  db.run(
    `DELETE FROM beds
     WHERE id = ? AND plot_id IN (SELECT id FROM plots WHERE user_id = ?)`,
    [req.params.id, req.user.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Błąd podczas usuwania' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Grządka nie znaleziona' });
      }

      res.json({ message: 'Grządka usunięta pomyślnie' });
    }
  );
});

module.exports = router;
