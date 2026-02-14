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
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 100));
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE t.user_id = ?';
  const params = [req.user.id];

  if (completed !== undefined) {
    whereClause += ' AND t.completed = ?';
    params.push(completed === 'true' ? 1 : 0);
  }

  // Pobierz łączną liczbę zadań
  db.get(
    `SELECT COUNT(*) as total FROM tasks t ${whereClause}`,
    params,
    (err, countRow) => {
      if (err) {
        console.error('Tasks error:', err.message);
        return res.status(500).json({ error: 'Błąd serwera' });
      }

      const total = countRow.total;
      const totalPages = Math.ceil(total / limit);

      const query = `
        SELECT t.*, b.plant_name, b.plot_id, p.name as plot_name,
               gp.name as garden_plan_name
        FROM tasks t
        LEFT JOIN beds b ON t.bed_id = b.id
        LEFT JOIN plots p ON b.plot_id = p.id
        LEFT JOIN garden_plans gp ON t.garden_plan_id = gp.id
        ${whereClause}
        ORDER BY t.priority DESC, t.due_date ASC, t.created_at DESC
        LIMIT ? OFFSET ?
      `;

      db.all(query, [...params, limit, offset], (err, rows) => {
        if (err) {
          console.error('Tasks error:', err.message);
          return res.status(500).json({ error: 'Błąd serwera' });
        }
        res.json({
          data: rows,
          pagination: { page, limit, total, totalPages }
        });
      });
    }
  );
});

/**
 * GET /api/tasks/today
 * Pobierz dzisiejsze zadania
 */
