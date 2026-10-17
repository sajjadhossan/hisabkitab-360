import React, { useState } from 'react';
import {
  Tag,
  Percent,
  DollarSign,
  X,
  Check,
  Sparkles,
  AlertCircle,
  Gift
} from 'lucide-react';
import { soundService } from '../../services/soundService';

export const QuickDiscountAndCouponModal = ({
  isOpen,
  onClose,
  cartTotal = 0,
  currentDiscount = 0,
  onApplyDiscount,
  lang = 'bn'
}) => {
  const [discountType, setDiscountType] = useState('amount'); // 'amount' | 'percent'
  const [inputValue, setInputValue] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState(null);

  if (!isOpen) return null;

  // Preset coupons
  const SYSTEM_COUPONS = {
    EID2026: { type: 'percent', value: 15, desc: 'ঈদ স্পেশাল ১৫% ছাড়' },
    WELCOME: { type: 'amount', value: 100, desc: 'নতুন গ্রাহক ১০০ টাকা ওয়েলকাম ছাড়' },
    VIP10: { type: 'percent', value: 10, desc: 'ভিআইপি মেম্বার ১০% ছাড়' },
    OFF50: { type: 'amount', value: 50, desc: '৫০ টাকা ফ্ল্যাট ছাড়' }
  };

  const handleApplyPresetPercent = (pct) => {
    soundService.playSuccessChime();
    const calculatedAmount = Math.round((cartTotal * pct) / 100);
    onApplyDiscount(calculatedAmount, `${pct}%`);
    onClose();
  };

  const handleApplyPresetAmount = (amt) => {
    soundService.playSuccessChime();
    onApplyDiscount(amt, `৳${amt}`);
    onClose();
  };

  const handleCustomApply = (e) => {
    e.preventDefault();
    const num = parseFloat(inputValue);
    if (isNaN(num) || num < 0) return;

    soundService.playSuccessChime();
    if (discountType === 'percent') {
      const calculatedAmount = Math.round((cartTotal * Math.min(num, 100)) / 100);
      onApplyDiscount(calculatedAmount, `${num}%`);
    } else {
      onApplyDiscount(Math.min(num, cartTotal), `৳${num}`);
    }
    onClose();
  };

  const handleValidateCoupon = (e) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    const matched = SYSTEM_COUPONS[code];
    if (matched) {
      soundService.playCashChime();
      let calculated = 0;
      if (matched.type === 'percent') {
        calculated = Math.round((cartTotal * matched.value) / 100);
      } else {
        calculated = Math.min(matched.value, cartTotal);
      }
      onApplyDiscount(calculated, `${code} (${matched.desc})`);
      onClose();
    } else {
      soundService.playWarningTone();
      setCouponMessage({ type: 'error', text: 'প্রোমো কোডটি সঠিক নয় বা মেয়াদোত্তীর্ণ!' });
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        background: 'rgba(5, 10, 20, 0.75)',
        backdropFilter: 'blur(14px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.18s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'linear-gradient(145deg, #131c2e, #0b111d)',
          borderRadius: '24px',
          border: '1.5px solid rgba(245, 158, 11, 0.4)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(245, 158, 11, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'scaleUp 0.18s ease-out'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 22px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(245, 158, 11, 0.04)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b'
              }}
            >
              <Percent size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#f8fafc' }}>
                {lang === 'bn' ? 'কুইক ডিসকাউন্ট ও কুপন কোড' : 'Quick Discounts & Coupons'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                মোট কার্ট মূল্য: <strong style={{ color: '#f8fafc' }}>৳{cartTotal.toLocaleString()}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick Percentage Chips */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '8px' }}>
              ⚡ এক-ক্লিকে শতকরা ছাড় (%)
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[5, 10, 15, 20, 25, 30].map((pct) => (
                <button
                  key={pct}
                  onClick={() => handleApplyPresetPercent(pct)}
                  style={{
                    flex: '1 1 65px',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#fbbf24',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease'
                  }}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Quick Fixed Amount Chips */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '8px' }}>
              💵 নির্ধারিত নগদ টাকা ছাড় (৳)
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[20, 50, 100, 200, 500].map((amt) => (
                <button
                  key={amt}
                  onClick={() => handleApplyPresetAmount(amt)}
                  style={{
                    flex: '1 1 75px',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34d399',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease'
                  }}
                >
                  ৳{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Discount Input */}
          <form onSubmit={handleCustomApply} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#cbd5e1' }}>
              ✏️ কাস্টম ছাড় এন্ট্রি করুন
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ display: 'flex', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                <button
                  type="button"
                  onClick={() => setDiscountType('amount')}
                  style={{
                    padding: '8px 14px',
                    background: discountType === 'amount' ? '#0284c7' : 'rgba(255, 255, 255, 0.05)',
                    border: 'none',
                    color: '#fff',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  ৳ টাকা
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('percent')}
                  style={{
                    padding: '8px 14px',
                    background: discountType === 'percent' ? '#0284c7' : 'rgba(255, 255, 255, 0.05)',
                    border: 'none',
                    color: '#fff',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  % শতাংশ
                </button>
              </div>

              <input
                type="number"
                step="any"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={discountType === 'amount' ? 'টাকার পরিমাণ...' : 'শতাংশ...'}
                style={{
                  flex: 1,
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  color: '#f8fafc',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  outline: 'none'
                }}
              />

              <button
                type="submit"
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                প্রয়োগ
              </button>
            </div>
          </form>

          {/* Coupon Code Section */}
          <form onSubmit={handleValidateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#cbd5e1' }}>
              🎁 প্রোমো / কুপন কোড (Promo Voucher)
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value);
                  setCouponMessage(null);
                }}
                placeholder="যেমন: EID2026, WELCOME, VIP10"
                style={{
                  flex: 1,
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  color: '#f8fafc',
                  fontSize: '0.92rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                যাচাই
              </button>
            </div>
            {couponMessage && (
              <span style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: '600' }}>
                {couponMessage.text}
              </span>
            )}
          </form>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 22px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          {currentDiscount > 0 ? (
            <button
              onClick={() => {
                soundService.playDeleteTone();
                onApplyDiscount(0, '');
                onClose();
              }}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '6px 14px',
                color: '#ef4444',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              ডিসকাউন্ট বাতিল করুন
            </button>
          ) : (
            <span />
          )}

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 16px',
              color: '#94a3b8',
              fontSize: '0.82rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            বন্ধ
          </button>
        </div>
      </div>
    </div>
  );
};
