const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Helper function to convert to CSV
function convertToCSV(data, headers) {
  if (data.length === 0) return '';

  const csvRows = [];
  csvRows.push(headers.join(','));

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header.toLowerCase().replace(/ /g, '_')] || '';
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

// Export all plots to JSON
router.get('/export/plots/json', auth, (req, res) => {
  db.all(
    `SELECT * FROM plots WHERE user_id = ? ORDER BY created_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=plots_${Date.now()}.json`);
      res.json(rows);
    }
  );
});

// Export all plots to CSV
router.get('/export/plots/csv', auth, (req, res) => {
  db.all(
    `SELECT id, name, description, created_at FROM plots WHERE user_id = ? ORDER BY created_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }

      const headers = ['ID', 'Name', 'Description', 'Created At'];
      const csv = convertToCSV(rows, headers);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=plots_${Date.now()}.csv`);
      res.send('\ufeff' + csv); // UTF-8 BOM for Excel compatibility
    }
  );
});

// Export spray history to JSON
router.get('/export/sprays/json', auth, (req, res) => {
  db.all(
    `SELECT sh.*, b.plant_name, b.row_number, p.name as plot_name
     FROM spray_history sh
     JOIN beds b ON sh.bed_id = b.id
     JOIN plots p ON b.plot_id = p.id
     WHERE p.user_id = ?
     ORDER BY sh.spray_date DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=spray_history_${Date.now()}.json`);
      res.json(rows);
    }
  );
});

// Export spray history to CSV
router.get('/export/sprays/csv', auth, (req, res) => {
  db.all(
    `SELECT sh.id, p.name as plot_name, b.row_number, b.plant_name,
            sh.spray_name, sh.spray_type, sh.spray_date, sh.withdrawal_period,
            sh.safe_harvest_date, sh.dosage, sh.note
     FROM spray_history sh
     JOIN beds b ON sh.bed_id = b.id
     JOIN plots p ON b.plot_id = p.id
     WHERE p.user_id = ?
     ORDER BY sh.spray_date DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }

      const headers = [
        'ID',
        'Plot Name',
        'Row Number',
        'Plant Name',
        'Spray Name',
        'Spray Type',
        'Spray Date',
        'Withdrawal Period',
        'Safe Harvest Date',
        'Dosage',
        'Note'
      ];
      const csv = convertToCSV(rows, headers);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=spray_history_${Date.now()}.csv`);
      res.send('\ufeff' + csv); // UTF-8 BOM for Excel compatibility
    }
  );
});

