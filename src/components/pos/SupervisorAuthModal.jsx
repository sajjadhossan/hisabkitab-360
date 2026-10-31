import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, KeyRound, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import { generateSupervisorAuthStampSync, verifySupervisorAuthPinSync } from '../../services/hashChainService';
import { playButtonClick, playSuccessChime, playWarningTone } from '../../services/soundFeedback';
import { hapticFeedback } from '../../services/nativeAppService';

export const SupervisorAuthModal = ({
  isOpen,
  onClose,
  onAuthorized,
  actionType = 'OVERRIDE',
  actionTitle = '',
  actionDesc = '',
  amount = 0,
  lang = 'bn',
  businessSettings = {}
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMsg('');
      setShake(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDigit = (digit) => {
    playButtonClick?.();
    hapticFeedback?.light?.();
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
      setErrorMsg('');
    }
  };

  const handleBackspace = () => {
    playButtonClick?.();
    hapticFeedback?.light?.();
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    playButtonClick?.();
    setPin('');
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!pin) {
      setErrorMsg(lang === 'bn' ? 'অনুগ্রহ করে সুপারভাইজার পিন দিন' : 'Please enter supervisor PIN');
      return;
    }

    const isValid = verifySupervisorAuthPinSync(pin, businessSettings);
    if (isValid) {
      playSuccessChime?.();
      hapticFeedback?.success?.();
      const stamp = generateSupervisorAuthStampSync(pin, actionType, `AUTH_${Date.now()}`, amount);
      onAuthorized?.(stamp);
      onClose();
    } else {
      playWarningTone?.();
      hapticFeedback?.error?.();
      setErrorMsg(lang === 'bn' ? '❌ ভুল পিন! অনুমোদনের অধিকার নেই।' : '❌ Invalid Supervisor PIN');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPin('');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className={shake ? 'animate-shake' : 'animate-scale-in'}
        style={{
          width: '100%',
          maxWidth: '380px',
          background: 'var(--bg-primary, #ffffff)',
          color: 'var(--text-main, #0f172a)',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1.5px solid rgba(99, 102, 241, 0.4)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)'
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>
                {lang === 'bn' ? 'সুপারভাইজার অনুমোদন গেট' : 'Supervisor Authorization'}
              </h3>
              <div style={{ fontSize: '0.72rem', color: '#6366f1', fontWeight: '700' }}>
                SUPERVISOR PIN GATE
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(0,0,0,0.06)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Detail Note */}
        <div
          style={{
            padding: '12px',
            borderRadius: '12px',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            marginBottom: '16px',
            fontSize: '0.82rem'
          }}
        >
          <div style={{ fontWeight: '800', color: 'var(--text-main, #0f172a)', marginBottom: '3px' }}>
            {actionTitle || (lang === 'bn' ? 'বিশেষ ছাড় বা বাতিলকরণ অনুমোদন' : 'Special Action Authorization')}
          </div>
          <div style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.75rem', lineHeight: '1.4' }}>
            {actionDesc || (lang === 'bn' ? 'এই সংবেদনশীল কাজের জন্য শাখা সুপারভাইজার বা স্টোর ম্যানেজারের পিন প্রয়োজন।' : 'Supervisor PIN is required to approve this sensitive action.')}
          </div>
          {amount > 0 && (
            <div style={{ marginTop: '6px', fontWeight: '800', color: '#6366f1' }}>
              {lang === 'bn' ? `পরিমাণ: ৳${amount.toLocaleString('en-IN')}` : `Amount: ৳${amount.toLocaleString('en-IN')}`}
            </div>
          )}
        </div>

        {/* PIN Display */}
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '16px'
            }}
          >
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pin.length > idx;
              return (
                <div
                  key={idx}
                  style={{
                    width: '46px',
                    height: '52px',
                    borderRadius: '12px',
                    border: isFilled ? '2px solid #6366f1' : '1.5px solid var(--border-color, #e2e8f0)',
                    background: isFilled ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-secondary, #f8fafc)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.6rem',
                    fontWeight: '900',
                    color: '#6366f1',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isFilled ? '•' : ''}
                </div>
              );
            })}
          </div>

          {errorMsg && (
            <div
              style={{
                color: '#ef4444',
                fontSize: '0.78rem',
                fontWeight: '700',
                textAlign: 'center',
                marginBottom: '12px'
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* Keypad */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              marginBottom: '16px'
            }}
          >
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => {
              const isAction = k === 'C' || k === '⌫';
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    if (k === 'C') handleClear();
                    else if (k === '⌫') handleBackspace();
                    else handleDigit(k);
                  }}
                  style={{
                    padding: '14px 0',
                    fontSize: isAction ? '1rem' : '1.25rem',
                    fontWeight: '800',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    background: isAction ? 'rgba(100, 116, 139, 0.1)' : 'var(--bg-secondary, #f8fafc)',
                    color: isAction ? 'var(--text-muted, #64748b)' : 'var(--text-main, #0f172a)',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                  }}
                >
                  {k}
                </button>
              );
            })}
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={pin.length < 4}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '12px',
              fontWeight: '800',
              fontSize: '0.95rem',
              border: 'none',
              background: pin.length >= 4 ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(100, 116, 139, 0.3)',
              color: '#fff',
              cursor: pin.length >= 4 ? 'pointer' : 'not-allowed',
              boxShadow: pin.length >= 4 ? '0 4px 14px rgba(99, 102, 241, 0.4)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Lock size={17} />
            <span>{lang === 'bn' ? 'অনুমোদন নিশ্চিত করুন' : 'Confirm Authorization'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default SupervisorAuthModal;
