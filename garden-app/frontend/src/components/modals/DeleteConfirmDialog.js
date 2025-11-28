import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

/**
 * DeleteConfirmDialog - Potwierdzenie usunięcia grządki
 */
const DeleteConfirmDialog = ({ bed, onClose, onDelete }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete(bed.id);
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Błąd podczas usuwania');
    } finally {
      setLoading(false);
    }
  };

  // Oblicz status dla lepszego komunikatu
  const getDaysGrowing = () => {
    if (!bed.planted_date) return null;
    const days = Math.floor((new Date() - new Date(bed.planted_date)) / (1000 * 60 * 60 * 24));
    return days;
  };

  const daysGrowing = getDaysGrowing();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Usuń grządkę?
            </h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Informacje o grządce */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Grządka:</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                #{bed.row_number}
              </span>
            </div>
            {bed.plant_name && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Roślina:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {bed.plant_name}
                    {bed.plant_variety && ` (${bed.plant_variety})`}
                  </span>
                </div>
                {daysGrowing !== null && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      Rośnie ({daysGrowing} {daysGrowing === 1 ? 'dzień' : 'dni'})
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Ostrzeżenie */}
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
              ⚠️ To działanie jest nieodwracalne!
            </p>
            <ul className="text-xs text-red-700 dark:text-red-400 space-y-1 list-disc list-inside">
              <li>Grządka zostanie usunięta z bazy danych</li>
              <li>Numer #{bed.row_number} będzie wolny do użycia</li>
              <li>Zdjęcia zostaną zachowane w galerii</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
            >
              Anuluj
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Usuwanie...' : '🗑️ Usuń grządkę'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmDialog;
