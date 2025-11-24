import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Droplets, Bell, Plus, BarChart3, Save, Layout } from 'lucide-react';
import axios from '../config/axios';
import { useAuth } from '../context/AuthContext';
import WeatherWidget from '../components/WeatherWidget';
import TaskList from '../components/TaskList';
import UpcomingHarvests from '../components/UpcomingHarvests';
import SuccessionWidget from '../components/SuccessionWidget';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPlots: 0,
    totalBeds: 0,
    activeSprays: 0
  });
  const [reminders, setReminders] = useState([]);
  const [activeSprays, setActiveSprays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();

    // Fallback timeout to prevent infinite loading (max 5 seconds)
    const fallbackTimeout = setTimeout(() => {
      if (loading) {
        console.warn('Dashboard loading timeout - forcing loading to false');
        setLoading(false);
      }
    }, 5000);

    return () => clearTimeout(fallbackTimeout);
  }, []);

  const loadDashboardData = async () => {
    try {
      // Add individual .catch() handlers to prevent total failure
      const [plotsRes, remindersRes, spraysRes] = await Promise.all([
        axios.get('/api/plots').catch(err => {
          console.error('Error loading plots:', err);
          return { data: [] };
        }),
        axios.get('/api/reminders').catch(err => {
          console.error('Error loading reminders:', err);
          return { data: [] };
        }),
        axios.get('/api/sprays/active').catch(err => {
          console.error('Error loading sprays:', err);
          return { data: [] };
        })
      ]);

      setStats({
        totalPlots: plotsRes.data.length,
        activeSprays: spraysRes.data.length
      });

      setReminders(remindersRes.data.slice(0, 5));
      setActiveSprays(spraysRes.data.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard:', error);
      // Even on error, set empty data rather than hanging
      setStats({ totalPlots: 0, totalBeds: 0, activeSprays: 0 });
      setReminders([]);
      setActiveSprays([]);
    } finally {
      setLoading(false);
    }
  };

  const markReminderAsRead = async (id) => {
    try {
      await axios.put(`/api/reminders/${id}/read`);
      setReminders(reminders.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error marking reminder:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Ładowanie...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Witaj, {user?.username}!
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">Przegląd Twojego ogrodu</p>
        </div>
      </div>

      {/* Widgets Row - Weather, Tasks, Harvests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <WeatherWidget />
        <TaskList />
        <UpcomingHarvests />
      </div>

      {/* Succession Planting Widget */}
      <SuccessionWidget />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Sprout className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Poletka</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalPlots}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/plots" className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm font-medium">
              Zobacz wszystkie →
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Droplets className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aktywne opryski</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.activeSprays}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/sprays" className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm font-medium">
              Zobacz historię →
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <Bell className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Przypomnienia</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{reminders.length}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/reminders" className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm font-medium">
              Zobacz wszystkie →
            </Link>
          </div>
        </div>
      </div>

      {/* Reminders Section */}
      {reminders.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Aktywne przypomnienia</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{reminder.message}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {reminder.plot_name} - Rząd {reminder.row_number} ({reminder.plant_name})
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Data przypomnienia: {reminder.reminder_date}
                    </p>
                  </div>
                  <button
                    onClick={() => markReminderAsRead(reminder.id)}
                    className="ml-4 text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                  >
                    Oznacz jako przeczytane
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Sprays Section */}
      {activeSprays.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Aktywne opryski (w okresie karencji)</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {activeSprays.map((spray) => (
              <div key={spray.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{spray.spray_name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {spray.plot_name} - Rząd {spray.row_number} ({spray.plant_name})
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Data oprysku: {spray.spray_date} | Bezpieczny zbiór: {spray.safe_harvest_date}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                    Karencja: {spray.withdrawal_period} dni
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Szybkie akcje</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/plots/new"
            className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <Plus size={18} />
            Nowe poletko
          </Link>
          <Link
            to="/sprays"
            className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <BarChart3 size={18} />
            Historia oprysków
          </Link>
          <Link
            to="/export"
            className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <Save size={18} />
            Eksport danych
          </Link>
          <Link
            to="/plots"
            className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <Layout size={18} />
            Wszystkie poletka
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
