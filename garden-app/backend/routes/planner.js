const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');

/**
 * GARDEN PLANNER API
 * Zarządzanie planowanymi działaniami w ogrodzie
 */

// Typy akcji i ich właściwości
const ACTION_TYPES = {
  plant: { label: 'Posadzić', icon: '🌱', requiresPlant: true, weatherCheck: 'frost' },
  spray: { label: 'Oprysk', icon: '🧴', requiresPlant: false, weatherCheck: 'rain' },
  water: { label: 'Podlać', icon: '💧', requiresPlant: false, weatherCheck: 'rain' },
  harvest: { label: 'Zebrać', icon: '🥕', requiresPlant: true, weatherCheck: null },
  transplant: { label: 'Przesadzić', icon: '🔄', requiresPlant: true, weatherCheck: 'frost' },
  fertilize: { label: 'Nawozić', icon: '🧪', requiresPlant: false, weatherCheck: 'rain' },
  prune: { label: 'Przyciąć', icon: '✂️', requiresPlant: false, weatherCheck: null },
  // Nowe typy dla modułów pielęgnacji kwiatów
  dig_up: { label: 'Wykopać', icon: '⛏️', requiresPlant: true, weatherCheck: 'frost' },
  protect: { label: 'Zabezpieczyć', icon: '❄️', requiresPlant: true, weatherCheck: 'frost' },
  propagate: { label: 'Podzielić', icon: '🌿', requiresPlant: true, weatherCheck: null },
  deadhead: { label: 'Usunąć przekwitłe', icon: '🥀', requiresPlant: false, weatherCheck: null },
  custom: { label: 'Inne', icon: '📝', requiresPlant: false, weatherCheck: null }
};

/**
 * GET /api/planner
 * Pobierz wszystkie plany użytkownika z filtrami
 */
router.get('/', auth, (req, res) => {
  const { status, action_type, month, year, plot_id } = req.query;

  let query = `
    SELECT
      pa.*,
      p.name as plant_name,
      p.display_name as plant_display_name,
      b.row_number as bed_row,
      b.plant_name as bed_plant_name,
      pl.name as plot_name
    FROM planned_actions pa
    LEFT JOIN plants p ON pa.plant_id = p.id
    LEFT JOIN beds b ON pa.bed_id = b.id
    LEFT JOIN plots pl ON pa.plot_id = pl.id
    WHERE pa.user_id = ?
  `;
  const params = [req.user.id];

  if (status) {
    query += ' AND pa.status = ?';
    params.push(status);
  }

  if (action_type) {
    query += ' AND pa.action_type = ?';
    params.push(action_type);
  }

  if (month && year) {
    query += ` AND strftime('%m', pa.planned_date) = ? AND strftime('%Y', pa.planned_date) = ?`;
    params.push(month.padStart(2, '0'), year);
  } else if (year) {
    query += ` AND strftime('%Y', pa.planned_date) = ?`;
    params.push(year);
  }

  if (plot_id) {
    query += ' AND pa.plot_id = ?';
    params.push(plot_id);
  }

  query += ' ORDER BY pa.planned_date ASC, pa.created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Błąd pobierania planów:', err);
      return res.status(500).json({ error: 'Błąd pobierania planów' });
    }

    // Dodaj informacje o typie akcji
    const enrichedRows = rows.map(row => ({
      ...row,
      action_info: ACTION_TYPES[row.action_type] || ACTION_TYPES.custom
    }));

    res.json(enrichedRows);
  });
});

/**
 * GET /api/planner/upcoming
 * Pobierz nadchodzące plany (na dashboard)
 */
router.get('/upcoming', auth, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const limit = parseInt(req.query.limit) || 5;

  db.all(
    `SELECT
      pa.*,
      p.name as plant_name,
      p.display_name as plant_display_name,
      pl.name as plot_name
    FROM planned_actions pa
    LEFT JOIN plants p ON pa.plant_id = p.id
    LEFT JOIN plots pl ON pa.plot_id = pl.id
    WHERE pa.user_id = ?
      AND pa.status IN ('planned', 'reminded')
      AND pa.planned_date >= ?
    ORDER BY pa.planned_date ASC
    LIMIT ?`,
    [req.user.id, today, limit],
    (err, rows) => {
      if (err) {
        console.error('Błąd pobierania nadchodzących planów:', err);
        return res.status(500).json({ error: 'Błąd pobierania planów' });
      }

      const enrichedRows = rows.map(row => ({
        ...row,
        action_info: ACTION_TYPES[row.action_type] || ACTION_TYPES.custom,
        days_until: Math.ceil((new Date(row.planned_date) - new Date(today)) / (1000 * 60 * 60 * 24))
      }));

      res.json(enrichedRows);
    }
  );
});

