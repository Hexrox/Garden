# 📦 Analiza systemu Import/Export z ZIP

**Data analizy:** 2025-01-15
**Status:** Pomysł do rozważenia w przyszłości
**Szacowany czas implementacji:** 6-9 godzin

---

## 🎯 Problem

**Obecny stan:**
- ✅ Eksport danych: JSON/CSV (tylko dane tekstowe)
- ❌ Brak eksportu zdjęć (tylko ścieżki, nie pliki)
- ❌ Brak eksportu galerii (`plant_photos`)
- ❌ Brak funkcji importu danych
- ❌ Brak walidacji duplikatów

**Skutek:**
Użytkownik może wyeksportować backup, ale nie może go przywrócić. To jednokierunkowy backup (tylko do analizy w Excel).

---

## 💡 Rozwiązanie: Pełny system ZIP

### Struktura archiwum

```
garden-backup-2025-01-15-143022.zip
│
├── manifest.json          # Metadane + statystyki
├── data.json             # Wszystkie tabele
├── photos/
│   ├── plots/           # Zdjęcia poletków
│   ├── beds/            # Zdjęcia grządek
│   └── gallery/         # plant_photos
└── checksum.txt         # MD5/SHA256 walidacja
```

### manifest.json
```json
{
  "version": "2.0",
  "exported_at": "2025-01-15T14:30:22.123Z",
  "schema_version": 1,
  "user_id": 1,
  "statistics": {
    "plots": 3,
    "beds": 12,
    "spray_history": 8,
    "plant_photos": 5,
    "total_photos": 7,
    "total_size_kb": 1245
  },
  "photo_manifest": [
    {"type": "plot", "id": 1, "filename": "1735123456-abc.jpg", "size": 245123}
  ]
}
```

### data.json
```json
{
  "plots": [...],
  "beds": [...],
  "spray_history": [...],
  "plant_photos": [...],
  "tasks": [...],
  "reminders": [...],
  "succession_reminders": [...]
}
```

---

## 🔧 Technologia

**Wymagane pakiety:**
```bash
npm install archiver adm-zip
```

**Rozmiary:**
- `archiver`: 181 KB (eksport ZIP)
- `adm-zip`: 45 KB (import ZIP)

**API endpoints:**
- `GET /api/export/complete/zip` - generuj ZIP
- `POST /api/import/validate` - waliduj ZIP
- `POST /api/import/execute` - wykonaj import

---

## 🔒 Walidacja przy imporcie

### 1. Walidacja pliku ZIP
```javascript
// Sprawdź format, rozmiar (max 50 MB), strukturę
if (file.size > 50_000_000) throw new Error('Plik za duży');
if (!hasRequiredFiles(['manifest.json', 'data.json'])) throw new Error('Brak wymaganych plików');

// Weryfikuj wersję schematu
if (manifest.schema_version > CURRENT_SCHEMA_VERSION) {
  throw new Error('Ten backup wymaga nowszej wersji aplikacji');
}

// Detect zip bombs
const ratio = uncompressedSize / compressedSize;
if (ratio > 100) throw new Error('Suspicious compression ratio');
```

### 2. Walidacja danych
```javascript
// JSON Schema validation (Joi)
const schema = {
  plots: Joi.array().items({
    name: Joi.string().required(),
    image_path: Joi.string().allow(null)
  })
};

// Weryfikuj relacje (foreign keys)
for (const bed of data.beds) {
  const plotExists = data.plots.find(p => p.id === bed.plot_id);
  if (!plotExists) throw new Error(`Bed references non-existent plot`);
}

// Sprawdź czy zdjęcia istnieją w ZIP
for (const photo of manifest.photo_manifest) {
  if (!zip.hasFile(`photos/${photo.type}s/${photo.filename}`)) {
    warnings.push(`Missing photo: ${photo.filename}`);
  }
}
```

### 3. Walidacja bezpieczeństwa
```javascript
// Path Traversal
if (entry.name.includes('..')) throw new Error('Path traversal attempt');

// Limit liczby plików
if (manifest.photo_manifest.length > 1000) throw new Error('Too many photos');

// Whitelist typów plików
const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
if (!allowed.includes(ext)) throw new Error('Invalid file type');
```

---

## 🔄 Strategie obsługi duplikatów

### Opcja 1: MERGE (dodaj do istniejących) - ZALECANA
```javascript
// 1. Generuj nowe ID (auto-increment)
const importedPlots = data.plots.map(plot => ({
  ...plot,
  id: undefined,  // Baza nada nowe ID
  user_id: currentUser.id,
  name: isDuplicate(plot.name) ? `${plot.name} (imported)` : plot.name
}));

// 2. Mapowanie starych → nowych ID
const idMapping = {
  plots: { oldId1: newId1, oldId2: newId2 },
  beds: { oldId3: newId3 }
};

// 3. Aktualizuj foreign keys
bed.plot_id = idMapping.plots[bed.plot_id];

// 4. Zmień nazwy zdjęć (unikaj konfliktów)
const newFilename = `imported-${Date.now()}-${originalFilename}`;
```

### Opcja 2: REPLACE (zastąp istniejące)
```javascript
// 1. Usuń wszystkie dane użytkownika (CASCADE)
await db.run('DELETE FROM plots WHERE user_id = ?', [userId]);
await db.run('DELETE FROM tasks WHERE user_id = ?', [userId]);

// 2. Usuń zdjęcia z dysku
fs.unlinkSync(`/var/www/garden-uploads/${photo.image_path}`);

// 3. Import wszystkiego
insertImportedData(data);
```

