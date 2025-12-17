# 🌱 GardenApp - Poradnik Użytkownika

**Witaj w GardenApp!** Ten przewodnik pomoże Ci zrozumieć jak działa aplikacja i jak najlepiej z niej korzystać.

---

## 📚 Spis treści

1. [Quick Start - Pierwsze kroki](#quick-start)
2. [Podstawowe pojęcia](#podstawowe-pojęcia)
3. [Jak to działa? - Automatyzacje](#jak-to-działa)
4. [FAQ - Najczęstsze pytania](#faq)
5. [Zaawansowane funkcje](#zaawansowane-funkcje)
6. [Porady ogrodnicze](#porady-ogrodnicze)

---

## 🚀 Quick Start - Pierwsze kroki {#quick-start}

### Krok 1: Stwórz swoje pierwsze poletko 🏡

**Co to jest poletko?**
To fizyczny kawałek Twojego ogrodu - może to być grządka wysoka, balkon, szklarnia czy po prostu część działki.

**Jak dodać?**
1. Kliknij **"Poletka"** w menu
2. **"Dodaj nowe poletko"**
3. Nazwij je (np. "Ogród główny", "Balkon", "Szklarnia")
4. Dodaj zdjęcie (opcjonalnie)

```
Przykład:
┌─────────────────────────┐
│ 🏡 Poletko              │
│ "Ogród główny"          │
│ Wymiary: 5m x 3m        │
│ 📸 [zdjęcie]            │
└─────────────────────────┘
```

---

### Krok 2: Dodaj grządki z roślinami 🌿

**Co to jest grządka?**
To rząd (linia) roślin NA poletku. Jedna grządka = jeden rodzaj rośliny w jednym rzędzie.

**Jak dodać?**
1. Wejdź w swoje poletko
2. **"Dodaj grządkę"**
3. Wybierz roślinę (np. Pomidor)
4. Podaj odmianę (np. "Malinowy")
5. Data posadzenia (aplikacja obliczy zbiór!)

```
Struktura:
🏡 Poletko "Ogród główny"
   ├─ 🌿 Grządka 1: Pomidory (Malinowy) - posadzone 1.06.2025
   ├─ 🌿 Grządka 2: Ogórki - posadzone 5.06.2025
   └─ 🌿 Grządka 3: Sałata - posadzona 10.06.2025
```

---

### Krok 3: Rób zdjęcia postępów 📸

**Dlaczego warto?**
- Zobacz jak roślina rośnie od kiełka do zbioru
- Time-lapse: automatyczne porównanie zdjęć
- Wspomnienia z całego sezonu!

**Jak?**
1. **Szybkie zdjęcie**: Aparat w prawym dolnym rogu (mobile)
2. **Z grządki**: Otwórz grządkę → "Dodaj zdjęcie"
3. **Galeria**: Zobacz wszystkie zdjęcia w jednym miejscu

---

### Krok 4: Zarządzaj zadaniami ✅

**Dobra wiadomość:** Aplikacja **automatycznie** tworzy zadania za Ciebie!

Zobacz sekcję [Jak to działa?](#jak-to-działa) żeby zrozumieć automatyzacje.

---

## 📖 Podstawowe pojęcia {#podstawowe-pojęcia}

### 🏡 Poletko
**Co to:** Fizyczny kawałek ogrodu
**Przykłady:** Grządka wysoka 2x5m, Balkon 3m², Szklarnia, Część działki
**W aplikacji:** Kontener dla grządek

### 🌿 Grządka (Rząd)
**Co to:** Jeden rząd roślin tego samego gatunku
**Przykład:** Rząd 1: Pomidory, Rząd 2: Ogórki
**Zawiera:** Nazwa rośliny, odmiana, data sadzenia, notatki

### 📸 Galeria
**Co to:** Wszystkie zdjęcia Twojego ogrodu
**Funkcje:** Filtrowanie, time-lapse, before/after
**Automatyka:** Zdjęcia przypisane do grządek

### ✅ Zadania
**3 typy zadań:**
1. **Ręczne** - dodane przez Ciebie
2. **Automatyczne** - wygenerowane przez aplikację (AI)
3. **Cykliczne** - powtarzające się co X dni

### 🧪 Opryski i środki ochrony roślin
**Co to:** Rejestr używanych środków ochrony roślin
**Baza środków:** 40 gotowych produktów (chemiczne + ekologiczne)
**Karencja:** Okres oczekiwania po oprysku (dni do bezpiecznego zbioru)
**Ważne:** Aplikacja BLOKUJE zbiór podczas karencji!

**Nowe funkcje:**
- 🔍 Autocomplete - podpowiada środki z bazy podczas wpisywania
- 🌿 20 środków ekologicznych (napary, mydło, metody naturalne)
- 🧪 20 środków chemicznych (fungicydy, insektycydy, herbicydy)
- ✍️ Możliwość dodania własnego środka
- 📊 System rekomendacji - aplikacja podpowiada środki pod problem

### 🌾 Zbiór
**Co to:** Kiedy zbierasz plony
**Automatyka:** Aplikacja przypomni na podstawie "Dni do zbioru"
**Przykład:** Pomidor = 60 dni, więc 60 dni po posadzeniu → zadanie "Zbiór"

---

## 🤖 Jak to działa? - Automatyzacje {#jak-to-działa}

### ⚙️ Dlaczego aplikacja tworzy zadania za mnie?

GardenApp to **inteligentny asystent ogrodnika**. Analizuje Twoje dane i przypomina o ważnych czynnościach.

```
Dodajesz grządkę "Pomidory" (1 czerwca)
    ↓
Aplikacja sprawdza bazę roślin
    ↓
Pomidor: 60 dni do zbioru, podlew co 2-3 dni
    ↓
✅ Automatycznie tworzy zadanie "Zbiór pomidorów" (30 lipca)
✅ Monitoruje pogodę → Jeśli upał + 3 dni bez wody → przypomina o podlaniu
```

---

### 💧 Automatyczne podlewanie

**Kiedy aplikacja przypomina o podlewaniu?**

1. **Minęły 3+ dni** od ostatniego podlewania
2. **ORAZ** jest upał (temperatura >25°C)
3. **ORAZ** nie ma deszczu w prognozie

**Przykład:**
```
📅 1 czerwca: Podlałeś pomidory
📅 2-3 czerwca: OK, nie trzeba
📅 4 czerwca: 3 dni bez wody + 30°C w prognozie
    → 💧 Zadanie: "Podlej pomidory"
```

**Jak wyłączyć?**
- Edytuj grządkę → Zaznacz "Podlewanie ręczne"
- Lub po prostu odrzuć zadanie (przycisk X)

---

### 🌾 Automatyczny zbiór

**Kiedy aplikacja przypomina o zbiorze?**

Na podstawie **"Dni do zbioru"** z bazy roślin:
- Pomidor: 60-80 dni
- Ogórek: 45-55 dni
- Sałata: 30-40 dni

**Przykład:**
```
🌱 1 czerwca: Posadziłeś pomidory "Malinowy"
📊 Baza roślin: Pomidor = 60 dni do zbioru
📅 30 lipca (60 dni później):
    → 🌾 Zadanie: "Zbierz pomidory - Rząd 1"
```

**Dostosuj datę:**
- Twoja odmiana dojrzewa szybciej/wolniej?
- Edytuj grządkę → Zmień "Data posadzenia" lub "Oczekiwana data zbioru"

---

### 🧪 Karencja po oprysku

**Co to jest karencja?**
Okres oczekiwania po użyciu środka ochrony roślin. **Nie wolno** zbierać warzyw przed końcem karencji!

**Jak to działa:**
```
🧪 10 czerwca: Opryskujesz pomidory środkiem X (karencja 7 dni)
    ↓
Aplikacja oblicza: 10.06 + 7 dni = 17.06 (data bezpiecznego zbioru)
    ↓
📅 17 czerwca:
    → ✅ Zadanie: "Możesz zbierać pomidory - karencja minęła"

⚠️  15 czerwca (przed końcem karencji):
    → ❌ Próbujesz oznaczyć zbiór jako gotowy
    → Aplikacja ostrzega: "Karencja! Bezpieczny zbiór od 17.06"
```

**Zobacz aktywne karencje:**
- Menu → **Opryski** → Zakładka "Aktywne"
- Badge ⚠️ przy grządce = aktywna karencja

---

### 🔄 Zadania cykliczne (Recurring Tasks)

**Co to jest?**
Zadanie które powtarza się automatycznie co X dni.

**Przykład:**
```
✅ Tworzysz zadanie: "Podlewanie pomidorów"
   - Powtarzaj co: 3 dni
   - Pora dnia: Rano + Wieczór

📅 15 czerwca: Wykonujesz zadanie (✓)
    ↓
Aplikacja automatycznie tworzy:
📅 18 czerwca: "Podlewanie pomidorów" (za 3 dni)
    ↓
📅 18 czerwca: Wykonujesz zadanie (✓)
    ↓
📅 21 czerwca: "Podlewanie pomidorów" (kolejne za 3 dni)
```

**Kiedy używać?**
- Regularne podlewanie (co 2-3 dni)
- Nawożenie (co 14 dni)
- Sprawdzanie szkodników (co 7 dni)

**Badge'e:**
- 🔄 = Szablon cykliczny (główne zadanie)
- 🤖 = Auto-wygenerowane (kolejna instancja)

---

### 🌿 Companion Planting (Rośliny towarzyszące)

**Co to jest?**
Niektóre rośliny pomagają sobie wzajemnie, inne przeszkadzają!

**Jak działa:**
```
Dodajesz grządkę: Pomidor
    ↓
Aplikacja sprawdza bliskie grządki:
    ↓
Grządka obok: Bazylia
    → ✅ Świetne połączenie! (bazylia odstrasza szkodniki)

Grządka obok: Kapusta
    → ❌ Złe sąsiedztwo! (konkurują o składniki odżywcze)
```

**Przykłady:**

✅ **Dobre połączenia:**
- Pomidor + Bazylia (bazylia poprawia smak i odstrasza szkodniki)
- Marchew + Cebula (cebula odstrasza muchę marchewkową)
- Ogórek + Koper (koper przyciąga pożyteczne owady)

❌ **Złe połączenia:**
- Pomidor + Kapusta (konkurencja o składniki)
- Pomidor + Ogórek (wspólne choroby)
- Cebula + Fasola (cebula hamuje wzrost fasoli)

**Zobacz podpowiedzi:**
- Podczas dodawania grządki → "Companion Planting"
- Badge przy grządce: ✅ = dobre, ❌ = złe sąsiedztwo

---

## ❓ FAQ - Najczęstsze pytania {#faq}

### 1. Dlaczego nie mogę zbierać pomidorów?

**Odpowiedź:** Sprawdź czy masz aktywną karencję!

**Jak sprawdzić:**
1. Menu → **Opryski** → Zakładka "Aktywne"
2. Zobacz "Data bezpiecznego zbioru"
3. Lub: Grządka ma badge ⚠️ = karencja aktywna

**Rozwiązanie:**
Poczekaj do końca karencji. To dla Twojego bezpieczeństwa!

---

### 2. Skąd się wzięło zadanie podlewania? Ja tego nie dodawałem!

**Odpowiedź:** To automatyczne przypomnienie!

**Dlaczego:**
- Minęły 3+ dni od ostatniego podlewania
- Jest upał (>25°C)
- Aplikacja dba o Twoje rośliny 🌱

**Co zrobić:**
- Podlej i oznacz jako wykonane ✓
- Lub odrzuć (przycisk X) jeśli już podlałeś
- Lub wyłącz auto-podlewanie (Grządka → "Podlewanie ręczne")

**Rozpoznaj automatyczne zadania:**
Badge 🤖 = wygenerowane automatycznie

---

### 3. Co oznacza ❌ przy mojej grządce?

**Odpowiedź:** Złe sąsiedztwo roślin (Companion Planting)

**Przykład:**
```
Rząd 1: Pomidory
Rząd 2: Kapusta  ❌
```

**Dlaczego to ważne:**
- Rośliny konkurują o składniki odżywcze
- Mogą przenosić choroby
- Gorsze plony

**Co zrobić:**
- Zobacz szczegóły: Kliknij grządkę → "Companion Planting"
- Rozważ przesadzenie jednej rośliny
- Lub zostaw (to tylko podpowiedź, nie wymóg!)

---

### 4. Gdzie jest pogoda? Nie widzę prognozy!

**Odpowiedź:** Musisz ustawić lokalizację!

**Jak to zrobić:**
1. Profil → **Lokalizacja**
2. Zezwól na geolokalizację (przycisk GPS)
3. Lub wpisz miasto ręcznie

**Po ustawieniu:**
- Dashboard → Widget pogody ☀️
- Zadania → Inteligentne podpowiedzi na podstawie pogody

---

### 5. Co to jest "poletko" a co "grządka"?

**Odpowiedź:**

**🏡 Poletko** = Fizyczne miejsce
- Cała grządka wysoka
- Balkon
- Szklarnia
- Część działki

**🌿 Grządka** = Rząd roślin NA poletku
- Rząd 1: Pomidory
- Rząd 2: Ogórki

**Analogia:**
```
Poletko = DOM 🏠
Grządka = POKÓJ w domu 🚪
```

**Przykład:**
```
🏡 Poletko "Balkon"
   ├─ Rząd 1: Pomidory koktajlowe
   ├─ Rząd 2: Bazylia
   └─ Rząd 3: Mięta
```

---

### 6. Jak działa Time-lapse zdjęć?

**Odpowiedź:** Aplikacja automatycznie porównuje zdjęcia tej samej grządki!

**Jak korzystać:**
1. Rób zdjęcia regularnie (np. co tydzień)
2. Galeria → Wybierz grządkę
3. Zobacz rozwój od kiełka do zbioru! 📸→🌱→🌿→🍅

**Najlepsze efekty:**
- To samo miejsce (stań w tym samym punkcie)
- Podobna pora dnia (to samo światło)
- Co 7 dni (wyraźne zmiany)

---

### 7. Co to są "Dni do zbioru"?

**Odpowiedź:** Czas od posadzenia do dojrzałości plonów.

**Przykłady:**
- Pomidor: 60-80 dni
- Ogórek: 45-55 dni
- Sałata: 30-40 dni
- Marchew: 70-80 dni

**Jak aplikacja to wykorzystuje:**
```
Sadzisz pomidory: 1 czerwca
   ↓
Pomidor = 60 dni do zbioru
   ↓
Aplikacja przypomni: 30 lipca (1.06 + 60 dni)
```

**Twoja odmiana różni się?**
Edytuj grządkę → Zmień "Oczekiwana data zbioru"

---

### 8. Dlaczego mam zduplikowane zadania?

**Odpowiedź:** Sprawdź czy nie utworzyłeś tego samego zadania 2x:
- Raz ręcznie
- Raz jako cykliczne (recurring)

**Jak sprawdzić:**
- Badge 🔄 = Recurring template (główny)
- Badge 🤖 = Auto-wygenerowane (instancja)
- Brak badge = Ręczne

**Rozwiązanie:**
Usuń zadanie ręczne, zostaw recurring (samo się będzie powtarzać)

---

### 9. Jak usunąć zadanie cykliczne?

**Odpowiedź:** Musisz usunąć **szablon** (template), nie instancję!

**Kroki:**
1. Zadania → Znajdź zadanie z badge 🔄
2. To jest szablon (główne zadanie)
3. Usuń go → Wszystkie przyszłe instancje znikną

**Uwaga:**
Usunięcie instancji 🤖 (auto-wygenerowanej) NIE zatrzyma cyklu!

---

### 10. Jak korzystać z bazy środków ochrony roślin?

**Odpowiedź:** Aplikacja podpowiada środki podczas wpisywania!

**Jak to działa:**
```
Wykonaj oprysk → Nazwa środka
    ↓
Zacznij wpisywać "top" → Aplikacja podpowie:
    - Topsin M 500 SC (fungicyd)
    - Środek chemiczny, karencja 3 dni
    ↓
Wybierz z listy → Dane się automatycznie wypełnią!
```

**Baza zawiera:**
- **Fungicydy:** Topsin M, Miedzian, Switch, Ridomil Gold, Score, Amistar, Delan
- **Insektycydy:** Mospilan, Karate Zeon, Pirimor, Calypso, Decis Mega, Polysect
- **Herbicydy:** Roundup, Lontrel
- **Moluskocydy:** Snacol 5 GB, Snacol 3 GB
- **Biopreparat:** Biosept Active, Polyversum WP
- **Metody domowe:** Napar z czosnku, mydło szare, napar z pokrzywy, mleko+woda, soda+olej, napar z cebuli, rumianku, skrzypu, pułapki na piwo, netki ochronne

**Własny środek:**
Jeśli nie ma go w bazie - po prostu wpisz nazwę! Aplikacja pozwoli Ci dodać własny środek.

---

### 11. Co zrobić gdy roślina jest chora?

**Odpowiedź:** Sprawdź bazę problemów ogrodniczych!

**Aplikacja zna 27 najczęstszych problemów:**

**Szkodniki (10):**
- Mszyce (czarne, szare)
- Stonka ziemniaczana
- Ślimaki nagie
- Przędziorek
- Pchełki ziemne
- Śmietka kapuściana
- Mączlik szklarniowy
- Oprzędziki pomidorowe
- Gąsienice bielinka

**Choroby grzybowe (13):**
- Zaraza ziemniaka (fytoftoroza)
- Mączniak prawdziwy ogórka
- Parch jabłoni
- Szara pleśń truskawek
- Mączniak rzekomny cebuli
- Alternarioza pomidora
- Rdza maliny
- Monilioza drzew pestkowych
- Septorioza pomidora
- Antraknoza dyniowatych

**Choroby bakteryjne (2):**
- Zaraza ogniowa (KWARANTANNA!)
- Rak bakteryjny drzew pestkowych

**Niedobory (3):**
- Niedobór azotu (żółte liście)
- Niedobór żelaza (chloroza)
- Niedobór magnezu

**Dla każdego problemu aplikacja podpowiada:**
- 3-6 skutecznych rozwiązań
- Ocena skuteczności (wysoka/średnia/niska)
- Szybkość działania
- Metody chemiczne + ekologiczne
- Moment stosowania (zapobiegawczo/przy pierwszych objawach)

---

### 12. Co zrobić gdy aplikacja nie działa?

**Typowe problemy:**

**Problem:** Nie widzę pogody
- ✅ Rozwiązanie: Ustaw lokalizację (Profil → Lokalizacja)

**Problem:** Zadania się nie ładują
- ✅ Rozwiązanie: Odśwież stronę (Ctrl+R / Cmd+R)

**Problem:** Zdjęcia nie wgrywają się
- ✅ Rozwiązanie: Sprawdź rozmiar (max 10MB), format (JPG/PNG)

**Problem:** Coś innego
- ✅ Rozwiązanie: Skontaktuj się: [email/formularz kontaktowy]

---

## 🎓 Zaawansowane funkcje {#zaawansowane-funkcje}

### 📊 Statystyki i analizy

**Co możesz śledzić:**
- Ile kg warzyw zebrałeś
- Które odmiany najlepiej rosły
- Historia podlewania
- Efektywność poletek

**Gdzie:**
Menu → **Analityka**

---

### 🌐 Publiczny profil ogrodu

**Co to:** Podziel się swoim ogrodem ze światem!

**Jak włączyć:**
1. Profil → **Publiczny profil**
2. Wybierz nazwę użytkownika (URL)
3. Wybierz co pokazać (zdjęcia, statystyki, timeline)
4. Udostępnij link: `gardenapp.pl/p/twoja-nazwa`

**Prywatność:**
Pokazujesz TYLKO to co wybierzesz. Dane osobowe są ukryte.

---

### 🎨 Gotowe szablony ogrodów

**Co to:** Gotowe zestawy grządek dla różnych typów ogrodów.

**Dostępne szablony:**
1. **Ogródek balkonowy** (4m²) - zioła + pomidory
2. **Starter dla początkujących** (10m²) - 5 prostych warzyw
3. **Ogród warzywny** (25m²) - kompletny zestaw
4. **Ogród permakultury** (50m²) - companion planting
5. **Ogród ziołowy** (6m²) - 8 najpopularniejszych ziół

**Gdzie:**
Podczas onboardingu (pierwszy start) lub:
Poletka → **"Użyj szablonu"**

---

### 🔄 Succession Planting (Siew sukcesyjny)

**Co to:** Siej kolejne partie co X dni dla ciągłych zbiorów!

**Przykład:**
```
Sałata dojrzewa w 30 dni, ale zjadasz ją szybko.
    ↓
Zamiast siać całą grządkę naraz:
📅 1 czerwca: Siej partię 1
📅 15 czerwca: Siej partię 2 (za 14 dni)
📅 29 czerwca: Siej partię 3 (za kolejne 14 dni)
    ↓
Efekt: Świeża sałata przez cały sezon! 🥗
```

**Gdzie:**
Menu → **Succession Planting** → Dodaj przypomnienie

---

### 📅 Kalendarz księżycowy

**Co to:** Planowanie prac ogrodniczych według faz księżyca.

**Przykłady:**
- Nowiu: Siej rośliny nadziemne (pomidory, ogórki)
- Pełnia: Siej rośliny korzeniowe (marchew, ziemniaki)

**Gdzie:**
Dashboard → Widget "Kalendarz księżycowy"

---

## 🌱 Porady ogrodnicze {#porady-ogrodnicze}

### ☀️ Porady sezonowe

#### 🌸 Wiosna (Marzec-Maj)
```
✅ Zaplanuj ogród - użyj szablonów!
✅ Zamów nasiona
✅ Przygotuj glebę (kompost, nawóz)
✅ Zacznij od siewu w domu (pomidory, papryka)
✅ Maj: Wysadź rozsadę do gruntu
```

#### ☀️ Lato (Czerwiec-Sierpień)
```
✅ Podlewaj regularnie (rano lub wieczorem!)
✅ Usuwaj chwasty
✅ Zbieraj plony na bieżąco
✅ Opryskuj profilaktycznie
✅ Succession planting - siej kolejne partie
```

#### 🍂 Jesień (Wrzesień-Listopad)
```
✅ Zbieraj warzywa do przechowania
✅ Sprzątaj grządki
✅ Kompostuj resztki roślinne
✅ Przygotuj glebę na wiosnę (mulcz)
✅ Zaplanuj przyszły sezon
```

#### ❄️ Zima (Grudzień-Luty)
```
✅ Przeglądaj katalogi nasion
✅ Planuj nowe grządki w aplikacji
✅ Czytaj porady ogrodnicze
✅ Przygotuj narzędzia na wiosnę
```

---

### 💡 Złote zasady ogrodnika

**1. Podlewaj mądrze:**
- ⏰ Rano lub wieczorem (nie w słońcu!)
- 💧 Lepiej rzadziej ale obficie
- 🎯 Pod korzeń, nie na liście

**2. Obserwuj rośliny:**
- 📸 Rób zdjęcia (aplikacja pomoże śledzić zmiany)
- 👀 Sprawdzaj liście (żółkną? Choroby?)
- 🐛 Szukaj szkodników

**3. Wykorzystuj companion planting:**
- ✅ Sadź rośliny które sobie pomagają
- ❌ Unikaj złych kombinacji
- 🌿 Aplikacja podpowie!

**4. Notuj wszystko:**
- 📝 Co zasadziłeś i kiedy
- 📅 Kiedy zbierałeś
- 💡 Co działało, co nie

---

### 🐛 Rozpoznawanie problemów roślin - Poradnik

Aplikacja zawiera bazę 27 najczęstszych problemów. Oto jak je rozpoznać:

#### 🦟 SZKODNIKI - Jak rozpoznać

**Mszyce (czarne/szare):**
- 👁️ Objawy: Czarne/szare owady na młodych pędach, zdeformowane liście, lepki nalot
- 🌿 Rośliny: Pomidor, papryka, kapusta, ogórek
- 💊 Rozwiązanie: Pirimor, Mospilan | Ekologiczne: napar z czosnku, mydło

**Stonka ziemniaczana:**
- 👁️ Objawy: Żółte chrząszcze w czarne paski, obgryzione liście
- 🌿 Rośliny: Ziemniak, pomidor, bakłażan
- 💊 Rozwiązanie: Calypso, Karate Zeon | Ekologiczne: zbieranie ręczne

**Ślimaki nagie:**
- 👁️ Objawy: Dziury w liściach, śluzowe ślady, młode rośliny zjedzone
- 🌿 Rośliny: Sałata, kapusta, truskawki
- 💊 Rozwiązanie: Snacol | Ekologiczne: pułapki na piwo, zbieranie wieczorem

**Przędziorek:**
- 👁️ Objawy: Żółte kropki na liściach, pajęczyny, liście brązowieją
- 🌿 Rośliny: Ogórek, fasola, pomidor
- 💊 Rozwiązanie: Olej rzepakowy + mydło | Zwiększenie wilgotności

#### 🍄 CHOROBY GRZYBOWE - Jak rozpoznać

**Zaraza ziemniaka:**
- 👁️ Objawy: Brązowe plamy z żółtą obwódką, biały nalot na spodzie
- ⚠️ Uwaga: GROŹNA! Może zniszczyć całe zbiory
- 💊 Rozwiązanie: Ridomil Gold, Amistar | Napar ze skrzypu

**Mączniak prawdziwy:**
- 👁️ Objawy: Biały mączysty nalot na liściach
- 💊 Rozwiązanie: Switch, Topsin M | Mleko z wodą (1:9)

**Parch jabłoni:**
- 👁️ Objawy: Ciemne plamy na liściach i owocach
- 💊 Rozwiązanie: Delan, Score | Miedzian (wiosną)

#### 🦠 NIEDOBORY - Jak rozpoznać

**Niedobór azotu:**
- 👁️ Objawy: Żółknięcie dolnych liści, spowolniony wzrost
- 💊 Rozwiązanie: Nawóz azotowy, kompost, napar z pokrzywy

**Niedobór żelaza:**
- 👁️ Objawy: Żółknięcie między żyłkami na MŁODYCH liściach
- 💊 Rozwiązanie: Chelat żelaza

**Niedobór magnezu:**
- 👁️ Objawy: Żółknięcie między żyłkami na STARSZYCH liściach
- 💊 Rozwiązanie: Siarczan magnezu

---

## 📞 Pomoc i kontakt

**Masz pytania?**
- 📧 Email: [hexan@tlen.pl]
- 🐛 Zgłoś błąd: [github.com/gardenapp/issues]

**Podoba Ci się aplikacja?**
- ⭐ Oceń nas!
- 📣 Poleć znajomym
- 💚 Wspieraj rozwój

---

## 🎯 Podsumowanie

GardenApp to **inteligentny asystent ogrodnika**, który:

✅ Przypomina o ważnych czynnościach (podlewanie, zbiór)
✅ Śledzi karencje po opryskach (bezpieczeństwo!)
✅ Podpowiada dobre połączenia roślin (companion planting)
✅ Pomaga planować (szablony, succession planting)
✅ Archiwizuje postępy (zdjęcia, time-lapse)

**Klucz do sukcesu:**
1. Dodawaj grządki z datami sadzenia
2. Rób zdjęcia regularnie
3. Korzystaj z automatycznych zadań
4. Sprawdzaj podpowiedzi aplikacji

**Miłego ogrodowania! 🌱**

---

*Ostatnia aktualizacja: 15.12.2025*
*Wersja aplikacji: 2.1.0 - Dodano bazę środków ochrony roślin i system problemów*
