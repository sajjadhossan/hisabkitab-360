import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Send,
  MessageCircle,
  Copy,
  Check,
  Share2,
  Mail,
  Printer,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import {
  formatWhatsAppInvoiceMessage,
  normalizeWhatsAppPhone,
  createInvoiceVerificationUrl
} from '../../services/qrService';

export const ShareInvoiceModal = () => {
  const {
    activeShareInvoice,
    closeShareInvoice,
    businessSettings,
    lang,
    showToast,
    openInvoicePrint
  } = useApp();

  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [includeItems, setIncludeItems] = useState(true);
  const [customNote, setCustomNote] = useState('');
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (activeShareInvoice) {
      setCustomerPhone(activeShareInvoice.customerPhone || '');
      setCustomerEmail(activeShareInvoice.customerEmail || '');
      setCopiedText(false);
      setCopiedLink(false);
      setCustomNote('');
    }
  }, [activeShareInvoice]);

  if (!activeShareInvoice) return null;

  const inv = activeShareInvoice;
  const grandTotal = Number(inv.grandTotal) || 0;
  const paidVal = inv.paidAmount !== undefined ? Number(inv.paidAmount) : (inv.status === 'paid' ? grandTotal : 0);
  const dueVal = inv.dueAmount !== undefined ? Number(inv.dueAmount) : Math.max(0, grandTotal - paidVal);

  const rawMessage = formatWhatsAppInvoiceMessage(inv, businessSettings, lang);
  const fullMessage = customNote
    ? `${rawMessage}\n\n📝 *বিশেষ নোট:* ${customNote}`
    : rawMessage;

  const verificationUrl = createInvoiceVerificationUrl(inv, businessSettings);

  // Send via WhatsApp API
  const handleSendWhatsApp = () => {
    const normPhone = normalizeWhatsAppPhone(customerPhone);
    let url = '';
    if (normPhone) {
      url = `https://api.whatsapp.com/send?phone=${normPhone}&text=${encodeURIComponent(fullMessage)}`;
    } else {
      url = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullMessage)}`;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    showToast(
      lang === 'bn' ? 'হোয়াটসঅ্যাপ মেসেঞ্জার ওপেন হচ্ছে...' : 'Opening WhatsApp...',
      'success'
    );
  };

  // Send via native SMS
  const handleSendSMS = () => {
    const cleanPhone = customerPhone.replace(/[^0-9+]/g, '');
    const smsUrl = `sms:${cleanPhone}?body=${encodeURIComponent(fullMessage)}`;
    window.location.href = smsUrl;
  };

  // Send via Email
  const handleSendEmail = () => {
    const subject = encodeURIComponent(`${businessSettings.companyName || 'Store'} - Invoice #${inv.id}`);
    const mailtoUrl = `mailto:${customerEmail}?subject=${subject}&body=${encodeURIComponent(fullMessage)}`;
    window.location.href = mailtoUrl;
  };

  // Copy full formatted message
  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(fullMessage);
      setCopiedText(true);
      showToast(
        lang === 'bn' ? 'হোয়াটসঅ্যাপ মেসেজ কপি করা হয়েছে!' : 'Message copied to clipboard!',
        'success'
      );
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      showToast('Copy failed', 'warning');
    }
  };

  // Copy digital verification link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(verificationUrl);
      setCopiedLink(true);
      showToast(
        lang === 'bn' ? 'ডিজিটাল রসিদ লিংক কপি করা হয়েছে!' : 'Receipt link copied!',
        'success'
      );
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      showToast('Copy failed', 'warning');
    }
  };

  // Native Web Share (Facebook Messenger, Telegram, Imo, etc.)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice #${inv.id} - ${businessSettings.companyName}`,
          text: fullMessage,
          url: verificationUrl
        });
        showToast(
          lang === 'bn' ? 'শেয়ার সম্পন্ন হয়েছে!' : 'Shared successfully!',
          'success'
        );
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyMessage();
        }
      }
    } else {
      handleCopyMessage();
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div
        className="modal-content animate-fade-in"
        style={{
          maxWidth: '680px',
          width: '95%',
          maxHeight: '94vh',
          overflowY: 'auto',
          padding: '1.5rem',
          borderRadius: '14px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', boxShadow: '0 4px 12px rgba(37, 211, 102, 0.35)' }}>
              <MessageCircle size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{lang === 'bn' ? 'হোয়াটসঅ্যাপ ও সোশ্যাল মিডিয়ায় মেমো পাঠান' : 'Share Invoice to WhatsApp & Social'}</span>
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                #{inv.id} • {inv.customerName || (lang === 'bn' ? 'ক্রেতা' : 'Customer')} • ৳{grandTotal.toLocaleString()}
              </p>
            </div>
          </div>

          <button className="btn-icon" onClick={closeShareInvoice} title="Close">
            <X size={20} />
          </button>
        </div>

        {/* Target Recipient Number & Details Form */}
        <div style={{ background: 'var(--bg-primary)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            {/* WhatsApp / Phone Input */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                <Smartphone size={15} style={{ color: '#25D366' }} />
                <span>{lang === 'bn' ? 'গ্রাহকের হোয়াটসঅ্যাপ / মোবাইল নম্বর:' : 'Customer WhatsApp / Mobile:'}</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ padding: '8px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                  🇧🇩 +880
                </span>
                <input
                  type="tel"
                  autoFocus
                  className="input-field"
                  style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.95rem' }}
                  placeholder="01712345678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Optional Note */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                {lang === 'bn' ? 'গ্রাহকের জন্য বিশেষ বার্তা (ঐচ্ছিক):' : 'Custom Note (Optional):'}
              </label>
              <input
                type="text"
                className="input-field"
                placeholder={lang === 'bn' ? 'যেমন: ভাইয়া আগামী সপ্তাহে নতুন স্টক আসবে...' : 'e.g. Thanks for your visit!'}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 1-Click Action Buttons Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '1.25rem' }}>
          {/* WhatsApp Primary Button */}
          <button
            type="button"
            className="btn"
            onClick={handleSendWhatsApp}
            style={{
              background: '#25D366',
              color: '#ffffff',
              border: 'none',
              padding: '12px 16px',
              fontSize: '0.9rem',
              fontWeight: '800',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(37, 211, 102, 0.4)',
              cursor: 'pointer'
            }}
          >
            <Send size={18} />
            <span>{lang === 'bn' ? 'হোয়াটসঅ্যাপে পাঠান' : 'Send to WhatsApp'}</span>
          </button>

          {/* Copy Message */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCopyMessage}
            style={{
              padding: '12px 14px',
              fontSize: '0.85rem',
              fontWeight: '700',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            {copiedText ? <Check size={16} style={{ color: '#10b981' }} /> : <Copy size={16} />}
            <span>{copiedText ? (lang === 'bn' ? 'কপি সফল!' : 'Copied!') : (lang === 'bn' ? 'মেসেজ কপি করুন' : 'Copy Text')}</span>
          </button>

          {/* Copy Digital Link */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCopyLink}
            style={{
              padding: '12px 14px',
              fontSize: '0.85rem',
              fontWeight: '700',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            {copiedLink ? <Check size={16} style={{ color: '#10b981' }} /> : <ExternalLink size={16} />}
            <span>{copiedLink ? (lang === 'bn' ? 'লিংক কপি হয়েছে!' : 'Link Copied!') : (lang === 'bn' ? 'অনলাইন লিংক কপি' : 'Copy Web Link')}</span>
          </button>

          {/* Native Web Share */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleNativeShare}
            style={{
              padding: '12px 14px',
              fontSize: '0.85rem',
              fontWeight: '700',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            title="Messenger, Telegram, Imo etc."
          >
            <Share2 size={16} />
            <span>{lang === 'bn' ? 'অন্যান্য সোশ্যাল মিডিয়া' : 'Other Apps'}</span>
          </button>
        </div>

        {/* Live WhatsApp Message Bubble Preview */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageCircle size={14} style={{ color: '#25D366' }} />
              {lang === 'bn' ? 'হোয়াটসঅ্যাপ মেসেজ প্রিভিউ (গ্রাহক যা দেখতে পাবেন):' : 'WhatsApp Message Preview:'}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {fullMessage.length} {lang === 'bn' ? 'অক্ষর' : 'chars'}
            </span>
          </div>

          <div
            style={{
              background: '#e5ddd5',
              padding: '14px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1'
            }}
          >
            <div
              style={{
                background: '#dcf8c6',
                color: '#111827',
                padding: '12px 14px',
                borderRadius: '8px 8px 0 8px',
                maxWidth: '92%',
                marginLeft: 'auto',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)',
                fontSize: '0.82rem',
                lineHeight: 1.6,
                fontFamily: "'Hind Siliguri', -apple-system, sans-serif",
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {fullMessage}
              <div style={{ textAlign: 'right', fontSize: '0.68rem', color: '#65676b', marginTop: '4px' }}>
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions: Print or Close */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <ShieldCheck size={16} style={{ color: '#10b981' }} />
            <span>{lang === 'bn' ? 'ডিজিটাল কিউআর কোডসহ রসিদ স্বয়ংক্রিয়ভাবে সংযুক্ত' : 'Verified QR Code link attached'}</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                closeShareInvoice();
                openInvoicePrint(inv);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={15} />
              <span>{lang === 'bn' ? 'ইনভয়েস প্রিন্ট' : 'Print Invoice'}</span>
            </button>
            <button type="button" className="btn btn-secondary" onClick={closeShareInvoice}>
              {lang === 'bn' ? 'বন্ধ করুন' : 'Done'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
