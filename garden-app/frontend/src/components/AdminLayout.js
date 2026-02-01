import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DarkModeToggle from './DarkModeToggle';
import axios from '../config/axios';
import {
  Shield,
  Users,
  Leaf,
  Image,
  Camera,
  Settings,
  LogOut,
  Menu,
  X,
  BookOpen
} from 'lucide-react';

/**
 * AdminLayout - Dedykowany layout dla konta administratora
 *
 * Uproszczony widok bez funkcji ogrodniczych (działki, zadania, planer)
 * Skupiony na zarządzaniu aplikacją i bazą roślin
 */
const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingPlantsCount, setPendingPlantsCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Pobierz liczbę oczekujących roślin
  useEffect(() => {
    const controller = new AbortController();
    axios.get('/api/admin/plants/stats', { signal: controller.signal })
      .then(res => setPendingPlantsCount(res.data?.pending_count || 0))
      .catch(() => {});
    return () => controller.abort();
  }, [location.pathname]);

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Menu admina
  const adminMenuItems = [
    {
      path: '/admin',
      icon: Shield,
      label: 'Panel główny',
      description: 'Statystyki i użytkownicy',
      exact: true
    },
    {
      path: '/admin/plants',
      icon: Leaf,
      label: 'Moderacja roślin',
      description: 'Zatwierdzaj nowe rośliny',
      badge: pendingPlantsCount
    },
    {
      path: '/admin/images',
      icon: Image,
      label: 'Zdjęcia roślin',
      description: 'Zarządzaj zdjęciami'
    },
    {
      path: '/admin/photo-review',
      icon: Camera,
      label: 'Weryfikacja zdjęć',
      description: 'Sprawdź poprawność'
    },
    {
      path: '/plants',
      icon: BookOpen,
      label: 'Katalog roślin',
      description: 'Przeglądaj bazę'
    },
    {
      path: '/profile',
      icon: Settings,
      label: 'Ustawienia',
      description: 'Profil i preferencje'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      {/* Top Navigation */}
      <nav className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900 shadow-lg" style={{ paddingTop: 'env(safe-area-inset-top, 0)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/admin" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <span className="text-xl font-bold text-white">Garden App</span>
                  <span className="ml-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-full">
                    ADMIN
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                const active = item.exact
                  ? location.pathname === item.path
                  : isActive(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-white/10 text-white'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                    {item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-yellow-500 text-white text-xs font-bold rounded-full min-w-[18px] text-center animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <DarkModeToggle />

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Wyloguj</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-gray-800 dark:bg-gray-950 border-b border-gray-700">
          <div className="px-4 py-4 space-y-2">
            {adminMenuItems.map((item) => {
              const Icon = item.icon;
              const active = item.exact
                ? location.pathname === item.path
                : isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    active
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    active ? 'bg-yellow-500/20' : 'bg-white/5'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {item.label}
                      {item.badge > 0 && (
                        <span className="px-1.5 py-0.5 bg-yellow-500 text-white text-xs font-bold rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </Link>
              );
            })}

            {/* Mobile logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <LogOut className="w-5 h-5" />
              </div>
              <div className="font-medium">Wyloguj się</div>
            </button>
          </div>
        </div>
      )}

      {/* Admin Info Banner */}
      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-b border-yellow-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Zalogowano jako: <strong>{user?.email || 'Administrator'}</strong>
                </span>
              </div>
            </div>
            {pendingPlantsCount > 0 && (
              <Link
                to="/admin/plants"
                className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500 text-white text-sm font-medium rounded-lg hover:bg-yellow-600 transition-colors"
              >
                <Leaf className="w-4 h-4" />
                {pendingPlantsCount} do moderacji
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Mobile Bottom Nav for Admin */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 dark:bg-gray-950 border-t border-gray-800 shadow-lg z-50 lg:hidden" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 4px)' }}>
        <div className="flex justify-around items-center h-16">
          {[
            { path: '/admin', icon: Shield, label: 'Panel', exact: true },
            { path: '/admin/plants', icon: Leaf, label: 'Rośliny', badge: pendingPlantsCount },
            { path: '/plants', icon: BookOpen, label: 'Katalog' },
            { path: '/profile', icon: Settings, label: 'Profil' }
          ].map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? location.pathname === item.path
              : isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  active
                    ? 'text-yellow-400'
                    : 'text-gray-400 hover:text-yellow-400'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
                {item.badge > 0 && (
                  <span className="absolute top-1 right-1/4 px-1.5 py-0.5 bg-yellow-500 text-white text-xs font-bold rounded-full min-w-[16px] text-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom padding for mobile nav */}
      <div className="h-16 lg:hidden" />
    </div>
  );
};

export default AdminLayout;
