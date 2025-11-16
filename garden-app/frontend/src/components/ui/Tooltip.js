import React, { useState } from 'react';
import { Info, HelpCircle } from 'lucide-react';

/**
 * Tooltip Component
 *
 * Wyświetla pomocnicze informacje po najechaniu myszką
 */
const Tooltip = ({
  content,
  children,
  position = 'top',
  icon = 'info',
  iconSize = 16,
  delay = 200,
  className = ''
}) => {
  const [show, setShow] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

  const handleMouseEnter = () => {
    const id = setTimeout(() => setShow(true), delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setShow(false);
  };

  const Icon = icon === 'help' ? HelpCircle : Info;

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 border-l-transparent border-r-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 border-l-transparent border-r-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 border-t-transparent border-b-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 border-t-transparent border-b-transparent',
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-flex items-center"
      >
        {children || (
          <Icon
            size={iconSize}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-help transition-colors"
          />
        )}
      </div>

      {show && content && (
        <div
          className={`
            absolute z-50 ${positionClasses[position]}
            px-3 py-2 text-sm text-white bg-gray-900 dark:bg-gray-800
            rounded-lg shadow-lg
            max-w-xs whitespace-normal
            pointer-events-none
            animate-in fade-in duration-200
          `}
        >
          {content}
          {/* Arrow */}
          <div
            className={`
              absolute w-0 h-0
              border-4 ${arrowClasses[position]}
            `}
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip;

/**
 * InfoTooltip - Skrócona wersja z ikonką info
 */
export const InfoTooltip = ({ content, position = 'top' }) => (
  <Tooltip content={content} position={position} icon="info" />
);

/**
 * HelpTooltip - Skrócona wersja z ikonką help
 */
export const HelpTooltip = ({ content, position = 'top' }) => (
  <Tooltip content={content} position={position} icon="help" />
);
