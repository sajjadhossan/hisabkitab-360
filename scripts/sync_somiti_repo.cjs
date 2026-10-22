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
  path.join(SOMITI_DIR, 'src', 'components', 'samity'),
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
  { from: 'src/services/samityService.js', to: 'src/services/samityService.js' },
  { from: 'src/services/qrService.js', to: 'src/services/qrService.js' },
  { from: 'src/services/soundFeedback.js', to: 'src/services/soundFeedback.js' },
  { from: 'src/services/nativeAppService.js', to: 'src/services/nativeAppService.js' },
  { from: 'src/services/liveSyncService.js', to: 'src/services/liveSyncService.js' },
  { from: 'src/services/supabaseClient.js', to: 'src/services/supabaseClient.js' },
  { from: 'src/services/deviceManagerService.js', to: 'src/services/deviceManagerService.js' },
  { from: 'src/utils/tenantHelper.js', to: 'src/utils/tenantHelper.js' },
  { from: 'src/index.css', to: 'src/index.css' }
];

console.log('📦 ফাইলগুলো সিঙ্ক করা হচ্ছে...');
filesToSync.forEach(item => {
  const srcPath = path.join(ROOT_DIR, item.from);
  const destPath = path.join(SOMITI_DIR, item.to);
  if (fs.existsSync(srcPath)) {
    let content = fs.readFileSync(srcPath, 'utf8');
    
    // In SamityManagementHub.jsx, remove any relative import to AppContext
    if (item.to.includes('SamityManagementHub.jsx')) {
      content = content.replace("import { useApp } from '../../context/AppContext';", '// useApp unneeded in standalone');
    }
    
    fs.writeFileSync(destPath, content, 'utf8');
    console.log(` ✓ [সিঙ্ক সম্পন্ন]: ${item.to}`);
  } else {
    console.warn(` ⚠️ ফাইলটি পাওয়া যায়নি: ${item.from}`);
  }
});

// 3. Standalone package.json
const packageJson = {
  name: "somiti-360",
  type: "module",
  private: true,
  version: "1.0.0",
  description: "সমিতি ৩৬০ - সমিতি, সমবায় সংস্থা ও ক্ষুদ্রঋণ সঞ্চয় ব্যবস্থাপনা প্ল্যাটফর্ম",
  scripts: {
    dev: "vite",
    host: "vite --host 0.0.0.0 --port 5174",
    build: "vite build",
    preview: "vite preview",
    "preview:host": "vite preview --host 0.0.0.0 --port 5174"
  },
  dependencies: {
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
    "vite": "^8.3.0"
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

// 7. Standalone src/App.jsx
const appJsxContent = `import React, { useState, useEffect } from 'react';
import { SamityManagementHub } from './components/samity/SamityManagementHub';
import { SamityDocVerificationView } from './components/samity/SamityDocVerificationView';
import { Users, ShieldCheck, RefreshCw } from 'lucide-react';

export default function App() {
  const [viewMode, setViewMode] = useState('hub'); // 'hub' | 'verify'
  const [verifyData, setVerifyData] = useState(null);

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

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col font-sans">
      <header className="sticky top-0 z-40 bg-[#0d1424]/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/20 font-bold">
            <Users className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base md:text-lg text-white leading-tight">সমিতি ৩৬০</h1>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                PRO v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400">সমিতি, সমবায় সংস্থা, সঞ্চয় ও ঋণদান ব্যবস্থাপনা প্ল্যাটফর্ম</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'verify' ? 'hub' : 'verify')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span className="hidden sm:inline">ভেরিফিকেশন পোর্টাল</span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full">
        <SamityManagementHub />
      </main>
    </div>
  );
}
`;
fs.writeFileSync(path.join(SOMITI_DIR, 'src', 'App.jsx'), appJsxContent, 'utf8');

// 8. Standalone README.md
const readmeContent = `# সমিতি ৩৬০ (Somiti 360)
**ডিজিটাল সমিতি, সমবায় সংস্থা, সঞ্চয় ও ঋণদান ব্যবস্থাপনা প্ল্যাটফর্ম**

![সমিতি ৩৬০](https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800)

## 🌟 প্রধান প্রধান ফিচারসমূহ:
1. **সদস্য লেজার ও পূর্ণাঙ্গ ডাটাবেজ:** সকল সাধারণ, আজীবন ও কার্যনির্বাহী সদস্যদের বিস্তারিত তথ্য, ছবি ও নমিনি ব্যবস্থাপনা।
2. **মাসিক সঞ্চয় ও চাঁদা ট্র্যাকিং:** কিস্তি ও চাঁদা সংগ্রহ, বিলম্ব ফি ও পরিশোধ হিস্টোরি।
3. **ব্যাংক জমা ও বাল্ক ভাউচার:** একাধিক সদস্যের সঞ্চয় একসাথে একক ভাউচারে জমা নেওয়ার সুবিধা।
4. **মাল্টি-চ্যানেল রিমাইন্ডার:** সরাসরি WhatsApp, Telegram ও SMS-এর মাধ্যমে বকেয়া চাঁদার নোটিফিকেশন প্রেরণ।
5. **ডিজিটাল লেটারহেড ও অফিসিয়াল রেজুলেশন:** নিজস্ব লোগো ও ডিজিটাল সিল-স্বাক্ষর সম্বলিত অফিসিয়াল নোটিশ ও সনদ জেনারেশন।
6. **QR কোড ভিত্তিক ভেরিফিকেশন পোর্টাল:** যেকোনো স্মার্টফোন থেকে স্ক্যান করে রসিদ ও নোটিশের সত্যতা নিশ্চিতকরণ।
7. **১০০% অফলাইন সাপোর্ট ও ক্লাউড সিঙ্ক:** ইন্টারনেট ছাড়াই সম্পূর্ণ কার্যকর এবং ক্লাউডে স্বয়ংক্রিয় ব্যাকআপ।

## 🚀 লোকাল রান করার নিয়ম:
\`\`\`bash
npm install
npm run dev
\`\`\`

## 🌐 প্রোডাকশন বিল্ড:
\`\`\`bash
npm run build
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

console.log('====================================================');
console.log('✅ সমিতি ৩৬০ (Somiti 360) স্বতন্ত্র রিপো প্যাকেজিং সফল!');
console.log(`📁 ডিরেক্টরি: ${SOMITI_DIR}`);
console.log('====================================================');
