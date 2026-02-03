const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// ==========================================
// GARDEN PLANS CRUD
// ==========================================

// Get all plans for user
router.get('/', auth, (req, res) => {
  const { status, year } = req.query;

  let query = `
    SELECT gp.*,
           p.name as plot_name,
           (SELECT COUNT(*) FROM garden_plan_items WHERE plan_id = gp.id) as items_count
    FROM garden_plans gp
    LEFT JOIN plots p ON gp.plot_id = p.id
    WHERE gp.user_id = ?
  `;
  const params = [req.user.id];

  if (status) {
    query += ' AND gp.status = ?';
    params.push(status);
  }

  if (year) {
    query += ' AND gp.year = ?';
    params.push(parseInt(year));
  }

  query += ' ORDER BY gp.updated_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching garden plans:', err);
      return res.status(500).json({ error: 'Błąd serwera' });
    }
    res.json(rows);
  });
});

// Get single plan with items
router.get('/:id', auth, (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT gp.*, p.name as plot_name
     FROM garden_plans gp
     LEFT JOIN plots p ON gp.plot_id = p.id
     WHERE gp.id = ? AND gp.user_id = ?`,
    [id, req.user.id],
    (err, plan) => {
      if (err) {
        console.error('Error fetching plan:', err);
        return res.status(500).json({ error: 'Błąd serwera' });
      }

      if (!plan) {
        return res.status(404).json({ error: 'Plan nie znaleziony' });
      }

      // Get items
      db.all(
        `SELECT gpi.*, pl.display_name, pl.spacing, pl.companion_plants, pl.avoid_plants,
                pl.flower_color, pl.bloom_season, pl.photo_thumb
         FROM garden_plan_items gpi
         LEFT JOIN plants pl ON gpi.plant_id = pl.id
         WHERE gpi.plan_id = ?
         ORDER BY gpi.row_number, gpi.position_y, gpi.position_x`,
        [id],
        (err, items) => {
          if (err) {
            console.error('Error fetching plan items:', err);
            return res.status(500).json({ error: 'Błąd serwera' });
          }

          res.json({ ...plan, items: items || [] });
        }
      );
    }
  );
});

// Create new plan
router.post('/', auth, (req, res) => {
  const { name, description, plot_id, year, width_cm, length_cm } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Nazwa planu jest wymagana' });
  }

  db.run(
    `INSERT INTO garden_plans (user_id, name, description, plot_id, year, width_cm, length_cm)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, name, description, plot_id || null, year || new Date().getFullYear(), width_cm, length_cm],
    function(err) {
      if (err) {
        console.error('Error creating plan:', err);
        return res.status(500).json({ error: 'Błąd tworzenia planu' });
      }

      res.status(201).json({
        id: this.lastID,
        message: 'Plan utworzony'
      });
    }
  );
});

