# 🎯 GARDEN APP - ACTION PLAN
**Ostatnia aktualizacja:** 20 grudnia 2025
**Status:** GOTOWE DO IMPLEMENTACJI

---

## 📊 OBECNY STAN (20.12.2025)

### ✅ Co działa:
- **Backend:** nawożenie, opryski, profile publiczne, galeria, kalendarz
- **Frontend:** Glass Card Hero z avatarem, upload zdjęć zbiorów, notatki
- **Baza:** 36 roślin (tylko warzywa + zioła), kolumny dla kwiatów gotowe
- **Dokumentacja:** 150 roślin z harmonogramami nawożenia (ANALIZA_NAWOZENIE_PIELEGNACJA.md)

### ❌ Największe GAP-y:
1. **KWIATY** - 0/60+ w bazie (konkurencja: 250-750!)
2. **DRZEWA OWOCOWE** - 0/7 w bazie
3. **KRZEWY** - 1/20+ w bazie (tylko malina)
4. **FLOWER-SPECIFIC FEATURES** - brak planowania rabat, kalendarza kwitnienia

---

## 🚀 TIER S - KRYTYCZNE (ZRÓB TO NAJPIERW!)

### 1. ✅ Import 150 roślin do bazy (WEEK 1-2) 🔴

**Zadanie:** Parsowanie ANALIZA_NAWOZENIE_PIELEGNACJA.md → migration script

**Dane do importu:**
```javascript
{
  // Warzywa: 45+ (aktualizacja istniejących + nowe)
  // Kwiaty: 60+ (byliny, jednoroczne, cebulowe, pnącza)
  // Drzewa: 7 (jabłoń, grusza, śliwa, wiśnia, brzoskwinia, morela, orzech)
  // Krzewy: 20+ (porzeczki, agrest, borówka, aronia, rokitnik, etc.)

  name: 'Róża pnąca',
  category: 'flower_perennial',
  flower_color: 'różowy,czerwony,biały,żółty',
  bloom_season: 'czerwiec-wrzesień',
  height: 'wysokie >200cm',
  sun_requirement: 'full_sun',
  is_perennial: true,
  hardiness_zone: '5-9',
  is_fragrant: true,
  is_bee_friendly: true,
  fertilization_needs: 'BARDZO WYSOKIE',
  npk: '10:10:20',
  fertilization_frequency: 'Co 2-3 tygodnie',
  notes: 'Powtarzające kwitnienie - regularne nawożenie'
}
```

**Schema update (db.js):**
```sql
ALTER TABLE plants ADD COLUMN sun_requirement TEXT; -- 'full_sun', 'partial_shade', 'shade'
ALTER TABLE plants ADD COLUMN is_perennial BOOLEAN DEFAULT 0;
ALTER TABLE plants ADD COLUMN hardiness_zone TEXT; -- '5-9' dla Polski
ALTER TABLE plants ADD COLUMN is_fragrant BOOLEAN DEFAULT 0;
ALTER TABLE plants ADD COLUMN is_bee_friendly BOOLEAN DEFAULT 0;
ALTER TABLE plants ADD COLUMN fertilization_needs TEXT; -- 'NISKIE', 'ŚREDNIE', 'WYSOKIE'
ALTER TABLE plants ADD COLUMN npk TEXT; -- '15:15:15'
ALTER TABLE plants ADD COLUMN fertilization_frequency TEXT;
ALTER TABLE plants ADD COLUMN care_notes TEXT;
```

**Rezultat:**
- ✅ 132 roślin w bazie (45 warzyw + 60 kwiatów + 7 drzew + 20 krzewów)
- ✅ Aplikacja obsługuje WSZYSTKIE typy użytkowników
- ✅ Dane gotowe dla flower-specific features

---

### 2. Category Filter w PlantSelector (WEEK 1) 🔴

**Gdzie:** `garden-app/frontend/src/components/PlantSelector.js`

**UI:**
```jsx
<select onChange={handleCategoryChange}>
  <option value="all">🌱 Wszystkie</option>
  <option value="vegetable">🥕 Warzywa</option>
  <option value="herb">🌿 Zioła</option>
  <option value="flower_perennial">🌸 Byliny</option>
  <option value="flower_annual">🌻 Kwiaty jednoroczne</option>
  <option value="flower_bulb">🌷 Cebulowe</option>
  <option value="fruit_tree">🍎 Drzewa owocowe</option>
  <option value="fruit_bush">🫐 Krzewy owocowe</option>
</select>
```

**Backend API:**
```javascript
// GET /api/plants?category=flower_perennial
router.get('/plants', (req, res) => {
  const { category } = req.query;
  let sql = 'SELECT * FROM plants';
  if (category && category !== 'all') {
    sql += ' WHERE category = ?';
  }
  // ...
});
```

**Impact:** 🚀🚀 Użytkownicy mogą wybierać kwiaty i drzewa!

---

### 3. Flower Data Display (WEEK 1-2) 🔴

**Gdzie:** Bed cards w `PlotDetail.js`, `PublicProfile.js`

**UI rozszerzenie:**
```jsx
{bed.category === 'flower_perennial' && (
  <div className="flex gap-2 mt-2">
    {bed.flower_color && (
      <span className="text-xs bg-pink-100 px-2 py-1 rounded">
        🌸 {bed.flower_color}
      </span>
    )}
    {bed.bloom_season && (
      <span className="text-xs bg-green-100 px-2 py-1 rounded">
        📅 {bed.bloom_season}
      </span>
    )}
    {bed.sun_requirement === 'full_sun' && (
      <span className="text-xs bg-yellow-100 px-2 py-1 rounded">
        ☀️ Pełne słońce
      </span>
    )}
  </div>
)}
```

