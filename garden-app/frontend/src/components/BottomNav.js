import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Calendar, User, Menu } from 'lucide-react';
import MenuModal from './MenuModal';
import QuickPhotoModal from './modals/QuickPhotoModal';

const BottomNav = () => {
  const location = useLocation();
  // FIXED: Use single state instead of two booleans to avoid race conditions
  const [activeModal, setActiveModal] = useState(null); // null | 'menu' | 'quickPhoto'

  const navItems = [
    {
      path: '/dashboard',
      icon: Home,
      label: 'Główna',
      match: '/dashboard'
    },
    {
      path: '/plots',
      icon: LayoutGrid,
      label: 'Działki',
      match: '/plots'
    },
    {
      path: '/calendar',
      icon: Calendar,
      label: 'Kalendarz',
      match: '/calendar'
    },
    {
      path: '/profile',
      icon: User,
      label: 'Profil',
      match: '/profile'
    }
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50 lg:hidden" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 4px)' }}>
        <div className="flex justify-around items-center h-20 relative">
          {/* First 2 items */}
          {navItems.slice(0, 2).map((item) => {
            const active = isActive(item.match);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  active
                    ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Icon size={24} className="mb-0.5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* Central Menu Button - Enlarged FAB */}
          <button
            onClick={() => setActiveModal('menu')}
            className="flex flex-col items-center justify-center flex-1 h-full transition-colors text-gray-600 dark:text-gray-400 relative"
            aria-label="Otwórz menu"
          >
            <div className="absolute -top-4 w-16 h-16 bg-gradient-to-br from-green-500 via-green-500 to-emerald-500 rounded-2xl shadow-xl flex items-center justify-center transform hover:scale-105 active:scale-95 transition-all duration-200 ring-4 ring-white dark:ring-gray-800">
              <Menu size={30} className="text-white" />
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 opacity-0 hover:opacity-20 blur-xl transition-opacity"></div>
            </div>
            <span className="text-xs font-medium mt-10 text-gray-500 dark:text-gray-400">Menu</span>
          </button>

          {/* Last 2 items */}
          {navItems.slice(2, 4).map((item) => {
            const active = isActive(item.match);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  active
                    ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Icon size={24} className="mb-0.5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Menu Modal */}
      <MenuModal
        isOpen={activeModal === 'menu'}
        onClose={() => setActiveModal(null)}
        onQuickPhotoClick={() => setActiveModal('quickPhoto')}
      />

      {/* Quick Photo Modal */}
      <QuickPhotoModal
        isOpen={activeModal === 'quickPhoto'}
        onClose={() => setActiveModal(null)}
        onSuccess={() => setActiveModal(null)}
      />
    </>
  );
};

export default BottomNav;
