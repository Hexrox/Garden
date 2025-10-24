#!/bin/bash

#############################################
# Garden App - VPS Deployment Script
# Automatyczny deployment na Ubuntu VPS z nginx
#############################################

set -e  # Exit on error

# Kolory dla outputu
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funkcje pomocnicze
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# Sprawdzenie czy sshpass jest zainstalowany
check_sshpass() {
    if ! command -v sshpass &> /dev/null; then
        print_error "sshpass nie jest zainstalowany"
        print_info "Instaluję sshpass..."

        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo apt-get update && sudo apt-get install -y sshpass
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            brew install hudochenkov/sshpass/sshpass
        else
            print_error "Nieobsługiwany system operacyjny"
            exit 1
        fi

        print_success "sshpass zainstalowany"
    fi
}

# Wykrywanie trybu deployment (fresh install vs update)
detect_deployment_mode() {
    print_header "WYBÓR TRYBU DEPLOYMENT"

    echo "1) Nowa instalacja (fresh install)"
    echo "2) Aktualizacja istniejącej instalacji (update)"
    echo ""
    read -p "Wybierz tryb (1/2): " DEPLOY_MODE

    if [[ "$DEPLOY_MODE" == "2" ]]; then
        DEPLOYMENT_MODE="update"
        print_info "Tryb: AKTUALIZACJA"
    else
        DEPLOYMENT_MODE="fresh"
        print_info "Tryb: NOWA INSTALACJA"
    fi
}

# Zbieranie informacji o serwerze
collect_server_info() {
    print_header "KONFIGURACJA SERWERA VPS"

    read -p "Adres IP lub domena VPS: " VPS_HOST
    read -p "Użytkownik SSH (domyślnie: root): " VPS_USER
    VPS_USER=${VPS_USER:-root}

    read -sp "Hasło SSH: " VPS_PASSWORD
    echo ""

    read -p "Port SSH (domyślnie: 22): " VPS_PORT
    VPS_PORT=${VPS_PORT:-22}

    if [[ "$DEPLOYMENT_MODE" == "fresh" ]]; then
        read -p "Domena dla aplikacji (opcjonalnie, naciśnij Enter aby pominąć): " APP_DOMAIN

        read -p "Nazwa folderu aplikacji (domyślnie: garden-app): " APP_FOLDER
        APP_FOLDER=${APP_FOLDER:-garden-app}

        read -p "Port backendu (domyślnie: 3001): " BACKEND_PORT
        BACKEND_PORT=${BACKEND_PORT:-3001}

        read -p "Skonfigurować SSL z Let's Encrypt? (t/n, domyślnie: n): " SETUP_SSL
        SETUP_SSL=${SETUP_SSL:-n}

        if [[ "$SETUP_SSL" == "t" || "$SETUP_SSL" == "T" ]]; then
            if [[ -z "$APP_DOMAIN" ]]; then
                print_error "SSL wymaga domeny. Podaj domenę:"
                read -p "Domena: " APP_DOMAIN
            fi
            read -p "Email dla certyfikatu SSL: " SSL_EMAIL
        fi
    else
        # Update mode - ask for existing installation folder
        read -p "Nazwa folderu istniejącej aplikacji (domyślnie: garden-app): " APP_FOLDER
        APP_FOLDER=${APP_FOLDER:-garden-app}
    fi

    echo ""
    print_info "Podsumowanie konfiguracji:"
    echo "  Tryb: $DEPLOYMENT_MODE"
    echo "  Serwer: $VPS_USER@$VPS_HOST:$VPS_PORT"
    echo "  Folder: /var/www/$APP_FOLDER"
    if [[ "$DEPLOYMENT_MODE" == "fresh" ]]; then
        echo "  Domena: ${APP_DOMAIN:-brak (używa IP)}"
        echo "  Backend port: $BACKEND_PORT"
        echo "  SSL: $SETUP_SSL"
    fi
    echo ""

    read -p "Czy kontynuować? (t/n): " CONFIRM
    if [[ "$CONFIRM" != "t" && "$CONFIRM" != "T" ]]; then
        print_error "Deployment anulowany"
        exit 0
    fi
}

