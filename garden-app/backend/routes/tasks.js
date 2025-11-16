const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');

/**
 * GET /api/tasks
 * Pobierz wszystkie zadania użytkownika
 */
router.get('/', auth, (req, res) => {
  const { completed } = req.query;

  let query = 'SELECT * FROM tasks WHERE user_id = ?';
  const params = [req.user.id];

  if (completed !== undefined) {
    query += ' AND completed = ?';
    params.push(completed === 'true' ? 1 : 0);
  }

  query += ' ORDER BY priority DESC, due_date ASC, created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

/**
 * GET /api/tasks/today
 * Pobierz dzisiejsze zadania
 */
router.get('/today', auth, (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  db.all(
    `SELECT * FROM tasks
     WHERE user_id = ?
     AND completed = 0
     AND (due_date <= ? OR due_date IS NULL)
     ORDER BY priority DESC, due_date ASC`,
    [req.user.id, today],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

/**
 * POST /api/tasks
 * Utwórz nowe zadanie
 */
router.post('/', auth, (req, res) => {
  const { task_type, description, due_date, priority, bed_id } = req.body;

  if (!task_type || !description) {
    return res.status(400).json({ error: 'Wymagane: task_type i description' });
  }

  const validTypes = ['spray', 'harvest', 'water', 'custom'];
  if (!validTypes.includes(task_type)) {
    return res.status(400).json({ error: 'Nieprawidłowy task_type' });
  }

  db.run(
    `INSERT INTO tasks (user_id, task_type, description, due_date, priority, bed_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [req.user.id, task_type, description, due_date || null, priority || 1, bed_id || null],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      db.get('SELECT * FROM tasks WHERE id = ?', [this.lastID], (err, task) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json(task);
      });
    }
  );
});

/**
 * PUT /api/tasks/:id
 * Zaktualizuj zadanie
 */
router.put('/:id', auth, (req, res) => {
  const { task_type, description, due_date, priority, completed } = req.body;

  db.get(
    'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    (err, task) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!task) {
        return res.status(404).json({ error: 'Zadanie nie znalezione' });
      }

      const updates = [];
      const params = [];

      if (task_type !== undefined) {
        updates.push('task_type = ?');
        params.push(task_type);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        params.push(description);
      }
      if (due_date !== undefined) {
        updates.push('due_date = ?');
        params.push(due_date);
      }
      if (priority !== undefined) {
        updates.push('priority = ?');
        params.push(priority);
      }
      if (completed !== undefined) {
        updates.push('completed = ?');
        params.push(completed ? 1 : 0);

        if (completed) {
          updates.push('completed_at = ?');
          params.push(new Date().toISOString());
        }
      }

      params.push(req.params.id);
      params.push(req.user.id);

      db.run(
        `UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
        params,
        function (err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Jeśli oznaczono zadanie podlewania jako completed, zaktualizuj last_watered_date
          if (completed && task.task_type === 'water' && task.bed_id) {
            db.run(
              `UPDATE beds
               SET last_watered_date = ?
               WHERE id = ?`,
              [new Date().toISOString().split('T')[0], task.bed_id],
              (updateErr) => {
                if (updateErr) {
                  console.error('Błąd aktualizacji last_watered_date:', updateErr);
                }
              }
            );
          }

          db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id], (err, updated) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            res.json(updated);
          });
        }
      );
    }
  );
});

/**
 * POST /api/tasks/:id/complete
 * Oznacz zadanie jako ukończone
 */
router.post('/:id/complete', auth, (req, res) => {
  // Najpierw pobierz zadanie aby sprawdzić typ
  db.get(
    'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    (err, task) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!task) {
        return res.status(404).json({ error: 'Zadanie nie znalezione' });
      }

      // Zaktualizuj zadanie jako ukończone
      db.run(
        `UPDATE tasks
         SET completed = 1, completed_at = ?
         WHERE id = ?`,
        [new Date().toISOString(), req.params.id],
        function (err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Jeśli to zadanie podlewania, zaktualizuj last_watered_date w beds
          if (task.task_type === 'water' && task.bed_id) {
            db.run(
              `UPDATE beds
               SET last_watered_date = ?
               WHERE id = ?`,
              [new Date().toISOString().split('T')[0], task.bed_id],
              (updateErr) => {
                if (updateErr) {
                  console.error('Błąd aktualizacji last_watered_date:', updateErr);
                }
              }
            );
          }

          db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id], (err, updatedTask) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            res.json(updatedTask);
          });
        }
      );
    }
  );
});

/**
 * DELETE /api/tasks/:id
 * Usuń zadanie
 */
router.delete('/:id', auth, (req, res) => {
  db.run(
    'DELETE FROM tasks WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Zadanie nie znalezione' });
      }
      res.json({ message: 'Zadanie usunięte' });
    }
  );
});

/**
 * POST /api/tasks/generate
 * Automatycznie generuj zadania na podstawie danych
 */
