# 🐛 Analiza problemów z Onboardingiem - 14.12.2025

## 🔴 PROBLEM 1: Onboarding wyskakuje przy każdym logowaniu

### Przyczyna:
**Dashboard.js:69-72** - Funkcja `handleOnboardingSkip()`:
```javascript
const handleOnboardingSkip = () => {
  setShowOnboarding(false);
  setShowWelcomeCard(true);
};
```

**Co jest złe:**
- Gdy użytkownik kliknie "Pomiń", onboarding się zamyka lokalnie
- ALE nie zapisuje `onboarding_completed = 1` w bazie danych!
- Przy następnym logowaniu `checkOnboardingStatus()` znowu widzi `onboarding_completed === 0`
- I pokazuje onboarding ponownie!

**Co powinno być:**
- "Pomiń" również powinno wywołać `axios.put('/api/auth/complete-onboarding')`
- Wtedy `onboarding_completed` zostanie ustawione na 1 w bazie
- I onboarding się już nie pokaże

---

## 🔴 PROBLEM 2: Onboarding pokazuje się użytkownikom z danymi

### Przyczyna:
**Dashboard.js:36-53** - Funkcja `checkOnboardingStatus()`:
```javascript
const checkOnboardingStatus = async () => {
  const response = await axios.get('/api/auth/profile');
  const completed = response.data.onboarding_completed === 1;

  if (!completed) {
    setShowOnboarding(true);  // <-- TYLKO to sprawdza!
  }
};
```

**Co jest złe:**
- Sprawdza TYLKO flagę `onboarding_completed`
- NIE sprawdza czy user ma już poletka, grządki, zdjęcia
- Więc użytkownik z 10 poletkami i 50 zdjęciami dostanie onboarding bo ma `onboarding_completed = 0`

**Co powinno być:**
- Sprawdzać dodatkowo: `if (user has plots OR user has beds OR user has photos)`
- Jeśli ma jakiekolwiek dane → NIE pokazuj onboardingu (nawet jeśli `completed = 0`)
- Logika: "Jeśli user już używa aplikacji, to nie potrzebuje przewodnika"

**Pseudokod:**
```javascript
const hasData = await checkIfUserHasData(); // plots > 0 OR beds > 0 OR photos > 0

if (!completed && !hasData) {
  setShowOnboarding(true);
} else if (!completed && hasData) {
  // User ma dane ale nie ukończył onboardingu
  // Automatycznie oznacz jako ukończony
  await axios.put('/api/auth/complete-onboarding');
}
```

---

## 🔴 PROBLEM 3: Onboarding usuwa lokalizację z pogody

### Przyczyna 1: Nieistniejący endpoint
**OnboardingWizard.js:66** - Próba zapisu lokalizacji:
```javascript
await axios.put('/api/auth/update-profile', { latitude, longitude });
```

**Backend auth.js:217-250** - Endpoint `/profile` (nie `/update-profile`!):
```javascript
const ALLOWED_FIELDS = ['hardiness_zone', 'first_frost_date', 'last_frost_date', 'location'];
```

**Co jest złe:**
- Frontend wywołuje `/api/auth/update-profile` - **ten endpoint NIE ISTNIEJE!**
- Nawet gdyby istniał `/profile`, to `latitude` i `longitude` są **zablokowane whitelistą**
- Więc lokalizacja z geolokalizacji **nigdy się nie zapisuje**

### Przyczyna 2: Nadpisywanie danych
**OnboardingWizard.js:85-90** - Zapis miasta:
```javascript
const saveCity = async () => {
  if (formData.city) {
    await axios.put('/api/auth/update-profile', { city: formData.city });
  }
};
```

**Co jest złe:**
- Próbuje zapisać `city`
- Ale ten endpoint nie istnieje / nie akceptuje tego pola
- Jeśli użytkownik wcześniej miał `latitude/longitude` z pogody
- I teraz wybierze miasto ręcznie
- To może nadpisać/wyczyścić poprzednie dane

---

## ✅ ROZWIĄZANIA (do implementacji)

### FIX 1: "Pomiń" powinno zapisywać onboarding jako ukończony
**Plik:** `Dashboard.js:69`

**Obecne:**
```javascript
const handleOnboardingSkip = () => {
  setShowOnboarding(false);
  setShowWelcomeCard(true);
};
```

**Powinno być:**
```javascript
const handleOnboardingSkip = async () => {
  try {
    await axios.put('/api/auth/complete-onboarding');
  } catch (error) {
    console.error('Error completing onboarding:', error);
  }
  setShowOnboarding(false);
  setOnboardingCompleted(true);
  setShowWelcomeCard(true);
};
```

---

### FIX 2: Nie pokazuj onboardingu użytkownikom z danymi
**Plik:** `Dashboard.js:36`

**Obecne:**
```javascript
const checkOnboardingStatus = async () => {
  const response = await axios.get('/api/auth/profile');
  const completed = response.data.onboarding_completed === 1;

  if (!completed) {
    setShowOnboarding(true);
  }
};
```

**Powinno być:**
```javascript
const checkOnboardingStatus = async () => {
  const response = await axios.get('/api/auth/profile');
  const completed = response.data.onboarding_completed === 1;

  // Sprawdź czy user ma już dane
  const plotsRes = await axios.get('/api/plots');
  const hasData = plotsRes.data.length > 0;

  if (!completed && !hasData) {
    // Nowy użytkownik bez danych - pokaż onboarding
    setShowOnboarding(true);
  } else if (!completed && hasData) {
    // User ma dane ale nie ukończył onboardingu - oznacz jako ukończony
    await axios.put('/api/auth/complete-onboarding');
    setOnboardingCompleted(true);
  }
};
```

