import React, { useState, useEffect } from 'react';
import { QrCode, X, CheckCircle2, Copy, Smartphone, ShieldCheck, Sparkles } from 'lucide-react';
import { generateQuickChartQrUrl, buildBanglaQrPaymentPayload } from '../../services/qrService';

export const BanglaQrPaymentModal = ({
  isOpen,
  onClose,
  amount = 0,
  invoiceNo = '',
  businessSettings = {},
  onPaymentConfirmed,
  lang = 'bn'
}) => {
  if (!isOpen) return null;

  const [selectedProvider, setSelectedProvider] = useState('bkash'); // 'bkash' | 'nagad' | 'bangla_qr'
  const [copied, setCopied] = useState(false);

  const merchantName = businessSettings?.companyName || 'আমার দোকান';
  const merchantPhone = businessSettings?.bkashMerchant || businessSettings?.phone || '01700000000';

  const qrPayload = buildBanglaQrPaymentPayload({
    merchantName,
    merchantPhone,
    amount,
    invoiceNo,
    mfsProvider: selectedProvider
  });

  const qrUrl = generateQuickChartQrUrl(qrPayload, {
    size: 260,
    margin: 1,
    darkColor: selectedProvider === 'bkash' ? '#e2136e' : selectedProvider === 'nagad' ? '#f97316' : '#10b981'
  });

  const handleCopyPhone = () => {
    if (merchantPhone) {
      navigator.clipboard?.writeText(merchantPhone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-primary, #ffffff)',
          color: 'var(--text-main, #1e293b)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '420px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          border: '1px solid var(--border-color, #e2e8f0)',
          animation: 'modalSlideUp 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#ffffff',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <QrCode size={20} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800' }}>
              {lang === 'bn' ? '🇧🇩 বাংলা কিউআর পেমেন্ট কাউন্টার' : 'Bangla QR Instant Checkout'}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '20px', textAlign: 'center' }}>
          {/* Shop Name & Amount */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{merchantName}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
              ৳{Number(amount).toLocaleString()}
            </div>
            {invoiceNo && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                {lang === 'bn' ? `মেমো #${invoiceNo}` : `Invoice #${invoiceNo}`}
              </div>
            )}
          </div>

          {/* Provider Tabs */}
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '16px' }}>
            <button
              onClick={() => setSelectedProvider('bkash')}
              style={{
                flex: 1,
                padding: '6px 4px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: '700',
                border: '1.5px solid',
                borderColor: selectedProvider === 'bkash' ? '#e2136e' : 'var(--border-color)',
                background: selectedProvider === 'bkash' ? 'rgba(226, 19, 110, 0.1)' : 'transparent',
                color: selectedProvider === 'bkash' ? '#e2136e' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              বিকাশ (bKash)
            </button>
            <button
              onClick={() => setSelectedProvider('nagad')}
              style={{
                flex: 1,
                padding: '6px 4px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: '700',
                border: '1.5px solid',
                borderColor: selectedProvider === 'nagad' ? '#f97316' : 'var(--border-color)',
                background: selectedProvider === 'nagad' ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
                color: selectedProvider === 'nagad' ? '#f97316' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              নগদ (Nagad)
            </button>
            <button
              onClick={() => setSelectedProvider('bangla_qr')}
              style={{
                flex: 1.2,
                padding: '6px 4px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: '700',
                border: '1.5px solid',
                borderColor: selectedProvider === 'bangla_qr' ? '#10b981' : 'var(--border-color)',
                background: selectedProvider === 'bangla_qr' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                color: selectedProvider === 'bangla_qr' ? '#10b981' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              🇧🇩 সকল ব্যাংক / MFS
            </button>
          </div>

          {/* QR Box */}
          <div
            style={{
              background: '#ffffff',
              padding: '16px',
              borderRadius: '12px',
              border: '2px dashed var(--border-color)',
              display: 'inline-block',
              boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
              marginBottom: '14px'
            }}
          >
            <img
              src={qrUrl}
              alt="Bangla QR"
              style={{ width: '190px', height: '190px', display: 'block' }}
            />
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            📱 {lang === 'bn' ? 'যেকোনো ব্যাংক বা MFS অ্যাপ দিয়ে স্ক্যান করে পেমেন্ট করুন।' : 'Scan using bKash, Nagad, Cellfin or any Bank app.'}
          </div>

          {/* Merchant Account Quick Copy */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '18px'
            }}
          >
            <div style={{ textAlign: 'left', fontSize: '0.78rem' }}>
              <div style={{ color: 'var(--text-muted)' }}>{lang === 'bn' ? 'মার্চেন্ট নম্বর:' : 'Merchant Number:'}</div>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{merchantPhone}</strong>
            </div>
            <button
              onClick={handleCopyPhone}
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {copied ? <CheckCircle2 size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
              <span>{copied ? 'কপি হয়েছে' : 'কপি'}</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                if (onPaymentConfirmed) onPaymentConfirmed(selectedProvider);
                onClose();
              }}
              className="btn btn-primary"
              style={{
                flex: 1.5,
                background: 'linear-gradient(135deg, #10b981, #059669)',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <CheckCircle2 size={16} />
              <span>{lang === 'bn' ? 'পেমেন্ট সম্পন্ন হয়েছে' : 'Payment Received'}</span>
            </button>
            <button
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1, fontWeight: '700' }}
            >
              {lang === 'bn' ? 'বন্ধ করুন' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BanglaQrPaymentModal;
