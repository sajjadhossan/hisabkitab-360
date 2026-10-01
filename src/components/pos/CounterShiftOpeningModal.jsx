import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  Sun,
  Banknote,
  CheckCircle2,
  X,
  Store,
  Monitor,
  User,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const CounterShiftOpeningModal = ({ isOpen, onClose, onShiftOpened }) => {
  const {
    activeBranch,
    activeCounter,
    adjustCounterCash,
    lang,
    showToast,
    playScannerBeep
  } = useApp();

  const { user } = useAuth();

  const [openingCash, setOpeningCash] = useState(
    () => Number(activeCounter?.openingFloat) || 1000
  );
  const [openingNote, setOpeningNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const floatAmount = Number(openingCash);
    if (isNaN(floatAmount) || floatAmount < 0) {
      alert(lang === 'bn' ? 'দয়া করে সঠিক টাকার পরিমাণ দিন।' : 'Please enter valid float amount.');
      return;
    }

    // Record shift opening
    const today = new Date().toISOString().split('T')[0];
    const shiftRecord = {
      id: `shf-${Date.now()}`,
      branchId: activeBranch?.id,
      branchName: activeBranch?.name,
      counterId: activeCounter?.id,
      counterName: activeCounter?.name,
      cashierName: user?.name || 'কাউন্টার ক্যাশিয়ার',
      openingCash: floatAmount,
      date: today,
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      note: openingNote || (lang === 'bn' ? 'সকালের ক্যাশ ফ্লোট নিশ্চিত করা হয়েছে' : 'Morning float confirmed')
    };

    try {
      const existing = JSON.parse(localStorage.getItem('hk360_counter_shifts') || '[]');
      localStorage.setItem('hk360_counter_shifts', JSON.stringify([shiftRecord, ...existing]));
      localStorage.setItem(`hk360_shift_active_${activeCounter?.id}_${today}`, 'true');
    } catch {
      // storage
    }

    // Play pleasant chime
    try {
      playScannerBeep();
    } catch { }

    showToast(
      lang === 'bn'
        ? `🌅 সকালের শিফট শুরু হয়েছে! ড্রয়ারে প্রারম্ভিক ক্যাশ: ৳${floatAmount.toLocaleString()}`
        : `🌅 Morning shift started! Opening Cash: ৳${floatAmount.toLocaleString()}`,
      'success'
    );

    if (onShiftOpened) onShiftOpened(shiftRecord);
    onClose();
  };

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 1200, backdropFilter: 'blur(6px)' }}>
      <div
        className="glass-card modal-container"
        style={{
          maxWidth: '480px',
          width: '92%',
          padding: '1.75rem',
          borderRadius: '18px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
          border: '1.5px solid rgba(16, 185, 129, 0.4)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)'
              }}
            >
              <Sun size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                {lang === 'bn' ? 'সকালের শিফট শুরু ও ক্যাশ ওপেন' : 'Morning Shift & Cash Opening'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'ড্রয়ারে প্রারম্ভিক ক্যাশ (চেঞ্জ টাকা) গুনে শিফট শুরু করুন' : 'Confirm drawer opening float before starting sales'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Info Pill */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            padding: '12px 14px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            marginBottom: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '0.82rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Store size={14} /> {lang === 'bn' ? 'নির্ধারিত শাখা:' : 'Branch:'}
            </span>
            <strong style={{ color: 'var(--text-main)' }}>{activeBranch?.name || 'প্রধান শাখা'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Monitor size={14} /> {lang === 'bn' ? 'ক্যাশ কাউন্টার:' : 'Counter:'}
            </span>
            <strong style={{ color: '#10b981' }}>{activeCounter?.name || 'কাউন্টার ০১'} ({activeCounter?.code || 'POS-01'})</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <User size={14} /> {lang === 'bn' ? 'অপারেটর / ক্যাশিয়ার:' : 'Cashier:'}
            </span>
            <strong style={{ color: 'var(--text-main)' }}>{user?.name || 'কাউন্টার ক্যাশিয়ার'}</strong>
          </div>
        </div>

        {/* Opening Cash Input Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.86rem', fontWeight: '800', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
              {lang === 'bn' ? '💵 প্রারম্ভিক ক্যাশ (Opening Float / চেঞ্জের টাকা):' : '💵 Opening Cash in Drawer:'} *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                min="0"
                step="any"
                required
                className="input-field"
                style={{
                  fontSize: '1.4rem',
                  fontWeight: '900',
                  color: '#10b981',
                  fontFamily: 'var(--font-mono)',
                  paddingLeft: '32px'
                }}
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
              />
              <span
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontWeight: '800',
                  fontSize: '1.1rem',
                  color: 'var(--text-muted)'
                }}
              >
                ৳
              </span>
            </div>

            {/* Quick Amount Suggestion Buttons */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
              {[500, 1000, 2000, 3000, 5000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setOpeningCash(val)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: Number(openingCash) === val ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                    background: Number(openingCash) === val ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-secondary)',
                    color: Number(openingCash) === val ? '#10b981' : 'var(--text-main)',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    fontWeight: '700',
                    transition: 'all 0.15s ease'
                  }}
                >
                  ৳{val.toLocaleString()}
                </button>
              ))}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {lang === 'bn' ? 'ড্রয়ারে মালিকের রেখে যাওয়া খুচরা টাকা গুনে মিল করে লিখুন' : 'Count physical notes/coins in cash drawer'}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
              {lang === 'bn' ? 'নোট / মন্তব্য (ঐচ্ছিক):' : 'Note (Optional):'}
            </label>
            <input
              type="text"
              className="input-field"
              placeholder={lang === 'bn' ? 'যেমন: সকালের ড্রয়ার ক্যাশ বুঝে পেয়েছি' : 'e.g. Received morning float from owner'}
              value={openingNote}
              onChange={(e) => setOpeningNote(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ flex: 1 }}
            >
              {lang === 'bn' ? 'পরে করব' : 'Skip for now'}
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                flex: 2,
                background: 'linear-gradient(135deg, #10b981, #059669)',
                borderColor: '#10b981',
                fontWeight: '900',
                fontSize: '0.92rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '11px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
              }}
            >
              <CheckCircle2 size={18} />
              <span>{lang === 'bn' ? '🚀 ক্যাশ কাউন্টার চালু করুন' : '🚀 Start Shift Now'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
