import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import { TrendingUp, Sprout, CheckCircle, Trophy, Droplets, Calendar } from 'lucide-react';

/**
 * Analytics Page
 *
 * Beautiful statistics dashboard with:
 * - Key metrics cards
 * - Top plants leaderboard
 * - Growth insights
 * - Mobile-optimized layout
 */
const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/analytics');
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Ładowanie statystyk...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      icon: TrendingUp,
      label: 'Całkowity plon',
      value: stats.totalYield > 0 ? `${stats.totalYield.toFixed(1)} kg` : '0 kg',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    {
      icon: Sprout,
      label: 'Posadzono roślin',
      value: stats.plantsPlanted,
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      icon: CheckCircle,
      label: 'Zadań wykonano',
      value: stats.tasksCompleted,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      icon: Calendar,
      label: 'Śr. dni do zbioru',
      value: stats.avgDaysToHarvest ? `${stats.avgDaysToHarvest} dni` : 'Brak danych',
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400'
    },
    {
      icon: Sprout,
      label: 'Aktywne grzadki',
      value: stats.activeBeds,
      color: 'from-teal-500 to-green-600',
      bgColor: 'bg-teal-100 dark:bg-teal-900/30',
      iconColor: 'text-teal-600 dark:text-teal-400'
    },
    {
      icon: Droplets,
      label: 'Wykonane opryski',
      value: stats.spraysApplied,
      color: 'from-red-500 to-pink-600',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Statystyki Ogrodu</h1>
              <p className="text-green-100 text-sm">Podsumowanie Twoich osiągnięć</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition-all p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{card.label}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Top Plants Leaderboard */}
        {stats.topPlants && stats.topPlants.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Najpopularniejsze rośliny
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Twoje najczęściej sadzone rośliny
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {stats.topPlants.map((plant, index) => {
                const medals = ['🥇', '🥈', '🥉'];
                const colors = [
                  'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
                  'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600',
                  'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                ];

                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-lg border ${colors[index]}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{medals[index]}</span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {plant.plant_name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {plant.count} {plant.count === 1 ? 'raz' : plant.count < 5 ? 'razy' : 'razy'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="w-12 h-12 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center font-bold text-xl text-gray-900 dark:text-white">
                        {plant.count}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {stats.plantsPlanted === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sprout className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Brak danych
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Zacznij sadzić rośliny i wykonywać zadania, aby zobaczyć swoje statystyki!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
