import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Filter, Upload, X } from 'lucide-react';
import axios from '../config/axios';
import GalleryGrid from '../components/gallery/GalleryGrid';
import GalleryFilters from '../components/gallery/GalleryFilters';
import PhotoLightbox from '../components/gallery/PhotoLightbox';

const Gallery = () => {
  const [photos, setPhotos] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    plant: '',
    plot: '',
    year: '',
    source_type: '',
    tag: '',
    show_deleted: false,
  });

  useEffect(() => {
    loadGallery();
    loadStats();
  }, [filters]);

  // Listen for new photos added via QuickPhoto modal
  useEffect(() => {
    const handlePhotoAdded = () => {
      loadGallery();
      loadStats();
    };

    window.addEventListener('photoAdded', handlePhotoAdded);
    return () => window.removeEventListener('photoAdded', handlePhotoAdded);
  }, []);

  const loadGallery = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.plant) params.append('plant', filters.plant);
      if (filters.plot) params.append('plot', filters.plot);
      if (filters.year) params.append('year', filters.year);
      if (filters.source_type) params.append('source_type', filters.source_type);
      if (filters.tag) params.append('tag', filters.tag);
      if (filters.show_deleted) params.append('show_deleted', 'true');

      const response = await axios.get(`/api/gallery?${params.toString()}`);
      setPhotos(response.data);
    } catch (error) {
      console.error('Error loading gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await axios.get('/api/gallery/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handlePhotoClick = (photo) => {
    setSelectedPhoto(photo);
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć to zdjęcie?')) return;

    try {
      await axios.delete(`/api/gallery/${photoId}`);
      setPhotos(photos.filter(p => p.id !== photoId));
      setSelectedPhoto(null);
      loadStats(); // Refresh stats
    } catch (error) {
      alert('Błąd podczas usuwania zdjęcia');
      console.error(error);
    }
  };

  const handleUpdateCaption = async (photoId, caption) => {
    try {
      await axios.put(`/api/gallery/${photoId}`, { caption });
      setPhotos(photos.map(p => p.id === photoId ? { ...p, caption } : p));
      if (selectedPhoto?.id === photoId) {
        setSelectedPhoto({ ...selectedPhoto, caption });
      }
    } catch (error) {
      alert('Błąd podczas aktualizacji opisu');
      console.error(error);
    }
  };

  // Check if any filters are active
  const hasActiveFilters = filters.plant || filters.plot || filters.year || filters.source_type || filters.show_deleted;

  // Clear single filter
  const clearFilter = (filterKey) => {
    setFilters({ ...filters, [filterKey]: filterKey === 'show_deleted' ? false : '' });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({ plant: '', plot: '', year: '', source_type: '', tag: '', show_deleted: false });
  };

  if (loading && !photos.length) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Ładowanie galerii...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <ImageIcon className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            </div>
            Galeria
          </h1>
          {stats && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              📸 {stats.total} {stats.total === 1 ? 'zdjęcie' : 'zdjęć'}
              {stats.deletedCount > 0 && (
                <span className="ml-2 text-gray-500">
                  • {stats.deletedCount} z usuniętych grządek
                </span>
              )}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              // TODO: Open upload modal
              alert('Funkcja dodawania zdjęć w przygotowaniu');
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white transition-colors"
          >
            <Upload size={18} />
            Dodaj zdjęcie
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
              showFilters
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Filter size={18} />
            Filtry
            {Object.values(filters).some(v => v) && (
              <span className="ml-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-xs">
                ✓
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <GalleryFilters
          filters={filters}
          setFilters={setFilters}
          stats={stats}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Active Filters - pokazuje się gdy są aktywne filtry */}
      {hasActiveFilters && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Aktywne filtry:
            </span>

            {filters.plant && (
              <button
                onClick={() => clearFilter('plant')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
              >
                <span>🌱 {filters.plant}</span>
                <X size={14} />
              </button>
            )}

            {filters.plot && (
              <button
                onClick={() => clearFilter('plot')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
              >
                <span>📍 {filters.plot}</span>
                <X size={14} />
              </button>
            )}

            {filters.year && (
              <button
                onClick={() => clearFilter('year')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg text-sm hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
              >
                <span>📅 {filters.year}</span>
                <X size={14} />
              </button>
            )}

            {filters.source_type && (
              <button
                onClick={() => clearFilter('source_type')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
              >
                <span>📂 {filters.source_type === 'bed' ? 'Grządki' : filters.source_type === 'plot' ? 'Poletka' : 'Usunięte'}</span>
                <X size={14} />
              </button>
            )}

            {filters.show_deleted && (
              <button
                onClick={() => clearFilter('show_deleted')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <span>🗑️ Usunięte grządki</span>
                <X size={14} />
              </button>
            )}

            <div className="ml-auto">
              <button
                onClick={clearAllFilters}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Wyczyść wszystkie
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && stats.byPlant && stats.byPlant.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📊 Top rośliny
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats.byPlant.slice(0, 5).map((item) => (
              <button
                key={item.plant}
                onClick={() => setFilters({ ...filters, plant: item.plant })}
                className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-sm hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                🌱 {item.plant} ({item.count})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Gallery Grid */}
      {photos.length > 0 ? (
        <GalleryGrid
          photos={photos}
          onPhotoClick={handlePhotoClick}
          onDeletePhoto={handleDeletePhoto}
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Brak zdjęć
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {Object.values(filters).some(v => v)
              ? 'Nie znaleziono zdjęć pasujących do filtrów'
              : 'Dodaj pierwsze zdjęcie do galerii'}
          </p>
          {Object.values(filters).some(v => v) && (
            <button
              onClick={() => setFilters({ plant: '', plot: '', year: '', source_type: '', show_deleted: false })}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Wyczyść filtry
            </button>
          )}
        </div>
      )}

      {/* Lightbox */}
      {selectedPhoto && (
        <PhotoLightbox
          photo={selectedPhoto}
          photos={photos}
          onClose={() => setSelectedPhoto(null)}
          onNavigate={(direction) => {
            const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id);
            const newIndex = direction === 'next'
              ? (currentIndex + 1) % photos.length
              : (currentIndex - 1 + photos.length) % photos.length;
            setSelectedPhoto(photos[newIndex]);
          }}
          onDelete={handleDeletePhoto}
          onUpdateCaption={handleUpdateCaption}
        />
      )}
    </div>
  );
};

export default Gallery;
