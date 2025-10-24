import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PhotoGallery = ({ bedId }) => {
  const [photos, setPhotos] = useState([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    caption: '',
    taken_date: new Date().toISOString().split('T')[0]
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bedId) {
      fetchPhotos();
    }
  }, [bedId]);

  const fetchPhotos = async () => {
    try {
      const response = await axios.get(`/api/beds/${bedId}/photos`);
      setPhotos(response.data);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Wybierz zdjęcie' });
      return;
    }

    const formData = new FormData();
    formData.append('photo', selectedFile);
    formData.append('caption', uploadForm.caption);
    formData.append('taken_date', uploadForm.taken_date);

    try {
      await axios.post(`/api/beds/${bedId}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage({ type: 'success', text: 'Zdjęcie dodane!' });
      setShowUploadForm(false);
      setSelectedFile(null);
      setUploadForm({ caption: '', taken_date: new Date().toISOString().split('T')[0] });
      fetchPhotos();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Błąd uploadu' });
    }
  };

  const handleDelete = async (photoId) => {
    if (!window.confirm('Usunąć to zdjęcie?')) return;
    try {
      await axios.delete(`/api/photos/${photoId}`);
      setMessage({ type: 'success', text: 'Zdjęcie usunięte' });
      fetchPhotos();
    } catch (error) {
      setMessage({ type: 'error', text: 'Błąd usuwania' });
    }
  };

  if (loading) {
    return <div className="text-center py-4 text-gray-500 dark:text-gray-400">Ładowanie galerii...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          📸 Galeria ({photos.length})
        </h3>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          {showUploadForm ? 'Anuluj' : '+ Dodaj zdjęcie'}
        </button>
      </div>

      {message.text && (
        <div className={`p-3 rounded text-sm ${
          message.type === 'success'
            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {showUploadForm && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 transition-colors">
          <form onSubmit={handleUpload} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zdjęcie</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-sm text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-green-600 file:text-white hover:file:bg-green-700 file:transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Opis (opcjonalnie)</label>
              <input
                type="text"
                value={uploadForm.caption}
                onChange={(e) => setUploadForm({ ...uploadForm, caption: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                placeholder="Np. Po 30 dniach wzrostu"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data zdjęcia</label>
              <input
                type="date"
                value={uploadForm.taken_date}
                onChange={(e) => setUploadForm({ ...uploadForm, taken_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Dodaj zdjęcie
            </button>
          </form>
        </div>
      )}

      {photos.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-4xl mb-2">📷</p>
          <p className="text-sm">Brak zdjęć. Dodaj pierwsze!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <div className="aspect-square overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
                <img
                  src={`/${photo.photo_path}`}
                  alt={photo.caption || 'Plant photo'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-2">
                {photo.caption && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">{photo.caption}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(photo.taken_date).toLocaleDateString('pl-PL')}
                </p>
              </div>
              <button
                onClick={() => handleDelete(photo.id)}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                title="Usuń zdjęcie"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;
