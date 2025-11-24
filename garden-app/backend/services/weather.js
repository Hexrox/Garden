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
   * Formatuj prognozę 5-dniową (co 3h) + daily summaries
   */
  formatForecast(data) {
    const allForecasts = data.list.map(item => ({
      timestamp: item.dt,
      date: new Date(item.dt * 1000).toLocaleDateString('pl-PL'),
      time: new Date(item.dt * 1000).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
      temperature: Math.round(item.main.temp),
      tempMin: Math.round(item.main.temp_min),
      tempMax: Math.round(item.main.temp_max),
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      rain: item.rain ? item.rain['3h'] || 0 : 0,
      windSpeed: Math.round(item.wind.speed * 3.6),
      humidity: item.main.humidity,
      clouds: item.clouds.all,
      pop: Math.round((item.pop || 0) * 100) // Probability of precipitation
    }));

    // Agreguj do daily summaries
    const dailySummaries = this.aggregateDailySummaries(allForecasts);

    return {
      city: data.city.name,
      hourly: allForecasts.slice(0, 24), // Pierwsze 72h (24 pomiary co 3h)
      daily: dailySummaries,
      forecast: allForecasts.slice(0, 16) // Backward compatibility
    };
  }

  /**
   * Agreguj prognozy godzinowe do dziennych podsumowań
   */
  aggregateDailySummaries(forecasts) {
    const dailyMap = new Map();

    forecasts.forEach(f => {
      const date = f.date;
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          temps: [],
          rains: [],
          winds: [],
          humidities: [],
          pops: [],
          icons: [],
          descriptions: []
        });
      }

      const day = dailyMap.get(date);
      day.temps.push(f.temperature);
      day.rains.push(f.rain);
      day.winds.push(f.windSpeed);
      day.humidities.push(f.humidity);
      day.pops.push(f.pop);
      day.icons.push(f.icon);
      day.descriptions.push(f.description);
    });

    return Array.from(dailyMap.values()).map(day => ({
      date: day.date,
      tempMin: Math.min(...day.temps),
      tempMax: Math.max(...day.temps),
      tempAvg: Math.round(day.temps.reduce((a, b) => a + b, 0) / day.temps.length),
      totalRain: day.rains.reduce((a, b) => a + b, 0).toFixed(1),
      avgWind: Math.round(day.winds.reduce((a, b) => a + b, 0) / day.winds.length),
      maxWind: Math.max(...day.winds),
      avgHumidity: Math.round(day.humidities.reduce((a, b) => a + b, 0) / day.humidities.length),
      precipProbability: Math.max(...day.pops),
      // Wybierz najbardziej reprezentatywną ikonę (środek dnia)
      icon: day.icons[Math.floor(day.icons.length / 2)],
      description: this.getMostCommonDescription(day.descriptions)
    }));
  }

  /**
   * Znajdź najczęstszy opis pogody
   */
  getMostCommonDescription(descriptions) {
    const counts = descriptions.reduce((acc, desc) => {
      acc[desc] = (acc[desc] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }

  /**
   * Smart recommendations dla ogrodu (z systemem blokerów)
   */
  getGardenRecommendations(currentWeather, forecast) {
    const recommendations = [];
    const alerts = [];
    const blockedTypes = new Set(); // Które typy rekomendacji są zablokowane

    // FAZA 1: ZAGROŻENIA KRYTYCZNE (mogą blokować rekomendacje)

    // 1. Ekstremalne temperatury (blokują oprysk i podlewanie)
    const tempAlert = this.checkTemperatureAlerts(currentWeather);
    if (tempAlert) {
      alerts.push(tempAlert);
      if (tempAlert.type === 'cold') {
        blockedTypes.add('spraying');
        blockedTypes.add('watering');
      }
      if (tempAlert.type === 'heat') {
        blockedTypes.add('spraying'); // Tylko w południe, ale dla uproszczenia blokujemy
      }
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
      blockedTypes.add('spraying');
      blockedTypes.add('watering');
    }

    // 3. Silny wiatr (blokuje oprysk i podlewanie)
    if (currentWeather.windSpeed > 25) {
      alerts.push({
        type: 'wind',
        priority: 'high',
        icon: '💨',
        message: `Silny wiatr (${currentWeather.windSpeed} km/h)`,
        details: 'Nie opryskuj, nie podlewaj - woda i środki ochrony będą zdmuchiwane'
      });
      blockedTypes.add('spraying');
      blockedTypes.add('watering');
    }

    // FAZA 2: REKOMENDACJE (tylko jeśli nie zablokowane)

    // 4. Rekomendacje oprysku (jeśli nie zablokowane)
    if (!blockedTypes.has('spraying')) {
      const sprayConditions = this.checkSprayConditions(currentWeather, forecast);
      if (sprayConditions.suitable && sprayConditions.today) {
        recommendations.push({
          type: 'spray',
          priority: 'high',
          icon: '🌿',
          message: 'Dobre warunki do oprysku DZIŚ',
          details: sprayConditions.reason
        });
      } else {
        // Dziś nie można, ale pokaż kiedy będzie można
        let message = 'Dziś nie opryskuj';
        let details = sprayConditions.reason;

        if (sprayConditions.bestDay) {
          message = `Dziś nie opryskuj - ${sprayConditions.reason}`;
          details = `→ Najlepszy dzień: ${sprayConditions.bestDay.dayName} (${sprayConditions.bestDay.date}) - ${sprayConditions.bestDay.conditions}`;
        }

        recommendations.push({
          type: 'spray',
          priority: 'warning',
          icon: '⚠️',
          message,
          details
        });
      }
    }

    // 5. Rekomendacje podlewania (jeśli nie zablokowane)
    if (!blockedTypes.has('watering')) {
      const wateringNeeded = this.checkWateringNeeds(currentWeather, forecast);
      if (wateringNeeded && !wateringNeeded.blocks) {
        recommendations.push({
          type: 'watering',
          priority: wateringNeeded.priority || 'medium',
          icon: '💧',
          message: wateringNeeded.message,
          details: wateringNeeded.details
        });
      }
    }

    return {
      recommendations,
      alerts,
      summary: this.generateSummary(currentWeather, recommendations, alerts)
    };
  }

  /**
   * Sprawdź warunki do oprysku (z kontekstem prognozy)
   */
  checkSprayConditions(weather, forecast) {
    // Idealne warunki: 10-25°C, wiatr <15km/h, brak deszczu przez 2h
    const temp = weather.temperature;
    const wind = weather.windSpeed;
    const rainSoon = this.checkRainInNextHours(forecast, 2);

    // Sprawdź czy dziś nadaje się do oprysku
    const todaySuitable = temp >= 10 && temp <= 25 && wind <= 15 && !rainSoon && weather.rain === 0;

    if (todaySuitable) {
      return {
        suitable: true,
        today: true,
        reason: `Optymalne warunki: ${temp}°C, wiatr ${wind} km/h, brak opadów`,
        bestDay: null
      };
    }

    // Jeśli dziś nie jest odpowiednie, znajdź najlepszy dzień w prognozie
    const bestDay = this.findBestSprayDayInForecast(forecast);

    // Ustal powód dlaczego dziś nie można
    let reason = '';
    if (temp < 10) {
      reason = `Za zimno dziś (${temp}°C)`;
    } else if (temp > 25) {
      reason = `Za gorąco dziś (${temp}°C)`;
    } else if (wind > 15) {
      reason = `Za wietrznie dziś (${wind} km/h)`;
    } else if (rainSoon || weather.rain > 0) {
      reason = 'Deszcz w prognozie lub pada';
    }

    return {
      suitable: false,
      today: false,
      reason,
      bestDay
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
   * Sprawdź potrzebę podlewania (NAJPIERW temperatura, potem deszcz)
   */
  checkWateringNeeds(weather, forecast) {
    const temp = weather.temperature;

    // PRIORYTET 1: Sprawdź temperaturę (zagrożenia)
    if (temp < 0) {
      return {
        message: 'NIE PODLEWAJ - mróz zniszczy rośliny',
        details: `Woda zamarznie i uszkodzi korzenie (${temp}°C)`,
        priority: 'critical',
        blocks: true // Blokuje inne rekomendacje podlewania
      };
    }

    if (temp >= 0 && temp < 5) {
      // Sprawdź czy będzie cieplej w prognozie
      const warmerDay = this.findWarmerDayInForecast(forecast, 10);
      if (warmerDay) {
        return {
          message: `Za zimno na podlewanie (${temp}°C)`,
          details: `Poczekaj do ${warmerDay.dayName} gdy będzie ${warmerDay.temp}°C`,
          priority: 'medium',
          blocks: false
        };
      } else {
        return {
          message: `Zimno (${temp}°C) - podlewaj tylko jeśli konieczne`,
          details: 'Rośliny potrzebują mniej wody w niskich temperaturach',
          priority: 'low',
          blocks: false
        };
      }
    }

    // PRIORYTET 2: Sprawdź deszcz i wilgotność (tylko gdy temp OK)
    const recentRain = forecast.forecast.slice(0, 16).reduce((sum, f) => sum + f.rain, 0);
    const upcomingRain = this.checkRainInNextHours(forecast, 24);

    if (upcomingRain) {
      return {
        message: 'Nie podlewaj - będzie padać',
        details: 'Deszcz w prognozie, rośliny same się napoją',
        priority: 'medium',
        blocks: false
      };
    }

    if (recentRain < 5 && !upcomingRain) {
      if (temp > 25) {
        return {
          message: 'Podlej rośliny - gorąco i brak deszczu',
          details: `Temperatura ${temp}°C, brak opadów. Rośliny potrzebują wody`,
          priority: 'high',
          blocks: false
        };
      } else if (temp > 15) {
        return {
          message: 'Rozważ podlewanie - brak deszczu',
          details: 'Brak opadów w prognozie. Sprawdź wilgotność gleby',
          priority: 'medium',
          blocks: false
        };
      }
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
   * Znajdź najlepszy dzień do oprysku w prognozie 5-dniowej
   */
  findBestSprayDayInForecast(forecast) {
    if (!forecast.daily || forecast.daily.length === 0) {
      return null;
    }

    const dayNames = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];

    // Szukaj pierwszego dnia z optymalnymi warunkami
    for (let i = 1; i < forecast.daily.length; i++) { // Zaczynamy od 1 (jutro)
      const day = forecast.daily[i];
      const temp = day.tempAvg;
      const wind = day.avgWind;
      const rain = day.totalRain;

      // Optymalne warunki: 12-20°C, wiatr <10 km/h, brak opadów
      const isOptimal = temp >= 12 && temp <= 20 && wind < 10 && rain < 0.5;
      // Dopuszczalne warunki: 10-25°C, wiatr <15 km/h, niewielkie opady
      const isGood = temp >= 10 && temp <= 25 && wind < 15 && rain < 2;

      if (isOptimal || isGood) {
        const date = new Date(day.date.split('.').reverse().join('-'));
        const dayName = dayNames[date.getDay()];
        const quality = isOptimal ? 'optymalne' : 'dobre';

        return {
          date: day.date,
          dayName,
          temp: day.tempAvg,
          wind: day.avgWind,
          conditions: `${quality} warunki: ${day.tempAvg}°C, wiatr ${day.avgWind} km/h, ${rain}mm deszczu`
        };
      }
    }

    // Jeśli nie ma idealnych warunków, znajdź najmniej zły dzień
    const bestAvailable = forecast.daily
      .slice(1)
      .map((day, index) => ({
        day,
        index: index + 1,
        score: this.calculateSprayScore(day)
      }))
      .sort((a, b) => b.score - a.score)[0];

    if (bestAvailable && bestAvailable.score > 0) {
      const day = bestAvailable.day;
      const date = new Date(day.date.split('.').reverse().join('-'));
      const dayName = dayNames[date.getDay()];

      return {
        date: day.date,
        dayName,
        temp: day.tempAvg,
        wind: day.avgWind,
        conditions: `możliwe warunki: ${day.tempAvg}°C, wiatr ${day.avgWind} km/h`
      };
    }

    return null;
  }

  /**
   * Oblicz score dla dnia do oprysku (im wyższy tym lepiej)
   */
  calculateSprayScore(day) {
    let score = 100;

    // Temperatura
    if (day.tempAvg < 10) score -= 50;
    else if (day.tempAvg > 25) score -= 40;
    else if (day.tempAvg >= 12 && day.tempAvg <= 20) score += 20;

    // Wiatr
    if (day.avgWind > 20) score -= 50;
    else if (day.avgWind > 15) score -= 30;
    else if (day.avgWind < 10) score += 20;

    // Deszcz
    if (day.totalRain > 5) score -= 50;
    else if (day.totalRain > 2) score -= 20;
    else if (day.totalRain < 0.5) score += 10;

    return score;
  }

  /**
   * Znajdź cieplejszy dzień w prognozie
   */
  findWarmerDayInForecast(forecast, minTemp) {
    if (!forecast.daily || forecast.daily.length === 0) {
      return null;
    }

    const dayNames = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];

    // Szukaj pierwszego dnia z temperaturą >= minTemp
    for (let i = 1; i < forecast.daily.length; i++) {
      const day = forecast.daily[i];
      if (day.tempAvg >= minTemp) {
        const date = new Date(day.date.split('.').reverse().join('-'));
        const dayName = dayNames[date.getDay()];

        return {
          date: day.date,
          dayName,
          temp: day.tempAvg
        };
      }
    }

    return null;
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
