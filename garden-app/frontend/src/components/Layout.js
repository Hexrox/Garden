import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BottomNav from './BottomNav';
import DarkModeToggle from './DarkModeToggle';
import { ChevronDown } from 'lucide-react';
import axios from '../config/axios';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPlantsMenu, setShowPlantsMenu] = useState(false);
  const plantsMenuRef = useRef(null);
  const [pendingPlantsCount, setPendingPlantsCount] = useState(0);

  // Fetch pending plants count for admin badge
  useEffect(() => {
    if (user?.role === 'admin' || user?.username === 'admin') {
      const controller = new AbortController();
      axios.get('/api/admin/plants/stats', { signal: controller.signal })
        .then(res => setPendingPlantsCount(res.data?.pending_count || 0))
        .catch(() => {});
      return () => controller.abort();
    }
  }, [user, location.pathname]);

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isPlantsMenuActive = () => {
    return ['/plants', '/sprays', '/fertilization', '/bloom-timeline', '/winter-protection', '/propagation', '/deadheading'].some(
      path => location.pathname.startsWith(path)
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (plantsMenuRef.current && !plantsMenuRef.current.contains(event.target)) {
        setShowPlantsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16 lg:pb-0 transition-colors">
      {/* Top Navigation - Desktop */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm transition-colors" style={{ paddingTop: 'env(safe-area-inset-top, 0)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 overflow-x-auto">
            <div className="flex items-center min-w-0">
              <Link to="/dashboard" className="flex items-center flex-shrink-0">
                <span className="text-xl lg:text-2xl font-bold text-green-600">🌱 Garden App</span>
              </Link>
              <div className="hidden lg:ml-8 lg:flex lg:space-x-8">
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition whitespace-nowrap border-b-2 ${
                    isActive('/dashboard')
                      ? 'border-green-600 text-green-600 dark:text-green-400'
                      : 'border-transparent text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 hover:border-gray-300'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/plots"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition whitespace-nowrap border-b-2 ${
                    isActive('/plots')
                      ? 'border-green-600 text-green-600 dark:text-green-400'
                      : 'border-transparent text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 hover:border-gray-300'
                  }`}
                >
                  Działki
                </Link>
                {/* Plants Mega Menu Button */}
                <button
                  type="button"
                  onClick={() => setShowPlantsMenu(!showPlantsMenu)}
                  aria-label="Menu roślin i opieki"
                  aria-expanded={showPlantsMenu}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition whitespace-nowrap border-b-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                    isPlantsMenuActive()
                      ? 'border-green-600 text-green-600 dark:text-green-400'
                      : 'border-transparent text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 hover:border-gray-300'
                  }`}
                >
                  🌿 Rośliny
                  <ChevronDown size={16} className="ml-1" />
                </button>
                <Link
                  to="/planner"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition whitespace-nowrap border-b-2 ${
                    isActive('/planner')
                      ? 'border-green-600 text-green-600 dark:text-green-400'
                      : 'border-transparent text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 hover:border-gray-300'
                  }`}
                >
                  Planner
                </Link>
                <Link
                  to="/gallery"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition whitespace-nowrap border-b-2 ${
                    isActive('/gallery')
                      ? 'border-green-600 text-green-600 dark:text-green-400'
                      : 'border-transparent text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 hover:border-gray-300'
                  }`}
                >
                  Galeria
                </Link>
                <Link
                  to="/pomoc"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition whitespace-nowrap border-b-2 ${
                    isActive('/pomoc')
                      ? 'border-green-600 text-green-600 dark:text-green-400'
                      : 'border-transparent text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 hover:border-gray-300'
                  }`}
                >
                  Pomoc
                </Link>
                {user?.username === 'admin' && (
                  <Link
                    to="/admin"
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition whitespace-nowrap border-b-2 relative ${
                      isActive('/admin')
                        ? 'border-green-600 text-green-600 dark:text-green-400'
                        : 'border-transparent text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 hover:border-gray-300'
                    }`}
                  >
                    Admin
                    {pendingPlantsCount > 0 && (
                      <span className="absolute -top-1 -right-3 px-1.5 py-0.5 bg-yellow-500 text-white text-xs font-bold rounded-full min-w-[18px] text-center animate-pulse">
                        {pendingPlantsCount}
                      </span>
                    )}
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link
                to="/profile"
                className="hidden md:block text-sm text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition"
              >
                {user?.username}
              </Link>
              <DarkModeToggle />
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Wyloguj się z aplikacji"
                className="inline-flex items-center px-3 lg:px-4 py-2 border border-transparent text-xs lg:text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Wyloguj
              </button>
            </div>
          </div>
        </div>

        {/* Plants Mega Menu Panel - Full Width Below Nav */}
        {showPlantsMenu && (
          <div className="relative z-50 pb-2" ref={plantsMenuRef}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="rounded-lg shadow-2xl bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 border border-gray-200 dark:border-gray-700 animate-fadeIn">
                <div className="p-6">
                  {/* Główne sekcje */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Link
                      to="/plants"
                      onClick={() => setShowPlantsMenu(false)}
                      className={`group flex flex-col items-center p-6 rounded-lg transition-all duration-200 ${
                        isActive('/plants')
                          ? 'bg-green-50 dark:bg-green-900/20 ring-2 ring-green-500'
                          : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-green-50 dark:hover:bg-green-900/20 hover:shadow-md'
                      }`}
                    >
                      <div className="text-4xl mb-3">📚</div>
                      <h3 className={`text-base font-semibold mb-2 text-center ${
                        isActive('/plants')
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400'
                      }`}>
                        Katalog roślin
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                        Baza wiedzy o roślinach ogrodowych
                      </p>
                    </Link>

                    <Link
                      to="/sprays"
                      onClick={() => setShowPlantsMenu(false)}
                      className={`group flex flex-col items-center p-6 rounded-lg transition-all duration-200 ${
                        isActive('/sprays')
                          ? 'bg-green-50 dark:bg-green-900/20 ring-2 ring-green-500'
                          : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-green-50 dark:hover:bg-green-900/20 hover:shadow-md'
                      }`}
                    >
                      <div className="text-4xl mb-3">🧴</div>
                      <h3 className={`text-base font-semibold mb-2 text-center ${
                        isActive('/sprays')
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400'
                      }`}>
                        Opryski
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                        Historia oprysków i karencja
                      </p>
                    </Link>

                    <Link
                      to="/fertilization"
                      onClick={() => setShowPlantsMenu(false)}
                      className={`group flex flex-col items-center p-6 rounded-lg transition-all duration-200 ${
                        isActive('/fertilization')
                          ? 'bg-green-50 dark:bg-green-900/20 ring-2 ring-green-500'
                          : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-green-50 dark:hover:bg-green-900/20 hover:shadow-md'
                      }`}
                    >
                      <div className="text-4xl mb-3">🧪</div>
                      <h3 className={`text-base font-semibold mb-2 text-center ${
                        isActive('/fertilization')
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400'
                      }`}>
                        Nawożenie
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                        Harmonogram nawożenia roślin
                      </p>
                    </Link>
                  </div>

                  {/* Separator */}
                  <div className="border-t border-gray-200 dark:border-gray-700 mb-6">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-4 mb-4 flex items-center">
                      🌸 Kwiaty i byliny
                    </h4>
                  </div>

                  {/* Sekcja Kwiaty */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link
                      to="/bloom-timeline"
                      onClick={() => setShowPlantsMenu(false)}
                      className={`group flex flex-col items-center p-4 rounded-lg transition-all duration-200 ${
                        isActive('/bloom-timeline')
                          ? 'bg-pink-50 dark:bg-pink-900/20 ring-2 ring-pink-500'
                          : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:shadow-md'
                      }`}
                    >
                      <div className="text-3xl mb-2">📅</div>
                      <h3 className={`text-sm font-semibold text-center ${
                        isActive('/bloom-timeline')
                          ? 'text-pink-600 dark:text-pink-400'
                          : 'text-gray-900 dark:text-gray-100 group-hover:text-pink-600 dark:group-hover:text-pink-400'
                      }`}>
                        Kalendarz kwitnienia
                      </h3>
                    </Link>

                    <Link
                      to="/winter-protection"
                      onClick={() => setShowPlantsMenu(false)}
                      className={`group flex flex-col items-center p-4 rounded-lg transition-all duration-200 ${
                        isActive('/winter-protection')
                          ? 'bg-pink-50 dark:bg-pink-900/20 ring-2 ring-pink-500'
                          : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:shadow-md'
                      }`}
                    >
                      <div className="text-3xl mb-2">❄️</div>
                      <h3 className={`text-sm font-semibold text-center ${
                        isActive('/winter-protection')
                          ? 'text-pink-600 dark:text-pink-400'
                          : 'text-gray-900 dark:text-gray-100 group-hover:text-pink-600 dark:group-hover:text-pink-400'
                      }`}>
                        Zabezpieczanie na zimę
                      </h3>
                    </Link>

                    <Link
                      to="/propagation"
                      onClick={() => setShowPlantsMenu(false)}
                      className={`group flex flex-col items-center p-4 rounded-lg transition-all duration-200 ${
                        isActive('/propagation')
                          ? 'bg-pink-50 dark:bg-pink-900/20 ring-2 ring-pink-500'
                          : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:shadow-md'
                      }`}
                    >
                      <div className="text-3xl mb-2">✂️</div>
                      <h3 className={`text-sm font-semibold text-center ${
                        isActive('/propagation')
                          ? 'text-pink-600 dark:text-pink-400'
                          : 'text-gray-900 dark:text-gray-100 group-hover:text-pink-600 dark:group-hover:text-pink-400'
                      }`}>
                        Dzielenie bylin
                      </h3>
                    </Link>

                    <Link
                      to="/deadheading"
                      onClick={() => setShowPlantsMenu(false)}
                      className={`group flex flex-col items-center p-4 rounded-lg transition-all duration-200 ${
                        isActive('/deadheading')
                          ? 'bg-pink-50 dark:bg-pink-900/20 ring-2 ring-pink-500'
                          : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:shadow-md'
                      }`}
                    >
                      <div className="text-3xl mb-2">🥀</div>
                      <h3 className={`text-sm font-semibold text-center ${
                        isActive('/deadheading')
                          ? 'text-pink-600 dark:text-pink-400'
                          : 'text-gray-900 dark:text-gray-100 group-hover:text-pink-600 dark:group-hover:text-pink-400'
                      }`}>
                        Usuwanie przekwitłych
                      </h3>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-4 lg:py-6 px-4 sm:px-6 lg:px-8 text-gray-900 dark:text-gray-100">
        {children}
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNav />
    </div>
  );
};

export default Layout;
