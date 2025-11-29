const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../db');
const {
  strongPasswordValidator,
  usernameValidator,
  emailValidator
} = require('../middleware/validators');

// Register new user
router.post('/register',
  [
    usernameValidator,
    emailValidator,
    strongPasswordValidator
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, email, password } = req.body;

      // Check if user already exists
      db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], async (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Błąd serwera' });
        }

        if (user) {
          return res.status(400).json({ error: 'Użytkownik już istnieje' });
        }

        // Hash password (12 rounds for better security in 2025)
        const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

        // Create user
        db.run(
          'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
          [username, email, hashedPassword],
          function (err) {
            if (err) {
              return res.status(500).json({ error: 'Błąd podczas tworzenia użytkownika' });
            }

            // Create token (bez email dla bezpieczeństwa - PII)
            const token = jwt.sign(
              { id: this.lastID, username },
              process.env.JWT_SECRET,
              { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            res.status(201).json({
              message: 'Użytkownik utworzony pomyślnie',
              token,
              user: { id: this.lastID, username, email }
            });
          }
        );
      });
    } catch (error) {
      res.status(500).json({ error: 'Błąd serwera' });
    }
  }
);

// Login user
router.post('/login',
  [
    emailValidator,
    require('express-validator').body('password').notEmpty().withMessage('Hasło jest wymagane')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Błąd serwera' });
        }

        if (!user) {
          return res.status(401).json({ error: 'Nieprawidłowe dane logowania' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
          return res.status(401).json({ error: 'Nieprawidłowe dane logowania' });
        }

        // Update last_login timestamp and increment login_count
        db.run(
          'UPDATE users SET last_login = CURRENT_TIMESTAMP, login_count = COALESCE(login_count, 0) + 1 WHERE id = ?',
          [user.id],
          (updateErr) => {
            if (updateErr) {
              console.error('Error updating last_login/login_count:', updateErr);
              // Don't fail login if last_login update fails
            }
          }
        );

        // Create token (bez email dla bezpieczeństwa - PII)
        const token = jwt.sign(
          { id: user.id, username: user.username },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
          message: 'Zalogowano pomyślnie',
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          }
        });
      });
    } catch (error) {
      res.status(500).json({ error: 'Błąd serwera' });
    }
  }
);

// Update dark mode preference (requires auth middleware)
const auth = require('../middleware/auth');
router.put('/dark-mode', auth, (req, res) => {
  const { dark_mode } = req.body;

  db.run(
    'UPDATE users SET dark_mode = ? WHERE id = ?',
    [dark_mode ? 1 : 0, req.user.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Błąd podczas aktualizacji' });
      }

      res.json({ message: 'Preferencje zapisane', dark_mode });
    }
  );
});

// Update user profile (frost dates, hardiness zone, location)
router.put('/profile', auth, (req, res) => {
  // SECURITY: Explicit whitelist of allowed fields
  const ALLOWED_FIELDS = ['hardiness_zone', 'first_frost_date', 'last_frost_date', 'location'];

  const updateFields = [];
  const values = [];

  // Only process whitelisted fields
  ALLOWED_FIELDS.forEach(field => {
    if (req.body[field] !== undefined) {
      updateFields.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  });

  if (updateFields.length === 0) {
    return res.status(400).json({ error: 'Brak danych do aktualizacji' });
  }

  values.push(req.user.id);

  db.run(
    `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
    values,
    function (err) {
      if (err) {
        console.error('Error updating profile:', err);
        return res.status(500).json({ error: 'Błąd podczas aktualizacji profilu' });
      }

      res.json({ message: 'Profil zaktualizowany pomyślnie' });
    }
  );
});

// Get user profile
router.get('/profile', auth, (req, res) => {
  db.get(
    'SELECT id, username, email, hardiness_zone, first_frost_date, last_frost_date, location FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }

      if (!user) {
        return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
      }

      res.json(user);
    }
  );
});

module.exports = router;
