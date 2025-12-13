const crypto = require('crypto');

/**
 * Generuje bezpieczny token używając crypto.randomBytes
 * @param {number} length - Długość w bajtach (domyślnie 32 = 64 hex chars)
 * @returns {string} - Hex token
 */
function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Porównuje tokeny w sposób bezpieczny czasowo (timing-safe)
 * @param {string} a - Pierwszy token
 * @param {string} b - Drugi token
 * @returns {boolean} - Czy tokeny są identyczne
 */
function compareTokens(a, b) {
  if (!a || !b || a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(a, 'utf8'),
    Buffer.from(b, 'utf8')
  );
}

module.exports = {
  generateSecureToken,
  compareTokens
};
