import React from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Calendar,
  CheckSquare,
  Download,
  Repeat,
  Droplets,
  TrendingUp,
  Image,
  Camera,
  BookOpen,
  Flower2,
  Snowflake,
  Scissors,
  Leaf,
  ClipboardList,
  Sprout,
  Grid3X3
} from 'lucide-react';

/**
 * Komponent MenuModal
 *
 * Eleganckie menu modalne zapewniające dostęp do wszystkich funkcji aplikacji
 * Układ siatki z sekcjami, zoptymalizowany na urządzenia mobilne i tablety
 */
const MenuModal = ({ isOpen, onClose, onQuickPhotoClick }) => {
  if (!isOpen) return null;

  // Kategorie menu z unikalnymi kolorami
  const menuSections = [
    {
      title: 'Szybkie akcje',
      color: 'green',
      items: [
        {
          id: 'quick-photo',
          action: onQuickPhotoClick,
          icon: Camera,
          label: 'Dodaj zdjęcie',
          description: 'Zrób szybkie foto'
        }
      ]
    },
    {
      title: 'Planowanie',
      color: 'orange',
      items: [
        {
          id: 'planner',
          path: '/planner',
          icon: ClipboardList,
          label: 'Planer',
          description: 'Zaplanuj prace'
        },
        {
          id: 'garden-planner',
          path: '/garden-planner',
          icon: Grid3X3,
          label: 'Zaplanuj ogródek',
          description: 'Projektuj układ roślin'
        },
        {
          id: 'tasks',
          path: '/tasks',
          icon: CheckSquare,
          label: 'Zadania',
          description: 'Lista do wykonania'
        },
        {
          id: 'calendar',
          path: '/calendar',
          icon: Calendar,
          label: 'Kalendarz',
          description: 'Kalendarz ogrodnika'
        }
      ]
    },
    {
      title: 'Mój ogród',
      color: 'indigo',
      items: [
        {
          id: 'gallery',
          path: '/gallery',
          icon: Image,
          label: 'Galeria',
          description: 'Twoje zdjęcia'
        },
        {
          id: 'analytics',
          path: '/analytics',
          icon: TrendingUp,
          label: 'Statystyki',
          description: 'Podsumowanie ogrodu'
        }
      ]
    },
    {
      title: 'Pielęgnacja roślin',
      color: 'pink',
      items: [
        {
          id: 'plants',
          path: '/plants',
          icon: Leaf,
          label: 'Baza roślin',
          description: '800+ gatunków'
        },
        {
          id: 'bloom-timeline',
          path: '/bloom-timeline',
          icon: Flower2,
          label: 'Kwitnienie',
          description: 'Oś czasu kwiatów'
        },
        {
          id: 'deadheading',
          path: '/deadheading',
          icon: Scissors,
          label: 'Przekwitłe',
          description: 'Usuwanie kwiatów'
        },
        {
          id: 'propagation',
          path: '/propagation',
          icon: Sprout,
          label: 'Rozmnażanie',
          description: 'Dzielenie bylin'
        },
        {
          id: 'winter-protection',
          path: '/winter-protection',
          icon: Snowflake,
          label: 'Zimowanie',
          description: 'Ochrona na zimę'
        }
      ]
    },
    {
      title: 'Uprawa',
      color: 'cyan',
      items: [
        {
          id: 'sprays',
          path: '/sprays',
          icon: Droplets,
          label: 'Opryski',
          description: 'Historia oprysków'
        },
        {
          id: 'succession',
          path: '/succession',
          icon: Repeat,
          label: 'Siew sukcesywny',
          description: 'Ciągłość zbiorów'
        }
      ]
    },
    {
      title: 'Narzędzia',
      color: 'gray',
      items: [
        {
          id: 'export',
          path: '/export',
          icon: Download,
          label: 'Eksport',
          description: 'Pobierz dane'
        },
        {
          id: 'help',
          path: '/pomoc',
          icon: BookOpen,
          label: 'Pomoc',
          description: 'Poradnik użytkownika'
        }
      ]
    }
  ];

  // Mapowanie kolorów sekcji
  const colorClasses = {
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
    cyan: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
    gray: 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400'
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-y-auto border border-white/20 dark:border-gray-700/50 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Menu
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Wszystkie funkcje aplikacji
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij menu"
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <X size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Menu Sections */}
        <div className="p-4 sm:p-6 space-y-6">
          {menuSections.map((section) => (
            <div key={section.title}>
              {/* Section Header */}
              <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-1">
                {section.title}
              </h3>

              {/* Section Items */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const Component = item.path ? Link : 'button';
                  const props = item.path
                    ? { to: item.path, onClick: onClose, 'aria-label': `${item.label} - ${item.description}` }
                    : {
                        onClick: (e) => {
                          e.stopPropagation();
                          item.action();
                        },
                        type: 'button',
                        'aria-label': `${item.label} - ${item.description}`
                      };

                  return (
                    <Component
                      key={item.id}
                      {...props}
                      className="group bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3 sm:p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 text-left w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      {/* Icon */}
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${colorClasses[section.color]} flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-105 transition-transform`}>
                        <Icon size={24} className="sm:w-7 sm:h-7" />
                      </div>

                      {/* Label */}
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base mb-0.5 leading-tight">
                          {item.label}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </Component>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MenuModal;
