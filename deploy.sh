#!/bin/bash

#==============================================================================
# Garden App - Automatyczny Deployment na VPS
# Wersja: 2.0
# Dla hobbystów - maksymalne uproszczenie
#==============================================================================

set -e  # Exit on error

# Kolory dla ładnego outputu
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Konfiguracja domyślna
DEFAULT_VPS_IP="8.209.82.14"
DEFAULT_VPS_USER="root"
DEFAULT_APP_PATH="/var/www/garden"
DEFAULT_BACKEND_PORT="3001"
DEFAULT_FRONTEND_PORT="3000"

#==============================================================================
# FUNKCJE POMOCNICZE
#==============================================================================

print_header() {
    echo -e "${CYAN}${BOLD}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║           🌱 GARDEN APP - VPS DEPLOYMENT SCRIPT 🌱           ║"
    echo "║                   Projekt Hobbystyczny                        ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "\n${BLUE}${BOLD}[KROK $1/$2]${NC} ${GREEN}$3${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ${NC}  $1"
}

print_success() {
    echo -e "${GREEN}✓${NC}  $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC}  $1"
}

print_error() {
    echo -e "${RED}✗${NC}  $1"
}

print_question() {
    echo -e "${MAGENTA}?${NC}  $1"
}

loading_animation() {
    local pid=$1
    local message=$2
    local delay=0.1
    local spinstr='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'

    while ps -p $pid > /dev/null 2>&1; do
        local temp=${spinstr#?}
        printf " ${CYAN}[%c]${NC}  %s" "$spinstr" "$message"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\r"
    done
    printf "    \r"
}

confirm() {
    local question="$1"
    local default="${2:-n}"

    if [ "$default" = "y" ]; then
        prompt="[T/n]"
    else
        prompt="[t/N]"
    fi

    while true; do
        echo -ne "${MAGENTA}?${NC}  $question $prompt: "
        read -r response
        response=${response:-$default}

        case "$response" in
            [yYtT]|[tT][aA][kK]|[yY][eE][sS])
                return 0
                ;;
            [nN]|[nN][iI][eE]|[nN][oO])
                return 1
                ;;
            *)
                print_warning "Proszę odpowiedzieć 't' (tak) lub 'n' (nie)"
                ;;
        esac
    done
}

