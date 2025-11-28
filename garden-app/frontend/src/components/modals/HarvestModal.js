import React, { useState } from 'react';
import { X } from 'lucide-react';

/**
 * HarvestModal - Formularz zbioru plonów z grządki
 *
 * @param {Object} bed - grządka do zbioru
 * @param {Function} onClose - zamknięcie modala
 * @param {Function} onHarvest - callback po zebraniu (bed, harvestData)
 */
const HarvestModal = ({ bed, onClose, onHarvest }) => {
  const [formData, setFormData] = useState({
    actual_harvest_date: new Date().toISOString().split('T')[0],
    yield_amount: '',
    yield_unit: 'kg',
    clearBed: true, // domyślnie: wolna grządka
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.yield_amount || formData.yield_amount <= 0) {
      setError('Podaj ilość plonu');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onHarvest(bed, formData);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas zapisywania zbioru');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🌾</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Zbiór plonów
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {bed.plant_name} {bed.plant_variety && `(${bed.plant_variety})`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Data zbioru */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              📅 Data zbioru *
            </label>
            <input
              type="date"
              required
              value={formData.actual_harvest_date}
              onChange={(e) => setFormData({ ...formData, actual_harvest_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Plon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ⚖️ Plon *
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                min="0"
                required
                placeholder="0.0"
                value={formData.yield_amount}
                onChange={(e) => setFormData({ ...formData, yield_amount: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <select
                value={formData.yield_unit}
                onChange={(e) => setFormData({ ...formData, yield_unit: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="kg">kg</option>
                <option value="szt">szt</option>
                <option value="l">l</option>
              </select>
            </div>
          </div>

          {/* Opcje po zebraniu */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Po zebraniu:
            </p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                checked={formData.clearBed}
                onChange={() => setFormData({ ...formData, clearBed: true })}
                className="mt-1"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Wolna grządka (domyślnie)
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Opróżnia grządkę, zachowuje numer i zdjęcia w galerii
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                checked={!formData.clearBed}
                onChange={() => setFormData({ ...formData, clearBed: false })}
                className="mt-1"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Historia (archiwum)
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Zachowuje wszystko, oznacza jako zebrane
                </p>
              </div>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Zapisywanie...' : '🌾 Potwierdź zbiór'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HarvestModal;