# Testowanie połączenia SSH
test_ssh_connection() {
    print_header "TESTOWANIE POŁĄCZENIA SSH"

    if sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "echo 'OK'" &> /dev/null; then
        print_success "Połączenie SSH działa"
    else
        print_error "Nie można połączyć się przez SSH"
        print_info "Sprawdź: adres IP, port, użytkownik, hasło"
        exit 1
    fi
}

# Wykonanie komendy na serwerze
ssh_exec() {
    sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "$1"
}

# Kopiowanie plików na serwer
scp_copy() {
    sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no -P "$VPS_PORT" -r "$1" "$VPS_USER@$VPS_HOST:$2"
}

# Sprawdzenie czy aplikacja już istnieje
check_existing_installation() {
    if [[ "$DEPLOYMENT_MODE" != "update" ]]; then
        return
    fi

    print_header "SPRAWDZANIE ISTNIEJĄCEJ INSTALACJI"

    if ssh_exec "test -d /var/www/$APP_FOLDER/garden-app"; then
        print_success "Znaleziono instalację w /var/www/$APP_FOLDER"

        # Odczytaj konfigurację z istniejącego .env
        if ssh_exec "test -f /var/www/$APP_FOLDER/garden-app/backend/.env"; then
            BACKEND_PORT=$(ssh_exec "grep '^PORT=' /var/www/$APP_FOLDER/garden-app/backend/.env | cut -d'=' -f2" || echo "3001")
            print_info "Wykryty port backendu: $BACKEND_PORT"
        else
            print_warning "Nie znaleziono pliku .env, używam domyślnego portu 3001"
            BACKEND_PORT=3001
        fi

        # Sprawdź konfigurację nginx
        CONFIG_NAME="garden-app-${APP_FOLDER}"
        if ssh_exec "test -f /etc/nginx/sites-available/$CONFIG_NAME"; then
            SERVER_NAME=$(ssh_exec "grep 'server_name' /etc/nginx/sites-available/$CONFIG_NAME | awk '{print \$2}' | sed 's/;//'" || echo "")
            if [[ -n "$SERVER_NAME" ]]; then
                APP_DOMAIN="$SERVER_NAME"
                print_info "Wykryta domena: $APP_DOMAIN"
            fi
        fi
    else
        print_error "Nie znaleziono instalacji w /var/www/$APP_FOLDER"
        print_error "Użyj trybu 'Nowa instalacja' zamiast 'Aktualizacja'"
        exit 1
    fi
}

# Backup bazy danych przed aktualizacją
backup_database() {
    if [[ "$DEPLOYMENT_MODE" != "update" ]]; then
        return
    fi

    print_header "BACKUP BAZY DANYCH"

    DB_PATH="/var/www/$APP_FOLDER/garden-app/backend/garden.db"

    if ssh_exec "test -f $DB_PATH"; then
        BACKUP_NAME="garden-db-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
        print_info "Tworzenie backupu: $BACKUP_NAME"

        ssh_exec "mkdir -p /var/www/$APP_FOLDER/backups"
        ssh_exec "tar -czf /var/www/$APP_FOLDER/backups/$BACKUP_NAME -C /var/www/$APP_FOLDER/garden-app/backend garden.db uploads/"

        print_success "Backup utworzony: /var/www/$APP_FOLDER/backups/$BACKUP_NAME"
        print_info "W razie problemów przywróć komendą:"
        echo "  tar -xzf /var/www/$APP_FOLDER/backups/$BACKUP_NAME -C /var/www/$APP_FOLDER/garden-app/backend"
    else
        print_warning "Nie znaleziono bazy danych do backupu"
    fi
}

