const { body } = require('express-validator');

/**
 * Strong password validator
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const strongPasswordValidator = body('password')
  .isLength({ min: 8 })
  .withMessage('Hasło musi mieć minimum 8 znaków')
  .matches(/[A-Z]/)
  .withMessage('Hasło musi zawierać przynajmniej jedną wielką literę')
  .matches(/[a-z]/)
  .withMessage('Hasło musi zawierać przynajmniej jedną małą literę')
  .matches(/[0-9]/)
  .withMessage('Hasło musi zawierać przynajmniej jedną cyfrę')
  .matches(/[@$!%*?&#^()_+\-=\[\]{}|;:,.<>~]/)
  .withMessage('Hasło musi zawierać przynajmniej jeden znak specjalny (@$!%*?&#^()_+-=[]{}|;:,.<>~)');

/**
 * Username validator
 */
const usernameValidator = body('username')
  .trim()
  .isLength({ min: 3, max: 30 })
  .withMessage('Nazwa użytkownika musi mieć 3-30 znaków')
  .matches(/^[a-zA-Z0-9_]+$/)
  .withMessage('Nazwa użytkownika może zawierać tylko litery, cyfry i podkreślnik');

/**
 * Email validator
 */
const emailValidator = body('email')
  .isEmail()
  .normalizeEmail()
  .withMessage('Nieprawidłowy adres email');

module.exports = {
  strongPasswordValidator,
  usernameValidator,
  emailValidator
};
