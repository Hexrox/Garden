require('dotenv').config();
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

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
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

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: { error: 'Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.' },
  standardHeaders: true,
  legacyHeaders: false
});

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