/**
 * GET /api/planner/reminders
 * Pobierz plany wymagające przypomnienia (termin zbliża się)
 */
router.get('/reminders', auth, (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  db.all(
    `SELECT
      pa.*,
      p.name as plant_name,
      p.display_name as plant_display_name,
      pl.name as plot_name
    FROM planned_actions pa
    LEFT JOIN plants p ON pa.plant_id = p.id
    LEFT JOIN plots pl ON pa.plot_id = pl.id
    WHERE pa.user_id = ?
      AND pa.status = 'planned'
      AND date(pa.planned_date, '-' || pa.reminder_days || ' days') <= ?
      AND pa.planned_date >= ?
    ORDER BY pa.planned_date ASC`,
    [req.user.id, today, today],
    (err, rows) => {
      if (err) {
        console.error('Błąd pobierania przypomnień:', err);
        return res.status(500).json({ error: 'Błąd pobierania przypomnień' });
      }

      const enrichedRows = rows.map(row => ({
        ...row,
        action_info: ACTION_TYPES[row.action_type] || ACTION_TYPES.custom,
        days_until: Math.ceil((new Date(row.planned_date) - new Date(today)) / (1000 * 60 * 60 * 24))
      }));

      res.json(enrichedRows);
    }
  );
});

/**
 * GET /api/planner/action-types
 * Pobierz listę dostępnych typów akcji
 */
router.get('/action-types', auth, (req, res) => {
  res.json(ACTION_TYPES);
});

/**
 * GET /api/planner/:id
 * Pobierz szczegóły pojedynczego planu
 */
