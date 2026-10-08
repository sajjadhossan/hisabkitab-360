import React, { useState, useMemo } from 'react';
import { Banknote, X, Copy, RotateCcw, Check, Sparkles } from 'lucide-react';
import { hapticFeedback } from '../../services/nativeAppService';
import { useApp } from '../../context/AppContext';

export const CashDenominationModal = ({ isOpen, onClose, onApplyToDrawer }) => {
  const { lang, showToast } = useApp();

  const DENOMINATIONS = [
    { value: 1000, label: '৳১,০০০', color: '#dc2626' },
    { value: 500, label: '৳৫০০', color: '#059669' },
    { value: 200, label: '৳২০০', color: '#d97706' },
    { value: 100, label: '৳১০০', color: '#2563eb' },
    { value: 50, label: '৳৫০', color: '#7c3aed' },
    { value: 20, label: '৳২০', color: '#0891b2' },
    { value: 10, label: '৳১০', color: '#ea580c' },
    { value: 5, label: '৳৫', color: '#475569' },
    { value: 2, label: '৳২', color: '#64748b' },
    { value: 1, label: '৳১', color: '#94a3b8' }
  ];

  const [counts, setCounts] = useState(() => {
    const initial = {};
    DENOMINATIONS.forEach(d => { initial[d.value] = ''; });
    return initial;
  });

  const [copied, setCopied] = useState(false);

  const handleCountChange = (val, countStr) => {
    setCounts(prev => ({
      ...prev,
      [val]: countStr.replace(/[^0-9]/g, '')
    }));
  };

  const handleStep = (val, delta) => {
    hapticFeedback.light();
    setCounts(prev => {
      const cur = Number(prev[val]) || 0;
      const next = Math.max(0, cur + delta);
      return { ...prev, [val]: next === 0 ? '' : String(next) };
    });
  };

  const handleReset = () => {
    hapticFeedback.medium();
    const empty = {};
    DENOMINATIONS.forEach(d => { empty[d.value] = ''; });
    setCounts(empty);
  };

  // Calculations
  const { totalAmount, totalNotesCount } = useMemo(() => {
    let amt = 0;
    let notes = 0;
    DENOMINATIONS.forEach(d => {
      const c = Number(counts[d.value]) || 0;
      amt += d.value * c;
      notes += c;
    });
    return { totalAmount: amt, totalNotesCount: notes };
  }, [counts]);

  const handleCopySummary = () => {
    hapticFeedback.light();
    let text = `💵 *ক্যাশ ড্রয়ার নোট গণনা (হিসাবকিতাব ৩৬০)*\n`;
    text += `তারিখ: ${new Date().toLocaleDateString('bn-BD')} ${new Date().toLocaleTimeString('bn-BD')}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    DENOMINATIONS.forEach(d => {
      const c = Number(counts[d.value]) || 0;
      if (c > 0) {
        text += `• ${d.label} × ${c} টি = ৳${(d.value * c).toLocaleString()}\n`;
      }
    });
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 মোট ক্যাশ: ৳${totalAmount.toLocaleString()} (${totalNotesCount} টি নোট/কয়েন)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast(lang === 'bn' ? 'নোটের পূর্ণ বিবরণ ক্লিপবোর্ডে কপি হয়েছে!' : 'Cash summary copied!');
  };

  const handleApply = () => {
    if (onApplyToDrawer) {
      onApplyToDrawer(totalAmount);
    }
    hapticFeedback.success();
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" style={{ zIndex: 1250 }}>
      <div
        className="modal-content animate-scale-up"
        style={{
          maxWidth: '480px',
          width: '95%',
          background: 'var(--bg-card)',
          borderRadius: '20px',
          border: '1.5px solid rgba(16, 185, 129, 0.4)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
          padding: '1.25rem',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <Banknote size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'ক্যাশ নোট গণক (Denomination)' : 'Cash Note Counter'}
              </h3>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'ড্রয়ার ক্যাশ মেলানোর স্মার্ট নোট কাউন্টার' : 'Calculate drawer cash note-by-note'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Live Total Display Banner */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(99, 102, 241, 0.15))',
            border: '1.5px solid rgba(16, 185, 129, 0.35)',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>
              {lang === 'bn' ? 'মোট নগদ স্থিতি:' : 'Total Cash:'}
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#10b981', fontFamily: 'var(--font-mono)', lineHeight: 1.2 }}>
              ৳{totalAmount.toLocaleString()}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '4px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800' }}>
              {totalNotesCount} {lang === 'bn' ? 'টি নোট/কয়েন' : 'Notes/Coins'}
            </span>
          </div>
        </div>

        {/* Denominations Grid (Scrollable) */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '50vh' }}>
          {DENOMINATIONS.map(d => {
            const count = Number(counts[d.value]) || 0;
            const sub = d.value * count;
            return (
              <div
                key={d.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '12px',
                  background: count > 0 ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-secondary)',
                  border: count > 0 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-color)',
                  gap: '8px'
                }}
              >
                {/* Note Badge */}
                <div style={{ minWidth: '70px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      padding: '3px 7px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: '800',
                      background: d.color + '22',
                      color: d.color,
                      border: `1px solid ${d.color}44`
                    }}
                  >
                    {d.label}
                  </span>
                </div>

                {/* Counter Stepper */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => handleStep(d.value, -1)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-main)',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    -
                  </button>

                  <input
                    type="number"
                    min="0"
                    placeholder="০"
                    value={counts[d.value]}
                    onChange={(e) => handleCountChange(d.value, e.target.value)}
                    style={{
                      width: '54px',
                      height: '28px',
                      textAlign: 'center',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-main)',
                      fontSize: '0.88rem',
                      fontWeight: '800'
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => handleStep(d.value, 1)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: 'var(--business-primary)',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    +
                  </button>
                </div>

                {/* Subtotal */}
                <div style={{ minWidth: '70px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: '800', color: count > 0 ? '#10b981' : 'var(--text-muted)' }}>
                  ৳{sub.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: onApplyToDrawer ? '1fr 1fr 1fr' : '1fr 1fr', gap: '8px', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={handleReset}
            style={{
              padding: '8px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: '0.78rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={14} />
            <span>{lang === 'bn' ? 'রিসেট' : 'Reset'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopySummary}
            style={{
              padding: '8px',
              borderRadius: '10px',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              background: 'rgba(99, 102, 241, 0.12)',
              color: '#818cf8',
              fontSize: '0.78rem',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : (lang === 'bn' ? 'কপি বিবরণ' : 'Copy')}</span>
          </button>

          {onApplyToDrawer && (
            <button
              type="button"
              onClick={handleApply}
              style={{
                padding: '8px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                fontSize: '0.78rem',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Check size={14} />
              <span>{lang === 'bn' ? 'ক্যাশে বসান' : 'Apply'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
