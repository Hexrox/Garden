# 🚀 Automatyczny Deployment na VPS - Szybki Start

## Uruchomienie w 3 krokach:

### 1. Przygotuj dane
- IP serwera: `8.209.82.14` (lub Twoje IP)
- Użytkownik: `root`
- Hasło SSH
- (Opcjonalnie) Klucz OpenWeather API

### 2. Uruchom skrypt
```bash
cd /home/hexan/claude/garden/Garden
./deploy.sh
```

### 3. Postępuj zgodnie z instrukcjami
Skrypt przeprowadzi Cię przez wszystko krok po kroku.

---

## ✨ Co robi skrypt?

### Automatycznie:
- ✅ Sprawdza czy wszystko jest zainstalowane (Node.js, Nginx, SQLite, PM2)
- ✅ Instaluje brakujące pakiety
- ✅ Wykrywa czy Nginx już hostuje jakieś aplikacje
- ✅ Pakuje i przesyła aplikację na serwer
- ✅ Instaluje zależności (backend + frontend)
- ✅ Buduje frontend React
- ✅ Konfiguruje Nginx (z backupem istniejących konfiguracji)
- ✅ Uruchamia aplikację z PM2 (auto-restart po restarcie serwera)
- ✅ Wyświetla podsumowanie i przydatne komendy

### Inteligentnie:
- 🧠 **Wykrywa istniejące aplikacje w Nginx** - instaluje Garden App w osobnym folderze `/var/www/garden`
- 🧠 **3 opcje instalacji** gdy Nginx już działa:
  1. Subdomena (np. `garden.twojadomena.com`)
  2. Ścieżka (np. `twojadomena.com/garden`)
  3. Osobny port (np. `:3001`)
- 🧠 **Używa sshpass** - zapamięta hasło, nie musisz wpisywać 10 razy
- 🧠 **Idempotentny** - można uruchomić wielokrotnie (aktualizacja)

---

## 🎯 Przykładowe wywołanie

```
╔═══════════════════════════════════════════════════════════════╗
║           🌱 GARDEN APP - VPS DEPLOYMENT SCRIPT 🌱           ║
╚═══════════════════════════════════════════════════════════════╝

? Adres serwera (IP lub domena)
  Domyślnie: 8.209.82.14
  Wprowadź lub naciśnij Enter: [Enter]

? Użytkownik SSH
  Domyślnie: root
  Wprowadź lub naciśnij Enter: [Enter]

? Port SSH
  Domyślnie: 22
  Wprowadź lub naciśnij Enter: [Enter]

? Metoda uwierzytelniania:
  1) Hasło (z sshpass)
  2) Klucz SSH (bez hasła)
  Wybierz (1/2) [1]: 1

? Hasło SSH
  (nie będzie widoczne): ********

✓ Połączenie z serwerem 8.209.82.14 działa!

[KROK 2/10] Sprawdzanie środowiska VPS
✓ Node.js: v18.20.0
✓ NPM: 10.5.0
✓ Nginx: nginx/1.18.0
✓ SQLite3: 3.31.1
✓ PM2: 5.3.0

[KROK 3/10] Sprawdzanie konfiguracji Nginx
✓ Nginx nie hostuje jeszcze żadnych aplikacji

? Czy masz domenę dla tej aplikacji?
  1) Tak, mam domenę
  2) Nie, użyję IP serwera
  Wybierz (1/2) [2]: 2

[KROK 4/10] Konfiguracja aplikacji
? Klucz API OpenWeatherMap (FREE)
  Wprowadź klucz lub zostaw puste: abc123def456

? Port backendu
  Domyślnie: 3001
  Wprowadź lub naciśnij Enter: [Enter]

[KROK 5/10] Upload aplikacji na serwer
✓ Aplikacja spakowana
✓ Aplikacja przesłana na serwer

[KROK 6/10] Instalacja zależności
✓ Zależności backendu zainstalowane
✓ Zależności frontendu zainstalowane

[KROK 7/10] Konfiguracja zmiennych środowiskowych
✓ Plik .env utworzony

[KROK 8/10] Budowanie frontendu
✓ Frontend zbudowany

[KROK 9/10] Konfiguracja Nginx
✓ Konfiguracja Nginx poprawna
✓ Nginx skonfigurowany i uruchomiony

[KROK 10/10] Uruchamianie aplikacji z PM2
✓ Aplikacja uruchomiona z PM2

╔═══════════════════════════════════════════════════════════════╗
║                  ✓ INSTALACJA ZAKOŃCZONA!                    ║
╚═══════════════════════════════════════════════════════════════╝

🌍 Aplikacja dostępna pod:
   http://8.209.82.14

Przydatne komendy:
  Status:    ssh root@8.209.82.14 'pm2 status'
  Logi:      ssh root@8.209.82.14 'pm2 logs garden-backend'
  Restart:   ssh root@8.209.82.14 'pm2 restart garden-backend'

🌱 Miłego ogrodnictwa! 🌱
```

---

## 📖 Szczegółowa dokumentacja

Pełna dokumentacja: **DEPLOYMENT_GUIDE.md**

Zawiera:
- ✅ Wymagania systemowe
- ✅ Szczegółowy opis każdego kroku
- ✅ Zarządzanie aplikacją (PM2)
- ✅ Konfiguracja SSL/HTTPS
- ✅ Troubleshooting
- ✅ Backup i restore
- ✅ Konfiguracja domeny
- ✅ FAQ

---

## ⚡ Najczęstsze pytania

### Q: Czy mogę uruchomić skrypt gdy Nginx już działa?
**A:** Tak! Skrypt automatycznie wykryje istniejące aplikacje i zainstaluje Garden App w osobnym folderze.

### Q: Co jeśli nie mam hasła SSH, tylko klucz?
**A:** Wybierz opcję "2) Klucz SSH" podczas konfiguracji. Upewnij się że klucz jest dodany do ssh-agent.

### Q: Czy mogę używać IP zamiast domeny?
**A:** Tak! Domyślnie skrypt używa IP `8.209.82.14`.

### Q: Co jeśli chcę zmienić port backendu?
**A:** Podczas konfiguracji (krok 4) wprowadź swój port, np. `4000`.

### Q: Czy mogę uruchomić skrypt ponownie?
**A:** Tak! Skrypt jest idempotentny - wykryje istniejącą instalację i zaktualizuje pliki.

---

## 🆘 Pomoc

**Problem podczas instalacji?**

1. Sprawdź logi w terminalu
2. Uruchom ponownie: `./deploy.sh`
3. Zobacz: `DEPLOYMENT_GUIDE.md` → Troubleshooting

**Aplikacja nie działa po instalacji?**

```bash
# Status
ssh root@8.209.82.14 'pm2 status'

# Logi
ssh root@8.209.82.14 'pm2 logs garden-backend'

# Restart
ssh root@8.209.82.14 'pm2 restart garden-backend'
```

---

## 🎉 Gotowe!

Po instalacji:
1. Otwórz `http://8.209.82.14` (lub swoją domenę)
2. Zarejestruj się jako nowy użytkownik
3. Przejdź do Profil → Ustaw lokalizację (dla pogody)
4. Stwórz swoją pierwszą działkę!

**Miłego ogrodnictwa!** 🌱
