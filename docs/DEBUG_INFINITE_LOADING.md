# 🔍 Debug: Nieskończone Ładowanie na Produkcji

## Problem

Aplikacja Garden App na produkcji (gardenapp.pl/www.gardenapp.pl) pokazuje wieczne "Ładowanie..." i nigdy się nie ładuje.

## Diagnoza

### Jak działa AuthContext

W `frontend/src/context/AuthContext.js` (linie 19-26) jest **zabezpieczenie timeout**:
```javascript
const fallbackTimeout = setTimeout(() => {
  if (loading) {
    console.warn('Auth loading timeout - forcing loading to false');
    setLoading(false);
  }
}, 3000);
```

**To znaczy, że po 3 sekundach aplikacja powinna przestać pokazywać "Ładowanie..." i przekierować na stronę login.**

Jeśli to się NIE dzieje, znaczy że:
1. **JavaScript się w ogóle nie załadował** - frontend build jest pusty/uszkodzony
2. **Axios żądanie do API zawiesza się** - blokuje cały context
3. **Browser/Network problem** - CORS, firewall, itp.

---

## Krok 1: Sprawdź Konsolę Przeglądarki

Otwórz stronę `https://gardenapp.pl` i naciśnij **F12** (DevTools):

### A. Zakładka "Console" - Szukaj błędów:

**Typowe błędy:**

❌ **`Failed to load resource: net::ERR_CONNECTION_REFUSED`**
```
GET https://gardenapp.pl/api/auth/... net::ERR_CONNECTION_REFUSED
```
→ **Problem:** Backend nie działa lub nginx nie przekierowuje `/api`

❌ **`CORS policy: No 'Access-Control-Allow-Origin' header`**
```
Access to XMLHttpRequest at 'https://gardenapp.pl/api/...' has been blocked by CORS policy
```
→ **Problem:** Backend CORS nie jest skonfigurowany dla domeny produkcyjnej

❌ **`404 Not Found`** na `/api/...`
```
GET https://gardenapp.pl/api/auth/login 404 (Not Found)
```
→ **Problem:** Nginx nie przekierowuje `/api` do backendu

❌ **`Loading chunk failed`** lub błędy z JS
```
ChunkLoadError: Loading chunk 2 failed.
```
→ **Problem:** Frontend build jest uszkodzony lub niepełny

### B. Zakładka "Network" - Sprawdź requesty:

1. **Filtruj po: XHR** (to są requesty do API)
2. Szukaj requestów do `/api/...`
3. Sprawdź status:
   - **200 OK** ✅ - API działa
   - **404 Not Found** ❌ - Nginx nie przekierowuje
   - **502 Bad Gateway** ❌ - Backend nie odpowiada
   - **Pending (wisi)** ❌ - Timeout, backend nie działa

---

## Krok 2: Sprawdź Backend na Serwerze

Zaloguj się na serwer i sprawdź czy backend działa:

```bash
ssh root@your-server-ip

# Sprawdź status PM2
pm2 status

# Powinieneś zobaczyć:
# ┌──────────────────┬────┬─────────┬──────┬──────────┐
# │ App name         │ id │ status  │ ↺    │ cpu      │
# ├──────────────────┼────┼─────────┼──────┼──────────┤
# │ garden-backend   │ 0  │ online  │ 0    │ 0.2%     │
# └──────────────────┴────┴─────────┴──────┴──────────┘
```

### Jeśli backend ma status "errored" lub "stopped":

```bash
# Zobacz logi błędów
pm2 logs garden-backend --err

# Spróbuj uruchomić ponownie
pm2 restart garden-backend
```

### Sprawdź czy backend odpowiada lokalnie:

```bash
curl http://localhost:3001/api/health

# Powinno zwrócić:
# {"status":"ok","message":"Garden App API v2.0","timestamp":"..."}
```

❌ **Jeśli nie działa** - sprawdź logi:
```bash
pm2 logs garden-backend --lines 50
```

---

## Krok 3: Sprawdź Nginx

### Sprawdź konfigurację Nginx:

```bash
cat /etc/nginx/sites-available/garden-app

# Upewnij się że masz sekcję:
# location /api {
#     proxy_pass http://localhost:3001;
#     ...
# }
```

### Sprawdź czy nginx działa:

```bash
systemctl status nginx

# Jeśli nie działa:
systemctl restart nginx
```

### Sprawdź czy nginx przekierowuje API:

```bash
# Z serwera - test lokalny
curl -I http://localhost/api/health

# Powinno zwrócić 200 OK
```

