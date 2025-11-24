#!/bin/bash

#==============================================================================
# Garden App - Skrypt Naprawy Nieskończonego Ładowania
#==============================================================================
# Diagnozuje i naprawia problem z wiecznym "Ładowanie..." na produkcji
# Użycie: ./fix-infinite-loading.sh
#==============================================================================

set -e

# Kolory
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Konfiguracja
APP_PATH="${APP_PATH:-/var/www/garden}"
BACKEND_PORT="${BACKEND_PORT:-3001}"
DOMAIN="${DOMAIN:-gardenapp.pl}"
PM2_APP_NAME="garden-backend"

# Liczniki
ISSUES_FOUND=0
ISSUES_FIXED=0

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  ${BLUE}🔍 Garden App - Diagnostyka i Naprawa${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

print_check() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_fix() {
    echo -e "${GREEN}[FIX]${NC} $1"
    ISSUES_FIXED=$((ISSUES_FIXED + 1))
}

#==============================================================================
# 1. Sprawdź PM2 i Backend
#==============================================================================

echo ""
print_check "Sprawdzanie backendu PM2..."

if ! command -v pm2 &> /dev/null; then
    print_error "PM2 nie jest zainstalowane"
    echo "         Instaluję PM2..."
    npm install -g pm2
    print_fix "PM2 zainstalowane"
fi

# Sprawdź status backendu
if pm2 list | grep -q "$PM2_APP_NAME.*online"; then
    print_success "Backend PM2 działa (status: online)"
else
    print_error "Backend nie działa"

    # Sprawdź czy aplikacja istnieje w PM2
    if pm2 list | grep -q "$PM2_APP_NAME"; then
        echo "         Restartuję backend..."
        pm2 restart $PM2_APP_NAME
        sleep 2

        if pm2 list | grep -q "$PM2_APP_NAME.*online"; then
            print_fix "Backend uruchomiony ponownie"
        else
            print_error "Backend nie może się uruchomić - sprawdź logi: pm2 logs $PM2_APP_NAME"
        fi
    else
        print_error "Backend nie jest zarządzany przez PM2"
        echo "         Próbuję uruchomić backend..."

        if [ -f "$APP_PATH/backend/index.js" ]; then
            cd $APP_PATH/backend
            pm2 start index.js --name $PM2_APP_NAME
            pm2 save
            print_fix "Backend uruchomiony"
        else
            print_error "Nie znaleziono $APP_PATH/backend/index.js"
        fi
    fi
fi

#==============================================================================
# 2. Testuj API Backend
#==============================================================================

echo ""
print_check "Testowanie API backendu..."

if curl -s -f "http://localhost:$BACKEND_PORT/api/health" > /dev/null 2>&1; then
    HEALTH_RESPONSE=$(curl -s "http://localhost:$BACKEND_PORT/api/health")
    if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
        print_success "API backendu odpowiada poprawnie"
    else
        print_warning "API odpowiada ale zwraca nieprawidłowe dane"
        echo "         Response: $HEALTH_RESPONSE"
    fi
else
    print_error "API backendu nie odpowiada na http://localhost:$BACKEND_PORT/api/health"
    echo "         Sprawdź logi: pm2 logs $PM2_APP_NAME --err"
    echo "         Lub: tail -50 $APP_PATH/backend/logs/*.log"
fi

#==============================================================================
# 3. Sprawdź .env backendu
#==============================================================================

echo ""
print_check "Sprawdzanie konfiguracji .env backendu..."

ENV_FILE="$APP_PATH/backend/.env"

if [ ! -f "$ENV_FILE" ]; then
    print_error "Plik .env nie istnieje!"

    if [ -f "$APP_PATH/backend/.env.example" ]; then
        echo "         Tworzę .env z .env.example..."
        cp "$APP_PATH/backend/.env.example" "$ENV_FILE"
        print_fix "Utworzono plik .env"
    else
        print_error "Brak pliku .env.example - nie mogę utworzyć .env"
    fi
fi

if [ -f "$ENV_FILE" ]; then
    # Sprawdź FRONTEND_URL
    if grep -q "FRONTEND_URL=" "$ENV_FILE"; then
        CURRENT_FRONTEND_URL=$(grep "FRONTEND_URL=" "$ENV_FILE" | cut -d'=' -f2)

        if [[ "$CURRENT_FRONTEND_URL" == "http://localhost:3000" ]]; then
            print_error "FRONTEND_URL ustawiony na localhost (CORS będzie blokować produkcję)"
            echo "         Aktualizuję FRONTEND_URL na https://$DOMAIN..."
            sed -i.bak "s|FRONTEND_URL=.*|FRONTEND_URL=https://$DOMAIN|" "$ENV_FILE"
            print_fix "FRONTEND_URL zaktualizowany na https://$DOMAIN"

            echo "         Restartuję backend żeby zastosować zmiany..."
            pm2 restart $PM2_APP_NAME
        elif [[ "$CURRENT_FRONTEND_URL" == *"$DOMAIN"* ]]; then
            print_success "FRONTEND_URL poprawnie skonfigurowany: $CURRENT_FRONTEND_URL"
        else
            print_warning "FRONTEND_URL: $CURRENT_FRONTEND_URL (upewnij się że to poprawna domena)"
        fi
    else
        print_error "Brak FRONTEND_URL w .env"
        echo "         Dodaję FRONTEND_URL..."
        echo "FRONTEND_URL=https://$DOMAIN" >> "$ENV_FILE"
        print_fix "Dodano FRONTEND_URL do .env"
        pm2 restart $PM2_APP_NAME
    fi

    # Sprawdź PORT
    if ! grep -q "PORT=" "$ENV_FILE"; then
        print_warning "Brak PORT w .env"
        echo "PORT=$BACKEND_PORT" >> "$ENV_FILE"
        print_fix "Dodano PORT do .env"
    fi

    # Sprawdź JWT_SECRET
    if ! grep -q "JWT_SECRET=" "$ENV_FILE" || grep -q "JWT_SECRET=your-super-secret" "$ENV_FILE"; then
        print_warning "JWT_SECRET nie jest ustawiony lub używa domyślnej wartości"
        JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
        sed -i.bak "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" "$ENV_FILE"
        print_fix "Wygenerowano nowy JWT_SECRET"
    else
        print_success "JWT_SECRET jest ustawiony"
    fi
fi

#==============================================================================
# 4. Sprawdź Nginx
#==============================================================================

echo ""
print_check "Sprawdzanie Nginx..."

if ! command -v nginx &> /dev/null; then
    print_error "Nginx nie jest zainstalowany"
    echo "         Instaluję Nginx..."
    apt-get update -qq
    apt-get install -y nginx
    print_fix "Nginx zainstalowany"
fi

# Sprawdź status Nginx
if systemctl is-active --quiet nginx; then
    print_success "Nginx działa"
else
    print_error "Nginx nie działa"
    echo "         Uruchamiam Nginx..."
    systemctl start nginx
    print_fix "Nginx uruchomiony"
fi

# Sprawdź konfigurację Nginx
NGINX_CONFIG="/etc/nginx/sites-available/garden-app"

if [ -f "$NGINX_CONFIG" ]; then
    print_success "Konfiguracja Nginx istnieje: $NGINX_CONFIG"

    # Sprawdź czy jest proxy dla /api
    if grep -q "location /api" "$NGINX_CONFIG"; then
        print_success "Nginx ma konfigurację proxy dla /api"

        # Sprawdź czy proxy_pass wskazuje na poprawny port
        if grep -q "proxy_pass http://localhost:$BACKEND_PORT" "$NGINX_CONFIG"; then
            print_success "Nginx proxy_pass wskazuje na poprawny port: $BACKEND_PORT"
        else
            print_warning "Nginx proxy_pass może wskazywać na niepoprawny port"
            echo "         Sprawdź: grep proxy_pass $NGINX_CONFIG"
        fi
    else
        print_error "Brak 'location /api' w konfiguracji Nginx"
        echo "         Nginx nie będzie przekierowywać requestów API do backendu!"
        echo "         Musisz ręcznie dodać sekcję 'location /api' do $NGINX_CONFIG"
    fi

    # Sprawdź czy jest symlink w sites-enabled
    if [ -L "/etc/nginx/sites-enabled/garden-app" ]; then
        print_success "Konfiguracja Nginx jest aktywna (symlink w sites-enabled)"
    else
        print_warning "Brak symlinku w sites-enabled"
        echo "         Tworzę symlink..."
        ln -sf "$NGINX_CONFIG" "/etc/nginx/sites-enabled/garden-app"
        print_fix "Utworzono symlink"
    fi

    # Testuj konfigurację Nginx
    if nginx -t 2>&1 | grep -q "syntax is ok"; then
        print_success "Konfiguracja Nginx jest poprawna"
    else
        print_error "Konfiguracja Nginx ma błędy"
        echo "         Sprawdź: nginx -t"
    fi
else
    print_error "Brak konfiguracji Nginx: $NGINX_CONFIG"
    echo "         Musisz stworzyć konfigurację Nginx dla Garden App"
    echo "         Zobacz: docs/deployment/DEPLOYMENT_GUIDE.md"
fi

#==============================================================================
# 5. Sprawdź Frontend Build
#==============================================================================

echo ""
print_check "Sprawdzanie frontendu..."

FRONTEND_BUILD="$APP_PATH/frontend/build"

if [ -d "$FRONTEND_BUILD" ]; then
    if [ -f "$FRONTEND_BUILD/index.html" ]; then
        print_success "Frontend build istnieje"

        # Sprawdź rozmiar buildu
        BUILD_SIZE=$(du -sh "$FRONTEND_BUILD" | cut -f1)
        echo "         Rozmiar: $BUILD_SIZE"

        # Sprawdź czy są pliki JS
        JS_COUNT=$(find "$FRONTEND_BUILD/static/js" -name "*.js" 2>/dev/null | wc -l)
        if [ "$JS_COUNT" -gt 0 ]; then
            print_success "Frontend ma pliki JavaScript ($JS_COUNT plików)"
        else
            print_error "Brak plików JavaScript w buildzie"
        fi
    else
        print_error "Brak index.html w buildzie"
    fi
else
    print_error "Brak folderu build - frontend nie jest zbudowany"

    if [ -f "$APP_PATH/frontend/package.json" ]; then
        echo "         Buduję frontend..."
        cd "$APP_PATH/frontend"

        # Sprawdź czy są node_modules
        if [ ! -d "node_modules" ]; then
            echo "         Instaluję zależności npm..."
            npm install
        fi

        echo "         Uruchamiam build..."
        npm run build

        if [ -d "$FRONTEND_BUILD" ]; then
            print_fix "Frontend zbudowany"
        else
            print_error "Build nie powiódł się"
        fi
    else
        print_error "Brak package.json - nie mogę zbudować frontendu"
    fi
fi

#==============================================================================
# 6. Test Zewnętrzny (z perspektywy użytkownika)
#==============================================================================

echo ""
print_check "Testowanie dostępu zewnętrznego..."

# Test czy nginx serwuje frontend
if curl -s -f "http://localhost/" > /dev/null 2>&1; then
    print_success "Nginx serwuje stronę główną"
else
    print_warning "Nginx nie serwuje strony głównej"
fi

# Test czy nginx przekierowuje /api
if curl -s -f "http://localhost/api/health" > /dev/null 2>&1; then
    print_success "Nginx przekierowuje /api do backendu"
else
    print_error "Nginx NIE przekierowuje /api do backendu"
    echo "         To jest główny problem!"
    echo "         Sprawdź konfigurację: cat $NGINX_CONFIG"
fi

#==============================================================================
# 7. Podsumowanie i Rekomendacje
#==============================================================================

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  ${BLUE}📊 Podsumowanie Diagnostyki${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "Znalezionych problemów: ${RED}$ISSUES_FOUND${NC}"
echo -e "Naprawionych problemów: ${GREEN}$ISSUES_FIXED${NC}"
echo ""

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✓ Wszystko wygląda dobrze!${NC}"
    echo ""
    echo "Jeśli problem nadal występuje:"
    echo "  1. Otwórz konsolę przeglądarki (F12) i sprawdź błędy"
    echo "  2. Sprawdź logi: pm2 logs $PM2_APP_NAME"
    echo "  3. Sprawdź logi Nginx: tail -50 /var/log/nginx/error.log"
elif [ $ISSUES_FIXED -ge $ISSUES_FOUND ]; then
    echo -e "${GREEN}✓ Wszystkie problemy naprawione!${NC}"
    echo ""
    echo "Restartuję usługi..."
    pm2 restart $PM2_APP_NAME
    systemctl restart nginx
    echo ""
    echo -e "${GREEN}✓ Gotowe! Sprawdź aplikację w przeglądarce.${NC}"
else
    echo -e "${YELLOW}! Niektóre problemy wymagają ręcznej interwencji${NC}"
    echo ""
    echo "Następne kroki:"
    echo "  1. Sprawdź logi backendu: pm2 logs $PM2_APP_NAME"
    echo "  2. Sprawdź logi Nginx: tail -50 /var/log/nginx/error.log"
    echo "  3. Sprawdź konfigurację Nginx: cat $NGINX_CONFIG"
    echo "  4. Zobacz szczegółową dokumentację: docs/DEBUG_INFINITE_LOADING.md"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Przydatne komendy:"
echo "  - Status PM2:      pm2 status"
echo "  - Logi backendu:   pm2 logs $PM2_APP_NAME"
echo "  - Restart PM2:     pm2 restart $PM2_APP_NAME"
echo "  - Test API:        curl http://localhost:$BACKEND_PORT/api/health"
echo "  - Test Nginx:      curl http://localhost/api/health"
echo "  - Restart Nginx:   systemctl restart nginx"
echo "  - Nginx config:    cat $NGINX_CONFIG"
echo ""
echo "Strona: https://$DOMAIN"
echo ""
