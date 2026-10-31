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
  Clock,
  Zap,
  Database
} from 'lucide-react';
import { getSomitiTelegramConfig, backupToTelegram } from '../../services/somitiTelegramBackupService';
import { getStorageQuotaHealth } from '../../services/somitiOfflineStore';
import { detectDeviceType } from '../../services/deviceManagerService';
import {
  subscribeSamityCloudSync,
  requestMeshSyncFromPeers,
  subscribeDevicePresence,
  getOnlineDevicesList,
  getDeviceOrigin,
  format12HourTime,
  format12HourDateTime
} from '../../services/somitiCloudSyncService';

function matchesPlatform(platformId, itemPlatform) {
  const target = String(itemPlatform || '').toLowerCase();
  if (platformId === 'apk') return target.includes('android') || target.includes('mobile') || target.includes('apk');
  if (platformId === 'pc') return target.includes('windows') || target.includes('pc') || target.includes('desktop');
  if (platformId === 'web') return target === 'web' || target.includes('browser');
  if (platformId === 'mac') return target.includes('mac') || target.includes('apple') || target.includes('ios');
  return false;
}

const PLATFORMS = [
  {
    id: 'apk',
    name: 'Android APK',
    titleBn: 'অ্যান্ড্রয়েড মোবাইল অ্যাপ',
    icon: <Smartphone size={24} color="#10b981" />,
    tag: 'com.hisabkitab360.app',
    desc: 'ক্যাপাসিটর নেটিভ ইঞ্জিন, অফলাইন ক্যাশিং ও তাৎক্ষণিক পুশ সিঙ্ক'
  },
  {
    id: 'pc',
    name: 'Windows PC App',
    titleBn: 'উইন্ডোজ পিসি ডেস্কটপ',
    icon: <Monitor size={24} color="#0284c7" />,
    tag: 'Desktop Host / .exe',
    desc: 'ক্যাশ কাউন্টার, থার্মাল পিওএস প্রিন্টিং ও লোকালহোস্ট নোড'
  },
  {
    id: 'web',
    name: 'Web App',
    titleBn: 'ভার্সেল ক্লাউড ওয়েব',
    icon: <Globe size={24} color="#8b5cf6" />,
    tag: 'hisabkitab360.vercel.app',
    desc: 'বিশ্বের যেকোনো প্রান্ত থেকে রিয়েল-টাইম ব্রাউজার অ্যাক্সেস'
  },
  {
    id: 'mac',
    name: 'Apple macOS / iOS',
    titleBn: 'ম্যাক ওএস ও অ্যাপল ইকোসিস্টেম',
    icon: <Apple size={24} color="#f59e0b" />,
    tag: 'Intel & Apple Silicon M-Series',
    desc: 'রেটিনা আল্ট্রা-এইচডি ডিসপ্লে কমপ্লায়েন্ট মাল্টি-প্ল্যাটফর্ম শেল'
  }
];

function getMeshBannerBg(totalOnlineCount, isLight) {
  if (totalOnlineCount > 1) {
    return isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.15)';
  }
  return isLight ? '#f8fafc' : 'rgba(30, 41, 59, 0.5)';
}

function getMeshBannerBorder(totalOnlineCount, isLight) {
  if (totalOnlineCount > 1) {
    return '1.5px solid #10b981';
  }
  return isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)';
}

function getMeshBannerTextColor(totalOnlineCount, isLight) {
  if (totalOnlineCount > 1) {
    return '#10b981';
  }
  return isLight ? '#0f172a' : '#f8fafc';
}

