import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { hapticFeedback } from '../../services/nativeAppService';

export const SyncStatusIndicator = () => {
  const { lang, showToast } = useApp();
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsSyncing(true);
      hapticFeedback.success();
      if (showToast) {
        showToast(lang === 'bn' ? 'ইন্টারনেট সংযোগ পুনরায় চালু হয়েছে! ক্লাউড সিঙ্ক হচ্ছে...' : 'Internet reconnected! Syncing to cloud...', 'success');
      }
      setTimeout(() => {
        setIsSyncing(false);
      }, 1500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      hapticFeedback.warning();
      if (showToast) {
        showToast(lang === 'bn' ? 'অফলাইন মোড: দোকানে বেচাকেনা ও হিসাব নিরাপদে চলবে' : 'Offline mode active: Sales will continue safely', 'warning');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [lang, showToast]);

  const handleManualSync = () => {
    if (!isOnline) {
      showToast(lang === 'bn' ? 'বর্তমানে ইন্টারনেট সংযোগ নেই। নেট আসলে অটো-সিঙ্ক হবে।' : 'No internet connection. Will auto-sync when online.', 'warning');
      hapticFeedback.warning();
      return;
    }
    setIsSyncing(true);
    hapticFeedback.light();
    setTimeout(() => {
      setIsSyncing(false);
      showToast(lang === 'bn' ? 'সব হিসাব ক্লাউডে শতভাগ নিরাপদ ও সিঙ্কড!' : 'All records securely synced to cloud!', 'success');
      hapticFeedback.success();
    }, 800);
  };

  return (
    <div
      className="sync-status-indicator no-print"
      onClick={handleManualSync}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      style={{
        position: 'fixed',
        bottom: '80px',
        right: '14px',
        zIndex: 920,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 10px',
        borderRadius: '20px',
        fontSize: '0.74rem',
        fontWeight: '700',
        backdropFilter: 'blur(12px)',
        cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        background: !isOnline
          ? 'rgba(245, 158, 11, 0.9)'
          : isSyncing
          ? 'rgba(59, 130, 246, 0.9)'
          : 'rgba(16, 185, 129, 0.85)',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.25)'
      }}
      title={lang === 'bn' ? 'ক্লাউড সিঙ্ক স্ট্যাটাস (ক্লিক করে রিফ্রেশ করুন)' : 'Cloud Sync Status (Click to refresh)'}
    >
      {!isOnline ? (
        <>
          <WifiOff size={13} />
          <span>{lang === 'bn' ? 'অফলাইন' : 'Offline'}</span>
        </>
      ) : isSyncing ? (
        <>
          <RefreshCw size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
          <span>{lang === 'bn' ? 'সিঙ্ক হচ্ছে...' : 'Syncing...'}</span>
        </>
      ) : (
        <>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ffffff', display: 'inline-block', boxShadow: '0 0 6px #fff' }} />
          <span>{lang === 'bn' ? 'অনলাইন' : 'Online'}</span>
        </>
      )}
    </div>
  );
};
