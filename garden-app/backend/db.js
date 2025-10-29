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

  // Tasks table (new - task management)
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    bed_id INTEGER,
    task_type TEXT CHECK(task_type IN ('spray', 'harvest', 'water', 'custom')) NOT NULL,
    description TEXT NOT NULL,
    due_date DATE,
    priority INTEGER DEFAULT 1,
    completed BOOLEAN DEFAULT 0,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(bed_id) REFERENCES beds(id) ON DELETE CASCADE
  )`);

  // Plants library table (custom + default plants)
  db.run(`CREATE TABLE IF NOT EXISTS plants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    display_name TEXT,
    days_to_harvest INTEGER NOT NULL,
    range_min INTEGER,
    range_max INTEGER,
    notes TEXT,
    is_custom BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  // Plant photos table
  db.run(`CREATE TABLE IF NOT EXISTS plant_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bed_id INTEGER NOT NULL,
    photo_path TEXT NOT NULL,
    caption TEXT,
    taken_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(bed_id) REFERENCES beds(id) ON DELETE CASCADE
  )`);

  // Succession planting reminders table
  db.run(`CREATE TABLE IF NOT EXISTS succession_reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    bed_id INTEGER,
    plant_name TEXT NOT NULL,
    interval_days INTEGER NOT NULL,
    last_planted_date DATE,
    next_planting_date DATE,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(bed_id) REFERENCES beds(id) ON DELETE SET NULL
  )`);

  // Add location columns to users table (for weather)
  db.run(`ALTER TABLE users ADD COLUMN latitude REAL`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding latitude column:', err.message);
    }
  });

  db.run(`ALTER TABLE users ADD COLUMN longitude REAL`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding longitude column:', err.message);
    }
  });

  db.run(`ALTER TABLE users ADD COLUMN city TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding city column:', err.message);
    }
  });

  // Add harvest prediction columns to beds table
  db.run(`ALTER TABLE beds ADD COLUMN expected_harvest_date DATE`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding expected_harvest_date column:', err.message);
    }
  });

  db.run(`ALTER TABLE beds ADD COLUMN actual_harvest_date DATE`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding actual_harvest_date column:', err.message);
    }
  });

  db.run(`ALTER TABLE beds ADD COLUMN yield_amount REAL`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding yield_amount column:', err.message);
    }
  });

  db.run(`ALTER TABLE beds ADD COLUMN yield_unit TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding yield_unit column:', err.message);
    }
  });

  db.run(`ALTER TABLE beds ADD COLUMN notes TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding notes column:', err.message);
    }
  });

  // Add dark_mode preference to users table
  db.run(`ALTER TABLE users ADD COLUMN dark_mode BOOLEAN DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding dark_mode column:', err.message);
    }
  });

  // Create indexes for better query performance
  db.run('CREATE INDEX IF NOT EXISTS idx_plots_user_id ON plots(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_beds_plot_id ON beds(plot_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_spray_bed_id ON spray_history(bed_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_reminders_spray_id ON reminders(spray_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_spray_date ON spray_history(spray_date)');
  db.run('CREATE INDEX IF NOT EXISTS idx_safe_harvest_date ON spray_history(safe_harvest_date)');
  db.run('CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)');
  db.run('CREATE INDEX IF NOT EXISTS idx_plants_user_id ON plants(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_plants_name ON plants(name)');
  db.run('CREATE INDEX IF NOT EXISTS idx_plant_photos_bed_id ON plant_photos(bed_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_succession_user_id ON succession_reminders(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_succession_next_date ON succession_reminders(next_planting_date)');

  console.log('✅ Database tables and indexes created successfully');
});

module.exports = db;
