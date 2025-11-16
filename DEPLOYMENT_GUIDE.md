# 🚀 Garden App - Przewodnik Wdrożenia na VPS

## Automatyczna instalacja za pomocą skryptu

Ten przewodnik pomoże Ci wdrożyć Garden App na serwerze VPS w ~10 minut.

---

## 📋 Wymagania

### Na Twoim komputerze (lokalnie):
- ✅ Linux/macOS (lub Windows z WSL)
- ✅ SSH
- ✅ `sshpass` (opcjonalne, ale zalecane)

### Na serwerze VPS:
- ✅ Ubuntu 20.04+ / Debian 11+ (inne dystrybucje mogą wymagać modyfikacji)
- ✅ Dostęp root lub sudo
- ✅ Min. 1GB RAM
- ✅ Min. 10GB miejsca na dysku

**Skrypt automatycznie zainstaluje:**
- Node.js 18.x
- Nginx
- SQLite3
- PM2
- Git

---

## 🎯 Szybki Start

### Krok 1: Przygotuj dane dostępowe

Będziesz potrzebować:
- IP serwera VPS (domyślnie: `8.209.82.14`)
- Użytkownik SSH (domyślnie: `root`)
- Hasło SSH lub klucz prywatny
- (Opcjonalnie) Klucz OpenWeather API

### Krok 2: Uruchom skrypt

```bash
cd /home/hexan/claude/garden/Garden
./deploy.sh
```

### Krok 3: Postępuj zgodnie z instrukcjami

Skrypt przeprowadzi Cię przez:
1. Konfigurację połączenia SSH
2. Sprawdzenie środowiska serwera
3. Automatyczną instalację brakujących pakietów
4. Konfigurację Nginx (inteligentne wykrywanie istniejących aplikacji)
5. Upload i instalację Garden App
6. Uruchomienie aplikacji z PM2

---

## 📖 Szczegółowy Opis Procesu

### 1. Konfiguracja Połączenia

Skrypt zapyta o:

```
Adres serwera (IP lub domena): 8.209.82.14
Użytkownik SSH: root
Port SSH: 22
Metoda uwierzytelniania:
  1) Hasło (z sshpass)
  2) Klucz SSH
```

**Zalecana metoda:** Użyj hasła z `sshpass` - skrypt zapamięta hasło i nie będziesz musiał go wpisywać wielokrotnie.

### 2. Sprawdzanie Środowiska

Skrypt sprawdzi:
- ✅ System operacyjny
- ✅ Node.js, NPM
- ✅ Nginx
- ✅ SQLite3
- ✅ PM2

**Jeśli brakuje pakietów** - skrypt automatycznie je zainstaluje.

### 3. Inteligentne Wykrywanie Nginx

**Scenariusz A: Nginx jest pusty**
- Garden App zostanie zainstalowana jako główna aplikacja
- Będzie dostępna na głównym adresie: `http://twoj-serwer.com`

**Scenariusz B: Nginx już hostuje aplikacje**
- Skrypt wykryje istniejące konfiguracje
- Zaproponuje 3 opcje:
  1. **Subdomena** (np. `garden.twojadomena.com`)
  2. **Ścieżka** (np. `twojadomena.com/garden`)
  3. **Osobny port** (np. `:3001`)

**Garden App zostanie zainstalowana w `/var/www/garden`** aby nie zakłócać innych aplikacji.

### 4. Konfiguracja Aplikacji

Skrypt zapyta o:

```
Klucz API OpenWeatherMap: [opcjonalnie]
Port backendu: 3001
```

**OpenWeather API:**
- Jeśli zostawisz puste - aplikacja zadziała, ale bez funkcji pogody
- Możesz dodać klucz później w `.env`

**JWT Secret:**
- Generowany automatycznie (64-znakowy losowy ciąg)
- Nie musisz nic robić

### 5. Instalacja

Skrypt automatycznie:
1. Pakuje aplikację (bez `node_modules`, `.git`)
2. Przesyła na serwer
3. Rozpakuje w `/var/www/garden`
4. Instaluje zależności backendu i frontendu
5. Buduje frontend React (`npm run build`)
6. Konfiguruje Nginx
7. Uruchamia backend z PM2

### 6. Sukces!

Po zakończeniu zobaczysz podsumowanie:

```
╔═══════════════════════════════════════════════════════════════╗
║                  ✓ INSTALACJA ZAKOŃCZONA!                    ║
╚═══════════════════════════════════════════════════════════════╝

🌍 Aplikacja dostępna pod:
   http://8.209.82.14

Przydatne komendy:
  Status:    ssh root@8.209.82.14 'pm2 status'
  Logi:      ssh root@8.209.82.14 'pm2 logs garden-backend'
  Restart:   ssh root@8.209.82.14 'pm2 restart garden-backend'
```

