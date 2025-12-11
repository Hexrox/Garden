# 🌱 GARDEN APP - "POZNAJ MÓJ OGRÓD" - KONCEPT FUNKCJI

## 📋 STRESZCZENIE

**Funkcja:** Publiczny, read-only profil ogrodu z możliwością łatwego udostępnienia, szczególnie na Instagram.

**URL:** `gardenapp.pl/g/username`

**Problem:** Użytkownik chce pokazać znajomym swój ogród, ale nie może udostępnić loginu (mogliby zrobić bałagan). Potrzebuje publicznej "wizytówki" ogrodu.

**Rozwiązanie:** Jedna piękna strona z wybranymi zdjęciami, statystykami i timelineem "co rośnie", którą można łatwo udostępnić linkiem.

---

## 🎯 GŁÓWNE FUNKCJE

### 1. **ROUTING: `/g/username`**
```
gardenapp.pl/g/test
gardenapp.pl/g/marysia
gardenapp.pl/g/ogrod-tomka
```
- Krótkie, ładne, łatwe do zapamiętania
- `/g/` = "garden" - intuicyjne

### 2. **ZAWARTOŚĆ STRONY**
1. **Hero Section** - cover image + nazwa ogrodu + bio
2. **Statystyki** - grządki, rośliny, kg zebranych
3. **Timeline "Co rośnie teraz"** - najbliższe zbiory z progress barami
4. **Galeria** - masonry grid wybranych zdjęć (10-20)
5. **Osiągnięcia** - badges (pierwszy zbiór, 50 roślin, etc.)
6. **O ogrodzie** - opis użytkownika (500 znaków)
7. **Footer** - CTA "Stwórz swój ogród"

### 3. **KONTROLA PRYWATNOŚCI**
- Domyślnie OFF (opt-in)
- User wybiera co pokazać (checkboxy)
- Multi-select zdjęć z galerii
- Możliwość wyłączenia w każdej chwili

### 4. **INSTAGRAM INTEGRATION**
- **Share button** - kopiuj link, social media
- **Auto-generated grafiki** do Instagram Story/Post:
  - User wybiera zdjęcie
  - Generujemy 1080x1920px grafikę z QR code + linkiem
  - Download → dodanie do Instagram
- **Open Graph meta tags** - piękne preview gdy wklejisz link

### 5. **ANALYTICS** (basic)
- Licznik wyświetleń
- Źródła ruchu (Instagram, WhatsApp, direct)
- Mobile vs Desktop

---

## 🎨 UI/UX PRINCIPLES

### **DESIGN VALUES:**
- ✨ **Delightful** - mikroanimacje, smooth transitions
- 🚀 **Fast** - instant feedback, optimistic UI
- 🧘 **Calm** - breathable white space
- 📱 **Native Feel** - gestures, haptics
- ♿ **Accessible** - keyboard nav, screen readers

### **COLOR PALETTE**
```css
/* Light Mode */
--accent-primary: #10B981;    /* Garden green */
--bg-primary: #FFFFFF;
--text-primary: #111827;

/* Dark Mode */
--accent-primary-dark: #34D399;
--bg-primary-dark: #111827;
--text-primary-dark: #F9FAFB;
```

