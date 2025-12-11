import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2, Edit2, Download, Edit } from 'lucide-react';
import EditPhotoModal from '../modals/EditPhotoModal';

const PhotoLightbox = ({ photo, photos, onClose, onNavigate, onDelete, onUpdateCaption, onPhotoUpdated }) => {
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [caption, setCaption] = useState(photo.caption || '');
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNavigate('prev');
      if (e.key === 'ArrowRight') onNavigate('next');
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onClose, onNavigate]);

  const handleSaveCaption = () => {
    onUpdateCaption(photo.id, caption);
    setIsEditingCaption(false);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
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
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors z-10"
      >
        <X size={24} />
      </button>

      {/* Navigation */}
      {photos.length > 1 && (
        <>
          <button
            onClick={() => onNavigate('prev')}
            className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <ChevronLeft size={32} />
          </button>
          <button
            onClick={() => onNavigate('next')}
            className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <ChevronRight size={32} />
          </button>
        </>
      )}

      {/* Content */}
      <div className="max-w-7xl w-full max-h-[90vh] flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* Image */}
        <div className="flex-1 flex items-center justify-center">
          <img
            src={`${process.env.REACT_APP_API_URL || ''}/${photo.photo_path}`}
            alt={photo.caption || photo.bed_plant_name || 'Zdjęcie'}
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
          />
        </div>

        {/* Details */}
        <div className="lg:w-96 bg-white dark:bg-gray-800 rounded-lg p-6 overflow-y-auto">
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
