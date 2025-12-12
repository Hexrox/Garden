import React, { useState, useEffect } from 'react';
import { X, Check, ChevronRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../config/axios';

const WelcomeCard = ({ onDismiss, onShowTour }) => {
  const navigate = useNavigate();
  const [checklist, setChecklist] = useState({
    hasPlot: false,
    hasLocation: false,
    hasPhoto: false,
    hasVisitedCalendar: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkProgress();
  }, []);

  const checkProgress = async () => {
    try {
      const [plotsRes, profileRes, photosRes] = await Promise.all([
        axios.get('/api/plots'),
        axios.get('/api/auth/profile'),
        axios.get('/api/gallery?limit=1')
      ]);

      setChecklist({
        hasPlot: plotsRes.data.length > 0,
        hasLocation: !!(profileRes.data.city || profileRes.data.latitude),
        hasPhoto: photosRes.data.length > 0,
        hasVisitedCalendar: localStorage.getItem('visitedCalendar') === 'true'
      });
    } catch (error) {
      console.error('Error checking progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const tasks = [
    {
      id: 'hasPlot',
      label: 'Dodaj pierwsze poletko',
      desc: 'Stwórz miejsce na swoje rośliny',
      action: () => navigate('/plots/new'),
      icon: '🌱'
    },
    {
      id: 'hasLocation',
      label: 'Ustaw lokalizację',
      desc: 'Otrzymuj prognozy pogody',
      action: () => navigate('/profile'),
      icon: '📍'
    },
    {
      id: 'hasPhoto',
      label: 'Zrób pierwsze zdjęcie',
      desc: 'Dokumentuj postępy',
      action: () => navigate('/gallery'),
      icon: '📸'
    },
    {
      id: 'hasVisitedCalendar',
      label: 'Zobacz kalendarz księżycowy',
      desc: 'Poznaj najlepsze dni do siewu',
      action: () => {
        localStorage.setItem('visitedCalendar', 'true');
        navigate('/calendar');
      },
      icon: '🌙'
    }
  ];

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const progress = (completedCount / tasks.length) * 100;

  if (loading) {
    return null;
  }

  // Auto-hide when all tasks completed
  if (completedCount === tasks.length) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 rounded-2xl shadow-lg overflow-hidden border-2 border-green-200 dark:border-green-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white relative">
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          title="Ukryj kartę"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-1">
              👋 Witaj w Garden App!
            </h3>
            <p className="text-green-100 text-sm">
              Przejdź przez szybki start aby w pełni wykorzystać aplikację
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-green-100">Postęp</span>
            <span className="font-semibold">{completedCount}/{tasks.length}</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Task list */}
      <div className="p-6 space-y-3">
        {tasks.map((task) => {
          const isCompleted = checklist[task.id];

          return (
            <button
              key={task.id}
              onClick={!isCompleted ? task.action : undefined}
              disabled={isCompleted}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                isCompleted
                  ? 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/20 opacity-75'
                  : 'border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-600 hover:shadow-md hover:-translate-y-0.5 bg-white dark:bg-gray-800'
              }`}
            >
              {/* Icon/Checkbox */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isCompleted
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                {isCompleted ? (
                  <Check size={20} className="text-white" />
                ) : (
                  <span className="text-xl">{task.icon}</span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className={`font-semibold ${
                  isCompleted
                    ? 'text-green-800 dark:text-green-200 line-through'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {task.label}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {task.desc}
                </p>
              </div>

              {/* Arrow */}
              {!isCompleted && (
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 flex items-center justify-between gap-3">
        <button
          onClick={onShowTour}
          className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm"
        >
          📖 Pokaż przewodnik
        </button>

        {completedCount >= 2 && (
          <button
            onClick={onDismiss}
            className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all text-sm shadow-md"
          >
            ✓ Rozumiem
          </button>
        )}
      </div>

      {/* Motivational message */}
      {completedCount > 0 && completedCount < tasks.length && (
        <div className="px-6 pb-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-center">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>💪 Świetnie Ci idzie!</strong> Jeszcze {tasks.length - completedCount} {tasks.length - completedCount === 1 ? 'zadanie' : 'zadania'} do ukończenia!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WelcomeCard;
