const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../db');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { imageValidationMiddleware } = require('../utils/imageValidator');
const { deleteFile } = require('../utils/fileCleanup');
const { nameValidator, descriptionValidator } = require('../middleware/validators');
const sanitizeHtml = require('sanitize-html');

// Sanitization config - no HTML tags allowed
const sanitizeConfig = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: 'discard'
};

const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') return input;
  return sanitizeHtml(input, sanitizeConfig);
};

// Get all plots for logged-in user
router.get('/plots', auth, (req, res) => {
  db.all('SELECT * FROM plots WHERE user_id = ? ORDER BY created_at DESC', [req.user.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Błąd serwera' });
    }
    res.json(rows);
  });
});

// Get single plot by ID
router.get('/plots/:id', auth, (req, res) => {
  db.get('SELECT * FROM plots WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err, plot) => {
    if (err) {
      return res.status(500).json({ error: 'Błąd serwera' });
    }
    if (!plot) {
      return res.status(404).json({ error: 'Poletko nie znalezione' });
    }
    res.json(plot);
  });
});

// Get plot with all beds and spray history (optimized - single JOIN query)
router.get('/plots/:id/details', auth, (req, res) => {
  const plotId = req.params.id;

  // Single optimized query with JOINs instead of N+1 queries
  const query = `
    SELECT
      p.*,
      b.id as bed_id,
      b.row_number,
      b.plant_name,
      b.plant_variety,
      b.planted_date,
      b.expected_harvest_date,
      b.actual_harvest_date,
      b.yield_amount,
      b.yield_unit,
      b.note as bed_note,
      b.image_path as bed_image,
      b.created_at as bed_created,
      pl.category as plant_category,
      pl.flower_color,
      pl.bloom_season,
      pl.height,
      pl.sun_requirement,
      pl.latin_name,
      pl.is_perennial,
      sh.id as spray_id,
      sh.spray_name,
      sh.spray_type,
      sh.spray_date,
      sh.withdrawal_period,
      sh.safe_harvest_date,
      sh.dosage,
      sh.weather_conditions,
      sh.note as spray_note,
      sh.created_at as spray_created
    FROM plots p
    LEFT JOIN beds b ON p.id = b.plot_id
    LEFT JOIN plants pl ON (b.plant_name = pl.name OR b.plant_name = pl.display_name) AND (pl.user_id = ? OR pl.user_id IS NULL)
    LEFT JOIN spray_history sh ON b.id = sh.bed_id
    WHERE p.id = ? AND p.user_id = ?
    ORDER BY b.row_number, sh.spray_date DESC
  `;

  db.all(query, [req.user.id, plotId, req.user.id], (err, rows) => {
    if (err) {
      console.error('Error fetching plot details:', err);
      return res.status(500).json({ error: 'Błąd serwera' });
    }

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Poletko nie znalezione' });
    }

    // Transform flat rows into nested structure
    const plot = {
      id: rows[0].id,
      user_id: rows[0].user_id,
      name: rows[0].name,
      description: rows[0].description,
      image_path: rows[0].image_path,
      created_at: rows[0].created_at,
      beds: []
    };

    const bedsMap = new Map();

    rows.forEach(row => {
      // Add bed if not already in map
      if (row.bed_id && !bedsMap.has(row.bed_id)) {
        bedsMap.set(row.bed_id, {
          id: row.bed_id,
          plot_id: plotId,
          row_number: row.row_number,
          plant_name: row.plant_name,
          plant_variety: row.plant_variety,
          planted_date: row.planted_date,
          expected_harvest_date: row.expected_harvest_date,
          actual_harvest_date: row.actual_harvest_date,
          yield_amount: row.yield_amount,
          yield_unit: row.yield_unit,
          note: row.bed_note,
          image_path: row.bed_image,
          created_at: row.bed_created,
          // Plant data from JOIN
          category: row.plant_category,
          flower_color: row.flower_color,
          bloom_season: row.bloom_season,
          height: row.height,
          sun_requirement: row.sun_requirement,
          latin_name: row.latin_name,
          is_perennial: row.is_perennial,
          sprays: []
        });
      }

      // Add spray to bed if exists
      if (row.spray_id && bedsMap.has(row.bed_id)) {
        const bed = bedsMap.get(row.bed_id);
        // Avoid duplicate sprays (can happen with JOIN)
        if (!bed.sprays.find(s => s.id === row.spray_id)) {
          bed.sprays.push({
            id: row.spray_id,
            bed_id: row.bed_id,
            spray_name: row.spray_name,
            spray_type: row.spray_type,
            spray_date: row.spray_date,
            withdrawal_period: row.withdrawal_period,
            safe_harvest_date: row.safe_harvest_date,
            dosage: row.dosage,
            weather_conditions: row.weather_conditions,
            note: row.spray_note,
            created_at: row.spray_created
          });
        }
      }
    });

    plot.beds = Array.from(bedsMap.values());
    res.json(plot);
  });
});