### Sprawdź logi nginx:

```bash
tail -50 /var/log/nginx/error.log
tail -50 /var/log/nginx/access.log
```

---

## Krok 4: Sprawdź Zmienne Środowiskowe

### Backend `.env`:

```bash
cat /var/www/garden/backend/.env
```

**Krytyczne zmienne dla produkcji:**

```bash
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://gardenapp.pl    # ← WAŻNE! Musi być domena produkcyjna
JWT_SECRET=... (długi losowy ciąg)
```

❌ **Problem jeśli `FRONTEND_URL=http://localhost:3000`**
→ CORS będzie blokować requesty z gardenapp.pl

### Frontend - czy jest zbudowany?

```bash
ls -la /var/www/garden/frontend/build/

# Powinno być:
# - index.html
# - static/js/main.*.js
# - static/css/main.*.css
```

❌ **Jeśli folder `build/` nie istnieje:**
```bash
cd /var/www/garden/frontend
npm run build
```

---

## 🔧 Szybka Naprawa - Krok po Kroku

### Scenariusz A: Backend nie działa

```bash
# 1. Sprawdź logi
pm2 logs garden-backend --err

# 2. Jeśli brakuje .env:
cd /var/www/garden/backend
cp .env.example .env
nano .env  # Edytuj: FRONTEND_URL=https://gardenapp.pl

# 3. Uruchom ponownie
pm2 restart garden-backend
pm2 save
```

### Scenariusz B: CORS blokuje requesty

```bash
# Edytuj .env backendu
nano /var/www/garden/backend/.env

# Zmień:
FRONTEND_URL=http://localhost:3000
# NA:
FRONTEND_URL=https://gardenapp.pl

# Jeśli używasz obu domen (z www i bez):
FRONTEND_URL=https://gardenapp.pl,https://www.gardenapp.pl

# Restart backendu
pm2 restart garden-backend
```

### Scenariusz C: Nginx nie przekierowuje API

```bash
# Sprawdź konfigurację
nano /etc/nginx/sites-available/garden-app

# Powinna zawierać:
server {
    listen 80;
    server_name gardenapp.pl www.gardenapp.pl;

    # Frontend
    location / {
        root /var/www/garden/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API - MUSI BYĆ!
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        root /var/www/garden/frontend/build;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Zapisz i testuj konfigurację
nginx -t

# Jeśli OK:
systemctl restart nginx
```

### Scenariusz D: Frontend build jest pusty/uszkodzony

```bash
cd /var/www/garden/frontend

# Zainstaluj zależności
npm install

# Zbuduj frontend
npm run build

# Sprawdź czy build/ istnieje
ls -la build/

# Restart nginx (żeby wyczyścić cache)
systemctl restart nginx
```

---

## 🤖 Automatyczny Skrypt Naprawy

Zapisz jako `fix-infinite-loading.sh` i uruchom na serwerze:

