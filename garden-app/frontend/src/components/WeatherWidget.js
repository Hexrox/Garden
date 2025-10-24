import React, { useState, useEffect } from 'react';
import axios from 'axios';

const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationSet, setLocationSet] = useState(false);

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/weather/recommendations');
      setWeather(response.data.currentWeather);
      setRecommendations(response.data.recommendations);
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
    return (
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
          <h3 className="text-lg font-semibold text-gray-800">Pogoda</h3>
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
