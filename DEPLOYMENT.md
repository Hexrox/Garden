# Deployment Garden App na VPS Ubuntu

## Automatyczny Deployment

### Wymagania Lokalne

- Linux/macOS z bash
- `sshpass` (zostanie zainstalowany automatycznie jeśli brakuje)
- Dostęp do serwera VPS przez SSH

### Szybki Start

1. **Uruchom skrypt deployment**:
```bash
chmod +x deploy-to-vps.sh
./deploy-to-vps.sh
```

2. **Podaj informacje o serwerze** (skrypt zapyta):
   - Adres IP lub domena VPS
   - Użytkownik SSH (domyślnie `root`)
   - Hasło SSH
   - Port SSH (domyślnie `22`)
   - Domena dla aplikacji (opcjonalnie)
   - Nazwa folderu aplikacji (domyślnie `garden-app`)
   - Port backendu (domyślnie `3001`)
   - Czy skonfigurować SSL (t/n)

3. **Poczekaj na deployment** (5-15 minut zależnie od prędkości VPS)

### Co Robi Skrypt?

1. ✅ **Testuje połączenie SSH**
2. ✅ **Instaluje wymagane pakiety**:
   - nginx (serwer web)
   - Node.js 20.x
   - PM2 (process manager)
   - git
3. ✅ **Kopiuje aplikację na serwer**
4. ✅ **Konfiguruje backend**:
   - Instaluje zależności npm
   - Generuje silny JWT_SECRET
   - Tworzy folder uploads
5. ✅ **Buduje frontend**:
   - Instaluje zależności
   - Wykonuje `npm run build`
   - Kopiuje do `/var/www/{folder}/public`
6. ✅ **Uruchamia backend z PM2**:
   - Process manager z auto-restartem
   - Autostart po reboot serwera
7. ✅ **Konfiguruje nginx**:
   - Sprawdza istniejące konfiguracje
   - Dodaje nową konfigurację obok istniejących
   - Reverse proxy dla API
   - Obsługa static files
8. ✅ **Opcjonalnie: SSL z Let's Encrypt**
9. ✅ **Konfiguruje firewall (UFW)**

---

## Przykład Użycia

```bash
$ ./deploy-to-vps.sh

╔═══════════════════════════════════════════════════════╗
║           🌱 GARDEN APP - VPS DEPLOYMENT 🌱           ║
╚═══════════════════════════════════════════════════════╝

========================================
KONFIGURACJA SERWERA VPS
========================================

Adres IP lub domena VPS: 123.45.67.89
Użytkownik SSH (domyślnie: root): root
Hasło SSH: ********
Port SSH (domyślnie: 22): 22
Domena dla aplikacji (opcjonalnie): garden.example.com
Nazwa folderu aplikacji (domyślnie: garden-app): garden-app
Port backendu (domyślnie: 3001): 3001
Skonfigurować SSL z Let's Encrypt? (t/n, domyślnie: n): t
Email dla certyfikatu SSL: admin@example.com

ℹ Podsumowanie konfiguracji:
  Serwer: root@123.45.67.89:22
  Folder: /var/www/garden-app
  Domena: garden.example.com
  Backend port: 3001
  SSL: t

Czy kontynuować deployment? (t/n): t

[...deployment w toku...]

🎉 DEPLOYMENT ZAKOŃCZONY POMYŚLNIE!
```

---

## Po Deployment

### Dostęp do Aplikacji

- **Frontend**: `http://your-domain.com` lub `http://your-ip`
- **Backend API**: `http://your-domain.com/api` lub `http://your-ip/api`

### Zarządzanie Backendem (PM2)

```bash
# Połącz się z VPS
ssh root@your-vps-ip

# Sprawdź status
pm2 status

# Zobacz logi (live)
pm2 logs garden-app-backend

# Zobacz logi (ostatnie 100 linii)
pm2 logs garden-app-backend --lines 100

# Restart aplikacji
pm2 restart garden-app-backend

# Stop aplikacji
pm2 stop garden-app-backend

# Start aplikacji
pm2 start garden-app-backend

# Restart całego PM2
pm2 restart all
```

