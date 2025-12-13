import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../config/axios';
import { useAuth } from '../context/AuthContext';
import { Share2, Eye, Check, X, Image as ImageIcon, TrendingUp, Users, Calendar } from 'lucide-react';

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
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [searchingCity, setSearchingCity] = useState(false);

  // Public profile state
  const [publicProfile, setPublicProfile] = useState({
    username: '',
    displayName: '',
    enabled: false,
    bio: '',
    coverPhotoId: null,
    profilePhoto: null,
    socialInstagram: '',
    showStats: true,
    showTimeline: true,
    showGallery: true,
    showBadges: true
  });
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [savingPublic, setSavingPublic] = useState(false);
  const [publicMessage, setPublicMessage] = useState({ type: '', text: '' });
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);
  const [availablePhotos, setAvailablePhotos] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [originalUsername, setOriginalUsername] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  // Load analytics when public profile is enabled
  useEffect(() => {
    if (publicProfile.enabled && publicProfile.username) {
      loadAnalytics();
    }
  }, [publicProfile.enabled, publicProfile.username]);

  // Debounce city search
  useEffect(() => {
    if (location.city.length >= 2) {
      const timer = setTimeout(() => {
        searchPolishCities(location.city);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setCitySuggestions([]);
    }
  }, [location.city]);

  // Debounce username validation
  useEffect(() => {
    if (publicProfile.username.length >= 3) {
      const timer = setTimeout(() => {
        checkUsernameAvailability(publicProfile.username);
      }, 500);
      return () => clearTimeout(timer);
    } else if (publicProfile.username.length > 0 && publicProfile.username.length < 3) {
      setUsernameAvailable(false);
    } else {
      setUsernameAvailable(null);
    }
  }, [publicProfile.username]);

  const loadAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const response = await axios.get('/api/profile/public/stats');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

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

      // Load public profile settings
      const publicResponse = await axios.get('/api/profile/public');
      if (publicResponse.data) {
        setPublicProfile({
          username: publicResponse.data.username || '',
          displayName: publicResponse.data.displayName || '',
          enabled: publicResponse.data.enabled || false,
          bio: publicResponse.data.bio || '',
          coverPhotoId: publicResponse.data.coverPhotoId || null,
          profilePhoto: publicResponse.data.profilePhoto || null,
          socialInstagram: publicResponse.data.socialInstagram || '',
          showStats: publicResponse.data.showStats !== undefined ? publicResponse.data.showStats : true,
          showTimeline: publicResponse.data.showTimeline !== undefined ? publicResponse.data.showTimeline : true,
          showGallery: publicResponse.data.showGallery !== undefined ? publicResponse.data.showGallery : true,
          showBadges: publicResponse.data.showBadges !== undefined ? publicResponse.data.showBadges : true
        });
        // Store original username for comparison
        setOriginalUsername(publicResponse.data.username || '');
        // If username exists, it's available (it's the user's current username)
        if (publicResponse.data.username) {
          setUsernameAvailable(true);
        }
      }

      setMessage({ type: '', text: '' });
      setProfileMessage({ type: '', text: '' });
      setPublicMessage({ type: '', text: '' });
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

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
        `limit=5&` +
        `addressdetails=1`,
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
    setLocation({
      city: place.display_name.split(',')[0],
      latitude: place.lat,
      longitude: place.lon
    });
    setCitySuggestions([]);
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

  // Public profile handlers
  const checkUsernameAvailability = async (username) => {
    // Validate format first
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
      setUsernameAvailable(false);
      return;
    }

    // If it's our own username, it's available
    if (username === originalUsername) {
      setUsernameAvailable(true);
      return;
    }

    try {
      setCheckingUsername(true);
      // Try to fetch the public profile with this username
      const response = await axios.get(`/api/g/${username}`);
      // If we get a response, username is taken by someone else
      setUsernameAvailable(false);
    } catch (error) {
      // If 404, username is available
      if (error.response?.status === 404) {
        setUsernameAvailable(true);
      } else {
        setUsernameAvailable(null);
      }
    } finally {
      setCheckingUsername(false);
    }
  };

  const sanitizeSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
      .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
      .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handlePublicProfileChange = (field, value) => {
    setPublicProfile(prev => ({ ...prev, [field]: value }));
    setPublicMessage({ type: '', text: '' });

    // Reset username availability when username changes
    if (field === 'username') {
      setUsernameAvailable(null);
    }
  };

  const handleSavePublicProfile = async (e) => {
    e.preventDefault();

    // Validate username
    if (publicProfile.enabled && !publicProfile.username) {
      setPublicMessage({
        type: 'error',
        text: 'Nazwa użytkownika jest wymagana'
      });
      return;
    }

    if (publicProfile.username && !/^[a-zA-Z0-9_-]{3,30}$/.test(publicProfile.username)) {
      setPublicMessage({
        type: 'error',
        text: 'Nazwa użytkownika może zawierać tylko litery, cyfry, _ i - (3-30 znaków)'
      });
      return;
    }

    if (publicProfile.bio && publicProfile.bio.length > 500) {
      setPublicMessage({
        type: 'error',
        text: 'Bio może mieć maksymalnie 500 znaków'
      });
      return;
    }

    try {
      setSavingPublic(true);
      const response = await axios.post('/api/profile/public', publicProfile);

      setPublicMessage({
        type: 'success',
        text: 'Ustawienia publicznego profilu zapisane!'
      });

      // Reload to get updated data
      setTimeout(() => {
        loadUserData();
      }, 1000);
    } catch (error) {
      setPublicMessage({
        type: 'error',
        text: error.response?.data?.error || 'Błąd zapisywania ustawień'
      });
    } finally {
      setSavingPublic(false);
    }
  };

  const handleSelectCoverPhoto = async () => {
    try {
      const response = await axios.get('/api/profile/public/photos/available');
      setAvailablePhotos(response.data);
      setShowPhotoSelector(true);
    } catch (error) {
      console.error('Error loading photos:', error);
      setPublicMessage({
        type: 'error',
        text: 'Błąd wczytywania zdjęć'
      });
    }
  };

  const handleRemoveCoverPhoto = () => {
    setPublicProfile(prev => ({ ...prev, coverPhotoId: null }));
  };

  const handleSelectProfilePhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('photo', file);

      try {
        const res = await axios.post('/api/profile/photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setPublicProfile(prev => ({ ...prev, profilePhoto: res.data.photoPath }));
        setPublicMessage({
          type: 'success',
          text: 'Zdjęcie profilowe zostało zaktualizowane!'
        });
      } catch (err) {
        console.error('Error uploading profile photo:', err);
        setPublicMessage({
          type: 'error',
          text: err.response?.data?.error || 'Błąd podczas uploadowania zdjęcia'
        });
      }
    };
    input.click();
  };

  const handleRemoveProfilePhoto = async () => {
    try {
      await axios.delete('/api/profile/photo');
      setPublicProfile(prev => ({ ...prev, profilePhoto: null }));
      setPublicMessage({
        type: 'success',
        text: 'Zdjęcie profilowe zostało usunięte'
      });
    } catch (err) {
      console.error('Error removing profile photo:', err);
      setPublicMessage({
        type: 'error',
        text: err.response?.data?.error || 'Błąd podczas usuwania zdjęcia'
      });
    }
  };

  const handleOpenPublicProfile = () => {
    if (publicProfile.username) {
      window.open(`/g/${publicProfile.username}`, '_blank');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await axios.delete('/api/auth/account');
      alert('Konto zostało oznaczone do usunięcia. Sprawdź swoją skrzynkę email aby je przywrócić w ciągu 30 dni.');
      // Wyloguj użytkownika
      localStorage.removeItem('token');
      window.location.href = '/login';
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Wystąpił błąd podczas usuwania konta');
    }
  };

  const getCoverPhotoPath = () => {
    if (!publicProfile.coverPhotoId) return null;
    const photo = availablePhotos.find(p => p.id === publicProfile.coverPhotoId);
    return photo ? photo.path : null;
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
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Miasto (wyszukaj lub wpisz współrzędne poniżej)
              </label>
              <input
                type="text"
                value={location.city}
                onChange={(e) => handleLocationChange('city', e.target.value)}
                placeholder="Zacznij wpisywać nazwę miasta..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {citySuggestions.map((place, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectCity(place)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {place.display_name.split(',')[0]}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {place.display_name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        📍 {parseFloat(place.lat).toFixed(4)}, {parseFloat(place.lon).toFixed(4)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
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

      {/* Public Profile Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Share2 size={20} className="text-green-600 dark:text-green-400" />
              Udostępnianie - Poznaj mój ogród
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Stwórz publiczną wizytówkę swojego ogrodu, którą możesz udostępnić znajomym
            </p>
          </div>
        </div>

        <form onSubmit={handleSavePublicProfile} className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div>
              <label className="text-sm font-semibold text-gray-900 dark:text-white">
                Profil publiczny {publicProfile.enabled ? 'WŁĄCZONY' : 'WYŁĄCZONY'}
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {publicProfile.enabled
                  ? 'Twój ogród jest widoczny publicznie'
                  : 'Tylko Ty możesz zobaczyć swój ogród'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handlePublicProfileChange('enabled', !publicProfile.enabled)}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                publicProfile.enabled
                  ? 'bg-green-600 dark:bg-green-500'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  publicProfile.enabled ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nazwa wyświetlana *
            </label>
            <input
              type="text"
              value={publicProfile.displayName}
              onChange={(e) => handlePublicProfileChange('displayName', e.target.value)}
              placeholder="np. Ogród Pokazowy"
              maxLength={50}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Ta nazwa będzie wyświetlana na Twoim profilu publicznym
            </p>
          </div>

          {/* Username (URL Slug) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Adres profilu (URL) *
            </label>
            <div className="relative">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  gardenapp.pl/g/
                </span>
                <input
                  type="text"
                  value={publicProfile.username}
                  onChange={(e) => {
                    const sanitized = sanitizeSlug(e.target.value);
                    handlePublicProfileChange('username', sanitized);
                  }}
                  placeholder="twoja-nazwa"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  pattern="[a-zA-Z0-9_\-]{3,30}"
                  title="3-30 znaków: litery, cyfry, _ lub -"
                />
              </div>

              {/* Validation feedback */}
              {checkingUsername && (
                <div className="absolute right-3 top-2 text-gray-400">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
              {!checkingUsername && usernameAvailable === true && publicProfile.username && (
                <div className="absolute right-3 top-2">
                  <Check size={20} className="text-green-600 dark:text-green-400" />
                </div>
              )}
              {!checkingUsername && usernameAvailable === false && publicProfile.username && (
                <div className="absolute right-3 top-2">
                  <X size={20} className="text-red-600 dark:text-red-400" />
                </div>
              )}
            </div>

            {publicProfile.username && usernameAvailable === true && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                <Check size={14} /> Nazwa dostępna!
              </p>
            )}
            {publicProfile.username && usernameAvailable === false && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                <X size={14} /> Nazwa zajęta lub nieprawidłowa (3-30 znaków: litery, cyfry, _ lub -)
              </p>
            )}
            {!publicProfile.username && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                3-30 znaków: litery, cyfry, podkreślnik (_) lub myślnik (-)
              </p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bio / Opis ogrodu
            </label>
            <textarea
              value={publicProfile.bio}
              onChange={(e) => handlePublicProfileChange('bio', e.target.value)}
              placeholder="Opowiedz o swoim ogrodzie... 🌱"
              rows={4}
              maxLength={500}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Krótki opis który zobaczy każdy odwiedzający
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {publicProfile.bio.length}/500
              </p>
            </div>
          </div>

          {/* Instagram Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Link do Instagrama (opcjonalnie)
            </label>
            <input
              type="text"
              value={publicProfile.socialInstagram}
              onChange={(e) => handlePublicProfileChange('socialInstagram', e.target.value)}
              placeholder="https://instagram.com/twoj_profil"
              maxLength={200}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Link pojawi się jako ikona na Twoim publicznym profilu
            </p>
          </div>

          {/* Profile Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Zdjęcie profilowe
            </label>
            {publicProfile.profilePhoto ? (
              <div className="relative inline-block">
                <img
                  src={`/${publicProfile.profilePhoto}`}
                  alt="Profile"
                  className="w-32 h-32 object-cover rounded-full border-4 border-gray-200 dark:border-gray-700"
                />
                <button
                  type="button"
                  onClick={handleRemoveProfilePhoto}
                  className="absolute top-0 right-0 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow-lg"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSelectProfilePhoto}
                className="w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-full flex flex-col items-center justify-center gap-2 hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition"
              >
                <ImageIcon size={24} className="text-gray-400 dark:text-gray-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400 text-center px-2">
                  Dodaj zdjęcie
                </span>
              </button>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Zdjęcie będzie wyświetlane jako avatar na Twoim profilu publicznym
            </p>
          </div>

          {/* Cover Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Zdjęcie okładkowe
            </label>
            {getCoverPhotoPath() ? (
              <div className="relative">
                <img
                  src={`/${getCoverPhotoPath()}`}
                  alt="Cover"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleRemoveCoverPhoto}
                  className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSelectCoverPhoto}
                className="w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition"
              >
                <ImageIcon size={32} className="text-gray-400 dark:text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Kliknij aby wybrać zdjęcie okładkowe
                </span>
              </button>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Zdjęcie będzie wyświetlane na górze Twojego publicznego profilu
            </p>
          </div>

          {/* Visibility Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Co chcesz pokazać?
            </label>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">📊 Statystyki</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Liczba grządek, roślin, plonów</p>
                </div>
                <input
                  type="checkbox"
                  checked={publicProfile.showStats}
                  onChange={(e) => handlePublicProfileChange('showStats', e.target.checked)}
                  className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">🌱 Co rośnie teraz</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Oś czasu aktualnych upraw</p>
                </div>
                <input
                  type="checkbox"
                  checked={publicProfile.showTimeline}
                  onChange={(e) => handlePublicProfileChange('showTimeline', e.target.checked)}
                  className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">📸 Galeria zdjęć</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Wybrane zdjęcia z galerii</p>
                </div>
                <input
                  type="checkbox"
                  checked={publicProfile.showGallery}
                  onChange={(e) => handlePublicProfileChange('showGallery', e.target.checked)}
                  className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer opacity-50">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">🏆 Odznaki</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Wkrótce!</p>
                </div>
                <input
                  type="checkbox"
                  checked={publicProfile.showBadges}
                  onChange={(e) => handlePublicProfileChange('showBadges', e.target.checked)}
                  disabled
                  className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {publicProfile.enabled && publicProfile.username && (
              <button
                type="button"
                onClick={handleOpenPublicProfile}
                className="flex-1 px-6 py-3 border-2 border-green-600 dark:border-green-500 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition font-medium flex items-center justify-center gap-2"
              >
                <Eye size={18} />
                Podgląd profilu
              </button>
            )}

            <button
              type="submit"
              disabled={savingPublic || (publicProfile.enabled && publicProfile.username.length > 0 && usernameAvailable === false)}
              className="flex-1 px-6 py-3 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-800 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingPublic ? 'Zapisywanie...' : 'Zapisz ustawienia'}
            </button>
          </div>
        </form>

        {publicMessage.text && (
          <div
            className={`mt-4 p-4 rounded-lg ${
              publicMessage.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
            }`}
          >
            {publicMessage.text}
          </div>
        )}

        {publicProfile.enabled && publicProfile.username && (
          <>
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                🔗 Twój publiczny link:
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-700 rounded text-xs sm:text-sm text-blue-600 dark:text-blue-300 font-mono break-all">
                  {window.location.origin}/g/{publicProfile.username}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/g/${publicProfile.username}`);
                    setPublicMessage({ type: 'success', text: 'Link skopiowany!' });
                    setTimeout(() => setPublicMessage({ type: '', text: '' }), 2000);
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-800 transition text-sm font-medium whitespace-nowrap"
                >
                  Kopiuj
                </button>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                Udostępnij ten link znajomym lub dodaj do swojego bio na Instagramie! 📱
              </p>
            </div>

            {/* Analytics Widget */}
            <div className="mt-6 p-6 bg-white dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingUp size={20} className="text-purple-600 dark:text-purple-400" />
                  Statystyki profilu
                </h3>
                {!loadingAnalytics && (
                  <button
                    onClick={loadAnalytics}
                    className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition"
                  >
                    Odśwież
                  </button>
                )}
              </div>

              {loadingAnalytics ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 dark:border-purple-400"></div>
                </div>
              ) : analytics ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-600 dark:bg-purple-700 rounded-lg">
                        <Eye size={20} className="text-white" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {analytics.totalViews || 0}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Wszystkie wyświetlenia
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-100 dark:border-green-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-600 dark:bg-green-700 rounded-lg">
                        <Calendar size={20} className="text-white" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {analytics.viewsLast7Days || 0}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Ostatnie 7 dni
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600 dark:bg-blue-700 rounded-lg">
                        <Users size={20} className="text-white" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {analytics.viewsLast30Days || 0}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Ostatnie 30 dni
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-sm text-center py-4">
                  Brak danych analitycznych
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Security & Account Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Bezpieczeństwo i Konto
        </h2>

        <div className="space-y-6">
          {/* Change Password */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Zmiana hasła
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Możesz zresetować swoje hasło używając linku wysłanego na email.
            </p>
            <Link
              to="/forgot-password"
              className="inline-flex items-center px-4 py-2 border-2 border-green-600 dark:border-green-500 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            >
              Zmień hasło
            </Link>
          </div>

          {/* Delete Account */}
          <div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-medium text-red-900 dark:text-red-200 mb-2">
                ⚠️ Strefa niebezpieczna
              </h3>
              <p className="text-sm text-red-800 dark:text-red-300 mb-2">
                Usunięcie konta spowoduje:
              </p>
              <ul className="text-sm text-red-800 dark:text-red-300 list-disc list-inside space-y-1 mb-3">
                <li>Oznaczenie konta do usunięcia (30 dni na przywrócenie)</li>
                <li>Ukrycie wszystkich Twoich danych</li>
                <li>Po 30 dniach: permanentne usunięcie wszystkich danych</li>
              </ul>
              <p className="text-xs text-red-700 dark:text-red-400">
                Otrzymasz email z linkiem do przywrócenia konta.
              </p>
            </div>

            <button
              onClick={() => {
                if (window.confirm('Czy na pewno chcesz usunąć swoje konto? Będziesz mieć 30 dni na przywrócenie.')) {
                  handleDeleteAccount();
                }
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Usuń moje konto
            </button>
          </div>
        </div>
      </div>

      {/* Photo Selector Modal */}
      {showPhotoSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Wybierz zdjęcie okładkowe
              </h3>
              <button
                onClick={() => setShowPhotoSelector(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <X size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto flex-1">
              {availablePhotos.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Nie masz jeszcze żadnych zdjęć w galerii
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    Dodaj zdjęcia do swoich grządek, a następnie będziesz mógł wybrać okładkę
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {availablePhotos.map((photo) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => {
                        setPublicProfile(prev => ({ ...prev, coverPhotoId: photo.id }));
                        setShowPhotoSelector(false);
                      }}
                      className={`relative aspect-square overflow-hidden rounded-lg border-2 transition ${
                        publicProfile.coverPhotoId === photo.id
                          ? 'border-green-600 dark:border-green-400 ring-2 ring-green-600 dark:ring-green-400'
                          : 'border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-600'
                      }`}
                    >
                      <img
                        src={`/${photo.path}`}
                        alt={photo.caption || 'Photo'}
                        className="w-full h-full object-cover"
                      />
                      {publicProfile.coverPhotoId === photo.id && (
                        <div className="absolute inset-0 bg-green-600 bg-opacity-20 flex items-center justify-center">
                          <div className="bg-green-600 dark:bg-green-500 text-white rounded-full p-2">
                            <Check size={20} />
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                        <p className="text-xs text-white line-clamp-1">
                          {photo.plantName || photo.plotName || 'Bez nazwy'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              {publicProfile.coverPhotoId && (
                <button
                  type="button"
                  onClick={() => {
                    setPublicProfile(prev => ({ ...prev, coverPhotoId: null }));
                    setShowPhotoSelector(false);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Usuń okładkę
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowPhotoSelector(false)}
                className="px-6 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-800 transition"
              >
                Gotowe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default Profile;
