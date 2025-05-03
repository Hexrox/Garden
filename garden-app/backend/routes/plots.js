
const express = require('express');
const router = express.Router();
const db = require('../db');

// Przykład pobrania poletek
router.get('/plots', (req, res) => {
  db.all('SELECT * FROM plots', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;
