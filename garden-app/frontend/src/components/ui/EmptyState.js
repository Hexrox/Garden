import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

/**
 * Empty State component with illustrations
 * Usage: <EmptyState variant="plants" title="Brak roślin" description="..." />
 */

// SVG Illustrations
const illustrations = {
  // Garden/Plants illustration
  plants: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="100" cy="145" rx="80" ry="10" className="fill-gray-100 dark:fill-gray-700" />
      {/* Pot */}
      <path d="M60 100h80l-10 45H70l-10-45z" className="fill-earth-300 dark:fill-earth-600" />
      <path d="M55 95h90v8H55z" className="fill-earth-400 dark:fill-earth-500" />
      {/* Plant */}
      <path d="M100 95c0-30 20-50 35-55-5 15-10 35-35 55z" className="fill-green-400 dark:fill-green-500" />
      <path d="M100 95c0-30-20-50-35-55 5 15 10 35 35 55z" className="fill-green-500 dark:fill-green-600" />
      <path d="M100 95c-10-20-5-45 0-55 5 10 10 35 0 55z" className="fill-green-600 dark:fill-green-400" />
      {/* Stem */}
      <rect x="98" y="60" width="4" height="40" className="fill-green-700 dark:fill-green-300" />
      {/* Small leaves */}
      <ellipse cx="75" cy="70" rx="12" ry="8" transform="rotate(-30 75 70)" className="fill-green-400/60 dark:fill-green-500/60" />
      <ellipse cx="125" cy="75" rx="10" ry="6" transform="rotate(25 125 75)" className="fill-green-400/60 dark:fill-green-500/60" />
    </svg>
  ),

  // Gallery/Photos illustration
  gallery: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Background cards */}
      <rect x="45" y="30" width="90" height="70" rx="8" className="fill-gray-200 dark:fill-gray-600" transform="rotate(-6 90 65)" />
      <rect x="55" y="40" width="90" height="70" rx="8" className="fill-gray-100 dark:fill-gray-700" transform="rotate(3 100 75)" />
      {/* Main card */}
      <rect x="50" y="35" width="100" height="80" rx="8" className="fill-white dark:fill-gray-800" stroke="currentColor" strokeWidth="2" className="stroke-gray-200 dark:stroke-gray-600" />
      {/* Image placeholder */}
      <rect x="58" y="43" width="84" height="50" rx="4" className="fill-green-100 dark:fill-green-900/30" />
      {/* Mountain icon */}
      <path d="M70 85l15-20 10 12 20-25 27 33H70z" className="fill-green-300 dark:fill-green-600" />
      {/* Sun */}
      <circle cx="120" cy="55" r="8" className="fill-amber-300 dark:fill-amber-500" />
      {/* Caption line */}
      <rect x="58" y="100" width="50" height="6" rx="3" className="fill-gray-200 dark:fill-gray-600" />
    </svg>
  ),

  // Tasks/Todo illustration
  tasks: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Clipboard */}
      <rect x="55" y="25" width="90" height="120" rx="8" className="fill-amber-100 dark:fill-amber-900/30" />
      <rect x="55" y="25" width="90" height="120" rx="8" className="stroke-amber-300 dark:stroke-amber-600" strokeWidth="2" fill="none" />
      {/* Clip */}
      <rect x="80" y="18" width="40" height="20" rx="4" className="fill-gray-400 dark:fill-gray-500" />
      <rect x="85" y="22" width="30" height="12" rx="2" className="fill-amber-50 dark:fill-gray-700" />
      {/* Checkboxes */}
      <rect x="68" y="55" width="16" height="16" rx="4" className="fill-green-500" />
      <path d="M72 63l4 4 8-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="92" y="57" width="40" height="6" rx="3" className="fill-gray-200 dark:fill-gray-600" />

      <rect x="68" y="85" width="16" height="16" rx="4" className="fill-green-500" />
      <path d="M72 93l4 4 8-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="92" y="87" width="35" height="6" rx="3" className="fill-gray-200 dark:fill-gray-600" />

      <rect x="68" y="115" width="16" height="16" rx="4" className="stroke-gray-300 dark:stroke-gray-500" strokeWidth="2" fill="none" />
      <rect x="92" y="117" width="45" height="6" rx="3" className="fill-gray-200 dark:fill-gray-600" />
    </svg>
  ),

  // Search/No results illustration
  search: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Magnifying glass */}
      <circle cx="85" cy="70" r="35" className="stroke-gray-300 dark:stroke-gray-600" strokeWidth="6" fill="none" />
      <line x1="110" y1="95" x2="145" y2="130" className="stroke-gray-300 dark:stroke-gray-600" strokeWidth="8" strokeLinecap="round" />
      {/* Question mark */}
      <text x="85" y="82" textAnchor="middle" className="fill-gray-300 dark:fill-gray-600" fontSize="36" fontWeight="bold">?</text>
    </svg>
  ),

  // Calendar/Events illustration
  calendar: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Calendar body */}
      <rect x="45" y="35" width="110" height="100" rx="8" className="fill-white dark:fill-gray-800" />
      <rect x="45" y="35" width="110" height="100" rx="8" className="stroke-gray-200 dark:stroke-gray-600" strokeWidth="2" fill="none" />
      {/* Header */}
      <rect x="45" y="35" width="110" height="25" rx="8" className="fill-green-500 dark:fill-green-600" />
      <rect x="45" y="52" width="110" height="8" className="fill-green-500 dark:fill-green-600" />
      {/* Rings */}
      <rect x="65" y="28" width="6" height="16" rx="3" className="fill-gray-400 dark:fill-gray-500" />
      <rect x="130" y="28" width="6" height="16" rx="3" className="fill-gray-400 dark:fill-gray-500" />
      {/* Grid */}
      <g className="fill-gray-200 dark:fill-gray-600">
        <rect x="55" y="70" width="12" height="12" rx="2" />
        <rect x="75" y="70" width="12" height="12" rx="2" />
        <rect x="95" y="70" width="12" height="12" rx="2" />
        <rect x="115" y="70" width="12" height="12" rx="2" />
        <rect x="135" y="70" width="12" height="12" rx="2" />
        <rect x="55" y="90" width="12" height="12" rx="2" />
        <rect x="75" y="90" width="12" height="12" rx="2" />
        <rect x="95" y="90" width="12" height="12" rx="2" className="fill-green-200 dark:fill-green-700" />
        <rect x="115" y="90" width="12" height="12" rx="2" />
        <rect x="135" y="90" width="12" height="12" rx="2" />
        <rect x="55" y="110" width="12" height="12" rx="2" />
        <rect x="75" y="110" width="12" height="12" rx="2" />
      </g>
    </svg>
  ),

  // Notifications/Reminders illustration
  notifications: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Bell */}
      <path d="M100 30c-25 0-40 20-40 45v25h80v-25c0-25-15-45-40-45z" className="fill-amber-400 dark:fill-amber-500" />
      <rect x="60" y="100" width="80" height="10" rx="5" className="fill-amber-400 dark:fill-amber-500" />
      <circle cx="100" cy="120" r="12" className="fill-amber-500 dark:fill-amber-400" />
      {/* Ringer */}
      <rect x="96" y="18" width="8" height="16" rx="4" className="fill-amber-500 dark:fill-amber-400" />
      {/* Z's for sleep */}
      <text x="135" y="45" className="fill-gray-300 dark:fill-gray-600" fontSize="20" fontWeight="bold">z</text>
      <text x="150" y="35" className="fill-gray-300 dark:fill-gray-600" fontSize="16" fontWeight="bold">z</text>
      <text x="160" y="28" className="fill-gray-300 dark:fill-gray-600" fontSize="12" fontWeight="bold">z</text>
    </svg>
  ),

  // Error/Warning illustration
  error: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Warning triangle */}
      <path d="M100 25L165 130H35L100 25z" className="fill-red-100 dark:fill-red-900/30" />
      <path d="M100 25L165 130H35L100 25z" className="stroke-red-400 dark:stroke-red-500" strokeWidth="4" fill="none" strokeLinejoin="round" />
      {/* Exclamation mark */}
      <rect x="96" y="55" width="8" height="40" rx="4" className="fill-red-500 dark:fill-red-400" />
      <circle cx="100" cy="110" r="5" className="fill-red-500 dark:fill-red-400" />
    </svg>
  ),

  // Default/Generic illustration
  default: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="100" cy="80" r="50" className="fill-gray-100 dark:fill-gray-700" />
      <circle cx="100" cy="80" r="35" className="fill-gray-200 dark:fill-gray-600" />
      <rect x="85" y="65" width="30" height="30" rx="4" className="fill-green-500 dark:fill-green-600" />
      <path d="M95 80l5 5 10-10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const EmptyState = ({
  variant = 'default',
  title,
  description,
  actionLabel,
  actionLink,
  onAction,
  className = '',
}) => {
  const Illustration = illustrations[variant] || illustrations.default;

  return (
    <div className={`empty-state py-12 px-4 ${className}`}>
      {/* Illustration */}
      <div className="w-48 h-40 mx-auto mb-6 opacity-80">
        {Illustration}
      </div>

      {/* Title */}
      {title && (
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
      )}

      {/* Description */}
      {description && (
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
          {description}
        </p>
      )}

      {/* Action Button */}
      {(actionLabel && (actionLink || onAction)) && (
        actionLink ? (
          <Link
            to={actionLink}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus size={20} />
            {actionLabel}
          </Link>
        ) : (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus size={20} />
            {actionLabel}
          </button>
        )
      )}
    </div>
  );
};

export default EmptyState;