### Zarządzanie Nginx

```bash
# Status nginx
systemctl status nginx

# Restart nginx
systemctl restart nginx

# Reload konfiguracji (bez downtime)
systemctl reload nginx

# Test konfiguracji
nginx -t

# Zobacz logi
tail -f /var/log/nginx/garden-app-*-error.log
tail -f /var/log/nginx/garden-app-*-access.log
```

### Aktualizacja Aplikacji

Po wprowadzeniu zmian w kodzie:

```bash
# 1. Uruchom ponownie skrypt deployment
./deploy-to-vps.sh

# LUB ręcznie:

# 2. Połącz się z VPS
ssh root@your-vps-ip

# 3. Przejdź do folderu aplikacji
cd /var/www/garden-app/garden-app

# 4. Pull zmian z git (jeśli używasz git)
git pull origin main

# 5. Backend - zainstaluj nowe zależności (jeśli były)
cd backend
npm install --production
pm2 restart garden-app-backend

# 6. Frontend - rebuild
cd ../frontend
npm install
npm run build
cp -r build/* /var/www/garden-app/public/

# 7. Restart nginx
systemctl reload nginx
```

---

## Struktura na Serwerze

```
/var/www/garden-app/
├── garden-app/
│   ├── backend/
│   │   ├── index.js
│   │   ├── .env               # Konfiguracja (JWT_SECRET tutaj!)
│   │   ├── uploads/           # Przesłane zdjęcia
│   │   ├── garden.db          # Baza danych SQLite
│   │   └── node_modules/
│   └── frontend/
│       ├── build/             # Zbudowana aplikacja
│       └── node_modules/
└── public/                    # Serwowane przez nginx
    ├── index.html
    ├── static/
    └── ...

/etc/nginx/
├── sites-available/
│   └── garden-app-garden-app  # Konfiguracja nginx
└── sites-enabled/
    └── garden-app-garden-app  # Symlink do powyższego

/var/log/nginx/
├── garden-app-garden-app-access.log
└── garden-app-garden-app-error.log
```

---

## Bezpieczeństwo

### JWT Secret
Skrypt automatycznie generuje silny 64-bajtowy JWT_SECRET i zapisuje go w:
```
/var/www/garden-app/garden-app/backend/.env
```

**WAŻNE**: Nigdy nie commituj tego pliku do git!

### Firewall (UFW)
Skrypt automatycznie konfiguruje firewall:
- Port 22 (SSH) ✅
- Port 80 (HTTP) ✅
- Port 443 (HTTPS) ✅
- Port 3001 (Backend) ❌ (blokowany, dostęp tylko przez nginx)

### SSL/TLS
Jeśli wybrałeś SSL podczas deployment:
- Certyfikat automatycznie odnowi się co 90 dni
- Sprawdź status: `certbot certificates`
- Test odnowienia: `certbot renew --dry-run`

---

## Baza Danych

### Backup Bazy Danych

```bash
# Połącz się z VPS
ssh root@your-vps-ip

# Backup bazy
cp /var/www/garden-app/garden-app/backend/garden.db \
   /var/www/garden-app/garden-app/backend/garden.db.backup-$(date +%Y%m%d)

# Backup z kompresją
tar -czf garden-db-backup-$(date +%Y%m%d).tar.gz \
   -C /var/www/garden-app/garden-app/backend garden.db

# Pobierz backup lokalnie
scp root@your-vps-ip:/root/garden-db-backup-*.tar.gz ./
```

### Restore Bazy Danych

```bash
# Zatrzymaj backend
pm2 stop garden-app-backend

# Restore
cp garden.db.backup-20251024 garden.db

# Uruchom backend
pm2 start garden-app-backend
```

### Automatyczny Backup (Cron)

```bash
# Edytuj crontab
crontab -e

# Dodaj linię (backup codziennie o 2:00 AM):
0 2 * * * tar -czf /root/backups/garden-db-$(date +\%Y\%m\%d).tar.gz -C /var/www/garden-app/garden-app/backend garden.db && find /root/backups -name "garden-db-*.tar.gz" -mtime +30 -delete
```

---

## Troubleshooting

