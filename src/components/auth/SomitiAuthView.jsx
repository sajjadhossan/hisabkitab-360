import React, { useState } from 'react';
import {
  Users,
  Lock,
  Mail,
  User,
  Building2,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Award,
  Database,
  CloudCheck,
  Zap,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  sendPasswordResetEmail
} from '../../services/somitiAuthService';

export const SomitiAuthView = ({ onAuthSuccess }) => {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [signupForm, setSignupForm] = useState({
    fullName: '',
    samityName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [forgotEmail, setForgotEmail] = useState('');

  // Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const user = await signInWithEmail(loginEmail, loginPassword, rememberMe);
      setSuccessMessage('সফলভাবে লগইন হয়েছে! ড্যাশবোর্ডে প্রবেশ করা হচ্ছে...');
      if (onAuthSuccess) {
        setTimeout(() => onAuthSuccess(user), 400);
      }
    } catch (err) {
      setErrorMessage(err.message || 'লগইন করতে ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  // Handle Signup
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (signupForm.password !== signupForm.confirmPassword) {
      setErrorMessage('পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না!');
      return;
    }

    setLoading(true);
    try {
      const result = await signUpWithEmail({
        email: signupForm.email,
        password: signupForm.password,
        fullName: signupForm.fullName,
        samityName: signupForm.samityName,
        phone: signupForm.phone
      });

      if (result.requiresConfirmation) {
        setSuccessMessage('রেজিস্ট্রেশন সফল হয়েছে! আপনার ইমেইল ইনবক্স চেক করে একাউন্ট নিশ্চিত করুন, অথবা সরাসরি সাইন ইন করুন।');
        setTimeout(() => setActiveTab('login'), 2500);
      } else {
        setSuccessMessage('অভিনন্দন! আপনার সমিতি অ্যাকাউন্ট তৈরি হয়েছে। ড্যাশবোর্ডে প্রবেশ করা হচ্ছে...');
        if (onAuthSuccess) {
          setTimeout(() => onAuthSuccess(result.user), 600);
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'অ্যাকাউন্ট খুলতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google OAuth 1-Click Login
  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setGoogleLoading(true);

    try {
      await signInWithGoogle();
      // Supabase redirects to Google OAuth
    } catch (err) {
      setErrorMessage(err.message || 'Google দিয়ে লগইন করতে সমস্যা হয়েছে।');
      setGoogleLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(forgotEmail);
      setSuccessMessage('পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে। ইনবক্স চেক করুন।');
    } catch (err) {
      setErrorMessage(err.message || 'রিসেট লিংক পাঠানো সম্ভব হয়নি।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050811] text-slate-100 flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans relative selection:bg-teal-500 selection:text-slate-950 overflow-x-hidden">
      {/* Dynamic Ambient Background Illumination */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[160px]" />
        <div className="absolute top-1/2 -right-40 w-[550px] h-[550px] bg-emerald-500/8 rounded-full blur-[180px]" />
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[170px]" />
        {/* Subtle architectural grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
        />
      </div>

      {/* Main Dual-Pane Luxury Frame */}
      <div className="w-full max-w-5xl bg-[#0c1222]/90 border border-slate-800/90 rounded-[28px] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-all">
        
        {/* LEFT PANE: Premium Product Showcase (Desktop & Tablet) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#0f172a] via-[#091122] to-[#060c18] p-6 sm:p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80 relative overflow-hidden">
          {/* Subtle Accent Glow inside Left Column */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Identity */}
          <div>
            <div className="flex items-center gap-3.5 mb-6">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 via-emerald-400 to-cyan-400 p-[1.5px] shadow-lg shadow-teal-500/30">
                  <div className="w-full h-full bg-[#0a101f] rounded-[14px] flex items-center justify-center">
                    <Users className="w-6 h-6 text-teal-400" />
                  </div>
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-teal-500 border-2 border-[#0c1222]" />
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-black text-white tracking-tight">সমিতি ৩৬০</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">
                    ENTERPRISE
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">স্মার্ট ডিজিটাল সমবায় ও সঞ্চয় ব্যবস্থাপনা</p>
              </div>
            </div>

            {/* Value Proposition Highlights */}
            <div className="mt-8 space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm flex items-start gap-3.5 hover:border-teal-500/30 transition">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">১০০% স্বয়ংক্রিয় সঞ্চয় ও কিস্তি হিসাব</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                    মাসিক চাঁদা, ভর্তি ফি, বিলম্ব জরিমানা এবং লভ্যাংশ বণ্টন ক্যালকুলেশন এক ক্লিকে।
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm flex items-start gap-3.5 hover:border-teal-500/30 transition">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">QR ভেরিফাইড অফিশিয়াল ডকুমেন্ট</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                    স্মার্টফোন দিয়ে স্ক্যান করলেই তাৎক্ষণিক মানি রসিদ ও রেজুলেশন নোটিশের সত্যতা যাচাই।
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm flex items-start gap-3.5 hover:border-teal-500/30 transition">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">রিয়েলটাইম Supabase ক্লাউড মেশ</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                    মোবাইল ও পিসিতে তাৎক্ষণিক লাইভ ডাটা সিঙ্ক এবং নিরবচ্ছিন্ন অফলাইন ডাটাবেজ ব্যাকআপ।
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security / Trust Seal */}
          <div className="mt-8 pt-5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <CloudCheck className="w-4 h-4 text-teal-400" />
              <span>ক্লাউড সেশন এনক্রিপশন সক্রিয়</span>
            </div>
            <span className="font-mono text-[10px] text-slate-500">v1.0.262</span>
          </div>
        </div>

        {/* RIGHT PANE: Modern Interactive Auth Console */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-12 flex flex-col justify-center bg-[#0c1222]/95 relative">
          
          {/* Header Switcher Tabs */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {activeTab === 'login' ? 'অ্যাকাউন্টে সাইন ইন করুন' : activeTab === 'signup' ? 'নতুন সমিতি অ্যাকাউন্ট খুলুন' : 'পাসওয়ার্ড উদ্ধার করুন'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {activeTab === 'login' 
                    ? 'আপনার সমিতির ড্যাশবোর্ডে প্রবেশের জন্য লগইন করুন' 
                    : activeTab === 'signup'
                    ? 'কয়েক সেকেন্ডে আপনার সমিতির ডিজিটাল ডাটাবেজ চালু করুন'
                    : 'আপনার নিবন্ধিত ইমেইলে পাসওয়ার্ড রিসেট লিংক পাঠানো হবে'}
                </p>
              </div>
            </div>

            {/* Segmented Control */}
            {activeTab !== 'forgot' && (
              <div className="p-1 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex gap-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => { setActiveTab('login'); setErrorMessage(''); setSuccessMessage(''); }}
                  className={`flex-1 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                    activeTab === 'login'
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 font-black shadow-lg shadow-teal-500/25 scale-[1.01]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>সাইন ইন (Sign In)</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('signup'); setErrorMessage(''); setSuccessMessage(''); }}
                  className={`flex-1 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                    activeTab === 'signup'
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 font-black shadow-lg shadow-teal-500/25 scale-[1.01]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>নতুন নিবন্ধন (Sign Up)</span>
                </button>
              </div>
            )}
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="mb-4 flex items-start gap-3 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span className="leading-relaxed font-medium">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span className="leading-relaxed font-medium">{successMessage}</span>
            </div>
          )}

          {/* 1-Click Google Login Button (High Visual Prominence) */}
          {activeTab !== 'forgot' && (
            <div className="mb-5">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                className="w-full group relative flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-100 font-bold text-xs sm:text-sm border border-slate-700/80 hover:border-teal-500/50 shadow-md hover:shadow-teal-500/10 transition-all duration-200 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {googleLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  </div>
                )}
                <span>Google অ্যাকাউন্ট দিয়ে ১-ক্লিকে প্রবেশ করুন</span>
              </button>

              {/* Styled Divider */}
              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-[#0c1222] px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">
                  অথবা ইমেইল একাউন্ট
                </span>
                <div className="border-t border-slate-800 w-full" />
              </div>
            </div>
          )}

          {/* TAB 1: SIGN IN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  নিবন্ধিত ইমেইল (Email Address)
                </label>
                <div className="relative group">
                  <Mail className="w-4 h-4 text-slate-500 group-focus-within:text-teal-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-950/70 border border-slate-800 focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    গোপন পাসওয়ার্ড (Password)
                  </label>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('forgot'); setErrorMessage(''); setSuccessMessage(''); }}
                    className="text-xs text-teal-400 hover:text-teal-300 font-medium transition cursor-pointer"
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="w-4 h-4 text-slate-500 group-focus-within:text-teal-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950/70 border border-slate-800 focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 rounded-2xl pl-10 pr-11 py-3 text-xs sm:text-sm text-white placeholder-slate-600 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember preference */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-lg bg-slate-950 border-slate-700 text-teal-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-xs text-slate-400 font-medium">লগইন তথ্য এই ডিভাইসে মনে রাখুন</span>
                </label>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full group mt-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 hover:from-teal-300 hover:to-emerald-400 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-xl shadow-teal-500/25 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>যাচাই করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span>লগইন করুন</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: SIGN UP FORM */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    আপনার পূর্ণ নাম (Full Name)
                  </label>
                  <div className="relative group">
                    <User className="w-4 h-4 text-slate-500 group-focus-within:text-teal-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                    <input
                      type="text"
                      required
                      value={signupForm.fullName}
                      onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                      placeholder="মোঃ সাজ্জাদ হোসেন"
                      className="w-full bg-slate-950/70 border border-slate-800 focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    সমিতি বা সংস্থার নাম
                  </label>
                  <div className="relative group">
                    <Building2 className="w-4 h-4 text-slate-500 group-focus-within:text-teal-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                    <input
                      type="text"
                      required
                      value={signupForm.samityName}
                      onChange={(e) => setSignupForm({ ...signupForm, samityName: e.target.value })}
                      placeholder="একতা সমবায় সমিতি লিঃ"
                      className="w-full bg-slate-950/70 border border-slate-800 focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    মোবাইল নম্বর (Phone)
                  </label>
                  <div className="relative group">
                    <Phone className="w-4 h-4 text-slate-500 group-focus-within:text-teal-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                    <input
                      type="tel"
                      required
                      value={signupForm.phone}
                      onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                      placeholder="01712345678"
                      className="w-full bg-slate-950/70 border border-slate-800 focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ইমেইল ঠিকানা (Email)
                  </label>
                  <div className="relative group">
                    <Mail className="w-4 h-4 text-slate-500 group-focus-within:text-teal-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                    <input
                      type="email"
                      required
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      placeholder="admin@samity.com"
                      className="w-full bg-slate-950/70 border border-slate-800 focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    পাসওয়ার্ড (Password)
                  </label>
                  <div className="relative group">
                    <Lock className="w-4 h-4 text-slate-500 group-focus-within:text-teal-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                      placeholder="নূন্যতম ৬ অক্ষর"
                      className="w-full bg-slate-950/70 border border-slate-800 focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    কনফার্ম পাসওয়ার্ড
                  </label>
                  <div className="relative group">
                    <Lock className="w-4 h-4 text-slate-500 group-focus-within:text-teal-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={signupForm.confirmPassword}
                      onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                      placeholder="পুনরায় পাসওয়ার্ড দিন"
                      className="w-full bg-slate-950/70 border border-slate-800 focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full group mt-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 hover:from-teal-300 hover:to-emerald-400 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-xl shadow-teal-500/25 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>অ্যাকাউন্ট তৈরি হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span>সমিতি নিবন্ধন সম্পন্ন করুন</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD */}
          {activeTab === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  আপনার নিবন্ধিত ইমেইল ঠিকানা দিন
                </label>
                <div className="relative group">
                  <Mail className="w-4 h-4 text-slate-500 group-focus-within:text-teal-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-950/70 border border-slate-800 focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setActiveTab('login'); setErrorMessage(''); setSuccessMessage(''); }}
                  className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
                >
                  ফিরে যান
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-teal-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>রিসেট লিংক পাঠান</span>}
                </button>
              </div>
            </form>
          )}

          {/* Trust Footer */}
          <div className="mt-8 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>256-Bit SSL এনক্রিপশন ও Supabase Auth দ্বারা সুরক্ষিত</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hover:text-slate-400 transition cursor-pointer">সহায়তা কেন্দ্র</span>
              <span>•</span>
              <span className="hover:text-slate-400 transition cursor-pointer">গোপনীয়তা নীতি</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
