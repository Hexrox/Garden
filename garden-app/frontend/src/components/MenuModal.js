import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Calendar,
  CheckSquare,
  Database,
  Download,
  Repeat,
  Droplets,
  LayoutGrid,
  TrendingUp,
  Image,
  Camera
} from 'lucide-react';
import QuickPhotoModal from './modals/QuickPhotoModal';

/**
 * Komponent MenuModal
 *
 * Eleganckie menu modalne zapewniające dostęp do wszystkich funkcji aplikacji
 * Układ siatki, zoptymalizowany na urządzenia mobilne, przejrzyste kategorie
 */
const MenuModal = ({ isOpen, onClose }) => {
  const [showQuickPhoto, setShowQuickPhoto] = useState(false);

  if (!isOpen) return null;

  const menuItems = [
    {
      id: 'quick-photo',
      action: () => setShowQuickPhoto(true),
      icon: Camera,
      label: 'Dodaj zdjęcie',
      description: 'Szybkie foto',
      color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      badge: 'SZYBKI'
    },
    {
      id: 'calendar',
      path: '/calendar',
      icon: Calendar,
      label: 'Kalendarz',
      description: 'Ogrodnika',
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      badge: 'NOWY'
    },
    {
      id: 'analytics',
      path: '/analytics',
      icon: TrendingUp,
      label: 'Statystyki',
      description: 'Ogrodu',
      color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
      badge: 'NOWY'
    },
    {
      id: 'gallery',
      path: '/gallery',
      icon: Image,
      label: 'Galeria',
      description: 'Zdjęcia',
      color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
      badge: 'NOWY'
    },
    {
      id: 'tasks',
      path: '/tasks',
      icon: CheckSquare,
      label: 'Zadania',
      description: 'Do wykonania',
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
    },
    {
      id: 'sprays',
      path: '/sprays',
      icon: Droplets,
      label: 'Opryski',
      description: 'Historia',
      color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400'
    },
    {
      id: 'succession',
      path: '/succession',
      icon: Repeat,
      label: 'Sadzenie',
      description: 'Sukcesywne',
      color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
    },
    {
      id: 'plants',
      path: '/plants',
      icon: Database,
      label: 'Baza roślin',
      description: 'Zarządzanie',
      color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
    },
    {
      id: 'export',
      path: '/export',
      icon: Download,
      label: 'Eksport',
      description: 'Danych',
      color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
    }
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Wszystkie funkcje
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Wybierz funkcję z menu
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <X size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Menu Grid */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const Component = item.path ? Link : 'button';
              const props = item.path
                ? { to: item.path, onClick: onClose }
                : { onClick: () => { item.action(); onClose(); }, type: 'button' };

              return (
                <Component
                  key={item.id}
                  {...props}
                  className="group relative bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-1 text-left w-full"
                >
                  {/* Badge */}
                  {item.badge && (
                    <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full shadow-lg">
                      {item.badge}
                    </div>
                  )}

                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl ${item.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon size={28} />
                  </div>

                  {/* Label */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-0.5">
                      {item.label}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.description}
                    </p>
                  </div>
                </Component>
              );
            })}
          </div>

          {/* Quick Stats */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                Odkrywaj więcej funkcji
              </span>
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <LayoutGrid size={16} />
                <span className="font-medium">9 modułów</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Photo Modal */}
      <QuickPhotoModal
        isOpen={showQuickPhoto}
        onClose={() => setShowQuickPhoto(false)}
        onSuccess={() => {
          // Możemy dodać toast notification tutaj
          console.log('Zdjęcie dodane pomyślnie!');
        }}
      />
    </div>
  );
};

export default MenuModal;
