const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const moonPhases = require('../utils/moonPhases');

// Public limiter dla moon endpoints (prevent DoS)
const publicLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  message: { error: 'Zbyt wiele żądań. Spróbuj ponownie za minutę.' },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * GET /api/calendar/moon/current
 * Pobierz aktualną fazę księżyca i rekomendacje
 * PUBLIC - nie wymaga autoryzacji (dane astronomiczne uniwersalne)
 */
router.get('/moon/current', publicLimiter, (req, res) => {
  try {
    const today = new Date();
    const moonPhase = moonPhases.getMoonPhase(today);
    const recommendations = moonPhases.getGardeningRecommendations(moonPhase, today);

    const response = {
      date: today.toISOString().split('T')[0],
      dateFormatted: today.toLocaleDateString('pl-PL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      moon: moonPhase,
      gardening: recommendations
    };

    res.json(response);
  } catch (error) {
    console.error('Błąd pobierania fazy księżyca:', error);
    res.status(500).json({ error: 'Błąd pobierania fazy księżyca' });
  }
});

/**
 * GET /api/calendar/moon/month/:year/:month
 * Pobierz fazy księżyca dla całego miesiąca
 * PUBLIC - nie wymaga autoryzacji (dane astronomiczne uniwersalne)
 */
router.get('/moon/month/:year/:month', publicLimiter, (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);

    // Walidacja ID
    if (isNaN(year) || isNaN(month)) {
      return res.status(400).json({ error: 'Nieprawidłowy format daty' });
    }

    if (year < 2000 || year > 2100 || month < 1 || month > 12) {
      return res.status(400).json({ error: 'Nieprawidłowa data' });
    }

    const monthlyPhases = moonPhases.getMonthlyMoonPhases(year, month);

    res.json({
      year,
      month,
      monthName: new Date(year, month - 1, 1).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' }),
      days: monthlyPhases
    });
  } catch (error) {
    console.error('Błąd pobierania miesięcznych faz:', error);
    res.status(500).json({ error: 'Błąd pobierania danych' });
  }
});

/**
 * GET /api/calendar/optimal-days/:activity
 * Znajdź optymalne dni dla danej aktywności
 * Activities: sowing_above, sowing_below, harvesting, pruning, watering
 */
router.get('/optimal-days/:activity', auth, (req, res) => {
  try {
    const activity = req.params.activity;
    const daysAhead = parseInt(req.query.days) || 14;

    const validActivities = ['sowing_above', 'sowing_below', 'harvesting', 'pruning', 'watering'];
    if (!validActivities.includes(activity)) {
      return res.status(400).json({
        error: 'Nieprawidłowa aktywność',
        validActivities
      });
    }

    if (daysAhead < 1 || daysAhead > 30) {
      return res.status(400).json({ error: 'days musi być między 1 a 30' });
    }

    const optimalDays = moonPhases.findOptimalDays(activity, daysAhead);

    const activityNames = {
      'sowing_above': 'Siew warzyw nadziemnych',
      'sowing_below': 'Siew warzyw korzeniowych',
      'harvesting': 'Zbiór plonów',
      'pruning': 'Przycinanie roślin',
      'watering': 'Podlewanie'
    };

    res.json({
      activity: activityNames[activity],
      activityKey: activity,
      daysAhead,
      optimalDays,
      count: optimalDays.length
    });
  } catch (error) {
    console.error('Błąd wyszukiwania optymalnych dni:', error);
    res.status(500).json({ error: 'Błąd wyszukiwania' });
  }
});

/**
 * GET /api/calendar/summary
 * Pobierz podsumowanie: aktualna faza + najbliższe optymalne dni
 */
router.get('/summary', auth, (req, res) => {
  try {
    const today = new Date();
    const moonPhase = moonPhases.getMoonPhase(today);
    const recommendations = moonPhases.getGardeningRecommendations(moonPhase, today);

    // Znajdź najbliższe optymalne dni dla różnych aktywności
    const upcomingDays = {
      sowingAbove: moonPhases.findOptimalDays('sowing_above', 7).slice(0, 3),
      sowingBelow: moonPhases.findOptimalDays('sowing_below', 7).slice(0, 3),
      harvesting: moonPhases.findOptimalDays('harvesting', 14).slice(0, 3),
      pruning: moonPhases.findOptimalDays('pruning', 7).slice(0, 3)
    };

    res.json({
      currentDate: today.toISOString().split('T')[0],
      moon: {
        phase: moonPhase.phaseName,
        emoji: moonPhase.emoji,
        illumination: moonPhase.illumination,
        isWaxing: moonPhase.isWaxing
      },
      gardening: {
        general: recommendations.general,
        seasonInfo: recommendations.seasonInfo,
        favorable: recommendations.favorable,
        unfavorable: recommendations.unfavorable
      },
      upcoming: upcomingDays
    });
  } catch (error) {
    console.error('Błąd pobierania podsumowania:', error);
    res.status(500).json({ error: 'Błąd pobierania podsumowania' });
  }
});

module.exports = router;
