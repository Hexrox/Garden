# Garden App v2.1 - Nowe Funkcje (Quick Wins)

Przewodnik po nowych funkcjach dodanych w wersji 2.1 dla hobbystów ogrodników.

---

## 🌾 1. Przewidywanie Zbiorów (Harvest Prediction)

### Czym jest?
System automatycznie wylicza przewidywaną datę zbioru na podstawie rodzaju rośliny i daty sadzenia.

### Jak używać?

#### Krok 1: Dodaj roślinę z datą sadzenia
1. Wejdź do swojej działki
2. Kliknij "Dodaj grządkę"
3. Wybierz roślinę (np. "pomidor")
4. Wpisz datę sadzenia (np. "2025-05-15")
5. Zapisz

**System automatycznie wyliczy przewidywaną datę zbioru!**

#### Krok 2: Zobacz przewidywania na Dashboard
Na stronie głównej zobaczysz widget "Nadchodzące zbiory" który pokazuje:
- 5 najbliższych zbiorów
- Status każdego zbioru (kolorowy badge)
- Ile dni zostało do zbioru

**Statusy:**
- 🟢 **Gotowy do zbioru** - można zbierać dziś!
- 🟡 **Wkrótce** - zbiór za 1-7 dni
- 🔴 **Spóźniony** - minęła przewidywana data
- 🔵 **Rośnie** - jeszcze długo do zbioru

#### Krok 3: Zapisz rzeczywisty zbiór
Gdy zbierasz plony:
1. Wejdź do szczegółów grządki
2. *(Funkcja w przyszłości)* Kliknij "Zapisz zbiór"
3. Wpisz ile zebrałeś (np. "5 kg")
4. System zapisze rzeczywisty zbiór i porówna z przewidywaniem

### Które rośliny są obsługiwane?

**Baza zawiera 40+ popularnych warzyw:**

**Warzywa owocowe:**
- Pomidor (70 dni)
- Pomidor cherry (65 dni)
- Ogórek (55 dni)
- Ogórek gruntowy (60 dni)
- Papryka (75 dni)
- Cukinia (50 dni)
- Dynia (100 dni)
- Arbuz (85 dni)
- Melon (80 dni)

**Warzywa liściowe:**
- Sałata (45 dni)
- Sałata lodowa (50 dni)
- Rukola (30 dni)
- Szpinak (40 dni)
- Kapusta (90 dni)
- Kalafior (75 dni)
- Brokuł (70 dni)

**Warzywa korzeniowe:**
- Marchew (75 dni)
- Burak (60 dni)
- Rzodkiewka (25 dni)
- Ziemniak (90 dni)
- Cebula (100 dni)
- Czosnek (240 dni)
- Pietruszka (75 dni)

**Warzywa strączkowe:**
- Fasolka szparagowa (55 dni)
- Groch (65 dni)
- Bób (90 dni)

**Zioła:**
- Bazylia (40 dni)
- Koper (50 dni)
- Szczypiorek (60 dni)
- Mięta (60 dni)
- Tymianek (70 dni)
- Rozmaryn (85 dni)
- Oregano (60 dni)

**Owoce:**
- Truskawka (120 dni od sadzenia)
- Malina (365 dni - plony od drugiego roku)

### Często zadawane pytania

**Q: Co jeśli mojej rośliny nie ma w bazie?**
A: Przewidywanie nie będzie działać, ale możesz ręcznie zapisać datę zbioru. W przyszłości dodamy więcej roślin!

**Q: Dlaczego przewidywanie się nie zgadza?**
A: Daty są szacunkowe i zależą od:
- Odmiany rośliny (wczesne vs późne)
- Warunków pogodowych
- Jakości gleby
- Temperatury
- Nasłonecznienia

**Q: Czy mogę zmienić przewidywaną datę?**
A: Obecnie nie, ale możesz dodać notatkę z korektą. W przyszłości dodamy ręczną edycję.

**Q: Co się stanie gdy zmienię datę sadzenia?**
A: System automatycznie przeliczy przewidywaną datę zbioru.

---

## 📝 2. Notatki na Grządce (Notes per Bed)

### Czym jest?
Możliwość dodawania szybkich notatek do każdej grządki - obserwacje, problemy, eksperymenty.

### Jak używać?

#### Dodawanie notatki:
1. Wejdź do działki
2. Kliknij "Edytuj" przy grządce lub dodaj nową
3. W polu "Notatka" wpisz swoją obserwację
4. Zapisz

**Przykłady notatek:**
- "Liście zaczynają żółknąć - sprawdzić pH gleby"
- "Bardzo dobrze rośnie przy tym nawożeniu"
- "Eksperyment: podwojona dawka kompostu"
- "Pojawił się mączniak - zastosować Topsin"

