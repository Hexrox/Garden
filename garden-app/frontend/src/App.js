import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PlotsList from './pages/PlotsList';
import PlotDetail from './pages/PlotDetail';
import PlotForm from './pages/PlotForm';
import SprayForm from './pages/SprayForm';
import SprayHistory from './pages/SprayHistory';
import Reminders from './pages/Reminders';
import Export from './pages/Export';
import Profile from './pages/Profile';
import PlantManagement from './pages/PlantManagement';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Ładowanie...</div>;
  }

  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

// Public Route Component (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Ładowanie...</div>;
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plots"
          element={
            <ProtectedRoute>
              <PlotsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plots/new"
          element={
            <ProtectedRoute>
              <PlotForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plots/:id"
          element={
            <ProtectedRoute>
              <PlotDetail />
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
        <Route
          path="/sprays"
          element={
            <ProtectedRoute>
              <SprayHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reminders"
          element={
            <ProtectedRoute>
              <Reminders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/export"
          element={
            <ProtectedRoute>
              <Export />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
        <Route
          path="/plants"
          element={
            <ProtectedRoute>
              <PlantManagement />
            </ProtectedRoute>
          }
        />
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