// Update plan
router.put('/:id', auth, (req, res) => {
  const { id } = req.params;
  const { name, description, plot_id, status, width_cm, length_cm } = req.body;

  // First verify ownership
  db.get('SELECT id FROM garden_plans WHERE id = ? AND user_id = ?', [id, req.user.id], (err, plan) => {
    if (err) {
      return res.status(500).json({ error: 'Błąd serwera' });
    }
    if (!plan) {
      return res.status(404).json({ error: 'Plan nie znaleziony' });
    }

    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (plot_id !== undefined) { updates.push('plot_id = ?'); params.push(plot_id); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (width_cm !== undefined) { updates.push('width_cm = ?'); params.push(width_cm); }
    if (length_cm !== undefined) { updates.push('length_cm = ?'); params.push(length_cm); }

    if (updates.length === 0) {
      return res.json({ message: 'Brak zmian' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    db.run(
      `UPDATE garden_plans SET ${updates.join(', ')} WHERE id = ?`,
      params,
      function(err) {
        if (err) {
          console.error('Error updating plan:', err);
          return res.status(500).json({ error: 'Błąd aktualizacji' });
        }
        res.json({ message: 'Plan zaktualizowany' });
      }
    );
  });
});

// Delete plan
router.delete('/:id', auth, (req, res) => {
  const { id } = req.params;

  db.run(
    'DELETE FROM garden_plans WHERE id = ? AND user_id = ?',
    [id, req.user.id],
    function(err) {
      if (err) {
        console.error('Error deleting plan:', err);
        return res.status(500).json({ error: 'Błąd usuwania' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Plan nie znaleziony' });
      }
      res.json({ message: 'Plan usunięty' });
    }
  );
});

// ==========================================
// PLAN ITEMS CRUD
// ==========================================

// Add item to plan
router.post('/:id/items', auth, (req, res) => {
  const { id } = req.params;
  const { plant_id, plant_name, quantity, position_x, position_y, width_cm, height_cm, row_number, notes, planned_date } = req.body;

  // Verify plan ownership
  db.get('SELECT id FROM garden_plans WHERE id = ? AND user_id = ?', [id, req.user.id], (err, plan) => {
    if (err) {
      return res.status(500).json({ error: 'Błąd serwera' });
    }
    if (!plan) {
      return res.status(404).json({ error: 'Plan nie znaleziony' });
    }

    db.run(
      `INSERT INTO garden_plan_items (plan_id, plant_id, plant_name, quantity, position_x, position_y, width_cm, height_cm, row_number, notes, planned_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, plant_id || null, plant_name, quantity || 1, position_x, position_y, width_cm, height_cm, row_number, notes, planned_date],
      function(err) {
        if (err) {
          console.error('Error adding item:', err);
          return res.status(500).json({ error: 'Błąd dodawania rośliny' });
        }

        // Update plan's updated_at
        db.run('UPDATE garden_plans SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);

        res.status(201).json({
          id: this.lastID,
          message: 'Roślina dodana do planu'
        });
      }
    );
  });
});

// Update item
router.put('/:planId/items/:itemId', auth, (req, res) => {
  const { planId, itemId } = req.params;
  const { quantity, position_x, position_y, width_cm, height_cm, row_number, notes, planned_date } = req.body;

  // Verify ownership
  db.get('SELECT id FROM garden_plans WHERE id = ? AND user_id = ?', [planId, req.user.id], (err, plan) => {
    if (err) {
      return res.status(500).json({ error: 'Błąd serwera' });
    }
    if (!plan) {
      return res.status(404).json({ error: 'Plan nie znaleziony' });
    }

    const updates = [];
    const params = [];

    if (quantity !== undefined) { updates.push('quantity = ?'); params.push(quantity); }
    if (position_x !== undefined) { updates.push('position_x = ?'); params.push(position_x); }
    if (position_y !== undefined) { updates.push('position_y = ?'); params.push(position_y); }
    if (width_cm !== undefined) { updates.push('width_cm = ?'); params.push(width_cm); }
    if (height_cm !== undefined) { updates.push('height_cm = ?'); params.push(height_cm); }
    if (row_number !== undefined) { updates.push('row_number = ?'); params.push(row_number); }
    if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
    if (planned_date !== undefined) { updates.push('planned_date = ?'); params.push(planned_date); }

    if (updates.length === 0) {
      return res.json({ message: 'Brak zmian' });
    }

    params.push(itemId, planId);

    db.run(
      `UPDATE garden_plan_items SET ${updates.join(', ')} WHERE id = ? AND plan_id = ?`,
      params,
      function(err) {
        if (err) {
          console.error('Error updating item:', err);
          return res.status(500).json({ error: 'Błąd aktualizacji' });
        }

        // Update plan's updated_at
        db.run('UPDATE garden_plans SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [planId]);

        res.json({ message: 'Element zaktualizowany' });
      }
    );
  });
});

// Delete item
router.delete('/:planId/items/:itemId', auth, (req, res) => {
  const { planId, itemId } = req.params;

  // Verify ownership
  db.get('SELECT id FROM garden_plans WHERE id = ? AND user_id = ?', [planId, req.user.id], (err, plan) => {
    if (err) {
      return res.status(500).json({ error: 'Błąd serwera' });
    }
    if (!plan) {
      return res.status(404).json({ error: 'Plan nie znaleziony' });
    }

    db.run(
      'DELETE FROM garden_plan_items WHERE id = ? AND plan_id = ?',
      [itemId, planId],
      function(err) {
        if (err) {
          console.error('Error deleting item:', err);
          return res.status(500).json({ error: 'Błąd usuwania' });
        }

        // Update plan's updated_at
        db.run('UPDATE garden_plans SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [planId]);

        res.json({ message: 'Element usunięty' });
      }
    );
  });
});

// ==========================================
// PLAN ACTIONS
// ==========================================

// Convert plan to tasks in planner
router.post('/:id/convert-to-tasks', auth, (req, res) => {
  const { id } = req.params;

  // Get plan and items
  db.get(
    'SELECT * FROM garden_plans WHERE id = ? AND user_id = ?',
    [id, req.user.id],
    (err, plan) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      if (!plan) {
        return res.status(404).json({ error: 'Plan nie znaleziony' });
      }

      db.all(
        'SELECT * FROM garden_plan_items WHERE plan_id = ?',
        [id],
        (err, items) => {
          if (err) {
            return res.status(500).json({ error: 'Błąd serwera' });
          }

          if (items.length === 0) {
            return res.status(400).json({ error: 'Plan nie zawiera roślin' });
          }

          // Create planned_actions for each item
          const insertPromises = items.map(item => {
            return new Promise((resolve, reject) => {
              db.run(
                `INSERT INTO planned_actions (user_id, plant_id, plot_id, action_type, title, planned_date, notes)
                 VALUES (?, ?, ?, 'plant', ?, ?, ?)`,
                [
                  req.user.id,
                  item.plant_id,
                  plan.plot_id,
                  `Posadzić: ${item.plant_name}`,
                  item.planned_date || new Date().toISOString().split('T')[0],
                  `Z planu: ${plan.name}. ${item.notes || ''}`
                ],
                function(err) {
                  if (err) reject(err);
                  else resolve(this.lastID);
                }
              );
            });
          });

          Promise.all(insertPromises)
            .then(taskIds => {
              // Update plan status to active
              db.run(
                'UPDATE garden_plans SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                ['active', id]
              );

              res.json({
                message: `Utworzono ${taskIds.length} zadań w planerze`,
                task_ids: taskIds
              });
            })
            .catch(err => {
              console.error('Error creating tasks:', err);
              res.status(500).json({ error: 'Błąd tworzenia zadań' });
            });
        }
      );
    }
  );
});

// Execute plan - actually plant everything
router.post('/:id/execute', auth, (req, res) => {
  const { id } = req.params;

  // Get plan and items
  db.get(
    'SELECT * FROM garden_plans WHERE id = ? AND user_id = ?',
    [id, req.user.id],
    (err, plan) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      if (!plan) {
        return res.status(404).json({ error: 'Plan nie znaleziony' });
      }
      if (plan.status === 'archived') {
        return res.status(400).json({ error: 'Plan został już wykonany' });
      }
      if (!plan.plot_id) {
        return res.status(400).json({ error: 'Plan musi być przypisany do poletka' });
      }

      db.all(
        'SELECT * FROM garden_plan_items WHERE plan_id = ?',
        [id],
        (err, items) => {
          if (err) {
            return res.status(500).json({ error: 'Błąd serwera' });
          }

          if (items.length === 0) {
            return res.status(400).json({ error: 'Plan nie zawiera roślin' });
          }

          // Create beds for each item
          const insertPromises = items.map(item => {
            return new Promise((resolve, reject) => {
              db.run(
                `INSERT INTO beds (plot_id, row_number, plant_name, planted_date, note)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                  plan.plot_id,
                  item.row_number || 1,
                  item.plant_name,
                  new Date().toISOString().split('T')[0],
                  item.notes || `Z planu: ${plan.name}`
                ],
                function(err) {
                  if (err) reject(err);
                  else resolve(this.lastID);
                }
              );
            });
          });

          Promise.all(insertPromises)
            .then(bedIds => {
              // Archive the plan
              db.run(
                'UPDATE garden_plans SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                ['archived', id]
              );

              res.json({
                message: `Posadzono ${bedIds.length} roślin`,
                bed_ids: bedIds
              });
            })
            .catch(err => {
              console.error('Error creating beds:', err);
              res.status(500).json({ error: 'Błąd sadzenia' });
            });
        }
      );
    }
  );
});