router.get('/today', auth, (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  db.all(
    `SELECT t.*, b.plant_name, b.plot_id, p.name as plot_name,
            gp.name as garden_plan_name
     FROM tasks t
     LEFT JOIN beds b ON t.bed_id = b.id
     LEFT JOIN plots p ON b.plot_id = p.id
     LEFT JOIN garden_plans gp ON t.garden_plan_id = gp.id
     WHERE t.user_id = ?
     AND t.completed = 0
     AND (t.due_date <= ? OR t.due_date IS NULL)
     AND (t.dismissed_at IS NULL OR datetime(t.dismissed_at, '+14 days') < datetime('now'))
     AND (t.snoozed_until IS NULL OR datetime(t.snoozed_until) < datetime('now'))
     ORDER BY t.priority DESC, t.due_date ASC`,
    [req.user.id, today],
    (err, rows) => {
      if (err) {
        console.error('Tasks error:', err.message);
        return res.status(500).json({ error: 'Błąd serwera' });
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
  const {
    task_type,
    description,
    due_date,
    priority,
    bed_id,
    is_recurring,
    recurrence_frequency,
    recurrence_times,
    recurrence_end_date,
    time_of_day
  } = req.body;

  if (!task_type || !description) {
    return res.status(400).json({ error: 'Wymagane: task_type i description' });
  }

  const validTypes = ['spray', 'harvest', 'water', 'custom'];
  if (!validTypes.includes(task_type)) {
    return res.status(400).json({ error: 'Nieprawidłowy task_type' });
  }

  // Walidacja time_of_day
  const validTimeOfDay = ['morning', 'evening', null, undefined];
  if (time_of_day && !['morning', 'evening'].includes(time_of_day)) {
    return res.status(400).json({ error: 'Nieprawidłowy time_of_day (dozwolone: morning, evening lub puste)' });
  }

  // Walidacja recurring fields
  if (is_recurring) {
    if (!recurrence_frequency || recurrence_frequency < 1) {
      return res.status(400).json({ error: 'recurrence_frequency musi być >= 1' });
    }

    if (recurrence_times) {
      try {
        const validTimes = ['anytime', 'morning', 'afternoon', 'evening'];
        const times = JSON.parse(recurrence_times);
        if (!Array.isArray(times) || !times.every(t => validTimes.includes(t))) {
          return res.status(400).json({ error: 'Nieprawidłowe recurrence_times' });
        }
      } catch (parseError) {
        return res.status(400).json({ error: 'Nieprawidłowy format recurrence_times (wymagany JSON array)' });
      }
    }
  }

  // Oblicz next_occurrence dla recurring tasks
  let next_occurrence = null;
  if (is_recurring && recurrence_frequency) {
    // Oblicz od due_date jeśli podano, w przeciwnym razie od dziś
    const baseDate = due_date ? new Date(due_date) : new Date();
    baseDate.setDate(baseDate.getDate() + recurrence_frequency);
    next_occurrence = baseDate.toISOString().split('T')[0];
  }

  db.run(
    `INSERT INTO tasks (
      user_id, task_type, description, due_date, priority, bed_id,
      is_recurring, recurrence_frequency, recurrence_times,
      next_occurrence, recurrence_end_date, time_of_day
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.user.id,
      task_type,
      description,
      due_date || null,
      priority || 1,
      bed_id || null,
      is_recurring ? 1 : 0,
      recurrence_frequency || null,
      recurrence_times || null,
      next_occurrence,
      recurrence_end_date || null,
      time_of_day || null
    ],
    function (err) {
      if (err) {
        console.error('Tasks error:', err.message);
        return res.status(500).json({ error: 'Błąd serwera' });
      }

      db.get('SELECT * FROM tasks WHERE id = ?', [this.lastID], (err, task) => {
        if (err) {
          console.error('Tasks error:', err.message);
        return res.status(500).json({ error: 'Błąd serwera' });
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
  const { task_type, description, due_date, priority, completed, time_of_day } = req.body;

  db.get(
    'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    (err, task) => {
      if (err) {
        console.error('Tasks error:', err.message);
        return res.status(500).json({ error: 'Błąd serwera' });
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
      if (time_of_day !== undefined) {
        if (time_of_day !== null && !['morning', 'evening'].includes(time_of_day)) {
          return res.status(400).json({ error: 'Nieprawidłowy time_of_day' });
        }
        updates.push('time_of_day = ?');
        params.push(time_of_day);
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
            console.error('Tasks error:', err.message);
        return res.status(500).json({ error: 'Błąd serwera' });
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

          db.get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err, updated) => {
            if (err) {
              console.error('Tasks error:', err.message);
        return res.status(500).json({ error: 'Błąd serwera' });
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
        console.error('Tasks error:', err.message);
        return res.status(500).json({ error: 'Błąd serwera' });
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
            console.error('Tasks error:', err.message);
        return res.status(500).json({ error: 'Błąd serwera' });
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

          // Jeśli to zadanie cykliczne lub pochodzi z cyklicznego, utwórz następne
          const handleRecurring = () => {
            // Znajdź parent task (recurring template)
            const parentId = task.parent_task_id || (task.is_recurring ? task.id : null);

            if (!parentId) {
              // To nie jest recurring task, zwróć normalne response
              db.get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err, updatedTask) => {
                if (err) {
                  console.error('Tasks error:', err.message);
        return res.status(500).json({ error: 'Błąd serwera' });
                }
                res.json(updatedTask);
              });
              return;
            }

            // Pobierz parent task (recurring template)
            db.get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [parentId, req.user.id], (err, parentTask) => {
              if (err || !parentTask || !parentTask.is_recurring) {
                // Brak parent lub nie jest recurring, zwróć normalne response
                db.get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err, updatedTask) => {
                  if (err) {
                    console.error('Tasks error:', err.message);
        return res.status(500).json({ error: 'Błąd serwera' });
                  }
                  res.json(updatedTask);
                });
                return;
              }

              // Sprawdź czy nie przekroczyliśmy recurrence_end_date
              if (parentTask.recurrence_end_date) {
                const endDate = new Date(parentTask.recurrence_end_date);
                if (new Date() >= endDate) {
                  console.log('Recurring task ended (past recurrence_end_date)');
                  db.get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err, updatedTask) => {
                    if (err) {
                      console.error('Tasks error:', err.message);
        return res.status(500).json({ error: 'Błąd serwera' });
                    }
                    res.json(updatedTask);
                  });
                  return;
                }
              }

              // Oblicz due_date dla następnego zadania od oryginalnej due_date (zachowaj regularność)
              const lastDueDate = new Date(task.due_date || Date.now());
              lastDueDate.setDate(lastDueDate.getDate() + parentTask.recurrence_frequency);
              const nextDueDate = lastDueDate.toISOString().split('T')[0];

              // Utwórz następne zadanie
              db.run(
                `INSERT INTO tasks (
                  user_id, task_type, description, due_date, priority, bed_id,
                  parent_task_id, auto_generated
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
                [
                  req.user.id,
                  parentTask.task_type,
                  parentTask.description,
                  nextDueDate,
                  parentTask.priority || 1,
                  parentTask.bed_id || null,
                  parentId
                ],
                function (insertErr) {
                  if (insertErr) {
                    console.error('Błąd tworzenia następnego recurring task:', insertErr);
                  } else {
                    console.log(`✅ Utworzono następne recurring task (ID: ${this.lastID}) na ${nextDueDate}`);
                  }

                  // Aktualizuj next_occurrence w parent task
                  db.run(
                    'UPDATE tasks SET next_occurrence = ? WHERE id = ?',
                    [nextDueDate, parentId],
                    (updateErr) => {
                      if (updateErr) {
                        console.error('Błąd aktualizacji next_occurrence:', updateErr);
                      }
                    }
                  );

                  // Zwróć ukończone zadanie
                  db.get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err, updatedTask) => {
                    if (err) {
                      console.error('Tasks error:', err.message);
        return res.status(500).json({ error: 'Błąd serwera' });
                    }
                    res.json(updatedTask);
                  });
                }
              );
            });
          };

          handleRecurring();
        }
      );
    }
  );
});

