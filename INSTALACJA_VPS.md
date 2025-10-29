# Instalacja Garden App na serwerze VPS

Kompletny przewodnik jak zainstalować Garden App na serwerze VPS (Ubuntu) używając automatycznego skryptu deployment.

## 📋 Wymagania

### Serwer VPS:
- **System**: Ubuntu 20.04 lub nowszy (zalecane: Ubuntu 22.04)
- **RAM**: Minimum 1GB (zalecane: 2GB)
- **Dysk**: Minimum 10GB wolnego miejsca
- **Dostęp**: SSH (root lub sudo)
- **Port**: 22 (SSH), 80 (HTTP), 443 (HTTPS - opcjonalnie)

### Lokalny komputer:
- **Linux/Mac**: Działa od razu
- **Windows**: Użyj WSL (Windows Subsystem for Linux) lub Git Bash

---

## 🚀 Instalacja krok po kroku

### Krok 1: Przygotuj serwer VPS

Jeśli masz świeży serwer, zalecamy najpierw podstawową konfigurację:

```bash
# Połącz się z serwerem (zamień IP na swój)
ssh root@123.45.67.89

# Zaktualizuj system
apt update && apt upgrade -y

# Zainstaluj podstawowe narzędzia (opcjonalnie)
apt install -y curl wget git ufw

# Skonfiguruj firewall (opcjonalnie)
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

Możesz się teraz rozłączyć - skrypt zrobi resztę automatycznie.

---

### Krok 2: Uruchom skrypt deployment

Na swoim **lokalnym komputerze** (nie na serwerze!):

```bash
# Przejdź do folderu projektu
cd Garden

# Nadaj uprawnienia wykonywania skryptowi
chmod +x deploy-to-vps.sh

# Uruchom skrypt
./deploy-to-vps.sh
```

---

### Krok 3: Odpowiedz na pytania skryptu

Skrypt zadaje kilka pytań. Oto przykładowa sesja:

#### 3.1 Wybór trybu
```
1) Nowa instalacja (fresh install)
2) Aktualizacja istniejącej instalacji (update)

Wybierz tryb (1/2): 1
```
**Wybierz**: `1` (dla nowej instalacji)

#### 3.2 Dane serwera VPS
```
Adres IP lub domena VPS:
```
**Wpisz**: Adres IP twojego serwera, np. `123.45.67.89`
Lub domenę, jeśli masz: `moja-dzialka.pl`

```
Użytkownik SSH (domyślnie: root):
```
**Wpisz**: `root` lub twój użytkownik z dostępem sudo (lub naciśnij Enter dla root)

```
Hasło SSH:
```
**Wpisz**: Hasło do SSH (tekst będzie ukryty)

```
Port SSH (domyślnie: 22):
```
**Wpisz**: Naciśnij Enter (chyba że zmieniłeś domyślny port SSH)

#### 3.3 Konfiguracja aplikacji
```
Domena dla aplikacji (opcjonalnie, naciśnij Enter aby pominąć):
```
**Opcja A - Masz domenę**: Wpisz `moja-dzialka.pl`
**Opcja B - Używasz tylko IP**: Naciśnij Enter (aplikacja będzie dostępna pod IP)

```
Nazwa folderu aplikacji (domyślnie: garden-app):
```
**Wpisz**: Naciśnij Enter (użyje domyślnej nazwy)

```
Port backendu (domyślnie: 3001):
```
**Wpisz**: Naciśnij Enter (domyślny port 3001)

```
Skonfigurować SSL z Let's Encrypt? (t/n, domyślnie: n):
```
**Opcja A - Masz domenę**: `t` (zalecane!)
**Opcja B - Używasz IP**: `n` (SSL wymaga domeny)

Jeśli wybrałeś SSL:
```
Email dla certyfikatu SSL:
```
**Wpisz**: Twój email (wymagany przez Let's Encrypt)

#### 3.4 Potwierdzenie
Skrypt wyświetli podsumowanie:
```
Podsumowanie konfiguracji:
  Tryb: fresh
  Serwer: root@123.45.67.89:22
  Folder: /var/www/garden-app
  Domena: moja-dzialka.pl
  Backend port: 3001
  SSL: t

Czy kontynuować? (t/n):
```
**Wpisz**: `t` aby rozpocząć instalację

---

### Krok 4: Czekaj na zakończenie instalacji

Skrypt automatycznie:
1. ✅ Testuje połączenie SSH
2. ✅ Instaluje nginx, Node.js, PM2, git
3. ✅ Kopiuje pliki aplikacji na serwer
4. ✅ Konfiguruje backend i .env
5. ✅ Buduje frontend (React)
6. ✅ Konfiguruje nginx jako reverse proxy
7. ✅ Uruchamia backend z PM2 (autostart)
8. ✅ Opcjonalnie konfiguruje SSL (Let's Encrypt)
9. ✅ Konfiguruje firewall (UFW)

**Czas instalacji**: 5-10 minut (zależnie od szybkości serwera)

---

### Krok 5: Skonfiguruj OpenWeatherMap API (wymagane!)

Po zakończeniu instalacji **MUSISZ** skonfigurować klucz API dla funkcji pogody:

#### 5.1 Uzyskaj klucz API
1. Wejdź na: https://openweathermap.org/api
2. Kliknij **Sign Up** i utwórz darmowe konto
3. Przejdź do **API Keys**
4. Skopiuj swój klucz (np. `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)
5. ⚠️ **WAŻNE**: Aktywacja klucza może zająć 10 min - 2 godziny!

