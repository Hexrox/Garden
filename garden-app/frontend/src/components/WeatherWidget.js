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
    const abortController = new AbortController();
    fetchWeather(abortController.signal);
    return () => abortController.abort();
  }, []);

  const fetchWeather = async (signal) => {
    try {
      setLoading(true);

      // Fazy księżyca NIE wymagają lokalizacji - pobieraj zawsze
      const moonRes = await axios.get('/api/calendar/moon/current', { signal }).catch(() => null);

      if (moonRes?.data?.moon?.phaseName && moonRes.data.moon.illumination !== undefined) {
        setMoonPhase({
          ...moonRes.data.moon,
          gardening: moonRes.data.gardening?.favorable || []
        });
      }

      // Pogoda WYMAGA lokalizacji
      const [weatherRes, forecastRes] = await Promise.all([
        axios.get('/api/weather/recommendations', { signal }),
        axios.get('/api/weather/forecast', { signal }).catch(() => null)
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
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
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
        return 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200';
      case 'high':
        return 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200';
      case 'medium':
        return 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200';
      default:
        return 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!locationSet) {
    // Jeśli nie ma lokalizacji, pokaż komunikat + kalendarz księżycowy (który nie wymaga lokalizacji)
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-200 dark:border-yellow-800 p-6">
          <div className="flex items-start">
            <span className="text-3xl mr-3">📍</span>
            <div>
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                Ustaw lokalizację
              </h3>
              <p className="text-yellow-800 dark:text-yellow-200 mb-3">
                Aby zobaczyć pogodę i rekomendacje, ustaw swoją lokalizację w profilu
              </p>
              <a
                href="/profile"
                className="inline-block bg-yellow-600 dark:bg-yellow-700 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 dark:hover:bg-yellow-800 transition"
              >
                Przejdź do profilu
              </a>
            </div>
          </div>
        </div>

        {/* Faza księżyca - NIE wymaga lokalizacji */}
        {moonPhase && moonPhase.phaseName && (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg shadow-md p-4 border-2 border-indigo-200 dark:border-indigo-800">
            <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
              <span className="text-2xl mr-2">{moonPhase.emoji}</span>
              Kalendarz Księżycowy
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300">Faza:</span>
                <span className="font-semibold text-indigo-900 dark:text-indigo-200">{moonPhase.phaseName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300">Oświetlenie:</span>
                <span className="font-semibold text-indigo-900 dark:text-indigo-200">{moonPhase.illumination}%</span>
              </div>
              {moonPhase.gardening && moonPhase.gardening.length > 0 && (
                <div className="mt-3 pt-3 border-t border-indigo-200 dark:border-indigo-800">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Rekomendacje:</p>
                  <div className="space-y-1">
                    {moonPhase.gardening.map((tip, idx) => (
                      <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-start">
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
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-200 dark:border-red-800 p-4 text-center">
        <p className="text-red-800 dark:text-red-200">{error}</p>
        <button
          onClick={() => fetchWeather()}
          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Aktualna pogoda */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Pogoda</h3>
            {location && location.city && (
              <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center mt-1">
                <span className="mr-1">📍</span>
                {location.city}
              </p>
            )}
          </div>
          <button
            onClick={() => fetchWeather()}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            🔄 Odśwież
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-6xl">{getWeatherIcon(weather.icon)}</span>
            <div>
              <div className="text-4xl font-bold text-gray-900 dark:text-white">
                {weather.temperature}°C
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                {weather.description}
              </div>
            </div>
          </div>

          <div className="text-right space-y-1 text-sm">
            <div className="text-gray-600 dark:text-gray-300">
              Odczuwalna: <span className="font-semibold">{weather.feelsLike}°C</span>
            </div>
            <div className="text-gray-600 dark:text-gray-300">
              Wiatr: <span className="font-semibold">{weather.windSpeed} km/h</span>
            </div>
            <div className="text-gray-600 dark:text-gray-300">
              Wilgotność: <span className="font-semibold">{weather.humidity}%</span>
            </div>
          </div>
        </div>

        {/* Alerty - przymrozki, upały itp. - ZARAZ PO POGODZIE */}
        {recommendations && recommendations.alerts && recommendations.alerts.length > 0 && (
          <div className="mt-4 space-y-2">
            {recommendations.alerts.map((alert, index) => (
              <div
                key={index}
                className={`rounded-lg border-2 p-3 ${getPriorityColor(alert.priority)}`}
              >
                <div className="flex items-start">
                  <span className="text-xl mr-2">{alert.icon}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-sm mb-1">{alert.message}</div>
                    <div className="text-xs">{alert.details}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prognoza 5-dniowa */}
      {forecast && forecast.daily && forecast.daily.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <button
            onClick={() => setShowForecast(!showForecast)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <h4 className="font-semibold text-gray-800 dark:text-white">Prognoza 5-dniowa</h4>
            <span className="text-gray-500 dark:text-gray-400">{showForecast ? '▲' : '▼'}</span>
          </button>

          {showForecast && (
            <div className="p-4 pt-0 space-y-2">
              {forecast.daily.slice(0, 5).map((day, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{getWeatherIcon(day.icon)}</span>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{day.date}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">{day.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {day.tempMin}° / {day.tempMax}°C
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      💧 {day.precipProbability}% | 💨 {day.avgWind} km/h
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rekomendacje */}
      {recommendations && recommendations.recommendations && recommendations.recommendations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Rekomendacje</h4>
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
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg shadow-md p-4 border-2 border-indigo-200 dark:border-indigo-800">
          <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
            <span className="text-2xl mr-2">{moonPhase.emoji}</span>
            Kalendarz Księżycowy
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Faza:</span>
              <span className="font-semibold text-indigo-900 dark:text-indigo-200">{moonPhase.phaseName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Oświetlenie:</span>
              <span className="font-semibold text-indigo-900 dark:text-indigo-200">{moonPhase.illumination}%</span>
            </div>
            {moonPhase.gardening && moonPhase.gardening.length > 0 && (
              <div className="mt-3 pt-3 border-t border-indigo-200 dark:border-indigo-800">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Rekomendacje:</p>
                <div className="space-y-1">
                  {moonPhase.gardening.map((tip, idx) => (
                    <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-start">
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
};

export default WeatherWidget;