#### Gdzie widzę notatki?
- W szczegółach działki - pod nazwą rośliny
- Przy każdej grządce osobno

### Najlepsze praktyki:

**✅ Dobre notatki:**
- Konkretne obserwacje
- Daty jeśli ważne
- Podjęte działania
- Rezultaty eksperymentów

**❌ Unikaj:**
- Zbyt długich opisów (użyj zewnętrznego dziennika)
- Duplikowania informacji już dostępnych w systemie

---

## 📊 3. Śledzenie Plonów (Yield Tracking)

### Czym jest?
Zapisywanie rzeczywistych zbiorów z każdej grządki - ile kg/szt zebrałeś.

### Jak używać?

#### Metoda 1: Przez API (dla zaawansowanych)
```bash
curl -X POST http://localhost:3001/api/beds/123/harvest \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "actual_harvest_date": "2025-07-15",
    "yield_amount": 5.5,
    "yield_unit": "kg"
  }'
```

#### Metoda 2: Przyszły interfejs użytkownika
W kolejnej wersji dodamy:
- Przycisk "Zapisz zbiór" w szczegółach grządki
- Formularz z datą i ilością
- Automatyczne oznaczanie jako "zebrane"

### Co możesz śledzić?
- Datę rzeczywistego zbioru
- Ilość plonu (np. 5.5)
- Jednostkę (kg, szt, wiązki, itp.)

### Statystyki plonów

**Dostępne przez API:**

```bash
# Statystyki zbiorów za rok 2025
GET /api/harvest/stats?year=2025

# Zwraca:
{
  "totalHarvests": 45,
  "totalYield": [
    { "total": 125.5, "yield_unit": "kg" },
    { "total": 300, "yield_unit": "szt" }
  ],
  "byPlant": [
    { "plant_name": "pomidor", "count": 8, "total_yield": 45.2, "yield_unit": "kg" },
    { "plant_name": "ogórek", "count": 12, "total_yield": 38.5, "yield_unit": "kg" }
  ],
  "byMonth": [
    { "month": "06", "count": 12 },
    { "month": "07", "count": 18 },
    { "month": "08", "count": 15 }
  ]
}
```

**W przyszłości:**
- Strona "Statystyki" z wykresami
- Porównanie rok do roku
- Najplenniejsze rośliny
- Eksport do Excel

---

## 🎯 Przydatne Wskazówki

### Jak maksymalnie wykorzystać nowe funkcje?

1. **Zawsze wpisuj datę sadzenia** - system automatycznie obliczy przewidywany zbiór
2. **Sprawdzaj Dashboard codziennie** - widget pokaże Ci co wkrótce będzie gotowe
3. **Dodawaj notatki na bieżąco** - łatwiej zapamiętasz obserwacje
4. **Zapisuj rzeczywiste zbiory** - pomoże to w przyszłych sezonach
5. **Eksperymentuj!** - notuj co działa, a co nie

### Workflow dla hobbysty:

**Wiosna:**
1. Zaplanuj co sadzisz
2. Dodaj rośliny z datami sadzenia
3. System pokaże przewidywane zbiory

**Lato:**
1. Sprawdzaj Dashboard - co wkrótce dojrzeje?
2. Dodawaj notatki o obserwacjach
3. Zapisuj zbiory gdy zbierasz

**Jesień:**
1. Przejrzyj statystyki plonów
2. Zobacz co rosło najlepiej
3. Zaplanuj następny sezon

---

## 🐛 Zgłaszanie Problemów

Jeśli napotkasz problemy:

1. **Sprawdź logi backendu:**
   ```bash
   pm2 logs garden-app-backend
   ```

2. **Sprawdź czy baza danych ma nowe kolumny:**
   ```bash
   sqlite3 garden.db
   .schema beds
   # Powinieneś zobaczyć: expected_harvest_date, actual_harvest_date, yield_amount, yield_unit, notes
   ```

3. **Restart backendu:**
   ```bash
   pm2 restart garden-app-backend
   ```

---

## 📅 Co dalej?

**Planowane funkcje v2.2:**
- 🎨 Dark Mode - ciemny motyw
- 📸 Galeria zdjęć per roślina
- 🌿 Baza wiedzy o sąsiedztwie roślin (companion planting)
- 📖 Garden Journal - dziennik ogrodnika z timeline
- 🐛 Tracking szkodników i chorób
- 📊 Strona statystyk z wykresami
- 🌡️ Regionalne daty przymrozków
- 💧 Kalkulator podlewania

**Twój feedback jest ważny!**
Daj znać jakie funkcje chciałbyś zobaczyć jako kolejne.

---

**Miłego ogrodnictwa! 🌱**
