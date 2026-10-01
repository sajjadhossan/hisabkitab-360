import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  MessageCircle,
  Phone,
  Mail,
  Send,
  ExternalLink,
  ShieldCheck,
  Check,
  Copy,
  Clock,
  Sparkles,
  Edit2,
  Save,
  HelpCircle,
  Headphones
} from 'lucide-react';
import {
  normalizeWhatsAppPhone,
  formatVendorSupportWhatsAppMessage
} from '../../services/qrService';

export const HelpSupportModal = ({ isOpen, onClose }) => {
  const {
    businessSettings,
    updateBusinessSettings,
    lang,
    showToast,
    isHelpSupportOpen,
    closeHelpSupport
  } = useApp();
  const { user, isOwner, isSuperAdmin } = useAuth();

  const showModal = isOpen !== undefined ? isOpen : isHelpSupportOpen;
  const handleClose = onClose || closeHelpSupport;

  const [isEditing, setIsEditing] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  const vendorSupport = businessSettings?.vendorSupport || {
    whatsapp: businessSettings?.phone || '8801700000000',
    phone: businessSettings?.phone || '01700000000',
    facebook: 'https://m.me/hisabkitab360',
    telegram: 'https://t.me/hisabkitab360',
    email: 'support@hisabkitab360.com',
    supportName: 'হিসাবকিতাব ৩৬০ অফিসিয়াল সাপোর্ট হেল্পডেস্ক',
    availableHours: 'সকাল ৯:০০ টা - রাত ১১:০০ টা (সপ্তাহের ৭ দিন)'
  };

  const [editData, setEditData] = useState({ ...vendorSupport });

  if (!showModal) return null;

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(lang === 'bn' ? 'ক্লিপবোর্ডে কপি করা হয়েছে!' : 'Copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveSupportConfig = (e) => {
    e.preventDefault();
    updateBusinessSettings({
      ...businessSettings,
      vendorSupport: { ...editData }
    });
    setIsEditing(false);
    showToast(lang === 'bn' ? 'সাপোর্ট ও হেল্পডেস্ক তথ্য সফলভাবে সংরক্ষিত হয়েছে!' : 'Support contacts saved!');
  };

  const handleOpenWhatsApp = () => {
    const rawPhone = vendorSupport.whatsapp || vendorSupport.phone || '';
    const cleanPhone = normalizeWhatsAppPhone(rawPhone);
    const msg = formatVendorSupportWhatsAppMessage(user, businessSettings?.companyName);
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleOpenFacebook = () => {
    let fbUrl = vendorSupport.facebook || 'https://facebook.com';
    if (!fbUrl.startsWith('http')) fbUrl = `https://${fbUrl}`;
    window.open(fbUrl, '_blank');
  };

  const handleOpenTelegram = () => {
    let tgUrl = vendorSupport.telegram || 'https://t.me';
    if (!tgUrl.startsWith('http')) tgUrl = `https://${tgUrl}`;
    window.open(tgUrl, '_blank');
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 1400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={handleClose}
    >
      <div
        className="modal-content animate-scale-up"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header with Gradient Accent */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)',
            borderBottom: '1px solid var(--border-color)',
            padding: '16px 20px',
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
                background: 'linear-gradient(135deg, #10b981, #6366f1)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
              }}
            >
              <Headphones size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'গ্রাহক সেবা ও ভেন্ডর সহায়তা' : 'Customer Support & Helpdesk'}
              </h2>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {vendorSupport.supportName || 'HisabKitab 360 Official Support Desk'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {(isOwner || isSuperAdmin) && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                title="সাপোর্ট তথ্য এডিট করুন"
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '0.74rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Edit2 size={13} />
                <span>{lang === 'bn' ? 'এডিট' : 'Edit'}</span>
              </button>
            )}

            <button
              type="button"
              className="btn-icon"
              onClick={handleClose}
              style={{ width: '32px', height: '32px', borderRadius: '50%' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', maxHeight: '78vh', overflowY: 'auto' }}>
          {isEditing ? (
            /* Vendor Contact Settings Form (For Owner / Vendor) */
            <form onSubmit={handleSaveSupportConfig} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', background: 'var(--bg-primary)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                💡 <b>ভেন্ডর কন্টাক্ট কনফিগারেশন:</b> আপনার ক্লায়েন্ট বা দোকানদাররা যাতে কোনো সমস্যায় পড়লে সরাসরি আপনার সাথে যোগাযোগ করতে পারেন, নিচে আপনার আসল যোগাযোগের তথ্য দিন।
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  সাপোর্ট টিমের নাম বা পরিচয়:
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={editData.supportName || ''}
                  onChange={(e) => setEditData({ ...editData, supportName: e.target.value })}
                  placeholder="যেমন: হিসাবকিতাব ৩৬০ অফিসিয়াল সাপোর্ট ডেস্ক"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#10b981', display: 'block', marginBottom: '4px' }}>
                    🟢 WhatsApp নাম্বার:
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={editData.whatsapp || ''}
                    onChange={(e) => setEditData({ ...editData, whatsapp: e.target.value })}
                    placeholder="01XXXXXXXXX"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#3b82f6', display: 'block', marginBottom: '4px' }}>
                    📞 সরাসরি ফোন নাম্বার:
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={editData.phone || ''}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    placeholder="01XXXXXXXXX"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#1877f2', display: 'block', marginBottom: '4px' }}>
                  🔵 Facebook পেজ / মেসেঞ্জার লিংক:
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={editData.facebook || ''}
                  onChange={(e) => setEditData({ ...editData, facebook: e.target.value })}
                  placeholder="https://m.me/yourpage বা facebook.com/yourpage"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#0088cc', display: 'block', marginBottom: '4px' }}>
                  ✈️ Telegram লিংক বা ইউজারনেম:
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={editData.telegram || ''}
                  onChange={(e) => setEditData({ ...editData, telegram: e.target.value })}
                  placeholder="https://t.me/yourusername"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#f59e0b', display: 'block', marginBottom: '4px' }}>
                  ✉️ অফিসিয়াল সাপোর্ট ইমেইল:
                </label>
                <input
                  type="email"
                  className="input-field"
                  value={editData.email || ''}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  placeholder="support@yourbrand.com"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  🕒 সেবার সময়সূচী (উপলব্ধ সময়):
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={editData.availableHours || ''}
                  onChange={(e) => setEditData({ ...editData, availableHours: e.target.value })}
                  placeholder="সকাল ৯:০০ টা - রাত ১১:০০ টা (সপ্তাহের ৭ দিন)"
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditData({ ...vendorSupport });
                    setIsEditing(false);
                  }}
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#10b981' }}>
                  <Save size={15} />
                  <span>{lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Config'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Direct Client Action View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  background: 'var(--bg-primary)',
                  borderRadius: '14px',
                  padding: '14px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'যেকোনো সমস্যায় আমরা আপনার পাশে আছি' : 'We are here to assist you'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                    <Clock size={13} style={{ color: '#10b981' }} />
                    <span>{vendorSupport.availableHours || 'সকাল ৯:০০ টা - রাত ১১:০০ টা'}</span>
                  </div>
                </div>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid #10b981',
                    borderRadius: '20px',
                    padding: '3px 10px',
                    fontSize: '0.72rem',
                    fontWeight: '800'
                  }}
                >
                  🟢 অনলাইন সক্রিয়
                </span>
              </div>

              {/* Action 1: WhatsApp Support (The Hero Option) */}
              <div
                onClick={handleOpenWhatsApp}
                style={{
                  background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.12) 0%, rgba(18, 140, 126, 0.16) 100%)',
                  border: '1.5px solid #25d366',
                  borderRadius: '16px',
                  padding: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 16px rgba(37, 211, 102, 0.15)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '14px',
                      background: '#25d366',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(37, 211, 102, 0.4)'
                    }}
                  >
                    <MessageCircle size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.96rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{lang === 'bn' ? 'সরাসরি WhatsApp-এ সহায়তা নিন' : 'Instant WhatsApp Support'}</span>
                      <span style={{ background: '#25d366', color: '#fff', fontSize: '0.62rem', fontWeight: '800', padding: '1px 6px', borderRadius: '4px' }}>
                        দ্রুততম
                      </span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {vendorSupport.whatsapp || vendorSupport.phone} • ১ ক্লিকে চ্যাট শুরু হবে
                    </div>
                  </div>
                </div>
                <ExternalLink size={18} style={{ color: '#25d366' }} />
              </div>

              {/* Action 2: Facebook Messenger */}
              <div
                onClick={handleOpenFacebook}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: '#1877f2',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Send size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {lang === 'bn' ? 'Facebook মেসেঞ্জার পেজ' : 'Facebook Messenger'}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      আমাদের ফেসবুক পেজে মেসেজ পাঠান
                    </div>
                  </div>
                </div>
                <ExternalLink size={16} style={{ color: 'var(--text-muted)' }} />
              </div>

              {/* Action 3: Telegram Support */}
              <div
                onClick={handleOpenTelegram}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: '#0088cc',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Send size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {lang === 'bn' ? 'Telegram হেল্পডেস্ক' : 'Telegram Support'}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      টেলিগ্রামে দ্রুত সমাধান পান
                    </div>
                  </div>
                </div>
                <ExternalLink size={16} style={{ color: 'var(--text-muted)' }} />
              </div>

              {/* Direct Phone & Email info bar */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  marginTop: '4px'
                }}
              >
                {/* Phone Call */}
                <div
                  style={{
                    background: 'var(--bg-primary)',
                    borderRadius: '12px',
                    padding: '12px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                      <Phone size={13} style={{ color: '#10b981' }} />
                      <span>{lang === 'bn' ? 'সরাসরি কল' : 'Phone'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(vendorSupport.phone, 'phone')}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      title="কপি করুন"
                    >
                      {copiedKey === 'phone' ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                    </button>
                  </div>
                  <a
                    href={`tel:${vendorSupport.phone}`}
                    style={{ fontSize: '0.84rem', fontWeight: '800', color: 'var(--text-main)', textDecoration: 'none' }}
                  >
                    {vendorSupport.phone || '01XXXXXXXXX'}
                  </a>
                </div>

                {/* Email Support */}
                <div
                  style={{
                    background: 'var(--bg-primary)',
                    borderRadius: '12px',
                    padding: '12px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                      <Mail size={13} style={{ color: '#f59e0b' }} />
                      <span>{lang === 'bn' ? 'ইমেইল' : 'Email'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(vendorSupport.email, 'email')}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      title="কপি করুন"
                    >
                      {copiedKey === 'email' ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                    </button>
                  </div>
                  <a
                    href={`mailto:${vendorSupport.email}`}
                    style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {vendorSupport.email || 'support@hisabkitab360.com'}
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
