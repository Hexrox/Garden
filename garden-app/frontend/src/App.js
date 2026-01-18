import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import CookieConsent from './components/CookieConsent';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import RestoreAccount from './pages/RestoreAccount';
import Dashboard from './pages/Dashboard';
import PlotsList from './pages/PlotsList';
import PlotDetail from './pages/PlotDetail';
import PlotForm from './pages/PlotForm';
import SprayHistory from './pages/SprayHistory';
import CareForm from './pages/CareForm';
import FertilizationSchedule from './pages/FertilizationSchedule';
import BloomTimeline from './pages/BloomTimeline';
import WinterProtection from './pages/WinterProtection';
import PropagationTracking from './pages/PropagationTracking';
import DeadheadingReminders from './pages/DeadheadingReminders';
import Reminders from './pages/Reminders';
import Export from './pages/Export';
import Profile from './pages/Profile';
import PlantCatalog from './pages/PlantCatalog';
import SuccessionPlanting from './pages/SuccessionPlanting';
import Tasks from './pages/Tasks';
import Calendar from './pages/Calendar';
import Analytics from './pages/Analytics';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Help from './pages/Help';
import AdminPanel from './pages/AdminPanel';
import Gallery from './pages/Gallery';
import PublicProfile from './pages/PublicProfile';
import NotFound from './pages/NotFound';
import GlobalSearch from './components/GlobalSearch';

// Protected Route Component
const ProtectedRoute = ({ children, forceRender }) => {
  const { isAuthenticated, loading } = useAuth();

  // If loading stuck for too long, force render was triggered from AppRoutes
  if (loading && !forceRender) {
    return <div className="flex items-center justify-center min-h-screen">Ładowanie...</div>;
  }

  // If forceRender is true and still loading, assume not authenticated (safety fallback)
  if (forceRender && loading) {
    console.warn('⚠️  Force rendering ProtectedRoute - redirecting to login');
    return <Navigate to="/login" />;
  }

  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

// Public Route Component (redirect to dashboard if already logged in)
const PublicRoute = ({ children, forceRender }) => {
  const { isAuthenticated, loading } = useAuth();

  // If loading stuck for too long, force render was triggered from AppRoutes
  if (loading && !forceRender) {
    return <div className="flex items-center justify-center min-h-screen">Ładowanie...</div>;
  }

  // If forceRender is true and still loading, assume not authenticated (safety fallback)
  if (forceRender && loading) {
    console.warn('⚠️  Force rendering PublicRoute - showing public content');
    return children;
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

function AppRoutes() {
  const { loading, isAuthenticated } = useAuth();
  const [forceRender, setForceRender] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Safety timeout: If loading takes too long, force render the app
  // This is an additional safety net on top of AuthContext timeouts
  useEffect(() => {
    if (loading && !forceRender) {
      const routeTimeout = setTimeout(() => {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('🚨 ROUTE LOADING TIMEOUT');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('Loading stuck for > 5 seconds at route level');
        console.error('Forcing app to render to prevent infinite loading');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        setForceRender(true);
      }, 5000); // 5 seconds

      return () => clearTimeout(routeTimeout);
    }

    // Reset forceRender when loading completes normally
    if (!loading && forceRender) {
      setForceRender(false);
    }
  }, [loading, forceRender]);

  // Global search keyboard shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isAuthenticated) {
          setShowSearch(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated]);

  return (
    <Router>
      {/* Global Search Modal */}
      {isAuthenticated && (
        <GlobalSearch isOpen={showSearch} onClose={() => setShowSearch(false)} />
      )}

      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute forceRender={forceRender}>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute forceRender={forceRender}>
              <Register />
            </PublicRoute>
          }
        />

        {/* Password Reset & Email Verification Routes (public) */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/restore-account/:token" element={<RestoreAccount />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute forceRender={forceRender}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plots"
          element={
            <ProtectedRoute forceRender={forceRender}>
              <PlotsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plots/new"
          element={
            <ProtectedRoute forceRender={forceRender}>
              <PlotForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plots/:id"
          element={
            <ProtectedRoute forceRender={forceRender}>
              <PlotDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plots/:id/edit"
          element={
            <ProtectedRoute forceRender={forceRender}>
              <PlotForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/beds/:bedId/care"
          element={
            <ProtectedRoute forceRender={forceRender}>
              <CareForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sprays"
          element={
            <ProtectedRoute forceRender={forceRender}>
              <SprayHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fertilization"
          element={
            <ProtectedRoute forceRender={forceRender}>
              <FertilizationSchedule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bloom-timeline"
          element={
            <ProtectedRoute forceRender={forceRender}>
              <BloomTimeline />
            </ProtectedRoute>
          }
        />
        <Route
          path="/winter-protection"
          element={
            <ProtectedRoute forceRender={forceRender}>
              <WinterProtection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/propagation"
          element={
            <ProtectedRoute forceRender={forceRender}>
              <PropagationTracking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/deadheading"
          element={
            <ProtectedRoute forceRender={forceRender}>
              <DeadheadingReminders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reminders"
          element={
            <ProtectedRoute forceRender={forceRender}>
              <Reminders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/export"
          element={
            <ProtectedRoute forceRender={forceRender}>
              <Export />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plants"
          element={
            <ProtectedRoute forceRender={forceRender}>
              <PlantCatalog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/succession"
          element={
            <ProtectedRoute forceRender={forceRender}>
              <SuccessionPlanting />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute forceRender={forceRender}>
              <Tasks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute forceRender={forceRender}>
              <Calendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute forceRender={forceRender}>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute forceRender={forceRender}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute forceRender={forceRender}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gallery"
          element={
            <ProtectedRoute forceRender={forceRender}>
              <Gallery />
            </ProtectedRoute>
          }
        />

        {/* Public Pages */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/pomoc" element={<Help />} />
        <Route path="/g/:username" element={<PublicProfile />} />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 - Must be last */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <AppRoutes />
            <CookieConsent />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
