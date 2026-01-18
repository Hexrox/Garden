import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Breadcrumbs component for navigation hierarchy
 *
 * Usage:
 * <Breadcrumbs items={[
 *   { label: 'Działki', href: '/plots' },
 *   { label: 'Ogród warzywny' }
 * ]} />
 *
 * Or auto-generate from path:
 * <Breadcrumbs />
 */

// Polish translations for route segments
const routeLabels = {
  dashboard: 'Dashboard',
  plots: 'Działki',
  plants: 'Rośliny',
  sprays: 'Opryski',
  fertilization: 'Nawożenie',
  reminders: 'Przypomnienia',
  calendar: 'Kalendarz',
  gallery: 'Galeria',
  profile: 'Profil',
  tasks: 'Zadania',
  analytics: 'Statystyki',
  export: 'Eksport',
  help: 'Pomoc',
  admin: 'Admin',
  'bloom-timeline': 'Kalendarz kwitnienia',
  'winter-protection': 'Ochrona zimowa',
  propagation: 'Rozmnażanie',
  deadheading: 'Usuwanie przekwitłych',
  succession: 'Sadzenie sukcesywne',
  new: 'Nowy',
  edit: 'Edycja',
  care: 'Pielęgnacja',
  beds: 'Grządki',
};

const Breadcrumbs = ({ items, showHome = true, className = '' }) => {
  const location = useLocation();

  // Auto-generate items from current path if not provided
  const breadcrumbItems = items || generateBreadcrumbs(location.pathname);

  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center text-sm ${className}`}
    >
      <ol className="flex items-center flex-wrap gap-1">
        {/* Home link */}
        {showHome && (
          <li className="flex items-center">
            <Link
              to="/dashboard"
              className="text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Strona główna"
            >
              <Home size={16} />
            </Link>
          </li>
        )}

        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;

          return (
            <li key={index} className="flex items-center">
              {/* Separator */}
              <ChevronRight
                size={14}
                className="text-gray-300 dark:text-gray-600 mx-1 flex-shrink-0"
              />

              {/* Breadcrumb item */}
              {isLast || !item.href ? (
                <span
                  className="text-gray-900 dark:text-white font-medium truncate max-w-[200px]"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors truncate max-w-[200px]"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

/**
 * Generate breadcrumb items from pathname
 */
function generateBreadcrumbs(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  const items = [];
  let currentPath = '';

  // Skip if we're on dashboard (home)
  if (segments.length === 1 && segments[0] === 'dashboard') {
    return [];
  }

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;

    // Skip numeric IDs - they'll be resolved as part of the parent
    if (/^\d+$/.test(segment)) {
      return;
    }

    // Get label from translations or format the segment
    const label = routeLabels[segment] || formatSegment(segment);

    items.push({
      label,
      href: isLast ? undefined : currentPath,
    });
  });

  return items;
}

/**
 * Format a URL segment into a readable label
 */
function formatSegment(segment) {
  return segment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Page Header with Breadcrumbs
 * Combines breadcrumbs with page title for consistent headers
 */
export const PageHeader = ({
  title,
  description,
  breadcrumbs,
  actions,
  className = '',
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbs} className="mb-3" />

      {/* Title and Actions row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default Breadcrumbs;
