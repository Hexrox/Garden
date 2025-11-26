/**
 * Moon Phases Calculator & Gardening Calendar for Poland
 * Obliczanie faz księżyca i SEZONOWYCH zaleceń ogrodniczych dla Polski (USDA zona 6-7)
 */

class MoonPhasesCalculator {
  /**
   * Kalendarz miesięczny - realne praktyki ogrodnicze dla Polski
   * Based on research from Polish gardening calendars 2025
   */
  POLISH_MONTHLY_ACTIVITIES = {
    1: { // Styczeń
      month: 'styczeń',
      season: 'zima',
      canSowOutdoors: false,
      canSowIndoors: false,
      activities: {
        planning: ['Planowanie sezonu ogrodniczego', 'Przeglądanie katalogów nasion', 'Przygotowanie kalendarza siewów'],
        protection: ['Kontrola osłon zimowych roślin', 'Usuwanie śniegu z konarów', 'Ochrona przed gryzoniami'],
        maintenance: ['Bielenie pni drzew owocowych', 'Sprawdzanie przechowywanych plonów', 'Konserwacja narzędzi'],
        indoors: ['Wymuszanie cebulek kwiatowych w domu']
      }
    },
    2: { // Luty
      month: 'luty',
      season: 'zima',
      canSowOutdoors: false,
      canSowIndoors: true,
      activities: {
        sowIndoors: ['Siew papryki na rozsadę (połowa lutego)', 'Siew pomidorów na rozsadę (koniec lutego)', 'Siew bakłażana na rozsadę', 'Siew selera na rozsadę'],
        pruning: ['Cięcie drzew i krzewów owocowych', 'Formowanie drzew przed sezonem'],
        protection: ['Kontrola zimowych okryć', 'Sprawdzanie przechowywanego materiału sadzeniowego'],
        planning: ['Przygotowanie tuneli foliowych', 'Planowanie севооборotu (płodozmianu)']
      }
    },
    3: { // Marzec
      month: 'marzec',
      season: 'wiosna',
      canSowOutdoors: true,
      canSowIndoors: true,
      activities: {
        sowOutdoors: ['Siew bobu w gruncie', 'Siew grochu', 'Siew marchwi', 'Siew pietruszki', 'Siew cebuli z nasion', 'Siew kopru', 'Siew pora', 'Siew rzodkiewki w tunelu'],
        sowIndoors: ['Siew pomidorów (do połowy marca!)', 'Siew papryki', 'Siew bakłażana', 'Siew ogórków (koniec marca)'],
        maintenance: ['Porządki wiosenne - grabienie liści', 'Nawożenie startowe trawnika', 'Odkrywanie roślin zimujących'],
        pruning: ['Przycinanie róż', 'Przycinanie krzewów ozdobnych', 'Cięcie pędów zamarzniętych']
      }
    },
    4: { // Kwiecień
      month: 'kwiecień',
      season: 'wiosna',
      canSowOutdoors: true,
      canSowIndoors: true,
      activities: {
        sowOutdoors: ['Intensywne siewy warzyw: sałata, szpinak, rzodkiewka', 'Siew warzyw korzeniowych: marchew, pietruszka, burak', 'Siew kwiatów jednorocznych', 'Zakładanie trawnika', 'Sadzenie wczesnych ziemniaków'],
        sowIndoors: ['Dokończenie siewu rozsady warzyw', 'Pikowanie rozsady'],
        planting: ['Sadzenie cebulek kwiatowych wiosennych', 'Sadzenie drzew i krzewów ozdobnych'],
        maintenance: ['Przygotowanie gleby pod uprawy', 'Nawożenie startowe', 'Walka z pierwszymi chwastami']
      }
    },
    5: { // Maj
      month: 'maj',
      season: 'wiosna',
      canSowOutdoors: true,
      canSowIndoors: false,
      activities: {
        planting: ['PO 15 MAJA: Wysadzanie rozsady do gruntu (pomidory, papryka, ogórki, bakłażan)', 'Sadzenie kabaczków, cukinii, dyni', 'Dosadzanie truskawek'],
        sowOutdoors: ['Siew ogórków bezpośrednio do gruntu', 'Siew fasoli szparagowej', 'Siew słonecznika', 'Powtórne siewy: rzodkiewka, sałata, koper'],
        harvesting: ['Zbiór pierwszych truskawek', 'Zbiór szpinaku', 'Zbiór rzodkiewki', 'Zbiór szczypiorku'],
        maintenance: ['Walka z chwastami', 'Okrywanie młodych sadzonek w chłodne noce', 'Mulczowanie grządek']
      }
    },
    6: { // Czerwiec
      month: 'czerwiec',
      season: 'lato',
      canSowOutdoors: true,
      canSowIndoors: false,
      activities: {
        sowOutdoors: ['Siewy uzupełniające: rzodkiewka, koper, sałata', 'Siew fasoli na drugie zbiory', 'Siew buraków na zimę'],
        harvesting: ['Intensywny zbiór truskawek', 'Zbiór szpinaku, sałaty', 'Zbiór pierwszych ogórków', 'Zbiór rzodkiewki', 'Zbiór wczesnej kapusty'],
        maintenance: ['INTENSYWNE PODLEWANIE', 'Nawożenie dolistne', 'Walka ze szkodnikami', 'Przywiązywanie pędów pomidorów', 'Okrywanie krzewów przed ptakami'],
        pruning: ['Przycinanie przekwitłych kwiatów', 'Formowanie pędów dyni']
      }
    },
    7: { // Lipiec
      month: 'lipiec',
      season: 'lato',
      canSowOutdoors: true,
      canSowIndoors: false,
      activities: {
        sowOutdoors: ['Siew warzyw na jesień: kalarepa, rzodkiewka', 'Siew szpinaku zimującego (koniec lipca)', 'Powtórne siewy: sałata, koper'],
        harvesting: ['Zbiór pomidorów, ogórków, cukinii', 'Zbiór malin, porzeczek', 'Zbiór wczesnych ziemniaków', 'Zbiór czosnku', 'Zbiór warzyw liściastych'],
        maintenance: ['Podlewanie w upały (rano lub wieczorem)', 'Odchwaszczanie', 'Walka z mączniakiem i innymi chorobami'],
        pruning: ['Przycinanie malин po zbiorach', 'Usuwanie zbędnych pędów pomidorów', 'Przycinanie żywopłotów']
      }
    },
    8: { // Sierpień
      month: 'sierpień',
      season: 'lato',
      canSowOutdoors: true,
      canSowIndoors: false,
      activities: {
        sowOutdoors: ['Siew szpinaku zimującego', 'Siew rzodkiewki jesiennej', 'Sadzenie czosnku ozimego (koniec sierpnia)', 'Siew sałaty jesiennej'],
        harvesting: ['Intensywne zbiory: pomidory, papryka, ogórki', 'Zbiór ziemniaków', 'Zbiór cebuli (gdy pióra uschną)', 'Zbiór marchwi młodej', 'Zbiór owoców: jabłka letnie, śliwki'],
        maintenance: ['Suszenie ziół', 'Przetwory (kiszonki, dżemy)', 'Przygotowanie gleby pod rośliny jesienne', 'Podlewanie w susze'],
        preparation: ['Przygotowania do jesieni', 'Planowanie posadzeń jesiennych']
      }
    },
    9: { // Wrzesień
      month: 'wrzesień',
      season: 'jesień',
      canSowOutdoors: true,
      canSowIndoors: false,
      activities: {
        sowOutdoors: ['POCZĄTEK MIESIĄCA: siew sałaty, rzodkiewki, szpinaku zimującego', 'Siew roszponki', 'Zakładanie trawnika (najlepszy termin!)'],
        planting: ['Sadzenie cebul kwiatowych: tulipany, krokusy, hiacynty, szafirki', 'Sadzenie piwonii', 'Sadzenie truskawek (rozmnażanie)'],
        harvesting: ['Zbiór warzyw korzeniowych: marchew, pietruszka, burak, seler', 'Zbiór dyni, kabaczków', 'Zbiór pomidorów przed pierwszymi przymrozkami', 'Zbiór późnej kapusty'],
        maintenance: ['Nawożenie jesienne (fosfor + potas)', 'Mulczowanie grządek', 'Wykopywanie bulw (dalie, begonie)']
      }
    },
    10: { // Październik
      month: 'październik',
      season: 'jesień',
      canSowOutdoors: false,
      canSowIndoors: false,
      activities: {
        planting: ['Sadzenie cebul kwiatowych (dokończenie)', 'Sadzenie krzewów owocowych: porzeczki, agrest, maliny', 'Sadzenie drzew owocowych', 'Sadzenie róż'],
        harvesting: ['Zbiór ostatnich warzyw: marchew, pietruszka, seler, pory', 'Zbiór dyni ozdobnych', 'Zbiór jabłek i gruszek zimowych', 'Wykopywanie ziemniaków (dokończenie)'],
        protection: ['Okrywanie wrażliwych roślin na zimę', 'Zabezpieczanie róż', 'Owijanie pni młodych drzew przed gryzoniami'],
        maintenance: ['Grabienie liści', 'Ostatnie koszenie trawnika', 'Sprzątanie grządek', 'Kompostowanie resztek roślinnych']
      }
    },
    11: { // Listopad
      month: 'listopad',
      season: 'jesień/zima',
      canSowOutdoors: false,
      canSowIndoors: false,
      activities: {
        harvesting: ['Zbiór ostatnich warzyw korzeniowych (przed mrozami)', 'Zbiór kapusty brukselskiej', 'Zbiór porów'],
        protection: ['OKRYWANIE ROŚLIN NA ZIMĘ', 'Zabezpieczanie krzewów róż', 'Mulчowanie rabat bylinowych', 'Ochrona przed gryzoniami'],
        maintenance: ['Grabienie ostatnich liści', 'Czyszczenie rynien', 'Przygotowanie ogrodu do zimy', 'Wywożenie kompostu na grządki'],
        planning: ['Planowanie przyszłorocznych upraw', 'Przegląd narzędzi', 'Przygotowanie magazynu']
      }
    },
    12: { // Grudzień
      month: 'grudzień',
      season: 'zima',
      canSowOutdoors: false,
      canSowIndoors: false,
      activities: {
        protection: ['Kontrola okryć zimowych', 'Odśnieżanie konarów', 'Sprawdzanie osłon przed wiatrem'],
        maintenance: ['Bielenie pni drzew (koniec miesiąca)', 'Kontrola przechowywanego materiału sadzeniowego', 'Sprawdzanie przechowywanych plonów'],
        planning: ['Planowanie przyszłorocznego ogrodu', 'Zamawianie nasion', 'Czytanie poradników ogrodniczych'],
        indoors: ['Wymuszanie gałązek forsycji, leszczyny', 'Uprawa mikroliści w domu']
      }
    }
  };

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
   * Pobierz kontekst sezonowy dla Polski
   * @param {number} month - miesiąc (1-12)
   * @returns {Object} kontekst sezonowy
   */
  getPolishSeasonalContext(month) {
    return this.POLISH_MONTHLY_ACTIVITIES[month] || this.POLISH_MONTHLY_ACTIVITIES[1];
  }

