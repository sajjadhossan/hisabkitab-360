import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, Database, AlertCircle, ShieldAlert, Check } from 'lucide-react';
import { triggerFullSyncEngine } from '../../services/somitiCloudSyncService';
import { getUnresolvedConflicts } from '../../services/somitiOfflineStore';

export const EnterpriseOfflineBanner = ({ isOnline, pendingCount, isLight, lang, onOpenConflictModal }) => {
  const isEn = lang === 'en';
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessToast, setSyncSuccessToast] = useState(false);
  const [conflictCount, setConflictCount] = useState(0);

  useEffect(() => {
    const checkConflicts = async () => {
      try {
        const list = await getUnresolvedConflicts();
        setConflictCount(list?.length || 0);
      } catch {}
    };
    checkConflicts();

    const handleConflict = () => checkConflicts();
    window.addEventListener('somiti_sync_conflict_detected', handleConflict);
    window.addEventListener('somiti_sync_conflict_resolved', handleConflict);

    return () => {
      window.removeEventListener('somiti_sync_conflict_detected', handleConflict);
      window.removeEventListener('somiti_sync_conflict_resolved', handleConflict);
    };
  }, []);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await triggerFullSyncEngine();
      setSyncSuccessToast(true);
      setTimeout(() => setSyncSuccessToast(false), 3000);
    } catch (e) {
      console.warn('Manual sync trigger error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // If online, 0 pending, and 0 conflicts, no banner needed
  if (isOnline && pendingCount === 0 && conflictCount === 0 && !syncSuccessToast) {
    return null;
  }

  // Conflict state banner has highest priority
  if (conflictCount > 0) {
    return (
      <div style={{
        background: 'linear-gradient(90deg, #dc2626, #b91c1c)',
        color: '#ffffff',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        fontSize: '0.82rem',
        fontWeight: '700',
        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
        zIndex: 40
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={18} color="#fef08a" />
          <span>
            {isEn
              ? `Safety Alert: ${conflictCount} sync conflict(s) require review. Financial records are held safe.`
              : `নিরাপত্তা সতর্কতা: ${conflictCount}টি আর্থিক তথ্যে বিরোধ দেখা দিয়েছে। ম্যানুয়াল রিভিউ প্রয়োজন।`}
          </span>
        </div>
        <button
          onClick={onOpenConflictModal}
          style={{
            background: '#ffffff',
            color: '#b91c1c',
            border: 'none',
            borderRadius: '8px',
            padding: '5px 12px',
            fontWeight: '800',
            fontSize: '0.75rem',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
          }}
        >
          {isEn ? 'Review Conflicts' : 'বিরোধ নিষ্পত্তি করুন'}
        </button>
      </div>
    );
  }

  // Offline or Pending sync state banner
  return (
    <div style={{
      background: !isOnline
        ? (isLight ? '#fffbeb' : 'linear-gradient(90deg, rgba(217, 119, 6, 0.95), rgba(180, 83, 9, 0.95))')
        : (isLight ? '#f0fdf4' : 'linear-gradient(90deg, rgba(5, 150, 105, 0.95), rgba(4, 120, 87, 0.95))'),
      color: !isOnline ? (isLight ? '#92400e' : '#fef3c7') : (isLight ? '#166534' : '#ecfdf5'),
      borderBottom: !isOnline ? '1.5px solid #f59e0b' : '1px solid #10b981',
      padding: '7px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '8px',
      fontSize: '0.8rem',
      fontWeight: '700',
      zIndex: 40,
      transition: 'all 0.3s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {!isOnline ? (
          <WifiOff size={16} color={isLight ? '#d97706' : '#fef08a'} />
        ) : (
          <Database size={16} color={isLight ? '#15803d' : '#a7f3d0'} />
        )}
        <span>
          {!isOnline
            ? (isEn
                ? 'Offline Mode Active — You can freely create deposits, members & expenses. Changes queue in IndexedDB.'
                : 'অফলাইন মোড সক্রিয় — আপনি নির্বিঘ্নে সদস্য, জমা ও খরচ এন্ট্রি করতে পারবেন। ডেটা লোকাল IndexedDB-তে সুরক্ষিত আছে।')
            : (isEn
                ? `${pendingCount} offline update(s) ready in queue to sync with cloud database.`
                : `${pendingCount}টি অফলাইন তথ্য ক্লাউড ডাটাবেজে সিঙ্ক করার জন্য অপেক্ষমান রয়েছে।`)}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {pendingCount > 0 && (
          <span style={{
            background: isLight ? '#fef3c7' : 'rgba(0,0,0,0.25)',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '0.72rem',
            border: '1px solid rgba(0,0,0,0.1)'
          }}>
            {isEn ? `${pendingCount} Pending` : `${pendingCount}টি পেন্ডিং`}
          </span>
        )}

        {isOnline && (
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            style={{
              background: isLight ? '#15803d' : '#ffffff',
              color: isLight ? '#ffffff' : '#065f46',
              border: 'none',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '0.74rem',
              fontWeight: '800',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
            }}
          >
            <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? (isEn ? 'Syncing...' : 'সিঙ্ক হচ্ছে...') : (isEn ? 'Sync Now' : 'এখনই সিঙ্ক করুন')}</span>
          </button>
        )}
      </div>
    </div>
  );
};
