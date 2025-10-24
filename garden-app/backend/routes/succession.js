const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../db');
const auth = require('../middleware/auth');

// Get all succession reminders for user
router.get('/', auth, (req, res) => {
  db.all(
    `SELECT * FROM succession_reminders WHERE user_id = ? AND is_active = 1 ORDER BY next_planting_date ASC`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      res.json(rows);
    }
  );
});

// Create succession reminder
router.post('/',
  auth,
  [
    body('plant_name').trim().notEmpty().withMessage('Nazwa rośliny jest wymagana'),
    body('interval_days').isInt({ min: 1 }).withMessage('Interwał musi być liczbą większą od 0'),
    body('last_planted_date').isDate().withMessage('Nieprawidłowa data'),
    body('bed_id').optional().isInt()
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { plant_name, interval_days, last_planted_date, bed_id } = req.body;

    // Calculate next planting date
    const lastDate = new Date(last_planted_date);
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + parseInt(interval_days));

    db.run(
      `INSERT INTO succession_reminders (user_id, bed_id, plant_name, interval_days, last_planted_date, next_planting_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, bed_id, plant_name, interval_days, last_planted_date, nextDate.toISOString().split('T')[0]],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Błąd podczas tworzenia przypomnienia' });
        }

        res.status(201).json({
          message: 'Przypomnienie utworzone pomyślnie',
          reminder: {
            id: this.lastID,
            plant_name,
            interval_days,
            next_planting_date: nextDate.toISOString().split('T')[0]
          }
        });
      }
    );
  }
);

// Update succession reminder (mark as completed and create next)
router.post('/:id/complete', auth, (req, res) => {
  db.get(
    `SELECT * FROM succession_reminders WHERE id = ? AND user_id = ?`,
    [req.params.id, req.user.id],
    (err, reminder) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      if (!reminder) {
        return res.status(404).json({ error: 'Przypomnienie nie znalezione' });
      }

      const today = new Date();
      const nextDate = new Date(today);
      nextDate.setDate(nextDate.getDate() + reminder.interval_days);

      // Update with new dates
      db.run(
        `UPDATE succession_reminders
         SET last_planted_date = ?, next_planting_date = ?
         WHERE id = ?`,
        [today.toISOString().split('T')[0], nextDate.toISOString().split('T')[0], req.params.id],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'Błąd podczas aktualizacji' });
          }

          res.json({
            message: 'Przypomnienie zaktualizowane',
            next_planting_date: nextDate.toISOString().split('T')[0]
          });
        }
      );
    }
  );
});

// Delete succession reminder
router.delete('/:id', auth, (req, res) => {
  db.run(
    `DELETE FROM succession_reminders WHERE id = ? AND user_id = ?`,
    [req.params.id, req.user.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Błąd podczas usuwania' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Przypomnienie nie znalezione' });
      }

      res.json({ message: 'Przypomnienie usunięte pomyślnie' });
    }
  );
});

module.exports = router;
