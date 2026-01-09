import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BottomNav from './BottomNav';
import DarkModeToggle from './DarkModeToggle';
import { ChevronDown } from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showFlowersMenu, setShowFlowersMenu] = useState(false);
  const flowersMenuRef = useRef(null);

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isFlowersMenuActive = () => {
    return ['/bloom-timeline', '/winter-protection', '/propagation', '/deadheading'].some(
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
      if (flowersMenuRef.current && !flowersMenuRef.current.contains(event.target)) {
        setShowFlowersMenu(false);
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
                <Link
                  to="/plants"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition whitespace-nowrap border-b-2 ${
                    isActive('/plants')
                      ? 'border-green-600 text-green-600 dark:text-green-400'
                      : 'border-transparent text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 hover:border-gray-300'
                  }`}
                >
                  Rośliny
                </Link>
                <Link
                  to="/sprays"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition whitespace-nowrap border-b-2 ${
                    isActive('/sprays')
                      ? 'border-green-600 text-green-600 dark:text-green-400'
                      : 'border-transparent text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 hover:border-gray-300'
                  }`}
                >
                  Opryski
                </Link>
                <Link
                  to="/fertilization"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition whitespace-nowrap border-b-2 ${
                    isActive('/fertilization')
                      ? 'border-green-600 text-green-600 dark:text-green-400'
                      : 'border-transparent text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 hover:border-gray-300'
                  }`}
                >
                  Nawożenie
                </Link>

                {/* Flowers Dropdown */}
                <div className="relative z-50" ref={flowersMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowFlowersMenu(!showFlowersMenu)}
                    aria-label="Menu funkcji dla kwiatów"
                    aria-expanded={showFlowersMenu}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition whitespace-nowrap border-b-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                      isFlowersMenuActive()
                        ? 'border-green-600 text-green-600 dark:text-green-400'
                        : 'border-transparent text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 hover:border-gray-300'
                    }`}
                  >
                    🌸 Kwiaty
                    <ChevronDown size={16} className="ml-1" />
                  </button>

                  {showFlowersMenu && (
                    <div className="absolute left-0 top-full mt-1 w-60 rounded-lg shadow-xl bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 border border-gray-200 dark:border-gray-700">
                      <div className="py-2">
                        <Link
                          to="/bloom-timeline"
                          onClick={() => setShowFlowersMenu(false)}
                          className={`block px-4 py-2.5 text-sm transition ${
                            isActive('/bloom-timeline')
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-medium'
                              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          📅 Kalendarz kwitnienia
                        </Link>
                        <Link
                          to="/winter-protection"
                          onClick={() => setShowFlowersMenu(false)}
                          className={`block px-4 py-2.5 text-sm transition ${
                            isActive('/winter-protection')
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-medium'
                              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          ❄️ Zabezpieczanie na zimę
                        </Link>
                        <Link
                          to="/propagation"
                          onClick={() => setShowFlowersMenu(false)}
                          className={`block px-4 py-2.5 text-sm transition ${
                            isActive('/propagation')
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-medium'
                              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          ✂️ Dzielenie bylin
                        </Link>
                        <Link
                          to="/deadheading"
                          onClick={() => setShowFlowersMenu(false)}
                          className={`block px-4 py-2.5 text-sm transition ${
                            isActive('/deadheading')
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-medium'
                              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          🥀 Usuwanie przekwitłych
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
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
                  to="/profile"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition whitespace-nowrap border-b-2 ${
                    isActive('/profile')
                      ? 'border-green-600 text-green-600 dark:text-green-400'
                      : 'border-transparent text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 hover:border-gray-300'
                  }`}
                >
                  Profil
                </Link>
                {user?.username === 'admin' && (
                  <Link
                    to="/admin"
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition whitespace-nowrap border-b-2 ${
                      isActive('/admin')
                        ? 'border-green-600 text-green-600 dark:text-green-400'
                        : 'border-transparent text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 hover:border-gray-300'
                    }`}
                  >
                    Admin
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="hidden md:block text-sm text-gray-700 dark:text-gray-300">{user?.username}</span>
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