### Problem: Aplikacja nie działa

```bash
# 1. Sprawdź status PM2
pm2 status

# 2. Zobacz logi backendu
pm2 logs garden-app-backend --err

# 3. Sprawdź nginx
systemctl status nginx
nginx -t

# 4. Zobacz logi nginx
tail -100 /var/log/nginx/garden-app-*-error.log

# 5. Sprawdź czy port 3001 jest zajęty
netstat -tlnp | grep 3001
```

### Problem: 502 Bad Gateway

Backend nie działa lub nginx nie może się połączyć:

```bash
# Sprawdź czy backend działa
pm2 status

# Restart backendu
pm2 restart garden-app-backend

# Sprawdź logi
pm2 logs garden-app-backend --lines 50
```

### Problem: 403 Forbidden

Uprawnienia do plików:

```bash
# Napraw uprawnienia
chown -R www-data:www-data /var/www/garden-app/public
chmod -R 755 /var/www/garden-app/public

# Restart nginx
systemctl restart nginx
```

### Problem: Zdjęcia się nie ładują

```bash
# Sprawdź folder uploads
ls -la /var/www/garden-app/garden-app/backend/uploads

# Napraw uprawnienia
chmod 755 /var/www/garden-app/garden-app/backend/uploads
chown -R root:root /var/www/garden-app/garden-app/backend/uploads
```

### Problem: SSL nie działa

```bash
# Sprawdź certyfikat
certbot certificates

# Odnów ręcznie
certbot renew --force-renewal

# Restart nginx
systemctl restart nginx
```

---

## Wielokrotne Aplikacje na Jednym VPS

Skrypt automatycznie wykrywa istniejące konfiguracje nginx i dodaje nową obok nich.

### Deployment Drugiej Instancji

```bash
./deploy-to-vps.sh

# Podaj inne wartości:
# - Nazwa folderu: garden-app-2
# - Domena: app2.example.com
# - Port backendu: 3002
```

Skrypt utworzy:
- `/var/www/garden-app-2/` - druga instancja
- `/etc/nginx/sites-available/garden-app-garden-app-2` - osobna konfiguracja nginx
- `garden-app-backend-2` - osobny proces PM2

---

## Monitoring

### Podstawowy Monitoring z PM2

```bash
# Metryki w czasie rzeczywistym
pm2 monit

# Lista procesów z użyciem CPU/RAM
pm2 list
```

### Zaawansowany Monitoring (opcjonalnie)

Zainstaluj PM2 Plus dla monitoringu w chmurze:

```bash
pm2 plus
# Postępuj zgodnie z instrukcjami
```

---

## Performance

### Optymalizacja Nginx

Edytuj `/etc/nginx/nginx.conf`:

```nginx
# Worker processes (1 per CPU core)
worker_processes auto;

# Max connections
events {
    worker_connections 1024;
}

# Gzip compression
gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript;
```

### Optymalizacja PM2

```bash
# Cluster mode (multiple instances)
pm2 start index.js -i max --name garden-app-backend

# Watch mode (auto-restart on file changes)
pm2 start index.js --watch --name garden-app-backend
```

---

## Koszty VPS

Minimalne wymagania:
- **RAM**: 1GB (zalecane 2GB)
- **CPU**: 1 vCore
- **Dysk**: 10GB SSD
- **Transfer**: 1TB/mc

Rekomendowani dostawcy:
- **DigitalOcean**: $6/mc (1GB RAM, 1 vCore, 25GB SSD)
- **Hetzner**: €4.5/mc (2GB RAM, 1 vCore, 40GB SSD) - TAŃSZY
- **Vultr**: $6/mc (1GB RAM, 1 vCore, 25GB SSD)
- **Linode**: $5/mc (1GB RAM, 1 vCore, 25GB SSD)

---

## Support

Pytania? Problemy?
1. Sprawdź logi: `pm2 logs garden-app-backend`
2. Sprawdź nginx: `tail -100 /var/log/nginx/garden-app-*-error.log`
3. Utwórz issue na GitHub

---

**Dokument zaktualizowany**: 2025-10-24
**Wersja skryptu**: 1.0
