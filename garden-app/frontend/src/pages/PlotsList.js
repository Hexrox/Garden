import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const PlotsList = () => {
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlots();
  }, []);

  const loadPlots = async () => {
    try {
      const response = await axios.get('/api/plots');
      setPlots(response.data);
    } catch (error) {
      console.error('Error loading plots:', error);
    } finally {
      setLoading(false);
    }
  };

  const deletePlot = async (id) => {
    if (!window.confirm('Czy na pewno chcesz usunąć to poletko?')) return;

    try {
      await axios.delete(`/api/plots/${id}`);
      setPlots(plots.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting plot:', error);
      alert('Błąd podczas usuwania poletka');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Ładowanie...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Moje poletka</h1>
        <Link
          to="/plots/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
        >
          + Dodaj poletko
        </Link>
      </div>

      {plots.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">Nie masz jeszcze żadnych poletek</p>
          <Link
            to="/plots/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            Dodaj pierwsze poletko
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plots.map((plot) => (
            <div key={plot.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              {plot.image_path && (
                <img
                  src={`/${plot.image_path}`}
                  alt={plot.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              )}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{plot.name}</h3>
                <p className="text-gray-600 mb-4 line-clamp-3">{plot.description}</p>
                <div className="flex space-x-2">
                  <Link
                    to={`/plots/${plot.id}`}
                    className="flex-1 text-center px-4 py-2 border border-green-600 rounded-md text-sm font-medium text-green-600 hover:bg-green-50"
                  >
                    Szczegóły
                  </Link>
                  <Link
                    to={`/plots/${plot.id}/edit`}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Edytuj
                  </Link>
                  <button
                    onClick={() => deletePlot(plot.id)}
                    className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Usuń
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlotsList;
