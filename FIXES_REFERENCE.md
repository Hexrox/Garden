# Quick Fix Reference - Line-by-Line

## 🔴 CRITICAL FIXES - Exact file locations

### 1. Frontend - Missing Components

#### Create: `garden-app/frontend/src/pages/PlotForm.js`
```jsx
// New file - doesn't exist yet
// Purpose: Add/Edit plot form
// Route: /plots/new and /plots/:id/edit
// Fields: name, description, image upload
```

#### Create: `garden-app/frontend/src/pages/SprayForm.js`
```jsx
// New file - doesn't exist yet
// Purpose: Add spray to bed
// Route: /beds/:bedId/spray
// Fields: spray_name, spray_date, withdrawal_period, etc.
```

#### Update: `garden-app/frontend/src/App.js`
**Add these routes after line 82:**
```jsx
<Route
  path="/plots/new"
  element={
    <ProtectedRoute>
      <PlotForm />
    </ProtectedRoute>
  }
/>
<Route
  path="/plots/:id/edit"
  element={
    <ProtectedRoute>
      <PlotForm />
    </ProtectedRoute>
  }
/>
<Route
  path="/beds/:bedId/spray"
  element={
    <ProtectedRoute>
      <SprayForm />
    </ProtectedRoute>
  }
/>
```

**Add imports at top:**
```jsx
import PlotForm from './pages/PlotForm';
import SprayForm from './pages/SprayForm';
```

---

### 2. Hardcoded URLs

#### File: `garden-app/frontend/src/pages/PlotsList.js`
**Line 68:**
```jsx
// BEFORE:
src={`http://localhost:3001/${plot.image_path}`}

// AFTER:
src={`/${plot.image_path}`}
// Or use: src={plot.image_path ? `${process.env.REACT_APP_API_URL || ''}/${plot.image_path}` : '/placeholder.jpg'}
```

#### File: `garden-app/frontend/src/pages/Export.js`
**Line 5:**
```jsx
// BEFORE:
window.open(`http://localhost:3001/api/export/${endpoint}`, '_blank');

// AFTER:
window.open(`/api/export/${endpoint}`, '_blank');
// Or use axios download
```

#### Create: `garden-app/frontend/.env`
```
REACT_APP_API_URL=http://localhost:3001
```

#### Create: `garden-app/frontend/.env.production`
```
REACT_APP_API_URL=https://your-production-api.com
```

---

### 3. JWT Secret

#### File: `garden-app/backend/.env`
**Lines 1-4:**
```bash
# BEFORE:
PORT=3001
JWT_SECRET=garden-app-super-secret-jwt-key-2024  # WEAK!
JWT_EXPIRES_IN=7d
NODE_ENV=development

# AFTER:
PORT=3001
# Generate with: openssl rand -base64 64
JWT_SECRET=VGhpc0lzQVN1cGVyU3Ryb25nU2VjcmV0S2V5VGhhdFNob3VsZEJlQ2hhbmdlZEluUHJvZHVjdGlvbkFuZEtlcHRTZWNyZXQ=
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

---

### 4. Error Boundary

#### Create: `garden-app/frontend/src/components/ErrorBoundary.js`
```jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Coś poszło nie tak</h1>
            <p className="text-gray-700 mb-4">Wystąpił nieoczekiwany błąd.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Odśwież stronę
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

#### Update: `garden-app/frontend/src/App.js`
**Wrap entire app (around line 116):**
```jsx
// Add import
import ErrorBoundary from './components/ErrorBoundary';

// BEFORE:
function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

// AFTER:
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ErrorBoundary>
  );
}
```

---

### 5. Axios Interceptors

#### File: `garden-app/frontend/src/context/AuthContext.js`
**Add after line 23 (in useEffect):**
```jsx
useEffect(() => {
  if (token) {
    // Existing code...
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    // ... existing user decode ...

    // ADD THIS - Axios interceptor for 401
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.log('Token expired, logging out...');
          logout();
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptor on unmount
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }
  setLoading(false);
}, [token]);
```

---

## 🟠 HIGH PRIORITY FIXES

### 6. Rate Limiting

#### File: `garden-app/backend/package.json`
**Add dependency:**
```json
{
  "dependencies": {
    // ... existing deps ...
    "express-rate-limit": "^6.7.0"
  }
}
```

Run: `cd backend && npm install`

#### File: `garden-app/backend/index.js`
**After line 3 (imports):**
```javascript
const rateLimit = require('express-rate-limit');

