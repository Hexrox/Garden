# Garden App - Deployment Guide

## 🎯 WAŻNE - Lokalizacje na serwerze produkcyjnym

### Frontend
- **Nginx serwuje z**: `/var/www/garden-app/`
- **Wgrywaj ZAWSZE do**: `/var/www/garden-app/`
- **Komenda rsync**:
  ```bash
  cd /home/hexan/claude/garden/garden-app/frontend
  REACT_APP_API_URL=https://gardenapp.pl GENERATE_SOURCEMAP=false npm run build
  rsync -avz --delete build/ root@8.209.82.14:/var/www/garden-app/
  ```

### Backend
- **Lokalizacja**: `/root/garden/garden-app/backend/`
- **PM2 process**: `garden-app`
- **Restart po zmianach**:
  ```bash
  ssh root@8.209.82.14 "pm2 restart garden-app"
  ```

### Uploads (zdjęcia użytkowników)
- **Lokalizacja**: `/var/www/garden-uploads/`
- **Nginx alias**: `/uploads/` → `/var/www/garden-uploads/`

### Baza danych
- **Lokalizacja**: `/root/garden/garden-app/backend/garden.db`
- **Backup przed migracją**: `cp garden.db garden.db.backup`

## 📋 Checklist przed deploymentem

1. ✅ Backend - sprawdź czy pliki są identyczne z lokalnym repo:
   ```bash
   # Porównaj md5sum kluczowych plików
   md5sum backend/routes/auth.js backend/index.js
   ssh root@8.209.82.14 "md5sum /root/garden/garden-app/backend/routes/auth.js /root/garden/garden-app/backend/index.js"
   ```

2. ✅ Frontend - zbuduj z poprawnym API URL:
   ```bash
   cd frontend
   REACT_APP_API_URL=https://gardenapp.pl GENERATE_SOURCEMAP=false npm run build
   ```

3. ✅ Frontend - wgraj do **WŁAŚCIWEGO** katalogu:
   ```bash
   rsync -avz --delete build/ root@8.209.82.14:/var/www/garden-app/
   ```

4. ✅ Weryfikacja - sprawdź timestamp i md5sum po wgraniu:
   ```bash
   ssh root@8.209.82.14 "ls -lh /var/www/garden-app/static/js/main*.js && md5sum /var/www/garden-app/static/js/main*.js"
   ```

5. ✅ Test - sprawdź czy strona działa:
   ```bash
   curl -I https://gardenapp.pl
   curl -I https://gardenapp.pl/pomoc
   ```

## 🔧 Nginx Configuration

- **Config file**: `/etc/nginx/sites-available/garden-app-garden-app`
- **Enabled**: `/etc/nginx/sites-enabled/garden-app-garden-app` (symlink)
- **Test config**: `nginx -t`
- **Reload**: `systemctl reload nginx`

## 🗑️ Usuwanie starych deployment'ów

**NIE UŻYWAJ** tych katalogów (stare, do usunięcia):
- `/var/www/garden` (stary)
- `/var/www/garden-frontend` (stary)
- `/var/www/gardenapp.pl` (błędny - miało być garden-app)

## 📊 Monitoring

- **PM2 status**: `ssh root@8.209.82.14 "pm2 status"`
- **PM2 logs**: `ssh root@8.209.82.14 "pm2 logs garden-app --lines 50"`
- **Nginx logs**: `ssh root@8.209.82.14 "tail -f /var/log/nginx/error.log"`

## 🔑 Dane dostępowe

- **Serwer**: `root@8.209.82.14`
- **Domena**: `https://gardenapp.pl`
- **API**: `https://gardenapp.pl/api`
- **Backend port**: `localhost:5000` (proxy przez nginx)
