import React from 'react';
import { Sprout, Calendar, Droplets, Package } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

/**
 * BedGridView Component
 *
 * Simplified visual layout showing all beds as a grid.
 * Color-coded by status for at-a-glance overview.
 * Perfect for hobby gardeners who want simple visualization.
 */
const BedGridView = ({ beds = [], onBedClick }) => {
  if (!beds || beds.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-12 text-center border-2 border-dashed border-gray-300 dark:border-gray-700">
        <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Brak grządek
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Dodaj pierwszą grządkę aby zobaczyć layout
        </p>
      </div>
    );
  }

  // Sort beds by row number
  const sortedBeds = [...beds].sort((a, b) => a.row_number - b.row_number);

  // Get bed status for color coding
  const getBedStatus = (bed) => {
    if (!bed.plant_name) return 'empty';
    if (bed.actual_harvest_date) return 'harvested';

    // Check if ready to harvest
    if (bed.expected_harvest_date) {
      const today = new Date();
      const harvestDate = new Date(bed.expected_harvest_date);
      const daysUntil = Math.floor((harvestDate - today) / (1000 * 60 * 60 * 24));

      if (daysUntil <= 0) return 'ready';
      if (daysUntil <= 7) return 'soon';
    }

    return 'growing';
  };

  // Status configuration
  const statusConfig = {
    empty: {
      bg: 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600',
      hoverBg: 'hover:bg-gray-200 dark:hover:bg-gray-700',
      icon: Package,
      iconColor: 'text-gray-400',
      label: 'Pusta',
      badgeVariant: 'default',
    },
    growing: {
      bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-700',
      hoverBg: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
      icon: Sprout,
      iconColor: 'text-blue-600 dark:text-blue-400',
      label: 'Rośnie',
      badgeVariant: 'info',
    },
    soon: {
      bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700',
      hoverBg: 'hover:bg-amber-100 dark:hover:bg-amber-900/30',
      icon: Calendar,
      iconColor: 'text-amber-600 dark:text-amber-400',
      label: 'Wkrótce',
      badgeVariant: 'warning',
    },
    ready: {
      bg: 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-600',
      hoverBg: 'hover:bg-green-100 dark:hover:bg-green-900/30',
      icon: Sprout,
      iconColor: 'text-green-600 dark:text-green-400',
      label: 'Gotowe! 🎉',
      badgeVariant: 'success',
    },
    harvested: {
      bg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700',
      hoverBg: 'hover:bg-purple-100 dark:hover:bg-purple-900/30',
      icon: Droplets,
      iconColor: 'text-purple-600 dark:text-purple-400',
      label: 'Zebrane',
      badgeVariant: 'info',
    },
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Układ grządek
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {beds.length} {beds.length === 1 ? 'grządka' : 'grządek'}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(statusConfig).map(([status, config]) => (
          <div key={status} className="flex items-center gap-1.5 text-xs">
            <div className={`w-3 h-3 rounded-sm border ${config.bg} ${config.bg.split(' ')[0]}`} />
            <span className="text-gray-600 dark:text-gray-400">{config.label}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {sortedBeds.map((bed) => {
          const status = getBedStatus(bed);
          const config = statusConfig[status];
          const Icon = config.icon;

          return (
            <button
              key={bed.id}
              onClick={() => onBedClick && onBedClick(bed)}
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-200
                ${config.bg} ${config.hoverBg}
                hover:shadow-md hover:-translate-y-0.5
                focus:outline-none focus:ring-2 focus:ring-green-500
                text-left
              `}
            >
              {/* Row Number Badge */}
              <div className="absolute top-2 right-2">
                <Badge variant={config.badgeVariant} size="sm">
                  #{bed.row_number}
                </Badge>
              </div>

              {/* Icon */}
              <div className="mb-3">
                <Icon className={`w-8 h-8 ${config.iconColor}`} />
              </div>

              {/* Plant Name */}
              <div className="mb-1">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">
                  {bed.plant_name || 'Pusta grządka'}
                </h4>
                {bed.plant_variety && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                    {bed.plant_variety}
                  </p>
                )}
              </div>

              {/* Status */}
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {config.label}
              </div>

              {/* Quick Info */}
              {bed.planted_date && !bed.actual_harvest_date && (
                <div className="mt-2 pt-2 border-t border-current/10">
                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <Calendar size={12} />
                    <span>
                      {Math.floor((new Date() - new Date(bed.planted_date)) / (1000 * 60 * 60 * 24))} dni
                    </span>
                  </div>
                </div>
              )}

              {/* Harvested info */}
              {bed.actual_harvest_date && bed.yield_amount && (
                <div className="mt-2 pt-2 border-t border-current/10">
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {bed.yield_amount} {bed.yield_unit || 'kg'}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BedGridView;
