import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios, { getImageUrl } from '../config/axios';

const PlotForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [deleteImage, setDeleteImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingPlot, setLoadingPlot] = useState(isEditMode);
  const [isDirty, setIsDirty] = useState(false);

  // Ostrzeżenie przed utratą niezapisanych zmian
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const loadPlot = useCallback(async () => {
    try {
      const response = await axios.get(`/api/plots/${id}`);
      setFormData({
        name: response.data.name,
        description: response.data.description || ''
      });
      if (response.data.image_path) {
        setImagePreview(getImageUrl(response.data.image_path));
      }
    } catch (error) {
      setError('Nie udało się załadować danych poletka');
      console.error('Error loading plot:', error);
    } finally {
      setLoadingPlot(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditMode) {
      loadPlot();
    }
  }, [isEditMode, loadPlot]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setIsDirty(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Plik jest za duży. Maksymalny rozmiar to 5MB.');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Można przesłać tylko pliki graficzne.');
        return;
      }

      setImage(file);
      setDeleteImage(false);
      setError('');
      setIsDirty(true);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.name.trim()) {
      setError('Nazwa poletka jest wymagana');
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('description', formData.description.trim());
      if (image) {
        data.append('image', image);
      }
      if (deleteImage) {
        data.append('deleteImage', 'true');
      }

      if (isEditMode) {
        await axios.put(`/api/plots/${id}`, data, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        await axios.post('/api/plots', data, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      setIsDirty(false);
      navigate('/plots');
    } catch (error) {
      console.error('Error saving plot:', error);
      setError(
        error.response?.data?.error ||
        error.response?.data?.errors?.[0]?.msg ||
        'Wystąpił błąd podczas zapisywania poletka'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingPlot) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Ładowanie...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edytuj poletko' : 'Nowe poletko'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {isEditMode ? 'Zaktualizuj informacje o poletku' : 'Dodaj nowe poletko do swojego ogrodu'}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nazwa poletka *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              maxLength={100}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              placeholder="np. Poletko przy płocie"
              value={formData.name}
              onChange={handleInputChange}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formData.name.length}/100 znaków
            </p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Opis
            </label>
            <textarea
              id="description"
              name="description"
              rows="4"
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              placeholder="Dodatkowe informacje o poletku..."
              value={formData.description}
              onChange={handleInputChange}
            ></textarea>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formData.description.length}/500 znaków
            </p>
          </div>

          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Zdjęcie poletka
            </label>
            <input
              type="file"
              id="image"
              name="image"
              accept="image/*"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              onChange={handleImageChange}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Maksymalny rozmiar: 5MB. Formaty: JPG, PNG, GIF, WEBP
            </p>
          </div>

          {imagePreview && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Podgląd zdjęcia
              </label>
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Podgląd"
                  className="max-w-full h-auto max-h-64 rounded-lg shadow"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setImagePreview(null);
                    setDeleteImage(true);
                  }}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 shadow"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Zapisywanie...' : (isEditMode ? 'Zaktualizuj poletko' : 'Dodaj poletko')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/plots')}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Anuluj
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlotForm;
