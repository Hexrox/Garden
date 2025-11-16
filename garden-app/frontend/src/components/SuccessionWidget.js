import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../config/axios';

const SuccessionWidget = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const response = await axios.get('/api/succession');
      // Filter active reminders and sort by next planting date
      const active = response.data
        .filter(r => r.is_active)
        .sort((a, b) => new Date(a.next_planting_date) - new Date(b.next_planting_date));
      setReminders(active);
    } catch (error) {
      console.error('Error fetching succession reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPlanted = async (reminderId) => {
    try {
      await axios.post(`/api/succession/${reminderId}/complete`);
      setMessage({ type: 'success', text: 'Oznaczono jako posadzone!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      fetchReminders();
    } catch (error) {
      setMessage({ type: 'error', text: 'Błąd podczas aktualizacji' });
      console.error('Error marking as planted:', error);
    }
  };

  const getStatusColor = (nextDate) => {
    const now = new Date();
    const target = new Date(nextDate);
    const daysUntil = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return 'text-red-600 dark:text-red-400'; // Overdue
    if (daysUntil <= 3) return 'text-orange-600 dark:text-orange-400'; // Due soon
    return 'text-green-600 dark:text-green-400'; // Future
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const daysUntil = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) {
      return `${Math.abs(daysUntil)} dni temu`;
    } else if (daysUntil === 0) {
      return 'Dziś';
    } else if (daysUntil === 1) {
      return 'Jutro';
    } else if (daysUntil <= 7) {
      return `Za ${daysUntil} dni`;
    } else {
      return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">Ładowanie...</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          🔄 Sadzenie Sukcesyjne
        </h2>
        <Link
          to="/succession"
          className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
        >
          Zarządzaj
        </Link>
      </div>

      {message.text && (
        <div className={`mx-6 mt-4 p-3 rounded text-sm ${
          message.type === 'success'
            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {reminders.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <p className="text-4xl mb-2">🌱</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Brak zaplanowanych sadzeń sukcesyjnych
          </p>
          <Link
            to="/succession"
            className="mt-3 inline-block text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
          >
            + Dodaj pierwsze przypomnienie
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {reminders.slice(0, 5).map((reminder) => {
            const statusColor = getStatusColor(reminder.next_planting_date);
            return (
              <div key={reminder.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {reminder.plant_name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Co {reminder.interval_days} dni
                    </p>
                    <p className={`text-sm font-semibold mt-2 ${statusColor}`}>
                      {formatDate(reminder.next_planting_date)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleMarkPlanted(reminder.id)}
                    className="ml-4 px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    ✓ Posadzone
                  </button>
                </div>
              </div>
            );
          })}
          {reminders.length > 5 && (
            <div className="px-6 py-3 text-center">
              <Link
                to="/succession"
                className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
              >
                Zobacz wszystkie ({reminders.length})
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SuccessionWidget;