// After line 20 (before routes):
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Zbyt wiele prób logowania, spróbuj ponownie za 15 minut'
});

// Apply to auth routes
app.use('/api/auth', authLimiter, authRoutes);
```

**Update line 35:**
```javascript
// BEFORE:
app.use('/api/auth', authRoutes);

// AFTER:
// (already added above)
```

---

### 7. Helmet.js

#### File: `garden-app/backend/package.json`
**Add dependency:**
```json
{
  "dependencies": {
    // ... existing deps ...
    "helmet": "^7.0.0"
  }
}
```

Run: `cd backend && npm install`

#### File: `garden-app/backend/index.js`
**After line 2:**
```javascript
const helmet = require('helmet');
```

**After line 17 (Middleware section):**
```javascript
// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
```

---

### 8. CORS Fix

#### File: `garden-app/backend/index.js`
**Line 18:**
```javascript
// BEFORE:
app.use(cors());

// AFTER:
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

#### File: `garden-app/backend/.env`
**Add:**
```
FRONTEND_URL=http://localhost:3000
```

---

### 9. Input Sanitization

#### File: `garden-app/backend/routes/auth.js`
**Line 14-16 (and similar in all routes):**
```javascript
// BEFORE:
body('username').trim().isLength({ min: 3 }),
body('email').isEmail().normalizeEmail(),

// AFTER:
body('username').trim().isLength({ min: 3 }).escape(),
body('email').isEmail().normalizeEmail().escape(),
```

**Repeat for all routes with string inputs:**
- `routes/plots.js` - name, description
- `routes/beds.js` - plant_name, note
- `routes/sprays.js` - spray_name, note

---

### 10. Date Validation (Frontend)

#### Create: `garden-app/frontend/src/utils/dateValidation.js`
```javascript
export const validateSprayDate = (date) => {
  const sprayDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (sprayDate > today) {
    return 'Data oprysku nie może być w przyszłości';
  }

  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  if (sprayDate < yearAgo) {
    return 'Data oprysku nie może być starsza niż rok';
  }

  return null; // valid
};

export const validatePlantedDate = (date) => {
  const plantedDate = new Date(date);
  const today = new Date();

  if (plantedDate > today) {
    return 'Data posadzenia nie może być w przyszłości';
  }

  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  if (plantedDate < twoYearsAgo) {
    return 'Data posadzenia wydaje się zbyt stara';
  }

  return null; // valid
};

export const validateWithdrawalPeriod = (days) => {
  const period = parseInt(days);

  if (period < 0) {
    return 'Okres karencji nie może być ujemny';
  }

  if (period > 365) {
    return 'Okres karencji nie może przekraczać 365 dni';
  }

  return null; // valid
};
```

Use in forms with error state.

---

## 🟡 MEDIUM PRIORITY FIXES

### 11. Pagination

#### File: `garden-app/backend/routes/plots.js`
**Update GET /plots endpoint (line 9):**
```javascript
// BEFORE:
router.get('/plots', auth, (req, res) => {
  db.all('SELECT * FROM plots WHERE user_id = ? ORDER BY created_at DESC', [req.user.id], (err, rows) => {

// AFTER:
router.get('/plots', auth, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Get total count
  db.get('SELECT COUNT(*) as total FROM plots WHERE user_id = ?', [req.user.id], (err, countResult) => {
    if (err) return res.status(500).json({ error: 'Błąd serwera' });

    // Get paginated data
    db.all(
      'SELECT * FROM plots WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [req.user.id, limit, offset],
      (err, rows) => {
        if (err) return res.status(500).json({ error: 'Błąd serwera' });

        res.json({
          plots: rows,
          pagination: {
            page,
            limit,
            total: countResult.total,
            totalPages: Math.ceil(countResult.total / limit)
          }
        });
      }
    );
  });
});
```

#### Frontend pagination component needed - create separate component.

---

### 12. Database Indexes

#### File: `garden-app/backend/db.js`
**After line 68 (after all CREATE TABLE):**
```javascript
  // Create indexes for better query performance
  db.run('CREATE INDEX IF NOT EXISTS idx_plots_user_id ON plots(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_beds_plot_id ON beds(plot_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_spray_bed_id ON spray_history(bed_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_reminders_spray_id ON reminders(spray_id)');

  console.log('✅ Database indexes created successfully');
```

---

### 13. Compression

