# Do Zrobienia - GardenApp Planer Ogrodu

## Następna sesja - do zrobienia

### Wdrożenie bazy roślin na produkcję
- [ ] Skopiować bazę `garden.db` (1105 roślin) na serwer produkcyjny
- [ ] Skopiować nowe zdjęcia z `uploads/plants/` na serwer
- [ ] Zrestartować kontener `garden-backend`
- [ ] Sprawdzić gardenapp.pl/plants - czy wyświetla rozszerzony katalog
- [ ] Sprawdzić wyszukiwanie odmian (np. "Betalux", "Kmicic", "Palermo F1")

### Przegląd opisów roślin (polszczyzna)
- [ ] Sprawdzić opisy nowych roślin pod kątem wtrąceń obcojęzycznych
- [ ] Poprawić ewentualne kalki językowe i spolszczenia
- [ ] Upewnić się, że care_notes są w poprawnej polszczyźnie

### Rozwój planera ogrodu (patrz niżej)

---

## Stan bazy roślin (15.02.2026)
- **1105 roślin** w bazie lokalnej
- Źródła: PNOS (208), W. Legutko (55), Plantico (24), Torseed (20), Plantini F1 (25), wcześniejsze importy (~773)
- 1103/1105 ze zdjęciem (99.8%), 798/1105 z ilustracją vintage (72%)
- 0 roślin bez żadnego obrazka

---

## Status: W trakcie implementacji

### Co zostało zrobione:
- [x] Okno potwierdzenia tworzenia zadań z datepickerem
- [x] Wybór roślin do zadania (checkboxy)
- [x] Blokada duplikatów (HTTP 400 jeśli zadania już utworzone)
- [x] Wyświetlanie statusu zadań (kiedy utworzone, planowana data)
- [x] Możliwość usunięcia zadań i utworzenia na nowo
- [x] Companion planting info przy dodawaniu roślin do planu
- [x] Naprawiony bug route ordering w plants.js (favorites)
- [x] Naprawione odświeżanie stanu po dodaniu/usunięciu rośliny

### Co pozostało do zrobienia:

#### 1. Synchronizacja Plan → Zadania (edycja)
**Plik:** `backend/routes/garden-plans.js`, `frontend/src/pages/GardenPlanner.js`

Gdy użytkownik edytuje roślinę w planie (zmienia ilość, usuwa, dodaje nową):
- Jeśli zadania już istnieją (`tasks_created_at` != null), trzeba zaktualizować odpowiednie zadanie
- Dodanie rośliny → utworzenie nowego zadania powiązanego
- Usunięcie rośliny → usunięcie zadania lub oznaczenie jako anulowane
- Zmiana ilości → aktualizacja opisu zadania

#### 2. Zmiana daty w zadaniu → Dialog wyboru
**Plik:** `frontend/src/pages/Tasks.js`, `backend/routes/tasks.js`

Gdy użytkownik zmienia datę zadania pochodzącego z planera:
- Wykryć czy zadanie pochodzi z planu (`garden_plan_id` != null)
- Wyświetlić dialog z pytaniem:
  - "Zmień datę tylko tego zadania"
  - "Zmień datę wszystkich zadań z tego planu"
- Odpowiednio zaktualizować `planned_planting_date` w planie lub tylko w zadaniu

#### 3. Potwierdzenie sadzenia → Dialog z wyborem
**Plik:** `frontend/src/pages/Tasks.js`, `backend/routes/tasks.js`

Gdy użytkownik oznacza zadanie sadzenia jako wykonane:
- Wykryć czy to zadanie z planera (`garden_plan_id` != null)
- Wyświetlić dialog z checkboxami:
  - Lista roślin z planu do zaznaczenia
  - "Posadzone: [x] Pomidor (5 szt.) [ ] Papryka (3 szt.)"
- Możliwość zaznaczenia tylko niektórych

#### 4. Po potwierdzeniu sadzenia → Utworzenie grządek
**Plik:** `backend/routes/tasks.js`, `backend/routes/beds.js`

Po zatwierdzeniu sadzenia:
- Dla każdej zaznaczonej rośliny:
  - Ustawić `planted_at` w `garden_plan_items`
  - Utworzyć grządkę (bed) w odpowiednim poletku
  - Oznaczyć zadanie jako completed
- Jeśli wszystkie rośliny posadzone:
  - Zmienić status planu na "planted"
  - Usunąć pozostałe zadania z tego planu

#### 5. Commit zmian do repozytorium
Po zakończeniu wszystkich funkcji:
```bash
git add .
git commit -m "feat: Pełna synchronizacja planer ogrodu ↔ zadania"
git push
```

---

## Schemat bazy danych (nowe kolumny)

```sql
-- garden_plans
ALTER TABLE garden_plans ADD COLUMN tasks_created_at DATETIME;
ALTER TABLE garden_plans ADD COLUMN planned_planting_date DATE;

-- garden_plan_items
ALTER TABLE garden_plan_items ADD COLUMN task_id INTEGER;
ALTER TABLE garden_plan_items ADD COLUMN planted_at DATETIME;

-- planned_actions (tasks)
ALTER TABLE planned_actions ADD COLUMN garden_plan_id INTEGER;
ALTER TABLE planned_actions ADD COLUMN garden_plan_item_id INTEGER;
```

---

## Kluczowe pliki do modyfikacji:
- `garden-app/backend/routes/garden-plans.js` - endpointy planów
- `garden-app/backend/routes/tasks.js` - endpointy zadań
- `garden-app/frontend/src/pages/GardenPlanner.js` - UI planera
- `garden-app/frontend/src/pages/Tasks.js` - UI zadań

## Jak testować:
1. Utworzyć plan z kilkoma roślinami
2. Kliknąć "Dodaj do zadań" i potwierdzić
3. Przejść do Zadań, zmienić datę jednego → sprawdzić dialog
4. Oznaczyć zadanie jako wykonane → sprawdzić dialog wyboru roślin
5. Sprawdzić czy grządki zostały utworzone w poletku
