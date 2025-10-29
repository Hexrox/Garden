# Garden App v2.0 - TODO List

## 🔥 CRITICAL - DO IMMEDIATELY

- [ ] **Create PlotForm.js component**
  - Support both create and edit modes
  - Handle image upload
  - File: `frontend/src/pages/PlotForm.js`
  - Add route in App.js: `/plots/new` and `/plots/:id/edit`

- [ ] **Create SprayForm.js component**
  - Add spray to specific bed
  - Calculate safe harvest date in real-time
  - File: `frontend/src/pages/SprayForm.js`
  - Add route in App.js: `/beds/:id/spray`

- [ ] **Fix hardcoded URLs**
  - Create `API_BASE_URL` constant
  - Replace in: PlotsList.js:68, Export.js:5
  - Use environment variable or relative path

- [ ] **Change JWT_SECRET**
  - Generate: `openssl rand -base64 64`
  - Update .env
  - Add warning in README about changing it

---

## 🚨 HIGH PRIORITY - SECURITY & CRITICAL BUGS

- [ ] **Add Error Boundary**
  - Create ErrorBoundary component
  - Wrap App in ErrorBoundary
  - Display friendly error message

- [ ] **Add Axios interceptors**
  - Handle 401 globally
  - Auto-logout on token expiration
  - Add to AuthContext.js