#### File: `garden-app/backend/package.json`
**Add dependency:**
```json
{
  "dependencies": {
    // ... existing deps ...
    "compression": "^1.7.4"
  }
}
```

#### File: `garden-app/backend/index.js`
**After line 2:**
```javascript
const compression = require('compression');
```

**After line 18:**
```javascript
app.use(compression());
```

---

### 14. Fix N+1 Query

#### File: `garden-app/backend/routes/plots.js`
**Replace lines 43-72 with:**
```javascript
router.get('/plots/:id/details', auth, (req, res) => {
  const plotId = req.params.id;

  // Single optimized query with JOINs
  const query = `
    SELECT
      p.*,
      b.id as bed_id,
      b.row_number,
      b.plant_name,
      b.plant_variety,
      b.planted_date,
      b.note as bed_note,
      b.image_path as bed_image,
      b.created_at as bed_created,
      sh.id as spray_id,
      sh.spray_name,
      sh.spray_type,
      sh.spray_date,
      sh.withdrawal_period,
      sh.safe_harvest_date,
      sh.dosage,
      sh.weather_conditions,
      sh.note as spray_note
    FROM plots p
    LEFT JOIN beds b ON p.id = b.plot_id
    LEFT JOIN spray_history sh ON b.id = sh.bed_id
    WHERE p.id = ? AND p.user_id = ?
    ORDER BY b.row_number, sh.spray_date DESC
  `;

  db.all(query, [plotId, req.user.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Błąd serwera' });
    }

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Poletko nie znalezione' });
    }

    // Transform flat rows into nested structure
    const plot = {
      id: rows[0].id,
      user_id: rows[0].user_id,
      name: rows[0].name,
      description: rows[0].description,
      image_path: rows[0].image_path,
      created_at: rows[0].created_at,
      beds: []
    };

    const bedsMap = new Map();

    rows.forEach(row => {
      if (row.bed_id && !bedsMap.has(row.bed_id)) {
        bedsMap.set(row.bed_id, {
          id: row.bed_id,
          plot_id: plotId,
          row_number: row.row_number,
          plant_name: row.plant_name,
          plant_variety: row.plant_variety,
          planted_date: row.planted_date,
          note: row.bed_note,
          image_path: row.bed_image,
          created_at: row.bed_created,
          sprays: []
        });
      }

      if (row.spray_id) {
        const bed = bedsMap.get(row.bed_id);
        bed.sprays.push({
          id: row.spray_id,
          bed_id: row.bed_id,
          spray_name: row.spray_name,
          spray_type: row.spray_type,
          spray_date: row.spray_date,
          withdrawal_period: row.withdrawal_period,
          safe_harvest_date: row.safe_harvest_date,
          dosage: row.dosage,
          weather_conditions: row.weather_conditions,
          note: row.spray_note
        });
      }
    });

    plot.beds = Array.from(bedsMap.values());
    res.json(plot);
  });
});
```

---

### 15. Old File Cleanup

#### Create: `garden-app/backend/utils/fileCleanup.js`
```javascript
const fs = require('fs');
const path = require('path');

const deleteFile = (filePath) => {
  if (!filePath) return;

  const fullPath = path.join(__dirname, '..', filePath);

  fs.unlink(fullPath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error('Error deleting file:', err);
    }
  });
};

module.exports = { deleteFile };
```

#### Use in `routes/plots.js` PUT endpoint:
```javascript
const { deleteFile } = require('../utils/fileCleanup');

// In PUT /plots/:id, before saving new image:
if (imagePath !== undefined && imagePath) {
  // Get old image path
  db.get('SELECT image_path FROM plots WHERE id = ?', [req.params.id], (err, plot) => {
    if (!err && plot && plot.image_path) {
      deleteFile(plot.image_path);
    }
  });
}
```

---

## Summary

**Files to create:** 4 new files
**Files to modify:** 11 existing files
**npm packages to install:** 3 (express-rate-limit, helmet, compression)
**Estimated time:** 6-8 hours for all critical and high priority fixes

**Order of fixes:**
1. Missing components (PlotForm, SprayForm) - 2 hours
2. Hardcoded URLs - 15 minutes
3. JWT Secret - 5 minutes
4. Error Boundary - 30 minutes
5. Axios interceptors - 20 minutes
6. Rate limiting - 20 minutes
7. Helmet - 10 minutes
8. CORS - 10 minutes
9. Input sanitization - 30 minutes
10. Date validation - 45 minutes

---

**Last updated:** 2025-10-24
