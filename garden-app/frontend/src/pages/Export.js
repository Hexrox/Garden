import React from 'react';

const Export = () => {
  const handleExport = (endpoint) => {
    window.open(`http://localhost:3001/api/export/${endpoint}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Eksport danych</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Poletka</h2>
        <p className="text-gray-600 mb-4">Eksportuj wszystkie poletka do pliku</p>
        <div className="flex space-x-4">
          <button
            onClick={() => handleExport('plots/json')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Pobierz JSON
          </button>
          <button
            onClick={() => handleExport('plots/csv')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Pobierz CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Historia oprysków</h2>
        <p className="text-gray-600 mb-4">Eksportuj całą historię oprysków</p>
        <div className="flex space-x-4">
          <button
            onClick={() => handleExport('sprays/json')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Pobierz JSON
          </button>
          <button
            onClick={() => handleExport('sprays/csv')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Pobierz CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Kompletny eksport</h2>
        <p className="text-gray-600 mb-4">
          Eksportuj wszystkie dane (poletka, grządki, opryski) do jednego pliku JSON
        </p>
        <button
          onClick={() => handleExport('complete/json')}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          Pobierz pełny backup (JSON)
        </button>
      </div>
    </div>
  );
};

export default Export;