```bash
#!/bin/bash

echo "🔍 Diagnozuję problem z nieskończonym ładowaniem..."

# Kolory
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

APP_PATH="/var/www/garden"
BACKEND_PORT=3001
DOMAIN="gardenapp.pl"

# Sprawdź czy backend działa
echo ""
echo "1️⃣ Sprawdzam backend..."
if pm2 list | grep -q "garden-backend.*online"; then
    echo -e "${GREEN}✓ Backend działa${NC}"
else
    echo -e "${RED}✗ Backend nie działa${NC}"
    echo "   Uruchamiam backend..."
    pm2 restart garden-backend
fi

# Sprawdź czy backend odpowiada
echo ""
echo "2️⃣ Testuję API..."
if curl -s http://localhost:$BACKEND_PORT/api/health | grep -q "ok"; then
    echo -e "${GREEN}✓ API odpowiada${NC}"
else
    echo -e "${RED}✗ API nie odpowiada${NC}"
    echo "   Sprawdź logi: pm2 logs garden-backend"
fi

# Sprawdź FRONTEND_URL w .env
echo ""
echo "3️⃣ Sprawdzam FRONTEND_URL w .env..."
if grep -q "FRONTEND_URL=https://$DOMAIN" $APP_PATH/backend/.env; then
    echo -e "${GREEN}✓ FRONTEND_URL jest poprawny${NC}"
else
    echo -e "${YELLOW}! FRONTEND_URL wymaga aktualizacji${NC}"
    read -p "   Czy zaktualizować FRONTEND_URL na https://$DOMAIN? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://$DOMAIN|" $APP_PATH/backend/.env
        echo -e "${GREEN}✓ Zaktualizowano FRONTEND_URL${NC}"
        pm2 restart garden-backend
    fi
fi

# Sprawdź nginx
echo ""
echo "4️⃣ Sprawdzam Nginx..."
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx działa${NC}"
else
    echo -e "${RED}✗ Nginx nie działa${NC}"
    systemctl start nginx
fi

# Sprawdź czy /api jest w konfiguracji
if grep -q "location /api" /etc/nginx/sites-available/garden-app; then
    echo -e "${GREEN}✓ Nginx proxy dla /api skonfigurowane${NC}"
else
    echo -e "${RED}✗ Nginx nie ma proxy dla /api${NC}"
    echo "   Musisz ręcznie dodać sekcję 'location /api' do konfiguracji Nginx"
fi

# Sprawdź frontend build
echo ""
echo "5️⃣ Sprawdzam frontend build..."
if [ -f "$APP_PATH/frontend/build/index.html" ]; then
    echo -e "${GREEN}✓ Frontend zbudowany${NC}"
else
    echo -e "${RED}✗ Brak frontendu - buduję...${NC}"
    cd $APP_PATH/frontend
    npm install
    npm run build
    echo -e "${GREEN}✓ Frontend zbudowany${NC}"
fi

# Podsumowanie
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓ Diagnostyka zakończona${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Sprawdź aplikację w przeglądarce: https://$DOMAIN"
echo "Jeśli nadal nie działa, sprawdź:"
echo "  - pm2 logs garden-backend"
echo "  - tail -50 /var/log/nginx/error.log"
echo "  - Konsolę przeglądarki (F12)"
echo ""
```

**Uruchomienie:**
```bash
chmod +x fix-infinite-loading.sh
./fix-infinite-loading.sh
```

---

## 📊 Checklist Diagnostyczna

Zaznacz co już sprawdziłeś:

- [ ] Konsola przeglądarki (F12) - czy są błędy?
- [ ] Network tab - czy requesty do `/api` wracają 200 OK?
- [ ] `pm2 status` - czy backend ma status "online"?
- [ ] `curl http://localhost:3001/api/health` - czy zwraca OK?
- [ ] `cat /var/www/garden/backend/.env` - czy `FRONTEND_URL` to domena produkcyjna?
- [ ] `nginx -t` - czy konfiguracja nginx jest poprawna?
- [ ] `/etc/nginx/sites-available/garden-app` - czy ma `location /api`?
- [ ] `ls /var/www/garden/frontend/build/` - czy frontend jest zbudowany?
- [ ] Logi backendu: `pm2 logs garden-backend`
- [ ] Logi nginx: `tail /var/log/nginx/error.log`

---

## 🆘 Jeśli Nic Nie Pomaga

### Ostateczna naprawa - rebuild wszystkiego:

```bash
# Na serwerze
cd /var/www/garden

# Backup bazy danych
cp backend/garden.db backend/garden.db.backup.$(date +%Y%m%d_%H%M%S)

# Backup .env
cp backend/.env /tmp/garden.env.backup

# Przebuduj backend
cd backend
npm install --production
pm2 restart garden-backend

# Przebuduj frontend
cd ../frontend
rm -rf build node_modules
npm install
npm run build

# Przywróć .env jeśli został nadpisany
cp /tmp/garden.env.backup ../backend/.env

# Restart wszystkiego
pm2 restart garden-backend
systemctl restart nginx

# Sprawdź logi
pm2 logs garden-backend --lines 20
```

---

## 📞 Pomoc Techniczna

Jeśli problem dalej występuje, zbierz te informacje:

```bash
# 1. Status wszystkich usług
echo "=== PM2 Status ==="
pm2 status

echo "=== Backend Health ==="
curl http://localhost:3001/api/health

echo "=== Nginx Status ==="
systemctl status nginx

echo "=== Frontend Build ==="
ls -lh /var/www/garden/frontend/build/

echo "=== Backend Env ==="
cat /var/www/garden/backend/.env | grep -v JWT_SECRET | grep -v PASSWORD

echo "=== PM2 Logs (last 30 lines) ==="
pm2 logs garden-backend --lines 30 --nostream

echo "=== Nginx Error Log ==="
tail -30 /var/log/nginx/error.log
```

I prześlij output do analizy.

---

**Status:** 🔍 Dokument diagnostyczny gotowy!
**Data:** 2025-11-24
