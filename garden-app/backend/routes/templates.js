const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../db');
const auth = require('../middleware/auth');
const { calculateHarvestDate } = require('../utils/harvestPredictor');

// GET /api/templates - Get all garden templates
router.get('/', (req, res) => {
  const { category, tags } = req.query;

  let query = `
    SELECT
      t.*,
      COUNT(DISTINCT tb.id) as bed_count
    FROM garden_templates t
    LEFT JOIN template_beds tb ON t.id = tb.template_id
  `;

  const conditions = [];
  const params = [];

  if (category) {
    conditions.push('t.category = ?');
    params.push(category);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' GROUP BY t.id ORDER BY t.difficulty, t.size_m2';

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching templates:', err);
      return res.status(500).json({ error: 'Błąd serwera' });
    }

    // Parse tags JSON and get preview plants
    const templateIds = rows.map(r => r.id);

    if (templateIds.length === 0) {
      return res.json([]);
    }

    // Get preview plants (first 5 plant names for each template)
    const placeholders = templateIds.map(() => '?').join(',');
    const previewQuery = `
      SELECT
        template_id,
        GROUP_CONCAT(plant_name) as plant_names
      FROM (
        SELECT DISTINCT template_id, plant_name
        FROM template_beds
        WHERE template_id IN (${placeholders})
        ORDER BY template_id, row_number
      )
      GROUP BY template_id
    `;

    db.all(previewQuery, templateIds, (previewErr, previewRows) => {
      if (previewErr) {
        console.error('Error fetching preview plants:', previewErr);
        // Continue without preview plants
      }

      const previewMap = {};
      if (previewRows) {
        previewRows.forEach(row => {
          previewMap[row.template_id] = row.plant_names ? row.plant_names.split(',').slice(0, 5) : [];
        });
      }

      // Format response
      const templates = rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        size_m2: row.size_m2,
        difficulty: row.difficulty,
        category: row.category,
        tags: JSON.parse(row.tags || '[]'),
        estimated_setup_time: row.estimated_setup_time,
        bed_count: row.bed_count,
        preview_plants: previewMap[row.id] || []
      }));

      // Filter by tags if specified
      let filteredTemplates = templates;
      if (tags) {
        const requestedTags = tags.split(',').map(t => t.trim());
        filteredTemplates = templates.filter(template =>
          template.tags.some(tag => requestedTags.includes(tag))
        );
      }

      res.json(filteredTemplates);
    });
  });
});

// GET /api/templates/:id - Get template details with beds
router.get('/:id', (req, res) => {
  const templateId = req.params.id;

  // Get template
  db.get('SELECT * FROM garden_templates WHERE id = ?', [templateId], (err, template) => {
    if (err) {
      console.error('Error fetching template:', err);
      return res.status(500).json({ error: 'Błąd serwera' });
    }

    if (!template) {
      return res.status(404).json({ error: 'Szablon nie znaleziony' });
    }

    // Get template beds
    db.all(
      'SELECT * FROM template_beds WHERE template_id = ? ORDER BY row_number',
      [templateId],
      (bedsErr, beds) => {
        if (bedsErr) {
          console.error('Error fetching template beds:', bedsErr);
          return res.status(500).json({ error: 'Błąd serwera' });
        }

        res.json({
          template: {
            ...template,
            tags: JSON.parse(template.tags || '[]')
          },
          beds: beds || []
        });
      }
    );
  });
});

// POST /api/templates/:id/create-plot - Create plot from template
router.post(
  '/:id/create-plot',
  auth,
  [
    body('plotName').optional().trim().isLength({ max: 100 }).escape(),
    body('autoPlantDate').optional().isBoolean()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const templateId = req.params.id;
    const userId = req.user.id;
    const { plotName, autoPlantDate } = req.body;

    try {
      // Get template
      const template = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM garden_templates WHERE id = ?', [templateId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!template) {
        return res.status(404).json({ error: 'Szablon nie znaleziony' });
      }

      // Get template beds
      const templateBeds = await new Promise((resolve, reject) => {
        db.all(
          'SELECT * FROM template_beds WHERE template_id = ? ORDER BY row_number',
          [templateId],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      // Create plot
      const finalPlotName = plotName || template.name;
      const plot = await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO plots (user_id, name, description) VALUES (?, ?, ?)',
          [userId, finalPlotName, template.description],
          function (err) {
            if (err) reject(err);
            else {
              resolve({
                id: this.lastID,
                user_id: userId,
                name: finalPlotName,
                description: template.description
              });
            }
          }
        );
      });

      // Create beds from template
      const createdBeds = [];
      const today = new Date().toISOString().split('T')[0];

      for (const templateBed of templateBeds) {
        const plantedDate = autoPlantDate ? today : null;
        let expectedHarvestDate = null;

        // Calculate harvest date if planted date is set
        if (plantedDate && templateBed.plant_name) {
          const prediction = calculateHarvestDate(templateBed.plant_name, plantedDate);
          if (prediction && prediction.expectedDate) {
            expectedHarvestDate = prediction.expectedDate;
          }
        }

        const bed = await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO beds (plot_id, row_number, plant_name, plant_variety, planted_date, note, expected_harvest_date)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              plot.id,
              templateBed.row_number,
              templateBed.plant_name,
              templateBed.plant_variety,
              plantedDate,
              templateBed.note,
              expectedHarvestDate
            ],
            function (err) {
              if (err) reject(err);
              else {
                resolve({
                  id: this.lastID,
                  plot_id: plot.id,
                  row_number: templateBed.row_number,
                  plant_name: templateBed.plant_name,
                  plant_variety: templateBed.plant_variety,
                  planted_date: plantedDate,
                  note: templateBed.note,
                  expected_harvest_date: expectedHarvestDate
                });
              }
            }
          );
        });

        createdBeds.push(bed);
      }

      res.status(201).json({
        message: 'Poletko utworzone pomyślnie z szablonu',
        plot,
        beds: createdBeds
      });
    } catch (error) {
      console.error('Error creating plot from template:', error);
      res.status(500).json({ error: 'Błąd podczas tworzenia poletka z szablonu' });
    }
  }
);

module.exports = router;
