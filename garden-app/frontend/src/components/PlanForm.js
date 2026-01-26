import React, { useState, useEffect } from 'react';
import { X, Loader2, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import axios from '../config/axios';
import { useToast } from '../context/ToastContext';
import PlantSelector from './PlantSelector';

// Typy akcji
const ACTION_TYPES = [
  { type: 'plant', label: 'Posadzić', icon: '🌱', requiresPlant: true },
  { type: 'spray', label: 'Oprysk', icon: '🧴', requiresPlant: false },
  { type: 'water', label: 'Podlać', icon: '💧', requiresPlant: false },
  { type: 'harvest', label: 'Zebrać', icon: '🥕', requiresPlant: true },
  { type: 'transplant', label: 'Przesadzić', icon: '🔄', requiresPlant: true },
  { type: 'fertilize', label: 'Nawozić', icon: '🧪', requiresPlant: false },
  { type: 'prune', label: 'Przyciąć', icon: '✂️', requiresPlant: false },
  { type: 'custom', label: 'Inne', icon: '📝', requiresPlant: false }
];

const PlanForm = ({ isOpen, onClose, onSuccess, editPlan, plots }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [beds, setBeds] = useState([]);

  // Formularz
  const [formData, setFormData] = useState({
    action_type: 'plant',
    title: '',
    planned_date: '',
    plant_id: null,
    plot_id: '',
    bed_id: '',
    reminder_days: 3,
    notes: '',
    weather_dependent: false,
    is_recurring: false,
    recurrence_interval: 7,
    recurrence_unit: 'days',
    recurrence_end_date: ''
  });

  // Inicjalizacja formularza przy edycji
  useEffect(() => {
    if (editPlan) {
      setFormData({
        action_type: editPlan.action_type || 'plant',
        title: editPlan.title || '',
        planned_date: editPlan.planned_date || '',
        plant_id: editPlan.plant_id || null,
        plot_id: editPlan.plot_id || '',
        bed_id: editPlan.bed_id || '',
        reminder_days: editPlan.reminder_days ?? 3,
        notes: editPlan.notes || '',
        weather_dependent: Boolean(editPlan.weather_dependent),
        is_recurring: Boolean(editPlan.is_recurring),
        recurrence_interval: editPlan.recurrence_interval || 7,
        recurrence_unit: editPlan.recurrence_unit || 'days',
        recurrence_end_date: editPlan.recurrence_end_date || ''
      });
    } else {
      // Domyślna data: jutro
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData(prev => ({
        ...prev,
        planned_date: tomorrow.toISOString().split('T')[0]
      }));
    }
  }, [editPlan]);

  // Pobierz grządki gdy zmieni się poletko
  useEffect(() => {
    if (formData.plot_id) {
      axios.get(`/api/beds?plot_id=${formData.plot_id}`)
        .then(res => setBeds(res.data))
        .catch(() => setBeds([]));
    } else {
      setBeds([]);
    }
  }, [formData.plot_id]);

  const selectedActionType = ACTION_TYPES.find(a => a.type === formData.action_type);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Walidacja
    if (!formData.title.trim()) {
      showToast('Podaj tytuł planu', 'error');
      return;
    }
    if (!formData.planned_date) {
      showToast('Wybierz datę', 'error');
      return;
    }

    try {
      setLoading(true);

      if (editPlan) {
        await axios.put(`/api/planner/${editPlan.id}`, formData);
        showToast('Plan zaktualizowany', 'success');
      } else {
        await axios.post('/api/planner', formData);
        showToast('Plan dodany', 'success');
      }

      onSuccess();
    } catch (error) {
      console.error('Błąd:', error);
      showToast(error.response?.data?.error || 'Błąd zapisywania planu', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nagłówek */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {editPlan ? 'Edytuj plan' : 'Nowy plan'}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <X size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Typ akcji */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Typ akcji
            </label>
            <div className="grid grid-cols-4 gap-2">
              {ACTION_TYPES.map(action => (
                <button
                  key={action.type}
                  type="button"
                  onClick={() => handleChange('action_type', action.type)}
                  className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                    formData.action_type === action.type
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <span className="text-2xl mb-1">{action.icon}</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tytuł */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tytuł *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder={`np. ${selectedActionType?.label || 'Plan'} pomidory`}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>

          {/* Roślina */}
          {selectedActionType?.requiresPlant && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Roślina
              </label>
              <PlantSelector
                value={formData.plant_id}
                onChange={(plantId) => handleChange('plant_id', plantId)}
                placeholder="Wybierz roślinę..."
              />
            </div>
          )}

          {/* Data */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Planowana data *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={formData.planned_date}
                onChange={(e) => handleChange('planned_date', e.target.value)}
                className="w-full pl-10 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
          </div>

          {/* Poletko i grządka */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Poletko
              </label>
              <select
                value={formData.plot_id}
                onChange={(e) => {
                  handleChange('plot_id', e.target.value);
                  handleChange('bed_id', '');
                }}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Wybierz...</option>
                {plots.map(plot => (
                  <option key={plot.id} value={plot.id}>{plot.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Grządka
              </label>
              <select
                value={formData.bed_id}
                onChange={(e) => handleChange('bed_id', e.target.value)}
                disabled={!formData.plot_id}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-green-500 focus:border-green-500 disabled:opacity-50"
              >
                <option value="">Wybierz...</option>
                {beds.map(bed => (
                  <option key={bed.id} value={bed.id}>
                    Rząd {bed.row_number}: {bed.plant_name || 'Puste'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Przypomnienie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Przypomnij mi
            </label>
            <select
              value={formData.reminder_days}
              onChange={(e) => handleChange('reminder_days', parseInt(e.target.value))}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-green-500 focus:border-green-500"
            >
              <option value={0}>Bez przypomnienia</option>
              <option value={1}>1 dzień przed</option>
              <option value={3}>3 dni przed</option>
              <option value={7}>Tydzień przed</option>
              <option value={14}>2 tygodnie przed</option>
            </select>
          </div>

          {/* Pogoda */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <input
              type="checkbox"
              id="weather_dependent"
              checked={formData.weather_dependent}
              onChange={(e) => handleChange('weather_dependent', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <label htmlFor="weather_dependent" className="flex-1">
              <span className="font-medium text-gray-900 dark:text-white">
                Sprawdź pogodę przed wykonaniem
              </span>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Otrzymasz ostrzeżenie jeśli prognoza jest niekorzystna
              </p>
            </label>
          </div>

          {/* Powtarzalność */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_recurring"
                checked={formData.is_recurring}
                onChange={(e) => handleChange('is_recurring', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="is_recurring" className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                <RefreshCw size={18} className="text-green-600" />
                Plan cykliczny
              </label>
            </div>

            {formData.is_recurring && (
              <div className="pl-8 space-y-4 border-l-2 border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Powtarzaj co</span>
                  <input
                    type="number"
                    min="1"
                    value={formData.recurrence_interval}
                    onChange={(e) => handleChange('recurrence_interval', parseInt(e.target.value) || 1)}
                    className="w-20 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-green-500 focus:border-green-500"
                  />
                  <select
                    value={formData.recurrence_unit}
                    onChange={(e) => handleChange('recurrence_unit', e.target.value)}
                    className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="days">dni</option>
                    <option value="weeks">tygodni</option>
                    <option value="months">miesięcy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Data zakończenia (opcjonalnie)
                  </label>
                  <input
                    type="date"
                    value={formData.recurrence_end_date}
                    onChange={(e) => handleChange('recurrence_end_date', e.target.value)}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notatki */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notatki
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              placeholder="Dodatkowe informacje..."
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Przyciski */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Zapisywanie...
                </>
              ) : (
                editPlan ? 'Zapisz zmiany' : 'Dodaj plan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlanForm;