  /**
   * Pobierz rekomendacje ogrodnicze dla fazy księżyca + SEZON
   * @param {Object} moonPhase
   * @param {Date} date - data (do określenia sezonu)
   * @returns {Object} rekomendacje
   */
  getGardeningRecommendations(moonPhase, date = new Date()) {
    const month = date.getMonth() + 1; // 1-12
    const seasonal = this.getPolishSeasonalContext(month);

    const recommendations = {
      phase: moonPhase.phaseName,
      emoji: moonPhase.emoji,
      favorable: [],
      unfavorable: [],
      general: '',
      seasonInfo: `${seasonal.month} (${seasonal.season})`
    };

    // Bazowa logika księżycowa + filtrowanie sezonowe
    switch (moonPhase.phase) {
      case 'new':
        recommendations.general = `Nów księżyca - czas odpoczynku i planowania. W ${seasonal.month} skupiamy się na przygotowaniach.`;

        // Zawsze dobre w nów
        recommendations.favorable = [
          'Usuwanie chwastów (będą wolniej rosły)',
          'Przycinanie i formowanie roślin',
          'Kompostowanie'
        ];

        // Dodaj sezonowe aktywności
        if (seasonal.activities.planning) {
          recommendations.favorable.push(...seasonal.activities.planning.slice(0, 2));
        }
        if (seasonal.activities.protection) {
          recommendations.favorable.push(...seasonal.activities.protection.slice(0, 1));
        }
        if (seasonal.activities.pruning) {
          recommendations.favorable.push(...seasonal.activities.pruning.slice(0, 1));
        }

        recommendations.unfavorable = [
          'Siew i sadzenie',
          'Nawożenie dolistne'
        ];
        break;

      case 'waxing_crescent':
      case 'first_quarter':
      case 'waxing_gibbous':
        recommendations.general = `Księżyc przybywający - czas wzrostu i energii. ${this.getWaxingSeasonalAdvice(seasonal)}`;

        recommendations.favorable = [];

        // SIEWY NA ZEWNĄTRZ - tylko jeśli sezon pozwala
        if (seasonal.canSowOutdoors && seasonal.activities.sowOutdoors) {
          recommendations.favorable.push('🌱🌱 ' + seasonal.activities.sowOutdoors.slice(0, 3).join(', '));
        }

        // SIEWY W DOMU - tylko jeśli sezon pozwala
        if (seasonal.canSowIndoors && seasonal.activities.sowIndoors) {
          recommendations.favorable.push('🏠 W domu: ' + seasonal.activities.sowIndoors.slice(0, 2).join(', '));
        }

        // SADZENIE - jeśli są rośliny do posadzenia
        if (seasonal.activities.planting) {
          recommendations.favorable.push('🌿 ' + seasonal.activities.planting.slice(0, 2).join(', '));
        }

        // Uniwersalne dla rosnącego księżyca
        recommendations.favorable.push(
          '💧 Podlewanie (rośliny lepiej przyjmują wodę)',
          '🪴 Przesadzanie roślin'
        );

        // Dodaj zbiory jeśli są
        if (seasonal.activities.harvesting) {
          recommendations.favorable.push('🌾 Zbiór: ' + seasonal.activities.harvesting.slice(0, 2).join(', '));
        }

        recommendations.unfavorable = [
          'Przycinanie (rośliny tracą sok)',
          'Zbiór warzyw korzeniowych'
        ];
        break;

      case 'full':
        recommendations.general = `Pełnia - szczytowa energia. ${this.getFullMoonSeasonalAdvice(seasonal)}`;

        recommendations.favorable = [];

        // Zbiory jeśli są w sezonie
        if (seasonal.activities.harvesting) {
          recommendations.favorable.push('🥬 ' + seasonal.activities.harvesting.slice(0, 3).join(', '));
        }

        // Uniwersalne dla pełni
        recommendations.favorable.push(
          '🌿 Zbiór ziół (maksimum olejków eterycznych)',
          '💧 Podlewanie',
          '🌱 Sadzenie roślin wieloletnich'
        );

        recommendations.unfavorable = [
          'Przycinanie (duża utrata soków)',
          'Cięcia sanitarne'
        ];
        break;

      case 'waning_gibbous':
      case 'last_quarter':
      case 'waning_crescent':
        recommendations.general = `Księżyc ubywający - energia schodzi w dół. ${this.getWaningSeasonalAdvice(seasonal)}`;

        recommendations.favorable = [];

        // SADZENIE CEBULOWE - przede wszystkim jesień!
        if (month >= 9 && month <= 10 && seasonal.activities.planting) {
          const bulbPlanting = seasonal.activities.planting.filter(a =>
            a.includes('cebul') || a.includes('tulipan') || a.includes('krokus')
          );
          if (bulbPlanting.length > 0) {
            recommendations.favorable.push('🧅🧅 ' + bulbPlanting.join(', '));
          }
        }

        // SADZENIE KRZEWÓW I DRZEW - jesień lub wiosna
        if ((month >= 9 && month <= 11) || (month >= 3 && month <= 4)) {
          if (seasonal.activities.planting) {
            const treePlanting = seasonal.activities.planting.filter(a =>
              a.includes('krzew') || a.includes('drzew') || a.includes('róż')
            );
            if (treePlanting.length > 0) {
              recommendations.favorable.push('🌳 ' + treePlanting.join(', '));
            }
          }
        }

        // Przycinanie - zawsze dobre w ubywający księżyc
        if (seasonal.activities.pruning) {
          recommendations.favorable.push('✂️ ' + seasonal.activities.pruning.slice(0, 2).join(', '));
        }

        // Walka z chwastami
        recommendations.favorable.push('🪴 Walka z chwastami i szkodnikami');

        // Zbiór korzeni - jeśli są w sezonie
        if (month >= 8 && month <= 11 && seasonal.activities.harvesting) {
          const rootHarvest = seasonal.activities.harvesting.filter(a =>
            a.includes('marchew') || a.includes('pietruszka') || a.includes('seler') ||
            a.includes('burak') || a.includes('ziemniak') || a.includes('korzeni')
          );
          if (rootHarvest.length > 0) {
            recommendations.favorable.push('🥕 ' + rootHarvest.join(', '));
          }
        }

        // Kompostowanie
        recommendations.favorable.push('♻️ Kompostowanie');

        // Ochrona zimowa (listopad-grudzień)
        if (month >= 11 && seasonal.activities.protection) {
          recommendations.favorable.push(...seasonal.activities.protection.slice(0, 2));
        }

        recommendations.unfavorable = [
          'Siew warzyw nadziemnych',
          'Intensywne podlewanie'
        ];
        break;
    }

    // Usuń duplikaty
    recommendations.favorable = [...new Set(recommendations.favorable)];

    return recommendations;
  }

