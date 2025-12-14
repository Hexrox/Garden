require('dotenv').config();

// Validate environment variables before starting
const { validateOrExit } = require('./utils/envValidator');
validateOrExit();

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const db = require('./db');

// Import routes
const authRoutes = require('./routes/auth');
const plotRoutes = require('./routes/plots');
const bedRoutes = require('./routes/beds');
const sprayRoutes = require('./routes/sprays');
const reminderRoutes = require('./routes/reminders');
const exportRoutes = require('./routes/export');
const weatherRoutes = require('./routes/weather');
const taskRoutes = require('./routes/tasks');
const harvestRoutes = require('./routes/harvest');
const plantsRoutes = require('./routes/plants');
const photosRoutes = require('./routes/photos');
const successionRoutes = require('./routes/succession');
const analyticsRoutes = require('./routes/analytics');
const calendarRoutes = require('./routes/calendar');
const adminRoutes = require('./routes/admin');
const galleryRoutes = require('./routes/gallery');
const publicProfileRoutes = require('./routes/publicProfile');
const searchRoutes = require('./routes/search');
const templateRoutes = require('./routes/templates');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy - needed for rate limiting behind nginx/reverse proxy
// Set to 1 to trust first proxy (nginx) for X-Forwarded-For header
app.set('trust proxy', 1);

// HTTPS enforcement handled by nginx reverse proxy
// No need to enforce here as backend is only accessible via nginx

// Security middleware with CSP
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for Tailwind
      scriptSrc: ["'self'"],
      // SECURITY: Restricted to trusted domains only (was: all HTTPS)
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://openweathermap.org"  // Weather API images
      ],
      connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:3000", "https://api.openweathermap.org"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
}));

// Compression middleware
app.use(compression());

// CORS configuration
// Support multiple domains (comma-separated in FRONTEND_URL)
// Example: FRONTEND_URL=https://gardenapp.pl,https://www.gardenapp.pl
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    // Pozwól na brak origin (same-origin requests, service workers)
    // CSRF protection zapewnia header X-Requested-With
    if (!origin) {
      return callback(null, true);
    }

    // Sprawdź czy origin jest w allowlist
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS: Blocked request from origin: ${origin}`);
      console.warn(`CORS: Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CSRF Protection - wymaga custom header
app.use((req, res, next) => {
  // Pomiń GET requests i public endpoints
  if (req.method === 'GET' || req.path.startsWith('/api/calendar/moon') || req.path.startsWith('/api/g/')) {
    return next();
  }

  // Pomiń auth endpoints (login/register)
  if (req.path === '/api/auth/login' || req.path === '/api/auth/register') {
    return next();
  }

  // Sprawdź custom header dla wszystkich mutating requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const csrfHeader = req.headers['x-requested-with'];

    if (csrfHeader !== 'XMLHttpRequest') {
      console.warn(`CSRF: Blocked ${req.method} request to ${req.path} - missing/invalid X-Requested-With header`);
      return res.status(403).json({ error: 'CSRF validation failed' });
    }
  }

  next();
});

// Static files for uploads (use absolute path)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiters configuration
// General API rate limiter (per IP)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window per IP
  message: { error: 'Zbyt wiele żądań. Spróbuj ponownie za 15 minut.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health' // Skip health check
});

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window (increased for UX)
  message: { error: 'Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Moderate rate limiting for mutations (POST, PUT, DELETE)
const mutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 mutations per window
  message: { error: 'Zbyt wiele operacji. Spróbuj ponownie za chwilę.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET' // Only apply to mutations
});

// Public endpoints limiter (moon phases, etc.) - strict to prevent DoS
const publicLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: { error: 'Zbyt wiele żądań. Spróbuj ponownie za minutę.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Password reset rate limiter - max 3 próby na godzinę
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1h
  max: 3,
  message: { error: 'Zbyt wiele prób resetowania hasła. Spróbuj ponownie za godzinę.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development'
});

// Email verification rate limiter - max 5 prób na godzinę
const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1h
  max: 5,
  message: { error: 'Zbyt wiele prób weryfikacji email. Spróbuj ponownie za godzinę.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all /api routes
app.use('/api', apiLimiter);
app.use('/api', mutationLimiter);

// Stricter rate limiting for public profiles (prevent scraping)
app.use('/api/g', publicLimiter);

// Apply security rate limiters to specific endpoints
app.use('/api/auth/forgot-password', passwordResetLimiter);
app.use('/api/auth/reset-password', passwordResetLimiter);
app.use('/api/auth/resend-verification', emailVerificationLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Garden App API v2.0',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', plotRoutes);
app.use('/api', bedRoutes);
app.use('/api', sprayRoutes);
app.use('/api', reminderRoutes);
app.use('/api', exportRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/harvest', harvestRoutes);
app.use('/api/plants', plantsRoutes);
app.use('/api', photosRoutes);
app.use('/api/succession', successionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/search', searchRoutes);
app.use('/api', publicProfileRoutes);
app.use('/api/templates', templateRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint nie znaleziony' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Błąd serwera',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  // Display correct URL based on environment
  const serverUrl = process.env.NODE_ENV === 'production'
    ? 'https://gardenapp.pl'
    : `http://localhost:${PORT}`;

  console.log('');
  console.log('🌱 =======================================');
  console.log('🌱 Garden App v2.0 Backend');
  console.log('🌱 =======================================');
  console.log(`🌱 Server running on ${serverUrl}`);
  console.log(`🌱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌱 CORS allowed origins: ${allowedOrigins.join(', ')}`);
  console.log('🌱 =======================================');
  console.log('');
});

module.exports = app;
