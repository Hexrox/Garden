import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../config/axios';

const CareForm = () => {
  const { bedId } = useParams();
  const navigate = useNavigate();

  const [bedInfo, setBedInfo] = useState(null);
  const [actionType, setActionType] = useState(null); // null = selection screen, 'spray' or 'fertilization'

  const [formData, setFormData] = useState({
    action_name: '',
    action_date: new Date().toISOString().split('T')[0],

    // Spray-specific
    spray_type: '',
    withdrawal_period: '',

    // Fertilization-specific
    fertilizer_type: '',
    npk_ratio: '',
    application_method: 'soil',
    repeat_frequency: '',
    is_recurring: false,

    // Common
    dosage: '',
    weather_conditions: '',
    note: ''
  });

  const [safeHarvestDate, setSafeHarvestDate] = useState('');
  const [nextApplicationDate, setNextApplicationDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingBed, setLoadingBed] = useState(true);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const loadBedInfo = useCallback(async () => {
    try {
      const response = await axios.get(`/api/beds/${bedId}`);
      setBedInfo(response.data);
    } catch (error) {
      setError('Nie udało się załadować informacji o grządce');
      console.error('Error loading bed:', error);
    } finally {
      setLoadingBed(false);
    }
  }, [bedId]);

  const calculateSafeHarvestDate = useCallback(() => {
    if (formData.action_date && formData.withdrawal_period) {
      const sprayDate = new Date(formData.action_date);
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
  }, [formData.action_date, formData.withdrawal_period]);

  const calculateNextApplicationDate = useCallback(() => {
    if (formData.action_date && formData.repeat_frequency) {
      const currentDate = new Date(formData.action_date);
      const frequencyDays = parseInt(formData.repeat_frequency);

      if (!isNaN(frequencyDays) && frequencyDays > 0) {
        currentDate.setDate(currentDate.getDate() + frequencyDays);
        setNextApplicationDate(currentDate.toISOString().split('T')[0]);
      } else {
        setNextApplicationDate('');
      }
    } else {
      setNextApplicationDate('');
    }
  }, [formData.action_date, formData.repeat_frequency]);

  useEffect(() => {
    loadBedInfo();
  }, [loadBedInfo]);

  useEffect(() => {
    if (actionType === 'spray') {
      calculateSafeHarvestDate();
    }
  }, [actionType, calculateSafeHarvestDate]);

  useEffect(() => {
    if (actionType === 'fertilization' && formData.is_recurring && formData.repeat_frequency) {
      calculateNextApplicationDate();
    }
  }, [actionType, formData.is_recurring, formData.repeat_frequency, calculateNextApplicationDate]);

  // Autocomplete debounced search
  useEffect(() => {
    if (!formData.action_name || formData.action_name.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);

        let endpoint = '';
        if (actionType === 'spray') {
          endpoint = `/api/spray-products/autocomplete/${formData.action_name}`;
        } else if (actionType === 'fertilization') {
          endpoint = `/api/fertilizers?name=${formData.action_name}`;
        }

        if (endpoint) {
          const response = await axios.get(endpoint);
          setSuggestions(response.data);
          setShowSuggestions(response.data.length > 0);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [formData.action_name, actionType]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const selectSprayProduct = (product) => {
    setSelectedProduct(product);
    setFormData(prev => ({
      ...prev,
      action_name: product.name,
      spray_type: product.type || prev.spray_type,
      withdrawal_period: product.withdrawal_period !== null ? product.withdrawal_period.toString() : prev.withdrawal_period,
      dosage: product.dosage_5l || prev.dosage,
    }));
    setShowSuggestions(false);
  };

  const selectFertilizerProduct = (product) => {
    setSelectedProduct(product);
    setFormData(prev => ({
      ...prev,
      action_name: product.name,
      fertilizer_type: product.fertilizer_type || prev.fertilizer_type,
      npk_ratio: product.npk_ratio || prev.npk_ratio,
      application_method: product.application_method || prev.application_method,
      repeat_frequency: product.frequency_days?.toString() || prev.repeat_frequency,
      dosage: product.dosage_min && product.dosage_max
        ? `${product.dosage_min}-${product.dosage_max}${product.dosage_unit || 'g/10m²'}`
        : prev.dosage,
    }));
    setShowSuggestions(false);
  };

  const validateForm = () => {
    if (!formData.action_name.trim()) {
      setError('Nazwa zabiegu jest wymagana');
      return false;
    }

    const actionDate = new Date(formData.action_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (actionDate > today) {
      setError('Data zabiegu nie może być w przyszłości');
      return false;
    }

    const yearAgo = new Date();
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);

    if (actionDate < yearAgo) {
      setError('Data zabiegu nie może być starsza niż rok');
      return false;
    }

    if (actionType === 'spray') {
      const period = parseInt(formData.withdrawal_period);
      if (isNaN(period) || period < 0) {
        setError('Okres karencji musi być liczbą >= 0');
        return false;
      }

      if (period > 365) {
        setError('Okres karencji nie może przekraczać 365 dni');
        return false;
      }
    }

    if (actionType === 'fertilization' && formData.is_recurring) {
      const frequency = parseInt(formData.repeat_frequency);
      if (isNaN(frequency) || frequency <= 0) {
        setError('Częstotliwość powtarzania musi być liczbą > 0');
        return false;
      }

      if (frequency > 365) {
        setError('Częstotliwość powtarzania nie może przekraczać 365 dni');
        return false;
      }
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
      const payload = {
        bed_id: parseInt(bedId),
        action_type: actionType,
        action_name: formData.action_name.trim(),
        action_date: formData.action_date,
        dosage: formData.dosage.trim() || null,
        weather_conditions: formData.weather_conditions.trim() || null,
        note: formData.note.trim() || null,
      };

      if (actionType === 'spray') {
        payload.withdrawal_period = parseInt(formData.withdrawal_period);
      } else if (actionType === 'fertilization') {
        payload.fertilizer_type = formData.fertilizer_type || null;
        payload.npk_ratio = formData.npk_ratio.trim() || null;
        payload.application_method = formData.application_method;
        payload.is_recurring = formData.is_recurring;

        if (formData.is_recurring) {
          payload.repeat_frequency = parseInt(formData.repeat_frequency);
        }
      }

      await axios.post('/api/care', payload);

      // Navigate back to plot detail
      if (bedInfo && bedInfo.plot_id) {
        navigate(`/plots/${bedInfo.plot_id}`);
      } else {
        navigate('/plots');
      }
    } catch (error) {
      console.error('Error saving care action:', error);
      setError(
        error.response?.data?.error ||
        error.response?.data?.errors?.[0]?.msg ||
        'Wystąpił błąd podczas zapisywania zabiegu'
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

  // Action type selection screen
  if (!actionType) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Wybierz typ zabiegu</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Rząd {bedInfo.row_number} - {bedInfo.plant_name || 'Bez nazwy'}
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setActionType('fertilization')}
            className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl hover:scale-[1.02] transition-all border-2 border-transparent hover:border-green-500 dark:hover:border-green-500 text-left"
          >
            <div className="flex items-start space-x-4">
              <div className="text-5xl">🌱</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Nawożenie
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Podaż składników pokarmowych dla rośliny. Wspomaga wzrost, kwitnienie i owocowanie.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                    Nawozy mineralne
                  </span>
                  <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                    Nawozy organiczne
                  </span>
                  <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                    Naturalne nawozy
                  </span>
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActionType('spray')}
            className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl hover:scale-[1.02] transition-all border-2 border-transparent hover:border-blue-500 dark:hover:border-blue-500 text-left"
          >
            <div className="flex items-start space-x-4">
              <div className="text-5xl">🛡️</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Oprysk ochronny
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Ochrona przed chorobami, szkodnikami i chwastami. Zapewnia zdrowie roślin.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                    Fungicydy
                  </span>
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                    Insektycydy
                  </span>
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                    Biopreparaty
                  </span>
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate(`/plots/${bedInfo.plot_id}`)}
            className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800"
          >
            Anuluj
          </button>
        </div>
      </div>
    );
  }

  // Form screen (spray or fertilization)
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setActionType(null)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Zmień typ zabiegu
          </button>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {actionType === 'fertilization' ? '🌱 Nawożenie' : '🛡️ Oprysk ochronny'}
        </h1>
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
            {/* Action Name with Autocomplete */}
            <div className="md:col-span-2 relative">
              <label htmlFor="action_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {actionType === 'fertilization' ? 'Nazwa nawozu *' : 'Nazwa środka ochrony roślin *'}
                {selectedProduct && (
                  <span className="ml-2 text-xs text-green-600 dark:text-green-400">✓ Z bazy produktów</span>
                )}
              </label>
              <input
                type="text"
                id="action_name"
                name="action_name"
                required
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder={actionType === 'fertilization' ? 'Wpisz nazwę nawozu, np. Azofoska...' : 'Wpisz nazwę środka, np. Topsin M...'}
                value={formData.action_name}
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
                        onClick={() => actionType === 'spray' ? selectSprayProduct(product) : selectFertilizerProduct(product)}
                        className="w-full text-left px-4 py-3 hover:bg-green-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {product.name}
                              </span>
                              {actionType === 'spray' && product.is_ecological === 1 && (
                                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                                  EKO
                                </span>
                              )}
                              {actionType === 'fertilization' && (
                                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                                  {product.fertilizer_type === 'mineral' ? 'Mineralny' : product.fertilizer_type === 'organic' ? 'Organiczny' : 'Naturalny'}
                                </span>
                              )}
                            </div>
                            {actionType === 'spray' ? (
                              <>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  {product.type} • {product.target_plants}
                                </div>
                                {product.target_pests && (
                                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                    Przeciw: {product.target_pests}
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  {product.npk_ratio ? `NPK: ${product.npk_ratio}` : product.suitable_for}
                                </div>
                                {product.frequency_days && (
                                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                    Częstotliwość: co {product.frequency_days} dni
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          {actionType === 'spray' && (
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
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                💡 Zacznij wpisywać - podpowiemy dane z bazy. Możesz też wpisać własny produkt!
              </p>
            </div>

            {/* Spray-specific fields */}
            {actionType === 'spray' && (
              <>
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
              </>
            )}

            {/* Fertilization-specific fields */}
            {actionType === 'fertilization' && (
              <>
                <div>
                  <label htmlFor="fertilizer_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Typ nawozu
                  </label>
                  <select
                    id="fertilizer_type"
                    name="fertilizer_type"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                    value={formData.fertilizer_type}
                    onChange={handleInputChange}
                  >
                    <option value="">-- Wybierz --</option>
                    <option value="mineral">Mineralny (szybkie działanie)</option>
                    <option value="organic">Organiczny (powolne działanie)</option>
                    <option value="natural">Naturalny (domowej roboty)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="npk_ratio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Skład NPK
                  </label>
                  <input
                    type="text"
                    id="npk_ratio"
                    name="npk_ratio"
                    maxLength={20}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                    placeholder="np. 15:15:15"
                    value={formData.npk_ratio}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Azot:Fosfor:Potas
                  </p>
                </div>

                <div>
                  <label htmlFor="application_method" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Metoda aplikacji
                  </label>
                  <select
                    id="application_method"
                    name="application_method"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                    value={formData.application_method}
                    onChange={handleInputChange}
                  >
                    <option value="soil">Doglebowo (podlewanie/posypywanie)</option>
                    <option value="foliar">Dolistnie (opryskiwanie liści)</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_recurring"
                      checked={formData.is_recurring}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nawożenie cykliczne
                    </span>
                  </label>
                </div>

                {formData.is_recurring && (
                  <div className="md:col-span-2">
                    <label htmlFor="repeat_frequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Częstotliwość powtarzania (dni) *
                    </label>
                    <input
                      type="number"
                      id="repeat_frequency"
                      name="repeat_frequency"
                      required={formData.is_recurring}
                      min="1"
                      max="365"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                      placeholder="np. 14 (co 2 tygodnie)"
                      value={formData.repeat_frequency}
                      onChange={handleInputChange}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Co ile dni powtarzać nawożenie
                    </p>

                    {nextApplicationDate && (
                      <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          📅 Następne nawożenie: <span className="font-bold">{nextApplicationDate}</span>
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                          System automatycznie utworzy cykliczne zadanie nawożenia
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Common fields */}
            <div>
              <label htmlFor="action_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data zabiegu *
              </label>
              <input
                type="date"
                id="action_date"
                name="action_date"
                required
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                value={formData.action_date}
                onChange={handleInputChange}
              />
            </div>

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
                placeholder={actionType === 'fertilization' ? 'np. 150g/10m²' : 'np. 2ml/1L wody'}
                value={formData.dosage}
                onChange={handleInputChange}
              />
            </div>

            <div className="md:col-span-2">
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
                placeholder={actionType === 'fertilization' ? 'Obserwacje, reakcja roślin...' : 'Powód oprysku, obserwacje...'}
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
              {loading ? 'Zapisywanie...' : actionType === 'fertilization' ? 'Zapisz nawożenie' : 'Zapisz oprysk'}
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

export default CareForm;
