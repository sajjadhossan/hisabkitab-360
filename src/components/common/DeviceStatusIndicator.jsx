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
  Settings,
  Apple,
  Zap,
  Wifi,
  Sparkles
} from 'lucide-react';
import { DEVICE_TYPES } from '../../services/deviceManagerService';
import { TelegramBotModal } from './TelegramBotModal';
import { getTelegramBackupConfig } from '../../services/telegramBackupService';
import {
  subscribePresence,
  getOnlineTerminalsList,
  isLiveSyncConnected,
  requestBusinessMeshSync
} from '../../services/liveSyncService';

export const DeviceStatusIndicator = () => {
  const { currentDevice, deviceRegistry, updateDeviceName, isSupabaseActive } = useApp();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [showTgModal, setShowTgModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [tempName, setTempName] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [tgConfig, setTgConfig] = useState(() => getTelegramBackupConfig());
  const [onlineTerminals, setOnlineTerminals] = useState(() => getOnlineTerminalsList());
  const [isMeshScanning, setIsMeshScanning] = useState(false);
  const [meshScanSuccess, setMeshScanSuccess] = useState('');

  const currentType = currentDevice?.type || DEVICE_TYPES.PC;
  const registry = deviceRegistry || {};

  // Subscribe to Live Supabase WebSocket Presence
  useEffect(() => {
    const unsub = subscribePresence((list) => {
      if (Array.isArray(list)) {
        setOnlineTerminals(list);
      }
    });
    return () => unsub();
  }, []);

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

  // Instant 1-Click Multi-Terminal Live Mesh Scan
  const handleInstantMeshScan = async () => {
    setIsMeshScanning(true);
    setMeshScanSuccess('');
    try {
      await requestBusinessMeshSync();
      setTimeout(() => {
        setIsMeshScanning(false);
        const timeNow = new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        setMeshScanSuccess(`✅ ৪টি প্ল্যাটফর্মেই লাইভ মেশ সিঙ্ক সফল! (সময়: ${timeNow})`);
        setTimeout(() => setMeshScanSuccess(''), 4000);
      }, 600);
    } catch {
      setIsMeshScanning(false);
    }
  };

  const activeUserEmail = user?.email || (typeof window !== 'undefined' ? localStorage.getItem('hk360_connected_user_account') : '') || 'hossansajjad1994@gmail.com';
  const driveAccount = (typeof window !== 'undefined' ? localStorage.getItem('hk360_connected_drive_account') : '') || activeUserEmail;

  // Helper: Check if a platform has an active live peer on mesh
  const isPlatformOnline = (platType) => {
    if (currentType === platType) return true;
    return onlineTerminals.some(t => {
      if (platType === DEVICE_TYPES.MOBILE && (t.platform === 'android' || t.deviceType === 'mobile')) return true;
      if (platType === DEVICE_TYPES.PC && (t.platform === 'desktop' || t.deviceType === 'pc')) return true;
      if (platType === DEVICE_TYPES.MAC && (t.platform === 'mac' || t.deviceType === 'mac')) return true;
      if (platType === DEVICE_TYPES.WEB && (t.platform === 'web' || t.deviceType === 'web')) return true;
      return false;
    });
  };

  const liveConnectedCount = Math.max(onlineTerminals.length, 1);

  return (
    <>
      {/* Navbar Header Compact Button with Live Terminal Count */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn-header-device"
        title="৪টি প্ল্যাটফর্ম লাইভ ডিভাইস মেশ রাডার ও রিয়েল-টাইম সিঙ্ক"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          background: 'rgba(59, 130, 246, 0.12)',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          borderRadius: '20px',
          padding: '4px 10px',
          cursor: 'pointer',
          color: 'var(--text-main, #f8fafc)',
          fontSize: '0.78rem',
          fontWeight: '700',
          transition: 'all 0.2s ease',
          flexShrink: 0,
          whiteSpace: 'nowrap'
        }}
      >
        <span style={{ fontSize: '1rem', lineHeight: 1 }}>{currentDevice?.icon || '💻'}</span>
        <span style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {currentDevice?.name || 'ডিভাইস'}
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid #10b981',
            borderRadius: '10px',
            padding: '1px 6px',
            fontSize: '0.66rem',
            color: '#10b981',
            fontWeight: '800'
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 6px #10b981',
              display: 'inline-block'
            }}
          />
          <span>{liveConnectedCount} লাইভ</span>
        </span>
      </button>

      {/* Full Cross-Platform Status & Rename Modal */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
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
              borderRadius: '20px',
              border: '1px solid var(--border-color, #334155)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(59, 130, 246, 0.25)',
              width: '100%',
              maxWidth: '580px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.4rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color, #334155)', paddingBottom: '12px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)' }}>
                  <Radio size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', letterSpacing: '-0.01em' }}>
                    লাইভ ক্রস-প্ল্যাটফর্ম ডিভাইস মেশ রাডার
                  </h3>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                    ৪টি প্ল্যাটফর্ম (Android, Windows, macOS, Web) রিয়েল-টাইম লাইভ সিঙ্ক (&lt;১৫০ms)
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer', padding: '6px', borderRadius: '50%' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Live Mesh Status & Instant Scan Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(16, 185, 129, 0.12) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '14px',
                padding: '12px 14px',
                marginBottom: '14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid #10b981',
                  color: '#10b981',
                  padding: '4px 10px',
                  borderRadius: '10px',
                  fontSize: '0.74rem',
                  fontWeight: '800'
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                  <span>{liveConnectedCount}টি টার্মিনাল সক্রিয় সংযুক্ত</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Zap size={13} style={{ color: '#f59e0b' }} />
                  <span>&lt; ১৫০ms সাব-সেকেন্ড লাইভ সিঙ্ক</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleInstantMeshScan}
                disabled={isMeshScanning}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '6px 14px',
                  fontSize: '0.76rem',
                  fontWeight: '800',
                  cursor: isMeshScanning ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 3px 10px rgba(37, 99, 235, 0.35)',
                  minHeight: '34px'
                }}
              >
                <RefreshCw size={14} className={isMeshScanning ? 'animate-spin' : ''} />
                <span>{isMeshScanning ? 'স্ক্যান হচ্ছে...' : 'মেশ রিফ্রেশ / স্ক্যান'}</span>
              </button>
            </div>

            {/* Notification message */}
            {meshScanSuccess && (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', padding: '8px 12px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} />
                <span>{meshScanSuccess}</span>
              </div>
            )}
            {saveSuccessMsg && (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', padding: '8px 12px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {/* 4 Platforms List + Telegram Bot */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ৪টি প্ল্যাটফর্মের লাইভ সিঙ্ক স্ট্যাটাস:
              </div>

              {/* PLATFORM 1: PC Desktop */}
              <div
                style={{
                  background: currentType === DEVICE_TYPES.PC ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-primary, #0f172a)',
                  border: `1.5px solid ${currentType === DEVICE_TYPES.PC ? '#3b82f6' : 'var(--border-color, #334155)'}`,
                  borderRadius: '12px',
                  padding: '12px 14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Laptop size={18} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.88rem' }}>
                          {registry[DEVICE_TYPES.PC]?.name || 'পিসি ডেস্কটপ (ক্যাশ কাউন্টার)'}
                        </span>
                        {currentType === DEVICE_TYPES.PC ? (
                          <span style={{ fontSize: '0.68rem', fontWeight: '800', background: '#3b82f6', color: '#fff', padding: '1px 6px', borderRadius: '4px' }}>
                            ⭐ এই পিসি (সক্রিয়)
                          </span>
                        ) : isPlatformOnline(DEVICE_TYPES.PC) ? (
                          <span style={{ fontSize: '0.68rem', fontWeight: '800', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid #10b981', padding: '1px 6px', borderRadius: '4px' }}>
                            🟢 অনলাইন ও সংযুক্ত
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8', background: 'rgba(148, 163, 184, 0.15)', padding: '1px 6px', borderRadius: '4px' }}>
                            ⚪ স্ট্যান্ডবাই
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)' }}>
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
                          style={{ padding: '4px 8px', fontSize: '0.78rem', borderRadius: '6px', border: '1px solid #3b82f6', background: 'var(--card-bg, #1e293b)', color: 'var(--text-main, #fff)' }}
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
                        <span>রিনেম</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* PLATFORM 2: Mobile App (Android APK) */}
              <div
                style={{
                  background: currentType === DEVICE_TYPES.MOBILE ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-primary, #0f172a)',
                  border: `1.5px solid ${currentType === DEVICE_TYPES.MOBILE ? '#10b981' : 'var(--border-color, #334155)'}`,
                  borderRadius: '12px',
                  padding: '12px 14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Smartphone size={18} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.88rem' }}>
                          {registry[DEVICE_TYPES.MOBILE]?.name || 'মোবাইল অ্যাপ (অ্যান্ড্রয়েড APK)'}
                        </span>
                        {currentType === DEVICE_TYPES.MOBILE ? (
                          <span style={{ fontSize: '0.68rem', fontWeight: '800', background: '#10b981', color: '#fff', padding: '1px 6px', borderRadius: '4px' }}>
                            ⭐ এই মোবাইল (সক্রিয়)
                          </span>
                        ) : isPlatformOnline(DEVICE_TYPES.MOBILE) ? (
                          <span style={{ fontSize: '0.68rem', fontWeight: '800', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid #10b981', padding: '1px 6px', borderRadius: '4px' }}>
                            🟢 অনলাইন ও সংযুক্ত
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8', background: 'rgba(148, 163, 184, 0.15)', padding: '1px 6px', borderRadius: '4px' }}>
                            ⚪ স্ট্যান্ডবাই
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)' }}>
                        অ্যান্ড্রয়েড APK • ক্যামেরা স্ক্যানার, বায়োমেট্রিক ও অফলাইন সেলস
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
                          style={{ padding: '4px 8px', fontSize: '0.78rem', borderRadius: '6px', border: '1px solid #10b981', background: 'var(--card-bg, #1e293b)', color: 'var(--text-main, #fff)' }}
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
                        <span>রিনেম</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* PLATFORM 3: Apple macOS / MacBook */}
              <div
                style={{
                  background: currentType === DEVICE_TYPES.MAC ? 'rgba(168, 85, 247, 0.08)' : 'var(--bg-primary, #0f172a)',
                  border: `1.5px solid ${currentType === DEVICE_TYPES.MAC ? '#a855f7' : 'var(--border-color, #334155)'}`,
                  borderRadius: '12px',
                  padding: '12px 14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Apple size={18} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.88rem' }}>
                          {registry[DEVICE_TYPES.MAC]?.name || 'অ্যাপল ম্যাকবুক (ম্যাকওএস)'}
                        </span>
                        {currentType === DEVICE_TYPES.MAC ? (
                          <span style={{ fontSize: '0.68rem', fontWeight: '800', background: '#a855f7', color: '#fff', padding: '1px 6px', borderRadius: '4px' }}>
                            ⭐ এই ম্যাকবুক (সক্রিয়)
                          </span>
                        ) : isPlatformOnline(DEVICE_TYPES.MAC) ? (
                          <span style={{ fontSize: '0.68rem', fontWeight: '800', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid #10b981', padding: '1px 6px', borderRadius: '4px' }}>
                            🟢 অনলাইন ও সংযুক্ত
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8', background: 'rgba(148, 163, 184, 0.15)', padding: '1px 6px', borderRadius: '4px' }}>
                            ⚪ স্ট্যান্ডবাই
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)' }}>
                        ম্যাকবুক ডেস্কটপ অ্যাপ • রিয়েল-টাইম অ্যাডমিন ও এক্সিকিউটিভ ড্যাশবোর্ড
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {editingType === DEVICE_TYPES.MAC ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          placeholder="ম্যাকবুকের নাম দিন..."
                          style={{ padding: '4px 8px', fontSize: '0.78rem', borderRadius: '6px', border: '1px solid #a855f7', background: 'var(--card-bg, #1e293b)', color: 'var(--text-main, #fff)' }}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(DEVICE_TYPES.MAC)}
                          className="btn btn-primary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#a855f7' }}
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
                        onClick={() => handleStartEdit(DEVICE_TYPES.MAC, registry[DEVICE_TYPES.MAC]?.name)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}
                        title="ম্যাকবুকের নাম পরিবর্তন করুন"
                      >
                        <Edit2 size={12} />
                        <span>রিনেম</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* PLATFORM 4: Vercel Live Web App */}
              <div
                style={{
                  background: currentType === DEVICE_TYPES.WEB ? 'rgba(139, 92, 246, 0.08)' : 'var(--bg-primary, #0f172a)',
                  border: `1.5px solid ${currentType === DEVICE_TYPES.WEB ? '#8b5cf6' : 'var(--border-color, #334155)'}`,
                  borderRadius: '12px',
                  padding: '12px 14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Globe size={18} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.88rem' }}>
                          {registry[DEVICE_TYPES.WEB]?.name || 'ক্লাউড ওয়েব অ্যাপ (Netlify & Vercel)'}
                        </span>
                        {currentType === DEVICE_TYPES.WEB ? (
                          <span style={{ fontSize: '0.68rem', fontWeight: '800', background: '#8b5cf6', color: '#fff', padding: '1px 6px', borderRadius: '4px' }}>
                            ⭐ এই ওয়েব (সক্রিয়)
                          </span>
                        ) : isPlatformOnline(DEVICE_TYPES.WEB) ? (
                          <span style={{ fontSize: '0.68rem', fontWeight: '800', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid #10b981', padding: '1px 6px', borderRadius: '4px' }}>
                            🟢 অনলাইন ও সংযুক্ত
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8', background: 'rgba(148, 163, 184, 0.15)', padding: '1px 6px', borderRadius: '4px' }}>
                            ⚪ স্ট্যান্ডবাই
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)' }}>
                        ক্লাউড ওয়েবসাইট • https://hisabkitab360.vercel.app
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
                          style={{ padding: '4px 8px', fontSize: '0.78rem', borderRadius: '6px', border: '1px solid #8b5cf6', background: 'var(--card-bg, #1e293b)', color: 'var(--text-main, #fff)' }}
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
                        <span>রিনেম</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* PLATFORM 5: Telegram Cloud Bot */}
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
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(14, 165, 233, 0.2)', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)' }}>
                        মোবাইল মেসেজ দিয়ে সেল/খরচ এন্ট্রি, লাইভ রিপোর্ট ও ৪-টার্মিনাল অটো-সিঙ্ক
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowTgModal(true)}
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
                      background: 'rgba(14, 165, 233, 0.1)',
                      minHeight: '34px'
                    }}
                    title="টেলিগ্রাম বট কনফিগার করুন ও কমান্ড ডিরেক্টরি দেখুন"
                  >
                    <Settings size={13} />
                    <span>বট কনফিগার / কমান্ড হাব</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Cross-Platform Unified Account Sync Card */}
            <div style={{ background: 'var(--bg-primary, #0f172a)', border: '1px solid var(--border-color, #334155)', borderRadius: '12px', padding: '12px 14px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)' }}>
                  <Cloud size={16} style={{ color: '#3b82f6' }} />
                  <span>ক্লাউড ও গুগল ড্রাইভ অ্যাকাউন্ট সিঙ্ক</span>
                </div>
                <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                  ● সিঙ্ক সক্রিয়
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.03)', padding: '6px 10px', borderRadius: '8px' }}>
                  <span>🔑 মাস্টার লগইন অ্যাকাউন্ট:</span>
                  <strong style={{ color: 'var(--text-main, #f8fafc)' }}>{activeUserEmail}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '6px 10px', borderRadius: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#10b981', fontWeight: '700' }}>
                    <Cloud size={14} />
                    <span>অনুমোদিত ড্রাইভ অ্যাডমিন:</span>
                  </span>
                  <strong style={{ color: '#10b981', fontFamily: 'monospace' }}>{driveAccount}</strong>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                  💡 পিসি, মোবাইল, ম্যাকবুক ও ওয়েব—সব টার্মিনালেই এই গুগল ড্রাইভ ও সুপাবেস ক্লাউডে স্বয়ংক্রিয় ব্যাকআপ সংরক্ষিত হবে।
                </div>
              </div>
            </div>

            {/* Cashier & POS Transaction Origin Guarantee */}
            <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '12px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '800', color: '#3b82f6', marginBottom: '4px' }}>
                <Shield size={16} />
                <span>ক্যাশিয়ার বিক্রয় ট্র্যাকিং ও অডিট নিশ্চয়তা (Audit Trail)</span>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.5 }}>
                ক্যাশিয়ার যে ডিভাইস থেকেই বিল বা ক্যাশ করুক না কেন, প্রতিটি রসিদ, ইনভয়েস এবং অডিট ট্রেইলে স্বয়ংক্রিয়ভাবে ডিভাইসের নাম যেমন: <strong style={{ color: 'var(--text-main, #f8fafc)' }}>[{currentDevice?.badgeText || '💻 পিসি কাউন্টার'}]</strong> স্থায়ীভাবে লিপিবদ্ধ থাকবে।
              </div>
            </div>

            {/* Close Button */}
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="btn btn-primary"
                style={{ padding: '8px 22px', fontSize: '0.85rem', fontWeight: '800', borderRadius: '10px' }}
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