/**
 * POST /api/tasks/:id/dismiss
 * Odrzuć auto-generated zadanie (nie pokazuj więcej przez 14 dni)
 */
router.post('/:id/dismiss', auth, (req, res) => {
  // Sprawdź czy zadanie jest auto-generated
  db.get(
    'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    (err, task) => {
      if (err) {
        console.error('Tasks error:', err.message);
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      if (!task) {
        return res.status(404).json({ error: 'Zadanie nie znalezione' });
      }
      if (!task.auto_generated) {
        return res.status(400).json({ error: 'Tylko auto-generated zadania mogą być dismissed' });
      }

      // Ustaw dismissed_at na teraz
      db.run(
        'UPDATE tasks SET dismissed_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id],
        function (err) {
          if (err) {
            console.error('Tasks error:', err.message);
        return res.status(500).json({ error: 'Błąd serwera' });
          }
          res.json({ message: 'Zadanie dismissed - nie pojawi się przez 14 dni' });
        }
      );
    }
  );
});

/**
 * POST /api/tasks/:id/snooze
 * Przesuń auto-generated zadanie na później
 */
router.post('/:id/snooze', auth, (req, res) => {
  const { days } = req.body; // 1, 3, 7 dni

  if (!days || ![1, 3, 7].includes(parseInt(days))) {
    return res.status(400).json({ error: 'days musi być: 1, 3 lub 7' });
  }

  // Sprawdź czy zadanie jest auto-generated
  db.get(
    'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    (err, task) => {
      if (err) {
        console.error('Tasks error:', err.message);
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      if (!task) {
        return res.status(404).json({ error: 'Zadanie nie znalezione' });
      }
      if (!task.auto_generated) {
        return res.status(400).json({ error: 'Tylko auto-generated zadania mogą być snoozed' });
      }

      // Oblicz snoozed_until (teraz + X dni)
      const snoozeDate = new Date();
      snoozeDate.setDate(snoozeDate.getDate() + parseInt(days));

      db.run(
        'UPDATE tasks SET snoozed_until = ? WHERE id = ? AND user_id = ?',
        [snoozeDate.toISOString(), req.params.id, req.user.id],
        function (err) {
          if (err) {
            console.error('Tasks error:', err.message);
        return res.status(500).json({ error: 'Błąd serwera' });
          }
          res.json({
            message: `Zadanie przesunięte o ${days} dni`,
            snoozed_until: snoozeDate.toISOString()
          });
        }
      );
    }
  );
});

