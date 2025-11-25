import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Bell, User, Menu } from 'lucide-react';
import MenuModal from './MenuModal';

const BottomNav = () => {
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);

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
      path: '/reminders',
      icon: Bell,
      label: 'Przypomnienia',
      match: '/reminders'
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
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50 lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}>
        <div className="flex justify-around items-center h-16 relative">
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

          {/* Central Menu Button */}
          <button
            onClick={() => setShowMenu(true)}
            className="flex flex-col items-center justify-center flex-1 h-full transition-colors text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-50 dark:hover:bg-gray-700 relative"
          >
            <div className="absolute -top-2 w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg flex items-center justify-center">
              <Menu size={28} className="text-white" />
            </div>
            <span className="text-xs font-medium mt-8">Menu</span>
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
      <MenuModal isOpen={showMenu} onClose={() => setShowMenu(false)} />
    </>
  );
};

export default BottomNav;