---

### FIX 3: Napraw zapis lokalizacji
**Problem:** Endpoint `/api/auth/update-profile` nie istnieje

**Opcja A: Dodać nowy endpoint (preferowane)**
**Plik:** `backend/routes/auth.js`

```javascript
// PUT /api/auth/update-location - onboarding location update
router.put('/update-location', auth, (req, res) => {
  const { latitude, longitude, city } = req.body;

  const updates = [];
  const values = [];

  // Nie nadpisuj null/undefined - zachowaj istniejące wartości
  if (latitude !== undefined && latitude !== null) {
    updates.push('latitude = ?');
    values.push(latitude);
  }

  if (longitude !== undefined && longitude !== null) {
    updates.push('longitude = ?');
    values.push(longitude);
  }

  if (city !== undefined && city !== null) {
    updates.push('city = ?');
    values.push(city);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'Brak danych do aktualizacji' });
  }

  values.push(req.user.id);

  db.run(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    values,
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Błąd aktualizacji lokalizacji' });
      }
      res.json({ message: 'Lokalizacja zaktualizowana' });
    }
  );
});
```

**Opcja B: Dodać pola do istniejącego `/profile`**
**Plik:** `backend/routes/auth.js:219`

Zmienić whitelist:
```javascript
const ALLOWED_FIELDS = [
  'hardiness_zone', 'first_frost_date', 'last_frost_date',
  'location', 'latitude', 'longitude', 'city'  // <-- dodać te 3
];
```

I zmienić frontend:
```javascript
// OnboardingWizard.js:66
await axios.put('/api/auth/profile', { latitude, longitude }); // nie update-profile!

// OnboardingWizard.js:87
await axios.put('/api/auth/profile', { city: formData.city });
```

---

### FIX 4: Zachowaj istniejącą lokalizację
**Plik:** `OnboardingWizard.js:58`

**Problem:** Jeśli user odmówi geolokalizacji lub wpisze miasto, może stracić poprzednią lokalizację

**Rozwiązanie:**
```javascript
const requestGeolocation = () => {
  // Przed zapisaniem - sprawdź czy user już ma lokalizację
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Zapisz TYLKO jeśli user wyraził zgodę (nie nadpisuj null)
          await axios.put('/api/auth/update-location', { latitude, longitude });
          setFormData(prev => ({ ...prev, hasGeolocation: true }));
        } catch (error) {
          // Błąd zapisu - nie szkodzi, user może podać miasto
        }
      },
      (error) => {
        // User odmówił - NIC NIE ROBIMY, nie nadpisujemy istniejącej lokalizacji
        console.log('Geolocation declined');
      }
    );
  }
};
```

---

## 📋 PRIORYTET NAPRAW

### 🔥 KRYTYCZNE (natychmiast):
1. **FIX 1** - "Pomiń" powinno zapisywać `onboarding_completed = 1`
   - Bez tego onboarding będzie wyskakiwał w kółko

2. **FIX 2** - Nie pokazuj onboardingu użytkownikom z danymi
   - Irytujące dla istniejących użytkowników

### 🟡 WAŻNE (wkrótce):
3. **FIX 3** - Napraw endpoint `/update-profile` lub użyj `/profile`
   - Lokalizacja z onboardingu się nie zapisuje

4. **FIX 4** - Nie nadpisuj istniejącej lokalizacji
   - User traci pogodę po przejściu onboardingu

---

## 🎯 TESTOWANIE PO NAPRAWIE

### Test 1: Nowy użytkownik
1. Zarejestruj nowe konto
2. Zobaczysz onboarding ✅
3. Kliknij "Pomiń"
4. Odśwież stronę
5. **Onboarding NIE POWINIEN się pokazać ponownie** ✅

### Test 2: Istniejący użytkownik
1. Zaloguj się na konto z poletkami/grządkami
2. **Onboarding NIE POWINIEN się pokazać** ✅
3. W bazie: `onboarding_completed` powinno być `1`

### Test 3: Lokalizacja
1. Nowy user przechodzi onboarding
2. Wybiera lokalizację (geolokalizacja lub miasto)
3. Kończy onboarding
4. Sprawdź: `latitude`, `longitude` lub `city` powinny być zapisane w bazie
5. Pogoda powinna działać ✅

### Test 4: Nie nadpisuj lokalizacji
1. User już ma `city = "Warszawa"` w profilu
2. Przechodzi onboarding ponownie (test)
3. Odmawia geolokalizacji
4. **`city` powinno nadal być "Warszawa"** ✅

---

## 📝 PODSUMOWANIE

**3 główne problemy:**
1. ❌ "Pomiń" nie zapisuje `onboarding_completed` → wyskakuje w kółko
2. ❌ Pokazuje się użytkownikom z danymi → irytujące
3. ❌ Lokalizacja się nie zapisuje → endpoint nie istnieje

**Co naprawić:**
- `handleOnboardingSkip` → dodać zapis do bazy
- `checkOnboardingStatus` → sprawdzać czy user ma dane
- Backend → dodać `/update-location` endpoint lub rozszerzyć `/profile`
- Frontend → nie nadpisywać null/undefined

**Impact:**
- 🔴 **WYSOKI** - irytuje użytkowników przy każdym logowaniu
- 🔴 **WYSOKI** - psuje doświadczenie istniejących użytkowników
- 🟡 **ŚREDNI** - pogoda nie działa po onboardingu

---

**Data analizy:** 14.12.2025, 10:30
**Status:** Gotowe do implementacji
**Szacowany czas naprawy:** 1-2 godziny
