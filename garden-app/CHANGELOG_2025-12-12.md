# Changelog - 2025-12-12

## 🎯 Główne Zadania

### 1. ✅ Drag & Drop dla Grządek
**Problem:** Przycisk "Edytuj układ" nie był widoczny po poprzednim wdrożeniu
**Rozwiązanie:**
- Przebudowanie frontendu z najnowszymi zmianami
- Wdrożenie na produkcję
- Frontend był z 10 grudnia, teraz zaktualizowany

**Pliki:** `BedGridView.js`

---

### 2. ✅ System Roślin Towarzyszących (Companion Planting)

**Opis:** Bardzo przydatna funkcja pokazująca które rośliny dobrze rosną obok siebie!

#### Backend:
- **Tabela `companion_plants`** z 80+ relacjami roślin:
  - Pomidor ✓ bazylia, marchew, cebula ✗ kapusta, ogórek, ziemniak
  - Ogórek ✓ fasola, koper, rzodkiewka ✗ pomidor, ziemniak
  - Marchew ✓ cebula, pomidor, groszek ✗ koper
  - Cebula ✓ marchew, pomidor, sałata ✗ fasola, groszek
  - Fasola ✓ kukurydza, dynia, kapusta ✗ cebula, czosnek
  - Kapusta ✓ fasola, ogórek, sałata ✗ pomidor, truskawka
  - Ziemniak ✓ fasola, kapusta ✗ pomidor, ogórek
  - Papryka ✓ bazylia, cebula ✗ fasola
  - I wiele więcej...

- **Endpoint:** `GET /api/plants/companions/:plantName`
  - Zwraca: `{ good: [{name, reason}], bad: [{name, reason}] }`

#### Frontend:
- **BedEditModal** - podpowiedzi podczas edycji grządki
  - ✓ **Dobrze rośnie obok:** lista z uzasadnieniami
  - ✗ **Unikaj sadzenia obok:** lista z uzasadnieniami
  - Automatyczne ładowanie przy zmianie rośliny
  - Ładny kolorowy UI z ikonami
  - Dark mode support

**Przykład:**
Wybierasz "pomidor" → widzisz:
- ✓ Bazylia - odstrasza szkodniki i poprawia smak
- ✓ Marchew - poluzowuje glebę dla korzeni
- ✗ Kapusta - konkurują o składniki odżywcze
- ✗ Ogórek - ryzyko przeniesienia chorób

**Commit:** `857db83` - feat: Dodano system roślin towarzyszących

---

### 3. ✅ Kompletny System Onboardingu

**Problem:** Nowi użytkownicy nie wiedzieli od czego zacząć i jakie możliwości ma aplikacja

#### OnboardingWizard (5 kroków):

**Krok 1: Zainteresowania**
- Wybór: warzywa 🥕, kwiaty 🌺, zioła 🌿, owoce 🍓
- Multi-select

**Krok 2: Lokalizacja**
- Geolokalizacja (automatyczna)
- LUB ręczne wpisanie miasta
- Potrzebne do prognozy pogody

**Krok 3: Co to jest "Poletko"?**
- Wyjaśnienie koncepcji
- Przykłady:
  - 🏡 Ogród - "Ogródek za domem"
  - 🪴 Balkon - "Balkon od południa"
  - 🌻 Działka - "Działka ROD Zielona"
  - 🏠 Szklarnia - "Moja szklarnia"

**Krok 4: Co to jest "Grządka"?**
- Wyjaśnienie workflow
- Grządka = rząd/miejsce na poletku
- Przykład: Poletko "Ogród" → Grządka 1: Pomidory, Grządka 2: Ogórki

**Krok 5: Showcase Funkcji**
- 📸 Galeria - dokumentuj postępy zdjęciami
- 🌙 Kalendarz księżycowy - najlepsze dni do siewu
- ✅ Auto-zadania - przypomnienia o zbiorze i podlewaniu
- ☀️ Pogoda - prognozy dla Twojej lokalizacji
- 🌿 Rośliny towarzyszące - co sadź obok czego
- 📊 Statystyki - śledź plony i analizuj

#### WelcomeCard:
- **Progress tracking** 4 zadań:
  1. 🌱 Dodaj pierwsze poletko
  2. 📍 Ustaw lokalizację (pogoda)
  3. 📸 Zrób pierwsze zdjęcie
  4. 🌙 Zobacz kalendarz księżycowy

- Automatyczne sprawdzanie postępu z API
- Progress bar (0/4 → 4/4)
- Przycisk "📖 Pokaż przewodnik" - ponowne uruchomienie wizarda
- Auto-hide po ukończeniu wszystkich zadań
- Motywacyjne wiadomości: "💪 Świetnie Ci idzie!"

