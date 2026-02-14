import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, Trash2, X, Grid3X3, List, AlertTriangle,
  Check, Calendar, Leaf, Loader2, Lightbulb, Play, Search, Calculator, Edit2
} from 'lucide-react';
import axios, { getImageUrl } from '../config/axios';
import { useToast } from '../context/ToastContext';
import { checkCompatibility } from '../features/companion-planting/companionsData';
import SpacingCalculator from '../components/SpacingCalculator';

// Parsuj rozstaw z tekstu (np. "50x60 cm" -> 55, "30 cm" -> 30)
const parseSpacing = (spacingStr) => {
  if (!spacingStr) return 30; // domyślnie 30cm
  const str = spacingStr.toLowerCase();
  const match = str.match(/(\d+)[\sx-]+(\d+)?\s*cm/i);
  if (match) {
    const val1 = parseInt(match[1]);
    const val2 = match[2] ? parseInt(match[2]) : val1;
    return Math.round((val1 + val2) / 2);
  }
  const singleMatch = str.match(/(\d+)\s*cm/i);
  if (singleMatch) return parseInt(singleMatch[1]);
  return 30;
};

const GardenPlanner = () => {
  const { showToast } = useToast();

  // State
  const [plans, setPlans] = useState([]);
  const [plots, setPlots] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddPlantModal, setShowAddPlantModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [companionAnalysis, setCompanionAnalysis] = useState(null);
  const [calculatorPlant, setCalculatorPlant] = useState(null);

  // Task creation modal state
  const [taskPlannedDate, setTaskPlannedDate] = useState('');
  const [selectedItemsForTask, setSelectedItemsForTask] = useState([]);
  const [creatingTasks, setCreatingTasks] = useState(false);

  // Form state for new plan
  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    plot_id: '',
    width_cm: 300,
    length_cm: 100
  });

  // Edit plan form state
  const [editPlan, setEditPlan] = useState({ name: '', description: '', plot_id: '', width_cm: 300, length_cm: 100 });

  // Plan filtering
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated');

  // Plant search
  const [plantSearch, setPlantSearch] = useState('');

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [plansRes, plotsRes, plantsRes] = await Promise.all([
        axios.get('/api/garden-plans'),
        axios.get('/api/plots'),
        axios.get('/api/plants')
      ]);
      setPlans(plansRes.data);
      setPlots(plotsRes.data);
      setPlants(plantsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Błąd ładowania danych', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load plan details
  const loadPlanDetails = useCallback(async (planId) => {
    try {
      // Load plan data first (critical)
      const planRes = await axios.get(`/api/garden-plans/${planId}`);
      setSelectedPlan(planRes.data);

      // Load companion analysis separately (non-critical)
      try {
        const analysisRes = await axios.get(`/api/garden-plans/${planId}/companion-analysis`);
        setCompanionAnalysis(analysisRes.data);
      } catch (analysisError) {
        console.warn('Could not load companion analysis:', analysisError);
        setCompanionAnalysis(null);
      }
    } catch (error) {
      console.error('Error loading plan:', error);
      showToast('Błąd ładowania planu', 'error');
    }
  }, [showToast]);

  // Create new plan
  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/garden-plans', newPlan);
      showToast('Plan utworzony', 'success');
      setShowCreateModal(false);
      setNewPlan({ name: '', description: '', plot_id: '', width_cm: 300, length_cm: 100 });
      await loadData();
      await loadPlanDetails(response.data.id);
    } catch (error) {
      showToast(error.response?.data?.error || 'Błąd tworzenia planu', 'error');
    }
  };

  // Edit plan
  const handleEditPlan = async (e) => {
    e.preventDefault();
    if (!selectedPlan) return;
    try {
      await axios.put(`/api/garden-plans/${selectedPlan.id}`, editPlan);
      showToast('Plan zaktualizowany', 'success');
      setShowEditModal(false);
      await loadData();
      await loadPlanDetails(selectedPlan.id);
    } catch (error) {
      showToast(error.response?.data?.error || 'Błąd aktualizacji planu', 'error');
    }
  };

  const openEditModal = () => {
    if (!selectedPlan) return;
    setEditPlan({
      name: selectedPlan.name || '',
      description: selectedPlan.description || '',
      plot_id: selectedPlan.plot_id || '',
      width_cm: selectedPlan.width_cm || 300,
      length_cm: selectedPlan.length_cm || 100
    });
    setShowEditModal(true);
  };

  // Delete plan
  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten plan?')) return;
    try {
      await axios.delete(`/api/garden-plans/${planId}`);
      showToast('Plan usunięty', 'success');
      if (selectedPlan?.id === planId) {
        setSelectedPlan(null);
        setCompanionAnalysis(null);
      }
      loadData();
    } catch (error) {
      showToast('Błąd usuwania planu', 'error');
    }
  };

  // Add plant to plan
  const handleAddPlant = async (plant) => {
    if (!selectedPlan) return;

    try {
      const response = await axios.post(`/api/garden-plans/${selectedPlan.id}/items`, {
        plant_id: plant.id,
        plant_name: plant.display_name || plant.name,
        quantity: 1
      });

      // Close modal and show success
      setShowAddPlantModal(false);
      setPlantSearch('');
      showToast(`Dodano: ${plant.display_name || plant.name}`, 'success');

      // Refresh plan details
      await loadPlanDetails(selectedPlan.id);
    } catch (error) {
      console.error('Error adding plant:', error);
      showToast(error.response?.data?.error || 'Błąd dodawania rośliny', 'error');
    }
  };

  // Remove plant from plan
  const handleRemovePlant = async (itemId) => {
    const planId = selectedPlan.id;
    try {
      await axios.delete(`/api/garden-plans/${planId}/items/${itemId}`);
      showToast('Roślina usunięta', 'success');
      await loadPlanDetails(planId);
    } catch (error) {
      console.error('Error removing plant:', error);
      showToast('Błąd usuwania rośliny', 'error');
    }
  };

  // Update plant quantity
  const handleUpdateQuantity = async (itemId, quantity) => {
    const planId = selectedPlan.id;
    try {
      await axios.put(`/api/garden-plans/${planId}/items/${itemId}`, { quantity });
      await loadPlanDetails(planId);
    } catch (error) {
      console.error('Error updating quantity:', error);
      showToast('Błąd aktualizacji', 'error');
    }
  };

  // Open task creation modal
  const openTaskModal = () => {
    if (!selectedPlan) return;

    // Check if tasks already created
    if (selectedPlan.tasks_created_at) {
      showToast('Zadania dla tego planu już zostały utworzone', 'warning');
      return;
    }

    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setTaskPlannedDate(tomorrow.toISOString().split('T')[0]);

    // Select all items by default
    setSelectedItemsForTask(selectedPlan.items?.map(item => item.id) || []);
    setShowTaskModal(true);
  };

  // Actually create tasks (called from modal)
  const handleConfirmCreateTasks = async () => {
    if (!selectedPlan || !taskPlannedDate) return;
    if (selectedItemsForTask.length === 0) {
      showToast('Wybierz przynajmniej jedną roślinę', 'error');
      return;
    }

    const planId = selectedPlan.id;
    setCreatingTasks(true);

    try {
      const response = await axios.post(`/api/garden-plans/${planId}/convert-to-tasks`, {
        planned_date: taskPlannedDate,
        selected_items: selectedItemsForTask
      });
      showToast(response.data.message, 'success');
      setShowTaskModal(false);
      await loadData();
      await loadPlanDetails(planId);
    } catch (error) {
      showToast(error.response?.data?.error || 'Błąd tworzenia zadań', 'error');
    } finally {
      setCreatingTasks(false);
    }
  };

  // Delete tasks for plan (allows re-creating)
  const handleDeletePlanTasks = async () => {
    if (!selectedPlan) return;
    if (!window.confirm('Czy na pewno chcesz usunąć wszystkie zadania z tego planu? Będziesz mógł utworzyć je ponownie.')) return;

    const planId = selectedPlan.id;
    try {
      const response = await axios.delete(`/api/garden-plans/${planId}/tasks`);
      showToast(response.data.message, 'success');
      await loadData();
      await loadPlanDetails(planId);
    } catch (error) {
      showToast(error.response?.data?.error || 'Błąd usuwania zadań', 'error');
    }
  };

  // Toggle item selection for task creation
  const toggleItemForTask = (itemId) => {
    setSelectedItemsForTask(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Execute plan (plant everything)
  const handleExecutePlan = async () => {
    if (!selectedPlan) return;
    if (!window.confirm('Czy na pewno chcesz posadzić wszystkie rośliny z planu? Zostaną utworzone grządki.')) return;

    const planId = selectedPlan.id;
    try {
      const response = await axios.post(`/api/garden-plans/${planId}/execute`);
      showToast(response.data.message, 'success');
      await loadData();
      await loadPlanDetails(planId);
    } catch (error) {
      showToast(error.response?.data?.error || 'Błąd wykonywania planu', 'error');
    }
  };

  // Filter plants for search
  const filteredPlantsData = useMemo(() => {
    let filtered;
    if (!plantSearch) {
      filtered = plants;
    } else {
      const search = plantSearch.toLowerCase();
      filtered = plants.filter(p =>
        (p.display_name || p.name || '').toLowerCase().includes(search) ||
        (p.latin_name || '').toLowerCase().includes(search)
      );
    }
    return { items: filtered.slice(0, 20), totalCount: filtered.length };
  }, [plants, plantSearch]);

  const filteredPlants = filteredPlantsData.items;

  // Filter and sort plans
  const filteredPlans = useMemo(() => {
    let result = [...plans];
    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
    }
    if (sortBy === 'name') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pl'));
    } else if (sortBy === 'created') {
      result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }
    // 'updated' is default from backend
    return result;
  }, [plans, statusFilter, sortBy]);

  // Check companion planting compatibility
  const getCompanionInfo = (plant) => {
    if (!selectedPlan?.items?.length) return { status: 'neutral', message: null };

    const plantName = (plant.display_name || plant.name || '');

    for (const existing of selectedPlan.items) {
      const existingName = existing.plant_name || existing.display_name || '';

      // Sprawdź w obie strony
      const result1 = checkCompatibility(plantName, existingName);
      const result2 = checkCompatibility(existingName, plantName);

      if (result1 === 'bad' || result2 === 'bad') {
        return {
          status: 'bad',
          message: `Konflikt z: ${existingName}`
        };
      }
      if (result1 === 'good' || result2 === 'good') {
        return {
          status: 'good',
          message: `Pasuje do: ${existingName}`
        };
      }
    }

    return { status: 'neutral', message: null };
  };

  // Calculate spacing info
  const calculateSpacing = (items, widthCm, lengthCm) => {
    let totalPlants = 0;
    let totalArea = 0;

    items.forEach(item => {
      totalPlants += item.quantity || 1;
      const spacingCm = parseSpacing(item.spacing);
      totalArea += (item.quantity || 1) * (spacingCm * spacingCm);
    });

    const bedArea = (widthCm || 300) * (lengthCm || 100);
    const usagePercent = Math.min(100, Math.round((totalArea / bedArea) * 100));

    return { totalPlants, usagePercent };
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Grid3X3 className="w-6 h-6 sm:w-7 sm:h-7 text-green-600" />
            Zaplanuj ogródek
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Projektuj układ roślin przed sadzeniem
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg"
        >
          <Plus size={18} />
          Nowy plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Plans List */}
        <div className="md:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Twoje plany ({plans.length})
          </h2>

          {plans.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <option value="all">Wszystkie statusy</option>
                <option value="draft">Szkice</option>
                <option value="active">Aktywne</option>
                <option value="completed">Ukończone</option>
                <option value="archived">Zarchiwizowane</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <option value="updated">Ostatnio zmienione</option>
                <option value="name">Nazwa</option>
                <option value="created">Data utworzenia</option>
              </select>
            </div>
          )}

          {filteredPlans.length === 0 && plans.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center border border-gray-200 dark:border-gray-700">
              <Grid3X3 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Nie masz jeszcze żadnych planów
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-green-600 dark:text-green-400 font-medium hover:underline"
              >
                Utwórz pierwszy plan
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPlans.map(plan => (
                <div
                  key={plan.id}
                  onClick={() => loadPlanDetails(plan.id)}
                  className={`bg-white dark:bg-gray-800 rounded-xl p-4 border cursor-pointer transition-all ${
                    selectedPlan?.id === plan.id
                      ? 'border-green-500 ring-2 ring-green-500/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {plan.name}
                      </h3>
                      {plan.plot_name && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Poletko: {plan.plot_name}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          plan.status === 'draft' ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300' :
                          plan.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                          plan.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                          'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        }`}>
                          {plan.status === 'draft' ? 'Szkic' : plan.status === 'active' ? 'Aktywny' : plan.status === 'completed' ? 'Ukończone' : 'Zarchiwizowany'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {plan.items_count || 0} roślin
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan.id); }}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {filteredPlans.length === 0 && plans.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              Brak planów pasujących do filtrów
            </p>
          )}
        </div>

        {/* Plan Details / Editor */}
        <div className="lg:col-span-2">
          {selectedPlan ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Plan Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedPlan.name}
                      </h2>
                      <button
                        onClick={openEditModal}
                        className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                        title="Edytuj plan"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                    {selectedPlan.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {selectedPlan.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                      title={viewMode === 'grid' ? 'Widok listy' : 'Widok siatki'}
                    >
                      {viewMode === 'grid' ? <List size={20} /> : <Grid3X3 size={20} />}
                    </button>
                  </div>
                </div>

                {/* Stats */}
                {selectedPlan.items && selectedPlan.items.length > 0 && (
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    {(() => {
                      const stats = calculateSpacing(selectedPlan.items, selectedPlan.width_cm, selectedPlan.length_cm);
                      return (
                        <>
                          <span className="text-gray-600 dark:text-gray-300">
                            <Leaf className="w-4 h-4 inline mr-1" />
                            {stats.totalPlants} roślin
                          </span>
                          <span className="text-gray-600 dark:text-gray-300">
                            <Calculator className="w-4 h-4 inline mr-1" />
                            ~{stats.usagePercent}% powierzchni
                          </span>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Companion Analysis Alert */}
              {companionAnalysis && companionAnalysis.has_conflicts && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-200 text-sm">
                        Wykryto {companionAnalysis.conflicts.length} konfliktów sąsiedztwa
                      </p>
                      <ul className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                        {companionAnalysis.conflicts.slice(0, 3).map((c, i) => (
                          <li key={i}>• {c.plant1} ↔ {c.plant2}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Good companions */}
              {companionAnalysis && companionAnalysis.benefits.length > 0 && !companionAnalysis.has_conflicts && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200 text-sm">
                        {companionAnalysis.benefits.length} korzystnych połączeń
                      </p>
                      <ul className="mt-1 text-xs text-green-700 dark:text-green-300">
                        {companionAnalysis.benefits.slice(0, 3).map((b, i) => (
                          <li key={i}>• {b.plant1} ↔ {b.plant2}: {b.reason}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Plants List/Grid */}
              <div className="p-4">
                {selectedPlan.items && selectedPlan.items.length > 0 ? (
                  <div className={viewMode === 'grid'
                    ? 'grid grid-cols-2 sm:grid-cols-3 gap-3'
                    : 'space-y-2'
                  }>
                    {selectedPlan.items.map(item => (
                      <div
                        key={item.id}
                        className={`bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 ${
                          viewMode === 'list' ? 'flex items-center justify-between' : ''
                        }`}
                      >
                        <div className={viewMode === 'list' ? 'flex items-center gap-3' : ''}>
                          {item.photo_thumb && (
                            <img
                              src={getImageUrl(item.photo_thumb)}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {item.plant_name}
                            </p>
                            {item.display_name && item.display_name !== item.plant_name && (
                              <p className="text-xs text-gray-500">{item.display_name}</p>
                            )}
                            {item.spacing && (
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                Rozstaw: {item.spacing}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className={`flex items-center gap-2 ${viewMode === 'grid' ? 'mt-2' : ''}`}>
                          <input
                            type="number"
                            min="1"
                            defaultValue={item.quantity || 1}
                            key={`qty-${item.id}-${item.quantity}`}
                            onBlur={(e) => {
                              const newQty = parseInt(e.target.value) || 1;
                              if (newQty !== (item.quantity || 1)) {
                                handleUpdateQuantity(item.id, newQty);
                              }
                            }}
                            className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                          <span className="text-xs text-gray-500">szt.</span>
                          <button
                            onClick={() => setCalculatorPlant({ ...item, name: item.plant_name })}
                            className="p-1 text-gray-400 hover:text-blue-500 rounded"
                            title="Kalkulator rozstawu"
                          >
                            <Calculator size={16} />
                          </button>
                          <button
                            onClick={() => handleRemovePlant(item.id)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Leaf className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Plan jest pusty. Dodaj rośliny, które chcesz posadzić.
                    </p>
                  </div>
                )}

                {/* Add plant button */}
                <button
                  onClick={() => setShowAddPlantModal(true)}
                  className="w-full mt-4 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-green-500 hover:text-green-600 dark:hover:text-green-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Dodaj roślinę
                </button>
              </div>

              {/* Actions */}
              {selectedPlan.items && selectedPlan.items.length > 0 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  {/* Show task status if tasks were created */}
                  {selectedPlan.tasks_created_at && (
                    <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <div>
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                              Zadania utworzone
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              Data sadzenia: {selectedPlan.planned_planting_date || 'nie ustawiona'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleDeletePlanTasks}
                          className="text-xs px-2 py-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                        >
                          Usuń zadania
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {!selectedPlan.tasks_created_at ? (
                      <button
                        onClick={openTaskModal}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Calendar size={18} />
                        Dodaj do zadań
                      </button>
                    ) : (
                      <button
                        disabled
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed"
                      >
                        <Check size={18} />
                        Zadania utworzone
                      </button>
                    )}
                    {selectedPlan.plot_id && selectedPlan.status !== 'archived' && (
                      <button
                        onClick={handleExecutePlan}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Play size={18} />
                        Posadź teraz
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <Grid3X3 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Wybierz plan do edycji
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Wybierz istniejący plan z listy lub utwórz nowy
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus size={18} />
                Nowy plan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Plan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Nowy plan ogródka
              </h2>
            </div>

            <form onSubmit={handleCreatePlan} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nazwa planu *
                </label>
                <input
                  type="text"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="np. Grządka warzywna 2026"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Opis (opcjonalnie)
                </label>
                <textarea
                  value={newPlan.description}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                  rows="2"
                  placeholder="Krótki opis planu..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Poletko (opcjonalnie)
                </label>
                <select
                  value={newPlan.plot_id}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, plot_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">-- Bez przypisania --</option>
                  {plots.map(plot => (
                    <option key={plot.id} value={plot.id}>{plot.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Przypisz do poletka, aby móc później posadzić rośliny
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Długość (cm)
                  </label>
                  <input
                    type="number"
                    value={newPlan.length_cm}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, length_cm: parseInt(e.target.value) || 0 }))}
                    min="50"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Szerokość (cm)
                  </label>
                  <input
                    type="number"
                    value={newPlan.width_cm}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, width_cm: parseInt(e.target.value) || 0 }))}
                    min="50"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Utwórz plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      {showEditModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Edytuj plan
              </h2>
            </div>

            <form onSubmit={handleEditPlan} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nazwa planu *
                </label>
                <input
                  type="text"
                  value={editPlan.name}
                  onChange={(e) => setEditPlan(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="np. Grządka warzywna 2026"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Opis (opcjonalnie)
                </label>
                <textarea
                  value={editPlan.description}
                  onChange={(e) => setEditPlan(prev => ({ ...prev, description: e.target.value }))}
                  rows="2"
                  placeholder="Krótki opis planu..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Poletko (opcjonalnie)
                </label>
                <select
                  value={editPlan.plot_id}
                  onChange={(e) => setEditPlan(prev => ({ ...prev, plot_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">-- Bez przypisania --</option>
                  {plots.map(plot => (
                    <option key={plot.id} value={plot.id}>{plot.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Przypisz do poletka, aby móc później posadzić rośliny
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Długość (cm)
                  </label>
                  <input
                    type="number"
                    value={editPlan.length_cm}
                    onChange={(e) => setEditPlan(prev => ({ ...prev, length_cm: parseInt(e.target.value) || 0 }))}
                    min="50"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Szerokość (cm)
                  </label>
                  <input
                    type="number"
                    value={editPlan.width_cm}
                    onChange={(e) => setEditPlan(prev => ({ ...prev, width_cm: parseInt(e.target.value) || 0 }))}
                    min="50"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Zapisz zmiany
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Plant Modal */}
      {showAddPlantModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[85vh] sm:max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Dodaj roślinę do planu
              </h2>
              <button
                onClick={() => setShowAddPlantModal(false)}
                className="p-2.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <input
                  type="text"
                  value={plantSearch}
                  onChange={(e) => setPlantSearch(e.target.value)}
                  placeholder="Szukaj rośliny..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  autoFocus
                />
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
              <div className="space-y-2">
                {filteredPlants.map(plant => {
                  const isAlreadyAdded = selectedPlan.items?.some(i => i.plant_id === plant.id);
                  const companionInfo = getCompanionInfo(plant);

                  return (
                    <button
                      key={plant.id}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isAlreadyAdded) {
                          handleAddPlant(plant);
                        }
                      }}
                      disabled={isAlreadyAdded}
                      className={`w-full flex flex-col gap-1 p-3 rounded-lg text-left transition-colors touch-manipulation ${
                        isAlreadyAdded
                          ? 'bg-gray-100 dark:bg-gray-700/50 text-gray-400 cursor-not-allowed'
                          : companionInfo.status === 'bad'
                            ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800'
                            : companionInfo.status === 'good'
                              ? 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800'
                              : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-green-50 dark:hover:bg-green-900/20 active:bg-green-100 dark:active:bg-green-900/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {plant.photo_thumb && (
                          <img
                            src={getImageUrl(plant.photo_thumb)}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover pointer-events-none flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0 pointer-events-none">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {plant.display_name || plant.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {plant.spacing && (
                              <span className="flex items-center gap-0.5">
                                <Calculator className="w-3 h-3" />
                                {plant.spacing}
                              </span>
                            )}
                            {plant.sun_requirement && (
                              <span>{plant.sun_requirement === 'full_sun' ? '☀️' : plant.sun_requirement === 'partial_shade' ? '⛅' : '🌥️'}</span>
                            )}
                          </div>
                        </div>
                        <div className="pointer-events-none flex-shrink-0">
                          {isAlreadyAdded ? (
                            <Check className="w-5 h-5 text-green-500" />
                          ) : companionInfo.status === 'bad' ? (
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                          ) : companionInfo.status === 'good' ? (
                            <Leaf className="w-5 h-5 text-green-500" />
                          ) : (
                            <Plus className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Companion planting info */}
                      {companionInfo.message && !isAlreadyAdded && (
                        <div className={`text-xs mt-1 pl-13 pointer-events-none ${
                          companionInfo.status === 'bad'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          {companionInfo.status === 'bad' ? '⚠️ ' : '✓ '}
                          {companionInfo.message}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {filteredPlantsData.totalCount > 20 && (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 pt-2">
                  Wyświetlono 20 z {filteredPlantsData.totalCount} wyników. Zawęź wyszukiwanie.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task Creation Confirmation Modal */}
      {showTaskModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Dodaj do zadań
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Plan: {selectedPlan.name}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Date picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  📅 Kiedy planujesz sadzić?
                </label>
                <input
                  type="date"
                  value={taskPlannedDate}
                  onChange={(e) => setTaskPlannedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
                />
              </div>

              {/* Plant selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  🌱 Wybierz rośliny ({selectedItemsForTask.length}/{selectedPlan.items?.length || 0})
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedPlan.items?.map(item => (
                    <label
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedItemsForTask.includes(item.id)
                          ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
                          : 'bg-gray-50 dark:bg-gray-700/50 border border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedItemsForTask.includes(item.id)}
                        onChange={() => toggleItemForTask(item.id)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {item.plant_name || item.display_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Ilość: {item.quantity || 1}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Select all / none */}
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedItemsForTask(selectedPlan.items?.map(i => i.id) || [])}
                    className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                  >
                    Zaznacz wszystkie
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedItemsForTask([])}
                    className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    Odznacz wszystkie
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                <p className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Zadania pojawią się w Planerze na wybraną datę
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex gap-3">
              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
                disabled={creatingTasks}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handleConfirmCreateTasks}
                disabled={creatingTasks || selectedItemsForTask.length === 0 || !taskPlannedDate}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creatingTasks ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Tworzenie...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Utwórz {selectedItemsForTask.length} zadań
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {calculatorPlant && (
        <SpacingCalculator
          plant={calculatorPlant}
          onClose={() => setCalculatorPlant(null)}
        />
      )}
    </div>
  );
};

export default GardenPlanner;
