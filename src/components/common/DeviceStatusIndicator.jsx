import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  Laptop,
  Smartphone,
  Globe,
  CheckCircle2,
  Edit2,
  Save,
  X,
  RefreshCw,
  Shield,
  Cloud,
  Check,
  Radio,
  ExternalLink,
  Send,
  Bot,
  Settings
} from 'lucide-react';
import { DEVICE_TYPES } from '../../services/deviceManagerService';
import { TelegramBotModal } from './TelegramBotModal';
import { getTelegramBackupConfig } from '../../services/telegramBackupService';

export const DeviceStatusIndicator = () => {
  const { currentDevice, deviceRegistry, updateDeviceName, isSupabaseActive } = useApp();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [showTgModal, setShowTgModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [tempName, setTempName] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [tgConfig, setTgConfig] = useState(() => getTelegramBackupConfig());

  const currentType = currentDevice?.type || DEVICE_TYPES.PC;
  const registry = deviceRegistry || {};

  const handleStartEdit = (type, currentName) => {
    setEditingType(type);
    setTempName(currentName || '');
  };

  const handleSaveEdit = (type) => {
    if (tempName.trim()) {
      updateDeviceName(type, tempName.trim());
      setEditingType(null);
      setSaveSuccessMsg(`'${tempName.trim()}' নামটি সফলভাবে সংরক্ষণ করা হয়েছে!`);
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    }
  };

  const activeUserEmail = user?.email || (typeof window !== 'undefined' ? localStorage.getItem('hk360_connected_user_account') : '') || 'hossansajjad1994@gmail.com';
  const driveAccount = (typeof window !== 'undefined' ? localStorage.getItem('hk360_connected_drive_account') : '') || activeUserEmail;

  return (
    <>
      {/* Navbar Header Compact Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn-header-device"
        title="৩টি প্ল্যাটফর্ম ও ডিভাইস সংযোগ স্ট্যাটাস"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          background: 'rgba(59, 130, 246, 0.12)',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          borderRadius: '20px',
          padding: '4px 10px',
          cursor: 'pointer',
          color: 'var(--text-main)',
          fontSize: '0.78rem',
          fontWeight: '700',
          transition: 'all 0.2s ease',
          flexShrink: 0,
          whiteSpace: 'nowrap'
        }}
      >
        <span style={{ fontSize: '1rem', lineHeight: 1 }}>{currentDevice?.icon || '💻'}</span>
        <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {currentDevice?.name || 'ডিভাইস'}
        </span>
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 8px #10b981',
            display: 'inline-block'
          }}
        />
      </button>

      {/* Full Cross-Platform Status & Rename Modal */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              background: 'var(--card-bg, #1e293b)',
              color: 'var(--text-main, #f8fafc)',
              borderRadius: '16px',
              border: '1px solid var(--border-color, #334155)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.25rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Radio size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>
                    ৩টি প্ল্যাটফর্ম ও ডিভাইস সংযোগ হাব
                  </h3>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    মোবাইল, পিসি ও ওয়েব—সবখানে একই অ্যাকাউন্ট ও লেনদেন ট্র্যাকিং
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Notification message */}
            {saveSuccessMsg && (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {/* Cross-Platform Unified Account Sync Card */}
            <div style={{ background: 'var(--bg-primary, #0f172a)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  <Cloud size={16} style={{ color: '#3b82f6' }} />
                  <span>ক্লাউড ও গুগল ড্রাইভ অ্যাকাউন্ট সিঙ্ক</span>
                </div>
                <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                  ● সিঙ্ক সক্রিয়
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.03)', padding: '6px 10px', borderRadius: '8px' }}>
                  <span>🔑 মাস্টার লগইন অ্যাকাউন্ট:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{activeUserEmail}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '6px 10px', borderRadius: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#10b981', fontWeight: '700' }}>
                    <Cloud size={14} />
                    <span>অনুমোদিত ড্রাইভ অ্যাডমিন:</span>
                  </span>
                  <strong style={{ color: '#10b981', fontFamily: 'monospace' }}>{driveAccount}</strong>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                  💡 পিসি, মোবাইল ও ওয়েব—সব টার্মিনালেই এই গুগল ড্রাইভ অ্যাকাউন্টে স্বয়ংক্রিয় ব্যাকআপ সংরক্ষিত হবে।
                </div>
              </div>
            </div>

            {/* 3 Platforms List (PC, Mobile, Web) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                সংযুক্ত প্ল্যাটফর্ম ও কাস্টম নামসমূহ:
              </div>

              {/* PLATFORM 1: PC Desktop */}
              <div
                style={{
                  background: currentType === DEVICE_TYPES.PC ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-primary)',
                  border: `1.5px solid ${currentType === DEVICE_TYPES.PC ? '#3b82f6' : 'var(--border-color)'}`,
                  borderRadius: '12px',
                  padding: '12px 14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Laptop size={18} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.88rem' }}>
                          {registry[DEVICE_TYPES.PC]?.name || 'পিসি ডেস্কটপ (ক্যাশ কাউন্টার)'}
                        </span>
                        {currentType === DEVICE_TYPES.PC && (
                          <span style={{ fontSize: '0.68rem', fontWeight: '800', background: '#3b82f6', color: '#fff', padding: '1px 6px', borderRadius: '4px' }}>
                            এই পিসি (Current)
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        পিসি অ্যাপ ও লোকাল প্রিভিউ সার্ভার • http://localhost:5173
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {editingType === DEVICE_TYPES.PC ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          placeholder="পিসির নাম দিন..."
                          style={{ padding: '4px 8px', fontSize: '0.78rem', borderRadius: '6px', border: '1px solid #3b82f6', background: 'var(--card-bg)', color: 'var(--text-main)' }}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(DEVICE_TYPES.PC)}
                          className="btn btn-primary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Save size={12} />
                          <span>সেভ</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingType(null)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        >
                          বাতিল
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(DEVICE_TYPES.PC, registry[DEVICE_TYPES.PC]?.name)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}
                        title="পিসির নাম পরিবর্তন করুন"
                      >
                        <Edit2 size={12} />
                        <span>রিনেম (Rename)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* PLATFORM 2: Mobile App */}
              <div
                style={{
                  background: currentType === DEVICE_TYPES.MOBILE ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-primary)',
                  border: `1.5px solid ${currentType === DEVICE_TYPES.MOBILE ? '#10b981' : 'var(--border-color)'}`,
                  borderRadius: '12px',
                  padding: '12px 14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Smartphone size={18} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.88rem' }}>
                          {registry[DEVICE_TYPES.MOBILE]?.name || 'মোবাইল অ্যাপ (অ্যান্ড্রয়েড)'}
                        </span>
                        {currentType === DEVICE_TYPES.MOBILE && (
                          <span style={{ fontSize: '0.68rem', fontWeight: '800', background: '#10b981', color: '#fff', padding: '1px 6px', borderRadius: '4px' }}>
                            এই মোবাইল (Current)
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        অ্যান্ড্রয়েড APK • ক্যামেরা স্ক্যানার ও অফলাইন সেলস
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {editingType === DEVICE_TYPES.MOBILE ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          placeholder="মোবাইলের নাম দিন..."
                          style={{ padding: '4px 8px', fontSize: '0.78rem', borderRadius: '6px', border: '1px solid #10b981', background: 'var(--card-bg)', color: 'var(--text-main)' }}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(DEVICE_TYPES.MOBILE)}
                          className="btn btn-primary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#10b981' }}
                        >
                          <Save size={12} />
                          <span>সেভ</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingType(null)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        >
                          বাতিল
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(DEVICE_TYPES.MOBILE, registry[DEVICE_TYPES.MOBILE]?.name)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}
                        title="মোবাইলের নাম পরিবর্তন করুন"
                      >
                        <Edit2 size={12} />
                        <span>রিনেম (Rename)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* PLATFORM 3: Vercel Live Web App */}
              <div
                style={{
                  background: currentType === DEVICE_TYPES.WEB ? 'rgba(139, 92, 246, 0.08)' : 'var(--bg-primary)',
                  border: `1.5px solid ${currentType === DEVICE_TYPES.WEB ? '#8b5cf6' : 'var(--border-color)'}`,
                  borderRadius: '12px',
                  padding: '12px 14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Globe size={18} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.88rem' }}>
                          {registry[DEVICE_TYPES.WEB]?.name || 'ক্লাউড ওয়েব অ্যাপ (Netlify & Vercel)'}
                        </span>
                        {currentType === DEVICE_TYPES.WEB && (
                          <span style={{ fontSize: '0.68rem', fontWeight: '800', background: '#8b5cf6', color: '#fff', padding: '1px 6px', borderRadius: '4px' }}>
                            এই ওয়েব (Current)
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        ক্লাউড ওয়েবসাইট • https://hisabkitab360.netlify.app & vercel.app
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {editingType === DEVICE_TYPES.WEB ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          placeholder="ওয়েব শাখার নাম দিন..."
                          style={{ padding: '4px 8px', fontSize: '0.78rem', borderRadius: '6px', border: '1px solid #8b5cf6', background: 'var(--card-bg)', color: 'var(--text-main)' }}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(DEVICE_TYPES.WEB)}
                          className="btn btn-primary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#8b5cf6' }}
                        >
                          <Save size={12} />
                          <span>সেভ</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingType(null)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        >
                          বাতিল
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(DEVICE_TYPES.WEB, registry[DEVICE_TYPES.WEB]?.name)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}
                        title="ওয়েব শাখার নাম পরিবর্তন করুন"
                      >
                        <Edit2 size={12} />
                        <span>রিনেম (Rename)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* PLATFORM 4: Telegram Cloud Bot (Remote Control & Notifications) */}
              <div
                style={{
                  background: 'rgba(14, 165, 233, 0.08)',
                  border: '1.5px solid rgba(14, 165, 233, 0.4)',
                  borderRadius: '12px',
                  padding: '12px 14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(14, 165, 233, 0.2)', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Send size={18} style={{ transform: 'rotate(-20deg) translate(1px, -1px)' }} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.88rem' }}>
                          টেলিগ্রাম ক্লাউড বট (রিমোট কন্ট্রোল ও চ্যাটবট সিঙ্ক)
                        </span>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: '800',
                          background: tgConfig?.botToken ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: tgConfig?.botToken ? '#10b981' : '#f59e0b',
                          border: `1px solid ${tgConfig?.botToken ? '#10b981' : '#f59e0b'}`,
                          padding: '1px 6px',
                          borderRadius: '4px'
                        }}>
                          {tgConfig?.botToken ? 'সংযুক্ত (Active)' : 'সেটআপ প্রয়োজন'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        মোবাইল মেসেজ দিয়ে সেল/খরচ এন্ট্রি, লাইভ রিপোর্ট ও ৩-টার্মিনাল অটো-সিঙ্ক
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowTgModal(true);
                    }}
                    className="btn btn-secondary"
                    style={{
                      padding: '5px 12px',
                      fontSize: '0.74rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontWeight: '800',
                      color: '#0ea5e9',
                      border: '1px solid rgba(14, 165, 233, 0.4)',
                      background: 'rgba(14, 165, 233, 0.1)'
                    }}
                    title="টেলিগ্রাম বট কনফিগার করুন ও কমান্ড ডিরেক্টরি দেখুন"
                  >
                    <Settings size={13} />
                    <span>বট কনফিগার / কমান্ড হাব</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Cashier & POS Transaction Origin Guarantee */}
            <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '12px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '800', color: 'var(--business-primary)', marginBottom: '4px' }}>
                <Shield size={16} />
                <span>ক্যাশিয়ার বিক্রয় ট্র্যাকিং নিশ্চয়তা (Audit Trail)</span>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                ক্যাশিয়ার যে ডিভাইস থেকেই বিল বা ক্যাশ করুক না কেন, প্রতিটি রসিদ, ইনভয়েস এবং অডিট ট্রেইলে স্বয়ংক্রিয়ভাবে ডিভাইসের নাম যেমন: <strong style={{ color: 'var(--text-main)' }}>[{currentDevice?.badgeText || '💻 পিসি কাউন্টার'}]</strong> স্থায়ীভাবে লিপিবদ্ধ থাকবে।
              </div>
            </div>

            {/* Close Button */}
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="btn btn-primary"
                style={{ padding: '8px 20px', fontSize: '0.85rem', fontWeight: '700' }}
              >
                ঠিক আছে
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Telegram Bot Setup & Command Hub Modal */}
      <TelegramBotModal
        isOpen={showTgModal}
        onClose={() => {
          setShowTgModal(false);
          setTgConfig(getTelegramBackupConfig());
        }}
      />
    </>
  );
};
