const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const { getDaysUntilHarvest, getHarvestStatus } = require('../utils/harvestPredictor');

// Get upcoming harvests for user
router.get('/upcoming', auth, (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const daysAhead = req.query.days ? parseInt(req.query.days) : 30;

  const query = `
    SELECT
      b.*,
      p.name as plot_name,
      p.id as plot_id
    FROM beds b
    JOIN plots p ON b.plot_id = p.id
    WHERE p.user_id = ?
      AND b.expected_harvest_date IS NOT NULL
      AND b.actual_harvest_date IS NULL
      AND b.expected_harvest_date <= date('now', '+' || ? || ' days')
    ORDER BY b.expected_harvest_date ASC
    LIMIT ?
  `;

  db.all(query, [req.user.id, daysAhead, limit], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Błąd serwera' });
    }

    // Add calculated fields
    const harvests = rows.map(bed => {
      const daysUntil = getDaysUntilHarvest(bed.expected_harvest_date);
      const status = getHarvestStatus(bed.expected_harvest_date, bed.actual_harvest_date);

      return {
        ...bed,
        days_until_harvest: daysUntil,
        harvest_status: status
      };
    });

    res.json(harvests);
  });
});

// Get harvest statistics for user
router.get('/stats', auth, (req, res) => {
  const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();

  const queries = {
    // Total harvests this year
    totalHarvests: `
      SELECT COUNT(*) as count
      FROM beds b
      JOIN plots p ON b.plot_id = p.id
      WHERE p.user_id = ?
        AND b.actual_harvest_date IS NOT NULL
        AND strftime('%Y', b.actual_harvest_date) = ?
    `,
    // Total yield
    totalYield: `
      SELECT
        SUM(b.yield_amount) as total,
        b.yield_unit
      FROM beds b
      JOIN plots p ON b.plot_id = p.id
      WHERE p.user_id = ?
        AND b.actual_harvest_date IS NOT NULL
        AND b.yield_amount IS NOT NULL
        AND strftime('%Y', b.actual_harvest_date) = ?
      GROUP BY b.yield_unit
    `,
    // Harvests by plant
    byPlant: `
      SELECT
        b.plant_name,
        COUNT(*) as count,
        SUM(b.yield_amount) as total_yield,
        b.yield_unit
      FROM beds b
      JOIN plots p ON b.plot_id = p.id
      WHERE p.user_id = ?
        AND b.actual_harvest_date IS NOT NULL
        AND strftime('%Y', b.actual_harvest_date) = ?
      GROUP BY b.plant_name, b.yield_unit
      ORDER BY count DESC
    `,
    // Harvests by month
    byMonth: `
      SELECT
        strftime('%m', b.actual_harvest_date) as month,
        COUNT(*) as count
      FROM beds b
      JOIN plots p ON b.plot_id = p.id
      WHERE p.user_id = ?
        AND b.actual_harvest_date IS NOT NULL
        AND strftime('%Y', b.actual_harvest_date) = ?
      GROUP BY month
      ORDER BY month
    `
  };

  const stats = {};

  // Total harvests
  db.get(queries.totalHarvests, [req.user.id, year.toString()], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Błąd serwera' });
    }
    stats.totalHarvests = row.count;

    // Total yield
    db.all(queries.totalYield, [req.user.id, year.toString()], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      stats.totalYield = rows;

      // By plant
      db.all(queries.byPlant, [req.user.id, year.toString()], (err, rows) => {
        if (err) {
          return res.status(500).json({ error: 'Błąd serwera' });
        }
        stats.byPlant = rows;

        // By month
        db.all(queries.byMonth, [req.user.id, year.toString()], (err, rows) => {
          if (err) {
            return res.status(500).json({ error: 'Błąd serwera' });
          }
          stats.byMonth = rows;

          res.json(stats);
        });
      });
    });
  });
});

// Get all harvested beds
router.get('/history', auth, (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 50;
  const offset = req.query.offset ? parseInt(req.query.offset) : 0;

  const query = `
    SELECT
      b.*,
      p.name as plot_name,
      p.id as plot_id
    FROM beds b
    JOIN plots p ON b.plot_id = p.id
    WHERE p.user_id = ?
      AND b.actual_harvest_date IS NOT NULL
    ORDER BY b.actual_harvest_date DESC
    LIMIT ? OFFSET ?
  `;

  db.all(query, [req.user.id, limit, offset], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Błąd serwera' });
    }

    res.json(rows);
  });
});

module.exports = router;
