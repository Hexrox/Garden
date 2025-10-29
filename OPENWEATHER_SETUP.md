# OpenWeatherMap API - Instrukcja Konfiguracji

## Krok 1: Utwórz konto na OpenWeatherMap

1. Przejdź na stronę: https://openweathermap.org/

2. Kliknij **Sign In** w prawym górnym rogu

3. Kliknij **Create an Account**

4. Wypełnij formularz rejestracyjny:
   - Username (nazwa użytkownika)
   - Email
   - Password (hasło)
   - Potwierdź, że nie jesteś robotem (reCAPTCHA)
   - Zaakceptuj regulamin

5. Kliknij **Create Account**

6. **Sprawdź swoją skrzynkę email** - otrzymasz wiadomość weryfikacyjną

7. Kliknij link w emailu aby **zweryfikować konto**

---

## Krok 2: Wygeneruj API Key

1. Po zalogowaniu, kliknij na **swojego użytkownika** w prawym górnym rogu

2. Wybierz **My API keys** z menu

3. W sekcji "Create key":
   - Wpisz nazwę klucza, np. "Garden App"
   - Kliknij **Generate**

4. **Skopiuj wygenerowany klucz API**
   - Przykład klucza: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
   - ⚠️ **WAŻNE**: Klucz może być aktywny dopiero po 10 minutach - 2 godzinach!

5. Zachowaj klucz w bezpiecznym miejscu

---

## Krok 3: Dodaj klucz do aplikacji

### Backend (serwer)

1. Otwórz plik `.env` w folderze `garden-app/backend/`

2. Dodaj linię:
   ```
   OPENWEATHER_API_KEY=tutaj_wklej_swoj_klucz
   ```

   **Przykład:**
   ```
   OPENWEATHER_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   ```

3. Zapisz plik

4. **Zrestartuj backend** (jeśli był uruchomiony):
   ```bash
   # Zatrzymaj serwer (Ctrl+C)
   # Uruchom ponownie
   cd garden-app/backend
   npm start
   ```

---

## Krok 4: Ustaw lokalizację w aplikacji

1. Zaloguj się do Garden App

2. Przejdź do **Profil** (ikona 👤 w dolnym menu lub top menu)

3. W sekcji "Lokalizacja (dla pogody)":

   **Opcja A - Automatyczna lokalizacja:**
   - Kliknij **📍 Użyj mojej lokalizacji**
   - Przeglądarka zapyta o zgodę - kliknij "Zezwól"
   - Współrzędne zostaną automatycznie wypełnione
   - Kliknij **Zapisz lokalizację**

   **Opcja B - Ręczne wprowadzenie:**
   - Wejdź na Google Maps
   - Kliknij prawym przyciskiem na swoją lokalizację
   - Skopiuj współrzędne (np. `52.229676, 21.012229`)
   - Wklej do formularza:
     - Szerokość geograficzna: `52.229676`
     - Długość geograficzna: `21.012229`
     - Miasto (opcjonalnie): `Warszawa`
   - Kliknij **Zapisz lokalizację**

4. Odśwież Dashboard - powinna pojawić się pogoda!

---

## Krok 5: Weryfikacja działania

1. Przejdź na **Dashboard**

2. Powinieneś zobaczyć:
   - Widget pogody z temperaturą i opisem
   - Rekomendacje dla ogrodu:
     - ✅ "Dobre warunki do oprysku" lub
     - ⚠️ "Niekorzystne warunki do oprysku"
   - Ewentualne alerty:
     - 🧊 Ostrzeżenie przed przymrozkami
     - 💧 Rekomendacje podlewania
     - 💨 Ostrzeżenia o silnym wietrze

3. Jeśli widget pokazuje błąd:
   - Sprawdź czy klucz API jest prawidłowy
   - Sprawdź czy minęło 10 minut - 2h od wygenerowania klucza
   - Sprawdź czy backend jest uruchomiony
   - Sprawdź konsol

ę przeglądarki (F12) - błędy

---

## Limity darmowego planu

**Free Tier OpenWeatherMap:**
- ✅ 1,000 zapytań API dziennie
- ✅ 60 zapytań na minutę
- ✅ Aktualna pogoda
- ✅ Prognoza 5-dniowa (co 3h)
- ✅ Wystarczy dla ~100 użytkowników dziennie

**Cache w Garden App:**
- Dane pogodowe są cachowane przez 30 minut
- Nie ma ryzyka przekroczenia limitu przy normalnym użyciu

---

## Troubleshooting (Rozwiązywanie problemów)

### Problem: "OPENWEATHER_API_KEY nie ustawiony"

**Rozwiązanie:**
1. Sprawdź czy plik `.env` istnieje w `garden-app/backend/`
2. Sprawdź czy jest linia `OPENWEATHER_API_KEY=...`
3. Zrestartuj backend

### Problem: "Nie można pobrać danych pogodowych"

**Możliwe przyczyny:**
1. **Klucz API nieaktywny** - poczekaj 10 minut - 2h po wygenerowaniu
2. **Nieprawidłowe współrzędne** - sprawdź zakres (-90 do 90, -180 do 180)
3. **Brak internetu** - sprawdź połączenie
4. **Przekroczony limit API** - poczekaj do następnego dnia (rzadkie)

**Weryfikacja klucza:**
Otwórz w przeglądarce:
```
https://api.openweathermap.org/data/2.5/weather?lat=52.229676&lon=21.012229&appid=TWOJ_KLUCZ&units=metric
```
Zamień `TWOJ_KLUCZ` na swój klucz API.

Jeśli działa, zobaczysz JSON z danymi pogody.

### Problem: "Lokalizacja nie ustawiona"

**Rozwiązanie:**
1. Przejdź do **Profil**
2. Ustaw współrzędne geograficzne
3. Kliknij **Zapisz lokalizację**
4. Odśwież Dashboard

### Problem: Widget pogody się nie pokazuje

**Rozwiązanie:**
1. Sprawdź konsolę przeglądarki (F12)
2. Sprawdź czy backend działa (`npm start` w folderze backend)
3. Sprawdź czy frontend działa (`npm start` w folderze frontend)
4. Wyczyść cache przeglądarki (Ctrl+Shift+R)

---

## Przydatne linki

- 📚 **Dokumentacja API**: https://openweathermap.org/api
- 🔑 **Zarządzanie kluczami**: https://home.openweathermap.org/api_keys
- 💬 **Support**: https://openweathermap.org/faq
- 📖 **Cennik**: https://openweathermap.org/price

---

## FAQ

**Q: Czy muszę płacić za OpenWeatherMap?**
A: Nie! Darmowy plan (Free Tier) w zupełności wystarcza dla Garden App. 1000 zapytań dziennie to bardzo dużo.

**Q: Co jeśli przekroczę 1000 zapytań dziennie?**
A: API przestanie działać do północy (reset limitu). W praktyce jest to bardzo trudne do osiągnięcia dzięki cache (30 minut).

**Q: Czy moje dane pogodowe są aktualne?**
A: Tak, dane odświeżane co 30 minut. OpenWeatherMap aktualizuje dane co 10 minut.

**Q: Czy mogę zmienić lokalizację później?**
A: Tak! W każdej chwili możesz zmienić lokalizację w Profilu.

**Q: Dlaczego nie widzę pogody po zapisaniu lokalizacji?**
A: Odśwież stronę (F5) lub kliknij "Odśwież" w widgecie pogody na Dashboardzie.

---

**Gotowe!** Teraz Twoja aplikacja ma integrację z pogodą i inteligentne rekomendacje ogrodnicze! 🌤️🌱
