import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2, Edit2, Download, Edit } from 'lucide-react';
import EditPhotoModal from '../modals/EditPhotoModal';

const PhotoLightbox = ({ photo, photos, onClose, onNavigate, onDelete, onUpdateCaption, onPhotoUpdated }) => {
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [caption, setCaption] = useState(photo.caption || '');
  const [showEditModal, setShowEditModal] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Update caption when photo changes
  useEffect(() => {
    setCaption(photo.caption || '');
    setIsEditingCaption(false);
  }, [photo.id, photo.caption]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNavigate('prev');
      if (e.key === 'ArrowRight') onNavigate('next');
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onClose, onNavigate]);

  // Swipe handlers
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && photos.length > 1) {
      onNavigate('next');
    }
    if (isRightSwipe && photos.length > 1) {
      onNavigate('prev');
    }
  };

  const handleSaveCaption = () => {
    onUpdateCaption(photo.id, caption);
    setIsEditingCaption(false);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    // Always download original for full quality
    link.href = `${process.env.REACT_APP_API_URL || ''}/${photo.photo_path}`;
    link.download = `garden-${photo.id}.jpg`;
    link.click();
  };

  const formatFullDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Close button - larger on mobile */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 p-3 sm:p-2 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-full sm:rounded-lg text-white transition-colors z-10 shadow-lg border-2 border-white/20"
      >
        <X size={28} className="sm:w-6 sm:h-6" />
      </button>

      {/* Navigation arrows - desktop only, positioned on image sides */}
      {photos.length > 1 && (
        <>
          <button
            onClick={() => onNavigate('prev')}
            className="hidden lg:flex fixed left-4 top-1/2 -translate-y-1/2 items-center justify-center w-12 h-12 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full text-white transition-all hover:scale-110"
            title="Poprzednie zdjęcie (←)"
          >
            <ChevronLeft size={32} />
          </button>
          <button
            onClick={() => onNavigate('next')}
            className="hidden lg:flex fixed right-4 top-1/2 -translate-y-1/2 items-center justify-center w-12 h-12 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full text-white transition-all hover:scale-110"
            title="Następne zdjęcie (→)"
          >
            <ChevronRight size={32} />
          </button>
        </>
      )}

      {/* Content */}
      <div className="max-w-7xl w-full my-auto flex flex-col lg:flex-row gap-4 lg:max-h-[90vh]">
        {/* Image with swipe support */}
        <div
          className="flex-shrink-0 flex items-center justify-center lg:flex-1 relative"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <img
            src={`${process.env.REACT_APP_API_URL || ''}/${photo.medium_path || photo.photo_path}`}
            alt={photo.caption || photo.bed_plant_name || 'Zdjęcie'}
            className="max-w-full max-h-[50vh] lg:max-h-[80vh] object-contain rounded-lg"
          />

          {/* Photo counter */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/60 backdrop-blur-sm text-white text-sm rounded-full">
              {photos.findIndex(p => p.id === photo.id) + 1} / {photos.length}
            </div>
          )}

          {/* Swipe hint - pokazuje się przez chwilę */}
          {photos.length > 1 && (
            <div className="lg:hidden absolute inset-x-0 bottom-16 flex justify-center gap-2 text-white/60 text-xs animate-pulse">
              <span>← przesuń →</span>
            </div>
          )}
        </div>

        {/* Details - scrollable on all devices */}
        <div className="w-full lg:w-96 bg-white dark:bg-gray-800 rounded-lg p-6 overflow-y-auto max-h-[60vh] lg:max-h-full flex-shrink-0">
          {/* Mobile navigation buttons */}
          {photos.length > 1 && (
            <div className="lg:hidden flex gap-2 mb-4">
              <button
                onClick={() => onNavigate('prev')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ChevronLeft size={20} />
                Poprzednie
              </button>
              <button
                onClick={() => onNavigate('next')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Następne
                <ChevronRight size={20} />
              </button>
            </div>
          )}

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {photo.bed_plant_name || 'Zdjęcie z galerii'}
            {photo.bed_plant_variety && (
              <span className="text-sm text-gray-600 dark:text-gray-400 block mt-1">
                {photo.bed_plant_variety}
              </span>
            )}
          </h2>

          {/* Meta info */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 dark:text-gray-400">📅</span>
              <span className="text-gray-700 dark:text-gray-300">
                {formatFullDate(photo.created_at)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 dark:text-gray-400">📍</span>
              <span className="text-gray-700 dark:text-gray-300">
                {photo.plot_name}, Grządka #{photo.bed_row_number}
              </span>
            </div>

            {photo.status === 'deleted' && (
              <div className="flex items-center gap-2 text-sm">
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                  ⚠️ Grządka usunięta
                </span>
              </div>
            )}
          </div>

          {/* Caption */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                💬 Opis
              </label>
              {!isEditingCaption && (
                <button
                  onClick={() => setIsEditingCaption(true)}
                  className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                >
                  <Edit2 size={14} />
                  Edytuj
                </button>
              )}
            </div>

            {isEditingCaption ? (
              <div className="space-y-2">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  rows="3"
                  placeholder="Dodaj opis..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveCaption}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
                  >
                    Zapisz
                  </button>
                  <button
                    onClick={() => {
                      setCaption(photo.caption || '');
                      setIsEditingCaption(false);
                    }}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm"
                  >
                    Anuluj
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-sm italic">
                {photo.caption || 'Brak opisu'}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Edit size={18} />
              Edytuj zdjęcie
            </button>

            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Download size={18} />
              Pobierz
            </button>

            <button
              onClick={() => {
                if (window.confirm('Czy na pewno chcesz usunąć to zdjęcie?')) {
                  onDelete(photo.id);
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <Trash2 size={18} />
              Usuń zdjęcie
            </button>

            {/* Mobile close button at bottom */}
            <button
              onClick={onClose}
              className="lg:hidden w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              <X size={20} />
              Zamknij
            </button>
          </div>
        </div>
      </div>

      {/* Edit Photo Modal */}
      <EditPhotoModal
        photo={photo}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => {
          setShowEditModal(false);
          if (onPhotoUpdated) {
            onPhotoUpdated();
          }
        }}
      />
    </div>
  );
};

export default PhotoLightbox;