check_local_requirements() {
    print_info "Sprawdzanie lokalnych zależności..."

    local missing=()

    # Sprawdź ssh
    if ! command -v ssh &> /dev/null; then
        missing+=("ssh")
    fi

    # Sprawdź sshpass (opcjonalne)
    if ! command -v sshpass &> /dev/null; then
        print_warning "sshpass nie zainstalowany - będziesz musiał wpisywać hasło wielokrotnie"
        if confirm "Czy zainstalować sshpass?" "n"; then
            if [ -f /etc/debian_version ]; then
                sudo apt-get update && sudo apt-get install -y sshpass
            elif [ -f /etc/redhat-release ]; then
                sudo yum install -y sshpass
            else
                print_warning "Nie można automatycznie zainstalować sshpass na tym systemie"
            fi
        fi
    fi

    if [ ${#missing[@]} -gt 0 ]; then
        print_error "Brakujące zależności: ${missing[*]}"
        print_info "Zainstaluj: sudo apt-get install ${missing[*]}"
        exit 1
    fi

    print_success "Wszystkie lokalne zależności dostępne"
}

#==============================================================================
# KONFIGURACJA POŁĄCZENIA
#==============================================================================

configure_connection() {
    print_header
    print_step 1 10 "Konfiguracja połączenia z VPS"

    echo ""
    print_info "Wprowadź dane dostępu do serwera VPS:"
    echo ""

    # IP lub domena
    print_question "Adres serwera (IP lub domena)"
    echo -ne "   Domyślnie: ${GREEN}${DEFAULT_VPS_IP}${NC}\n   Wprowadź lub naciśnij Enter: "
    read -r VPS_HOST
    VPS_HOST=${VPS_HOST:-$DEFAULT_VPS_IP}

    # Użytkownik
    print_question "Użytkownik SSH"
    echo -ne "   Domyślnie: ${GREEN}${DEFAULT_VPS_USER}${NC}\n   Wprowadź lub naciśnij Enter: "
    read -r VPS_USER
    VPS_USER=${VPS_USER:-$DEFAULT_VPS_USER}

    # Port SSH
    print_question "Port SSH"
    echo -ne "   Domyślnie: ${GREEN}22${NC}\n   Wprowadź lub naciśnij Enter: "
    read -r VPS_PORT
    VPS_PORT=${VPS_PORT:-22}

    # Hasło lub klucz
    echo ""
    print_question "Metoda uwierzytelniania:"
    echo "   1) Hasło (z sshpass)"
    echo "   2) Klucz SSH (bez hasła)"
    echo -ne "   Wybierz (1/2) [1]: "
    read -r auth_method
    auth_method=${auth_method:-1}

    if [ "$auth_method" = "1" ]; then
        USE_SSHPASS=true
        print_question "Hasło SSH"
        echo -ne "   (nie będzie widoczne): "
        read -s VPS_PASSWORD
        echo ""
        export SSHPASS="$VPS_PASSWORD"
        SSH_CMD="sshpass -e ssh -o StrictHostKeyChecking=no"
        SCP_CMD="sshpass -e scp -o StrictHostKeyChecking=no"
    else
        USE_SSHPASS=false
        SSH_CMD="ssh -o StrictHostKeyChecking=no"
        SCP_CMD="scp -o StrictHostKeyChecking=no"
    fi

    # Test połączenia
    echo ""
    print_info "Testowanie połączenia z serwerem..."

    if $SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST "echo 'OK'" &> /dev/null; then
        print_success "Połączenie z serwerem ${GREEN}${VPS_HOST}${NC} działa!"
    else
        print_error "Nie można połączyć się z serwerem!"
        print_info "Sprawdź:"
        echo "   • Czy adres $VPS_HOST jest poprawny"
        echo "   • Czy port $VPS_PORT jest otwarty"
        echo "   • Czy hasło/klucz SSH jest poprawne"
        exit 1
    fi

    echo ""
    print_success "Konfiguracja połączenia zakończona"
}

#==============================================================================
# SPRAWDZANIE ŚRODOWISKA VPS
#==============================================================================

check_vps_environment() {
    print_step 2 10 "Sprawdzanie środowiska VPS"

    print_info "Sprawdzanie zainstalowanych pakietów na serwerze..."

    # Sprawdź system operacyjny
    OS_INFO=$($SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST "cat /etc/os-release | grep PRETTY_NAME" | cut -d'"' -f2)
    print_info "System: ${GREEN}${OS_INFO}${NC}"

    # Lista wymaganych pakietów
    local required_packages=(
        "node:Node.js"
        "npm:NPM"
        "nginx:Nginx"
        "sqlite3:SQLite3"
        "git:Git"
    )

    MISSING_PACKAGES=()

    for package_info in "${required_packages[@]}"; do
        IFS=':' read -r cmd name <<< "$package_info"

        if $SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST "command -v $cmd" &> /dev/null; then
            version=$($SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST "$cmd --version 2>&1 | head -1")
            print_success "$name: ${GREEN}${version}${NC}"
        else
            print_warning "$name nie jest zainstalowany"
            MISSING_PACKAGES+=("$cmd")
        fi
    done

    # Sprawdź PM2
    if ! $SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST "command -v pm2" &> /dev/null; then
        print_warning "PM2 nie jest zainstalowany (zostanie zainstalowany automatycznie)"
        INSTALL_PM2=true
    else
        print_success "PM2: $(${SSH_CMD} -p $VPS_PORT $VPS_USER@$VPS_HOST 'pm2 --version')"
        INSTALL_PM2=false
    fi

    if [ ${#MISSING_PACKAGES[@]} -gt 0 ]; then
        echo ""
        print_warning "Brakujące pakiety: ${MISSING_PACKAGES[*]}"

        if confirm "Czy automatycznie zainstalować brakujące pakiety?" "y"; then
            install_vps_requirements
        else
            print_error "Instalacja przerwana. Zainstaluj wymagane pakiety ręcznie."
            exit 1
        fi
    else
        print_success "Wszystkie wymagane pakiety są zainstalowane"
    fi
}

install_vps_requirements() {
    print_info "Instalacja brakujących pakietów..."

    $SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST << 'ENDSSH'
        # Update package list
        apt-get update -qq

        # Install Node.js 18.x (LTS)
        if ! command -v node &> /dev/null; then
            echo "Instalowanie Node.js..."
            curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
            apt-get install -y nodejs
        fi

        # Install other packages
        apt-get install -y nginx sqlite3 git

        # Install PM2 globally
        npm install -g pm2

        echo "Instalacja zakończona"
ENDSSH

    print_success "Wszystkie pakiety zainstalowane"
}

#==============================================================================
# SPRAWDZANIE NGINX I ŚCIEŻKI INSTALACJI
#==============================================================================

check_nginx_and_path() {
    print_step 3 10 "Sprawdzanie konfiguracji Nginx"

    # Sprawdź czy nginx hostuje już jakąś aplikację
    EXISTING_SITES=$($SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST "ls -1 /etc/nginx/sites-enabled/ 2>/dev/null | wc -l")

    if [ "$EXISTING_SITES" -gt 0 ]; then
        print_warning "Nginx już hostuje $EXISTING_SITES aplikację(e)"

        print_info "Istniejące konfiguracje:"
        $SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST "ls -l /etc/nginx/sites-enabled/" | tail -n +2

        echo ""
        print_info "Garden App zostanie zainstalowana w osobnym folderze aby nie zakłócać istniejących stron"
        APP_PATH="/var/www/garden"
        USE_SUBDOMAIN=true

        echo ""
        print_question "Czy chcesz używać subdomenę/ścieżkę dla Garden App?"
        echo "   1) Subdomena (np. garden.twojadomena.com)"
        echo "   2) Ścieżka (np. twojadomena.com/garden)"
        echo "   3) Osobny port (np. :3001)"
        echo -ne "   Wybierz (1/2/3) [2]: "
        read -r install_type
        install_type=${install_type:-2}

        case $install_type in
            1)
                INSTALL_TYPE="subdomain"
                print_question "Wprowadź subdomenę (np. garden.twojadomena.com)"
                echo -ne "   Subdomena: "
                read -r GARDEN_DOMAIN
                ;;
            2)
                INSTALL_TYPE="path"
                GARDEN_PATH="/garden"
                ;;
            3)
                INSTALL_TYPE="port"
                print_question "Wprowadź port dla backendu (domyślnie 3001)"
                echo -ne "   Port: "
                read -r BACKEND_PORT
                BACKEND_PORT=${BACKEND_PORT:-3001}
                ;;
        esac
    else
        print_success "Nginx nie hostuje jeszcze żadnych aplikacji"
        APP_PATH="/var/www/garden"
        INSTALL_TYPE="main"

        print_question "Czy masz domenę dla tej aplikacji?"
        echo "   1) Tak, mam domenę (np. mojogrod.pl)"
        echo "   2) Nie, użyję IP serwera"
        echo -ne "   Wybierz (1/2) [2]: "
        read -r has_domain
        has_domain=${has_domain:-2}

        if [ "$has_domain" = "1" ]; then
            print_question "Wprowadź swoją domenę"
            echo -ne "   Domena: "
            read -r GARDEN_DOMAIN
            HAS_DOMAIN=true
        else
            GARDEN_DOMAIN=$VPS_HOST
            HAS_DOMAIN=false
        fi
    fi

    print_success "Ścieżka instalacji: ${GREEN}${APP_PATH}${NC}"
}

#==============================================================================
# KONFIGURACJA APLIKACJI
#==============================================================================

configure_application() {
    print_step 4 10 "Konfiguracja aplikacji"

    echo ""
    print_info "Wprowadź dane konfiguracyjne:"

    # OpenWeather API Key
    echo ""
    print_question "Klucz API OpenWeatherMap (FREE - https://openweathermap.org/api)"
    echo -ne "   Wprowadź klucz lub zostaw puste (skonfigurujesz później): "
    read -r OPENWEATHER_KEY

    if [ -z "$OPENWEATHER_KEY" ]; then
        print_warning "Klucz OpenWeather nie ustawiony - funkcje pogody nie będą działać"
        print_info "Możesz dodać klucz później w pliku ${APP_PATH}/backend/.env"
    fi

    # Port backendu
    echo ""
    print_question "Port backendu"
    echo -ne "   Domyślnie: ${GREEN}${DEFAULT_BACKEND_PORT}${NC}\n   Wprowadź lub naciśnij Enter: "
    read -r BACKEND_PORT
    BACKEND_PORT=${BACKEND_PORT:-$DEFAULT_BACKEND_PORT}

    # Generuj JWT Secret
    JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')

    print_success "Konfiguracja przygotowana"
}

#==============================================================================
# UPLOAD APLIKACJI
#==============================================================================

upload_application() {
    print_step 5 10 "Upload aplikacji na serwer"

    # Stwórz archiwum aplikacji (bez node_modules)
    print_info "Pakowanie aplikacji..."

    tar -czf /tmp/garden-app.tar.gz \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='*.log' \
        --exclude='garden.db' \
        --exclude='uploads/*' \
        -C garden-app .

    print_success "Aplikacja spakowana"

    # Stwórz strukturę folderów na serwerze
    print_info "Tworzenie struktury folderów na serwerze..."

    $SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
        mkdir -p $APP_PATH
        mkdir -p $APP_PATH/backend/uploads
        mkdir -p $APP_PATH/frontend
ENDSSH

    # Upload archiwum
    print_info "Przesyłanie aplikacji na serwer..."

    $SCP_CMD -P $VPS_PORT /tmp/garden-app.tar.gz $VPS_USER@$VPS_HOST:/tmp/

    # Rozpakuj na serwerze
    print_info "Rozpakowywanie aplikacji..."

    $SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
        cd $APP_PATH
        tar -xzf /tmp/garden-app.tar.gz
        rm /tmp/garden-app.tar.gz
        chown -R www-data:www-data $APP_PATH
ENDSSH

    # Cleanup lokalnie
    rm /tmp/garden-app.tar.gz

    print_success "Aplikacja przesłana na serwer"
}

#==============================================================================
# INSTALACJA ZALEŻNOŚCI
#==============================================================================

install_dependencies() {
    print_step 6 10 "Instalacja zależności"

    print_info "Instalowanie zależności backendu..."

    $SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
        cd $APP_PATH/backend
        npm install --production
ENDSSH

    print_success "Zależności backendu zainstalowane"

    print_info "Instalowanie zależności frontendu..."

    $SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
        cd $APP_PATH/frontend
        npm install
ENDSSH

    print_success "Zależności frontendu zainstalowane"
}

#==============================================================================
# KONFIGURACJA ŚRODOWISKA
#==============================================================================

configure_environment() {
    print_step 7 10 "Konfiguracja zmiennych środowiskowych"

    # Frontend URL zależy od typu instalacji
    case $INSTALL_TYPE in
        "subdomain")
            FRONTEND_URL="https://${GARDEN_DOMAIN}"
            ;;
        "path")
            FRONTEND_URL="http://${VPS_HOST}/garden"
            ;;
        "port")
            FRONTEND_URL="http://${VPS_HOST}:${BACKEND_PORT}"
            ;;
        "main")
            if [ "$HAS_DOMAIN" = true ]; then
                FRONTEND_URL="http://${GARDEN_DOMAIN}"
            else
                FRONTEND_URL="http://${VPS_HOST}"
            fi
            ;;
    esac

    # Utwórz .env dla backendu
    print_info "Tworzenie pliku .env dla backendu..."

    $SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
        cat > $APP_PATH/backend/.env << 'EOF'
