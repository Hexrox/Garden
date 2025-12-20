const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../db');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const fs = require('fs');
const { dbGet, dbAll, dbRun } = require('../utils/dbHelpers');

// ==========================================
// PUBLIC ENDPOINTS (no auth required)
// ==========================================

/**
 * GET /api/g/:username
 * Get public garden profile
 * No authentication required
 */
router.get('/g/:username', (req, res) => {
  const { username } = req.params;

  // Validate username format (alphanumeric, underscores, hyphens, 3-30 chars)
  if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
    return res.status(400).json({ error: 'Nieprawidłowy format nazwy użytkownika' });
  }

  // Get user public profile data
  const userQuery = `
    SELECT
      id,
      username,
      public_username,
      public_profile_enabled,
      public_bio,
      public_display_name,
      public_cover_photo_id,
      public_show_stats,
      public_show_timeline,
      public_show_gallery,
      public_show_badges,
      social_instagram,
      profile_photo,
      created_at
    FROM users
    WHERE public_username = ?
  `;

  db.get(userQuery, [username], (err, user) => {
    if (err) {
      console.error('Error fetching public profile:', err);
      return res.status(500).json({ error: 'Błąd serwera' });
    }

    if (!user || !user.public_profile_enabled) {
      return res.status(404).json({ error: 'Profil nie znaleziony lub niepubliczny' });
    }

    // Track profile view (async, don't wait)
    const referrer = req.headers.referer || req.headers.referrer || null;
    const userAgent = req.headers['user-agent'] || null;

    db.run(
      'INSERT INTO profile_views (username, referrer, user_agent) VALUES (?, ?, ?)',
      [username, referrer, userAgent],
      (err) => {
        if (err) console.error('Error tracking profile view:', err);
      }
    );

    // Build response object
    const profileData = {
      username: user.public_username,
      displayName: user.public_display_name || user.public_username,
      bio: user.public_bio,
      memberSince: user.created_at,
      socialInstagram: user.social_instagram,
      profilePhoto: user.profile_photo,
      coverPhoto: null,
      stats: null,
      timeline: null,
      harvests: null,
      gallery: null,
      badges: null
    };

    // Get cover photo if exists
    if (user.public_cover_photo_id) {
      db.get(
        'SELECT id, photo_path, caption FROM plant_photos WHERE id = ? AND user_id = ?',
        [user.public_cover_photo_id, user.id],
        (err, coverPhoto) => {
          if (!err && coverPhoto) {
            profileData.coverPhoto = {
              id: coverPhoto.id,
              path: coverPhoto.photo_path,
              caption: coverPhoto.caption
            };
          }

          // Continue building profile
          buildProfileData();
        }
      );
    } else {
      buildProfileData();
    }

    function buildProfileData() {
      let completed = 0;
      const total = 5; // stats, timeline, harvests, gallery, badges

      function checkComplete() {
        completed++;
        if (completed === total) {
          res.json(profileData);
        }
      }

      // Get statistics
      if (user.public_show_stats) {
        const statsQuery = `
          SELECT
            COUNT(DISTINCT p.id) as total_plots,
            COUNT(DISTINCT b.id) as total_plants,
            COALESCE(SUM(b.yield_amount), 0) as total_harvest_kg
          FROM plots p
          LEFT JOIN beds b ON b.plot_id = p.id
          WHERE p.user_id = ?
        `;

        db.get(statsQuery, [user.id], (err, stats) => {
          if (!err && stats) {
            profileData.stats = {
              plots: stats.total_plots || 0,
              plants: stats.total_plants || 0,
              harvestKg: parseFloat(stats.total_harvest_kg || 0).toFixed(1)
            };
          }
          checkComplete();
        });
      } else {
        checkComplete();
      }

      // Get timeline (what's growing now)
      if (user.public_show_timeline) {
        const timelineQuery = `
          SELECT
            b.id,
            b.plant_name,
            b.plant_variety,
            b.planted_date,
            b.expected_harvest_date,
            b.actual_harvest_date,
            b.image_path,
            p.name as plot_name,
            b.row_number,
            CASE
              WHEN b.actual_harvest_date IS NOT NULL THEN 'harvested'
              WHEN b.expected_harvest_date IS NULL THEN 'unknown'
              WHEN b.expected_harvest_date <= date('now') THEN 'ready'
              WHEN b.expected_harvest_date <= date('now', '+7 days') THEN 'soon'
              ELSE 'growing'
            END as status,
            CAST(julianday(b.expected_harvest_date) - julianday('now') as INTEGER) as days_until_harvest,
            CAST(julianday('now') - julianday(b.planted_date) as INTEGER) as days_since_planted,
            CAST(julianday(b.expected_harvest_date) - julianday(b.planted_date) as INTEGER) as total_days_to_harvest
          FROM beds b
          JOIN plots p ON p.id = b.plot_id
          WHERE p.user_id = ?
            AND b.actual_harvest_date IS NULL
          ORDER BY
            CASE
              WHEN b.expected_harvest_date IS NULL THEN 1
              ELSE 0
            END,
            b.expected_harvest_date ASC,
            b.planted_date DESC
          LIMIT 12
        `;

        db.all(timelineQuery, [user.id], (err, timeline) => {
          if (!err && timeline) {
            profileData.timeline = timeline.map(item => {
              // Calculate progress percentage
              let progressPercent = 0;
              if (item.total_days_to_harvest > 0 && item.days_since_planted >= 0) {
                progressPercent = Math.min(100, Math.max(0,
                  (item.days_since_planted / item.total_days_to_harvest) * 100
                ));
              }

              return {
                id: item.id,
                plantName: item.plant_name,
                plantVariety: item.plant_variety,
                plantedDate: item.planted_date,
                expectedHarvestDate: item.expected_harvest_date,
                imagePath: item.image_path,
                plotName: item.plot_name,
                rowNumber: item.row_number,
                status: item.status,
                daysUntilHarvest: item.days_until_harvest,
                daysSincePlanted: item.days_since_planted,
                progressPercent: Math.round(progressPercent)
              };
            });
          }
          checkComplete();
        });
      } else {
        checkComplete();
      }

      // Get recent harvests (last 60 days)
      const harvestsQuery = `
        SELECT
          b.id,
          b.plant_name,
          b.plant_variety,
          b.actual_harvest_date,
          b.yield_amount,
          b.yield_unit,
          b.harvest_photo,
          b.harvest_notes,
          b.image_path,
          p.name as plot_name,
          b.row_number
        FROM beds b
        JOIN plots p ON p.id = b.plot_id
        WHERE p.user_id = ?
          AND b.actual_harvest_date IS NOT NULL
          AND b.actual_harvest_date >= date('now', '-60 days')
          AND (b.harvest_photo IS NOT NULL OR b.harvest_notes IS NOT NULL)
        ORDER BY b.actual_harvest_date DESC
        LIMIT 6
      `;

      db.all(harvestsQuery, [user.id], (err, harvests) => {
        if (!err && harvests) {
          profileData.harvests = harvests.map(item => ({
            id: item.id,
            plantName: item.plant_name,
            plantVariety: item.plant_variety,
            harvestDate: item.actual_harvest_date,
            yieldAmount: item.yield_amount,
            yieldUnit: item.yield_unit,
            harvestPhoto: item.harvest_photo,
            harvestNotes: item.harvest_notes,
            imagePath: item.image_path,
            plotName: item.plot_name,
            rowNumber: item.row_number
          }));
        }
        checkComplete();
      });

      // Get public gallery photos
      if (user.public_show_gallery) {
        const galleryQuery = `
          SELECT
            pp.id,
            pp.photo_path,
            pp.caption,
            pp.created_at,
            pgp.display_order,
            pp.bed_plant_name as plant_name,
            pp.plot_name
          FROM public_gallery_photos pgp
          JOIN plant_photos pp ON pp.id = pgp.photo_id
          WHERE pgp.user_id = ?
          ORDER BY pgp.display_order ASC, pp.created_at DESC
        `;

        db.all(galleryQuery, [user.id], (err, gallery) => {
          if (!err && gallery) {
            profileData.gallery = gallery.map(photo => ({
              id: photo.id,
              path: photo.photo_path,
              caption: photo.caption,
              plantName: photo.plant_name,
              plotName: photo.plot_name,
              createdAt: photo.created_at
            }));
          }
          checkComplete();
        });
      } else {
        checkComplete();
      }

      // Get badges (achievements based on real data)
      if (user.public_show_badges) {
        const badgesQuery = `
          SELECT
            (SELECT COUNT(DISTINCT id) FROM plots WHERE user_id = ?) as total_plots,
            (SELECT COUNT(DISTINCT id) FROM beds WHERE plot_id IN (SELECT id FROM plots WHERE user_id = ?)) as total_plants,
            (SELECT COUNT(*) FROM beds WHERE plot_id IN (SELECT id FROM plots WHERE user_id = ?) AND actual_harvest_date IS NOT NULL) as total_harvests,
            (SELECT SUM(yield_amount) FROM beds WHERE plot_id IN (SELECT id FROM plots WHERE user_id = ?) AND yield_amount IS NOT NULL) as total_yield,
            (SELECT COUNT(*) FROM plant_photos WHERE user_id = ?) as total_photos,
            (SELECT julianday('now') - julianday(created_at) FROM users WHERE id = ?) as days_as_member
        `;

        db.get(badgesQuery, [user.id, user.id, user.id, user.id, user.id, user.id], (err, badgeData) => {
          if (!err && badgeData) {
            const badges = [];

            // First harvest badge
            if (badgeData.total_harvests >= 1) {
              badges.push({
                id: 'first_harvest',
                name: 'Pierwszy zbiór',
                icon: '🎉',
                description: 'Zebrałeś swoją pierwszą roślinę!',
                tier: 'bronze'
              });
            }

            // Harvest milestones
            if (badgeData.total_harvests >= 10) {
              badges.push({
                id: 'harvest_10',
                name: 'Doświadczony rolnik',
                icon: '🌾',
                description: '10 zebranych roślin',
                tier: 'silver'
              });
            }

            if (badgeData.total_harvests >= 50) {
              badges.push({
                id: 'harvest_50',
                name: 'Mistrz zbioru',
                icon: '👨‍🌾',
                description: '50 zebranych roślin',
                tier: 'gold'
              });
            }

            // Planting milestones
            if (badgeData.total_plants >= 5) {
              badges.push({
                id: 'plants_5',
                name: 'Zielone ręce',
                icon: '🌱',
                description: '5 zasadzonych roślin',
                tier: 'bronze'
              });
            }

            if (badgeData.total_plants >= 20) {
              badges.push({
                id: 'plants_20',
                name: 'Ogrodnik',
                icon: '🪴',
                description: '20 zasadzonych roślin',
                tier: 'silver'
              });
            }

            if (badgeData.total_plants >= 100) {
              badges.push({
                id: 'plants_100',
                name: 'Król ogrodu',
                icon: '👑',
                description: '100+ zasadzonych roślin',
                tier: 'gold'
              });
            }

            // Yield milestones
            if (badgeData.total_yield >= 10) {
              badges.push({
                id: 'yield_10kg',
                name: 'Plon',
                icon: '🥬',
                description: 'Zebrałeś 10kg+ plonów',
                tier: 'silver'
              });
            }

            if (badgeData.total_yield >= 50) {
              badges.push({
                id: 'yield_50kg',
                name: 'Imponujący plon',
                icon: '🧺',
                description: 'Zebrałeś 50kg+ plonów',
                tier: 'gold'
              });
            }

            // Photo badges
            if (badgeData.total_photos >= 10) {
              badges.push({
                id: 'photos_10',
                name: 'Fotograf',
                icon: '📸',
                description: '10+ zdjęć w galerii',
                tier: 'bronze'
              });
            }

            if (badgeData.total_photos >= 50) {
              badges.push({
                id: 'photos_50',
                name: 'Mistrz fotografii',
                icon: '📷',
                description: '50+ zdjęć w galerii',
                tier: 'gold'
              });
            }

            // Loyalty badges
            if (badgeData.days_as_member >= 30) {
              badges.push({
                id: 'member_30d',
                name: 'Wierny ogrodnik',
                icon: '⭐',
                description: '30+ dni w aplikacji',
                tier: 'bronze'
              });
            }

            if (badgeData.days_as_member >= 180) {
              badges.push({
                id: 'member_180d',
                name: 'Doświadczony użytkownik',
                icon: '🌟',
                description: '6+ miesięcy w aplikacji',
                tier: 'silver'
              });
            }

            if (badgeData.days_as_member >= 365) {
              badges.push({
                id: 'member_365d',
                name: 'Roczny weteran',
                icon: '💎',
                description: 'Rok w aplikacji!',
                tier: 'gold'
              });
            }

            // Multiple plots badge
            if (badgeData.total_plots >= 3) {
              badges.push({
                id: 'plots_3',
                name: 'Wielki ogród',
                icon: '🏡',
                description: '3+ grządki',
                tier: 'silver'
              });
            }

            profileData.badges = badges;
          }
          checkComplete();
        });
      } else {
        checkComplete();
      }
    }
  });
});

