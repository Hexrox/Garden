const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// Middleware to check if user is admin
const adminOnly = (req, res, next) => {
  db.get('SELECT role FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Błąd serwera' });
    }
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Brak uprawnień administratora' });
    }
    next();
  });
};

// Get stats for admin dashboard (pending count for badge)
router.get('/stats', auth, adminOnly, (req, res) => {
  db.get(
    `SELECT
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
      COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
      COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
      COUNT(DISTINCT contributor_id) as contributors_count
     FROM plants
     WHERE is_custom = 1`,
    [],
    (err, stats) => {
      if (err) {
        console.error('Error fetching plant stats:', err);
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      res.json(stats || { pending_count: 0, approved_count: 0, rejected_count: 0, contributors_count: 0 });
    }
  );
});

// Get all pending plants for moderation
router.get('/pending', auth, adminOnly, (req, res) => {
  db.all(
    `SELECT p.*, u.username as contributor_username, u.email as contributor_email
     FROM plants p
     LEFT JOIN users u ON p.contributor_id = u.id
     WHERE p.status = 'pending'
     ORDER BY p.created_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        console.error('Error fetching pending plants:', err);
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      res.json(rows || []);
    }
  );
});

// Get all plants with filters (for admin panel)
router.get('/all', auth, adminOnly, (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE p.is_custom = 1';
  const params = [];

  if (status && status !== 'all') {
    whereClause += ' AND p.status = ?';
    params.push(status);
  }

  // Get total count first
  db.get(
    `SELECT COUNT(*) as total FROM plants p ${whereClause}`,
    params,
    (err, countResult) => {
      if (err) {
        console.error('Error counting plants:', err);
        return res.status(500).json({ error: 'Błąd serwera' });
      }

      // Get plants with pagination
      db.all(
        `SELECT p.*, u.username as contributor_username,
                r.username as reviewer_username
         FROM plants p
         LEFT JOIN users u ON p.contributor_id = u.id
         LEFT JOIN users r ON p.reviewed_by = r.id
         ${whereClause}
         ORDER BY
           CASE p.status
             WHEN 'pending' THEN 1
             WHEN 'rejected' THEN 2
             ELSE 3
           END,
           p.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), parseInt(offset)],
        (err, rows) => {
          if (err) {
            console.error('Error fetching plants:', err);
            return res.status(500).json({ error: 'Błąd serwera' });
          }
          res.json({
            plants: rows || [],
            total: countResult?.total || 0,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil((countResult?.total || 0) / limit)
          });
        }
      );
    }
  );
});

// Approve plant
router.put('/:id/approve', auth, adminOnly, (req, res) => {
  const plantId = req.params.id;

  db.run(
    `UPDATE plants
     SET status = 'approved',
         reviewed_by = ?,
         reviewed_at = datetime('now'),
         rejection_reason = NULL
     WHERE id = ? AND status = 'pending'`,
    [req.user.id, plantId],
    function (err) {
      if (err) {
        console.error('Error approving plant:', err);
        return res.status(500).json({ error: 'Błąd podczas zatwierdzania' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Roślina nie znaleziona lub już zatwierdzona' });
      }

      // Get updated plant info
      db.get(
        `SELECT p.*, u.username as contributor_username
         FROM plants p
         LEFT JOIN users u ON p.contributor_id = u.id
         WHERE p.id = ?`,
        [plantId],
        (err, plant) => {
          if (err) {
            return res.json({ message: 'Roślina zatwierdzona pomyślnie' });
          }
          res.json({
            message: 'Roślina zatwierdzona pomyślnie',
            plant
          });
        }
      );
    }
  );
});

// Reject plant
router.put('/:id/reject', auth, adminOnly, (req, res) => {
  const plantId = req.params.id;
  const { reason } = req.body;

  if (!reason || reason.trim().length === 0) {
    return res.status(400).json({ error: 'Powód odrzucenia jest wymagany' });
  }

  db.run(
    `UPDATE plants
     SET status = 'rejected',
         reviewed_by = ?,
         reviewed_at = datetime('now'),
         rejection_reason = ?
     WHERE id = ? AND status = 'pending'`,
    [req.user.id, reason.trim(), plantId],
    function (err) {
      if (err) {
        console.error('Error rejecting plant:', err);
        return res.status(500).json({ error: 'Błąd podczas odrzucania' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Roślina nie znaleziona lub już przetworzona' });
      }

      res.json({ message: 'Roślina odrzucona', reason: reason.trim() });
    }
  );
});

// Delete plant (admin only)
router.delete('/:id', auth, adminOnly, (req, res) => {
  const plantId = req.params.id;

  // First get plant info to delete photos
  db.get('SELECT photo_path, photo_thumb FROM plants WHERE id = ?', [plantId], (err, plant) => {
    if (err) {
      console.error('Error fetching plant for deletion:', err);
      return res.status(500).json({ error: 'Błąd serwera' });
    }

    if (!plant) {
      return res.status(404).json({ error: 'Roślina nie znaleziona' });
    }

    // Delete plant from DB
    db.run('DELETE FROM plants WHERE id = ?', [plantId], function (err) {
      if (err) {
        console.error('Error deleting plant:', err);
        return res.status(500).json({ error: 'Błąd podczas usuwania' });
      }

      // Clean up photos
      if (plant.photo_path) {
        const photoFullPath = path.join(__dirname, '..', plant.photo_path);
        if (fs.existsSync(photoFullPath)) {
          fs.unlinkSync(photoFullPath);
        }
      }
      if (plant.photo_thumb) {
        const thumbFullPath = path.join(__dirname, '..', plant.photo_thumb);
        if (fs.existsSync(thumbFullPath)) {
          fs.unlinkSync(thumbFullPath);
        }
      }

      res.json({ message: 'Roślina usunięta pomyślnie' });
    });
  });
});

// Bulk approve plants
router.post('/bulk-approve', auth, adminOnly, (req, res) => {
  const { plantIds } = req.body;

  if (!plantIds || !Array.isArray(plantIds) || plantIds.length === 0) {
    return res.status(400).json({ error: 'Brak wybranych roślin' });
  }

  const placeholders = plantIds.map(() => '?').join(',');

  db.run(
    `UPDATE plants
     SET status = 'approved',
         reviewed_by = ?,
         reviewed_at = datetime('now'),
         rejection_reason = NULL
     WHERE id IN (${placeholders}) AND status = 'pending'`,
    [req.user.id, ...plantIds],
    function (err) {
      if (err) {
        console.error('Error bulk approving plants:', err);
        return res.status(500).json({ error: 'Błąd podczas zatwierdzania' });
      }

      res.json({
        message: `Zatwierdzono ${this.changes} roślin`,
        approvedCount: this.changes
      });
    }
  );
});

// Get single plant details for moderation
router.get('/:id', auth, adminOnly, (req, res) => {
  db.get(
    `SELECT p.*, u.username as contributor_username, u.email as contributor_email,
            r.username as reviewer_username
     FROM plants p
     LEFT JOIN users u ON p.contributor_id = u.id
     LEFT JOIN users r ON p.reviewed_by = r.id
     WHERE p.id = ?`,
    [req.params.id],
    (err, plant) => {
      if (err) {
        console.error('Error fetching plant:', err);
        return res.status(500).json({ error: 'Błąd serwera' });
      }

      if (!plant) {
        return res.status(404).json({ error: 'Roślina nie znaleziona' });
      }

      res.json(plant);
    }
  );
});

module.exports = router;
