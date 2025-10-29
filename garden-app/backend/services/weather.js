const axios = require('axios');

/**
 * Weather Service - Integracja z OpenWeatherMap API
 * Funkcje: pobieranie pogody, cache, smart recommendations
 */

class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.cache = new Map();
    this.cacheDuration = 30 * 60 * 1000; // 30 minut cache
  }

  /**
   * Pobierz aktualną pogodę dla lokalizacji
   */
  async getCurrentWeather(lat, lon) {
    const cacheKey = `current_${lat}_${lon}`;

    // Sprawdź cache
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    if (!this.apiKey) {
      throw new Error('OPENWEATHER_API_KEY nie ustawiony w .env');
    }

    try {
      const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'metric',
          lang: 'pl'
        }
      });

      const data = this.formatCurrentWeather(response.data);

      // Zapisz do cache
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('Błąd pobierania pogody:', error.message);
      throw new Error('Nie można pobrać danych pogodowych');
    }
  }

  /**
   * Pobierz prognozę 5-dniową
   */
  async getForecast(lat, lon) {
    const cacheKey = `forecast_${lat}_${lon}`;

    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    if (!this.apiKey) {
      throw new Error('OPENWEATHER_API_KEY nie ustawiony w .env');
    }

    try {
      const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'metric',
          lang: 'pl'
        }
      });

      const data = this.formatForecast(response.data);

      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('Błąd pobierania prognozy:', error.message);
      throw new Error('Nie można pobrać prognozy pogody');
    }
  }

  /**
   * Formatuj dane pogodowe
   */
  formatCurrentWeather(data) {
    return {
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: Math.round(data.wind.speed * 3.6), // m/s na km/h
      windDirection: data.wind.deg,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      rain: data.rain ? data.rain['1h'] || 0 : 0,
      clouds: data.clouds.all,
      timestamp: data.dt,
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset
    };
  }

  /**
   * Formatuj prognozę 5-dniową (co 3h)
   */
  formatForecast(data) {
    return {
      city: data.city.name,
      forecast: data.list.slice(0, 16).map(item => ({ // Pierwsze 48h (16 pomiarów co 3h)
        timestamp: item.dt,
        date: new Date(item.dt * 1000).toLocaleDateString('pl-PL'),
        time: new Date(item.dt * 1000).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
        temperature: Math.round(item.main.temp),
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        rain: item.rain ? item.rain['3h'] || 0 : 0,
        windSpeed: Math.round(item.wind.speed * 3.6),
        humidity: item.main.humidity
      }))
    };
  }

  /**
   * Smart recommendations dla ogrodu
   */
  getGardenRecommendations(currentWeather, forecast) {
    const recommendations = [];
    const alerts = [];

    // 1. Rekomendacje oprysku
    const sprayConditions = this.checkSprayConditions(currentWeather, forecast);
    if (sprayConditions.suitable) {
      recommendations.push({
        type: 'spray',
        priority: 'high',
        icon: '🌿',
        message: 'Dobre warunki do oprysku',
        details: sprayConditions.reason
      });
    } else {
      recommendations.push({
        type: 'spray',
        priority: 'warning',
        icon: '⚠️',
        message: 'Niekorzystne warunki do oprysku',
        details: sprayConditions.reason
      });
    }

    // 2. Ostrzeżenia przymrozków
    const frostAlert = this.checkFrostRisk(forecast);
    if (frostAlert) {
      alerts.push({
        type: 'frost',
        priority: 'critical',
        icon: '🧊',
        message: 'UWAGA: Ryzyko przymrozków!',
        details: frostAlert
      });
    }

    // 3. Rekomendacje podlewania
    const wateringNeeded = this.checkWateringNeeds(currentWeather, forecast);
    if (wateringNeeded) {
      recommendations.push({
        type: 'watering',
        priority: 'medium',
        icon: '💧',
        message: wateringNeeded.message,
        details: wateringNeeded.details
      });
    }

    // 4. Ekstremalne temperatury
    const tempAlert = this.checkTemperatureAlerts(currentWeather);
    if (tempAlert) {
      alerts.push(tempAlert);
    }

    // 5. Silny wiatr
    if (currentWeather.windSpeed > 25) {
      alerts.push({
        type: 'wind',
        priority: 'high',
        icon: '💨',
        message: `Silny wiatr (${currentWeather.windSpeed} km/h)`,
        details: 'Nie opryskuj, nie podlewaj - woda i środki ochrony będą zdmuchiwane'
      });
    }

    return {
      recommendations,
      alerts,
      summary: this.generateSummary(currentWeather, recommendations, alerts)
    };
  }

  /**
   * Sprawdź warunki do oprysku
   */
  checkSprayConditions(weather, forecast) {
    // Idealne warunki: 10-25°C, wiatr <15km/h, brak deszczu przez 2h
    const temp = weather.temperature;
    const wind = weather.windSpeed;
    const rainSoon = this.checkRainInNextHours(forecast, 2);

    if (temp < 10) {
      return { suitable: false, reason: `Za zimno (${temp}°C). Optymalna temp: 10-25°C` };
    }
    if (temp > 25) {
      return { suitable: false, reason: `Za gorąco (${temp}°C). Optymalna temp: 10-25°C` };
    }
    if (wind > 15) {
      return { suitable: false, reason: `Za wietrznie (${wind} km/h). Max: 15 km/h` };
    }
    if (rainSoon) {
      return { suitable: false, reason: 'Deszcz w ciągu 2h zmyje środek ochrony' };
    }
    if (weather.rain > 0) {
      return { suitable: false, reason: 'Pada deszcz - poczekaj na przerwę' };
    }

    return {
      suitable: true,
      reason: `Optymalne warunki: ${temp}°C, wiatr ${wind} km/h, brak opadów`
    };
  }

  /**
   * Sprawdź ryzyko przymrozków
   */
  checkFrostRisk(forecast) {
    const nextNight = forecast.forecast.find(f => {
      const hour = new Date(f.timestamp * 1000).getHours();
      return hour >= 22 || hour <= 6; // Noc
    });

    if (nextNight && nextNight.temperature < 3) {
      if (nextNight.temperature < 0) {
        return `Przymrozki dziś w nocy (${nextNight.temperature}°C)! Przykryj wrażliwe rośliny NATYCHMIAST`;
      } else {
        return `Niska temperatura w nocy (${nextNight.temperature}°C). Rozważ przykrycie młodych roślin`;
      }
    }

    return null;
  }

  /**
   * Sprawdź potrzebę podlewania
   */
  checkWateringNeeds(weather, forecast) {
    // Sprawdź czy był deszcz w ostatnich 48h
    const recentRain = forecast.forecast.slice(0, 16).reduce((sum, f) => sum + f.rain, 0);
    const upcomingRain = this.checkRainInNextHours(forecast, 24);

    if (recentRain < 5 && !upcomingRain) {
      if (weather.temperature > 25) {
        return {
          message: 'Podlej rośliny - gorąco i brak deszczu',
          details: `Temperatura ${weather.temperature}°C, brak opadów. Rośliny potrzebują wody`
        };
      } else {
        return {
          message: 'Rozważ podlewanie - brak deszczu',
          details: 'Brak opadów w prognozie. Sprawdź wilgotność gleby'
        };
      }
    }

    if (upcomingRain) {
      return {
        message: 'Nie podlewaj - będzie padać',
        details: 'Deszcz w prognozie, rośliny same się napoją'
      };
    }

    return null;
  }

  /**
   * Sprawdź czy będzie deszcz w ciągu X godzin
   */
  checkRainInNextHours(forecast, hours) {
    const hoursInForecast = Math.min(Math.ceil(hours / 3), forecast.forecast.length);
    return forecast.forecast.slice(0, hoursInForecast).some(f => f.rain > 0.5);
  }

  /**
   * Alerty temperaturowe
   */
  checkTemperatureAlerts(weather) {
    if (weather.temperature > 35) {
      return {
        type: 'heat',
        priority: 'critical',
        icon: '🌡️',
        message: `Upał! ${weather.temperature}°C`,
        details: 'Podlej rośliny rano i wieczorem. Unikaj oprysku w południe'
      };
    }
    if (weather.temperature < 0) {
      return {
        type: 'cold',
        priority: 'critical',
        icon: '❄️',
        message: `Mróz! ${weather.temperature}°C`,
        details: 'Przykryj wszystkie wrażliwe rośliny. Nie podlewaj'
      };
    }
    return null;
  }

  /**
   * Generuj podsumowanie
   */
  generateSummary(weather, recommendations, alerts) {
    if (alerts.length > 0) {
      return alerts[0].message;
    }
    if (recommendations.length > 0) {
      return recommendations[0].message;
    }
    return `${weather.temperature}°C, ${weather.description}`;
  }

  /**
   * Sprawdź czy cache jest ważny
   */
  isCacheValid(key) {
    if (!this.cache.has(key)) return false;
    const cached = this.cache.get(key);
    return (Date.now() - cached.timestamp) < this.cacheDuration;
  }

  /**
   * Wyczyść cache
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new WeatherService();
