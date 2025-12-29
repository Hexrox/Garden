import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MoreVertical, Edit2, Copy, Trash2 } from 'lucide-react';
import axios from '../config/axios';
import PhotoGallery from '../components/PhotoGallery';
import PlantSelector from '../components/PlantSelector';
import GrowthProgressCard from '../features/growth-tracking/GrowthProgressCard';
import CompanionSuggestions from '../features/companion-planting/CompanionSuggestions';
import BedGridView from '../features/garden-layout/BedGridView';
import HarvestModal from '../components/modals/HarvestModal';
import BedEditModal from '../components/modals/BedEditModal';
import BedDuplicateModal from '../components/modals/BedDuplicateModal';
import DeleteConfirmDialog from '../components/modals/DeleteConfirmDialog';

const PlotDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plot, setPlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBedForm, setShowBedForm] = useState(false);
  const [bedForm, setBedForm] = useState({
    row_number: '',
    plant_name: '',
    plant_variety: '',
    planted_date: '',
    expected_harvest_date: '',
    note: ''
  });

  // Modal states
  const [selectedBed, setSelectedBed] = useState(null);
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    loadPlotDetails();
  }, [id]);

  const loadPlotDetails = async () => {
    try {
      const response = await axios.get(`/api/plots/${id}/details`);
      setPlot(response.data);
    } catch (error) {
      console.error('Error loading plot details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBed = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/plots/${id}/beds`, bedForm);
      setBedForm({
        row_number: '',
        plant_name: '',
        plant_variety: '',
        planted_date: '',
        expected_harvest_date: '',
        note: ''
      });
      setShowBedForm(false);
      loadPlotDetails();
    } catch (error) {
      console.error('Error adding bed:', error);
      alert('Błąd podczas dodawania grządki');
    }
  };

  // Harvest handler
  const handleHarvest = async (bed, harvestData) => {
    // Jeśli jest zdjęcie, użyj FormData
    if (harvestData.harvest_photo) {
      const formData = new FormData();
      formData.append('actual_harvest_date', harvestData.actual_harvest_date);
      formData.append('yield_amount', harvestData.yield_amount || '');
      formData.append('yield_unit', harvestData.yield_unit || 'kg');
      formData.append('harvest_notes', harvestData.harvest_notes || '');
      formData.append('clearBed', harvestData.clearBed);
      formData.append('harvest_photo', harvestData.harvest_photo);

      await axios.put(`/api/beds/${bed.id}/harvest`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } else {
      // Bez zdjęcia - zwykły JSON
      await axios.put(`/api/beds/${bed.id}/harvest`, harvestData);
    }
    loadPlotDetails();
  };

  // Edit handler
  const handleEdit = async (bedId, formData) => {
    await axios.put(`/api/beds/${bedId}`, formData);
    loadPlotDetails();
  };

  // Duplicate handler
  const handleDuplicate = async (bedData) => {
    await axios.post(`/api/plots/${id}/beds`, bedData);
    loadPlotDetails();
  };

  // Delete handler
  const handleDelete = async (bedId) => {
    await axios.delete(`/api/beds/${bedId}`);
    loadPlotDetails();
  };

  // Menu actions
  const openHarvestModal = (bed) => {
    setSelectedBed(bed);
    setShowHarvestModal(true);
    setOpenMenuId(null);
  };

  const openEditModal = (bed) => {
    setSelectedBed(bed);
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const openDuplicateModal = (bed) => {
    setSelectedBed(bed);
    setShowDuplicateModal(true);
    setOpenMenuId(null);
  };

  const openDeleteDialog = (bed) => {
    setSelectedBed(bed);
    setShowDeleteDialog(true);
    setOpenMenuId(null);
  };

  // Handle reorder from BedGridView
  const handleReorderBeds = async (updatedBeds) => {
    // Optimistic update
    setPlot({ ...plot, beds: updatedBeds });

    // Send to backend
    try {
      await axios.put(`/api/plots/${id}/reorder-beds`, {
        beds: updatedBeds.map(b => ({ id: b.id, row_number: b.row_number }))
      });
    } catch (error) {
      console.error('Error reordering beds:', error);
      alert('Błąd podczas zapisywania kolejności');
      // Reload on error to restore original order
      loadPlotDetails();
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Ładowanie...</div>;
  if (!plot) return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Poletko nie znalezione</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{plot.name}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{plot.description}</p>
        </div>
        <div className="flex space-x-2">
          <Link
            to={`/plots/${id}/edit`}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Edytuj poletko
          </Link>
          <button
            onClick={() => setShowBedForm(!showBedForm)}
            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
          >
            + Dodaj grządkę
          </button>
        </div>
      </div>

      {showBedForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Nowa grządka</h3>
          <form onSubmit={handleAddBed} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Numer rzędu *
                </label>
                <input
                  type="number"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  value={bedForm.row_number}
                  onChange={(e) => setBedForm({ ...bedForm, row_number: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nazwa rośliny
                </label>
                <PlantSelector
                  value={bedForm.plant_name}
                  onChange={(plantName) => setBedForm({ ...bedForm, plant_name: plantName })}
                  plantedDate={bedForm.planted_date}
                  onHarvestDateCalculated={(harvestDate, days) => {
                    setBedForm({
                      ...bedForm,
                      expected_harvest_date: harvestDate
                    });
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Odmiana
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  value={bedForm.plant_variety}
                  onChange={(e) => setBedForm({ ...bedForm, plant_variety: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data posadzenia
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  value={bedForm.planted_date}
                  onChange={(e) => setBedForm({ ...bedForm, planted_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Przewidywany zbiór
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  value={bedForm.expected_harvest_date}
                  onChange={(e) => setBedForm({ ...bedForm, expected_harvest_date: e.target.value })}
                  placeholder="Automatycznie po wyborze rośliny"
                />
                {bedForm.expected_harvest_date && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    ✓ Data została obliczona automatycznie
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notatki
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                rows="3"
                value={bedForm.note}
                onChange={(e) => setBedForm({ ...bedForm, note: e.target.value })}
              ></textarea>
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Dodaj
              </button>
              <button
                type="button"
                onClick={() => setShowBedForm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Anuluj
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Visual Grid Overview - NEW FEATURE! */}
      {plot.beds && plot.beds.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
          <BedGridView beds={plot.beds} onReorder={handleReorderBeds} />
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Grządki - szczegóły ({plot.beds?.length || 0})
          </h2>
        </div>
        {plot.beds && plot.beds.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {plot.beds.map((bed) => (
              <div
                key={bed.id}
                className="px-6 py-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Rząd {bed.row_number} - {bed.plant_name || 'Brak rośliny'}
                    </h3>
                    {bed.latin_name && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-0.5">{bed.latin_name}</p>
                    )}
                    {bed.plant_variety && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">Odmiana: {bed.plant_variety}</p>
                    )}

                    {/* Flower-specific data */}
                    {(bed.flower_color || bed.bloom_season || bed.height || bed.sun_requirement) && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {bed.flower_color && (
                          <span className="text-xs bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 px-2 py-1 rounded-full">
                            🌸 {bed.flower_color.split(',')[0]}
                          </span>
                        )}
                        {bed.bloom_season && (
                          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                            📅 {bed.bloom_season}
                          </span>
                        )}
                        {bed.height && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                            📏 {bed.height}
                          </span>
                        )}
                        {bed.sun_requirement && (
                          <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full">
                            ☀️ {bed.sun_requirement === 'full_sun' ? 'Pełne słońce' : bed.sun_requirement === 'partial_shade' ? 'Półcień' : 'Cień'}
                          </span>
                        )}
                      </div>
                    )}

                    {bed.planted_date && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Posadzone: {bed.planted_date}</p>
                    )}
                    {bed.expected_harvest_date && !bed.actual_harvest_date && (
                      <p className="text-sm text-green-700 dark:text-green-400 font-medium mt-1">
                        🌾 Przewidywany zbiór: {new Date(bed.expected_harvest_date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                    {bed.actual_harvest_date && (
                      <p className="text-sm text-blue-700 dark:text-blue-400 font-medium mt-1">
                        ✅ Zebrane: {new Date(bed.actual_harvest_date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {bed.yield_amount && ` • ${bed.yield_amount} ${bed.yield_unit || 'kg'}`}
                      </p>
                    )}
                    {bed.note && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{bed.note}</p>
                    )}

                    {/* Growth Progress - NEW FEATURE! */}
                    {bed.plant_name && bed.planted_date && (
                      <div className="mt-4">
                        <GrowthProgressCard bed={bed} />
                      </div>
                    )}

                    {/* Companion Planting Suggestions - NEW FEATURE! */}
                    {bed.plant_name && (
                      <div className="mt-4">
                        <CompanionSuggestions
                          plantName={bed.plant_name}
                          nearbyBeds={plot.beds.filter(b => b.id !== bed.id)}
                        />
                      </div>
                    )}

                    {bed.sprays && bed.sprays.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Opryski ({bed.sprays.length}):
                        </p>
                        {bed.sprays.slice(0, 2).map((spray) => (
                          <div key={spray.id} className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                            • {spray.spray_name} - {spray.spray_date} (karencja: {spray.withdrawal_period} dni)
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Menu */}
                  <div className="ml-4 relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === bed.id ? null : bed.id)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-500" />
                    </button>

                    {openMenuId === bed.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                        <button
                          onClick={() => openEditModal(bed)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                        >
                          <Edit2 size={16} />
                          Edytuj
                        </button>
                        <button
                          onClick={() => openDuplicateModal(bed)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Copy size={16} />
                          Powiel
                        </button>
                        <hr className="border-gray-200 dark:border-gray-700" />
                        {bed.plant_name && !bed.actual_harvest_date && (
                          <button
                            onClick={() => openHarvestModal(bed)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-700 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <span>🌾</span>
                            Zbierz
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            navigate(`/beds/${bed.id}/care`);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-700 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <span>🌱</span>
                          Pielęgnacja
                        </button>
                        <hr className="border-gray-200 dark:border-gray-700" />
                        <button
                          onClick={() => openDeleteDialog(bed)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
                        >
                          <Trash2 size={16} />
                          Usuń
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Photo Gallery for this bed */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <PhotoGallery bedId={bed.id} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
            Brak grządek. Dodaj pierwszą grządkę, aby rozpocząć.
          </div>
        )}
      </div>

      {/* Modals */}
      {showHarvestModal && selectedBed && (
        <HarvestModal
          bed={selectedBed}
          onClose={() => setShowHarvestModal(false)}
          onHarvest={handleHarvest}
        />
      )}

      {showEditModal && selectedBed && (
        <BedEditModal
          bed={selectedBed}
          onClose={() => setShowEditModal(false)}
          onSave={handleEdit}
        />
      )}

      {showDuplicateModal && selectedBed && (
        <BedDuplicateModal
          bed={selectedBed}
          existingBeds={plot.beds}
          onClose={() => setShowDuplicateModal(false)}
          onDuplicate={handleDuplicate}
        />
      )}

      {showDeleteDialog && selectedBed && (
        <DeleteConfirmDialog
          bed={selectedBed}
          onClose={() => setShowDeleteDialog(false)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default PlotDetail;