router.get('/:id', auth, (req, res) => {
  db.get(
    `SELECT
      pa.*,
      p.name as plant_name,
      p.display_name as plant_display_name,
      b.row_number as bed_row,
      b.plant_name as bed_plant_name,
      pl.name as plot_name
    FROM planned_actions pa
    LEFT JOIN plants p ON pa.plant_id = p.id
    LEFT JOIN beds b ON pa.bed_id = b.id
    LEFT JOIN plots pl ON pa.plot_id = pl.id
    WHERE pa.id = ? AND pa.user_id = ?`,
    [req.params.id, req.user.id],
    (err, row) => {
      if (err) {
        console.error('Błąd pobierania planu:', err);
        return res.status(500).json({ error: 'Błąd pobierania planu' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Plan nie znaleziony' });
      }

      row.action_info = ACTION_TYPES[row.action_type] || ACTION_TYPES.custom;
      res.json(row);
    }
  );
});

/**
 * POST /api/planner
 * Utwórz nowy plan
 */
router.post('/', auth, (req, res) => {
  const {
    action_type,
    title,
    planned_date,
    plant_id,
    bed_id,
    plot_id,
    reminder_days,
    notes,
    weather_dependent,
    is_recurring,
    recurrence_interval,
    recurrence_unit,
    recurrence_end_date
  } = req.body;

  // Walidacja
  if (!action_type || !ACTION_TYPES[action_type]) {
    return res.status(400).json({ error: 'Nieprawidłowy typ akcji' });
  }

  if (!title || title.trim().length === 0) {
    return res.status(400).json({ error: 'Tytuł jest wymagany' });
  }

  if (!planned_date) {
    return res.status(400).json({ error: 'Data planowana jest wymagana' });
  }

  // Walidacja powtarzalności
  if (is_recurring) {
    if (!recurrence_interval || recurrence_interval < 1) {
      return res.status(400).json({ error: 'Interwał powtarzania musi być >= 1' });
    }
    if (!['days', 'weeks', 'months'].includes(recurrence_unit)) {
      return res.status(400).json({ error: 'Nieprawidłowa jednostka powtarzania' });
    }
  }

  db.run(
    `INSERT INTO planned_actions (
      user_id, action_type, title, planned_date, plant_id, bed_id, plot_id,
      reminder_days, notes, weather_dependent, is_recurring,
      recurrence_interval, recurrence_unit, recurrence_end_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.user.id,
      action_type,
      title.trim(),
      planned_date,
      plant_id || null,
      bed_id || null,
      plot_id || null,
      reminder_days ?? 3,
      notes || null,
      weather_dependent ? 1 : 0,
      is_recurring ? 1 : 0,
      recurrence_interval || null,
      recurrence_unit || null,
      recurrence_end_date || null
    ],
    function (err) {
      if (err) {
        console.error('Błąd tworzenia planu:', err);
        return res.status(500).json({ error: 'Błąd tworzenia planu' });
      }

      db.get(
        `SELECT pa.*, p.name as plant_name, pl.name as plot_name
         FROM planned_actions pa
         LEFT JOIN plants p ON pa.plant_id = p.id
         LEFT JOIN plots pl ON pa.plot_id = pl.id
         WHERE pa.id = ?`,
        [this.lastID],
        (err, plan) => {
          if (err) {
            return res.status(500).json({ error: 'Błąd pobierania utworzonego planu' });
          }
          plan.action_info = ACTION_TYPES[plan.action_type] || ACTION_TYPES.custom;
          res.status(201).json(plan);
        }
      );
    }
  );
});

/**
 * PUT /api/planner/:id
 * Zaktualizuj plan
 */
router.put('/:id', auth, (req, res) => {
  const {
    action_type,
    title,
    planned_date,
    plant_id,
    bed_id,
    plot_id,
    reminder_days,
    notes,
    weather_dependent,
    status,
    is_recurring,
    recurrence_interval,
    recurrence_unit,
    recurrence_end_date
  } = req.body;

  // Sprawdź czy plan istnieje
  db.get(
    'SELECT * FROM planned_actions WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    (err, plan) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd sprawdzania planu' });
      }
      if (!plan) {
        return res.status(404).json({ error: 'Plan nie znaleziony' });
      }

      const updates = [];
      const params = [];

      if (action_type !== undefined && ACTION_TYPES[action_type]) {
        updates.push('action_type = ?');
        params.push(action_type);
      }
      if (title !== undefined) {
        updates.push('title = ?');
        params.push(title.trim());
      }
      if (planned_date !== undefined) {
        updates.push('planned_date = ?');
        params.push(planned_date);
      }
      if (plant_id !== undefined) {
        updates.push('plant_id = ?');
        params.push(plant_id || null);
      }
      if (bed_id !== undefined) {
        updates.push('bed_id = ?');
        params.push(bed_id || null);
      }
      if (plot_id !== undefined) {
        updates.push('plot_id = ?');
        params.push(plot_id || null);
      }
      if (reminder_days !== undefined) {
        updates.push('reminder_days = ?');
        params.push(reminder_days);
      }
      if (notes !== undefined) {
        updates.push('notes = ?');
        params.push(notes || null);
      }
      if (weather_dependent !== undefined) {
        updates.push('weather_dependent = ?');
        params.push(weather_dependent ? 1 : 0);
      }
      if (status !== undefined) {
        updates.push('status = ?');
        params.push(status);
      }
      if (is_recurring !== undefined) {
        updates.push('is_recurring = ?');
        params.push(is_recurring ? 1 : 0);
      }
      if (recurrence_interval !== undefined) {
        updates.push('recurrence_interval = ?');
        params.push(recurrence_interval || null);
      }
      if (recurrence_unit !== undefined) {
        updates.push('recurrence_unit = ?');
        params.push(recurrence_unit || null);
      }
      if (recurrence_end_date !== undefined) {
        updates.push('recurrence_end_date = ?');
        params.push(recurrence_end_date || null);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'Brak danych do aktualizacji' });
      }

      params.push(req.params.id, req.user.id);

      db.run(
        `UPDATE planned_actions SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
        params,
        function (err) {
          if (err) {
            console.error('Błąd aktualizacji planu:', err);
            return res.status(500).json({ error: 'Błąd aktualizacji planu' });
          }

          db.get(
            `SELECT pa.*, p.name as plant_name, pl.name as plot_name
             FROM planned_actions pa
             LEFT JOIN plants p ON pa.plant_id = p.id
             LEFT JOIN plots pl ON pa.plot_id = pl.id
             WHERE pa.id = ?`,
            [req.params.id],
            (err, updated) => {
              if (err) {
                return res.status(500).json({ error: 'Błąd pobierania zaktualizowanego planu' });
              }
              updated.action_info = ACTION_TYPES[updated.action_type] || ACTION_TYPES.custom;
              res.json(updated);
            }
          );
        }
      );
    }
  );
});

