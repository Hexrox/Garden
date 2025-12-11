import React from 'react';
import { Trash2, AlertCircle } from 'lucide-react';

const GalleryGrid = ({ photos, onPhotoClick, onDeletePhoto }) => {
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

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {photos.map((photo) => {
        const imgUrl = `${process.env.REACT_APP_API_URL || ''}/${photo.photo_path}`;
        return (
        <div
          key={photo.id}
          className="group relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow hover:shadow-lg transition-all duration-200 cursor-pointer"
          onClick={() => onPhotoClick(photo)}
        >
          {/* Image */}
          <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
            <img
              src={imgUrl}
              alt={photo.caption || photo.bed_plant_name || 'Zdjęcie'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />

            {/* Status badge */}
            {photo.status === 'deleted' && (
              <div className="absolute top-2 right-2">
                <span className="px-2 py-1 bg-gray-900/80 text-white text-xs rounded-full flex items-center gap-1">
                  <AlertCircle size={12} />
                  Usunięta
                </span>
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePhoto(photo.id);
                }}
                className="p-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
                title="Usuń zdjęcie"
              >
                <Trash2 size={18} />
              </button>
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
