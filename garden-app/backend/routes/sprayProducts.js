const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

/**
 * GET /api/spray-products
 * Wyszukiwanie środków ochrony roślin
 * Query params:
 *   - search: wyszukiwanie po nazwie (np. "topsin")
 *   - type: filtrowanie po typie (fungicyd, insektycyd, herbicyd, moluskocyd)
 *   - ecological: filtrowanie ekologicznych (true/false)
 *   - plant: filtrowanie po roślinie docelowej (np. "pomidor")
 *   - pest: filtrowanie po szkodniku (np. "mszyca")
 */
router.get('/', auth, (req, res) => {
  const { search, type, ecological, plant, pest } = req.query;

  let query = `
    SELECT
      id, name, active_substance, type, is_ecological,
      dosage_professional, dosage_2l, dosage_5l, dosage_notes,
      withdrawal_period,
      target_plants, target_pests,
      application_method, max_applications, interval_days, temperature_range,
      warnings, registered_poland
    FROM spray_products
    WHERE registered_poland = 1
  `;

  const params = [];

  // Wyszukiwanie po nazwie
  if (search) {
    query += ` AND (
      name LIKE ? OR
      active_substance LIKE ? OR
      target_plants LIKE ? OR
      target_pests LIKE ?
    )`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  // Filtrowanie po typie
  if (type) {
    query += ` AND type = ?`;
    params.push(type);
  }

  // Filtrowanie ekologiczne
  if (ecological === 'true') {
    query += ` AND is_ecological = 1`;
  }

  // Filtrowanie po roślinie
  if (plant) {
    query += ` AND target_plants LIKE ?`;
    params.push(`%${plant}%`);
  }

  // Filtrowanie po szkodniku
  if (pest) {
    query += ` AND target_pests LIKE ?`;
    params.push(`%${pest}%`);
  }

  query += ` ORDER BY name ASC`;

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching spray products:', err);
      return res.status(500).json({ error: 'Błąd podczas pobierania środków ochrony roślin' });
    }

    res.json(rows);
  });
});

/**
 * GET /api/spray-products/:id
 * Pobierz szczegóły jednego środka
 */
router.get('/:id', auth, (req, res) => {
  const { id } = req.params;

  db.get(
    'SELECT * FROM spray_products WHERE id = ? AND registered_poland = 1',
    [id],
    (err, row) => {
      if (err) {
        console.error('Error fetching spray product:', err);
        return res.status(500).json({ error: 'Błąd podczas pobierania środka' });
      }

      if (!row) {
        return res.status(404).json({ error: 'Środek nie znaleziony' });
      }

      res.json(row);
    }
  );
});

/**
 * GET /api/spray-products/autocomplete/:query
 * Szybkie autocomplete - zwraca tylko nazwę i podstawowe info
 */
router.get('/autocomplete/:query', auth, (req, res) => {
  const { query } = req.params;

  if (!query || query.length < 2) {
    return res.json([]);
  }

  const searchPattern = `%${query}%`;

  db.all(
    `SELECT
      id, name, type, is_ecological,
      dosage_2l, dosage_5l,
      withdrawal_period,
      target_plants, target_pests
    FROM spray_products
    WHERE registered_poland = 1
      AND (name LIKE ? OR active_substance LIKE ?)
    ORDER BY name ASC
    LIMIT 10`,
    [searchPattern, searchPattern],
    (err, rows) => {
      if (err) {
        console.error('Error in autocomplete:', err);
        return res.status(500).json({ error: 'Błąd wyszukiwania' });
      }

      res.json(rows);
    }
  );
});

module.exports = router;