router.post('/generate', auth, async (req, res) => {
  try {
    const generatedTasks = [];

    // 1. Zadania z przypomnień o opryskach
    const sprayReminders = await new Promise((resolve, reject) => {
      db.all(
        `SELECT r.*, sh.spray_name, b.plant_name
         FROM reminders r
         JOIN spray_history sh ON r.spray_id = sh.id
         JOIN beds b ON r.bed_id = b.id
         WHERE r.user_id = ? AND r.is_read = 0`,
        [req.user.id],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    for (const reminder of sprayReminders) {
      // Sprawdź czy zadanie już nie istnieje
      const existing = await new Promise((resolve, reject) => {
        db.get(
          `SELECT id FROM tasks
           WHERE user_id = ? AND task_type = 'spray' AND bed_id = ? AND completed = 0`,
          [req.user.id, reminder.bed_id],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (!existing) {
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO tasks (user_id, task_type, description, due_date, priority, bed_id)
             VALUES (?, 'spray', ?, ?, 3, ?)`,
            [
              req.user.id,
              `Oprysz ${reminder.plant_name} - ${reminder.spray_name}`,
              reminder.reminder_date,
              reminder.bed_id
            ],
            function (err) {
              if (err) reject(err);
              else {
                generatedTasks.push({ id: this.lastID, type: 'spray' });
                resolve();
              }
            }
          );
        });
      }
    }

    // 2. Zadania zbiorów (rośliny posadzone 60+ dni temu)
    const readyToHarvest = await new Promise((resolve, reject) => {
      db.all(
        `SELECT b.*, p.name as plot_name
         FROM beds b
         JOIN plots p ON b.plot_id = p.id
         WHERE p.user_id = ?
         AND b.planted_date IS NOT NULL
         AND julianday('now') - julianday(b.planted_date) >= 60`,
        [req.user.id],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    for (const bed of readyToHarvest) {
      const daysPlanted = Math.floor(
        (Date.now() - new Date(bed.planted_date)) / (1000 * 60 * 60 * 24)
      );

      const existing = await new Promise((resolve, reject) => {
        db.get(
          `SELECT id FROM tasks
           WHERE user_id = ? AND task_type = 'harvest' AND bed_id = ? AND completed = 0`,
          [req.user.id, bed.id],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (!existing) {
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO tasks (user_id, task_type, description, due_date, priority, bed_id)
             VALUES (?, 'harvest', ?, ?, 2, ?)`,
            [
              req.user.id,
              `Zebrać ${bed.plant_name} (posadzona ${daysPlanted} dni temu)`,
              new Date().toISOString().split('T')[0],
              bed.id
            ],
            function (err) {
              if (err) reject(err);
              else {
                generatedTasks.push({ id: this.lastID, type: 'harvest' });
                resolve();
              }
            }
          );
        });
      }
    }

    // 3. Inteligentny System Podlewania - rośliny wymagające podlania
    const needsWatering = await new Promise((resolve, reject) => {
      db.all(
        `SELECT b.*, p.name as plot_name
         FROM beds b
         JOIN plots p ON b.plot_id = p.id
         WHERE p.user_id = ?
         AND b.plant_name IS NOT NULL
         AND (
           b.last_watered_date IS NULL
           OR julianday('now') - julianday(b.last_watered_date) >= 3
         )`,
        [req.user.id],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    for (const bed of needsWatering) {
      const existing = await new Promise((resolve, reject) => {
        db.get(
          `SELECT id FROM tasks
           WHERE user_id = ? AND task_type = 'water' AND bed_id = ? AND completed = 0`,
          [req.user.id, bed.id],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (!existing) {
        let daysAgo = 'nigdy nie podlewano';
        let priority = 2;

        if (bed.last_watered_date) {
          const daysSinceWatered = Math.floor(
            (Date.now() - new Date(bed.last_watered_date)) / (1000 * 60 * 60 * 24)
          );
          daysAgo = `${daysSinceWatered} dni temu`;

          // Wysokie priority jeśli 5+ dni bez podlewania
          if (daysSinceWatered >= 5) {
            priority = 3;
          }
        } else {
          // Wysokie priority jeśli nigdy nie podlewano
          priority = 3;
        }

        await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO tasks (user_id, task_type, description, due_date, priority, bed_id)
             VALUES (?, 'water', ?, ?, ?, ?)`,
            [
              req.user.id,
              `Podlać ${bed.plant_name} (ostatnio: ${daysAgo})`,
              new Date().toISOString().split('T')[0],
              priority,
              bed.id
            ],
            function (err) {
              if (err) reject(err);
              else {
                generatedTasks.push({ id: this.lastID, type: 'water' });
                resolve();
              }
            }
          );
        });
      }
    }

    res.json({
      message: `Wygenerowano ${generatedTasks.length} zadań`,
      tasks: generatedTasks
    });
  } catch (error) {
    console.error('Błąd generowania zadań:', error);
    res.status(500).json({ error: 'Błąd generowania zadań' });
  }
});

module.exports = router;
