import React, { useState, useEffect } from 'react';
import axios from '../config/axios';

const PlantManagement = () => {
  const [plants, setPlants] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPlant, setEditingPlant] = useState(null);
  const [form, setForm] = useState({
    name: '',
    display_name: '',
    category: '',
    days_to_harvest: '',
    range_min: '',
    range_max: '',
    notes: '',
    flower_color: '',
    bloom_season: '',
    height: '',
    sun_requirement: '',
    is_perennial: false,
    planting_time: '',
    storage_requirement: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlants();
  }, []);

  const fetchPlants = async () => {
    try {
      const response = await axios.get('/api/plants');
      setPlants(response.data);
    } catch (error) {
      console.error('Error fetching plants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlant) {
        await axios.put(`/api/plants/${editingPlant.id}`, form);
        setMessage({ type: 'success', text: 'Roślina zaktualizowana!' });
      } else {
        await axios.post('/api/plants', form);
        setMessage({ type: 'success', text: 'Roślina dodana!' });
      }
      fetchPlants();
      resetForm();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Błąd' });
    }
  };

  const handleEdit = (plant) => {
    setEditingPlant(plant);
    setForm({
      name: plant.name,
      display_name: plant.display_name,
      category: plant.category || '',
      days_to_harvest: plant.days_to_harvest,
      range_min: plant.range_min || '',
      range_max: plant.range_max || '',
      notes: plant.notes || '',
      flower_color: plant.flower_color || '',
      bloom_season: plant.bloom_season || '',
      height: plant.height || '',
      sun_requirement: plant.sun_requirement || '',
      is_perennial: plant.is_perennial || false,
      planting_time: plant.planting_time || '',
      storage_requirement: plant.storage_requirement || ''
    });
    setShowForm(true);
  };

  const [confirmModal, setConfirmModal] = useState({ open: false, type: null, id: null });

  const handleDelete = async (id) => {
    setConfirmModal({ open: true, type: 'delete', id });
  };

  const executeDelete = async (id) => {
    try {
      await axios.delete(`/api/plants/${id}`);
      setMessage({ type: 'success', text: 'Roślina usunięta!' });
      fetchPlants();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Błąd' });
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      display_name: '',
      category: '',
      days_to_harvest: '',
      range_min: '',
      range_max: '',
      notes: '',
      flower_color: '',
      bloom_season: '',
      height: '',
      sun_requirement: '',
      is_perennial: false,
      planting_time: '',
      storage_requirement: ''
    });
    setEditingPlant(null);
    setShowForm(false);
  };

  const handleImportDefaults = async () => {
    setConfirmModal({ open: true, type: 'import', id: null });
  };

  const executeImport = async () => {
    try {
      const response = await axios.post('/api/plants/import-defaults');
      setMessage({ type: 'success', text: response.data.message });
      fetchPlants();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Błąd importu' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Zarządzanie Roślinami</h1>
        <div className="flex gap-2">
          <button
            onClick={handleImportDefaults}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Importuj domyślne
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            {showForm ? 'Anuluj' : '+ Dodaj roślinę'}
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">{editingPlant ? 'Edytuj roślinę' : 'Dodaj nową roślinę'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nazwa (klucz)</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nazwa wyświetlana</label>
                <input
                  type="text"
                  value={form.display_name}
                  onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dni do zbioru</label>
                <input
                  type="number"
                  value={form.days_to_harvest}
                  onChange={(e) => setForm({ ...form, days_to_harvest: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Min (dni)</label>
                  <input
                    type="number"
                    value={form.range_min}
                    onChange={(e) => setForm({ ...form, range_min: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max (dni)</label>
                  <input
                    type="number"
                    value={form.range_max}
                    onChange={(e) => setForm({ ...form, range_max: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kategoria</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="">Wybierz kategorię</option>
                  <option value="Warzywa owocowe">Warzywa owocowe</option>
                  <option value="Warzywa korzeniowe">Warzywa korzeniowe</option>
                  <option value="Warzywa cebulowe">Warzywa cebulowe</option>
                  <option value="Warzywa kapustne">Warzywa kapustne</option>
                  <option value="Warzywa liściowe">Warzywa liściowe</option>
                  <option value="Warzywa strączkowe">Warzywa strączkowe</option>
                  <option value="Zioła">Zioła</option>
                  <option value="Owoce">Owoce</option>
                  <option value="Kwiaty jednoroczne">Kwiaty jednoroczne</option>
                  <option value="Kwiaty wieloletnie">Kwiaty wieloletnie</option>
                  <option value="Kwiaty cebulowe">Kwiaty cebulowe</option>
                </select>
              </div>
            </div>

            {/* Flower-specific fields */}
            {(form.category?.includes('Kwiaty') || form.flower_color) && (
              <div className="border-t pt-4 mt-4">
                <h3 className="text-md font-semibold mb-3 text-gray-900 dark:text-white">Właściwości kwiatów</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Kolor kwiatu</label>
                    <input
                      type="text"
                      value={form.flower_color}
                      onChange={(e) => setForm({ ...form, flower_color: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      placeholder="np. Żółty, Różowy"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Pora kwitnienia</label>
                    <input
                      type="text"
                      value={form.bloom_season}
                      onChange={(e) => setForm({ ...form, bloom_season: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      placeholder="np. Wiosna, Lato, Jesień"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Wysokość</label>
                    <input
                      type="text"
                      value={form.height}
                      onChange={(e) => setForm({ ...form, height: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      placeholder="np. 30-60cm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Wymagania świetlne</label>
                    <select
                      value={form.sun_requirement}
                      onChange={(e) => setForm({ ...form, sun_requirement: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="">Wybierz</option>
                      <option value="Pełne słońce">Pełne słońce</option>
                      <option value="Pełne słońce do półcienia">Pełne słońce do półcienia</option>
                      <option value="Półcień">Półcień</option>
                      <option value="Cień do półcienia">Cień do półcienia</option>
                      <option value="Cień">Cień</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Pora sadzenia</label>
                    <select
                      value={form.planting_time}
                      onChange={(e) => setForm({ ...form, planting_time: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="">Wybierz</option>
                      <option value="Wiosna">Wiosna</option>
                      <option value="Jesień">Jesień</option>
                      <option value="Wiosna lub Jesień">Wiosna lub Jesień</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_perennial}
                        onChange={(e) => setForm({ ...form, is_perennial: e.target.checked })}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm font-medium">Roślina wieloletnia</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Bulb storage requirements (for Kwiaty cebulowe) */}
            {form.category === 'Kwiaty cebulowe' && (
              <div className="border-t pt-4 mt-4">
                <h3 className="text-md font-semibold mb-3 text-gray-900 dark:text-white">Przechowywanie cebulek</h3>
                <div>
                  <label className="block text-sm font-medium mb-1">Wymagania przechowywania</label>
                  <select
                    value={form.storage_requirement}
                    onChange={(e) => setForm({ ...form, storage_requirement: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="">Wybierz</option>
                    <option value="Mrozoodporne - zostawić w ziemi">Mrozoodporne - zostawić w ziemi</option>
                    <option value="Wykopać na zimę">Wykopać na zimę</option>
                    <option value="Wykopać po przekwitnięciu">Wykopać po przekwitnięciu</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    ⚠️ WAŻNE: Dalie, mieczyki - wykopać przed zimą. Tulipany, narcyzy - zostawić.
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Notatki</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                rows="2"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                {editingPlant ? 'Zaktualizuj' : 'Dodaj'}
              </button>
              <button type="button" onClick={resetForm} className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400">
                Anuluj
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold">Lista roślin ({plants.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Nazwa</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Dni do zbioru</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Zakres</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Typ</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {plants.map((plant) => (
                <tr key={plant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div className="font-medium">{plant.display_name || plant.name}</div>
                    <div className="text-sm text-gray-500">{plant.name}</div>
                  </td>
                  <td className="px-6 py-4">{plant.days_to_harvest} dni</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {plant.range_min && plant.range_max ? `${plant.range_min}-${plant.range_max}` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${plant.is_custom ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'}`}>
                      {plant.is_custom ? 'Własna' : 'Domyślna'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {plant.is_custom && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(plant)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edytuj
                        </button>
                        <button
                          onClick={() => handleDelete(plant.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Usuń
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Confirmation Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setConfirmModal({ open: false, type: null, id: null })}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {confirmModal.type === 'delete' ? 'Usuń roślinę' : 'Importuj rośliny'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {confirmModal.type === 'delete' ? 'Czy na pewno usunąć tę roślinę?' : 'Zaimportować domyślną bazę roślin?'}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmModal({ open: false, type: null, id: null })} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Anuluj</button>
              <button onClick={() => { confirmModal.type === 'delete' ? executeDelete(confirmModal.id) : executeImport(); setConfirmModal({ open: false, type: null, id: null }); }} className={`px-4 py-2 ${confirmModal.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg transition-colors`}>
                {confirmModal.type === 'delete' ? 'Usuń' : 'Importuj'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantManagement;
