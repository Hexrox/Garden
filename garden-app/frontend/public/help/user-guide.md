# GardenApp - Poradnik Użytkownika

**Witaj w GardenApp!** Kompleksowa aplikacja do zarządzania ogrodem - od planowania po zbiory.

---

## Spis treści

1. [Quick Start - Pierwsze kroki](#quick-start)
2. [Podstawowe pojęcia](#podstawowe-pojecia)
3. [Planer - Centrum planowania](#planner)
4. [Pielęgnacja kwiatów i bylin](#pielegnacja-kwiatow)
5. [Strefy mrozoodporności](#strefy-mrozoodpornosci)
6. [Automatyzacje i zadania](#automatyzacje)
7. [Szybkie wyszukiwanie (Ctrl+K)](#global-search)
8. [FAQ - Najczęstsze pytania](#faq)
9. [Zaawansowane funkcje](#zaawansowane-funkcje)
10. [Porady ogrodnicze](#porady-ogrodnicze)
   - Sezonowy harmonogram
   - Złote zasady podlewania
   - Najczęstsze błędy
   - Naturalna ochrona roślin
   - Companion planting
   - Porady dla konkretnych upraw
   - Kalendarz siewu

---

## Quick Start - Pierwsze kroki {#quick-start}

### Krok 1: Stwórz poletko

**Co to jest poletko?**
Fizyczne miejsce w Twoim ogrodzie - balkon, grządka wysoka, szklarnia, część działki.

**Jak dodać:**
1. Menu → **Działki**
2. **"Dodaj nowe poletko"**
3. Nazwij je (np. "Ogród główny", "Balkon południowy")

---

### Krok 2: Dodaj grządki z roślinami

**Co to jest grządka?**
Rząd roślin na poletku. Jedna grządka = jeden gatunek w jednym miejscu.

**Jak dodać:**
1. Wejdź w poletko
2. **"Dodaj grządkę"**
3. Wybierz roślinę z bazy (810+ gatunków!)
4. Podaj datę posadzenia

```
Struktura:
🏡 Poletko "Ogród główny"
   ├── 🌿 Rząd 1: Pomidory malinowe
   ├── 🌸 Rząd 2: Róże angielskie
   └── 🌿 Rząd 3: Bazylia
```

---

### Krok 3: Zaplanuj przyszłe działania

**Nowość: Planer** - centralne miejsce do planowania!

Zamiast czekać na przypomnienia, **zaplanuj z góry**:
- Co chcesz posadzić w maju
- Kiedy wykonać oprysk
- Które byliny podzielić jesienią

**Jak:**
1. Menu → **Planer**
2. **"Dodaj plan"**
3. Wybierz typ akcji i datę
4. Aplikacja przypomni 3 dni przed!

---

### Krok 4: Rób zdjęcia i śledź postępy

**Galeria** pozwala dokumentować rozwój ogrodu:
- Szybkie zdjęcie: ikona aparatu w menu
- Z grządki: otwórz grządkę → "Dodaj zdjęcie"
- Time-lapse: porównuj zdjęcia z różnych dat

---

## Podstawowe pojęcia {#podstawowe-pojecia}

### Poletko
| | |
|---|---|
| **Co to** | Fizyczne miejsce uprawy |
| **Przykłady** | Balkon, szklarnia, grządka wysoka, działka |
| **W aplikacji** | Kontener dla grządek |

### Grządka (Rząd)
| | |
|---|---|
| **Co to** | Jeden rząd/miejsce z jednym gatunkiem |
| **Zawiera** | Roślina, odmiana, data sadzenia, zdjęcia |
| **Automatyka** | Przypomnienia o zbiorze, podlewaniu |

### Planer
| | |
|---|---|
| **Co to** | Centrum planowania przyszłych działań |
| **Typy akcji** | Posadzić, oprysk, podlać, zebrać, nawozić, przyciąć + akcje kwiatowe |
| **Integracja** | Pogoda, przypomnienia, historia |

### Zadania
| | |
|---|---|
| **Automatyczne** | Generowane przez aplikację (podlewanie, zbiór) |
| **Z Planera** | Plan staje się zadaniem 3 dni przed terminem |
| **Ręczne** | Dodane przez Ciebie |

### Opryski i karencja
| | |
|---|---|
| **Co to** | Rejestr środków ochrony roślin |
| **Karencja** | Dni do bezpiecznego zbioru po oprysku |
| **Baza** | 40+ środków (chemiczne + ekologiczne) |

---

## Planer - Centrum planowania {#planner}

### Co to jest Planer?

**Planer** to miejsce gdzie planujesz **przyszłe** działania w ogrodzie. W lutym wiesz, że w maju chcesz posadzić pomidory? Zapisz to w Planerze!

### Typy akcji

#### Podstawowe
| Ikona | Typ | Opis |
|-------|-----|------|
| 🌱 | Posadzić | Sadzenie rośliny |
| 🧴 | Oprysk | Opryskiwanie (sprawdza pogodę!) |
| 💧 | Podlać | Podlewanie |
| 🥕 | Zebrać | Zbiór plonów |
| 🔄 | Przesadzić | Przesadzenie |
| 🧪 | Nawozić | Nawożenie |
| ✂️ | Przyciąć | Przycinanie |
| 📝 | Inne | Własna akcja |

#### Pielęgnacja kwiatów
| Ikona | Typ | Opis |
|-------|-----|------|
| ⛏️ | Wykopać | Wykopanie cebul wrażliwych na mróz |
| ❄️ | Okryć | Zabezpieczenie na zimę |
| 🌿 | Podzielić | Dzielenie bylin |
| 🥀 | Przekwitłe | Usuwanie przekwitłych kwiatów |

### Jak działa Planer?

```
1. PLANOWANIE
   Ty → Planer → "Dodaj plan"
   → Wybierasz: Posadzić pomidory, 15 maja
   → Opcjonalnie: przypomnienie 3 dni przed

2. PRZYPOMNIENIE
   12 maja → Powiadomienie na dashboardzie
   "Za 3 dni: Posadzić pomidory"

3. SPRAWDZENIE POGODY (dla oprysków)
   Planujesz oprysk na 20 maja
   → Aplikacja sprawdza prognozę
   → Alert jeśli będzie deszcz: "Rozważ przesunięcie"

4. WYKONANIE
   Klikasz "Wykonaj"
   → Dla sadzenia: opcja dodania do grządki
   → Dla oprysku: opcja dodania do historii oprysków
   → Plan oznaczony jako wykonany ✓

5. POWTARZALNOŚĆ
   Zaznaczasz "Powtarzaj co 2 tygodnie"
   → Po wykonaniu, automatycznie tworzy następny plan
```

### Planer vs Zadania - jaka różnica?

| Planer | Zadania |
|---------|---------|
| **Co zamierzam zrobić** (przyszłość) | **Co muszę zrobić** (teraz) |
| Długoterminowe planowanie | Bieżące przypomnienia |
| Ty decydujesz o dacie | Aplikacja generuje automatycznie |
| Sprawdza pogodę | Reaguje na warunki |

**Integracja:** Plan staje się zadaniem gdy zbliża się termin (domyślnie 3 dni przed).

### Przykłady użycia Planera

**Planowanie sezonu:**
```
Luty:
├── Plan: Posadzić pomidory (15 maja)
├── Plan: Posadzić ogórki (20 maja)
└── Plan: Pierwszy oprysk profilaktyczny (1 czerwca)
```

**Pielęgnacja kwiatów:**
```
Wrzesień:
├── Plan: Podzielić piwonie (15 września)
├── Plan: Wykopać dalie (15 października)
└── Plan: Okryć róże (1 listopada)
```

**Z powtarzalnością:**
```
Plan: Nawożenie róż
├── Powtarzaj co: 14 dni
├── Start: 1 maja
└── Koniec: 15 września
→ Automatycznie 10 nawożeń w sezonie!
```

---

## Pielęgnacja kwiatów i bylin {#pielegnacja-kwiatow}

GardenApp ma dedykowane moduły dla hodowców kwiatów:

### Kwitnienie (Bloom Timeline)

**Co to:** Kalendarz pokazujący kiedy kwitną Twoje rośliny.

**Funkcje:**
- Wizualizacja 12 miesięcy
- Które kwiaty kwitną teraz
- Planowanie rabat z ciągłym kwitnieniem

**Gdzie:** Menu → Kwitnienie

---

### Przekwitłe (Deadheading)

**Co to:** Przypomnienia o usuwaniu przekwitłych kwiatów.

**Dlaczego ważne:**
- Przedłuża kwitnienie
- Roślina nie marnuje energii na nasiona
- Estetyka ogrodu

**Priorytety:**
- **Wysoki:** Róże, petunie, dalie - usuwaj 2-3x w tygodniu
- **Średni:** Lawenda, liliowce - co tydzień
- **Niski:** Hortensje - raz na sezon

**Gdzie:** Menu → Przekwitłe

---

### Dzielenie bylin (Propagation)

**Co to:** Śledzenie wieku bylin i przypomnienia o dzieleniu.

**Kiedy dzielić:**
- **3-4 lata:** Floksy, jeżówki, rudbekie
- **4-5 lat:** Piwonie, funkia, liliowce
- **5+ lat:** Trawy ozdobne

**Najlepszy czas:** Wrzesień (po kwitnieniu, przed mrozami)

**Gdzie:** Menu → Dzielenie bylin

---

### Zabezpieczanie na zimę (Winter Protection)

**Co to:** Przypomnienia o zimowej ochronie roślin.

**Kategorie:**
- **Wykopać:** Dalie, begonie, kanny, mieczyki (wrażliwe cebule)
- **Okryć:** Róże, hortensje, niektóre byliny
- **Ściółkować:** Młode nasadzenia, wrażliwe gatunki

**Kiedy:**
- Październik: Wykopywanie cebul
- Listopad: Okrywanie agrowłókniną, ściółkowanie

**Gdzie:** Menu → Zabezpieczanie na zimę

---

### Nawożenie (Fertilization)

**Co to:** Harmonogram nawożenia z przypomnieniami.

**Typy:**
- **NPK:** Proporcje azot-fosfor-potas
- **Organiczne:** Kompost, obornik
- **Mineralne:** Gotowe nawozy

**Przykłady:**
- Róże: co 2 tygodnie (V-VIII), wysoki P
- Trawnik: co miesiąc (IV-IX)
- Pomidory: co tydzień w sezonie owocowania

**Gdzie:** Menu → (w Planerze typ "Nawozić")

---

## Strefy mrozoodporności {#strefy-mrozoodpornosci}

### Co to są strefy USDA?

System klasyfikacji klimatu oparty na minimalnych temperaturach zimowych. Polska: strefy 5b-8a.

### Strefy w Polsce

| Strefa | Min. temp. | Region |
|--------|-----------|--------|
| 6a | -23 do -20°C | Północny-wschód, Suwalszczyzna |
| 6b | -20 do -18°C | Polska wschodnia, Mazury |
| 7a | -18 do -15°C | Polska centralna |
| 7b | -15 do -12°C | Polska zachodnia |
| 8a | -12 do -9°C | Wybrzeże, Dolny Śląsk |

### Jak ustawić strefę?

1. **Profil** → sekcja "Strefa klimatyczna"
2. Wybierz strefę (6a-8b)
3. Lub kliknij **"Wykryj z lokalizacji"** - aplikacja określi automatycznie

### Daty przymrozków

Po ustawieniu strefy, aplikacja sugeruje:
- **Ostatni przymrozek wiosenny** (kiedy można sadzić)
- **Pierwszy przymrozek jesienny** (kiedy zabezpieczać)

**Przykład dla strefy 7a:**
- Ostatni przymrozek: ~10 maja
- Pierwszy przymrozek: ~10 października
- Sezon: ~150 dni

### SeasonWidget

Na dashboardzie zobaczysz widget sezonowy:
- **Przed sezonem:** "X dni do sadzenia"
- **W sezonie:** Pasek postępu, "Dzień X sezonu"
- **Po sezonie:** Link do zabezpieczania zimowego

### Zgodność roślin

W katalogu roślin aplikacja pokazuje:
- ✅ **Odpowiednia** - roślina przetrwa zimę
- ⚠️ **Wymaga ochrony** - okryj lub wykop na zimę

---

## Automatyzacje i zadania {#automatyzacje}

### Skąd się biorą zadania?

**1. Automatyczne (AI):**
```
Dodajesz grządkę: Pomidory (1 czerwca)
    ↓
Aplikacja sprawdza: Pomidor = 60 dni do zbioru
    ↓
Tworzy zadanie: "Zbierz pomidory" (30 lipca)
```

**2. Z Planera:**
```
Tworzysz plan: Posadzić ogórki (15 maja)
    ↓
12 maja (3 dni przed):
    ↓
Plan pojawia się jako zadanie na dashboardzie
```

**3. Cykliczne:**
```
Zadanie: Podlewanie pomidorów
├── Co 3 dni
├── Pora: Rano
    ↓
Po wykonaniu → następne za 3 dni
```

### Automatyczne podlewanie

**Kiedy aplikacja przypomina:**
- 3+ dni od ostatniego podlewania
- Temperatura >25°C
- Brak deszczu w prognozie

### Karencja po oprysku

```
Opryskujesz: 10 czerwca (karencja 7 dni)
    ↓
Aplikacja: Bezpieczny zbiór od 17 czerwca
    ↓
Do 17 czerwca: Badge ⚠️ przy grządce
```

### Badge'e zadań

| Badge | Znaczenie |
|-------|-----------|
| 🤖 | Wygenerowane automatycznie |
| 🔄 | Szablon cykliczny |
| 📋 | Z Planera |
| ⚠️ | Pilne / Zaległe |

---

## Szybkie wyszukiwanie (Global Search) {#global-search}

### Skrót klawiszowy: Ctrl+K (lub Cmd+K na Mac)

**Global Search** to potężne narzędzie do szybkiego wyszukiwania w całej aplikacji.

### Jak używać?

1. Naciśnij **Ctrl+K** (Windows/Linux) lub **Cmd+K** (Mac) z dowolnego miejsca w aplikacji
2. Wpisz szukaną frazę
3. Wybierz wynik za pomocą strzałek ↑↓ i Enter

### Co możesz znaleźć?

| Kategoria | Przykłady |
|-----------|-----------|
| **Rośliny** | "pomidor", "róża", "bazylia" |
| **Poletka** | "balkon", "szklarnia" |
| **Grządki** | "rząd 1", "pomidory malinowe" |
| **Strony** | "planer", "zadania", "galeria" |
| **Akcje** | "dodaj grządkę", "nowy oprysk" |

### Porady

- Wpisuj pierwsze litery - wyszukiwanie działa w czasie rzeczywistym
- Wyniki są pogrupowane według kategorii
- Kliknięcie wyniku przenosi bezpośrednio do strony lub elementu
- **Escape** zamyka wyszukiwarkę

### Inne skróty klawiszowe

| Skrót | Akcja |
|-------|-------|
| Ctrl+K | Otwórz Global Search |
| Escape | Zamknij okno/modal |
| Enter | Potwierdź wybór |

---

## FAQ - Najczęstsze pytania {#faq}

### Planer

**P: Czym różni się Planer od Zadań?**

O: **Planer** = co zamierzam zrobić (przyszłość). **Zadania** = co muszę zrobić teraz. Plan staje się zadaniem gdy zbliża się termin.

**P: Jak zaplanować oprysk ze sprawdzeniem pogody?**

O: Planer → Dodaj plan → Typ: Oprysk → Zaznacz "Sprawdź pogodę". Aplikacja ostrzeże jeśli prognoza deszczu.

**P: Jak ustawić powtarzający się plan?**

O: Przy tworzeniu planu zaznacz "Powtarzaj" i wybierz interwał (dni/tygodnie/miesiące).

---

### Kwiaty i byliny

**P: Kiedy dzielić piwonie?**

O: Wrzesień, co 5-10 lat. Aplikacja przypomni w module "Dzielenie bylin".

**P: Które cebulki wykopać na zimę?**

O: Dalie, begonie, kanny, mieczyki, gladiole. Moduł "Zabezpieczanie na zimę" pokaże listę.

**P: Jak często usuwać przekwitłe kwiaty?**

O: Róże, petunie: 2-3x/tydzień. Lawenda: 1x/tydzień. Moduł "Przekwitłe" pokaże priorytety.

---

### Strefy i pogoda

**P: Jak sprawdzić moją strefę mrozoodporności?**

O: Profil → Strefa klimatyczna → "Wykryj z lokalizacji" lub wybierz ręcznie.

**P: Co oznacza SeasonWidget na dashboardzie?**

O: Pokazuje ile dni do/od początku sezonu na podstawie Twoich dat przymrozków.

**P: Dlaczego nie widzę pogody?**

O: Ustaw lokalizację: Profil → Lokalizacja → GPS lub wpisz miasto.

---

### Podstawowe

**P: Co to jest "poletko" a co "grządka"?**

O: **Poletko** = miejsce (balkon, działka). **Grządka** = rząd roślin na poletku.

**P: Dlaczego nie mogę zbierać warzyw?**

O: Sprawdź karencję: Menu → Opryski → Aktywne. Badge ⚠️ = karencja trwa.

**P: Skąd się wzięło zadanie podlewania?**

O: Automatyczne przypomnienie (3+ dni bez wody + upał). Badge 🤖 = auto.

---

### Techniczne

**P: Jak usunąć zadanie cykliczne?**

O: Usuń **szablon** (badge 🔄), nie instancję (badge 🤖). Szablon znajdziesz w liście zadań.

**P: Aplikacja nie działa - co robić?**

O:
- Odśwież stronę (Ctrl+R)
- Sprawdź lokalizację (dla pogody)
- Sprawdź rozmiar zdjęć (max 10MB)

---

## Zaawansowane funkcje {#zaawansowane-funkcje}

### Publiczny profil

Podziel się ogrodem ze światem:
1. Profil → Publiczny profil
2. Włącz i wybierz nazwę
3. Udostępnij: `gardenapp.pl/g/twoja-nazwa`

### Gotowe szablony

5 szablonów na start:
- Ogródek balkonowy (4m²)
- Starter dla początkujących (10m²)
- Ogród warzywny (25m²)
- Ogród permakultury (50m²)
- Ogród ziołowy (6m²)

### Companion Planting

Aplikacja podpowiada dobre/złe sąsiedztwo roślin:
- ✅ Pomidor + Bazylia (bazylia odstrasza szkodniki)
- ❌ Pomidor + Kapusta (konkurencja o składniki)

### Kalendarz księżycowy

Dashboard → Widget księżycowy:
- Nowiu: Siej rośliny nadziemne
- Pełnia: Siej rośliny korzeniowe

### Statystyki

Menu → Statystyki:
- Ile kg zebrałeś
- Które odmiany najlepsze
- Historia sezonu

---

## Porady ogrodnicze {#porady-ogrodnicze}

### Sezonowy harmonogram dla Polski (strefy 6-7)

#### Zima (XII-II) - Planowanie
| Miesiąc | Zadania |
|---------|---------|
| Grudzień | Przegląd nasion, zamówienia katalogowe |
| Styczeń | Planowanie w Planerze, projektowanie rabat |
| Luty | Siew papryki i bakłażana na rozsadę (koniec miesiąca) |

**Tip:** Użyj Planera żeby zaplanować cały sezon z wyprzedzeniem!

---

#### Wiosna (III-V) - Start sezonu

| Miesiąc | Warzywa | Kwiaty |
|---------|---------|--------|
| Marzec | Siew pomidorów, papryki na rozsadę | Siew pelargonii, petunii |
| Kwiecień | Sadzenie ziemniaków, siew marchewki, pietruszki, buraków | Sadzenie cebul letnich (dalie, gladiole) |
| Maj (po 15.) | Wysadzanie rozsady, siew ogórków, dyni | Wysadzanie jednorocznych |

**Ważne daty:**
- **Zimna Zośka (15 maja)** - tradycyjnie ostatnie przymrozki
- Po 15 maja bezpiecznie wysadzać ciepłolubne rośliny

**Przygotowanie gleby wiosną:**
1. Test pH (optymalnie 6.0-7.0 dla warzyw)
2. Dodaj kompost lub obornik
3. Przekop na głębokość szpadla
4. Poczekaj 2 tygodnie przed sadzeniem

---

#### Lato (VI-VIII) - Pełnia sezonu

| Zadanie | Częstotliwość | Pora dnia |
|---------|---------------|-----------|
| Podlewanie | Co 2-3 dni (upał: codziennie) | Rano 6-8 lub wieczór po 18 |
| Przekwitłe kwiaty | 2-3x w tygodniu | Dowolna |
| Kontrola szkodników | Co tydzień | Rano |
| Nawożenie | Co 2 tygodnie | Po podlaniu |

**Problemy lata:**
- **Mączniak:** Biały nalot na liściach → oprysk mlekiem 1:9
- **Mszyce:** Na młodych pędach → mydło szare + woda
- **Ślimaki:** Dziury w liściach → pułapki piwne, skorupki jaj

**Sadzenie sukcesywne:**
Siej co 2-3 tygodnie: sałata, rzodkiewka, szpinak → zbiory przez całe lato!

---

#### Jesień (IX-XI) - Przygotowanie do zimy

| Miesiąc | Warzywa | Kwiaty/Byliny |
|---------|---------|---------------|
| Wrzesień | Siew szpinaku zimowego, sadzenie czosnku | Dzielenie bylin, sadzenie cebul wiosennych |
| Październik | Zbiór dyni, ostatnie pomidory | Wykopywanie dalli, begonii, gladioli |
| Listopad | Ściółkowanie truskawek | Okrywanie róż, hortensji |

**Jesienne must-do:**
1. ✅ Wykoś trawę (ostatni raz w X)
2. ✅ Zgrab liście (kompostuj!)
3. ✅ Oczyść narzędzia i nasmaruj
4. ✅ Opróżnij węże ogrodowe

---

### Złote zasady podlewania

| Zasada | Dlaczego |
|--------|----------|
| **Rano lub wieczorem** | Woda nie paruje, nie parzy liści |
| **Rzadziej, ale obficie** | Korzenie rosną w głąb |
| **Pod korzeń, nie na liście** | Zapobiega chorobom grzybowym |
| **Mulczuj!** | Ściółka trzyma wilgoć 3x dłużej |

**Ile wody?**
- Warzywa: 2-3 cm wody/tydzień
- Pomidory w owocowaniu: codziennie!
- Nowe nasadzenia: codziennie przez 2 tygodnie

**Oszczędzanie wody:**
- Zbieraj deszczówkę (beczka przy rynnie)
- Mulczuj korą, słomą lub trawą
- Podlewaj kroplówką lub u podstawy

---

### Najczęstsze błędy początkujących

| Błąd | Skutek | Rozwiązanie |
|------|--------|-------------|
| Za gęste sadzenie | Choroby, słaby wzrost | Zachowaj odstępy z etykiet! |
| Podlewanie liści | Mączniak, plamistości | Podlewaj pod korzeń |
| Za wczesne sadzenie | Przymrozki zabijają | Poczekaj do Zimnej Zośki |
| Brak płodozmianu | Wyczerpana gleba, choroby | Nie sadź tego samego 3 lata z rzędu |
| Za dużo nawozu | "Spalenie" roślin | Lepiej mniej, częściej |
| Ignorowanie szkodników | Epidemia | Kontroluj co tydzień |

---

### Naturalna ochrona roślin

**Domowe opryski ekologiczne:**

| Szkodnik | Przepis |
|----------|---------|
| Mszyce | 1 łyżka mydła szarego + 1L wody |
| Mączniak | 1:9 mleko:woda |
| Przędziorek | Wywar z czosnku (5 ząbków/L) |
| Ślimaki | Pułapki z piwa, skorupki jaj |
| Gąsienice | Bacillus thuringiensis (Bt) |

**Rośliny odstraszające szkodniki:**
- **Aksamitki** → odstraszają nicienie (sadź przy pomidorach)
- **Bazylia** → odstrasza mszyce i muchy (przy pomidorach, ogórkach)
- **Lawenda** → odstrasza ćmy, mszyce (przy różach)
- **Czosnek** → przy różach przeciw mszycm

---

### Companion planting - szczegóły

**Świetne kombinacje:**
| Roślina główna | Towarzysz | Korzyść |
|----------------|-----------|---------|
| Pomidor | Bazylia, marchewka | Bazylia odstrasza szkodniki |
| Ogórek | Koper, słonecznik | Koper przyciąga owady pożyteczne |
| Marchewka | Cebula, por | Wzajemnie odstraszają muchówki |
| Kapusta | Koper, seler | Koper odstrasza gąsienice |
| Fasola | Kukurydza, dynia | "Trzy siostry" - wspierają się |
| Róże | Lawenda, czosnek | Odstraszają mszyce |

**Złe sąsiedztwo (unikaj!):**
- ❌ Pomidor + kapusta (konkurencja)
- ❌ Fasola + cebula (hamują wzrost)
- ❌ Ogórek + ziemniaki (choroby)
- ❌ Marchewka + koper (krzyżowanie)

---

### Porady dla konkretnych upraw

#### Pomidory
- Usuwaj "wilki" (pędy boczne) co tydzień
- Podlewaj regularnie (nieregularne = pękanie owoców)
- Podwiązuj do palików
- Obrywaj dolne liście (do pierwszego grona)

#### Ogórki
- Nie sadź za głęboko
- Mulczuj słomą
- Zbieraj codziennie (stymuluje owocowanie)
- Podlewaj ciepłą wodą

#### Róże
- Przycinaj w marcu (nad zewnętrznym oczkiem)
- Nawożenie: kwiecień, czerwiec, sierpień (ostatni!)
- Usuwaj przekwitłe co 2-3 dni
- Zimą okryj kopczykiem ziemi (20 cm)

#### Byliny
- Dziel co 3-5 lat (wiosna lub jesień)
- Ściółkuj na zimę
- Obcinaj przekwitłe łodygi jesienią
- Podlewaj przez pierwszy rok po posadzeniu

---

### Kalendarz siewu - szybka ściągawka

| Roślina | Na rozsadę | Do gruntu | Zbiór |
|---------|------------|-----------|-------|
| Pomidor | II-III | V (po 15.) | VII-IX |
| Papryka | II | V-VI | VIII-X |
| Ogórek | IV | V | VII-IX |
| Sałata | III-VIII | IV-VIII | V-X |
| Marchewka | - | IV-VI | VII-X |
| Cebula | II-III | IV | VIII-IX |
| Fasola | - | V | VII-IX |
| Dynia | IV | V | IX-X |

---

### Narzędzia - co naprawdę potrzebujesz

**Podstawowy zestaw:**
1. Szpadel (dobrej jakości!)
2. Grabie
3. Motyka lub kultywator
4. Sekator
5. Konewka lub wąż z pistoletem
6. Rękawice

**Nice to have:**
- Widły do kompostu
- Nożyce do żywopłotu
- Opryskiwacz ciśnieniowy
- Termometr glebowy

**Konserwacja:**
- Po sezonie: oczyść, nasmaruj, naaostrz
- Przechowuj w suchym miejscu
- Drewniane uchwyty natrzyj olejem lnianym

---

## Pomoc i kontakt

**Pytania:** hexan@tlen.pl

**Zgłoś błąd:** github.com/issues

**Podoba się?** Poleć znajomym!

---

## Podsumowanie

**GardenApp** to kompletny asystent ogrodnika:

✅ **Planer** - planuj przyszłe działania
✅ **Automatyzacje** - przypomnienia o podlewaniu, zbiorach
✅ **Pielęgnacja kwiatów** - kwitnienie, dzielenie, przekwitłe, zimowanie
✅ **Strefy klimatyczne** - dostosowane do Twojej lokalizacji
✅ **Galeria** - dokumentuj postępy
✅ **Companion planting** - dobre sąsiedztwo roślin

**Nowy flow:**
1. Dodaj poletka i grządki
2. Planuj w Planerze
3. Wykonuj zadania
4. Śledź postępy w galerii

**Powodzenia w ogrodzie!** 🌱

---

*Ostatnia aktualizacja: 03.02.2026*
*Wersja: 2.4.0 - Zaawansowane filtry katalogu, ulubione rośliny, Global Search*
