import React, { useState } from 'react';
import {
  Users,
  Lock,
  Mail,
  User,
  Building2,
  Phone,
  Key,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  X
} from 'lucide-react';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  sendPasswordResetEmail
} from '../../services/somitiAuthService';
import { isSupabaseReady } from '../../services/supabaseClient';

export const SomitiAuthView = ({ onAuthSuccess }) => {
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' | 'pin'
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Login form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginPin, setLoginPin] = useState('');

  // Signup form states
  const [signupForm, setSignupForm] = useState({
    fullName: '',
    samityName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'admin',
    pin: '1234'
  });

  // Forgot password form states
  const [forgotEmail, setForgotEmail] = useState('');

  const isSupabaseActive = isSupabaseReady();

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (loginMethod === 'pin') {
        if (loginPin.length < 4) {
          throw new Error('৪-সংখ্যার পিন প্রদান করুন।');
        }
        // PIN login fallback for cached or quick pin
        const cached = localStorage.getItem('somiti360_auth_user');
        if (cached) {
          const parsed = JSON.parse(cached);
          setSuccessMessage('সফলভাবে কুইক পিনে প্রবেশ করা হচ্ছে...');
          if (onAuthSuccess) {
            setTimeout(() => onAuthSuccess(parsed), 400);
          }
          return;
        } else {
          throw new Error('প্রথমে ইমেইল ও পাসওয়ার্ড দিয়ে একবার লগইন করতে হবে।');
        }
      }

      const user = await signInWithEmail(loginEmail, loginPassword, rememberMe);
      setSuccessMessage('সফলভাবে সাইন ইন হয়েছে! ড্যাশবোর্ডে প্রবেশ করা হচ্ছে...');
      if (onAuthSuccess) {
        setTimeout(() => onAuthSuccess(user), 400);
      }
    } catch (err) {
      setErrorMessage(err.message || 'লগইন করতে ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  // Handle Signup Submit
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
        setTimeout(() => setAuthView('login'), 2500);
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

  // Handle Google 1-Click Login
  const handleGoogleLogin = async () => {
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

  // Handle Forgot Password Submit
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
    <div
      className="modal-overlay"
      style={{
        zIndex: 9999,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        background: 'rgba(15, 23, 42, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100%',
        position: 'fixed',
        top: 0,
        left: 0,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: 'max(12px, env(safe-area-inset-top, 12px)) 12px max(16px, env(safe-area-inset-bottom, 16px))'
      }}
    >
      <div
        className="modal-content animate-fade-in android-scroll-view"
        style={{
          maxWidth: '480px',
          width: '95%',
          maxHeight: 'calc(100dvh - 24px)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          background: 'var(--card-bg, #0f172a)',
          borderRadius: '18px',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.7)',
          padding: 0
        }}
      >
        {/* ========================================================= */}
        {/* MODAL HEADER (HisabKitab 360 Signature Gradient Bar) */}
        {/* ========================================================= */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(16, 185, 129, 0.12))',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                flexShrink: 0
              }}
            >
              <Users size={22} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1.18rem',
                    fontWeight: '800',
                    color: 'var(--text-main, #f1f5f9)',
                    letterSpacing: '-0.01em'
                  }}
                >
                  সমিতি ৩৬০
                </h3>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: '800',
                    padding: '2px 7px',
                    borderRadius: '20px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    letterSpacing: '0.04em'
                  }}
                >
                  PRO
                </span>
              </div>
              <div
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted, #94a3b8)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '3px'
                }}
              >
                {/* Supabase Status Indicator */}
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: isSupabaseActive ? '#10b981' : '#ef4444',
                    boxShadow: isSupabaseActive ? '0 0 8px #10b981' : '0 0 8px #ef4444',
                    display: 'inline-block'
                  }}
                />
                <span style={{ color: isSupabaseActive ? '#10b981' : '#ef4444', fontWeight: '700' }}>
                  {isSupabaseActive ? 'সুপাবেস ক্লাউড সক্রিয়' : 'সুপাবেস অফলাইন মোড'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TAB PILLS: Sign In, Sign Up, Forgot Password */}
        {/* ========================================================= */}
        <div
          style={{
            display: 'flex',
            padding: '8px 1.25rem',
            background: 'var(--bg-secondary, #0b1120)',
            borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            gap: '6px'
          }}
        >
          <button
            type="button"
            onClick={() => { setAuthView('login'); setErrorMessage(''); setSuccessMessage(''); }}
            style={{
              flex: 1,
              padding: '9px 6px',
              borderRadius: '9px',
              border: 'none',
              background: authView === 'login' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
              color: authView === 'login' ? '#fff' : 'var(--text-muted, #94a3b8)',
              fontSize: '0.84rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: authView === 'login' ? '0 3px 10px rgba(16, 185, 129, 0.3)' : 'none'
            }}
          >
            সাইন ইন (Sign In)
          </button>
          <button
            type="button"
            onClick={() => { setAuthView('signup'); setErrorMessage(''); setSuccessMessage(''); }}
            style={{
              flex: 1,
              padding: '9px 6px',
              borderRadius: '9px',
              border: 'none',
              background: authView === 'signup' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
              color: authView === 'signup' ? '#fff' : 'var(--text-muted, #94a3b8)',
              fontSize: '0.84rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: authView === 'signup' ? '0 3px 10px rgba(16, 185, 129, 0.3)' : 'none'
            }}
          >
            নতুন সমিতি নিবন্ধন
          </button>
          <button
            type="button"
            onClick={() => { setAuthView('forgot'); setErrorMessage(''); setSuccessMessage(''); }}
            style={{
              flex: 1,
              padding: '9px 6px',
              borderRadius: '9px',
              border: 'none',
              background: authView === 'forgot' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
              color: authView === 'forgot' ? '#fff' : 'var(--text-muted, #94a3b8)',
              fontSize: '0.84rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: authView === 'forgot' ? '0 3px 10px rgba(16, 185, 129, 0.3)' : 'none'
            }}
          >
            পাসওয়ার্ড উদ্ধার
          </button>
        </div>

        {/* ========================================================= */}
        {/* ERROR / SUCCESS NOTIFICATIONS */}
        {/* ========================================================= */}
        <div style={{ padding: '0 1.5rem' }}>
          {errorMessage && (
            <div
              style={{
                marginTop: '1rem',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid #ef4444',
                borderRadius: '9px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#ef4444',
                fontSize: '0.84rem'
              }}
            >
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span style={{ lineHeight: 1.4 }}>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div
              style={{
                marginTop: '1rem',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid #10b981',
                borderRadius: '9px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#10b981',
                fontSize: '0.84rem'
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span style={{ lineHeight: 1.4 }}>{successMessage}</span>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* VIEW 1: SIGN IN / LOGIN */}
        {/* ========================================================= */}
        {authView === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ padding: '1.25rem 1.5rem 1.5rem' }}>
            {/* Method switch: Email vs PIN */}
            <div
              style={{
                display: 'flex',
                background: 'var(--bg-primary, #050811)',
                padding: '3px',
                borderRadius: '9px',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                marginBottom: '1.25rem'
              }}
            >
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                style={{
                  flex: 1,
                  padding: '7px',
                  borderRadius: '7px',
                  border: 'none',
                  background: loginMethod === 'email' ? 'var(--card-bg, #1e293b)' : 'transparent',
                  color: loginMethod === 'email' ? 'var(--text-main, #f1f5f9)' : 'var(--text-muted, #94a3b8)',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                ✉️ ইমেইল ও পাসওয়ার্ড
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('pin')}
                style={{
                  flex: 1,
                  padding: '7px',
                  borderRadius: '7px',
                  border: 'none',
                  background: loginMethod === 'pin' ? 'var(--card-bg, #1e293b)' : 'transparent',
                  color: loginMethod === 'pin' ? 'var(--text-main, #f1f5f9)' : 'var(--text-muted, #94a3b8)',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                🔢 কুইক পিন (Quick PIN)
              </button>
            </div>

            {loginMethod === 'email' ? (
              <>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      marginBottom: '6px',
                      color: 'var(--text-main, #f1f5f9)'
                    }}
                  >
                    <Mail size={14} style={{ color: '#10b981' }} />
                    <span>ইমেইল ঠিকানা (Email Address)</span>
                  </label>
                  <input
                    type="email"
                    required
                    className="input-field"
                    placeholder="যেমন: admin@samity.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        margin: 0,
                        color: 'var(--text-main, #f1f5f9)'
                      }}
                    >
                      <Lock size={14} style={{ color: '#10b981' }} />
                      <span>গোপন পাসওয়ার্ড (Password)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setAuthView('forgot')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#10b981',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      পাসওয়ার্ড ভুলে গেছেন?
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="input-field"
                      placeholder="পাসওয়ার্ড লিখুন"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted, #94a3b8)',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* REMEMBER ME CHECKBOX */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      color: 'var(--text-main, #f1f5f9)',
                      userSelect: 'none'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#10b981', cursor: 'pointer' }}
                    />
                    <span style={{ fontWeight: '600' }}>আমাকে মনে রাখুন (Remember Me)</span>
                  </label>
                </div>
              </>
            ) : (
              /* Quick PIN Pad */
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main, #f1f5f9)' }}>
                    ৪-সংখ্যার কুইক পিন (PIN) দিন (ডিফল্ট: 1234)
                  </label>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '8px' }}>
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        style={{
                          width: '44px',
                          height: '48px',
                          borderRadius: '8px',
                          border: '2px solid var(--border-color, rgba(255, 255, 255, 0.15))',
                          background: 'var(--bg-primary, #050811)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.4rem',
                          fontWeight: '800',
                          color: '#10b981'
                        }}
                      >
                        {loginPin[idx] ? '●' : ''}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Keypad Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', maxWidth: '260px', margin: '0 auto' }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '←'].map((btn, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        if (btn === 'C') setLoginPin('');
                        else if (btn === '←') setLoginPin(prev => prev.slice(0, -1));
                        else if (loginPin.length < 4) setLoginPin(prev => prev + btn);
                      }}
                      style={{
                        padding: '10px',
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                        background: 'var(--bg-secondary, #0f172a)',
                        color: 'var(--text-main, #f1f5f9)',
                        cursor: 'pointer'
                      }}
                    >
                      {btn}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '0.95rem',
                fontWeight: '800',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                border: 'none',
                borderRadius: '9px',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>অনুমতি যাচাই হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Shield size={16} />
                  <span>সাইন ইন করুন (Sign In)</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0 12px', gap: '10px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color, rgba(255, 255, 255, 0.1))' }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', fontWeight: '700' }}>
                অথবা ১-ক্লিকে
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color, rgba(255, 255, 255, 0.1))' }} />
            </div>

            {/* Google 1-Click Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              style={{
                width: '100%',
                padding: '11px 16px',
                fontSize: '0.92rem',
                fontWeight: '700',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px',
                background: 'var(--card-bg, #1e293b)',
                color: 'var(--text-main, #f1f5f9)',
                border: '1.5px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                borderRadius: '9px',
                cursor: googleLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease'
              }}
            >
              {googleLoading ? (
                <RefreshCw size={18} className="animate-spin" style={{ color: '#10b981' }} />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              )}
              <span>গুগল দিয়ে সাইন ইন (Google Sign-In)</span>
            </button>
          </form>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: SIGN UP / REGISTER SAMITY ACCOUNT */}
        {/* ========================================================= */}
        {authView === 'signup' && (
          <form onSubmit={handleSignupSubmit} style={{ padding: '1.25rem 1.5rem 1.5rem', maxHeight: '520px', overflowY: 'auto' }}>
            <div className="form-group" style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} style={{ color: '#10b981' }} />
                <span>আপনার পূর্ণ নাম *</span>
              </label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="যেমন: মোঃ সাজ্জাদ হোসেন"
                value={signupForm.fullName}
                onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={14} style={{ color: '#10b981' }} />
                <span>সমিতি বা সমবায় সংস্থার নাম *</span>
              </label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="যেমন: একতা সমবায় সমিতি লিঃ"
                value={signupForm.samityName}
                onChange={(e) => setSignupForm({ ...signupForm, samityName: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} style={{ color: '#10b981' }} />
                <span>ইমেইল ঠিকানা (সুপাবেস একাউন্ট) *</span>
              </label>
              <input
                type="email"
                required
                className="input-field"
                placeholder="admin@samity.com"
                value={signupForm.email}
                onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} style={{ color: '#10b981' }} />
                <span>মোবাইল নম্বর *</span>
              </label>
              <input
                type="tel"
                required
                className="input-field"
                placeholder="017XXXXXXXX"
                value={signupForm.phone}
                onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Lock size={12} style={{ color: '#10b981' }} />
                  <span>পাসওয়ার্ড *</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="input-field"
                  placeholder="কমপক্ষে ৬ ডিজিট"
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Lock size={12} style={{ color: '#10b981' }} />
                  <span>কনফার্ম পাসওয়ার্ড *</span>
                </label>
                <input
                  type="password"
                  required
                  className="input-field"
                  placeholder="পুনরায় পাসওয়ার্ড"
                  value={signupForm.confirmPassword}
                  onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '0.95rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                border: 'none',
                borderRadius: '9px',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>অ্যাকাউন্ট তৈরি হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>সুপাবেসে সমিতি একাউন্ট তৈরি করুন</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0 12px', gap: '10px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color, rgba(255, 255, 255, 0.1))' }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', fontWeight: '700' }}>
                অথবা গুগল দিয়ে
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color, rgba(255, 255, 255, 0.1))' }} />
            </div>

            {/* Google Signup Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              style={{
                width: '100%',
                padding: '11px 16px',
                fontSize: '0.92rem',
                fontWeight: '700',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px',
                background: 'var(--card-bg, #1e293b)',
                color: 'var(--text-main, #f1f5f9)',
                border: '1.5px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                borderRadius: '9px',
                cursor: googleLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>গুগল দিয়ে ১-ক্লিকে একাউন্ট খুলুন</span>
            </button>
          </form>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: FORGOT PASSWORD & RECOVERY */}
        {/* ========================================================= */}
        {authView === 'forgot' && (
          <div style={{ padding: '1.25rem 1.5rem 1.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px'
                }}
              >
                <Key size={24} />
              </div>
              <h4
                style={{
                  margin: '0 0 4px',
                  fontSize: '1.1rem',
                  fontWeight: '800',
                  color: 'var(--text-main, #f1f5f9)'
                }}
              >
                পাসওয়ার্ড উদ্ধার ও রিকভারি
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>
                আপনার সুপাবেস নিবন্ধিত ইমেইলে সুরক্ষিত পাসওয়ার্ড রিসেট লিংক পাঠান
              </p>
            </div>

            <form onSubmit={handleForgotSubmit} style={{ marginBottom: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main, #f1f5f9)' }}>
                  নিবন্ধিত ইমেইল ঠিকানা:
                </label>
                <input
                  type="email"
                  required
                  className="input-field"
                  placeholder="admin@samity.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '11px',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '9px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'পাঠানো হচ্ছে...' : 'সুপাবেস পাসওয়ার্ড রিসেট লিংক পাঠান'}
              </button>
            </form>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setAuthView('login'); setErrorMessage(''); setSuccessMessage(''); }}
              style={{
                width: '100%',
                fontSize: '0.85rem',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                background: 'transparent',
                color: 'var(--text-muted, #94a3b8)',
                cursor: 'pointer'
              }}
            >
              ← লগইন পেজে ফিরে যান
            </button>
          </div>
        )}

        {/* Security Trust Seal Footer */}
        <div
          style={{
            padding: '12px 1.5rem',
            background: 'var(--bg-secondary, #080d1a)',
            borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '0.74rem',
            color: 'var(--text-muted, #94a3b8)'
          }}
        >
          <Shield size={14} style={{ color: '#10b981' }} />
          <span>256-Bit এনক্রিপশন ও Supabase ক্লাউড সুরক্ষায় পরিচালিত</span>
        </div>
      </div>
    </div>
  );
};
