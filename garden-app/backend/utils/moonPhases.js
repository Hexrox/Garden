/**
 * Moon Phases Calculator & Gardening Calendar
 * Obliczanie faz księżyca i optymalnych dni do prac ogrodniczych
 */

class MoonPhasesCalculator {
  /**
   * Oblicz fazę księżyca dla danej daty
   * @param {Date} date
   * @returns {Object} faza, procent oświetlenia, typ
   */
  getMoonPhase(date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // Algorytm obliczania fazy księżyca (John Conway)
    let r = year % 100;
    r %= 19;
    if (r > 9) r -= 19;
    r = ((r * 11) % 30) + month + day;
    if (month < 3) r += 2;
    r -= ((year < 2000) ? 4 : 8.3);
    r = Math.floor(r + 0.5) % 30;
    if (r < 0) r += 30;

    // Procent oświetlenia (0-100%)
    const illumination = (r < 15) ? (r / 15) * 100 : ((30 - r) / 15) * 100;

    // Określ fazę
    let phase, phaseName, emoji;
    if (r === 0 || r === 29) {
      phase = 'new';
      phaseName = 'Nów';
      emoji = '🌑';
    } else if (r > 0 && r < 7) {
      phase = 'waxing_crescent';
      phaseName = 'Przybywający sierp';
      emoji = '🌒';
    } else if (r >= 7 && r < 8) {
      phase = 'first_quarter';
      phaseName = 'Pierwsza kwadra';
      emoji = '🌓';
    } else if (r >= 8 && r < 15) {
      phase = 'waxing_gibbous';
      phaseName = 'Przybywający garb';
      emoji = '🌔';
    } else if (r >= 15 && r < 16) {
      phase = 'full';
      phaseName = 'Pełnia';
      emoji = '🌕';
    } else if (r >= 16 && r < 22) {
      phase = 'waning_gibbous';
      phaseName = 'Ubywający garb';
      emoji = '🌖';
    } else if (r >= 22 && r < 23) {
      phase = 'last_quarter';
      phaseName = 'Ostatnia kwadra';
      emoji = '🌗';
    } else {
      phase = 'waning_crescent';
      phaseName = 'Ubywający sierp';
      emoji = '🌘';
    }

    return {
      phase,
      phaseName,
      emoji,
      illumination: Math.round(illumination),
      isWaxing: r < 15,
      age: r
    };
  }

  /**
   * Pobierz rekomendacje ogrodnicze dla fazy księżyca
   * @param {Object} moonPhase
   * @returns {Object} rekomendacje
   */
  getGardeningRecommendations(moonPhase) {
    const recommendations = {
      phase: moonPhase.phaseName,
      emoji: moonPhase.emoji,
      favorable: [],
      unfavorable: [],
      general: ''
    };

    switch (moonPhase.phase) {
      case 'new':
        recommendations.general = 'Czas odpoczynku. Dobry moment na planowanie i przygotowanie.';
        recommendations.favorable = [
          'Usuwanie chwastów (będą wolniej rosły)',
          'Przycinanie i formowanie roślin',
          'Przygotowanie gleby',
          'Kompostowanie'
        ];
        recommendations.unfavorable = [
          'Siew i sadzenie',
          'Przesadzanie',
          'Nawożenie'
        ];
        break;

      case 'waxing_crescent':
      case 'first_quarter':
      case 'waxing_gibbous':
        recommendations.general = 'Księżyc przybywający - czas wzrostu i energii. Najlepszy okres na siew i sadzenie.';
        recommendations.favorable = [
          '🌱 Siew warzyw nadziemnych (pomidory, papryka, ogórki)',
          '🌿 Sadzenie roślin zielonych (sałata, szpinak)',
          '💐 Sadzenie kwiatów jednorocznych',
          '🌾 Siew traw i zbóż',
          '💧 Podlewanie (rośliny lepiej przyjmują wodę)',
          '🪴 Przesadzanie roślin'
        ];
        recommendations.unfavorable = [
          'Przycinanie (rośliny tracą sok)',
          'Zbiór korzeni'
        ];
        break;

      case 'full':
        recommendations.general = 'Pełnia - szczytowa energia. Dobry moment na zbiór i konserwację.';
        recommendations.favorable = [
          '🥬 Zbiór warzyw liściastych',
          '🌿 Zbiór ziół (maksimum olejków eterycznych)',
          '🍎 Zbiór owoców na przetwory',
          '💧 Podlewanie',
          '🌱 Sadzenie roślin wieloletnich'
        ];
        recommendations.unfavorable = [
          'Przycinanie (duża utrata soków)',
          'Cięcia sanitarne'
        ];
        break;

      case 'waning_gibbous':
      case 'last_quarter':
      case 'waning_crescent':
        recommendations.general = 'Księżyc ubywający - energia schodzi w dół. Czas na rośliny korzeniowe i konserwację.';
        recommendations.favorable = [
          '🥕 Siew i sadzenie warzyw korzeniowych (marchew, ziemniaki, burak)',
          '🧅 Sadzenie cebulowe (tulipany, cebula, czosnek)',
          '✂️ Przycinanie i formowanie',
          '🌳 Przesadzanie drzew i krzewów',
          '🌾 Zbiór korzeni i bulw',
          '🪴 Walka z chwastami i szkodnikami',
          '♻️ Kompostowanie'
        ];
        recommendations.unfavorable = [
          'Siew warzyw nadziemnych',
          'Sadzenie roślin zielonych'
        ];
        break;
    }

    return recommendations;
  }

