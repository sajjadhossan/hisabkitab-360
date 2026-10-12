import React, { useState, useMemo } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Divide,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { playButtonClick, playSuccessChime, playWarningTone } from '../../services/soundFeedback';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'ক্যাশ টাকা (Cash)', enLabel: 'Cash', icon: Banknote, color: '#10b981' },
  { id: 'bkash', label: 'বিকাশ (bKash)', enLabel: 'bKash', icon: Smartphone, color: '#e2136e' },
  { id: 'nagad', label: 'নগদ (Nagad)', enLabel: 'Nagad', icon: Smartphone, color: '#f7941d' },
  { id: 'card', label: 'ব্যাংক / কার্ড (Card)', enLabel: 'Bank / Card', icon: CreditCard, color: '#3b82f6' },
  { id: 'rocket', label: 'রকেট (Rocket)', enLabel: 'Rocket', icon: Smartphone, color: '#8b5cf6' }
];

export const SplitPaymentModal = ({
  isOpen,
  onClose,
  grandTotal = 0,
  onConfirmSplitPayment,
  lang = 'bn',
  showToast
}) => {
  const [allocations, setAllocations] = useState(() => {
    // Default initial allocation: half cash, half empty or all cash
    return {
      cash: Math.round(grandTotal / 2) || 0,
      bkash: (grandTotal - Math.round(grandTotal / 2)) || 0,
      nagad: 0,
      card: 0,
      rocket: 0
    };
  });

  const totalAllocated = useMemo(() => {
    return Object.values(allocations).reduce((sum, v) => sum + (Number(v) || 0), 0);
  }, [allocations]);

  const remaining = grandTotal - totalAllocated;
  const isExact = remaining === 0;

  const handleAmountChange = (methodId, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setAllocations(prev => ({
      ...prev,
      [methodId]: num
    }));
  };

  const handleFillRemaining = (methodId) => {
    playButtonClick();
    if (remaining <= 0) return;
    setAllocations(prev => ({
      ...prev,
      [methodId]: (prev[methodId] || 0) + remaining
    }));
  };

  const handleEqualSplit = (m1, m2) => {
    playButtonClick();
    const half = Math.floor(grandTotal / 2);
    setAllocations({
      cash: 0,
      bkash: 0,
      nagad: 0,
      card: 0,
      rocket: 0,
      [m1]: half,
      [m2]: grandTotal - half
    });
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (totalAllocated < grandTotal) {
      playWarningTone();
      if (showToast) {
        showToast(
          lang === 'bn' ? `⚠️ আরও ৳${remaining.toLocaleString()} বরাদ্দ করা বাকি রয়েছে!` : `⚠️ ৳${remaining} remaining to allocate!`,
          'warning'
        );
      }
      return;
    }

    const splitList = Object.entries(allocations)
      .filter(([_, amt]) => Number(amt) > 0)
      .map(([method, amount]) => ({ method, amount: Number(amount) }));

    playSuccessChime();
    if (onConfirmSplitPayment) {
      onConfirmSplitPayment(splitList, totalAllocated);
    }
    onClose();
  };

  if (!isOpen) return null;

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
          maxWidth: '520px',
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
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Divide size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800' }}>
                {lang === 'bn' ? 'মাল্টি-পেমেন্ট স্প্লিট' : 'Split Multi-Payment'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                {lang === 'bn' ? 'একই বিল ক্যাশ, বিকাশ ও কার্ডে ভাগ করে রিসিভ করুন' : 'Split invoice across Cash, bKash & Card'}
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

        {/* Amount Cards Ribbon */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '8px',
            padding: '1rem 1.5rem',
            background: 'rgba(15, 23, 42, 0.6)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '8px 12px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700' }}>
              {lang === 'bn' ? 'মোট বিল' : 'Grand Total'}
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#818cf8', fontFamily: 'monospace' }}>
              ৳{grandTotal.toLocaleString()}
            </div>
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px 12px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700' }}>
              {lang === 'bn' ? 'পরিশোধিত' : 'Allocated'}
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#10b981', fontFamily: 'monospace' }}>
              ৳{totalAllocated.toLocaleString()}
            </div>
          </div>

          <div style={{
            background: isExact ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            padding: '8px 12px',
            borderRadius: '12px',
            border: isExact ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)'
          }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700' }}>
              {remaining > 0 ? (lang === 'bn' ? 'বাকি পাওনা' : 'Remaining') : (lang === 'bn' ? 'অতিরিক্ত' : 'Extra')}
            </div>
            <div style={{
              fontSize: '1.15rem',
              fontWeight: '900',
              color: isExact ? '#10b981' : remaining > 0 ? '#ef4444' : '#f59e0b',
              fontFamily: 'monospace'
            }}>
              ৳{Math.abs(remaining).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Quick presets */}
        <div style={{ display: 'flex', gap: '6px', padding: '0.75rem 1.5rem', background: 'rgba(15, 23, 42, 0.3)', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handleEqualSplit('cash', 'bkash')}
            style={{
              padding: '4px 8px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#cbd5e1',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: '700'
            }}
          >
            ⚖️ ৫০% ক্যাশ + ৫০% বিকাশ
          </button>

          <button
            type="button"
            onClick={() => handleEqualSplit('cash', 'card')}
            style={{
              padding: '4px 8px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#cbd5e1',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: '700'
            }}
          >
            💳 ৫০% ক্যাশ + ৫০% কার্ড
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {PAYMENT_METHODS.map(method => {
            const Icon = method.icon;
            const amount = allocations[method.id] || 0;

            return (
              <div
                key={method.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '14px',
                  background: amount > 0 ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.4)',
                  border: amount > 0 ? `1.5px solid ${method.color}` : '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '10px',
                      background: `${method.color}20`,
                      color: method.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#f8fafc' }}>
                      {lang === 'bn' ? method.label : method.enLabel}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {remaining > 0 && (
                    <button
                      type="button"
                      onClick={() => handleFillRemaining(method.id)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        fontWeight: '700'
                      }}
                    >
                      +বাকিটা
                    </button>
                  )}

                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '10px', color: '#94a3b8', fontWeight: '700' }}>৳</span>
                    <input
                      type="number"
                      min="0"
                      value={amount === 0 ? '' : amount}
                      onChange={(e) => handleAmountChange(method.id, e.target.value)}
                      placeholder="০"
                      style={{
                        width: '110px',
                        padding: '8px 10px 8px 24px',
                        borderRadius: '10px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#ffffff',
                        fontSize: '1rem',
                        fontWeight: '800',
                        textAlign: 'right'
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Footer Submit */}
          <div style={{ marginTop: '0.75rem' }}>
            <button
              type="submit"
              disabled={totalAllocated < grandTotal}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '14px',
                border: 'none',
                background: totalAllocated >= grandTotal ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontWeight: '800',
                fontSize: '0.95rem',
                cursor: totalAllocated >= grandTotal ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: totalAllocated >= grandTotal ? '0 4px 16px rgba(16, 185, 129, 0.3)' : 'none'
              }}
            >
              <CheckCircle2 size={18} />
              <span>
                {lang === 'bn'
                  ? `স্প্লিট পেমেন্ট সম্পন্ন করুন (মোট ৳${totalAllocated.toLocaleString()})`
                  : `Confirm Split Checkout (৳${totalAllocated})`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
