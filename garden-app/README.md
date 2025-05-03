
# Garden App – Zarządzanie Uprawami

Prosta aplikacja internetowa do zarządzania poletkami i grządkami, stworzona z myślą o ogrodnikach i działkowcach. Umożliwia opisanie poletka, zarządzanie rzędami z roślinami, dodawanie zdjęć i informacji o opryskach (środek, data, karencja).

---

## Funkcjonalności

- Dodawanie i przeglądanie poletek
- Edytowanie liczby rzędów w poletku
- Dodawanie roślin do grządek
- Zapisywanie informacji o opryskach (środek, data, czas karencji)
- Miniaturki zdjęć dla grządek

---

## Stos technologiczny

- **Frontend:** React + Tailwind CSS
- **Backend:** Node.js + Express
- **Baza danych:** SQLite

---

## Uruchomienie projektu lokalnie

### 1. Klonowanie repozytorium

```bash
git clone https://github.com/TWOJA_NAZWA/TWOJE_REPOZYTORIUM.git
cd garden-app
```

### 2. Backend (Express + SQLite)

```bash
cd backend
npm install
node index.js
```

Aplikacja backendowa dostępna pod: `http://localhost:3001`

### 3. Frontend (React + Tailwind)

W nowym terminalu:

```bash
cd frontend
npm install
npm start
```

Frontend dostępny pod: `http://localhost:3000`

---

## Przykładowy widok

- Strona główna: lista poletek z opisami
- Widok szczegółowy: rzędy z roślinami, zdjęciami i informacjami o opryskach

---

## Plany rozwoju

- Logowanie użytkowników
- Przypomnienia o końcu okresu karencji
- Historia oprysków
- Eksport danych

---

## Licencja

MIT – możesz używać i modyfikować swobodnie.
