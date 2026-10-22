/**
 * Automated Sync & Standalone Packager for Somiti 360 (সমিতি ৩৬০)
 * =============================================================
 * Synchronizes Samity Management Module from HisabKitab 360 into
 * the standalone `somiti-360` repository.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SOMITI_DIR = path.resolve(ROOT_DIR, 'somiti-360');

console.log('====================================================');
console.log('🔄 সমিতি ৩৬০ (Somiti 360) - অটোমেটিক সিঙ্ক ইঞ্জিন');
console.log('====================================================');

// 1. Ensure target directory structure
const dirsToCreate = [
  SOMITI_DIR,
  path.join(SOMITI_DIR, 'public'),
  path.join(SOMITI_DIR, 'src'),
  path.join(SOMITI_DIR, 'src', 'components'),
  path.join(SOMITI_DIR, 'src', 'components', 'auth'),
  path.join(SOMITI_DIR, 'src', 'components', 'samity'),
  path.join(SOMITI_DIR, 'src', 'context'),
  path.join(SOMITI_DIR, 'src', 'services'),
  path.join(SOMITI_DIR, 'src', 'utils')
];

dirsToCreate.forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
});

// 2. Files to mirror from hisabkitab-360
const filesToSync = [
  { from: 'src/components/samity/SamityManagementHub.jsx', to: 'src/components/samity/SamityManagementHub.jsx' },
  { from: 'src/components/samity/SamityDocVerificationView.jsx', to: 'src/components/samity/SamityDocVerificationView.jsx' },
  { from: 'src/components/auth/SomitiAuthView.jsx', to: 'src/components/auth/SomitiAuthView.jsx' },
  { from: 'src/services/somitiAuthService.js', to: 'src/services/somitiAuthService.js' },
  { from: 'src/services/samityService.js', to: 'src/services/samityService.js' },
  { from: 'src/services/qrService.js', to: 'src/services/qrService.js' },
  { from: 'src/services/soundFeedback.js', to: 'src/services/soundFeedback.js' },
  { from: 'src/services/nativeAppService.js', to: 'src/services/nativeAppService.js' },
  { from: 'src/services/liveSyncService.js', to: 'src/services/liveSyncService.js' },
  { from: 'src/services/supabaseClient.js', to: 'src/services/supabaseClient.js' },
  { from: 'src/services/deviceManagerService.js', to: 'src/services/deviceManagerService.js' },
  { from: 'src/utils/tenantHelper.js', to: 'src/utils/tenantHelper.js' },
  { from: 'src/utils/samityDictionary.js', to: 'src/utils/samityDictionary.js' },
  { from: 'src/index.css', to: 'src/index.css' }
];

console.log('📦 ফাইলগুলো সিঙ্ক করা হচ্ছে...');
filesToSync.forEach(item => {
  const srcPath = path.join(ROOT_DIR, item.from);
  const destPath = path.join(SOMITI_DIR, item.to);
  if (fs.existsSync(srcPath)) {
    let content = fs.readFileSync(srcPath, 'utf8');
    
    fs.writeFileSync(destPath, content, 'utf8');
    console.log(` ✓ [সিঙ্ক সম্পন্ন]: ${item.to}`);
  } else {
    console.warn(` ⚠️ ফাইলটি পাওয়া যায়নি: ${item.from}`);
  }
});

// Copy Logo Assets to somiti-360/public
const somitiLogoSrc = path.join(ROOT_DIR, 'public', 'somiti-logo.png');
if (fs.existsSync(somitiLogoSrc)) {
  const somitiPublicDir = path.join(SOMITI_DIR, 'public');
  if (!fs.existsSync(somitiPublicDir)) fs.mkdirSync(somitiPublicDir, { recursive: true });
  fs.copyFileSync(somitiLogoSrc, path.join(somitiPublicDir, 'logo.png'));
  fs.copyFileSync(somitiLogoSrc, path.join(somitiPublicDir, 'logo-512.png'));
  fs.copyFileSync(somitiLogoSrc, path.join(somitiPublicDir, 'somiti-logo.png'));
  fs.copyFileSync(somitiLogoSrc, path.join(somitiPublicDir, 'favicon.png'));
  console.log(' ✓ [লোগো সিঙ্ক সম্পন্ন]: public/logo.png, logo-512.png & favicon.png');
}

// 3. Standalone package.json
const packageJson = {
  name: "somiti-360",
  type: "module",
  private: true,
  version: "1.0.0",
  author: "Somiti 360",
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
    electronVersion: "34.0.0",
    directories: {
      output: "dist-electron"
    },
    win: {
      icon: "public/logo-512.png",
      target: [
        "nsis",
        "portable"
      ]
    },
    mac: {
      icon: "public/logo-512.png",
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
fs.writeFileSync(path.join(SOMITI_DIR, 'package.json'), JSON.stringify(packageJson, null, 2), 'utf8');

// 4. Standalone vite.config.js
const viteConfigContent = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true
  },
  build: {
    target: ['chrome65', 'es2018'],
    outDir: 'dist',
    chunkSizeWarningLimit: 3000
  }
});
`;
fs.writeFileSync(path.join(SOMITI_DIR, 'vite.config.js'), viteConfigContent, 'utf8');

// 5. Standalone index.html
const indexHtmlContent = `<!DOCTYPE html>
<html lang="bn">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <title>সমিতি ৩৬০ | Somiti 360 - সমিতি ও সমবায় ব্যবস্থাপনা</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2314b8a6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'/><circle cx='9' cy='7' r='4'/><path d='M22 21v-2a4 4 0 0 0-3-3.87'/><path d='M16 3.13a4 4 0 0 1 0 7.75'/></svg>" />
  </head>
  <body class="bg-slate-950 text-slate-100 antialiased selection:bg-teal-500 selection:text-white">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;
fs.writeFileSync(path.join(SOMITI_DIR, 'index.html'), indexHtmlContent, 'utf8');

// 6. Standalone src/main.jsx
const mainJsxContent = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;
fs.writeFileSync(path.join(SOMITI_DIR, 'src', 'main.jsx'), mainJsxContent, 'utf8');

// 7. Standalone src/context/AppContext.jsx
const appContextContent = `import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCachedAuthUser, signOutUser, subscribeToAuthState } from '../services/somitiAuthService';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('somiti360_lang') || 'bn';
  });

  const [toastMessage, setToastMessage] = useState(null);

  // Authentication State
  const [user, setUser] = useState(() => getCachedAuthUser());
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((authUser) => {
      setUser(authUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOutUser();
    setUser(null);
  };

  const [businessSettings, setBusinessSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('somiti360_settings');
      return saved ? JSON.parse(saved) : {
        companyName: 'সমিতি ৩৬০',
        phone: '',
        address: '',
        companyLogo: ''
      };
    } catch {
      return {
        companyName: 'সমিতি ৩৬০',
        phone: '',
        address: '',
        companyLogo: ''
      };
    }
  });

  useEffect(() => {
    localStorage.setItem('somiti360_lang', lang);
  }, [lang]);

  const showToast = (message, type = 'info') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(prev => (prev?.id === toastMessage?.id ? null : prev));
    }, 3500);
  };

  const value = {
    lang,
    setLang,
    showToast,
    businessSettings,
    setBusinessSettings,
    user,
    setUser,
    isAuthenticated: Boolean(user),
    authLoading,
    logout
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 border border-teal-500/40 text-teal-300 px-4 py-3 rounded-xl shadow-2xl shadow-teal-500/20 animate-fade-in text-sm font-medium">
          <span>{toastMessage.message}</span>
        </div>
      )}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    return {
      lang: 'bn',
      setLang: () => {},
      showToast: () => {},
      businessSettings: { companyName: 'সমিতি ৩৬০', phone: '', address: '', companyLogo: '' },
      user: null,
      isAuthenticated: false,
      authLoading: false,
      logout: () => {}
    };
  }
  return context;
};

export default AppContext;
`;
fs.writeFileSync(path.join(SOMITI_DIR, 'src', 'context', 'AppContext.jsx'), appContextContent, 'utf8');

// 8. Standalone src/App.jsx with ErrorBoundary, AppProvider & Auth Gate
const appJsxContent = `import React, { useState, useEffect, Component } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { SamityManagementHub } from './components/samity/SamityManagementHub';
import { SamityDocVerificationView } from './components/samity/SamityDocVerificationView';
import { SomitiAuthView } from './components/auth/SomitiAuthView';
import { Users, ShieldCheck, RefreshCw, AlertTriangle, LogOut, Globe } from 'lucide-react';

// Error Boundary to prevent any blank screen
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Samity 360 Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 text-red-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">সাময়িক ত্রুটি পরিলক্ষিত হয়েছে</h2>
          <p className="text-sm text-slate-400 max-w-md mb-6">
            অ্যাপ্লিকেশনের কোনো ডেটা লোড হতে সমস্যা হয়েছে। নিচের বাটনে চাপ দিয়ে রিলোড করুন।
          </p>
          <pre className="text-xs text-red-300 bg-red-950/40 p-3 rounded-lg border border-red-900/50 mb-6 max-w-lg overflow-auto">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition shadow-lg shadow-teal-500/20"
          >
            <RefreshCw className="w-4 h-4" />
            <span>পুনরায় রিলোড করুন</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainView() {
  const [viewMode, setViewMode] = useState('hub'); // 'hub' | 'verify'
  const [verifyData, setVerifyData] = useState(null);
  const { user, isAuthenticated, authLoading, logout, lang = 'bn', setLang } = useApp();

  useEffect(() => {
    // Check if query string contains verify parameters
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('verify') || params.get('ref') || params.get('title')) {
        setVerifyData({
          ref: params.get('ref'),
          title: params.get('title'),
          samity: params.get('samity'),
          reg: params.get('reg'),
          date: params.get('date'),
          body: params.get('body'),
          hash: params.get('hash')
        });
        setViewMode('verify');
      }
    }
  }, []);

  // Public QR Document Verification View
  if (viewMode === 'verify') {
    return (
      <SamityDocVerificationView 
        verifyData={verifyData} 
        onBackToApp={() => {
          setViewMode('hub');
          if (typeof window !== 'undefined' && window.history.pushState) {
            window.history.pushState({}, '', window.location.pathname);
          }
        }} 
      />
    );
  }

  // Loading Session State
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4">
          <RefreshCw className="w-6 h-6 animate-spin text-teal-400" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">সমিতি ৩৬০</h3>
        <p className="text-xs text-slate-400">নিরাপদ সেশন যাচাই করা হচ্ছে...</p>
      </div>
    );
  }

  // Strict Authentication Gate (Rule 7)
  if (!isAuthenticated) {
    return <SomitiAuthView onAuthSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col font-sans">
      <header className="sticky top-0 z-40 bg-[#0d1424]/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-teal-500/30 flex items-center justify-center shadow-lg shadow-teal-500/15 overflow-hidden p-0.5">
            <img src="/logo.png" alt="Somiti 360 Logo" className="w-full h-full object-contain rounded-lg" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base md:text-lg text-white leading-tight">সমিতি ৩৬০</h1>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                PRO v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400">{lang === 'en' ? 'Samity, Cooperative, Savings & Microcredit Platform' : 'সমিতি, সমবায় সংস্থা, সঞ্চয় ও ঋণদান ব্যবস্থাপনা প্ল্যাটফর্ম'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              const next = lang === 'en' ? 'bn' : 'en';
              if (setLang) setLang(next);
              try {
                localStorage.setItem('samity_lang', next);
                localStorage.setItem('somiti360_lang', next);
                localStorage.setItem('hisabkitab_lang', next);
              } catch {}
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 transition cursor-pointer shadow-sm"
            title={lang === 'en' ? 'বাংলা ভাষায় পরিবর্তন করুন' : 'Switch to English'}
          >
            <Globe className="w-3.5 h-3.5 text-teal-400" />
            <span>{lang === 'en' ? '🇧🇩 বাংলা' : '🇬🇧 English'}</span>
          </button>

          <button
            onClick={() => setViewMode(viewMode === 'verify' ? 'hub' : 'verify')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span className="hidden sm:inline">{lang === 'en' ? 'Verification Portal' : 'ভেরিফিকেশন পোর্টাল'}</span>
          </button>

          {user && (
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-800">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-semibold text-white leading-tight">
                  {user.name || user.email?.split('@')[0]}
                </span>
                <span className="text-[10px] text-teal-400 truncate max-w-[130px]">
                  {user.samityName || user.email}
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300 font-bold text-xs uppercase shadow-sm">
                {user.name ? user.name[0] : (user.email ? user.email[0] : 'U')}
              </div>
              <button
                onClick={logout}
                title="লগআউট করুন"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">লগআউট</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 w-full">
        <SamityManagementHub />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainView />
      </AppProvider>
    </ErrorBoundary>
  );
}
`;
fs.writeFileSync(path.join(SOMITI_DIR, 'src', 'App.jsx'), appJsxContent, 'utf8');

// 8. Standalone README.md
const readmeContent = `# সমিতি ৩৬০ (Somiti 360)
**ডিজিটাল সমিতি, সমবায় সংস্থা, সঞ্চয় ও ঋণদান ব্যবস্থাপনা প্ল্যাটফর্ম**

![সমিতি ৩৬০](https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800)

## 🌐 লাইভ ও ডাউনলোড লিংকসমূহ:
| প্ল্যাটফর্ম | লিংক / ডাউনলোড | বিবরণ |
|---|---|---|
| 📱 **Android Mobile APK** | [সর্বশেষ রিলিজ থেকে Somiti-360.apk ডাউনলোড করুন](https://github.com/sajjadhossan/somiti-360/releases/latest) | স্মার্টফোনে সরাসরি ব্যবহারযোগ্য |
| 💻 **Windows Desktop Setup** | [Somiti-360-Setup.exe](https://github.com/sajjadhossan/somiti-360/releases/latest) | উইন্ডোজ পিসি ইন্সটলার |
| ⚡ **Windows Portable** | [Somiti-360-PC.exe](https://github.com/sajjadhossan/somiti-360/releases/latest) | এক ক্লিকে ইনস্টল ছাড়াই চালনার পোর্টেবল অ্যাপ |
| 🍏 **MacBook (Intel & M-Series)** | [Somiti-360-Mac.dmg](https://github.com/sajjadhossan/somiti-360/releases/latest) | ম্যাক ওএস সংস্করণ |
| 🌐 **Vercel Web App** | [https://somiti-360.vercel.app](https://somiti-360.vercel.app) | ক্লাউড ব্রাউজার সংস্করণ (যেকোনো ডিভাইসে ব্যবহারের জন্য) |

---

## 🌟 প্রধান প্রধান ফিচারসমূহ:
1. **সদস্য লেজার ও পূর্ণাঙ্গ ডাটাবেজ:** সকল সাধারণ, আজীবন ও কার্যনির্বাহী সদস্যদের বিস্তারিত তথ্য, ছবি ও নমিনি ব্যবস্থাপনা।
2. **মাসিক সঞ্চয় ও চাঁদা ট্র্যাকিং:** কিস্তি ও চাঁদা সংগ্রহ, বিলম্ব ফি ও পরিশোধ হিস্টোরি।
3. **ব্যাংক জমা ও বাল্ক ভাউচার:** একাধিক সদস্যের সঞ্চয় একসাথে একক ভাউচারে জমা নেওয়ার সুবিধা।
4. **মাল্টি-চ্যানেল রিমাইন্ডার:** সরাসরি WhatsApp, Telegram ও SMS-এর মাধ্যমে বকেয়া চাঁদার নোটিফিকেশন প্রেরণ।
5. **ডিজিটাল লেটারহেড ও অফিসিয়াল রেজুলেশন:** নিজস্ব লোগো ও ডিজিটাল সিল-স্বাক্ষর সম্বলিত অফিসিয়াল নোটিশ ও সনদ জেনারেশন।
6. **QR কোড ভিত্তিক ভেরিফিকেশন পোর্টাল:** যেকোনো স্মার্টফোন থেকে স্ক্যান করে রসিদ ও নোটিশের সত্যতা নিশ্চিতকরণ।
7. **১০০% অফলাইন সাপোর্ট ও ক্লাউড সিঙ্ক:** ইন্টারনেট ছাড়াই সম্পূর্ণ কার্যকর এবং ক্লাউডে স্বয়ংক্রিয় ব্যাকআপ।

---

## 🛠️ ডেভেলপার কমান্ডসমূহ:
\`\`\`bash
# লোকাল ওয়েব প্রিভিউ
npm install
npm run dev

# উইন্ডোজ ডেস্কটপ অ্যাপ বিল্ড
npm run electron:build

# ম্যাকবুক অ্যাপ বিল্ড (Intel ও M-Series)
npm run electron:build:mac
\`\`\`
`;
fs.writeFileSync(path.join(SOMITI_DIR, 'README.md'), readmeContent, 'utf8');

// 9. Standalone .gitignore
const somitiGitignore = `# Logs
logs
*.log
npm-debug.log*

node_modules
dist
dist-ssr
*.local
.env
.env*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
`;
fs.writeFileSync(path.join(SOMITI_DIR, '.gitignore'), somitiGitignore, 'utf8');

// 10. Standalone vercel.json (Vercel deployment & SPA rewrites)
const vercelConfig = {
  framework: "vite",
  installCommand: "npm install --legacy-peer-deps",
  buildCommand: "npm run build",
  outputDirectory: "dist",
  cleanUrls: true,
  rewrites: [
    {
      source: "/((?!assets/).*)",
      destination: "/index.html"
    }
  ],
  headers: [
    {
      source: "/assets/(.*)",
      headers: [
        {
          key: "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      source: "/(.*)",
      headers: [
        {
          key: "X-Content-Type-Options",
          value: "nosniff"
        },
        {
          key: "X-Frame-Options",
          value: "DENY"
        },
        {
          key: "X-XSS-Protection",
          value: "1; mode=block"
        }
      ]
    }
  ]
};
fs.writeFileSync(path.join(SOMITI_DIR, 'vercel.json'), JSON.stringify(vercelConfig, null, 2), 'utf8');

console.log('====================================================');
console.log('✅ সমিতি ৩৬০ (Somiti 360) স্বতন্ত্র রিপো প্যাকেজিং সফল!');
console.log(`📁 ডিরেক্টরি: ${SOMITI_DIR}`);
console.log('====================================================');