### **TYPOGRAPHY**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
/* Scale: 12px, 14px, 16px, 18px, 20px, 24px, 30px, 36px, 48px */
```

### **SPACING**
8px grid system: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px

---

## 📱 STRONA `/g/username` - LAYOUT

```
┌────────────────────────────────┐
│ [Cover Image - full width]    │ ← Hero 100vh
│                                │
│    "Ogród Marysi" 🌱           │
│    Warzywa na balkonie         │
│                                │
│    [📤 Udostępnij]             │
├────────────────────────────────┤
│ 📊 STATYSTYKI                  │
│ ┌─────┬─────┬─────┐           │
│ │ 15  │ 42  │ 156 │           │
│ │Grząd│Rośl │ kg  │           │
│ └─────┴─────┴─────┘           │
├────────────────────────────────┤
│ 🌱 CO ROŚNIE TERAZ             │
│                                │
│ 🍅 Pomidory - Gotowe! (0 dni) │
│ ████████████████████ 100%      │
│                                │
│ 🥒 Ogórki - Za 12 dni          │
│ ███████████░░░░░░░░░ 60%       │
├────────────────────────────────┤
│ 📸 GALERIA                     │
│                                │
│ [img] [img] [img]              │ ← Masonry
│ [img] [img]                    │
│ [img] [img] [img]              │
├────────────────────────────────┤
│ 📝 O OGRODZIE                  │
│ "Uprawa warzyw na balkonie..." │
├────────────────────────────────┤
│ 🏆 OSIĄGNIĘCIA                 │
│ 🥇 Pierwszy zbiór 2024         │
│ 🌱 50 roślin posadzonych       │
├────────────────────────────────┤
│ Footer - "Stwórz swój ogród"  │
└────────────────────────────────┘
```

---

## 🛠️ PANEL KONFIGURACJI W /profile

### **Tab: "Udostępnianie"**

```
┌─────────────────────────────────────┐
│ 🌍 Publiczny Profil Ogrodu          │
├─────────────────────────────────────┤
│ ☑ Udostępnij mój ogród publicznie   │
│                                     │
│ 🔗 Twój link:                       │
│ gardenapp.pl/g/test     [Kopiuj]   │
│                                     │
│ 📝 Nazwa: [Ogród Marysi_______]    │
│                                     │
│ 📄 Bio (500 znaków):                │
│ [textarea]                          │
│                                     │
│ 📍 Lokalizacja: [Warszawa__]       │
│                                     │
│ 🖼️ Zdjęcie cover:                  │
│ [Wybierz z galerii] [Upload]       │
│                                     │
├─────────────────────────────────────┤
│ 📊 CO POKAZAĆ                       │
├─────────────────────────────────────┤
│ ☑ Statystyki                        │
│ ☑ Timeline "Co rośnie"              │
│ ☑ Galeria zdjęć                     │
│ ☑ Osiągnięcia                       │
│                                     │
├─────────────────────────────────────┤
│ 📸 GALERIA (8 wybranych)            │
├─────────────────────────────────────┤
│ [Zarządzaj zdjęciami] →             │
│                                     │
│ ☑ [img] ☑ [img] □ [img]            │
│ Wybrano: 8/50 zdjęć                 │
│                                     │
├─────────────────────────────────────┤
│ [Podgląd] [Zapisz]                  │
└─────────────────────────────────────┘
```

---

## 📤 SHARE MODAL

```
┌─────────────────────────────────┐
│ Udostępnij swój ogród 🌱        │
├─────────────────────────────────┤
│ 📋 Skopiuj link                 │
│ gardenapp.pl/g/marysia          │
│ [Kopiuj]                        │
│                                 │
│ 📸 Instagram                    │
│ ├─ Story (generuj grafikę)     │
│ └─ Post (generuj grafikę)      │
│                                 │
│ 🔗 Facebook                     │
│ 🐦 Twitter/X                    │
│ 💬 WhatsApp                     │
└─────────────────────────────────┘
```

### **Instagram Story Generator:**
1. User klika "Instagram Story"
2. Wybiera zdjęcie (najnowsze / cover / grid 4 / custom)
3. Podgląd grafiki 1080x1920px z:
   - Wybrane zdjęcie (background)
   - Overlay z tekstem "Odwiedź mój ogród"
   - Link + QR code
4. Download → user dodaje do Instagram Story

---

## 🎭 MIKROINTERAKCJE

### **1. Share Button**
- Hover: lift -2px + shadow
- Click: scale(0.95)
- Success: CheckIcon rotate + "Skopiowano!" (2s)

### **2. Scroll Reveal**
- Elementy fade in + translateY(-20px → 0)
- Stagger delay 50ms między elementami

### **3. Image Hover**
- Scale(1.05) + overlay z tytułem
- Transition 300ms ease

### **4. Stats Count Up**
- Liczby animują od 0 do wartości
- Duration 1s, easing

### **5. Progress Bars**
- Animate width 0% → 100%
- Color gradient based on status

### **6. Loading States**
- Skeleton shimmer effect
- Blur-up dla zdjęć (tiny placeholder → full res)

---

## 🚀 IMPLEMENTACJA - FAZY

### **MVP (Faza 1) - MUST HAVE:**
1. ✅ Pole `public_username` w users (unique, nullable)
2. ✅ ON/OFF switch w profilu
3. ✅ Username validation (unikalny, 3-20 znaków, alfanumeryczny)
4. ✅ Wybór 10-20 zdjęć z galerii (multi-select)
5. ✅ Publiczna strona `/g/username` z:
   - Hero (cover + tytuł + bio)
   - Statystyki (grządki, rośliny, kg)
   - Galeria masonry + lightbox
6. ✅ Share button (kopiuj link)
7. ✅ Mobile responsive + Dark mode
8. ✅ Open Graph meta tags

### **Faza 2 - SHOULD HAVE:**
9. Timeline "Co rośnie teraz" (najbliższe zbiory)
10. Badges/Osiągnięcia
11. Auto-generated OG image (dynamiczne social cards)
12. Instagram Story Generator (download grafiki)
13. Basic Analytics (views counter)

### **Faza 3 - NICE TO HAVE:**
14. Instagram Post Generator (grid 4 zdjęć)
15. QR Code na stronie
16. Custom themes (kolory)
17. Advanced Analytics (źródła ruchu)
18. PDF Export "Mój ogród 2024"

---

## 📊 BACKEND - SCHEMA

### **Tabela: users**
```sql
ALTER TABLE users ADD COLUMN public_username VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN public_profile_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN public_bio TEXT;
ALTER TABLE users ADD COLUMN public_cover_photo_id INT;
ALTER TABLE users ADD COLUMN public_show_stats BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN public_show_timeline BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN public_show_gallery BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN public_show_badges BOOLEAN DEFAULT TRUE;
```

### **Tabela: public_gallery_photos**
```sql
CREATE TABLE public_gallery_photos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  photo_id INT NOT NULL,
  display_order INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (photo_id) REFERENCES photos(id),
  UNIQUE KEY (user_id, photo_id)
);
```

### **Tabela: profile_views** (analytics)
```sql
CREATE TABLE profile_views (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  referrer VARCHAR(255),
  user_agent VARCHAR(255),
  INDEX (username, viewed_at)
);
```

### **Endpointy:**
```
GET  /api/g/:username           - Pobierz dane publicznego profilu
POST /api/profile/public        - Update ustawień publicznego profilu
POST /api/profile/public/photos - Update wybranych zdjęć
GET  /api/profile/public/stats  - Analytics (views)
POST /api/share/og-image        - Generate OG image
POST /api/share/instagram-story - Generate Instagram Story
```

---

## 🎨 FRONTEND - KOMPONENTY

### **Struktur plików:**
```
src/
├── pages/
│   ├── Profile.js (dodać tab "Udostępnianie")
│   └── PublicGarden.js (nowa - /g/:username)
├── components/
│   ├── PublicGardenHero.js
│   ├── PublicGardenStats.js
│   ├── PublicGardenTimeline.js
│   ├── PublicGardenGallery.js
│   ├── PublicGardenBadges.js
│   ├── ShareModal.js
│   └── PhotoSelector.js (multi-select z galerii)
```

---

## ♿ ACCESSIBILITY

- ✅ Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- ✅ Focus indicators (outline 3px accent color)
- ✅ ARIA labels i descriptions
- ✅ Screen reader support (role, aria-live)
- ✅ Touch targets min 44x44px
- ✅ Alt texts na wszystkich zdjęciach

---

## ⚡ PERFORMANCE

- ✅ Image optimization (WebP, lazy load, blur-up)
- ✅ Code splitting (lazy load modali)
- ✅ Virtualization dla dużych galerii
- ✅ OG images cached (1h TTL)
- ✅ Static generation dla popularnych profili
- ✅ <2s LCP (Largest Contentful Paint)

---

## 🔐 SECURITY & PRIVACY

### **Zasady:**
- Domyślnie PRYWATNE (opt-in)
- User kontroluje co jest widoczne
- Dane wrażliwe NIGDY nie pokazywane (email, telefon, dokładny adres)
- SEO Control (noindex/nofollow option)
- Disable anytime (jeden klik)

### **Reserved Usernames:**
`admin`, `api`, `g`, `garden`, `app`, `test`, `demo`, `support`, `help`

### **Content Moderation:**
- Report button na stronie profilu
- Manual review dla zgłoszeń

---

## 📈 ANALYTICS TRACKING

### **Events to track:**
- Profile view (+ referrer, user agent)
- Share button click
- Instagram Story generated
- Link copied to clipboard
- Photo lightbox opened

---

## 🎯 SUCCESS METRICS

### **MVP Success Criteria:**
- 20% użytkowników aktywuje publiczny profil
- Średnio 5+ wyświetleń na profil w miesiącu
- 50% share buttonów prowadzi do copy linku
- <3s load time (mobile)
- 0 zgłoszeń bezpieczeństwa

---

## 🌟 INSPIRACJE

### **Design:**
- **Linktree** - prostota, UX, clean layout
- **Strava** - statystyki, timeline, achievements
- **Vercel** - minimalizm, typography, spacing
- **Linear** - smooth animations, transitions
- **Spotify** - share cards, social integration

### **Features:**
- **Notion Public Pages** - prywatne → publiczne
- **About.me** - jedna strona bio
- **Carrd** - simple landing pages
- **GitHub Profile** - README, stats, contributions

---

## 💡 FUTURE IDEAS (Post-MVP)

### **Phase 3+:**
- Custom domains (mojogrod.pl → gardenapp.pl/g/test)
- Profile templates (Minimalist, Colorful, Farmhouse)
- Embedded widget dla blogów
- Collaborative gardens (wielu użytkowników, jeden profil)
- Garden tours (slideshow zdjęć)
- Social features (follow, likes, comments)
- Newsletter "Updates z ogrodu"
- PDF Export "Mój ogród 2024"

---

## ✅ CHECKLIST IMPLEMENTACJI

### **Backend:**
- [ ] Dodać kolumny do tabeli users
- [ ] Stworzyć tabelę public_gallery_photos
- [ ] Stworzyć tabelę profile_views
- [ ] Endpoint GET /api/g/:username
- [ ] Endpoint POST /api/profile/public
- [ ] Endpoint POST /api/profile/public/photos
- [ ] Username validation + uniqueness check
- [ ] Reserved usernames check

### **Frontend:**
- [ ] Tab "Udostępnianie" w /profile
- [ ] Username input z live validation
- [ ] Toggle ON/OFF
- [ ] Photo selector (multi-select)
- [ ] Cover photo picker
- [ ] Bio textarea (500 znaków)
- [ ] Checkboxy (co pokazać)
- [ ] Podgląd profilu button
- [ ] Nowa strona /g/:username
- [ ] Hero section
- [ ] Stats cards
- [ ] Timeline "Co rośnie"
- [ ] Masonry gallery
- [ ] Lightbox
- [ ] Share modal
- [ ] Copy to clipboard
- [ ] Dark mode
- [ ] Mobile responsive
- [ ] Scroll reveal animations
- [ ] Loading states
- [ ] Empty states
- [ ] Error states

### **Infrastructure:**
- [ ] Route /g/* w nginx
- [ ] Open Graph meta tags
- [ ] OG image generation (optional)
- [ ] Image optimization
- [ ] Caching strategy
- [ ] Analytics tracking

---

## 📞 KONTAKT

Generator: Claude (Anthropic)
Data: 2024-12-04
Wersja: 1.0 - MVP Concept

**Status:** ✅ Gotowe do implementacji

---

# 🚀 LET'S BUILD IT!