---

## 🎛️ Zarządzanie Aplikacją

### Sprawdzanie statusu

```bash
ssh root@8.209.82.14 'pm2 status'
```

Wyjście:
```
┌─────────────────┬────┬─────────┬──────┬──────────┬─────────┐
│ App name        │ id │ mode    │ ↺    │ status   │ cpu     │
├─────────────────┼────┼─────────┼──────┼──────────┼─────────┤
│ garden-backend  │ 0  │ fork    │ 0    │ online   │ 0.2%    │
└─────────────────┴────┴─────────┴──────┴──────────┴─────────┘
```

### Przeglądanie logów

**Wszystkie logi (live):**
```bash
ssh root@8.209.82.14 'pm2 logs garden-backend'
```

**Tylko błędy:**
```bash
ssh root@8.209.82.14 'pm2 logs garden-backend --err'
```

**Ostatnie 100 linii:**
```bash
ssh root@8.209.82.14 'pm2 logs garden-backend --lines 100'
```

### Restart aplikacji

```bash
ssh root@8.209.82.14 'pm2 restart garden-backend'
```

### Zatrzymanie aplikacji

```bash
ssh root@8.209.82.14 'pm2 stop garden-backend'
```

### Uruchomienie po zatrzymaniu

```bash
ssh root@8.209.82.14 'pm2 start garden-backend'
```

---

## ⚙️ Konfiguracja po instalacji

### Dodanie OpenWeather API Key (jeśli pominięto)

1. Edytuj plik `.env`:
   ```bash
   ssh root@8.209.82.14
   nano /var/www/garden/backend/.env
   ```

2. Dodaj linię:
   ```
   OPENWEATHER_API_KEY=twoj_klucz_tutaj
   ```

3. Zapisz (Ctrl+O, Enter, Ctrl+X)

4. Restart:
   ```bash
   pm2 restart garden-backend
   ```

### Zmiana portu backendu

1. Edytuj `.env`:
   ```bash
   nano /var/www/garden/backend/.env
   ```

2. Zmień `PORT=3001` na np. `PORT=4000`

3. Edytuj konfigurację Nginx:
   ```bash
   nano /etc/nginx/sites-available/garden-app
   ```

4. Zmień `proxy_pass http://localhost:3001` na `proxy_pass http://localhost:4000`

5. Restart:
   ```bash
   pm2 restart garden-backend
   systemctl restart nginx
   ```

---

## 🔒 Konfiguracja SSL/HTTPS (Certbot)

### Automatyczny SSL z Let's Encrypt (ZALECANE)

**Wymagania:**
- Domena wskazująca na Twój serwer (rekord A w DNS)

**Instalacja:**

```bash
ssh root@8.209.82.14

# Zainstaluj Certbot
apt-get update
apt-get install -y certbot python3-certbot-nginx

# Uzyskaj certyfikat (zastąp swoją domeną)
certbot --nginx -d twojadomena.com

# Certbot automatycznie skonfiguruje Nginx dla HTTPS
```

**Auto-renewal:**
```bash
# Certbot automatycznie dodaje cron job do odnowienia
# Możesz przetestować odnowienie:
certbot renew --dry-run
```

Po skonfigurowaniu SSL aplikacja będzie dostępna na:
```
https://twojadomena.com
```

---

## 🔧 Troubleshooting

### Problem: "Connection refused"

**Przyczyny:**
1. Backend nie działa
2. Firewall blokuje port
3. Nginx nie działa

**Rozwiązanie:**
```bash
# Sprawdź status backendu
ssh root@8.209.82.14 'pm2 status'

# Sprawdź status Nginx
ssh root@8.209.82.14 'systemctl status nginx'

# Sprawdź firewall (jeśli używasz UFW)
ssh root@8.209.82.14 'ufw status'

# Otwórz porty
ssh root@8.209.82.14 'ufw allow 80/tcp && ufw allow 443/tcp'
```

### Problem: "502 Bad Gateway"

**Przyczyna:** Backend nie odpowiada

**Rozwiązanie:**
```bash
# Sprawdź logi backendu
ssh root@8.209.82.14 'pm2 logs garden-backend --err'

# Restart backendu
ssh root@8.209.82.14 'pm2 restart garden-backend'
```

### Problem: "404 Not Found" na wszystkich stronach

**Przyczyna:** React Router nie działa (problem z Nginx)