# Aktualizacja aplikacji (zamiast pełnej instalacji)
update_application() {
    if [[ "$DEPLOYMENT_MODE" != "update" ]]; then
        return
    fi

    print_header "AKTUALIZACJA APLIKACJI"

    # Zatrzymaj backend przed aktualizacją
    print_info "Zatrzymywanie backendu..."
    ssh_exec "pm2 stop garden-app-backend" 2>/dev/null || print_warning "Backend nie był uruchomiony"

    # Zapisz stary plik .env
    print_info "Zapisywanie konfiguracji .env..."
    ssh_exec "cp /var/www/$APP_FOLDER/garden-app/backend/.env /tmp/garden-app-env-backup" 2>/dev/null || true

    # Pakowanie nowej wersji
    print_info "Pakowanie nowej wersji aplikacji..."
    cd "$(dirname "$0")"
    tar -czf /tmp/garden-app-update.tar.gz \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='*.log' \
        --exclude='garden.db' \
        --exclude='uploads/*' \
        garden-app/

    # Kopiowanie na serwer
    print_info "Przesyłanie na serwer..."
    scp_copy "/tmp/garden-app-update.tar.gz" "/tmp/"

    # Backup starych plików
    print_info "Backup starych plików aplikacji..."
    ssh_exec "tar -czf /var/www/$APP_FOLDER/backups/app-backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /var/www/$APP_FOLDER garden-app/ 2>/dev/null" || true

    # Usuń stare pliki aplikacji (zachowaj .env, garden.db, uploads)
    print_info "Usuwanie starych plików kodu..."
    ssh_exec "find /var/www/$APP_FOLDER/garden-app -mindepth 1 -maxdepth 1 ! -name 'backend' ! -name 'frontend' -exec rm -rf {} +" 2>/dev/null || true
    ssh_exec "find /var/www/$APP_FOLDER/garden-app/backend -mindepth 1 -maxdepth 1 ! -name '.env' ! -name 'garden.db' ! -name 'uploads' ! -name 'node_modules' -exec rm -rf {} +" 2>/dev/null || true
    ssh_exec "find /var/www/$APP_FOLDER/garden-app/frontend -mindepth 1 -maxdepth 1 ! -name 'node_modules' -exec rm -rf {} +" 2>/dev/null || true

    # Rozpakowywanie nowej wersji
    print_info "Rozpakowywanie nowej wersji..."
    ssh_exec "cd /var/www/$APP_FOLDER && tar -xzf /tmp/garden-app-update.tar.gz --strip-components=1"
    ssh_exec "rm /tmp/garden-app-update.tar.gz"
    rm /tmp/garden-app-update.tar.gz

    # Przywróć .env (zachowaj JWT_SECRET)
    print_info "Przywracanie konfiguracji .env..."
    ssh_exec "cp /tmp/garden-app-env-backup /var/www/$APP_FOLDER/garden-app/backend/.env" 2>/dev/null || true

    # Sprawdź czy .env ma nowe wymagane klucze (dla aktualizacji z v1 do v2)
    print_info "Sprawdzanie nowych kluczy konfiguracyjnych..."
    if ! ssh_exec "grep -q 'OPENWEATHER_API_KEY' /var/www/$APP_FOLDER/garden-app/backend/.env" 2>/dev/null; then
        print_warning "Dodaję brakujący klucz OPENWEATHER_API_KEY do .env"
        ssh_exec "cat >> /var/www/$APP_FOLDER/garden-app/backend/.env << 'ENVEOF'

# OpenWeatherMap API Key (wymagane dla funkcji pogody - dodane w v2.1)
# Uzyskaj darmowy klucz na: https://openweathermap.org/api
# Instrukcja: zobacz OPENWEATHER_SETUP.md
OPENWEATHER_API_KEY=
ENVEOF"
    fi

    print_success "Pliki aplikacji zaktualizowane"
}

