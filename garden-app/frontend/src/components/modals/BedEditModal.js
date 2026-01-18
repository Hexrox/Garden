import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import PlantSelector from '../PlantSelector';
import axios from '../../config/axios';

/**
 * BedEditModal - Edycja grządki
 */
const BedEditModal = ({ bed, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    plant_name: bed.plant_name || '',
    plant_variety: bed.plant_variety || '',
    planted_date: bed.planted_date || '',
    expected_harvest_date: bed.expected_harvest_date || '',
    note: bed.note || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [companions, setCompanions] = useState({ good: [], bad: [] });
  const [loadingCompanions, setLoadingCompanions] = useState(false);

  // Fetch companion plants when plant_name changes
  useEffect(() => {
    const fetchCompanions = async () => {
      if (!formData.plant_name || formData.plant_name.trim() === '') {
        setCompanions({ good: [], bad: [] });
        return;
      }

      setLoadingCompanions(true);
      try {
        const response = await axios.get(`/api/plants/companions/${formData.plant_name.toLowerCase()}`);
        setCompanions({
          good: response.data.good || [],
          bad: response.data.bad || []
        });
      } catch (err) {
        // Silently fail if no companions found
        setCompanions({ good: [], bad: [] });
      } finally {
        setLoadingCompanions(false);
      }
    };

    fetchCompanions();
  }, [formData.plant_name]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onSave(bed.id, formData);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas zapisywania');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl max-w-2xl w-full my-8 border border-white/20 dark:border-gray-700/50 animate-fade-in-up">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Edytuj grządkę #{bed.row_number}
              </h3>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Roślina
              </label>
              <PlantSelector
                value={formData.plant_name}
                onChange={(plantName) => setFormData({ ...formData, plant_name: plantName })}
                plantedDate={formData.planted_date}
                onHarvestDateCalculated={(harvestDate) => {
                  setFormData({ ...formData, expected_harvest_date: harvestDate });
                }}
              />
            </div>

            {/* Companion Planting Suggestions */}
            {formData.plant_name && (companions.good.length > 0 || companions.bad.length > 0) && (
              <div className="md:col-span-2 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-2 mb-3">
                  <Lightbulb className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                      🌿 Rośliny towarzyszące
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Niektóre rośliny pomagają sobie nawzajem, inne przeszkadzają
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Good Companions */}
                  {companions.good.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <h5 className="text-sm font-semibold text-green-800 dark:text-green-300">
                          Dobrze rośnie obok:
                        </h5>
                      </div>
                      <ul className="space-y-1.5 text-xs">
                        {companions.good.slice(0, 4).map((c, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                            <div className="flex-1">
                              <span className="font-medium text-gray-900 dark:text-white capitalize">{c.name}</span>
                              <span className="text-gray-600 dark:text-gray-400"> - {c.reason}</span>
                            </div>
                          </li>
                        ))}
                        {companions.good.length > 4 && (
                          <li className="text-gray-500 dark:text-gray-400 italic">
                            +{companions.good.length - 4} więcej...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Bad Companions */}
                  {companions.bad.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <h5 className="text-sm font-semibold text-red-800 dark:text-red-300">
                          Unikaj sadzenia obok:
                        </h5>
                      </div>
                      <ul className="space-y-1.5 text-xs">
                        {companions.bad.slice(0, 4).map((c, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-red-600 dark:text-red-400 mt-0.5">✗</span>
                            <div className="flex-1">
                              <span className="font-medium text-gray-900 dark:text-white capitalize">{c.name}</span>
                              <span className="text-gray-600 dark:text-gray-400"> - {c.reason}</span>
                            </div>
                          </li>
                        ))}
                        {companions.bad.length > 4 && (
                          <li className="text-gray-500 dark:text-gray-400 italic">
                            +{companions.bad.length - 4} więcej...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {loadingCompanions && formData.plant_name && (
              <div className="md:col-span-2 text-center text-sm text-gray-500 dark:text-gray-400 py-2">
                Ładowanie podpowiedzi...
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Odmiana
              </label>
              <input
                type="text"
                value={formData.plant_variety}
                onChange={(e) => setFormData({ ...formData, plant_variety: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data posadzenia
              </label>
              <input
                type="date"
                value={formData.planted_date}
                onChange={(e) => setFormData({ ...formData, planted_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notatka
              </label>
              <textarea
                rows="3"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
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
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? 'Zapisywanie...' : '💾 Zapisz zmiany'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BedEditModal;
