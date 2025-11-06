import React from 'react';

/**
 * Badge Component
 *
 * Displays status, tags, or categories with consistent styling.
 *
 * @param {string} variant - default, success, warning, error, info
 * @param {string} size - sm, md, lg
 * @param {ReactNode} icon - Optional icon
 * @param {ReactNode} children - Badge content
 */
export const Badge = ({
  variant = 'default',
  size = 'md',
  icon,
  className = '',
  children
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
    success: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    warning: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    error: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    info: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    plant: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span className={`
      inline-flex items-center gap-1
      font-medium rounded-full border
      ${variants[variant]}
      ${sizes[size]}
      ${className}
    `}>
      {icon}
      {children}
    </span>
  );
};

export default Badge;
