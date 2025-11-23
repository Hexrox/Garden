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

/**
 * Text field validators with max length (SECURITY: prevent DoS)
 */
const nameValidator = body('name')
  .optional()
  .trim()
  .isLength({ max: 200 })
  .withMessage('Nazwa nie może przekraczać 200 znaków');

const descriptionValidator = body('description')
  .optional()
  .trim()
  .isLength({ max: 5000 })
  .withMessage('Opis nie może przekraczać 5000 znaków');

const noteValidator = body('note')
  .optional()
  .trim()
  .isLength({ max: 2000 })
  .withMessage('Notatka nie może przekraczać 2000 znaków');

const captionValidator = body('caption')
  .optional()
  .trim()
  .isLength({ max: 500 })
  .withMessage('Podpis nie może przekraczać 500 znaków');

module.exports = {
  strongPasswordValidator,
  usernameValidator,
  emailValidator,
  nameValidator,
  descriptionValidator,
  noteValidator,
  captionValidator
};
