import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const [location, setLocation] = useState({
    city: '',
    latitude: '',
    longitude: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      // Lokalizacja jest przechowywana w users table
      setMessage({ type: '', text: '' });
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

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Profil</h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">
          Zarządzaj swoim profilem i ustawieniami
        </p>
      </div>

      {/* User Info */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informacje o koncie</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nazwa użytkownika
            </label>
            <div className="text-gray-900 font-medium">{user?.username}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="text-gray-900 font-medium">{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Location Settings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Lokalizacja (dla pogody)
        </h2>

        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">💡 Wskazówka:</span> Ustaw swoją lokalizację aby zobaczyć
            pogodę i rekomendacje ogrodnicze na Dashboardzie
          </p>
        </div>

        <form onSubmit={handleSaveLocation} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Miasto (opcjonalne)
            </label>
            <input
              type="text"
              value={location.city}
              onChange={(e) => handleLocationChange('city', e.target.value)}
              placeholder="np. Warszawa"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Szerokość geograficzna *
              </label>
              <input
                type="number"
                step="0.000001"
                value={location.latitude}
                onChange={(e) => handleLocationChange('latitude', e.target.value)}
                placeholder="np. 52.229676"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Zakres: -90 do 90</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Długość geograficzna *
              </label>
              <input
                type="number"
                step="0.000001"
                value={location.longitude}
                onChange={(e) => handleLocationChange('longitude', e.target.value)}
                placeholder="np. 21.012229"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Zakres: -180 do 180</p>
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
                ? 'bg-green-50 border border-green-200 text-green-800'
                : message.type === 'error'
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-blue-50 border border-blue-200 text-blue-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Jak znaleźć współrzędne?
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>1. Kliknij "Użyj mojej lokalizacji" aby pobrać automatycznie</li>
            <li>2. LUB wejdź na Google Maps, kliknij prawym na swoją lokalizację i skopiuj współrzędne</li>
            <li>3. LUB wpisz w Google: "Współrzędne [nazwa miasta]"</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Profile;