// Get companion analysis for plan
router.get('/:id/companion-analysis', auth, (req, res) => {
  const { id } = req.params;

  // Get all items in plan
  db.all(
    `SELECT gpi.*, pl.companion_plants, pl.avoid_plants
     FROM garden_plan_items gpi
     LEFT JOIN plants pl ON gpi.plant_id = pl.id
     WHERE gpi.plan_id = ?
     AND EXISTS (SELECT 1 FROM garden_plans WHERE id = gpi.plan_id AND user_id = ?)`,
    [id, req.user.id],
    (err, items) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }

      const plantNames = items.map(i => i.plant_name.toLowerCase());
      const conflicts = [];
      const benefits = [];

      items.forEach(item => {
        const itemName = item.plant_name.toLowerCase();

        // Check avoid_plants
        if (item.avoid_plants) {
          const avoidList = item.avoid_plants.toLowerCase();
          plantNames.forEach(other => {
            if (other !== itemName && avoidList.includes(other)) {
              conflicts.push({
                plant1: item.plant_name,
                plant2: other,
                reason: `${item.plant_name} nie powinien rosnąć obok ${other}`
              });
            }
          });
        }

        // Check companion_plants
        if (item.companion_plants) {
          const companionList = item.companion_plants.toLowerCase();
          plantNames.forEach(other => {
            if (other !== itemName && companionList.includes(other)) {
              benefits.push({
                plant1: item.plant_name,
                plant2: other,
                reason: `${item.plant_name} dobrze rośnie obok ${other}`
              });
            }
          });
        }
      });

      res.json({
        total_plants: items.length,
        conflicts: conflicts,
        benefits: benefits,
        has_conflicts: conflicts.length > 0
      });
    }
  );
});

module.exports = router;
