import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  LayoutGrid,
  CheckSquare,
  Droplets,
  TrendingUp,
  Clock,
  MapPin,
  ArrowLeft,
  Trash2,
  X,
  Leaf,
  Image
} from 'lucide-react';
import axios from '../config/axios';
import { useAuth } from '../context/AuthContext';

/**
 * AdminPanel - Panel administracyjny
 *
 * Dostępny tylko dla użytkownika 'admin'
 * Wyświetla statystyki aplikacji i listę użytkowników
 */
const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [plantStats, setPlantStats] = useState(null);

  const fetchAdminStats = useCallback(async () => {
    try {
      setLoading(true);
      const [adminResponse, plantsResponse] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/plants/stats').catch(() => ({ data: null }))
      ]);
      setStats(adminResponse.data.stats);
      setUsers(adminResponse.data.users);
      setRecentActivity(adminResponse.data.recentActivity);
      setPlantStats(plantsResponse.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      if (err.response?.status === 403) {
        setError('Brak uprawnień administratora');
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        setError('Błąd podczas ładowania statystyk');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    // Sprawdź czy użytkownik to admin
    if (!user || user.username !== 'admin') {
      navigate('/dashboard');
      return;
    }

    fetchAdminStats();
  }, [user, navigate, fetchAdminStats]);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setDeleting(true);
      await axios.delete(`/api/admin/users/${userToDelete.id}`);

      // Odśwież listę użytkowników
      setUsers(users.filter(u => u.id !== userToDelete.id));

      // Zaktualizuj statystyki
      setStats(prev => ({
        ...prev,
        total_users: (prev?.total_users || 0) - 1
      }));

      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      console.error('Błąd podczas usuwania użytkownika:', err.response?.data?.error || err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500 dark:text-gray-400">Ładowanie...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Panel Administracyjny
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Statystyki i zarządzanie aplikacją
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="hidden sm:inline">Dashboard</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label="Użytkownicy"
          value={stats?.total_users || 0}
          color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          icon={LayoutGrid}
          label="Działki"
          value={stats?.total_plots || 0}
          color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
        />
        <StatCard
          icon={CheckSquare}
          label="Zadania"
          value={`${stats?.completed_tasks || 0}/${stats?.total_tasks || 0}`}
          color="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
          sublabel="ukończone"
        />
        <StatCard
          icon={Droplets}
          label="Opryski"
          value={stats?.total_sprays || 0}
          color="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400"
        />
      </div>

      {/* Moderation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Plants Moderation */}
        <Link
          to="/admin/plants"
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-yellow-500"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                <Leaf className="w-7 h-7 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Moderacja Roślin
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Zarządzaj roślinami dodanymi przez użytkowników
                </p>
              </div>
            </div>
            {plantStats?.pending_count > 0 && (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-yellow-500 text-white text-sm font-bold rounded-full animate-pulse">
                  {plantStats.pending_count}
                </span>
                <span className="text-sm text-yellow-600 dark:text-yellow-400">
                  oczekuje
                </span>
              </div>
            )}
          </div>
          {plantStats && (
            <div className="mt-4 flex gap-4 text-sm">
              <span className="text-green-600 dark:text-green-400">
                {plantStats.approved_count} zatwierdzonych
              </span>
              <span className="text-red-600 dark:text-red-400">
                {plantStats.rejected_count} odrzuconych
              </span>
            </div>
          )}
        </Link>

        {/* Images Management */}
        <Link
          to="/admin/images"
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-purple-500"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <Image className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Zdjęcia Roślin
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Zarządzaj zdjęciami i ilustracjami w katalogu
              </p>
            </div>
          </div>
        </Link>

        {/* Photo Review */}
        <Link
          to="/admin/photo-review"
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-teal-500"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
              <Image className="w-7 h-7 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Weryfikacja Zdjęć
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sprawdź poprawność automatycznie pobranych zdjęć
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users size={24} />
            Użytkownicy ({users.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Użytkownik
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Lokalizacja
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Działki
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Zadania
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Logowania
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Utworzono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ostatnie logowanie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-semibold">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {u.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {u.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {u.city ? (
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        {u.city}
                        {u.hardiness_zone && (
                          <span className="ml-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                            Z{u.hardiness_zone}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {u.plots_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {u.tasks_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">
                      {u.login_count || 0}×
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {new Date(u.created_at).toLocaleDateString('pl-PL')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {u.last_login ? (
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        {formatRelativeTime(u.last_login)}
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">Nigdy</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {u.id !== user.id && (
                      <button
                        onClick={() => {
                          setUserToDelete(u);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1"
                      >
                        <Trash2 size={16} />
                        <span>Usuń</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity && recentActivity.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={24} />
            Ostatnia aktywność
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
              >
                <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                  activity.completed ? 'bg-green-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-semibold">{activity.username}</span>
                    {activity.completed ? ' ukończył' : ' utworzył'}: {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatRelativeTime(activity.completed_at || activity.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Trash2 className="text-red-600" size={24} />
                Usuń konto użytkownika
              </h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                disabled={deleting}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                <p className="text-red-800 dark:text-red-200 font-semibold mb-2">
                  ⚠️ Ostrzeżenie!
                </p>
                <p className="text-red-700 dark:text-red-300 text-sm">
                  Ta operacja jest nieodwracalna i usunie wszystkie dane użytkownika.
                </p>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-gray-900 dark:text-white">
                  Czy na pewno chcesz usunąć użytkownika:
                </p>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {userToDelete.username}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {userToDelete.email}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Zostaną usunięte:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• {userToDelete.plots_count} poletko/poletek</li>
                  <li>• Wszystkie grządki i rośliny</li>
                  <li>• {userToDelete.tasks_count} zadanie/zadań</li>
                  <li>• Wszystkie zdjęcia</li>
                  <li>• Historia oprysków</li>
                  <li>• Przypomnienia i powiadomienia</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                disabled={deleting}
              >
                Anuluj
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Usuwanie...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Usuń konto
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for stat cards
const StatCard = ({ icon: Icon, label, value, color, sublabel }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          {sublabel && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sublabel}</p>
          )}
        </div>
        <div className={`w-14 h-14 ${color} rounded-lg flex items-center justify-center`}>
          <Icon size={28} />
        </div>
      </div>
    </div>
  );
};

// Helper function to format relative time
const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Nieznana';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Teraz';
  if (diffMins < 60) return `${diffMins} min temu`;
  if (diffHours < 24) return `${diffHours}h temu`;
  if (diffDays < 7) return `${diffDays} dni temu`;

  return date.toLocaleDateString('pl-PL');
};

export default AdminPanel;
