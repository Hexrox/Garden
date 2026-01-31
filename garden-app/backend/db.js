const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('garden.db');

// CRITICAL: Enable foreign keys for CASCADE DELETE to work
db.run('PRAGMA foreign_keys = ON;');

db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
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

  // Add columns for flower properties if they don't exist
  db.run(`ALTER TABLE plants ADD COLUMN category TEXT`, (err) => {
    // Ignore if column already exists
  });
  db.run(`ALTER TABLE plants ADD COLUMN flower_color TEXT`, (err) => {});
  db.run(`ALTER TABLE plants ADD COLUMN bloom_season TEXT`, (err) => {});
  db.run(`ALTER TABLE plants ADD COLUMN height TEXT`, (err) => {});
  db.run(`ALTER TABLE plants ADD COLUMN sun_requirement TEXT`, (err) => {});
  db.run(`ALTER TABLE plants ADD COLUMN is_perennial BOOLEAN DEFAULT 0`, (err) => {});
  db.run(`ALTER TABLE plants ADD COLUMN planting_time TEXT`, (err) => {});
  db.run(`ALTER TABLE plants ADD COLUMN storage_requirement TEXT`, (err) => {});

  // Add columns for latin names and extended info
  db.run(`ALTER TABLE plants ADD COLUMN latin_name TEXT`, (err) => {});
  db.run(`ALTER TABLE plants ADD COLUMN common_names TEXT`, (err) => {});

  // Add columns for fertilization needs
  db.run(`ALTER TABLE plants ADD COLUMN npk_needs TEXT`, (err) => {});
  db.run(`ALTER TABLE plants ADD COLUMN npk_ratio_recommended TEXT`, (err) => {});
  db.run(`ALTER TABLE plants ADD COLUMN fertilization_frequency TEXT`, (err) => {});
  db.run(`ALTER TABLE plants ADD COLUMN organic_fertilizer TEXT`, (err) => {});
  db.run(`ALTER TABLE plants ADD COLUMN mineral_fertilizer TEXT`, (err) => {});

  // Add columns for soil requirements
  db.run(`ALTER TABLE plants ADD COLUMN soil_ph TEXT`, (err) => {});
  db.run(`ALTER TABLE plants ADD COLUMN soil_type TEXT`, (err) => {});
  db.run(`ALTER TABLE plants ADD COLUMN water_needs TEXT`, (err) => {});

  // Add columns for companion planting
  db.run(`ALTER TABLE plants ADD COLUMN companion_plants TEXT`, (err) => {});
  db.run(`ALTER TABLE plants ADD COLUMN avoid_plants TEXT`, (err) => {});

  // Add columns for care requirements
  db.run(`ALTER TABLE plants ADD COLUMN pruning_needs TEXT`, (err) => {});
  db.run(`ALTER TABLE plants ADD COLUMN winter_care TEXT`, (err) => {});
  db.run(`ALTER TABLE plants ADD COLUMN propagation_method TEXT`, (err) => {});

  // Hardiness zone for cold tolerance (e.g., "6a", "7b")
  db.run(`ALTER TABLE plants ADD COLUMN hardiness_zone TEXT`, (err) => {});

  // ==========================================
  // COMMUNITY PLANT MODERATION SYSTEM
  // ==========================================

  // Status: pending (awaiting moderation), approved, rejected
  db.run(`ALTER TABLE plants ADD COLUMN status TEXT DEFAULT 'approved'`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding status column:', err.message);
    }
  });

  // Who contributed this plant (user_id of contributor)
  db.run(`ALTER TABLE plants ADD COLUMN contributor_id INTEGER`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding contributor_id column:', err.message);
    }
  });

  // Admin who reviewed the plant
  db.run(`ALTER TABLE plants ADD COLUMN reviewed_by INTEGER`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding reviewed_by column:', err.message);
    }
  });

  // When was it reviewed
  db.run(`ALTER TABLE plants ADD COLUMN reviewed_at DATETIME`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding reviewed_at column:', err.message);
    }
  });

  // Rejection reason (if rejected)
  db.run(`ALTER TABLE plants ADD COLUMN rejection_reason TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding rejection_reason column:', err.message);
    }
  });

  // Photo author (required when photo is uploaded)
  db.run(`ALTER TABLE plants ADD COLUMN photo_author TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding photo_author column:', err.message);
    }
  });

  // Photo license/source info
  db.run(`ALTER TABLE plants ADD COLUMN photo_license TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding photo_license column:', err.message);
    }
  });

  // Create index for fast status filtering
  db.run('CREATE INDEX IF NOT EXISTS idx_plants_status ON plants(status)');
  db.run('CREATE INDEX IF NOT EXISTS idx_plants_contributor ON plants(contributor_id)');

  // Add columns for frost dates and hardiness zones
  db.run(`ALTER TABLE users ADD COLUMN hardiness_zone TEXT`, (err) => {});
  db.run(`ALTER TABLE users ADD COLUMN first_frost_date TEXT`, (err) => {});
  db.run(`ALTER TABLE users ADD COLUMN last_frost_date TEXT`, (err) => {});
  db.run(`ALTER TABLE users ADD COLUMN location TEXT`, (err) => {});

  // Plant photos table
  db.run(`CREATE TABLE IF NOT EXISTS plant_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bed_id INTEGER,
    photo_path TEXT NOT NULL,
    caption TEXT,
    taken_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(bed_id) REFERENCES beds(id) ON DELETE CASCADE
  )`);

  // Extend plant_photos for unified gallery (preserve context after deletion)
  db.run(`ALTER TABLE plant_photos ADD COLUMN user_id INTEGER`, (err) => {});
  db.run(`ALTER TABLE plant_photos ADD COLUMN source_type TEXT DEFAULT 'progress'`, (err) => {});
  db.run(`ALTER TABLE plant_photos ADD COLUMN bed_row_number INTEGER`, (err) => {});
  db.run(`ALTER TABLE plant_photos ADD COLUMN bed_plant_name TEXT`, (err) => {});
  db.run(`ALTER TABLE plant_photos ADD COLUMN bed_plant_variety TEXT`, (err) => {});
  db.run(`ALTER TABLE plant_photos ADD COLUMN plot_name TEXT`, (err) => {});
  db.run(`ALTER TABLE plant_photos ADD COLUMN tag TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding tag column:', err.message);
    }
  });

  // Add columns for image thumbnails (performance optimization)
  db.run(`ALTER TABLE plant_photos ADD COLUMN thumb_path TEXT`, (err) => {});
  db.run(`ALTER TABLE plant_photos ADD COLUMN medium_path TEXT`, (err) => {});

  // Migrate existing plant_photos data (fill context for existing photos)
  db.run(`
    UPDATE plant_photos
    SET
      user_id = (
        SELECT pl.user_id
        FROM beds b
        JOIN plots pl ON b.plot_id = pl.id
        WHERE b.id = plant_photos.bed_id
      ),
      bed_row_number = (SELECT row_number FROM beds WHERE id = plant_photos.bed_id),
      bed_plant_name = (SELECT plant_name FROM beds WHERE id = plant_photos.bed_id),
      bed_plant_variety = (SELECT plant_variety FROM beds WHERE id = plant_photos.bed_id),
      plot_name = (
        SELECT pl.name
        FROM beds b
        JOIN plots pl ON b.plot_id = pl.id
        WHERE b.id = plant_photos.bed_id
      )
    WHERE bed_id IS NOT NULL AND user_id IS NULL
  `);

  // Trigger before deleting bed - preserve photo context
  db.run(`
    CREATE TRIGGER IF NOT EXISTS preserve_photo_context_before_bed_delete
    BEFORE DELETE ON beds
    FOR EACH ROW
    BEGIN
      UPDATE plant_photos
      SET
        user_id = (SELECT user_id FROM plots WHERE id = OLD.plot_id),
        bed_row_number = OLD.row_number,
        bed_plant_name = OLD.plant_name,
        bed_plant_variety = OLD.plant_variety,
        plot_name = (SELECT name FROM plots WHERE id = OLD.plot_id)
      WHERE bed_id = OLD.id;
    END;
  `);

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

  // Harvest photo and notes (for flower gardens and quality descriptions)
  db.run(`ALTER TABLE beds ADD COLUMN harvest_photo TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding harvest_photo column:', err.message);
    }
  });

  db.run(`ALTER TABLE beds ADD COLUMN harvest_notes TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding harvest_notes column:', err.message);
    }
  });

  // REMOVED: Duplicate 'notes' column - we use 'note' column from the original schema
  // db.run(`ALTER TABLE beds ADD COLUMN notes TEXT`, (err) => {
  //   if (err && !err.message.includes('duplicate column')) {
  //     console.error('Error adding notes column:', err.message);
  //   }
  // });

  // Add dark_mode preference to users table
  db.run(`ALTER TABLE users ADD COLUMN dark_mode BOOLEAN DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding dark_mode column:', err.message);
    }
  });

  // Add last_login to track user activity
  db.run(`ALTER TABLE users ADD COLUMN last_login DATETIME`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding last_login column:', err.message);
    }
  });

  // Add login_count to track number of logins
  db.run(`ALTER TABLE users ADD COLUMN login_count INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding login_count column:', err.message);
    }
  });

  // Add onboarding_completed flag
  db.run(`ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding onboarding_completed column:', err.message);
    }
  });

  // Add onboarding_step to track current step
  db.run(`ALTER TABLE users ADD COLUMN onboarding_step INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding onboarding_step column:', err.message);
    }
  });

  // Add visited_calendar flag for onboarding checklist
  db.run(`ALTER TABLE users ADD COLUMN visited_calendar BOOLEAN DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding visited_calendar column:', err.message);
    }
  });

  // Add welcome_card_dismissed flag for onboarding
  db.run(`ALTER TABLE users ADD COLUMN welcome_card_dismissed BOOLEAN DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding welcome_card_dismissed column:', err.message);
    }
  });

  // Add role column for RBAC
  db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding role column:', err.message);
    } else if (!err) {
      // Set existing admin user to admin role
      db.run(`UPDATE users SET role = 'admin' WHERE username = 'admin'`, (updateErr) => {
        if (updateErr) {
          console.error('Error setting admin role:', updateErr.message);
        } else {
          console.log('✅ Admin role assigned to admin user');
        }
      });
    }
  });

  // Add last_watered_date for smart watering system
  db.run(`ALTER TABLE beds ADD COLUMN last_watered_date DATE`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding last_watered_date column:', err.message);
    }
  });

  // Add auto-generated task management columns
  db.run(`ALTER TABLE tasks ADD COLUMN auto_generated BOOLEAN DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding auto_generated column:', err.message);
    }
  });

  db.run(`ALTER TABLE tasks ADD COLUMN dismissed_at DATETIME`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding dismissed_at column:', err.message);
    }
  });

  db.run(`ALTER TABLE tasks ADD COLUMN snoozed_until DATETIME`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding snoozed_until column:', err.message);
    }
  });

  // Add recurring tasks columns
  db.run(`ALTER TABLE tasks ADD COLUMN is_recurring BOOLEAN DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding is_recurring column:', err.message);
    }
  });

  db.run(`ALTER TABLE tasks ADD COLUMN recurrence_frequency INTEGER`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding recurrence_frequency column:', err.message);
    }
  });

  db.run(`ALTER TABLE tasks ADD COLUMN recurrence_times TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding recurrence_times column:', err.message);
    }
  });

  db.run(`ALTER TABLE tasks ADD COLUMN next_occurrence DATE`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding next_occurrence column:', err.message);
    }
  });

  db.run(`ALTER TABLE tasks ADD COLUMN recurrence_end_date DATE`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding recurrence_end_date column:', err.message);
    }
  });

  db.run(`ALTER TABLE tasks ADD COLUMN parent_task_id INTEGER`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding parent_task_id column:', err.message);
    }
  });

  // Weather history table (for monthly statistics)
  db.run(`CREATE TABLE IF NOT EXISTS weather_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    city TEXT,
    temp_min REAL,
    temp_max REAL,
    temp_avg REAL,
    feels_like_avg REAL,
    humidity_avg INTEGER,
    pressure_avg INTEGER,
    wind_speed_avg REAL,
    wind_speed_max REAL,
    total_rain REAL DEFAULT 0,
    total_snow REAL DEFAULT 0,
    clouds_avg INTEGER,
    description TEXT,
    icon TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, date)
  )`);

  // Create indexes for better query performance
  db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
  db.run('CREATE INDEX IF NOT EXISTS idx_plots_user_id ON plots(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_beds_plot_id ON beds(plot_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_spray_bed_id ON spray_history(bed_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_reminders_spray_id ON reminders(spray_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_spray_date ON spray_history(spray_date)');
  db.run('CREATE INDEX IF NOT EXISTS idx_safe_harvest_date ON spray_history(safe_harvest_date)');
  db.run('CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)');
  db.run('CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)');
  db.run('CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_task_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_tasks_is_recurring ON tasks(is_recurring)');
  db.run('CREATE INDEX IF NOT EXISTS idx_plants_user_id ON plants(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_plants_name ON plants(name)');
  db.run('CREATE INDEX IF NOT EXISTS idx_plant_photos_bed_id ON plant_photos(bed_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_plant_photos_user_id ON plant_photos(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_succession_user_id ON succession_reminders(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_succession_next_date ON succession_reminders(next_planting_date)');
  db.run('CREATE INDEX IF NOT EXISTS idx_weather_history_user_date ON weather_history(user_id, date)');
  db.run('CREATE INDEX IF NOT EXISTS idx_weather_history_date ON weather_history(date)');

  // ==========================================
  // PUBLIC GARDEN PROFILE FEATURE
  // ==========================================

  // Add public profile columns to users table
  db.run(`ALTER TABLE users ADD COLUMN public_username TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding public_username column:', err.message);
    }
  });

  db.run(`ALTER TABLE users ADD COLUMN public_profile_enabled BOOLEAN DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding public_profile_enabled column:', err.message);
    }
  });

  db.run(`ALTER TABLE users ADD COLUMN public_bio TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding public_bio column:', err.message);
    }
  });

  db.run(`ALTER TABLE users ADD COLUMN public_display_name TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding public_display_name column:', err.message);
    }
  });

  db.run(`ALTER TABLE users ADD COLUMN public_cover_photo_id INTEGER`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding public_cover_photo_id column:', err.message);
    }
  });

  db.run(`ALTER TABLE users ADD COLUMN public_show_stats BOOLEAN DEFAULT 1`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding public_show_stats column:', err.message);
    }
  });

  db.run(`ALTER TABLE users ADD COLUMN public_show_timeline BOOLEAN DEFAULT 1`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding public_show_timeline column:', err.message);
    }
  });

  db.run(`ALTER TABLE users ADD COLUMN public_show_gallery BOOLEAN DEFAULT 1`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding public_show_gallery column:', err.message);
    }
  });

  db.run(`ALTER TABLE users ADD COLUMN public_show_badges BOOLEAN DEFAULT 1`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding public_show_badges column:', err.message);
    }
  });

  db.run(`ALTER TABLE users ADD COLUMN social_instagram TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding social_instagram column:', err.message);
    }
  });

  db.run(`ALTER TABLE users ADD COLUMN profile_photo TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding profile_photo column:', err.message);
    }
  });

  // Public gallery photos table (selected photos for public profile)
  db.run(`CREATE TABLE IF NOT EXISTS public_gallery_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    photo_id INTEGER NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(photo_id) REFERENCES plant_photos(id) ON DELETE CASCADE,
    UNIQUE(user_id, photo_id)
  )`);

  // Profile views analytics table
  db.run(`CREATE TABLE IF NOT EXISTS profile_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    referrer TEXT,
    user_agent TEXT
  )`);

  // NOTE: weather_history table already defined above (line 409-430)
  // Duplicate definition removed to avoid schema conflicts

  // Create indexes for public profile feature
  db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_public_username ON users(public_username)');
  db.run('CREATE INDEX IF NOT EXISTS idx_public_gallery_user_id ON public_gallery_photos(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_public_gallery_photo_id ON public_gallery_photos(photo_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_profile_views_username ON profile_views(username)');
  db.run('CREATE INDEX IF NOT EXISTS idx_profile_views_date ON profile_views(viewed_at)');
  db.run('CREATE INDEX IF NOT EXISTS idx_weather_history_date ON weather_history(date)');

  // ==========================================
  // COMPANION PLANTING FEATURE
  // ==========================================

  // Companion plants table (good and bad plant combinations)
  db.run(`CREATE TABLE IF NOT EXISTS companion_plants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plant_name TEXT NOT NULL,
    companion_name TEXT NOT NULL,
    relationship TEXT CHECK(relationship IN ('good', 'bad')) NOT NULL,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create index for fast lookups
  db.run('CREATE INDEX IF NOT EXISTS idx_companion_plant_name ON companion_plants(plant_name)');
  db.run('CREATE INDEX IF NOT EXISTS idx_companion_relationship ON companion_plants(plant_name, relationship)');

  // Populate companion plants data (only if empty)
  db.get('SELECT COUNT(*) as count FROM companion_plants', (err, row) => {
    if (err) {
      console.error('Error checking companion_plants:', err.message);
      return;
    }

    if (row.count === 0) {
      console.log('📗 Populating companion plants database...');

      const companionData = [
        // Pomidor
        { plant: 'pomidor', companion: 'bazylia', relationship: 'good', reason: 'Bazylia odstrasza szkodniki i poprawia smak' },
        { plant: 'pomidor', companion: 'marchew', relationship: 'good', reason: 'Marchew poluzowuje glebę dla korzeni' },
        { plant: 'pomidor', companion: 'cebula', relationship: 'good', reason: 'Cebula odstrasza szkodniki' },
        { plant: 'pomidor', companion: 'sałata', relationship: 'good', reason: 'Sałata zacieniа glebę i zmniejsza parowanie' },
        { plant: 'pomidor', companion: 'kapusta', relationship: 'bad', reason: 'Konkurują o te same składniki odżywcze' },
        { plant: 'pomidor', companion: 'ogórek', relationship: 'bad', reason: 'Ryzyko przeniesienia chorób' },
        { plant: 'pomidor', companion: 'ziemniak', relationship: 'bad', reason: 'Wspólne choroby (zaraza ziemniaka)' },

        // Ogórek
        { plant: 'ogórek', companion: 'fasola', relationship: 'good', reason: 'Fasola wzbogaca glebę w azot' },
        { plant: 'ogórek', companion: 'koper', relationship: 'good', reason: 'Koper przyciąga pożyteczne owady' },
        { plant: 'ogórek', companion: 'rzodkiewka', relationship: 'good', reason: 'Odstrasza szkodniki' },
        { plant: 'ogórek', companion: 'pomidor', relationship: 'bad', reason: 'Ryzyko przeniesienia chorób' },
        { plant: 'ogórek', companion: 'ziemniak', relationship: 'bad', reason: 'Konkurencja o wodę i składniki' },

        // Marchew
        { plant: 'marchew', companion: 'cebula', relationship: 'good', reason: 'Odstrasza muchę marchewkową' },
        { plant: 'marchew', companion: 'pomidor', relationship: 'good', reason: 'Pomidor odstrasza szkodniki marchewki' },
        { plant: 'marchew', companion: 'groszek', relationship: 'good', reason: 'Groszek wzbogaca glebę w azot' },
        { plant: 'marchew', companion: 'koper', relationship: 'bad', reason: 'Konkurencja korzeniowa' },

        // Cebula
        { plant: 'cebula', companion: 'marchew', relationship: 'good', reason: 'Odstrasza muchę cebulową' },
        { plant: 'cebula', companion: 'pomidor', relationship: 'good', reason: 'Pomidor odstrasza szkodniki cebuli' },
        { plant: 'cebula', companion: 'sałata', relationship: 'good', reason: 'Efektywne wykorzystanie przestrzeni' },
        { plant: 'cebula', companion: 'fasola', relationship: 'bad', reason: 'Cebula hamuje wzrost fasoli' },
        { plant: 'cebula', companion: 'groszek', relationship: 'bad', reason: 'Negatywny wpływ na wzrost grochu' },

        // Fasola
        { plant: 'fasola', companion: 'kukurydza', relationship: 'good', reason: 'Kukurydza jest podporą dla fasoli pnącej' },
        { plant: 'fasola', companion: 'dynia', relationship: 'good', reason: 'Tradycyjne "Trzy Siostry"' },
        { plant: 'fasola', companion: 'kapusta', relationship: 'good', reason: 'Fasola dostarcza azot, kapusta go wykorzystuje' },
        { plant: 'fasola', companion: 'cebula', relationship: 'bad', reason: 'Cebula hamuje wzrost fasoli' },
        { plant: 'fasola', companion: 'czosnek', relationship: 'bad', reason: 'Hamuje wzrost fasoli' },

        // Kapusta
        { plant: 'kapusta', companion: 'fasola', relationship: 'good', reason: 'Fasola dostarcza azot' },
        { plant: 'kapusta', companion: 'ogórek', relationship: 'good', reason: 'Dobre sąsiedztwo bez konkurencji' },
        { plant: 'kapusta', companion: 'sałata', relationship: 'good', reason: 'Efektywne wykorzystanie przestrzeni' },
        { plant: 'kapusta', companion: 'pomidor', relationship: 'bad', reason: 'Konkurencja o składniki odżywcze' },
        { plant: 'kapusta', companion: 'truskawka', relationship: 'bad', reason: 'Negatywny wpływ na wzrost' },

        // Ziemniak
        { plant: 'ziemniak', companion: 'fasola', relationship: 'good', reason: 'Fasola odstrasza stonkę' },
        { plant: 'ziemniak', companion: 'kapusta', relationship: 'good', reason: 'Dobre sąsiedztwo' },
        { plant: 'ziemniak', companion: 'pomidor', relationship: 'bad', reason: 'Wspólne choroby (zaraza ziemniaka)' },
        { plant: 'ziemniak', companion: 'ogórek', relationship: 'bad', reason: 'Konkurencja o wodę i składniki' },

        // Papryka
        { plant: 'papryka', companion: 'bazylia', relationship: 'good', reason: 'Bazylia odstrasza szkodniki' },
        { plant: 'papryka', companion: 'cebula', relationship: 'good', reason: 'Cebula odstrasza szkodniki' },
        { plant: 'papryka', companion: 'fasola', relationship: 'bad', reason: 'Konkurencja o składniki odżywcze' },

        // Sałata
        { plant: 'sałata', companion: 'marchew', relationship: 'good', reason: 'Nie konkurują o miejsce' },
        { plant: 'sałata', companion: 'ogórek', relationship: 'good', reason: 'Sałata rośnie szybko, ogórek później' },
        { plant: 'sałata', companion: 'rzodkiewka', relationship: 'good', reason: 'Szybki wzrost, nie przeszkadzają sobie' },
        { plant: 'sałata', companion: 'pietruszka', relationship: 'bad', reason: 'Konkurencja korzeniowa' },

        // Bazylia
        { plant: 'bazylia', companion: 'pomidor', relationship: 'good', reason: 'Poprawia smak i odstrasza szkodniki' },
        { plant: 'bazylia', companion: 'papryka', relationship: 'good', reason: 'Odstrasza szkodniki' },

        // Czosnek
        { plant: 'czosnek', companion: 'pomidor', relationship: 'good', reason: 'Odstrasza szkodniki' },
        { plant: 'czosnek', companion: 'marchew', relationship: 'good', reason: 'Odstrasza szkodniki' },
        { plant: 'czosnek', companion: 'fasola', relationship: 'bad', reason: 'Hamuje wzrost fasoli' },
        { plant: 'czosnek', companion: 'groszek', relationship: 'bad', reason: 'Hamuje wzrost grochu' },

        // Groszek
        { plant: 'groszek', companion: 'marchew', relationship: 'good', reason: 'Groszek wzbogaca glebę w azot' },
        { plant: 'groszek', companion: 'rzodkiewka', relationship: 'good', reason: 'Dobre sąsiedztwo' },
        { plant: 'groszek', companion: 'cebula', relationship: 'bad', reason: 'Cebula hamuje wzrost grochu' },
        { plant: 'groszek', companion: 'czosnek', relationship: 'bad', reason: 'Hamuje wzrost grochu' },

        // Dynia
        { plant: 'dynia', companion: 'kukurydza', relationship: 'good', reason: 'Tradycyjne "Trzy Siostry"' },
        { plant: 'dynia', companion: 'fasola', relationship: 'good', reason: 'Tradycyjne "Trzy Siostry"' },
        { plant: 'dynia', companion: 'ziemniak', relationship: 'bad', reason: 'Konkurencja o miejsce i składniki' },

        // Cukinia
        { plant: 'cukinia', companion: 'fasola', relationship: 'good', reason: 'Fasola wzbogaca glebę w azot' },
        { plant: 'cukinia', companion: 'kukurydza', relationship: 'good', reason: 'Dobry zacień dla gleby' },
        { plant: 'cukinia', companion: 'ziemniak', relationship: 'bad', reason: 'Konkurencja o miejsce' },

        // Rzodkiewka
        { plant: 'rzodkiewka', companion: 'sałata', relationship: 'good', reason: 'Szybki wzrost, nie konkurują' },
        { plant: 'rzodkiewka', companion: 'ogórek', relationship: 'good', reason: 'Odstrasza szkodniki' },
        { plant: 'rzodkiewka', companion: 'groszek', relationship: 'good', reason: 'Dobre sąsiedztwo' },

        // Pietruszka
        { plant: 'pietruszka', companion: 'pomidor', relationship: 'good', reason: 'Odstrasza szkodniki' },
        { plant: 'pietruszka', companion: 'sałata', relationship: 'bad', reason: 'Konkurencja korzeniowa' },

        // Koper
        { plant: 'koper', companion: 'ogórek', relationship: 'good', reason: 'Przyciąga pożyteczne owady' },
        { plant: 'koper', companion: 'kapusta', relationship: 'good', reason: 'Odstrasza szkodniki kapusty' },
        { plant: 'koper', companion: 'marchew', relationship: 'bad', reason: 'Konkurencja korzeniowa' },

        // Kukurydza
        { plant: 'kukurydza', companion: 'fasola', relationship: 'good', reason: 'Tradycyjne "Trzy Siostry"' },
        { plant: 'kukurydza', companion: 'dynia', relationship: 'good', reason: 'Tradycyjne "Trzy Siostry"' },
        { plant: 'kukurydza', companion: 'pomidor', relationship: 'bad', reason: 'Przyciągają te same szkodniki' },

        // Truskawka
        { plant: 'truskawka', companion: 'cebula', relationship: 'good', reason: 'Cebula odstrasza szkodniki' },
        { plant: 'truskawka', companion: 'szpinak', relationship: 'good', reason: 'Szpinak wzbogaca glebę' },
        { plant: 'truskawka', companion: 'kapusta', relationship: 'bad', reason: 'Kapusta hamuje wzrost truskawek' }
      ];

      const stmt = db.prepare(`
        INSERT INTO companion_plants (plant_name, companion_name, relationship, reason)
        VALUES (?, ?, ?, ?)
      `);

      companionData.forEach(data => {
        stmt.run(data.plant, data.companion, data.relationship, data.reason);
      });

      stmt.finalize((err) => {
        if (err) {
          console.error('Error populating companion_plants:', err.message);
        } else {
          console.log(`✅ Added ${companionData.length} companion plant relationships`);
        }
      });
    }
  });

  // ==========================================
  // GARDEN TEMPLATES FEATURE
  // ==========================================

  // Garden templates table
  db.run(`CREATE TABLE IF NOT EXISTS garden_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    size_m2 INTEGER,
    difficulty TEXT CHECK(difficulty IN ('beginner', 'intermediate', 'advanced')),
    category TEXT CHECK(category IN ('balcony', 'small_garden', 'medium_garden', 'large_garden', 'permaculture')),
    image_path TEXT,
    tags TEXT,
    estimated_setup_time TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Template beds table
  db.run(`CREATE TABLE IF NOT EXISTS template_beds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL,
    row_number INTEGER NOT NULL,
    plant_name TEXT NOT NULL,
    plant_variety TEXT,
    note TEXT,
    quantity INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(template_id) REFERENCES garden_templates(id) ON DELETE CASCADE
  )`);

  // Create indexes for garden templates
  db.run('CREATE INDEX IF NOT EXISTS idx_template_beds_template_id ON template_beds(template_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_templates_category ON garden_templates(category)');
  db.run('CREATE INDEX IF NOT EXISTS idx_templates_difficulty ON garden_templates(difficulty)');

  // Populate garden templates (only if empty)
  db.get('SELECT COUNT(*) as count FROM garden_templates', (err, row) => {
    if (err) {
      console.error('Error checking garden_templates:', err.message);
      return;
    }

    if (row.count === 0) {
      console.log('🌿 Populating garden templates...');

      const templates = [
        {
          name: 'Ogródek balkonowy',
          description: 'Idealny zestaw dla uprawy na balkonie. Zioła i pomidory koktajlowe to doskonały start dla miejskich ogrodników!',
          size_m2: 4,
          difficulty: 'beginner',
          category: 'balcony',
          tags: '["vegetables","herbs"]',
          estimated_setup_time: '30 minut'
        },
        {
          name: 'Starter dla początkujących',
          description: 'Pięć najprostszych warzyw do uprawy. Świetny wybór dla osób zaczynających przygodę z ogrodnictwem!',
          size_m2: 10,
          difficulty: 'beginner',
          category: 'small_garden',
          tags: '["vegetables"]',
          estimated_setup_time: '1 godzina'
        },
        {
          name: 'Ogród warzywny',
          description: 'Kompletny ogród warzywny z najpopularniejszymi gatunkami. Zapewni świeże warzywa przez cały sezon!',
          size_m2: 25,
          difficulty: 'intermediate',
          category: 'medium_garden',
          tags: '["vegetables","herbs"]',
          estimated_setup_time: '2-3 godziny'
        },
        {
          name: 'Ogród permakultury',
          description: 'Ekologiczny ogród oparty na zasadach companion planting. Rośliny wspierają się wzajemnie, tworząc zrównoważony ekosystem.',
          size_m2: 50,
          difficulty: 'advanced',
          category: 'large_garden',
          tags: '["vegetables","fruits","herbs","flowers"]',
          estimated_setup_time: '4-5 godzin'
        },
        {
          name: 'Ogród ziołowy',
          description: 'Kolekcja najpopularniejszych ziół kuchennych i leczniczych. Świeże zioła zawsze pod ręką!',
          size_m2: 6,
          difficulty: 'beginner',
          category: 'small_garden',
          tags: '["herbs"]',
          estimated_setup_time: '45 minut'
        }
      ];

      const templateBeds = {
        // Szablon 1: Ogródek balkonowy (5 grządek)
        1: [
          { row: 1, plant: 'pomidor cherry', variety: 'Koktajlowy', note: 'Odmiany koktajlowe, idealne na balkon', qty: 2 },
          { row: 2, plant: 'bazylia', variety: null, note: 'Świeża bazylia do sałatek', qty: 1 },
          { row: 3, plant: 'mięta', variety: null, note: 'Aromatyczna mięta do herbat', qty: 1 },
          { row: 4, plant: 'rukola', variety: null, note: 'Szybko rosnąca rukola', qty: 1 },
          { row: 5, plant: 'rzodkiewka', variety: null, note: 'Najszybsze warzywo - zbiór po 3-4 tygodniach', qty: 1 }
        ],
        // Szablon 2: Starter dla początkujących (5 grządek)
        2: [
          { row: 1, plant: 'pomidor', variety: 'Malinowy', note: 'Najpopularniejsze warzywo w ogrodzie', qty: 1 },
          { row: 2, plant: 'ogórek', variety: 'Zielony długi', note: 'Świeże ogórki przez całe lato', qty: 1 },
          { row: 3, plant: 'sałata', variety: 'Masłowa', note: 'Świeża sałata do kanapek', qty: 1 },
          { row: 4, plant: 'rzodkiewka', variety: null, note: 'Szybki zbiór - idealne dla niecierpliwych', qty: 1 },
          { row: 5, plant: 'cukinia', variety: null, note: 'Obfite plony przez cały sezon', qty: 1 }
        ],
        // Szablon 3: Ogród warzywny (9 grządek)
        3: [
          { row: 1, plant: 'pomidor', variety: 'Malinowy', note: 'Rząd 1 - pomidory wczesne', qty: 1 },
          { row: 2, plant: 'pomidor', variety: 'Oxheart', note: 'Rząd 2 - pomidory późne', qty: 1 },
          { row: 3, plant: 'ogórek', variety: null, note: 'Ogórki gruntowe', qty: 1 },
          { row: 4, plant: 'papryka', variety: 'Californian Wonder', note: 'Słodka papryka', qty: 1 },
          { row: 5, plant: 'sałata', variety: 'Masłowa', note: 'Sałata do siewu sukcesyjnego', qty: 1 },
          { row: 6, plant: 'marchew', variety: 'Nantejska', note: 'Marchew do przechowywania', qty: 1 },
          { row: 7, plant: 'cebula', variety: 'Żółta', note: 'Cebula z sadzonki', qty: 1 },
          { row: 8, plant: 'bazylia', variety: null, note: 'Bazylia - doskonały towarzysz pomidorów', qty: 1 },
          { row: 9, plant: 'pietruszka', variety: 'Naciowa', note: 'Świeża pietruszka przez cały rok', qty: 1 }
        ],
        // Szablon 4: Ogród permakultury (10 grządek)
        4: [
          { row: 1, plant: 'pomidor', variety: null, note: '+ Bazylia (companion planting)', qty: 1 },
          { row: 2, plant: 'ogórek', variety: null, note: '+ Koper (przyciąga pożyteczne owady)', qty: 1 },
          { row: 3, plant: 'marchew', variety: null, note: '+ Cebula (odstrasza muchę marchewkową)', qty: 1 },
          { row: 4, plant: 'fasola', variety: 'Pnąca', note: '+ Kukurydza (fasola pnie się po kukurydzy)', qty: 1 },
          { row: 5, plant: 'dynia', variety: null, note: 'Rozłożyste liście chronią glebę', qty: 1 },
          { row: 6, plant: 'truskawka', variety: null, note: 'Wieloletnia, pokrywa glebę', qty: 1 },
          { row: 7, plant: 'sałata', variety: null, note: 'Szybki wzrost między innymi roślinami', qty: 1 },
          { row: 8, plant: 'kapusta', variety: 'Włoska', note: '+ Fasola (azot dla kapusty)', qty: 1 },
          { row: 9, plant: 'szpinak', variety: null, note: 'Wzbogaca glebę', qty: 1 },
          { row: 10, plant: 'rzodkiewka', variety: null, note: 'Wypełnia luki, szybki wzrost', qty: 1 }
        ],
        // Szablon 5: Ogród ziołowy (8 grządek)
        5: [
          { row: 1, plant: 'bazylia', variety: null, note: 'Król ziół kuchennych', qty: 1 },
          { row: 2, plant: 'mięta', variety: 'Pieprzowa', note: 'Aromatyczna mięta do herbat', qty: 1 },
          { row: 3, plant: 'rozmaryn', variety: null, note: 'Wieloletnie zioło śródziemnomorskie', qty: 1 },
          { row: 4, plant: 'tymianek', variety: null, note: 'Wieloletni, wytrzymały', qty: 1 },
          { row: 5, plant: 'pietruszka', variety: 'Naciowa', note: 'Świeża pietruszka cały rok', qty: 1 },
          { row: 6, plant: 'koper', variety: null, note: 'Do sałatek i marynat', qty: 1 },
          { row: 7, plant: 'oregano', variety: null, note: 'Do pizzy i sosów', qty: 1 },
          { row: 8, plant: 'szałwia', variety: null, note: 'Lecznicza i kulinarna', qty: 1 }
        ]
      };

      // Insert templates
      const stmtTemplate = db.prepare(`
        INSERT INTO garden_templates (name, description, size_m2, difficulty, category, tags, estimated_setup_time)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      templates.forEach(t => {
        stmtTemplate.run(t.name, t.description, t.size_m2, t.difficulty, t.category, t.tags, t.estimated_setup_time);
      });

      stmtTemplate.finalize(() => {
        console.log(`✅ Added ${templates.length} garden templates`);

        // Insert template beds
        const stmtBed = db.prepare(`
          INSERT INTO template_beds (template_id, row_number, plant_name, plant_variety, note, quantity)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        let totalBeds = 0;
        Object.keys(templateBeds).forEach(templateId => {
          templateBeds[templateId].forEach(bed => {
            stmtBed.run(templateId, bed.row, bed.plant, bed.variety, bed.note, bed.qty);
            totalBeds++;
          });
        });

        stmtBed.finalize((err) => {
          if (err) {
            console.error('Error populating template_beds:', err.message);
          } else {
            console.log(`✅ Added ${totalBeds} template beds across ${templates.length} templates`);
          }
        });
      });
    }
  });

  // ==========================================
  // SECURITY FEATURES
  // ==========================================

  // Add email verification columns to users table
  db.run(`ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding email_verified column:', err.message);
    }
  });

  db.run(`ALTER TABLE users ADD COLUMN email_verification_token TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding email_verification_token column:', err.message);
    }
  });

  db.run(`ALTER TABLE users ADD COLUMN email_verification_expires DATETIME`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding email_verification_expires column:', err.message);
    }
  });

  // Add password reset columns to users table
  db.run(`ALTER TABLE users ADD COLUMN password_reset_token TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding password_reset_token column:', err.message);
    }
  });

  db.run(`ALTER TABLE users ADD COLUMN password_reset_expires DATETIME`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding password_reset_expires column:', err.message);
    }
  });

  // Add soft delete columns to users table
  db.run(`ALTER TABLE users ADD COLUMN deleted_at DATETIME`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding deleted_at column:', err.message);
    }
  });

  db.run(`ALTER TABLE users ADD COLUMN deletion_scheduled_for DATETIME`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding deletion_scheduled_for column:', err.message);
    }
  });

  // Password reset tokens history table
  db.run(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  // Deleted accounts archive table
  db.run(`CREATE TABLE IF NOT EXISTS deleted_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    deletion_reason TEXT,
    deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    restore_token TEXT,
    permanent_delete_at DATETIME NOT NULL,
    restored_at DATETIME,
    UNIQUE(user_id)
  )`);

  // Create indexes for security tables
  db.run('CREATE INDEX IF NOT EXISTS idx_reset_token ON password_reset_tokens(token)');
  db.run('CREATE INDEX IF NOT EXISTS idx_reset_user_id ON password_reset_tokens(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_reset_expires ON password_reset_tokens(expires_at)');
  db.run('CREATE INDEX IF NOT EXISTS idx_deleted_restore_token ON deleted_accounts(restore_token)');
  db.run('CREATE INDEX IF NOT EXISTS idx_deleted_permanent_at ON deleted_accounts(permanent_delete_at)');

  // Mark existing users as verified (backward compatibility)
  db.run(`UPDATE users SET email_verified = 1 WHERE email_verified IS NULL OR email_verified = 0`, (err) => {
    if (err) {
      console.error('Error updating existing users email_verified:', err.message);
    } else {
      console.log('✅ Marked existing users as email verified');
    }
  });

  // ==========================================
  // CARE & FERTILIZATION SYSTEM
  // ==========================================

  // Unified care history table (sprays + fertilization)
  db.run(`CREATE TABLE IF NOT EXISTS care_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bed_id INTEGER NOT NULL,
    action_type TEXT CHECK(action_type IN ('spray', 'fertilization')) NOT NULL,
    action_name TEXT NOT NULL,
    action_date DATE NOT NULL,
    dosage TEXT,
    weather_conditions TEXT,
    note TEXT,

    -- Spray-specific fields
    withdrawal_period INTEGER,
    safe_harvest_date DATE,

    -- Fertilization-specific fields
    fertilizer_type TEXT CHECK(fertilizer_type IN ('mineral', 'organic', 'natural')),
    npk_ratio TEXT,
    application_method TEXT CHECK(application_method IN ('soil', 'foliar')) DEFAULT 'soil',
    is_recurring BOOLEAN DEFAULT 0,
    repeat_frequency INTEGER,
    next_application_date DATE,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(bed_id) REFERENCES beds(id) ON DELETE CASCADE
  )`);

  // Fertilizers products database
  db.run(`CREATE TABLE IF NOT EXISTS fertilizers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    fertilizer_type TEXT CHECK(fertilizer_type IN ('mineral', 'organic', 'natural')) NOT NULL,
    npk_ratio TEXT,
    suitable_for TEXT,
    dosage_min INTEGER,
    dosage_max INTEGER,
    dosage_unit TEXT DEFAULT 'g/10m²',
    frequency_days INTEGER,
    application_method TEXT CHECK(application_method IN ('soil', 'foliar')) DEFAULT 'soil',
    notes TEXT,
    registered_poland BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Spray products database (reference for CareForm autocomplete)
  db.run(`CREATE TABLE IF NOT EXISTS spray_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    active_substance TEXT,
    type TEXT CHECK(type IN ('fungicyd', 'insektycyd', 'herbicyd', 'akarycyd', 'moluskocyd', 'biopreparat')) NOT NULL,
    is_ecological BOOLEAN DEFAULT 0,
    withdrawal_period INTEGER NOT NULL,
    dosage_professional TEXT,
    dosage_2l TEXT,
    dosage_5l TEXT,
    dosage_notes TEXT,
    target_plants TEXT,
    target_pests TEXT,
    application_method TEXT,
    max_applications INTEGER,
    interval_days INTEGER,
    temperature_range TEXT,
    warnings TEXT,
    registered_poland BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create indexes for care & fertilization system
  db.run('CREATE INDEX IF NOT EXISTS idx_care_bed_id ON care_history(bed_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_care_action_date ON care_history(action_date)');
  db.run('CREATE INDEX IF NOT EXISTS idx_care_action_type ON care_history(action_type)');
  db.run('CREATE INDEX IF NOT EXISTS idx_fertilizers_name ON fertilizers(name)');
  db.run('CREATE INDEX IF NOT EXISTS idx_fertilizers_type ON fertilizers(fertilizer_type)');
  db.run('CREATE INDEX IF NOT EXISTS idx_spray_products_name ON spray_products(name)');
  db.run('CREATE INDEX IF NOT EXISTS idx_spray_products_type ON spray_products(type)');

  // Populate fertilizers database (only if empty)
  db.get('SELECT COUNT(*) as count FROM fertilizers', (err, row) => {
    if (err) {
      console.error('Error checking fertilizers:', err.message);
      return;
    }

    if (row.count === 0) {
      console.log('🌱 Populating fertilizers database...');

      const fertilizersData = [
        // Mineralne uniwersalne
        { name: 'Azofoska', type: 'mineral', npk: '13:13:21', suitable: 'warzywa, kwiaty', dosage_min: 150, dosage_max: 250, unit: 'g/10m²', freq: 14, method: 'soil', notes: 'Nawóz uniwersalny NPK' },
        { name: 'Polifoska', type: 'mineral', npk: '8:24:24', suitable: 'warzywa korzeniowe, cebulowe', dosage_min: 100, dosage_max: 200, unit: 'g/10m²', freq: 21, method: 'soil', notes: 'Wysoka zawartość fosforu i potasu' },
        { name: 'Saletra amonowa', type: 'mineral', npk: '34:0:0', suitable: 'warzywa liściaste', dosage_min: 50, dosage_max: 100, unit: 'g/10m²', freq: 14, method: 'soil', notes: 'Czysto azotowy, szybkie działanie' },
        { name: 'Superfosfat potrójny', type: 'mineral', npk: '0:46:0', suitable: 'kwiaty, rośliny owocowe', dosage_min: 80, dosage_max: 150, unit: 'g/10m²', freq: 30, method: 'soil', notes: 'Fosfor dla kwitnienia i owocowania' },
        { name: 'Siarczan potasu', type: 'mineral', npk: '0:0:50', suitable: 'pomidory, papryka', dosage_min: 50, dosage_max: 100, unit: 'g/10m²', freq: 21, method: 'soil', notes: 'Potas poprawia smak owoców' },

        // Organiczne
        { name: 'Kompost', type: 'organic', npk: '1:0.5:1', suitable: 'wszystkie rośliny', dosage_min: 3000, dosage_max: 5000, unit: 'g/10m²', freq: 60, method: 'soil', notes: 'Naturalny nawóz organiczny, poprawia strukturę gleby' },
        { name: 'Obornik', type: 'organic', npk: '0.5:0.3:0.5', suitable: 'warzywa, krzewy', dosage_min: 4000, dosage_max: 6000, unit: 'g/10m²', freq: 180, method: 'soil', notes: 'Próchniczny, stosować przefermentowany' },
        { name: 'Granulat z obornika kurczego', type: 'organic', npk: '3:2:2', suitable: 'warzywa', dosage_min: 200, dosage_max: 400, unit: 'g/10m²', freq: 30, method: 'soil', notes: 'Wysokoskoncentrowany, długo działający' },
        { name: 'Biohumus', type: 'organic', npk: '1:1:1', suitable: 'wszystkie rośliny', dosage_min: 500, dosage_max: 1000, unit: 'g/10m²', freq: 30, method: 'soil', notes: 'Wermikomppost z dżdżownic' },

        // Naturalne
        { name: 'Pokrzywa (roztwór)', type: 'natural', npk: '4:0.5:8', suitable: 'pomidory, warzywa liściaste', dosage_min: 1, dosage_max: 2, unit: 'L/10L wody', freq: 7, method: 'foliar', notes: 'Napar z pokrzywy 1:10 z wodą' },
        { name: 'Skrzyp (roztwór)', type: 'natural', npk: '0:0:0', suitable: 'wszystkie rośliny', dosage_min: 1, dosage_max: 2, unit: 'L/10L wody', freq: 7, method: 'foliar', notes: 'Wzmacnia odporność, bogaty w krzem' },
        { name: 'Popioł drzewny', type: 'natural', npk: '0:0:10', suitable: 'warzywa owocowe', dosage_min: 100, dosage_max: 200, unit: 'g/10m²', freq: 30, method: 'soil', notes: 'Bogaty w potas i mikro elementy' },
        { name: 'Fusumizacja kawy', type: 'natural', npk: '2:0.3:0.2', suitable: 'kwiaty, pomidory', dosage_min: 200, dosage_max: 400, unit: 'g/10m²', freq: 21, method: 'soil', notes: 'Zakwasza glebę, azot' }
      ];

      const stmt = db.prepare(`
        INSERT INTO fertilizers (name, fertilizer_type, npk_ratio, suitable_for, dosage_min, dosage_max, dosage_unit, frequency_days, application_method, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      fertilizersData.forEach(f => {
        stmt.run(f.name, f.type, f.npk, f.suitable, f.dosage_min, f.dosage_max, f.unit, f.freq, f.method, f.notes);
      });

      stmt.finalize((err) => {
        if (err) {
          console.error('Error populating fertilizers:', err.message);
        } else {
          console.log(`✅ Added ${fertilizersData.length} fertilizer products`);
        }
      });
    }
  });

  // ==========================================
  // PHOTO REVIEW SYSTEM (Admin verification)
  // ==========================================

  // Photo reviews table - tracks admin verification of plant photos
  db.run(`CREATE TABLE IF NOT EXISTS photo_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plant_id INTEGER NOT NULL,
    reviewed_by INTEGER,
    is_correct BOOLEAN,
    review_notes TEXT,
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(plant_id) REFERENCES plants(id) ON DELETE CASCADE,
    FOREIGN KEY(reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(plant_id)
  )`);

  // Create index for photo reviews
  db.run('CREATE INDEX IF NOT EXISTS idx_photo_reviews_plant_id ON photo_reviews(plant_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_photo_reviews_is_correct ON photo_reviews(is_correct)');

  // ==========================================
  // GARDEN PLANNER FEATURE
  // ==========================================

  // Planned actions table - for planning future garden activities
  db.run(`CREATE TABLE IF NOT EXISTS planned_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action_type TEXT NOT NULL CHECK(action_type IN ('plant', 'spray', 'water', 'harvest', 'transplant', 'fertilize', 'prune', 'custom')),

    -- Powiazania (opcjonalne)
    plant_id INTEGER,
    bed_id INTEGER,
    plot_id INTEGER,

    -- Planowanie
    title TEXT NOT NULL,
    planned_date DATE NOT NULL,
    reminder_days INTEGER DEFAULT 3,
    notes TEXT,

    -- Pogoda
    weather_dependent BOOLEAN DEFAULT 0,

    -- Status
    status TEXT DEFAULT 'planned' CHECK(status IN ('planned', 'reminded', 'completed', 'cancelled', 'overdue')),
    completed_date DATE,

    -- Powtarzalnosc
    is_recurring BOOLEAN DEFAULT 0,
    recurrence_interval INTEGER,
    recurrence_unit TEXT CHECK(recurrence_unit IN ('days', 'weeks', 'months')),
    recurrence_end_date DATE,
    parent_plan_id INTEGER,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE SET NULL,
    FOREIGN KEY (bed_id) REFERENCES beds(id) ON DELETE SET NULL,
    FOREIGN KEY (plot_id) REFERENCES plots(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_plan_id) REFERENCES planned_actions(id) ON DELETE SET NULL
  )`);

  // Indeksy dla planned_actions
  db.run('CREATE INDEX IF NOT EXISTS idx_planned_actions_user_id ON planned_actions(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_planned_actions_date ON planned_actions(planned_date)');
  db.run('CREATE INDEX IF NOT EXISTS idx_planned_actions_status ON planned_actions(status)');
  db.run('CREATE INDEX IF NOT EXISTS idx_planned_actions_type ON planned_actions(action_type)');
  db.run('CREATE INDEX IF NOT EXISTS idx_planned_actions_parent ON planned_actions(parent_plan_id)');

  console.log('✅ Database tables and indexes created successfully');
});

module.exports = db;