**Rozwiązanie:**
```bash
ssh root@8.209.82.14
nano /etc/nginx/sites-available/garden-app
```

Upewnij się że jest:
```nginx
location / {
    root /var/www/garden/frontend/build;
    try_files $uri $uri/ /index.html;  # <-- TO JEST WAŻNE
}
```

Restart Nginx:
```bash
systemctl restart nginx
```

### Problem: Pogoda nie działa

**Przyczyny:**
1. Brak OpenWeather API key
2. Klucz nieaktywny (czekaj 10-120 min)
3. Lokalizacja nie ustawiona

**Rozwiązanie:**
1. Sprawdź `.env`:
   ```bash
   ssh root@8.209.82.14 'cat /var/www/garden/backend/.env | grep OPENWEATHER'
   ```

2. Przetestuj klucz:
   ```bash
   curl "https://api.openweathermap.org/data/2.5/weather?lat=52.229676&lon=21.012229&appid=TWOJ_KLUCZ&units=metric"
   ```

3. W aplikacji: Profil → Ustaw lokalizację

### Problem: Aplikacja wolno się ładuje

**Rozwiązanie:**

1. **Włącz cache w Nginx** (już powinno być):
   ```nginx
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

2. **Zwiększ pamięć dla PM2**:
   ```bash
   ssh root@8.209.82.14
   nano /var/www/garden/ecosystem.config.js
   ```

   Zmień `max_memory_restart: '500M'` na `'1G'`

3. **Sprawdź użycie zasobów**:
   ```bash
   ssh root@8.209.82.14 'pm2 monit'
   ```

---

## 📦 Aktualizacja Aplikacji

### Metoda 1: Ponowne uruchomienie skryptu

```bash
cd /home/hexan/claude/garden/Garden
./deploy.sh
```

Skrypt wykryje istniejącą instalację i zaktualizuje pliki.

### Metoda 2: Ręczna aktualizacja

```bash
# 1. Spakuj nową wersję
cd /home/hexan/claude/garden/Garden
tar -czf garden-app-update.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    -C garden-app .

# 2. Upload na serwer
scp garden-app-update.tar.gz root@8.209.82.14:/tmp/

# 3. Backup i rozpakowanie
ssh root@8.209.82.14 << 'EOF'
    # Backup bazy danych
    cp /var/www/garden/backend/garden.db /var/www/garden/backend/garden.db.backup.$(date +%Y%m%d_%H%M%S)

    # Backup .env
    cp /var/www/garden/backend/.env /tmp/.env.backup

    # Rozpakuj nową wersję
    cd /var/www/garden
    tar -xzf /tmp/garden-app-update.tar.gz

    # Przywróć .env
    cp /tmp/.env.backup /var/www/garden/backend/.env

    # Zainstaluj zależności
    cd backend && npm install --production
    cd ../frontend && npm install && npm run build

    # Restart
    pm2 restart garden-backend
EOF

# 4. Cleanup
rm garden-app-update.tar.gz
```

---

## 📊 Monitoring

### Podstawowy monitoring z PM2

```bash
# Status
ssh root@8.209.82.14 'pm2 status'

# Monitor (live CPU/RAM)
ssh root@8.209.82.14 'pm2 monit'

# Informacje o aplikacji
ssh root@8.209.82.14 'pm2 show garden-backend'
```

### Zaawansowany monitoring (opcjonalnie)

**PM2 Plus (darmowy dla 1 serwera):**
```bash
ssh root@8.209.82.14
pm2 plus
# Postępuj zgodnie z instrukcjami
```

Web dashboard: https://app.pm2.io

---

## 🗄️ Backup i Restore

### Backup

```bash
ssh root@8.209.82.14 << 'EOF'
    BACKUP_DIR="/root/garden-backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p $BACKUP_DIR

    # Backup bazy danych
    cp /var/www/garden/backend/garden.db $BACKUP_DIR/

    # Backup uploadów (zdjęcia)
    tar -czf $BACKUP_DIR/uploads.tar.gz /var/www/garden/backend/uploads/

    # Backup .env
    cp /var/www/garden/backend/.env $BACKUP_DIR/

    echo "Backup zapisany w: $BACKUP_DIR"
EOF
```

### Automatyczny backup (cron)

```bash
ssh root@8.209.82.14

# Edytuj crontab
crontab -e

# Dodaj (backup codziennie o 2:00)
0 2 * * * /root/backup-garden.sh
```

Stwórz skrypt `/root/backup-garden.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/root/garden-backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
cp /var/www/garden/backend/garden.db $BACKUP_DIR/
tar -czf $BACKUP_DIR/uploads.tar.gz /var/www/garden/backend/uploads/
cp /var/www/garden/backend/.env $BACKUP_DIR/