// ==========================================
// PROTECTED ENDPOINTS (auth required)
// ==========================================

/**
 * GET /api/profile/public
 * Get current user's public profile settings
 */
router.get('/profile/public', auth, (req, res) => {
  const query = `
    SELECT
      public_username,
      public_profile_enabled,
      public_bio,
      public_display_name,
      public_cover_photo_id,
      public_show_stats,
      public_show_timeline,
      public_show_gallery,
      public_show_badges
    FROM users
    WHERE id = ?
  `;

  db.get(query, [req.user.id], (err, settings) => {
    if (err) {
      console.error('Error fetching public profile settings:', err);
      return res.status(500).json({ error: 'Błąd serwera' });
    }

    res.json({
      username: settings.public_username || '',
      displayName: settings.public_display_name || '',
      enabled: Boolean(settings.public_profile_enabled),
      bio: settings.public_bio || '',
      coverPhotoId: settings.public_cover_photo_id,
      showStats: Boolean(settings.public_show_stats),
      showTimeline: Boolean(settings.public_show_timeline),
      showGallery: Boolean(settings.public_show_gallery),
      showBadges: Boolean(settings.public_show_badges)
    });
  });
});

/**
 * POST /api/profile/public
 * Update public profile settings
 */
router.post('/profile/public', [
  auth,
  body('username')
    .optional()
    .trim()
    .matches(/^[a-zA-Z0-9_-]{3,30}$/)
    .withMessage('Nazwa użytkownika może zawierać tylko litery, cyfry, _ i - (3-30 znaków)'),
  body('displayName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .escape()
    .withMessage('Nazwa wyświetlana może mieć maksymalnie 50 znaków'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .escape()
    .withMessage('Bio może mieć maksymalnie 500 znaków'),
  body('enabled')
    .optional()
    .isBoolean()
    .withMessage('Pole enabled musi być boolean'),
  body('coverPhotoId')
    .optional()
    .isInt()
    .withMessage('ID zdjęcia musi być liczbą'),
  body('showStats').optional().isBoolean(),
  body('showTimeline').optional().isBoolean(),
  body('showGallery').optional().isBoolean(),
  body('showBadges').optional().isBoolean(),
  body('socialInstagram')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .escape()
    .withMessage('Link może mieć maksymalnie 200 znaków')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    username,
    displayName,
    bio,
    enabled,
    coverPhotoId,
    showStats,
    showTimeline,
    showGallery,
    showBadges,
    socialInstagram
  } = req.body;

  // Check if username is already taken (if provided and different from current)
  if (username) {
    db.get(
      'SELECT id FROM users WHERE public_username = ? AND id != ?',
      [username, req.user.id],
      (err, existingUser) => {
        if (err) {
          console.error('Error checking username:', err);
          return res.status(500).json({ error: 'Błąd serwera' });
        }

        if (existingUser) {
          return res.status(400).json({ error: 'Ta nazwa użytkownika jest już zajęta' });
        }

        // Proceed with update
        updateProfile();
      }
    );
  } else {
    updateProfile();
  }

  function updateProfile() {
    // Verify cover photo belongs to user (if provided)
    if (coverPhotoId) {
      db.get(
        'SELECT id FROM plant_photos WHERE id = ? AND user_id = ?',
        [coverPhotoId, req.user.id],
        (err, photo) => {
          if (err || !photo) {
            return res.status(400).json({ error: 'Nieprawidłowe ID zdjęcia okładkowego' });
          }
          performUpdate();
        }
      );
    } else {
      performUpdate();
    }
  }

  function performUpdate() {
    const updates = [];
    const params = [];

    if (username !== undefined) {
      updates.push('public_username = ?');
      params.push(username);
    }
    if (displayName !== undefined) {
      updates.push('public_display_name = ?');
      params.push(displayName);
    }
    if (bio !== undefined) {
      updates.push('public_bio = ?');
      params.push(bio);
    }
    if (enabled !== undefined) {
      updates.push('public_profile_enabled = ?');
      params.push(enabled ? 1 : 0);
    }
    if (coverPhotoId !== undefined) {
      updates.push('public_cover_photo_id = ?');
      params.push(coverPhotoId || null);
    }
    if (showStats !== undefined) {
      updates.push('public_show_stats = ?');
      params.push(showStats ? 1 : 0);
    }
    if (showTimeline !== undefined) {
      updates.push('public_show_timeline = ?');
      params.push(showTimeline ? 1 : 0);
    }
    if (showGallery !== undefined) {
      updates.push('public_show_gallery = ?');
      params.push(showGallery ? 1 : 0);
    }
    if (showBadges !== undefined) {
      updates.push('public_show_badges = ?');
      params.push(showBadges ? 1 : 0);
    }
    if (socialInstagram !== undefined) {
      updates.push('social_instagram = ?');
      params.push(socialInstagram || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Brak danych do aktualizacji' });
    }

    params.push(req.user.id);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

    db.run(query, params, function(err) {
      if (err) {
        console.error('Error updating public profile:', err);
        return res.status(500).json({ error: 'Błąd podczas aktualizacji profilu' });
      }

      res.json({
        message: 'Profil publiczny zaktualizowany',
        publicUrl: username ? `/g/${username}` : null
      });
    });
  }
});

/**
 * POST /api/profile/public/photos
 * Update selected photos for public gallery
 * Expects: { photoIds: [1, 2, 3, ...] }
 */
router.post('/profile/public/photos', [
  auth,
  body('photoIds')
    .isArray()
    .withMessage('photoIds musi być tablicą')
    .custom((value) => value.length <= 50)
    .withMessage('Maksymalnie 50 zdjęć w galerii')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { photoIds } = req.body;

  // Verify all photos belong to user
  if (photoIds.length > 0) {
    const placeholders = photoIds.map(() => '?').join(',');
    const verifyQuery = `
      SELECT COUNT(*) as count
      FROM plant_photos
      WHERE id IN (${placeholders}) AND user_id = ?
    `;

    db.get(verifyQuery, [...photoIds, req.user.id], (err, result) => {
      if (err) {
        console.error('Error verifying photos:', err);
        return res.status(500).json({ error: 'Błąd serwera' });
      }

      if (result.count !== photoIds.length) {
        return res.status(400).json({ error: 'Niektóre zdjęcia nie należą do użytkownika' });
      }

      // Delete existing selections
      db.run(
        'DELETE FROM public_gallery_photos WHERE user_id = ?',
        [req.user.id],
        (err) => {
          if (err) {
            console.error('Error deleting old gallery photos:', err);
            return res.status(500).json({ error: 'Błąd serwera' });
          }

          // Insert new selections
          if (photoIds.length === 0) {
            return res.json({ message: 'Galeria publiczna wyczyszczona', count: 0 });
          }

          const insertQuery = `
            INSERT INTO public_gallery_photos (user_id, photo_id, display_order)
            VALUES (?, ?, ?)
          `;

          let completed = 0;
          let hasError = false;

          photoIds.forEach((photoId, index) => {
            db.run(insertQuery, [req.user.id, photoId, index], (err) => {
              if (err && !hasError) {
                hasError = true;
                console.error('Error inserting gallery photo:', err);
                return res.status(500).json({ error: 'Błąd podczas zapisywania zdjęć' });
              }

              completed++;
              if (completed === photoIds.length && !hasError) {
                res.json({
                  message: 'Galeria publiczna zaktualizowana',
                  count: photoIds.length
                });
              }
            });
          });
        }
      );
    });
  } else {
    // Empty array - clear gallery
    db.run(
      'DELETE FROM public_gallery_photos WHERE user_id = ?',
      [req.user.id],
      (err) => {
        if (err) {
          console.error('Error clearing gallery:', err);
          return res.status(500).json({ error: 'Błąd serwera' });
        }
        res.json({ message: 'Galeria publiczna wyczyszczona', count: 0 });
      }
    );
  }
});

/**
 * GET /api/profile/public/stats
 * Get analytics for public profile (view counts)
 */
router.get('/profile/public/stats', auth, (req, res) => {
  // Get user's public username first
  db.get(
    'SELECT public_username FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) {
        console.error('Error fetching user:', err);
        return res.status(500).json({ error: 'Błąd serwera' });
      }

      if (!user || !user.public_username) {
        return res.json({
          totalViews: 0,
          viewsLast7Days: 0,
          viewsLast30Days: 0,
          topReferrers: []
        });
      }

      // Get total views
      db.get(
        'SELECT COUNT(*) as total FROM profile_views WHERE username = ?',
        [user.public_username],
        (err, totalResult) => {
          if (err) {
            console.error('Error fetching total views:', err);
            return res.status(500).json({ error: 'Błąd serwera' });
          }

          // Get views last 7 days
          db.get(
            `SELECT COUNT(*) as count
             FROM profile_views
             WHERE username = ? AND viewed_at >= datetime('now', '-7 days')`,
            [user.public_username],
            (err, last7Days) => {
              if (err) {
                console.error('Error fetching 7-day views:', err);
                return res.status(500).json({ error: 'Błąd serwera' });
              }

              // Get views last 30 days
              db.get(
                `SELECT COUNT(*) as count
                 FROM profile_views
                 WHERE username = ? AND viewed_at >= datetime('now', '-30 days')`,
                [user.public_username],
                (err, last30Days) => {
                  if (err) {
                    console.error('Error fetching 30-day views:', err);
                    return res.status(500).json({ error: 'Błąd serwera' });
                  }

                  // Get top referrers
                  db.all(
                    `SELECT
                       referrer,
                       COUNT(*) as count
                     FROM profile_views
                     WHERE username = ? AND referrer IS NOT NULL
                     GROUP BY referrer
                     ORDER BY count DESC
                     LIMIT 10`,
                    [user.public_username],
                    (err, referrers) => {
                      if (err) {
                        console.error('Error fetching referrers:', err);
                        return res.status(500).json({ error: 'Błąd serwera' });
                      }

                      res.json({
                        totalViews: totalResult.total || 0,
                        viewsLast7Days: last7Days.count || 0,
                        viewsLast30Days: last30Days.count || 0,
                        topReferrers: referrers || []
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

/**
 * GET /api/profile/public/photos/available
 * Get all user's photos that can be added to public gallery
 */
router.get('/profile/public/photos/available', auth, (req, res) => {
  const query = `
    SELECT
      pp.id,
      pp.photo_path,
      pp.caption,
      pp.created_at,
      b.plant_name,
      p.name as plot_name,
      CASE WHEN pgp.id IS NOT NULL THEN 1 ELSE 0 END as is_selected
    FROM plant_photos pp
    LEFT JOIN beds b ON b.id = pp.bed_id
    LEFT JOIN plots p ON p.id = pp.plot_id
    LEFT JOIN public_gallery_photos pgp ON pgp.photo_id = pp.id AND pgp.user_id = ?
    WHERE pp.user_id = ?
    ORDER BY pp.created_at DESC
  `;

  db.all(query, [req.user.id, req.user.id], (err, photos) => {
    if (err) {
      console.error('Error fetching available photos:', err);
      return res.status(500).json({ error: 'Błąd serwera' });
    }

    res.json(photos.map(photo => ({
      id: photo.id,
      path: photo.photo_path,
      caption: photo.caption,
      plantName: photo.plant_name,
      plotName: photo.plot_name,
      createdAt: photo.created_at,
      isSelected: Boolean(photo.is_selected)
    })));
  });
});

/**
 * POST /api/profile/photo
 * Upload profile photo
 * Requires authentication
 */
router.post('/profile/photo', [auth, upload.single('photo')], (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Brak pliku' });
  }

  const photoPath = `uploads/${req.file.filename}`;

  // Delete old profile photo if exists
  db.get('SELECT profile_photo FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(500).json({ error: 'Błąd serwera' });
    }

    // Delete old photo file
    if (user && user.profile_photo) {
      const path = require('path');
      const oldPhotoPath = user.profile_photo.startsWith('uploads/')
        ? user.profile_photo.replace('uploads/', '')
        : user.profile_photo;

      // Security: Use basename to prevent path traversal
      const safeFilename = path.basename(oldPhotoPath);

      const uploadDir = process.env.NODE_ENV === 'production'
        ? '/var/www/garden-uploads'
        : path.join(__dirname, '..', 'uploads');

      const fullPath = path.join(uploadDir, safeFilename);

      // Verify path is within upload directory
      if (fullPath.startsWith(uploadDir)) {
        fs.unlink(fullPath, (err) => {
          if (err) console.error('Error deleting old profile photo:', err);
        });
      } else {
        console.error('Path traversal attempt blocked:', fullPath);
      }
    }

    // Update user profile photo
    db.run(
      'UPDATE users SET profile_photo = ? WHERE id = ?',
      [photoPath, req.user.id],
      (err) => {
        if (err) {
          console.error('Error updating profile photo:', err);
          return res.status(500).json({ error: 'Błąd zapisywania zdjęcia' });
        }

        res.json({
          success: true,
          photoPath: photoPath
        });
      }
    );
  });
});

/**
 * DELETE /api/profile/photo
 * Delete profile photo
 * Requires authentication
 */
router.delete('/profile/photo', auth, (req, res) => {
  db.get('SELECT profile_photo FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(500).json({ error: 'Błąd serwera' });
    }

    if (!user || !user.profile_photo) {
      return res.status(404).json({ error: 'Brak zdjęcia profilowego' });
    }

    // Delete photo file
    const path = require('path');
    const photoPath = user.profile_photo.startsWith('uploads/')
      ? user.profile_photo.replace('uploads/', '')
      : user.profile_photo;

    // Security: Use basename to prevent path traversal
    const safeFilename = path.basename(photoPath);

    const uploadDir = process.env.NODE_ENV === 'production'
      ? '/var/www/garden-uploads'
      : path.join(__dirname, '..', 'uploads');

    const fullPath = path.join(uploadDir, safeFilename);

    // Verify path is within upload directory
    if (fullPath.startsWith(uploadDir)) {
      fs.unlink(fullPath, (err) => {
        if (err) console.error('Error deleting profile photo:', err);
      });
    } else {
      console.error('Path traversal attempt blocked:', fullPath);
    }

    // Update database
    db.run(
      'UPDATE users SET profile_photo = NULL WHERE id = ?',
      [req.user.id],
      (err) => {
        if (err) {
          console.error('Error removing profile photo:', err);
          return res.status(500).json({ error: 'Błąd usuwania zdjęcia' });
        }

        res.json({ success: true });
      }
    );
  });
});

module.exports = router;
