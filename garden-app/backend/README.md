# 🌱 Garden App

Aplikacja do zarządzania ogrodem warzywnym dla polskich ogrodników.

## 🚀 Funkcje

### 📊 Zarządzanie poletkami
- Tworzenie wielu poletków z opisem i zdjęciami
- Podział poletek na rzędy z różnymi roślinami
- Historia upraw dla każdego rzędu

### 🌿 Baza roślin
- Gotowa baza warzyw z terminami dojrzewania
- Dodawanie własnych odmian
- Kategorie: warzywa, kwiaty, zioła

### 📅 Kalendarz księżycowy
- Fazy księżyca dla każdego dnia
- **Sezonowe zalecenia** dostosowane do polskiego klimatu (USDA 6-7)
- Inteligentne podpowiedzi: co siać w lutym w domu, co po 15 maja w gruncie, kiedy okrywać na zimę

### 🌾 Zadania ogrodnicze
- Automatyczne generowanie zadań na podstawie upraw
- Przypomnienia o zbiorach (dni do dojrzewania + data sadzenia)
- Przypomnienia o opryskach (karencja + termin bezpiecznych zbiorów)
- System snooze/dismiss dla zadań automatycznych

### 💧 Inteligentne podlewanie
- Rekomendacje podlewania na podstawie pogody
- Integracja z OpenWeather API
- Uwzględnienie opadów i prognozy

### 🌤️ Pogoda
- Aktualna pogoda dla lokalizacji użytkownika
- Prognoza 5-dniowa
- Statystyki miesięczne (temperatura, opady)
- Porady dostosowane do warunków (np. "Nie podlewaj - pada deszcz")

### 🧪 Środki ochrony roślin
- Historia oprysków z datami
- Automatyczne obliczanie karencji
- Przypomnienia o bezpiecznych zbiorach
- Warunki pogodowe przy oprysku

### 📸 Galeria zdjęć
- Zdjęcia poletków i roślin
- Historia wzrostu roślin w czasie
- Obsługa wielu zdjęć na roślinie

### 🔐 Bezpieczeństwo
- Autoryzacja JWT
- Rate limiting (ochrona przed atakami)
- CORS + CSP headers
- Szyfrowane hasła (bcrypt)

## 🛠️ Technologie

**Backend:**
- Node.js + Express
- SQLite (lokalna baza danych)
- OpenWeather API

**Frontend:**
- React (Create React App)
- TailwindCSS
- Axios
- Lucide Icons

**Deployment:**
- PM2 (process manager)
- Nginx (reverse proxy + SSL)
- Let's Encrypt (certyfikaty SSL)

## 📦 Instalacja

\`\`\`bash
# Backend
cd garden-app/backend
npm install
node index.js

# Frontend
cd garden-app/frontend
npm install
npm start
\`\`\`

## 🌍 Produkcja

Aplikacja działa na: **https://gardenapp.pl**

## 📄 Licencja

Projekt prywatny.
