import React, { useState, useEffect, useCallback } from 'react';
import { Camera, Image, Search, Check, X, RefreshCw, ChevronLeft, ChevronRight, Info, Trash2, ExternalLink } from 'lucide-react';
import axios, { getImageUrl } from '../config/axios';

/**
 * Panel Admina - Zarządzanie Zdjęciami Roślin
 *
 * Funkcje:
 * - Przeglądanie kandydatów do zatwierdzenia
 * - Zatwierdzanie/odrzucanie zdjęć
 * - Wyszukiwanie nowych zdjęć
 * - Usuwanie zatwierdzonych zdjęć
 */
const AdminImages = () => {
  const [plants, setPlants] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, no_candidates: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, approved, no-candidates, all
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, plant: null, type: null });

  const fetchPlants = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter && filter !== 'all') params.set('status', filter);
      if (category) params.set('category', category);
      params.set('page', page);
      params.set('limit', 20);

      const response = await axios.get(`/api/admin/images/plants?${params}`);
      setPlants(response.data.plants);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching plants:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, category, page]);

  useEffect(() => {
    fetchPlants();
  }, [fetchPlants]);

  const handleApprove = async (plant, candidate, type) => {
    try {
      setActionLoading(`approve-${plant.id}-${candidate.url}`);
      await axios.post(`/api/admin/images/approve/${plant.id}`, {
        candidate,
        type
      });
      fetchPlants();
      if (selectedPlant?.id === plant.id) {
        // Odśwież wybraną roślinę
        const updated = await axios.get(`/api/admin/images/plants?status=all&limit=1000`);
        const refreshedPlant = updated.data.plants.find(p => p.id === plant.id);
        setSelectedPlant(refreshedPlant);
      }
    } catch (error) {
      console.error('Błąd zatwierdzania:', error.response?.data?.error || error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (plant, candidateUrl) => {
    try {
      setActionLoading(`reject-${plant.id}-${candidateUrl}`);
      await axios.post(`/api/admin/images/reject/${plant.id}`, {
        candidateUrl
      });
      fetchPlants();
      if (selectedPlant?.id === plant.id) {
        setSelectedPlant(prev => ({
          ...prev,
          image_candidates: prev.image_candidates.filter(c => c.url !== candidateUrl)
        }));
      }
    } catch (error) {
      console.error('Błąd odrzucania:', error.response?.data?.error || error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (plant, type) => {
    setDeleteConfirm({ open: true, plant, type });
  };

  const executeDelete = async (plant, type) => {
    try {
      setActionLoading(`delete-${plant.id}-${type}`);
      await axios.delete(`/api/admin/images/${plant.id}/${type}`);
      fetchPlants();
      if (selectedPlant?.id === plant.id) {
        setSelectedPlant(prev => ({
          ...prev,
          [`${type}_path`]: null,
          [`${type}_thumb`]: null
        }));
      }
    } catch (error) {
      console.error('Błąd usuwania:', error.response?.data?.error || error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearch = async (plant) => {
    try {
      setActionLoading(`search-${plant.id}`);
      const query = searchQuery || plant.latin_name;
      const response = await axios.post(`/api/admin/images/search/${plant.id}`, { query });
      console.log(`Znaleziono ${response.data.found} wyników, nowych: ${response.data.newCandidates}`);
      fetchPlants();
      if (selectedPlant?.id === plant.id) {
        setSelectedPlant(prev => ({
          ...prev,
          image_candidates: response.data.candidates
        }));
      }
    } catch (error) {
      console.error('Błąd wyszukiwania:', error.response?.data?.error || error.message);
    } finally {
      setActionLoading(null);
      setSearchQuery('');
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
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <Camera size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Zarządzanie Zdjęciami Roślin</h1>
              <p className="text-purple-100">Panel administratora</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Wszystkich"
            value={stats.total}
            icon="🌱"
            onClick={() => { setFilter('all'); setPage(1); }}
            active={filter === 'all'}
          />
          <StatCard
            label="Do zatwierdzenia"
            value={stats.pending}
            icon="⏳"
            color="yellow"
            onClick={() => { setFilter('pending'); setPage(1); }}
            active={filter === 'pending'}
          />
          <StatCard
            label="Zatwierdzone"
            value={stats.approved}
            icon="✅"
            color="green"
            onClick={() => { setFilter('approved'); setPage(1); }}
            active={filter === 'approved'}
          />
          <StatCard
            label="Bez kandydatów"
            value={stats.no_candidates}
            icon="❓"
            color="red"
            onClick={() => { setFilter('no-candidates'); setPage(1); }}
            active={filter === 'no-candidates'}
          />
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 flex flex-wrap gap-4 items-center">
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Wszystkie kategorie</option>
            <option value="vegetable">🥕 Warzywa</option>
            <option value="flower_perennial">🌸 Byliny</option>
            <option value="flower_annual">🌼 Jednoroczne</option>
            <option value="flower_bulb">🌷 Cebulowe</option>
            <option value="fruit_tree">🌳 Drzewa owocowe</option>
            <option value="fruit_bush">🍇 Krzewy owocowe</option>
            <option value="herb">🌿 Zioła</option>
          </select>

          <button
            onClick={fetchPlants}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2"
          >
            <RefreshCw size={18} />
            Odśwież
          </button>

          {/* Pagination */}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 disabled:opacity-50"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="px-4 text-gray-600 dark:text-gray-400">Strona {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={plants.length < 20}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 disabled:opacity-50"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Plants Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          </div>
        ) : plants.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Brak roślin do wyświetlenia
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plants.map(plant => (
              <PlantCard
                key={plant.id}
                plant={plant}
                onSelect={() => setSelectedPlant(plant)}
                translateCategory={translateCategory}
              />
            ))}
          </div>
        )}

        {/* Plant Detail Modal */}
        {selectedPlant && (
          <PlantDetailModal
            plant={selectedPlant}
            onClose={() => setSelectedPlant(null)}
            onApprove={handleApprove}
            onReject={handleReject}
            onDelete={handleDelete}
            onSearch={handleSearch}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            actionLoading={actionLoading}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm.open && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm({ open: false, plant: null, type: null })}>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Usuń {deleteConfirm.type === 'photo' ? 'zdjęcie' : 'ilustrację'}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Czy na pewno chcesz usunąć {deleteConfirm.type === 'photo' ? 'zdjęcie' : 'ilustrację'}?</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteConfirm({ open: false, plant: null, type: null })} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Anuluj</button>
                <button onClick={() => { executeDelete(deleteConfirm.plant, deleteConfirm.type); setDeleteConfirm({ open: false, plant: null, type: null }); }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">Usuń</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ label, value, icon, color = 'gray', onClick, active }) => {
  const colorClasses = {
    gray: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border-2 transition-all text-left ${colorClasses[color]} ${active ? 'ring-2 ring-purple-500 ring-offset-2' : 'hover:scale-105'}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </button>
  );
};

// Plant Card Component
const PlantCard = ({ plant, onSelect, translateCategory }) => {
  const hasPhoto = !!plant.photo_path;
  const hasIllustration = !!plant.illustration_path;
  const candidatesCount = plant.image_candidates?.length || 0;
  const photoCount = plant.image_candidates?.filter(c => c.type === 'photo').length || 0;
  const illustrationCount = plant.image_candidates?.filter(c => c.type === 'illustration').length || 0;

  return (
    <button
      onClick={onSelect}
      className="bg-white dark:bg-gray-800 rounded-xl p-4 text-left hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700"
    >
      <div className="flex gap-4">
        {/* Thumbnail Preview */}
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
          {plant.photo_thumb ? (
            <img
              src={getImageUrl(plant.photo_thumb)}
              alt={plant.display_name}
              className="w-full h-full object-cover"
            />
          ) : plant.image_candidates?.[0]?.thumbUrl ? (
            <img
              src={plant.image_candidates[0].thumbUrl}
              alt="Kandydat"
              className="w-full h-full object-cover opacity-50"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl text-gray-400">
              🌱
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {plant.display_name}
          </h3>
          {plant.latin_name && (
            <p className="text-xs text-gray-500 dark:text-gray-400 italic truncate">
              {plant.latin_name}
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {translateCategory(plant.category)}
          </p>

          {/* Status */}
          <div className="flex flex-wrap gap-1 mt-2">
            {hasPhoto && (
              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded text-xs">
                📷 Foto
              </span>
            )}
            {hasIllustration && (
              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded text-xs">
                🎨 Ilustr.
              </span>
            )}
            {candidatesCount > 0 && !hasPhoto && (
              <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded text-xs">
                ⏳ {photoCount}📷 {illustrationCount}🎨
              </span>
            )}
            {candidatesCount === 0 && !hasPhoto && !hasIllustration && (
              <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded text-xs">
                ❓ Brak
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

// Plant Detail Modal
const PlantDetailModal = ({
  plant,
  onClose,
  onApprove,
  onReject,
  onDelete,
  onSearch,
  searchQuery,
  setSearchQuery,
  actionLoading
}) => {
  const [activeTab, setActiveTab] = useState('candidates');

  const photoCandidates = plant.image_candidates?.filter(c => c.type === 'photo') || [];
  const illustrationCandidates = plant.image_candidates?.filter(c => c.type === 'illustration') || [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 pb-24 lg:pb-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {plant.display_name}
              </h2>
              {plant.latin_name && (
                <p className="text-gray-500 dark:text-gray-400 italic">
                  {plant.latin_name}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X size={24} />
            </button>
          </div>

          {/* Search */}
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={plant.latin_name || "Szukaj zdjęć..."}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              onClick={() => onSearch(plant)}
              disabled={actionLoading?.startsWith('search')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading?.startsWith('search') ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <Search size={18} />
              )}
              Szukaj
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('candidates')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'candidates'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Kandydaci ({plant.image_candidates?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'approved'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Zatwierdzone
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'candidates' ? (
            <div className="space-y-6">
              {/* Photo Candidates */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Camera size={20} /> Zdjęcia fotograficzne ({photoCandidates.length})
                </h3>
                {photoCandidates.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    Brak kandydatów - użyj wyszukiwania powyżej
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {photoCandidates.map((candidate, idx) => (
                      <CandidateCard
                        key={idx}
                        candidate={candidate}
                        plant={plant}
                        type="photo"
                        onApprove={onApprove}
                        onReject={onReject}
                        actionLoading={actionLoading}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Illustration Candidates */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Image size={20} /> Ilustracje botaniczne ({illustrationCandidates.length})
                </h3>
                {illustrationCandidates.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    Brak kandydatów - spróbuj wyszukać: "{plant.latin_name} botanical illustration"
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {illustrationCandidates.map((candidate, idx) => (
                      <CandidateCard
                        key={idx}
                        candidate={candidate}
                        plant={plant}
                        type="illustration"
                        onApprove={onApprove}
                        onReject={onReject}
                        actionLoading={actionLoading}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Approved Photo */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Camera size={20} /> Zdjęcie fotograficzne
                </h3>
                {plant.photo_path ? (
                  <ApprovedImageCard
                    plant={plant}
                    type="photo"
                    onDelete={onDelete}
                    actionLoading={actionLoading}
                  />
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    Brak zatwierdzonego zdjęcia
                  </p>
                )}
              </div>

              {/* Approved Illustration */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Image size={20} /> Ilustracja botaniczna
                </h3>
                {plant.illustration_path ? (
                  <ApprovedImageCard
                    plant={plant}
                    type="illustration"
                    onDelete={onDelete}
                    actionLoading={actionLoading}
                  />
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    Brak zatwierdzonej ilustracji
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Candidate Card
const CandidateCard = ({ candidate, plant, type, onApprove, onReject, actionLoading }) => {
  const [showInfo, setShowInfo] = useState(false);
  const isLoading = actionLoading === `approve-${plant.id}-${candidate.url}` ||
                    actionLoading === `reject-${plant.id}-${candidate.url}`;

  return (
    <div className="relative group">
      <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
        <img
          src={candidate.thumbUrl || candidate.url}
          alt={candidate.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col justify-between p-2">
        {/* Top buttons */}
        <div className="flex justify-between">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-1.5 bg-white/20 rounded-lg hover:bg-white/40"
            title="Info"
          >
            <Info size={16} className="text-white" />
          </button>
          <a
            href={candidate.sourceUrl || candidate.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 bg-white/20 rounded-lg hover:bg-white/40"
            title="Otwórz źródło"
          >
            <ExternalLink size={16} className="text-white" />
          </a>
        </div>

        {/* Bottom buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onApprove(plant, candidate, type)}
            disabled={isLoading}
            className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1"
          >
            {isLoading ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
            <span className="text-sm">Zatwierdź</span>
          </button>
          <button
            onClick={() => onReject(plant, candidate.url)}
            disabled={isLoading}
            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Info tooltip */}
      {showInfo && (
        <div className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
          <p className="font-semibold truncate">{candidate.title}</p>
          <p className="text-gray-300 mt-1">📷 {candidate.author}</p>
          <p className="text-gray-300">📜 {candidate.license}</p>
          <p className="text-gray-300">🌐 {candidate.source}</p>
        </div>
      )}
    </div>
  );
};

// Approved Image Card
const ApprovedImageCard = ({ plant, type, onDelete, actionLoading }) => {
  const path = type === 'photo' ? plant.photo_path : plant.illustration_path;
  const thumb = type === 'photo' ? plant.photo_thumb : plant.illustration_thumb;
  const author = type === 'photo' ? plant.photo_author : plant.illustration_author;
  const source = type === 'photo' ? plant.photo_source : plant.illustration_source;
  const license = type === 'photo' ? plant.photo_license : plant.illustration_license;

  const isLoading = actionLoading === `delete-${plant.id}-${type}`;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
      <div className="flex gap-4">
        <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={getImageUrl(thumb || path)}
            alt={plant.display_name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p><span className="font-medium">Autor:</span> {author}</p>
            <p><span className="font-medium">Źródło:</span> {source}</p>
            <p><span className="font-medium">Licencja:</span> {license}</p>
          </div>
          <button
            onClick={() => onDelete(plant, type)}
            disabled={isLoading}
            className="mt-3 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 text-sm flex items-center gap-1 disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            Usuń
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminImages;
