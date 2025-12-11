import React, { useState, useEffect } from 'react';
import { X, Camera, Image as ImageIcon, Check } from 'lucide-react';
import axios from '../../config/axios';

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

const QuickPhotoModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [plots, setPlots] = useState([]);
  const [selectedPlot, setSelectedPlot] = useState('');
  const [beds, setBeds] = useState([]);
  const [selectedBed, setSelectedBed] = useState('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [error, setError] = useState('');

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = React.useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (isOpen) {
      // Modal opened - load plots if needed
      if (plots.length === 0) {
        loadPlots();
      }
    } else {
      // Modal closed - RESET ALL STATE
      setStep(1);
      setPhoto(null);
      setPhotoPreview(null);
      setSelectedTag(null);
      setSelectedPlot('');
      setSelectedBed('');
      setCaption('');
      setError('');
      setUploading(false);
      setProcessingPhoto(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedPlot) {
      loadBeds(selectedPlot);
    } else {
      setBeds([]);
      setSelectedBed('');
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

  const loadBeds = async (plotId) => {
    try {
      const response = await axios.get(`/api/plots/${plotId}/beds`);
      setBeds(response.data.filter(bed => !bed.actual_harvest_date)); // Only active beds
    } catch (error) {
      console.error('Error loading beds:', error);
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Plik jest za duży. Maksymalny rozmiar: 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Nieprawidłowy typ pliku. Dozwolone: JPG, PNG, GIF, WebP');
      return;
    }

    setError('');
    setProcessingPhoto(true);
    setPhoto(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      // CRITICAL: Check if component is still mounted before updating state
      if (!isMountedRef.current) return;
      setPhotoPreview(e.target.result);
      setProcessingPhoto(false);
      // AUTO-ADVANCE to step 2 after photo is selected
      setStep(2);
    };
    reader.onerror = () => {
      // CRITICAL: Check if component is still mounted
      if (!isMountedRef.current) return;
      setError('Błąd podczas wczytywania zdjęcia');
      setProcessingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!photo) {
      setError('Wybierz zdjęcie');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('photo', photo);
      if (selectedTag) formData.append('tag', selectedTag);
      if (caption) formData.append('caption', caption);
      if (selectedBed) formData.append('bed_id', selectedBed);
      else if (selectedPlot) formData.append('plot_id', selectedPlot);

      await axios.post('/api/gallery/quick', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Success - notify other components that new photo was added
      window.dispatchEvent(new CustomEvent('photoAdded'));

      if (onSuccess) onSuccess();
      handleClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas dodawania zdjęcia');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setPhoto(null);
    setPhotoPreview(null);
    setSelectedTag(null);
    setSelectedPlot('');
    setSelectedBed('');
    setCaption('');
    setError('');
    setUploading(false);
    setProcessingPhoto(false);
    onClose();
  };

  const canGoNext = () => {
    if (step === 1) return photo;
    return true; // Steps 2-4 are optional
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-green-500 to-emerald-500">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Camera size={24} />
              Szybkie zdjęcie
            </h2>
            <p className="text-sm text-white/90 mt-0.5">
              Krok {step} z 4
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Photo */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                📸 Wybierz zdjęcie
              </h3>

              {processingPhoto && (
                <div className="flex flex-col items-center justify-center h-40 gap-3">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-green-600"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Przetwarzanie zdjęcia...
                  </p>
                </div>
              )}

              {photoPreview && !processingPhoto ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => {
                      setPhoto(null);
                      setPhotoPreview(null);
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : !processingPhoto ? (
                <div className="space-y-3">
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                    <div className="w-full h-40 border-2 border-dashed border-green-300 dark:border-green-700 rounded-lg flex flex-col items-center justify-center gap-3 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition cursor-pointer">
                      <Camera size={40} className="text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Zrób zdjęcie
                      </span>
                    </div>
                  </label>

                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                    <div className="w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-3 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer">
                      <ImageIcon size={40} className="text-gray-400 dark:text-gray-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Wybierz z galerii
                      </span>
                    </div>
                  </label>
                </div>
              ) : null}
            </div>
          )}

          {/* Step 2: Tag */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                🏷️ Wybierz kategorię (opcjonalnie)
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {PHOTO_TAGS.map((tag) => (
                  <button
                    key={tag.value}
                    onClick={() => setSelectedTag(tag.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedTag === tag.value
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 scale-105'
                        : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700'
                    }`}
                  >
                    <div className="text-3xl mb-1">{tag.emoji}</div>
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {tag.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                📍 Lokalizacja (opcjonalnie)
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Poletko
                </label>
                <select
                  value={selectedPlot}
                  onChange={(e) => setSelectedPlot(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Bez lokalizacji</option>
                  {plots.map((plot) => (
                    <option key={plot.id} value={plot.id}>
                      {plot.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPlot && beds.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Grządka
                  </label>
                  <select
                    value={selectedBed}
                    onChange={(e) => setSelectedBed(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Całe poletko</option>
                    {beds.map((bed) => (
                      <option key={bed.id} value={bed.id}>
                        Rz. {bed.row_number} - {bed.plant_name || 'Pusta'}
                        {bed.plant_variety && ` (${bed.plant_variety})`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Caption */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                ✍️ Opis (opcjonalnie)
              </h3>
              <div>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="np. Pierwsze kwiaty, zdrowy wzrost, potrzebuje podlania..."
                  rows={4}
                  maxLength={200}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right">
                  {caption.length}/200
                </p>
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Podsumowanie:
                </p>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {selectedTag && (
                    <div className="flex items-center gap-2">
                      <span>{PHOTO_TAGS.find(t => t.value === selectedTag)?.emoji}</span>
                      <span>{PHOTO_TAGS.find(t => t.value === selectedTag)?.label}</span>
                    </div>
                  )}
                  {selectedPlot && (
                    <div>📍 {plots.find(p => p.id === parseInt(selectedPlot))?.name}</div>
                  )}
                  {selectedBed && (
                    <div>🌱 {beds.find(b => b.id === parseInt(selectedBed))?.plant_name}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between gap-3">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              disabled={uploading}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
            >
              Wstecz
            </button>
          ) : (
            <button
              onClick={handleClose}
              disabled={uploading}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Anuluj
            </button>
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canGoNext() || uploading}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Dalej
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={uploading}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-medium flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Dodawanie...
                </>
              ) : (
                <>
                  <Check size={20} />
                  Dodaj zdjęcie
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickPhotoModal;
