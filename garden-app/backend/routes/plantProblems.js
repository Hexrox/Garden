const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const auth = require('../middleware/auth');

const dbPath = path.join(__dirname, '..', 'garden.db');
const db = new sqlite3.Database(dbPath);

// ================================================================================================
// GET /api/plant-problems - Lista problemów z filtrowaniem
// ================================================================================================
router.get('/', auth, (req, res) => {
  const { search, category, plant, severity, season } = req.query;

  let query = `
    SELECT
      id, name, common_name, category, severity,
      description, symptoms, affects_plants,
      plant_category, peak_season
    FROM plant_problems
    WHERE 1=1
  `;
  const params = [];

  // Filtr wyszukiwania
  if (search && search.length >= 2) {
    query += ` AND (name LIKE ? OR common_name LIKE ? OR symptoms LIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  // Filtr kategorii
  if (category) {
    query += ` AND category = ?`;
    params.push(category);
  }

  // Filtr rośliny
  if (plant) {
    query += ` AND affects_plants LIKE ?`;
    params.push(`%${plant}%`);
  }

  // Filtr dotkliwości
  if (severity) {
    query += ` AND severity = ?`;
    params.push(severity);
  }

  // Filtr sezonu
  if (season) {
    query += ` AND (peak_season LIKE ? OR peak_season = 'cały_sezon')`;
    params.push(`%${season}%`);
  }

  query += ` ORDER BY severity DESC, name ASC`;

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Błąd bazy danych' });
    }
    res.json(rows);
  });
});

// ================================================================================================
// GET /api/plant-problems/autocomplete/:query - Szybkie wyszukiwanie (min 2 znaki)
// ================================================================================================
router.get('/autocomplete/:query', auth, (req, res) => {
  const { query } = req.params;

  if (!query || query.length < 2) {
    return res.json([]);
  }

  const searchPattern = `%${query}%`;

  db.all(
    `SELECT
      id, name, common_name, category, severity, symptoms
    FROM plant_problems
    WHERE name LIKE ? OR common_name LIKE ? OR symptoms LIKE ?
    ORDER BY
      CASE severity
        WHEN 'krytyczna' THEN 1
        WHEN 'wysoka' THEN 2
        WHEN 'średnia' THEN 3
        ELSE 4
      END,
      name ASC
    LIMIT 10`,
    [searchPattern, searchPattern, searchPattern],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Błąd bazy danych' });
      }
      res.json(rows);
    }
  );
});

// ================================================================================================
// GET /api/plant-problems/:id - Szczegóły problemu + rekomendowane rozwiązania
// ================================================================================================
router.get('/:id', auth, (req, res) => {
  const { id } = req.params;

  // Pobierz problem
  db.get(
    `SELECT * FROM plant_problems WHERE id = ?`,
    [id],
    (err, problem) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Błąd bazy danych' });
      }

      if (!problem) {
        return res.status(404).json({ error: 'Problem nie został znaleziony' });
      }

      // Pobierz rozwiązania dla tego problemu
      db.all(
        `SELECT
          ps.id as solution_id,
          ps.effectiveness,
          ps.speed,
          ps.notes,
          ps.best_stage,
          ps.priority,
          ps.is_recommended,
          sp.id as product_id,
          sp.name as product_name,
          sp.active_substance,
          sp.type as product_type,
          sp.is_ecological,
          sp.dosage_2l,
          sp.dosage_5l,
          sp.withdrawal_period,
          sp.warnings
        FROM problem_solutions ps
        LEFT JOIN spray_products sp ON ps.product_id = sp.id
        WHERE ps.problem_id = ?
        ORDER BY ps.priority DESC, ps.is_recommended DESC`,
        [id],
        (err, solutions) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Błąd bazy danych' });
          }

          res.json({
            problem,
            solutions: solutions || []
          });
        }
      );
    }
  );
});

// ================================================================================================
// GET /api/plant-problems/categories/list - Lista kategorii problemów
// ================================================================================================
router.get('/categories/list', auth, (req, res) => {
  db.all(
    `SELECT DISTINCT category, COUNT(*) as count
    FROM plant_problems
    GROUP BY category
    ORDER BY category`,
    [],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Błąd bazy danych' });
      }
      res.json(rows);
    }
  );
});

module.exports = router;
