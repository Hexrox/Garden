import React, { useState, useEffect, useCallback } from 'react';
import { Check, X, RefreshCw, Filter, ChevronLeft, ChevronRight, Trash2, ExternalLink, Image } from 'lucide-react';
import axios, { getImageUrl } from '../config/axios';

/**
 * Panel Admina - Weryfikacja Zdjec Roslin
 *
 * Funkcje:
 * - Galeria zdjec z nazwami roslin
 * - Przyciski Poprawne / Niepoprawne
 * - Filtrowanie po statusie recenzji i kategorii
 * - Zapisywanie recenzji do bazy
 */
const PhotoReview = () => {
  const [plants, setPlants] = useState([]);
  const [stats, setStats] = useState({ total_with_photos: 0, unreviewed: 0, correct: 0, incorrect: 0 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('unreviewed'); // unreviewed, correct, incorrect, all
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [actionLoading, setActionLoading] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || '';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter && filter !== 'all') params.set('filter', filter);
      if (category) params.set('category', category);
      params.set('page', page);
      params.set('limit', 48);

      const [plantsRes, statsRes, categoriesRes] = await Promise.all([
        axios.get(`/api/admin/photo-reviews?${params}`),
        axios.get('/api/admin/photo-reviews/stats'),
        axios.get('/api/admin/photo-reviews/categories')
      ]);

      setPlants(plantsRes.data.plants);
      setPagination(plantsRes.data.pagination);
      setStats(statsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, category, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReview = async (plantId, isCorrect) => {
    try {
      setActionLoading(plantId);
      await axios.post(`/api/admin/photo-reviews/${plantId}`, {
        is_correct: isCorrect
      });
      // Update local state
      setPlants(prev => prev.map(p =>
        p.id === plantId ? { ...p, is_correct: isCorrect ? 1 : 0 } : p
      ));
      // Update stats
      setStats(prev => ({
        ...prev,
        unreviewed: Math.max(0, prev.unreviewed - 1),
        correct: prev.correct + (isCorrect ? 1 : 0),
        incorrect: prev.incorrect + (isCorrect ? 0 : 1)
      }));
    } catch (error) {
      console.error('Błąd zapisywania recenzji:', error.response?.data?.error || error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, plantId: null });

  const handleDeletePhoto = async (plantId) => {
    setDeleteConfirm({ open: true, plantId });
  };

  const executeDeletePhoto = async (plantId) => {
    try {
      setActionLoading(`delete-${plantId}`);
      await axios.delete(`/api/admin/photo-reviews/${plantId}/photo`);
      fetchData();
    } catch (error) {
      console.error('Błąd usuwania:', error.response?.data?.error || error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const translateCategory = (cat) => {
    const translations = {
      'vegetable': 'Warzywa',
      'flower_perennial': 'Byliny',
      'flower_bulb': 'Cebulowe',
      'flower_annual': 'Jednoroczne',
      'fruit_tree': 'Drzewa owocowe',
      'fruit_bush': 'Krzewy owocowe',
      'herb': 'Zioła',
      'grass': 'Trawy ozdobne',
      'tree_ornamental': 'Drzewa ozdobne',
      'shrub_ornamental': 'Krzewy ozdobne',
      'climber': 'Pnącza',
      'groundcover': 'Okrywowe',
      'fern': 'Paprocie',
      'succulent': 'Sukulenty'
    };
    return translations[cat] || cat;
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <Image className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Weryfikacja Zdjec Roslin</h1>
              <p className="text-green-100 mt-1">
                Sprawdz poprawnosc automatycznie pobranych zdjec
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">{stats.total_with_photos}</div>
              <div className="text-green-200 text-sm">Wszystkie</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">{stats.unreviewed}</div>
              <div className="text-green-200 text-sm">Do sprawdzenia</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-300">{stats.correct}</div>
              <div className="text-green-200 text-sm">Poprawne</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-red-300">{stats.incorrect}</div>
              <div className="text-green-200 text-sm">Niepoprawne</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Filtr:</span>
            </div>

            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'all', label: 'Wszystkie' },
                { value: 'unreviewed', label: 'Do sprawdzenia' },
                { value: 'correct', label: 'Poprawne' },
                { value: 'incorrect', label: 'Niepoprawne' }
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => { setFilter(f.value); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === f.value
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <option value="">Wszystkie kategorie</option>
              {categories.map(cat => (
                <option key={cat.category} value={cat.category}>
                  {translateCategory(cat.category)} ({cat.unreviewed}/{cat.total})
                </option>
              ))}
            </select>

            <button
              onClick={fetchData}
              className="ml-auto p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Odswiez"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Photo Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
          </div>
        ) : plants.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
            <Image className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Brak zdjec do wyswietlenia</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {plants.map(plant => (
              <div
                key={plant.id}
                className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border-2 transition-all ${
                  plant.is_correct === 1 ? 'border-green-500' :
                  plant.is_correct === 0 ? 'border-red-500' :
                  'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {/* Photo */}
                <div className="aspect-square relative group">
                  <img
                    src={getImageUrl(plant.photo_thumb || plant.photo_path)}
                    alt={plant.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {/* Review status badge */}
                  {plant.is_correct !== null && (
                    <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${
                      plant.is_correct === 1 ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {plant.is_correct === 1 ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : (
                        <X className="w-4 h-4 text-white" />
                      )}
                    </div>
                  )}

                  {/* Hover overlay with actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {/* Correct button */}
                    <button
                      onClick={() => handleReview(plant.id, true)}
                      disabled={actionLoading === plant.id}
                      className="p-2 bg-green-500 hover:bg-green-600 rounded-full text-white transition-colors disabled:opacity-50"
                      title="Poprawne"
                    >
                      <Check className="w-5 h-5" />
                    </button>

                    {/* Incorrect button */}
                    <button
                      onClick={() => handleReview(plant.id, false)}
                      disabled={actionLoading === plant.id}
                      className="p-2 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors disabled:opacity-50"
                      title="Niepoprawne"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeletePhoto(plant.id)}
                      disabled={actionLoading === `delete-${plant.id}`}
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full text-white transition-colors disabled:opacity-50"
                      title="Usun zdjecie"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    {/* Source link */}
                    {plant.photo_source_url && (
                      <a
                        href={plant.photo_source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-blue-500 hover:bg-blue-600 rounded-full text-white transition-colors"
                        title="Zrodlo"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Plant info */}
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate" title={plant.name}>
                    {plant.name}
                  </h3>
                  {plant.latin_name && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic truncate" title={plant.latin_name}>
                      {plant.latin_name}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {translateCategory(plant.category)}
                  </p>
                  {plant.photo_author && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate" title={`Autor: ${plant.photo_author}`}>
                      Autor: {plant.photo_author}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span className="text-sm text-gray-600 dark:text-gray-400">
              Strona {page} z {pagination.totalPages} ({pagination.total} zdjec)
            </span>

            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Legend */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Legenda</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-green-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Poprawne zdjecie</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-red-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Niepoprawne zdjecie</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-gray-300"></div>
              <span className="text-gray-600 dark:text-gray-400">Do sprawdzenia</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
            Najedz na zdjecie, aby wyswietlic przyciski akcji. Kliknij <Check className="w-3 h-3 inline text-green-500" /> jezeli zdjecie pasuje do rosliny,
            lub <X className="w-3 h-3 inline text-red-500" /> jezeli jest niepoprawne.
          </p>
        </div>
      </div>
      {/* Modal potwierdzenia usunięcia */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm({ open: false, plantId: null })}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Usuń zdjęcie</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Usunąć to zdjęcie? Będzie można je ponownie pobrać.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm({ open: false, plantId: null })} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Anuluj</button>
              <button onClick={() => { executeDeletePhoto(deleteConfirm.plantId); setDeleteConfirm({ open: false, plantId: null }); }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">Usuń</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoReview;
