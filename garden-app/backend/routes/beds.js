const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../db');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { imageValidationMiddleware } = require('../utils/imageValidator');
const { calculateHarvestDate } = require('../utils/harvestPredictor');
const { buildUpdateQuery } = require('../utils/queryBuilder');
const sanitizeHtml = require('sanitize-html');

// Sanitization config - no HTML tags allowed
const sanitizeConfig = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: 'discard'
};

const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') return input;
  return sanitizeHtml(input, sanitizeConfig);
};

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
  imageValidationMiddleware,
  [
    body('row_number').isInt({ min: 1 }).withMessage('Numer rzędu musi być liczbą większą od 0'),
    body('plant_name').optional().trim().escape(),
    body('plant_variety').optional().trim().escape(),
    body('planted_date').optional().isDate().withMessage('Nieprawidłowa data'),
    body('note').optional().trim().escape()
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

      const {
        row_number,
        plant_name: rawPlantName,
        plant_variety: rawPlantVariety,
        planted_date,
        note: rawNote
      } = req.body;

      // Sanitize user inputs
      const plant_name = sanitizeInput(rawPlantName);
      const plant_variety = sanitizeInput(rawPlantVariety);
      const note = sanitizeInput(rawNote);

      const imagePath = req.file ? `uploads/${req.file.filename}` : null;

      // Check if row_number already exists for this plot
      db.get('SELECT id FROM beds WHERE plot_id = ? AND row_number = ?', [req.params.plotId, row_number], (err, existingBed) => {
        if (err) {
          return res.status(500).json({ error: 'Błąd serwera' });
        }
        if (existingBed) {
          return res.status(400).json({ error: `Rząd ${row_number} jest już zajęty. Wybierz inny numer rzędu.` });
        }

        // Calculate expected harvest date
        let expectedHarvestDate = null;
        if (plant_name && planted_date) {
          const prediction = calculateHarvestDate(plant_name, planted_date);
          if (prediction) {
            expectedHarvestDate = prediction.expectedDate;
          }
        }

        db.run(
          `INSERT INTO beds (plot_id, row_number, plant_name, plant_variety, planted_date, note, image_path, expected_harvest_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [req.params.plotId, row_number, plant_name, plant_variety, planted_date, note, imagePath, expectedHarvestDate],
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
              image_path: imagePath,
              expected_harvest_date: expectedHarvestDate
            }
          });
          }
        );
      });
    });
  }
);

// Update bed
router.put('/beds/:id',
  auth,
  upload.single('image'),
  imageValidationMiddleware,
  [
    body('row_number').optional().isInt({ min: 1 }).withMessage('Numer rzędu musi być liczbą większą od 0'),
    body('plant_name').optional().trim().escape(),
    body('plant_variety').optional().trim().escape(),
    body('planted_date').optional().isDate().withMessage('Nieprawidłowa data'),
    body('note').optional().trim().escape()
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      row_number,
      plant_name: rawPlantName,
      plant_variety: rawPlantVariety,
      planted_date,
      note: rawNote,
      yield_amount,
      yield_unit: rawYieldUnit,
      actual_harvest_date
    } = req.body;

    // Sanitize user inputs
    const plant_name = rawPlantName !== undefined ? sanitizeInput(rawPlantName) : undefined;
    const plant_variety = rawPlantVariety !== undefined ? sanitizeInput(rawPlantVariety) : undefined;
    const note = rawNote !== undefined ? sanitizeInput(rawNote) : undefined;
    const yield_unit = rawYieldUnit !== undefined ? sanitizeInput(rawYieldUnit) : undefined;

    const imagePath = req.file ? `uploads/${req.file.filename}` : undefined;

    // Check if we need to recalculate harvest date
    const needsRecalculation = plant_name !== undefined || planted_date !== undefined;

    if (needsRecalculation) {
      // Get current bed data to use for calculation
      db.get(
        `SELECT * FROM beds WHERE id = ? AND plot_id IN (SELECT id FROM plots WHERE user_id = ?)`,
        [req.params.id, req.user.id],
        (err, bed) => {
          if (err) {
            return res.status(500).json({ error: 'Błąd serwera' });
          }
          if (!bed) {
            return res.status(404).json({ error: 'Grządka nie znaleziona' });
          }

          // Check if row_number is being changed and if new number is already taken
          if (row_number !== undefined && row_number !== bed.row_number) {
            db.get('SELECT id FROM beds WHERE plot_id = ? AND row_number = ? AND id != ?',
              [bed.plot_id, row_number, bed.id],
              (err, existingBed) => {
                if (err) {
                  return res.status(500).json({ error: 'Błąd serwera' });
                }
                if (existingBed) {
                  return res.status(400).json({ error: `Rząd ${row_number} jest już zajęty. Wybierz inny numer rzędu.` });
                }

                // Continue with update
                performUpdate(bed);
              }
            );
          } else {
            // No row_number change, continue with update
            performUpdate(bed);
          }

          function performUpdate(bed) {
            // Use new values or fall back to existing
            const finalPlantName = plant_name !== undefined ? plant_name : bed.plant_name;
            const finalPlantedDate = planted_date !== undefined ? planted_date : bed.planted_date;

          // Calculate new harvest date
          let expectedHarvestDate = null;
          if (finalPlantName && finalPlantedDate) {
            const prediction = calculateHarvestDate(finalPlantName, finalPlantedDate);
            if (prediction) {
              expectedHarvestDate = prediction.expectedDate;
            }
          }

          // Build update query with strict whitelist
          const allowedFields = {
            row_number: 'row_number',
            plant_name: 'plant_name',
            plant_variety: 'plant_variety',
            planted_date: 'planted_date',
            note: 'note',
            imagePath: 'image_path',
            yield_amount: 'yield_amount',
            yield_unit: 'yield_unit',
            actual_harvest_date: 'actual_harvest_date'
          };

          try {
            const { sql, values } = buildUpdateQuery('beds', allowedFields, req.body);

            // Always add expected_harvest_date when recalculating
            const finalSql = sql + ', expected_harvest_date = ?';
            const finalValues = [...values, expectedHarvestDate, req.params.id, req.user.id];

            db.run(
              `${finalSql} WHERE id = ? AND plot_id IN (SELECT id FROM plots WHERE user_id = ?)`,
              finalValues,
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
          } catch (buildError) {
            return res.status(400).json({ error: buildError.message });
          }
          }
        }
      );
    } else {
      // No recalculation needed, simple update
      // First get current bed to check row_number changes
      db.get(
        `SELECT * FROM beds WHERE id = ? AND plot_id IN (SELECT id FROM plots WHERE user_id = ?)`,
        [req.params.id, req.user.id],
        (err, bed) => {
          if (err) {
            return res.status(500).json({ error: 'Błąd serwera' });
          }
          if (!bed) {
            return res.status(404).json({ error: 'Grządka nie znaleziona' });
          }

          // Check if row_number is being changed and if new number is already taken
          if (row_number !== undefined && row_number !== bed.row_number) {
            db.get('SELECT id FROM beds WHERE plot_id = ? AND row_number = ? AND id != ?',
              [bed.plot_id, row_number, bed.id],
              (err, existingBed) => {
                if (err) {
                  return res.status(500).json({ error: 'Błąd serwera' });
                }
                if (existingBed) {
                  return res.status(400).json({ error: `Rząd ${row_number} jest już zajęty. Wybierz inny numer rzędu.` });
                }

                // Continue with simple update
                performSimpleUpdate();
              }
            );
          } else {
            // No row_number change, continue with simple update
            performSimpleUpdate();
          }

          function performSimpleUpdate() {
            let updateFields = [];
            let values = [];

            if (row_number !== undefined) {
              updateFields.push('row_number = ?');
              values.push(row_number);
            }
      if (plant_variety !== undefined) {
        updateFields.push('plant_variety = ?');
        values.push(plant_variety);
      }
      if (note !== undefined) {
        updateFields.push('note = ?');
        values.push(note);
      }
      if (imagePath !== undefined) {
        updateFields.push('image_path = ?');
        values.push(imagePath);
      }
      if (yield_amount !== undefined) {
        updateFields.push('yield_amount = ?');
        values.push(yield_amount);
      }
      if (yield_unit !== undefined) {
        updateFields.push('yield_unit = ?');
        values.push(yield_unit);
      }
      if (actual_harvest_date !== undefined) {
        updateFields.push('actual_harvest_date = ?');
        values.push(actual_harvest_date);
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
      }
    );
    }
  }
);

// Harvest bed - special endpoint for harvesting
router.put('/beds/:id/harvest', [auth, upload.single('harvest_photo')], (req, res) => {
  const { actual_harvest_date, yield_amount, yield_unit, harvest_notes, clearBed } = req.body;

  // Walidacja: wymagana data zbioru + przynajmniej jedno z: waga, zdjęcie lub notatki
  if (!actual_harvest_date) {
    return res.status(400).json({ error: 'Data zbioru jest wymagana' });
  }

  const hasYield = yield_amount && parseFloat(yield_amount) > 0;
  const hasPhoto = req.file;
  const hasNotes = harvest_notes && harvest_notes.trim().length > 0;

  if (!hasYield && !hasPhoto && !hasNotes) {
    return res.status(400).json({ error: 'Podaj przynajmniej: ilość plonu, zdjęcie lub opis zbioru' });
  }

  const harvest_photo = req.file ? `uploads/${req.file.filename}` : null;

  // Verify ownership
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

      // Walidacja: data zbioru nie może być przed datą sadzenia
      if (bed.planted_date && new Date(actual_harvest_date) < new Date(bed.planted_date)) {
        return res.status(400).json({
          error: 'Data zbioru nie może być wcześniejsza niż data sadzenia',
          planted_date: bed.planted_date,
          harvest_date: actual_harvest_date
        });
      }

      if (clearBed) {
        // Option 1: Clear bed (free for new planting)
        db.run(
          `UPDATE beds
           SET actual_harvest_date = ?,
               yield_amount = ?,
               yield_unit = ?,
               harvest_photo = ?,
               harvest_notes = ?,
               plant_name = NULL,
               plant_variety = NULL,
               planted_date = NULL,
               expected_harvest_date = NULL,
               note = NULL
           WHERE id = ?`,
          [actual_harvest_date, yield_amount || null, yield_unit || 'kg', harvest_photo, harvest_notes || null, req.params.id],
          function (err) {
            if (err) {
              return res.status(500).json({ error: 'Błąd podczas zapisywania zbioru' });
            }
            res.json({
              message: 'Zbiór zapisany, grządka opróżniona',
              cleared: true
            });
          }
        );
      } else {
        // Option 2: Keep as history (archived)
        db.run(
          `UPDATE beds
           SET actual_harvest_date = ?,
               yield_amount = ?,
               yield_unit = ?,
               harvest_photo = ?,
               harvest_notes = ?
           WHERE id = ?`,
          [actual_harvest_date, yield_amount || null, yield_unit || 'kg', harvest_photo, harvest_notes || null, req.params.id],
          function (err) {
            if (err) {
              return res.status(500).json({ error: 'Błąd podczas zapisywania zbioru' });
            }
            res.json({
              message: 'Zbiór zapisany w historii',
              cleared: false
            });
          }
        );
      }
    }
  );
});

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

// Record actual harvest
router.post('/beds/:id/harvest',
  auth,
  [
    body('actual_harvest_date').optional().isDate().withMessage('Nieprawidłowa data'),
    body('yield_amount').optional().isFloat({ min: 0 }).withMessage('Ilość plonu musi być liczbą dodatnią'),
    body('yield_unit').optional().trim().escape()
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { actual_harvest_date, yield_amount, yield_unit } = req.body;
    const harvestDate = actual_harvest_date || new Date().toISOString().split('T')[0];

    db.run(
      `UPDATE beds SET actual_harvest_date = ?, yield_amount = ?, yield_unit = ?
       WHERE id = ? AND plot_id IN (SELECT id FROM plots WHERE user_id = ?)`,
      [harvestDate, yield_amount, yield_unit, req.params.id, req.user.id],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Błąd podczas zapisywania zbioru' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Grządka nie znaleziona' });
        }

        res.json({
          message: 'Zbiór zapisany pomyślnie',
          harvest: {
            actual_harvest_date: harvestDate,
            yield_amount,
            yield_unit
          }
        });
      }
    );
  }
);

module.exports = router;
