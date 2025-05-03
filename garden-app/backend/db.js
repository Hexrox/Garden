
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('garden.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS plots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    image_path TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS beds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plot_id INTEGER,
    row_number INTEGER,
    plant_name TEXT,
    note TEXT,
    spray_name TEXT,
    spray_date TEXT,
    withdrawal_period INTEGER,
    image_path TEXT,
    FOREIGN KEY(plot_id) REFERENCES plots(id)
  )`);
});

module.exports = db;