# Sprawdzenie i instalacja wymaganych pakietów
install_dependencies() {
    print_header "INSTALACJA WYMAGANYCH PAKIETÓW"

    print_info "Aktualizacja pakietów..."
    ssh_exec "apt-get update -qq"

    # Sprawdzenie nginx
    print_info "Sprawdzanie nginx..."
    if ssh_exec "command -v nginx" &> /dev/null; then
        print_success "nginx już zainstalowany"
    else
        print_info "Instalacja nginx..."
        ssh_exec "DEBIAN_FRONTEND=noninteractive apt-get install -y nginx"
        print_success "nginx zainstalowany"
    fi

    # Sprawdzenie Node.js
    print_info "Sprawdzanie Node.js..."
    if ssh_exec "command -v node" &> /dev/null; then
        NODE_VERSION=$(ssh_exec "node --version")
        print_success "Node.js już zainstalowany: $NODE_VERSION"
    else
        print_info "Instalacja Node.js..."
        ssh_exec "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -"
        ssh_exec "DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs"
        print_success "Node.js zainstalowany"
    fi

    # Sprawdzenie PM2
    print_info "Sprawdzanie PM2..."
    if ssh_exec "command -v pm2" &> /dev/null; then
        print_success "PM2 już zainstalowany"
    else
        print_info "Instalacja PM2..."
        ssh_exec "npm install -g pm2"
        print_success "PM2 zainstalowany"
    fi

    # Sprawdzenie git
    print_info "Sprawdzanie git..."
    if ssh_exec "command -v git" &> /dev/null; then
        print_success "git już zainstalowany"
    else
        print_info "Instalacja git..."
        ssh_exec "DEBIAN_FRONTEND=noninteractive apt-get install -y git"
        print_success "git zainstalowany"
    fi
}

# Przygotowanie aplikacji
prepare_application() {
    print_header "PRZYGOTOWANIE APLIKACJI"

    print_info "Tworzenie struktury katalogów..."
    ssh_exec "mkdir -p /var/www/$APP_FOLDER"
    ssh_exec "mkdir -p /var/www/$APP_FOLDER/backend"
    ssh_exec "mkdir -p /var/www/$APP_FOLDER/frontend"

    print_info "Kopiowanie plików aplikacji..."

    # Pakowanie aplikacji lokalnie
    print_info "Pakowanie plików..."
    cd "$(dirname "$0")"
    tar -czf /tmp/garden-app-deploy.tar.gz \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='*.log' \
        --exclude='garden.db' \
        --exclude='uploads/*' \
        garden-app/

    # Kopiowanie na serwer
    print_info "Przesyłanie na serwer..."
    scp_copy "/tmp/garden-app-deploy.tar.gz" "/tmp/"

    # Rozpakowywanie na serwerze
    print_info "Rozpakowywanie na serwerze..."
    ssh_exec "cd /var/www/$APP_FOLDER && tar -xzf /tmp/garden-app-deploy.tar.gz --strip-components=1"
    ssh_exec "rm /tmp/garden-app-deploy.tar.gz"
    rm /tmp/garden-app-deploy.tar.gz

    print_success "Pliki aplikacji skopiowane"
}

# Konfiguracja backendu
setup_backend() {
    print_header "KONFIGURACJA BACKENDU"

    print_info "Instalacja zależności backendu..."
    ssh_exec "cd /var/www/$APP_FOLDER/garden-app/backend && npm install --production"

    if [[ "$DEPLOYMENT_MODE" == "fresh" ]]; then
        print_info "Tworzenie pliku .env..."

        # Generowanie silnego JWT_SECRET
        JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')

        ssh_exec "cat > /var/www/$APP_FOLDER/garden-app/backend/.env << 'ENVEOF'
NODE_ENV=production
PORT=$BACKEND_PORT
JWT_SECRET=$JWT_SECRET
FRONTEND_URL=http://${APP_DOMAIN:-$VPS_HOST}
DATABASE_PATH=./garden.db
UPLOAD_DIR=./uploads

# OpenWeatherMap API Key (wymagane dla funkcji pogody)
# Uzyskaj darmowy klucz na: https://openweathermap.org/api
# Instrukcja: zobacz OPENWEATHER_SETUP.md
OPENWEATHER_API_KEY=
ENVEOF"

        print_info "Tworzenie folderu uploads..."
        ssh_exec "mkdir -p /var/www/$APP_FOLDER/garden-app/backend/uploads"
        ssh_exec "chmod 755 /var/www/$APP_FOLDER/garden-app/backend/uploads"
    else
        print_info "Zachowano istniejący plik .env (JWT_SECRET nie zmieniony)"
    fi

    print_success "Backend skonfigurowany"
}

