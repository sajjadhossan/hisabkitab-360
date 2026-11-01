import React, { useState, useEffect, useMemo } from 'react';
import {
  Tag,
  Percent,
  DollarSign,
  X,
  Check,
  Sparkles,
  AlertCircle,
  Gift,
  Ticket,
  UserCheck,
  Clock
} from 'lucide-react';
import { soundService } from '../../services/soundService';
import { voucherService } from '../../services/voucherService';

export const QuickDiscountAndCouponModal = ({
  isOpen,
  onClose,
  cartTotal = 0,
  subtotal = 0,
  currentDiscount = 0,
  onApplyDiscount,
  selectedCustomer = null,
  selectedCustomerId = null,
  lang = 'bn'
}) => {
  const [discountType, setDiscountType] = useState('amount'); // 'amount' | 'percent'
  const [inputValue, setInputValue] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState(null);
  const [matchedVoucher, setMatchedVoucher] = useState(null);
  const [customerVouchers, setCustomerVouchers] = useState([]);

  const activeCartTotal = cartTotal || subtotal || 0;

  // Preset coupons
  const SYSTEM_COUPONS = {
    EID2026: { type: 'percent', value: 15, desc: 'ঈদ স্পেশাল ১৫% ছাড়' },
    WELCOME: { type: 'amount', value: 100, desc: 'নতুন গ্রাহক ১০০ টাকা ওয়েলকাম ছাড়' },
    VIP10: { type: 'percent', value: 10, desc: 'ভিআইপি মেম্বার ১০% ছাড়' },
    OFF50: { type: 'amount', value: 50, desc: '৫০ টাকা ফ্ল্যাট ছাড়' }
  };

  // Load customer active store credit vouchers if customer is selected
  useEffect(() => {
    if (!isOpen) {
      setCouponMessage(null);
      setMatchedVoucher(null);
      setCouponCode('');
      setInputValue('');
      return;
    }

    const phoneOrId = selectedCustomer?.phone || selectedCustomerId;
    if (phoneOrId) {
      const activeVouchers = voucherService.getCustomerActiveVouchers(phoneOrId);
      setCustomerVouchers(activeVouchers);
    } else {
      setCustomerVouchers([]);
    }
  }, [isOpen, selectedCustomer, selectedCustomerId]);

  if (!isOpen) return null;

  const handleApplyPresetPercent = (pct) => {
    soundService.playSuccessChime();
    const calculatedAmount = Math.round((activeCartTotal * pct) / 100);
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
      const calculatedAmount = Math.round((activeCartTotal * Math.min(num, 100)) / 100);
      onApplyDiscount(calculatedAmount, `${num}%`);
    } else {
      onApplyDiscount(Math.min(num, activeCartTotal), `৳${num}`);
    }
    onClose();
  };

  const handleValidateCoupon = (e) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    // Check if it's a real Store Credit / Exchange Voucher
    const storeVoucher = voucherService.findVoucher(code);
    if (storeVoucher) {
      const now = new Date();
      if (storeVoucher.expiresAt && new Date(storeVoucher.expiresAt) < now) {
        soundService.playWarningTone();
        setCouponMessage({ type: 'error', text: 'এই এক্সচেঞ্জ ভাউচারটির মেয়াদ শেষ হয়ে গেছে!' });
        setMatchedVoucher(null);
        return;
      }
      if (storeVoucher.status === 'used' || storeVoucher.balance <= 0) {
        soundService.playWarningTone();
        setCouponMessage({ type: 'error', text: 'এই ভাউচারের সম্পূর্ণ ব্যালেন্স পূর্বে ব্যবহার করা হয়েছে।' });
        setMatchedVoucher(null);
        return;
      }
      if (storeVoucher.status === 'cancelled') {
        soundService.playWarningTone();
        setCouponMessage({ type: 'error', text: 'এই ভাউচারটি বাতিল করা হয়েছে।' });
        setMatchedVoucher(null);
        return;
      }

      soundService.playCashChime();
      setMatchedVoucher(storeVoucher);
      setCouponMessage({
        type: 'success',
        text: `বৈধ ভাউচার! অবশিষ্ট ব্যালেন্স: ৳${storeVoucher.balance.toLocaleString()} (গ্রাহক: ${storeVoucher.customerName})`
      });
      return;
    }

    // Check system promotional coupons
    const matched = SYSTEM_COUPONS[code];
    if (matched) {
      soundService.playCashChime();
      let calculated = 0;
      if (matched.type === 'percent') {
        calculated = Math.round((activeCartTotal * matched.value) / 100);
      } else {
        calculated = Math.min(matched.value, activeCartTotal);
      }
      onApplyDiscount(calculated, `${code} (${matched.desc})`);
      onClose();
    } else {
      soundService.playWarningTone();
      setCouponMessage({ type: 'error', text: 'প্রোমো বা ভাউচার কোডটি সঠিক নয় বা খুঁজে পাওয়া যায়নি!' });
      setMatchedVoucher(null);
    }
  };

  const handleApplyVoucher = (vch) => {
    if (!vch || vch.balance <= 0) return;
    soundService.playCashChime();
    const redeemAmount = Math.min(activeCartTotal, vch.balance);
    onApplyDiscount(redeemAmount, `ভাউচার: ${vch.code}`, {
      isVoucher: true,
      voucher: vch,
      voucherCode: vch.code,
      voucherBalance: vch.balance
    });
    onClose();
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
          maxWidth: '540px',
          maxHeight: '90vh',
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
                {lang === 'bn' ? 'কুইক ডিসকাউন্ট ও এক্সচেঞ্জ ভাউচার' : 'Quick Discounts & Vouchers'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                মোট কার্ট মূল্য: <strong style={{ color: '#f8fafc' }}>৳{activeCartTotal.toLocaleString()}</strong>
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

        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto' }}>
          {/* Customer's Active Vouchers If Any */}
          {customerVouchers.length > 0 && (
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px dashed rgba(16, 185, 129, 0.35)', borderRadius: '14px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Ticket size={16} color="#10b981" />
                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#34d399' }}>
                  গ্রাহকের সক্রিয় এক্সচেঞ্জ ভাউচার রয়েছে ({customerVouchers.length}টি)
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {customerVouchers.map(v => (
                  <div
                    key={v.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(0, 0, 0, 0.3)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.07)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '800', color: '#f8fafc', fontSize: '0.88rem' }}>{v.code}</div>
                      <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>ব্যালেন্স: ৳{v.balance.toLocaleString()}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplyVoucher(v)}
                      style={{
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      প্রয়োগ করুন (৳{Math.min(activeCartTotal, v.balance)})
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {/* Coupon Code & Exchange Voucher Section */}
          <form onSubmit={handleValidateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#cbd5e1' }}>
              🎟️ প্রোমো বা এক্সচেঞ্জ ভাউচার কোড (Promo or Voucher Code)
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value);
                  setCouponMessage(null);
                  setMatchedVoucher(null);
                }}
                placeholder="যেমন: EX-891024, EID2026, VIP10"
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
              <div
                style={{
                  fontSize: '0.82rem',
                  color: couponMessage.type === 'success' ? '#34d399' : '#ef4444',
                  fontWeight: '700',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  background: couponMessage.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)'
                }}
              >
                {couponMessage.text}
              </div>
            )}

            {matchedVoucher && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.05))',
                  border: '1px solid #10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#10b981' }}>
                    🎟️ এক্সচেঞ্জ ভাউচার: {matchedVoucher.code}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '2px' }}>
                    ব্যবহারযোগ্য ব্যালেন্স: <strong>৳{matchedVoucher.balance.toLocaleString()}</strong>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    গ্রাহক: {matchedVoucher.customerName} {matchedVoucher.customerPhone ? `(${matchedVoucher.customerPhone})` : ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleApplyVoucher(matchedVoucher)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: '#10b981',
                    border: 'none',
                    color: '#fff',
                    fontWeight: '800',
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  প্রয়োগ করুন (৳{Math.min(activeCartTotal, matchedVoucher.balance)})
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 22px',
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
                onApplyDiscount(0, '', null);
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
              ডিসকাউন্ট / ভাউচার বাতিল করুন
            </button>
          ) : (
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>কোন ছাড় বা ভাউচার প্রযোজ্য নেই</span>
          )}

          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#e2e8f0',
              fontSize: '0.82rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickDiscountAndCouponModal;
