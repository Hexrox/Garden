import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Image as ImageIcon, Filter, Upload, X, CheckSquare, Trash2 } from 'lucide-react';
import axios from '../config/axios';
import GalleryGrid from '../components/gallery/GalleryGrid';
import GalleryFilters from '../components/gallery/GalleryFilters';
import PhotoLightbox from '../components/gallery/PhotoLightbox';
import QuickPhotoModal from '../components/modals/QuickPhotoModal';

const Gallery = () => {
  const [photos, setPhotos] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showQuickPhoto, setShowQuickPhoto] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: null, photoId: null });
  const [toastMessage, setToastMessage] = useState(null);
  const [filters, setFilters] = useState({
    plant: '',
    plot: '',
    year: '',
    source_type: '',
    tag: '',
    show_deleted: false,
  });

  const PHOTOS_PER_PAGE = 20;
  const abortControllerRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const pageRef = useRef(0);
  const hasMoreRef = useRef(true);
  const filtersRef = useRef(filters);

  // Keep refs in sync with state
  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const loadGallery = useCallback(async (pageNum = null, reset = false, signal = null) => {
    const currentPage = pageNum !== null ? pageNum : pageRef.current;
    const currentFilters = filtersRef.current;

    if (!hasMoreRef.current && !reset) return;
    if (rateLimited) return;

    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams();
      params.append('limit', PHOTOS_PER_PAGE);
      params.append('offset', currentPage * PHOTOS_PER_PAGE);

      if (currentFilters.plant) params.append('plant', currentFilters.plant);
      if (currentFilters.plot) params.append('plot', currentFilters.plot);
      if (currentFilters.year) params.append('year', currentFilters.year);
      if (currentFilters.source_type) params.append('source_type', currentFilters.source_type);
      if (currentFilters.tag) params.append('tag', currentFilters.tag);
      if (currentFilters.show_deleted) params.append('show_deleted', 'true');

      const response = await axios.get(`/api/gallery?${params.toString()}`, { signal });
      const newPhotos = response.data;

      if (reset) {
        setPhotos(newPhotos);
      } else {
        setPhotos(prev => [...prev, ...newPhotos]);
      }

      // If we got less than PHOTOS_PER_PAGE, there's no more
      const hasMoreData = newPhotos.length === PHOTOS_PER_PAGE;
      setHasMore(hasMoreData);
      hasMoreRef.current = hasMoreData;
      setPage(currentPage + 1);
      pageRef.current = currentPage + 1;
    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') {
        return; // Request was cancelled, ignore
      }
      if (error.response?.status === 429) {
        console.warn('Rate limited, waiting before retry...');
        setRateLimited(true);
        setTimeout(() => setRateLimited(false), 10000); // Wait 10s before allowing new requests
        return;
      }
      console.error('Error loading gallery:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [rateLimited]);

  const loadStats = useCallback(async (signal = null) => {
    if (rateLimited) return;

    try {
      const response = await axios.get('/api/gallery/stats', { signal });
      setStats(response.data);
    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') {
        return; // Request was cancelled, ignore
      }
      if (error.response?.status === 429) {
        console.warn('Stats rate limited');
        setRateLimited(true);
        setTimeout(() => setRateLimited(false), 10000);
        return;
      }
      console.error('Error loading stats:', error);
    }
  }, [rateLimited]);

  // Initial load and filter changes
  useEffect(() => {
    // Cancel previous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Reset state
    setPage(0);
    pageRef.current = 0;
    setPhotos([]);
    setHasMore(true);
    hasMoreRef.current = true;

    loadGallery(0, true, signal);
    loadStats(signal);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [filters, loadGallery, loadStats]);

  // Listen for new photos added via QuickPhoto modal
  useEffect(() => {
    const handlePhotoAdded = () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setPage(0);
      pageRef.current = 0;
      setPhotos([]);
      setHasMore(true);
      hasMoreRef.current = true;
      loadGallery(0, true, signal);
      loadStats(signal);
    };

    window.addEventListener('photoAdded', handlePhotoAdded);
    return () => window.removeEventListener('photoAdded', handlePhotoAdded);
  }, [loadGallery, loadStats]);

  // Infinite scroll detection with debounce
  useEffect(() => {
    const handleScroll = () => {
      // Debounce scroll events
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        // Check if user scrolled near bottom (within 200px)
        const scrolledToBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 200;

        if (scrolledToBottom && hasMoreRef.current && !loading && !loadingMore && !rateLimited) {
          loadGallery();
        }
      }, 150); // 150ms debounce
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [loading, loadingMore, rateLimited, loadGallery]);

  const handlePhotoClick = (photo) => {
    setSelectedPhoto(photo);
  };

  // Simple toast helper for Gallery (uses local state)
  const showGalleryToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeletePhoto = async (photoId) => {
    try {
      await axios.delete(`/api/gallery/${photoId}`);
      setPhotos(photos.filter(p => p.id !== photoId));
      setSelectedPhoto(null);
      loadStats();
      showGalleryToast('Zdjęcie usunięte');
    } catch (error) {
      showGalleryToast('Błąd podczas usuwania zdjęcia');
      console.error(error);
    } finally {
      setDeleteConfirm({ open: false, type: null, photoId: null });
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
      showGalleryToast('Błąd podczas aktualizacji opisu');
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

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedPhotos([]);
  };

  const togglePhotoSelection = (photoId) => {
    setSelectedPhotos(prev =>
      prev.includes(photoId)
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };

  const selectAllPhotos = () => {
    setSelectedPhotos(photos.map(p => p.id));
  };

  const deselectAllPhotos = () => {
    setSelectedPhotos([]);
  };

  const handleBulkDelete = async () => {
    if (selectedPhotos.length === 0) return;
    setDeleteConfirm({ open: true, type: 'bulk', photoId: null });
  };

  const executeBulkDelete = async () => {
    setDeleteConfirm({ open: false, type: null, photoId: null });
    try {
      await axios.delete('/api/gallery/bulk', {
        data: { photoIds: selectedPhotos }
      });

      setPhotos(photos.filter(p => !selectedPhotos.includes(p.id)));
      setSelectedPhotos([]);
      setSelectionMode(false);
      loadStats();
      showGalleryToast('Zdjęcia usunięte');
    } catch (error) {
      showGalleryToast('Błąd podczas usuwania zdjęć');
      console.error(error);
    }
  };

  // Drag & Drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target === e.currentTarget) {
      setDragActive(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );

    if (files.length === 0) {
      showGalleryToast('Przeciągnij tylko pliki zdjęć (JPG, PNG, etc.)');
      return;
    }

    await uploadMultiplePhotos(files);
  };

  const uploadMultiplePhotos = async (files) => {
    setUploading(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const file of files) {
        try {
          const formData = new FormData();
          formData.append('photo', file);
          formData.append('tag', 'ogólne');
          formData.append('caption', file.name.replace(/\.[^/.]+$/, ''));

          await axios.post('/api/gallery/quick', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          successCount++;
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        // Refresh gallery
        setPage(0);
        pageRef.current = 0;
        setPhotos([]);
        setHasMore(true);
        hasMoreRef.current = true;
        loadGallery(0, true);
        loadStats();
      }

      if (errorCount > 0) {
        showGalleryToast(`Wysłano ${successCount} zdjęć, ${errorCount} nie udało się przesłać`);
      }
    } catch (error) {
      showGalleryToast('Błąd podczas wysyłania zdjęć');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  if (loading && !photos.length) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Ładowanie galerii...
      </div>
    );
  }

  return (
    <div
      className="space-y-6 relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Overlay */}
      {dragActive && (
        <div className="fixed inset-0 z-50 bg-blue-600/90 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-12 text-center max-w-md">
            <Upload size={64} className="mx-auto mb-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Upuść zdjęcia tutaj
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Wszystkie zdjęcia zostaną dodane do galerii
            </p>
          </div>
        </div>
      )}

      {/* Uploading Overlay */}
      {uploading && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
            <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              Wysyłanie zdjęć...
            </p>
          </div>
        </div>
      )}

      {/* Rate Limit Warning */}
      {rateLimited && (
        <div className="fixed bottom-4 right-4 z-50 bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-400 dark:border-yellow-600 rounded-lg p-4 shadow-lg max-w-sm">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⏳ Zbyt wiele zapytań. Czekam przed ponownym załadowaniem...
          </p>
        </div>
      )}
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
          {!selectionMode && (
            <>
              <button
                onClick={() => setShowQuickPhoto(true)}
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

              <button
                onClick={toggleSelectionMode}
                className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <CheckSquare size={18} />
                Zaznacz
              </button>
            </>
          )}

          {selectionMode && (
            <>
              <button
                onClick={toggleSelectionMode}
                className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white transition-colors"
              >
                <X size={18} />
                Anuluj
              </button>
            </>
          )}
        </div>
      </div>

      {/* Selection Toolbar */}
      {selectionMode && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Zaznaczono: <span className="font-bold">{selectedPhotos.length}</span> zdjęć
              </span>

              <div className="flex gap-2">
                <button
                  onClick={selectAllPhotos}
                  className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Zaznacz wszystkie
                </button>
                {selectedPhotos.length > 0 && (
                  <button
                    onClick={deselectAllPhotos}
                    className="px-3 py-1.5 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Odznacz wszystkie
                  </button>
                )}
              </div>
            </div>

            {selectedPhotos.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  <Trash2 size={18} />
                  Usuń zaznaczone ({selectedPhotos.length})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
        <>
          <GalleryGrid
            photos={photos}
            onPhotoClick={handlePhotoClick}
            selectedPhotos={selectedPhotos}
            onSelectPhoto={togglePhotoSelection}
            selectionMode={selectionMode}
          />

          {/* Loading more indicator */}
          {loadingMore && (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Ładowanie kolejnych zdjęć...</p>
            </div>
          )}

          {/* Load more button (backup for infinite scroll) */}
          {!loadingMore && hasMore && (
            <div className="text-center py-8">
              <button
                onClick={() => loadGallery()}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                Załaduj więcej zdjęć
              </button>
            </div>
          )}

          {/* End of gallery message */}
          {!hasMore && photos.length > 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>🎉 To wszystko! Wyświetlono wszystkie zdjęcia.</p>
            </div>
          )}
        </>
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
          onDelete={(id) => setDeleteConfirm({ open: true, type: 'single', photoId: id })}
          onUpdateCaption={handleUpdateCaption}
          onPhotoUpdated={() => {
            loadGallery();
            loadStats();
          }}
        />
      )}

      {/* Quick Photo Modal */}
      <QuickPhotoModal
        isOpen={showQuickPhoto}
        onClose={() => setShowQuickPhoto(false)}
        onSuccess={() => {
          setShowQuickPhoto(false);
          loadGallery();
          loadStats();
        }}
      />
      {/* Delete Confirmation Modal */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm({ open: false, type: null, photoId: null })}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {deleteConfirm.type === 'bulk' ? 'Usuń zaznaczone zdjęcia' : 'Usuń zdjęcie'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {deleteConfirm.type === 'bulk'
                ? `Czy na pewno chcesz usunąć ${selectedPhotos.length} zaznaczonych zdjęć?`
                : 'Czy na pewno chcesz usunąć to zdjęcie?'}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm({ open: false, type: null, photoId: null })}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === 'bulk') {
                    executeBulkDelete();
                  } else {
                    handleDeletePhoto(deleteConfirm.photoId);
                  }
                  setDeleteConfirm({ open: false, type: null, photoId: null });
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Usuń
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg shadow-lg text-sm font-medium animate-fade-in">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default Gallery;
