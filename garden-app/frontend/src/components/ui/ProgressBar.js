import React from 'react';

/**
 * ProgressBar Component
 *
 * Displays progress with optional labels, milestones, and animations.
 * Perfect for showing plant growth progress.
 *
 * @param {number} value - Current value (0-100)
 * @param {number} max - Maximum value (default: 100)
 * @param {string} label - Optional label text
 * @param {boolean} showPercentage - Show percentage value
 * @param {string} variant - primary, warning, danger, success
 * @param {string} size - sm, md, lg
 * @param {boolean} animated - Animate progress changes
 * @param {array} milestones - Array of milestone objects [{value: 25, label: 'Seedling', icon: '🌱'}]
 */
export const ProgressBar = ({
  value = 0,
  max = 100,
  label,
  showPercentage = true,
  variant = 'primary',
  size = 'md',
  animated = true,
  milestones = [],
  className = ''
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const variants = {
    primary: 'bg-green-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    success: 'bg-green-600',
    info: 'bg-blue-500',
  };

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-4',
  };

  // Find current milestone
  const currentMilestone = milestones
    .slice()
    .reverse()
    .find(m => percentage >= m.value);

  return (
    <div className={`w-full ${className}`}>
      {/* Header with label and percentage */}
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      {/* Progress bar container */}
      <div className="relative">
        <div className={`
          w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden
          ${sizes[size]}
        `}>
          <div
            className={`
              ${variants[variant]} ${sizes[size]} rounded-full
              ${animated ? 'transition-all duration-500 ease-out' : ''}
            `}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Milestones */}
        {milestones.length > 0 && (
          <div className="relative h-8 mt-2">
            {milestones.map((milestone, index) => {
              const isActive = percentage >= milestone.value;
              const isCurrent = currentMilestone?.value === milestone.value;

              return (
                <div
                  key={index}
                  className="absolute transform -translate-x-1/2"
                  style={{ left: `${milestone.value}%` }}
                >
                  {/* Milestone marker */}
                  <div className={`
                    w-0.5 h-4 -mt-4 mx-auto
                    ${isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}
                  `} />

                  {/* Milestone label */}
                  <div className={`
                    flex flex-col items-center mt-1
                    ${isCurrent ? 'font-semibold' : ''}
                  `}>
                    {milestone.icon && (
                      <span className={`text-lg mb-0.5 ${isCurrent ? 'animate-bounce' : ''}`}>
                        {milestone.icon}
                      </span>
                    )}
                    <span className={`
                      text-xs text-center whitespace-nowrap
                      ${isActive ? 'text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}
                    `}>
                      {milestone.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Current milestone description */}
      {currentMilestone?.description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
          {currentMilestone.description}
        </p>
      )}
    </div>
  );
};

export default ProgressBar;
