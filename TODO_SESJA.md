# TODO - Kontynuacja sesji

## 1. PROFIL FOTO (Wariant A - Glass Card Hero) ✅ Backend gotowy

### Backend ✅ ZROBIONE
- ✅ db.js: kolumna profile_photo TEXT
- ✅ publicProfile.js: POST /api/profile/photo (upload)
- ✅ publicProfile.js: DELETE /api/profile/photo
- ✅ publicProfile.js: GET /api/g/:username zwraca profilePhoto

### Frontend 🔄 DO ZROBIENIA
1. **Profile.js** (~/garden-app/frontend/src/pages/Profile.js)
   - Dodać sekcję upload zdjęcia profilowego (podobnie jak coverPhoto linii 848-883)
   - Okrągły preview avatara zamiast prostokątnego
   - Upload FormData do POST /api/profile/photo
   - Delete button → DELETE /api/profile/photo

2. **PublicProfile.js** (~/garden-app/frontend/src/pages/PublicProfile.js)
   - Implementować Wariant A (Glass Card Hero):
     ```
     Hero section (h-[450px] md:h-[600px])
     └─ Gradient overlay
     └─ Glass Card (backdrop-blur-sm, bg-white/10, rounded-2xl)
        ├─ Avatar (okrągły, 96x96px md:128x128px)
        ├─ Username, bio
        ├─ Stats badges (inline, zamiast osobnych kart)
        └─ Action buttons (share, link)
     ```
   - Avatar: profile.profilePhoto ? `/${profile.profilePhoto}` : default avatar
   - Usunąć duplikaty stats cards z poniżej hero

### Deploy
```bash
rsync -avz garden-app/frontend/src/pages/ root@8.209.82.14:/root/garden/garden-app/frontend/src/pages/
ssh root@8.209.82.14 "cd /root/garden/garden-app/frontend && REACT_APP_API_URL=https://gardenapp.pl GENERATE_SOURCEMAP=false npm run build && cp -r build/* /var/www/garden-app/"
```

---

## 2. ZBIORY - FOTO + NOTATKI (uniwersalne dla warzyw i kwiatów) 🆕

### Problem
- yield_amount REQUIRED - nie działa dla kwiatów/ozdobnych
- Brak miejsca na zdjęcia zbiorów
- Brak opisu jakościowego (kolor, zapach, jakość)

### Rozwiązanie
Jak robią konkurencja (Gardenize, GrowVeg, Garden Tags):
- Wizualna dokumentacja główna
- Zbiór = wydarzenie, nie tylko waga
- Galeria zbiorów w timeline

### Backend
1. **db.js** - ALTER TABLE:
   ```sql
   ALTER TABLE beds ADD COLUMN harvest_photo TEXT;
   ALTER TABLE beds ADD COLUMN harvest_notes TEXT;
   ```

### Frontend
1. **HarvestModal.js** (~/garden-app/frontend/src/components/modals/HarvestModal.js)
   - Usunąć `required` z yield_amount (linia 24, 100)
   - Zmienić walidację: `if (!formData.yield_amount && !formData.harvest_photo)`
   - Dodać upload zdjęcia zbioru (multer /api/beds/:id/photo)
   - Dodać textarea `harvest_notes` (200 znaków, "Opis zbioru, jakość, uwagi...")
   - Layout: Data | Foto | Waga (opcjonalnie) | Notatki | Opcje

2. **PublicProfile.js** - Timeline
   - Pokazać harvest_photo obok bed.image_path jeśli istnieje
   - Wyświetlić harvest_notes pod nazwą rośliny
   - Badge "🌾 Zebrano" z harvest_photo jako thumbnail

### Deploy
```bash
# Backend
rsync -avz garden-app/backend/db.js root@8.209.82.14:/root/garden/garden-app/backend/
ssh root@8.209.82.14 "cd /root/garden/garden-app/backend && pm2 restart garden-api"

# Frontend
rsync -avz garden-app/frontend/src/ root@8.209.82.14:/root/garden/garden-app/frontend/src/
ssh root@8.209.82.14 "cd /root/garden/garden-app/frontend && REACT_APP_API_URL=https://gardenapp.pl GENERATE_SOURCEMAP=false npm run build && cp -r build/* /var/www/garden-app/"
```

---

## Kolejność wdrożenia
1. ✅ Profil foto backend (GOTOWE)
2. 🔄 Profil foto frontend (Profile.js + PublicProfile.js)
3. 🔄 Deploy profil foto
4. ⏳ Zbiory backend (ALTER TABLE)
5. ⏳ Zbiory frontend (HarvestModal + timeline)
6. ⏳ Deploy zbiory

---

## Notatki techniczne

### Profile Photo Upload Pattern (z Profile.js)
```javascript
const handleSelectCoverPhoto = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const res = await axios.post('/api/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUser({ ...user, profile_photo: res.data.photoPath });
    } catch (err) {
      alert(err.response?.data?.error || 'Błąd');
    }
  };
  input.click();
};
```

### Glass Card Hero (Wariant A)
```jsx
<div className="relative min-h-[450px] md:min-h-[600px] bg-gradient-to-br from-green-500 to-emerald-600">
  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

  <div className="relative z-10 container mx-auto px-4 pt-24 flex flex-col items-center">
    {/* Glass Card */}
    <div className="backdrop-blur-sm bg-white/10 dark:bg-black/20 rounded-2xl p-6 md:p-8 border border-white/20 shadow-2xl max-w-2xl w-full">
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Avatar */}
        <img
          src={profile.profilePhoto ? `/${profile.profilePhoto}` : '/default-avatar.png'}
          alt={profile.username}
          className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white/30 object-cover"
        />

        {/* Info */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {profile.username}
          </h1>
          {profile.bio && (
            <p className="text-white/90 text-lg mb-4">{profile.bio}</p>
          )}

          {/* Stats Inline */}
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <span className="text-white font-semibold">🌱 {profile.stats.plots} grządek</span>
            </div>
            {/* ... more stats */}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```
