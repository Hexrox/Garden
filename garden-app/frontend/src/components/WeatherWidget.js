import React, { useState, useEffect } from 'react';
import axios from '../config/axios';

const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [moonPhase, setMoonPhase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationSet, setLocationSet] = useState(false);
  const [showForecast, setShowForecast] = useState(false);

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    try {
      setLoading(true);

      // Fazy księżyca NIE wymagają lokalizacji - pobieraj zawsze
      const moonRes = await axios.get('/api/calendar/moon/current').catch((err) => {
        console.error('Error fetching moon phase:', err);
        return null;
      });

      if (moonRes && moonRes.data && moonRes.data.moon) {
        // API returns {date, dateFormatted, moon: {...}, gardening: {...}}
        // Validate that moon object has required fields
        if (moonRes.data.moon.phaseName && moonRes.data.moon.illumination !== undefined) {
          // Restructure to flat format for easier access
          const moonData = {
            ...moonRes.data.moon,
            gardening: moonRes.data.gardening?.favorable || []
          };
          setMoonPhase(moonData);
        } else {
          console.error('Moon data incomplete:', moonRes.data.moon);
        }
      } else {
        console.error('Invalid moon API response:', moonRes?.data);
      }

      // Pogoda WYMAGA lokalizacji
      const [weatherRes, forecastRes] = await Promise.all([
        axios.get('/api/weather/recommendations'),
        axios.get('/api/weather/forecast').catch(() => null)
      ]);

      setWeather(weatherRes.data.currentWeather);
      setLocation(weatherRes.data.location);
      setRecommendations(weatherRes.data.recommendations);

      if (forecastRes) {
        setForecast(forecastRes.data);
      }

      setLocationSet(true);
      setError(null);
    } catch (err) {
      if (err.response?.status === 400) {
        setLocationSet(false);
        setError('Ustaw lokalizację w profilu aby zobaczyć pogodę');
      } else {
        setError('Nie można pobrać danych pogodowych');
      }
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (icon) => {
    const iconMap = {
      '01d': '☀️',
      '01n': '🌙',
      '02d': '⛅',
      '02n': '☁️',
      '03d': '☁️',
      '03n': '☁️',
      '04d': '☁️',
      '04n': '☁️',
      '09d': '🌧️',
      '09n': '🌧️',
      '10d': '🌦️',
      '10n': '🌧️',
      '11d': '⛈️',
      '11n': '⛈️',
      '13d': '❄️',
      '13n': '❄️',
      '50d': '🌫️',
      '50n': '🌫️'
    };
    return iconMap[icon] || '🌤️';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'medium':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-green-50 border-green-200 text-green-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!locationSet) {
    // Jeśli nie ma lokalizacji, pokaż komunikat + kalendarz księżycowy (który nie wymaga lokalizacji)
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 rounded-lg border-2 border-yellow-200 p-6">
          <div className="flex items-start">
            <span className="text-3xl mr-3">📍</span>
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">
                Ustaw lokalizację
              </h3>
              <p className="text-yellow-800 mb-3">
                Aby zobaczyć pogodę i rekomendacje, ustaw swoją lokalizację w profilu
              </p>
              <a
                href="/profile"
                className="inline-block bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition"
              >
                Przejdź do profilu
              </a>
            </div>
          </div>
        </div>

        {/* Faza księżyca - NIE wymaga lokalizacji */}
        {moonPhase && moonPhase.phaseName && (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg shadow-md p-4 border-2 border-indigo-200">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <span className="text-2xl mr-2">{moonPhase.emoji}</span>
              Kalendarz Księżycowy
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Faza:</span>
                <span className="font-semibold text-indigo-900">{moonPhase.phaseName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Oświetlenie:</span>
                <span className="font-semibold text-indigo-900">{moonPhase.illumination}%</span>
              </div>
              {moonPhase.gardening && moonPhase.gardening.length > 0 && (
                <div className="mt-3 pt-3 border-t border-indigo-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Rekomendacje:</p>
                  <div className="space-y-1">
                    {moonPhase.gardening.map((tip, idx) => (
                      <div key={idx} className="text-xs text-gray-600 flex items-start">
                        <span className="mr-1">🌱</span>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg border-2 border-red-200 p-4 text-center">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchWeather}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Aktualna pogoda */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Pogoda</h3>
            {location && location.city && (
              <p className="text-sm text-gray-600 flex items-center mt-1">
                <span className="mr-1">📍</span>
                {location.city}
              </p>
            )}
          </div>
          <button
            onClick={fetchWeather}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            🔄 Odśwież
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-6xl">{getWeatherIcon(weather.icon)}</span>
            <div>
              <div className="text-4xl font-bold text-gray-900">
                {weather.temperature}°C
              </div>
              <div className="text-sm text-gray-600 capitalize">
                {weather.description}
              </div>
            </div>
          </div>

          <div className="text-right space-y-1 text-sm">
            <div className="text-gray-600">
              Odczuwalna: <span className="font-semibold">{weather.feelsLike}°C</span>
            </div>
            <div className="text-gray-600">
              Wiatr: <span className="font-semibold">{weather.windSpeed} km/h</span>
            </div>
            <div className="text-gray-600">
              Wilgotność: <span className="font-semibold">{weather.humidity}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Prognoza 5-dniowa */}
      {forecast && forecast.daily && forecast.daily.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <button
            onClick={() => setShowForecast(!showForecast)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition"
          >
            <h4 className="font-semibold text-gray-800">Prognoza 5-dniowa</h4>
            <span className="text-gray-500">{showForecast ? '▲' : '▼'}</span>
          </button>

          {showForecast && (
            <div className="p-4 pt-0 space-y-2">
              {forecast.daily.slice(0, 5).map((day, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{getWeatherIcon(day.icon)}</span>
                    <div>
                      <div className="font-medium text-gray-900">{day.date}</div>
                      <div className="text-xs text-gray-600 capitalize">{day.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {day.tempMin}° / {day.tempMax}°C
                    </div>
                    <div className="text-xs text-gray-600">
                      💧 {day.precipProbability}% | 💨 {day.avgWind} km/h
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Alerty */}
      {recommendations && recommendations.alerts && recommendations.alerts.length > 0 && (
        <div className="space-y-2">
          {recommendations.alerts.map((alert, index) => (
            <div
              key={index}
              className={`rounded-lg border-2 p-4 ${getPriorityColor(alert.priority)}`}
            >
              <div className="flex items-start">
                <span className="text-2xl mr-3">{alert.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold mb-1">{alert.message}</div>
                  <div className="text-sm">{alert.details}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rekomendacje */}
      {recommendations && recommendations.recommendations && recommendations.recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <h4 className="font-semibold text-gray-800 mb-3">Rekomendacje</h4>
          <div className="space-y-2">
            {recommendations.recommendations.map((rec, index) => (
              <div
                key={index}
                className={`rounded-lg border p-3 ${getPriorityColor(rec.priority)}`}
              >
                <div className="flex items-start">
                  <span className="text-xl mr-2">{rec.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{rec.message}</div>
                    <div className="text-xs mt-1 opacity-90">{rec.details}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Faza księżyca */}
      {moonPhase && moonPhase.phaseName && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg shadow-md p-4 border-2 border-indigo-200">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
            <span className="text-2xl mr-2">{moonPhase.emoji}</span>
            Kalendarz Księżycowy
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Faza:</span>
              <span className="font-semibold text-indigo-900">{moonPhase.phaseName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Oświetlenie:</span>
              <span className="font-semibold text-indigo-900">{moonPhase.illumination}%</span>
            </div>
            {moonPhase.gardening && moonPhase.gardening.length > 0 && (
              <div className="mt-3 pt-3 border-t border-indigo-200">
                <p className="text-xs font-semibold text-gray-700 mb-2">Rekomendacje:</p>
                <div className="space-y-1">
                  {moonPhase.gardening.map((tip, idx) => (
                    <div key={idx} className="text-xs text-gray-600 flex items-start">
                      <span className="mr-1">🌱</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Podsumowanie */}
      {recommendations && recommendations.summary && (
        <div className="bg-gray-50 rounded-lg p-3 text-center text-sm text-gray-600">
          {recommendations.summary}
        </div>
      )}
    </div>
  );
};

export default WeatherWidget;
