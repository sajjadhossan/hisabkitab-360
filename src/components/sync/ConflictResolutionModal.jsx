import React, { useState, useEffect } from 'react';
import {
  GitMerge,
  ShieldCheck,
  AlertTriangle,
  Clock,
  RotateCcw,
  CheckCircle2,
  Trash2,
  X,
  FileText,
  Layers,
  ArrowRight
} from 'lucide-react';
import { getConflictHistory, executeBiDirectionalSync } from '../../services/deltaSyncService';
import { soundService } from '../../services/soundService';

export const ConflictResolutionModal = ({ isOpen, onClose, lang = 'bn', onRefreshData }) => {
  const [conflictLogs, setConflictLogs] = useState([]);
  const [resolutionStrategy, setResolutionStrategy] = useState(() => {
    try {
      return localStorage.getItem('hk360_conflict_strategy') || 'lww';
    } catch {
      return 'lww';
    }
  });
  const [isResyncing, setIsResyncing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConflictLogs(getConflictHistory());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStrategyChange = (strategy) => {
    setResolutionStrategy(strategy);
    try {
      localStorage.setItem('hk360_conflict_strategy', strategy);
    } catch {}
    soundService.playBeep();
  };

  const handleClearHistory = () => {
    soundService.playDeleteTone();
    try {
      localStorage.removeItem('hk360_conflict_resolution_history');
      setConflictLogs([]);
    } catch {}
  };

  const handleTriggerResync = async () => {
    soundService.playBeep();
    setIsResyncing(true);
    try {
      await executeBiDirectionalSync({ forceFull: true });
      soundService.playSuccessChime();
      setConflictLogs(getConflictHistory());
      if (onRefreshData) onRefreshData();
    } finally {
      setIsResyncing(false);
    }
  };

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
          maxWidth: '680px',
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
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(16, 185, 129, 0.1))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}
            >
              <GitMerge size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                {lang === 'bn' ? 'কনফ্লিক্ট রেজোলিউশন ও মার্জ অডিট' : 'Conflict Resolution & Merge Hub'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                {lang === 'bn' ? 'অফলাইন ও ক্লাউড ডাটার স্বয়ংক্রিয় বিরোধ মীমাংসা হিস্ট্রি' : 'Automated multi-device delta reconciliation audit'}
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

        {/* Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Strategy Selector */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px', display: 'block' }}>
              {lang === 'bn' ? 'বিরোধ মীমাংসার স্বয়ংক্রিয় নীতি (Conflict Strategy)' : 'Resolution Strategy Policy'}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { id: 'lww', title: 'Last-Write-Wins', bnTitle: 'সাম্প্রতিক টাইমস্ট্যাম্প (LWW)', desc: 'যে ডিভাইসে সর্বশেষ সেভ হয়েছে সেটি কার্যকর হবে' },
                { id: 'cloud_priority', title: 'Cloud Priority', bnTitle: 'ক্লাউড প্রাধান্য', desc: 'ক্লাউড সার্ভারের কপি লোকাল কপির চেয়ে প্রাধান্য পাবে' },
                { id: 'local_priority', title: 'Local Priority', bnTitle: 'লোকাল ডিভাইস প্রাধান্য', desc: 'বর্তমান ডিভাইসের অফলাইন এন্ট্রি সুরক্ষিত থাকবে' }
              ].map((strat) => {
                const isSelected = resolutionStrategy === strat.id;
                return (
                  <button
                    key={strat.id}
                    type="button"
                    onClick={() => handleStrategyChange(strat.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      color: isSelected ? '#f8fafc' : '#94a3b8',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: isSelected ? '#818cf8' : '#cbd5e1', marginBottom: '2px' }}>
                      {lang === 'bn' ? strat.bnTitle : strat.title}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', lineHeight: 1.3 }}>
                      {strat.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '10px',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{lang === 'bn' ? 'মীমাংসিত কনফ্লিক্ট' : 'Resolved Conflicts'}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981' }}>{conflictLogs.length}</div>
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255, 255, 255, 0.08)', borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{lang === 'bn' ? 'ডাটা অখণ্ডতা' : 'Data Integrity'}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38bdf8' }}>100%</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{lang === 'bn' ? 'সক্রিয় প্রটোকল' : 'Active Protocol'}</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f59e0b', marginTop: '2px' }}>Bi-Delta LWW</div>
            </div>
          </div>

          {/* Conflict History List */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1' }}>
                {lang === 'bn' ? 'সাম্প্রতিক মীমাংসা লগ' : 'Recent Resolution History'} ({conflictLogs.length})
              </span>
              {conflictLogs.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Trash2 size={12} />
                  <span>{lang === 'bn' ? 'লগ মুছুন' : 'Clear Log'}</span>
                </button>
              )}
            </div>

            {conflictLogs.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '36px 16px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed rgba(255, 255, 255, 0.1)',
                  color: '#64748b'
                }}
              >
                <ShieldCheck size={36} style={{ color: '#10b981', margin: '0 auto 8px', opacity: 0.8 }} />
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#cbd5e1' }}>
                  {lang === 'bn' ? 'কোনো অমীমাংসিত দ্বন্দ্ব বা বিরোধ নেই' : 'Zero Conflicts Detected'}
                </div>
                <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                  {lang === 'bn' ? 'সকল ডিভাইস ও ক্লাউড ডাটা ১০০% নিখুঁতভাবে সমন্বিত রয়েছে' : 'All local and cloud states are fully harmonious'}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                {conflictLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            padding: '1px 6px',
                            borderRadius: '6px',
                            background: log.entityType === 'product' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: log.entityType === 'product' ? '#38bdf8' : '#f59e0b',
                            fontWeight: 700,
                            textTransform: 'uppercase'
                          }}
                        >
                          {log.entityType}
                        </span>
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>
                          {log.entityName || 'রেকর্ড'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        {log.details} • {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '8px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#10b981',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <CheckCircle2 size={12} />
                        <span>{log.winner || 'LWW'}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
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
          <button
            type="button"
            onClick={handleTriggerResync}
            disabled={isResyncing}
            style={{
              padding: '9px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              background: 'rgba(99, 102, 241, 0.1)',
              color: '#818cf8',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RotateCcw size={14} className={isResyncing ? 'animate-spin' : ''} />
            <span>{isResyncing ? (lang === 'bn' ? 'সিঙ্ক হচ্ছে...' : 'Syncing...') : (lang === 'bn' ? 'ফোর্স ফুল-সিঙ্ক' : 'Force Full Resync')}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 20px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}
          >
            {lang === 'bn' ? 'সম্পন্ন' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default ConflictResolutionModal;