PORT=${BACKEND_PORT}
NODE_ENV=production
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
FRONTEND_URL=${FRONTEND_URL}
OPENWEATHER_API_KEY=${OPENWEATHER_KEY}
EOF
        chmod 600 $APP_PATH/backend/.env
ENDSSH

    print_success "Plik .env utworzony"

    # Utwórz .env dla frontendu
    print_info "Tworzenie pliku .env dla frontendu..."

    $SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
        cat > $APP_PATH/frontend/.env << 'EOF'
REACT_APP_API_URL=http://localhost:${BACKEND_PORT}
EOF
ENDSSH

    print_success "Konfiguracja środowiska zakończona"
}

#==============================================================================
# BUILD FRONTENDU
#==============================================================================

build_frontend() {
    print_step 8 10 "Budowanie frontendu"

    print_info "Kompilowanie aplikacji React (może potrwać kilka minut)..."

    $SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
        cd $APP_PATH/frontend
        REACT_APP_API_URL=http://localhost:${BACKEND_PORT} npm run build
ENDSSH

    print_success "Frontend zbudowany"
}

#==============================================================================
# KONFIGURACJA NGINX
#==============================================================================

configure_nginx() {
    print_step 9 10 "Konfiguracja Nginx"

    print_info "Tworzenie konfiguracji Nginx..."

    case $INSTALL_TYPE in
        "subdomain")
            configure_nginx_subdomain
            ;;
        "path")
            configure_nginx_path
            ;;
        "port")
            configure_nginx_port
            ;;
        "main")
            configure_nginx_main
            ;;
    esac

    # Test konfiguracji Nginx
    print_info "Testowanie konfiguracji Nginx..."

    if $SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST "nginx -t" &> /dev/null; then
        print_success "Konfiguracja Nginx poprawna"
    else
        print_error "Błąd w konfiguracji Nginx!"
        $SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST "nginx -t"
        exit 1
    fi

    # Restart Nginx
    print_info "Restartowanie Nginx..."
    $SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST "systemctl restart nginx"

    print_success "Nginx skonfigurowany i uruchomiony"
}

