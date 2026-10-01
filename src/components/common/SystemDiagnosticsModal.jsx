import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HardDrive,
  Database,
  Cloud,
  Printer,
  Mic,
  Wifi,
  WifiOff,
  RefreshCw,
  Wrench,
  Download,
  Trash2,
  MessageCircle,
  Copy,
  Check,
  Send,
  ShieldAlert,
  Sparkles,
  FileText
} from 'lucide-react';
import {
  runComprehensiveDiagnostics,
  autoRepairDataIntegrity,
  safeCleanTemporaryStorage,
  runHardwareTestPrint,
  buildSuperAdminSOSTicket,
  clearDiagnosticLogs
} from '../../services/diagnosticService';

export const SystemDiagnosticsModal = ({ isOpen, onClose }) => {
  const {
    products,
    salesHistory,
    customers,
    businessSettings,
    businessExpenses,
    invoices,
    lang,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState('scan'); // 'scan' | 'tools' | 'logs' | 'sos'
  const [diagnostics, setDiagnostics] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [userProblemNote, setUserProblemNote] = useState('');
  const [copiedTicket, setCopiedTicket] = useState(false);
  const [actionInProgress, setActionInProgress] = useState('');

  // Run diagnostics scan
  const executeScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const results = runComprehensiveDiagnostics({
        products,
        salesHistory,
        customers,
        businessSettings,
        businessExpenses,
        invoices
      });
      setDiagnostics(results);
      setIsScanning(false);
    }, 400);
  };

  useEffect(() => {
    if (isOpen) {
      executeScan();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1-Click Hardware Test Print
  const handleTestPrint = () => {
    setActionInProgress('print');
    const res = runHardwareTestPrint(
      businessSettings.receiptPaperWidth || '80mm',
      businessSettings.companyName || 'হিসাব কিতাব ৩৬০'
    );
    if (res.success) {
      showToast(lang === 'bn' ? 'টেস্ট প্রিন্ট সফলভাবে পাঠানো হয়েছে!' : 'Test print sent successfully!', 'success');
    } else {
      showToast(res.error || 'প্রিন্ট ব্যর্থ হয়েছে', 'error');
    }
    setActionInProgress('');
    executeScan();
  };

  // 1-Click Safe Storage Clean
  const handleSafeClean = () => {
    setActionInProgress('clean');
    const res = safeCleanTemporaryStorage();
    if (res.success) {
      showToast(
        lang === 'bn' ? `নিরাপদ ক্যাশ ক্লিন সম্পন্ন (~${res.freedKb} KB মুক্ত হয়েছে)` : `Cache cleaned (~${res.freedKb} KB freed)`,
        'success'
      );
    }
    setActionInProgress('');
    executeScan();
  };

  // 1-Click Auto Repair Database
  const handleAutoRepair = () => {
    setActionInProgress('repair');
    const res = autoRepairDataIntegrity({ products, customers });
    if (res.success) {
      showToast(
        lang === 'bn' ? `অটো-রিপেয়ার সম্পন্ন (${res.repairedCount}টি রেকর্ড মেরামত হয়েছে)` : `Repaired ${res.repairedCount} records!`,
        'success'
      );
    } else {
      showToast(res.error || 'রিপেয়ার ব্যর্থ', 'error');
    }
    setActionInProgress('');
    executeScan();
  };

  // Emergency Full JSON Snapshot Download
  const handleEmergencyDump = () => {
    try {
      const dump = {
        exportDate: new Date().toISOString(),
        version: '2.4.0',
        businessSettings,
        products,
        salesHistory,
        customers,
        businessExpenses,
        invoices
      };
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HisabKitab360_Emergency_Snapshot_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(lang === 'bn' ? 'জরুরি স্ন্যাপশট ডাউনলোড সম্পন্ন হয়েছে!' : 'Emergency snapshot downloaded!', 'success');
    } catch {
      showToast('ডাউনলোড ব্যর্থ হয়েছে', 'error');
    }
  };

  // Build Super Admin SOS Ticket
  const sosData = buildSuperAdminSOSTicket(
    diagnostics || {},
    userProblemNote,
    {
      companyName: businessSettings.companyName || businessSettings.shopName,
      phone: businessSettings.whatsappAlertNumber || businessSettings.phone
    }
  );

  const handleCopyTicket = () => {
    navigator.clipboard.writeText(sosData.ticketText);
    setCopiedTicket(true);
    showToast(lang === 'bn' ? 'SOS রিপোর্ট কপি করা হয়েছে!' : 'SOS Report copied!', 'success');
    setTimeout(() => setCopiedTicket(false), 2000);
  };

  const handleSendToSuperAdmin = () => {
    const adminPhone = businessSettings.superAdminPhone || businessSettings.whatsappAlertNumber || '01700000000';
    const cleanPhone = adminPhone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('880') ? cleanPhone : cleanPhone.startsWith('0') ? `88${cleanPhone}` : `880${cleanPhone}`;
    const url = `https://wa.me/${intlPhone}?text=${encodeURIComponent(sosData.ticketText)}`;
    window.open(url, '_blank');
    showToast(lang === 'bn' ? 'সুপার অ্যাডমিনের হোয়াটসঅ্যাপে টিকিট পাঠানো হচ্ছে...' : 'Opening WhatsApp for Super Admin SOS...', 'success');
  };

  const handleClearLogs = () => {
    clearDiagnosticLogs();
    showToast(lang === 'bn' ? 'এরর লগ পরিষ্কার করা হয়েছে' : 'Logs cleared', 'info');
    executeScan();
  };

  const healthScore = diagnostics?.healthScore || 100;
  const overallStatus = diagnostics?.overallStatus || 'healthy';

  const statusColor = overallStatus === 'healthy' ? '#10b981' : overallStatus === 'warning' ? '#f59e0b' : '#ef4444';

  return (
    <div className="modal-overlay no-print" style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '750px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '16px'
        }}
      >
        {/* MODAL HEADER WITH HEALTH GAUGE */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${statusColor}, #6366f1)`,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 14px ${statusColor}40`
              }}
            >
              <Activity size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? '🩺 সিস্টেম ডায়াগনোসিস ও হেলথ হাব' : '🩺 System Diagnostics & Recovery Hub'}
                </h3>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: `${statusColor}15`,
                    color: statusColor,
                    border: `1px solid ${statusColor}40`
                  }}
                >
                  {healthScore}% {lang === 'bn' ? 'স্বাস্থ্য স্কোর' : 'Health Score'}
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {lang === 'bn'
                  ? 'প্রিন্টার, ডাটাবেজ, মেমোরি, ক্লাউড সিঙ্ক ও স্বয়ংক্রিয় সমাধান ব্যবস্থা'
                  : 'Automated hardware, database, storage health checks & SOS reporting'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={executeScan}
              disabled={isScanning}
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              title="নতুন করে সব টেস্ট চালান"
            >
              <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
              <span>{lang === 'bn' ? 'পুনরায় স্ক্যান' : 'Re-scan'}</span>
            </button>
            <button
              type="button"
              className="btn-icon"
              onClick={onClose}
              style={{ width: '32px', height: '32px', borderRadius: '50%' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION BAR */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-primary)',
            padding: '0 1rem',
            overflowX: 'auto',
            gap: '4px'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('scan')}
            style={{
              padding: '10px 14px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'scan' ? '3px solid var(--mode-color)' : '3px solid transparent',
              color: activeTab === 'scan' ? 'var(--mode-color)' : 'var(--text-muted)',
              fontWeight: activeTab === 'scan' ? '800' : '600',
              fontSize: '0.84rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Activity size={16} />
            <span>{lang === 'bn' ? '১. স্বাস্থ্য স্ক্যান' : '1. Health Scan'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tools')}
            style={{
              padding: '10px 14px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'tools' ? '3px solid #10b981' : '3px solid transparent',
              color: activeTab === 'tools' ? '#10b981' : 'var(--text-muted)',
              fontWeight: activeTab === 'tools' ? '800' : '600',
              fontSize: '0.84rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Wrench size={16} />
            <span>{lang === 'bn' ? '২. ১-ক্লিক সেলফ-হিলিং' : '2. Self-Healing Tools'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            style={{
              padding: '10px 14px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'logs' ? '3px solid #f59e0b' : '3px solid transparent',
              color: activeTab === 'logs' ? '#f59e0b' : 'var(--text-muted)',
              fontWeight: activeTab === 'logs' ? '800' : '600',
              fontSize: '0.84rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FileText size={16} />
            <span>{lang === 'bn' ? `৩. এরর লগ (${diagnostics?.logs?.length || 0})` : `3. Error Logs (${diagnostics?.logs?.length || 0})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sos')}
            style={{
              padding: '10px 14px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'sos' ? '3px solid #ef4444' : '3px solid transparent',
              color: activeTab === 'sos' ? '#ef4444' : 'var(--text-muted)',
              fontWeight: activeTab === 'sos' ? '800' : '600',
              fontSize: '0.84rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ShieldAlert size={16} />
            <span>{lang === 'bn' ? '৪. সুপার অ্যাডমিন SOS' : '4. Super Admin SOS'}</span>
          </button>
        </div>

        {/* MODAL BODY CONTENT */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* TAB 1: LIVE HEALTH SCAN */}
          {activeTab === 'scan' && (
            <div className="animate-fade-in">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
                {/* 1. Storage & Memory */}
                <div
                  style={{
                    background: 'var(--bg-primary)',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    borderLeft: `4px solid ${diagnostics?.storage?.status === 'healthy' ? '#10b981' : '#ef4444'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <HardDrive size={18} style={{ color: '#6366f1' }} />
                      <strong style={{ fontSize: '0.88rem' }}>{lang === 'bn' ? 'লোকাল স্টোরেজ ও মেমোরি' : 'Storage & Quota'}</strong>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: '800', color: diagnostics?.storage?.status === 'healthy' ? '#10b981' : '#ef4444' }}>
                      {diagnostics?.storage?.percentUsed}% {lang === 'bn' ? 'ব্যবহৃত' : 'Used'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    {diagnostics?.storage?.message}
                  </div>
                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${diagnostics?.storage?.percentUsed || 0}%`,
                        height: '100%',
                        background: diagnostics?.storage?.status === 'healthy' ? '#10b981' : '#ef4444',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                    ~{diagnostics?.storage?.usedKb || 0} KB / 5,120 KB ({diagnostics?.storage?.itemCount || 0}টি ডাটা টেবিল কি)
                  </div>
                </div>

                {/* 2. Database Integrity */}
                <div
                  style={{
                    background: 'var(--bg-primary)',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    borderLeft: `4px solid ${diagnostics?.database?.isHealthy ? '#10b981' : '#f59e0b'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Database size={18} style={{ color: '#10b981' }} />
                      <strong style={{ fontSize: '0.88rem' }}>{lang === 'bn' ? 'ডাটাবেজ ইন্টিগ্রিটি' : 'Database Integrity'}</strong>
                    </div>
                    {diagnostics?.database?.isHealthy ? (
                      <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: '800' }}>
                        <CheckCircle2 size={14} /> {lang === 'bn' ? 'ত্রুটিমুক্ত' : 'Healthy'}
                      </span>
                    ) : (
                      <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: '800' }}>
                        <AlertTriangle size={14} /> {diagnostics?.database?.issuesCount} {lang === 'bn' ? 'সমস্যা' : 'Issues'}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {diagnostics?.database?.message}
                  </div>
                </div>

                {/* 3. Cloud & Google Drive */}
                <div
                  style={{
                    background: 'var(--bg-primary)',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    borderLeft: `4px solid ${diagnostics?.backup?.status === 'healthy' ? '#10b981' : '#f59e0b'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Cloud size={18} style={{ color: '#3b82f6' }} />
                      <strong style={{ fontSize: '0.88rem' }}>{lang === 'bn' ? 'গুগল ড্রাইভ ও ব্যাকআপ' : 'Google Drive Backup'}</strong>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: '800', color: diagnostics?.backup?.status === 'healthy' ? '#10b981' : '#f59e0b' }}>
                      {diagnostics?.backup?.hasDriveWebhook ? (lang === 'bn' ? '✓ ড্রাইভ লিঙ্কড' : 'Linked') : (lang === 'bn' ? 'অফলাইন' : 'Offline')}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {diagnostics?.backup?.message}
                  </div>
                </div>

                {/* 4. Thermal Printer Engine */}
                <div
                  style={{
                    background: 'var(--bg-primary)',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    borderLeft: `4px solid ${diagnostics?.printer?.status === 'healthy' ? '#10b981' : '#ef4444'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Printer size={18} style={{ color: '#f59e0b' }} />
                      <strong style={{ fontSize: '0.88rem' }}>{lang === 'bn' ? 'থার্মাল প্রিন্টার ইঞ্জিন' : 'Thermal Printer'}</strong>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#10b981' }}>
                      {diagnostics?.printer?.paperWidth || '80mm'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {diagnostics?.printer?.message}
                  </div>
                </div>

                {/* 5. Voice Input & Speech */}
                <div
                  style={{
                    background: 'var(--bg-primary)',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    borderLeft: `4px solid ${diagnostics?.voice?.status === 'healthy' ? '#10b981' : '#f59e0b'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mic size={18} style={{ color: '#ec4899' }} />
                      <strong style={{ fontSize: '0.88rem' }}>{lang === 'bn' ? 'ভয়েস ইনপুট ও মাইক' : 'Voice Recognition'}</strong>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: '800', color: diagnostics?.voice?.status === 'healthy' ? '#10b981' : '#f59e0b' }}>
                      {diagnostics?.voice?.isSpeechSupported ? 'Web Speech OK' : 'Limited'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {diagnostics?.voice?.message}
                  </div>
                </div>

                {/* 6. Internet & Cloud Sync */}
                <div
                  style={{
                    background: 'var(--bg-primary)',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    borderLeft: `4px solid ${diagnostics?.isOnline ? '#10b981' : '#ef4444'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {diagnostics?.isOnline ? <Wifi size={18} style={{ color: '#10b981' }} /> : <WifiOff size={18} style={{ color: '#ef4444' }} />}
                      <strong style={{ fontSize: '0.88rem' }}>{lang === 'bn' ? 'নেটওয়ার্ক সংযোগ' : 'Network Connectivity'}</strong>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: '800', color: diagnostics?.isOnline ? '#10b981' : '#ef4444' }}>
                      {diagnostics?.isOnline ? (lang === 'bn' ? '🟢 অনলাইন' : 'Online') : (lang === 'bn' ? '🔴 অফলাইন' : 'Offline')}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {diagnostics?.isOnline
                      ? (lang === 'bn' ? 'ব্রাউজার ইন্টারনেট সংযুক্ত আছে। অফলাইন মোডেও ডাটা সুরক্ষিত থাকবে।' : 'Internet connected. Full offline support active.')
                      : (lang === 'bn' ? 'ইন্টারনেট বিচ্ছিন্ন রয়েছে। সফটওয়্যার সম্পূর্ণ অফলাইন মোডে চলবে।' : 'Device is offline. Local database is active.')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 1-CLICK SELF-HEALING TOOLS */}
          {activeTab === 'tools' && (
            <div className="animate-fade-in">
              <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {lang === 'bn'
                  ? 'সফটওয়্যারের যেকোনো সমস্যা তাৎক্ষণিকভাবে নিজ হাতে মেরামত করতে নিচের সমাধান বাটনগুলো ব্যবহার করুন:'
                  : 'Use these 1-click repair actions to resolve common printer, storage, or ledger issues instantly:'}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
                {/* Action 1: Test Print */}
                <div style={{ background: 'var(--bg-primary)', padding: '1.1rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: '800', marginBottom: '6px' }}>
                      <Printer size={18} />
                      <span>{lang === 'bn' ? 'প্রিন্টার টেস্ট স্লিপ বের করুন' : 'Hardware Print Test'}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {lang === 'bn' ? 'রসিদ বের না হলে বা কাগজ কেটে গেলে একটি ডায়াগনোসিস টেস্ট স্লিপ প্রিন্টারে পাঠিয়ে কাগজ ও মার্জিন চেক করুন।' : 'Send diagnostic test job to verify thermal alignment.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleTestPrint}
                    disabled={actionInProgress === 'print'}
                    style={{ marginTop: '12px', padding: '8px 14px', fontSize: '0.8rem', width: '100%', background: '#f59e0b', borderColor: '#f59e0b', color: '#000', fontWeight: '800' }}
                  >
                    <span>🧪 {lang === 'bn' ? 'টেস্ট স্লিপ প্রিন্ট করুন' : 'Run Test Print'}</span>
                  </button>
                </div>

                {/* Action 2: Database Auto-Repair */}
                <div style={{ background: 'var(--bg-primary)', padding: '1.1rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: '800', marginBottom: '6px' }}>
                      <Database size={18} />
                      <span>{lang === 'bn' ? 'ডাটাবেজ অটো-রিপেয়ার ও স্যানিটাইজ' : 'Database Auto-Repair'}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {lang === 'bn' ? 'কোনো পণ্য বা বাকি হিসাবে গরমিল বা ভাঙা আইডি থাকলে স্বয়ংক্রিয়ভাবে সনাক্ত করে মেরামত করবে।' : 'Scans and sanitizes damaged foreign keys and missing IDs.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleAutoRepair}
                    disabled={actionInProgress === 'repair'}
                    style={{ marginTop: '12px', padding: '8px 14px', fontSize: '0.8rem', width: '100%', background: '#10b981', borderColor: '#10b981', fontWeight: '800' }}
                  >
                    <span>🩺 {lang === 'bn' ? 'ডাটাবেজ অটো-রিপেয়ার চালান' : 'Run Database Repair'}</span>
                  </button>
                </div>

                {/* Action 3: Safe Storage Clean */}
                <div style={{ background: 'var(--bg-primary)', padding: '1.1rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6366f1', fontWeight: '800', marginBottom: '6px' }}>
                      <Trash2 size={18} />
                      <span>{lang === 'bn' ? 'নিরাপদ ক্যাশ ও টেম্প ক্লিন' : 'Safe Cache Clean'}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {lang === 'bn' ? 'কোনো কাস্টমার বা বিক্রয় ডাটা না মুছে শুধুমাত্র ব্রাউজারের সাময়িক অপ্রয়োজনীয় ক্যাশ পরিষ্কার করে।' : 'Safely purges temp render caches without losing data.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleSafeClean}
                    disabled={actionInProgress === 'clean'}
                    style={{ marginTop: '12px', padding: '8px 14px', fontSize: '0.8rem', width: '100%' }}
                  >
                    <span>🧹 {lang === 'bn' ? 'ক্যাশ ও টেম্প ক্লিন করুন' : 'Clean Temp Cache'}</span>
                  </button>
                </div>

                {/* Action 4: Emergency Full JSON Snapshot */}
                <div style={{ background: 'var(--bg-primary)', padding: '1.1rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', fontWeight: '800', marginBottom: '6px' }}>
                      <Download size={18} />
                      <span>{lang === 'bn' ? 'জরুরি সম্পূর্ণ ব্যাকআপ ডাউনলোড' : 'Emergency Snapshot'}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {lang === 'bn' ? 'কম্পিউটার ফরম্যাট বা ব্রাউজার নষ্ট হওয়ার আগে ১-ক্লিকে পুরো ডাটাবেজের সম্পূর্ণ কপি ডাউনলোড করুন।' : 'Full JSON export snapshot for instant offline recovery.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleEmergencyDump}
                    style={{ marginTop: '12px', padding: '8px 14px', fontSize: '0.8rem', width: '100%', borderColor: '#3b82f6', color: '#3b82f6' }}
                  >
                    <span>📦 {lang === 'bn' ? 'সম্পূর্ণ JSON ফাইল নামান' : 'Download JSON Dump'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ERROR & DIAGNOSTIC LOGS */}
          {activeTab === 'logs' && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {diagnostics?.logs?.length || 0} {lang === 'bn' ? 'টি সাম্প্রতিক ডায়াগনোসিস রেকর্ড সংরক্ষিত আছে' : 'recent events'}
                </span>
                {diagnostics?.logs?.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleClearLogs}
                    style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#ef4444' }}
                  >
                    <Trash2 size={13} />
                    <span>{lang === 'bn' ? 'লগ মুছুন' : 'Clear Logs'}</span>
                  </button>
                )}
              </div>

              {diagnostics?.logs?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {diagnostics.logs.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        background: 'var(--bg-primary)',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        borderLeft: `4px solid ${log.level === 'error' ? '#ef4444' : log.level === 'warning' ? '#f59e0b' : '#3b82f6'}`,
                        fontSize: '0.8rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '800', color: 'var(--text-main)', textTransform: 'uppercase', fontSize: '0.72rem' }}>
                          [{log.category}] #{log.id}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                          {log.dateFormatted} {log.timeFormatted}
                        </span>
                      </div>
                      <div style={{ color: log.level === 'error' ? '#ef4444' : 'var(--text-muted)' }}>
                        {log.message}
                      </div>
                      {log.details && (
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontFamily: 'monospace', marginTop: '6px', color: 'var(--text-dim)', overflowX: 'auto' }}>
                          {log.details}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={36} style={{ color: '#10b981', marginBottom: '8px' }} />
                  <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'আলহামদুলিল্লাহ! কোনো এরর বা ত্রুটি নেই' : 'Clean & Error-Free!'}
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem' }}>
                    {lang === 'bn' ? 'সফটওয়্যার বর্তমানে ১০০% সুস্থ ও স্বাভাবিকভাবে কাজ করছে।' : 'All modules are operating smoothly without incident.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SUPER ADMIN SOS REPORT */}
          {activeTab === 'sos' && (
            <div className="animate-fade-in">
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: '800', marginBottom: '4px' }}>
                  <ShieldAlert size={20} />
                  <span>{lang === 'bn' ? 'জরুরি সুপার অ্যাডমিন / ডেভেলপার সহায়তা' : 'Super Admin Emergency Support'}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {lang === 'bn'
                    ? 'যদি নিজে চেষ্টা করেও কোনো সমস্যার সমাধান না হয়, এখানে আপনার সমস্যার কথা লিখে ১-ক্লিকে সুপার অ্যাডমিনের হোয়াটসঅ্যাপে পাঠান। সিস্টেম স্বয়ংক্রিয়ভাবে টেকনিক্যাল ডায়াগনোসিস ফাইল ও ডিভাইস তথ্য যুক্ত করে দেবে।'
                    : 'Dispatches full telemetry, browser environment, and last crash errors directly to the Super Admin via WhatsApp.'}
                </p>
              </div>

              {/* User Note Input */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>
                  {lang === 'bn' ? 'আপনার সমস্যাটি সংক্ষেপে লিখুন (ঐচ্ছিক):' : 'Describe your problem briefly:'}
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={userProblemNote}
                  onChange={(e) => setUserProblemNote(e.target.value)}
                  placeholder={lang === 'bn' ? 'যেমন: প্রিন্টারে কাগজের লেখা ছোট আসতেছে, অথবা ক্যাশ ড্রয়ার খুলতেছে না...' : 'e.g. Printer is not responding or drawer kick fails...'}
                  style={{ width: '100%', resize: 'none', fontSize: '0.82rem' }}
                />
              </div>

              {/* Formatted Ticket Preview */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-dim)' }}>
                    {lang === 'bn' ? 'উৎপন্ন সাপোর্ট টিকিট প্রিভিউ:' : 'Generated SOS Ticket Bundle:'}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#10b981', fontFamily: 'monospace' }}>
                    #{sosData.ticketId}
                  </span>
                </div>
                <pre
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '0.74rem',
                    color: 'var(--text-main)',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                    margin: 0
                  }}
                >
                  {sosData.ticketText}
                </pre>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={handleSendToSuperAdmin}
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    background: '#25D366',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: '800',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    borderRadius: '10px',
                    boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
                    cursor: 'pointer'
                  }}
                >
                  <MessageCircle size={18} />
                  <span>{lang === 'bn' ? '📲 WhatsApp-এ সুপার অ্যাডমিনকে পাঠান' : 'Send SOS via WhatsApp'}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCopyTicket}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px' }}
                >
                  {copiedTicket ? <Check size={16} style={{ color: '#10b981' }} /> : <Copy size={16} />}
                  <span>{copiedTicket ? (lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (lang === 'bn' ? 'রিপোর্ট কপি করুন' : 'Copy Ticket')}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div
          style={{
            padding: '0.75rem 1.5rem',
            background: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            HisabKitab 360 Diagnostic Engine v2.4
          </div>
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ padding: '6px 16px' }}>
            {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
