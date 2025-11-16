const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const weatherService = require('../services/weather');
const db = require('../db');

/**
 * GET /api/weather/current
 * Pobierz aktualną pogodę dla lokalizacji użytkownika
 */
router.get('/current', auth, async (req, res) => {
  try {
    // Pobierz lokalizację użytkownika z profilu
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT latitude, longitude, city FROM users WHERE id = ?',
        [req.user.id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user || !user.latitude || !user.longitude) {
      return res.status(400).json({
        error: 'Lokalizacja nie ustawiona. Ustaw lokalizację w profilu'
      });
    }

    const weather = await weatherService.getCurrentWeather(user.latitude, user.longitude);

    res.json({
      location: {
        city: user.city,
        lat: user.latitude,
        lon: user.longitude
      },
      weather
    });
  } catch (error) {
    console.error('Błąd pobierania pogody:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/weather/forecast
 * Pobierz prognozę 5-dniową
 */
router.get('/forecast', auth, async (req, res) => {
  try {
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT latitude, longitude FROM users WHERE id = ?',
        [req.user.id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user || !user.latitude || !user.longitude) {
      return res.status(400).json({
        error: 'Lokalizacja nie ustawiona'
      });
    }

    const forecast = await weatherService.getForecast(user.latitude, user.longitude);

    res.json(forecast);
  } catch (error) {
    console.error('Błąd pobierania prognozy:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/weather/recommendations
 * Pobierz smart rekomendacje dla ogrodu
 */
router.get('/recommendations', auth, async (req, res) => {
  try {
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT latitude, longitude FROM users WHERE id = ?',
        [req.user.id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user || !user.latitude || !user.longitude) {
      return res.status(400).json({
        error: 'Lokalizacja nie ustawiona'
      });
    }

    const [currentWeather, forecast] = await Promise.all([
      weatherService.getCurrentWeather(user.latitude, user.longitude),
      weatherService.getForecast(user.latitude, user.longitude)
    ]);

    const recommendations = weatherService.getGardenRecommendations(currentWeather, forecast);

    res.json({
      currentWeather,
      recommendations
    });
  } catch (error) {
    console.error('Błąd pobierania rekomendacji:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/weather/location
 * Zaktualizuj lokalizację użytkownika
 */
router.put('/location', auth, async (req, res) => {
  const { latitude, longitude, city } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Wymagane: latitude i longitude' });
  }

  // Walidacja współrzędnych
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({ error: 'Nieprawidłowe współrzędne' });
  }

  try {
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET latitude = ?, longitude = ?, city = ? WHERE id = ?',
        [latitude, longitude, city || null, req.user.id],
        function (err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.json({
      message: 'Lokalizacja zaktualizowana',
      location: { latitude, longitude, city }
    });
  } catch (error) {
    console.error('Błąd aktualizacji lokalizacji:', error);
    res.status(500).json({ error: 'Błąd aktualizacji lokalizacji' });
  }
});

module.exports = router;
