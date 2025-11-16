import React from 'react';
import { Sprout, Calendar, TrendingUp } from 'lucide-react';
import ProgressBar from '../../components/ui/ProgressBar';
import { Badge } from '../../components/ui/Badge';
import {
  calculateGrowthProgress,
  getGrowthStages,
  formatDaysRemaining,
} from './growthCalculator';

/**
 * GrowthProgressCard Component
 *
 * Displays plant growth progress with visual progress bar and milestones
 */
const GrowthProgressCard = ({ bed }) => {
  // Skip if no planting data
  if (!bed.planted_date || !bed.expected_harvest_date) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Sprout size={20} />
          <span className="text-sm">Brak danych o wzroście</span>
        </div>
      </div>
    );
  }

  // Calculate days to harvest from dates
  const plantedDate = new Date(bed.planted_date);
  const expectedHarvestDate = new Date(bed.expected_harvest_date);
  const daysToHarvest = Math.floor(
    (expectedHarvestDate - plantedDate) / (1000 * 60 * 60 * 24)
  );

  const growth = calculateGrowthProgress(bed.planted_date, daysToHarvest);
  const stages = getGrowthStages();

  // Prepare milestones for progress bar
  const milestones = stages.map((stage) => ({
    value: stage.threshold,
    label: stage.name,
    icon: stage.icon,
    description: stage.description,
  }));

  // Status badge variant
  const statusVariant = growth.isOverdue
    ? 'error'
    : growth.isReady
    ? 'success'
    : growth.progress >= 80
    ? 'warning'
    : 'info';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Postęp wzrostu
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {growth.currentStage.name}
            </p>
          </div>
        </div>
        <Badge variant={statusVariant}>
          {growth.isReady
            ? 'Gotowe! 🎉'
            : growth.isOverdue
            ? `Spóźnione ${Math.abs(growth.daysRemaining)} dni`
            : formatDaysRemaining(growth.daysRemaining)}
        </Badge>
      </div>

      {/* Progress Bar with Milestones */}
      <div className="mb-4">
        <ProgressBar
          value={growth.progress}
          variant={growth.variant}
          size="lg"
          milestones={milestones}
          animated
          showPercentage
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
            <Calendar size={14} />
            <span className="text-xs font-medium">Posadzone</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {growth.daysElapsed} dni temu
          </p>
        </div>

        <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
            <Sprout size={14} />
            <span className="text-xs font-medium">Dni wzrostu</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {daysToHarvest} dni
          </p>
        </div>

        <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
            <TrendingUp size={14} />
            <span className="text-xs font-medium">
              {growth.isReady ? 'Zbierz!' : 'Pozostało'}
            </span>
          </div>
          <p
            className={`text-sm font-semibold ${
              growth.isReady
                ? 'text-green-600 dark:text-green-400'
                : growth.isOverdue
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-900 dark:text-white'
            }`}
          >
            {growth.isReady
              ? 'Gotowe! 🎉'
              : formatDaysRemaining(growth.daysRemaining)}
          </p>
        </div>
      </div>

      {/* Current Stage Description */}
      {growth.currentStage.description && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            💡 {growth.currentStage.description}
          </p>
        </div>
      )}

      {/* Ready to Harvest Alert */}
      {growth.isReady && !bed.actual_harvest_date && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-500 dark:border-green-600">
          <p className="text-sm font-semibold text-green-800 dark:text-green-300 text-center">
            🌾 Roślina jest gotowa do zbioru!
          </p>
        </div>
      )}

      {/* Overdue Alert */}
      {growth.isOverdue && !bed.actual_harvest_date && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-500 dark:border-red-600">
          <p className="text-sm font-semibold text-red-800 dark:text-red-300 text-center">
            ⚠️ Zbiór spóźniony o {Math.abs(growth.daysRemaining)} dni
          </p>
        </div>
      )}
    </div>
  );
};

export default GrowthProgressCard;