configure_nginx_main() {
    $SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
        # Backup istniejącej konfiguracji default
        if [ -f /etc/nginx/sites-enabled/default ]; then
            mv /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.backup.\$(date +%Y%m%d_%H%M%S)
        fi

        cat > /etc/nginx/sites-available/garden-app << 'EOF'
server {
    listen 80;
    server_name ${GARDEN_DOMAIN};

    # Frontend (React build)
    location / {
        root $APP_PATH/frontend/build;
        try_files \\\$uri \\\$uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
    }

    # Uploads
    location /uploads {
        alias $APP_PATH/backend/uploads;
        expires 1y;
        add_header Cache-Control "public";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF

        ln -sf /etc/nginx/sites-available/garden-app /etc/nginx/sites-enabled/garden-app
ENDSSH
}

configure_nginx_subdomain() {
    $SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
        cat > /etc/nginx/sites-available/garden-app << 'EOF'
server {
    listen 80;
    server_name ${GARDEN_DOMAIN};

    location / {
        root $APP_PATH/frontend/build;
        try_files \\\$uri \\\$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
    }

    location /uploads {
        alias $APP_PATH/backend/uploads;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
EOF

        ln -sf /etc/nginx/sites-available/garden-app /etc/nginx/sites-enabled/garden-app
ENDSSH
}

configure_nginx_path() {
    $SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
        # Dodaj location do istniejącej konfiguracji
        # (to wymaga ręcznej edycji - wyświetl instrukcje)
        echo "UWAGA: Dodaj do istniejącej konfiguracji Nginx:"
        echo ""
        cat << 'CONFIG'
location /garden {
    alias $APP_PATH/frontend/build;
    try_files \\\$uri \\\$uri/ /garden/index.html;
}

location /garden/api {
    rewrite ^/garden/api/(.*) /api/\\\$1 break;
    proxy_pass http://localhost:${BACKEND_PORT};
    proxy_http_version 1.1;
}
CONFIG
ENDSSH
}

configure_nginx_port() {
    print_warning "Instalacja na osobnym porcie - Nginx nie jest wymagany"
    print_info "Backend będzie dostępny na: http://${VPS_HOST}:${BACKEND_PORT}"
}

#==============================================================================
# URUCHOMIENIE Z PM2
#==============================================================================

start_with_pm2() {
    print_step 10 10 "Uruchamianie aplikacji z PM2"

    print_info "Konfigurowanie PM2..."

    # Utwórz plik ecosystem dla PM2
    $SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
        cat > $APP_PATH/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'garden-backend',
    cwd: '$APP_PATH/backend',
    script: 'index.js',
    env: {
      NODE_ENV: 'production',
      PORT: ${BACKEND_PORT}
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    error_file: '$APP_PATH/logs/backend-error.log',
    out_file: '$APP_PATH/logs/backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF

        # Utwórz folder na logi
        mkdir -p $APP_PATH/logs

        # Zatrzymaj stare procesy jeśli istnieją
        pm2 delete garden-backend 2>/dev/null || true

        # Uruchom aplikację
        cd $APP_PATH
        pm2 start ecosystem.config.js

        # Zapisz konfigurację PM2
        pm2 save

        # Setup PM2 startup
        pm2 startup systemd -u root --hp /root
ENDSSH

    print_success "Aplikacja uruchomiona z PM2"

    # Sprawdź status
    print_info "Status aplikacji:"
    $SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST "pm2 status"
}

#==============================================================================
# PODSUMOWANIE
#==============================================================================

print_summary() {
    echo ""
    echo -e "${GREEN}${BOLD}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                  ✓ INSTALACJA ZAKOŃCZONA!                    ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    echo ""
    print_info "${BOLD}Podsumowanie instalacji:${NC}"
    echo ""

    echo -e "  ${CYAN}Serwer:${NC}          $VPS_HOST"
    echo -e "  ${CYAN}Ścieżka:${NC}         $APP_PATH"
    echo -e "  ${CYAN}Port backendu:${NC}   $BACKEND_PORT"

    echo ""

    case $INSTALL_TYPE in
        "main")
            if [ "$HAS_DOMAIN" = true ]; then
                echo -e "  ${GREEN}${BOLD}🌍 Aplikacja dostępna pod:${NC}"
                echo -e "     ${BLUE}http://${GARDEN_DOMAIN}${NC}"
            else
                echo -e "  ${GREEN}${BOLD}🌍 Aplikacja dostępna pod:${NC}"
                echo -e "     ${BLUE}http://${VPS_HOST}${NC}"
            fi
            ;;
        "subdomain")
            echo -e "  ${GREEN}${BOLD}🌍 Aplikacja dostępna pod:${NC}"
            echo -e "     ${BLUE}http://${GARDEN_DOMAIN}${NC}"
            ;;
        "path")
            echo -e "  ${GREEN}${BOLD}🌍 Aplikacja dostępna pod:${NC}"
            echo -e "     ${BLUE}http://${VPS_HOST}/garden${NC}"
            ;;
        "port")
            echo -e "  ${GREEN}${BOLD}🌍 Aplikacja dostępna pod:${NC}"
            echo -e "     ${BLUE}http://${VPS_HOST}:${BACKEND_PORT}${NC}"
            ;;
    esac

    echo ""
    print_info "${BOLD}Przydatne komendy:${NC}"
    echo ""
    echo -e "  ${CYAN}Status aplikacji:${NC}"
    echo "    ssh $VPS_USER@$VPS_HOST -p $VPS_PORT 'pm2 status'"
    echo ""
    echo -e "  ${CYAN}Logi aplikacji:${NC}"
    echo "    ssh $VPS_USER@$VPS_HOST -p $VPS_PORT 'pm2 logs garden-backend'"
    echo ""
    echo -e "  ${CYAN}Restart aplikacji:${NC}"
    echo "    ssh $VPS_USER@$VPS_HOST -p $VPS_PORT 'pm2 restart garden-backend'"
    echo ""
    echo -e "  ${CYAN}Zatrzymanie aplikacji:${NC}"
    echo "    ssh $VPS_USER@$VPS_HOST -p $VPS_PORT 'pm2 stop garden-backend'"
    echo ""

    if [ -z "$OPENWEATHER_KEY" ]; then
        echo ""
        print_warning "${BOLD}UWAGA: OpenWeather API key nie został ustawiony!${NC}"
        print_info "Aby dodać klucz:"
        echo "  1. Uzyskaj klucz na: https://openweathermap.org/api"
        echo "  2. Edytuj plik: $APP_PATH/backend/.env"
        echo "  3. Dodaj: OPENWEATHER_API_KEY=twoj_klucz"
        echo "  4. Zrestartuj: pm2 restart garden-backend"
    fi

    echo ""
    print_info "${BOLD}Pierwsze kroki:${NC}"
    echo "  1. Otwórz aplikację w przeglądarce"
    echo "  2. Zarejestruj się jako nowy użytkownik"
    echo "  3. Przejdź do Profil i ustaw lokalizację (dla pogody)"
    echo "  4. Stwórz swoją pierwszą działkę!"
    echo ""

    echo -e "${GREEN}${BOLD}🌱 Miłego ogrodnictwa! 🌱${NC}"
    echo ""
}

#==============================================================================
# MAIN
#==============================================================================

main() {
    clear
    print_header

    echo ""
    print_info "Ten skrypt zainstaluje Garden App na Twoim serwerze VPS"
    print_info "Proces zajmie około 5-10 minut"
    echo ""

    if ! confirm "Czy chcesz kontynuować?" "y"; then
        print_info "Instalacja anulowana"
        exit 0
    fi

    # Sprawdź lokalne wymagania
    check_local_requirements

    # Konfiguracja połączenia
    configure_connection

    # Sprawdź środowisko VPS
    check_vps_environment

    # Sprawdź Nginx i wybierz ścieżkę
    check_nginx_and_path

    # Konfiguracja aplikacji
    configure_application

    # Upload aplikacji
    upload_application

    # Instalacja zależności
    install_dependencies

    # Konfiguracja środowiska
    configure_environment

    # Build frontendu
    build_frontend

    # Konfiguracja Nginx
    configure_nginx

    # Uruchomienie z PM2
    start_with_pm2

    # Podsumowanie
    print_summary
}

# Uruchom główną funkcję
main "$@"
