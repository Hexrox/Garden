import React, { useState, useEffect } from 'react';
import axios from '../config/axios';

const SprayHistory = () => {
  const [sprays, setSprays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' or 'active'

  useEffect(() => {
    loadSprays();
  }, [filter]);

  const loadSprays = async () => {
    try {
      const endpoint = filter === 'active' ? '/api/sprays/active' : '/api/sprays/history';
      const response = await axios.get(endpoint);
      setSprays(response.data);
    } catch (error) {
      console.error('Error loading sprays:', error);
    } finally {
      setLoading(false);
    }
  };

  const isWithinWithdrawalPeriod = (safeHarvestDate) => {
    const today = new Date();
    const harvestDate = new Date(safeHarvestDate);
    return harvestDate >= today;
  };

  if (loading) return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Ładowanie...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Historia oprysków</h1>
        <div className="flex space-x-2">
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
          <p className="text-gray-500 dark:text-gray-400">Brak zapisanych oprysków</p>
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
    </div>
  );
};

export default SprayHistory;
