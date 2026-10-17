import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Users,
  CheckSquare,
  Square,
  AlertTriangle,
  Copy,
  ExternalLink,
  Phone,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { hapticFeedback } from '../../services/nativeAppService';

export const BulkDueSmsModal = ({
  isOpen,
  onClose,
  debtList = [],
  businessSettings = {},
  lang = 'bn',
  showToast
}) => {
  const storeName = businessSettings?.storeName || businessSettings?.shopName || (lang === 'bn' ? 'আমাদের দোকান' : 'Our Store');
  const storePhone = businessSettings?.phone || businessSettings?.contactNumber || '';

  // Extract valid debtors who owe money (with or without phone numbers)
  const eligibleDebtors = useMemo(() => {
    return (debtList || []).map(person => {
      let netDue = 0;
      if (typeof person.netReceivable === 'number') {
        netDue = person.netReceivable;
      } else if (typeof person.netDebt === 'number') {
        netDue = person.netDebt;
      } else if (Array.isArray(person.transactions) && person.transactions.length > 0) {
        let totalLent = 0;
        let totalRepayReceived = 0;
        let totalBorrowed = 0;
        let totalRepaidPaid = 0;
        person.transactions.forEach(tx => {
          const amt = Number(tx.amount) || 0;
          if (tx.type === 'lend') totalLent += amt;
          else if (tx.type === 'repay_lend') totalRepayReceived += amt;
          else if (tx.type === 'borrow') totalBorrowed += amt;
          else if (tx.type === 'repay_borrow') totalRepaidPaid += amt;
        });
        netDue = (totalLent - totalRepayReceived) - (totalBorrowed - totalRepaidPaid);
      } else if (typeof person.outstandingDue === 'number') {
        netDue = person.outstandingDue;
      } else if (typeof person.amount === 'number') {
        netDue = person.amount;
      }

      const rawPhone = person.phone ? String(person.phone).trim() : '';
      const hasPhone = rawPhone.length >= 6;

      return {
        id: person.id,
        name: person.name || (lang === 'bn' ? 'অজ্ঞাত ব্যক্তি' : 'Unknown Person'),
        phone: rawPhone,
        hasPhone,
        dueAmount: Math.max(0, netDue)
      };
    }).filter(p => p.dueAmount > 0);
  }, [debtList, lang]);

  const [selectedIds, setSelectedIds] = useState(() => new Set(eligibleDebtors.map(d => d.id)));
  const [templatePrefix, setTemplatePrefix] = useState(
    lang === 'bn' 
      ? `সম্মানিত গ্রাহক, [দোকান]-এ আপনার বকেয়া [টাকা] টাকা। অনুগ্রহ করে দ্রুত পরিশোধের বিনীত অনুরোধ রইল।`
      : `Dear customer, your due at [store] is BDT [amount]. Kindly clear at your earliest convenience.`
  );

  const toggleSelectAll = () => {
    if (selectedIds.size === eligibleDebtors.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(eligibleDebtors.map(d => d.id)));
    }
  };

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectedDebtors = eligibleDebtors.filter(d => selectedIds.has(d.id));
  const totalSelectedDue = selectedDebtors.reduce((sum, d) => sum + d.dueAmount, 0);

  const formatMessageForDebtor = (debtor) => {
    return templatePrefix
      .replace(/\[দোকান\]|\[store\]/gi, storeName)
      .replace(/\[টাকা\]|\[amount\]/gi, `৳${debtor.dueAmount.toLocaleString()}`) +
      (storePhone ? ` যোগাযোগ: ${storePhone}` : '');
  };

  // Launch Native Device SMS App with all recipient numbers
  const handleSendNativeBulkSms = () => {
    if (selectedDebtors.length === 0) {
      if (showToast) showToast(lang === 'bn' ? 'অনুগ্রহ করে অন্তত একজন কাস্টমার নির্বাচন করুন' : 'Select at least one customer', 'warning');
      return;
    }

    hapticFeedback.medium();

    const phones = selectedDebtors.map(d => d.phone.replace(/[^0-9+]/g, '')).filter(Boolean);
    const sampleMsg = formatMessageForDebtor(selectedDebtors[0] || { dueAmount: 0 });
    
    // Android supports comma or semicolon separated numbers in SMS uri
    const separator = navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad') ? '&' : '?';
    const smsUrl = `sms:${phones.join(',')}?body=${encodeURIComponent(sampleMsg)}`;

    window.open(smsUrl, '_blank');
    if (showToast) {
      showToast(
        lang === 'bn' 
          ? `📲 ${phones.length} জন কাস্টমারের জন্য মোবাইল মেসেজ অ্যাপ চালু হয়েছে!` 
          : `SMS App launched for ${phones.length} recipients!`,
        'success'
      );
    }
    onClose();
  };

  const sendWhatsAppReminder = (debtor) => {
    const text = formatMessageForDebtor(debtor);
    let phone = debtor.phone ? debtor.phone.replace(/[^0-9]/g, '') : '';
    if (phone.startsWith('0')) phone = '88' + phone;
    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const sendTelegramReminder = (debtor) => {
    const text = formatMessageForDebtor(debtor);
    const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const copyDebtorReminder = (debtor) => {
    const text = formatMessageForDebtor(debtor);
    navigator.clipboard.writeText(text);
    if (showToast) showToast(lang === 'bn' ? `📋 ${debtor.name}-এর তাগাদা মেসেজ কপি হয়েছে!` : `Reminder copied for ${debtor.name}!`, 'success');
  };

  const handleCopySample = () => {
    if (selectedDebtors.length > 0) {
      const msg = formatMessageForDebtor(selectedDebtors[0]);
      navigator.clipboard.writeText(msg);
      if (showToast) showToast(lang === 'bn' ? 'নমুনা এসএমএস টেক্সট কপি করা হয়েছে!' : 'Sample SMS copied!', 'info');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1200, backdropFilter: 'blur(8px)', background: 'rgba(0, 0, 0, 0.75)' }}>
      <div
        className="modal-content animate-fade-in"
        style={{
          maxWidth: '580px',
          width: '94%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.25rem',
          borderRadius: '20px',
          background: 'var(--bg-card)',
          border: '1.5px solid rgba(239, 68, 68, 0.3)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #ef4444, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)' }}>
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {lang === 'bn' ? '📢 ১-ক্লিক বাল্ক এসএমএস ও সোশ্যাল তাগাদা' : '📢 1-Click Due SMS & Social Recovery'}
              </h3>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'এসএমএস, হোয়াটসঅ্যাপ বা টেলিগ্রামে দ্রুত বকেয়া আদায়ের তাগাদা পাঠান' : 'Send reminders via SMS, WhatsApp, or Telegram'}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            style={{ borderRadius: '50%', background: 'var(--bg-secondary)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Stats Highlight Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '14px', padding: '10px 14px' }}>
            <div style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: '800' }}>
              {lang === 'bn' ? 'মোট বাকিদার তালিকা' : 'Total Debtors'}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
              {selectedDebtors.length} / {eligibleDebtors.length} <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>জন</span>
            </div>
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '14px', padding: '10px 14px' }}>
            <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: '800' }}>
              {lang === 'bn' ? 'মোট তাগাদার পরিমাণ' : 'Total Due Amount'}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
              ৳{totalSelectedDue.toLocaleString()}
            </div>
          </div>
        </div>

        {/* SMS Template Preview Box */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '14px', padding: '10px 12px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)' }}>
              {lang === 'bn' ? '📝 তাগাদা মেসেজ টেমপ্লেট' : '📝 Message Template'}
            </span>
            <button
              type="button"
              onClick={handleCopySample}
              style={{ background: 'transparent', border: 'none', color: 'var(--business-primary)', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
            >
              <Copy size={12} /> {lang === 'bn' ? 'কপি' : 'Copy'}
            </button>
          </div>
          <textarea
            value={templatePrefix}
            onChange={(e) => setTemplatePrefix(e.target.value)}
            rows={2}
            style={{
              width: '100%',
              background: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '8px',
              fontSize: '0.78rem',
              color: 'var(--text-main)',
              resize: 'none',
              fontFamily: 'inherit'
            }}
          />
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {lang === 'bn' ? 'ℹ️ [দোকান] এবং [টাকা] মান স্বয়ংক্রিয়ভাবে সংশ্লিষ্ট কাস্টমারের নাম ও বকেয়া দিয়ে তৈরি হবে।' : 'ℹ️ [store] and [amount] will be automatically replaced.'}
          </div>
        </div>

        {/* Recipients Select List */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderBottom: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={toggleSelectAll}
              style={{ background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', fontWeight: '800', color: 'var(--text-main)', cursor: 'pointer' }}
            >
              {selectedIds.size === eligibleDebtors.length ? <CheckSquare size={16} color="#ef4444" /> : <Square size={16} />}
              <span>{lang === 'bn' ? 'সবাইকে সিলেক্ট / আনসিলেক্ট' : 'Select / Deselect All'}</span>
            </button>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {selectedDebtors.length} জন নির্বাচিত
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
            {eligibleDebtors.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                {lang === 'bn' ? 'খাতায় এই মুহূর্তে কোনো বকেয়াদারের পাওনা অবশিষ্ট নেই।' : 'No outstanding debtors found in the ledger.'}
              </div>
            ) : (
              eligibleDebtors.map(debtor => {
                const isSelected = selectedIds.has(debtor.id);
                return (
                  <div
                    key={debtor.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      background: isSelected ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
                      border: isSelected ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'all 0.15s ease',
                      gap: '8px'
                    }}
                  >
                    <div
                      onClick={() => toggleSelect(debtor.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1, minWidth: 0 }}
                    >
                      {isSelected ? <CheckSquare size={16} color="#ef4444" /> : <Square size={16} color="var(--text-muted)" />}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {debtor.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: debtor.hasPhone ? 'var(--text-muted)' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={10} /> {debtor.hasPhone ? debtor.phone : (lang === 'bn' ? '⚠️ ফোন নম্বর নেই' : 'No phone')}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      {/* 1-Click WhatsApp reminder */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); sendWhatsAppReminder(debtor); }}
                        title={lang === 'bn' ? 'হোয়াটসঅ্যাপে তাগাদা পাঠান' : 'Send via WhatsApp'}
                        style={{
                          background: 'rgba(37, 211, 102, 0.15)',
                          border: '1px solid rgba(37, 211, 102, 0.4)',
                          color: '#25d366',
                          borderRadius: '6px',
                          padding: '4px 7px',
                          fontSize: '0.68rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <span>💬 WA</span>
                      </button>

                      {/* 1-Click Telegram reminder */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); sendTelegramReminder(debtor); }}
                        title={lang === 'bn' ? 'টেলিগ্রামে তাগাদা শেয়ার করুন' : 'Share via Telegram'}
                        style={{
                          background: 'rgba(0, 136, 204, 0.15)',
                          border: '1px solid rgba(0, 136, 204, 0.4)',
                          color: '#0088cc',
                          borderRadius: '6px',
                          padding: '4px 7px',
                          fontSize: '0.68rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <span>✈️ TG</span>
                      </button>

                      {/* 1-Click Copy */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); copyDebtorReminder(debtor); }}
                        title={lang === 'bn' ? 'মেসেজ কপি করুন' : 'Copy Message'}
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-main)',
                          borderRadius: '6px',
                          padding: '4px 6px',
                          fontSize: '0.68rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Copy size={12} />
                      </button>

                      <div style={{ textAlign: 'right', minWidth: '60px' }}>
                        <div style={{ fontSize: '0.86rem', fontWeight: '900', color: '#ef4444', fontFamily: 'var(--font-mono)' }}>
                          ৳{debtor.dueAmount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ flex: 1, padding: '10px', fontWeight: '700' }}
          >
            {lang === 'bn' ? 'বাতিল' : 'Cancel'}
          </button>

          <button
            type="button"
            className="btn press-scale"
            onClick={handleSendNativeBulkSms}
            disabled={selectedDebtors.length === 0}
            style={{
              flex: 2,
              background: 'linear-gradient(135deg, #ef4444, #f97316)',
              color: '#ffffff',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '10px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: selectedDebtors.length > 0 ? '0 4px 16px rgba(239, 68, 68, 0.4)' : 'none',
              cursor: selectedDebtors.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <Send size={16} />
            <span>
              {lang === 'bn' 
                ? `এক-ক্লিকে এসএমএস পাঠান (${selectedDebtors.length} জন)` 
                : `Send Bulk SMS (${selectedDebtors.length})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
