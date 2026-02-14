const jwt = require('jsonwebtoken');
const db = require('../db');

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Brak tokenu autoryzacji' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists and is not deleted
    db.get(
      'SELECT id FROM users WHERE id = ? AND deleted_at IS NULL',
      [decoded.id],
      (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Błąd serwera' });
        }
        if (!user) {
          return res.status(401).json({ error: 'Konto zostało usunięte' });
        }
        req.user = decoded;
        next();
      }
    );
  } catch (error) {
    res.status(401).json({ error: 'Nieprawidłowy token' });
  }
};

module.exports = auth;
