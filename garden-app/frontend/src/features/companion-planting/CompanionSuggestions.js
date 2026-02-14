import React, { useState } from 'react';
import { CheckCircle, XCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { getCompanions, normalizePlantName } from './companionsData';

/**
 * CompanionSuggestions Component
 *
 * Shows which plants grow well together (companions) and which should be avoided (antagonists).
 * Based on scientific companion planting research.
 */
const CompanionSuggestions = ({ plantName, nearbyBeds = [] }) => {
  const [expanded, setExpanded] = useState(false);

  if (!plantName) {
    return null;
  }

  const companions = getCompanions(plantName);

  // Check what's actually planted nearby
  const nearbyPlants = nearbyBeds
    .filter((bed) => bed.plant_name)
    .map((bed) => ({
      name: bed.plant_name,
      normalized: normalizePlantName(bed.plant_name),
      rowNumber: bed.row_number,
      variety: bed.plant_variety,
    }));

  // Check for conflicts with nearby plants
  const conflicts = nearbyPlants.filter((nearby) => {
    return companions.bad.some(
      (badComp) => normalizePlantName(badComp.plant) === nearby.normalized
    );
  });

  // Check for good companions nearby
  const goodNeighbors = nearbyPlants.filter((nearby) => {
    return companions.good.some(
      (goodComp) => normalizePlantName(goodComp.plant) === nearby.normalized
    );
  });

  // If no companion data, show info message
  if (companions.good.length === 0 && companions.bad.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Info size={18} />
          <span className="text-sm">
            Brak danych o roślinach towarzyszących dla: {plantName}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-left">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
              Rośliny towarzyszące
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {companions.good.length} dobrych • {companions.bad.length} unikać
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {conflicts.length > 0 && (
            <Badge variant="error" size="sm">
              ⚠️ {conflicts.length} konflikt{conflicts.length > 1 ? 'ów' : ''}
            </Badge>
          )}
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <div className="px-4 pb-3">
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-3 rounded-r">
            <div className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 dark:text-red-300 text-sm">
                  Ostrzeżenie: Złe sąsiedztwo!
                </p>
                <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                  {plantName} nie powinien być blisko:{' '}
                  {conflicts.map((c, i) => (
                    <span key={i}>
                      {c.name} (rząd {c.rowNumber})
                      {i < conflicts.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Good Neighbors Alert */}
      {goodNeighbors.length > 0 && (
        <div className="px-4 pb-3">
          <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-3 rounded-r">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-800 dark:text-green-300 text-sm">
                  Świetnie! Dobre sąsiedztwo
                </p>
                <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                  {plantName} dobrze rośnie obok:{' '}
                  {goodNeighbors.map((c, i) => (
                    <span key={i}>
                      {c.name} (rząd {c.rowNumber})
                      {i < goodNeighbors.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Good Companions */}
          {companions.good.length > 0 && (
            <div>
              <h5 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-3">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Dobre sąsiedztwo ({companions.good.length})
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {companions.good.map((companion, index) => (
                  <div
                    key={index}
                    className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-green-900 dark:text-green-300 text-sm capitalize">
                            {companion.plant}
                          </span>
                          <Badge variant="success" size="sm">
                            {companion.distance}
                          </Badge>
                        </div>
                        <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                          {companion.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bad Companions */}
          {companions.bad.length > 0 && (
            <div>
              <h5 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-3">
                <XCircle className="w-4 h-4 text-red-600" />
                Unikaj sąsiedztwa ({companions.bad.length})
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {companions.bad.map((companion, index) => (
                  <div
                    key={index}
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-red-900 dark:text-red-300 text-sm capitalize">
                            {companion.plant}
                          </span>
                          <Badge variant="error" size="sm">
                            {companion.distance}
                          </Badge>
                        </div>
                        <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                          {companion.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Footer */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
              <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
              <span>
                Rośliny towarzyszące pomagają w naturalnej ochronie przed szkodnikami,
                poprawiają wzrost i smak. Podane odległości są zalecane dla optymalnych
                rezultatów.
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanionSuggestions;
