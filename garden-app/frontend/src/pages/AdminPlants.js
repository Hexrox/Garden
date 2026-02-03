import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Leaf,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  X,
  Filter,
  RefreshCw,
  User,
  Calendar,
  Image
} from 'lucide-react';
import axios, { getImageUrl } from '../config/axios';
import { useAuth } from '../context/AuthContext';

const AdminPlants = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [plants, setPlants] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [rejectError, setRejectError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const API_URL = process.env.REACT_APP_API_URL || '';

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get('/api/admin/plants/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  const fetchPlants = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/plants/all', {
        params: { status: filter, page, limit: 20 }
      });
      setPlants(response.data.plants || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (err) {
      console.error('Error fetching plants:', err);
      if (err.response?.status === 403) {
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  }, [filter, page, navigate]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchStats();
    fetchPlants();
  }, [user, navigate, fetchStats, fetchPlants]);

  const handleApprove = async (plantId) => {
    try {
      setProcessing(true);
      await axios.put(`/api/admin/plants/${plantId}/approve`);
      fetchPlants();
      fetchStats();
      setSelectedPlant(null);
    } catch (err) {
      console.error('Error approving plant:', err);
      console.error('Błąd podczas zatwierdzania:', err.response?.data?.error || err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPlant || !rejectReason.trim()) {
      setRejectError('Podaj powód odrzucenia');
      return;
    }
    setRejectError('');

    try {
      setProcessing(true);
      await axios.put(`/api/admin/plants/${selectedPlant.id}/reject`, {
        reason: rejectReason.trim()
      });
      fetchPlants();
      fetchStats();
      setSelectedPlant(null);
      setShowRejectModal(false);
      setRejectReason('');
    } catch (err) {
      console.error('Error rejecting plant:', err);
      console.error('Błąd podczas odrzucania:', err.response?.data?.error || err.message);
    } finally {
      setProcessing(false);
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, plantId: null });

  const handleDelete = async (plantId) => {
    setDeleteConfirm({ open: true, plantId });
  };

  const executeDelete = async (plantId) => {
    try {
      setProcessing(true);
      await axios.delete(`/api/admin/plants/${plantId}`);
      fetchPlants();
      fetchStats();
      setSelectedPlant(null);
    } catch (err) {
      console.error('Error deleting plant:', err);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-xs font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Oczekuje
          </span>
        );
      case 'approved':
        return (
          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-xs font-medium flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Zatwierdzona
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-full text-xs font-medium flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Odrzucona
          </span>
        );
      default:
        return null;
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      'vegetable': 'Warzywo',
      'flower_perennial': 'Bylina',
      'flower_bulb': 'Kwiat cebulowy',
      'flower_annual': 'Kwiat jednoroczny',
      'fruit_tree': 'Drzewo owocowe',
      'fruit_bush': 'Krzew owocowy',
      'herb': 'Zioło'
    };
    return labels[category] || category;
  };

  if (loading && plants.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Leaf className="w-8 h-8 text-green-600" />
            Moderacja Roślin
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Zarządzaj roślinami dodanymi przez użytkowników
          </p>
        </div>
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="hidden sm:inline">Panel Admin</span>
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-800 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{stats.pending_count}</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">Oczekujące</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-800 dark:text-green-200">{stats.approved_count}</p>
                <p className="text-xs text-green-600 dark:text-green-400">Zatwierdzone</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-800 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-800 dark:text-red-200">{stats.rejected_count}</p>
                <p className="text-xs text-red-600 dark:text-red-400">Odrzucone</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{stats.contributors_count}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">Kontrybutorzy</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Filtruj:</span>
        </div>
        {['pending', 'approved', 'rejected', 'all'].map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => { setFilter(filterOption); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === filterOption
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {filterOption === 'pending' && 'Oczekujące'}
            {filterOption === 'approved' && 'Zatwierdzone'}
            {filterOption === 'rejected' && 'Odrzucone'}
            {filterOption === 'all' && 'Wszystkie'}
          </button>
        ))}

        <button
          onClick={() => { fetchPlants(); fetchStats(); }}
          className="ml-auto p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          title="Odśwież"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Plants List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        {plants.length === 0 ? (
          <div className="p-12 text-center">
            <Leaf className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Brak roślin do wyświetlenia
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Roślina
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Kategoria
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Kontrybutor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {plants.map((plant) => (
                  <tr key={plant.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {plant.photo_thumb ? (
                          <img
                            src={getImageUrl(plant.photo_thumb)}
                            alt={plant.display_name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <Leaf className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {plant.display_name || plant.name}
                          </p>
                          {plant.latin_name && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                              {plant.latin_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {getCategoryLabel(plant.category)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {plant.contributor_username || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(plant.status)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {plant.created_at && new Date(plant.created_at).toLocaleDateString('pl-PL')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedPlant(plant)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Szczegóły"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {plant.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(plant.id)}
                              disabled={processing}
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                              title="Zatwierdź"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setSelectedPlant(plant); setShowRejectModal(true); }}
                              disabled={processing}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                              title="Odrzuć"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(plant.id)}
                          disabled={processing}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Usuń"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg disabled:opacity-50"
            >
              Poprzednia
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Strona {page} z {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg disabled:opacity-50"
            >
              Następna
            </button>
          </div>
        )}
      </div>

      {/* Plant Detail Modal */}
      {selectedPlant && !showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedPlant.display_name || selectedPlant.name}
                  </h2>
                  {selectedPlant.latin_name && (
                    <p className="text-green-100 italic mt-1">{selectedPlant.latin_name}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedPlant(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center gap-4">
                {getStatusBadge(selectedPlant.status)}
                {selectedPlant.rejection_reason && (
                  <div className="flex-1 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      <strong>Powód odrzucenia:</strong> {selectedPlant.rejection_reason}
                    </p>
                  </div>
                )}
              </div>

              {/* Photo */}
              {selectedPlant.photo_path && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Image className="w-5 h-5" />
                    Zdjęcie
                  </h3>
                  <img
                    src={getImageUrl(selectedPlant.photo_path)}
                    alt={selectedPlant.display_name}
                    className="w-full max-h-64 object-cover rounded-xl"
                  />
                  {selectedPlant.photo_author && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Autor:</strong> {selectedPlant.photo_author}
                      {selectedPlant.photo_license && ` | Licencja: ${selectedPlant.photo_license}`}
                    </p>
                  )}
                </div>
              )}

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Kategoria</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {getCategoryLabel(selectedPlant.category)}
                  </p>
                </div>
                {selectedPlant.days_to_harvest > 0 && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dni do zbioru</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedPlant.days_to_harvest} dni
                    </p>
                  </div>
                )}
                {selectedPlant.sun_requirement && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Światło</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedPlant.sun_requirement}
                    </p>
                  </div>
                )}
                {selectedPlant.water_needs && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Potrzeby wodne</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedPlant.water_needs}
                    </p>
                  </div>
                )}
              </div>

              {/* Contributor Info */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-semibold text-blue-800 dark:text-blue-200">
                      Kontrybutor: {selectedPlant.contributor_username || 'Nieznany'}
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4" />
                      Dodano: {selectedPlant.created_at && new Date(selectedPlant.created_at).toLocaleDateString('pl-PL')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedPlant.notes && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Uwagi</h3>
                  <p className="text-gray-700 dark:text-gray-300">{selectedPlant.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900 rounded-b-2xl">
              <div className="flex gap-3">
                {selectedPlant.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(selectedPlant.id)}
                      disabled={processing}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Zatwierdź
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      disabled={processing}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Odrzuć
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleDelete(selectedPlant.id)}
                  disabled={processing}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-red-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Usuń
                </button>
                <button
                  onClick={() => setSelectedPlant(null)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Zamknij
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedPlant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <XCircle className="text-red-600" />
                Odrzuć roślinę
              </h3>

              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Odrzucasz: <strong>{selectedPlant.display_name}</strong>
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Powód odrzucenia *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                  placeholder="np. Niepełne informacje, nieodpowiednia kategoria..."
                />
              </div>

              {rejectError && (
                <p className="text-sm text-red-600 dark:text-red-400">{rejectError}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowRejectModal(false); setRejectReason(''); setRejectError(''); }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing || !rejectReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50"
                >
                  {processing ? 'Odrzucanie...' : 'Odrzuć'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal potwierdzenia usunięcia */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm({ open: false, plantId: null })}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Usuń roślinę</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Czy na pewno chcesz usunąć tę roślinę? Ta operacja jest nieodwracalna.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm({ open: false, plantId: null })} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Anuluj</button>
              <button onClick={() => { executeDelete(deleteConfirm.plantId); setDeleteConfirm({ open: false, plantId: null }); }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">Usuń</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPlants;
