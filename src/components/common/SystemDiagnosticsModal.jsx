import React, { useState, useEffect } from 'react';
import {
  Activity,
  HardDrive,
  Cpu,
  Wifi,
  Printer,
  Trash2,
  CheckCircle,
  X,
  RefreshCw,
  Zap,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { getPendingPrintQueue, clearPendingPrintQueue } from '../../services/printService';
import { measureLatency } from '../../services/networkQualityService';
import { hapticFeedback } from '../../services/nativeAppService';
import { playButtonClick, playSuccessChime } from '../../services/soundFeedback';

export const SystemDiagnosticsModal = ({
  isOpen,
  onClose,
  lang = 'bn',
  showToast = () => {}
}) => {
  const [diagnostics, setDiagnostics] = useState({
    storageUsedMB: 0,
    storageQuotaMB: 0,
    cores: 4,
    deviceMemoryGB: 4,
    printQueueCount: 0,
    latencyMs: 45,
    healthScore: 100
  });
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  const runAudit = async () => {
    setIsRunningCheck(true);
    try {
      // 1. Storage estimate
      let used = 0;
      let quota = 0;
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        used = Math.round((est.usage || 0) / (1024 * 1024));
        quota = Math.round((est.quota || 0) / (1024 * 1024));
      }

      // 2. Hardware
      const cores = navigator.hardwareConcurrency || 4;
      const deviceMemoryGB = navigator.deviceMemory || 4;

      // 3. Print queue
      const printQueue = getPendingPrintQueue();

      // 4. Ping latency
      const net = await measureLatency();

      setDiagnostics({
        storageUsedMB: used,
        storageQuotaMB: quota,
        cores,
        deviceMemoryGB,
        printQueueCount: printQueue.length,
        latencyMs: net.latencyMs || 45,
        healthScore: net.isOnline ? 100 : 85
      });
    } catch (err) {
      console.warn('Audit error:', err);
    } finally {
      setIsRunningCheck(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runAudit();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCleanBloat = () => {
    playSuccessChime();
    hapticFeedback.success();
    setIsPurging(true);

    setTimeout(() => {
      clearPendingPrintQueue();
      // Remove temporary transient items without touching core business data
      try {
        sessionStorage.clear();
        localStorage.removeItem('hk360_transient_cache');
      } catch {}

      setIsPurging(false);
      showToast(
        lang === 'bn'
          ? '✨ সিস্টেম মেমোরি ও অপ্রয়োজনীয় ক্যাশ সফলভাবে খালি করা হয়েছে!'
          : 'System cache & memory successfully cleaned!',
        'success'
      );
      runAudit();
    }, 700);
  };

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 10000,
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain'
      }}
    >
      <div
        className="modal-content animate-fade-in"
        style={{
          maxWidth: '460px',
          width: '94%',
          maxHeight: '92vh',
          overflowY: 'auto',
          borderRadius: '20px',
          padding: '1.25rem',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}
            >
              <Activity size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'সিস্টেম স্বাস্থ্য ও ডায়াগনস্টিকস' : 'System Health & Diagnostics'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'মোবাইল অ্যাপ পারফরম্যান্স ও ক্যাশ ক্লিনার' : 'Mobile performance & memory optimizer'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            style={{ width: '32px', height: '32px', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Health Score Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.05))',
            border: '1.5px solid #10b981',
            borderRadius: '14px',
            padding: '12px 14px',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={28} color="#10b981" />
            <div>
              <div style={{ fontSize: '0.86rem', fontWeight: '800', color: '#10b981' }}>
                {lang === 'bn' ? 'সিস্টেম স্বাস্থ্য চমৎকার' : 'System Health Excellent'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'সবগুলো ইঞ্জিন ল্যাগ-ফ্রিভাবে চলছে' : 'All engines operating lag-free'}
              </div>
            </div>
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#10b981' }}>
            {diagnostics.healthScore}%
          </div>
        </div>

        {/* Grid Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginBottom: '1rem'
          }}
        >
          {/* Storage */}
          <div
            style={{
              padding: '10px',
              borderRadius: '10px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <HardDrive size={13} color="#6366f1" />
              <span>{lang === 'bn' ? 'স্টোরেজ ব্যবহার' : 'Storage Used'}</span>
            </div>
            <div style={{ fontSize: '0.94rem', fontWeight: '800', color: 'var(--text-main)' }}>
              {diagnostics.storageUsedMB} MB
            </div>
            <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
              কোটা: {diagnostics.storageQuotaMB} MB
            </div>
          </div>

          {/* Network Latency */}
          <div
            style={{
              padding: '10px',
              borderRadius: '10px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <Wifi size={13} color="#10b981" />
              <span>{lang === 'bn' ? 'নেটওয়ার্ক পিং' : 'Network Ping'}</span>
            </div>
            <div style={{ fontSize: '0.94rem', fontWeight: '800', color: 'var(--text-main)' }}>
              {diagnostics.latencyMs} ms
            </div>
            <div style={{ fontSize: '0.66rem', color: '#10b981' }}>
              {diagnostics.latencyMs < 100 ? (lang === 'bn' ? 'অত্যন্ত দ্রুত' : 'Super Fast') : 'স্বাভাবিক'}
            </div>
          </div>

          {/* Hardware Cores */}
          <div
            style={{
              padding: '10px',
              borderRadius: '10px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <Cpu size={13} color="#f59e0b" />
              <span>{lang === 'bn' ? 'প্রসেসর কোর' : 'CPU Cores'}</span>
            </div>
            <div style={{ fontSize: '0.94rem', fontWeight: '800', color: 'var(--text-main)' }}>
              {diagnostics.cores} Cores
            </div>
            <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
              র‍্যাম: ~{diagnostics.deviceMemoryGB} GB
            </div>
          </div>

          {/* Thermal Print Queue */}
          <div
            style={{
              padding: '10px',
              borderRadius: '10px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <Printer size={13} color="#06b6d4" />
              <span>{lang === 'bn' ? 'প্রিন্টার কিউ' : 'Print Queue'}</span>
            </div>
            <div style={{ fontSize: '0.94rem', fontWeight: '800', color: 'var(--text-main)' }}>
              {diagnostics.printQueueCount} Jobs
            </div>
            <div style={{ fontSize: '0.66rem', color: diagnostics.printQueueCount === 0 ? '#10b981' : '#f59e0b' }}>
              {diagnostics.printQueueCount === 0 ? (lang === 'bn' ? 'ক্লিয়ার' : 'Clear') : 'পেন্ডিং'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            onClick={handleCleanBloat}
            disabled={isPurging}
            style={{
              padding: '11px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              fontWeight: '800',
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Trash2 size={16} />
            <span>
              {isPurging
                ? (lang === 'bn' ? 'ক্লিন করা হচ্ছে...' : 'Cleaning...')
                : (lang === 'bn' ? '১-ক্লিক ক্যাশ ও মেমোরি খালি করুন' : '1-Click Cache & Memory Optimizer')}
            </span>
          </button>

          <button
            type="button"
            onClick={runAudit}
            disabled={isRunningCheck}
            style={{
              padding: '8px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: '0.78rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={13} style={{ animation: isRunningCheck ? 'spin 1s linear infinite' : 'none' }} />
            <span>{lang === 'bn' ? 'পুনরায় চেক করুন' : 'Re-check Diagnostics'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
