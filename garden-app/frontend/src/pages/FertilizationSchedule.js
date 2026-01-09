import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../config/axios';
import { Calendar, Droplets, Plus, Filter, Leaf, Clock, AlertCircle } from 'lucide-react';

/**
 * Strona Harmonogramu Nawożenia
 *
 * Wyświetla historię i plan nawożenia dla wszystkich roślin w ogrodzie
 */
const FertilizationSchedule = () => {
  const navigate = useNavigate();
  const [fertilizations, setFertilizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, mineral, organic, natural
  const [viewMode, setViewMode] = useState('all'); // all, upcoming, history

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchFertilizations = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get('/api/care/user/all', {
          signal: controller.signal
        });

        if (isMounted) {
          // Filter only fertilization actions
          const fertilizationsOnly = response.data.filter(
            item => item.action_type === 'fertilization'
          );
          setFertilizations(fertilizationsOnly);
        }
      } catch (err) {
        if (err.name === 'AbortError') return;

        if (isMounted) {
          console.error('Error fetching fertilizations:', err);
          setError('Nie udało się załadować danych. Spróbuj ponownie.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchFertilizations();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const getFertilizerTypeIcon = (type) => {
    switch (type) {
      case 'mineral':
        return '⚗️';
      case 'organic':
        return '🌿';
      case 'natural':
        return '🍃';
      default:
        return '💧';
    }
  };

  const getFertilizerTypeName = (type) => {
    switch (type) {
      case 'mineral':
        return 'Mineralny';
      case 'organic':
        return 'Organiczny';
      case 'natural':
        return 'Naturalny';
      default:
        return 'Nawóz';
    }
  };

  const getApplicationMethodName = (method) => {
    switch (method) {
      case 'soil':
        return 'Doglebowo';
      case 'foliar':
        return 'Dolistnie';
      default:
        return '';
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const isPastDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isUpcoming = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inTwoWeeks = new Date();
    inTwoWeeks.setDate(inTwoWeeks.getDate() + 14);
    return date >= today && date <= inTwoWeeks;
  };

  // Filter fertilizations with memoization
  const filteredFertilizations = useMemo(() => {
    return fertilizations.filter(fert => {
      // Filter by type
      if (filterType !== 'all' && fert.fertilizer_type !== filterType) {
        return false;
      }

      // Filter by view mode
      if (viewMode === 'upcoming') {
        return fert.next_application_date && !isPastDate(fert.next_application_date);
      } else if (viewMode === 'history') {
        return isPastDate(fert.action_date);
      }

      return true;
    });
  }, [fertilizations, filterType, viewMode]);

  // Group by upcoming and past with memoization
  const upcomingFertilizations = useMemo(() => {
    return fertilizations.filter(
      fert => fert.next_application_date && !isPastDate(fert.next_application_date)
    );
  }, [fertilizations]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Droplets size={28} aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Harmonogram Nawożenia</h1>
                <p className="text-green-100 text-sm">Śledź nawożenie swoich roślin</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/care')}
              aria-label="Dodaj nowe nawożenie"
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-green-600"
            >
              <Plus size={20} aria-hidden="true" />
              <span className="hidden sm:inline">Dodaj nawożenie</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-2xl font-bold">{fertilizations.length}</div>
              <div className="text-xs text-green-100">Łącznie</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-2xl font-bold">{upcomingFertilizations.length}</div>
              <div className="text-xs text-green-100">Nadchodzące</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-2xl font-bold">
                {fertilizations.filter(f => f.is_recurring).length}
              </div>
              <div className="text-xs text-green-100">Cykliczne</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Type filter */}
            <div className="flex-1">
              <label htmlFor="filterType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Filter size={16} className="inline mr-1" aria-hidden="true" />
                Typ nawozu
              </label>
              <select
                id="filterType"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                aria-label="Wybierz typ nawozu do filtrowania"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Wszystkie</option>
                <option value="mineral">⚗️ Mineralny</option>
                <option value="organic">🌿 Organiczny</option>
                <option value="natural">🍃 Naturalny</option>
              </select>
            </div>

            {/* View mode filter */}
            <div className="flex-1">
              <label htmlFor="viewMode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar size={16} className="inline mr-1" aria-hidden="true" />
                Widok
              </label>
              <select
                id="viewMode"
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                aria-label="Wybierz widok nawożeń"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Wszystkie</option>
                <option value="upcoming">Nadchodzące</option>
                <option value="history">Historia</option>
              </select>
            </div>
          </div>
        </div>

        {/* Upcoming Fertilizations Alert */}
        {upcomingFertilizations.length > 0 && viewMode === 'all' && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-yellow-600 dark:text-yellow-400 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                  Nadchodzące nawożenie
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Masz {upcomingFertilizations.length} zaplanowanych nawożeń w ciągu najbliższych 2 tygodni
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100">Błąd</h3>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  aria-label="Spróbuj ponownie załadować dane"
                  className="mt-2 px-3 py-1 text-sm text-white bg-red-600 hover:bg-red-700 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Spróbuj ponownie
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fertilizations List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Ładowanie...</p>
          </div>
        ) : filteredFertilizations.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <Leaf size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Brak rekordów nawożenia
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Zacznij śledzić nawożenie swoich roślin
            </p>
            <button
              type="button"
              onClick={() => navigate('/care')}
              aria-label="Dodaj pierwsze nawożenie"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <Plus size={20} />
              Dodaj pierwsze nawożenie
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFertilizations.map((fert) => (
              <div
                key={fert.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-4"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="text-4xl flex-shrink-0">
                    {getFertilizerTypeIcon(fert.fertilizer_type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {fert.action_name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {fert.plot_name} → Rząd {fert.row_number} ({fert.plant_name || 'Brak rośliny'})
                        </p>
                      </div>
                      {fert.is_recurring && (
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                          <Clock size={12} />
                          Cykliczne
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Data</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(fert.action_date)}
                        </div>
                      </div>

                      {fert.fertilizer_type && (
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Typ</div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {getFertilizerTypeName(fert.fertilizer_type)}
                          </div>
                        </div>
                      )}

                      {fert.npk_ratio && (
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">NPK</div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {fert.npk_ratio}
                          </div>
                        </div>
                      )}

                      {fert.application_method && (
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Metoda</div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {getApplicationMethodName(fert.application_method)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Dosage and Note */}
                    {(fert.dosage || fert.note) && (
                      <div className="space-y-1">
                        {fert.dosage && (
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <strong>Dawkowanie:</strong> {fert.dosage}
                          </p>
                        )}
                        {fert.note && (
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <strong>Notatka:</strong> {fert.note}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Next application */}
                    {fert.is_recurring && fert.next_application_date && (
                      <div className={`mt-3 p-3 rounded-lg ${
                        isUpcoming(fert.next_application_date)
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700'
                          : 'bg-gray-50 dark:bg-gray-900/50'
                      }`}>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar size={16} className={
                            isUpcoming(fert.next_application_date)
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-gray-600 dark:text-gray-400'
                          } />
                          <span className={
                            isUpcoming(fert.next_application_date)
                              ? 'text-yellow-900 dark:text-yellow-100 font-medium'
                              : 'text-gray-700 dark:text-gray-300'
                          }>
                            Następne nawożenie: {formatDate(fert.next_application_date)}
                          </span>
                          {fert.repeat_frequency && (
                            <span className="text-gray-500 dark:text-gray-400">
                              (co {fert.repeat_frequency} dni)
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FertilizationSchedule;
