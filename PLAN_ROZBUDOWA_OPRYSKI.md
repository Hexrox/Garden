# Plan rozbudowy modułu Opryski - Workflow oparty na problemach

## 🎯 Obecny stan (zaimplementowane dzisiaj)

✅ **Baza środków ochrony roślin** (11 produktów)
- Fungicydy: Topsin M 500 SC, Miedzian 50 WP, Biosept Active, Polyversum WP
- Insektycydy: Mospilan 20 SP, Karate Zeon 050 CS
- Herbicydy: Roundup 360 Plus, Roundup 60 Hobby, Lontrel 300 SL
- Moluskocydy: Snacol 5 GB, Snacol 3 GB

✅ **Autocomplete z automatycznym wypełnianiem**
- Wpisz nazwę → System podpowiada środki
- Auto-uzupełnia: typ, dawkowanie (2L/5L), okres karencji
- Pokazuje: dla jakich roślin, przeciwko czemu

✅ **Przeliczenia dla ogrodników hobbystów**
- Dawkowanie na 2L opryskiwacz plecakowy
- Dawkowanie na 5L opryskiwacz
- Nie "2L/ha" tylko "7.5ml na 5L wody"

## 🚀 PROPOZYCJA ROZBUDOWY - Problem-First Workflow

### Koncepcja: Od problemu do rozwiązania

**Obecny flow (techniczny):**
1. Użytkownik: "Chcę opryskać grządkę"
2. System: "Wpisz nazwę środka"
3. Użytkownik: 🤔 "Jaki środek? Nie wiem..."

**Nowy flow (użytkownikocentryczny):**
1. Użytkownik: "Chcę opryskać grządkę"
2. System: "Co jest nie tak? (mszyca, parch, zaraza...)"
3. Użytkownik: "Mszyca na pomidorach"
4. System: "Polecam: Mospilan 20 SP (14 dni karencji) lub Biosept Active (bez karencji, EKO)"
5. Użytkownik: Wybiera → Formularz auto-wypełniony

### Struktura danych do dodania

#### 1. Tabela: `plant_problems` (Problemy roślin)

