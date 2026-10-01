import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Lock, Key, X, ArrowRight, AlertCircle } from 'lucide-react';

export const MasterPinModal = ({ isOpen, onClose, onSuccess }) => {
  const { verifyMasterPin } = useAuth();
  const { lang, showToast } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pin) {
      setError(lang === 'bn' ? 'পিন লিখুন' : 'Enter PIN');
      return;
    }
    const isValid = verifyMasterPin(pin);
    if (isValid) {
      showToast(lang === 'bn' ? '🎉 সুপার অ্যাডমিন অ্যাক্সেস অনুমোদিত!' : 'Super Admin access granted!');
      setError('');
      setPin('');
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } else {
      setError(lang === 'bn' ? 'ভুল মাস্টার পিন! পুনরায় চেষ্টা করুন।' : 'Incorrect master PIN!');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div className="fade-in" style={{
        background: 'var(--bg-secondary)',
        border: '1.5px solid rgba(239, 68, 68, 0.4)',
        borderRadius: '20px',
        padding: '2rem',
        maxWidth: '420px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(239, 68, 68, 0.2)',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4)',
            marginBottom: '1rem'
          }}>
            <ShieldCheck size={36} />
          </div>
          <h3 style={{ margin: '0 0 6px', fontSize: '1.3rem', fontWeight: '900', color: 'var(--text-main)' }}>
            {lang === 'bn' ? 'মাস্টার সিকিউরিটি অ্যাক্সেস' : 'Master Security Access'}
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {lang === 'bn' 
              ? 'ভেন্ডর ও সুপার অ্যাডমিন প্যানেলে প্রবেশ করতে আপনার সিক্রেট মাস্টার পিন দিন (ডিফল্ট: 9999)' 
              : 'Enter Master PIN to access Vendor Control Suite (Default: 9999)'}
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            borderRadius: '10px',
            padding: '8px 12px',
            color: '#ef4444',
            fontSize: '0.85rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '1rem'
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="মাস্টার পিন দিন (PIN)"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1.5px solid var(--border-color)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-main)',
                  fontSize: '1.2rem',
                  letterSpacing: '0.25em',
                  textAlign: 'center',
                  fontWeight: '800',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn"
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                flex: 2,
                padding: '12px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: '#ffffff',
                border: 'none',
                fontWeight: '800',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)'
              }}
            >
              আনলক করুন <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
