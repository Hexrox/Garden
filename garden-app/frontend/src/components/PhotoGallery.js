import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import PhotoTimeline from '../features/photo-timeline/PhotoTimeline';
import { Upload, Camera } from 'lucide-react';

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

  // Format photos for PhotoTimeline component
  const formattedPhotos = photos.map(photo => ({
    ...photo,
    url: `/${photo.photo_path}`,
    description: photo.caption
  }));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
            <Camera className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Galeria ({photos.length})
          </h3>
        </div>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          <Upload size={16} />
          <span>{showUploadForm ? 'Anuluj' : 'Dodaj zdjęcie'}</span>
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

      {/* Photo Timeline Display */}
      <PhotoTimeline
        photos={formattedPhotos}
        onPhotoDelete={handleDelete}
      />
    </div>
  );
};

export default PhotoGallery;
