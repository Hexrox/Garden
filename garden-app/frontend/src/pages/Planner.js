import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Filter,
  ChevronDown,
  ChevronUp,
  Calendar,
  AlertTriangle,
  Check,
  X,
  Clock,
  RefreshCw,
  Loader2,
  Download
} from 'lucide-react';
import axios from '../config/axios';
import { useToast } from '../context/ToastContext';
import PlanForm from '../components/PlanForm';
import PlanCard from '../components/PlanCard';

// Typy akcji z ikonami
const ACTION_TYPES = {
  plant: { label: 'Posadzić', icon: '🌱' },
  spray: { label: 'Oprysk', icon: '🧴' },
  water: { label: 'Podlać', icon: '💧' },
  harvest: { label: 'Zebrać', icon: '🥕' },
  transplant: { label: 'Przesadzić', icon: '🔄' },
  fertilize: { label: 'Nawozić', icon: '🧪' },
  prune: { label: 'Przyciąć', icon: '✂️' },
  custom: { label: 'Inne', icon: '📝' }
};

const Planner = () => {
  const { showToast } = useToast();

  // Stan
  const [plans, setPlans] = useState([]);
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  // Modal
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, type: null, planId: null });

  // Filtry
  const [filters, setFilters] = useState({
    status: '',
    action_type: '',
    plot_id: '',
    month: '',
    year: new Date().getFullYear().toString()
  });

  // Miesiące po polsku
  const months = [
    { value: '', label: 'Wszystkie miesiące' },
    { value: '1', label: 'Styczeń' },
    { value: '2', label: 'Luty' },
    { value: '3', label: 'Marzec' },
    { value: '4', label: 'Kwiecień' },
    { value: '5', label: 'Maj' },
    { value: '6', label: 'Czerwiec' },
    { value: '7', label: 'Lipiec' },
    { value: '8', label: 'Sierpień' },
    { value: '9', label: 'Wrzesień' },
    { value: '10', label: 'Październik' },
    { value: '11', label: 'Listopad' },
    { value: '12', label: 'Grudzień' }
  ];

  // Pobierz dane
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Buduj query params
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.action_type) params.append('action_type', filters.action_type);
      if (filters.plot_id) params.append('plot_id', filters.plot_id);
      if (filters.month) params.append('month', filters.month);
      if (filters.year) params.append('year', filters.year);

      const [plansRes, plotsRes] = await Promise.all([
        axios.get(`/api/planner?${params.toString()}`),
        axios.get('/api/plots')
      ]);

      setPlans(plansRes.data);
      setPlots(plotsRes.data);
    } catch (error) {
      console.error('Błąd ładowania danych:', error);
      showToast('Błąd ładowania planów', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Grupowanie planów
  const upcomingPlans = plans.filter(p => ['planned', 'reminded'].includes(p.status));
  const completedPlans = plans.filter(p => p.status === 'completed');
  const cancelledPlans = plans.filter(p => p.status === 'cancelled');
  const overduePlans = upcomingPlans.filter(p => {
    const today = new Date().toISOString().split('T')[0];
    return p.planned_date < today;
  });

  // Akcje na planach
  const handleComplete = async (planId, addToHistory = false, plantData = null) => {
    try {
      const payload = { add_to_history: addToHistory };

      // Dla planów sadzenia dodaj dane grządki
      if (plantData) {
        payload.row_number = plantData.row_number;
        payload.plant_variety = plantData.plant_variety;
        payload.note = plantData.note;
      }

      const response = await axios.post(`/api/planner/${planId}/complete`, payload);

      // Komunikat zależny od odpowiedzi
      if (response.data.bed_created) {
        showToast(`Posadzono w rzędzie ${response.data.bed_created.row_number}`, 'success');
      } else {
        showToast('Plan oznaczony jako wykonany', 'success');
      }
      loadData();
    } catch (error) {
      console.error('Błąd:', error);
      // Przekaż błąd dalej jeśli to z PlanCard
      if (plantData) {
        throw error;
      }
      showToast(error.response?.data?.error || 'Błąd oznaczania planu', 'error');
    }
  };

  const handleReschedule = async (planId, newDate, reason) => {
    try {
      await axios.post(`/api/planner/${planId}/reschedule`, { new_date: newDate, reason });
      showToast('Plan przesunięty', 'success');
      loadData();
    } catch (error) {
      console.error('Błąd:', error);
      showToast('Błąd przesuwania planu', 'error');
    }
  };

  const handleCancel = async (planId) => {
    setConfirmModal({ open: true, type: 'cancel', planId });
  };

  const handleDelete = async (planId) => {
    setConfirmModal({ open: true, type: 'delete', planId });
  };

  const executeConfirmedAction = async () => {
    const { type, planId } = confirmModal;
    setConfirmModal({ open: false, type: null, planId: null });

    try {
      if (type === 'cancel') {
        await axios.post(`/api/planner/${planId}/cancel`);
        showToast('Plan anulowany', 'success');
      } else if (type === 'delete') {
        await axios.delete(`/api/planner/${planId}`);
        showToast('Plan usunięty', 'success');
      }
      loadData();
    } catch (error) {
      console.error('Błąd:', error);
      showToast(type === 'cancel' ? 'Błąd anulowania planu' : 'Błąd usuwania planu', 'error');
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPlan(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    loadData();
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      action_type: '',
      plot_id: '',
      month: '',
      year: new Date().getFullYear().toString()
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Nagłówek */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            📋 Planer
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Planuj przyszłe działania w ogrodzie
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Filter size={18} />
            Filtry
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            onClick={() => {
              window.location.href = '/api/export/ical';
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="Eksportuj plany do kalendarza (iCal)"
          >
            <Download size={18} />
            <span className="hidden sm:inline">iCal</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg"
          >
            <Plus size={18} />
            Dodaj plan
          </button>
        </div>
      </div>

      {/* Filtry */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Typ akcji */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Typ akcji
              </label>
              <select
                value={filters.action_type}
                onChange={(e) => setFilters({ ...filters, action_type: e.target.value })}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Wszystkie typy</option>
                {Object.entries(ACTION_TYPES).map(([key, { label, icon }]) => (
                  <option key={key} value={key}>{icon} {label}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Wszystkie statusy</option>
                <option value="planned">Zaplanowane</option>
                <option value="reminded">Z przypomnieniem</option>
                <option value="completed">Wykonane</option>
                <option value="cancelled">Anulowane</option>
              </select>
            </div>

            {/* Poletko */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Poletko
              </label>
              <select
                value={filters.plot_id}
                onChange={(e) => setFilters({ ...filters, plot_id: e.target.value })}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Wszystkie poletka</option>
                {plots.map(plot => (
                  <option key={plot.id} value={plot.id}>{plot.name}</option>
                ))}
              </select>
            </div>

            {/* Miesiąc */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Miesiąc
              </label>
              <select
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-green-500 focus:border-green-500"
              >
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Rok */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rok
              </label>
              <select
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-green-500 focus:border-green-500"
              >
                {[2024, 2025, 2026, 2027].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <RefreshCw size={14} />
              Resetuj filtry
            </button>
          </div>
        </div>
      )}

      {/* Ostrzeżenie o zaległych planach */}
      {overduePlans.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800 dark:text-amber-200">
                Masz {overduePlans.length} zaległych planów
              </h3>
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                Rozważ przesunięcie ich na nowy termin lub oznaczenie jako wykonane.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sekcja nadchodzących planów */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              Nadchodzące plany
            </h2>
            <span className="px-2.5 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm font-medium rounded-full">
              {upcomingPlans.length}
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {upcomingPlans.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Brak zaplanowanych działań
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-green-600 dark:text-green-400 hover:underline font-medium"
              >
                Dodaj pierwszy plan
              </button>
            </div>
          ) : (
            upcomingPlans.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onComplete={handleComplete}
                onReschedule={handleReschedule}
                onCancel={handleCancel}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))
          )}
        </div>
      </div>

      {/* Sekcja wykonanych planów */}
      {completedPlans.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="w-full px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              Wykonane
            </h2>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium rounded-full">
                {completedPlans.length}
              </span>
              {showCompleted ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </button>

          {showCompleted && (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {completedPlans.map(plan => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onDelete={handleDelete}
                  readonly
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Link do kalendarza */}
      <div className="flex justify-center">
        <Link
          to="/calendar"
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
        >
          <Calendar size={18} />
          Zobacz w kalendarzu
        </Link>
      </div>

      {/* Modal formularza */}
      {showForm && (
        <PlanForm
          isOpen={showForm}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
          editPlan={editingPlan}
          plots={plots}
        />
      )}

      {/* Confirmation Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                confirmModal.type === 'delete'
                  ? 'bg-red-100 dark:bg-red-900/30'
                  : 'bg-orange-100 dark:bg-orange-900/30'
              }`}>
                <span className="text-2xl">{confirmModal.type === 'delete' ? '🗑️' : '❌'}</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {confirmModal.type === 'delete' ? 'Usuń plan?' : 'Anuluj plan?'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {confirmModal.type === 'delete'
                  ? 'Ta operacja jest nieodwracalna.'
                  : 'Plan zostanie oznaczony jako anulowany.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal({ open: false, type: null, planId: null })}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
                >
                  Anuluj
                </button>
                <button
                  onClick={executeConfirmedAction}
                  className={`flex-1 px-4 py-3 text-white rounded-lg transition font-medium ${
                    confirmModal.type === 'delete'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {confirmModal.type === 'delete' ? 'Usuń' : 'Anuluj plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Planner;