# Konfiguracja frontendu
setup_frontend() {
    print_header "KONFIGURACJA FRONTENDU"

    print_info "Instalacja zależności frontendu..."
    ssh_exec "cd /var/www/$APP_FOLDER/garden-app/frontend && npm install"

    print_info "Tworzenie pliku .env dla frontendu..."
    ssh_exec "cat > /var/www/$APP_FOLDER/garden-app/frontend/.env << 'ENVEOF'
REACT_APP_API_URL=http://${APP_DOMAIN:-$VPS_HOST}:$BACKEND_PORT/api
ENVEOF"

    print_info "Budowanie aplikacji React..."
    ssh_exec "cd /var/www/$APP_FOLDER/garden-app/frontend && npm run build"

    print_info "Kopiowanie zbudowanych plików..."
    ssh_exec "mkdir -p /var/www/$APP_FOLDER/public"
    ssh_exec "cp -r /var/www/$APP_FOLDER/garden-app/frontend/build/* /var/www/$APP_FOLDER/public/"

    print_success "Frontend zbudowany"
}

# Uruchomienie backendu z PM2
start_backend() {
    print_header "URUCHAMIANIE BACKENDU"

    print_info "Zatrzymywanie poprzedniej instancji (jeśli istnieje)..."
    ssh_exec "pm2 delete garden-app-backend" 2>/dev/null || true

    print_info "Uruchamianie backendu z PM2..."
    ssh_exec "cd /var/www/$APP_FOLDER/garden-app/backend && pm2 start index.js --name garden-app-backend"

    print_info "Zapisywanie konfiguracji PM2..."
    ssh_exec "pm2 save"

    print_info "Konfiguracja PM2 do autostartu..."
    ssh_exec "pm2 startup systemd -u $VPS_USER --hp /root" 2>/dev/null || true

    print_success "Backend uruchomiony na porcie $BACKEND_PORT"
}

# Sprawdzenie czy nginx już ma inne aplikacje
check_existing_nginx_sites() {
    print_info "Sprawdzanie istniejących konfiguracji nginx..."

    EXISTING_SITES=$(ssh_exec "ls /etc/nginx/sites-enabled/ 2>/dev/null | grep -v default" || echo "")

    if [[ -n "$EXISTING_SITES" ]]; then
        print_warning "Znalezione istniejące konfiguracje nginx:"
        echo "$EXISTING_SITES" | while read site; do
            echo "  - $site"
        done
        echo ""
        print_info "Nowa konfiguracja zostanie dodana obok istniejących"
    else
        print_info "Brak innych konfiguracji nginx"
    fi
}

# Konfiguracja nginx
setup_nginx() {
    print_header "KONFIGURACJA NGINX"

    check_existing_nginx_sites

    SERVER_NAME="${APP_DOMAIN:-$VPS_HOST}"
    CONFIG_NAME="garden-app-${APP_FOLDER}"

    print_info "Tworzenie konfiguracji nginx..."

    ssh_exec "cat > /etc/nginx/sites-available/$CONFIG_NAME << 'NGINXEOF'
# Garden App - $APP_FOLDER
server {
    listen 80;
    server_name $SERVER_NAME;

    # Frontend - static files
    root /var/www/$APP_FOLDER/public;
    index index.html;

    # Logi
    access_log /var/log/nginx/${CONFIG_NAME}-access.log;
    error_log /var/log/nginx/${CONFIG_NAME}-error.log;

    # Kompresja gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    # Frontend routing (React Router)
    location / {
        try_files \\\$uri \\\$uri/ /index.html;
    }

    # Backend API reverse proxy
    location /api/ {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
        proxy_cache_bypass \\\$http_upgrade;
    }

    # Statyczne pliki backendowe (uploads)
    location /uploads/ {
        alias /var/www/$APP_FOLDER/garden-app/backend/uploads/;
        expires 30d;
        add_header Cache-Control \"public, immutable\";
    }
}
NGINXEOF"

    print_info "Włączanie konfiguracji..."
    ssh_exec "ln -sf /etc/nginx/sites-available/$CONFIG_NAME /etc/nginx/sites-enabled/$CONFIG_NAME"

    print_info "Testowanie konfiguracji nginx..."
    if ssh_exec "nginx -t" 2>&1 | grep -q "syntax is ok"; then
        print_success "Konfiguracja nginx poprawna"
    else
        print_error "Błąd w konfiguracji nginx"
        ssh_exec "nginx -t"
        exit 1
    fi

    print_info "Restartowanie nginx..."
    ssh_exec "systemctl restart nginx"
    ssh_exec "systemctl enable nginx"

    print_success "Nginx skonfigurowany"
}

