import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../config/axios';
import { Plus, X } from 'lucide-react';

const SprayHistory = () => {
  const navigate = useNavigate();
  const [sprays, setSprays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' or 'active'

  // Modal state for adding spray
  const [showAddModal, setShowAddModal] = useState(false);
  const [plots, setPlots] = useState([]);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [beds, setBeds] = useState([]);
  const [loadingPlots, setLoadingPlots] = useState(false);
  const [loadingBeds, setLoadingBeds] = useState(false);

  const loadSprays = useCallback(async () => {
    try {
      const endpoint = filter === 'active' ? '/api/sprays/active' : '/api/care/user/all';
      const response = await axios.get(endpoint);
      setSprays(response.data);
    } catch (error) {
      console.error('Error loading care actions:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadSprays();
  }, [loadSprays]);

  const isWithinWithdrawalPeriod = (safeHarvestDate) => {
    const today = new Date();
    const harvestDate = new Date(safeHarvestDate);
    return harvestDate >= today;
  };

  const openAddSprayModal = async () => {
    setShowAddModal(true);
    setLoadingPlots(true);
    try {
      const response = await axios.get('/api/plots');
      setPlots(response.data);
    } catch (error) {
      console.error('Error loading plots:', error);
    } finally {
      setLoadingPlots(false);
    }
  };

  const selectPlot = async (plot) => {
    setSelectedPlot(plot);
    setLoadingBeds(true);
    try {
      const response = await axios.get(`/api/plots/${plot.id}/details`);
      setBeds(response.data.beds || []);
    } catch (error) {
      console.error('Error loading beds:', error);
      setBeds([]);
    } finally {
      setLoadingBeds(false);
    }
  };

  const selectBed = (bed) => {
    setShowAddModal(false);
    navigate(`/beds/${bed.id}/care`);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setSelectedPlot(null);
    setBeds([]);
    setPlots([]);
  };

  if (loading) return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Ładowanie...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pielęgnacja i ochrona</h1>
        <div className="flex space-x-2">
          <button
            onClick={openAddSprayModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 font-medium"
          >
            <Plus size={20} />
            Dodaj zabieg
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Wszystkie
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Aktywne
          </button>
        </div>
      </div>

      {sprays.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-500 dark:text-gray-400">Brak zapisanych zabiegów pielęgnacyjnych</p>
        </div>
      ) : (
        <>
          {/* Mobile: Cards View */}
          <div className="md:hidden space-y-4">
            {sprays.map((spray) => (
              <div key={spray.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-3">
                {/* Header */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    {spray.plot_name} - R{spray.row_number}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {spray.plant_name || '-'}
                  </p>
                </div>

                {/* Details */}
                <div className="space-y-2">
                  <div className="flex items-start">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32 flex-shrink-0">Środek:</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {spray.spray_name}
                      {spray.spray_type && (
                        <span className="text-gray-500 dark:text-gray-400"> ({spray.spray_type})</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-start">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32 flex-shrink-0">Data oprysku:</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{spray.spray_date}</span>
                  </div>

                  <div className="flex items-start">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32 flex-shrink-0">Karencja:</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{spray.withdrawal_period} dni</span>
                  </div>

                  <div className="flex items-start">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32 flex-shrink-0">Bezpieczny zbiór:</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{spray.safe_harvest_date}</span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="pt-2 flex justify-center">
                  {isWithinWithdrawalPeriod(spray.safe_harvest_date) ? (
                    <span className="px-4 py-2 inline-flex text-sm leading-5 font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                      ⚠️ Karencja
                    </span>
                  ) : (
                    <span className="px-4 py-2 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      ✅ Bezpieczny
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table View */}
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Poletko / Rząd
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Roślina
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Środek
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Data oprysku
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Karencja
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Bezpieczny zbiór
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {sprays.map((spray) => (
                    <tr key={spray.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {spray.plot_name} - R{spray.row_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {spray.plant_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {spray.spray_name}
                        {spray.spray_type && (
                          <span className="text-gray-500 dark:text-gray-400"> ({spray.spray_type})</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {spray.spray_date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {spray.withdrawal_period} dni
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {spray.safe_harvest_date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isWithinWithdrawalPeriod(spray.safe_harvest_date) ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                            Karencja
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                            Bezpieczny
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal - Add Spray */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {!selectedPlot ? 'Wybierz poletko' : 'Wybierz grządkę'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {!selectedPlot ? (
                // Step 1: Select Plot
                <div className="space-y-4">
                  {loadingPlots ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      Ładowanie poletek...
                    </div>
                  ) : plots.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Nie masz jeszcze żadnych poletek
                      </p>
                      <button
                        onClick={() => {
                          closeModal();
                          navigate('/plots/new');
                        }}
                        className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Dodaj pierwsze poletko
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {plots.map((plot) => (
                        <button
                          key={plot.id}
                          onClick={() => selectPlot(plot)}
                          className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left"
                        >
                          <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">
                            {plot.name}
                          </h3>
                          {plot.location && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              📍 {plot.location}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                            {plot.bed_count || 0} grządek
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Step 2: Select Bed
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      setSelectedPlot(null);
                      setBeds([]);
                    }}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4"
                  >
                    ← Wróć do wyboru poletka
                  </button>

                  {loadingBeds ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      Ładowanie grządek...
                    </div>
                  ) : beds.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        To poletko nie ma jeszcze grządek
                      </p>
                      <button
                        onClick={() => {
                          closeModal();
                          navigate(`/plots/${selectedPlot.id}`);
                        }}
                        className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Dodaj grządkę
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {beds.map((bed) => (
                        <button
                          key={bed.id}
                          onClick={() => selectBed(bed)}
                          className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 dark:text-white">
                                Rząd {bed.row_number}
                              </h4>
                              {bed.plant_name && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  🌱 {bed.plant_name}
                                  {bed.plant_variety && ` - ${bed.plant_variety}`}
                                </p>
                              )}
                              {bed.planted_date && (
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  Posadzone: {bed.planted_date}
                                </p>
                              )}
                            </div>
                            <span className="text-2xl">💧</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SprayHistory;
