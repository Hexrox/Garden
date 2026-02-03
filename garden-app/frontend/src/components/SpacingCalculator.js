import React, { useState, useMemo } from 'react';
import { Calculator, Grid3X3, Ruler, Info, X } from 'lucide-react';

const SpacingCalculator = ({ plant, onClose }) => {
  const [bedLength, setBedLength] = useState('');
  const [bedWidth, setBedWidth] = useState('');

  // Parse spacing from plant data (e.g., "50x60 cm" -> { row: 50, plant: 60 })
  const spacing = useMemo(() => {
    if (!plant?.spacing) return null;

    const spacingStr = plant.spacing.toLowerCase();
    // Try to parse patterns like "50x60 cm", "50 cm", "50-60 cm"
    const match = spacingStr.match(/(\d+)[\sx-]+(\d+)?\s*cm/i);
    if (match) {
      return {
        row: parseInt(match[1]),
        plant: parseInt(match[2] || match[1])
      };
    }
    // Single number pattern
    const singleMatch = spacingStr.match(/(\d+)\s*cm/i);
    if (singleMatch) {
      const val = parseInt(singleMatch[1]);
      return { row: val, plant: val };
    }
    return null;
  }, [plant?.spacing]);

  const calculation = useMemo(() => {
    if (!spacing || !bedLength || !bedWidth) return null;

    const lengthCm = parseFloat(bedLength) * 100;
    const widthCm = parseFloat(bedWidth) * 100;

    if (lengthCm <= 0 || widthCm <= 0) return null;

    // Calculate rows and plants per row
    const rows = Math.floor(widthCm / spacing.row);
    const plantsPerRow = Math.floor(lengthCm / spacing.plant);
    const totalPlants = rows * plantsPerRow;

    // Calculate actual used area
    const usedWidth = rows * spacing.row;
    const usedLength = plantsPerRow * spacing.plant;

    return {
      rows,
      plantsPerRow,
      totalPlants,
      usedWidth: usedWidth / 100,
      usedLength: usedLength / 100,
      spacingRow: spacing.row,
      spacingPlant: spacing.plant
    };
  }, [spacing, bedLength, bedWidth]);

  if (!plant) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 pb-24 lg:pb-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-full overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Calculator className="w-8 h-8" />
              <div>
                <h2 className="text-xl font-bold">Kalkulator rozstawu</h2>
                <p className="text-blue-100 text-sm">
                  {plant.display_name || plant.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Plant spacing info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Ruler className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Zalecany rozstaw
              </span>
            </div>
            {spacing ? (
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {spacing.row} cm (między rzędami) × {spacing.plant} cm (w rzędzie)
              </p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                Brak danych o rozstawie dla tej rośliny
                {plant.spacing && <span className="block text-sm mt-1">Oryginalna wartość: {plant.spacing}</span>}
              </p>
            )}
          </div>

          {/* Bed dimensions input */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Wymiary grządki (w metrach)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Długość (m)
                </label>
                <input
                  type="number"
                  value={bedLength}
                  onChange={(e) => setBedLength(e.target.value)}
                  placeholder="np. 3"
                  min="0.1"
                  step="0.1"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Szerokość (m)
                </label>
                <input
                  type="number"
                  value={bedWidth}
                  onChange={(e) => setBedWidth(e.target.value)}
                  placeholder="np. 1.2"
                  min="0.1"
                  step="0.1"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg"
                />
              </div>
            </div>
          </div>

          {/* Calculation results */}
          {calculation && (
            <div className="space-y-4">
              {/* Main result */}
              <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-200 dark:border-green-800 text-center">
                <div className="text-4xl font-bold text-green-700 dark:text-green-300 mb-1">
                  {calculation.totalPlants}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  roślin zmieści się na grządce
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                  <div className="text-2xl font-semibold text-blue-700 dark:text-blue-300">
                    {calculation.rows}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    rzędów
                  </div>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                  <div className="text-2xl font-semibold text-purple-700 dark:text-purple-300">
                    {calculation.plantsPerRow}
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-400">
                    roślin w rzędzie
                  </div>
                </div>
              </div>

              {/* Visual grid */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Grid3X3 className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Wizualizacja
                  </span>
                </div>
                <div
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-2 overflow-hidden"
                  style={{
                    aspectRatio: `${bedLength}/${bedWidth}`,
                    maxHeight: '150px'
                  }}
                >
                  <div
                    className="grid gap-1 w-full h-full"
                    style={{
                      gridTemplateColumns: `repeat(${Math.min(calculation.plantsPerRow, 15)}, 1fr)`,
                      gridTemplateRows: `repeat(${Math.min(calculation.rows, 8)}, 1fr)`
                    }}
                  >
                    {Array.from({ length: Math.min(calculation.totalPlants, 120) }).map((_, i) => (
                      <div
                        key={i}
                        className="bg-green-500 dark:bg-green-600 rounded-full aspect-square"
                        style={{ minWidth: '4px', minHeight: '4px' }}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  Efektywna powierzchnia: {calculation.usedLength.toFixed(1)}m × {calculation.usedWidth.toFixed(1)}m
                </p>
              </div>

              {/* Tips */}
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Zostaw ok. 10-15 cm marginesu od krawędzi grządki dla łatwiejszego dostępu do roślin.
                </p>
              </div>
            </div>
          )}

          {!calculation && spacing && bedLength && bedWidth && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Podaj prawidłowe wymiary grządki
            </div>
          )}

          {!spacing && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Dla tej rośliny nie ma zapisanych danych o rozstawie.
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Sprawdź informacje na opakowaniu nasion lub sadzonek.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpacingCalculator;
