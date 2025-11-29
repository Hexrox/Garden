/**
 * Query Builder Utilities
 * Bezpieczne budowanie dynamicznych zapytań SQL
 */

/**
 * Buduje bezpieczne UPDATE query z whitelist validation
 * @param {string} tableName - Nazwa tabeli
 * @param {Object} allowedFields - Mapowanie: { reqField: 'db_column' }
 * @param {Object} reqBody - Request body z danymi
 * @returns {Object} { sql, values }
 */
function buildUpdateQuery(tableName, allowedFields, reqBody) {
  const updates = [];
  const values = [];

  // Strict whitelist validation
  Object.keys(reqBody).forEach(field => {
    if (allowedFields[field]) {
      const dbColumn = allowedFields[field];

      // Dodatkowa walidacja nazwy kolumny (tylko alfanumeryczne + underscore)
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(dbColumn)) {
        throw new Error(`Invalid column name: ${dbColumn}`);
      }

      updates.push(`${dbColumn} = ?`);
      values.push(reqBody[field]);
    }
  });

  if (updates.length === 0) {
    throw new Error('No valid fields to update');
  }

  return {
    sql: `UPDATE ${tableName} SET ${updates.join(', ')}`,
    values
  };
}

/**
 * Walidacja długości stringa
 * @param {string} value - Wartość do walidacji
 * @param {number} maxLength - Maksymalna długość
 * @param {string} fieldName - Nazwa pola (do error message)
 */
function validateStringLength(value, maxLength, fieldName) {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }

  if (value.length > maxLength) {
    throw new Error(`${fieldName} cannot exceed ${maxLength} characters`);
  }

  return value.trim();
}

/**
 * Walidacja liczby całkowitej
 * @param {*} value - Wartość do walidacji
 * @param {number} min - Minimalna wartość
 * @param {number} max - Maksymalna wartość
 * @param {string} fieldName - Nazwa pola
 */
function validateInteger(value, min, max, fieldName) {
  const num = parseInt(value);

  if (isNaN(num)) {
    throw new Error(`${fieldName} must be a valid integer`);
  }

  if (num < min || num > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max}`);
  }

  return num;
}

/**
 * Sanityzuje nazwę pliku
 * @param {string} filename - Oryginalna nazwa pliku
 * @returns {string} Bezpieczna nazwa
 */
function sanitizeFilename(filename) {
  // Usuń wszystko poza alfanumerycznymi, kropką, myślnikiem, podkreśleniem
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

module.exports = {
  buildUpdateQuery,
  validateStringLength,
  validateInteger,
  sanitizeFilename
};
