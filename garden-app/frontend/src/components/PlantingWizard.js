import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Check, Plus, Sprout, MapPin, AlertTriangle, RotateCcw, ThumbsUp, ThumbsDown } from 'lucide-react';
import axios from '../config/axios';

const PlantingWizard = ({ plant, onClose }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    selectedPlotId: null,
    rowNumber: '',
    plantVariety: '',
    plantedDate: new Date().toISOString().split('T')[0],
    note: ''
  });
  const [showNewPlotForm, setShowNewPlotForm] = useState(false);
  const [newPlotName, setNewPlotName] = useState('');

  // Companion planting warnings
  const [existingBeds, setExistingBeds] = useState([]);
  const [companionWarnings, setCompanionWarnings] = useState({ good: [], bad: [] });
  const [rotationWarning, setRotationWarning] = useState(null);
  const [loadingCompanions, setLoadingCompanions] = useState(false);

  // Batch planting mode
  const [batchMode, setBatchMode] = useState(false);
  const [batchPlantings, setBatchPlantings] = useState([]); // [{ plotId, rowNumber }]

  useEffect(() => {
    fetchPlots();
  }, []);

  const fetchPlots = async () => {
    try {
      const response = await axios.get('/api/plots');
      setPlots(response.data);

      // Auto-select if only one plot
      if (response.data.length === 1) {
        setFormData(prev => ({ ...prev, selectedPlotId: response.data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching plots:', error);
    }
  };

  // Fetch beds and companion warnings when plot is selected
  const fetchCompanionData = useCallback(async (plotId) => {
    if (!plotId || !plant) return;

    setLoadingCompanions(true);
    try {
      // Fetch existing beds in selected plot
      const bedsResponse = await axios.get(`/api/plots/${plotId}`);
      const beds = bedsResponse.data?.beds || [];
      setExistingBeds(beds);

      // Check rotation warning - same plant in same location in last 2 years
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      const sameSpeciesRecently = beds.find(bed =>
        bed.plant_name?.toLowerCase() === plant.name?.toLowerCase() &&
        bed.planted_date && new Date(bed.planted_date) > twoYearsAgo
      );
      if (sameSpeciesRecently) {
        setRotationWarning({
          bed: sameSpeciesRecently,
          date: sameSpeciesRecently.planted_date
        });
      } else {
        setRotationWarning(null);
      }

      // Fetch companion plant data
      const plantName = plant.display_name || plant.name;
      try {
        const companionResponse = await axios.get(`/api/plants/companions/${encodeURIComponent(plantName)}`);
        const companionData = companionResponse.data;

        // Check which existing plants are good/bad companions
        const goodFound = [];
        const badFound = [];

        beds.forEach(bed => {
          const bedPlantName = (bed.plant_name || '').toLowerCase();
          companionData.good?.forEach(comp => {
            if (bedPlantName.includes(comp.name.toLowerCase()) || comp.name.toLowerCase().includes(bedPlantName)) {
              goodFound.push({ plant: bed.plant_name, reason: comp.reason, row: bed.row_number });
            }
          });
          companionData.bad?.forEach(comp => {
            if (bedPlantName.includes(comp.name.toLowerCase()) || comp.name.toLowerCase().includes(bedPlantName)) {
              badFound.push({ plant: bed.plant_name, reason: comp.reason, row: bed.row_number });
            }
          });
        });

        setCompanionWarnings({ good: goodFound, bad: badFound });
      } catch (error) {
        // No companion data found - that's OK
        setCompanionWarnings({ good: [], bad: [] });
      }
    } catch (error) {
      console.error('Error fetching companion data:', error);
    } finally {
      setLoadingCompanions(false);
    }
  }, [plant]);

  // Fetch companion data when plot changes
  useEffect(() => {
    if (formData.selectedPlotId) {
      fetchCompanionData(formData.selectedPlotId);
    }
  }, [formData.selectedPlotId, fetchCompanionData]);

  const handleCreatePlot = async () => {
    if (!newPlotName.trim()) {
      setErrorMsg('Podaj nazwę poletka');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/plots', {
        name: newPlotName,
        description: 'Utworzone podczas sadzenia'
      });

      await fetchPlots();
      setFormData(prev => ({ ...prev, selectedPlotId: response.data.plot.id }));
      setShowNewPlotForm(false);
      setNewPlotName('');
    } catch (error) {
      setErrorMsg('Błąd podczas tworzenia poletka');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlant = async () => {
    // Batch mode
    if (batchMode && batchPlantings.length > 0) {
      try {
        setLoading(true);
        const plantedDate = formData.plantedDate || new Date().toISOString().split('T')[0];

        const response = await axios.post('/api/beds/batch', {
          plant_name: plant.name,
          plant_variety: formData.plantVariety || null,
          planted_date: plantedDate,
          note: formData.note || `${plant.display_name || plant.name}${plant.latin_name ? ' (' + plant.latin_name + ')' : ''}`,
          plantings: batchPlantings.map(p => ({
            plot_id: p.plotId,
            row_number: parseInt(p.rowNumber)
          }))
        });

        // Navigate to first plot
        if (batchPlantings.length > 0) {
          navigate(`/plots/${batchPlantings[0].plotId}`);
        }

        onClose();
      } catch (error) {
        setErrorMsg(error.response?.data?.error || 'Błąd podczas masowego sadzenia');
        console.error(error);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Single planting mode
    if (!formData.selectedPlotId) {
      setErrorMsg('Wybierz poletko');
      return;
    }

    if (!formData.rowNumber) {
      setErrorMsg('Podaj numer rzędu/grządki');
      return;
    }

    try {
      setLoading(true);

      // Ensure plantedDate is valid
      const plantedDate = formData.plantedDate || new Date().toISOString().split('T')[0];

      const bedData = {
        row_number: parseInt(formData.rowNumber),
        plant_name: plant.name,
        plant_variety: formData.plantVariety || null,
        planted_date: plantedDate,
        note: formData.note || `${plant.display_name || plant.name}${plant.latin_name ? ' (' + plant.latin_name + ')' : ''}`,
        // Auto-calculate expected harvest date
        expected_harvest_date: calculateHarvestDate(plantedDate, plant.days_to_harvest)
      };

      await axios.post(`/api/plots/${formData.selectedPlotId}/beds`, bedData);

      // Success! Navigate to plot detail
      const selectedPlot = plots.find(p => p.id === formData.selectedPlotId);
      if (selectedPlot) {
        navigate(`/plots/${formData.selectedPlotId}`);
      }

      onClose();
    } catch (error) {
      setErrorMsg(error.response?.data?.error || 'Błąd podczas sadzenia');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addBatchPlanting = () => {
    if (!formData.selectedPlotId || !formData.rowNumber) {
      setErrorMsg('Wybierz poletko i podaj numer rzędu');
      return;
    }
    // Check if already added
    const exists = batchPlantings.find(p =>
      p.plotId === formData.selectedPlotId && p.rowNumber === formData.rowNumber
    );
    if (exists) {
      setErrorMsg('Ta lokalizacja jest już dodana');
      return;
    }

    const plot = plots.find(p => p.id === formData.selectedPlotId);
    setBatchPlantings(prev => [...prev, {
      plotId: formData.selectedPlotId,
      plotName: plot?.name || 'Poletko',
      rowNumber: formData.rowNumber
    }]);
    setFormData(prev => ({ ...prev, rowNumber: '' }));
    setErrorMsg('');
  };

  const removeBatchPlanting = (index) => {
    setBatchPlantings(prev => prev.filter((_, i) => i !== index));
  };

  const calculateHarvestDate = (plantedDate, daysToHarvest) => {
    if (!plantedDate || !daysToHarvest) return null;

    const date = new Date(plantedDate);
    date.setDate(date.getDate() + parseInt(daysToHarvest));
    return date.toISOString().split('T')[0];
  };

  const canProceed = () => {
    if (step === 1) return formData.selectedPlotId !== null;
    if (step === 2) {
      if (batchMode) {
        return batchPlantings.length > 0;
      }
      return formData.rowNumber !== '';
    }
    return false;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 pb-24 lg:pb-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">
                🌱 Posadź roślinę
              </h2>
              <p className="text-green-100">
                {plant.display_name || plant.name}
                {plant.latin_name && <span className="italic ml-1">({plant.latin_name})</span>}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Komunikat błędu */}
          {errorMsg && (
            <div className="mt-3 p-3 bg-red-500/20 border border-red-400/30 rounded-lg text-white text-sm flex justify-between items-center">
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg('')} className="ml-2 text-white/70 hover:text-white">✕</button>
            </div>
          )}

          {/* Progress */}
          <div className="flex items-center gap-2">
            <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-white' : 'bg-white/30'}`} />
            <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-white' : 'bg-white/30'}`} />
          </div>
          <p className="text-green-100 text-sm mt-2">
            Krok {step} z 2
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Select Plot */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Wybierz poletko
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Gdzie chcesz posadzić tę roślinę?
                  </p>
                </div>
              </div>

              {plots.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Nie masz jeszcze żadnego poletka
                  </p>
                  <button
                    onClick={() => setShowNewPlotForm(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Stwórz pierwsze poletko
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {plots.map((plot) => (
                    <button
                      key={plot.id}
                      onClick={() => setFormData(prev => ({ ...prev, selectedPlotId: plot.id }))}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        formData.selectedPlotId === plot.id
                          ? 'border-green-600 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {plot.name}
                          </h4>
                          {plot.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {plot.description}
                            </p>
                          )}
                        </div>
                        {formData.selectedPlotId === plot.id && (
                          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                    </button>
                  ))}

                  {!showNewPlotForm && (
                    <button
                      onClick={() => setShowNewPlotForm(true)}
                      className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-green-400 hover:text-green-600 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Stwórz nowe poletko
                    </button>
                  )}
                </div>
              )}

              {/* New Plot Form */}
              {showNewPlotForm && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Nowe poletko
                  </h4>
                  <input
                    type="text"
                    value={newPlotName}
                    onChange={(e) => setNewPlotName(e.target.value)}
                    placeholder="np. Ogródek za domem"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-3"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreatePlot}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      Stwórz
                    </button>
                    <button
                      onClick={() => {
                        setShowNewPlotForm(false);
                        setNewPlotName('');
                      }}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Anuluj
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Bed Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <Sprout className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Szczegóły sadzenia
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {batchMode ? 'Tryb masowego sadzenia' : 'Podaj informacje o grządce'}
                    </p>
                  </div>
                </div>

                {/* Batch mode toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={batchMode}
                    onChange={(e) => {
                      setBatchMode(e.target.checked);
                      if (!e.target.checked) {
                        setBatchPlantings([]);
                      }
                    }}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Wiele miejsc
                  </span>
                </label>
              </div>

              {/* Batch mode: location selector */}
              {batchMode && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    Dodaj lokalizacje gdzie chcesz posadzić <strong>{plant.display_name || plant.name}</strong>
                  </p>

                  <div className="flex gap-2 mb-3">
                    <select
                      value={formData.selectedPlotId || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, selectedPlotId: parseInt(e.target.value) || null }))}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    >
                      <option value="">Wybierz poletko...</option>
                      {plots.map(plot => (
                        <option key={plot.id} value={plot.id}>{plot.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={formData.rowNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, rowNumber: e.target.value }))}
                      placeholder="Rząd"
                      className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      min="1"
                    />
                    <button
                      onClick={addBatchPlanting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Dodaj
                    </button>
                  </div>

                  {/* List of added locations */}
                  {batchPlantings.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        Dodane lokalizacje ({batchPlantings.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {batchPlantings.map((p, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 px-3 py-1 bg-white dark:bg-gray-700 rounded-full text-sm border border-blue-300 dark:border-blue-600"
                          >
                            <span className="text-gray-700 dark:text-gray-300">
                              {p.plotName} / Rząd {p.rowNumber}
                            </span>
                            <button
                              onClick={() => removeBatchPlanting(index)}
                              className="ml-1 text-gray-400 hover:text-red-500"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Single mode: row number */}
              {!batchMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Numer rzędu/grządki *
                  </label>
                  <input
                    type="number"
                    value={formData.rowNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, rowNumber: e.target.value }))}
                    placeholder="np. 1, 2, 3..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    min="1"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Odmiana (opcjonalnie)
                </label>
                <input
                  type="text"
                  value={formData.plantVariety}
                  onChange={(e) => setFormData(prev => ({ ...prev, plantVariety: e.target.value }))}
                  placeholder={`np. ${plant.name === 'pomidor' ? 'Malinowy' : plant.name === 'ogórek' ? 'Śremski' : 'nazwa odmiany'}`}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data sadzenia
                </label>
                <input
                  type="date"
                  value={formData.plantedDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, plantedDate: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notatka (opcjonalnie)
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Dodatkowe informacje..."
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              {/* Companion Planting Warnings */}
              {!loadingCompanions && (companionWarnings.bad.length > 0 || companionWarnings.good.length > 0 || rotationWarning) && (
                <div className="space-y-3 mt-4">
                  {/* Rotation Warning */}
                  {rotationWarning && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                      <div className="flex items-start gap-3">
                        <RotateCcw className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-amber-800 dark:text-amber-200 text-sm">
                            Uwaga: Rotacja upraw
                          </p>
                          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                            {plant.display_name || plant.name} było sadzone na tym poletku {new Date(rotationWarning.date).toLocaleDateString('pl-PL')} (rząd {rotationWarning.bed.row_number}).
                            Zaleca się 2-3 letnią przerwę między uprawami tej samej rośliny w tym samym miejscu.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bad Companions Warning */}
                  {companionWarnings.bad.length > 0 && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                      <div className="flex items-start gap-3">
                        <ThumbsDown className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-red-800 dark:text-red-200 text-sm">
                            Złe sąsiedztwo roślin
                          </p>
                          <ul className="text-sm text-red-700 dark:text-red-300 mt-1 space-y-1">
                            {companionWarnings.bad.map((warn, idx) => (
                              <li key={idx}>
                                <strong>{warn.plant}</strong> (rząd {warn.row}): {warn.reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Good Companions */}
                  {companionWarnings.good.length > 0 && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                      <div className="flex items-start gap-3">
                        <ThumbsUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-emerald-800 dark:text-emerald-200 text-sm">
                            Dobre sąsiedztwo
                          </p>
                          <ul className="text-sm text-emerald-700 dark:text-emerald-300 mt-1 space-y-1">
                            {companionWarnings.good.map((warn, idx) => (
                              <li key={idx}>
                                <strong>{warn.plant}</strong> (rząd {warn.row}): {warn.reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Summary */}
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  📋 Podsumowanie:
                </h4>
                <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                  <li>🌱 Roślina: <strong>{plant.display_name || plant.name}</strong></li>
                  {batchMode ? (
                    <li>📍 Lokalizacje: <strong>{batchPlantings.length} miejsc</strong>
                      <ul className="ml-4 mt-1 space-y-0.5">
                        {batchPlantings.map((p, idx) => (
                          <li key={idx} className="text-xs">{p.plotName} / Rząd {p.rowNumber}</li>
                        ))}
                      </ul>
                    </li>
                  ) : (
                    <>
                      <li>📍 Poletko: <strong>{plots.find(p => p.id === formData.selectedPlotId)?.name}</strong></li>
                      <li>🔢 Rząd: <strong>#{formData.rowNumber}</strong></li>
                    </>
                  )}
                  {formData.plantedDate && (
                    <li>📅 Data sadzenia: <strong>{new Date(formData.plantedDate).toLocaleDateString('pl-PL')}</strong></li>
                  )}
                  {plant.days_to_harvest > 0 && formData.plantedDate && (
                    <li>🎯 Przewidywany zbiór: <strong>
                      {new Date(calculateHarvestDate(formData.plantedDate, plant.days_to_harvest)).toLocaleDateString('pl-PL')}
                    </strong> ({plant.days_to_harvest} dni)</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
          <div className="flex gap-2">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Wstecz
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Anuluj
            </button>

            {step < 2 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Dalej
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handlePlant}
                disabled={loading || !canProceed()}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? 'Sadzenie...' : 'Posadź! 🌱'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlantingWizard;