# Konfiguracja SSL (opcjonalnie)
setup_ssl() {
    if [[ "$SETUP_SSL" != "t" && "$SETUP_SSL" != "T" ]]; then
        return
    fi

    print_header "KONFIGURACJA SSL (Let's Encrypt)"

    print_info "Instalacja certbot..."
    ssh_exec "DEBIAN_FRONTEND=noninteractive apt-get install -y certbot python3-certbot-nginx"

    print_info "Uzyskiwanie certyfikatu SSL..."
    ssh_exec "certbot --nginx -d $APP_DOMAIN --non-interactive --agree-tos --email $SSL_EMAIL --redirect"

    print_success "SSL skonfigurowany dla $APP_DOMAIN"
}

# Konfiguracja firewalla
setup_firewall() {
    print_header "KONFIGURACJA FIREWALL (UFW)"

    if ssh_exec "command -v ufw" &> /dev/null; then
        print_info "Konfiguracja UFW..."
        ssh_exec "ufw allow 22/tcp" 2>/dev/null || true
        ssh_exec "ufw allow 80/tcp" 2>/dev/null || true
        ssh_exec "ufw allow 443/tcp" 2>/dev/null || true
        ssh_exec "ufw --force enable" 2>/dev/null || true
        print_success "Firewall skonfigurowany (porty 22, 80, 443)"
    else
        print_warning "UFW nie jest zainstalowany, pomijam konfigurację firewall"
    fi
}

