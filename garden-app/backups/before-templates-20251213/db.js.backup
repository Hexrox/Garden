const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('garden.db');

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
  db.run('CREATE INDEX IF NOT EXISTS idx_plants_user_id ON plants(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_plants_name ON plants(name)');
  db.run('CREATE INDEX IF NOT EXISTS idx_plant_photos_bed_id ON plant_photos(bed_id)');
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

  // Weather history table (for advanced drought detection)
  db.run(`CREATE TABLE IF NOT EXISTS weather_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL UNIQUE,
    temperature REAL,
    temp_min REAL,
    temp_max REAL,
    humidity INTEGER,
    rain REAL DEFAULT 0,
    wind_speed REAL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

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

  console.log('✅ Database tables and indexes created successfully');
});

module.exports = db;
