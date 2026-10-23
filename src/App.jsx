import React, { useState, useEffect, Component } from 'react';
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
      <header className="sticky top-0 z-50 bg-[#090d16]/95 backdrop-blur-xl border-b border-slate-800/80 px-3 sm:px-5 py-2.5 flex items-center justify-between shadow-lg shadow-black/40">
        {/* Left: Master Somiti 360 Brand */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-500/25 via-slate-900 to-cyan-500/20 border border-emerald-400/50 flex items-center justify-center shadow-lg shadow-emerald-500/20 overflow-hidden p-1 shrink-0 transition-transform duration-300 group-hover:scale-105">
              <img src="/somiti-emblem.svg" alt="Somiti 360 Master Logo" className="w-full h-full object-contain filter drop-shadow" onError={(e) => { e.currentTarget.src = '/logo.png'; }} />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#090d16] animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-base sm:text-lg bg-gradient-to-r from-emerald-300 via-teal-100 to-amber-200 bg-clip-text text-transparent leading-none tracking-tight">
                {lang === 'en' ? 'Somiti 360' : 'সমিতি ৩৬০'}
              </h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 text-emerald-300 border border-emerald-500/30 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                ENTERPRISE
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5 hidden xs:block">
              {lang === 'en' ? 'Smart Cooperative & Savings ERP' : 'স্মার্ট সমবায়, সঞ্চয় ও ঋণদান ইআরপি প্ল্যাটফর্ম'}
            </p>
          </div>
        </div>

        {/* Right: Executive Control Suite */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Toggle */}
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
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700/70 hover:border-emerald-500/40 transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
            title={lang === 'en' ? 'বাংলা ভাষায় পরিবর্তন করুন' : 'Switch to English'}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold">{lang === 'en' ? '🇧🇩 বাংলা' : '🇬🇧 English'}</span>
          </button>

          {/* Verification Portal Button */}
          <button
            onClick={() => setViewMode(viewMode === 'verify' ? 'hub' : 'verify')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all duration-200 cursor-pointer shadow-sm active:scale-95 ${
              viewMode === 'verify'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700 hover:border-slate-600'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">{lang === 'en' ? 'Verification Portal' : 'ভেরিফিকেশন পোর্টাল'}</span>
          </button>

          {/* Authenticated User & Logout Group */}
          {user && (
            <div className="flex items-center gap-2 sm:gap-2.5 pl-2 sm:pl-3 border-l border-slate-800">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-bold text-white leading-tight flex items-center gap-1 justify-end">
                  <span className="text-[10px] text-amber-400">👑</span>
                  {user.name || user.email?.split('@')[0]}
                </span>
                <span className="text-[10px] font-semibold text-emerald-400/90 truncate max-w-[120px]">
                  {user.role === 'admin' ? (lang === 'en' ? 'Administrator' : 'প্রধান এডমিন') : (user.samityName || 'Authorized')}
                </span>
              </div>

              <div
                className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300 font-black text-xs uppercase shadow-sm"
                title={user.email}
              >
                {user.name ? user.name[0] : (user.email ? user.email[0] : 'U')}
              </div>

              <button
                onClick={logout}
                title={lang === 'en' ? 'Sign out of session' : 'নিরাপদে লগআউট করুন'}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 hover:border-red-500/40 transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{lang === 'en' ? 'Logout' : 'লগআউট'}</span>
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
