const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Admin middleware - sprawdza czy użytkownik ma rolę admin (RBAC)
const adminAuth = (req, res, next) => {
  // Pobierz rolę użytkownika z bazy (JWT nie zawiera role dla bezpieczeństwa)
  db.get('SELECT role FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      console.error('Error checking admin role:', err);
      return res.status(500).json({ error: 'Błąd serwera' });
    }

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Brak uprawnień administratora' });
    }

    next();
  });
};

/**
 * GET /api/admin/stats
 * Zwraca statystyki aplikacji (tylko dla admina)
 */
router.get('/stats', auth, adminAuth, async (req, res) => {
  try {
    // Agregowane statystyki
    const stats = await new Promise((resolve, reject) => {
      db.all(
        `SELECT
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM plots) as total_plots,
          (SELECT COUNT(*) FROM beds) as total_beds,
          (SELECT COUNT(*) FROM tasks) as total_tasks,
          (SELECT COUNT(*) FROM tasks WHERE completed = 1) as completed_tasks,
          (SELECT COUNT(*) FROM spray_history) as total_sprays,
          (SELECT COUNT(*) FROM plants WHERE is_custom = 1) as custom_plants`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows[0]);
        }
      );
    });

    // Lista użytkowników (bez haseł)
    const users = await new Promise((resolve, reject) => {
      db.all(
        `SELECT
          id,
          username,
          email,
          created_at,
          last_login,
          COALESCE(login_count, 0) as login_count,
          city,
          hardiness_zone,
          (SELECT COUNT(*) FROM plots WHERE user_id = users.id) as plots_count,
          (SELECT COUNT(*) FROM tasks WHERE user_id = users.id) as tasks_count
        FROM users
        ORDER BY created_at DESC`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    // Ostatnia aktywność (ostatnie 10 zadań)
    const recentActivity = await new Promise((resolve, reject) => {
      db.all(
        `SELECT
          t.id,
          t.description,
          t.created_at,
          t.completed,
          t.completed_at,
          u.username
        FROM tasks t
        JOIN users u ON t.user_id = u.id
        ORDER BY t.created_at DESC
        LIMIT 10`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    res.json({
      stats,
      users,
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania statystyk' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Usuwa użytkownika i wszystkie jego dane (tylko dla admina)
 * Zabezpieczone przed usunięciem własnego konta
 */
router.delete('/users/:id', auth, adminAuth, async (req, res) => {
  const userIdToDelete = parseInt(req.params.id);
  const adminId = req.user.id;

  // Zabezpieczenie przed usunięciem własnego konta
  if (userIdToDelete === adminId) {
    return res.status(400).json({ error: 'Nie możesz usunąć własnego konta' });
  }

  try {
    // Sprawdź czy użytkownik istnieje
    const userToDelete = await new Promise((resolve, reject) => {
      db.get('SELECT id, username, email FROM users WHERE id = ?', [userIdToDelete], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!userToDelete) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    // Rozpocznij transakcję
    await new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    try {
      // 1. Pobierz ID wszystkich plots użytkownika
      const userPlots = await new Promise((resolve, reject) => {
        db.all('SELECT id FROM plots WHERE user_id = ?', [userIdToDelete], (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });

      const plotIds = userPlots.map(p => p.id);

      if (plotIds.length > 0) {
        const placeholders = plotIds.map(() => '?').join(',');

        // 2. Pobierz ID wszystkich beds
        const userBeds = await new Promise((resolve, reject) => {
          db.all(`SELECT id FROM beds WHERE plot_id IN (${placeholders})`, plotIds, (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          });
        });

        const bedIds = userBeds.map(b => b.id);

        if (bedIds.length > 0) {
          const bedPlaceholders = bedIds.map(() => '?').join(',');

          // 3. Usuń powiązane dane beds
          await new Promise((resolve, reject) => {
            db.run(`DELETE FROM plant_photos WHERE bed_id IN (${bedPlaceholders})`, bedIds, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });

          await new Promise((resolve, reject) => {
            db.run(`DELETE FROM spray_history WHERE bed_id IN (${bedPlaceholders})`, bedIds, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });

          await new Promise((resolve, reject) => {
            db.run(`DELETE FROM companion_plants WHERE bed_id IN (${bedPlaceholders})`, bedIds, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }

        // 4. Usuń beds
        await new Promise((resolve, reject) => {
          db.run(`DELETE FROM beds WHERE plot_id IN (${placeholders})`, plotIds, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        // 5. Usuń plots
        await new Promise((resolve, reject) => {
          db.run('DELETE FROM plots WHERE user_id = ?', [userIdToDelete], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }

      // 6. Usuń tasks użytkownika
      await new Promise((resolve, reject) => {
        db.run('DELETE FROM tasks WHERE user_id = ?', [userIdToDelete], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // 7. Usuń reminders użytkownika
      await new Promise((resolve, reject) => {
        db.run('DELETE FROM reminders WHERE user_id = ?', [userIdToDelete], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // 8. Usuń succession_reminders użytkownika
      await new Promise((resolve, reject) => {
        db.run('DELETE FROM succession_reminders WHERE user_id = ?', [userIdToDelete], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // 9. Usuń public gallery photos
      await new Promise((resolve, reject) => {
        db.run('DELETE FROM public_gallery_photos WHERE user_id = ?', [userIdToDelete], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // 10. Usuń profile views
      await new Promise((resolve, reject) => {
        db.run('DELETE FROM profile_views WHERE user_id = ? OR viewed_user_id = ?', [userIdToDelete, userIdToDelete], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // 11. Usuń weather history
      await new Promise((resolve, reject) => {
        db.run('DELETE FROM weather_history WHERE user_id = ?', [userIdToDelete], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // 12. Usuń użytkownika
      await new Promise((resolve, reject) => {
        db.run('DELETE FROM users WHERE id = ?', [userIdToDelete], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Zatwierdź transakcję
      await new Promise((resolve, reject) => {
        db.run('COMMIT', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log(`Admin ${req.user.username} deleted user: ${userToDelete.username} (ID: ${userIdToDelete})`);

      res.json({
        message: 'Użytkownik został pomyślnie usunięty',
        deletedUser: {
          id: userToDelete.id,
          username: userToDelete.username,
          email: userToDelete.email
        }
      });

    } catch (error) {
      // Rollback w przypadku błędu
      await new Promise((resolve) => {
        db.run('ROLLBACK', () => resolve());
      });
      throw error;
    }

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Błąd podczas usuwania użytkownika' });
  }
});

module.exports = router;
