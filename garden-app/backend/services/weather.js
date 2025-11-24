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

    // 1. Mróz i zimno - NOWA inteligentna funkcja (TERAZ + PRZYSZŁOŚĆ)
    const frostAlert = this.checkFrostAndColdAlerts(currentWeather, forecast);
    if (frostAlert) {
      alerts.push(frostAlert);
      // Mróz blokuje oprysk i podlewanie
      if (frostAlert.type === 'frost' || frostAlert.type === 'frost-warning') {
        blockedTypes.add('spraying');
        blockedTypes.add('watering');
      }
    }

    // 2. Upał (blokuje oprysk gdy >32°C)
    const heatAlert = this.checkTemperatureAlerts(currentWeather);
    if (heatAlert) {
      alerts.push(heatAlert);
      // Blokuj oprysk przy silnym upale (>32°C)
      if (heatAlert.type === 'severe-heat' || heatAlert.type === 'extreme-heat') {
        blockedTypes.add('spraying');
      }
    }

    // 3. Wiatr (3 poziomy: umiarkowany, silny, bardzo silny)
    const windAlert = this.checkWindConditions(currentWeather);
    if (windAlert) {
      alerts.push(windAlert);
      // Wiatr >14.4 km/h blokuje oprysk, >25 km/h blokuje też podlewanie
      if (windAlert.type === 'moderate-wind') {
        blockedTypes.add('spraying');
      } else if (windAlert.type === 'strong-wind' || windAlert.type === 'extreme-wind') {
        blockedTypes.add('spraying');
        blockedTypes.add('watering');
      }
    }

    // 4. Burze i grad
    const stormAlert = this.checkStormAndHailRisk(currentWeather);
    if (stormAlert) {
      alerts.push(stormAlert);
    }

    // 5. Wilgotność i choroby grzybowe
    const fungalAlert = this.checkHumidityAndFungalRisk(currentWeather, forecast);
    if (fungalAlert) {
      alerts.push(fungalAlert);
    }

    // 6. Gwałtowne zmiany temperatury
    const tempSwingAlert = this.checkTemperatureSwing(currentWeather, forecast);
    if (tempSwingAlert) {
      alerts.push(tempSwingAlert);
    }

    // 7. Susza (tylko w sezonie wegetacyjnym, nie w zimie)
    const droughtAlert = this.checkDroughtConditions(currentWeather, forecast);
    if (droughtAlert) {
      alerts.push(droughtAlert);
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
    // OPTYMALNE: 12-25°C (najlepiej 12-20°C), wiatr <4 m/s (14.4 km/h), brak deszczu 2-12h
    // PORA: rano (przed 10:00) lub wieczór (po 18:00)
    const temp = weather.temperature;
    const wind = weather.windSpeed;
    const rainSoon = this.checkRainInNextHours(forecast, 2);

    // Sprawdź czy dziś nadaje się do oprysku
    // Wiatr 14.4 km/h = 4 m/s (max dla oprysku)
    const todaySuitable = temp >= 12 && temp <= 25 && wind < 14.4 && !rainSoon && weather.rain === 0;

    if (todaySuitable) {
      // Optymalne warunki - dodaj poradę o porze
      const timeAdvice = (temp >= 12 && temp <= 20)
        ? 'Optymalna temp! Pryskaj rano (przed 10:00) lub wieczorem (po 18:00).'
        : 'Pryskaj wieczorem (po 18:00) gdy temperatura spadnie.';

      return {
        suitable: true,
        today: true,
        reason: `Dobre warunki: ${temp}°C, wiatr ${wind} km/h. ${timeAdvice}`,
        bestDay: null
      };
    }

    // Jeśli dziś nie jest odpowiednie, znajdź najlepszy dzień w prognozie
    const bestDay = this.findBestSprayDayInForecast(forecast);

    // Ustal szczegółowy powód dlaczego dziś nie można
    let reason = '';
    if (temp < 10) {
      reason = `Za zimno (${temp}°C) - środki nie działają, spowolniony metabolizm roślin`;
    } else if (temp < 12) {
      reason = `Niska temp (${temp}°C) - skuteczność obniżona. Poczekaj na ocieplenie`;
    } else if (temp > 25) {
      reason = `Za gorąco (${temp}°C) - środki parują zanim dotrą do rośliny. Utrata skuteczności`;
    } else if (wind >= 14.4) {
      reason = `Za wietrznie (${wind} km/h, max 14 km/h) - znoszenie środków, ryzyko zanieczyszczenia`;
    } else if (rainSoon || weather.rain > 0) {
      reason = 'Deszcz w ciągu 2h lub pada - preparat zostanie zmyty';
    }

    return {
      suitable: false,
      today: false,
      reason,
      bestDay
    };
  }

  /**
   * Inteligentny system alertów mrozowych (TERAZ + PRZYSZŁOŚĆ)
   * Zastępuje checkFrostRisk() i część checkTemperatureAlerts()
   */
  checkFrostAndColdAlerts(currentWeather, forecast) {
    const tempNow = currentWeather.temperature;
    const now = Date.now() / 1000; // Unix timestamp

    // Znajdź MIN temp w PRZYSZŁEJ nocy (następne 24h, tylko godziny nocne)
    const upcomingNightTemps = forecast.forecast
      .filter(f => {
        const hour = new Date(f.timestamp * 1000).getHours();
        const isNightHour = hour >= 22 || hour <= 6;
        const isFuture = f.timestamp > now; // KLUCZOWE: tylko przyszłość!
        const isNext24h = f.timestamp < (now + 24 * 60 * 60);
        return isNightHour && isFuture && isNext24h;
      })
      .map(f => f.temperature);

    const minNightTemp = upcomingNightTemps.length > 0
      ? Math.min(...upcomingNightTemps)
      : null;

    // PRZYPADEK 1: Mróz JUŻ JEST
    if (tempNow < 0) {
      if (minNightTemp !== null && minNightTemp < tempNow - 1) {
        // Będzie jeszcze zimniej (różnica >1°C)
        return {
          type: 'frost',
          priority: 'critical',
          icon: '❄️',
          message: `Mróz! ${tempNow}°C, w nocy ${minNightTemp}°C`,
          details: 'Przykryj wszystkie wrażliwe rośliny NATYCHMIAST. Nie podlewaj - woda zamarznie'
        };
      } else {
        // Stały mróz lub ocieplenie
        return {
          type: 'frost',
          priority: 'critical',
          icon: '❄️',
          message: `Mróz! ${tempNow}°C`,
          details: 'Przykryj wszystkie wrażliwe rośliny. Nie podlewaj'
        };
      }
    }

    // PRZYPADEK 2: OK teraz, ale BĘDZIE mróz w nocy
    if (minNightTemp !== null && minNightTemp < 0) {
      return {
        type: 'frost-warning',
        priority: 'critical',
        icon: '🧊',
        message: `UWAGA: Przymrozki dziś w nocy (${minNightTemp}°C)`,
        details: 'Przykryj rośliny PRZED WIECZOREM. Nie podlewaj wieczorem'
      };
    }

    // PRZYPADEK 3: Zimno teraz (0-3°C), będzie jeszcze zimniej
    if (tempNow >= 0 && tempNow < 3 && minNightTemp !== null && minNightTemp < tempNow - 1) {
      return {
        type: 'cold-warning',
        priority: 'high',
        icon: '🌡️',
        message: `Niska temperatura ${tempNow}°C, w nocy ${minNightTemp}°C`,
        details: 'Rozważ przykrycie młodych i wrażliwych roślin'
      };
    }

    return null;
  }

  /**
   * Sprawdź potrzebę podlewania (NAJPIERW temperatura, potem deszcz)
   * KIEDY: Rano (5-8) lub wieczorem (po 19:00). NIGDY 10-16!
   */
  checkWateringNeeds(weather, forecast) {
    const temp = weather.temperature;
    const now = Date.now() / 1000;

    // Sprawdź przymrozki tej nocy
    const nightFrost = forecast.forecast
      .filter(f => {
        const hour = new Date(f.timestamp * 1000).getHours();
        const isNight = hour >= 22 || hour <= 6;
        const isFuture = f.timestamp > now;
        return isNight && isFuture;
      })
      .some(f => f.temperature < 0);

    // PRIORYTET 1: Sprawdź temperaturę (zagrożenia)
    if (temp < 0) {
      return {
        message: 'NIE PODLEWAJ - mróz zniszczy rośliny',
        details: `Woda zamarznie i uszkodzi korzenie (${temp}°C). Rośliny nie pobierają wody przy mrozie`,
        priority: 'critical',
        blocks: true
      };
    }

    if (temp >= 0 && temp < 5) {
      const warmerDay = this.findWarmerDayInForecast(forecast, 10);
      if (warmerDay) {
        return {
          message: `Za zimno na podlewanie (${temp}°C)`,
          details: `Poczekaj do ${warmerDay.dayName} gdy będzie ${warmerDay.temp}°C. Rośliny słabo pobierają wodę`,
          priority: 'medium',
          blocks: false
        };
      } else {
        return {
          message: `Zimno (${temp}°C) - podlewaj tylko jeśli konieczne`,
          details: 'Rośliny potrzebują mniej wody w niskich temperaturach. Ograniąż podlewanie',
          priority: 'low',
          blocks: false
        };
      }
    }

    // Ostrzeżenie przed wieczornym podlewaniem gdy przymrozki w nocy
    if (nightFrost) {
      return {
        message: 'NIE PODLEWAJ WIECZOREM - przymrozki w nocy!',
        details: 'Podlej tylko RANO (5-8). Wieczorne podlewanie = woda zamarznie w tkankach roślin',
        priority: 'critical',
        blocks: false
      };
    }

    // PRIORYTET 2: Sprawdź deszcz
    const recentRain = forecast.forecast.slice(0, 16).reduce((sum, f) => sum + f.rain, 0);
    const upcomingRain = this.checkRainInNextHours(forecast, 24);

    if (upcomingRain) {
      return {
        message: 'Nie podlewaj - będzie padać',
        details: 'Deszcz w prognozie (< 24h). Rośliny same się napoją. Oszczędź wodę',
        priority: 'medium',
        blocks: false
      };
    }

    // PRIORYTET 3: Zalecenia podlewania (temp OK, bez deszczu)
    if (recentRain < 5 && !upcomingRain) {
      // UPAŁ (>32°C) - 2x dziennie
      if (temp > 32) {
        return {
          message: 'Podlewaj 2x dziennie - silny upał!',
          details: `${temp}°C! Rano (5-8) + wieczór (po 19:00). OBFICIE. NIGDY 10-16 - oparzenia liści! Gleba piaszczysta: może codziennie`,
          priority: 'critical',
          blocks: false
        };
      }

      // GORĄCO (25-32°C) - 1x dziennie
      if (temp > 25) {
        return {
          message: 'Podlej rośliny - gorąco i brak deszczu',
          details: `${temp}°C, brak opadów. Podlewaj RANO (5-8) lub WIECZOREM (po 19:00). Rzadziej ale OBFICIE (10-20L/m²). Mulczuj glebę!`,
          priority: 'high',
          blocks: false
        };
      }

      // CIEPŁO (15-25°C) - sprawdź glebę
      if (temp > 15) {
        return {
          message: 'Rozważ podlewanie - brak deszczu',
          details: 'Brak opadów w prognozie. Sprawdź wilgotność gleby. Gleba piaszczysta: częściej. Gleba gliniasta: rzadziej ale obficie (1-2x/tydz). RANO (5-8) najlepiej',
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
   * Alerty temperaturowe (TYLKO UPAŁ - mróz obsługuje checkFrostAndColdAlerts)
   * Poziomy: 28-32°C (umiarkowany), 32-38°C (silny), >38°C (ekstremalny)
   */
  checkTemperatureAlerts(weather) {
    const temp = weather.temperature;

    // EKSTREMALNY UPAŁ (>38°C) - CRITICAL
    if (temp > 38) {
      return {
        type: 'extreme-heat',
        priority: 'critical',
        icon: '🔥',
        message: `EKSTREMALNY UPAŁ! ${temp}°C`,
        details: 'Podlewaj OBFICIE rano (5-8) i wieczorem (po 19:00). Cieniuj rośliny agrowłókniną. ZAKAZ oprysku! Młode rośliny zagrożone!'
      };
    }

    // SILNY UPAŁ (32-38°C) - CRITICAL
    if (temp > 32) {
      return {
        type: 'severe-heat',
        priority: 'critical',
        icon: '☀️',
        message: `Silny upał! ${temp}°C`,
        details: 'Podlewaj 2x dziennie: rano (5-8) i wieczorem (po 19:00). NIGDY 10-16! Cieniuj rośliny doniczkowe. Zakaz oprysku (temp >25°C).'
      };
    }

    // UMIARKOWANY UPAŁ (28-32°C) - HIGH
    if (temp >= 28) {
      return {
        type: 'moderate-heat',
        priority: 'high',
        icon: '🌡️',
        message: `Umiarkowany upał ${temp}°C`,
        details: 'Podlewaj rano (5-8) LUB wieczorem (po 19:00). Unikaj 10-16! Mulczuj glebę (5-7cm słomy). Opryski odradzane (temp >25°C).'
      };
    }

    return null;
  }

  /**
   * Sprawdź warunki wiatru (3 poziomy)
   * 15-25 km/h: umiarkowany
   * 25-60 km/h: silny
   * >60 km/h: bardzo silny
   */
  checkWindConditions(weather) {
    const wind = weather.windSpeed;

    // BARDZO SILNY WIATR (>60 km/h / >17 m/s) - CRITICAL
    if (wind > 60) {
      return {
        type: 'extreme-wind',
        priority: 'critical',
        icon: '🌪️',
        message: `Bardzo silny wiatr! ${wind} km/h`,
        details: 'SZKODY: Łamanie gałęzi, uszkodzenia korzeni. Podepnij rośliny, zabezpiecz agrowłókniną. Po burzy: obetnij uszkodzone pędy'
      };
    }

    // SILNY WIATR (25-60 km/h / 7-17 m/s) - HIGH
    if (wind > 25) {
      return {
        type: 'strong-wind',
        priority: 'high',
        icon: '💨',
        message: `Silny wiatr (${wind} km/h)`,
        details: 'NIE opryskuj (znoszenie środków). NIE podlewaj (woda nie trafi do korzeni). Zabezpiecz donice - mogą się przewrócić'
      };
    }

    // UMIARKOWANY WIATR (15-25 km/h) - MEDIUM
    if (wind > 14.4) {
      return {
        type: 'moderate-wind',
        priority: 'medium',
        icon: '🍃',
        message: `Umiarkowany wiatr (${wind} km/h)`,
        details: 'Nie opryskuj - środki będą zdmuchnięte (max 14 km/h). Podepnij młode drzewka i wysokie rośliny'
      };
    }

    return null;
  }

  /**
   * Sprawdź ryzyko chorób grzybowych (wysoka wilgotność)
   */
  checkHumidityAndFungalRisk(weather, forecast) {
    const humidity = weather.humidity;
    const temp = weather.temperature;

    // WYSOKIE RYZYKO: wilgotność >80%, temp 15-25°C
    if (humidity > 80 && temp >= 15 && temp <= 25) {
      return {
        type: 'fungal-risk',
        priority: 'high',
        icon: '🍄',
        message: `Wysokie ryzyko chorób grzybowych (${humidity}% wilg.)`,
        details: 'NIE podlewaj późnym wieczorem! Podlewaj POD KORZEŃ (nie zwilżaj liści). Zwiększ odstępy między roślinami. Rozważ oprysk profilaktyczny'
      };
    }

    // UMIARKOWANE RYZYKO: wilgotność >70%
    if (humidity > 70) {
      return {
        type: 'fungal-warning',
        priority: 'medium',
        icon: '💧',
        message: `Podwyższona wilgotność (${humidity}%)`,
        details: 'Podlewaj rano (rośliny wyschną w ciągu dnia). Unikaj zwilżania liści. Obserwuj rośliny: rdza, szara pleśń, mączniak'
      };
    }

    return null;
  }

  /**
   * Sprawdź suszę (brak deszczu >7 dni)
   */
  checkDroughtConditions(currentWeather, forecast) {
    const temp = currentWeather.temperature;

    // ZIMA/MRÓZ: Nie pokazuj alertu suszowego gdy jest zimno (temp < 5°C)
    // W zimie nie należy podlewać - rośliny są w spoczynku, woda może zamarzać
    if (temp < 5) {
      return null;
    }

    // Sprawdź sumę opadów z ostatnich 5 dni (16 pomiarów co 3h = ~2 dni realnych danych)
    const recentRain = forecast.forecast.slice(0, 16).reduce((sum, f) => sum + f.rain, 0);

    // Sprawdź czy będzie deszcz w najbliższych 2 dniach
    const upcomingRain = forecast.forecast.slice(0, 16).reduce((sum, f) => sum + f.rain, 0);

    // SUSZA: brak deszczu (< 2mm łącznie) przez długi czas (tylko w sezonie wegetacyjnym)
    if (recentRain < 2 && upcomingRain < 2) {
      return {
        type: 'drought',
        priority: 'high',
        icon: '🏜️',
        message: 'Susza - brak deszczu w prognozie',
        details: 'Podlewaj rośliny gruntowe 2-3x/tydzień OBFICIE. Rośliny w donicach: 1-2x dziennie. MULCZUJ glebę (5-7cm słomy/kory) - zatrzyma wilgoć'
      };
    }

    return null;
  }

  /**
   * Sprawdź gwałtowne zmiany temperatury (>10°C w ciągu doby)
   */
  checkTemperatureSwing(weather, forecast) {
    const tempNow = weather.temperature;

    // Znajdź min/max temp w najbliższych 24h
    const next24h = forecast.forecast.slice(0, 8); // 8 * 3h = 24h
    const temps = next24h.map(f => f.temperature);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const swing = maxTemp - minTemp;

    // GWAŁTOWNA ZMIANA (>10°C w ciągu doby)
    if (swing > 10) {
      return {
        type: 'temp-swing',
        priority: 'high',
        icon: '🌡️',
        message: `Gwałtowna zmiana temp: ${minTemp}°C → ${maxTemp}°C`,
        details: 'STRES dla roślin! Młode rośliny najbardziej wrażliwe. Przykryj agrowłókniną na noc jeśli temp spadnie <5°C. Obserwuj więdnięcie'
      };
    }

    return null;
  }

  /**
   * Sprawdź ryzyko burz i gradu (mockup - brak realnych danych z API)
   * W przyszłości: integracja z alertami pogodowymi
   */
  checkStormAndHailRisk(weather) {
    // TODO: Integracja z API alertów pogodowych lub IMGW
    // Na razie: heurystyka oparta na opisie pogody
    const desc = weather.description.toLowerCase();

    if (desc.includes('burz') || desc.includes('grzmot') || desc.includes('thunder')) {
      return {
        type: 'storm-warning',
        priority: 'high',
        icon: '⛈️',
        message: 'OSTRZEŻENIE: Burze w prognozie!',
        details: 'Przykryj młode rośliny agrowłókniną/siatkami. Podepnij wysokie rośliny (pomidory, fasola). Mulczuj glebę. Po burzy: usuń uszkodzone liście, nawóż aminokwasami'
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
