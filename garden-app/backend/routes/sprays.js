const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../db');
const auth = require('../middleware/auth');

// Helper function to calculate safe harvest date
function calculateSafeHarvestDate(sprayDate, withdrawalPeriod) {
  const date = new Date(sprayDate);
  date.setDate(date.getDate() + parseInt(withdrawalPeriod));
  return date.toISOString().split('T')[0];
}

// Helper function to create reminder
function createReminder(userId, sprayId, bedId, safeHarvestDate) {
  const reminderDate = new Date(safeHarvestDate);
  reminderDate.setDate(reminderDate.getDate() - 3); // Remind 3 days before

  const message = `Okres karencji dla oprysku kończy się ${safeHarvestDate}. Możesz bezpiecznie zbierać plony!`;

  db.run(
    `INSERT INTO reminders (user_id, spray_id, bed_id, reminder_date, message)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, sprayId, bedId, reminderDate.toISOString().split('T')[0], message],
    (err) => {
      if (err) {
        console.error('Error creating reminder:', err);
      }
    }
  );
}

// Get all sprays for a bed
router.get('/beds/:bedId/sprays', auth, (req, res) => {
  // Verify user owns this bed
  db.get(
    `SELECT b.* FROM beds b
     JOIN plots p ON b.plot_id = p.id
     WHERE b.id = ? AND p.user_id = ?`,
    [req.params.bedId, req.user.id],
    (err, bed) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      if (!bed) {
        return res.status(404).json({ error: 'Grządka nie znaleziona' });
      }

      db.all(
        'SELECT * FROM spray_history WHERE bed_id = ? ORDER BY spray_date DESC',
        [req.params.bedId],
        (err, rows) => {
          if (err) {
            return res.status(500).json({ error: 'Błąd serwera' });
          }
          res.json(rows);
        }
      );
    }
  );
});

// Get all sprays for user (across all plots)
router.get('/sprays/history', auth, (req, res) => {
  db.all(
    `SELECT sh.*, b.plant_name, b.row_number, p.name as plot_name
     FROM spray_history sh
     JOIN beds b ON sh.bed_id = b.id
     JOIN plots p ON b.plot_id = p.id
     WHERE p.user_id = ?
     ORDER BY sh.spray_date DESC
     LIMIT 100`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      res.json(rows);
    }
  );
});

// Get active sprays (within withdrawal period)
router.get('/sprays/active', auth, (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  db.all(
    `SELECT sh.*, b.plant_name, b.row_number, p.name as plot_name
     FROM spray_history sh
     JOIN beds b ON sh.bed_id = b.id
     JOIN plots p ON b.plot_id = p.id
     WHERE p.user_id = ? AND sh.safe_harvest_date >= ?
     ORDER BY sh.safe_harvest_date ASC`,
    [req.user.id, today],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      res.json(rows);
    }
  );
});

// Create new spray record
router.post('/beds/:bedId/sprays',
  auth,
  [
    body('spray_name').trim().notEmpty().withMessage('Nazwa środka jest wymagana'),
    body('spray_type').optional().trim(),
    body('spray_date').isDate().withMessage('Nieprawidłowa data oprysku'),
    body('withdrawal_period').isInt({ min: 0 }).withMessage('Okres karencji musi być liczbą >= 0'),
    body('dosage').optional().trim(),
    body('weather_conditions').optional().trim(),
    body('note').optional()
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verify user owns this bed
    db.get(
      `SELECT b.*, p.user_id FROM beds b
       JOIN plots p ON b.plot_id = p.id
       WHERE b.id = ? AND p.user_id = ?`,
      [req.params.bedId, req.user.id],
      (err, bed) => {
        if (err) {
          return res.status(500).json({ error: 'Błąd serwera' });
        }
        if (!bed) {
          return res.status(404).json({ error: 'Grządka nie znaleziona' });
        }

        const { spray_name, spray_type, spray_date, withdrawal_period, dosage, weather_conditions, note } = req.body;
        const safeHarvestDate = calculateSafeHarvestDate(spray_date, withdrawal_period);

        db.run(
          `INSERT INTO spray_history (bed_id, spray_name, spray_type, spray_date, withdrawal_period, safe_harvest_date, dosage, weather_conditions, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [req.params.bedId, spray_name, spray_type, spray_date, withdrawal_period, safeHarvestDate, dosage, weather_conditions, note],
          function (err) {
            if (err) {
              return res.status(500).json({ error: 'Błąd podczas zapisywania oprysku' });
            }

            const sprayId = this.lastID;

            // Create reminder if withdrawal period > 0
            if (parseInt(withdrawal_period) > 0) {
              createReminder(req.user.id, sprayId, req.params.bedId, safeHarvestDate);
            }

            res.status(201).json({
              message: 'Oprysk zapisany pomyślnie',
              spray: {
                id: sprayId,
                bed_id: req.params.bedId,
                spray_name,
                spray_type,
                spray_date,
                withdrawal_period,
                safe_harvest_date: safeHarvestDate,
                dosage,
                weather_conditions,
                note
              }
            });
          }
        );
      }
    );
  }
);

