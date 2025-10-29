/**
 * Environment variables validator
 * Ensures all required environment variables are set before the app starts
 */

const crypto = require('crypto');

// Define required environment variables with their validation rules
const ENV_REQUIREMENTS = {
  JWT_SECRET: {
    required: true,
    validate: (value) => {
      if (!value) return { valid: false, error: 'JWT_SECRET is required' };
      if (value.length < 32) {
        return {
          valid: false,
          error: 'JWT_SECRET must be at least 32 characters long for security'
        };
      }
      // Warn if using a weak/common secret
      const weakSecrets = ['secret', 'password', '123456', 'your-secret-key'];
      if (weakSecrets.includes(value.toLowerCase())) {
        return {
          valid: false,
          error: 'JWT_SECRET is too weak. Generate a strong secret using: openssl rand -base64 64'
        };
      }
      return { valid: true };
    }
  },
  JWT_EXPIRES_IN: {
    required: false,
    default: '7d',
    validate: (value) => {
      const pattern = /^\d+[dhms]$/;
      if (value && !pattern.test(value)) {
        return {
          valid: false,
          error: 'JWT_EXPIRES_IN must be in format: 7d, 24h, 60m, etc.'
        };
      }
      return { valid: true };
    }
  },
  NODE_ENV: {
    required: false,
    default: 'development',
    validate: (value) => {
      const validEnvs = ['development', 'production', 'test'];
      if (value && !validEnvs.includes(value)) {
        console.warn(`⚠️  Warning: NODE_ENV="${value}" is not standard. Expected: ${validEnvs.join(', ')}`);
      }
      return { valid: true };
    }
  },
  PORT: {
    required: false,
    default: '3001',
    validate: (value) => {
      if (value) {
        const port = parseInt(value, 10);
        if (isNaN(port) || port < 1 || port > 65535) {
          return {
            valid: false,
            error: 'PORT must be a number between 1 and 65535'
          };
        }
      }
      return { valid: true };
    }
  },
  FRONTEND_URL: {
    required: false,
    default: 'http://localhost:3000',
    validate: (value) => {
      if (value) {
        try {
          new URL(value);
        } catch (err) {
          return {
            valid: false,
            error: 'FRONTEND_URL must be a valid URL'
          };
        }
      }
      return { valid: true };
    }
  },
  OPENWEATHER_API_KEY: {
    required: false,
    validate: (value) => {
      if (!value) {
        console.warn('⚠️  Warning: OPENWEATHER_API_KEY not set. Weather features will be disabled.');
      }
      return { valid: true };
    }
  }
};

/**
 * Validates all environment variables
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateEnv() {
  const errors = [];
  const warnings = [];

  console.log('\n🔍 Validating environment variables...\n');

  for (const [key, rules] of Object.entries(ENV_REQUIREMENTS)) {
    const value = process.env[key];

    // Check if required
    if (rules.required && !value) {
      errors.push(`❌ ${key} is required but not set`);
      continue;
    }

    // Set default if not present
    if (!value && rules.default) {
      process.env[key] = rules.default;
      console.log(`✓ ${key}: Using default value "${rules.default}"`);
      continue;
    }

    // Run custom validation
    if (rules.validate && value) {
      const result = rules.validate(value);
      if (!result.valid) {
        errors.push(`❌ ${key}: ${result.error}`);
      } else {
        // Mask sensitive values in output
        const displayValue = key.includes('SECRET') || key.includes('KEY')
          ? '***' + value.slice(-4)
          : value;
        console.log(`✓ ${key}: ${displayValue}`);
      }
    } else if (value) {
      const displayValue = key.includes('SECRET') || key.includes('KEY')
        ? '***' + value.slice(-4)
        : value;
      console.log(`✓ ${key}: ${displayValue}`);
    }
  }

  console.log('');

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Generates a secure random JWT secret
 * @returns {string} Base64 encoded random bytes
 */
function generateJWTSecret() {
  return crypto.randomBytes(64).toString('base64');
}

/**
 * Main validation function to be called on app startup
 */
function validateOrExit() {
  const result = validateEnv();

  if (!result.valid) {
    console.error('❌ Environment validation failed:\n');
    result.errors.forEach(error => console.error(error));
    console.error('\n💡 Tip: Copy .env.example to .env and fill in the required values');
    console.error('💡 Generate JWT_SECRET with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'base64\'))"');
    console.error('\n');
    process.exit(1);
  }

  console.log('✅ Environment validation passed\n');
}

module.exports = {
  validateEnv,
  validateOrExit,
  generateJWTSecret
};
