import React, { useState } from 'react';
import { Camera, Calendar, X, Upload, Image as ImageIcon } from 'lucide-react';

/**
 * PhotoTimeline Component
 *
 * Simple, beautiful photo grid for tracking plant growth over time
 * Hobby-friendly approach: clarity over complexity
 */
const PhotoTimeline = ({ photos = [], onPhotoAdd, onPhotoDelete }) => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
            <Camera className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Oś czasu zdjęć ({photos.length})
          </h3>
        </div>

        {onPhotoAdd && (
          <button
            onClick={onPhotoAdd}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            <Upload size={16} />
            <span>Dodaj zdjęcie</span>
          </button>
        )}
      </div>

      {/* Photo Grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => setSelectedPhoto(photo)}
            >
              {/* Photo */}
              <div className="aspect-square bg-gray-100 dark:bg-gray-900">
                <img
                  src={photo.url || photo.photo_url}
                  alt={photo.description || 'Plant photo'}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Overlay with info */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  {photo.taken_date && (
                    <div className="flex items-center gap-1 text-xs mb-1">
                      <Calendar size={12} />
                      <span>{formatDate(photo.taken_date)}</span>
                    </div>
                  )}
                  {photo.description && (
                    <p className="text-xs line-clamp-2">{photo.description}</p>
                  )}
                </div>
              </div>

              {/* Delete button */}
              {onPhotoDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Czy na pewno chcesz usunąć to zdjęcie?')) {
                      onPhotoDelete(photo.id);
                    }
                  }}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 px-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-600" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-2">Brak zdjęć</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Dodaj pierwsze zdjęcie, aby śledzić wzrost rośliny
          </p>
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl w-full">
            {/* Close button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-12 right-0 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <X size={24} />
            </button>

            {/* Photo */}
            <img
              src={selectedPhoto.url || selectedPhoto.photo_url}
              alt={selectedPhoto.description || 'Plant photo'}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />

            {/* Info */}
            {(selectedPhoto.taken_date || selectedPhoto.description) && (
              <div className="mt-4 bg-white/10 backdrop-blur-md rounded-lg p-4 text-white">
                {selectedPhoto.taken_date && (
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <Calendar size={16} />
                    <span>{formatDate(selectedPhoto.taken_date)}</span>
                  </div>
                )}
                {selectedPhoto.description && (
                  <p className="text-sm">{selectedPhoto.description}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoTimeline;
