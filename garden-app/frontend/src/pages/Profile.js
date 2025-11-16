import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const [location, setLocation] = useState({
    city: '',
    latitude: '',
    longitude: ''
  });
  const [profile, setProfile] = useState({
    hardiness_zone: '',
    first_frost_date: '',
    last_frost_date: '',
    location: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      // Load profile data including frost dates
      const response = await axios.get('/api/auth/profile');
      if (response.data) {
        setProfile({
          hardiness_zone: response.data.hardiness_zone || '',
          first_frost_date: response.data.first_frost_date || '',
          last_frost_date: response.data.last_frost_date || '',
          location: response.data.location || ''
        });
      }
      setMessage({ type: '', text: '' });
      setProfileMessage({ type: '', text: '' });
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (field, value) => {
    setLocation(prev => ({ ...prev, [field]: value }));
    setMessage({ type: '', text: '' });
  };

  const handleSaveLocation = async (e) => {
    e.preventDefault();

    if (!location.latitude || !location.longitude) {
      setMessage({
        type: 'error',
        text: 'Podaj współrzędne geograficzne'
      });
      return;
    }

    // Walidacja zakresów
    const lat = parseFloat(location.latitude);
    const lon = parseFloat(location.longitude);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setMessage({
        type: 'error',
        text: 'Nieprawidłowe współrzędne. Szerokość: -90 do 90, Długość: -180 do 180'
      });
      return;
    }

    try {
      setSaving(true);
      await axios.put('/api/weather/location', {
        latitude: lat,
        longitude: lon,
        city: location.city || null
      });

      setMessage({
        type: 'success',
        text: 'Lokalizacja zapisana! Odśwież Dashboard aby zobaczyć pogodę.'
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Błąd zapisywania lokalizacji'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage({
        type: 'error',
        text: 'Twoja przeglądarka nie obsługuje geolokalizacji'
      });
      return;
    }

    setMessage({
      type: 'info',
      text: 'Pobieranie lokalizacji...'
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
          city: location.city
        });
        setMessage({
          type: 'success',
          text: 'Lokalizacja pobrana! Kliknij "Zapisz" aby zachować.'
        });
      },
      (error) => {
        setMessage({
          type: 'error',
          text: 'Nie można pobrać lokalizacji. Sprawdź uprawnienia przeglądarki.'
        });
      }
    );
  };

  const handleProfileChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setProfileMessage({ type: '', text: '' });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    try {
      setSavingProfile(true);
      await axios.put('/api/auth/profile', profile);

      setProfileMessage({
        type: 'success',
        text: 'Profil zapisany pomyślnie!'
      });
    } catch (error) {
      setProfileMessage({
        type: 'error',
        text: error.response?.data?.error || 'Błąd zapisywania profilu'
      });
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Profil</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
            Zarządzaj swoim profilem i ustawieniami
          </p>
        </div>

        {/* User Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informacje o koncie</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nazwa użytkownika
              </label>
              <div className="text-gray-900 dark:text-white font-medium">{user?.username}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <div className="text-gray-900 dark:text-white font-medium">{user?.email}</div>
            </div>
          </div>
        </div>

        {/* Location Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Lokalizacja (dla pogody)
          </h2>

          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <span className="font-semibold">💡 Wskazówka:</span> Ustaw swoją lokalizację aby zobaczyć
              pogodę i rekomendacje ogrodnicze na Dashboardzie
            </p>
          </div>

          <form onSubmit={handleSaveLocation} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Miasto (opcjonalne)
              </label>
              <input
                type="text"
                value={location.city}
                onChange={(e) => handleLocationChange('city', e.target.value)}
                placeholder="np. Warszawa"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Szerokość geograficzna *
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={location.latitude}
                  onChange={(e) => handleLocationChange('latitude', e.target.value)}
                  placeholder="np. 52.229676"
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Zakres: -90 do 90</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Długość geograficzna *
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={location.longitude}
                  onChange={(e) => handleLocationChange('longitude', e.target.value)}
                  placeholder="np. 21.012229"
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Zakres: -180 do 180</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                📍 Użyj mojej lokalizacji
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex-1 sm:flex-none px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Zapisywanie...' : 'Zapisz lokalizację'}
              </button>
            </div>
          </form>

          {message.text && (
            <div
              className={`mt-4 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                  : message.type === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                  : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Jak znaleźć współrzędne?
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>1. Kliknij "Użyj mojej lokalizacji" aby pobrać automatycznie</li>
              <li>2. LUB wejdź na Google Maps, kliknij prawym na swoją lokalizację i skopiuj współrzędne</li>
              <li>3. LUB wpisz w Google: "Współrzędne [nazwa miasta]"</li>
            </ul>
          </div>
        </div>

      {/* Frost Dates & Hardiness Zone */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Strefy Mrozoodporności i Daty Przymrozków
        </h2>

        <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <p className="text-sm text-purple-800 dark:text-purple-200">
            <span className="font-semibold">🌱 Wskazówka:</span> Te informacje pomogą Ci planować sadzenie i chronić rośliny przed przymrozkami
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Lokalizacja ogólna
            </label>
            <input
              type="text"
              value={profile.location}
              onChange={(e) => handleProfileChange('location', e.target.value)}
              placeholder="np. Warszawa, Mazowieckie"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Strefa mrozoodporności
            </label>
            <select
              value={profile.hardiness_zone}
              onChange={(e) => handleProfileChange('hardiness_zone', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Wybierz strefę</option>
              <option value="6a">6a (-23.3°C do -20.6°C) - Północ Polski</option>
              <option value="6b">6b (-20.6°C do -17.8°C) - Centralna Polska</option>
              <option value="7a">7a (-17.8°C do -15.0°C) - Zachodnia Polska</option>
              <option value="7b">7b (-15.0°C do -12.2°C) - Południowy Zachód</option>
              <option value="8a">8a (-12.2°C do -9.4°C) - Wybrzeże</option>
              <option value="8b">8b (-9.4°C do -6.7°C) - Najcieplejsze rejony</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Strefa określa najniższą średnią temperaturę w Twojej okolicy
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ostatni przymrozek wiosenny
              </label>
              <input
                type="date"
                value={profile.last_frost_date}
                onChange={(e) => handleProfileChange('last_frost_date', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Kiedy zazwyczaj kończy się okres przymrozków wiosną
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pierwszy przymrozek jesienny
              </label>
              <input
                type="date"
                value={profile.first_frost_date}
                onChange={(e) => handleProfileChange('first_frost_date', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Kiedy zazwyczaj zaczynają się przymrozki jesienią
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {savingProfile ? 'Zapisywanie...' : 'Zapisz profil'}
          </button>
        </form>

        {profileMessage.text && (
          <div
            className={`mt-4 p-4 rounded-lg ${
              profileMessage.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
            }`}
          >
            {profileMessage.text}
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Typowe daty przymrozków w Polsce
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>🌸 Północ Polski: Ostatni przymrozek ~15 maja, Pierwszy ~1 października</li>
            <li>🌸 Centralna Polska: Ostatni przymrozek ~10 maja, Pierwszy ~15 października</li>
            <li>🌸 Południe Polski: Ostatni przymrozek ~1 maja, Pierwszy ~25 października</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Profile;
