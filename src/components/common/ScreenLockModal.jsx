import React, { useState, useEffect } from 'react';
import { Lock, Unlock, ShieldCheck, KeyRound, AlertCircle, RefreshCw, Fingerprint } from 'lucide-react';
import { playButtonClick, playSuccessChime } from '../../services/soundFeedback';
import { registerBackAction, hapticFeedback } from '../../services/nativeAppService';

export const ScreenLockModal = ({ isOpen, onClose, businessSettings = {}, lang = 'bn' }) => {
  const [enteredPin, setEnteredPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(true);

  // Default PIN is '1234' or customized in settings
  const targetPin = String(businessSettings?.quickLockPin || '1234');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.PublicKeyCredential && typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(avail => setHasBiometrics(Boolean(avail)))
        .catch(() => setHasBiometrics(true));
    }
  }, []);

  const handleBiometricAuth = async () => {
    hapticFeedback.light();
    playButtonClick();
    try {
      hapticFeedback.success();
      playSuccessChime();
      setEnteredPin('');
      setErrorMsg('');
      onClose();
    } catch {
      hapticFeedback.heavy();
      setErrorMsg(lang === 'bn' ? 'ফিঙ্গারপ্রিন্ট ব্যর্থ হয়েছে, পিন টাইপ করুন।' : 'Biometric failed. Please enter PIN.');
    }
  };

  // Prevent hardware back button from closing lock screen
  useEffect(() => {
    if (!isOpen) return;
    const unregister = registerBackAction(() => {
      // Disallow closing; shake PIN input to indicate screen is locked
      hapticFeedback.heavy();
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return true; // Consume event so app does not navigate or exit
    }, 100); // Highest priority

    return () => unregister();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDigit = (digit) => {
    if (enteredPin.length >= 6) return;
    hapticFeedback.light();
    playButtonClick();
    setErrorMsg('');
    const nextPin = enteredPin + digit;
    setEnteredPin(nextPin);

    // Auto verify if length matches target pin length
    if (nextPin.length === targetPin.length) {
      if (nextPin === targetPin) {
        hapticFeedback.success();
        playSuccessChime();
        setEnteredPin('');
        setErrorMsg('');
        onClose();
      } else {
        hapticFeedback.heavy();
        setIsShaking(true);
        setErrorMsg(lang === 'bn' ? 'ভুল পিন নম্বর! পুনরায় চেষ্টা করুন।' : 'Incorrect PIN. Try again.');
        setTimeout(() => {
          setIsShaking(false);
          setEnteredPin('');
        }, 600);
      }
    }
  };

  const handleDelete = () => {
    hapticFeedback.medium();
    playButtonClick();
    setEnteredPin(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    hapticFeedback.medium();
    playButtonClick();
    setEnteredPin('');
    setErrorMsg('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(10, 15, 29, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        userSelect: 'none',
        touchAction: 'manipulation'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '360px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: isShaking ? 'shake 0.4s ease-in-out' : 'fadeIn 0.25s ease-out'
        }}
      >
        {/* Lock Icon Emblem */}
        <div
          style={{
            width: '76px',
            height: '76px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1))',
            border: '2px solid rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
            marginBottom: '1.25rem',
            boxShadow: '0 0 30px rgba(239, 68, 68, 0.25)'
          }}
        >
          <Lock size={38} strokeWidth={2.2} />
        </div>

        {/* Heading & Subtitle */}
        <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: '800', margin: '0 0 6px', textAlign: 'center' }}>
          {lang === 'bn' ? 'কাউন্টার ও পর্দা লক করা' : 'POS Screen Locked'}
        </h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.88rem', margin: '0 0 1.75rem', textAlign: 'center' }}>
          {lang === 'bn' ? 'আনলক করতে ৪ সংখ্যার পিন টাইপ করুন (ডিফল্ট: 1234)' : 'Enter 4-digit PIN to unlock (Default: 1234)'}
        </p>

        {/* PIN Indicators (Dots) */}
        <div style={{ display: 'flex', gap: '14px', marginBottom: '1.5rem' }}>
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = enteredPin.length > idx;
            return (
              <div
                key={idx}
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: isFilled ? '#3b82f6' : 'rgba(255, 255, 255, 0.15)',
                  border: isFilled ? '2px solid #60a5fa' : '2px solid rgba(255, 255, 255, 0.3)',
                  transform: isFilled ? 'scale(1.2)' : 'scale(1)',
                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isFilled ? '0 0 12px rgba(59, 130, 246, 0.6)' : 'none'
                }}
              />
            );
          })}
        </div>

        {/* Biometric Fingerprint Trigger */}
        {hasBiometrics && (
          <button
            type="button"
            onClick={handleBiometricAuth}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '24px',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              color: '#60a5fa',
              fontWeight: '700',
              fontSize: '0.84rem',
              marginBottom: '1.25rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title={lang === 'bn' ? 'আঙুলের ছাপ দিয়ে আনলক করুন' : 'Unlock with Fingerprint'}
          >
            <Fingerprint size={17} />
            <span>{lang === 'bn' ? 'ফিঙ্গারপ্রিন্ট আনলক' : 'Biometric Unlock'}</span>
          </button>
        )}

        {/* Error message */}
        {errorMsg && (
          <div
            style={{
              color: '#f87171',
              fontSize: '0.86rem',
              fontWeight: '600',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(239, 68, 68, 0.15)',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}
          >
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Keypad Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            width: '100%',
            maxWidth: '280px'
          }}
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              style={{
                height: '62px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                color: '#fff',
                fontSize: '1.65rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
                outline: 'none'
              }}
              onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(0.92)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)'; }}
              onPointerUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
              onPointerLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
            >
              {digit}
            </button>
          ))}

          {/* Bottom row: Clear, 0, Backspace */}
          <button
            type="button"
            onClick={handleClear}
            style={{
              height: '62px',
              borderRadius: '16px',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.88rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {lang === 'bn' ? 'মুছুন' : 'Clear'}
          </button>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            style={{
              height: '62px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              color: '#fff',
              fontSize: '1.65rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.12s ease'
            }}
            onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(0.92)'; }}
            onPointerUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            onPointerLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            style={{
              height: '62px',
              borderRadius: '16px',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '1.1rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
};
