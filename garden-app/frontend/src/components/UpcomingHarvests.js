import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const UpcomingHarvests = () => {
  const [harvests, setHarvests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUpcomingHarvests();
  }, []);

  const fetchUpcomingHarvests = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/harvest/upcoming?limit=5&days=30');
      setHarvests(response.data);
      setError('');
    } catch (err) {
      setError('Nie udało się pobrać zbiorów');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'soon':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getStatusText = (status, daysUntil) => {
    if (status === 'ready') {
      return 'Gotowy do zbioru!';
    } else if (status === 'soon') {
      return `Za ${daysUntil} ${daysUntil === 1 ? 'dzień' : 'dni'}`;
    } else if (status === 'overdue') {
      return `Spóźniony ${Math.abs(daysUntil)} ${Math.abs(daysUntil) === 1 ? 'dzień' : 'dni'}`;
    } else {
      return `Za ${daysUntil} dni`;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">
          🌾 Nadchodzące zbiory
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg md:text-xl font-bold text-gray-800">
          🌾 Nadchodzące zbiory
        </h2>
        <Link
          to="/plots"
          className="text-sm text-green-600 hover:text-green-700 font-medium"
        >
          Zobacz wszystkie →
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {harvests.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-2">🌱</p>
          <p className="text-gray-600 text-sm">
            Brak nadchodzących zbiorów w ciągu najbliższych 30 dni
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Dodaj rośliny z datą sadzenia, a automatycznie obliczymy przewidywany zbiór!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {harvests.map((harvest) => (
            <Link
              key={harvest.id}
              to={`/plots/${harvest.plot_id}`}
              className="block hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800 text-sm md:text-base">
                      {harvest.plant_name}
                    </h3>
                    {harvest.plant_variety && (
                      <span className="text-xs text-gray-500">
                        ({harvest.plant_variety})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {harvest.plot_name} • Grządka {harvest.row_number}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Przewidywany zbiór: {formatDate(harvest.expected_harvest_date)}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                      harvest.harvest_status
                    )}`}
                  >
                    {getStatusText(harvest.harvest_status, harvest.days_until_harvest)}
                  </span>
                  {harvest.harvest_status === 'ready' && (
                    <span className="text-2xl animate-bounce">🎉</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {harvests.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            💡 Daty są szacunkowe i mogą się różnić w zależności od warunków
          </p>
        </div>
      )}
    </div>
  );
};

export default UpcomingHarvests;
