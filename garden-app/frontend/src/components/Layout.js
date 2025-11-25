import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BottomNav from './BottomNav';
import DarkModeToggle from './DarkModeToggle';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 transition whitespace-nowrap"
                >
                  Dashboard
                </Link>
                <Link
                  to="/plots"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 transition whitespace-nowrap"
                >
                  Działki
                </Link>
                <Link
                  to="/plants"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 transition whitespace-nowrap"
                >
                  Rośliny
                </Link>
                <Link
                  to="/sprays"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 transition whitespace-nowrap"
                >
                  Opryski
                </Link>
                <Link
                  to="/reminders"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 transition whitespace-nowrap"
                >
                  Przypomnienia
                </Link>
                <Link
                  to="/profile"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 transition whitespace-nowrap"
                >
                  Profil
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="hidden md:block text-sm text-gray-700 dark:text-gray-300">{user?.username}</span>
              <DarkModeToggle />
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 lg:px-4 py-2 border border-transparent text-xs lg:text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition flex-shrink-0"
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
