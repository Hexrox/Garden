#!/bin/bash

#==============================================================================
# Garden App - Cleanup Script (Czyszczenie Serwera)
# Usuwa poprzednie instalacje i konflikty
#==============================================================================

set -e

# Kolory
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

print_header() {
    echo -e "${CYAN}${BOLD}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║         🧹 GARDEN APP - SERVER CLEANUP SCRIPT 🧹             ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
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

confirm() {
    local question="$1"
    local default="${2:-n}"

    if [ "$default" = "y" ]; then
        prompt="[T/n]"
    else
        prompt="[t/N]"
    fi

    while true; do
        echo -ne "${YELLOW}?${NC}  $question $prompt: "
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

# Konfiguracja połączenia
configure_connection() {
    echo ""
    print_info "Wprowadź dane dostępu do serwera VPS:"
    echo ""

    echo -ne "  ${CYAN}Adres serwera${NC} (IP lub domena) [8.209.82.14]: "
    read -r VPS_HOST
    VPS_HOST=${VPS_HOST:-8.209.82.14}

    echo -ne "  ${CYAN}Użytkownik SSH${NC} [root]: "
    read -r VPS_USER
    VPS_USER=${VPS_USER:-root}

    echo -ne "  ${CYAN}Port SSH${NC} [22]: "
    read -r VPS_PORT
    VPS_PORT=${VPS_PORT:-22}

    echo ""
    echo -ne "  ${CYAN}Hasło SSH${NC} (nie będzie widoczne): "
    read -s VPS_PASSWORD
    echo ""
    export SSHPASS="$VPS_PASSWORD"

    if command -v sshpass &> /dev/null; then
        SSH_CMD="sshpass -e ssh -o StrictHostKeyChecking=no"
    else
        print_warning "sshpass nie zainstalowany - będziesz musiał wpisywać hasło"
        SSH_CMD="ssh -o StrictHostKeyChecking=no"
    fi

    # Test połączenia
    echo ""
    print_info "Testowanie połączenia..."
    if $SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST "echo 'OK'" &> /dev/null; then
        print_success "Połączenie z serwerem działa!"
    else
        print_error "Nie można połączyć się z serwerem!"
        exit 1
    fi
}

# Sprawdź co jest zainstalowane
check_existing_installations() {
    print_info "Sprawdzanie zainstalowanych aplikacji..."
    echo ""

    # Lista konfiguracji Nginx
    echo -e "${BOLD}Konfiguracje Nginx:${NC}"
    $SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST "ls -1 /etc/nginx/sites-enabled/ 2>/dev/null | nl" || echo "  Brak konfiguracji"

    echo ""

    # Sprawdź PM2
    echo -e "${BOLD}Procesy PM2:${NC}"
    $SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST "pm2 list 2>/dev/null | grep -E 'online|stopped|errored'" || echo "  Brak procesów PM2"

    echo ""

    # Sprawdź foldery w /var/www
    echo -e "${BOLD}Aplikacje w /var/www:${NC}"
    $SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST "ls -la /var/www/ 2>/dev/null | tail -n +4 | awk '{print \$9}' | grep -v '^$' | nl" || echo "  Brak aplikacji"

    echo ""
}

# Usuń Garden App
remove_garden_app() {
    print_warning "Ta operacja usunie CAŁĄ instalację Garden App!"
    print_info "Zostaną usunięte:"
    echo "  • Pliki aplikacji (/var/www/garden)"
    echo "  • Konfiguracja Nginx (garden-app)"
    echo "  • Proces PM2 (garden-backend)"
    echo "  • ⚠️  BAZA DANYCH i ZDJĘCIA (garden.db, uploads/)"
    echo ""

    if ! confirm "Czy na pewno chcesz usunąć Garden App?" "n"; then
        print_info "Anulowano"
        return
    fi

    echo ""
    if confirm "Czy zrobić backup bazy danych przed usunięciem?" "y"; then
        print_info "Tworzenie backupu..."
        $SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST << 'ENDSSH'
            mkdir -p /root/garden-backups
            BACKUP_DIR="/root/garden-backups/backup-$(date +%Y%m%d_%H%M%S)"
            mkdir -p $BACKUP_DIR

            if [ -f /var/www/garden/backend/garden.db ]; then
                cp /var/www/garden/backend/garden.db $BACKUP_DIR/
                echo "  ✓ Backup bazy: $BACKUP_DIR/garden.db"
            fi

            if [ -d /var/www/garden/backend/uploads ]; then
                tar -czf $BACKUP_DIR/uploads.tar.gz /var/www/garden/backend/uploads/ 2>/dev/null
                echo "  ✓ Backup uploads: $BACKUP_DIR/uploads.tar.gz"
            fi

            if [ -f /var/www/garden/backend/.env ]; then
                cp /var/www/garden/backend/.env $BACKUP_DIR/
                echo "  ✓ Backup .env: $BACKUP_DIR/.env"
            fi

            echo ""
            echo "Backup zapisany w: $BACKUP_DIR"
ENDSSH
        print_success "Backup utworzony"
    fi

    echo ""
    print_info "Usuwanie Garden App..."

    $SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST << 'ENDSSH'
        # Zatrzymaj PM2
        pm2 delete garden-backend 2>/dev/null || true
        pm2 save 2>/dev/null || true

        # Usuń konfigurację Nginx
        rm -f /etc/nginx/sites-enabled/garden-app
        rm -f /etc/nginx/sites-available/garden-app

        # Restart Nginx
        systemctl reload nginx 2>/dev/null || true

        # Usuń pliki aplikacji
        rm -rf /var/www/garden

        echo "✓ Garden App usunięta"
ENDSSH

    print_success "Garden App została całkowicie usunięta"
}

# Usuń inną konfigurację Nginx
remove_nginx_config() {
    echo ""
    print_info "Dostępne konfiguracje Nginx:"

    CONFIGS=$($SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST "ls -1 /etc/nginx/sites-enabled/ 2>/dev/null")

    if [ -z "$CONFIGS" ]; then
        print_info "Brak konfiguracji Nginx"
        return
    fi

    echo "$CONFIGS" | nl
    echo ""

    echo -ne "Podaj numer konfiguracji do usunięcia (lub 0 aby anulować): "
    read -r config_num

    if [ "$config_num" = "0" ]; then
        print_info "Anulowano"
        return
    fi

    CONFIG_NAME=$(echo "$CONFIGS" | sed -n "${config_num}p")

    if [ -z "$CONFIG_NAME" ]; then
        print_error "Nieprawidłowy numer"
        return
    fi

    print_warning "Zostanie usunięta konfiguracja: ${BOLD}${CONFIG_NAME}${NC}"

    if ! confirm "Kontynuować?" "n"; then
        print_info "Anulowano"
        return
    fi

    $SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
        # Backup konfiguracji
        cp /etc/nginx/sites-available/${CONFIG_NAME} /etc/nginx/sites-available/${CONFIG_NAME}.backup.\$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

        # Usuń linki
        rm -f /etc/nginx/sites-enabled/${CONFIG_NAME}
        rm -f /etc/nginx/sites-available/${CONFIG_NAME}

        # Test i restart Nginx
        nginx -t && systemctl reload nginx

        echo "✓ Konfiguracja ${CONFIG_NAME} usunięta"
ENDSSH

    print_success "Konfiguracja usunięta"
}

# Usuń proces PM2
remove_pm2_process() {
    echo ""
    print_info "Procesy PM2:"

    $SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST "pm2 list 2>/dev/null" || {
        print_info "Brak procesów PM2"
        return
    }

    echo ""
    echo -ne "Podaj nazwę procesu do usunięcia: "
    read -r process_name

    if [ -z "$process_name" ]; then
        print_info "Anulowano"
        return
    fi

    print_warning "Zostanie usunięty proces PM2: ${BOLD}${process_name}${NC}"

    if ! confirm "Kontynuować?" "n"; then
        print_info "Anulowano"
        return
    fi

    $SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST "pm2 delete ${process_name} && pm2 save"

    print_success "Proces usunięty"
}

# Wyczyść wszystko (reset serwera)
full_cleanup() {
    print_error "⚠️  UWAGA: PEŁNE CZYSZCZENIE SERWERA"
    print_warning "Ta operacja usunie:"
    echo "  • Wszystkie konfiguracje Nginx (oprócz default)"
    echo "  • Wszystkie procesy PM2"
    echo "  • Wszystkie aplikacje z /var/www (oprócz html)"
    echo "  • ⚠️  BAZA DANYCH Garden App zostanie usunięta!"
    echo ""

    if ! confirm "Czy NA PEWNO chcesz wykonać pełne czyszczenie?" "n"; then
        print_info "Anulowano"
        return
    fi

    echo ""
    if ! confirm "To jest NIEODWRACALNE. Ostatnia szansa - kontynuować?" "n"; then
        print_info "Anulowano"
        return
    fi

    print_info "Wykonywanie pełnego czyszczenia..."

    $SSH_CMD -p $VPS_PORT $VPS_USER@$VPS_HOST << 'ENDSSH'
        # Zatrzymaj wszystkie procesy PM2
        pm2 kill 2>/dev/null || true

        # Usuń konfiguracje Nginx (oprócz default)
        cd /etc/nginx/sites-enabled/
        for config in *; do
            if [ "$config" != "default" ]; then
                rm -f "$config"
                echo "  ✓ Usunięto: $config"
            fi
        done

        # Usuń aplikacje z /var/www (oprócz html)
        cd /var/www/
        for dir in */; do
            if [ "$dir" != "html/" ]; then
                rm -rf "$dir"
                echo "  ✓ Usunięto: $dir"
            fi
        done

        # Restart Nginx
        nginx -t && systemctl reload nginx

        echo ""
        echo "✓ Pełne czyszczenie zakończone"
ENDSSH

    print_success "Serwer wyczyszczony"
}

# Menu główne
main_menu() {
    while true; do
        echo ""
        echo -e "${BOLD}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "${BOLD}                        MENU GŁÓWNE${NC}"
        echo -e "${BOLD}═══════════════════════════════════════════════════════════════${NC}"
        echo ""
        echo "  1) Sprawdź co jest zainstalowane"
        echo "  2) Usuń Garden App (bezpiecznie z backupem)"
        echo "  3) Usuń konkretną konfigurację Nginx"
        echo "  4) Usuń proces PM2"
        echo "  5) PEŁNE CZYSZCZENIE SERWERA (wszystko)"
        echo "  0) Wyjście"
        echo ""
        echo -ne "Wybierz opcję: "
        read -r choice

        case $choice in
            1)
                check_existing_installations
                ;;
            2)
                remove_garden_app
                ;;
            3)
                remove_nginx_config
                ;;
            4)
                remove_pm2_process
                ;;
            5)
                full_cleanup
                ;;
            0)
                print_info "Do widzenia!"
                exit 0
                ;;
            *)
                print_error "Nieprawidłowa opcja"
                ;;
        esac

        echo ""
        read -p "Naciśnij Enter aby kontynuować..."
    done
}

# Main
print_header
configure_connection
main_menu
