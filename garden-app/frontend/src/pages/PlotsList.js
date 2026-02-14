import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios, { getImageUrl } from '../config/axios';
import { useToast } from '../context/ToastContext';

const PlotsList = () => {
  const { showToast } = useToast();
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadPlots = useCallback(async (signal) => {
    try {
      const response = await axios.get('/api/plots', { signal });
      setPlots(response.data);
    } catch (error) {
      if (error.name !== 'CanceledError') {
        console.error('Error loading plots:', error);
        showToast('Błąd ładowania poletek', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const controller = new AbortController();
    loadPlots(controller.signal);
    return () => controller.abort();
  }, [loadPlots]);

  const deletePlot = async (id) => {
    try {
      await axios.delete(`/api/plots/${id}`);
      setPlots(plots.filter(p => p.id !== id));
      showToast('Poletko zostało usunięte', 'success');
    } catch (error) {
      console.error('Error deleting plot:', error);
      showToast('Błąd podczas usuwania poletka', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-9 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-t-lg mb-4"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
              <div className="flex gap-2">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Moje poletka</h1>
        <Link
          to="/plots/new"
          className="inline-flex items-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 transition-colors"
        >
          + Dodaj poletko
        </Link>
      </div>

      {plots.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Nie masz jeszcze żadnych poletek</p>
          <Link
            to="/plots/new"
            className="inline-flex items-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 transition-colors"
          >
            Dodaj pierwsze poletko
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plots.map((plot) => (
            <div key={plot.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
              {plot.image_path && (
                <img
                  src={getImageUrl(plot.image_path)}
                  alt={plot.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              )}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{plot.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">{plot.description}</p>
                <div className="flex space-x-2">
                  <Link
                    to={`/plots/${plot.id}`}
                    className="flex-1 text-center px-4 py-2.5 border border-green-600 dark:border-green-500 rounded-lg text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                  >
                    Szczegóły
                  </Link>
                  <Link
                    to={`/plots/${plot.id}/edit`}
                    className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Edytuj
                  </Link>
                  <button
                    onClick={() => setDeleteConfirm(plot.id)}
                    className="px-4 py-2.5 border border-red-300 dark:border-red-800 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Usuń
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🗑️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Usuń poletko?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Ta operacja jest nieodwracalna. Wszystkie dane poletka zostaną usunięte.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
                >
                  Anuluj
                </button>
                <button
                  onClick={() => deletePlot(deleteConfirm)}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  Usuń
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlotsList;
