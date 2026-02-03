import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, Trash2, X, Grid3X3, List, AlertTriangle,
  Check, Calendar, Leaf, Loader2, Lightbulb, Play, Search, Calculator
} from 'lucide-react';
import axios, { getImageUrl } from '../config/axios';
import { useToast } from '../context/ToastContext';

const GardenPlanner = () => {
  const { showToast } = useToast();

  // State
  const [plans, setPlans] = useState([]);
  const [plots, setPlots] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddPlantModal, setShowAddPlantModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [companionAnalysis, setCompanionAnalysis] = useState(null);

  // Form state for new plan
  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    plot_id: '',
    width_cm: 300,
    length_cm: 100
  });

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
  const loadPlanDetails = async (planId) => {
    try {
      const [planRes, analysisRes] = await Promise.all([
        axios.get(`/api/garden-plans/${planId}`),
        axios.get(`/api/garden-plans/${planId}/companion-analysis`)
      ]);
      setSelectedPlan(planRes.data);
      setCompanionAnalysis(analysisRes.data);
    } catch (error) {
      console.error('Error loading plan:', error);
      showToast('Błąd ładowania planu', 'error');
    }
  };

  // Create new plan
  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/garden-plans', newPlan);
      showToast('Plan utworzony', 'success');
      setShowCreateModal(false);
      setNewPlan({ name: '', description: '', plot_id: '', width_cm: 300, length_cm: 100 });
      loadData();
      loadPlanDetails(response.data.id);
    } catch (error) {
      showToast(error.response?.data?.error || 'Błąd tworzenia planu', 'error');
    }
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
      await axios.post(`/api/garden-plans/${selectedPlan.id}/items`, {
        plant_id: plant.id,
        plant_name: plant.display_name || plant.name,
        quantity: 1
      });
      showToast('Roślina dodana do planu', 'success');
      loadPlanDetails(selectedPlan.id);
    } catch (error) {
      showToast('Błąd dodawania rośliny', 'error');
    }
  };

  // Remove plant from plan
  const handleRemovePlant = async (itemId) => {
    try {
      await axios.delete(`/api/garden-plans/${selectedPlan.id}/items/${itemId}`);
      showToast('Roślina usunięta', 'success');
      loadPlanDetails(selectedPlan.id);
    } catch (error) {
      showToast('Błąd usuwania rośliny', 'error');
    }
  };

  // Update plant quantity
  const handleUpdateQuantity = async (itemId, quantity) => {
    try {
      await axios.put(`/api/garden-plans/${selectedPlan.id}/items/${itemId}`, { quantity });
      loadPlanDetails(selectedPlan.id);
    } catch (error) {
      showToast('Błąd aktualizacji', 'error');
    }
  };

  // Convert to tasks
  const handleConvertToTasks = async () => {
    if (!selectedPlan) return;
    try {
      const response = await axios.post(`/api/garden-plans/${selectedPlan.id}/convert-to-tasks`);
      showToast(response.data.message, 'success');
      loadData();
      loadPlanDetails(selectedPlan.id);
    } catch (error) {
      showToast(error.response?.data?.error || 'Błąd tworzenia zadań', 'error');
    }
  };

  // Execute plan (plant everything)
  const handleExecutePlan = async () => {
    if (!selectedPlan) return;
    if (!window.confirm('Czy na pewno chcesz posadzić wszystkie rośliny z planu? Zostaną utworzone grządki.')) return;

    try {
      const response = await axios.post(`/api/garden-plans/${selectedPlan.id}/execute`);
      showToast(response.data.message, 'success');
      loadData();
      loadPlanDetails(selectedPlan.id);
    } catch (error) {
      showToast(error.response?.data?.error || 'Błąd wykonywania planu', 'error');
    }
  };

  // Filter plants for search
  const filteredPlants = useMemo(() => {
    if (!plantSearch) return plants.slice(0, 20);
    const search = plantSearch.toLowerCase();
    return plants.filter(p =>
      (p.display_name || p.name || '').toLowerCase().includes(search) ||
      (p.latin_name || '').toLowerCase().includes(search)
    ).slice(0, 20);
  }, [plants, plantSearch]);

  // Calculate spacing info
  const calculateSpacing = (items, widthCm, lengthCm) => {
    let totalPlants = 0;
    let totalArea = 0;

    items.forEach(item => {
      totalPlants += item.quantity || 1;
      // Estimate area based on typical spacing (30cm default)
      const spacing = 30; // cm
      totalArea += (item.quantity || 1) * (spacing * spacing);
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

          {plans.length === 0 ? (
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
              {plans.map(plan => (
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
                          'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        }`}>
                          {plan.status === 'draft' ? 'Szkic' : plan.status === 'active' ? 'Aktywny' : 'Zarchiwizowany'}
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
        </div>

        {/* Plan Details / Editor */}
        <div className="lg:col-span-2">
          {selectedPlan ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Plan Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedPlan.name}
                    </h2>
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
                          </div>
                        </div>

                        <div className={`flex items-center gap-2 ${viewMode === 'grid' ? 'mt-2' : ''}`}>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity || 1}
                            onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                          <span className="text-xs text-gray-500">szt.</span>
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
              {selectedPlan.items && selectedPlan.items.length > 0 && selectedPlan.status === 'draft' && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleConvertToTasks}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Calendar size={18} />
                      Dodaj do planera
                    </button>
                    {selectedPlan.plot_id && (
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

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {filteredPlants.map(plant => {
                  const isAlreadyAdded = selectedPlan.items?.some(i => i.plant_id === plant.id);
                  return (
                    <button
                      key={plant.id}
                      onClick={() => !isAlreadyAdded && handleAddPlant(plant)}
                      disabled={isAlreadyAdded}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                        isAlreadyAdded
                          ? 'bg-gray-100 dark:bg-gray-700/50 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-green-50 dark:hover:bg-green-900/20'
                      }`}
                    >
                      {plant.photo_thumb && (
                        <img
                          src={getImageUrl(plant.photo_thumb)}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {plant.display_name || plant.name}
                        </p>
                        {plant.latin_name && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 italic truncate">
                            {plant.latin_name}
                          </p>
                        )}
                      </div>
                      {isAlreadyAdded ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <Plus className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GardenPlanner;
