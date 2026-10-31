import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, X, RefreshCw, Server, Smartphone, ArrowRight } from 'lucide-react';
import { getUnresolvedConflicts, resolveConflictLocally } from '../../services/somitiOfflineStore';

export const SyncConflictResolutionModal = ({ isOpen, onClose, isLight, lang }) => {
  const isEn = lang === 'en';
  const [conflicts, setConflicts] = useState([]);
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionMessage, setResolutionMessage] = useState(null);

  const fetchConflicts = async () => {
    try {
      const list = await getUnresolvedConflicts();
      setConflicts(list || []);
      if (list && list.length > 0 && !selectedConflict) {
        setSelectedConflict(list[0]);
      }
    } catch (e) {
      console.warn('Error fetching conflicts:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchConflicts();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleResolve = async (choice) => {
    if (!selectedConflict) return;
    setIsResolving(true);
    setResolutionMessage(null);

    try {
      const resolvedData = choice === 'keep_server'
        ? selectedConflict.serverVersion
        : selectedConflict.localVersion;

      // 1. Send resolution to Server API
      await fetch('/api/sync/conflicts/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conflictId: selectedConflict.id,
          choice,
          resolvedPayload: resolvedData,
          resolvedBy: 'Admin'
        })
      }).catch(() => {});

      // 2. Resolve in local IndexedDB
      await resolveConflictLocally(selectedConflict.id, choice, resolvedData);

      setResolutionMessage(isEn ? 'Conflict resolved successfully!' : 'কনফ্লিক্ট সফলভাবে সমাধান করা হয়েছে!');
      setTimeout(() => {
        setResolutionMessage(null);
        fetchConflicts();
      }, 1200);
    } catch (err) {
      console.error('Resolution error:', err);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        background: isLight ? '#ffffff' : '#0f172a',
        color: isLight ? '#0f172a' : '#f8fafc',
        width: '100%',
        maxWidth: '680px',
        borderRadius: '20px',
        border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: isLight ? '1px solid #f1f5f9' : '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444'
            }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800' }}>
                {isEn ? 'Sync Conflict Resolution' : 'সিঙ্ক কনফ্লিক্ট ও নিরাপত্তা সমাধান'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                {isEn ? `${conflicts.length} unresolved conflict(s)` : `${conflicts.length}টি অনিষ্পন্ন আর্থিক বিরোধ`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {conflicts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 12px' }}>
              <CheckCircle size={44} color="#10b981" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: '800' }}>
                {isEn ? 'No Sync Conflicts Detected' : 'কোনো ডেটা কনফ্লিক্ট নেই'}
              </h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
                {isEn ? 'All offline and cloud transactions are fully reconciled and consistent.' : 'ক্লাউড এবং স্থানীয় অফলাইন সকল ডেটা সম্পূর্ণ সঙ্গতিপূর্ণ ও সুরক্ষিত অবস্থায় রয়েছে।'}
              </p>
            </div>
          ) : selectedConflict ? (
            <div>
              {/* Conflict Alert Banner */}
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '16px',
                fontSize: '0.82rem',
                color: isLight ? '#b45309' : '#fcd34d',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start'
              }}>
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>{isEn ? 'Conflict Reason:' : 'কনফ্লিক্টের কারণ:'}</strong> {selectedConflict.conflictReason || (isEn ? 'Server data was modified while device was offline.' : 'ডিভাইসটি অফলাইনে থাকা অবস্থায় সার্ভারে ডেটা পরিবর্তিত হয়েছে।')}
                  <div style={{ marginTop: '4px', fontSize: '0.74rem', opacity: 0.85 }}>
                    {isEn ? 'Enterprise Rule 5: Critical financial amounts are never silently overwritten.' : 'এন্টারপ্রাইজ নিয়ম ৫: আর্থিক পরিমাণ কখনো স্বয়ংক্রিয়ভাবে ওভাররাইট করা হয় না।'}
                  </div>
                </div>
              </div>

              {/* Version Comparison Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '14px',
                marginBottom: '20px'
              }}>
                {/* Server Version Card */}
                <div style={{
                  background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.04)',
                  border: isLight ? '1.5px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '14px',
                  padding: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#38bdf8', fontWeight: '800', fontSize: '0.85rem' }}>
                    <Server size={16} />
                    <span>{isEn ? 'Server Cloud Version (Authoritative)' : 'সার্ভার ক্লাউড সংস্করণ (চূড়ান্ত)'}</span>
                  </div>
                  <pre style={{
                    fontSize: '0.72rem',
                    background: isLight ? '#f1f5f9' : 'rgba(0,0,0,0.3)',
                    padding: '10px',
                    borderRadius: '8px',
                    overflow: 'auto',
                    maxHeight: '160px',
                    margin: 0
                  }}>
                    {JSON.stringify(selectedConflict.serverVersion, null, 2)}
                  </pre>
                  <button
                    onClick={() => handleResolve('keep_server')}
                    disabled={isResolving}
                    style={{
                      marginTop: '12px',
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      background: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: '800',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>{isEn ? 'Keep Server Version' : 'সার্ভার তথ্য বহাল রাখুন'}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                {/* Local Version Card */}
                <div style={{
                  background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.04)',
                  border: isLight ? '1.5px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '14px',
                  padding: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#a855f7', fontWeight: '800', fontSize: '0.85rem' }}>
                    <Smartphone size={16} />
                    <span>{isEn ? 'Local Device Version (Offline)' : 'লোকাল ডিভাইস সংস্করণ (অফলাইন)'}</span>
                  </div>
                  <pre style={{
                    fontSize: '0.72rem',
                    background: isLight ? '#f1f5f9' : 'rgba(0,0,0,0.3)',
                    padding: '10px',
                    borderRadius: '8px',
                    overflow: 'auto',
                    maxHeight: '160px',
                    margin: 0
                  }}>
                    {JSON.stringify(selectedConflict.localVersion, null, 2)}
                  </pre>
                  <button
                    onClick={() => handleResolve('keep_local')}
                    disabled={isResolving}
                    style={{
                      marginTop: '12px',
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      background: '#7c3aed',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: '800',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>{isEn ? 'Keep Local Version' : 'স্থানীয় তথ্য গ্রহণ করুন'}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {resolutionMessage && (
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '10px',
                  color: '#10b981',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  textAlign: 'center'
                }}>
                  {resolutionMessage}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: isLight ? '1px solid #f1f5f9' : '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          background: isLight ? '#fafafa' : 'rgba(0, 0, 0, 0.2)'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)',
              color: isLight ? '#0f172a' : '#f8fafc',
              border: 'none',
              fontWeight: '700',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            {isEn ? 'Close' : 'বন্ধ করুন'}
          </button>
        </div>
      </div>
    </div>
  );
};
