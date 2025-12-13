const db = require('../db');

/**
 * Middleware sprawdzający czy użytkownik ma zweryfikowany email
 * Używać TYLKO na endpointach gdzie weryfikacja jest wymagana
 */
function requireEmailVerified(req, res, next) {
  const userId = req.user.id;

  db.get(
    'SELECT email_verified FROM users WHERE id = ?',
    [userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }

      if (!user) {
        return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
      }

      if (!user.email_verified) {
        return res.status(403).json({
          error: 'Email nie zweryfikowany',
          message: 'Musisz potwierdzić swój adres email aby korzystać z tej funkcji'
        });
      }

      next();
    }
  );
}

module.exports = requireEmailVerified;