#### FAQ na Dashboard:
**7 najczęstszych pytań z accordion:**

1. **Od czego zacząć?**
   - Stwórz poletko → dodaj grządki → aplikacja obliczy daty

2. **Czym różni się poletko od grządki?**
   - Poletko = lokalizacja, Grządka = konkretna roślina

3. **Jak działa kalendarz księżycowy?**
   - Najlepsze dni do siewu według faz Księżyca

4. **Co to są rośliny towarzyszące?**
   - Podpowiedzi co sadź obok czego (pomidor + bazylia ✓)

5. **Jak działają automatyczne zadania?**
   - Auto-generowanie przypomnień o zbiorze, podlewaniu, karencji

6. **Czy mogę śledzić postępy zdjęciami?**
   - Tak! Galeria z tagami i timeline

7. **Skąd aplikacja wie o pogodzie?**
   - Po ustawieniu lokalizacji - automatyczne prognozy

#### Backend:
- **Endpoint:** `PUT /api/auth/complete-onboarding`
- **Kolumny w bazie:** `onboarding_completed`, `onboarding_step`

#### Integracja:
- OnboardingWizard pokazuje się automatycznie dla nowych użytkowników
- WelcomeCard dla użytkowników po onboardingu
- Możliwość pominięcia wizarda ("Pomiń na później")
- LocalStorage do zapamiętania ukrycia WelcomeCard

**Commit:** `8357a72` - feat: Kompletny system onboardingu dla nowych użytkowników

---

## 📊 Statystyki

**Zmienione pliki:**
- Backend: `db.js`, `routes/auth.js`, `routes/plants.js`
- Frontend: `Dashboard.js`, `BedEditModal.js`
- Nowe: `OnboardingWizard.js`, `WelcomeCard.js`

**Linie kodu:**
- OnboardingWizard: ~520 linii
- WelcomeCard: ~214 linii
- FAQ w Dashboard: ~80 linii
- Companion plants data: 80+ relacji roślin

**Bundle size:**
- Przed: 133.73 kB
- Po: 138.67 kB (+4.94 kB)

---

## 🚀 Deployment

**Frontend:**
- Build: ✅ Sukces
- Deploy: ✅ rsync → `/root/garden/garden-app/frontend/build/`
- Cache cleared: ✅

**Backend:**
- Deploy: ✅ → `/root/garden/garden-app/backend/`
- PM2 restart: ✅ garden-app restarted 7 razy
- Database: ✅ Tabele utworzone
- Companion plants: ✅ 80+ relacji dodanych

**Git:**
- Commit 1: `857db83` - Companion planting
- Commit 2: `8357a72` - Onboarding system
- Push: ✅ → origin/main

---

## 🎨 UX Improvements

### Dla Nowych Użytkowników:
1. **Pierwszy login** → Interaktywny wizard (5 kroków)
2. **Po onboardingu** → WelcomeCard z 4 zadaniami
3. **FAQ zawsze widoczne** na dole Dashboard
4. **Możliwość ponownego uruchomienia** wizarda

### Dla Doświadczonych Użytkowników:
1. **Rośliny towarzyszące** przy każdej edycji grządki
2. **Drag & drop** układu grządek w wizualnym widoku
3. **FAQ** dla szybkiego przypomnienia funkcji

---

## 🐛 Poprawione Błędy

1. ✅ Przycisk "Edytuj układ" nie był widoczny
   - Przyczyna: Stary build z 10 grudnia
   - Rozwiązanie: Rebuild i deploy

2. ✅ Brak companion_plants na produkcji
   - Przyczyna: db.js nie został skopiowany do właściwego katalogu
   - Rozwiązanie: rsync do `/root/garden/garden-app/backend/`

---

## 📝 Notatki

- **Język:** Wszystko w polskim z emoji dla czytelności
- **Dark Mode:** Pełne wsparcie we wszystkich nowych komponentach
- **Responsive:** Działa na mobile i desktop
- **Accessibility:** Przycisk "Pomiń" dla użytkowników w pośpiechu

---

## 🔮 Co Dalej?

Możliwe rozszerzenia:
- [ ] Więcej roślin w bazie companion plants
- [ ] Video tutorial w onboardingu
- [ ] Gamifikacja - badges za ukończone zadania
- [ ] Template gardens - gotowe zestawy grządek
- [ ] Onboarding progress w profilu użytkownika

---

**Wdrożono:** 2025-12-12
**Czas pracy:** ~2-3 godziny
**Status:** ✅ Wszystko działa na produkcji
