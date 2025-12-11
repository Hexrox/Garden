import React, { useState } from 'react';
import axios from '../config/axios';

const Export = () => {
  const [loading, setLoading] = useState(null);

  const handleExport = async (endpoint, filename) => {
    setLoading(endpoint);
    try {
      const response = await axios.get(`/api/export/${endpoint}`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Błąd podczas eksportu danych');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Eksport danych</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Poletka</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Eksportuj wszystkie poletka do pliku</p>
        <div className="flex space-x-4">
          <button
            onClick={() => handleExport('plots/json', 'plots.json')}
            disabled={loading === 'plots/json'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading === 'plots/json' ? 'Pobieranie...' : 'Pobierz JSON'}
          </button>
          <button
            onClick={() => handleExport('plots/csv', 'plots.csv')}
            disabled={loading === 'plots/csv'}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading === 'plots/csv' ? 'Pobieranie...' : 'Pobierz CSV'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Historia oprysków</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Eksportuj całą historię oprysków</p>
        <div className="flex space-x-4">
          <button
            onClick={() => handleExport('sprays/json', 'spray_history.json')}
            disabled={loading === 'sprays/json'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading === 'sprays/json' ? 'Pobieranie...' : 'Pobierz JSON'}
          </button>
          <button
            onClick={() => handleExport('sprays/csv', 'spray_history.csv')}
            disabled={loading === 'sprays/csv'}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading === 'sprays/csv' ? 'Pobieranie...' : 'Pobierz CSV'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Kompletny eksport</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Eksportuj wszystkie dane (poletka, grządki, opryski) do jednego pliku JSON
        </p>
        <button
          onClick={() => handleExport('complete/json', 'garden_complete_backup.json')}
          disabled={loading === 'complete/json'}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
        >
          {loading === 'complete/json' ? 'Pobieranie...' : 'Pobierz pełny backup (JSON)'}
        </button>
      </div>
    </div>
  );
};

export default Export;