/**
 * POST /api/planner/:id/complete
 * Oznacz plan jako wykonany
 */
router.post('/:id/complete', auth, (req, res) => {
  const { add_to_history, bed_id, row_number, plant_variety, note } = req.body;

  db.get(
    `SELECT pa.*, p.name as plant_name, p.display_name as plant_display_name
     FROM planned_actions pa
     LEFT JOIN plants p ON pa.plant_id = p.id
     WHERE pa.id = ? AND pa.user_id = ?`,
    [req.params.id, req.user.id],
    (err, plan) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd sprawdzania planu' });
      }
      if (!plan) {
        return res.status(404).json({ error: 'Plan nie znaleziony' });
      }

      const completedDate = new Date().toISOString().split('T')[0];

      // Dla typu 'plant' z add_to_history sprawdź dostępność rzędu
      if (plan.action_type === 'plant' && add_to_history && plan.plot_id) {
        // Pobierz wszystkie zajęte rzędy
        db.all(
          'SELECT row_number FROM beds WHERE plot_id = ?',
          [plan.plot_id],
          (err, existingBeds) => {
            if (err) {
              console.error('Błąd pobierania grządek:', err);
              return res.status(500).json({ error: 'Błąd sprawdzania grządek' });
            }

            const occupiedRows = existingBeds.map(b => b.row_number);
            let targetRow = row_number;

            // Jeśli użytkownik podał numer rzędu, sprawdź czy wolny
            if (targetRow) {
              if (occupiedRows.includes(parseInt(targetRow))) {
                return res.status(400).json({
                  error: `Rząd ${targetRow} jest już zajęty`,
                  occupied_rows: occupiedRows,
                  suggestion: findFirstFreeRow(occupiedRows)
                });
              }
            } else {
              // Znajdź pierwszy wolny rząd
              targetRow = findFirstFreeRow(occupiedRows);
            }

            // Kontynuuj z oznaczaniem jako wykonany i tworzeniem grządki
            completeAndAddBed(plan, completedDate, targetRow, plant_variety, note, res);
          }
        );
      } else {
        // Standardowa logika dla innych typów
        completeStandard(plan, completedDate, add_to_history, bed_id, res);
      }
    }
  );

  // Funkcja pomocnicza: znajdź pierwszy wolny rząd
  function findFirstFreeRow(occupiedRows) {
    let row = 1;
    while (occupiedRows.includes(row)) {
      row++;
    }
    return row;
  }

  // Funkcja: oznacz jako wykonany i dodaj grządkę (dla plant)
  function completeAndAddBed(plan, completedDate, targetRow, plant_variety, note, res) {
    db.run(
      `UPDATE planned_actions
       SET status = 'completed', completed_date = ?
       WHERE id = ?`,
      [completedDate, plan.id],
      function (err) {
        if (err) {
          console.error('Błąd oznaczania jako wykonany:', err);
          return res.status(500).json({ error: 'Błąd oznaczania jako wykonany' });
        }

        // Jeśli to powtarzający się plan, utwórz następny
        let nextPlanCreated = false;
        if (plan.is_recurring && plan.recurrence_interval && plan.recurrence_unit) {
          createNextRecurringPlan(plan, completedDate, plan.user_id);
          nextPlanCreated = true;
        }

        // Nazwa rośliny - preferuj display_name, potem name, potem tytuł planu
        const plantName = plan.plant_display_name || plan.plant_name || plan.title;

        // Utwórz grządkę
        db.run(
          `INSERT INTO beds (plot_id, row_number, plant_name, plant_variety, planted_date, note)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [plan.plot_id, targetRow, plantName, plant_variety || null, completedDate, note || plan.notes],
          function (err) {
            if (err) {
              console.error('Błąd tworzenia grządki:', err);
              return res.json({
                message: 'Plan oznaczony jako wykonany, ale nie udało się utworzyć grządki',
                completed_date: completedDate,
                next_plan_created: nextPlanCreated,
                bed_error: err.message
              });
            }

            console.log(`✅ Utworzono grządkę (ID: ${this.lastID}) w rzędzie ${targetRow} dla "${plantName}"`);
            res.json({
              message: 'Plan wykonany, grządka utworzona',
              completed_date: completedDate,
              next_plan_created: nextPlanCreated,
              bed_created: {
                id: this.lastID,
                row_number: targetRow,
                plant_name: plantName
              }
            });
          }
        );
      }
    );
  }

  // Funkcja: standardowe oznaczenie jako wykonany (dla innych typów)
  function completeStandard(plan, completedDate, add_to_history, bed_id, res) {
    db.run(
      `UPDATE planned_actions
       SET status = 'completed', completed_date = ?
       WHERE id = ?`,
      [completedDate, plan.id],
      function (err) {
        if (err) {
          console.error('Błąd oznaczania jako wykonany:', err);
          return res.status(500).json({ error: 'Błąd oznaczania jako wykonany' });
        }

        // Jeśli to powtarzający się plan, utwórz następny
        if (plan.is_recurring && plan.recurrence_interval && plan.recurrence_unit) {
          createNextRecurringPlan(plan, completedDate, plan.user_id);
        }

        // Opcjonalnie: dodaj do historii (opryski, grządki)
        if (add_to_history) {
          handleAddToHistory(plan, plan.user_id, bed_id);
        }

        res.json({
          message: 'Plan oznaczony jako wykonany',
          completed_date: completedDate,
          next_plan_created: plan.is_recurring
        });
      }
    );
  }
});

/**
 * POST /api/planner/:id/reschedule
 * Przesuń datę planu
 */
router.post('/:id/reschedule', auth, (req, res) => {
  const { new_date, reason } = req.body;

  if (!new_date) {
    return res.status(400).json({ error: 'Nowa data jest wymagana' });
  }

  db.get(
    'SELECT * FROM planned_actions WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    (err, plan) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd sprawdzania planu' });
      }
      if (!plan) {
        return res.status(404).json({ error: 'Plan nie znaleziony' });
      }

      const updatedNotes = reason
        ? `${plan.notes || ''}\n[${new Date().toLocaleDateString('pl-PL')}] Przesunięto z ${plan.planned_date}: ${reason}`.trim()
        : plan.notes;

      db.run(
        `UPDATE planned_actions
         SET planned_date = ?, notes = ?, status = 'planned'
         WHERE id = ?`,
        [new_date, updatedNotes, req.params.id],
        function (err) {
          if (err) {
            console.error('Błąd przesuwania planu:', err);
            return res.status(500).json({ error: 'Błąd przesuwania planu' });
          }

          res.json({
            message: 'Plan przesunięty',
            old_date: plan.planned_date,
            new_date: new_date
          });
        }
      );
    }
  );
});

/**
 * POST /api/planner/:id/cancel
 * Anuluj plan
 */
router.post('/:id/cancel', auth, (req, res) => {
  db.run(
    `UPDATE planned_actions
     SET status = 'cancelled'
     WHERE id = ? AND user_id = ?`,
    [req.params.id, req.user.id],
    function (err) {
      if (err) {
        console.error('Błąd anulowania planu:', err);
        return res.status(500).json({ error: 'Błąd anulowania planu' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Plan nie znaleziony' });
      }
      res.json({ message: 'Plan anulowany' });
    }
  );
});

/**
 * DELETE /api/planner/:id
 * Usuń plan
 */
router.delete('/:id', auth, (req, res) => {
  db.run(
    'DELETE FROM planned_actions WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    function (err) {
      if (err) {
        console.error('Błąd usuwania planu:', err);
        return res.status(500).json({ error: 'Błąd usuwania planu' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Plan nie znaleziony' });
      }
      res.json({ message: 'Plan usunięty' });
    }
  );
});

/**
 * GET /api/planner/calendar/:year/:month
 * Pobierz plany dla kalendarza
 */
router.get('/calendar/:year/:month', auth, (req, res) => {
  const { year, month } = req.params;
  const startDate = `${year}-${month.padStart(2, '0')}-01`;
  const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];

  db.all(
    `SELECT
      pa.*,
      p.name as plant_name,
      pl.name as plot_name
    FROM planned_actions pa
    LEFT JOIN plants p ON pa.plant_id = p.id
    LEFT JOIN plots pl ON pa.plot_id = pl.id
    WHERE pa.user_id = ?
      AND pa.planned_date >= ?
      AND pa.planned_date <= ?
      AND pa.status NOT IN ('cancelled')
    ORDER BY pa.planned_date ASC`,
    [req.user.id, startDate, endDate],
    (err, rows) => {
      if (err) {
        console.error('Błąd pobierania planów dla kalendarza:', err);
        return res.status(500).json({ error: 'Błąd pobierania planów' });
      }

      const enrichedRows = rows.map(row => ({
        ...row,
        action_info: ACTION_TYPES[row.action_type] || ACTION_TYPES.custom,
        event_type: 'planned_action',
        color: '#f97316' // Pomarańczowy dla planów
      }));

      res.json(enrichedRows);
    }
  );
});

/**
 * Funkcja pomocnicza: tworzenie następnego planu cyklicznego
 */
function createNextRecurringPlan(plan, completedDate, userId) {
  // Oblicz następną datę
  const nextDate = new Date(plan.planned_date);
  const interval = plan.recurrence_interval;

  switch (plan.recurrence_unit) {
    case 'days':
      nextDate.setDate(nextDate.getDate() + interval);
      break;
    case 'weeks':
      nextDate.setDate(nextDate.getDate() + (interval * 7));
      break;
    case 'months':
      nextDate.setMonth(nextDate.getMonth() + interval);
      break;
  }

  const nextDateStr = nextDate.toISOString().split('T')[0];

  // Sprawdź czy nie przekroczyliśmy daty końcowej
  if (plan.recurrence_end_date && nextDateStr > plan.recurrence_end_date) {
    console.log(`Plan cykliczny ${plan.id} zakończony - przekroczono datę końcową`);
    return;
  }

  // Utwórz nowy plan
  db.run(
    `INSERT INTO planned_actions (
      user_id, action_type, title, planned_date, plant_id, bed_id, plot_id,
      reminder_days, notes, weather_dependent, is_recurring,
      recurrence_interval, recurrence_unit, recurrence_end_date, parent_plan_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      plan.action_type,
      plan.title,
      nextDateStr,
      plan.plant_id,
      plan.bed_id,
      plan.plot_id,
      plan.reminder_days,
      plan.notes,
      plan.weather_dependent,
      plan.is_recurring,
      plan.recurrence_interval,
      plan.recurrence_unit,
      plan.recurrence_end_date,
      plan.parent_plan_id || plan.id
    ],
    function (err) {
      if (err) {
        console.error('Błąd tworzenia następnego planu cyklicznego:', err);
      } else {
        console.log(`✅ Utworzono następny plan cykliczny (ID: ${this.lastID}) na ${nextDateStr}`);
      }
    }
  );
}

/**
 * Funkcja pomocnicza: dodawanie do historii po wykonaniu
 */
function handleAddToHistory(plan, userId, bedId) {
  const targetBedId = bedId || plan.bed_id;

  switch (plan.action_type) {
    case 'spray':
      // Dodaj do spray_history
      if (targetBedId) {
        db.run(
          `INSERT INTO spray_history (bed_id, spray_name, spray_date, withdrawal_period, safe_harvest_date, note)
           VALUES (?, ?, ?, 0, ?, ?)`,
          [targetBedId, plan.title, plan.completed_date || new Date().toISOString().split('T')[0],
           plan.completed_date || new Date().toISOString().split('T')[0], plan.notes],
          (err) => {
            if (err) console.error('Błąd dodawania do spray_history:', err);
            else console.log('✅ Dodano oprysk do historii');
          }
        );
      }
      break;

    case 'fertilize':
      // Dodaj do care_history
      if (targetBedId) {
        db.run(
          `INSERT INTO care_history (bed_id, action_type, action_name, action_date, note)
           VALUES (?, 'fertilization', ?, ?, ?)`,
          [targetBedId, plan.title, plan.completed_date || new Date().toISOString().split('T')[0], plan.notes],
          (err) => {
            if (err) console.error('Błąd dodawania do care_history:', err);
            else console.log('✅ Dodano nawożenie do historii');
          }
        );
      }
      break;

    case 'water':
      // Aktualizuj last_watered_date w beds
      if (targetBedId) {
        db.run(
          'UPDATE beds SET last_watered_date = ? WHERE id = ?',
          [plan.completed_date || new Date().toISOString().split('T')[0], targetBedId],
          (err) => {
            if (err) console.error('Błąd aktualizacji last_watered_date:', err);
            else console.log('✅ Zaktualizowano datę podlewania');
          }
        );
      }
      break;

    default:
      // Dla innych typów nie robimy nic specjalnego
      break;
  }
}

module.exports = router;
