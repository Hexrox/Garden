require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

// Import routes
const authRoutes = require('./routes/auth');
const plotRoutes = require('./routes/plots');
const bedRoutes = require('./routes/beds');
const sprayRoutes = require('./routes/sprays');
const reminderRoutes = require('./routes/reminders');
const exportRoutes = require('./routes/export');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Garden App API v2.0',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', plotRoutes);
app.use('/api', bedRoutes);
app.use('/api', sprayRoutes);
app.use('/api', reminderRoutes);
app.use('/api', exportRoutes);

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