// Export complete garden data (everything) to JSON
router.get('/export/complete/json', auth, (req, res) => {
  const exportData = {
    exported_at: new Date().toISOString(),
    user_id: req.user.id,
    plots: [],
    beds: [],
    spray_history: []
  };

  db.all('SELECT * FROM plots WHERE user_id = ? ORDER BY created_at DESC', [req.user.id], (err, plots) => {
    if (err) {
      return res.status(500).json({ error: 'Błąd serwera' });
    }
    exportData.plots = plots;

    db.all(
      `SELECT b.* FROM beds b
       JOIN plots p ON b.plot_id = p.id
       WHERE p.user_id = ?
       ORDER BY b.plot_id, b.row_number`,
      [req.user.id],
      (err, beds) => {
        if (err) {
          return res.status(500).json({ error: 'Błąd serwera' });
        }
        exportData.beds = beds;

        db.all(
          `SELECT sh.* FROM spray_history sh
           JOIN beds b ON sh.bed_id = b.id
           JOIN plots p ON b.plot_id = p.id
           WHERE p.user_id = ?
           ORDER BY sh.spray_date DESC`,
          [req.user.id],
          (err, sprays) => {
            if (err) {
              return res.status(500).json({ error: 'Błąd serwera' });
            }
            exportData.spray_history = sprays;

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=garden_complete_${Date.now()}.json`);
            res.json(exportData);
          }
        );
      }
    );
  });
});

// Export planned actions to iCal format
router.get('/export/ical', auth, (req, res) => {
  // Get all planned actions for user
  db.all(
    `SELECT pa.*, p.display_name as plant_display_name, p.name as plant_name,
            b.plant_name as bed_plant_name, b.row_number, pl.name as plot_name
     FROM planned_actions pa
     LEFT JOIN plants p ON pa.plant_id = p.id
     LEFT JOIN beds b ON pa.bed_id = b.id
     LEFT JOIN plots pl ON pa.plot_id = pl.id
     WHERE pa.user_id = ? AND pa.status IN ('planned', 'reminded')
     ORDER BY pa.planned_date ASC`,
    [req.user.id],
    (err, actions) => {
      if (err) {
        console.error('Error fetching planned actions:', err);
        return res.status(500).json({ error: 'Błąd serwera' });
      }

      // Generate iCal content
      const now = new Date();
      const icalEvents = [];

      // iCal header
      icalEvents.push('BEGIN:VCALENDAR');
      icalEvents.push('VERSION:2.0');
      icalEvents.push('PRODID:-//GardenApp//Planer//PL');
      icalEvents.push('CALSCALE:GREGORIAN');
      icalEvents.push('METHOD:PUBLISH');
      icalEvents.push('X-WR-CALNAME:GardenApp - Planer ogrodniczy');
      icalEvents.push('X-WR-TIMEZONE:Europe/Warsaw');

      // Action type translations
      const actionTypeNames = {
        'plant': 'Posadzić',
        'spray': 'Oprysk',
        'water': 'Podlać',
        'harvest': 'Zebrać',
        'transplant': 'Przesadzić',
        'fertilize': 'Nawozić',
        'prune': 'Przyciąć',
        'custom': 'Inne'
      };

      actions.forEach((action, index) => {
        const uid = `gardenapp-${action.id}-${now.getTime()}@gardenapp.pl`;
        const date = new Date(action.planned_date);

        // Format date for iCal (YYYYMMDD for all-day events)
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayStr = nextDay.toISOString().split('T')[0].replace(/-/g, '');

        // Build summary
        const actionTypeName = actionTypeNames[action.action_type] || action.action_type;
        let summary = action.title || `${actionTypeName}`;
        if (action.plant_display_name || action.plant_name) {
          summary = `${actionTypeName}: ${action.plant_display_name || action.plant_name}`;
        }

        // Build description
        let description = '';
        if (action.notes) description += action.notes + '\\n';
        if (action.plot_name) description += `Poletko: ${action.plot_name}\\n`;
        if (action.bed_plant_name) description += `Grządka: ${action.bed_plant_name} (rząd ${action.row_number})\\n`;
        description += '\\nWygenerowano przez GardenApp';

        // Escape special characters for iCal
        summary = summary.replace(/[,;\\]/g, '\\$&');
        description = description.replace(/[,;\\]/g, '\\$&');

        icalEvents.push('BEGIN:VEVENT');
        icalEvents.push(`UID:${uid}`);
        icalEvents.push(`DTSTAMP:${now.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
        icalEvents.push(`DTSTART;VALUE=DATE:${dateStr}`);
        icalEvents.push(`DTEND;VALUE=DATE:${nextDayStr}`);
        icalEvents.push(`SUMMARY:${summary}`);
        icalEvents.push(`DESCRIPTION:${description}`);
        icalEvents.push('TRANSP:TRANSPARENT');
        icalEvents.push('STATUS:CONFIRMED');

        // Add alarm if reminder_days is set
        if (action.reminder_days && action.reminder_days > 0) {
          icalEvents.push('BEGIN:VALARM');
          icalEvents.push('ACTION:DISPLAY');
          icalEvents.push(`DESCRIPTION:${summary} - przypomnienie`);
          icalEvents.push(`TRIGGER:-P${action.reminder_days}D`);
          icalEvents.push('END:VALARM');
        }

        icalEvents.push('END:VEVENT');
      });

      icalEvents.push('END:VCALENDAR');

      const icalContent = icalEvents.join('\r\n');

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=gardenapp_planer.ics');
      res.send(icalContent);
    }
  );
});

// Export tasks to iCal format
router.get('/export/tasks/ical', auth, (req, res) => {
  db.all(
    `SELECT t.*, b.plant_name, b.row_number, p.name as plot_name
     FROM tasks t
     LEFT JOIN beds b ON t.bed_id = b.id
     LEFT JOIN plots p ON b.plot_id = p.id
     WHERE t.user_id = ? AND t.completed = 0
     ORDER BY t.due_date ASC`,
    [req.user.id],
    (err, tasks) => {
      if (err) {
        console.error('Error fetching tasks:', err);
        return res.status(500).json({ error: 'Błąd serwera' });
      }

      const now = new Date();
      const icalEvents = [];

      icalEvents.push('BEGIN:VCALENDAR');
      icalEvents.push('VERSION:2.0');
      icalEvents.push('PRODID:-//GardenApp//Zadania//PL');
      icalEvents.push('CALSCALE:GREGORIAN');
      icalEvents.push('METHOD:PUBLISH');
      icalEvents.push('X-WR-CALNAME:GardenApp - Zadania');
      icalEvents.push('X-WR-TIMEZONE:Europe/Warsaw');

      tasks.forEach((task) => {
        if (!task.due_date) return;

        const uid = `gardenapp-task-${task.id}-${now.getTime()}@gardenapp.pl`;
        const date = new Date(task.due_date);
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayStr = nextDay.toISOString().split('T')[0].replace(/-/g, '');

        let summary = task.description || 'Zadanie';
        let description = '';
        if (task.plant_name) description += `Roślina: ${task.plant_name}\\n`;
        if (task.plot_name) description += `Poletko: ${task.plot_name}\\n`;
        if (task.row_number) description += `Rząd: ${task.row_number}\\n`;
        description += '\\nWygenerowano przez GardenApp';

        summary = summary.replace(/[,;\\]/g, '\\$&');
        description = description.replace(/[,;\\]/g, '\\$&');

        icalEvents.push('BEGIN:VEVENT');
        icalEvents.push(`UID:${uid}`);
        icalEvents.push(`DTSTAMP:${now.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
        icalEvents.push(`DTSTART;VALUE=DATE:${dateStr}`);
        icalEvents.push(`DTEND;VALUE=DATE:${nextDayStr}`);
        icalEvents.push(`SUMMARY:${summary}`);
        icalEvents.push(`DESCRIPTION:${description}`);
        icalEvents.push('TRANSP:TRANSPARENT');
        icalEvents.push('STATUS:CONFIRMED');
        icalEvents.push('END:VEVENT');
      });

      icalEvents.push('END:VCALENDAR');

      const icalContent = icalEvents.join('\r\n');

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=gardenapp_zadania.ics');
      res.send(icalContent);
    }
  );
});

module.exports = router;
