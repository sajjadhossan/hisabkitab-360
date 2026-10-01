import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calculator,
  X,
  Copy,
  Trash2,
  Check,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  FileText,
  Calendar,
  Cloud,
  Download,
  Upload,
  RefreshCw,
  Camera,
  Keyboard,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LogOut,
  User
} from 'lucide-react';
import { CategoryManagerModal } from './CategoryManagerModal';

export const QuickToolsModal = ({ activeTool, onClose }) => {
  const {
    profile,
    lang,
    t,
    businessSettings,
    updateBusinessSettings,
    syncToGoogleDrive,
    createAutoSnapshot,
    exportAllData,
    importAllData,
    resetToDemo,
    snapshots,
    salesHistory,
    businessExpenses,
    invoices,
    personalExpenses,
    personalIncomes,
    showToast,
    isDriveConnected,
    driveUser,
    connectDriveOAuth,
    disconnectDriveOAuth,
    switchDriveOAuth
  } = useApp();

  // ----------------------------------------------------
  // CALCULATOR STATE & LOGIC
  // ----------------------------------------------------
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcEquation, setCalcEquation] = useState('');
  const [calcCopied, setCalcCopied] = useState(false);

  const handleCalcClick = (val) => {
    if (val === 'C') {
      setCalcDisplay('0');
      setCalcEquation('');
    } else if (val === 'CE') {
      setCalcDisplay('0');
    } else if (val === '⌫') {
      setCalcDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else if (val === '=') {
      try {
        const sanitized = (calcEquation + calcDisplay).replace(/×/g, '*').replace(/÷/g, '/');
        // evaluate safely
        const result = Function(`'use strict'; return (${sanitized})`)();
        const formatted = Number.isInteger(result) ? result.toString() : Number(result).toFixed(2).replace(/\.?0+$/, '');
        setCalcDisplay(formatted);
        setCalcEquation('');
      } catch {
        setCalcDisplay('Error');
      }
    } else if (['+', '-', '×', '÷'].includes(val)) {
      setCalcEquation(prev => `${prev} ${calcDisplay} ${val}`);
      setCalcDisplay('0');
    } else if (val === '%') {
      const num = parseFloat(calcDisplay);
      setCalcDisplay((num / 100).toString());
    } else if (val === '.') {
      if (!calcDisplay.includes('.')) {
        setCalcDisplay(prev => prev + '.');
      }
    } else {
      // Numbers 0-9
      setCalcDisplay(prev => prev === '0' || prev === 'Error' ? val : prev + val);
    }
  };

  const handleCopyCalc = () => {
    navigator.clipboard.writeText(calcDisplay);
    setCalcCopied(true);
    setTimeout(() => setCalcCopied(false), 2000);
    showToast(lang === 'bn' ? 'ফলাফল কপি করা হয়েছে' : 'Copied result to clipboard');
  };

  // ----------------------------------------------------
  // QUICK STICKY NOTES STATE & LOGIC
  // ----------------------------------------------------
  const [stickyNote, setStickyNote] = useState(() => {
    return localStorage.getItem('hk360_sticky_notes') || '';
  });
  const [notesCopied, setNotesCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem('hk360_sticky_notes', stickyNote);
  }, [stickyNote]);

  const handleCopyNotes = () => {
    navigator.clipboard.writeText(stickyNote);
    setNotesCopied(true);
    setTimeout(() => setNotesCopied(false), 2000);
    showToast(lang === 'bn' ? 'চিরকুট কপি হয়েছে' : 'Copied note to clipboard');
  };

  // ----------------------------------------------------
  // DAILY CASH CALCULATION
  // ----------------------------------------------------
  const todayStr = new Date().toISOString().split('T')[0];

  // Business Cash In & Out
  let todayCashSales = 0;
  salesHistory.forEach(s => {
    if ((s.date || '').startsWith(todayStr) && s.paymentMethod === 'cash') {
      todayCashSales += Number(s.grandTotal) || 0;
    }
  });

  let todayCashInvoices = 0;
  invoices.forEach(inv => {
    (inv.paymentHistory || []).forEach(ph => {
      if ((ph.date || '').startsWith(todayStr) && ph.method === 'cash') {
        todayCashInvoices += Number(ph.amount) || 0;
      }
    });
  });

  let todayCashExpenses = 0;
  businessExpenses.forEach(exp => {
    if ((exp.date || '').startsWith(todayStr)) {
      todayCashExpenses += Number(exp.amount) || 0;
    }
  });

  const totalTodayCashIn = todayCashSales + todayCashInvoices;
  const netTodayCashDrawer = totalTodayCashIn - todayCashExpenses;

  // Personal Cash In & Out
  const todayPersonalExpenses = personalExpenses
    .filter(e => (e.date || '').startsWith(todayStr))
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const todayPersonalIncome = personalIncomes
    .filter(i => (i.date || '').startsWith(todayStr))
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const netPersonalCash = todayPersonalIncome - todayPersonalExpenses;

  // ----------------------------------------------------
  // GOOGLE DRIVE & CLOUD BACKUP STATE
  // ----------------------------------------------------
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnectingDrive, setIsConnectingDrive] = useState(false);
  const [showWebhookFallback, setShowWebhookFallback] = useState(false);
  const [webhookInput, setWebhookInput] = useState(businessSettings.googleDriveWebhookUrl || '');

  const handleConnectOAuth = async () => {
    setIsConnectingDrive(true);
    try {
      await connectDriveOAuth();
      updateBusinessSettings({ googleDriveEnabled: true });
    } catch {
      // toast already shown in context
    } finally {
      setIsConnectingDrive(false);
    }
  };

  const handleDriveSyncNow = async () => {
    if (!isDriveConnected && !webhookInput && !businessSettings.googleDriveWebhookUrl) {
      showToast(lang === 'bn' ? 'আগে গুগল ড্রাইভ কানেক্ট করুন' : 'Please connect Google Drive first', 'danger');
      return;
    }
    setIsSyncing(true);
    if (webhookInput && webhookInput !== businessSettings.googleDriveWebhookUrl) {
      updateBusinessSettings({ googleDriveWebhookUrl: webhookInput, googleDriveEnabled: true });
    }
    await syncToGoogleDrive(webhookInput || null);
    setIsSyncing(false);
  };

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      importAllData(event.target.result);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!activeTool) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      {/* ======================================================== */}
      {/* 1. QUICK FLOATING CALCULATOR */}
      {/* ======================================================== */}
      {activeTool === 'calculator' && (
        <div className="modal-content animate-fade-in" style={{ maxWidth: '340px', width: '92%', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calculator size={18} style={{ color: 'var(--mode-color)' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0 }}>
                {lang === 'bn' ? 'দ্রুত ক্যালকুলেটর' : 'Quick Calculator'}
              </h3>
            </div>
            <button className="btn-icon" onClick={onClose}><X size={18} /></button>
          </div>

          {/* Calculator Screen */}
          <div style={{ background: '#0f172a', borderRadius: '10px', padding: '12px 14px', marginBottom: '1rem', textAlign: 'right', border: '1px solid #334155' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', minHeight: '18px', fontFamily: 'monospace' }}>
              {calcEquation}
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#38bdf8', fontFamily: 'monospace', overflowX: 'auto', letterSpacing: '1px' }}>
              {calcDisplay}
            </div>
            <button
              onClick={handleCopyCalc}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.7rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}
            >
              {calcCopied ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
              <span>{calcCopied ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : (lang === 'bn' ? 'কপি' : 'Copy')}</span>
            </button>
          </div>

          {/* Keypad Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {['C', 'CE', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '⌫', '='].map((key) => {
              const isOperator = ['+', '-', '×', '÷', '='].includes(key);
              const isAction = ['C', 'CE', '⌫', '%'].includes(key);
              return (
                <button
                  key={key}
                  onClick={() => handleCalcClick(key)}
                  style={{
                    padding: '14px 0',
                    fontSize: '1.1rem',
                    fontWeight: '800',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: key === '=' ? 'var(--mode-color)' : isOperator ? 'rgba(99, 102, 241, 0.15)' : isAction ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                    color: key === '=' ? '#ffffff' : isOperator ? 'var(--mode-color)' : 'var(--text-main)',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease',
                    boxShadow: key === '=' ? '0 2px 8px var(--mode-glow)' : 'none'
                  }}
                >
                  {key}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. DAILY CASH & DRAWER BALANCE */}
      {/* ======================================================== */}
      {activeTool === 'cash' && (
        <div className="modal-content animate-fade-in" style={{ maxWidth: '480px', width: '95%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                <Wallet size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>
                  {lang === 'bn' ? 'আজকের নগদ ক্যাশ ও ড্রয়ার ব্যালেন্স' : 'Daily Cash & Cash Drawer'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {lang === 'bn' ? `তারিখ: ${todayStr} (সারাদিনের ক্যাশ লেনদেন)` : `Date: ${todayStr}`}
                </p>
              </div>
            </div>
            <button className="btn-icon" onClick={onClose}><X size={18} /></button>
          </div>

          {profile === 'business' ? (
            <div>
              {/* Main Net Drawer Balance Card */}
              <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  {lang === 'bn' ? '💵 ক্যাশ ড্রয়ারে থাকা উচিত (Net Cash in Drawer)' : 'Net Cash in Drawer'}
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '900', color: netTodayCashDrawer >= 0 ? '#10b981' : '#ef4444', fontFamily: 'monospace' }}>
                  ৳{netTodayCashDrawer.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  {lang === 'bn' ? 'আজকের মোট নগদ জমা থেকে নগদ খরচ বাদ দিয়ে' : 'Total cash collected minus cash expenses'}
                </div>
              </div>

              {/* Cash In & Out Breakdown Table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={16} style={{ color: '#10b981' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{lang === 'bn' ? 'POS নগদ বিক্রয়:' : 'POS Cash Sales:'}</span>
                  </div>
                  <span style={{ fontWeight: '800', color: '#10b981', fontFamily: 'monospace' }}>+৳{todayCashSales.toLocaleString()}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={16} style={{ color: '#10b981' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{lang === 'bn' ? 'ইনভয়েস থেকে নগদ আদায় (কিস্তি):' : 'Invoice Cash Collected:'}</span>
                  </div>
                  <span style={{ fontWeight: '800', color: '#10b981', fontFamily: 'monospace' }}>+৳{todayCashInvoices.toLocaleString()}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingDown size={16} style={{ color: '#ef4444' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{lang === 'bn' ? 'আজকের নগদ খরচ (Expenses):' : 'Cash Expenses Paid:'}</span>
                  </div>
                  <span style={{ fontWeight: '800', color: '#ef4444', fontFamily: 'monospace' }}>-৳{todayCashExpenses.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  {lang === 'bn' ? 'আজকের অবশিষ্ট নগদ ব্যালেন্স' : 'Today Remaining Balance'}
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '900', color: netPersonalCash >= 0 ? '#10b981' : '#ef4444', fontFamily: 'monospace' }}>
                  ৳{netPersonalCash.toLocaleString()}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px' }}>
                  <span>{lang === 'bn' ? 'আজকের আয়:' : 'Today Income:'}</span>
                  <span style={{ fontWeight: '800', color: '#10b981' }}>+৳{todayPersonalIncome.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '8px' }}>
                  <span>{lang === 'bn' ? 'আজকের খরচ:' : 'Today Expense:'}</span>
                  <span style={{ fontWeight: '800', color: '#ef4444' }}>-৳{todayPersonalExpenses.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <button className="btn btn-secondary" style={{ width: '100%', marginTop: '1rem' }} onClick={onClose}>
            {t.close}
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. QUICK STICKY SCRATCHPAD & NOTES */}
      {/* ======================================================== */}
      {activeTool === 'notes' && (
        <div className="modal-content animate-fade-in" style={{ maxWidth: '520px', width: '95%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                <FileText size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>
                  {lang === 'bn' ? 'চিরকুট ও দ্রুত নোটপ্যাড' : 'Quick Sticky Scratchpad'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {lang === 'bn' ? 'কাস্টমারের ফোন, ঠিকানার চিরকুট বা প্রয়োজনীয় হিসাব লিখে রাখুন (স্বয়ংক্রিয় সেভ)' : 'Auto-saved persistent scratchpad'}
                </p>
              </div>
            </div>
            <button className="btn-icon" onClick={onClose}><X size={18} /></button>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <textarea
              className="input-field"
              rows="10"
              style={{
                fontFamily: "'Hind Siliguri', 'Plus Jakarta Sans', monospace",
                fontSize: '0.95rem',
                lineHeight: 1.6,
                padding: '12px',
                background: 'var(--bg-primary)',
                resize: 'vertical'
              }}
              placeholder={lang === 'bn' ? 'যেমন: \n১. হাজী সাহেবের চালের বস্তা ডেলিভারি দিতে হবে বিকাল ৫টায়\n২. সাপ্লায়ার মোশাররফ ভাই: 01712-XXXXXX\n৩. বকেয়া তাগাদা: রহমত আলী ৫,০০০ টাকা...' : 'Type notes, reminders, or draft calculations here...'}
              value={stickyNote}
              onChange={(e) => setStickyNote(e.target.value)}
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {stickyNote.length} {lang === 'bn' ? 'অক্ষর' : 'characters'}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-secondary"
                onClick={handleCopyNotes}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                {notesCopied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                <span>{notesCopied ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : (lang === 'bn' ? 'কপি করুন' : 'Copy')}</span>
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  if (window.confirm(lang === 'bn' ? 'নোট সম্পূর্ণ মুছে ফেলতে চান?' : 'Clear note?')) {
                    setStickyNote('');
                  }
                }}
                style={{ color: '#ef4444' }}
              >
                <Trash2 size={14} />
                <span>{lang === 'bn' ? 'মুছে ফেলুন' : 'Clear'}</span>
              </button>
              <button className="btn btn-primary" onClick={onClose}>
                {lang === 'bn' ? 'সম্পন্ন' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. GOOGLE DRIVE & COMPLETE BACKUP HUB */}
      {/* ======================================================== */}
      {activeTool === 'backup_hub' && (
        <div className="modal-content animate-fade-in" style={{ maxWidth: '640px', width: '95%', maxHeight: '92vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--business-primary)' }}>
                <Cloud size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>
                  {lang === 'bn' ? 'ক্লাউড ও লোকাল ব্যাকআপ হাব' : 'Cloud & Local Backup Hub'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {lang === 'bn' ? 'গুগল ড্রাইভ অটো-সিঙ্ক, স্ন্যাপশট ও ম্যানুয়াল JSON ব্যাকআপ' : 'Google Drive sync, local snapshots and JSON export'}
                </p>
              </div>
            </div>
            <button className="btn-icon" onClick={onClose}><X size={18} /></button>
          </div>

          {/* Section 1: Google Drive Cloud Sync */}
          <div style={{ background: 'var(--bg-primary)', padding: '1.15rem', borderRadius: '12px', border: isDriveConnected ? '1px solid #10b981' : '1px solid var(--border-color)', marginBottom: '1rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: isDriveConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(66, 133, 244, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDriveConnected ? '#10b981' : '#4285F4' }}>
                  <Cloud size={17} />
                </div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{lang === 'bn' ? 'গুগল ড্রাইভ ক্লাউড ব্যাকআপ' : 'Google Drive Cloud Backup'}</span>
                    {isDriveConnected && (
                      <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                        ✓ {lang === 'bn' ? 'সংযুক্ত' : 'Connected'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {businessSettings.googleDriveLastSync && (
                <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                  {lang === 'bn' ? 'সর্বশেষ সিঙ্ক:' : 'Synced:'} {businessSettings.googleDriveLastSync}
                </span>
              )}
            </div>

            {/* If Google Drive is Connected via OAuth */}
            {isDriveConnected ? (
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', padding: '10px 14px', border: '1px solid rgba(16, 185, 129, 0.25)', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {driveUser?.picture ? (
                      <img src={driveUser.picture} alt="Google Avatar" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                    ) : (
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#4285F4', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                        G
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                        {driveUser?.name || 'Google Drive'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {driveUser?.email || 'OAuth 2.0 Connected'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button
                      className="btn btn-primary"
                      onClick={handleDriveSyncNow}
                      disabled={isSyncing}
                      style={{ background: '#4285F4', borderColor: '#4285F4', fontSize: '0.82rem', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      {isSyncing ? <RefreshCw size={14} className="spin" /> : <Cloud size={14} />}
                      <span>{isSyncing ? (lang === 'bn' ? 'সিঙ্ক হচ্ছে...' : 'Syncing...') : (lang === 'bn' ? 'এখনই ব্যাকআপ নিন' : 'Backup Now')}</span>
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={switchDriveOAuth}
                      title={lang === 'bn' ? 'অন্য গুগল ড্রাইভ অ্যাকাউন্ট নির্বাচন করুন' : 'Switch Google Account'}
                      style={{ fontSize: '0.78rem', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <RefreshCw size={13} />
                      <span>{lang === 'bn' ? 'অ্যাকাউন্ট বদলান' : 'Switch'}</span>
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={disconnectDriveOAuth}
                      title={lang === 'bn' ? 'গুগল ড্রাইভ সংযোগ বিচ্ছিন্ন করুন' : 'Disconnect Google Drive'}
                      style={{ padding: '6px 10px', color: '#ef4444' }}
                    >
                      <LogOut size={14} />
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  📁 {lang === 'bn' ? 'গুগল ড্রাইভে ফোল্ডার: "HisabKitab-360-Backups" এ স্বয়ংক্রিয়ভাবে সেভ হয়।' : 'Saves directly to folder "HisabKitab-360-Backups".'}
                </div>
              </div>
            ) : (
              /* If Google Drive is Not Connected - Show 1-Click Connect Button */
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
                  {lang === 'bn'
                    ? '১-ক্লিকে আপনার গুগল অ্যাকাউন্ট যুক্ত করুন। কোনো ক্রেডিট কার্ড বা কোডিং ছাড়াই স্বয়ংক্রিয়ভাবে আপনার ড্রাইভের HisabKitab-360-Backups ফোল্ডারে ব্যাকআপ জমা হবে।'
                    : '1-Click Connect with Google Drive. Backs up your data directly to your Drive securely without any credit card.'}
                </p>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    className="btn btn-primary"
                    onClick={handleConnectOAuth}
                    disabled={isConnectingDrive}
                    style={{
                      background: '#4285F4',
                      borderColor: '#4285F4',
                      fontWeight: '700',
                      padding: '8px 18px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(66, 133, 244, 0.3)'
                    }}
                  >
                    {isConnectingDrive ? (
                      <RefreshCw size={16} className="spin" />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24">
                        <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                    )}
                    <span>{isConnectingDrive ? (lang === 'bn' ? 'কানেক্ট হচ্ছে...' : 'Connecting...') : (lang === 'bn' ? 'Google Drive দিয়ে কানেক্ট করুন' : 'Connect Google Drive')}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowWebhookFallback(!showWebhookFallback)}
                    style={{ fontSize: '0.78rem', padding: '6px 10px' }}
                  >
                    {showWebhookFallback ? (lang === 'bn' ? 'ওয়েবহুক অপশন লুকান' : 'Hide Webhook') : (lang === 'bn' ? 'অথবা Apps Script Webhook' : 'Or Apps Script Webhook')}
                  </button>
                </div>
              </div>
            )}

            {/* Optional Webhook Fallback Accordion */}
            {showWebhookFallback && !isDriveConnected && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed var(--border-color)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  {lang === 'bn' ? 'বিকল্প: Google Apps Script Webhook লিঙ্ক থাকলে এখানে পেস্ট করুন:' : 'Alternative: Google Apps Script Webhook URL:'}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="input-field"
                    style={{ flex: 1, fontSize: '0.82rem' }}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={webhookInput}
                    onChange={(e) => setWebhookInput(e.target.value)}
                  />
                  <button
                    className="btn btn-secondary"
                    onClick={handleDriveSyncNow}
                    disabled={isSyncing}
                    style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                  >
                    {isSyncing ? <RefreshCw size={13} className="spin" /> : <Cloud size={13} />}
                    <span>{lang === 'bn' ? 'ওয়েবহুকে সিঙ্ক' : 'Sync Webhook'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Instant Snapshot */}
          <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera size={16} style={{ color: '#10b981' }} />
                  <span>{lang === 'bn' ? 'ইনস্ট্যান্ট লোকাল স্ন্যাপশট ব্যাকআপ' : 'Local Snapshot Backup'}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {lang === 'bn' ? `বর্তমান স্ন্যাপশট সংখ্যা: ${snapshots.length} টি (১-ক্লিকে রিস্টোর করা যায়)` : `${snapshots.length} snapshots available`}
                </div>
              </div>

              <button
                className="btn btn-secondary"
                onClick={() => {
                  createAutoSnapshot(lang === 'bn' ? 'মেনু থেকে স্ন্যাপশট' : 'Manual Menu Snapshot');
                  showToast(lang === 'bn' ? 'নতুন স্ন্যাপশট ব্যাকআপ সংরক্ষিত হয়েছে!' : 'Snapshot created!');
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}
              >
                <Camera size={14} />
                <span>{lang === 'bn' ? 'স্ন্যাপশট নিন' : 'Take Snapshot'}</span>
              </button>
            </div>
          </div>

          {/* Section 3: Manual JSON Download & Restore */}
          <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '8px' }}>
              {lang === 'bn' ? 'ম্যানুয়াল ফাইল ব্যাকআপ (.JSON File)' : 'Manual File Backup (.JSON)'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                onClick={exportAllData}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Download size={15} />
                <span>{lang === 'bn' ? 'ব্যাকআপ ডাউনলোড' : 'Download Backup'}</span>
              </button>

              <label className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', margin: 0 }}>
                <Upload size={15} />
                <span>{lang === 'bn' ? 'ফাইল রিস্টোর' : 'Restore from File'}</span>
                <input
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={handleFileImport}
                />
              </label>
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%' }} onClick={onClose}>
            {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. KEYBOARD SHORTCUTS CHEAT SHEET */}
      {/* ======================================================== */}
      {activeTool === 'shortcuts' && (
        <div className="modal-content animate-fade-in" style={{ maxWidth: '440px', width: '95%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Keyboard size={18} style={{ color: 'var(--mode-color)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>
                {lang === 'bn' ? 'কীবোর্ড শর্টকাট গাইড' : 'Keyboard Shortcuts'}
              </h3>
            </div>
            <button className="btn-icon" onClick={onClose}><X size={18} /></button>
          </div>

          <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', marginBottom: '1.25rem' }}>
            <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  { key: 'Ctrl + P', desc: lang === 'bn' ? 'যেকোনো রসিদ বা ইনভয়েস প্রিন্ট' : 'Print Invoice / Receipt' },
                  { key: 'Ctrl + S', desc: lang === 'bn' ? 'স্বয়ংক্রিয় ব্যাকআপ স্ন্যাপশট' : 'Take Auto Snapshot' },
                  { key: 'Alt + C', desc: lang === 'bn' ? 'ক্যালকুলেটর চালু করুন' : 'Open Calculator' },
                  { key: 'Alt + N', desc: lang === 'bn' ? 'চিরকুট ও নোটপ্যাড' : 'Open Scratchpad' },
                  { key: 'F11', desc: lang === 'bn' ? 'ফুলস্ক্রিন POS ভিউ চালু/বন্ধ' : 'Toggle Fullscreen Mode' },
                  { key: 'Esc', desc: lang === 'bn' ? 'খোলা মোডাল বা ড্রপডাউন বন্ধ' : 'Close Active Modal' },
                ].map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', background: idx % 2 === 0 ? 'var(--bg-primary)' : 'transparent' }}>
                    <td style={{ padding: '8px 12px' }}>
                      <kbd style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '3px 8px', fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: '700' }}>
                        {row.key}
                      </kbd>
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-main)', fontSize: '0.82rem' }}>
                      {row.desc}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={onClose}>
            {t.close}
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. CATEGORIES HUB (ADD / RENAME / DELETE) */}
      {/* ======================================================== */}
      {activeTool === 'categories' && (
        <CategoryManagerModal
          isOpen={true}
          onClose={onClose}
          defaultGroup="debtPersonalRelations"
        />
      )}
    </div>
  );
};
