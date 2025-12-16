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

  // Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    loadBedInfo();
  }, [bedId]);

  useEffect(() => {
    calculateSafeHarvestDate();
  }, [formData.spray_date, formData.withdrawal_period]);

  // Autocomplete debounced search
  useEffect(() => {
    if (!formData.spray_name || formData.spray_name.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        const response = await axios.get(`/api/spray-products/autocomplete/${formData.spray_name}`);
        setSuggestions(response.data);
        setShowSuggestions(response.data.length > 0);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [formData.spray_name]);

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

  const selectProduct = (product) => {
    setSelectedProduct(product);
    setFormData(prev => ({
      ...prev,
      spray_name: product.name,
      spray_type: product.type || prev.spray_type,
      withdrawal_period: product.withdrawal_period !== null ? product.withdrawal_period.toString() : prev.withdrawal_period,
      dosage: product.dosage_5l || prev.dosage, // Domyślnie 5L
    }));
    setShowSuggestions(false);
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
        <div className="text-gray-500 dark:text-gray-400">Ładowanie...</div>
      </div>
    );
  }

  if (!bedInfo) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">Nie znaleziono grządki</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Wykonaj oprysk</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Rząd {bedInfo.row_number} - {bedInfo.plant_name || 'Bez nazwy'}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 relative">
              <label htmlFor="spray_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nazwa środka ochrony roślin *
                {selectedProduct && (
                  <span className="ml-2 text-xs text-green-600 dark:text-green-400">✓ Z bazy środków</span>
                )}
              </label>
              <input
                type="text"
                id="spray_name"
                name="spray_name"
                required
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="Wpisz nazwę środka, np. Topsin M..."
                value={formData.spray_name}
                onChange={handleInputChange}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                autoComplete="off"
              />

              {/* Autocomplete dropdown */}
              {showSuggestions && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {loadingSuggestions ? (
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      Wyszukiwanie...
                    </div>
                  ) : suggestions.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      Brak wyników. Wpisz własną nazwę.
                    </div>
                  ) : (
                    suggestions.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => selectProduct(product)}
                        className="w-full text-left px-4 py-3 hover:bg-green-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {product.name}
                              </span>
                              {product.is_ecological === 1 && (
                                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                                  EKO
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {product.type} • {product.target_plants}
                            </div>
                            {product.target_pests && (
                              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                Przeciw: {product.target_pests}
                              </div>
                            )}
                          </div>
                          <div className="text-right text-sm ml-4">
                            <div className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">5L:</span> {product.dosage_5l}
                            </div>
                            {product.withdrawal_period !== null && (
                              <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                                Karencja: {product.withdrawal_period}d
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                💡 Zacznij wpisywać - podpowiemy dane z bazy. Możesz też wpisać własny środek!
              </p>
              {!selectedProduct && formData.spray_name.length > 0 && !loadingSuggestions && suggestions.length === 0 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  ✍️ Własny środek - wypełnij resztę danych ręcznie
                </p>
              )}
            </div>

            <div>
              <label htmlFor="spray_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rodzaj środka
              </label>
              <select
                id="spray_type"
                name="spray_type"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
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
                <option value="metoda_domowa">Metoda domowa (napar, roztwór)</option>
                <option value="biopreparat_własny">Biopreparat własny</option>
                <option value="inne">Inne</option>
              </select>
            </div>

            <div>
              <label htmlFor="spray_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data oprysku *
              </label>
              <input
                type="date"
                id="spray_date"
                name="spray_date"
                required
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                value={formData.spray_date}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="withdrawal_period" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Okres karencji (dni) *
              </label>
              <input
                type="number"
                id="withdrawal_period"
                name="withdrawal_period"
                required
                min="0"
                max="365"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="0"
                value={formData.withdrawal_period}
                onChange={handleInputChange}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Liczba dni przed bezpiecznym zbiorem
              </p>
            </div>

            {safeHarvestDate && (
              <div className="md:col-span-2">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    📅 Bezpieczny zbiór od: <span className="font-bold">{safeHarvestDate}</span>
                  </p>
                  {parseInt(formData.withdrawal_period) > 0 && (
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      System utworzy przypomnienie 3 dni przed końcem karencji
                    </p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="dosage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dawkowanie
              </label>
              <input
                type="text"
                id="dosage"
                name="dosage"
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="np. 2ml/1L wody"
                value={formData.dosage}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="weather_conditions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Warunki pogodowe
              </label>
              <input
                type="text"
                id="weather_conditions"
                name="weather_conditions"
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="np. Słonecznie, 20°C, bez wiatru"
                value={formData.weather_conditions}
                onChange={handleInputChange}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dodatkowe notatki
              </label>
              <textarea
                id="note"
                name="note"
                rows="3"
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="Powód oprysku, obserwacje, etc..."
                value={formData.note}
                onChange={handleInputChange}
              ></textarea>
            </div>
          </div>

          <div className="flex space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Zapisywanie...' : 'Zapisz oprysk'}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/plots/${bedInfo.plot_id}`)}
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

export default SprayForm;
