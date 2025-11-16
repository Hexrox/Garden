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

  const handleDelete = async (id) => {
    if (!window.confirm('Czy na pewno usunąć tę roślinę?')) return;
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
    if (!window.confirm('Zaimportować domyślną bazę roślin?')) return;
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
            </div>
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
                    <span className={`px-2 py-1 text-xs rounded-full ${plant.is_custom ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
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
    </div>
  );
};

export default PlantManagement;
