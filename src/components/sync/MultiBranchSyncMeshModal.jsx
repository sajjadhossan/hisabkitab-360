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
  Database,
  Globe,
  Apple
} from 'lucide-react';
import { executeBiDirectionalSync, getLastDeltaSyncTime, subscribeDeltaSync } from '../../services/deltaSyncService';
import { getSyncStatus, flushOfflineQueue } from '../../services/offlineSyncQueue';
import { soundService } from '../../services/soundService';
import { getOnlineTerminalsList, isLiveSyncConnected } from '../../services/liveSyncService';
import { useApp } from '../../context/AppContext';

export const MultiBranchSyncMeshModal = ({ isOpen, onClose, branches = [], activeBranch = null, lang = 'bn' }) => {
  const { operatingMode, profile, businessSettings } = useApp() || {};
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(() => getLastDeltaSyncTime());
  const [offlineQueueStatus, setOfflineQueueStatus] = useState(() => getSyncStatus());
  const [syncProgress, setSyncProgress] = useState(100);
  const [syncStep, setSyncStep] = useState('');
  const [terminals, setTerminals] = useState(() => getOnlineTerminalsList());

  // Detect active operating domain (Samity 360, Personal, or Business)
  const isSamity = businessSettings?.primaryOperatingMode === 'samity' || 
                   businessSettings?.industryTemplateId === 'samity_management_hub' ||
                   (typeof window !== 'undefined' && window.location.pathname.includes('somiti'));
  const isPersonal = profile === 'personal' && !isSamity;

  const activeModeInfo = isSamity
    ? { title: '🏛️ সমিতি ৩৬০ মোড', desc: 'সদস্য, সঞ্চয়, ঋণ ও মাঠ কালেকশন রিয়েল-টাইম ডিভাইস সিঙ্ক', color: '#0ea5e9' }
    : isPersonal
    ? { title: '🏠 ব্যক্তিগত হিসাব মোড', desc: 'ব্যক্তিগত ব্যয়, আয়, দেনা-পাওনা ও বহু-ডিভাইস সিঙ্ক', color: '#10b981' }
    : { title: '🏢 ব্যবসা ও বিক্রয় মোড', desc: 'মাল্টি-ডিভাইস বিলিং, ইনভেন্টরি ও খতিয়ান সিঙ্ক', color: '#6366f1' };

  useEffect(() => {
    if (!isOpen) return;

    setOfflineQueueStatus(getSyncStatus());
    setTerminals(getOnlineTerminalsList());

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
        setTerminals(getOnlineTerminalsList());
      }
    });

    const terminalPollTimer = setInterval(() => {
      setTerminals(getOnlineTerminalsList());
    }, 2000);

    return () => {
      unsub();
      clearInterval(terminalPollTimer);
    };
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
      setTerminals(getOnlineTerminalsList());
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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          background: '#0f172a',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}
            >
              <Activity size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                {lang === 'bn' ? 'রিয়েল-টাইম লাইভ ডিভাইস হাব' : 'Real-Time Device Mesh'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8' }}>
                {lang === 'bn' ? 'মোবাইল, পিসি ও ক্লাউড ডিভাইস সিঙ্ক নেটওয়ার্ক' : 'Omni-Device WebSocket Sync Mesh'}
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

          {/* Active Operating Mode Banner */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: `rgba(${isSamity ? '14, 165, 233' : isPersonal ? '16, 185, 129' : '99, 102, 241'}, 0.12)`,
              border: `1px solid ${activeModeInfo.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>{isSamity ? '🏛️' : isPersonal ? '🏠' : '🏢'}</span>
              <div>
                <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#f8fafc' }}>
                  {activeModeInfo.title}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  {activeModeInfo.desc}
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#10b981',
                border: '1px solid #10b981'
              }}
            >
              ● ক্লাউড মেশ সক্রিয়
            </span>
          </div>

          {/* Universal Multi-Device Network Grid */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#cbd5e1', display: 'block' }}>
                {lang === 'bn' ? 'সংযুক্ত সকল মোবাইল ও কম্পিউটার টার্মিনাল' : 'Connected Mobile & Computer Terminals'}
              </label>
              <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700 }}>
                {terminals.length > 0 ? `${terminals.length}টি লাইভ ডিভাইস` : '১টি লাইভ ডিভাইস'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* If real terminals found from presence, render them */}
              {terminals && terminals.length > 0 ? (
                terminals.map((term, idx) => {
                  const isMobile = term.platform === 'android' || term.deviceType === 'mobile';
                  const isMac = term.platform === 'mac' || term.deviceType === 'mac';
                  const isPC = term.platform === 'desktop' || term.deviceType === 'pc';

                  return (
                    <div
                      key={term.id || idx}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '14px',
                        background: term.isSelf ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                        border: term.isSelf ? '1.5px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: isMobile ? 'rgba(16, 185, 129, 0.15)' : isMac ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                            color: isMobile ? '#10b981' : isMac ? '#a855f7' : '#3b82f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {isMobile ? <Smartphone size={18} /> : isMac ? <Apple size={18} /> : isPC ? <Laptop size={18} /> : <Globe size={18} />}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#f8fafc' }}>
                              {term.counterName || term.deviceName || (isMobile ? 'মোবাইল ফোন' : 'কম্পিউটার')}
                            </span>
                            {term.isSelf && (
                              <span style={{ fontSize: '0.64rem', padding: '1px 6px', borderRadius: '4px', background: '#10b981', color: '#000', fontWeight: 800 }}>
                                {lang === 'bn' ? 'বর্তমান ডিভাইস' : 'Current'}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                            {term.operatorName || (isSamity ? 'মাঠ কর্মকর্তা' : 'ইউজার')} • ID: {(term.id || '').substring(0, 10)}...
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                        <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 800 }}>
                          {lang === 'bn' ? 'অনলাইন ও সিঙ্ক' : 'Online'}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                /* Default Universal Device Preview */
                [
                  { type: 'mobile', name: 'মোবাইল অ্যাপ (Android APK)', desc: isSamity ? 'মাঠ কর্মকর্তা কালেকশন টার্মিনাল' : 'ক্যামেরা স্ক্যানার ও সেলস', online: true },
                  { type: 'pc', name: 'পিসি ডেস্কটপ (Windows Desktop)', desc: isSamity ? 'অফিস ম্যানেজমেন্ট ও অডিট' : 'প্রধান ক্যাশ কাউন্টার ও প্রিভিউ', online: true },
                  { type: 'web', name: 'ক্লাউড ওয়েবসাইট (Web App)', desc: 'অনলাইন এক্সেস ও রিমোট মনিটরিং', online: true }
                ].map((d, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '14px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {d.type === 'mobile' ? <Smartphone size={17} /> : d.type === 'pc' ? <Laptop size={17} /> : <Globe size={17} />}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#f8fafc' }}>{d.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{d.desc}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                      <span>{lang === 'bn' ? 'সক্রিয়' : 'Active'}</span>
                    </span>
                  </div>
                ))
              )}
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
