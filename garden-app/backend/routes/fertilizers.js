const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

/**
 * GET /api/fertilizers
 * Wyszukiwanie nawozów
 * Query params:
 *   - name: wyszukiwanie po nazwie (np. "azofoska")
 *   - type: filtrowanie po typie (mineral, organic, natural)
 *   - suitable_for: filtrowanie po roślinie (np. "pomidor")
 */
router.get('/', auth, (req, res) => {
  const { name, type, suitable_for } = req.query;

  let query = `
    SELECT
      id, name, fertilizer_type, npk_ratio, suitable_for,
      dosage_min, dosage_max, dosage_unit, frequency_days,
      application_method, notes
    FROM fertilizers
    WHERE registered_poland = 1
  `;

  const params = [];

  // Wyszukiwanie po nazwie
  if (name) {
    query += ` AND (
      name LIKE ? OR
      npk_ratio LIKE ? OR
      suitable_for LIKE ?
    )`;
    const searchPattern = `%${name}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  // Filtrowanie po typie
  if (type) {
    query += ` AND fertilizer_type = ?`;
    params.push(type);
  }

  // Filtrowanie po roślinie docelowej
  if (suitable_for) {
    query += ` AND suitable_for LIKE ?`;
    params.push(`%${suitable_for}%`);
  }

  query += ` ORDER BY name ASC LIMIT 50`;

  db.all(query, params, (err, fertilizers) => {
    if (err) {
      console.error('Error fetching fertilizers:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(fertilizers);
  });
});

/**
 * GET /api/fertilizers/:id
 * Szczegóły nawozu
 */
router.get('/:id', auth, (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT * FROM fertilizers WHERE id = ?`,
    [id],
    (err, fertilizer) => {
      if (err) {
        console.error('Error fetching fertilizer:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!fertilizer) {
        return res.status(404).json({ error: 'Fertilizer not found' });
      }

      res.json(fertilizer);
    }
  );
});

module.exports = router;
