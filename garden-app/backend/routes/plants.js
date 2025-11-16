const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../db');
const auth = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// Import default plants from JSON to database (run once per user)
router.post('/import-defaults', auth, (req, res) => {
  const harvestDataPath = path.join(__dirname, '../data/harvest_data.json');

  try {
    const rawData = fs.readFileSync(harvestDataPath, 'utf8');
    const harvestData = JSON.parse(rawData);

    let imported = 0;
    const vegetables = harvestData.vegetables;

    for (const [key, plant] of Object.entries(vegetables)) {
      db.run(
        `INSERT INTO plants (user_id, name, display_name, days_to_harvest, range_min, range_max, notes, is_custom)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        [req.user.id, key.toLowerCase(), plant.name, plant.daysToHarvest, plant.rangeMin, plant.rangeMax, plant.notes],
        (err) => {
          if (!err) imported++;
        }
      );
    }

    // Wait a bit for all inserts
    setTimeout(() => {
      res.json({ message: `Zaimportowano ${imported} roślin`, count: imported });
    }, 500);

  } catch (error) {
    res.status(500).json({ error: 'Błąd podczas importu' });
  }
});

// Get all plants for user (custom + defaults)
router.get('/', auth, (req, res) => {
  db.all(
    `SELECT * FROM plants WHERE user_id = ? OR user_id IS NULL ORDER BY is_custom DESC, name ASC`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      res.json(rows);
    }
  );
});

// Get single plant
router.get('/:id', auth, (req, res) => {
  db.get(
    `SELECT * FROM plants WHERE id = ? AND (user_id = ? OR user_id IS NULL)`,
    [req.params.id, req.user.id],
    (err, plant) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      if (!plant) {
        return res.status(404).json({ error: 'Roślina nie znaleziona' });
      }
      res.json(plant);
    }
  );
});

// Create custom plant
router.post('/',
  auth,
  [
    body('name').trim().notEmpty().withMessage('Nazwa jest wymagana'),
    body('display_name').optional().trim(),
    body('category').optional().trim(),
    body('days_to_harvest').isInt({ min: 1 }).withMessage('Dni do zbioru muszą być liczbą większą od 0'),
    body('range_min').optional().isInt({ min: 1 }),
    body('range_max').optional().isInt({ min: 1 }),
    body('notes').optional().trim(),
    body('flower_color').optional().trim(),
    body('bloom_season').optional().trim(),
    body('height').optional().trim(),
    body('sun_requirement').optional().trim(),
    body('is_perennial').optional().isBoolean(),
    body('planting_time').optional().trim(),
    body('storage_requirement').optional().trim()
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name, display_name, category, days_to_harvest, range_min, range_max, notes,
      flower_color, bloom_season, height, sun_requirement, is_perennial,
      planting_time, storage_requirement
    } = req.body;

    db.run(
      `INSERT INTO plants (
        user_id, name, display_name, category, days_to_harvest, range_min, range_max, notes,
        flower_color, bloom_season, height, sun_requirement, is_perennial,
        planting_time, storage_requirement, is_custom
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        req.user.id, name.toLowerCase(), display_name || name, category,
        days_to_harvest, range_min, range_max, notes,
        flower_color, bloom_season, height, sun_requirement, is_perennial ? 1 : 0,
        planting_time, storage_requirement
      ],
      function (err) {
        if (err) {
          console.error('Error creating plant:', err);
          return res.status(500).json({ error: 'Błąd podczas tworzenia rośliny' });
        }

        res.status(201).json({
          message: 'Roślina utworzona pomyślnie',
          plant: {
            id: this.lastID,
            name,
            display_name: display_name || name,
            category,
            days_to_harvest,
            range_min,
            range_max,
            notes,
            flower_color,
            bloom_season,
            height,
            sun_requirement,
            is_perennial,
            planting_time,
            storage_requirement
          }
        });
      }
    );
  }
);

// Update plant (only custom plants)
router.put('/:id',
  auth,
  [
    body('name').optional().trim().notEmpty(),
    body('display_name').optional().trim(),
    body('category').optional().trim(),
    body('days_to_harvest').optional().isInt({ min: 1 }),
    body('range_min').optional().isInt({ min: 1 }),
    body('range_max').optional().isInt({ min: 1 }),
    body('notes').optional().trim(),
    body('flower_color').optional().trim(),
    body('bloom_season').optional().trim(),
    body('height').optional().trim(),
    body('sun_requirement').optional().trim(),
    body('is_perennial').optional().isBoolean(),
    body('planting_time').optional().trim(),
    body('storage_requirement').optional().trim()
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name, display_name, category, days_to_harvest, range_min, range_max, notes,
      flower_color, bloom_season, height, sun_requirement, is_perennial,
      planting_time, storage_requirement
    } = req.body;

    let updateFields = [];
    let values = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      values.push(name.toLowerCase());
    }
    if (display_name !== undefined) {
      updateFields.push('display_name = ?');
      values.push(display_name);
    }
    if (category !== undefined) {
      updateFields.push('category = ?');
      values.push(category);
    }
    if (days_to_harvest !== undefined) {
      updateFields.push('days_to_harvest = ?');
      values.push(days_to_harvest);
    }
    if (range_min !== undefined) {
      updateFields.push('range_min = ?');
      values.push(range_min);
    }
    if (range_max !== undefined) {
      updateFields.push('range_max = ?');
      values.push(range_max);
    }
    if (notes !== undefined) {
      updateFields.push('notes = ?');
      values.push(notes);
    }
    if (flower_color !== undefined) {
      updateFields.push('flower_color = ?');
      values.push(flower_color);
    }
    if (bloom_season !== undefined) {
      updateFields.push('bloom_season = ?');
      values.push(bloom_season);
    }
    if (height !== undefined) {
      updateFields.push('height = ?');
      values.push(height);
    }
    if (sun_requirement !== undefined) {
      updateFields.push('sun_requirement = ?');
      values.push(sun_requirement);
    }
    if (is_perennial !== undefined) {
      updateFields.push('is_perennial = ?');
      values.push(is_perennial ? 1 : 0);
    }
    if (planting_time !== undefined) {
      updateFields.push('planting_time = ?');
      values.push(planting_time);
    }
    if (storage_requirement !== undefined) {
      updateFields.push('storage_requirement = ?');
      values.push(storage_requirement);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Brak danych do aktualizacji' });
    }

    values.push(req.params.id, req.user.id);

    db.run(
      `UPDATE plants SET ${updateFields.join(', ')}
       WHERE id = ? AND user_id = ? AND is_custom = 1`,
      values,
      function (err) {
        if (err) {
          console.error('Error updating plant:', err);
          return res.status(500).json({ error: 'Błąd podczas aktualizacji' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Roślina nie znaleziona lub nie możesz jej edytować' });
        }

        res.json({ message: 'Roślina zaktualizowana pomyślnie' });
      }
    );
  }
);

// Delete plant (only custom plants)
router.delete('/:id', auth, (req, res) => {
  db.run(
    `DELETE FROM plants WHERE id = ? AND user_id = ? AND is_custom = 1`,
    [req.params.id, req.user.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Błąd podczas usuwania' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Roślina nie znaleziona lub nie możesz jej usunąć' });
      }

      res.json({ message: 'Roślina usunięta pomyślnie' });
    }
  );
});

module.exports = router;
