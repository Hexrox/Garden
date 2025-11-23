# 🌱 Garden App v2.0 – Zarządzanie Uprawami

Kompleksowa aplikacja internetowa do zarządzania poletkami, grządkami i uprawami, stworzona z myślą o ogrodnikach i działkowcach. Umożliwia pełne zarządzanie uprawami, śledzenie oprysków z okresami karencji, automatyczne przypomnienia i eksport danych.

![Version](https://img.shields.io/badge/version-2.0.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## ✨ Nowe funkcje w wersji 2.0

### ✅ Zaimplementowane funkcje

- **🔐 System uwierzytelniania** - Bezpieczne logowanie z JWT
- **👤 Zarządzanie użytkownikami** - Rejestracja, logowanie, sesje
- **🌱 Pełne CRUD dla poletek** - Dodawanie, edycja, usuwanie, przeglądanie
- **🌿 Zarządzanie grządkami** - Wielorzędowe grządki z roślinami
- **💉 Historia oprysków** - Kompletna historia wszystkich zabiegów
- **⏰ System przypomnień** - Automatyczne przypomnienia o końcu karencji
- **📊 Dashboard ze statystykami** - Przegląd ogrodu w jednym miejscu
- **📤 Eksport danych** - CSV i JSON dla poletek i oprysków
- **📸 Upload zdjęć** - Dla poletek i grządek
- **🔔 Aktywne opryski** - Widok aktualnie trwających okresów karencji
- **✅ Walidacja danych** - Frontend i backend validation
- **🎨 Nowoczesny UI** - Tailwind CSS z responsywnym designem

---

## 🏗️ Architektura Techniczna

### Backend
- **Node.js + Express** - RESTful API
- **SQLite** - Lekka, plikowa baza danych
- **JWT** - Bezpieczna autoryzacja
- **Multer** - Upload plików/zdjęć
- **Express Validator** - Walidacja danych
- **Bcrypt** - Hashowanie haseł

### Frontend
- **React 18** - Nowoczesna biblioteka UI
- **React Router v6** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS 3** - Utility-first CSS framework
- **Context API** - State management

### Baza danych
- **5 tabel**: users, plots, beds, spray_history, reminders
- **Relacje**: Foreign keys z CASCADE
- **Indeksy**: Automatyczne dla kluczy głównych

---

## 📦 Struktura Projektu

```
garden-app/
├── backend/
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication middleware
│   │   └── upload.js            # Multer file upload config
│   ├── routes/
│   │   ├── auth.js              # Login/Register endpoints
│   │   ├── plots.js             # Plots CRUD
│   │   ├── beds.js              # Beds CRUD
│   │   ├── sprays.js            # Spray history + reminders
│   │   ├── reminders.js         # Reminders management
│   │   └── export.js            # Data export (CSV/JSON)
│   ├── db.js                    # SQLite database setup
│   ├── index.js                 # Main Express server
│   ├── package.json             # Backend dependencies
│   ├── .env                     # Environment variables
│   └── .env.example             # Example env config
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.js        # Main layout with navigation
│   │   ├── context/
│   │   │   └── AuthContext.js   # Authentication context
│   │   ├── pages/
│   │   │   ├── Login.js         # Login page
│   │   │   ├── Register.js      # Registration page
│   │   │   ├── Dashboard.js     # Main dashboard
│   │   │   ├── PlotsList.js     # Plots list view
│   │   │   ├── PlotDetail.js    # Single plot with beds
│   │   │   ├── SprayHistory.js  # Spray history table
│   │   │   ├── Reminders.js     # Active reminders
│   │   │   └── Export.js        # Data export page
│   │   ├── App.js               # Main app with routing
│   │   ├── index.js             # React entry point
│   │   └── index.css            # Tailwind imports
│   ├── package.json             # Frontend dependencies
│   └── tailwind.config.js       # Tailwind configuration
└── README.md                    # This file
```

---

## 🚀 Uruchomienie projektu lokalnie

### Wymagania
- **Node.js** >= 14.x
- **npm** >= 6.x

### 1. Klonowanie repozytorium

```bash
git clone https://github.com/Hexrox/Garden.git
cd Garden/garden-app
```

### 2. Backend Setup

```bash
cd backend
npm install
```

**Konfiguracja środowiska** (opcjonalnie):
```bash
cp .env.example .env
# Edytuj .env i ustaw własny JWT_SECRET
```

**Uruchomienie:**
```bash
npm start
# lub dla development z auto-reload:
npm run dev
```

Backend dostępny pod: **http://localhost:3001**

### 3. Frontend Setup

W **nowym terminalu**:

```bash
cd frontend
npm install
npm start
```

Frontend dostępny pod: **http://localhost:3000**

---

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
Rejestracja nowego użytkownika
```json
{
  "username": "jan",
  "email": "jan@example.com",
  "password": "haslo123"
}
```

#### POST `/api/auth/login`
Logowanie użytkownika
```json
{
  "email": "jan@example.com",
  "password": "haslo123"
}
```

### Plots Endpoints (wymagają autoryzacji)

- `GET /api/plots` - Lista wszystkich poletek użytkownika
- `GET /api/plots/:id` - Szczegóły pojedynczego poletka
- `GET /api/plots/:id/details` - Poletko z grządkami i opryskimi
- `POST /api/plots` - Dodaj nowe poletko (multipart/form-data)
- `PUT /api/plots/:id` - Aktualizuj poletko
- `DELETE /api/plots/:id` - Usuń poletko

### Beds Endpoints

- `GET /api/plots/:plotId/beds` - Grządki dla danego poletka
- `GET /api/beds/:id` - Szczegóły grządki
- `POST /api/plots/:plotId/beds` - Dodaj grządkę
- `PUT /api/beds/:id` - Aktualizuj grządkę
- `DELETE /api/beds/:id` - Usuń grządkę

### Spray History Endpoints

- `GET /api/beds/:bedId/sprays` - Opryski dla grządki
- `GET /api/sprays/history` - Cała historia oprysków użytkownika
- `GET /api/sprays/active` - Aktywne opryski (w karencji)
- `POST /api/beds/:bedId/sprays` - Dodaj oprysk
- `PUT /api/sprays/:id` - Aktualizuj oprysk
- `DELETE /api/sprays/:id` - Usuń oprysk

### Reminders Endpoints

- `GET /api/reminders` - Aktywne przypomnienia
- `GET /api/reminders/upcoming` - Nadchodzące przypomnienia (7 dni)
- `PUT /api/reminders/:id/read` - Oznacz jako przeczytane
- `PUT /api/reminders/read-all` - Oznacz wszystkie jako przeczytane
- `DELETE /api/reminders/:id` - Usuń przypomnienie

### Export Endpoints

- `GET /api/export/plots/json` - Eksport poletek (JSON)
- `GET /api/export/plots/csv` - Eksport poletek (CSV)
- `GET /api/export/sprays/json` - Eksport oprysków (JSON)
- `GET /api/export/sprays/csv` - Eksport oprysków (CSV)
- `GET /api/export/complete/json` - Pełny backup (JSON)

**Uwaga:** Wszystkie endpointy poza `/api/auth/*` wymagają nagłówka:
```
Authorization: Bearer <jwt_token>
```

---

## 📊 Struktura Bazy Danych

### Tabela `users`
```sql
id, username, email, password, created_at
```

### Tabela `plots`
```sql
id, user_id, name, description, image_path, created_at
```

### Tabela `beds`
```sql
id, plot_id, row_number, plant_name, plant_variety,
planted_date, note, image_path, created_at
```

### Tabela `spray_history`
```sql
id, bed_id, spray_name, spray_type, spray_date,
withdrawal_period, safe_harvest_date, dosage,
weather_conditions, note, created_at
```

### Tabela `reminders`
```sql
id, user_id, spray_id, bed_id, reminder_date,
is_read, message, created_at
```

---

## 🎯 Przykładowy przepływ użytkownika

1. **Rejestracja/Logowanie** - Utwórz konto i zaloguj się
2. **Dashboard** - Zobacz przegląd swojego ogrodu
3. **Dodaj poletko** - Utwórz nowe poletko z opisem i zdjęciem
4. **Dodaj grządki** - W szczegółach poletka dodaj rzędy z roślinami
5. **Zapisz oprysk** - Dodaj informację o oprysku z okresem karencji
6. **Otrzymaj przypomnienie** - System automatycznie utworzy przypomnienie
7. **Sprawdź status** - Zobacz aktywne opryski i bezpieczne daty zbioru
8. **Eksportuj dane** - Pobierz backup danych w JSON lub CSV

---

## 🔒 Bezpieczeństwo

- **Hashowanie haseł** - Bcrypt z salt rounds = 10
- **JWT Tokens** - Expires in 7 days (konfigurowalne)
- **Walidacja danych** - Express Validator na backendzie
- **SQL Injection Protection** - Prepared statements w SQLite
- **File Upload Validation** - Tylko obrazy, max 5MB
- **CORS** - Skonfigurowane dla localhost (dostosuj dla produkcji)

---

## 🐛 Znane ograniczenia i TODO

- [ ] Brak pagination dla dużych list
- [ ] Brak edycji profilu użytkownika
- [ ] Brak resetu hasła
- [ ] Brak mobilnej aplikacji (rozważ PWA)
- [ ] Brak testów jednostkowych
- [ ] Brak Docker configuration
- [ ] Brak CI/CD pipeline

---

## 📝 Changelog

### Version 2.0.0 (2024)

**Dodane:**
- ✅ System uwierzytelniania JWT
- ✅ Pełne CRUD dla poletek i grządek
- ✅ Historia oprysków
- ✅ Automatyczne przypomnienia o karencji
- ✅ Eksport danych (CSV/JSON)
- ✅ Dashboard ze statystykami
- ✅ React Router z protected routes
- ✅ Upload zdjęć
- ✅ Walidacja danych
- ✅ Responsywny design

**Naprawione:**
- ✅ Brak package.json w backendzie
- ✅ Niekompletne API endpoints
- ✅ Brak obsługi błędów
- ✅ Hardcoded URLs

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 Licencja

MIT – możesz używać i modyfikować swobodnie.

---

## 👨‍💻 Autor

Garden App v2.0

---

## 📞 Support

Jeśli masz pytania lub problemy, otwórz issue na GitHubie.

---

**Miłego ogrodnictwa! 🌻🥕🍅**
