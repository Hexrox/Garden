const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
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

/**
 * POST /api/care
 * Add new care action (spray or fertilization)
 */
router.post('/',
  auth,
  [
    body('bed_id').isInt().withMessage('bed_id must be an integer'),
    body('action_type').isIn(['spray', 'fertilization']).withMessage('action_type must be spray or fertilization'),
    body('action_name').trim().notEmpty().withMessage('action_name is required').isLength({ max: 100 }),
    body('action_date').isISO8601().withMessage('action_date must be a valid date'),
    body('dosage').optional().trim().isLength({ max: 100 }),
    body('weather_conditions').optional().trim().isLength({ max: 100 }),
    body('note').optional().trim().isLength({ max: 500 }),

    // Spray-specific
    body('withdrawal_period').if(body('action_type').equals('spray')).isInt({ min: 0, max: 365 }).withMessage('withdrawal_period must be between 0 and 365'),

    // Fertilization-specific
    body('fertilizer_type').optional().isIn(['mineral', 'organic', 'natural']),
    body('npk_ratio').optional().trim().isLength({ max: 20 }),
    body('application_method').optional().isIn(['soil', 'foliar']),
    body('is_recurring').optional().isBoolean(),
    body('repeat_frequency').if(body('is_recurring').equals(true)).isInt({ min: 1, max: 365 }).withMessage('repeat_frequency must be between 1 and 365 days')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      bed_id,
      action_type,
      action_name: rawActionName,
      action_date,
      dosage: rawDosage,
      weather_conditions: rawWeatherConditions,
      note: rawNote,
      // Spray-specific
      withdrawal_period,
      // Fertilization-specific
      fertilizer_type,
      npk_ratio: rawNpkRatio,
      application_method,
      is_recurring,
      repeat_frequency
    } = req.body;

    // Sanitize user inputs
    const action_name = sanitizeInput(rawActionName);
    const dosage = sanitizeInput(rawDosage);
    const weather_conditions = sanitizeInput(rawWeatherConditions);
    const note = sanitizeInput(rawNote);
    const npk_ratio = sanitizeInput(rawNpkRatio);

    // Verify bed ownership
    db.get(
      `SELECT beds.*, plots.user_id
       FROM beds
       JOIN plots ON beds.plot_id = plots.id
       WHERE beds.id = ?`,
      [bed_id],
      (err, bed) => {
        if (err) {
          console.error('Error fetching bed:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (!bed) {
          return res.status(404).json({ error: 'Bed not found' });
        }

        if (bed.user_id !== req.user.id) {
          return res.status(403).json({ error: 'Unauthorized' });
        }

        // Calculate safe_harvest_date for sprays
        let safe_harvest_date = null;
        if (action_type === 'spray' && withdrawal_period !== null && withdrawal_period !== undefined) {
          const sprayDate = new Date(action_date);
          sprayDate.setDate(sprayDate.getDate() + parseInt(withdrawal_period));
          safe_harvest_date = sprayDate.toISOString().split('T')[0];
        }

        // Calculate next_application_date for recurring fertilization
        let next_application_date = null;
        if (action_type === 'fertilization' && is_recurring && repeat_frequency) {
          const currentDate = new Date(action_date);
          currentDate.setDate(currentDate.getDate() + parseInt(repeat_frequency));
          next_application_date = currentDate.toISOString().split('T')[0];
        }

        // Insert care action
        const query = `
          INSERT INTO care_history (
            bed_id, action_type, action_name, action_date,
            dosage, weather_conditions, note,
            withdrawal_period, safe_harvest_date,
            fertilizer_type, npk_ratio, application_method,
            is_recurring, repeat_frequency, next_application_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(
          query,
          [
            bed_id,
            action_type,
            action_name,
            action_date,
            dosage || null,
            weather_conditions || null,
            note || null,
            // Spray fields
            action_type === 'spray' ? withdrawal_period : null,
            action_type === 'spray' ? safe_harvest_date : null,
            // Fertilization fields
            action_type === 'fertilization' ? (fertilizer_type || null) : null,
            action_type === 'fertilization' ? (npk_ratio || null) : null,
            action_type === 'fertilization' ? (application_method || 'soil') : null,
            action_type === 'fertilization' ? (is_recurring || 0) : 0,
            action_type === 'fertilization' && is_recurring ? repeat_frequency : null,
            action_type === 'fertilization' && is_recurring ? next_application_date : null
          ],
          function(err) {
            if (err) {
              console.error('Error inserting care action:', err);
              return res.status(500).json({ error: 'Failed to save care action' });
            }

            const careId = this.lastID;

            // If recurring fertilization, create a task for next application
            if (action_type === 'fertilization' && is_recurring && next_application_date) {
              const taskDescription = `Nawożenie: ${action_name}`;

              db.run(
                `INSERT INTO tasks (
                  user_id, bed_id, task_type, description, due_date,
                  is_recurring, recurrence_frequency, next_occurrence
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  req.user.id,
                  bed_id,
                  'custom',
                  taskDescription,
                  next_application_date,
                  1,
                  repeat_frequency,
                  next_application_date
                ],
                (taskErr) => {
                  if (taskErr) {
                    console.error('Error creating recurring task:', taskErr);
                  }
                }
              );
            }

            // If spray with withdrawal period, create reminder task
            if (action_type === 'spray' && withdrawal_period > 0 && safe_harvest_date) {
              // Reminder 3 days before safe harvest
              const reminderDate = new Date(safe_harvest_date);
              reminderDate.setDate(reminderDate.getDate() - 3);

              const taskDescription = `Zbliża się koniec karencji dla: ${action_name} (${bed.plant_name || 'Rząd ' + bed.row_number})`;

              db.run(
                `INSERT INTO tasks (
                  user_id, bed_id, task_type, description, due_date, auto_generated
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                  req.user.id,
                  bed_id,
                  'custom',
                  taskDescription,
                  reminderDate.toISOString().split('T')[0],
                  1
                ],
                (taskErr) => {
                  if (taskErr) {
                    console.error('Error creating spray reminder:', taskErr);
                  }
                }
              );
            }

            res.json({
              message: 'Care action saved successfully',
              id: careId,
              action_type,
              safe_harvest_date: action_type === 'spray' ? safe_harvest_date : null,
              next_application_date: action_type === 'fertilization' && is_recurring ? next_application_date : null
            });
          }
        );
      }
    );
  }
);

/**
 * GET /api/care/:bedId
 * Get care history for a specific bed
 */
router.get('/:bedId', auth, (req, res) => {
  const { bedId } = req.params;

  // Verify bed ownership
  db.get(
    `SELECT beds.*, plots.user_id
     FROM beds
     JOIN plots ON beds.plot_id = plots.id
     WHERE beds.id = ?`,
    [bedId],
    (err, bed) => {
      if (err) {
        console.error('Error fetching bed:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!bed) {
        return res.status(404).json({ error: 'Bed not found' });
      }

      if (bed.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Get care history
      db.all(
        `SELECT * FROM care_history
         WHERE bed_id = ?
         ORDER BY action_date DESC`,
        [bedId],
        (err, history) => {
          if (err) {
            console.error('Error fetching care history:', err);
            return res.status(500).json({ error: 'Failed to fetch care history' });
          }

          res.json(history);
        }
      );
    }
  );
});

/**
 * GET /api/care/user/all
 * Get all care history for current user
 */
router.get('/user/all', auth, (req, res) => {
  const query = `
    SELECT
      ch.*,
      b.row_number,
      b.plant_name,
      b.plant_variety,
      p.name as plot_name
    FROM care_history ch
    JOIN beds b ON ch.bed_id = b.id
    JOIN plots p ON b.plot_id = p.id
    WHERE p.user_id = ?
    ORDER BY ch.action_date DESC
    LIMIT 100
  `;

  db.all(query, [req.user.id], (err, history) => {
    if (err) {
      console.error('Error fetching user care history:', err);
      return res.status(500).json({ error: 'Failed to fetch care history' });
    }

    res.json(history);
  });
});

module.exports = router;
