import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Calendar, User, Menu } from 'lucide-react';
import MenuModal from './MenuModal';
import QuickPhotoModal from './modals/QuickPhotoModal';

const BottomNav = () => {
  const location = useLocation();
  // FIXED: Use single state instead of two booleans to avoid race conditions
  const [activeModal, setActiveModal] = useState(null); // null | 'menu' | 'quickPhoto'
  const [debugLog, setDebugLog] = useState([]);

  const addDebugLog = (message) => {
    console.log(message);
    setDebugLog(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

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

          {/* Central Menu Button */}
          <button
            onClick={() => setActiveModal('menu')}
            className="flex flex-col items-center justify-center flex-1 h-full transition-colors text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-50 dark:hover:bg-gray-700 relative"
          >
            <div className="absolute -top-2 w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg flex items-center justify-center">
              <Menu size={28} className="text-white" />
            </div>
            <span className="text-xs font-medium mt-9">Menu</span>
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

      {/* Debug Log Panel */}
      {debugLog.length > 0 && (
        <div className="fixed top-0 left-0 right-0 bg-black/90 text-white p-2 text-xs z-[999] max-h-32 overflow-y-auto">
          {debugLog.map((log, i) => (
            <div key={i} className="border-b border-gray-700 py-1">{log}</div>
          ))}
        </div>
      )}

      {/* Menu Modal */}
      <MenuModal
        isOpen={activeModal === 'menu'}
        onClose={() => {
          addDebugLog('MenuModal onClose');
          setActiveModal(null);
        }}
        onQuickPhotoClick={() => {
          addDebugLog('QuickPhoto clicked');
          setActiveModal('quickPhoto');
        }}
      />

      {/* Quick Photo Modal */}
      <QuickPhotoModal
        isOpen={activeModal === 'quickPhoto'}
        onClose={() => {
          addDebugLog('QuickPhoto onClose');
          setActiveModal(null);
        }}
        onSuccess={() => {
          addDebugLog('QuickPhoto SUCCESS!');
          setActiveModal(null);
        }}
        onDebug={addDebugLog}
      />
    </>
  );
};

export default BottomNav;
