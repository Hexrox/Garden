require('dotenv').config();

// Validate environment variables before starting
const { validateOrExit } = require('./utils/envValidator');
validateOrExit();

const express = require('express');
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

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy - needed for rate limiting behind nginx/reverse proxy
// Set to true when behind nginx to properly read X-Forwarded-For header
app.set('trust proxy', true);

// HTTPS enforcement (production only)
// const httpsRedirect = require('./middleware/httpsRedirect');
// app.use(httpsRedirect);

// Security middleware with CSP
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for Tailwind
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"], // Allow images from various sources
      connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:3000"],
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
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

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
  max: 5, // 5 requests per window
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

// Apply rate limiting to all /api routes
app.use('/api', apiLimiter);
app.use('/api', mutationLimiter);

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
  console.log('');
  console.log('🌱 =======================================');
  console.log('🌱 Garden App v2.0 Backend');
  console.log('🌱 =======================================');
  console.log(`🌱 Server running on http://localhost:${PORT}`);
  console.log(`🌱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('🌱 =======================================');
  console.log('');
});

module.exports = app;