### Opcja 3: SKIP (tylko nowe, pomijaj duplikaty)
```javascript
// Sprawdź czy istnieje (po nazwie/dacie)
const exists = await db.get('SELECT id FROM plots WHERE user_id = ? AND name = ?');
if (exists) {
  console.log('Skipping duplicate:', plot.name);
  continue;
}
```

---

## 🛡️ Zabezpieczenia

### Zagrożenia:
- ❌ **Zip Bomb** - 42.zip (42 KB → 4.5 PB)
- ❌ **Path Traversal** - `../../etc/passwd`
- ❌ **XSS** - `<script>` w nazwach
- ❌ **DoS** - 1GB ZIP z milionem zdjęć

### Ochrona:
```javascript
// 1. Limit rozmiaru przed rozpakowaniem
if (compressedSize > 50_000_000) throw new Error('Too large');

// 2. Compression ratio (zip bomb detection)
if (uncompressedSize / compressedSize > 100) throw new Error('Zip bomb suspected');

// 3. Sanityzacja ścieżek
zip.forEach(entry => {
  if (entry.name.includes('..')) throw new Error('Path traversal');
});

// 4. Prepared statements (SQL injection) - ✅ już mamy

// 5. Limit plików
if (photos.length > 1000) throw new Error('Too many photos');

// 6. Whitelist rozszerzeń
allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
```

---

## 🎨 UX Flow

### Export:
```
Dashboard → Eksport danych
  ↓
[Kompletny backup (ZIP)] ← Nowy przycisk
  ↓
Progress: Zbieranie danych (25%) → Kopiowanie zdjęć (50%) → Archiwizacja (75%)
  ↓
Download: garden-backup-2025-01-15.zip (1.2 MB)
```

### Import:
```
Dashboard → Import danych
  ↓
Upload ZIP
  ↓
Walidacja...
  ✅ Plik prawidłowy
  ✅ Znaleziono: 3 poletka, 12 grządek, 7 zdjęć
  ⚠️  Masz już 2 poletka w bazie
  ↓
Wybór strategii:
  ● Dodaj do istniejących
  ○ Zastąp wszystkie dane
  ○ Tylko nowe (pomijaj duplikaty)
  ↓
Importowanie... (progress bar)
  ↓
✅ Gotowe! Zaimportowano: 3 poletka, 12 grządek, 7 zdjęć
```

---

## ⚡ Implementacja (TODO)

### Backend:
1. `npm install archiver adm-zip`
2. Rozszerz `routes/export.js`:
   - `GET /api/export/complete/zip`
3. Nowy `routes/import.js`:
   - `POST /api/import/validate`
   - `POST /api/import/execute`
4. Middleware walidacji ZIP
5. Service dla import logic + SQL transactions

### Frontend:
1. Rozszerz `pages/Export.js` - przycisk ZIP
2. Nowy `pages/Import.js`:
   - Upload component
   - Preview + wybór strategii
   - Progress bar
3. Routing `/import` w `App.js`

**Szacowany czas:** 6-9 godzin

---

## ⚠️ Potencjalne problemy

| Problem | Rozwiązanie |
|---------|-------------|
| Timeout przy dużych archiwach | Streaming + background job |
| Pamięć RAM | Streams zamiast bufora |
| Race conditions | SQL transactions |
| Rollback przy błędzie | `BEGIN TRANSACTION` + `ROLLBACK` |
| ID conflicts | Zawsze generuj nowe ID |
| Orphaned photos | Cleanup job co tydzień |
| Schema migration | Wersjonowanie w manifest |

---

## 🎯 Rekomendacja

### Warto implementować jeśli:
- ✅ Użytkownicy mają >10 poletków (wartościowe dane)
- ✅ Multi-device (backup z telefonu → restore na komputerze)
- ✅ Migration path przy zmianie hostingu
- ✅ Planowane są częste zmiany schematu bazy

### Nie teraz jeśli:
- ❌ Aplikacja ma 1-2 użytkowników
- ❌ Priorytetem są inne funkcje
- ❌ Wystarczy manual backup (`scp garden.db + uploads/`)

### Alternatywy (prostsze):
1. **Manual DB backup:** `scp root@server:/root/garden-app-backend/garden.db ./backup/`
2. **SQL dump:** `sqlite3 garden.db .dump > backup.sql` (bez zdjęć)
3. **CSV + manual photos:** obecny system + `scp -r /var/www/garden-uploads/`

---

## 📊 Obecny stan bazy danych

**Brak UNIQUE constraints dla:**
- `plots.name` - można mieć duplikaty nazw
- `beds (plot_id, row_number)` - można mieć 2× rząd nr 1
- `spray_history` - można dodać ten sam oprysk wielokrotnie

**Przy implementacji importu należy dodać:**
```sql
CREATE UNIQUE INDEX idx_beds_plot_row ON beds(plot_id, row_number);
-- Opcjonalnie: UNIQUE INDEX na (user_id, plot_name)
```

---

## 📝 Notatki

- Obecne zdjęcia w produkcji: 2 pliki, 128 KB (`/var/www/garden-uploads/`)
- Backend używa już `multer` do uploadów
- Baza SQLite - łatwy backup całości jednym plikiem
- Frontend używa `axios` - obsługa `FormData` dla ZIP już jest
- PM2 + nginx - może wymagać timeout adjustments dla dużych archiwów

---

**Koniec analizy**
