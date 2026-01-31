import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check, MapPin, Sprout, Sparkles } from 'lucide-react';
import axios from '../../config/axios';
import TemplateSelectionStep from './TemplateSelectionStep';

const OnboardingWizard = ({ isOpen, onComplete, onSkip }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    interests: [],
    selectedTemplate: null,
    skipTemplate: false,
    location: '',
    city: '',
    selectedLocation: null,
    hasGeolocation: false
  });
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [searchingCity, setSearchingCity] = useState(false);

  const totalSteps = 7;

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Debounce city search
  useEffect(() => {
    if (formData.city.length >= 2) {
      const timer = setTimeout(() => {
        searchPolishCities(formData.city);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setCitySuggestions([]);
    }
  }, [formData.city]);

  const searchPolishCities = async (query) => {
    if (query.length < 2) {
      setCitySuggestions([]);
      return;
    }

    try {
      setSearchingCity(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        `countrycodes=pl&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=10`,
        {
          headers: {
            'User-Agent': 'GardenApp/2.0'
          }
        }
      );
      const data = await response.json();
      setCitySuggestions(data);
    } catch (error) {
      console.error('Error searching cities:', error);
    } finally {
      setSearchingCity(false);
    }
  };

  const selectCity = (place) => {
    setFormData(prev => ({
      ...prev,
      city: place.display_name.split(',')[0],
      selectedLocation: {
        city: place.display_name.split(',')[0],
        lat: place.lat,
        lon: place.lon,
        fullName: place.display_name
      }
    }));
    setCitySuggestions([]);
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = async () => {
    try {
      await axios.put('/api/auth/complete-onboarding');

      // Jeśli wybrano szablon, utwórz plot z szablonu
      if (formData.selectedTemplate && !formData.skipTemplate) {
        await axios.post(`/api/templates/${formData.selectedTemplate.id}/create-plot`, {
          autoPlantDate: false
        });
      }

      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      onComplete(); // Complete anyway
    }
  };

  const toggleInterest = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const requestGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            // Save to weather API for proper integration
            await axios.put('/api/weather/location', {
              latitude,
              longitude,
              city: null
            });

            setFormData(prev => ({
              ...prev,
              hasGeolocation: true,
              selectedLocation: {
                lat: latitude,
                lon: longitude,
                city: 'Twoja lokalizacja'
              }
            }));

            // Auto advance to next step
            setTimeout(() => handleNext(), 1000);
          } catch (error) {
            console.error('Error saving location:', error);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Nie udało się pobrać lokalizacji. Możesz wpisać miasto ręcznie.');
        }
      );
    }
  };

  const saveCity = async () => {
    if (formData.selectedLocation && formData.selectedLocation.lat && formData.selectedLocation.lon) {
      try {
        // Save location to weather endpoint (integrates with weather API)
        await axios.put('/api/weather/location', {
          latitude: parseFloat(formData.selectedLocation.lat),
          longitude: parseFloat(formData.selectedLocation.lon),
          city: formData.selectedLocation.city
        });
        handleNext();
      } catch (error) {
        console.error('Error saving location:', error);
        handleNext(); // Continue anyway
      }
    } else {
      handleNext();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4" style={{ zIndex: 9999, paddingBottom: 'max(calc(5rem + env(safe-area-inset-bottom, 0px)), 6rem)', paddingTop: 'max(env(safe-area-inset-top, 1rem), 1rem)' }}>
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg sm:rounded-2xl shadow-2xl h-[calc(100dvh-10rem)] sm:h-[calc(100dvh-11rem)] md:h-auto md:max-h-[calc(100vh-120px)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 sm:p-6 text-white flex-shrink-0 rounded-t-lg sm:rounded-t-2xl">
          <button
            onClick={onSkip}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors z-10"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>

          <h2 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2 pr-8">
            {step === 1 && "👋 Witaj w Garden App!"}
            {step === 2 && "🌿 Gotowe szablony ogrodów"}
            {step === 3 && "🌍 Twoja lokalizacja"}
            {step === 4 && "🌱 Pierwsze poletko"}
            {step === 5 && "🌿 Pierwsza grządka"}
            {step === 6 && "✨ Poznaj możliwości!"}
            {step === 7 && "✅ System zadań i cykliczność"}
          </h2>
          <p className="text-sm sm:text-base text-green-100">
            Krok {step} z {totalSteps}
          </p>

          {/* Progress bar */}
          <div className="mt-3 sm:mt-4 h-1.5 sm:h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 md:p-8 pb-3 sm:pb-4 overflow-y-auto flex-1" style={{ scrollbarGutter: 'stable' }}>
          {/* Step 1: Interests */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sprout className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Co chcesz uprawiać?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Wybierz wszystko co Cię interesuje - możesz zmienić później!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'vegetables', label: '🥕 Warzywa', desc: 'Pomidory, ogórki, sałata...' },
                  { id: 'flowers', label: '🌸 Kwiaty', desc: 'Róże, tulipany, słoneczniki...' },
                  { id: 'herbs', label: '🌿 Zioła', desc: 'Bazylia, mięta, rozmaryn...' },
                  { id: 'fruits', label: '🍓 Owoce', desc: 'Truskawki, maliny, borówki...' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => toggleInterest(item.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.interests.includes(item.id)
                        ? 'border-green-600 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {item.label}
                      </span>
                      {formData.interests.includes(item.id) && (
                        <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {item.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Template Selection */}
          {step === 2 && (
            <TemplateSelectionStep
              interests={formData.interests}
              selectedTemplate={formData.selectedTemplate}
              onSelectTemplate={(template) =>
                setFormData(prev => ({ ...prev, selectedTemplate: template, skipTemplate: false }))
              }
              onSkipTemplate={() =>
                setFormData(prev => ({ ...prev, selectedTemplate: null, skipTemplate: true }))
              }
            />
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Gdzie uprawiasz?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Ustaw lokalizację aby otrzymywać prognozy pogody dla Twojego ogrodu!
                </p>
              </div>

              {formData.hasGeolocation || formData.selectedLocation ? (
                <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <Check className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <p className="text-green-800 dark:text-green-200 font-medium">
                    ✓ Lokalizacja ustawiona!
                  </p>
                  {formData.selectedLocation && (
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      📍 {formData.selectedLocation.fullName || formData.selectedLocation.city}
                    </p>
                  )}
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Otrzymasz prognozy pogody dla Twojej okolicy
                  </p>
                </div>
              ) : (
                <>
                  <button
                    onClick={requestGeolocation}
                    className="w-full p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <MapPin size={20} />
                    Użyj mojej lokalizacji
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white dark:bg-gray-800 text-gray-500">lub</span>
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Wpisz miasto (zacznij wpisywać...)
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="np. Warszawa"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoComplete="off"
                    />
                    {searchingCity && (
                      <div className="absolute right-3 top-11 text-gray-400">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    )}
                    {citySuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {citySuggestions.map((place, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => selectCity(place)}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-colors"
                          >
                            <div className="font-medium text-gray-900 dark:text-white text-sm">
                              {place.display_name.split(',')[0]}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {place.display_name.split(',').slice(1).join(',').trim()}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      💡 Wybierz miasto z listy aby uwzględnić województwo/powiat
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 4: First Plot */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">📍</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Czym jest poletko?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Poletko to miejsce gdzie uprawiasz rośliny
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 space-y-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                  💡 Przykłady poletka:
                </h4>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span><strong>Ogród</strong> - np. "Ogródek za domem"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span><strong>Balkon</strong> - np. "Balkon od południa"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span><strong>Ogródek działkowy</strong> - np. "Działka ROD Zielona"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span><strong>Szklarnia</strong> - np. "Moja szklarnia"</span>
                  </li>
                </ul>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>Wskazówka:</strong> Możesz mieć wiele poletek!<br />
                  Każde może mieć wiele grządek z różnymi roślinami.
                </p>
              </div>
            </div>
          )}

          {/* Step 5: First Bed */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sprout className="w-10 h-10 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Czym jest grządka?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Grządka to konkretne miejsce/rząd gdzie rośnie jedna roślina
                </p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 space-y-4">
                <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                  🌱 Jak to działa:
                </h4>
                <div className="space-y-3 text-sm text-purple-800 dark:text-purple-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-200 dark:bg-purple-800 rounded-lg flex items-center justify-center flex-shrink-0 font-bold">
                      1
                    </div>
                    <div>
                      <strong>Dodajesz grządkę</strong><br />
                      np. "Rząd 1 - Pomidory"
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-200 dark:bg-purple-800 rounded-lg flex items-center justify-center flex-shrink-0 font-bold">
                      2
                    </div>
                    <div>
                      <strong>Wybierasz roślinę</strong><br />
                      Aplikacja podpowie dni do zbioru!
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-200 dark:bg-purple-800 rounded-lg flex items-center justify-center flex-shrink-0 font-bold">
                      3
                    </div>
                    <div>
                      <strong>Aplikacja przypomni</strong><br />
                      Kiedy podlewać, zbierać, opryskiwać!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Features Showcase */}
          {step === 6 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Zobacz co potrafi Garden App!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Kompletny asystent ogrodnika - wszystko w jednym miejscu
                </p>
              </div>

              <div className="grid gap-3 max-h-48 sm:max-h-64 md:max-h-none overflow-y-auto">
                {[
                  { icon: '📋', title: 'Planer', desc: 'Planuj przyszłe sadzenia, opryski i pielęgnację z wyprzedzeniem!' },
                  { icon: '🌸', title: 'Pielęgnacja kwiatów', desc: 'Kwitnienie, dzielenie bylin, przekwitłe, zimowanie' },
                  { icon: '❄️', title: 'Strefy mrozoodporności', desc: 'Daty przymrozków i zgodność roślin z Twoim klimatem' },
                  { icon: '🤖', title: 'Automatyczne zadania', desc: 'Aplikacja przypomni o podlewaniu, zbiorach i karencji!' },
                  { icon: '🌤️', title: 'Prognozy pogody', desc: 'Planer sprawdza pogodę przed opryskem!' },
                  { icon: '📸', title: 'Galeria zdjęć', desc: 'Dokumentuj postępy i śledź wzrost roślin!' },
                  { icon: '🌱', title: 'Companion planting', desc: 'Podpowiedzi które rośliny lubią sąsiadować!' },
                  { icon: '📊', title: 'Statystyki', desc: 'Śledź plony i postępy w całym sezonie!' }
                ].map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="text-2xl flex-shrink-0">{feature.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {feature.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 text-center">
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Jeszcze jeden krok! →
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Poznaj system zadań i Planer
                </p>
              </div>
            </div>
          )}

          {/* Step 7: Task System & Recurring Tasks */}
          {step === 7 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Zadania - nigdy nie zapomnisz!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Garden App przypomni Ci o wszystkich ważnych czynnościach
                </p>
              </div>

              {/* Jak powstają zadania */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 sm:p-4">
                <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
                  <span className="text-2xl">🤖</span>
                  Automatyczne zadania
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                    <p className="text-blue-800 dark:text-blue-300">
                      <strong>Podlewanie:</strong> Gdy roślina nie była podlewana 3+ dni
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                    <p className="text-blue-800 dark:text-blue-300">
                      <strong>Zbiory:</strong> 60+ dni po posadzeniu - czas zbierać!
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                    <p className="text-blue-800 dark:text-blue-300">
                      <strong>Opryski:</strong> Przypomnienie zgodnie z karencją
                    </p>
                  </div>
                </div>
              </div>

              {/* Zadania cykliczne */}
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-3 sm:p-4">
                <h4 className="font-bold text-purple-900 dark:text-purple-200 mb-3 flex items-center gap-2">
                  <span className="text-2xl">🔄</span>
                  Zadania cykliczne - NOWOŚĆ!
                </h4>
                <p className="text-sm text-purple-800 dark:text-purple-300 mb-3">
                  Niektóre czynności musisz powtarzać regularnie. Ustaw cykliczność!
                </p>

                <div className="space-y-2 sm:space-y-3">
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-2 sm:p-3">
                    <p className="text-xs sm:text-sm font-semibold text-purple-900 dark:text-purple-200 mb-1 sm:mb-2">
                      📝 Przykład: Podlewanie pomidorów
                    </p>
                    <div className="space-y-1 text-xs text-purple-700 dark:text-purple-300">
                      <div className="flex items-center gap-2">
                        <span className="bg-purple-200 dark:bg-purple-800 px-2 py-1 rounded">Co 2 dni</span>
                        <span>+</span>
                        <span className="bg-purple-200 dark:bg-purple-800 px-2 py-1 rounded">Rano</span>
                      </div>
                      <p className="text-purple-600 dark:text-purple-400 italic">
                        → Zadanie pojawi się automatycznie co 2 dni o poranku!
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-2 sm:p-3">
                    <p className="text-xs sm:text-sm font-semibold text-purple-900 dark:text-purple-200 mb-1 sm:mb-2">
                      💧 Przykład: Podlewanie ogórków (intensywnie)
                    </p>
                    <div className="space-y-1 text-xs text-purple-700 dark:text-purple-300">
                      <div className="flex items-center gap-2">
                        <span className="bg-purple-200 dark:bg-purple-800 px-2 py-1 rounded">Codziennie</span>
                        <span>+</span>
                        <span className="bg-purple-200 dark:bg-purple-800 px-2 py-1 rounded">Rano + Wieczór</span>
                      </div>
                      <p className="text-purple-600 dark:text-purple-400 italic">
                        → 2 zadania dziennie: rano i wieczorem!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-green-100/50 dark:bg-green-900/20 rounded-lg border border-green-300 dark:border-green-700">
                  <p className="text-[10px] sm:text-xs text-green-800 dark:text-green-200">
                    <strong>💡 Wskazówka:</strong> Gdy ukończysz cykliczne zadanie, następne pojawi się automatycznie!
                  </p>
                </div>
              </div>

              {/* Pory dnia */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                <div className="bg-orange-100 dark:bg-orange-900/30 rounded-lg p-2 sm:p-3 text-center">
                  <div className="text-xl sm:text-2xl mb-0.5 sm:mb-1">🌅</div>
                  <p className="text-[10px] sm:text-xs font-semibold text-orange-900 dark:text-orange-200">Rano</p>
                  <p className="text-[9px] sm:text-xs text-orange-700 dark:text-orange-400">6-12</p>
                </div>
                <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-2 sm:p-3 text-center">
                  <div className="text-xl sm:text-2xl mb-0.5 sm:mb-1">☀️</div>
                  <p className="text-[10px] sm:text-xs font-semibold text-yellow-900 dark:text-yellow-200">Popołudnie</p>
                  <p className="text-[9px] sm:text-xs text-yellow-700 dark:text-yellow-400">12-18</p>
                </div>
                <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-lg p-2 sm:p-3 text-center">
                  <div className="text-xl sm:text-2xl mb-0.5 sm:mb-1">🌙</div>
                  <p className="text-[10px] sm:text-xs font-semibold text-indigo-900 dark:text-indigo-200">Wieczór</p>
                  <p className="text-[9px] sm:text-xs text-indigo-700 dark:text-indigo-400">18-22</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 text-center">
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  🎉 Wszystko gotowe!
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Kliknij "Zakończ" aby zacząć uprawiać z Garden App!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 md:p-6 flex items-center justify-between bg-gray-50 dark:bg-gray-900 flex-shrink-0 rounded-b-lg sm:rounded-b-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <button
            onClick={onSkip}
            className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <span className="hidden sm:inline">Pomiń przewodnik</span>
            <span className="sm:hidden">Pomiń</span>
          </button>

          <div className="flex gap-1.5 sm:gap-2" style={{ minWidth: 'fit-content' }}>
            {step > 1 && (
              <button
                onClick={handleBack}
                className="px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
              >
                <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Wstecz</span>
              </button>
            )}

            <button
              onClick={step === 3 ? saveCity : handleNext}
              className="px-4 sm:px-6 py-1.5 sm:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
            >
              {step === totalSteps ? 'Zakończ' : 'Dalej'}
              <ChevronRight size={14} className="sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