  /**
   * Pobierz fazy księżyca na cały miesiąc
   * @param {number} year
   * @param {number} month (1-12)
   * @returns {Array} tablica faz dla każdego dnia
   */
  getMonthlyMoonPhases(year, month) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const phases = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const moonPhase = this.getMoonPhase(date);
      const recommendations = this.getGardeningRecommendations(moonPhase);

      phases.push({
        date: date.toISOString().split('T')[0],
        dayOfMonth: day,
        ...moonPhase,
        recommendations: recommendations
      });
    }

    return phases;
  }

  /**
   * Znajdź optymalne dni w najbliższym czasie
   * @param {string} activity - typ aktywności: 'sowing_above', 'sowing_below', 'harvesting', 'pruning'
   * @param {number} daysAhead - ile dni do przodu szukać
   * @returns {Array} optymalne dni
   */
  findOptimalDays(activity, daysAhead = 14) {
    const today = new Date();
    const optimalDays = [];

    for (let i = 0; i < daysAhead; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      const moonPhase = this.getMoonPhase(date);
      const isOptimal = this.isOptimalForActivity(moonPhase, activity);

      if (isOptimal) {
        optimalDays.push({
          date: date.toISOString().split('T')[0],
          dateFormatted: date.toLocaleDateString('pl-PL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          moonPhase: moonPhase.phaseName,
          emoji: moonPhase.emoji,
          reason: this.getActivityReason(activity)
        });
      }
    }

    return optimalDays;
  }

  /**
   * Sprawdź czy faza księżyca jest optymalna dla aktywności
   */
  isOptimalForActivity(moonPhase, activity) {
    switch (activity) {
      case 'sowing_above': // warzywa nadziemne
        return moonPhase.isWaxing && moonPhase.phase !== 'new';
      case 'sowing_below': // warzywa korzeniowe
        return !moonPhase.isWaxing && moonPhase.phase !== 'full';
      case 'harvesting':
        return moonPhase.phase === 'full' || moonPhase.phase === 'waning_gibbous';
      case 'pruning':
        return !moonPhase.isWaxing;
      case 'watering':
        return moonPhase.isWaxing;
      default:
        return false;
    }
  }

  /**
   * Pobierz opis aktywności
   */
  getActivityReason(activity) {
    const reasons = {
      'sowing_above': 'Księżyc przybywający - energia wznosząca się, idealna dla warzyw nadziemnych',
      'sowing_below': 'Księżyc ubywający - energia schodząca w dół, idealna dla korzeni',
      'harvesting': 'Pełnia lub tuż po - maksimum soków w owocach',
      'pruning': 'Księżyc ubywający - mniejsza utrata soków',
      'watering': 'Księżyc przybywający - rośliny lepiej przyjmują wodę'
    };
    return reasons[activity] || '';
  }
}

module.exports = new MoonPhasesCalculator();
