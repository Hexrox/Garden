const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('garden.db');

db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Plots table (updated with user relationship)
  db.run(`CREATE TABLE IF NOT EXISTS plots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    image_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  // Beds/Rows table (updated)
  db.run(`CREATE TABLE IF NOT EXISTS beds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plot_id INTEGER NOT NULL,
    row_number INTEGER NOT NULL,
    plant_name TEXT,
    plant_variety TEXT,
    planted_date TEXT,
    note TEXT,
    image_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(plot_id) REFERENCES plots(id) ON DELETE CASCADE
  )`);

  // Spray history table (new - separated from beds for better tracking)
  db.run(`CREATE TABLE IF NOT EXISTS spray_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bed_id INTEGER NOT NULL,
    spray_name TEXT NOT NULL,
    spray_type TEXT,
    spray_date DATE NOT NULL,
    withdrawal_period INTEGER NOT NULL,
    safe_harvest_date DATE NOT NULL,
    dosage TEXT,
    weather_conditions TEXT,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(bed_id) REFERENCES beds(id) ON DELETE CASCADE
  )`);

  // Reminders table (new - for active reminders)
  db.run(`CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    spray_id INTEGER NOT NULL,
    bed_id INTEGER NOT NULL,
    reminder_date DATE NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(spray_id) REFERENCES spray_history(id) ON DELETE CASCADE,
    FOREIGN KEY(bed_id) REFERENCES beds(id) ON DELETE CASCADE
  )`);

  console.log('✅ Database tables created successfully');
});

module.exports = db;
