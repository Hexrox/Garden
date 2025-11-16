import React, { useState, useEffect } from 'react';
import axios from '../config/axios';

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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Przypomnienia</h1>
        {reminders.length > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Oznacz wszystkie jako przeczytane
          </button>
        )}
      </div>

      {reminders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">Brak aktywnych przypomnień</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="p-6 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🔔</span>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {reminder.message}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>{reminder.plot_name}</strong> - Rząd {reminder.row_number} ({reminder.plant_name})
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Środek: {reminder.spray_name} | Bezpieczny zbiór: {reminder.safe_harvest_date}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Data przypomnienia: {reminder.reminder_date}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => markAsRead(reminder.id)}
                  className="ml-4 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
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
