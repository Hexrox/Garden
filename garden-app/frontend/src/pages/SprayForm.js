import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../config/axios';

const SprayForm = () => {
  const { bedId } = useParams();
  const navigate = useNavigate();

  const [bedInfo, setBedInfo] = useState(null);
  const [formData, setFormData] = useState({
    spray_name: '',
    spray_type: '',
    spray_date: new Date().toISOString().split('T')[0],
    withdrawal_period: '',
    dosage: '',
    weather_conditions: '',
    note: ''
  });
  const [safeHarvestDate, setSafeHarvestDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingBed, setLoadingBed] = useState(true);

  useEffect(() => {
    loadBedInfo();
  }, [bedId]);

  useEffect(() => {
    calculateSafeHarvestDate();
  }, [formData.spray_date, formData.withdrawal_period]);

  const loadBedInfo = async () => {
    try {
      const response = await axios.get(`/api/beds/${bedId}`);
      setBedInfo(response.data);
    } catch (error) {
      setError('Nie udało się załadować informacji o grządce');
      console.error('Error loading bed:', error);
    } finally {
      setLoadingBed(false);
    }
  };

  const calculateSafeHarvestDate = () => {
    if (formData.spray_date && formData.withdrawal_period) {
      const sprayDate = new Date(formData.spray_date);
      const withdrawalDays = parseInt(formData.withdrawal_period);

      if (!isNaN(withdrawalDays) && withdrawalDays >= 0) {
        sprayDate.setDate(sprayDate.getDate() + withdrawalDays);
        setSafeHarvestDate(sprayDate.toISOString().split('T')[0]);
      } else {
        setSafeHarvestDate('');
      }
    } else {
      setSafeHarvestDate('');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    // Validate spray name
    if (!formData.spray_name.trim()) {
      setError('Nazwa środka jest wymagana');
      return false;
    }

    // Validate spray date
    const sprayDate = new Date(formData.spray_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (sprayDate > today) {
      setError('Data oprysku nie może być w przyszłości');
      return false;
    }

    const yearAgo = new Date();
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);

    if (sprayDate < yearAgo) {
      setError('Data oprysku nie może być starsza niż rok');
      return false;
    }

    // Validate withdrawal period
    const period = parseInt(formData.withdrawal_period);
    if (isNaN(period) || period < 0) {
      setError('Okres karencji musi być liczbą >= 0');
      return false;
    }

    if (period > 365) {
      setError('Okres karencji nie może przekraczać 365 dni');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await axios.post(`/api/beds/${bedId}/sprays`, {
        spray_name: formData.spray_name.trim(),
        spray_type: formData.spray_type.trim() || null,
        spray_date: formData.spray_date,
        withdrawal_period: parseInt(formData.withdrawal_period),
        dosage: formData.dosage.trim() || null,
        weather_conditions: formData.weather_conditions.trim() || null,
        note: formData.note.trim() || null
      });

      // Navigate back to plot detail
      if (bedInfo && bedInfo.plot_id) {
        navigate(`/plots/${bedInfo.plot_id}`);
      } else {
        navigate('/plots');
      }
    } catch (error) {
      console.error('Error saving spray:', error);
      setError(
        error.response?.data?.error ||
        error.response?.data?.errors?.[0]?.msg ||
        'Wystąpił błąd podczas zapisywania oprysku'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingBed) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Ładowanie...</div>
      </div>
    );
  }

  if (!bedInfo) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Nie znaleziono grządki</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dodaj oprysk</h1>
        <p className="text-gray-600 mt-1">
          Rząd {bedInfo.row_number} - {bedInfo.plant_name || 'Bez nazwy'}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="spray_name" className="block text-sm font-medium text-gray-700 mb-1">
                Nazwa środka ochrony roślin *
              </label>
              <input
                type="text"
                id="spray_name"
                name="spray_name"
                required
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="np. Topsin M 500 SC"
                value={formData.spray_name}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="spray_type" className="block text-sm font-medium text-gray-700 mb-1">
                Rodzaj środka
              </label>
              <select
                id="spray_type"
                name="spray_type"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={formData.spray_type}
                onChange={handleInputChange}
              >
                <option value="">-- Wybierz --</option>
                <option value="fungicyd">Fungicyd (zwalcza choroby grzybowe)</option>
                <option value="insektycyd">Insektycyd (zwalcza szkodniki)</option>
                <option value="herbicyd">Herbicyd (zwalcza chwasty)</option>
                <option value="akarycyd">Akarycyd (zwalcza roztocza)</option>
                <option value="moluskocyd">Moluskocyd (zwalcza ślimaki)</option>
                <option value="nawóz_dolistny">Nawóz dolistny</option>
                <option value="biostymulanty">Biostymulanty</option>
                <option value="inne">Inne</option>
              </select>
            </div>

            <div>
              <label htmlFor="spray_date" className="block text-sm font-medium text-gray-700 mb-1">
                Data oprysku *
              </label>
              <input
                type="date"
                id="spray_date"
                name="spray_date"
                required
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={formData.spray_date}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="withdrawal_period" className="block text-sm font-medium text-gray-700 mb-1">
                Okres karencji (dni) *
              </label>
              <input
                type="number"
                id="withdrawal_period"
                name="withdrawal_period"
                required
                min="0"
                max="365"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="0"
                value={formData.withdrawal_period}
                onChange={handleInputChange}
              />
              <p className="text-xs text-gray-500 mt-1">
                Liczba dni przed bezpiecznym zbiorem
              </p>
            </div>

            {safeHarvestDate && (
              <div className="md:col-span-2">
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <p className="text-sm font-medium text-green-800">
                    📅 Bezpieczny zbiór od: <span className="font-bold">{safeHarvestDate}</span>
                  </p>
                  {parseInt(formData.withdrawal_period) > 0 && (
                    <p className="text-xs text-green-700 mt-1">
                      System utworzy przypomnienie 3 dni przed końcem karencji
                    </p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="dosage" className="block text-sm font-medium text-gray-700 mb-1">
                Dawkowanie
              </label>
              <input
                type="text"
                id="dosage"
                name="dosage"
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="np. 2ml/1L wody"
                value={formData.dosage}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="weather_conditions" className="block text-sm font-medium text-gray-700 mb-1">
                Warunki pogodowe
              </label>
              <input
                type="text"
                id="weather_conditions"
                name="weather_conditions"
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="np. Słonecznie, 20°C, bez wiatru"
                value={formData.weather_conditions}
                onChange={handleInputChange}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                Dodatkowe notatki
              </label>
              <textarea
                id="note"
                name="note"
                rows="3"
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Powód oprysku, obserwacje, etc..."
                value={formData.note}
                onChange={handleInputChange}
              ></textarea>
            </div>
          </div>

          <div className="flex space-x-4 pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Zapisywanie...' : 'Dodaj oprysk'}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/plots/${bedInfo.plot_id}`)}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Anuluj
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SprayForm;
