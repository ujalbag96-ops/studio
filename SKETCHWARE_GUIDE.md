# 📱 CampusHub: Industrial Sketchware Build Guide (Asset Manager Method)

Bhai, agar aap CampusHub ko **Sketchware** ke zariye APK banana chahte hain, toh aapko **Asset Manager** ka sahi istemal karna hoga kyunki yeh ek modern Next.js project hai. Niche diye gaye steps follow karke aap pro APK generate kar sakte hain.

## 🚀 Step 1: Web Static Export
Sabse pehle project ke static assets (HTML/JS/CSS) ko ek folder mein jama karein:
```bash
npm install
npm run build
```
*Yeh command `out` folder generate karegi jisme saari coding files (index.html, _next, etc.) milengi.*

## 📦 Step 2: ZIP & Transfer
1. `out` folder ke andar jitni bhi files hain (saari folders aur index.html), unhe select karke ek **zip** banayein.
2. Is zip ko apne mobile mein bhej dein aur extract kar lein.

## 🛠️ Step 3: Sketchware Asset Manager (As per your Screenshot)
1. **Asset Manager Kholien**: Sketchware project ke menu mein jayein aur **Asset Manager** par click karein.
2. **Files Import Karein**:
   - Niche (+) icon par click karein.
   - Apne extract kiye huye `out` folder mein jayein.
   - **Important**: `index.html`, `404.html`, aur saare sub-folders (like `_next`) ke andar ki files ko import karein.
   - *Note: Sketchware Asset Manager folders ko directly handle nahi karta, isliye aapko files ko "assets" ki root directory mein ya manually paths set karke upload karna hoga.*

## 📡 Step 4: WebView Logic (OnCreate)
1. **WebView Component**: Ek `WebView` component screen par add karein.
2. **Logic Settings**:
   - `WebView` select karein.
   - Load URL block use karein: `file:///android_asset/index.html`
   - **Settings**: `JavaScript Enabled` ko **True** karein aur `DOM Storage Enabled` ko **True** karein.

## 📡 Step 5: Live URL Method (Recommended)
Agar aapko Asset Manager mein files upload karna mushkil lag raha hai:
1. App ko **Vercel** ya **Firebase App Hosting** par deploy karein.
2. Sketchware WebView mein direct wo link load karein: `loadUrl("https://your-campushub-link.vercel.app")`.
3. Isse aapko bar-bar Asset Manager update nahi karna padega.

---
**Tech Reminder**: Yeh app Next.js 15 par based hai, isliye **Capacitor (Android Studio)** build sabse fast aur secure hai. Sketchware sirf UI testing ke liye best hai.
