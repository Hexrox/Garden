const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult, body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const {
  strongPasswordValidator,
  usernameValidator,
  emailValidator
} = require('../middleware/validators');
const { generateSecureToken, compareTokens } = require('../utils/tokenGenerator');
const {
  sendPasswordResetEmail,
  sendEmailVerification,
  sendAccountDeletedEmail,
  sendAccountRestoredEmail,
  sendNewRegistrationNotification
} = require('../utils/emailService');

// Promisified wrappers for sqlite3 callback API
const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
});

const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) { err ? reject(err) : resolve(this); });
});

// Rate limiter for login and register (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login/register attempts per window
  message: { error: 'Zbyt wiele prób. Spróbuj ponownie za 15 minut.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Register new user
router.post('/register',
  authLimiter,
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
      const existingUser = await dbGet('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
      if (existingUser) {
        return res.status(400).json({ error: 'Użytkownik już istnieje' });
      }

      // Hash password (12 rounds for better security in 2025)
      const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

      // Create user
      const result = await dbRun(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword]
      );
      const userId = result.lastID;

      // Generate email verification token
      const emailToken = generateSecureToken(32);
      const emailExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

      // Save verification token (fire-and-forget)
      dbRun(
        'UPDATE users SET email_verification_token = ?, email_verification_expires = ? WHERE id = ?',
        [emailToken, emailExpiresAt.toISOString(), userId]
      ).then(async () => {
        try {
          const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${emailToken}`;
          const emailResult = await sendEmailVerification(email, verificationLink, username);

          if (emailResult.success) {
            console.log('✅ Verification email sent to:', email, '| Message ID:', emailResult.messageId);
          } else {
            console.error('❌ Failed to send verification email to:', email);
            console.error('Error:', emailResult.error);
            console.error('⚠️  ACTION REQUIRED: User', username, '(ID:', userId, ') created but verification email not sent');
          }
        } catch (emailSendError) {
          console.error('❌ Exception while sending verification email:', emailSendError);
          console.error('⚠️  ACTION REQUIRED: User', username, '(ID:', userId, ') created but verification email failed');
        }
      }).catch(emailErr => {
        console.error('❌ Failed to save email verification token:', emailErr);
      });

      // Fire-and-forget: powiadom admina o nowej rejestracji
      sendNewRegistrationNotification(username, email).catch(err =>
        console.error('❌ Failed to send registration notification:', err)
      );

      res.status(201).json({
        message: 'Użytkownik utworzony pomyślnie. Sprawdź swoją skrzynkę email aby zweryfikować konto.',
        requiresVerification: true,
        user: { id: userId, username, role: 'user' }
      });
    } catch (error) {
      res.status(500).json({ error: 'Błąd serwera' });
    }
  }
);

// Login user
router.post('/login',
  authLimiter,
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

      const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
      if (!user) {
        return res.status(401).json({ error: 'Nieprawidłowe dane logowania' });
      }

      // Check if account is deleted
      if (user.deleted_at) {
        return res.status(403).json({
          error: 'Konto zostało usunięte',
          message: 'To konto zostało oznaczone do usunięcia. Sprawdź swoją skrzynkę email aby je przywrócić.'
        });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Nieprawidłowe dane logowania' });
      }

      // Check if email is verified
      if (!user.email_verified) {
        return res.status(401).json({ error: 'Nieprawidłowe dane logowania' });
      }

      // Update last_login timestamp and increment login_count (fire-and-forget)
      dbRun(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP, login_count = COALESCE(login_count, 0) + 1 WHERE id = ?',
        [user.id]
      ).catch(updateErr => {
        console.error('Error updating last_login/login_count:', updateErr);
      });

      // Create token (bez email dla bezpieczeństwa - PII)
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role || 'user' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        message: 'Zalogowano pomyślnie',
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role || 'user',
          email: user.email
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Błąd serwera' });
    }
  }
);

// Update dark mode preference (requires auth middleware)
const auth = require('../middleware/auth');
router.put('/dark-mode', auth, async (req, res) => {
  try {
    const { dark_mode } = req.body;
    await dbRun('UPDATE users SET dark_mode = ? WHERE id = ?', [dark_mode ? 1 : 0, req.user.id]);
    res.json({ message: 'Preferencje zapisane', dark_mode });
  } catch (err) {
    res.status(500).json({ error: 'Błąd podczas aktualizacji' });
  }
});

// Update user profile (frost dates, hardiness zone, location)
// Handler function for both /profile and /update-profile endpoints
const updateProfileHandler = async (req, res) => {
  // SECURITY: Explicit whitelist of allowed fields
  const ALLOWED_FIELDS = [
    'hardiness_zone', 'first_frost_date', 'last_frost_date',
    'location', 'latitude', 'longitude', 'city'
  ];

  const updateFields = [];
  const values = [];

  // Only process whitelisted fields that are defined (not null/undefined)
  ALLOWED_FIELDS.forEach(field => {
    if (req.body[field] !== undefined && req.body[field] !== null) {
      updateFields.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  });

  if (updateFields.length === 0) {
    return res.status(400).json({ error: 'Brak danych do aktualizacji' });
  }

  values.push(req.user.id);

  try {
    await dbRun(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'Profil zaktualizowany pomyślnie' });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Błąd podczas aktualizacji profilu' });
  }
};

// Both endpoints use the same handler
router.put('/profile', auth, updateProfileHandler);
router.put('/update-profile', auth, updateProfileHandler); // Alias for onboarding

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await dbGet(
      'SELECT id, username, email, hardiness_zone, first_frost_date, last_frost_date, location, onboarding_completed, latitude, longitude, city, visited_calendar, welcome_card_dismissed FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Complete onboarding
router.put('/complete-onboarding', require('../middleware/auth'), async (req, res) => {
  try {
    const result = await dbRun(
      'UPDATE users SET onboarding_completed = 1, onboarding_step = 5 WHERE id = ?',
      [req.user.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    res.json({ message: 'Onboarding ukończony pomyślnie' });
  } catch (err) {
    console.error('Error completing onboarding:', err);
    res.status(500).json({ error: 'Błąd podczas aktualizacji' });
  }
});

// Dismiss welcome card
router.put('/dismiss-welcome', require('../middleware/auth'), async (req, res) => {
  try {
    await dbRun('UPDATE users SET welcome_card_dismissed = 1 WHERE id = ?', [req.user.id]);
    res.json({ message: 'OK' });
  } catch (err) {
    console.error('Error dismissing welcome card:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// ==========================================
// PASSWORD RESET
// ==========================================

// POST /auth/forgot-password - Wysłanie linku resetującego
router.post('/forgot-password',
  [emailValidator],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;

      // SECURITY: Zawsze zwróć sukces (email enumeration prevention)
      const genericResponse = {
        message: 'Jeśli adres email istnieje w systemie, wysłaliśmy link do resetowania hasła.'
      };

      // Sprawdź czy user istnieje
      const user = await dbGet('SELECT id, username, email FROM users WHERE email = ?', [email]);
      if (!user) {
        return res.json(genericResponse);
      }

      // Generuj token
      const token = generateSecureToken(32); // 64 hex chars
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

      // Zapisz token w bazie
      await dbRun(
        `UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?`,
        [token, expiresAt.toISOString(), user.id]
      );

      // Zapisz w historii (fire-and-forget)
      dbRun(
        `INSERT INTO password_reset_tokens
         (user_id, token, expires_at, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?)`,
        [user.id, token, expiresAt.toISOString(), req.ip, req.get('user-agent')]
      ).catch(() => {});

      // Wyślij email
      try {
        const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
        const result = await sendPasswordResetEmail(user.email, resetLink);

        if (result.success) {
          console.log('✅ Password reset email sent to:', user.email, '| Message ID:', result.messageId);
        } else {
          console.error('❌ Failed to send password reset email to:', user.email);
          console.error('Error:', result.error);
        }
      } catch (emailError) {
        console.error('❌ Exception while sending password reset email:', emailError);
      }

      // Always return generic response for security
      res.json(genericResponse);
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Błąd serwera' });
    }
  }
);

// GET /auth/verify-reset-token/:token - Sprawdzenie ważności tokenu
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Validate token length (64 hex chars = 32 bytes)
    if (!token || token.length !== 64 || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({ error: 'Nieprawidłowy format tokenu' });
    }

    const user = await dbGet(
      `SELECT id, password_reset_expires FROM users WHERE password_reset_token = ?`,
      [token]
    );

    if (!user) {
      return res.status(404).json({ error: 'Token nie znaleziony' });
    }

    // Sprawdź expiry
    const expiresAt = new Date(user.password_reset_expires);
    if (expiresAt < new Date()) {
      return res.status(400).json({ error: 'Token wygasł' });
    }

    res.json({ valid: true });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// POST /auth/reset-password - Reset hasła z tokenem
router.post('/reset-password',
  [
    body('token').notEmpty().withMessage('Token jest wymagany'),
    strongPasswordValidator
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { token, password } = req.body;

      // Validate token length (64 hex chars = 32 bytes)
      if (!token || token.length !== 64 || !/^[a-f0-9]{64}$/i.test(token)) {
        return res.status(400).json({ error: 'Nieprawidłowy format tokenu' });
      }

      // Znajdź usera z tym tokenem
      const user = await dbGet(
        `SELECT id, password_reset_token, password_reset_expires FROM users WHERE password_reset_token = ?`,
        [token]
      );

      if (!user) {
        return res.status(404).json({ error: 'Nieprawidłowy token' });
      }

      // Timing-safe porównanie tokenów
      if (!compareTokens(user.password_reset_token, token)) {
        return res.status(400).json({ error: 'Nieprawidłowy token' });
      }

      // Sprawdź expiry
      const expiresAt = new Date(user.password_reset_expires);
      if (expiresAt < new Date()) {
        return res.status(400).json({ error: 'Token wygasł. Poproś o nowy link.' });
      }

      // Hash nowego hasła
      const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

      // Aktualizuj hasło i usuń token
      await dbRun(
        `UPDATE users
         SET password = ?,
             password_reset_token = NULL,
             password_reset_expires = NULL
         WHERE id = ?`,
        [hashedPassword, user.id]
      );

      // Oznacz token jako użyty w historii (fire-and-forget)
      dbRun(
        `UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE token = ?`,
        [token]
      ).catch(() => {});

      res.json({ message: 'Hasło zostało zmienione pomyślnie' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Błąd serwera' });
    }
  }
);

// ==========================================
// EMAIL VERIFICATION
// ==========================================

// GET /auth/verify-email/:token - Weryfikacja emaila
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Validate token length (64 hex chars = 32 bytes)
    if (!token || token.length !== 64 || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({ error: 'Nieprawidłowy format tokenu' });
    }

    const user = await dbGet(
      `SELECT id, email_verification_token, email_verification_expires, username
       FROM users WHERE email_verification_token = ?`,
      [token]
    );

    if (!user) {
      return res.status(404).json({ error: 'Token nie znaleziony' });
    }

    // Timing-safe porównanie tokenów
    if (!compareTokens(user.email_verification_token, token)) {
      return res.status(400).json({ error: 'Nieprawidłowy token' });
    }

    // Sprawdź expiry
    const expiresAt = new Date(user.email_verification_expires);
    if (expiresAt < new Date()) {
      return res.status(400).json({ error: 'Token wygasł. Wyślij ponownie email weryfikacyjny.' });
    }

    // Oznacz email jako zweryfikowany
    await dbRun(
      `UPDATE users
       SET email_verified = 1,
           email_verification_token = NULL,
           email_verification_expires = NULL
       WHERE id = ?`,
      [user.id]
    );

    res.json({
      message: 'Email zweryfikowany pomyślnie!',
      username: user.username
    });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// POST /auth/resend-verification - Ponowne wysłanie emaila weryfikacyjnego
router.post('/resend-verification',
  auth,
  async (req, res) => {
    try {
      const userId = req.user.id;

      // Sprawdź czy już zweryfikowany
      const user = await dbGet('SELECT email_verified, email, username FROM users WHERE id = ?', [userId]);

      if (user.email_verified) {
        return res.status(400).json({ error: 'Email jest już zweryfikowany' });
      }

      // Generuj nowy token
      const token = generateSecureToken(32);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Zapisz
      await dbRun(
        `UPDATE users SET email_verification_token = ?, email_verification_expires = ? WHERE id = ?`,
        [token, expiresAt.toISOString(), userId]
      );

      // Wyślij email
      const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${token}`;
      await sendEmailVerification(user.email, verificationLink, user.username);

      res.json({ message: 'Email weryfikacyjny został wysłany ponownie' });
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({ error: 'Błąd serwera' });
    }
  }
);

// ==========================================
// ACCOUNT DELETION & RESTORE
// ==========================================

// DELETE /auth/account - Usuń konto (soft delete)
router.delete('/account', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { reason } = req.body; // Opcjonalny powód

    // Pobierz dane usera
    const user = await dbGet('SELECT username, email FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    // Generuj restore token
    const restoreToken = generateSecureToken(32);
    const permanentDeleteAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dni

    // Zapisz w deleted_accounts
    await dbRun(
      `INSERT INTO deleted_accounts
       (user_id, username, email, deletion_reason, restore_token, permanent_delete_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, user.username, user.email, reason, restoreToken, permanentDeleteAt.toISOString()]
    );

    // Soft delete - ustaw deleted_at
    await dbRun(
      `UPDATE users
       SET deleted_at = CURRENT_TIMESTAMP,
           deletion_scheduled_for = ?
       WHERE id = ?`,
      [permanentDeleteAt.toISOString(), userId]
    );

    // Wyślij email (fire-and-forget)
    try {
      const restoreLink = `${process.env.FRONTEND_URL}/restore-account/${restoreToken}`;
      const deleteDate = new Date(permanentDeleteAt).toLocaleDateString('pl-PL');
      const result = await sendAccountDeletedEmail(user.email, restoreLink, user.username, deleteDate);

      if (result.success) {
        console.log('✅ Account deletion email sent to:', user.email, '| Message ID:', result.messageId);
      } else {
        console.error('❌ Failed to send account deletion email to:', user.email);
        console.error('Error:', result.error);
        console.error('⚠️  ACTION REQUIRED: User', user.username, 'deleted but email not sent. Restore token:', restoreToken);
      }
    } catch (emailError) {
      console.error('❌ Exception while sending account deletion email:', emailError);
      console.error('⚠️  ACTION REQUIRED: User', user.username, 'deleted but email failed. Restore token:', restoreToken);
    }

    res.json({
      message: 'Konto zostało oznaczone do usunięcia',
      restoreDeadline: permanentDeleteAt
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// POST /auth/account/restore - Przywróć konto
router.post('/account/restore', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token jest wymagany' });
    }

    // Validate token length (64 hex chars = 32 bytes)
    if (token.length !== 64 || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({ error: 'Nieprawidłowy format tokenu' });
    }

    // Znajdź w deleted_accounts
    const deletedAccount = await dbGet(
      `SELECT user_id, username, email, permanent_delete_at, restored_at, restore_token
       FROM deleted_accounts WHERE restore_token = ?`,
      [token]
    );

    if (!deletedAccount) {
      return res.status(404).json({ error: 'Token nie znaleziony' });
    }

    // Timing-safe porównanie tokenów
    if (!compareTokens(deletedAccount.restore_token, token)) {
      return res.status(400).json({ error: 'Nieprawidłowy token' });
    }

    // Sprawdź czy już przywrócone
    if (deletedAccount.restored_at) {
      return res.status(400).json({ error: 'Konto zostało już przywrócone' });
    }

    // Sprawdź czy nie minął termin
    const deleteDeadline = new Date(deletedAccount.permanent_delete_at);
    if (deleteDeadline < new Date()) {
      return res.status(400).json({ error: 'Termin przywrócenia konta minął. Konto zostało usunięte.' });
    }

    // Przywróć konto - usuń deleted_at
    await dbRun(
      `UPDATE users SET deleted_at = NULL, deletion_scheduled_for = NULL WHERE id = ?`,
      [deletedAccount.user_id]
    );

    // Oznacz jako restored w archiwum (fire-and-forget)
    dbRun(
      `UPDATE deleted_accounts SET restored_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
      [deletedAccount.user_id]
    ).catch(() => {});

    // Wyślij email
    try {
      const result = await sendAccountRestoredEmail(deletedAccount.email, deletedAccount.username);

      if (result.success) {
        console.log('✅ Account restored email sent to:', deletedAccount.email, '| Message ID:', result.messageId);
      } else {
        console.error('❌ Failed to send account restored email to:', deletedAccount.email);
        console.error('Error:', result.error);
      }
    } catch (emailError) {
      console.error('❌ Exception while sending account restored email:', emailError);
    }

    // Generuj JWT dla auto-login
    const jwtToken = jwt.sign(
      { id: deletedAccount.user_id, username: deletedAccount.username, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Konto zostało przywrócone pomyślnie!',
      token: jwtToken,
      user: {
        id: deletedAccount.user_id,
        username: deletedAccount.username,
        email: deletedAccount.email
      }
    });
  } catch (error) {
    console.error('Restore account error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// ==========================================
// GET CURRENT USER
// ==========================================

// GET /auth/me - Get current user data (requires auth)
router.get('/me', auth, async (req, res) => {
  try {
    const user = await dbGet(
      `SELECT id, username, email, email_verified, role, created_at,
              hardiness_zone, first_frost_date, last_frost_date,
              location, latitude, longitude, city, dark_mode,
              public_profile_enabled, public_bio, public_username,
              public_display_name, profile_photo, onboarding_completed
       FROM users
       WHERE id = ? AND deleted_at IS NULL`,
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    // Convert SQLite boolean (0/1) to JavaScript boolean
    user.email_verified = Boolean(user.email_verified);
    user.dark_mode = Boolean(user.dark_mode);
    user.public_profile_enabled = Boolean(user.public_profile_enabled);
    user.onboarding_completed = Boolean(user.onboarding_completed);

    res.json({ user });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

module.exports = router;
