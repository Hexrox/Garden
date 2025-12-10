import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import { CheckCheck } from 'lucide-react';

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const response = await axios.get('/api/reminders');
      setReminders(response.data);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`/api/reminders/${id}/read`);
      setReminders(reminders.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error marking reminder:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/reminders/read-all');
      setReminders([]);
    } catch (error) {
      console.error('Error marking all reminders:', error);
    }
  };

  if (loading) return <div className="text-center py-12">Ładowanie...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Przypomnienia</h1>
        {reminders.length > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 text-sm md:text-base"
            title="Oznacz wszystkie jako przeczytane"
          >
            <CheckCheck size={18} />
            <span className="hidden sm:inline">Oznacz wszystkie</span>
            <span className="sm:hidden">Wszystkie</span>
          </button>
        )}
      </div>

      {reminders.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-500 dark:text-gray-400">Brak aktywnych przypomnień</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-3">
              {/* Header with icon and title */}
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">🔔</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-snug">
                    {reminder.message}
                  </h3>
                </div>
              </div>

              {/* Details section */}
              <div className="space-y-2 pl-11">
                <div className="flex items-start">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-28 flex-shrink-0">Grządka:</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {reminder.plot_name} - Rząd {reminder.row_number}
                  </span>
                </div>

                <div className="flex items-start">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-28 flex-shrink-0">Roślina:</span>
                  <span className="text-sm text-gray-900 dark:text-white">{reminder.plant_name}</span>
                </div>

                <div className="flex items-start">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-28 flex-shrink-0">Środek:</span>
                  <span className="text-sm text-gray-900 dark:text-white">{reminder.spray_name}</span>
                </div>

                <div className="flex items-start">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-28 flex-shrink-0">Bezpieczny zbiór:</span>
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">{reminder.safe_harvest_date}</span>
                </div>

                <div className="flex items-start">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-28 flex-shrink-0">Przypomnienie:</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{reminder.reminder_date}</span>
                </div>
              </div>

              {/* Action button */}
              <div className="pt-2 pl-11">
                <button
                  onClick={() => markAsRead(reminder.id)}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCheck size={16} />
                  Oznacz jako przeczytane
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reminders;
