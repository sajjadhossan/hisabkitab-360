import React, { useState, Suspense, lazy } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { NotificationToast } from './components/common/NotificationToast';
import { ModernConfirmModal } from './components/common/ModernConfirmModal';
import { HealthcareProvider } from './context/HealthcareContext';
import { useAuth } from './context/AuthContext';
import { PullToRefresh } from './components/common/PullToRefresh';
import { SyncStatusIndicator } from './components/common/SyncStatusIndicator';
import { checkDailyScheduledNotifications } from './services/localNotificationService';
import { initPowerOptimizer } from './services/powerOptimizerService';
import { initFastOfflineCache } from './services/indexedDbCache';
import { initLiveSyncChannel, subscribeLiveSync } from './services/liveSyncService';
import { initOfflineSyncEngine } from './services/offlineSyncQueue';
import {
  syncNativeStatusBar,
  hideNativeSplashScreen,
  initNativeBackHandling,
  initNativeKeyboardListeners,
  initHardwareBarcodeScannerListener,
  onHardwareBarcodeScan,
  initHardwareVolumeKeyScanner,
  initInactivityAutoLock,
  checkNightlyBackupDue,
  markNightlyBackupPromptDone,
  triggerInstantWhatsAppSelfBackup,
  initDeepLinkHandler
} from './services/nativeAppService';
import { initGlobalShortcuts } from './services/shortcutService';
import { telemetryService } from './services/telemetryService';
import { pwaSyncManager } from './services/pwaSyncManager';

// Helper for code-splitting named exports
const lazyNamed = (importFn, name) => lazy(() => importFn().then(m => ({ default: m[name] })));

