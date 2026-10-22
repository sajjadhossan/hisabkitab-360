const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SOMITI_DIR = path.resolve(ROOT_DIR, 'somiti-360');

console.log('📱 Configuring Multi-Platform Binaries for Somiti 360...');

// Helper to copy directory recursively
function copyDir(src, dest, ignore = []) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (ignore.includes(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, ignore);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 1. Copy Android project
const srcAndroid = path.join(ROOT_DIR, 'android');
const destAndroid = path.join(SOMITI_DIR, 'android');
if (fs.existsSync(srcAndroid)) {
  copyDir(srcAndroid, destAndroid, ['.gradle', 'build', 'hs_err_pid22536.log', 'local.properties']);
  
  // Clean public assets in destAndroid
  const publicAssets = path.join(destAndroid, 'app', 'src', 'main', 'assets', 'public');
  if (fs.existsSync(publicAssets)) {
    fs.rmSync(publicAssets, { recursive: true, force: true });
  }
  fs.mkdirSync(publicAssets, { recursive: true });

  // Update build.gradle in android/app
  const buildGradlePath = path.join(destAndroid, 'app', 'build.gradle');
  if (fs.existsSync(buildGradlePath)) {
    let bg = fs.readFileSync(buildGradlePath, 'utf8');
    bg = bg.replace(/com\.hisabkitab360\.app/g, 'com.somiti360.app');
    bg = bg.replace(/versionCode \d+/g, 'versionCode 1');
    bg = bg.replace(/versionName "[^"]+"/g, 'versionName "1.0.0"');
    fs.writeFileSync(buildGradlePath, bg, 'utf8');
  }

  // Update strings.xml
  const stringsPath = path.join(destAndroid, 'app', 'src', 'main', 'res', 'values', 'strings.xml');
  if (fs.existsSync(stringsPath)) {
    let str = fs.readFileSync(stringsPath, 'utf8');
    str = str.replace(/HisabKitab 360/g, 'Somiti 360');
    str = str.replace(/com\.hisabkitab360\.app/g, 'com.somiti360.app');
    fs.writeFileSync(stringsPath, str, 'utf8');
  }

  // Rename java package directory
  const oldJavaDir = path.join(destAndroid, 'app', 'src', 'main', 'java', 'com', 'hisabkitab360', 'app');
  const newJavaDir = path.join(destAndroid, 'app', 'src', 'main', 'java', 'com', 'somiti360', 'app');
  if (fs.existsSync(oldJavaDir)) {
    fs.mkdirSync(newJavaDir, { recursive: true });
    const mainActivitySrc = path.join(oldJavaDir, 'MainActivity.java');
    if (fs.existsSync(mainActivitySrc)) {
      let ma = fs.readFileSync(mainActivitySrc, 'utf8');
      ma = ma.replace(/package com\.hisabkitab360\.app;/g, 'package com.somiti360.app;');
      fs.writeFileSync(path.join(newJavaDir, 'MainActivity.java'), ma, 'utf8');
    }
    fs.rmSync(path.join(destAndroid, 'app', 'src', 'main', 'java', 'com', 'hisabkitab360'), { recursive: true, force: true });
  }

  console.log(' ✓ Android Project structure configured for Somiti 360');
}

// 2. Update package.json for Somiti 360 with Electron and Multi-platform build specs
const pkgPath = path.join(SOMITI_DIR, 'package.json');
const pkg = {
  name: "somiti-360",
  type: "module",
  private: true,
  version: "1.0.0",
  description: "সমিতি ৩৬০ - সমিতি, সমবায় সংস্থা ও ক্ষুদ্রঋণ সঞ্চয় ব্যবস্থাপনা প্ল্যাটফর্ম",
  main: "electron/main.cjs",
  scripts: {
    dev: "vite",
    host: "vite --host 0.0.0.0 --port 5174",
    build: "vite build",
    preview: "vite preview",
    "preview:host": "vite preview --host 0.0.0.0 --port 5174",
    "electron:start": "electron .",
    "electron:build": "vite build && electron-builder --win",
    "electron:build:mac": "vite build && electron-builder --mac --x64 --arm64"
  },
  dependencies: {
    "@capacitor/android": "^8.5.2",
    "@capacitor/app": "^8.1.2",
    "@capacitor/cli": "^8.5.2",
    "@capacitor/core": "^8.5.2",
    "@capacitor/haptics": "^8.0.2",
    "@capacitor/keyboard": "^8.0.6",
    "@capacitor/share": "^8.0.3",
    "@capacitor/splash-screen": "^8.0.2",
    "@capacitor/status-bar": "^8.0.4",
    "@supabase/supabase-js": "^2.117.2",
    "canvas-confetti": "^1.9.4",
    "lucide-react": "^1.48.0",
    "qrcode": "^1.5.4",
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "xlsx": "^0.18.5"
  },
  devDependencies: {
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.7",
    "@vitejs/plugin-react": "^6.1.1",
    "electron": "^44.5.1",
    "electron-builder": "^26.15.3",
    "vite": "^8.3.0"
  },
  build: {
    appId: "com.somiti360.desktop",
    productName: "Somiti 360",
    directories: {
      output: "dist-electron"
    },
    win: {
      target: [
        "nsis",
        "portable"
      ]
    },
    mac: {
      category: "public.app-category.finance",
      target: [
        {
          target: "dmg",
          arch: ["x64", "arm64"]
        },
        {
          target: "zip",
          arch: ["x64", "arm64"]
        }
      ],
      hardenedRuntime: false,
      gatekeeperAssess: false,
      identity: null
    },
    files: [
      "dist/**/*",
      "electron/**/*",
      "package.json"
    ]
  }
};
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
console.log(' ✓ package.json updated with Multi-Platform Electron and Capacitor definitions');

// 3. Create .github/workflows/build-and-release.yml in Somiti 360
const wfDir = path.join(SOMITI_DIR, '.github', 'workflows');
fs.mkdirSync(wfDir, { recursive: true });

const workflowContent = `name: Build Somiti 360 Multi-Platform Apps

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build-android:
    name: 📱 Build Android APK
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Set up Java JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'

      - name: Install Android SDK 36 Platform
        run: |
          echo y | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --install "platforms;android-36" || true

      - name: Install Dependencies
        run: npm ci || npm install

      - name: Build Web Production Assets
        run: npm run build

      - name: Copy Web Assets into Android Project
        run: |
          mkdir -p android/app/src/main/assets/public
          rm -rf android/app/src/main/assets/public/*
          cp -r dist/* android/app/src/main/assets/public/
          cp capacitor.config.json android/app/src/main/assets/
          chmod +x android/gradlew
          mkdir -p ~/.android
          cp android/app/debug.keystore ~/.android/debug.keystore || true

      - name: Build Android APK
        run: |
          cd android
          ./gradlew assembleDebug --no-daemon --stacktrace > gradle_build.log 2>&1 || (tail -n 60 gradle_build.log && exit 1)

      - name: Prepare APK Asset
        run: |
          mkdir -p artifacts
          cp android/app/build/outputs/apk/debug/app-debug.apk artifacts/Somiti-360.apk

      - name: Backup Upload Artifact
        uses: actions/upload-artifact@v4
        continue-on-error: true
        with:
          name: Somiti-360-Android-APK
          path: artifacts/Somiti-360.apk
          retention-days: 1

      - name: Publish Android APK Direct to GitHub Release
        uses: softprops/action-gh-release@v2
        if: always() && !cancelled()
        with:
          tag_name: latest
          name: "Somiti 360 Latest Multi-Platform Release"
          body: |
            ### সমিতি ৩৬০ (Somiti 360) সর্বজনীন রিলিজ প্যাকেজ
            - 📱 **Android Mobile APK:** \`Somiti-360.apk\` (স্মার্টফোনে সরাসরি ডাউনলোড ও ইন্সটল করুন)
            - 💻 **Windows Desktop Setup:** \`Somiti-360-Setup.exe\` (উইন্ডোজ পিসি অ্যাপ ইন্সটলার)
            - ⚡ **Windows Portable:** \`Somiti-360-PC.exe\` (সরাসরি ক্লিক করে চলার মতো পোর্টেবল অ্যাপ)
            - 🍏 **MacBook Intel x64:** \`Somiti-360-Mac-Intel-x64.dmg\` (ইন্টেল ম্যাকবুক অ্যাপ)
            - 🍏 **MacBook Apple Silicon M-Series:** \`Somiti-360-Mac-AppleSilicon-M-Series-arm64.dmg\` (M1/M2/M3/M4 ম্যাকবুক অ্যাপ)
          files: artifacts/Somiti-360.apk
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}

  build-windows:
    name: 💻 Build Windows PC Desktop App
    runs-on: windows-latest
    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci || npm install

      - name: Build Web Assets
        run: npm run build

      - name: Package Native Windows Electron App & Launcher
        shell: powershell
        run: |
          New-Item -ItemType Directory -Force -Path artifacts
          try {
            npx electron-builder --win --publish never
            if (Test-Path "dist-electron\\*.exe") {
              Copy-Item "dist-electron\\*.exe" "artifacts\\Somiti-360-Setup.exe" -Force
            }
          } catch {
            Write-Host "Electron builder fallback"
          }
          Compress-Archive -Path dist\\* -DestinationPath src-desktop\\app.zip -Force
          & "C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe" /target:winexe /resource:src-desktop\\app.zip,app.zip /out:artifacts\\Somiti-360-PC.exe src-desktop\\Program.cs /reference:System.IO.Compression.dll,System.IO.Compression.FileSystem.dll,System.Windows.Forms.dll,System.Drawing.dll

      - name: Backup Upload Windows Artifacts
        uses: actions/upload-artifact@v4
        continue-on-error: true
        with:
          name: Somiti-360-Windows-EXE
          path: artifacts/*.exe
          retention-days: 1

      - name: Publish Windows PC App Direct to GitHub Release
        uses: softprops/action-gh-release@v2
        if: always() && !cancelled()
        with:
          tag_name: latest
          name: "Somiti 360 Latest Multi-Platform Release"
          files: artifacts/*.exe
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}

  build-macos:
    name: 🍏 Build macOS App (Intel & Apple Silicon M-Series)
    runs-on: macos-latest
    env:
      CSC_IDENTITY_AUTO_DISCOVERY: "false"
    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci || npm install

      - name: Build Web Production Assets
        run: npm run build

      - name: Package macOS Multi-Architecture Binaries (Intel x64 & Apple Silicon arm64)
        run: |
          mkdir -p artifacts
          npx electron-builder --mac --x64 --arm64 --publish never
          for f in dist-electron/*x64*.dmg; do [ -f "$f" ] && cp "$f" "artifacts/Somiti-360-Mac-Intel-x64.dmg" || true; done
          for f in dist-electron/*arm64*.dmg; do [ -f "$f" ] && cp "$f" "artifacts/Somiti-360-Mac-AppleSilicon-M-Series-arm64.dmg" || true; done
          for f in dist-electron/*x64*.zip; do [ -f "$f" ] && cp "$f" "artifacts/Somiti-360-Mac-Intel-x64.zip" || true; done
          for f in dist-electron/*arm64*.zip; do [ -f "$f" ] && cp "$f" "artifacts/Somiti-360-Mac-AppleSilicon-M-Series-arm64.zip" || true; done
          cp dist-electron/*.dmg artifacts/ 2>/dev/null || true
          cp dist-electron/*.zip artifacts/ 2>/dev/null || true
          echo "=== Generated macOS Artifacts ==="
          ls -lh artifacts/

      - name: Backup Upload macOS Artifacts
        uses: actions/upload-artifact@v4
        continue-on-error: true
        with:
          name: Somiti-360-macOS-DMG
          path: artifacts/*
          retention-days: 1

      - name: Publish macOS App Direct to GitHub Release
        uses: softprops/action-gh-release@v2
        if: always() && !cancelled()
        with:
          tag_name: latest
          name: "Somiti 360 Latest Multi-Platform Release"
          fail_on_unmatched_files: false
          files: |
            artifacts/*.dmg
            artifacts/*.zip
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`;
fs.writeFileSync(path.join(wfDir, 'build-and-release.yml'), workflowContent, 'utf8');
console.log(' ✓ GitHub Actions workflow created for Somiti 360 (Android APK, Windows EXE, macOS DMG)');

console.log('🎉 All platform configurations completed successfully!');