# Usuń backupy starsze niż 30 dni
find /root/garden-backups -type d -mtime +30 -exec rm -rf {} \;
```

Nadaj uprawnienia:
```bash
chmod +x /root/backup-garden.sh
```

### Restore

```bash
ssh root@8.209.82.14

# Zatrzymaj aplikację
pm2 stop garden-backend

# Przywróć bazę danych
cp /root/garden-backups/YYYYMMDD_HHMMSS/garden.db /var/www/garden/backend/

# Przywróć uploads
tar -xzf /root/garden-backups/YYYYMMDD_HHMMSS/uploads.tar.gz -C /

# Uruchom aplikację
pm2 start garden-backend
```

---

## 🌐 Konfiguracja Domeny

### Krok 1: Ustaw DNS

W panelu zarządzania domeną (np. OVH, nazwa.pl):

```
Typ: A
Host: @
Wartość: 8.209.82.14
TTL: 3600
```

Dla subdomeny (np. `garden.twojadomena.com`):
```
Typ: A
Host: garden
Wartość: 8.209.82.14
TTL: 3600
```

### Krok 2: Poczekaj na propagację DNS

```bash
# Sprawdź czy domena wskazuje na serwer
nslookup twojadomena.com

# lub
dig twojadomena.com
```

Propagacja może zająć 5 minut - 48 godzin.

### Krok 3: Zaktualizuj konfigurację Nginx

```bash
ssh root@8.209.82.14
nano /etc/nginx/sites-available/garden-app
```

Zmień `server_name` na swoją domenę:
```nginx
server_name twojadomena.com;
```

Restart Nginx:
```bash
systemctl restart nginx
```

### Krok 4: Skonfiguruj SSL (zalecane)

```bash
certbot --nginx -d twojadomena.com
```

---

## ❓ FAQ

### Q: Czy mogę zainstalować Garden App obok WordPress?
**A:** Tak! Skrypt automatycznie wykryje WordPress i zainstaluje Garden App w osobnym folderze (`/var/www/garden`). Wybierz opcję "subdomena" lub "ścieżka" podczas instalacji.

### Q: Ile RAM potrzebuje aplikacja?
**A:** Minimum 512MB dla backendu. Zalecane 1GB+ dla komfortu.

### Q: Czy aplikacja będzie działać po restarcie serwera?
**A:** Tak! PM2 automatycznie uruchomi aplikację po restarcie systemu.

### Q: Jak zmienić port aplikacji?
**A:** Edytuj `PORT` w `/var/www/garden/backend/.env` i zaktualizuj `proxy_pass` w konfiguracji Nginx.

### Q: Czy mogę używać IP zamiast domeny?
**A:** Tak! Aplikacja zadziała na `http://8.209.82.14`. Jednak dla HTTPS (SSL) potrzebujesz domeny.

### Q: Co jeśli mam już Nginx z innymi stronami?
**A:** Skrypt automatycznie wykryje istniejące konfiguracje i zainstaluje Garden App bez zakłóceń. Wybierz opcję instalacji w ścieżce `/garden` lub na subdomenie.

### Q: Jak usunąć aplikację?
**A:**
```bash
ssh root@8.209.82.14
pm2 delete garden-backend
pm2 save
rm -rf /var/www/garden
rm /etc/nginx/sites-enabled/garden-app
rm /etc/nginx/sites-available/garden-app
systemctl restart nginx
```

---

## 🆘 Pomoc

Jeśli napotkasz problemy:

1. **Sprawdź logi backendu:**
   ```bash
   ssh root@8.209.82.14 'pm2 logs garden-backend'
   ```

2. **Sprawdź logi Nginx:**
   ```bash
   ssh root@8.209.82.14 'tail -100 /var/log/nginx/error.log'
   ```

3. **Sprawdź status usług:**
   ```bash
   ssh root@8.209.82.14 'systemctl status nginx'
   ssh root@8.209.82.14 'pm2 status'
   ```

4. **Uruchom ponownie skrypt instalacyjny** - jest idempotentny (może być uruchamiany wielokrotnie).

---

## 📚 Dodatkowe Zasoby

- **QUICK_START.md** - Lokalny development
- **OPENWEATHER_SETUP.md** - Konfiguracja API pogody
- **TODO.md** - Lista funkcji i zadań
- **RESEARCH_RECOMMENDATIONS.md** - Szczegółowe wytyczne

---

**Sukces!** 🌱

Masz pytania? Sprawdź logi lub uruchom skrypt ponownie.
