# 📱 CampusHub: Industrial Android APK Build Guide (Capacitor.js)

Bhai, CampusHub ek **Next.js + Capacitor.js** powered application hai (Flutter nahi). Niche diye gaye steps follow karke aap industrial-grade APK generate kar sakte hain.

## 🛠️ Prerequisites
1. **Node.js**: Installed (v20+ recommended).
2. **Android Studio**: Installed with SDK and Build Tools.
3. **Java (JDK)**: Version 17 recommended for Android Gradle builds.

## 🏃 Build Sequence (Step-by-Step)

### 1. Web Production Build
Pehle Next.js code ko static assets mein convert karein:
```bash
npm install
npm run mobile:build
```
*Ye command `next build` chalati hai aur output ko `out` folder se `android` directory mein sync karti hai.*

### 2. Initialize Android Platform (If not already present)
Agar aapke folder mein `android` directory nahi hai, toh ise ek baar run karein:
```bash
npx cap add android
```

### 3. Open in Android Studio
Project ko Android Studio mein open karein:
```bash
npm run mobile:android
```

### 4. Generate APK inside Android Studio
Android Studio khulne ke baad:
1. Gradle sync khatam hone ka wait karein (niche progress bar dekhein).
2. Top menu mein **Build** par jayein.
3. **Build Bundle(s) / APK(s)** select karein -> **Build APK(s)** click karein.
4. Build khatam hone par niche right corner mein **Locate** par click karein.
5. Aapka APK file yahan milega: `android/app/build/outputs/apk/debug/app-debug.apk`

---
## 🚀 Production Deployment (Play Store)
Google Play Store ke liye Release APK banate waqt:
1. **Build** -> **Generate Signed Bundle / APK** select karein.
2. Apna `.jks` keystore create karein ya use karein.
3. Build variant **release** select karein.

---
**Tech Stack Reminder**: 
- Framework: Next.js 15 (React)
- Engine: Capacitor.js
- Language: TypeScript / JavaScript
- Database: Firebase Firestore
