# 📱 CampusHub: Industrial Sketchware Build Guide (WebView Method)

Bhai, agar aap CampusHub ko **Sketchware** ke zariye APK banana chahte hain, toh aapko **WebView** method use karna hoga kyunki ye ek modern Next.js project hai. Niche diye gaye steps follow karke aap pro APK generate kar sakte hain.

## 🚀 Step 1: Web Static Export
Sabse pehle project ke static assets (HTML/JS/CSS) ko ek folder mein jama karein:
```bash
npm install
npm run build
```
*Ye command `out` folder generate karegi jisme saari coding files asaan format mein milengi.*

## 📦 Step 2: Download Zip
1. `out` folder ko zip karke apne mobile par bhej dein.
2. Sketchware kholien aur ek naya project banayein.

## 🛠️ Step 3: Sketchware Setup
1. **WebView Component**: Ek `WebView` component screen par add karein.
2. **Assets Upload**: Zip file ke andar ke `out` folder ke saare content ko Sketchware ke `Assets` folder mein upload karein.
3. **Logic (OnCreate)**:
   - `WebView` select karein.
   - Load URL block use karein: `file:///android_asset/index.html`
   - **Important**: WebView Settings mein `JavaScript Enabled` ko **True** karein.

## 📡 Step 4: Live URL Method (Recommended)
Agar aap bar-bar assets upload nahi karna chahte:
1. App ko **Vercel** ya **Firebase App Hosting** par deploy karein.
2. Sketchware WebView mein direct wo link load karein: `loadUrl("https://your-campushub-link.vercel.app")`.

## ⚠️ Security Note
Sketchware standard storage use karta hai. Industrial secure payments ke liye hamesha **Firebase Security Rules** (jo pehle se integrated hain) par depend rahein.

---
**Tech Reminder**: Yeh app Next.js 15 par based hai, isliye Capacitor (Android Studio) build sabse fast aur secure hai. Sketchware sirf beginner learning ke liye best hai.