// Create new plot
router.post('/plots',
  auth,
  upload.single('image'),
  imageValidationMiddleware,
  [
    body('name').trim().notEmpty().withMessage('Nazwa jest wymagana'),
    nameValidator,
    descriptionValidator
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name: rawName,
      description: rawDescription
    } = req.body;

    // Sanitize user inputs
    const name = sanitizeInput(rawName);
    const description = sanitizeInput(rawDescription);

    const imagePath = req.file ? `uploads/${req.file.filename}` : null;

    db.run(
      'INSERT INTO plots (user_id, name, description, image_path) VALUES (?, ?, ?, ?)',
      [req.user.id, name, description, imagePath],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Błąd podczas tworzenia poletka' });
        }

        res.status(201).json({
          message: 'Poletko utworzone pomyślnie',
          plot: {
            id: this.lastID,
            user_id: req.user.id,
            name,
            description,
            image_path: imagePath
          }
        });
      }
    );
  }
);

// Update plot
router.put('/plots/:id',
  auth,
  upload.single('image'),
  imageValidationMiddleware,
  [
    body('name').optional().trim().notEmpty().withMessage('Nazwa nie może być pusta'),
    nameValidator,
    descriptionValidator
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name: rawName,
      description: rawDescription
    } = req.body;

    // Sanitize user inputs
    const name = rawName !== undefined ? sanitizeInput(rawName) : undefined;
    const description = rawDescription !== undefined ? sanitizeInput(rawDescription) : undefined;

    const imagePath = req.file ? `uploads/${req.file.filename}` : undefined;

    // If new image uploaded, delete old image first
    if (imagePath) {
      db.get('SELECT image_path FROM plots WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err, plot) => {
        if (!err && plot && plot.image_path) {
          deleteFile(plot.image_path);
        }
      });
    }

    // SECURITY: Explicit whitelist - build update query dynamically
    const ALLOWED_FIELDS = { name, description, image_path: imagePath };
    const updateFields = [];
    const values = [];

    Object.entries(ALLOWED_FIELDS).forEach(([field, value]) => {
      if (value !== undefined) {
        updateFields.push(`${field} = ?`);
        values.push(value);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Brak danych do aktualizacji' });
    }

    values.push(req.params.id, req.user.id);

    db.run(
      `UPDATE plots SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
      values,
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Błąd podczas aktualizacji' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Poletko nie znalezione' });
        }

        res.json({ message: 'Poletko zaktualizowane pomyślnie' });
      }
    );
  }
);

// Reorder beds within a plot (drag & drop)
router.put('/plots/:id/reorder-beds', auth, (req, res) => {
  const { beds } = req.body; // Array of {id, row_number}

  if (!beds || !Array.isArray(beds) || beds.length === 0) {
    return res.status(400).json({ error: 'Nieprawidłowe dane' });
  }

  // Verify plot ownership first
  db.get(
    'SELECT id FROM plots WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    (err, plot) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      if (!plot) {
        return res.status(404).json({ error: 'Poletko nie znalezione' });
      }

      // Update each bed's row_number
      const updatePromises = beds.map(bed => {
        return new Promise((resolve, reject) => {
          db.run(
            `UPDATE beds SET row_number = ?
             WHERE id = ? AND plot_id = ?`,
            [bed.row_number, bed.id, req.params.id],
            function (err) {
              if (err) reject(err);
              else resolve(this.changes);
            }
          );
        });
      });

      Promise.all(updatePromises)
        .then(() => {
          res.json({ message: 'Kolejność grządek zaktualizowana' });
        })
        .catch(err => {
          console.error('Reorder beds error:', err);
          res.status(500).json({ error: 'Błąd podczas zmiany kolejności' });
        });
    }
  );
});

// Delete plot
router.delete('/plots/:id', auth, (req, res) => {
  db.run('DELETE FROM plots WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Błąd podczas usuwania' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Poletko nie znalezione' });
    }

    res.json({ message: 'Poletko usunięte pomyślnie' });
  });
});

/**
 * GET /api/plots/all-with-details
 * Eliminates N+1 problem - returns all plots with beds in single query
 * Used by flower tracking components (BloomTimeline, WinterProtection, etc.)
 */
router.get('/plots/all-with-details', auth, (req, res) => {
  const query = `
    SELECT
      p.id as plot_id,
      p.name as plot_name,
      p.description as plot_description,
      p.image_path as plot_image,
      p.created_at as plot_created,
      b.id as bed_id,
      b.row_number,
      b.plant_name,
      b.plant_variety,
      b.planted_date,
      b.expected_harvest_date,
      b.actual_harvest_date,
      b.yield_amount,
      b.yield_unit,
      b.note as bed_note,
      b.image_path as bed_image,
      b.created_at as bed_created,
      pl.category,
      pl.flower_color,
      pl.bloom_season,
      pl.height,
      pl.sun_requirement,
      pl.latin_name,
      pl.is_perennial,
      pl.is_bee_friendly,
      pl.is_fragrant,
      pl.is_edible
    FROM plots p
    LEFT JOIN beds b ON p.id = b.plot_id
    LEFT JOIN plants pl ON (b.plant_name = pl.name OR b.plant_name = pl.display_name)
      AND (pl.user_id = ? OR pl.user_id IS NULL)
    WHERE p.user_id = ?
    ORDER BY p.id, b.row_number
  `;

  db.all(query, [req.user.id, req.user.id], (err, rows) => {
    if (err) {
      console.error('Error fetching all plots with details:', err);
      return res.status(500).json({ error: 'Błąd serwera' });
    }

    // Group by plots
    const plotsMap = {};
    rows.forEach(row => {
      if (!plotsMap[row.plot_id]) {
        plotsMap[row.plot_id] = {
          id: row.plot_id,
          name: row.plot_name,
          description: row.plot_description,
          image_path: row.plot_image,
          created_at: row.plot_created,
          beds: []
        };
      }

      if (row.bed_id) {
        plotsMap[row.plot_id].beds.push({
          id: row.bed_id,
          plot_id: row.plot_id,
          row_number: row.row_number,
          plant_name: row.plant_name,
          plant_variety: row.plant_variety,
          planted_date: row.planted_date,
          expected_harvest_date: row.expected_harvest_date,
          actual_harvest_date: row.actual_harvest_date,
          yield_amount: row.yield_amount,
          yield_unit: row.yield_unit,
          note: row.bed_note,
          image_path: row.bed_image,
          created_at: row.bed_created,
          category: row.category,
          flower_color: row.flower_color,
          bloom_season: row.bloom_season,
          height: row.height,
          sun_requirement: row.sun_requirement,
          latin_name: row.latin_name,
          is_perennial: row.is_perennial,
          is_bee_friendly: row.is_bee_friendly,
          is_fragrant: row.is_fragrant,
          is_edible: row.is_edible
        });
      }
    });

    res.json(Object.values(plotsMap));
  });
});

module.exports = router;
