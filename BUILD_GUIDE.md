# 📱 CampusHub: Android Build Guide

Follow these industrial steps to generate your deployable APK file.

## 🛠️ Prerequisites
1. **Node.js**: Installed on your system.
2. **Android Studio**: Installed and configured with SDK.

## 🏃 Build Sequence

### 1. Synchronize Environment
Open your terminal in the project root and run:
```bash
npm install
```

### 2. Generate Static Production Build
This step converts the Next.js code into static assets that Android can understand.
```bash
npm run mobile:build
```

### 3. Open Android Project
This will launch Android Studio with your mobile project.
```bash
npm run mobile:android
```

### 4. Compile APK
Inside Android Studio:
1. Wait for Gradle to finish syncing.
2. Go to **Build** menu (top).
3. Select **Build Bundle(s) / APK(s)** -> **Build APK(s)**.
4. A popup will appear at the bottom right when finished. Click **Locate**.
5. Your APK is in: `android/app/build/outputs/apk/debug/app-debug.apk`

---
**Note**: For Google Play Store, use **Generate Signed Bundle / APK** instead of Step 4.