  /**
   * Pomocnicze funkcje dla sezonowych porad
   */
  getWaxingSeasonalAdvice(seasonal) {
    if (!seasonal.canSowOutdoors && !seasonal.canSowIndoors) {
      return `W ${seasonal.month} nie prowadzimy siewów - skupiamy się na ochronie i planowaniu.`;
    }
    if (seasonal.canSowIndoors && !seasonal.canSowOutdoors) {
      return `W ${seasonal.month} sieje się rozsadę w domu, ale jeszcze nie w gruncie.`;
    }
    return `Najlepszy okres na siew i sadzenie w ${seasonal.month}.`;
  }

  getFullMoonSeasonalAdvice(seasonal) {
    if (seasonal.activities.harvesting) {
      return `Dobry moment na zbiór plonów w ${seasonal.month}.`;
    }
    return `Czas zbiorów i konserwacji - choć w ${seasonal.month} mniej aktywności.`;
  }

  getWaningSeasonalAdvice(seasonal) {
    const month = parseInt(Object.keys(this.POLISH_MONTHLY_ACTIVITIES).find(
      k => this.POLISH_MONTHLY_ACTIVITIES[k].month === seasonal.month
    ));

    if (month >= 9 && month <= 10) {
      return `Idealny czas na sadzenie cebul kwiatowych i krzewów w ${seasonal.month}.`;
    }
    if (month >= 11 && month <= 2) {
      return `W ${seasonal.month} skupiamy się na ochronie i przygotowaniach, nie na sadzeniu.`;
    }
    return `Czas na rośliny korzeniowe, przycinanie i prace konserwacyjne.`;
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
      const recommendations = this.getGardeningRecommendations(moonPhase, date);

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