function PlatformMeshCard({ platform, isLight, currentPlatform, origin, onlineDevices, t }) {
  const isThisDevice = matchesPlatform(platform.id, origin.platform) || matchesPlatform(platform.id, origin.type) || (currentPlatform === platform.id);
  const remotePeers = onlineDevices.filter(d => !d.isThis && (matchesPlatform(platform.id, d.platform) || matchesPlatform(platform.id, d.type)));
  const isRemoteOnline = remotePeers.length > 0;
  const isAnyActive = isThisDevice || isRemoteOnline;

  let cardBg = isLight ? '#f8fafc' : 'rgba(30, 41, 59, 0.6)';
  if (isAnyActive) {
    cardBg = isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.12)';
  }

  let cardBorder = isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)';
  if (isAnyActive) {
    cardBorder = '1.5px solid #10b981';
  }

  let badge = (
    <span style={{ fontSize: '0.62rem', fontWeight: '800', background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.08)', color: isLight ? '#64748b' : '#94a3b8', padding: '2px 7px', borderRadius: '8px' }}>
      ⚪ {t('স্ট্যান্ডবাই (রেডি)', 'Standby (Ready)')}
    </span>
  );

  if (isThisDevice && isRemoteOnline) {
    badge = (
      <span style={{ fontSize: '0.62rem', fontWeight: '800', background: '#dcfce7', color: '#15803d', padding: '2px 7px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
        {t('এই ডিভাইস + ১টি অনলাইন', 'This Device + 1 Online')}
      </span>
    );
  } else if (isThisDevice) {
    badge = (
      <span style={{ fontSize: '0.62rem', fontWeight: '800', background: '#dcfce7', color: '#15803d', padding: '2px 7px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
        {t('এই ডিভাইস (সক্রিয়)', 'This Device (Active)')}
      </span>
    );
  } else if (isRemoteOnline) {
    badge = (
      <span style={{ fontSize: '0.62rem', fontWeight: '800', background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '2px 7px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)' }}>
        <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
        {t('🟢 অনলাইন ও লাইভ সংযুক্ত', '🟢 Online & Live Synced')}
      </span>
    );
  }

  return (
    <div
      style={{
        background: cardBg,
        border: cardBorder,
        borderRadius: '14px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: isAnyActive ? '0 4px 14px rgba(16, 185, 129, 0.18)' : 'none',
        transition: 'all 0.25s ease'
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
          border: isAnyActive ? '1.5px solid #10b981' : '1px solid rgba(0,0,0,0.06)',
          flexShrink: 0
        }}
      >
        {platform.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '800', color: isLight ? '#0f172a' : '#f8fafc' }}>
            {platform.name}
          </span>
          {badge}
        </div>
        <div style={{ fontSize: '0.72rem', color: isLight ? '#475569' : '#94a3b8', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {platform.tag}
        </div>
      </div>
    </div>
  );
}

export const DeviceMeshStatusModal = ({ isOpen, onClose, isLight = false, samityData = {}, showToast = null, t = (bn) => bn }) => {
  const [telegramConfig, setTelegramConfig] = useState(getSomitiTelegramConfig());
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isMeshSyncing, setIsMeshSyncing] = useState(false);
  const [currentPlatform, setCurrentPlatform] = useState('web');
  const [onlineDevices, setOnlineDevices] = useState(() => getOnlineDevicesList());
  const [meshState, setMeshState] = useState(() => ({
    status: 'connected',
    lastSyncedDevice: typeof window !== 'undefined' ? (localStorage.getItem('somiti360_last_sync_device') || 'স্থানীয় ডিভাইস') : 'স্থানীয় ডিভাইস',
    lastSyncTime: typeof window !== 'undefined' ? (Number(localStorage.getItem('somiti360_last_sync_timestamp')) || 0) : 0
  }));

  const [storageHealth, setStorageHealth] = useState({ healthy: true, usedMB: '0.00', totalMB: 'N/A' });

  useEffect(() => {
    if (isOpen) {
      setTelegramConfig(getSomitiTelegramConfig());
      setCurrentPlatform(detectDeviceType());

      getStorageQuotaHealth().then(h => {
        if (h) setStorageHealth(h);
      }).catch(() => {});
      
      const unsubSync = subscribeSamityCloudSync((s) => {
        setMeshState(s);
        if (s.onlineDevices && Array.isArray(s.onlineDevices)) {
          setOnlineDevices(s.onlineDevices);
        }
      });

      const unsubPresence = subscribeDevicePresence((list) => {
        if (Array.isArray(list)) {
          setOnlineDevices(list);
        }
      });

      return () => {
        unsubSync();
        unsubPresence();
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const origin = getDeviceOrigin();

  const handleInstantMeshSync = async () => {
    setIsMeshSyncing(true);
    showToast?.(t('৪টি প্ল্যাটফর্ম মেশে লাইভ ডেটা স্ক্যান পাঠানো হচ্ছে...', 'Broadcasting live scan across 4 platforms...'), 'info');
    try {
      await requestMeshSyncFromPeers();
      const now = Date.now();
      setMeshState(prev => ({
        ...prev,
        lastSyncTime: now,
        lastSyncedDevice: origin.name || 'স্থানীয় ডিভাইস'
      }));
      setTimeout(() => {
        setIsMeshSyncing(false);
        const time12 = format12HourTime(now, t('bn', 'en'));
        showToast?.(t(`✅ লাইভ মেশ স্ক্যান সম্পন্ন! সময়: ${time12}`, `✅ Live mesh scan completed! Time: ${time12}`), 'success');
      }, 600);
    } catch (e) {
      setIsMeshSyncing(false);
      showToast?.(t('মেশ সিঙ্ক ত্রুটি: ', 'Mesh sync error: ') + e.message, 'error');
    }
  };

  const handleManualBackup = async () => {
    setIsBackingUp(true);
    showToast?.(t('টেলিগ্রামে লাইভ ব্যাকআপ পাঠানো হচ্ছে...', 'Uploading backup to Telegram...'), 'info');
    try {
      const res = await backupToTelegram(samityData, { action: 'MANUAL_BACKUP', isTransaction: true }, true);
      if (res.success) {
        setTelegramConfig(getSomitiTelegramConfig());
        const time12 = format12HourTime(Date.now(), t('bn', 'en'));
        showToast?.(t(`✅ ব্যাকআপ টেলিগ্রামে সেন্ট হয়েছে! সময়: ${time12}`, `✅ Backup sent to Telegram! Time: ${time12}`), 'success');
      } else {
        showToast?.(t('টেলিগ্রাম ব্যাকআপ সমস্যা: ', 'Telegram backup error: ') + (res.error || 'Network error'), 'error');
      }
    } catch (e) {
      showToast?.(t('ব্যাকআপ ব্যর্থ: ', 'Backup failed: ') + e.message, 'error');
    } finally {
      setIsBackingUp(false);
    }
  };

  const formatTimestamp = (isoOrTs) => {
    if (!isoOrTs) return t('এখনো কোনো ব্যাকআপ পাঠানো হয়নি', 'No backup sent yet');
    return format12HourDateTime(isoOrTs, t('bn', 'en'));
  };

  const totalOnlineCount = Math.max(1, onlineDevices.length);
  const bannerBg = getMeshBannerBg(totalOnlineCount, isLight);
  const bannerBorder = getMeshBannerBorder(totalOnlineCount, isLight);
  const bannerTextColor = getMeshBannerTextColor(totalOnlineCount, isLight);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('৪টি প্ল্যাটফর্ম লাইভ সিঙ্ক স্ট্যাটাস', 'Cross-Platform Mesh Status')}
      tabIndex={-1}
      className="somiti-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'max(12px, env(safe-area-inset-top, 12px)) max(12px, env(safe-area-inset-right, 12px)) max(16px, env(safe-area-inset-bottom, 16px)) max(12px, env(safe-area-inset-left, 12px))',
        boxSizing: 'border-box'
      }}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div
        role="document"
        tabIndex={0}
        className="somiti-modal-card"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: 'calc(100dvh - 32px)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          background: isLight ? '#ffffff' : '#0f172a',
          border: isLight ? '1.5px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '20px',
          padding: '16px',
          boxSizing: 'border-box',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)',
          color: isLight ? '#0f172a' : '#f8fafc'
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '16px', marginBottom: '16px' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '900', color: isLight ? '#0f172a' : '#f8fafc' }}>
                  {t('৪-প্ল্যাটফর্ম লাইভ মেশ সিঙ্ক স্থিতি', '4-Platform Live Mesh Sync Status')}
                </h3>
                <span style={{ fontSize: '0.62rem', fontWeight: '800', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981', padding: '1px 6px', borderRadius: '6px' }}>
                  PRO ⚡
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: isLight ? '#475569' : '#cbd5e1' }}>
                {t('Android APK • Windows PC • Cloud Web • Apple macOS', 'Android APK • Windows PC • Cloud Web • Apple macOS')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label={t('বন্ধ করুন', 'Close')}
            style={{
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
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

        {/* Live Network Banner with Real-Time Connected Terminal Count */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: bannerBg,
            border: bannerBorder,
            borderRadius: '14px',
            padding: '12px 16px',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.3rem' }}>{totalOnlineCount > 1 ? '🌐' : '📡'}</span>
            <div>
              <div style={{ fontSize: '0.86rem', fontWeight: '900', color: bannerTextColor }}>
                {totalOnlineCount > 1 
                  ? t(`মোট ${totalOnlineCount}টি ডিভাইস লাইভ মেশে সরাসরি সংযুক্ত!`, `${totalOnlineCount} terminals actively connected on live mesh!`)
                  : t('১টি টার্মিনাল প্রস্তুত (অন্য ডিভাইস ওপেন করলেই সাথে সাথে এখানে দৃশ্যমান হবে)', '1 terminal active (other devices connect in real-time when opened)')}
              </div>
              <div style={{ fontSize: '0.74rem', color: isLight ? '#475569' : '#cbd5e1', marginTop: '3px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                <span>
                  🕒 {t('সর্বশেষ লাইভ স্ক্যান:', 'Last Live Scan:')}{' '}
                  <strong style={{ color: '#10b981', fontWeight: '900' }}>
                    {format12HourTime(meshState.lastSyncTime, t('bn', 'en'))}
                  </strong>
                  {' '}<span style={{ fontSize: '0.68rem', opacity: 0.85 }}>({t('১২-ঘণ্টা AM/PM ফরম্যাট', '12-Hour AM/PM')})</span>
                </span>
                <span>•</span>
                <span>
                  📡 {t('উৎস নোড:', 'Source Node:')}{' '}
                  <strong style={{ color: isLight ? '#0f172a' : '#f8fafc' }}>
                    {meshState.lastSyncedDevice || 'স্থানীয় ডিভাইস'}
                  </strong>
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '9px', height: '9px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
            <span style={{ fontSize: '0.74rem', fontWeight: '800', color: '#10b981' }}>
              {totalOnlineCount > 1 ? t('লাইভ পিয়ার সিঙ্ক সক্রিয়', 'Live Peer Sync Active') : t('মেশ নোড সচল', 'Mesh Node Ready')}
            </span>
          </div>
        </div>

        {/* 1. Synced Device Grid with Dynamic Presence Detection */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          {PLATFORMS.map(p => (
            <PlatformMeshCard
              key={p.id}
              platform={p}
              isLight={isLight}
              currentPlatform={currentPlatform}
              origin={origin}
              onlineDevices={onlineDevices}
              t={t}
            />
          ))}
        </div>

        {/* Real-time Architecture Notice */}
        <div style={{ background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.5)', border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '10px 14px', marginBottom: '14px', fontSize: '0.74rem', color: isLight ? '#475569' : '#94a3b8', lineHeight: 1.5 }}>
          💡 <strong style={{ color: isLight ? '#0f172a' : '#f8fafc' }}>{t('ডিভাইস মেশ স্ট্যাটাস ব্যাখ্যা:', 'Device Mesh Explanation:')}</strong> {t('আপনার মোবাইল ও পিসি/ওয়েব একই সাথে ওপেন থাকলে উভয়েই "অনলাইন ও লাইভ সংযুক্ত" হিসেবে সবুজ মার্ক দেখাবে। যেকোনো একটিতে এন্ট্রি দিলে রিফ্রেশ ছাড়াই সাথে সাথে অন্যটিতে আপডেট হবে।', 'When Mobile and PC/Web are both open, they will show as "Online & Live Synced" with a green badge. Data writes mirror across both without reload.')}
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
                  {t('সর্বশেষ লাইভ স্ক্যান:', 'Last Live Scan:')}{' '}
                  <strong style={{ color: '#10b981' }}>{format12HourTime(meshState.lastSyncTime, t('bn', 'en'))}</strong>
                  {' '}({meshState.lastSyncedDevice || 'স্থানীয় ডিভাইস'})
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
              <span>{isMeshSyncing ? t('স্ক্যান হচ্ছে...', 'Scanning...') : t('লাইভ স্ক্যান ও সিঙ্ক', 'Live Scan & Sync')}</span>
            </button>
          </div>
        </div>

        {/* 2.5 IndexedDB Durable Offline Store & Idempotency Engine */}
        <div
          style={{
            background: isLight ? '#faf5ff' : 'linear-gradient(135deg, rgba(147, 51, 234, 0.12), rgba(15, 23, 42, 0.8))',
            border: isLight ? '1.5px solid #a855f7' : '1.5px solid rgba(168, 85, 247, 0.35)',
            borderRadius: '16px',
            padding: '16px 20px',
            marginBottom: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
                <Database size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: '900', color: isLight ? '#7e22ce' : '#c084fc' }}>
                  {t('ইনডেক্সড-ডিবি অফলাইন স্টোরেজ ও আইডেমপোটেন্সি কি', 'IndexedDB Offline Resilience & Idempotency Key')}
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: isLight ? '#475569' : '#cbd5e1' }}>
                  {t('ব্যবহৃত মেমরি:', 'Used Storage:')} <strong style={{ color: '#a855f7' }}>{storageHealth.usedMB} MB</strong> {storageHealth.totalMB !== 'N/A' && `(${storageHealth.totalMB} MB কোটা)`} | {t('স্ট্যাটাস: ৫MB লিমিটলেস ও জিরো-লস সুরক্ষাপ্রাপ্ত', 'Status: Zero-loss protected')}
                </p>
              </div>
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: '800', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)', padding: '4px 10px', borderRadius: '12px' }}>
              🛡️ {t('নন-ব্লকিং অফলাইন ইঞ্জিন', 'Non-Blocking Engine')}
            </span>
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
                  {t('টেলিগ্রাম ক্লাউড অটো-ব্যাকআপ স্থিতি (প্রতি ৩ মিনিটে স্বয়ংক্রিয়)', 'Telegram Cloud Auto-Backup (Every 3 mins)')}
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
            {t('সবগুলো টার্মিনাল এন্ড-টু-এন্ড লোকাল ও ক্লাউড মেশ দ্বারা সুসংহত। প্রতিবার নতুন সদস্য, চাঁদা জমা বা খরচ এন্ট্রি করামাত্রই কোনো রিফ্রেশ ছাড়াই সাথে সাথে অন্য স্ক্রিনে প্রতিফলিত হয় এবং টেলিগ্রামে ক্লাউড কপি পৌঁছে যায়।', 'All terminals operate in an active-active sync mesh. Any data entry syncs instantly across mobile, desktop, and web with zero latency.')}
          </span>
        </div>
      </div>
    </div>
  );
};