// Resilient boundary for floating widgets and secondary overlays so that
// any non-fatal widget issue never crashes the core app POS / Ledger
class SafeWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err) {
    console.warn('[SafeWidget] Non-fatal widget error suppressed:', err);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// Core Retail & ERP Hubs (Preloaded for 0ms Instant Zero-Lag Tab Switching)
import { DebtKhataManager } from './components/common/DebtKhataManager';
import { MasterHub } from './components/common/MasterHub';
import { BusinessDashboard } from './components/business/BusinessDashboard';
import { POSTerminal } from './components/business/POSTerminal';
import { InventoryManager } from './components/business/InventoryManager';
import { InvoicesManager } from './components/business/InvoicesManager';
import { BranchCashControlCenter } from './components/business/BranchCashControlCenter';
import { BusinessSettings } from './components/business/BusinessSettings';

// Personal Components (Code-split)
const PersonalDashboard = lazyNamed(() => import('./components/personal/PersonalDashboard'), 'PersonalDashboard');
const DailyExpenses = lazyNamed(() => import('./components/personal/DailyExpenses'), 'DailyExpenses');
const FamilyExpenses = lazyNamed(() => import('./components/personal/FamilyExpenses'), 'FamilyExpenses');
const PersonalEventsManager = lazyNamed(() => import('./components/personal/PersonalEventsManager'), 'PersonalEventsManager');
const PersonalIncome = lazyNamed(() => import('./components/personal/PersonalIncome'), 'PersonalIncome');
const PersonalAnalytics = lazyNamed(() => import('./components/personal/PersonalAnalytics'), 'PersonalAnalytics');

// Specialized Secondary Business Components (Code-split)
const QuotationsManager = lazyNamed(() => import('./components/business/QuotationsManager'), 'QuotationsManager');
const ERPAcounts = lazyNamed(() => import('./components/business/ERPAcounts'), 'ERPAcounts');
const CRMCustomers = lazyNamed(() => import('./components/business/CRMCustomers'), 'CRMCustomers');
const HRPayroll = lazyNamed(() => import('./components/business/HRPayroll'), 'HRPayroll');
const SRFieldManager = lazyNamed(() => import('./components/business/SRFieldManager'), 'SRFieldManager');
const SalesmanOrderBooking = lazyNamed(() => import('./components/business/SalesmanOrderBooking'), 'SalesmanOrderBooking');
const SRDeliveryHub = lazyNamed(() => import('./components/business/SRDeliveryHub'), 'SRDeliveryHub');
const BusinessPeriodicReportHub = lazyNamed(() => import('./components/business/BusinessPeriodicReportHub'), 'BusinessPeriodicReportHub');
const SuperAdminPanel = lazyNamed(() => import('./components/admin/SuperAdminPanel'), 'SuperAdminPanel');
import { CattleFarmHubView } from './components/pos/modals/CattleFarmModal';
const HealthcareHub = lazy(() => import('./components/healthcare/HealthcareHub'));

// On-Demand Modals & Widgets (Code-split to keep initial bundle ultra-lightweight)
const AuthModal = lazyNamed(() => import('./components/auth/AuthModal'), 'AuthModal');
const ReceiptModal = lazyNamed(() => import('./components/common/ReceiptModal'), 'ReceiptModal');
const InvoicePrintModal = lazyNamed(() => import('./components/common/InvoicePrintModal'), 'InvoicePrintModal');
const QuotationPrintModal = lazyNamed(() => import('./components/common/QuotationPrintModal'), 'QuotationPrintModal');
const BarcodePrintModal = lazyNamed(() => import('./components/common/BarcodePrintModal'), 'BarcodePrintModal');
const BarcodeScannerModal = lazyNamed(() => import('./components/common/BarcodeScannerModal'), 'BarcodeScannerModal');
const ShareInvoiceModal = lazyNamed(() => import('./components/common/ShareInvoiceModal'), 'ShareInvoiceModal');
const HelpSupportModal = lazyNamed(() => import('./components/common/HelpSupportModal'), 'HelpSupportModal');
const InvoiceVerificationView = lazyNamed(() => import('./components/common/InvoiceVerificationView'), 'InvoiceVerificationView');
const GlobalVoiceWidget = lazyNamed(() => import('./components/common/GlobalVoiceWidget'), 'GlobalVoiceWidget');
const ScreenLockModal = lazyNamed(() => import('./components/common/ScreenLockModal'), 'ScreenLockModal');
const CustomerMirrorDisplay = lazyNamed(() => import('./components/pos/CustomerMirrorDisplay'), 'CustomerMirrorDisplay');
const FloatingQuickPad = lazyNamed(() => import('./components/common/FloatingQuickPad'), 'FloatingQuickPad');
const LiveCashCounterWidget = lazyNamed(() => import('./components/common/LiveCashCounterWidget'), 'LiveCashCounterWidget');
const AuditTrailModal = lazyNamed(() => import('./components/admin/AuditTrailModal'), 'AuditTrailModal');
const KeyboardShortcutsModal = lazyNamed(() => import('./components/common/KeyboardShortcutsModal'), 'KeyboardShortcutsModal');

// Phase 6 Security, RBAC & Anti-Theft Audit Modules
const StaffRbacSecurityModal = lazyNamed(() => import('./components/security/StaffRbacSecurityModal'), 'StaffRbacSecurityModal');
const BlindShiftHandoverModal = lazyNamed(() => import('./components/security/BlindShiftHandoverModal'), 'BlindShiftHandoverModal');
const AntiTheftAuditHubModal = lazyNamed(() => import('./components/security/AntiTheftAuditHubModal'), 'AntiTheftAuditHubModal');
const AntiLeakWatermark = lazyNamed(() => import('./components/security/AntiLeakWatermark'), 'AntiLeakWatermark');

// Phase 7 Financial Intelligence & AI Insights Modules
const FinancialIntelligenceHubModal = lazyNamed(() => import('./components/intelligence/FinancialIntelligenceHubModal'), 'FinancialIntelligenceHubModal');
const BankMfsReconciliationModal = lazyNamed(() => import('./components/intelligence/BankMfsReconciliationModal'), 'BankMfsReconciliationModal');
const CustomerLifetimeValueModal = lazyNamed(() => import('./components/intelligence/CustomerLifetimeValueModal'), 'CustomerLifetimeValueModal');

// Phase 8 Specialized Verticals & Healthcare Pharmacy Suite
const SpecializedVerticalsHubModal = lazyNamed(() => import('./components/verticals/SpecializedVerticalsHubModal'), 'SpecializedVerticalsHubModal');
const PharmacyClinicalAssistanceModal = lazyNamed(() => import('./components/healthcare/PharmacyClinicalAssistanceModal'), 'PharmacyClinicalAssistanceModal');

import { AutoUpdateToast } from './components/common/AutoUpdateToast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { DynamicBreadcrumbs } from './components/common/DynamicBreadcrumbs';
import { CommandPaletteModal } from './components/common/CommandPaletteModal';
import { UndoNotificationToast } from './components/common/UndoNotificationToast';
import { ThemeCustomizerModal } from './components/common/ThemeCustomizerModal';
import { initInactivityWatchdog } from './services/inactivityWatchdogService';

// Shimmer skeleton loading fallback
const ViewLoadingFallback = () => (
  <div style={{ padding: '1.5rem', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="shimmer-skeleton" style={{ height: '36px', width: '220px', borderRadius: '10px' }} />
      <div className="shimmer-skeleton" style={{ height: '36px', width: '140px', borderRadius: '10px' }} />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
      <div className="shimmer-skeleton" style={{ height: '110px', borderRadius: '16px' }} />
      <div className="shimmer-skeleton" style={{ height: '110px', borderRadius: '16px' }} />
      <div className="shimmer-skeleton" style={{ height: '110px', borderRadius: '16px' }} />
      <div className="shimmer-skeleton" style={{ height: '110px', borderRadius: '16px' }} />
    </div>
    <div className="shimmer-skeleton" style={{ height: '320px', borderRadius: '16px' }} />
  </div>
);

const AppContent = () => {
  const appContext = useApp() || {};
  const {
    profile = 'business',
    activeTab = 'pos',
    licenseInfo,
    setActiveTab = () => {},
    lang = 'bn',
    theme = 'dark',
    isModuleActive = () => true,
    activeReceipt = null,
    setActiveReceipt = () => {},
    activeInvoicePrint = null,
    closeInvoicePrint = () => {},
    activeQuotationPrint = null,
    closeQuotationPrint = () => {},
    activeBarcodePrint = null,
    closeBarcodePrint = () => {},
    activeShareInvoice = null,
    closeShareInvoice = () => {},
    isHelpSupportOpen = false,
    closeHelpSupport = () => {},
    isScannerOpen = false,
    closeScanner = () => {},
    openScanner = () => {},
    showToast = () => {},
    isScreenLocked = false,
    lockScreen = () => {},
    unlockScreen = () => {},
    businessSettings = {},
    handleBarcodeScanned = () => {},
    products = [],
    salesHistory = [],
    debtRecords = [],
    isThemeCustomizerOpen = false,
    closeThemeCustomizer = () => {}
  } = appContext;
  const { user = null, openAuthModal = () => {}, isAuthModalOpen = false, closeAuthModal = () => {}, isSuperAdmin = false } = useAuth() || {};

  const [showNightlyPrompt, setShowNightlyPrompt] = useState(false);
  const [showAuditTrailModal, setShowAuditTrailModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Phase 6 Security & Anti-Theft Modal States
  const [showRbacModal, setShowRbacModal] = useState(false);
  const [showBlindShiftModal, setShowBlindShiftModal] = useState(false);
  const [showAntiTheftModal, setShowAntiTheftModal] = useState(false);

  // Phase 7 Financial Intelligence & AI Prediction Modal States
  const [showFinancialIntelligenceModal, setShowFinancialIntelligenceModal] = useState(false);
  const [showBankMfsModal, setShowBankMfsModal] = useState(false);
  const [showClvModal, setShowClvModal] = useState(false);

  // Phase 8 Specialized Verticals & Healthcare Pharmacy Modal States
  const [showSpecializedVerticalsModal, setShowSpecializedVerticalsModal] = useState(false);
  const [showPharmacyClinicalModal, setShowPharmacyClinicalModal] = useState(false);

  React.useEffect(() => {
    telemetryService.init();
    pwaSyncManager.register();
    window.__openAuditTrail = () => setShowAuditTrailModal(true);
    window.__openShortcutsGuide = () => setShowShortcutsModal(true);
    window.__openRbacSecurity = () => setShowRbacModal(true);
    window.__openBlindShiftHandover = () => setShowBlindShiftModal(true);
    window.__openAntiTheftAudit = () => setShowAntiTheftModal(true);

    // Phase 7 Window Triggers
    window.__openFinancialIntelligence = () => setShowFinancialIntelligenceModal(true);
    window.__openBankMfsReconciliation = () => setShowBankMfsModal(true);
    window.__openClvIntelligence = () => setShowClvModal(true);

    // Phase 8 Window Triggers
    window.__openSpecializedVerticals = () => setShowSpecializedVerticalsModal(true);
    window.__openPharmacyClinical = () => setShowPharmacyClinicalModal(true);

    // Phase 6 Feature 60: Auto-lock on inactivity
    const cleanupWatchdog = initInactivityWatchdog(() => {
      if (typeof lockScreen === 'function') {
        lockScreen();
      }
    });

    return () => {
      delete window.__openAuditTrail;
      delete window.__openShortcutsGuide;
      delete window.__openRbacSecurity;
      delete window.__openBlindShiftHandover;
      delete window.__openAntiTheftAudit;
      delete window.__openFinancialIntelligence;
      delete window.__openBankMfsReconciliation;
      delete window.__openClvIntelligence;
      delete window.__openSpecializedVerticals;
      delete window.__openPharmacyClinical;
      if (typeof cleanupWatchdog === 'function') cleanupWatchdog();
    };
  }, [lockScreen]);

  const appStateRef = React.useRef({});
  appStateRef.current = {
    user,
    isAuthModalOpen,
    closeAuthModal,
    activeReceipt,
    setActiveReceipt,
    activeInvoicePrint,
    closeInvoicePrint,
    activeQuotationPrint,
    closeQuotationPrint,
    activeBarcodePrint,
    closeBarcodePrint,
    activeShareInvoice,
    closeShareInvoice,
    isHelpSupportOpen,
    closeHelpSupport,
    isScannerOpen,
    closeScanner,
    openScanner,
    lockScreen,
    handleBarcodeScanned,
    activeTab,
    setActiveTab,
    lang,
    showToast
  };

  const tabHistoryRef = React.useRef(['dashboard']);
  React.useEffect(() => {
    if (activeTab) {
      const history = tabHistoryRef.current;
      const last = history[history.length - 1];
      if (last !== activeTab) {
        if (history.length > 25) history.shift();
        history.push(activeTab);
      }
    }
  }, [activeTab]);

  // Initialize Native Android Hardware Handlers & Fast Live Engines
  React.useEffect(() => {
    initNativeKeyboardListeners();
    hideNativeSplashScreen(350);
    initHardwareBarcodeScannerListener();
    initPowerOptimizer();
    initFastOfflineCache();
    initLiveSyncChannel();
    initOfflineSyncEngine();

    const unsubLive = subscribeLiveSync((evt) => {
      const cur = appStateRef.current;
      if (evt?.eventType === 'CLOUD_STATE_UPDATED') {
        if (cur.syncNowWithCloud) {
          cur.syncNowWithCloud({ silent: false });
        }
      } else if (evt?.eventType === 'sale_created') {
        if (cur.showToast) {
          cur.showToast(cur.lang === 'bn' ? '⚡ লাইভ ক্লাউড আপডেট: নতুন বিক্রি রেকর্ড হয়েছে' : '⚡ Live Sync: New sale recorded', 'info');
        }
      }
    });

    const unsubBarcode = onHardwareBarcodeScan((code) => {
      if (handleBarcodeScanned) {
        handleBarcodeScanned(code);
      }
    });

    // Hardware Volume Down/Up Key Barcode Scanner Trigger
    const unsubVolume = initHardwareVolumeKeyScanner(() => {
      const cur = appStateRef.current;
      if (cur.openScanner) {
        cur.openScanner((code) => {
          if (cur.handleBarcodeScanned) cur.handleBarcodeScanned(code);
        }, 'pos', 'barcode');
      }
    });

    // Inactivity Auto-lock (Locks POS counter after 10 mins of idle time)
    const unsubAutoLock = initInactivityAutoLock(() => {
      const cur = appStateRef.current;
      if (cur.lockScreen) {
        cur.lockScreen();
      }
    }, 10);

    // Nightly End-of-Day Backup Due Check
    if (checkNightlyBackupDue()) {
      setShowNightlyPrompt(true);
    }

    // Android Launcher App Shortcuts & Deep Linking
    initDeepLinkHandler((targetTab) => {
      const cur = appStateRef.current;
      if (cur.setActiveTab) {
        cur.setActiveTab(targetTab);
      }
    });

    initNativeBackHandling({
      onHomeExitNotice: () => {
        const cur = appStateRef.current;
        if (cur.showToast) {
          cur.showToast(
            cur.lang === 'bn' ? 'অ্যাপ থেকে বের হতে আর একবার ব্যাক বাটন চাপুন' : 'Press BACK again to exit app',
            'warning'
          );
        }
      },
      onNavigateBack: () => {
        const cur = appStateRef.current;
        // 1. Close open global modals sequentially
        if (cur.isAuthModalOpen && cur.user) {
          cur.closeAuthModal();
          return true;
        }
        if (cur.activeReceipt) {
          cur.setActiveReceipt(null);
          return true;
        }
        if (cur.activeInvoicePrint && cur.closeInvoicePrint) {
          cur.closeInvoicePrint();
          return true;
        }
        if (cur.activeQuotationPrint && cur.closeQuotationPrint) {
          cur.closeQuotationPrint();
          return true;
        }
        if (cur.activeBarcodePrint && cur.closeBarcodePrint) {
          cur.closeBarcodePrint();
          return true;
        }
        if (cur.activeShareInvoice && cur.closeShareInvoice) {
          cur.closeShareInvoice();
          return true;
        }
        if (cur.isScannerOpen && cur.closeScanner) {
          cur.closeScanner();
          return true;
        }
        if (cur.isHelpSupportOpen && cur.closeHelpSupport) {
          cur.closeHelpSupport();
          return true;
        }

        // 2. Sequential Step-by-Step Back Navigation through Tab History
        const history = tabHistoryRef.current;
        if (history.length > 1) {
          history.pop(); // Remove current active tab
          const prevTab = history[history.length - 1] || 'dashboard';
          cur.setActiveTab(prevTab);
          return true;
        }

        // 3. If in a sub-tab, return to home dashboard
        if (cur.activeTab !== 'dashboard') {
          cur.setActiveTab('dashboard');
          return true;
        }

        return false;
      },
      onNavigateHome: () => {
        const cur = appStateRef.current;
        if (cur.activeTab !== 'dashboard') {
          cur.setActiveTab('dashboard');
          return true;
        }
        return false;
      }
    });

    // Universal Global Hotkeys (F1, F2, F3, F4, Ctrl+Shift+L, Escape)
    const unsubShortcuts = initGlobalShortcuts({
      onNavigate: (tab) => {
        const cur = appStateRef.current;
        if (cur.setActiveTab) cur.setActiveTab(tab);
      },
      onToggleLock: () => {
        const cur = appStateRef.current;
        if (cur.lockScreen) cur.lockScreen();
      },
      onCloseModals: () => {
        const cur = appStateRef.current;
        if (cur.closeInvoicePrint) cur.closeInvoicePrint();
        if (cur.closeQuotationPrint) cur.closeQuotationPrint();
        if (cur.closeBarcodePrint) cur.closeBarcodePrint();
        if (cur.closeScanner) cur.closeScanner();
        if (cur.closeHelpSupport) cur.closeHelpSupport();
      },
      onOpenShortcutsGuide: () => {
        setShowShortcutsModal(true);
      },
      lang
    });

    return () => {
      unsubBarcode();
      if (unsubVolume) unsubVolume();
      if (unsubAutoLock) unsubAutoLock();
      if (unsubLive) unsubLive();
      if (unsubShortcuts) unsubShortcuts();
    };
  }, [lang]);

  // Synchronize Status Bar colors dynamically with Dark/Light theme
  React.useEffect(() => {
    syncNativeStatusBar(theme);
  }, [theme]);

  // Auto-redirect to Super Admin when opened from email password recovery link
  React.useEffect(() => {
    try {
      const hash = window.location.hash || '';
      if (hash.includes('type=recovery') || sessionStorage.getItem('hk360_password_recovery_active')) {
        setActiveTab('super_admin');
      }
    } catch {}
  }, [setActiveTab]);

  const [viewParam, setViewParam] = useState(() => {
    return new URLSearchParams(window.location.search).get('view');
  });

  // Handle Android App Shortcut ?tab= parameter
  React.useEffect(() => {
    const tabParam = new URLSearchParams(window.location.search).get('tab');
    if (tabParam && ['pos', 'debts', 'inventory', 'invoices', 'branch_control'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [setActiveTab]);

  // Check Daily Scheduled Local Notifications
  React.useEffect(() => {
    const todaySales = (salesHistory || []).reduce((acc, s) => acc + (Number(s.grandTotal) || 0), 0);
    checkDailyScheduledNotifications({
      overdueDebtsCount: (debtRecords || []).length,
      todaySalesTotal: todaySales
    });
  }, [debtRecords, salesHistory]);

  const [verifyParam, setVerifyParam] = useState(() => {
    return new URLSearchParams(window.location.search).get('verify');
  });
  const [tokenParam, setTokenParam] = useState(() => {
    return new URLSearchParams(window.location.search).get('data');
  });

  const handleBackToApp = () => {
    const url = new URL(window.location);
    url.searchParams.delete('verify');
    url.searchParams.delete('data');
    url.searchParams.delete('view');
    window.history.replaceState({}, '', url);
    setVerifyParam(null);
    setViewParam(null);
  };

  const handlePullRefresh = React.useCallback(async () => {
    if (showToast) {
      showToast(lang === 'bn' ? 'সিস্টেম ডাটা রিফ্রেশ সম্পন্ন!' : 'System data refreshed!', 'success');
    }
  }, [showToast, lang]);

  // If opened in Customer-Facing Mirror Screen mode
  if (viewParam === 'customer_mirror') {
    return (
      <CustomerMirrorDisplay
        onExit={() => {
          const url = new URL(window.location);
          url.searchParams.delete('view');
          window.history.replaceState({}, '', url);
          setViewParam(null);
        }}
      />
    );
  }

  // If opened via QR code scan or link verification
  if (verifyParam) {
    return (
      <InvoiceVerificationView
        verifyId={verifyParam}
        tokenData={tokenParam}
        onBackToApp={handleBackToApp}
      />
    );
  }

  const renderContent = () => {
    // Strictly require authenticated session! (No bypass or backdoor allowed)
    if (!user) {
      return (
        <div style={{
          minHeight: '75vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: '84px',
            height: '84px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(99, 102, 241, 0.15))',
            border: '2px solid #10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.6rem',
            marginBottom: '1.25rem',
            boxShadow: '0 0 35px rgba(16, 185, 129, 0.25)'
          }}>
            🔐
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '20px',
            background: 'rgba(56, 189, 248, 0.12)',
            color: '#38bdf8',
            fontWeight: '700',
            fontSize: '0.82rem',
            marginBottom: '12px'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8', display: 'inline-block' }} />
            <span>হিসাবকিতাব ৩৬০ - সিকিউর প্রফেশনাল প্ল্যাটফর্ম</span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', margin: '0 0 10px', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            নিরাপদ সাইন ইন প্রয়োজন
          </h2>
          <p style={{ maxWidth: '520px', fontSize: '0.94rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 1.75rem' }}>
            অ্যাপ্লিকেশনের ডেটা ও হিসাব সুরক্ষার জন্য সাইন ইন অথবা নতুন অ্যাকাউন্ট রেজিস্ট্রেশন বাধ্যতামূলক। এই ডিভাইসে পূর্বে অনুমোদিত অ্যাকাউন্ট থাকলে ইন্টারনেট ছাড়াও তাৎক্ষণিক লগইন করা যাবে।
          </p>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => openAuthModal('login')}
              className="btn btn-primary"
              style={{
                padding: '13px 28px',
                fontSize: '0.98rem',
                fontWeight: '800',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: '0 4px 18px rgba(16, 185, 129, 0.4)',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>🔐 সাইন ইন করুন (Sign In)</span>
            </button>
            <button
              onClick={() => openAuthModal('signup')}
              className="btn btn-secondary"
              style={{
                padding: '13px 26px',
                fontSize: '0.98rem',
                fontWeight: '700',
                borderRadius: '12px',
                background: 'var(--card-bg)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>📝 নতুন অ্যাকাউন্ট তৈরি (Sign Up)</span>
            </button>
          </div>
        </div>
      );
    }

    // Check if software is expired or suspended and current user is not super admin
    const isLockedOut = (licenseInfo?.status === 'expired' || licenseInfo?.status === 'suspended') && !isSuperAdmin && activeTab !== 'super_admin';
    if (isLockedOut) {
      return (
        <div style={{
          minHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: '85px',
            height: '85px',
            borderRadius: '24px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '2px solid #ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            marginBottom: '1.25rem',
            boxShadow: '0 0 30px rgba(239, 68, 68, 0.3)'
          }}>
            ⛔
          </div>
          <h2 style={{ fontSize: '1.7rem', fontWeight: '900', margin: '0 0 8px', color: '#ef4444' }}>
            {lang === 'bn' ? 'সফটওয়্যার লাইসেন্সের মেয়াদ শেষ হয়েছে' : 'Software License Expired'}
          </h2>
          <p style={{ maxWidth: '520px', fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
            {lang === 'bn'
              ? `আপনার প্রতিষ্ঠান "${licenseInfo?.clientShopName || 'দোকান'}" এর সাবস্ক্রিপশন মেয়াদ শেষ। সফটওয়্যারটি পুনরায় সচল করতে অবিলম্বে সফটওয়্যার প্রোভাইডারের সাথে যোগাযোগ করুন।`
              : 'Your software subscription has expired. Please contact the vendor to renew your license.'}
          </p>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            textAlign: 'left',
            minWidth: '320px'
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>সফটওয়্যার প্রোভাইডার:</div>
            <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)', marginBottom: '8px' }}>
              {licenseInfo?.resellerName || 'হিসাব কিতাব ৩৬০ টেকনোলজিস'}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
              📞 হটলাইন: <strong>{licenseInfo?.resellerPhone || '+880 1700-000000'}</strong>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('super_admin')}
            className="btn"
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              border: '1px solid #ef4444',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            🛡️ ভেন্ডর মাস্টার পিন দিয়ে আনলক করুন
          </button>
        </div>
      );
    }

    // Super Admin & Master Control must always be accessible from any profile or operating mode
    if (activeTab === 'super_admin') {
      return <SuperAdminPanel />;
    }

    if (profile === 'personal') {
      switch (activeTab) {
        case 'dashboard':
          return <PersonalDashboard />;
        case 'daily':
          return <DailyExpenses />;
        case 'family':
          return <FamilyExpenses />;
        case 'events':
          return <PersonalEventsManager />;
        case 'debts':
          return (
            <ErrorBoundary>
              <DebtKhataManager profile="personal" />
            </ErrorBoundary>
          );
        case 'income':
          return <PersonalIncome />;
        case 'analytics':
          return <PersonalAnalytics />;
        case 'super_admin':
          return <SuperAdminPanel />;
        default:
          return <PersonalDashboard />;
      }
    } else {
      switch (activeTab) {
        case 'dashboard':
          return <BusinessDashboard />;
        case 'pos':
          return (
            <ErrorBoundary>
              <POSTerminal />
            </ErrorBoundary>
          );
        case 'debts':
          return (
            <ErrorBoundary>
              <DebtKhataManager profile="business" />
            </ErrorBoundary>
          );
        case 'invoices':
          return <InvoicesManager />;
        case 'quotations':
          return <QuotationsManager />;
        case 'inventory':
          return <InventoryManager />;
        case 'erp':
          return <ERPAcounts />;
        case 'crm':
          return <CRMCustomers />;
        case 'hr':
          return <HRPayroll />;
        case 'sr':
          return <SRFieldManager />;
        case 'salesman_order':
          return <SalesmanOrderBooking onSwitchToSR={() => setActiveTab('sr_delivery')} />;
        case 'sr_delivery':
          return <SRDeliveryHub onSwitchToSalesman={() => setActiveTab('salesman_order')} />;
        case 'branch_control':
          return <BranchCashControlCenter />;
        case 'settings':
          return <BusinessSettings />;
        case 'cattle':
          return <CattleFarmHubView onClose={() => setActiveTab('pos')} />;
        case 'healthcare':
          return <HealthcareHub />;
        case 'master_hub':
          return <MasterHub onNavigateToPos={() => setActiveTab('pos')} onNavigateToInventory={() => setActiveTab('inventory')} />;
        case 'reports':
          return <BusinessPeriodicReportHub />;
        case 'super_admin':
          return <SuperAdminPanel />;
        default:
          return <BusinessDashboard />;
      }
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <PullToRefresh onRefresh={handlePullRefresh}>
        <main className="main-content">
          <DynamicBreadcrumbs />
          <Suspense fallback={<ViewLoadingFallback />}>
            {renderContent()}
          </Suspense>
        </main>
      </PullToRefresh>
      <Suspense fallback={null}>
        {isAuthModalOpen && <AuthModal />}
        {activeReceipt && <ReceiptModal />}
        {activeInvoicePrint && <InvoicePrintModal />}
        {activeQuotationPrint && <QuotationPrintModal />}
        {activeBarcodePrint && <BarcodePrintModal />}
        {isScannerOpen && <BarcodeScannerModal />}
        {activeShareInvoice && <ShareInvoiceModal />}
        {isHelpSupportOpen && <HelpSupportModal />}
        <SafeWidget>
          <GlobalVoiceWidget />
        </SafeWidget>
      </Suspense>
      <NotificationToast />
      <SyncStatusIndicator />

      {/* Nightly End-of-Day Backup Reminder Prompt */}
      {showNightlyPrompt && (
        <div
          className="animate-slide-up"
          style={{
            position: 'fixed',
            bottom: '72px',
            left: '12px',
            right: '12px',
            maxWidth: '460px',
            margin: '0 auto',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.98))',
            border: '1.5px solid rgba(16, 185, 129, 0.5)',
            borderRadius: '16px',
            padding: '12px 14px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <span style={{ fontSize: '1.6rem' }}>🌙</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.84rem', fontWeight: '800', color: '#ffffff' }}>
                {lang === 'bn' ? 'রাত্রিকালীন ক্লোজিং ব্যাকআপ' : 'Nightly Closing Backup'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                {lang === 'bn' ? 'আজকের বিক্রয় ও খাতার ডাটা সুরক্ষিত রাখুন' : 'Safeguard today’s sales & ledger records'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => {
                triggerInstantWhatsAppSelfBackup({
                  businessSettings,
                  productsCount: products?.length || 0,
                  salesCount: salesHistory?.length || 0,
                  customersCount: debtRecords?.length || 0,
                  lang,
                  exportDataJson: JSON.stringify({
                    backupDate: new Date().toISOString(),
                    products: products || [],
                    salesHistory: salesHistory || [],
                    debtRecords: debtRecords || []
                  }, null, 2)
                });
                markNightlyBackupPromptDone();
                setShowNightlyPrompt(false);
              }}
              style={{
                background: '#25D366',
                color: '#ffffff',
                border: 'none',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '0.76rem',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              {lang === 'bn' ? 'হোয়াটসঅ্যাপ' : 'WhatsApp'}
            </button>
            <button
              type="button"
              onClick={() => {
                markNightlyBackupPromptDone();
                setShowNightlyPrompt(false);
              }}
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: '#94a3b8',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <Suspense fallback={null}>
        {/* Live Floating Cash Counter & Drawer Balance Pill */}
        <SafeWidget>
          <LiveCashCounterWidget />
        </SafeWidget>

        {/* Global Floating Quick Pad (Pocket Calculator, Scratchpad & Denomination Tool) */}
        <SafeWidget>
          <FloatingQuickPad />
        </SafeWidget>

        {isScreenLocked && (
          <ScreenLockModal
            isOpen={isScreenLocked}
            onClose={unlockScreen}
            businessSettings={businessSettings}
            lang={lang}
          />
        )}

        {/* Enterprise Security Audit Trail Modal */}
        {showAuditTrailModal && (
          <AuditTrailModal
            isOpen={showAuditTrailModal}
            onClose={() => setShowAuditTrailModal(false)}
            lang={lang}
          />
        )}

        {/* Desktop & PC Keyboard Shortcuts Guide Modal */}
        {showShortcutsModal && (
          <KeyboardShortcutsModal
            isOpen={showShortcutsModal}
            onClose={() => setShowShortcutsModal(false)}
            onNavigate={(tab) => {
              if (tab === 'quickpad') {
                const btn = document.querySelector('button[aria-label="floating-quickpad"], .floating-quickpad-trigger');
                if (btn) btn.click();
              } else if (tab === 'voice') {
                const btn = document.querySelector('button[aria-label="voice-assistant"], .global-voice-trigger');
                if (btn) btn.click();
              } else {
                setActiveTab(tab);
              }
            }}
            onToggleLock={() => lockScreen && lockScreen()}
            lang={lang}
          />
        )}

        {/* Modern Glassmorphic Action & Confirm Dialog System */}
        <SafeWidget>
          <ModernConfirmModal />
        </SafeWidget>

        {/* Global Spotlight Search Command Palette (Ctrl+K) */}
        <SafeWidget>
          <CommandPaletteModal />
        </SafeWidget>

        {/* Interactive Undo Action Snackbar */}
        <SafeWidget>
          <UndoNotificationToast lang={lang} />
        </SafeWidget>

        {/* Phase 2: Theme Engine & Display Customizer Modal */}
        {isThemeCustomizerOpen && (
          <ThemeCustomizerModal
            isOpen={isThemeCustomizerOpen}
            onClose={closeThemeCustomizer}
          />
        )}

        {/* Phase 6 Feature 58: Dynamic Anti-Leak Security Watermark Overlay */}
        <SafeWidget>
          <AntiLeakWatermark />
        </SafeWidget>

        {/* Phase 6 Features 51, 57, 59, 60: Staff RBAC, Device Whitelisting & Emergency Lockdown Modal */}
        {showRbacModal && (
          <StaffRbacSecurityModal
            isOpen={showRbacModal}
            onClose={() => setShowRbacModal(false)}
            lang={lang}
          />
        )}

        {/* Phase 6 Features 54, 56: Blind Shift Handover & Mid-Day Cash Drop Hub Modal */}
        {showBlindShiftModal && (
          <BlindShiftHandoverModal
            isOpen={showBlindShiftModal}
            onClose={() => setShowBlindShiftModal(false)}
            lang={lang}
          />
        )}

        {/* Phase 6 Features 52, 53, 55: Anti-Theft Audit & Fraud Prevention Hub Modal */}
        {showAntiTheftModal && (
          <AntiTheftAuditHubModal
            isOpen={showAntiTheftModal}
            onClose={() => setShowAntiTheftModal(false)}
            lang={lang}
          />
        )}

        {/* Phase 7 Features 61, 62, 63, 64, 67: Financial Intelligence & AI Predictions Modal */}
        {showFinancialIntelligenceModal && (
          <FinancialIntelligenceHubModal
            isOpen={showFinancialIntelligenceModal}
            onClose={() => setShowFinancialIntelligenceModal(false)}
            lang={lang}
          />
        )}

        {/* Phase 7 Features 66, 69: Bank & MFS Reconciliation & NBR VAT 6.3 Hub Modal */}
        {showBankMfsModal && (
          <BankMfsReconciliationModal
            isOpen={showBankMfsModal}
            onClose={() => setShowBankMfsModal(false)}
            lang={lang}
          />
        )}

        {/* Phase 7 Features 65, 68, 70: Customer Lifetime Value (CLV) & Voice Intelligence Modal */}
        {showClvModal && (
          <CustomerLifetimeValueModal
            isOpen={showClvModal}
            onClose={() => setShowClvModal(false)}
            lang={lang}
          />
        )}

        {/* Phase 8 Features 77, 78, 79, 80: Specialized Business Verticals Hub Modal */}
        {showSpecializedVerticalsModal && (
          <SpecializedVerticalsHubModal
            isOpen={showSpecializedVerticalsModal}
            onClose={() => setShowSpecializedVerticalsModal(false)}
            lang={lang}
          />
        )}

        {/* Phase 8 Features 71, 72, 73, 74, 75, 76: Healthcare & Pharmacy Clinical Suite Modal */}
        {showPharmacyClinicalModal && (
          <PharmacyClinicalAssistanceModal
            isOpen={showPharmacyClinicalModal}
            onClose={() => setShowPharmacyClinicalModal(false)}
            lang={lang}
          />
        )}

        {/* PWA & ServiceWorker Seamless Auto-Updater */}
        <AutoUpdateToast lang={lang} />
      </Suspense>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <HealthcareProvider>
          <AppContent />
        </HealthcareProvider>
      </AppProvider>
    </AuthProvider>
  );
}
