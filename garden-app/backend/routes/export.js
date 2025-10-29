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

module.exports = router;
