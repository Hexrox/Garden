const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../db');

// Register new user
router.post('/register',
  [
    body('username').trim().isLength({ min: 3 }).withMessage('Username musi mieć minimum 3 znaki'),
    body('email').isEmail().normalizeEmail().withMessage('Nieprawidłowy email'),
    body('password').isLength({ min: 6 }).withMessage('Hasło musi mieć minimum 6 znaków')
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

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        db.run(
          'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
          [username, email, hashedPassword],
          function (err) {
            if (err) {
              return res.status(500).json({ error: 'Błąd podczas tworzenia użytkownika' });
            }

            // Create token
            const token = jwt.sign(
              { id: this.lastID, username, email },
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
    body('email').isEmail().normalizeEmail().withMessage('Nieprawidłowy email'),
    body('password').notEmpty().withMessage('Hasło jest wymagane')
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

        // Create token
        const token = jwt.sign(
          { id: user.id, username: user.username, email: user.email },
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

module.exports = router;