- [ ] **Add rate limiting**
  - Install `express-rate-limit`
  - Apply to /auth/* endpoints
  - 5 requests per 15 minutes for login

- [ ] **Add helmet.js**
  - Install: `npm install helmet`
  - Add: `app.use(helmet())`
  - Configure CSP

- [ ] **Fix CORS configuration**
  - Specify allowed origin
  - Enable credentials
  - Don't allow all origins in production

- [ ] **Add input sanitization**
  - Use `.escape()` in validators
  - Prevent XSS attacks
  - All text inputs

---

## ⚠️ MEDIUM PRIORITY - BUGS & IMPROVEMENTS

- [ ] **Add date validation in forms**
  - Spray date can't be in future
  - Planted date can't be > 1 year ago
  - Withdrawal period max 365 days

- [ ] **Add pagination**
  - Endpoint: GET /api/plots?page=1&limit=10
  - Endpoint: GET /api/sprays/history?page=1&limit=20
  - Frontend: pagination UI

- [ ] **Fix N+1 query in PlotDetail**
  - Single JOIN instead of Promise.all
  - File: backend/routes/plots.js:50-64

- [ ] **Add file upload error handling**
  - Backend: check file size, type
  - Frontend: display error message
  - Return specific error codes

- [ ] **Add old file cleanup**
  - Delete old image when updating
  - Add util function: deleteFile()
  - Check if file exists before delete

- [ ] **Add database indexes**
  - Create migration or update db.js
  - Add indexes on: user_id, plot_id, bed_id

- [ ] **Add compression middleware**
  - Install: `npm install compression`
  - Add: `app.use(compression())`

- [ ] **Fix executeUpdate() scope issue**
  - Refactor sprays.js:245
  - Move function outside or restructure

- [ ] **Add loading states**
  - Export.js: show spinner during download
  - PlotDetail.js: skeleton loader
  - All async operations

- [ ] **Add soft delete**
  - Add deleted_at column to tables
  - Filter deleted records in queries
  - Add restore functionality

---

## 📱 MEDIUM PRIORITY - MISSING FEATURES

- [ ] **User profile edit page**
  - Change username, email
  - Change password
  - Delete account
  - File: `frontend/src/pages/UserProfile.js`

- [ ] **Password reset flow**
  - Forgot password link
  - Email with reset token
  - Reset password form
  - Install nodemailer

- [ ] **Email notifications**
  - Send email 3 days before harvest
  - Install nodemailer
  - Create email templates

- [ ] **Advanced search & filters**
  - Search plots by name
  - Filter sprays by date range
  - Filter by plant type
  - Sort options

- [ ] **Bulk operations**
  - Select multiple plots to delete
  - Export selected items only
  - Bulk edit

- [ ] **Calendar view**
  - Monthly calendar
  - Show spray dates, harvest dates
  - Click to see details
  - Library: react-big-calendar

- [ ] **Statistics dashboard**
  - Charts: spray frequency over time
  - Cost tracking
  - Harvest predictions
  - Library: recharts or chart.js

---

## 🎨 LOW PRIORITY - UX IMPROVEMENTS

- [ ] **Replace window.confirm()**
  - Create Modal component
  - Styled confirmation dialogs
  - Reusable across app

- [ ] **Add breadcrumbs**
  - Show navigation path
  - Make it clickable
  - Component: Breadcrumb.js

- [ ] **Dark mode**
  - Toggle in settings
  - Save preference to localStorage
  - Update Tailwind config

- [ ] **Better date formatting**
  - Install date-fns or day.js
  - Format: "3 dni temu", "za 2 dni"
  - Relative times

- [ ] **Keyboard shortcuts**
  - Ctrl/Cmd + N: new plot
  - Ctrl/Cmd + K: search
  - ESC: close modals

- [ ] **Add favicon**
  - Create or download garden icon
  - Add to public/favicon.ico
  - Update index.html

- [ ] **Improve meta tags**
  - Add og:image, og:description
  - Twitter cards
  - Better SEO

- [ ] **Internationalization**
  - Install react-i18next
  - Extract all strings
  - Support EN and PL

---

## 🧪 TESTING

- [ ] **Setup testing framework**
  - Install Jest, React Testing Library
  - Create test utils
  - Add test scripts

- [ ] **Backend unit tests**
  - Test auth middleware
  - Test validators
  - Test helper functions

- [ ] **API integration tests**
  - Test all endpoints
  - Test authentication
  - Test error cases

- [ ] **Frontend component tests**
  - Test Login, Register
  - Test Dashboard
  - Test forms

- [ ] **E2E tests**
  - Install Playwright or Cypress
  - Test critical user flows
  - CI/CD integration

---

## 🚀 DEPLOYMENT & DEVOPS

- [ ] **Create Dockerfile**
  - Multi-stage build
  - Backend + Frontend
  - Optimize image size

- [ ] **Create docker-compose.yml**
  - Backend service
  - Frontend service
  - SQLite volume

- [ ] **CI/CD pipeline**
  - GitHub Actions
  - Run tests
  - Build Docker image
  - Deploy to staging

- [ ] **Environment configs**
  - .env.development
  - .env.production
  - .env.test

- [ ] **Monitoring**
  - Add Sentry for error tracking
  - Add logging (winston)
  - Health check endpoint (already exists!)

- [ ] **Performance monitoring**
  - Add LogRocket or similar
  - Monitor API response times
  - Track user flows

---

## 📝 DOCUMENTATION

- [ ] **API documentation**
  - Setup Swagger/OpenAPI
  - Document all endpoints
  - Add examples

- [ ] **Component documentation**
  - Add JSDoc comments
  - PropTypes or TypeScript
  - Usage examples

- [ ] **Deployment guide**
  - How to deploy to Heroku
  - How to deploy to Vercel
  - Database migrations

- [ ] **Contributing guide**
  - Code style guide
  - Git workflow
  - PR template

---

## 🔮 FUTURE ENHANCEMENTS

- [ ] **Mobile app**
  - React Native version
  - Or PWA with better mobile UX

- [ ] **Weather integration**
  - Fetch weather data
  - Suggest spray times
  - Rain warnings

- [ ] **Plant database**
  - Pre-populated plant info
  - Growth timeline
  - Companion planting

- [ ] **Photo gallery**
  - Multiple photos per bed
  - Before/after comparisons
  - Growth progress photos

- [ ] **Social features**
  - Share your garden
  - Community tips
  - Public profiles (opt-in)

- [ ] **AI features**
  - Plant disease detection (image recognition)
  - Pest identification
  - Growth predictions

---

## 📊 Progress Tracker

**Total Tasks:** 70+

**Critical:** 4/4 identified ⚠️
**High Priority:** 11/11 identified ⚠️
**Medium Priority:** 19/19 identified ✅
**Low Priority:** 11/11 identified ✅
**Testing:** 5/5 identified ✅
**DevOps:** 6/6 identified ✅
**Documentation:** 4/4 identified ✅
**Future:** 6/6 identified ✅

**Completion:** 0% (all tasks pending)

---

## 🎯 Sprint Plan Suggestion

### Sprint 1 (Week 1): Critical Fixes
- PlotForm, SprayForm components
- Fix hardcoded URLs
- Change JWT_SECRET
- Error Boundary
- Axios interceptors

**Goal:** Make app fully functional

### Sprint 2 (Week 2): Security Hardening
- Rate limiting
- Helmet.js
- CORS config
- Input sanitization
- File upload security

**Goal:** Production-ready security

### Sprint 3 (Week 3): Performance & UX
- Pagination
- Database indexes
- Loading states
- Date validation
- Compression

**Goal:** Fast and smooth UX

### Sprint 4 (Week 4): Features
- User profile
- Password reset
- Search & filters
- Better error handling

**Goal:** Complete feature set

### Sprint 5 (Week 5): Testing & Deploy
- Write tests
- Docker setup
- CI/CD
- Documentation

**Goal:** Deployable and maintainable

---

**Last updated:** 2025-10-24
**Next review:** After completing Sprint 1
