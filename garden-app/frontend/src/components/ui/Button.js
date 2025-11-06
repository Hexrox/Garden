import React from 'react';
import { Loader } from 'lucide-react';

/**
 * Button Component
 *
 * A flexible button component with multiple variants, sizes, and states.
 *
 * @param {string} variant - primary, secondary, ghost, danger
 * @param {string} size - sm, md, lg
 * @param {ReactNode} icon - Optional icon (from lucide-react)
 * @param {boolean} loading - Show loading spinner
 * @param {ReactNode} children - Button text/content
 */
export const Button = ({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}) => {
  const variants = {
    primary: 'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white shadow-sm hover:shadow-md',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md',
    outline: 'border-2 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        font-medium rounded-lg
        transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader className="animate-spin" size={16} />
      ) : icon ? (
        icon
      ) : null}
      {children}
    </button>
  );
};

export default Button;