```sql
CREATE TABLE plant_problems (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,                    -- Nazwa problemu (np. "Mszyca brzoskwiniowa")
    common_name TEXT,                      -- Potoczna nazwa (np. "czarne mszyce")
    category TEXT NOT NULL,                -- Kategoria: szkodnik, choroba_grzybowa, choroba_bakteryjna, choroba_wirusowa, niedobór
    severity TEXT,                         -- Groźność: niska, średnia, wysoka, krytyczna

    -- Opis i rozpoznawanie
    description TEXT,                      -- Opis problemu
    symptoms TEXT,                         -- Objawy (jak rozpoznać)
    visual_signs TEXT,                     -- Znaki wizualne (przebarwienia, dziury, nalot...)

    -- Rośliny podatne
    affects_plants TEXT,                   -- JSON array: ["pomidor", "ogórek", "papryka"]
    plant_category TEXT,                   -- warzywa, owoce, kwiaty, drzewa

    -- Sezonowość
    peak_season TEXT,                      -- Kiedy najczęściej występuje (wiosna, lato, jesień)
    temperature_range TEXT,                -- Przy jakiej temperaturze (np. ">25°C")

    -- Zdjęcia
    image_url TEXT,                        -- Zdjęcie problemu (do rozpoznawania)

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Przykładowe wpisy:**
- "Mszyca brzoskwiniowa" → pomidory, papryka, bakłażan
- "Zaraza ziemniaka" → pomidor, ziemniak
- "Parch jabłoni" → jabłoń, grusza
- "Mączniak prawdziwy" → ogórek, cukinia, dynia
- "Śmietka kapuściana" → kapusta, brokuł, kalafior
- "Ślimaki nagie" → sałata, kapusta, rośliny ozdobne

#### 2. Tabela: `problem_solutions` (Połączenie problemy → środki)

```sql
CREATE TABLE problem_solutions (
    id INTEGER PRIMARY KEY,
    problem_id INTEGER NOT NULL,           -- FK do plant_problems
    product_id INTEGER,                    -- FK do spray_products (może być NULL dla metod niechemicznych)

    -- Skuteczność
    effectiveness TEXT,                    -- wysoka, średnia, niska
    speed TEXT,                            -- szybka (1-3 dni), średnia (4-7 dni), wolna (>7 dni)

    -- Metoda niechemiczna (opcjonalnie)
    non_chemical_method TEXT,              -- Np. "zbieranie ręczne", "mulczowanie", "podlewanie wieczorem"
    prevention_method TEXT,                -- Metody zapobiegania

    -- Uwagi specyficzne
    notes TEXT,                            -- Uwagi o stosowaniu dla tego konkretnego problemu
    best_stage TEXT,                       -- Najlepszy moment (np. "wczesne stadium", "zapobiegawczo")

    -- Priorytet w wynikach
    priority INTEGER DEFAULT 0,            -- Im wyższy, tym wyżej w wynikach
    is_ecological BOOLEAN DEFAULT 0,       -- Czy to rozwiązanie ekologiczne

    FOREIGN KEY(problem_id) REFERENCES plant_problems(id),
    FOREIGN KEY(product_id) REFERENCES spray_products(id)
);
```

#### 3. Rozszerzona tabela: `plant_diseases_pests` (Szczegółowa baza wiedzy)

```sql
CREATE TABLE plant_diseases_pests (
    id INTEGER PRIMARY KEY,
    problem_id INTEGER NOT NULL,           -- FK do plant_problems
    plant_name TEXT NOT NULL,              -- Konkretna roślina

    -- Rozpoznawanie
    early_symptoms TEXT,                   -- Wczesne objawy
    advanced_symptoms TEXT,                -- Zaawansowane objawy
    similar_problems TEXT,                 -- Z czym można pomylić

    -- Cykl życiowy szkodnika/rozwój choroby
    lifecycle TEXT,                        -- Cykl życiowy
    spreading_method TEXT,                 -- Jak się rozprzestrzenia

    -- Warunki sprzyjające
    favorable_conditions TEXT,             -- Warunki sprzyjające (temperatura, wilgotność)
    risk_factors TEXT,                     -- Czynniki ryzyka

    -- Zapobieganie
    prevention_cultural TEXT,              -- Metody agrotechniczne
    prevention_biological TEXT,            -- Metody biologiczne
    resistant_varieties TEXT,              -- Odmiany odporne

    -- Szkodliwość
    yield_loss_potential TEXT,             -- Potencjalna strata plonów (niska, średnia, wysoka)

    FOREIGN KEY(problem_id) REFERENCES plant_problems(id)
);
```

### Nowy UI/UX Flow

**WAŻNE:** W każdym etapie użytkownik może wybrać opcję "Własny środek" i wpisać cokolwiek (domowy preparat, lokalny środek, etc.)

#### Wariant A: Dwuetapowy (Problem → Środek)

**Ekran 1: Wybór problemu**
```
┌─────────────────────────────────────┐
│ Co zaatakowało twoją roślinę?       │
├─────────────────────────────────────┤
│ 🔍 Szukaj problemu...               │
│                                     │
│ 📊 Najczęstsze problemy:            │
│                                     │
│ [🐛 Mszyca]  [🍄 Zaraza]  [🐌 Ślimaki] │
│                                     │
│ 📁 Przeglądaj według kategorii:     │
│   • Szkodniki (20)                  │
│   • Choroby grzybowe (15)           │
│   • Choroby bakteryjne (8)          │
│   • Chwasty (5)                     │
│                                     │
│ ❓ Nie wiem co to - Pomoc w diagnozie │
└─────────────────────────────────────┘
```

Po wyborze problemu:
```
┌─────────────────────────────────────┐
│ Mszyca brzoskwiniowa                │
├─────────────────────────────────────┤
│ 📸 [Zdjęcie mszyce]                 │
│                                     │
│ ℹ️  Objawy:                          │
│ • Czarne owady na młodych pędach    │
│ • Sklejone, zdeformowane liście     │
│ • Lepki nalot (spadź)               │
│                                     │
│ 🌱 Atakuje: pomidory, papryka       │
│ 📅 Najczęściej: maj-sierpień        │
│                                     │
│ ✅ Zalecane środki:                  │
│                                     │
│ [✓] Mospilan 20 SP  ⚡ Wysoka skuteczność │
│     Karencja: 14 dni | 2g na 5L      │
│                                     │
│ [✓] Biosept Active  🌿 EKO | Bez karencji │
│     2.5ml na 5L | Powtórzyć co 7 dni  │
│                                     │
│ [✓] Karate Zeon     ⚡ Bardzo skuteczny │
│     Karencja: 7 dni | 1-3ml na 5L     │
│                                     │
│ 💡 Metody ekologiczne:               │
│ • Spryskiwanie wodą z mydłem        │
│ • Naturalni wrogowie (biedronki)     │
│                                     │
│ [Wybierz środek i przejdź dalej]    │
│                                     │
│ 💡 Lub wpisz własny środek/metodę   │
│ [+ Dodaj własny środek]             │
└─────────────────────────────────────┘
```

**Po kliknięciu "Dodaj własny środek":**
```
┌─────────────────────────────────────┐
│ Własny środek                       │
├─────────────────────────────────────┤
│ Nazwa: [napar z czosnku________]    │
│                                     │
│ Typ:                                │
│ [v] Metoda domowa                   │
│   • Metoda domowa (napar, roztwór)  │
│   • Biopreparat własny              │
│   • Inne                            │
│                                     │
│ Dawkowanie: [3 ząbki/1L wody____]   │
│ Karencja: [0] dni (brak karencji)   │
│                                     │
│ Notatki:                            │
│ [Napar z 3 ząbków czosnku na 1L]    │
│ [wody, odstać 24h, rozcieńczyć]     │
│ [1:5 przed użyciem____________]     │
│                                     │
│ [Zapisz i przejdź dalej]            │
└─────────────────────────────────────┘
```

#### Wariant B: Trzyetapowy (Roślina → Problem → Środek)

```
Krok 1: Wybierz roślinę
  └─ Pomidor (z grządki #3)

Krok 2: Co jej dolega?
  └─ Mszyca
  └─ Zaraza ziemniaka
  └─ Parch
  └─ Inne...

Krok 3: Wybierz środek
  └─ [Lista dopasowanych środków]
```

### Pomoc w diagnozie - "Nie wiem co to"

Interaktywny wizard:
```
1. "Gdzie widzisz problem?"
   • Liście
   • Łodyga/pędy
   • Owoce
   • Korzenie

2. "Jak wygląda problem?"
   • Małe owady
   • Dziury w liściach
   • Przebarwienia/plamy
   • Nalot/pleśń
   • Więdnięcie

3. "Jaki kolor?"
   • Czarny
   • Biały
   • Żółty/brązowy
   • Szary

→ System zawęża listę problemów
```

### Backend - Nowe API endpoints

```javascript
// 1. Wyszukiwanie problemów
GET /api/plant-problems?search=mszyca
GET /api/plant-problems?plant=pomidor&category=szkodnik
GET /api/plant-problems/categories

// 2. Szczegóły problemu z rozwiązaniami
GET /api/plant-problems/:id
{
  "id": 1,
  "name": "Mszyca brzoskwiniowa",
  "symptoms": "...",
  "solutions": [
    {
      "product": { /* spray_products */ },
      "effectiveness": "wysoka",
      "speed": "szybka",
      "notes": "Stosować wieczorem..."
    }
  ],
  "prevention": [...],
  "non_chemical": [...]
}

// 3. Diagnoza interaktywna
POST /api/plant-problems/diagnose
{
  "plant": "pomidor",
  "location": "liście",
  "appearance": "małe owady",
  "color": "czarny"
}
→ Returns: matching problems with confidence score

// 4. Zmodyfikowany endpoint oprysku
POST /api/beds/:bedId/sprays
{
  "problem_id": 5,              // NOWE: ID problemu
  "product_id": 1,              // Z autocomplete lub wyboru
  "spray_date": "...",
  ...
}
```

### Etapy implementacji

**Faza 1: Baza problemów (2-3 dni pracy)**
1. Research: 50-100 najpopularniejszych problemów w ogrodzie
2. Stworzenie tabel: plant_problems, problem_solutions
3. Import danych: szkodniki, choroby grzybowe, bakteryjne
4. Połączenie z istniejącymi środkami

**Faza 2: UI/UX (2 dni)**
5. Nowy ekran wyboru problemu
6. Wyszukiwarka + kategorie
7. Strona szczegółów problemu z rozwiązaniami
8. Integracja z formularzem oprysku

**Faza 3: Diagnoza (1-2 dni)**
9. Wizard "Nie wiem co to"
10. Algorytm dopasowania na podstawie objawów
11. Galeria zdjęć problemów

**Faza 4: Rozszerzenia (opcjonalne)**
12. Historia problemów na grządce
13. Statystyki: "Najczęstsze problemy w twoim ogrodzie"
14. Alerty: "Uwaga: sezon na zarazę ziemniaka!"
15. System wiedzy: artykuły, porady zapobiegania

### Domowe preparaty i metody - przykłady dla bazy

Użytkownicy mogą dodawać własne środki, ale warto mieć też bazę popularnych domowych metod:

**Domowe preparaty przeciwko szkodnikom:**
1. **Napar z czosnku** (mszyca, przędziorek)
   - 3-5 ząbków na 1L wody, odstać 24h, rozcieńczyć 1:5
   - Karencja: brak (naturalny)

2. **Roztwór mydła szarego** (mszyca, mączlik)
   - 20g mydła na 1L ciepłej wody
   - Karencja: brak, spłukać przed zbiorem

3. **Napar z pokrzywy** (mszyca, wzmocnienie roślin)
   - 1kg świeżej pokrzywy na 10L wody, fermentacja 14 dni
   - Rozcieńczyć 1:10 przed użyciem

4. **Napar z cebuli** (mszyca, gryzonie)
   - Łupiny z 3-4 cebul na 1L wody, gotować 15min
   - Rozcieńczyć 1:2

5. **Napar z tytoniu** (mszyca, gąsienice) - UWAGA: toksyczny!
   - 50g tytoniu na 1L wody, odstać 24h
   - Stosować ostrożnie, szkodliwy dla pszczół

**Domowe preparaty przeciwko chorobom:**
6. **Mleko z wodą** (mączniak)
   - Mleko:woda 1:9, opryskiwać co 7 dni
   - Karencja: brak

7. **Roztwór sody oczyszczonej** (mączniak, szara pleśń)
   - 5g sody + 5ml oleju + 1L wody
   - Co 7-10 dni

8. **Napar z rumianku** (choroby grzybowe)
   - 50g suszonego rumianku na 1L wody, zaparzać
   - Naturalny fungicyd

**Mechaniczne metody:**
9. **Zbieranie ręczne** (stonka, gąsienice, ślimaki)
10. **Strumień wody** (mszyca na młodych pędach)
11. **Pułapki piwne** (ślimaki)
12. **Pasy lepowe** (mszyce, mączlik)

**Zapobieganie:**
13. **Mulczowanie** (chwasty, utrzymanie wilgoci)
14. **Oprysk z kompostu** (wzmocnienie odporności)
15. **Rośliny odstraszające** (nagietek, lawenda)

Każda z tych metod powinna być w bazie `spray_products` z:
- `type` = "metoda_domowa" lub "biopreparat_własny"
- `is_ecological` = 1
- `dosage_5l` = "25g mydła" (zrozumiały opis)
- `withdrawal_period` = NULL lub 0
- `warnings` = "Naturalny preparat. Spłukać przed spożyciem."

### Przykładowa baza problemów do startu

**Szkodniki (15):**
- Mszyca brzoskwiniowa (pomidory, papryka)
- Mszyca kapuściana (kapusta, brokuł)
- Stonka ziemniaczana (ziemniak, bakłażan)
- Przędziorek chmielowiec (ogórek, fasola)
- Śmietka kapuściana (kapusta)
- Gąsienica bielinka (kapusta)
- Mączlik szklarniowy (pomidor, ogórek)
- Ślimaki nagie (sałata, kapusta)
- Pchełki ziemne (rzodkiewka, rukola)
- Oprzędziki (pomidor)
- Wciornastki (cebula, kapusta)
- Mszyca różana (róże)
- Mszyce na trawnikach
- Larwy chrabąszcza (trawnik)
- Mrówki (wszystkie rośliny)

**Choroby grzybowe (12):**
- Zaraza ziemniaka (pomidor, ziemniak)
- Parch jabłoni (jabłoń, grusza)
- Mączniak prawdziwy (ogórek, cukinia)
- Mączniak rzekomylny (cebula, kapusta)
- Rdza (malina, porzeczka)
- Szara pleśń (truskawka)
- Antraknoza (fasola, dynia)
- Fuzarioza (pomidor)
- Septorioza (pomidor)
- Czarna plamistość róż
- Monilioza (drzewa owocowe)
- Pleśń szara (winorośl)

**Choroby bakteryjne (5):**
- Zaraza ogniowa (jabłoń, grusza)
- Rak bakteryjny (wiśnia, czereśnia)
- Bakterioza fasoli
- Mokra zgnilizna kapusty
- Plamistość bakteryjna pomidora

**Niedobory (6):**
- Niedobór azotu (żółte liście)
- Niedobór żelaza (chloroza)
- Niedobór magnezu (żółknięcie między żyłkami)
- Niedobór wapnia (zgnilizna wierzchołkowa pomidora)
- Niedobór potasu (brązowe brzegi liści)
- Niedobór fosforu (fioletowe liście)

**Chwasty (5):**
- Perz właściwy (trawniki, grządki)
- Pokrzywa zwyczajna
- Mniszek lekarski (trawnik)
- Stokrotka (trawnik)
- Koniczyna biała (trawnik)

### Korzyści dla użytkownika

✅ **Łatwiejsze używanie**
- Nie musisz znać nazw środków
- System doradziwybiera za ciebie
- Dopasowane do twojej rośliny

✅ **Edukacja**
- Uczysz się rozpoznawać problemy
- Dowiadujesz się o zapobieganiu
- Rozumiesz co się dzieje w ogrodzie

✅ **Lepsze decyzje**
- Porównanie skuteczności
- Widzisz opcje ekologiczne
- Świadome wybory (karencja, toksyczność)

✅ **Historia i analityka**
- "W zeszłym roku też miałeś zarazę w tym miejscu"
- "Może warto zmienić roślinę na tej grządce?"
- Wzorce i trendy

## 🎬 Podsumowanie

To byłaby **KILLER FEATURE** dla ogrodników hobbystów!

Obecne aplikacje to:
- "Wpisz nazwę środka" ← techniczne, dla znających się
- "Szukaj w Google" ← fragmentaryczna wiedza

Garden App z Problem-First Workflow:
- "Co ci dolega? Pomogę!" ← przyjazne, intuicyjne
- **Kompleksowy advisor ogrodniczy w kieszeni**

Konkurencja: brak podobnych rozwiązań w Polsce 🚀