**Impact:** 🚀🚀 Visual feedback dla hodowców kwiatów!

---

## 🔥 TIER A - MUST HAVE (NASTĘPNE)

### 4. Bloom Calendar Widget (WEEK 3) 🟠

**Gdzie:** Dashboard widget

**UI:**
```jsx
<div className="bg-white rounded-lg p-4">
  <h3>📅 Co kwitnie teraz? (Czerwiec)</h3>
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <span>🌹</span>
      <span>Róże - pełnia kwitnienia</span>
    </div>
    <div className="flex items-center gap-2">
      <span>🌷</span>
      <span>Piwonie - końcówka kwitnienia</span>
    </div>
  </div>
  <p className="text-sm text-gray-500 mt-2">
    Za miesiąc: Cynia, Malwa, Rudbekia, Słonecznik
  </p>
</div>
```

**Backend:** Query plants WHERE bloom_season zawiera aktualny miesiąc

**Impact:** 🚀 Engagement, użytkownicy wracają

---

### 5. Import Drzew/Krzewów Owocowych (WEEK 3-4) 🟠

**W ramach zadania #1**, ale z dodatkowymi features:

**Nowe pola dla drzew:**
```sql
ALTER TABLE beds ADD COLUMN tree_age INTEGER; -- lat
ALTER TABLE beds ADD COLUMN planting_year INTEGER;
ALTER TABLE beds ADD COLUMN last_pruning_date DATE;
ALTER TABLE beds ADD COLUMN pollinator_variety TEXT; -- dla jabłoni
```

**Tracker plonów:**
- Historia zbiorów per drzewo (rok, kg, jakość)
- Porównanie lat: 2024 vs 2023 vs 2022
- Średnia plonów

**Impact:** 🚀 Drugi duży segment (Marek - sadownik!)

---

## 🟡 TIER B - SHOULD HAVE (PÓŹNIEJ)

### 6. Flower Bed Planner (WEEK 5-6)
- Filtruj według: słońce, wysokość, kolor, sezon
- Rekomendacje: "wysokie z tyłu, niskie z przodu"
- Visual: preview rabaty

### 7. Pruning Calendar (WEEK 7)
- Przypomnienia: cięcie zimowe (styczeń-marzec)
- Przypomnienia: cięcie letnie (lipiec-sierpień)
- Instrukcje wideo

### 8. Color Scheme Generator (WEEK 8)
- Monochromatyczny / analogiczny / komplementarny / pastelowy
- Sugerowane kombinacje roślin

### 9. Garden Journal MVP (WEEK 9-10)
- Wpisy z datą + zdjęcie
- Timeline: "Dzisiaj kwitły irysy!" 🌸
- Publiczne udostępnianie

### 10. Achievements System (WEEK 11-12)
- 🌸 "Ogrodnik kwiatowy" - 10 różnych kwiatów
- 🐝 "Przyjaciel pszczół" - 10 roślin miododajnych
- 🌈 "Tęczowa rabata" - 5 kolorów

---

## 🐛 ZNANE PROBLEMY DO NAPRAWY (BACKLOG)

### Z ANALIZA-ONBOARDING-PROBLEMY.md:
1. **Onboarding wyskakuje przy każdym logowaniu** - "Pomiń" nie zapisuje do DB
2. **Onboarding pokazuje się użytkownikom z danymi** - brak sprawdzenia czy ma plots/beds

### Z ANALIZA_BLEDOW.md:
1. **Orphaned files** - upload pliku bez rekordu w DB (cleanup needed)
2. **Brak error handlingu** w niektórych miejscach

**Rozwiązanie:** Osobny sprint bugfixów po TIER S

---

## 📊 SUCCESS METRICS

### Immediate (Po TIER S - miesiąc 1):
- ✅ 132+ roślin w bazie (warzywa + kwiaty + drzewa + krzewy)
- ✅ Category filter działa
- ✅ Flower data visible w UI

### Short-term (3 miesiące):
- 📈 % użytkowników z kwiatami > 30%
- 📈 Retention +15%
- 📸 Zdjęcia kwiatów w galerii +50%

### Long-term (6-12 miesięcy):
- 👥 Nowi użytkownicy: "flower gardeners", "fruit growers"
- 🌍 Społeczność: forum, wyzwania, dzienniki
- ⭐ Reviews: "Finally! An app for flowers AND fruits!"

---

## 🎯 NEXT ACTIONS - CO ROBIĆ TERAZ?

**Krok 1:** Parsowanie ANALIZA_NAWOZENIE_PIELEGNACJA.md
**Krok 2:** Migration script → populate plants table
**Krok 3:** Deploy backend (schema + dane)
**Krok 4:** Category filter w PlantSelector
**Krok 5:** Flower data display w UI
**Krok 6:** Deploy frontend
**Krok 7:** Test + iterate

---

## 📚 ŹRÓDŁA DANYCH

- **ANALIZA_NAWOZENIE_PIELEGNACJA.md** - 150 roślin z harmonogramami nawożenia (ZACHOWAĆ!)
- Research: Seedtime (750+ kwiatów), Old Farmer's Almanac (250+ roślin)
- Trendy: succession planting, bloom calendar, color schemes

---

*Koniec planu. Czas działać! 🚀*
