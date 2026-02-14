import React from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { getImageUrl } from '../../config/axios';

const GalleryGrid = ({ photos, onPhotoClick, selectedPhotos = [], onSelectPhoto, selectionMode = false }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Dzisiaj';
    if (diffDays === 1) return 'Wczoraj';
    if (diffDays < 7) return `${diffDays}d temu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}t temu`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}m temu`;
    return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const isSelected = (photoId) => selectedPhotos.includes(photoId);

  const handlePhotoInteraction = (e, photo) => {
    if (selectionMode) {
      e.stopPropagation();
      onSelectPhoto(photo.id);
    } else {
      onPhotoClick(photo);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {photos.map((photo) => {
        // Use thumbnail for grid, fallback to original if not available
        const thumbUrl = getImageUrl(photo.thumb_path || photo.photo_path);
        const selected = isSelected(photo.id);
        return (
        <div
          key={photo.id}
          className={`group relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow hover:shadow-lg transition-all duration-200 cursor-pointer ${
            selected ? 'ring-4 ring-blue-500 dark:ring-blue-400' : ''
          }`}
          onClick={(e) => handlePhotoInteraction(e, photo)}
        >
          {/* Image */}
          <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
            <img
              src={thumbUrl}
              alt={photo.caption || photo.bed_plant_name || 'Zdjęcie'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />

            {/* Selection checkbox */}
            {selectionMode && (
              <div className="absolute top-2 left-2 z-10">
                <div
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                    selected
                      ? 'bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500'
                      : 'bg-white/90 border-gray-300 dark:bg-gray-700/90 dark:border-gray-500'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPhoto(photo.id);
                  }}
                >
                  {selected && <Check size={16} className="text-white" />}
                </div>
              </div>
            )}

            {/* Status badge */}
            {photo.status === 'deleted' && (
              <div className="absolute top-2 right-2">
                <span className="px-2 py-1 bg-gray-900/80 text-white text-xs rounded-full flex items-center gap-1">
                  <AlertCircle size={12} />
                  Usunięta
                </span>
              </div>
            )}

            {/* Hover overlay - just indicates clickable */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="text-white text-sm font-medium">
                🔍 Kliknij aby powiększyć
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="p-3">
            {/* Plant name */}
            {photo.bed_plant_name && (
              <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                🌱 {photo.bed_plant_name}
              </p>
            )}

            {/* Location */}
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {photo.status === 'deleted' ? (
                <span className="italic">
                  {photo.plot_name} #{photo.bed_row_number}
                </span>
              ) : (
                <>
                  📍 {photo.plot_name} #{photo.bed_row_number}
                </>
              )}
            </p>

            {/* Date */}
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {formatDate(photo.created_at)}
            </p>
          </div>
        </div>
        );
      })}
    </div>
  );
};

export default GalleryGrid;
