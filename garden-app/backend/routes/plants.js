const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../db');
const auth = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// Import extended plants from JSON to database (run once per user)
router.post('/import-defaults', auth, (req, res) => {
  const extendedDataPath = path.join(__dirname, '../data/plants_extended.json');

  try {
    const rawData = fs.readFileSync(extendedDataPath, 'utf8');
    const plantsData = JSON.parse(rawData);

    let imported = 0;
    let totalPlants = 0;

    // Iterate through all categories
    for (const [category, plants] of Object.entries(plantsData)) {
      for (const [key, plant] of Object.entries(plants)) {
        totalPlants++;
        db.run(
          `INSERT INTO plants (
            user_id, name, display_name, latin_name, category,
            days_to_harvest, range_min, range_max, notes,
            npk_needs, npk_ratio_recommended, fertilization_frequency,
            organic_fertilizer, mineral_fertilizer,
            soil_ph, soil_type, water_needs, sun_requirement,
            companion_plants, avoid_plants,
            height, is_perennial, planting_time, storage_requirement,
            pruning_needs, winter_care, propagation_method,
            is_custom
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
          [
            req.user.id,
            key.toLowerCase(),
            plant.name,
            plant.latinName || null,
            plant.category || null,
            plant.daysToHarvest,
            plant.rangeMin || null,
            plant.rangeMax || null,
            plant.notes || null,
            plant.npkNeeds || null,
            plant.npkRatioRecommended || null,
            plant.fertilizationFrequency || null,
            plant.organicFertilizer || null,
            plant.mineralFertilizer || null,
            plant.soilPh || null,
            plant.soilType || null,
            plant.waterNeeds || null,
            plant.sunRequirement || null,
            plant.companionPlants || null,
            plant.avoidPlants || null,
            plant.height || null,
            plant.isPerennial ? 1 : 0,
            plant.plantingTime || null,
            plant.storageRequirement || null,
            plant.pruningNeeds || null,
            plant.winterCare || null,
            plant.propagationMethod || null
          ],
          (err) => {
            if (!err) imported++;
            if (err) console.error('Error importing plant:', key, err.message);
          }
        );
      }
    }

    // Wait a bit for all inserts
    setTimeout(() => {
      res.json({
        message: `Zaimportowano ${imported} z ${totalPlants} roślin`,
        count: imported,
        total: totalPlants
      });
    }, 1000);

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Błąd podczas importu: ' + error.message });
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
    body('name').trim().notEmpty().escape().withMessage('Nazwa jest wymagana'),
    body('display_name').optional().trim().escape(),
    body('latin_name').optional().trim().escape(),
    body('category').optional().trim().escape(),
    body('days_to_harvest').isInt({ min: 1 }).withMessage('Dni do zbioru muszą być liczbą większą od 0'),
    body('range_min').optional().isInt({ min: 1 }),
    body('range_max').optional().isInt({ min: 1 }),
    body('notes').optional().trim().escape(),
    body('flower_color').optional().trim().escape(),
    body('bloom_season').optional().trim().escape(),
    body('height').optional().trim().escape(),
    body('sun_requirement').optional().trim().escape(),
    body('is_perennial').optional().isBoolean(),
    body('planting_time').optional().trim().escape(),
    body('storage_requirement').optional().trim().escape(),
    body('npk_needs').optional().trim().escape(),
    body('npk_ratio_recommended').optional().trim().escape(),
    body('fertilization_frequency').optional().trim().escape(),
    body('organic_fertilizer').optional().trim().escape(),
    body('mineral_fertilizer').optional().trim().escape(),
    body('soil_ph').optional().trim().escape(),
    body('soil_type').optional().trim().escape(),
    body('water_needs').optional().trim().escape(),
    body('companion_plants').optional().trim().escape(),
    body('avoid_plants').optional().trim().escape(),
    body('pruning_needs').optional().trim().escape(),
    body('winter_care').optional().trim().escape(),
    body('propagation_method').optional().trim().escape()
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name, display_name, latin_name, category, days_to_harvest, range_min, range_max, notes,
      flower_color, bloom_season, height, sun_requirement, is_perennial,
      planting_time, storage_requirement,
      npk_needs, npk_ratio_recommended, fertilization_frequency,
      organic_fertilizer, mineral_fertilizer,
      soil_ph, soil_type, water_needs,
      companion_plants, avoid_plants,
      pruning_needs, winter_care, propagation_method
    } = req.body;

    db.run(
      `INSERT INTO plants (
        user_id, name, display_name, latin_name, category, days_to_harvest, range_min, range_max, notes,
        flower_color, bloom_season, height, sun_requirement, is_perennial,
        planting_time, storage_requirement,
        npk_needs, npk_ratio_recommended, fertilization_frequency,
        organic_fertilizer, mineral_fertilizer,
        soil_ph, soil_type, water_needs,
        companion_plants, avoid_plants,
        pruning_needs, winter_care, propagation_method,
        is_custom
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        req.user.id, name.toLowerCase(), display_name || name, latin_name, category,
        days_to_harvest, range_min, range_max, notes,
        flower_color, bloom_season, height, sun_requirement, is_perennial ? 1 : 0,
        planting_time, storage_requirement,
        npk_needs, npk_ratio_recommended, fertilization_frequency,
        organic_fertilizer, mineral_fertilizer,
        soil_ph, soil_type, water_needs,
        companion_plants, avoid_plants,
        pruning_needs, winter_care, propagation_method
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
    body('name').optional().trim().notEmpty().escape(),
    body('display_name').optional().trim().escape(),
    body('category').optional().trim().escape(),
    body('days_to_harvest').optional().isInt({ min: 1 }),
    body('range_min').optional().isInt({ min: 1 }),
    body('range_max').optional().isInt({ min: 1 }),
    body('notes').optional().trim().escape(),
    body('flower_color').optional().trim().escape(),
    body('bloom_season').optional().trim().escape(),
    body('height').optional().trim().escape(),
    body('sun_requirement').optional().trim().escape(),
    body('is_perennial').optional().isBoolean(),
    body('planting_time').optional().trim().escape(),
    body('storage_requirement').optional().trim().escape()
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

// Get companion plant suggestions for a given plant name
router.get('/companions/:plantName', auth, (req, res) => {
  const plantName = req.params.plantName.toLowerCase().trim();

  if (!plantName) {
    return res.status(400).json({ error: 'Nazwa rośliny jest wymagana' });
  }

  // Get both good and bad companions
  db.all(
    `SELECT companion_name, relationship, reason
     FROM companion_plants
     WHERE LOWER(plant_name) = ?
     ORDER BY relationship DESC, companion_name ASC`,
    [plantName],
    (err, rows) => {
      if (err) {
        console.error('Error fetching companion plants:', err);
        return res.status(500).json({ error: 'Błąd podczas pobierania roślin towarzyszących' });
      }

      // Separate good and bad companions
      const goodCompanions = rows.filter(r => r.relationship === 'good');
      const badCompanions = rows.filter(r => r.relationship === 'bad');

      res.json({
        plant: plantName,
        good: goodCompanions.map(c => ({ name: c.companion_name, reason: c.reason })),
        bad: badCompanions.map(c => ({ name: c.companion_name, reason: c.reason }))
      });
    }
  );
});

module.exports = router;
