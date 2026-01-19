# Garden App - TODO / Pomysły

## W trakcie realizacji

- [ ] **Zdjęcia roślin w katalogu** - wyświetlanie miniatur i pełnych zdjęć z atrybucją (w trakcie)
- [ ] **Deploy na nowy serwer** (5.231.106.155) - czeka na zakończenie prac nad frontendem

## Pomysły do rozważenia

### Społecznościowa baza roślin

**Pomysł:** Użytkownicy mogą dodawać nowe rośliny do globalnej bazy, tworząc wspólną encyklopedię ogrodniczą.

**Do przemyślenia:**
1. **Moderacja** - kto zatwierdza nowe wpisy?
   - System głosowania społeczności?
   - Rola moderatorów/ekspertów?
   - Automatyczne zatwierdzanie po X pozytywnych opiniach?

2. **Jakość danych** - jak zapewnić poprawność informacji?
   - Wymagane źródła/referencje?
   - System korekty błędów przez społeczność?
   - Wersjonowanie zmian (historia edycji)?

3. **Duplikaty** - jak uniknąć wielu wpisów tej samej rośliny?
   - Wyszukiwanie przed dodaniem
   - Sugestie podobnych podczas tworzenia
   - Łączenie duplikatów przez moderatorów

4. **Zdjęcia** - skąd brać licencjonowane zdjęcia?
   - Wikimedia Commons (obecne rozwiązanie)
   - Własne zdjęcia użytkowników (weryfikacja praw)?
   - Integracja z zewnętrznymi bazami botanicznymi?

5. **Gamifikacja** - motywacja dla użytkowników
   - Punkty za dodane rośliny
   - Odznaki za wkład
   - Ranking kontrybutorów

6. **Lokalizacja** - różne strefy klimatyczne
   - Informacje o uprawie w różnych regionach
   - Strefy mrozoodporności (USDA)
   - Lokalne nazwy roślin

**Proponowane fazy implementacji:**

**Faza 1 - MVP:**
- Formularz dodawania rośliny (już częściowo istnieje)
- Status "oczekująca na weryfikację"
- Panel admina do zatwierdzania

**Faza 2 - Społeczność:**
- Profil kontrybutora
- Historia dodanych roślin
- System ocen/komentarzy do wpisów

**Faza 3 - Pełna społeczność:**
- Edycja istniejących wpisów przez społeczność
- System głosowania na zmiany
- Automatyczna moderacja

---

## Ukończone

- [x] Migracja bazy - kolumny na zdjęcia roślin
- [x] Backend API do zarządzania zdjęciami (/api/admin/images)
- [x] Skrypt wyszukiwania zdjęć z Wikimedia Commons
- [x] Panel admina do zatwierdzania zdjęć (/admin/images)
- [x] Naprawiono role użytkowników w bazie
- [x] JWT token zawiera rolę użytkownika
- [x] Poprawka mobile - przyciski w modalach widoczne nad BottomNav