# Wyświetlenie podsumowania
show_summary() {
    if [[ "$DEPLOYMENT_MODE" == "fresh" ]]; then
        print_header "🎉 DEPLOYMENT ZAKOŃCZONY POMYŚLNIE!"
        print_success "Garden App został zainstalowany na VPS"
    else
        print_header "🎉 AKTUALIZACJA ZAKOŃCZONA POMYŚLNIE!"
        print_success "Garden App został zaktualizowany do najnowszej wersji"
    fi

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📍 Adresy aplikacji:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [[ -n "$APP_DOMAIN" ]]; then
        if [[ "$SETUP_SSL" == "t" || "$SETUP_SSL" == "T" ]] || ssh_exec "test -f /etc/letsencrypt/live/$APP_DOMAIN/fullchain.pem" 2>/dev/null; then
            echo "🌐 Frontend: https://$APP_DOMAIN"
            echo "🔌 Backend:  https://$APP_DOMAIN/api"
        else
            echo "🌐 Frontend: http://$APP_DOMAIN"
            echo "🔌 Backend:  http://$APP_DOMAIN/api"
        fi
    else
        echo "🌐 Frontend: http://$VPS_HOST"
        echo "🔌 Backend:  http://$VPS_HOST/api"
    fi

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "⚙️  Zarządzanie backendem (PM2):"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Status:     pm2 status"
    echo "Logi:       pm2 logs garden-app-backend"
    echo "Restart:    pm2 restart garden-app-backend"
    echo "Stop:       pm2 stop garden-app-backend"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📂 Ścieżki na serwerze:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "App:        /var/www/$APP_FOLDER"
    echo "Backend:    /var/www/$APP_FOLDER/garden-app/backend"
    echo "Frontend:   /var/www/$APP_FOLDER/public"
    echo "Nginx conf: /etc/nginx/sites-available/garden-app-${APP_FOLDER}"
    echo "Nginx logs: /var/log/nginx/garden-app-${APP_FOLDER}-*.log"

    if [[ "$DEPLOYMENT_MODE" == "update" ]]; then
        echo "Backups:    /var/www/$APP_FOLDER/backups"
    fi

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔧 Użyteczne komendy:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Połącz SSH:         sshpass -p '***' ssh $VPS_USER@$VPS_HOST -p $VPS_PORT"
    echo "Sprawdź nginx:      systemctl status nginx"
    echo "Restart nginx:      systemctl restart nginx"
    echo "Sprawdź logi:       tail -f /var/log/nginx/garden-app-${APP_FOLDER}-error.log"

    if [[ "$DEPLOYMENT_MODE" == "update" ]]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "💾 Backup (w razie problemów):"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Lista backupów:     ls -lh /var/www/$APP_FOLDER/backups"
        echo "Przywróć bazę:      tar -xzf /var/www/$APP_FOLDER/backups/garden-db-backup-*.tar.gz -C /var/www/$APP_FOLDER/garden-app/backend"
        echo "Przywróć aplikację: tar -xzf /var/www/$APP_FOLDER/backups/app-backup-*.tar.gz -C /var/www/$APP_FOLDER"
    fi

    echo ""

    if [[ "$SETUP_SSL" == "t" || "$SETUP_SSL" == "T" ]]; then
        print_info "Certyfikat SSL automatycznie odnowi się za pomocą certbot"
    fi

    if [[ "$DEPLOYMENT_MODE" == "fresh" ]]; then
        echo ""
        print_warning "WAŻNE: Hasła i sekrety zostały automatycznie wygenerowane."
        print_warning "JWT_SECRET zapisany w /var/www/$APP_FOLDER/garden-app/backend/.env"
    else
        echo ""
        print_info "Zachowano oryginalny JWT_SECRET i bazę danych"
        print_success "Aplikacja zaktualizowana bez utraty danych"
    fi

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "⚙️  NASTĘPNE KROKI - KONFIGURACJA:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_warning "1. Skonfiguruj OpenWeatherMap API Key dla funkcji pogody:"
    echo "   - Uzyskaj darmowy klucz: https://openweathermap.org/api"
    echo "   - Edytuj plik: /var/www/$APP_FOLDER/garden-app/backend/.env"
    echo "   - Dodaj klucz do OPENWEATHER_API_KEY="
    echo "   - Restart backendu: pm2 restart garden-app-backend"
    echo "   - Pełna instrukcja: OPENWEATHER_SETUP.md"
    echo ""
    print_info "2. Po pierwszym logowaniu ustaw lokalizację w profilu"
    echo "   - Funkcja pogody wymaga lokalizacji użytkownika"
    echo ""
}

# Główna funkcja
main() {
    clear

    cat << "EOF"
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║           🌱 GARDEN APP - VPS DEPLOYMENT 🌱           ║
║                                                       ║
║   Automatyczny deployment na Ubuntu VPS z nginx      ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
EOF

    echo ""

    # Sprawdzenie wymagań lokalnych
    check_sshpass

    # Wybór trybu deployment
    detect_deployment_mode

    # Zbieranie informacji
    collect_server_info

    # Testowanie połączenia
    test_ssh_connection

    if [[ "$DEPLOYMENT_MODE" == "fresh" ]]; then
        # NOWA INSTALACJA
        install_dependencies
        prepare_application
        setup_backend
        setup_frontend
        start_backend
        setup_nginx
        setup_ssl
        setup_firewall
    else
        # AKTUALIZACJA
        check_existing_installation
        backup_database
        update_application
        setup_backend
        setup_frontend
        start_backend
        # Nginx już skonfigurowany, tylko reload
        print_info "Reload konfiguracji nginx..."
        ssh_exec "systemctl reload nginx"
    fi

    # Podsumowanie
    show_summary
}

# Uruchomienie
main "$@"
