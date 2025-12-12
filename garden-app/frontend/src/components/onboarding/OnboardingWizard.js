import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Check, MapPin, Sprout, Camera, Sparkles } from 'lucide-react';
import axios from '../../config/axios';

const OnboardingWizard = ({ isOpen, onComplete, onSkip }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    interests: [],
    location: '',
    city: '',
    hasGeolocation: false
  });

  const totalSteps = 5;

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
            // Save to profile
            await axios.put('/api/auth/update-profile', { latitude, longitude });

            setFormData(prev => ({ ...prev, hasGeolocation: true }));

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
    if (formData.city) {
      try {
        await axios.put('/api/auth/update-profile', { city: formData.city });
        handleNext();
      } catch (error) {
        console.error('Error saving city:', error);
        handleNext(); // Continue anyway
      }
    } else {
      handleNext();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
          <button
            onClick={onSkip}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>

          <h2 className="text-2xl font-bold mb-2">
            {step === 1 && "👋 Witaj w Garden App!"}
            {step === 2 && "🌍 Twoja lokalizacja"}
            {step === 3 && "🌱 Pierwsze poletko"}
            {step === 4 && "🌿 Pierwsza grządka"}
            {step === 5 && "✨ Poznaj możliwości!"}
          </h2>
          <p className="text-green-100">
            Krok {step} z {totalSteps}
          </p>

          {/* Progress bar */}
          <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
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

          {/* Step 2: Location */}
          {step === 2 && (
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

              {formData.hasGeolocation ? (
                <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <Check className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <p className="text-green-800 dark:text-green-200 font-medium">
                    ✓ Lokalizacja ustawiona!
                  </p>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Wpisz miasto:
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="np. Warszawa"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: First Plot */}
          {step === 3 && (
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

          {/* Step 4: First Bed */}
          {step === 4 && (
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

          {/* Step 5: Features Showcase */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Zobacz co potrafi Garden App!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Aplikacja pełna wiedzy ogrodniczej - wszystko w jednym miejscu
                </p>
              </div>

              <div className="grid gap-3">
                {[
                  { icon: '📸', title: 'Galeria zdjęć', desc: 'Rób zdjęcia postępów i śledź wzrost roślin!' },
                  { icon: '🌙', title: 'Kalendarz księżycowy', desc: 'Siej i zbieraj w zgodzie z fazami księżyca!' },
                  { icon: '🤖', title: 'Automatyczne zadania', desc: 'Nie musisz pamiętać - aplikacja przypomni!' },
                  { icon: '🌤️', title: 'Prognozy pogody', desc: 'Zobacz pogodę dla Twojego ogrodu!' },
                  { icon: '🌱', title: 'Companion planting', desc: 'Aplikacja podpowie które rośliny lubią sąsiadować!' },
                  { icon: '📊', title: 'Statystyki i raporty', desc: 'Śledź plony i postępy w ogrodzie!' }
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
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onSkip}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Pomiń przewodnik
          </button>

          <div className="flex gap-2">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <ChevronLeft size={16} />
                Wstecz
              </button>
            )}

            <button
              onClick={step === 2 && !formData.hasGeolocation ? saveCity : handleNext}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {step === totalSteps ? 'Zakończ' : 'Dalej'}
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
