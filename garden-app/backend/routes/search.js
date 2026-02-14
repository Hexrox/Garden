const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Promisify db.all for async/await
const dbAll = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

// Global search endpoint
router.get('/', auth, async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.json({ photos: [], beds: [], tasks: [], plots: [] });
  }

  const searchTerm = `%${q.trim()}%`;

  try {
    // Run all searches in parallel
    const [photos, beds, tasks, plots] = await Promise.all([
      // Search photos
      dbAll(
        `SELECT id, photo_path, thumb_path, bed_plant_name, plot_name, caption, created_at
         FROM plant_photos
         WHERE user_id = ? AND (
           bed_plant_name LIKE ? OR
           caption LIKE ? OR
           plot_name LIKE ?
         )
         ORDER BY created_at DESC
         LIMIT 10`,
        [req.user.id, searchTerm, searchTerm, searchTerm]
      ),

      // Search beds
      dbAll(
        `SELECT b.id, b.row_number, b.plant_name, b.plant_variety, b.plot_id, p.name as plot_name
         FROM beds b
         JOIN plots p ON b.plot_id = p.id
         WHERE p.user_id = ? AND (
           b.plant_name LIKE ? OR
           b.plant_variety LIKE ? OR
           p.name LIKE ?
         )
         ORDER BY b.created_at DESC
         LIMIT 10`,
        [req.user.id, searchTerm, searchTerm, searchTerm]
      ),

      // Search tasks
      dbAll(
        `SELECT id, description, task_type, due_date, priority, completed
         FROM tasks
         WHERE user_id = ? AND description LIKE ?
         ORDER BY due_date ASC
         LIMIT 10`,
        [req.user.id, searchTerm]
      ),

      // Search plots
      dbAll(
        `SELECT id, name, description
         FROM plots
         WHERE user_id = ? AND (name LIKE ? OR description LIKE ?)
         ORDER BY created_at DESC
         LIMIT 10`,
        [req.user.id, searchTerm, searchTerm]
      )
    ]);

    res.json({ photos, beds, tasks, plots });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Błąd wyszukiwania' });
  }
});

module.exports = router;
