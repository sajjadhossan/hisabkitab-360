import React, { useState, useEffect } from 'react';
import {
  X,
  MessageCircle,
  Smartphone,
  Copy,
  Check,
  AlertCircle,
  CreditCard,
  Send,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import {
  buildDueReminderMessage,
  openWhatsAppDirect,
  openSMSDirect
} from '../../services/messagingService';

const DueReminderModalContent = ({
  onClose,
  customer,
  businessSettings = {},
  lang = 'bn',
  showToast
}) => {
  const [tone, setTone] = useState('standard'); // 'gentle' | 'standard' | 'urgent'
  const [phone, setPhone] = useState(customer?.phone || '');
  const [bkashNumber, setBkashNumber] = useState(
    businessSettings?.bkashNumber || businessSettings?.phone || ''
  );
  const [includeBkash, setIncludeBkash] = useState(true);
  const [copied, setCopied] = useState(false);

  const dueAmount = customer.dueAmount !== undefined
    ? Number(customer.dueAmount)
    : Number(customer.outstandingDue || 0);

  const formattedMessage = buildDueReminderMessage({
    customerName: customer.name || customer.customerName || (lang === 'bn' ? 'সম্মানিত গ্রাহক' : 'Valued Customer'),
    dueAmount,
    dueDate: customer.dueDate || '',
    memoId: customer.memoId || customer.invoiceId || '',
    companyName: businessSettings?.companyName || 'আমাদের দোকান',
    companyPhone: businessSettings?.phone || '',
    bkashNumber: includeBkash ? bkashNumber : '',
    tone
  });

  const handleSendWhatsApp = () => {
    if (!phone) {
      if (showToast) showToast('গ্রাহকের মোবাইল নম্বর দিন', 'warning');
      return;
    }
    openWhatsAppDirect({ phone, message: formattedMessage });
    if (showToast) {
      showToast(lang === 'bn' ? 'হোয়াটসঅ্যাপ চালু হচ্ছে...' : 'Opening WhatsApp...', 'success');
    }
  };

  const handleSendSMS = () => {
    if (!phone) {
      if (showToast) showToast('গ্রাহকের মোবাইল নম্বর দিন', 'warning');
      return;
    }
    openSMSDirect({ phone, message: formattedMessage });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedMessage);
      setCopied(true);
      if (showToast) {
        showToast(lang === 'bn' ? 'তাগাদা মেসেজ কপি হয়েছে!' : 'Message copied!', 'success');
      }
      setTimeout(() => setCopied(false), 2000);
    } catch {
      if (showToast) showToast('Copy failed', 'warning');
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div
        className="modal-content animate-fade-in"
        style={{
          maxWidth: '540px',
          width: '95%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '1.5rem'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(37, 211, 102, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#25D366' }}>
              <MessageCircle size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'বকেয়া আদায়ের তাগাদা পাঠান' : 'Send Due Payment Reminder'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'হোয়াটসঅ্যাপ বা সরাসরি মোবাইলে প্রফেশনাল এসএমএস' : 'WhatsApp or SMS Due Reminder'}
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Customer Due Highlight */}
        <div style={{ background: 'var(--bg-primary)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)' }}>
              {customer.name || customer.customerName}
            </div>
            {customer.phone && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <PhoneCall size={12} />
                <span>{customer.phone}</span>
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: '600' }}>
              {lang === 'bn' ? 'মোট বকেয়া' : 'Total Due'}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#ef4444', fontFamily: 'monospace' }}>
              ৳{dueAmount.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Tone Selector */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label className="field-label" style={{ fontWeight: '700', marginBottom: '8px' }}>
            {lang === 'bn' ? 'তাগাদার ধরন ও ভাষা নির্বাচন করুন:' : 'Select Reminder Tone:'}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setTone('gentle')}
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                border: tone === 'gentle' ? '2px solid #10b981' : '1px solid var(--border-color)',
                background: tone === 'gentle' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-primary)',
                color: tone === 'gentle' ? '#10b981' : 'var(--text-muted)',
                transition: 'all 0.2s'
              }}
            >
              🟢 {lang === 'bn' ? 'ভদ্র ও বিনীত' : 'Gentle'}
            </button>
            <button
              type="button"
              onClick={() => setTone('standard')}
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                border: tone === 'standard' ? '2px solid #f59e0b' : '1px solid var(--border-color)',
                background: tone === 'standard' ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-primary)',
                color: tone === 'standard' ? '#f59e0b' : 'var(--text-muted)',
                transition: 'all 0.2s'
              }}
            >
              🟡 {lang === 'bn' ? 'স্বাভাবিক নোটিশ' : 'Standard'}
            </button>
            <button
              type="button"
              onClick={() => setTone('urgent')}
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                border: tone === 'urgent' ? '2px solid #ef4444' : '1px solid var(--border-color)',
                background: tone === 'urgent' ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-primary)',
                color: tone === 'urgent' ? '#ef4444' : 'var(--text-muted)',
                transition: 'all 0.2s'
              }}
            >
              🔴 {lang === 'bn' ? 'জরুরি তাগাদা' : 'Urgent'}
            </button>
          </div>
        </div>

        {/* Options Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '1.25rem' }}>
          <div>
            <label className="field-label">{lang === 'bn' ? 'গ্রাহকের মোবাইল নম্বর:' : 'Customer Phone:'}</label>
            <input
              type="text"
              className="input-field"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="017xxxxxxxx"
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="field-label">{lang === 'bn' ? 'বিকাশ নম্বর অন্তর্ভুক্ত:' : 'Include bKash:'}</label>
              <input
                type="checkbox"
                checked={includeBkash}
                onChange={(e) => setIncludeBkash(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#e2136e' }}
              />
            </div>
            <input
              type="text"
              className="input-field"
              value={bkashNumber}
              disabled={!includeBkash}
              onChange={(e) => setBkashNumber(e.target.value)}
              placeholder="01xxxxxxxxx"
              style={{ opacity: includeBkash ? 1 : 0.6 }}
            />
          </div>
        </div>

        {/* Live Message Preview */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>
              {lang === 'bn' ? 'মেসেজ প্রিভিউ (যা কাস্টমারের কাছে যাবে):' : 'Message Preview:'}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="btn btn-secondary"
              style={{ padding: '3px 8px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
              <span>{copied ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : (lang === 'bn' ? 'কপি' : 'Copy')}</span>
            </button>
          </div>

          <div
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '12px 14px',
              fontSize: '0.82rem',
              lineHeight: 1.6,
              whiteSpace: 'pre-line',
              color: 'var(--text-main)',
              maxHeight: '180px',
              overflowY: 'auto',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            {formattedMessage}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="btn btn-primary"
            style={{
              flex: 1,
              minWidth: '160px',
              background: '#25D366',
              borderColor: '#25D366',
              color: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontWeight: '700',
              padding: '10px 16px',
              boxShadow: '0 3px 10px rgba(37, 211, 102, 0.35)'
            }}
          >
            <MessageCircle size={18} />
            <span>{lang === 'bn' ? 'WhatsApp-এ পাঠান' : 'Send WhatsApp'}</span>
          </button>

          <button
            type="button"
            onClick={handleSendSMS}
            className="btn btn-secondary"
            style={{
              flex: 1,
              minWidth: '140px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontWeight: '700',
              padding: '10px 16px'
            }}
          >
            <Smartphone size={18} />
            <span>{lang === 'bn' ? 'মোবাইল SMS পাঠান' : 'Send SMS'}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: '10px 16px' }}
          >
            {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const DueReminderModal = ({
  isOpen,
  onClose,
  customer,
  businessSettings,
  lang,
  showToast
}) => {
  if (!isOpen || !customer) return null;

  return (
    <DueReminderModalContent
      onClose={onClose}
      customer={customer}
      businessSettings={businessSettings}
      lang={lang}
      showToast={showToast}
    />
  );
};
