import React, { useState, useMemo } from 'react';
import {
  X,
  Banknote,
  RotateCcw,
  CheckCircle2,
  Copy,
  ArrowRight,
  TrendingUp,
  Coins,
  Sparkles
} from 'lucide-react';
import { playButtonClick, playCartPop, playSuccessChime } from '../../services/soundFeedback';

const BDT_DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];

export const DenominationCalculatorModal = ({
  isOpen,
  onClose,
  targetAmount = 0,
  onApplyCountedAmount,
  lang = 'bn',
  showToast
}) => {
  const [counts, setCounts] = useState(() => {
    const init = {};
    BDT_DENOMINATIONS.forEach(d => { init[d] = 0; });
    return init;
  });

  if (!isOpen) return null;

  const totalCounted = useMemo(() => {
    return BDT_DENOMINATIONS.reduce((sum, denom) => {
      return sum + (denom * (counts[denom] || 0));
    }, 0);
  }, [counts]);

  const difference = totalCounted - targetAmount;

  const handleCountChange = (denom, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setCounts(prev => ({ ...prev, [denom]: num }));
  };

  const handleIncrement = (denom, delta) => {
    playButtonClick();
    setCounts(prev => ({
      ...prev,
      [denom]: Math.max(0, (prev[denom] || 0) + delta)
    }));
  };

  const handleReset = () => {
    playButtonClick();
    const init = {};
    BDT_DENOMINATIONS.forEach(d => { init[d] = 0; });
    setCounts(init);
    if (showToast) showToast(lang === 'bn' ? 'নোটের গণনা রিসেট করা হয়েছে' : 'Counts reset', 'info');
  };

  const handleApply = () => {
    if (totalCounted <= 0) {
      if (showToast) showToast(lang === 'bn' ? 'কোনো নোট ইনপুট দেওয়া হয়নি!' : 'No cash counted yet!', 'warning');
      return;
    }
    playSuccessChime();
    if (onApplyCountedAmount) {
      onApplyCountedAmount(totalCounted);
    }
    if (showToast) {
      showToast(
        lang === 'bn' ? `✓ ৳${totalCounted.toLocaleString()} পেইড ক্যাশ হিসেবে সেট করা হয়েছে!` : `✓ ৳${totalCounted} applied as received cash!`,
        'success'
      );
    }
    onClose();
  };

  const handleCopyBreakdown = () => {
    let text = `=== HisabKitab 360 Cash Counter ===\n`;
    BDT_DENOMINATIONS.forEach(d => {
      if (counts[d] > 0) {
        text += `৳${d} x ${counts[d]} = ৳${d * counts[d]}\n`;
      }
    });
    text += `---------------------------------\n`;
    text += `Total: ৳${totalCounted}\n`;
    if (targetAmount > 0) {
      text += `Bill Target: ৳${targetAmount}\n`;
      text += `Change / Difference: ৳${difference}\n`;
    }
    text += `Time: ${new Date().toLocaleString()}\n`;

    try {
      navigator.clipboard.writeText(text);
      if (showToast) showToast(lang === 'bn' ? 'ক্যাশ ব্রেকডাউন ক্লিপবোর্ডে কপি হয়েছে' : 'Copied breakdown to clipboard', 'success');
    } catch {}
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface-color, #1e293b)',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '540px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          color: '#f8fafc',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Banknote size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800' }}>
                {lang === 'bn' ? 'ক্যাশ কাউন্টার ও নোট ক্যালকুলেটর' : 'Cash Denomination Counter'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                {lang === 'bn' ? 'কাউন্টারে দ্রুত নোট গুনে ড্রয়ার মিলানো ও ক্যাশ টেন্ডার' : 'Fast cash tally and change calculation (BDT)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Summary Metric Ribbon */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: targetAmount > 0 ? '1fr 1fr 1fr' : '1fr',
            gap: '8px',
            padding: '1rem 1.5rem',
            background: 'rgba(15, 23, 42, 0.6)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700' }}>
              {lang === 'bn' ? 'মোট গণনা করা ক্যাশ' : 'Counted Cash'}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#10b981', fontFamily: 'monospace' }}>
              ৳{totalCounted.toLocaleString()}
            </div>
          </div>

          {targetAmount > 0 && (
            <>
              <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700' }}>
                  {lang === 'bn' ? 'বিলের প্রদেয় টাকা' : 'Bill Total'}
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#818cf8', fontFamily: 'monospace' }}>
                  ৳{Number(targetAmount).toLocaleString()}
                </div>
              </div>

              <div style={{
                background: difference >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                padding: '10px 12px',
                borderRadius: '12px',
                border: difference >= 0 ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)'
              }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700' }}>
                  {difference >= 0 ? (lang === 'bn' ? 'ফেরত দিন (Change)' : 'Change Due') : (lang === 'bn' ? 'কম টাকা (Short)' : 'Shortfall')}
                </div>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: '900',
                  color: difference >= 0 ? '#10b981' : '#ef4444',
                  fontFamily: 'monospace'
                }}>
                  ৳{Math.abs(difference).toLocaleString()}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Notes Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {BDT_DENOMINATIONS.map(denom => {
            const count = counts[denom] || 0;
            const sub = denom * count;

            return (
              <div
                key={denom}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '14px',
                  background: count > 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(15, 23, 42, 0.4)',
                  border: count > 0 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '90px' }}>
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      fontSize: '0.88rem',
                      fontWeight: '800',
                      color: denom >= 500 ? '#f59e0b' : denom >= 100 ? '#10b981' : '#38bdf8'
                    }}
                  >
                    ৳{denom}
                  </span>
                </div>

                {/* Input & Steppers */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleIncrement(denom, -1)}
                    disabled={count === 0}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#ffffff',
                      cursor: count === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '800'
                    }}
                  >
                    -
                  </button>

                  <input
                    type="number"
                    min="0"
                    value={count === 0 ? '' : count}
                    onChange={(e) => handleCountChange(denom, e.target.value)}
                    placeholder="০"
                    style={{
                      width: '64px',
                      textAlign: 'center',
                      padding: '6px 4px',
                      borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      fontWeight: '800'
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => handleIncrement(denom, 1)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '800'
                    }}
                  >
                    +
                  </button>

                  <button
                    type="button"
                    onClick={() => handleIncrement(denom, 5)}
                    style={{
                      padding: '4px 6px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '0.72rem',
                      fontWeight: '700'
                    }}
                  >
                    +৫
                  </button>
                </div>

                {/* Subtotal */}
                <div style={{ textAlign: 'right', width: '90px' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: '800', color: count > 0 ? '#10b981' : '#64748b', fontFamily: 'monospace' }}>
                    ৳{sub.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleReset}
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
                fontWeight: '700'
              }}
            >
              <RotateCcw size={15} />
              <span>{lang === 'bn' ? 'রিসেট' : 'Reset'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyBreakdown}
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
                fontWeight: '700'
              }}
            >
              <Copy size={15} />
              <span>{lang === 'bn' ? 'কপি' : 'Copy'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleApply}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              fontWeight: '800',
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)'
            }}
          >
            <CheckCircle2 size={18} />
            <span>{lang === 'bn' ? 'ক্যাশ টেন্ডার হিসেবে নিন' : 'Apply Counted Cash'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
