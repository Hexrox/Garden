import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * BedDuplicateModal - Powielanie grządki
 */
const BedDuplicateModal = ({ bed, existingBeds, onClose, onDuplicate }) => {
  const [formData, setFormData] = useState({
    row_number: '',
    planted_date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Auto-suggest next available number
    const usedNumbers = existingBeds.map(b => b.row_number);
    const maxNumber = Math.max(...usedNumbers, 0);
    setFormData(prev => ({ ...prev, row_number: maxNumber + 1 }));
  }, [existingBeds]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Sprawdź czy numer już istnieje
    if (existingBeds.some(b => b.row_number === parseInt(formData.row_number))) {
      setError(`Grządka #${formData.row_number} już istnieje`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onDuplicate({
        ...bed,
        row_number: formData.row_number,
        planted_date: formData.planted_date,
        expected_harvest_date: null, // będzie przeliczone
        actual_harvest_date: null,
        yield_amount: null,
        yield_unit: null,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas powielania');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Powiel grządkę
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {bed.plant_name} {bed.plant_variety && `(${bed.plant_variety})`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              💡 Skopiowane zostaną: roślina, odmiana i notatka. Data posadzenia będzie nowa.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Numer nowej grządki *
            </label>
            <input
              type="number"
              min="1"
              required
              value={formData.row_number}
              onChange={(e) => setFormData({ ...formData, row_number: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Sugerowany następny numer (możesz zmienić)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data posadzenia *
            </label>
            <input
              type="date"
              required
              value={formData.planted_date}
              onChange={(e) => setFormData({ ...formData, planted_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? 'Tworzenie...' : '📋 Powiel grządkę'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BedDuplicateModal;
