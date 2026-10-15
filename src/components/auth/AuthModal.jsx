import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Lock,
  Mail,
  User,
  Store,
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

export const AuthModal = () => {
  const {
    user,
    isAuthenticated,
    isAuthModalOpen,
    closeAuthModal,
    authView,
    setAuthView,
    authLoading,
    authError,
    authSuccess,
    rememberMe,
    setRememberMe,
    savedEmail,
    login,
    loginWithGoogle,
    loginWithPin,
    signup,
    requestPasswordReset,
    resetPasswordWithEmergencyPin,
    isSupabaseActive
  } = useAuth();

  // Login form states
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' | 'pin'
  const [loginEmail, setLoginEmail] = useState(savedEmail || '');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Signup form states
  const [signupForm, setSignupForm] = useState({
    name: '',
    shopName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'admin',
    pin: '1234'
  });

  // Forgot password form states
  const [forgotEmail, setForgotEmail] = useState(savedEmail || '');
  const [emergencyPin, setEmergencyPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);

  if (!isAuthModalOpen) return null;

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (loginMethod === 'pin') {
      loginWithPin(loginPin);
    } else {
      await login({
        email: loginEmail,
        password: loginPassword,
        remember: rememberMe
      });
    }
  };

  // Handle Google 1-Click Login
  const handleGoogleLogin = async () => {
    await loginWithGoogle();
  };

  // Handle Signup Submit
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (signupForm.password !== signupForm.confirmPassword) {
      alert('পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মিলছে না!');
      return;
    }
    await signup(signupForm);
  };

  // Handle Forgot Password Submit
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    await requestPasswordReset(forgotEmail);
  };

  // Handle Emergency PIN Reset
  const handleEmergencyResetSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail || !emergencyPin || !newPassword) {
      alert('সবগুলো ঘর পূরণ করুন');
      return;
    }
    const res = resetPasswordWithEmergencyPin({
      email: forgotEmail,
      recoveryPin: emergencyPin,
      newPassword
    });
    if (res.success) {
      setTimeout(() => {
        setAuthView('login');
        setLoginEmail(forgotEmail);
        setLoginPassword(newPassword);
        setShowEmergencyForm(false);
      }, 1500);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 9999,
        backdropFilter: 'blur(8px)',
        background: 'rgba(15, 23, 42, 0.8)',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: 'max(10px, env(safe-area-inset-top, 10px)) 8px max(16px, env(safe-area-inset-bottom, 16px))'
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
          background: 'var(--card-bg)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          padding: 0
        }}
      >
        {/* Modal Header */}
        <div style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(16, 185, 129, 0.1))', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)' }}>
              🔐
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                হিসাবকিতাব ৩৬০
              </h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                {/* Supabase Status Indicator */}
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isSupabaseActive ? '#10b981' : '#ef4444',
                  boxShadow: isSupabaseActive ? '0 0 8px #10b981' : '0 0 8px #ef4444',
                  display: 'inline-block'
                }} />
                <span style={{ color: isSupabaseActive ? '#10b981' : '#ef4444', fontWeight: '700' }}>
                  {isSupabaseActive ? 'সুপাবেস ক্লাউড সক্রিয়' : 'সুপাবেস কনফিগার করা হয়নি'}
                </span>
              </div>
            </div>
          </div>

          {/* Close button only shown if already authenticated */}
          {isAuthenticated && (
            <button className="btn-icon" onClick={closeAuthModal} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Tab Pills: Sign In, Sign Up, Forgot Password */}
        <div style={{ display: 'flex', padding: '8px 1.5rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setAuthView('login')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: authView === 'login' ? 'var(--business-primary)' : 'transparent',
              color: authView === 'login' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            সাইন ইন (Sign In)
          </button>
          <button
            type="button"
            onClick={() => setAuthView('signup')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: authView === 'signup' ? 'var(--business-primary)' : 'transparent',
              color: authView === 'signup' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            নতুন রেজিস্ট্রেশন
          </button>
          <button
            type="button"
            onClick={() => setAuthView('forgot')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: authView === 'forgot' ? 'var(--business-primary)' : 'transparent',
              color: authView === 'forgot' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            পাসওয়ার্ড উদ্ধার
          </button>
        </div>

        {/* Error / Success Notifications */}
        <div style={{ padding: '0 1.5rem' }}>
          {authError && (
            <div style={{ marginTop: '1rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '0.84rem' }}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span style={{ lineHeight: 1.4 }}>{authError}</span>
            </div>
          )}
          {authSuccess && (
            <div style={{ marginTop: '1rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '0.84rem' }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span style={{ lineHeight: 1.4 }}>{authSuccess}</span>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* VIEW 1: SIGN IN / LOGIN */}
        {/* ========================================================= */}
        {authView === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ padding: '1.25rem 1.5rem 1.5rem' }}>
            {/* Method switch: Email vs PIN */}
            <div style={{ display: 'flex', background: 'var(--bg-primary)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                style={{
                  flex: 1,
                  padding: '6px',
                  borderRadius: '6px',
                  border: 'none',
                  background: loginMethod === 'email' ? 'var(--card-bg)' : 'transparent',
                  color: loginMethod === 'email' ? 'var(--text-main)' : 'var(--text-muted)',
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
                  padding: '6px',
                  borderRadius: '6px',
                  border: 'none',
                  background: loginMethod === 'pin' ? 'var(--card-bg)' : 'transparent',
                  color: loginMethod === 'pin' ? 'var(--text-main)' : 'var(--text-muted)',
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
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '700', marginBottom: '6px' }}>
                    <User size={14} style={{ color: 'var(--business-primary)' }} />
                    <span>ইমেইল, ক্যাশিয়ারের মোবাইল নম্বর বা কাউন্টার কোড</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="মালিকের ইমেইল, ক্যাশিয়ারের মোবাইল (যেমন: 01711111111) বা কাউন্টার (POS-01)"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '700', margin: 0 }}>
                      <Lock size={14} style={{ color: 'var(--business-primary)' }} />
                      <span>পাসওয়ার্ড বা ৪-সংখ্যার পিন (PIN)</span>
                    </label>
                    {/* FORGOT PASSWORD BUTTON */}
                    <button
                      type="button"
                      onClick={() => setAuthView('forgot')}
                      style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                    >
                      পাসওয়ার্ড ভুলে গেছেন?
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="input-field"
                      placeholder="পাসওয়ার্ড অথবা পিন (যেমন: 1234)"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* REMEMBER ME BUTTON / CHECKBOX */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-main)', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--business-primary)', cursor: 'pointer' }}
                    />
                    <span style={{ fontWeight: '600' }}>আমাকে মনে রাখুন (Remember Me)</span>
                  </label>
                </div>
              </>
            ) : (
              /* Quick PIN Login Pad */
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    ৪-সংখ্যার ক্যাশিয়ার পিন (PIN) দিন (ডিফল্ট: 1234)
                  </label>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '8px' }}>
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        style={{
                          width: '44px',
                          height: '48px',
                          borderRadius: '8px',
                          border: '2px solid var(--border-color)',
                          background: 'var(--bg-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.4rem',
                          fontWeight: '800',
                          color: 'var(--business-primary)'
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
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-main)',
                        cursor: 'pointer'
                      }}
                    >
                      {btn}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={authLoading}
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
                border: 'none',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
              }}
            >
              {authLoading ? (
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
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700' }}>অথবা ১-ক্লিকে</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
            </div>

            {/* Google 1-Click Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={authLoading}
              style={{
                width: '100%',
                padding: '11px 16px',
                fontSize: '0.92rem',
                fontWeight: '700',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px',
                background: 'var(--card-bg)',
                color: 'var(--text-main)',
                border: '1.5px solid var(--border-color)',
                borderRadius: '8px',
                cursor: authLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                transition: 'all 0.2s ease'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>গুগল দিয়ে সাইন ইন (Google Sign-In)</span>
            </button>
          </form>
        )}


        {/* ========================================================= */}
        {/* VIEW 2: SIGN UP / CREATE STORE ACCOUNT */}
        {/* ========================================================= */}
        {authView === 'signup' && (
          <form onSubmit={handleSignupSubmit} style={{ padding: '1.25rem 1.5rem 1.5rem', maxHeight: '500px', overflowY: 'auto' }}>
            <div className="form-group" style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700' }}>আপনার পূর্ণ নাম *</label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="যেমন: মোঃ রফিকুল ইসলাম"
                value={signupForm.name}
                onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700' }}>দোকান বা ব্যবসা প্রতিষ্ঠানের নাম *</label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="যেমন: আল-মদিনা সুপার শপ"
                value={signupForm.shopName}
                onChange={(e) => setSignupForm({ ...signupForm, shopName: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700' }}>ইমেইল ঠিকানা (সুপাবেস একাউন্ট) *</label>
              <input
                type="email"
                required
                className="input-field"
                placeholder="owner@example.com"
                value={signupForm.email}
                onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700' }}>মোবাইল নম্বর *</label>
              <input
                type="tel"
                required
                className="input-field"
                placeholder="017XXXXXXXX"
                value={signupForm.phone}
                onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: '700' }}>পাসওয়ার্ড *</label>
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
                <label style={{ fontSize: '0.8rem', fontWeight: '700' }}>কনফার্ম পাসওয়ার্ড *</label>
                <input
                  type="password"
                  required
                  className="input-field"
                  placeholder="পুনরায় পাসওয়ার্ড দিন"
                  value={signupForm.confirmPassword}
                  onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: '700' }}>ইউজার রোল</label>
                <select
                  className="input-field"
                  value={signupForm.role}
                  onChange={(e) => setSignupForm({ ...signupForm, role: e.target.value })}
                >
                  <option value="owner">দোকানের মালিক (Owner / Super Admin)</option>
                  <option value="cashier">ক্যাশ কাউন্টার ক্যাশিয়ার (Cashier)</option>
                  <option value="salesman">দোকানের সেলসম্যান (Salesman)</option>
                  <option value="sr">এসআর / ফিল্ড অফিসার (SR - Field Rep)</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: '700' }}>৪-সংখ্যার পিন (PIN)</label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  className="input-field"
                  placeholder="1234"
                  value={signupForm.pin}
                  onChange={(e) => setSignupForm({ ...signupForm, pin: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '0.95rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
              }}
            >
              <Sparkles size={16} />
              <span>সুপাবেসে একাউন্ট তৈরি করুন</span>
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0 12px', gap: '10px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700' }}>অথবা গুগল দিয়ে</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
            </div>

            {/* Google Sign In/Up */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={authLoading}
              style={{
                width: '100%',
                padding: '11px 16px',
                fontSize: '0.92rem',
                fontWeight: '700',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px',
                background: 'var(--card-bg)',
                color: 'var(--text-main)',
                border: '1.5px solid var(--border-color)',
                borderRadius: '8px',
                cursor: authLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
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
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <Key size={24} />
              </div>
              <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                পাসওয়ার্ড উদ্ধার ও রিকভারি
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                আপনার সুপাবেস নিবন্ধিত ইমেইলে সুরক্ষিত পাসওয়ার্ড রিসেট লিংক পাঠান
              </p>
            </div>

            <form onSubmit={handleForgotSubmit} style={{ marginBottom: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700' }}>নিবন্ধিত ইমেইল ঠিকানা:</label>
                <input
                  type="email"
                  required
                  className="input-field"
                  placeholder="name@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '11px', fontWeight: '800', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none' }}
              >
                সুপাবেস পাসওয়ার্ড রিসেট লিংক পাঠান
              </button>
            </form>

            {/* Emergency Offline PIN Reset Drawer */}
            <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
              <div
                style={{ fontSize: '0.84rem', fontWeight: '800', color: '#f59e0b', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                onClick={() => setShowEmergencyForm(!showEmergencyForm)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={16} />
                  <span>জরুরি অফলাইন মাস্টার রিকভারি পিন</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {showEmergencyForm ? '▲ বন্ধ' : '▼ খুলুন'}
                </span>
              </div>

              {showEmergencyForm && (
                <form onSubmit={handleEmergencyResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    জরুরি মাস্টার পিন কোড: <strong>1994</strong> (অথবা <strong>889900</strong>)
                  </p>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="মাস্টার রিকভারি পিন (1994 বা 889900)"
                    value={emergencyPin}
                    onChange={(e) => setEmergencyPin(e.target.value)}
                  />
                  <input
                    type="password"
                    required
                    className="input-field"
                    placeholder="নতুন পাসওয়ার্ড দিন"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="btn btn-secondary"
                    style={{ fontWeight: '700', color: '#10b981', borderColor: '#10b981' }}
                  >
                    ✓ জরুরি পিন দিয়ে উদ্ধার করুন
                  </button>
                </form>
              )}
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setAuthView('login')}
              style={{ width: '100%', fontSize: '0.85rem' }}
            >
              ← লগইন পেজে ফিরে যান
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
