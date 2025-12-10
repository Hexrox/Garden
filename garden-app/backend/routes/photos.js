const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../db');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { imageValidationMiddleware } = require('../utils/imageValidator');
const fs = require('fs');
const path = require('path');

// Get all photos for a bed
router.get('/beds/:bedId/photos', auth, (req, res) => {
  // Verify user owns this bed
  db.get(
    `SELECT b.* FROM beds b
     JOIN plots p ON b.plot_id = p.id
     WHERE b.id = ? AND p.user_id = ?`,
    [req.params.bedId, req.user.id],
    (err, bed) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      if (!bed) {
        return res.status(404).json({ error: 'Grządka nie znaleziona' });
      }

      db.all(
        `SELECT * FROM plant_photos WHERE bed_id = ? ORDER BY taken_date DESC, created_at DESC`,
        [req.params.bedId],
        (err, photos) => {
          if (err) {
            return res.status(500).json({ error: 'Błąd serwera' });
          }
          res.json(photos);
        }
      );
    }
  );
});

// Add photo to bed
router.post('/beds/:bedId/photos',
  auth,
  upload.single('photo'),
  imageValidationMiddleware,
  [
    body('caption').optional().trim().escape(),
    body('taken_date').optional().isDate()
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Zdjęcie jest wymagane' });
    }

    // Verify user owns this bed and get full bed + plot data
    db.get(
      `SELECT b.*, p.name as plot_name, p.user_id
       FROM beds b
       JOIN plots p ON b.plot_id = p.id
       WHERE b.id = ? AND p.user_id = ?`,
      [req.params.bedId, req.user.id],
      (err, bed) => {
        if (err) {
          return res.status(500).json({ error: 'Błąd serwera' });
        }
        if (!bed) {
          return res.status(404).json({ error: 'Grządka nie znaleziona' });
        }

        const { caption, taken_date, source_type } = req.body;
        // Use relative path for proper URL serving
        // Express.static serves '/uploads' -> 'backend/uploads/'
        const photoPath = `uploads/${req.file.filename}`;

        // Insert with denormalized data for gallery performance
        db.run(
          `INSERT INTO plant_photos (
            bed_id, user_id, photo_path, caption, taken_date, source_type,
            bed_row_number, bed_plant_name, bed_plant_variety, plot_name
          )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            req.params.bedId,
            req.user.id,
            photoPath,
            caption,
            taken_date || new Date().toISOString().split('T')[0],
            source_type || 'progress',
            bed.row_number,
            bed.plant_name,
            bed.plant_variety,
            bed.plot_name
          ],
          function (err) {
            if (err) {
              console.error('Error inserting photo:', err);
              return res.status(500).json({ error: 'Błąd podczas dodawania zdjęcia' });
            }

            res.status(201).json({
              message: 'Zdjęcie dodane pomyślnie',
              photo: {
                id: this.lastID,
                bed_id: req.params.bedId,
                photo_path: photoPath,
                caption,
                taken_date
              }
            });
          }
        );
      }
    );
  }
);

// Delete photo
router.delete('/photos/:id', auth, (req, res) => {
  // Verify user owns this photo's bed
  db.get(
    `SELECT pp.* FROM plant_photos pp
     JOIN beds b ON pp.bed_id = b.id
     JOIN plots p ON b.plot_id = p.id
     WHERE pp.id = ? AND p.user_id = ?`,
    [req.params.id, req.user.id],
    (err, photo) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      if (!photo) {
        return res.status(404).json({ error: 'Zdjęcie nie znalezione' });
      }

      // Delete physical file first
      const filePath = path.join(__dirname, '..', photo.photo_path);
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error deleting file:', unlinkErr);
          // Continue anyway - file might not exist
        }

        // Delete database record
        db.run(
          `DELETE FROM plant_photos WHERE id = ?`,
          [req.params.id],
          function (err) {
            if (err) {
              return res.status(500).json({ error: 'Błąd podczas usuwania' });
            }

            res.json({ message: 'Zdjęcie usunięte pomyślnie' });
          }
        );
      });
    }
  );
});

module.exports = router;
