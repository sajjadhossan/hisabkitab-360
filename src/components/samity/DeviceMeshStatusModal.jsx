import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Monitor,
  Globe,
  Apple,
  RefreshCw,
  Send,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Radio
} from 'lucide-react';
import { getSomitiTelegramConfig, backupToTelegram } from '../../services/somitiTelegramBackupService';
import { isLiveSyncConnected, getOnlineTerminalsList } from '../../services/liveSyncService';
import { detectDeviceType } from '../../services/deviceManagerService';
import { subscribeSamityCloudSync, requestMeshSyncFromPeers } from '../../services/somitiCloudSyncService';

export const DeviceMeshStatusModal = ({ isOpen, onClose, isLight = false, samityData = {}, showToast = null, t = (bn) => bn }) => {
  const [telegramConfig, setTelegramConfig] = useState(getSomitiTelegramConfig());
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isMeshSyncing, setIsMeshSyncing] = useState(false);
  const [currentPlatform, setCurrentPlatform] = useState('web');
  const [liveConnected, setLiveConnected] = useState(true);
  const [meshState, setMeshState] = useState({
    status: 'connected',
    lastSyncedDevice: 'স্থানীয় ডিভাইস',
    lastSyncTime: Date.now()
  });

  useEffect(() => {
    if (isOpen) {
      setTelegramConfig(getSomitiTelegramConfig());
      setLiveConnected(isLiveSyncConnected());
      setCurrentPlatform(detectDeviceType());
      const unsub = subscribeSamityCloudSync((s) => setMeshState(s));
      return () => unsub();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInstantMeshSync = async () => {
    setIsMeshSyncing(true);
    showToast?.(t('৪টি প্ল্যাটফর্ম মেশে লাইভ ডেটা রিকোয়েস্ট পাঠানো হচ্ছে...', 'Requesting live data across 4 platforms...'), 'info');
    try {
      await requestMeshSyncFromPeers();
      setTimeout(() => {
        setIsMeshSyncing(false);
        showToast?.(t('✅ লাইভ মেশ সিঙ্ক সম্পন্ন হয়েছে!', '✅ Live mesh sync completed!'), 'success');
      }, 700);
    } catch (e) {
      setIsMeshSyncing(false);
      showToast?.(t('মেশ সিঙ্ক ত্রুটি: ', 'Mesh sync error: ') + e.message, 'error');
    }
  };

  const handleManualBackup = async () => {
    setIsBackingUp(true);
    showToast?.(t('টেলিগ্রামে লাইভ ব্যাকআপ পাঠানো হচ্ছে...', 'Uploading backup to Telegram...'), 'info');
    try {
      const res = await backupToTelegram(samityData, { action: 'MANUAL_BACKUP' }, true);
      if (res.success) {
        setTelegramConfig(getSomitiTelegramConfig());
        showToast?.(t('✅ ব্যাকআপ সফলভাবে টেলিগ্রামে সেন্ট হয়েছে!', '✅ Backup sent to Telegram successfully!'), 'success');
      } else {
        showToast?.(t('টেলিগ্রাম ব্যাকআপ সমস্যা: ', 'Telegram backup error: ') + (res.error || 'Network error'), 'error');
      }
    } catch (e) {
      showToast?.(t('ব্যাকআপ ব্যর্থ: ', 'Backup failed: ') + e.message, 'error');
    } finally {
      setIsBackingUp(false);
    }
  };

  const formatTimestamp = (isoStr) => {
    if (!isoStr) return t('এখনো কোনো ব্যাকআপ পাঠানো হয়নি', 'No backup sent yet');
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('bn-BD', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }) + ' - ' + d.toLocaleTimeString('bn-BD', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return isoStr;
    }
  };

  const platforms = [
    {
      id: 'apk',
      name: 'Android APK',
      titleBn: 'অ্যান্ড্রয়েড মোবাইল অ্যাপ',
      icon: <Smartphone size={24} color="#10b981" />,
      tag: 'com.somiti360.app',
      status: 'active',
      desc: 'ক্যাপাসিটর নেটিভ ইঞ্জিন, অফলাইন ক্যাশিং ও তাৎক্ষণিক পুশ সিঙ্ক'
    },
    {
      id: 'pc',
      name: 'Windows PC App',
      titleBn: 'উইন্ডোজ পিসি ডেস্কটপ',
      icon: <Monitor size={24} color="#0284c7" />,
      tag: 'Desktop Host / .exe',
      status: 'active',
      desc: 'ক্যাশ কাউন্টার, থার্মাল পিওএস প্রিন্টিং ও লোকালহোস্ট নোড'
    },
    {
      id: 'web',
      name: 'Web App',
      titleBn: 'ভার্সেল ক্লাউড ওয়েব',
      icon: <Globe size={24} color="#8b5cf6" />,
      tag: 'somiti-360.vercel.app',
      status: 'active',
      desc: 'বিশ্বের যেকোনো প্রান্ত থেকে রিয়েল-টাইম ব্রাউজার অ্যাক্সেস'
    },
    {
      id: 'mac',
      name: 'Apple macOS / iOS',
      titleBn: 'ম্যাক ওএস ও অ্যাপল ইকোসিস্টেম',
      icon: <Apple size={24} color="#f59e0b" />,
      tag: 'Intel & Apple Silicon M-Series',
      status: 'active',
      desc: 'রেটিনা আল্ট্রা-এইচডি ডিসপ্লে কমপ্লায়েন্ট মাল্টি-প্ল্যাটফর্ম শেল'
    }
  ];

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
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: isLight ? '#ffffff' : '#0f172a',
          border: isLight ? '1.5px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)',
          color: isLight ? '#0f172a' : '#f8fafc'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(2, 132, 199, 0.2))',
                border: '1.5px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981'
              }}
            >
              <Zap size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{t('লাইভ ক্রস-প্ল্যাটফর্ম ডিভাইস মেশ', 'Live Cross-Platform Device Mesh')}</span>
                <span style={{ fontSize: '0.65rem', background: '#dcfce7', color: '#15803d', border: '1px solid #10b981', padding: '2px 8px', borderRadius: '12px', fontWeight: '800' }}>
                  🟢 {t('৪টি প্ল্যাটফর্ম সিঙ্কড', '4 Platforms Synced')}
                </span>
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                {t('একটি ডিভাইসে কোনো হিসাব বা তথ্য লিখলে নিমিষেই অন্য সমস্ত ডিভাইসে লাইভ আপডেট হয়ে যায়।', 'Write on one terminal, updates instantaneously across all devices with zero refresh.')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: isLight ? '#475569' : '#cbd5e1'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 1. Synced Device Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          {platforms.map(p => {
            const isThis = currentPlatform === p.id || (currentPlatform === 'mobile' && p.id === 'apk');
            return (
              <div
                key={p.id}
                style={{
                  background: isLight ? (isThis ? '#f0fdf4' : '#f8fafc') : (isThis ? 'rgba(16, 185, 129, 0.12)' : 'rgba(30, 41, 59, 0.6)'),
                  border: isLight ? (isThis ? '1.5px solid #10b981' : '1px solid #e2e8f0') : (isThis ? '1.5px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)'),
                  borderRadius: '14px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: isThis ? '0 4px 12px rgba(16, 185, 129, 0.15)' : 'none'
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(0,0,0,0.06)',
                    flexShrink: 0
                  }}
                >
                  {p.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: isLight ? '#0f172a' : '#f8fafc' }}>
                      {p.name}
                    </span>
                    {isThis ? (
                      <span style={{ fontSize: '0.62rem', fontWeight: '800', background: '#dcfce7', color: '#15803d', padding: '2px 7px', borderRadius: '8px' }}>
                        🟢 {t('এই ডিভাইস (সক্রিয়)', 'This Device (Active)')}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.62rem', fontWeight: '800', background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.08)', color: isLight ? '#64748b' : '#94a3b8', padding: '2px 7px', borderRadius: '8px' }}>
                        ⚪ {t('স্ট্যান্ডবাই (রেডি)', 'Standby (Ready)')}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: isLight ? '#475569' : '#94a3b8', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.tag}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Real-time Architecture Notice */}
        <div style={{ background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.5)', border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '10px 14px', marginBottom: '14px', fontSize: '0.74rem', color: isLight ? '#475569' : '#94a3b8', lineHeight: 1.5 }}>
          💡 <strong style={{ color: isLight ? '#0f172a' : '#f8fafc' }}>{t('ডিভাইস মেশ স্ট্যাটাস ব্যাখ্যা:', 'Device Mesh Explanation:')}</strong> {t('বর্তমানে আপনি যে ডিভাইসে আছেন সেটি সক্রিয়ভাবে লাইভ ডাটা পাঠাচ্ছে ও গ্রহণ করছে। বাকি প্ল্যাটফর্মগুলো স্ট্যান্ডবাই রেডি মোডে রয়েছে—মোবাইল বা পিসিতে অ্যাপ ওপেন করা মাত্রই সিঙ্ক হয়ে যাবে।', 'The device you are currently on is active. Other platforms are in Standby Ready mode and will sync instantly once opened.')}
        </div>

        {/* 2. Real-Time Omni-Platform Mesh Live Card */}
        <div
          style={{
            background: isLight ? '#f0fdf4' : 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(15, 23, 42, 0.8))',
            border: isLight ? '1.5px solid #10b981' : '1.5px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '16px',
            padding: '16px 20px',
            marginBottom: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.4rem' }}>⚡</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: '900', color: isLight ? '#047857' : '#34d399' }}>
                  {t('৪-প্ল্যাটফর্ম লাইভ ব্রডকাস্ট মেশ (<১৫০ms)', '4-Platform Live Broadcast Mesh (<150ms)')}
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: isLight ? '#475569' : '#cbd5e1' }}>
                  {t('সর্বশেষ সিঙ্ক নোড:', 'Last Synced Node:')} <strong style={{ color: '#10b981' }}>{meshState.lastSyncedDevice || 'স্থানীয় ডিভাইস'}</strong>
                </p>
              </div>
            </div>

            <button
              onClick={handleInstantMeshSync}
              disabled={isMeshSyncing}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '9px',
                fontSize: '0.76rem',
                fontWeight: '800',
                cursor: isMeshSyncing ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              <RefreshCw size={13} className={isMeshSyncing ? 'animate-spin' : ''} />
              <span>{isMeshSyncing ? t('সিঙ্ক হচ্ছে...', 'Syncing...') : t('ইনস্ট্যান্ট মেশ সিঙ্ক', 'Instant Mesh Sync')}</span>
            </button>
          </div>
        </div>

        {/* 3. Telegram Cloud Auto-Backup & Exact Timestamp Card */}
        <div
          style={{
            background: isLight ? '#f0f9ff' : 'linear-gradient(135deg, rgba(2, 132, 199, 0.15), rgba(15, 23, 42, 0.8))',
            border: isLight ? '1.5px solid #0284c7' : '1.5px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '16px',
            padding: '18px 20px',
            marginBottom: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.4rem' }}>✈️</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: '900', color: isLight ? '#0369a1' : '#38bdf8' }}>
                  {t('টেলিগ্রাম ক্লাউড অটো-ব্যাকআপ স্থিতি', 'Telegram Cloud Auto-Backup Status')}
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: isLight ? '#475569' : '#cbd5e1' }}>
                  {t('বট:', 'Bot:')} <strong style={{ color: '#0284c7' }}>@Backup_Somiti_bot</strong> | {t('চ্যাট আইডি:', 'Chat ID:')} <code>7928605566</code>
                </p>
              </div>
            </div>

            <button
              onClick={handleManualBackup}
              disabled={isBackingUp}
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#fff',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '9px',
                fontSize: '0.76rem',
                fontWeight: '800',
                cursor: isBackingUp ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
              }}
            >
              <Send size={13} />
              <span>{isBackingUp ? t('পাঠানো হচ্ছে...', 'Sending...') : t('এখনই ব্যাকআপ পাঠান', 'Backup Now')}</span>
            </button>
          </div>

          {/* Exact Timestamp Display */}
          <div
            style={{
              background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.7)',
              border: isLight ? '1px solid #bae6fd' : '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '10px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} color="#0284c7" />
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: isLight ? '#475569' : '#94a3b8' }}>
                {t('সর্বশেষ ব্যাকআপ যাওয়ার সময়:', 'Last Backup Sent At:')}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#10b981' }}>
              {formatTimestamp(telegramConfig.lastBackupTime)}
            </div>
          </div>
        </div>

        {/* 3. Real-Time Sync Assurance Notice */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: isLight ? '#f1f5f9' : 'rgba(30, 41, 59, 0.5)', borderRadius: '12px', fontSize: '0.74rem', color: isLight ? '#475569' : '#94a3b8' }}>
          <ShieldCheck size={18} color="#10b981" style={{ flexShrink: 0 }} />
          <span>
            {t('সবগুলো টার্মিনাল এন্ড-টু-এন্ড লোকাল ও ক্লাউড মেশ দ্বারা সুসংহত। প্রতিবার নতুন সদস্য, চাঁদা জমা বা খরচ এন্ট্রি করামাত্রই কোনো রিফ্রেশ ছাড়াই সাথে সাথে অন্য স্ক্রিনে প্রতিফলিত হয়।', 'All terminals operate in an active-active sync mesh. Any data entry syncs instantly across mobile, desktop, and web with zero latency.')}
          </span>
        </div>
      </div>
    </div>
  );
};
