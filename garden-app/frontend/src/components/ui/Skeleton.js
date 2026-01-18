import React from 'react';

/**
 * Skeleton component for loading states
 * Usage: <Skeleton className="h-4 w-32" /> or <Skeleton variant="card" />
 */
const Skeleton = ({ className = '', variant, children }) => {
  const baseClasses = 'skeleton animate-pulse';

  // Predefined variants for common use cases
  const variants = {
    text: 'h-4 w-full rounded',
    'text-sm': 'h-3 w-full rounded',
    'text-lg': 'h-5 w-full rounded',
    title: 'h-8 w-3/4 rounded',
    avatar: 'h-12 w-12 rounded-full',
    'avatar-sm': 'h-8 w-8 rounded-full',
    'avatar-lg': 'h-16 w-16 rounded-full',
    button: 'h-10 w-24 rounded-lg',
    card: 'h-48 w-full rounded-xl',
    'card-sm': 'h-32 w-full rounded-lg',
    image: 'aspect-square w-full rounded-lg',
    'image-wide': 'aspect-video w-full rounded-lg',
    circle: 'h-12 w-12 rounded-full',
    badge: 'h-6 w-16 rounded-full',
  };

  const variantClasses = variant ? variants[variant] || '' : '';

  return (
    <div
      className={`${baseClasses} ${variantClasses} ${className}`}
      aria-hidden="true"
    >
      {children}
    </div>
  );
};

/**
 * Skeleton for a stat card (like on Dashboard)
 */
export const SkeletonStatCard = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 animate-pulse">
    <div className="flex items-center">
      <Skeleton variant="circle" className="w-14 h-14" />
      <div className="ml-4 space-y-2 flex-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-12" />
      </div>
    </div>
    <Skeleton className="h-4 w-32 mt-4" />
  </div>
);

/**
 * Skeleton for a widget card
 */
export const SkeletonWidget = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-5 w-32" />
      <Skeleton variant="badge" />
    </div>
    <div className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

/**
 * Skeleton for a list item
 */
export const SkeletonListItem = () => (
  <div className="flex items-center gap-4 p-4 animate-pulse">
    <Skeleton variant="avatar" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    <Skeleton variant="badge" />
  </div>
);

/**
 * Skeleton for gallery grid
 */
export const SkeletonGallery = ({ count = 6 }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} variant="image" className="aspect-square" />
    ))}
  </div>
);

/**
 * Skeleton for table row
 */
export const SkeletonTableRow = ({ columns = 4 }) => (
  <tr className="animate-pulse">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton className="h-4 w-full" />
      </td>
    ))}
  </tr>
);

/**
 * Skeleton for the Dashboard hero header
 */
export const SkeletonHeroHeader = () => (
  <div className="relative overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-6 md:p-8 animate-pulse">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="space-y-3">
        <Skeleton className="h-4 w-24 bg-gray-300 dark:bg-gray-600" />
        <Skeleton className="h-10 w-48 bg-gray-300 dark:bg-gray-600" />
        <Skeleton className="h-4 w-40 bg-gray-300 dark:bg-gray-600" />
      </div>
      <Skeleton className="h-10 w-32 rounded-xl bg-gray-300 dark:bg-gray-600" />
    </div>
  </div>
);

/**
 * Skeleton for a form
 */
export const SkeletonForm = ({ fields = 3 }) => (
  <div className="space-y-4 animate-pulse">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    ))}
    <Skeleton className="h-10 w-32 rounded-lg mt-6" />
  </div>
);

/**
 * Loading dots animation
 */
export const LoadingDots = ({ className = '' }) => (
  <span className={`loading-dots ${className}`}>
    <span></span>
    <span></span>
    <span></span>
  </span>
);

/**
 * Full page loading skeleton
 */
export const SkeletonPage = () => (
  <div className="space-y-6 animate-pulse">
    <Skeleton variant="title" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <SkeletonStatCard />
      <SkeletonStatCard />
      <SkeletonStatCard />
    </div>
    <SkeletonWidget />
    <SkeletonWidget />
  </div>
);

export default Skeleton;