// Update spray record
router.put('/sprays/:id',
  auth,
  [
    body('spray_name').optional().trim().notEmpty().withMessage('Nazwa środka nie może być pusta'),
    body('spray_type').optional().trim(),
    body('spray_date').optional().isDate().withMessage('Nieprawidłowa data oprysku'),
    body('withdrawal_period').optional().isInt({ min: 0 }).withMessage('Okres karencji musi być liczbą >= 0'),
    body('dosage').optional().trim(),
    body('weather_conditions').optional().trim(),
    body('note').optional()
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { spray_name, spray_type, spray_date, withdrawal_period, dosage, weather_conditions, note } = req.body;

    // Build update query dynamically
    let updateFields = [];
    let values = [];

    if (spray_name !== undefined) {
      updateFields.push('spray_name = ?');
      values.push(spray_name);
    }
    if (spray_type !== undefined) {
      updateFields.push('spray_type = ?');
      values.push(spray_type);
    }
    if (spray_date !== undefined) {
      updateFields.push('spray_date = ?');
      values.push(spray_date);
    }
    if (withdrawal_period !== undefined) {
      updateFields.push('withdrawal_period = ?');
      values.push(withdrawal_period);
    }
    if (dosage !== undefined) {
      updateFields.push('dosage = ?');
      values.push(dosage);
    }
    if (weather_conditions !== undefined) {
      updateFields.push('weather_conditions = ?');
      values.push(weather_conditions);
    }
    if (note !== undefined) {
      updateFields.push('note = ?');
      values.push(note);
    }

    // Recalculate safe_harvest_date if spray_date or withdrawal_period changed
    if (spray_date !== undefined || withdrawal_period !== undefined) {
      // Get current values first
      db.get('SELECT spray_date, withdrawal_period FROM spray_history WHERE id = ?', [req.params.id], (err, currentSpray) => {
        if (err || !currentSpray) {
          return res.status(500).json({ error: 'Błąd serwera' });
        }

        const finalSprayDate = spray_date || currentSpray.spray_date;
        const finalWithdrawalPeriod = withdrawal_period !== undefined ? withdrawal_period : currentSpray.withdrawal_period;
        const safeHarvestDate = calculateSafeHarvestDate(finalSprayDate, finalWithdrawalPeriod);

        updateFields.push('safe_harvest_date = ?');
        values.push(safeHarvestDate);

        executeUpdate();
      });
    } else {
      executeUpdate();
    }

    function executeUpdate() {
      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'Brak danych do aktualizacji' });
      }

      values.push(req.params.id, req.user.id);

      db.run(
        `UPDATE spray_history SET ${updateFields.join(', ')}
         WHERE id = ? AND bed_id IN (
           SELECT b.id FROM beds b
           JOIN plots p ON b.plot_id = p.id
           WHERE p.user_id = ?
         )`,
        values,
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'Błąd podczas aktualizacji' });
          }

          if (this.changes === 0) {
            return res.status(404).json({ error: 'Oprysk nie znaleziony' });
          }

          res.json({ message: 'Oprysk zaktualizowany pomyślnie' });
        }
      );
    }
  }
);

// Delete spray record
router.delete('/sprays/:id', auth, (req, res) => {
  db.run(
    `DELETE FROM spray_history
     WHERE id = ? AND bed_id IN (
       SELECT b.id FROM beds b
       JOIN plots p ON b.plot_id = p.id
       WHERE p.user_id = ?
     )`,
    [req.params.id, req.user.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Błąd podczas usuwania' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Oprysk nie znaleziony' });
      }

      res.json({ message: 'Oprysk usunięty pomyślnie' });
    }
  );
});

module.exports = router;
