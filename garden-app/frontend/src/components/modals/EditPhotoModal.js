import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import axios, { getImageUrl } from '../../config/axios';

const PHOTO_TAGS = [
  { emoji: '🥕', label: 'Warzywa', value: 'warzywa' },
  { emoji: '🌸', label: 'Kwiaty', value: 'kwiaty' },
  { emoji: '🌿', label: 'Zioła', value: 'zioła' },
  { emoji: '🍎', label: 'Owoce', value: 'owoce' },
  { emoji: '🌱', label: 'Siew', value: 'siew' },
  { emoji: '🌾', label: 'Zbiór', value: 'zbiór' },
  { emoji: '💧', label: 'Podlewanie', value: 'podlewanie' },
  { emoji: '🐛', label: 'Problem', value: 'problem' },
  { emoji: '✂️', label: 'Pielęgnacja', value: 'pielęgnacja' },
  { emoji: '🌤️', label: 'Pogoda', value: 'pogoda' },
  { emoji: '🏆', label: 'Sukces', value: 'sukces' },
  { emoji: '📸', label: 'Ogólne', value: 'ogólne' }
];

const EditPhotoModal = ({ photo, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    caption: '',
    bed_id: '',
    tag: '',
    taken_date: ''
  });
  const [plots, setPlots] = useState([]);
  const [beds, setBeds] = useState([]);
  const [selectedPlot, setSelectedPlot] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && photo) {
      // Initialize form with photo data
      setFormData({
        caption: photo.caption || '',
        bed_id: photo.bed_id || '',
        tag: photo.tag || '',
        taken_date: photo.taken_date || ''
      });

      // Load plots
      loadPlots();

      // If photo has bed_id, load that bed's plot
      if (photo.bed_id) {
        loadBedInfo(photo.bed_id);
      }
    }
  }, [isOpen, photo]);

  useEffect(() => {
    if (selectedPlot) {
      loadBeds(selectedPlot);
    } else {
      setBeds([]);
    }
  }, [selectedPlot]);

  const loadPlots = async () => {
    try {
      const response = await axios.get('/api/plots');
      setPlots(response.data);
    } catch (error) {
      console.error('Error loading plots:', error);
    }
  };

  const loadBedInfo = async (bedId) => {
    try {
      const response = await axios.get(`/api/beds/${bedId}`);
      const bed = response.data;
      setSelectedPlot(bed.plot_id);
      // Beds will be loaded by useEffect when selectedPlot changes
    } catch (error) {
      console.error('Error loading bed info:', error);
    }
  };

  const loadBeds = async (plotId) => {
    try {
      const response = await axios.get(`/api/plots/${plotId}/beds`);
      setBeds(response.data);
    } catch (error) {
      console.error('Error loading beds:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.put(`/api/gallery/${photo.id}`, formData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas aktualizacji zdjęcia');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBed = () => {
    setFormData({ ...formData, bed_id: '' });
    setSelectedPlot('');
    setBeds([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto animate-fade-in" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-photo-title"
        className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full my-auto max-h-[95vh] flex flex-col border border-white/20 dark:border-gray-700/50 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Tab') {
            const focusable = e.currentTarget.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey) {
              if (document.activeElement === first) { e.preventDefault(); last.focus(); }
            } else {
              if (document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
          }
        }}
      >
        {/* Header - sticky */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 id="edit-photo-title" className="text-xl font-bold text-gray-900 dark:text-white">
            Edytuj zdjęcie
          </h2>
          <button
            onClick={onClose}
            aria-label="Zamknij"
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form - scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Preview */}
          <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
            <img
              src={getImageUrl(photo.medium_path || photo.photo_path)}
              alt={photo.caption || 'Zdjęcie'}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Opis zdjęcia
            </label>
            <textarea
              value={formData.caption}
              onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white resize-none"
              rows={3}
              placeholder="Dodaj opis..."
            />
          </div>

          {/* Tag */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Kategoria
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {PHOTO_TAGS.map((tag) => (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, tag: tag.value })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.tag === tag.value
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-700'
                  }`}
                >
                  <div className="text-2xl mb-1">{tag.emoji}</div>
                  <div className="text-xs text-gray-700 dark:text-gray-300">{tag.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Data zdjęcia
            </label>
            <input
              type="date"
              value={formData.taken_date}
              onChange={(e) => setFormData({ ...formData, taken_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Plot & Bed */}
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                📍 Przypisz do grządki (opcjonalne)
              </label>
              {formData.bed_id && (
                <button
                  type="button"
                  onClick={handleRemoveBed}
                  className="text-sm text-red-600 dark:text-red-400 hover:underline"
                >
                  Usuń przypisanie
                </button>
              )}
            </div>

            {/* Plot select */}
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                Poletko
              </label>
              <select
                value={selectedPlot}
                onChange={(e) => {
                  setSelectedPlot(e.target.value);
                  setFormData({ ...formData, bed_id: '' });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="">Brak - zdjęcie ogólne</option>
                {plots.map((plot) => (
                  <option key={plot.id} value={plot.id}>
                    {plot.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Bed select */}
            {selectedPlot && beds.length > 0 && (
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                  Grządka
                </label>
                <select
                  value={formData.bed_id}
                  onChange={(e) => setFormData({ ...formData, bed_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Wybierz grządkę...</option>
                  {beds.map((bed) => (
                    <option key={bed.id} value={bed.id}>
                      Rząd {bed.row_number} - {bed.plant_name} {bed.plant_variety && `(${bed.plant_variety})`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedPlot && beds.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                Brak grządek na tym poletku
              </p>
            )}
          </div>

          {/* Actions - sticky bottom with extra padding */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 pb-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Zapisywanie...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Zapisz zmiany
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Anuluj
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPhotoModal;
