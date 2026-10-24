import React, { useState, useEffect } from 'react';
import {
  Radio,
  Zap,
  RefreshCw,
  Server,
  Smartphone,
  Laptop,
  CheckCircle2,
  Clock,
  Layers,
  Activity,
  AlertCircle,
  X,
  Share2,
  Send,
  Database
} from 'lucide-react';
import { executeBiDirectionalSync, getLastDeltaSyncTime, subscribeDeltaSync } from '../../services/deltaSyncService';
import { getSyncStatus, flushOfflineQueue } from '../../services/offlineSyncQueue';
import { soundService } from '../../services/soundService';

export const MultiBranchSyncMeshModal = ({ isOpen, onClose, branches = [], activeBranch = null, lang = 'bn' }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(() => getLastDeltaSyncTime());
  const [offlineQueueStatus, setOfflineQueueStatus] = useState(() => getSyncStatus());
  const [syncProgress, setSyncProgress] = useState(100);
  const [syncStep, setSyncStep] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    setOfflineQueueStatus(getSyncStatus());
    const unsub = subscribeDeltaSync((state) => {
      if (typeof state?.isSyncing === 'boolean') {
        setIsSyncing(state.isSyncing);
      }
      if (state?.progress) {
        setSyncProgress(state.progress);
      }
      if (state?.step) {
        setSyncStep(state.step);
      }
      if (state?.type === 'SYNC_COMPLETE' || state?.result?.success) {
        setLastSyncTime(state.timestamp || getLastDeltaSyncTime() || new Date().toISOString());
        setOfflineQueueStatus(getSyncStatus());
      }
    });

    return unsub;
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRunDeltaSync = async () => {
    soundService.playBeep();
    setIsSyncing(true);
    try {
      await executeBiDirectionalSync({ forceFull: false });
      soundService.playSuccessChime();
      setLastSyncTime(getLastDeltaSyncTime());
      setOfflineQueueStatus(getSyncStatus());
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFlushQueue = async () => {
    soundService.playBeep();
    await flushOfflineQueue();
    soundService.playSuccessChime();
    setOfflineQueueStatus(getSyncStatus());
  };

  const displayBranches = branches && branches.length > 0 ? branches : [
    { id: 'main', name: 'প্রধান শাখা (Main Store)', counters: [{ id: 'c1', name: 'কাউন্টার ০১' }, { id: 'c2', name: 'কাউন্টার ০২' }] },
    { id: 'branch_2', name: 'ধানমন্ডি শাখা (Dhanmondi Branch)', counters: [{ id: 'c3', name: 'কাউন্টার ০১' }] },
    { id: 'mobile_pos', name: 'মোবাইল ডেলিভারি ভ্যান (Van POS)', counters: [{ id: 'c4', name: 'ভ্যান ০১' }] }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(10px)',
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
          maxWidth: '720px',
          background: 'var(--color-bg-card, #0f172a)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(56, 189, 248, 0.1))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981, #0284c7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Share2 size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                {lang === 'bn' ? 'মাল্টি-ব্রাঞ্চ লাইভ সিঙ্ক ও ডিভাইস মেশ' : 'Multi-Branch Sync Mesh & Topology'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                {lang === 'bn' ? 'সকল শাখা ও মোবাইল ভ্যানের লাইভ ডাটা সমন্বয় মনিটর' : 'Real-time multi-counter and branch cloud topology'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px', overflowY: 'auto', WebkitOverflowScrolling: 'touch', display: 'flex', flexDirection: 'column', gap: '16px', boxSizing: 'border-box' }}>
          {/* Status Metrics Ribbon */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '10px',
              padding: '14px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{lang === 'bn' ? 'ক্লাউড স্থিতি' : 'Cloud State'}</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '2px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                <span>{lang === 'bn' ? 'অনলাইন' : 'Connected'}</span>
              </div>
            </div>

            <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{lang === 'bn' ? 'পেন্ডিং কিউ' : 'Pending Queue'}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: (offlineQueueStatus?.pendingCount || 0) > 0 ? '#f59e0b' : '#10b981' }}>
                {offlineQueueStatus?.pendingCount || 0}
              </div>
            </div>

            <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{lang === 'bn' ? 'ব্রডকাস্ট ল্যাটেন্সি' : 'Mesh Latency'}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#38bdf8' }}>
                ~45ms
              </div>
            </div>

            <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{lang === 'bn' ? 'সর্বশেষ ডেল্টা' : 'Last Sync'}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#cbd5e1', marginTop: '3px' }}>
                {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (lang === 'bn' ? 'সদ্য' : 'Just now')}
              </div>
            </div>
          </div>

          {/* Sync Progress Bar when active */}
          {isSyncing && (
            <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#818cf8', fontWeight: 700, marginBottom: '6px' }}>
                <span>{syncStep || (lang === 'bn' ? 'দ্বি-মুখী ডেল্টা সিঙ্ক কার্যকর হচ্ছে...' : 'Executing bi-directional delta sync...')}</span>
                <span>{syncProgress}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                <div style={{ width: `${syncProgress}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #10b981)', transition: 'width 0.3s ease' }} />
              </div>
            </div>
          )}

          {/* Branch & Counter Topology Grid */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '10px', display: 'block' }}>
              {lang === 'bn' ? 'সংযুক্ত শাখা ও সক্রিয় কাউন্টার নেটওয়ার্ক' : 'Active Branch & Counter Network'}
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {displayBranches.map((branch) => {
                const isCurrent = activeBranch?.id === branch.id || branch.id === 'main';
                return (
                  <div
                    key={branch.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '16px',
                      background: isCurrent ? 'rgba(16, 185, 129, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                      border: isCurrent ? '1.5px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Server size={16} color={isCurrent ? '#10b981' : '#94a3b8'} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc' }}>
                          {branch.name}
                        </span>
                        {isCurrent && (
                          <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '6px', background: '#10b981', color: '#000', fontWeight: 800 }}>
                            {lang === 'bn' ? 'বর্তমান' : 'Current'}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={13} />
                        <span>{lang === 'bn' ? 'লাইভ সিঙ্ক চালু' : 'Live Syncing'}</span>
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingLeft: '24px' }}>
                      {(branch.counters || []).map((c) => (
                        <div
                          key={c.id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            fontSize: '0.75rem',
                            color: '#cbd5e1'
                          }}
                        >
                          <Laptop size={12} color="#818cf8" />
                          <span>{c.name}</span>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.25)'
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleRunDeltaSync}
              disabled={isSyncing}
              style={{
                padding: '9px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? (lang === 'bn' ? 'সিঙ্ক হচ্ছে...' : 'Syncing...') : (lang === 'bn' ? 'ডেল্টা সিঙ্ক চালান' : 'Run Delta Sync')}</span>
            </button>

            {(offlineQueueStatus?.pendingCount || 0) > 0 && (
              <button
                type="button"
                onClick={handleFlushQueue}
                style={{
                  padding: '9px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  background: 'rgba(245, 158, 11, 0.1)',
                  color: '#f59e0b',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Database size={14} />
                <span>{lang === 'bn' ? 'কিউ পুশ করুন' : 'Flush Queue'}</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 20px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default MultiBranchSyncMeshModal;
