const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');

/**
 * GET /api/analytics
 * Pobierz statystyki ogrodowe użytkownika
 */
router.get('/', auth, async (req, res) => {
  try {
    const stats = {};

    // 1. Całkowity plon zebrany (suma yield_amount)
    stats.totalYield = await new Promise((resolve, reject) => {
      db.get(
        `SELECT COALESCE(SUM(yield_amount), 0) as total
         FROM beds b
         JOIN plots p ON b.plot_id = p.id
         WHERE p.user_id = ? AND b.yield_amount IS NOT NULL`,
        [req.user.id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row.total);
        }
      );
    });

    // 2. Liczba posadzonych roślin
    stats.plantsPlanted = await new Promise((resolve, reject) => {
      db.get(
        `SELECT COUNT(*) as count
         FROM beds b
         JOIN plots p ON b.plot_id = p.id
         WHERE p.user_id = ? AND b.planted_date IS NOT NULL`,
        [req.user.id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        }
      );
    });

    // 3. Liczba ukończonych zadań
    stats.tasksCompleted = await new Promise((resolve, reject) => {
      db.get(
        `SELECT COUNT(*) as count
         FROM tasks
         WHERE user_id = ? AND completed = 1`,
        [req.user.id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        }
      );
    });

    // 4. Średni czas do zbioru (dla ukończonych zbiorów)
    stats.avgDaysToHarvest = await new Promise((resolve, reject) => {
      db.get(
        `SELECT AVG(julianday(actual_harvest_date) - julianday(planted_date)) as avg_days
         FROM beds b
         JOIN plots p ON b.plot_id = p.id
         WHERE p.user_id = ?
         AND b.planted_date IS NOT NULL
         AND b.actual_harvest_date IS NOT NULL`,
        [req.user.id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row.avg_days ? Math.round(row.avg_days) : null);
        }
      );
    });

    // 5. Liczba aktywnych grzadek
    stats.activeBeds = await new Promise((resolve, reject) => {
      db.get(
        `SELECT COUNT(*) as count
         FROM beds b
         JOIN plots p ON b.plot_id = p.id
         WHERE p.user_id = ? AND b.plant_name IS NOT NULL`,
        [req.user.id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        }
      );
    });

    // 6. Liczba wykonanych oprysków
    stats.spraysApplied = await new Promise((resolve, reject) => {
      db.get(
        `SELECT COUNT(*) as count
         FROM spray_history sh
         JOIN beds b ON sh.bed_id = b.id
         JOIN plots p ON b.plot_id = p.id
         WHERE p.user_id = ?`,
        [req.user.id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        }
      );
    });

    // 7. Top 3 najczęściej sadzone rośliny
    stats.topPlants = await new Promise((resolve, reject) => {
      db.all(
        `SELECT plant_name, COUNT(*) as count
         FROM beds b
         JOIN plots p ON b.plot_id = p.id
         WHERE p.user_id = ? AND b.plant_name IS NOT NULL
         GROUP BY plant_name
         ORDER BY count DESC
         LIMIT 3`,
        [req.user.id],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    res.json(stats);
  } catch (error) {
    console.error('Błąd pobierania statystyk:', error);
    res.status(500).json({ error: 'Błąd pobierania statystyk' });
  }
});

module.exports = router;