Szczegółowa instrukcja: [OPENWEATHER_SETUP.md](./OPENWEATHER_SETUP.md)

#### 5.2 Dodaj klucz na serwerze
```bash
# Połącz się z serwerem
ssh root@123.45.67.89

# Edytuj plik .env
nano /var/www/garden-app/garden-app/backend/.env

# Znajdź linię:
# OPENWEATHER_API_KEY=
# I dodaj swój klucz:
OPENWEATHER_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

# Zapisz: Ctrl+O, Enter, Ctrl+X

# Restart backendu
pm2 restart garden-app-backend
```

---

## 🎉 Gotowe! Dostęp do aplikacji

### Z domeną i SSL:
🌐 **Frontend**: https://moja-dzialka.pl
🔌 **Backend API**: https://moja-dzialka.pl/api

### Z domeną bez SSL:
🌐 **Frontend**: http://moja-dzialka.pl
🔌 **Backend API**: http://moja-dzialka.pl/api

### Tylko IP:
🌐 **Frontend**: http://123.45.67.89
🔌 **Backend API**: http://123.45.67.89/api

---

## 📱 Pierwsze logowanie

1. Otwórz aplikację w przeglądarce
2. Kliknij **Zarejestruj się**
3. Utwórz konto (pierwszy użytkownik)
4. **Przejdź do Profilu** (👤 na dolnej nawigacji)
5. **Ustaw lokalizację** dla funkcji pogody:
   - Kliknij **"Użyj mojej lokalizacji"** (zalecane)
   - Lub wpisz ręcznie współrzędne GPS
6. Kliknij **Zapisz lokalizację**

Teraz funkcja pogody i rekomendacji będzie działać! 🌤️

---

## 🔧 Zarządzanie aplikacją

### Sprawdzenie statusu
```bash
# Backend (PM2)
pm2 status

# Nginx
systemctl status nginx

# Logi backendu
pm2 logs garden-app-backend

# Logi nginx
tail -f /var/log/nginx/garden-app-garden-app-access.log
tail -f /var/log/nginx/garden-app-garden-app-error.log
```

### Restartowanie
```bash
# Restart backendu
pm2 restart garden-app-backend

# Restart nginx
systemctl restart nginx

# Restart całego serwera
reboot
```

### Zatrzymywanie
```bash
# Zatrzymaj backend
pm2 stop garden-app-backend

# Zatrzymaj nginx
systemctl stop nginx
```

---

## 🔄 Aktualizacja aplikacji

Gdy dostępna jest nowa wersja aplikacji:

```bash
# Na lokalnym komputerze (w folderze Garden)
./deploy-to-vps.sh

# Wybierz opcję:
2) Aktualizacja istniejącej instalacji (update)

# Podaj dane serwera (jak przy pierwszej instalacji)
```

Skrypt automatycznie:
- ✅ Tworzy backup bazy danych i aplikacji
- ✅ Aktualizuje kod aplikacji
- ✅ Zachowuje .env (JWT_SECRET, OPENWEATHER_API_KEY)
- ✅ Restartuje backend
- ✅ Przebudowuje frontend
- ✅ Reloaduje nginx

**Bez utraty danych!** 🎉

---

## 🐛 Rozwiązywanie problemów

### Problem 1: "Nie można połączyć się przez SSH"
**Przyczyny**:
- Błędny adres IP
- Błędny port SSH
- Błędne hasło
- Firewall blokuje port 22

**Rozwiązanie**:
```bash
# Sprawdź ręcznie połączenie SSH
ssh root@123.45.67.89

# Jeśli używasz innego portu
ssh -p 2222 root@123.45.67.89

# Sprawdź czy serwer działa (ping)
ping 123.45.67.89
```

### Problem 2: "sshpass nie jest zainstalowany"
Skrypt automatycznie zainstaluje, ale jeśli masz problem:

**Ubuntu/Debian**:
```bash
sudo apt-get update
sudo apt-get install sshpass
```

**Mac**:
```bash
brew install hudochenkov/sshpass/sshpass
```

### Problem 3: Aplikacja nie działa po instalacji
```bash
# Połącz się z serwerem
ssh root@123.45.67.89

# Sprawdź status backendu
pm2 status
pm2 logs garden-app-backend --lines 50

# Sprawdź nginx
systemctl status nginx
nginx -t

# Sprawdź czy port 3001 nasłuchuje
netstat -tulpn | grep 3001
```

### Problem 4: Widget pogody nie działa
**Przyczyny**:
- Brak OPENWEATHER_API_KEY w .env
- Klucz API jeszcze nieaktywny (czekaj 10 min - 2h)
- Brak lokalizacji w profilu użytkownika

