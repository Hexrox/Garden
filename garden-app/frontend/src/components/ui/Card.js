import React from 'react';

/**
 * Card Components
 *
 * A set of card components for consistent content containers.
 * Usage:
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Title</CardTitle>
 *   </CardHeader>
 *   <CardContent>Content</CardContent>
 *   <CardFooter>Footer</CardFooter>
 * </Card>
 */

export const Card = ({
  children,
  className = '',
  hover = false,
  onClick
}) => (
  <div
    className={`
      bg-white dark:bg-gray-800
      rounded-xl shadow-md
      transition-all duration-300
      ${hover ? 'hover:shadow-lg hover:-translate-y-1 cursor-pointer' : ''}
      ${className}
    `}
    onClick={onClick}
  >
    {children}
  </div>
);

export const CardHeader = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ icon, children, action, className = '' }) => (
  <div className={`flex items-center justify-between ${className}`}>
    <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
      {icon}
      {children}
    </h3>
    {action && <div>{action}</div>}
  </div>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-t border-gray-200 dark:border-gray-700 ${className}`}>
    {children}
  </div>
);

export default Card;