/**
 * DELETE /api/tasks/:id
 * Usuń zadanie (dla ręcznych zadań) lub dismiss (dla auto-generated)
 */
router.delete('/:id', auth, (req, res) => {
  db.run(
    'DELETE FROM tasks WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    function (err) {
      if (err) {
        console.error('Tasks error:', err.message);
        return res.status(500).json({ error: 'Błąd serwera' });
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
      // Sprawdź czy zadanie już nie istnieje (nieukończone) lub zostało dismissed/snoozed
      const existing = await new Promise((resolve, reject) => {
        db.get(
          `SELECT id, dismissed_at, snoozed_until FROM tasks
           WHERE user_id = ? AND task_type = 'spray' AND bed_id = ? AND completed = 0`,
          [req.user.id, reminder.bed_id],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      // Pomiń jeśli zadanie istnieje i:
      // 1. Jest dismissed (w ostatnich 14 dniach)
      // 2. Jest snoozed (snoozed_until > teraz)
      if (existing) {
        if (existing.dismissed_at) {
          const dismissedDate = new Date(existing.dismissed_at);
          const daysSinceDismissed = (Date.now() - dismissedDate) / (1000 * 60 * 60 * 24);
          if (daysSinceDismissed < 14) {
            continue; // Pomiń - dismissed < 14 dni temu
          }
        }
        if (existing.snoozed_until) {
          const snoozeDate = new Date(existing.snoozed_until);
          if (snoozeDate > new Date()) {
            continue; // Pomiń - wciąż snoozed
          }
        }
      }

      if (!existing) {
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO tasks (user_id, task_type, description, due_date, priority, bed_id, auto_generated)
             VALUES (?, 'spray', ?, ?, 3, ?, 1)`,
            [
              req.user.id,
              `Wykonaj oprysk ${reminder.plant_name} - ${reminder.spray_name}`,
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
          `SELECT id, dismissed_at, snoozed_until FROM tasks
           WHERE user_id = ? AND task_type = 'harvest' AND bed_id = ? AND completed = 0`,
          [req.user.id, bed.id],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      // Pomiń jeśli dismissed lub snoozed
      if (existing) {
        if (existing.dismissed_at) {
          const dismissedDate = new Date(existing.dismissed_at);
          const daysSinceDismissed = (Date.now() - dismissedDate) / (1000 * 60 * 60 * 24);
          if (daysSinceDismissed < 14) continue;
        }
        if (existing.snoozed_until) {
          const snoozeDate = new Date(existing.snoozed_until);
          if (snoozeDate > new Date()) continue;
        }
      }

      if (!existing) {
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO tasks (user_id, task_type, description, due_date, priority, bed_id, auto_generated)
             VALUES (?, 'harvest', ?, ?, 2, ?, 1)`,
            [
              req.user.id,
              `Zbierz ${bed.plant_name} (posadzona ${daysPlanted} dni temu)`,
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
          `SELECT id, dismissed_at, snoozed_until FROM tasks
           WHERE user_id = ? AND task_type = 'water' AND bed_id = ? AND completed = 0`,
          [req.user.id, bed.id],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      // Pomiń jeśli dismissed lub snoozed
      if (existing) {
        if (existing.dismissed_at) {
          const dismissedDate = new Date(existing.dismissed_at);
          const daysSinceDismissed = (Date.now() - dismissedDate) / (1000 * 60 * 60 * 24);
          if (daysSinceDismissed < 14) continue;
        }
        if (existing.snoozed_until) {
          const snoozeDate = new Date(existing.snoozed_until);
          if (snoozeDate > new Date()) continue;
        }
      }

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
            `INSERT INTO tasks (user_id, task_type, description, due_date, priority, bed_id, auto_generated)
             VALUES (?, 'water', ?, ?, ?, ?, 1)`,
            [
              req.user.id,
              `Podlej ${bed.plant_name} (ostatnio: ${daysAgo})`,
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

/**
 * PUT /api/tasks/reorder
 * Reorder tasks (drag & drop) - updates priority based on new order
 */
router.put('/reorder', auth, (req, res) => {
  const { tasks } = req.body; // Array of {id, priority}

  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ error: 'Nieprawidłowe dane' });
  }

  // Update each task's priority
  const updatePromises = tasks.map(task => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE tasks SET priority = ?
         WHERE id = ? AND user_id = ?`,
        [task.priority, task.id, req.user.id],
        function (err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  });

  Promise.all(updatePromises)
    .then(() => {
      res.json({ message: 'Kolejność zadań zaktualizowana' });
    })
    .catch(err => {
      console.error('Reorder tasks error:', err);
      res.status(500).json({ error: 'Błąd podczas zmiany kolejności' });
    });
});

/**
 * GET /api/tasks/recurring
 * Pobierz wszystkie recurring tasks (szablony) użytkownika
 */
router.get('/recurring', auth, (req, res) => {
  db.all(
    `SELECT * FROM tasks
     WHERE user_id = ? AND is_recurring = 1
     ORDER BY created_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        console.error('Tasks error:', err.message);
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      res.json(rows);
    }
  );
});

/**
 * PUT /api/tasks/:id/recurring
 * Zaktualizuj recurring task (szablon)
 */
router.put('/:id/recurring', auth, (req, res) => {
  const { recurrence_frequency, recurrence_times, recurrence_end_date } = req.body;

  db.get(
    'SELECT * FROM tasks WHERE id = ? AND user_id = ? AND is_recurring = 1',
    [req.params.id, req.user.id],
    (err, task) => {
      if (err) {
        console.error('Tasks error:', err.message);
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      if (!task) {
        return res.status(404).json({ error: 'Recurring task nie znaleziony' });
      }

      const updates = [];
      const params = [];

      if (recurrence_frequency !== undefined) {
        if (recurrence_frequency < 1) {
          return res.status(400).json({ error: 'recurrence_frequency musi być >= 1' });
        }
        updates.push('recurrence_frequency = ?');
        params.push(recurrence_frequency);

        // Przelicz next_occurrence
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + recurrence_frequency);
        updates.push('next_occurrence = ?');
        params.push(nextDate.toISOString().split('T')[0]);
      }

      if (recurrence_times !== undefined) {
        try {
          const validTimes = ['anytime', 'morning', 'afternoon', 'evening'];
          const times = JSON.parse(recurrence_times);
          if (!Array.isArray(times) || !times.every(t => validTimes.includes(t))) {
            return res.status(400).json({ error: 'Nieprawidłowe recurrence_times' });
          }
          updates.push('recurrence_times = ?');
          params.push(recurrence_times);
        } catch (parseError) {
          return res.status(400).json({ error: 'Nieprawidłowy format recurrence_times (wymagany JSON array)' });
        }
      }

      if (recurrence_end_date !== undefined) {
        updates.push('recurrence_end_date = ?');
        params.push(recurrence_end_date);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'Brak danych do aktualizacji' });
      }

      params.push(req.params.id);
      params.push(req.user.id);

      db.run(
        `UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
        params,
        function (err) {
          if (err) {
            console.error('Tasks error:', err.message);
        return res.status(500).json({ error: 'Błąd serwera' });
          }

          db.get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err, updated) => {
            if (err) {
              console.error('Tasks error:', err.message);
        return res.status(500).json({ error: 'Błąd serwera' });
            }
            res.json(updated);
          });
        }
      );
    }
  );
});

/**
 * DELETE /api/tasks/:id/recurring
 * Usuń recurring task (szablon) + wszystkie przyszłe instancje
 */
router.delete('/:id/recurring', auth, (req, res) => {
  db.get(
    'SELECT * FROM tasks WHERE id = ? AND user_id = ? AND is_recurring = 1',
    [req.params.id, req.user.id],
    (err, task) => {
      if (err) {
        console.error('Tasks error:', err.message);
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      if (!task) {
        return res.status(404).json({ error: 'Recurring task nie znaleziony' });
      }

      // Usuń wszystkie nieukończone zadania potomne
      db.run(
        'DELETE FROM tasks WHERE parent_task_id = ? AND completed = 0',
        [req.params.id],
        (deleteChildrenErr) => {
          if (deleteChildrenErr) {
            console.error('Błąd usuwania zadań potomnych:', deleteChildrenErr);
          }

          // Usuń recurring template
          db.run(
            'DELETE FROM tasks WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id],
            function (err) {
              if (err) {
                console.error('Tasks error:', err.message);
        return res.status(500).json({ error: 'Błąd serwera' });
              }
              res.json({ message: 'Recurring task i przyszłe instancje usunięte' });
            }
          );
        }
      );
    }
  );
});

// ==========================================
// GARDEN PLAN TASK ENDPOINTS
// ==========================================

/**
 * PUT /api/tasks/:id/update-plan-date
 * Zmień datę zadania z planu - opcjonalnie wszystkich zadań z tego planu
 */
router.put('/:id/update-plan-date', auth, (req, res) => {
  const { due_date, update_all } = req.body;

  if (!due_date) {
    return res.status(400).json({ error: 'due_date jest wymagane' });
  }

  db.get(
    'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    (err, task) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      if (!task) {
        return res.status(404).json({ error: 'Zadanie nie znalezione' });
      }

      if (update_all && task.garden_plan_id) {
        // Update all tasks from this plan
        db.run(
          'UPDATE tasks SET due_date = ? WHERE garden_plan_id = ? AND user_id = ? AND completed = 0',
          [due_date, task.garden_plan_id, req.user.id],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Błąd serwera' });
            }
            // Also update planned_planting_date in garden_plans
            db.run(
              'UPDATE garden_plans SET planned_planting_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
              [due_date, task.garden_plan_id]
            );
            res.json({ message: `Zmieniono datę ${this.changes} zadań`, updated_count: this.changes });
          }
        );
      } else {
        // Update only this task
        db.run(
          'UPDATE tasks SET due_date = ? WHERE id = ? AND user_id = ?',
          [due_date, req.params.id, req.user.id],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Błąd serwera' });
            }
            res.json({ message: 'Data zadania zmieniona' });
          }
        );
      }
    }
  );
});

/**
 * GET /api/tasks/:id/plan-items
 * Pobierz rośliny z planu powiązanego z zadaniem
 */
router.get('/:id/plan-items', auth, (req, res) => {
  db.get(
    'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    (err, task) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      if (!task) {
        return res.status(404).json({ error: 'Zadanie nie znalezione' });
      }
      if (!task.garden_plan_id) {
        return res.status(400).json({ error: 'Zadanie nie pochodzi z planu' });
      }

      db.all(
        `SELECT gpi.*, pl.display_name, t.id as task_id, t.completed as task_completed
         FROM garden_plan_items gpi
         LEFT JOIN plants pl ON gpi.plant_id = pl.id
         LEFT JOIN tasks t ON gpi.task_id = t.id
         WHERE gpi.plan_id = ?
         ORDER BY gpi.id`,
        [task.garden_plan_id],
        (err, items) => {
          if (err) {
            return res.status(500).json({ error: 'Błąd serwera' });
          }

          db.get('SELECT * FROM garden_plans WHERE id = ?', [task.garden_plan_id], (err, plan) => {
            if (err) {
              return res.status(500).json({ error: 'Błąd serwera' });
            }
            res.json({ plan, items: items || [] });
          });
        }
      );
    }
  );
});

/**
 * POST /api/tasks/:id/complete-planting
 * Oznacz wybrane rośliny jako posadzone i utwórz grządki
 */
router.post('/:id/complete-planting', auth, (req, res) => {
  const { planted_items } = req.body; // Array of garden_plan_item IDs to mark as planted

  if (!planted_items || !Array.isArray(planted_items) || planted_items.length === 0) {
    return res.status(400).json({ error: 'Wybierz przynajmniej jedną roślinę' });
  }

  db.get(
    'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    (err, task) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      if (!task) {
        return res.status(404).json({ error: 'Zadanie nie znalezione' });
      }
      if (!task.garden_plan_id) {
        return res.status(400).json({ error: 'Zadanie nie pochodzi z planu' });
      }

      // Get plan
      db.get('SELECT * FROM garden_plans WHERE id = ?', [task.garden_plan_id], (err, plan) => {
        if (err || !plan) {
          return res.status(500).json({ error: 'Błąd serwera' });
        }

        // Get items to plant
        db.all(
          `SELECT * FROM garden_plan_items WHERE plan_id = ? AND id IN (${planted_items.map(() => '?').join(',')})`,
          [task.garden_plan_id, ...planted_items],
          (err, items) => {
            if (err) {
              return res.status(500).json({ error: 'Błąd serwera' });
            }

            const now = new Date().toISOString();
            const today = now.split('T')[0];
            const bedPromises = [];

            items.forEach(item => {
              // Mark item as planted
              db.run(
                'UPDATE garden_plan_items SET planted_at = ? WHERE id = ?',
                [now, item.id]
              );

              // Complete the associated task
              if (item.task_id) {
                db.run(
                  'UPDATE tasks SET completed = 1, completed_at = ? WHERE id = ? AND user_id = ?',
                  [now, item.task_id, req.user.id]
                );
              }

              // Create bed if plan has a plot
              if (plan.plot_id) {
                bedPromises.push(new Promise((resolve, reject) => {
                  db.run(
                    `INSERT INTO beds (plot_id, row_number, plant_name, planted_date, note)
                     VALUES (?, ?, ?, ?, ?)`,
                    [
                      plan.plot_id,
                      item.row_number || 1,
                      item.plant_name,
                      today,
                      `Z planu: ${plan.name}. ${item.notes || ''}`
                    ],
                    function(err) {
                      if (err) reject(err);
                      else resolve(this.lastID);
                    }
                  );
                }));
              }
            });

            Promise.all(bedPromises)
              .then(bedIds => {
                // Check if all items in the plan are now planted
                db.get(
                  'SELECT COUNT(*) as total, SUM(CASE WHEN planted_at IS NOT NULL THEN 1 ELSE 0 END) as planted FROM garden_plan_items WHERE plan_id = ?',
                  [task.garden_plan_id],
                  (err, counts) => {
                    if (!err && counts && counts.total === counts.planted) {
                      // All planted - update plan status
                      db.run(
                        `UPDATE garden_plans SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                        [task.garden_plan_id]
                      );
                      // Complete remaining tasks from this plan
                      db.run(
                        'UPDATE tasks SET completed = 1, completed_at = ? WHERE garden_plan_id = ? AND user_id = ? AND completed = 0',
                        [now, task.garden_plan_id, req.user.id]
                      );
                    }

                    res.json({
                      message: `Posadzono ${items.length} roślin`,
                      planted_count: items.length,
                      bed_ids: bedIds,
                      all_planted: counts ? counts.total === counts.planted : false
                    });
                  }
                );
              })
              .catch(err => {
                console.error('Error creating beds:', err);
                res.status(500).json({ error: 'Błąd tworzenia grządek' });
              });
          }
        );
      });
    }
  );
});

module.exports = router;
