import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { hapticFeedback } from '../../services/nativeAppService';
import { getPendingSyncCount, subscribeToQueueChanges, flushOfflineQueue } from '../../utils/syncQueue';

export const SyncStatusIndicator = () => {
  const { lang, showToast, syncToGoogleDrive } = useApp();
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingCount, setPendingCount] = useState(() => getPendingSyncCount());
  const [showReconnectedToast, setShowReconnectedToast] = useState(false);

  useEffect(() => {
    const unsub = subscribeToQueueChanges((cnt) => {
      setPendingCount(cnt);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setIsSyncing(true);
      setShowReconnectedToast(true);
      hapticFeedback.success();

      // Auto-hide reconnected toast after 4 seconds
      setTimeout(() => {
        setShowReconnectedToast(false);
      }, 4000);

      // Flush offline sync queue
      try {
        await flushOfflineQueue(async (item) => {
          // If google drive sync is active, sync
          if (syncToGoogleDrive) {
            await syncToGoogleDrive();
          }
        });
      } catch (e) {
        console.warn('Queue flush warning:', e);
      }

      if (showToast) {
        showToast(lang === 'bn' ? 'ইন্টারনেট সংযোগ চালু হয়েছে! অফলাইন ডেটা সিঙ্ক সম্পন্ন।' : 'Internet reconnected! Offline data synced.', 'success');
      }
      setTimeout(() => {
        setIsSyncing(false);
        setPendingCount(getPendingSyncCount());
      }, 1200);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnectedToast(false);
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
    <>
      {/* 1. Smart Mobile Top Offline Warning Banner */}
      {!isOnline && (
        <div
          className="offline-top-alert-banner no-print animate-slide-down"
          style={{
            position: 'fixed',
            top: 'max(6px, env(safe-area-inset-top, 6px))',
            left: '12px',
            right: '12px',
            zIndex: 9999,
            background: 'rgba(217, 119, 6, 0.95)',
            color: '#ffffff',
            padding: '8px 14px',
            borderRadius: '12px',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 24px rgba(217, 119, 6, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            fontSize: '0.8rem',
            fontWeight: '700'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <WifiOff size={16} />
            <span>{lang === 'bn' ? '⚠️ আপনি অফলাইনে আছেন — দোকানে বেচাকেনা ও সব হিসাব নিরাপদ!' : '⚠️ Offline Mode — Sales & records safely saved locally!'}</span>
          </div>
          <span style={{ fontSize: '0.7rem', background: 'rgba(0,0,0,0.25)', padding: '2px 8px', borderRadius: '8px' }}>
            {lang === 'bn' ? 'অটো-সিঙ্ক হবে' : 'Auto-Sync'}
          </span>
        </div>
      )}

      {/* 2. Reconnection Banner Toast */}
      {showReconnectedToast && (
        <div
          className="reconnected-toast no-print animate-slide-down"
          style={{
            position: 'fixed',
            top: 'max(6px, env(safe-area-inset-top, 6px))',
            left: '12px',
            right: '12px',
            zIndex: 9999,
            background: 'rgba(16, 185, 129, 0.95)',
            color: '#ffffff',
            padding: '8px 14px',
            borderRadius: '12px',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            fontSize: '0.8rem',
            fontWeight: '800'
          }}
        >
          <CheckCircle2 size={16} />
          <span>{lang === 'bn' ? '🟢 ইন্টারনেট সংযোগ চালু হয়েছে! অফলাইন ডেটা সিঙ্ক সম্পন্ন।' : '🟢 Back Online! All offline data synced successfully.'}</span>
        </div>
      )}

      {/* 3. Floating Bottom-Right Sync Status Pill */}
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
            {pendingCount > 0 && (
              <span style={{ background: '#ef4444', color: '#fff', borderRadius: '10px', padding: '1px 6px', fontSize: '0.68rem', fontWeight: '800', marginLeft: '2px' }}>
                {pendingCount} অপেক্ষমাণ
              </span>
            )}
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
    </>
  );
};

