# 🔍 Głęboka Analiza Kodu - Znalezione Błędy i Problemy

Data: 2025-12-10
Analizowane funkcje: Display Name + Quick Photo Upload

---

## 🚨 KRYTYCZNE BŁĘDY

### 1. **Backend: Brak czyszczenia pliku przy błędzie bazy danych**
**Lokalizacja:** `garden-app/backend/routes/gallery.js` linie 233-244, 265-275, 285-295

**Problem:**
Jeśli upload pliku się powiedzie (`req.file` istnieje), ale INSERT do bazy danych się nie uda, plik zostaje na dysku jako "śmieć" - nigdy nie zostanie usunięty.

**Przykładowy scenariusz:**
1. Użytkownik uploadu 5MB zdjęcie
2. Multer zapisuje plik na dysku
3. INSERT do DB failuje (np. disk full, connection error)
4. Plik zostaje na dysku bez rekordu w bazie

**Rozwiązanie:**
```javascript
function (err) {
  if (err) {
    // Usuń uploaded plik przy błędzie
    const fs = require('fs');
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Failed to cleanup:', unlinkErr);
      });
    }
    console.error('Quick photo insert error:', err);
    return res.status(500).json({ error: 'Błąd zapisywania zdjęcia' });
  }
  // ...
}
```

**Priorytet:** ⚠️ WYSOKI - może prowadzić do zapełnienia dysku

---

## 🔐 PROBLEMY BEZPIECZEŃSTWA

### 2. **Backend: Brak walidacji displayName**
**Lokalizacja:** `garden-app/backend/routes/publicProfile.js` linia 550, 610-612

**Problem:**
`displayName` nie ma żadnej walidacji:
- Brak limitu długości
- Brak sanityzacji HTML/XSS
- Może zawierać `<script>` tagi

**Przykładowy exploit:**
```javascript
displayName: '<img src=x onerror=alert(document.cookie)>'
```

**Rozwiązanie:** Dodaj walidację w linii ~527:
```javascript
body('username')
  .optional()
  .trim()
  .isLength({ min: 3, max: 30 })
  .matches(/^[a-zA-Z0-9_-]+$/)
  .withMessage('Nazwa użytkownika: 3-30 znaków, litery, cyfry, _ lub -'),
body('displayName')  // DODAJ TO
  .optional()
  .trim()
  .isLength({ max: 50 })
  .escape()  // Sanityzuje HTML
  .withMessage('Nazwa wyświetlana może mieć maksymalnie 50 znaków'),
body('bio')
  .optional()
```

**Priorytet:** 🔴 KRYTYCZNY - XSS vulnerability

---

### 3. **Backend: Brak walidacji taga w quick photo**
**Lokalizacja:** `garden-app/backend/routes/gallery.js` linia 197

**Problem:**
`tag` z req.body nie jest walidowany - użytkownik może wpisać dowolny string zamiast jednego z 12 dopuszczalnych tagów.

**Przykładowy exploit:**
```javascript
tag: '<script>alert(1)</script>' // Może być wyświetlone w galerii
```

**Rozwiązanie:** Dodaj walidację przed linią 192:
```javascript
const ALLOWED_TAGS = ['warzywa', 'kwiaty', 'zioła', 'owoce', 'siew', 'zbiór',
                      'podlewanie', 'problem', 'pielęgnacja', 'pogoda', 'sukces', 'ogólne'];

router.post('/quick', auth, upload.single('photo'), [
  body('tag').optional().isIn(ALLOWED_TAGS).withMessage('Nieprawidłowy tag'),
  body('caption').optional().trim().isLength({ max: 200 }).escape()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Usuń uploaded plik przy walidacji fail
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ errors: errors.array() });
  }
  // ...
```

**Priorytet:** 🔴 KRYTYCZNY - XSS vulnerability

---

### 4. **Backend: Brak walidacji długości caption**
**Lokalizacja:** `garden-app/backend/routes/gallery.js` linia 197

**Problem:**
Frontend limituje caption do 200 znaków, ale backend nie sprawdza - można obejść przez API.

**Rozwiązanie:** Zobacz punkt 3 - dodaj walidację `caption` razem z `tag`.

**Priorytet:** ⚠️ ŚREDNI

---

### 5. **Backend: Inconsistency w ścieżce pliku**
**Lokalizacja:** `garden-app/backend/routes/gallery.js` linia 198

**Problem:**
Quick photo używa `req.file.path` (pełna ścieżka systemowa), podczas gdy inne endpointy (np. profile photo) używają `uploads/${req.file.filename}` (relatywna ścieżka).

**Kod:**
```javascript
const photoPath = req.file.path;  // ❌ Może być: /var/www/garden-uploads/abc123.jpg
```

**Powinno być:**
```javascript
const photoPath = `uploads/${req.file.filename}`;  // ✅ uploads/abc123.jpg
```

**Konsekwencje:**
- Zdjęcia quick nie będą się wyświetlać przez nginx (błędna ścieżka w bazie)
- BARDZO POWAŻNY BUG - funkcja nie działa!

**Priorytet:** 🔴 KRYTYCZNY - funkcja nie działa

---

## ⚠️ BŁĘDY LOGICZNE

### 6. **Frontend: Slug sanitizer nie obsługuje wielkich polskich liter**
**Lokalizacja:** `garden-app/frontend/src/pages/Profile.js` linia 330-338

**Problem:**
```javascript
.toLowerCase()  // To działa dopiero tutaj
.replace(/ą/g, 'a')  // Ale to sprawdza małe litery
```

