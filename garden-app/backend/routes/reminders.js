const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Get all active reminders for user
router.get('/reminders', auth, (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  db.all(
    `SELECT r.*, sh.spray_name, sh.safe_harvest_date, b.plant_name, b.row_number, p.name as plot_name
     FROM reminders r
     JOIN spray_history sh ON r.spray_id = sh.id
     JOIN beds b ON r.bed_id = b.id
     JOIN plots p ON b.plot_id = p.id
     WHERE r.user_id = ? AND r.reminder_date <= ? AND r.is_read = 0
     ORDER BY r.reminder_date ASC`,
    [req.user.id, today],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      res.json(rows);
    }
  );
});

// Get upcoming reminders (next 7 days)
router.get('/reminders/upcoming', auth, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  db.all(
    `SELECT r.*, sh.spray_name, sh.safe_harvest_date, b.plant_name, b.row_number, p.name as plot_name
     FROM reminders r
     JOIN spray_history sh ON r.spray_id = sh.id
     JOIN beds b ON r.bed_id = b.id
     JOIN plots p ON b.plot_id = p.id
     WHERE r.user_id = ? AND r.reminder_date BETWEEN ? AND ?
     ORDER BY r.reminder_date ASC`,
    [req.user.id, today, nextWeekStr],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      res.json(rows);
    }
  );
});

// Mark reminder as read
router.put('/reminders/:id/read', auth, (req, res) => {
  db.run(
    'UPDATE reminders SET is_read = 1 WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Przypomnienie nie znalezione' });
      }

      res.json({ message: 'Przypomnienie oznaczone jako przeczytane' });
    }
  );
});

// Mark all reminders as read
router.put('/reminders/read-all', auth, (req, res) => {
  db.run(
    'UPDATE reminders SET is_read = 1 WHERE user_id = ? AND is_read = 0',
    [req.user.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }

      res.json({
        message: 'Wszystkie przypomnienia oznaczone jako przeczytane',
        count: this.changes
      });
    }
  );
});

// Delete reminder
router.delete('/reminders/:id', auth, (req, res) => {
  db.run(
    'DELETE FROM reminders WHERE id = ? AND user_id = ?',
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
