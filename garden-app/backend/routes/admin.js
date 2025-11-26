const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Admin middleware - sprawdza czy użytkownik to admin
const adminAuth = (req, res, next) => {
  if (req.user.username !== 'admin') {
    return res.status(403).json({ error: 'Brak uprawnień administratora' });
  }
  next();
};

/**
 * GET /api/admin/stats
 * Zwraca statystyki aplikacji (tylko dla admina)
 */
router.get('/stats', auth, adminAuth, async (req, res) => {
  try {
    // Agregowane statystyki
    const stats = await new Promise((resolve, reject) => {
      db.all(
        `SELECT
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM plots) as total_plots,
          (SELECT COUNT(*) FROM beds) as total_beds,
          (SELECT COUNT(*) FROM tasks) as total_tasks,
          (SELECT COUNT(*) FROM tasks WHERE completed = 1) as completed_tasks,
          (SELECT COUNT(*) FROM spray_history) as total_sprays,
          (SELECT COUNT(*) FROM plants WHERE is_custom = 1) as custom_plants`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows[0]);
        }
      );
    });

    // Lista użytkowników (bez haseł)
    const users = await new Promise((resolve, reject) => {
      db.all(
        `SELECT
          id,
          username,
          email,
          created_at,
          last_login,
          city,
          hardiness_zone,
          (SELECT COUNT(*) FROM plots WHERE user_id = users.id) as plots_count,
          (SELECT COUNT(*) FROM tasks WHERE user_id = users.id) as tasks_count
        FROM users
        ORDER BY created_at DESC`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    // Ostatnia aktywność (ostatnie 10 zadań)
    const recentActivity = await new Promise((resolve, reject) => {
      db.all(
        `SELECT
          t.id,
          t.description,
          t.created_at,
          t.completed,
          t.completed_at,
          u.username
        FROM tasks t
        JOIN users u ON t.user_id = u.id
        ORDER BY t.created_at DESC
        LIMIT 10`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    res.json({
      stats,
      users,
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania statystyk' });
  }
});

module.exports = router;