Jeśli użytkownik wpisze "Ogród Łąka", to:
1. `.toLowerCase()` → "ogród łąka"
2. `.replace(/ą/g, 'a')` → "ogrod łąka" ✅
3. Ale jeśli wpisze "OGRÓD ŁĄKA":
4. `.toLowerCase()` → "ogród łąka"
5. Działa poprawnie

**Wniosek:** Faktycznie działa poprawnie bo `.toLowerCase()` jest na początku! ✅

**Priorytet:** ✅ NIE MA PROBLEMU (false alarm)

---

### 7. **Frontend: Użycie == zamiast ===**
**Lokalizacja:** `garden-app/frontend/src/components/modals/QuickPhotoModal.js` linie 333, 336

**Problem:**
```javascript
{profile.displayName || username}  // linia 213
// vs
{plots.find(p => p.id == selectedPlot)?.name}  // linia 333 - użycie ==
```

**ESLint Warning:**
```
Expected '===' and instead saw '=='
```

**Rozwiązanie:**
```javascript
{plots.find(p => p.id === parseInt(selectedPlot))?.name}
{beds.find(b => b.id === parseInt(selectedBed))?.plant_name}
```

**Priorytet:** ⚠️ NISKI (działa, ale niezgodne z best practices)

---

### 8. **Frontend: Brak resetowania przy errorze**
**Lokalizacja:** `garden-app/frontend/src/components/modals/QuickPhotoModal.js` linia 108

**Problem:**
Jeśli modal zostanie zamknięty przez użytkownika w trakcie uploading (error), state uploading pozostaje `true` i przycisk jest disabled przy następnym otwarciu.

**Rozwiązanie:**
```javascript
const handleClose = () => {
  setStep(1);
  setPhoto(null);
  setPhotoPreview(null);
  setSelectedTag(null);
  setSelectedPlot('');
  setSelectedBed('');
  setCaption('');
  setError('');
  setUploading(false);  // DODAJ TO
  onClose();
};
```

**Priorytet:** ⚠️ ŚREDNI

---

## 📊 PROBLEMY UX

### 9. **Frontend: Brak walidacji rozmiaru pliku przed uploadem**
**Lokalizacja:** `garden-app/frontend/src/components/modals/QuickPhotoModal.js` linia 65-73

**Problem:**
Użytkownik może wybrać plik 50MB, aplikacja zacznie upload, a dopiero backend zwróci błąd po minucie.

**Rozwiązanie:**
```javascript
const handlePhotoSelect = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Sprawdź rozmiar (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    setError('Plik jest za duży. Maksymalny rozmiar: 5MB');
    return;
  }

  // Sprawdź typ pliku
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    setError('Nieprawidłowy typ pliku. Dozwolone: JPG, PNG, GIF, WebP');
    return;
  }

  setPhoto(file);
  // ...
};
```

**Priorytet:** ⚠️ ŚREDNI

---

### 10. **Frontend: Brak informacji o auto-sanityzacji slug**
**Lokalizacja:** `garden-app/frontend/src/pages/Profile.js` linia 846-857

**Problem:**
Użytkownik wpisuje "Mój Ogród!", a slug automatycznie zmienia się na "moj-ogrod" bez informacji co się dzieje.

**Rozwiązanie:** Dodaj live preview:
```jsx
<input
  type="text"
  value={publicProfile.username}
  onChange={(e) => {
    const sanitized = sanitizeSlug(e.target.value);
    handlePublicProfileChange('username', sanitized);
  }}
  // ...
/>
{publicProfile.username && (
  <p className="text-xs text-gray-500 mt-1">
    📎 Podgląd linku: gardenapp.pl/g/{publicProfile.username}
  </p>
)}
```

**Priorytet:** ⚠️ NISKI

---

## 🧹 CODE QUALITY

### 11. **Frontend: Nieużywany import**
**Lokalizacja:** `garden-app/frontend/src/components/MenuModal.js` linia 5

```javascript
import { Sprout, ... } from 'lucide-react';  // Sprout nie jest używany
```

**ESLint Warning:**
```
'Sprout' is defined but never used
```

**Rozwiązanie:** Usuń z importu.

**Priorytet:** ℹ️ BARDZO NISKI

---

## 📋 PODSUMOWANIE

### Priorytety napraw:

🔴 **KRYTYCZNE (natychmiast):**
1. ✅ Napraw ścieżkę pliku w quick photo (`uploads/` prefix) - **FUNKCJA NIE DZIAŁA**
2. ✅ Dodaj walidację displayName (XSS)
3. ✅ Dodaj walidację tag (XSS)
4. ✅ Dodaj cleanup pliku przy błędzie DB

⚠️ **WYSOKIE (w najbliższym czasie):**
5. Dodaj walidację caption długości na backendzie
6. Dodaj `setUploading(false)` w handleClose
7. Dodaj walidację rozmiaru/typu pliku na frontendzie

⚠️ **ŚREDNIE (można zrobić później):**
8. Zamień `==` na `===` w QuickPhotoModal
9. Dodaj live preview slug sanityzacji

ℹ️ **NISKIE (kosmetyczne):**
10. Usuń nieużywany import Sprout

---

## 🛠️ Rekomendacje

1. **Code review process** - wprowadź obowiązkowe review przed merge
2. **Automated tests** - dodaj testy dla walidacji i file upload
3. **ESLint strict** - włącz strict mode i napraw wszystkie warningi
4. **Security audit** - przeprowadź pełny security audit przed produkcją