**Rozwiązanie**:
```bash
# Sprawdź .env
cat /var/www/garden-app/garden-app/backend/.env | grep OPENWEATHER

# Sprawdź logi backendu
pm2 logs garden-app-backend --lines 50

# Upewnij się że ustawiłeś lokalizację w profilu aplikacji
```

### Problem 5: "502 Bad Gateway"
Backend nie działa lub nginx nie może się połączyć.

**Rozwiązanie**:
```bash
# Restart backendu
pm2 restart garden-app-backend

# Sprawdź czy backend działa
pm2 status
curl http://localhost:3001/api/health

# Restart nginx
systemctl restart nginx
```

### Problem 6: SSL nie działa (Let's Encrypt)
**Wymagania dla SSL**:
- Musisz mieć domenę (nie działa z samym IP)
- Domena musi wskazywać na IP serwera (rekord A w DNS)
- Porty 80 i 443 muszą być otwarte

**Ręczna konfiguracja SSL**:
```bash
# Na serwerze
apt install certbot python3-certbot-nginx
certbot --nginx -d moja-dzialka.pl
```

---

## 📂 Struktura plików na serwerze

```
/var/www/garden-app/
├── garden-app/
│   ├── backend/
│   │   ├── .env              ← Konfiguracja (JWT_SECRET, OPENWEATHER_API_KEY)
│   │   ├── garden.db         ← Baza danych SQLite
│   │   ├── uploads/          ← Zdjęcia wgrywane przez użytkowników
│   │   ├── index.js          ← Entry point backendu
│   │   └── package.json
│   └── frontend/
│       ├── build/            ← Zbudowana aplikacja React
│       └── package.json
├── public/                   ← Pliki statyczne dla nginx
└── backups/                  ← Automatyczne backupy (tylko w trybie update)
    ├── garden-db-backup-*.tar.gz
    └── app-backup-*.tar.gz
```

**Ważne pliki konfiguracyjne**:
- `/var/www/garden-app/garden-app/backend/.env` - Konfiguracja backendu
- `/etc/nginx/sites-available/garden-app-garden-app` - Konfiguracja nginx
- `/etc/nginx/sites-enabled/garden-app-garden-app` - Symlink do konfiguracji

---

## 🔒 Bezpieczeństwo

### Zalecane praktyki:

1. **Zmień domyślny port SSH** (z 22 na np. 2222)
```bash
# Na serwerze
nano /etc/ssh/sshd_config
# Zmień: Port 2222
systemctl restart ssh
```

2. **Wyłącz logowanie root przez hasło, użyj kluczy SSH**
```bash
ssh-keygen -t rsa -b 4096
ssh-copy-id root@123.45.67.89
# Potem w /etc/ssh/sshd_config ustaw: PasswordAuthentication no
```

3. **Regularnie aktualizuj system**
```bash
apt update && apt upgrade -y
```

4. **Używaj SSL/HTTPS** (Let's Encrypt jest darmowy!)

5. **Backup bazy danych** (automatyczny przy aktualizacji, ale możesz robić ręcznie)
```bash
# Backup
tar -czf backup-$(date +%Y%m%d).tar.gz /var/www/garden-app/garden-app/backend/garden.db /var/www/garden-app/garden-app/backend/uploads

# Przywracanie
tar -xzf backup-20250124.tar.gz -C /
pm2 restart garden-app-backend
```

---

## 📊 Monitoring

### Sprawdzenie zużycia zasobów:
```bash
# Użycie CPU, RAM, dysku
htop
# lub
top

# Użycie dysku
df -h

# Użycie pamięci
free -h
```

### PM2 monitoring:
```bash
# Dashboard PM2
pm2 monit

# Statystyki
pm2 show garden-app-backend
```

---

## 💡 Dodatkowe informacje

### Limity darmowego planu OpenWeatherMap:
- **1000 wywołań API / dzień**
- **60 wywołań / minutę**
- Aplikacja używa cache 30 minut, więc limit wystarczy dla ~50-100 użytkowników

### Koszt serwera VPS:
- **Basic VPS** (1GB RAM): ~$5-10/miesiąc
- **Polecane dostawcy**: DigitalOcean, Linode, Vultr, Hetzner, OVH
- **Polski dostawcy**: home.pl, nazwa.pl, zenbox.pl

### Backup strategie:
1. **Automatyczne backupy** - skrypt robi je przy każdej aktualizacji
2. **Cron backup** - możesz ustawić codzienny backup
3. **Backup dostawcy VPS** - większość VPS oferuje snapshot serwera

---

## 🆘 Pomoc

Jeśli masz problemy:

1. Sprawdź logi:
   - `pm2 logs garden-app-backend`
   - `/var/log/nginx/garden-app-garden-app-error.log`

2. Zobacz dokumentację:
   - [OPENWEATHER_SETUP.md](./OPENWEATHER_SETUP.md) - Setup pogody
   - [DEPLOYMENT.md](./DEPLOYMENT.md) - Szczegóły deploymentu

3. Sprawdź status wszystkiego:
```bash
pm2 status
systemctl status nginx
ufw status
netstat -tulpn | grep -E '(80|443|3001|22)'
```

---

**Powodzenia z instalacją! 🌱**
