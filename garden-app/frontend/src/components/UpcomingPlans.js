import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Calendar, ChevronRight, Check, AlertTriangle, Cloud } from 'lucide-react';
import axios from '../config/axios';
import { useToast } from '../context/ToastContext';

// Ikony dla typów akcji
const ACTION_ICONS = {
  plant: '🌱',
  spray: '🧴',
  water: '💧',
  harvest: '🥕',
  transplant: '🔄',
  fertilize: '🧪',
  prune: '✂️',
  custom: '📝'
};

const UpcomingPlans = () => {
  const { showToast } = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const res = await axios.get('/api/planner/upcoming?limit=5');
      setPlans(res.data);
    } catch (error) {
      console.error('Błąd ładowania planów:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (planId) => {
    try {
      await axios.post(`/api/planner/${planId}/complete`);
      showToast('Plan oznaczony jako wykonany', 'success');
      loadPlans();
    } catch (error) {
      console.error('Błąd:', error);
      showToast('Błąd oznaczania planu', 'error');
    }
  };

  // Formatuj datę
  const formatDate = (dateStr, daysUntil) => {
    if (daysUntil === 0) return 'Dziś';
    if (daysUntil === 1) return 'Jutro';
    if (daysUntil === 2) return 'Pojutrze';
    if (daysUntil <= 7) return `Za ${daysUntil} dni`;

    const date = new Date(dateStr);
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short'
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Nagłówek */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Nadchodzące plany</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Zaplanowane działania</p>
            </div>
          </div>
          <Link
            to="/planner"
            className="text-sm text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
          >
            Wszystkie
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      {/* Lista planów */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {plans.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <Calendar className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Brak zaplanowanych działań
            </p>
            <Link
              to="/planner"
              className="inline-block mt-3 text-sm text-orange-600 dark:text-orange-400 hover:underline"
            >
              Dodaj pierwszy plan
            </Link>
          </div>
        ) : (
          plans.map(plan => {
            const isToday = plan.days_until === 0;
            const isOverdue = plan.days_until < 0;

            return (
              <div
                key={plan.id}
                className={`px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${
                  isOverdue ? 'bg-red-50 dark:bg-red-900/10' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Ikona typu */}
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">{ACTION_ICONS[plan.action_type] || '📝'}</span>
                  </div>

                  {/* Treść */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {plan.title}
                      </h4>
                      {plan.weather_dependent && (
                        <Cloud size={14} className="text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`flex items-center gap-1 ${
                        isOverdue
                          ? 'text-red-600 dark:text-red-400 font-medium'
                          : isToday
                            ? 'text-green-600 dark:text-green-400 font-medium'
                            : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {isOverdue && <AlertTriangle size={12} />}
                        {formatDate(plan.planned_date, plan.days_until)}
                      </span>
                      {plan.plot_name && (
                        <>
                          <span className="text-gray-300 dark:text-gray-600">•</span>
                          <span className="text-gray-500 dark:text-gray-400 truncate">
                            {plan.plot_name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Przycisk wykonania */}
                  <button
                    onClick={() => handleComplete(plan.id)}
                    className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex-shrink-0"
                    title="Oznacz jako wykonane"
                  >
                    <Check size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer z podsumowaniem */}
      {plans.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-750 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              {plans.filter(p => p.days_until <= 3).length} w najbliższych 3 dniach
            </span>
            <Link
              to="/planner"
              className="text-orange-600 dark:text-orange-400 hover:underline font-medium"
            >
              Dodaj plan →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcomingPlans;
