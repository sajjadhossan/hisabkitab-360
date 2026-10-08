import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Share2,
  Copy,
  Check,
  X,
  MessageSquare,
  Sparkles,
  Send,
  User,
  Store
} from 'lucide-react';
import { hapticFeedback } from '../../services/nativeAppService';
import { playButtonClick, playSuccessChime } from '../../services/soundFeedback';

export const DigitalMemoShareModal = ({
  isOpen,
  onClose,
  saleData = null,
  businessSettings = {},
  customer = null,
  lang = 'bn'
}) => {
  const [phone, setPhone] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (customer?.phone) {
      setPhone(customer.phone);
    } else if (saleData?.customerPhone) {
      setPhone(saleData.customerPhone);
    } else {
      setPhone('');
    }
  }, [customer, saleData]);

  if (!isOpen || !saleData) return null;

  const storeName = businessSettings?.shopName || businessSettings?.storeName || (lang === 'bn' ? 'হিসাবকিতাব ৩৬০' : 'HisabKitab 360');
  const storePhone = businessSettings?.phone || businessSettings?.mobile || '';
  const storeAddress = businessSettings?.address || '';

  const items = saleData.items || saleData.cart || [];
  const invoiceNo = saleData.invoiceNo || saleData.id || `INV-${Date.now().toString().slice(-6)}`;
  const dateStr = saleData.date || new Date().toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US');
  const total = Number(saleData.grandTotal || saleData.totalAmount || 0);
  const paid = Number(saleData.paidAmount ?? total);
  const due = Math.max(0, total - paid);

  // Generate crisp Bengali digital memo text
  const generateMemoText = () => {
    let text = `🧾 *ডিজিটাল ক্যাশ মেমো*\n`;
    text += `🏪 *${storeName}*\n`;
    if (storeAddress) text += `📍 ${storeAddress}\n`;
    if (storePhone) text += `📞 ${storePhone}\n`;
    text += `------------------------------\n`;
    text += `মেমো নং: #${invoiceNo}\n`;
    text += `তারিখ: ${dateStr}\n`;
    if (customer?.name) text += `গ্রাহক: ${customer.name}\n`;
    text += `------------------------------\n`;
    text += `🛒 *পণ্য তালিকা:*\n`;

    items.forEach((item, idx) => {
      const name = item.name || `পণ্য ${idx + 1}`;
      const qty = item.qty || 1;
      const price = item.sellingPrice || item.price || 0;
      text += `• ${name} (${qty} x ৳${price}) = ৳${qty * price}\n`;
    });

    text += `------------------------------\n`;
    text += `💰 *সর্বমোট:* ৳${total.toLocaleString('en-US')}\n`;
    if (Number(saleData.discount) > 0) {
      text += `🎁 *ছাড়/ডিসকাউন্ট:* ৳${Number(saleData.discount).toLocaleString('en-US')}\n`;
    }
    text += `💵 *পরিশোধ:* ৳${paid.toLocaleString('en-US')}\n`;
    if (due > 0) {
      text += `⚖️ *বকেয়া:* ৳${due.toLocaleString('en-US')}\n`;
    }
    text += `------------------------------\n`;
    text += `🙏 ধন্যবাদ, আবার আসবেন!`;

    return text;
  };

  const memoText = generateMemoText();

  const handleCopy = () => {
    playButtonClick();
    hapticFeedback.light();
    navigator.clipboard?.writeText(memoText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSendWhatsApp = () => {
    playSuccessChime();
    hapticFeedback.medium();
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('01')) {
      cleanPhone = '88' + cleanPhone;
    }
    const encoded = encodeURIComponent(memoText);
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleSendSms = () => {
    playButtonClick();
    hapticFeedback.light();
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(memoText);
    window.location.href = `sms:${cleanPhone}?body=${encoded}`;
  };

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 10000,
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain'
      }}
    >
      <div
        className="modal-content animate-fade-in"
        style={{
          maxWidth: '440px',
          width: '94%',
          maxHeight: '92vh',
          overflowY: 'auto',
          borderRadius: '20px',
          padding: '1.25rem',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #25D366, #128C7E)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}
            >
              <Share2 size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'ডিজিটাল মেমো পাঠানো' : 'Digital Memo Dispatcher'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'কাগজহীন দ্রুত WhatsApp বা SMS রিসিট' : 'Paperless instant WhatsApp / SMS receipt'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            style={{ width: '32px', height: '32px', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Customer Phone Input */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
            {lang === 'bn' ? 'গ্রাহকের মোবাইল নম্বর:' : 'Customer Mobile Number:'}
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '10px',
                border: '1.5px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-main)',
                fontSize: '0.88rem',
                fontWeight: '700'
              }}
            />
            <Smartphone
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}
            />
          </div>
        </div>

        {/* Preview Bubble */}
        <div
          style={{
            background: 'var(--bg-primary)',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '1rem',
            border: '1px solid var(--border-color)',
            maxHeight: '200px',
            overflowY: 'auto',
            fontSize: '0.76rem',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            color: 'var(--text-main)',
            lineHeight: 1.45
          }}
        >
          {memoText}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            onClick={handleSendWhatsApp}
            style={{
              padding: '11px',
              borderRadius: '12px',
              border: 'none',
              background: '#25D366',
              color: '#ffffff',
              fontWeight: '800',
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)'
            }}
          >
            <Send size={16} />
            <span>{lang === 'bn' ? 'হোয়াটসঅ্যাপে পাঠান' : 'Send via WhatsApp'}</span>
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={handleSendSms}
              style={{
                padding: '9px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-main)',
                fontWeight: '700',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <MessageSquare size={14} />
              <span>{lang === 'bn' ? 'সাধারণ SMS' : 'Native SMS'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              style={{
                padding: '9px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: copied ? '#10b981' : 'var(--text-main)',
                fontWeight: '700',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : (lang === 'bn' ? 'মেমো কপি' : 'Copy Text')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
