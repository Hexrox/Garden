# Garden App - Szybki Start (Projekt Hobbystyczny)

## ✅ Co jest gotowe?

**WSZYSTKIE 3 SPRINTY ZAIMPLEMENTOWANE (99%)!**

- ✅ Pełna funkcjonalność (PlotForm, SprayForm, Dashboard, Export)
- ✅ Integracja pogody z smart recommendations
- ✅ Dark Mode + Mobile UX
- ✅ Bezpieczeństwo (helmet, rate limiting, JWT)
- ✅ Wszystkie widgety (Weather, Tasks, Harvests, Succession)

**Jedyna rzecz do zrobienia:** Dodać klucz OpenWeather API (darmowy, 5 minut)

---

## 🚀 Uruchomienie (10 minut)

### Krok 1: Uzyskaj klucz OpenWeather API (FREE)

1. Przejdź na: https://home.openweathermap.org/users/sign_up
2. Zarejestruj się (darmowy plan - 1000 zapytań/dzień)
3. Potwierdź email
4. Przejdź do: https://home.openweathermap.org/api_keys
5. Skopiuj klucz API

### Krok 2: Dodaj klucz do .env

Otwórz plik: `garden-app/backend/.env`

Znajdź linię:
```
OPENWEATHER_API_KEY=
```

Wklej swój klucz:
```
OPENWEATHER_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

⚠️ **Uwaga:** Klucz może być aktywny dopiero po 10-120 minut!

### Krok 3: Uruchom Backend

```bash
cd garden-app/backend
npm install
npm start
```

Backend powinien działać na: http://localhost:3001

### Krok 4: Uruchom Frontend (w NOWYM terminalu)

```bash
cd garden-app/frontend
npm install
npm start
```

Frontend otworzy się automatycznie w przeglądarce: http://localhost:3000

---

## 📍 Pierwsze uruchomienie

1. **Zarejestruj się** w aplikacji
2. Przejdź do **Profil** (ikona 👤 w menu)
3. W sekcji "Lokalizacja":
   - Kliknij **"📍 Użyj mojej lokalizacji"** (automatycznie)
   - LUB wpisz ręcznie współrzędne z Google Maps
4. Kliknij **"Zapisz lokalizację"**
5. Wróć do **Dashboard** - powinieneś zobaczyć:
   - 🌤️ Widget pogody z temperaturą
   - 🌿 Rekomendacje oprysków
   - 💧 Rekomendacje podlewania
   - 🧊 Alerty o przymrozkach (jeśli są)

---

## 🎯 Funkcje aplikacji

### 🌱 Zarządzanie działkami
- Tworzenie działek (plots) z nazwą, notatkami, zdjęciem
- Dodawanie grządek (beds) z roślinami
- Śledzenie dat sadzenia i przewidywanych zbiorów

### 🌿 Śledzenie oprysków
- Dodawanie oprysków ze środkami ochrony
- Automatyczne obliczanie bezpiecznej daty zbioru (karencja)
- Historia oprysków z datami i szczegółami

### 🌤️ Integracja pogody
- Aktualna pogoda (temperatura, wiatr, wilgotność)
- Smart rekomendacje:
  - ✅ Optymalne warunki do oprysku (10-25°C, wiatr <15km/h)
  - 💧 Kiedy podlewać (analiza opadów, temperatury)
  - 🧊 Ostrzeżenia o przymrozkach
  - 💨 Alerty o silnym wietrze

### 📊 Widgety Dashboard
- **WeatherWidget** - pogoda i rekomendacje
- **TaskList** - nadchodzące zadania
- **UpcomingHarvests** - przewidywane zbiory (z bazy 40+ roślin)
- **SuccessionWidget** - planowanie siewów sukcesyjnych

### 🎨 UX/UI
- **Dark Mode** - przełącznik w menu
- **Mobile-first** - BottomNav dla telefonów
- **Responsive** - działa na wszystkich urządzeniach
- **Skeleton loaders** - płynne ładowanie

### 🔒 Bezpieczeństwo
- JWT authentication (zmieniony na bezpieczny klucz)
- Rate limiting (5 prób logowania / 15 min)
- Helmet.js + CSP
- HTTPS redirect (produkcja)

### 📤 Eksport
- Eksport do CSV (działki, opryski, przypomnienia)
- Wszystkie dane w jednym pliku

---

## 📚 Szczegółowe instrukcje

- **OpenWeather setup:** Zobacz `OPENWEATHER_SETUP.md`
- **TODO lista:** Zobacz `TODO.md` (większość zrobiona!)
- **Wytyczne:** Zobacz `RESEARCH_RECOMMENDATIONS.md`
- **Features:** Zobacz `FEATURES_QUICK_WINS.md`

---

## 🐛 Troubleshooting

### Problem: "OPENWEATHER_API_KEY nie ustawiony"
**Rozwiązanie:** Dodaj klucz do `.env` i zrestartuj backend

### Problem: "Nie można pobrać danych pogodowych"
**Przyczyny:**
- Klucz API nieaktywny (czekaj 10-120 min)
- Nieprawidłowe współrzędne
- Brak internetu

**Test klucza:** Otwórz w przeglądarce:
```
https://api.openweathermap.org/data/2.5/weather?lat=52.229676&lon=21.012229&appid=TWOJ_KLUCZ&units=metric
```

### Problem: Widget pogody nie pokazuje się
**Rozwiązanie:**
1. Ustaw lokalizację w Profilu
2. Odśwież Dashboard (F5)
3. Sprawdź konsolę przeglądarki (F12) - błędy

---

## 💡 Wskazówki dla hobbysty

### Workflow sezonowy:

**Wiosna:**
1. Dodaj działki i grządki
2. Wpisz daty sadzenia
3. System obliczy przewidywane zbiory

**Lato:**
1. Sprawdzaj Dashboard - co dojrzeje?
2. Dodawaj opryski (system powie kiedy bezpiecznie zbierać)
3. Obserwuj rekomendacje pogodowe

**Jesień:**
1. Eksportuj dane do CSV
2. Zobacz statystyki zbiorów
3. Planuj następny sezon

### Najlepsze praktyki:
- ✅ Zawsze wpisuj datę sadzenia (automatyczne zbiory)
- ✅ Sprawdzaj pogodę przed opryskiem
- ✅ Dodawaj notatki na grządkach (obserwacje)
- ✅ Eksportuj dane co sezon (backup)

---

## 🎉 Gotowe!

Aplikacja jest **w pełni funkcjonalna i gotowa do użycia**.

To projekt hobbystyczny - nie ma kosztów (OpenWeather free tier: 1000 zapytań/dzień),
nie ma reklam, nie ma subskrypcji.

**Miłego ogrodnictwa!** 🌱🌤️

---

**Wersja:** v2.3+
**Data:** 2025-10-29
**Status:** Production Ready (z wyjątkiem API key do skonfigurowania)
