const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Global search endpoint
router.get('/', auth, (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.json({ photos: [], beds: [], tasks: [], plots: [] });
  }

  const searchTerm = `%${q.trim()}%`;
  const results = {
    photos: [],
    beds: [],
    tasks: [],
    plots: []
  };

  // Search photos by plant name or caption
  db.all(
    `SELECT id, photo_path, thumb_path, bed_plant_name, plot_name, caption, created_at
     FROM plant_photos
     WHERE user_id = ? AND (
       bed_plant_name LIKE ? OR
       caption LIKE ? OR
       plot_name LIKE ?
     )
     ORDER BY created_at DESC
     LIMIT 10`,
    [req.user.id, searchTerm, searchTerm, searchTerm],
    (err, photos) => {
      if (err) {
        console.error('Search photos error:', err);
        return res.status(500).json({ error: 'Błąd wyszukiwania' });
      }

      results.photos = photos || [];

      // Search beds by plant name
      db.all(
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
        [req.user.id, searchTerm, searchTerm, searchTerm],
        (err, beds) => {
          if (err) {
            console.error('Search beds error:', err);
            return res.status(500).json({ error: 'Błąd wyszukiwania' });
          }

          results.beds = beds || [];

          // Search tasks by description
          db.all(
            `SELECT id, description, task_type, due_date, priority, completed
             FROM tasks
             WHERE user_id = ? AND description LIKE ?
             ORDER BY due_date ASC
             LIMIT 10`,
            [req.user.id, searchTerm],
            (err, tasks) => {
              if (err) {
                console.error('Search tasks error:', err);
                return res.status(500).json({ error: 'Błąd wyszukiwania' });
              }

              results.tasks = tasks || [];

              // Search plots by name or description
              db.all(
                `SELECT id, name, description
                 FROM plots
                 WHERE user_id = ? AND (name LIKE ? OR description LIKE ?)
                 ORDER BY created_at DESC
                 LIMIT 10`,
                [req.user.id, searchTerm, searchTerm],
                (err, plots) => {
                  if (err) {
                    console.error('Search plots error:', err);
                    return res.status(500).json({ error: 'Błąd wyszukiwania' });
                  }

                  results.plots = plots || [];

                  // Return all results
                  res.json(results);
                }
              );
            }
          );
        }
      );
    }
  );
});

module.exports = router;
