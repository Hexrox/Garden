const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Admin middleware - sprawdza czy użytkownik ma rolę admin
const adminAuth = (req, res, next) => {
  db.get('SELECT role FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      console.error('Error checking admin role:', err);
      return res.status(500).json({ error: 'Server error' });
    }
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Brak uprawnień administratora' });
    }
    next();
  });
};

// Get all plants with photos for review (admin only)
router.get('/', auth, adminAuth, (req, res) => {
  const { filter, category, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE p.photo_path IS NOT NULL';
  const params = [];

  // Filter by review status
  if (filter === 'unreviewed') {
    whereClause += ' AND pr.id IS NULL';
  } else if (filter === 'correct') {
    whereClause += ' AND pr.is_correct = 1';
  } else if (filter === 'incorrect') {
    whereClause += ' AND pr.is_correct = 0';
  }

  // Filter by category
  if (category) {
    whereClause += ' AND p.category = ?';
    params.push(category);
  }

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM plants p
    LEFT JOIN photo_reviews pr ON p.id = pr.plant_id
    ${whereClause}
  `;

  db.get(countQuery, params, (err, countRow) => {
    if (err) {
      console.error('Error counting photos:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const total = countRow.total;

    // Get plants with photos
    const query = `
      SELECT
        p.id,
        p.name,
        p.latin_name,
        p.category,
        p.photo_path,
        p.photo_thumb,
        p.photo_author,
        p.photo_license,
        p.photo_source_url,
        pr.is_correct,
        pr.review_notes,
        pr.reviewed_at,
        u.username as reviewed_by_username
      FROM plants p
      LEFT JOIN photo_reviews pr ON p.id = pr.plant_id
      LEFT JOIN users u ON pr.reviewed_by = u.id
      ${whereClause}
      ORDER BY
        CASE WHEN pr.id IS NULL THEN 0 ELSE 1 END,
        p.name ASC
      LIMIT ? OFFSET ?
    `;

    db.all(query, [...params, parseInt(limit), parseInt(offset)], (err, rows) => {
      if (err) {
        console.error('Error fetching photos for review:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        plants: rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      });
    });
  });
});

// Get review statistics (admin only)
router.get('/stats', auth, adminAuth, (req, res) => {
  const query = `
    SELECT
      COUNT(DISTINCT p.id) as total_with_photos,
      COUNT(DISTINCT CASE WHEN pr.id IS NULL THEN p.id END) as unreviewed,
      COUNT(DISTINCT CASE WHEN pr.is_correct = 1 THEN p.id END) as correct,
      COUNT(DISTINCT CASE WHEN pr.is_correct = 0 THEN p.id END) as incorrect
    FROM plants p
    LEFT JOIN photo_reviews pr ON p.id = pr.plant_id
    WHERE p.photo_path IS NOT NULL
  `;

  db.get(query, [], (err, row) => {
    if (err) {
      console.error('Error fetching review stats:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(row);
  });
});

// Get categories with photo counts (admin only)
router.get('/categories', auth, adminAuth, (req, res) => {
  const query = `
    SELECT
      p.category,
      COUNT(*) as total,
      COUNT(CASE WHEN pr.id IS NULL THEN 1 END) as unreviewed,
      COUNT(CASE WHEN pr.is_correct = 0 THEN 1 END) as incorrect
    FROM plants p
    LEFT JOIN photo_reviews pr ON p.id = pr.plant_id
    WHERE p.photo_path IS NOT NULL AND p.category IS NOT NULL
    GROUP BY p.category
    ORDER BY p.category
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching categories:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(rows);
  });
});

// Submit review for a plant photo (admin only)
router.post('/:plantId', auth, adminAuth, (req, res) => {
  const { plantId } = req.params;
  const { is_correct, review_notes } = req.body;
  const userId = req.user.id;

  if (typeof is_correct !== 'boolean') {
    return res.status(400).json({ error: 'is_correct must be a boolean' });
  }

  // Use UPSERT to insert or update review
  const query = `
    INSERT INTO photo_reviews (plant_id, reviewed_by, is_correct, review_notes, reviewed_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(plant_id) DO UPDATE SET
      reviewed_by = excluded.reviewed_by,
      is_correct = excluded.is_correct,
      review_notes = excluded.review_notes,
      reviewed_at = excluded.reviewed_at
  `;

  db.run(query, [plantId, userId, is_correct ? 1 : 0, review_notes || null], function(err) {
    if (err) {
      console.error('Error saving review:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({
      success: true,
      message: is_correct ? 'Marked as correct' : 'Marked as incorrect',
      plant_id: parseInt(plantId)
    });
  });
});

// Get all incorrect photos for fixing (admin only)
router.get('/incorrect', auth, adminAuth, (req, res) => {
  const query = `
    SELECT
      p.id,
      p.name,
      p.latin_name,
      p.category,
      p.photo_path,
      p.photo_author,
      p.photo_source_url,
      pr.review_notes,
      pr.reviewed_at
    FROM plants p
    JOIN photo_reviews pr ON p.id = pr.plant_id
    WHERE pr.is_correct = 0
    ORDER BY pr.reviewed_at DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching incorrect photos:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(rows);
  });
});

// Clear photo for a plant (admin only) - for re-downloading
router.delete('/:plantId/photo', auth, adminAuth, (req, res) => {
  const { plantId } = req.params;
  const fs = require('fs');
  const path = require('path');

  // Get current photo path
  db.get('SELECT photo_path, photo_thumb FROM plants WHERE id = ?', [plantId], (err, plant) => {
    if (err) {
      console.error('Error fetching plant:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!plant) {
      return res.status(404).json({ error: 'Plant not found' });
    }

    // Delete photo files if they exist
    if (plant.photo_path) {
      const photoPath = path.join(__dirname, '..', plant.photo_path);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }
    if (plant.photo_thumb) {
      const thumbPath = path.join(__dirname, '..', plant.photo_thumb);
      if (fs.existsSync(thumbPath)) {
        fs.unlinkSync(thumbPath);
      }
    }

    // Clear photo from database
    db.run(`
      UPDATE plants SET
        photo_path = NULL,
        photo_thumb = NULL,
        photo_author = NULL,
        photo_source = NULL,
        photo_license = NULL,
        photo_source_url = NULL
      WHERE id = ?
    `, [plantId], function(err) {
      if (err) {
        console.error('Error clearing photo:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // Also remove the review
      db.run('DELETE FROM photo_reviews WHERE plant_id = ?', [plantId], (err) => {
        if (err) {
          console.error('Error deleting review:', err);
        }

        res.json({
          success: true,
          message: 'Photo cleared, ready for re-download'
        });
      });
    });
  });
});

module.exports = router;
