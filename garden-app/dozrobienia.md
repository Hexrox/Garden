# Do Zrobienia - GardenApp Planer Ogrodu

## Stan wdrożenia (15.02.2026)

### Baza roślin - WDROŻONE
- [x] 1105 roślin w bazie produkcyjnej (gardenapp.pl)
- [x] Źródła: PNOS (208), W. Legutko (55), Plantico (24), Torseed (20), Plantini F1 (25), wcześniejsze importy (~773)
- [x] 3903 plików zdjęć zsynchronizowanych (359 MB)
- [x] 1103/1105 ze zdjęciem (99.8%), 798/1105 z ilustracją vintage (72%)
- [x] Opisy po polsku przejrzane i poprawione (rozszerzone krótkie opisy, naprawione nazwy z podkreśleniami)

### Synchronizacja Plan → Zadania - WDROŻONE
- [x] Dodanie rośliny po utworzeniu zadań → auto-tworzenie zadania (`garden-plans.js:282-301`)
- [x] Usunięcie rośliny → usunięcie zadania (`garden-plans.js:380`)
- [x] Zmiana ilości → sync opisu zadania (`garden-plans.js:314`)
- [x] Zmiana daty → dialog wyboru (jedno/wszystkie zadania) (`Tasks.js:137-165`, `tasks.js:984-1034`)
- [x] Potwierdzenie sadzenia → dialog z checkboxami (`Tasks.js:104-135`)
- [x] Utworzenie grządek po sadzeniu (`tasks.js:1140-1158`)

---

## Do zrobienia (następne sesje)

### Ulepszenia planera
- [ ] Widok kalendarza zadań (miesiąc/tydzień)
- [ ] Powiadomienia push o zbliżających się zadaniach
- [ ] Historia sadzenia i zbiorów

### Rozwój katalogu roślin
- [ ] Filtrowanie po właściwościach (słoneczne/cieniste, byliny/jednoroczne)
- [ ] Porównywanie odmian side-by-side
- [ ] System ocen/recenzji użytkowników

### Techniczne
- [ ] Dodać error handling callbacks do `db.run()` w garden-plans.js (synchronizacja)
- [ ] Dodać disabled state na przyciskach dialogów podczas operacji async
- [ ] Migracja z callbacks na Promise-based API w routes

---

## Kluczowe pliki:
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
