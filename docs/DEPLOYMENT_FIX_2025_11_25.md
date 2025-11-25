# Naprawa Wdrożenia Produkcyjnego - 2025-11-25

## Problem
Aplikacja na produkcji (gardenapp.pl) miała problem z nieskończonym ładowaniem. Po analizie okazało się, że:
1. Nginx był skonfigurowany ze złymi ścieżkami do plików
2. Brakowało konfiguracji SSL/HTTPS
3. Brakowało klucza API do OpenWeather

## Rozwiązanie

### 1. Naprawiono konfigurację Nginx

**Poprzednia konfiguracja (błędna):**
```nginx
location / {
    root /var/www/garden/frontend/build;  # ❌ Zła ścieżka
    ...
}
```

**Nowa konfiguracja (poprawna):**
```nginx
server {
    listen 80;
    server_name gardenapp.pl www.gardenapp.pl 8.209.82.14;
    # Przekierowanie HTTP → HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name gardenapp.pl www.gardenapp.pl;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/gardenapp.pl/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gardenapp.pl/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Frontend (React build) - POPRAWNA ŚCIEŻKA
    location / {
        root /root/garden/garden-app/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploads - POPRAWNA ŚCIEŻKA
    location /uploads {
        alias /root/garden/garden-app/backend/uploads;
        expires 1y;
        add_header Cache-Control "public";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

### 2. Dodano klucz API OpenWeather

Dodano do `/root/garden/garden-app/backend/.env`:
```bash
OPENWEATHER_API_KEY=62bd765dbccb8a5a26bb1208c34de809
```

### 3. Zrestartowano serwisy

```bash
# Przeładowano nginx z nową konfiguracją
systemctl reload nginx

# Zrestartowano backend z nowym kluczem API
pm2 restart garden-app
```

## Weryfikacja

### Status Serwisów
```bash
# Backend
pm2 status
# ✅ garden-app: online

# Nginx
systemctl status nginx
# ✅ active (running)
```

### Testy API
```bash
# Health check
curl https://gardenapp.pl/api/health
# ✅ {"status":"ok","message":"Garden App API v2.0","timestamp":"..."}

# HTTP → HTTPS redirect
curl -I http://gardenapp.pl
# ✅ HTTP/1.1 301 Moved Permanently
# ✅ Location: https://gardenapp.pl/

# HTTPS
curl -I https://gardenapp.pl
# ✅ HTTP/2 200
```

### Konfiguracja Backendu
```bash
cat /root/garden/garden-app/backend/.env | grep -v JWT_SECRET
```
```
PORT=3001
JWT_EXPIRES_IN=7d
NODE_ENV=production
FRONTEND_URL=https://gardenapp.pl
OPENWEATHER_API_KEY=62bd765dbccb8a5a26bb1208c34de809
```

## Podsumowanie Zmian

### Pliki Zmodyfikowane
1. `/etc/nginx/sites-available/garden-app` - poprawiono ścieżki i dodano SSL
2. `/root/garden/garden-app/backend/.env` - dodano OPENWEATHER_API_KEY

### Backup
Utworzono backup starej konfiguracji:
```bash
/etc/nginx/sites-available/garden-app.backup.20251125_*
```

## Status Końcowy

✅ **Aplikacja działa poprawnie na produkcji:**
- ✅ HTTPS z przekierowaniem z HTTP
- ✅ Frontend ładuje się poprawnie
- ✅ Backend API odpowiada
- ✅ CORS skonfigurowany dla gardenapp.pl
- ✅ Klucz API OpenWeather dodany
- ✅ Nginx poprawnie serwuje pliki z właściwej lokalizacji

## Następne Kroki

1. ✅ Aplikacja działa - można testować funkcjonalność
2. 🔄 Monitorować logi pod kątem błędów:
   ```bash
   pm2 logs garden-app
   tail -f /var/log/nginx/error.log
   ```
3. 🔄 Rozważyć automatyczne odnawianie certyfikatu SSL (certbot)

---

**Data naprawy:** 2025-11-25
**Czas naprawy:** ~30 minut
**Status:** ✅ Zakończone pomyślnie
