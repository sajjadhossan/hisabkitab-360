import React, { useState, Suspense, lazy } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { NotificationToast } from './components/common/NotificationToast';
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

// Helper for code-splitting named exports
const lazyNamed = (importFn, name) => lazy(() => importFn().then(m => ({ default: m[name] })));

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
import { AutoUpdateToast } from './components/common/AutoUpdateToast';
import { ErrorBoundary } from './components/common/ErrorBoundary';

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
  const {
    profile,
    activeTab,
    licenseInfo,
    setActiveTab,
    lang,
    theme,
    isModuleActive,
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
    showToast,
    isScreenLocked,
    lockScreen,
    unlockScreen,
    businessSettings,
    handleBarcodeScanned,
    products = [],
    salesHistory = [],
    debtRecords = []
  } = useApp();
  const { user, openAuthModal, isAuthModalOpen, closeAuthModal, isSuperAdmin } = useAuth();

  const [showNightlyPrompt, setShowNightlyPrompt] = useState(false);
  const [showAuditTrailModal, setShowAuditTrailModal] = useState(false);

  React.useEffect(() => {
    window.__openAuditTrail = () => setShowAuditTrailModal(true);
    return () => {
      delete window.__openAuditTrail;
    };
  }, []);

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
      if (evt?.eventType === 'sale_created') {
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
    // Strictly lock system until authenticated as requested by user
    if (!user) {
      return (
        <div style={{
          minHeight: '65vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '24px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '2px solid #ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            marginBottom: '1.25rem',
            boxShadow: '0 0 30px rgba(239, 68, 68, 0.25)',
            animation: 'pulse 2s infinite'
          }}>
            🔒
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '16px',
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#ef4444',
            fontWeight: '700',
            fontSize: '0.8rem',
            marginBottom: '10px'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
            <span>লাল বাতি: সিস্টেমে কোনো সক্রিয় লগইন নেই</span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '0 0 8px', color: 'var(--text-main)' }}>
            সুপাবেসের অনুমোদন ছাড়া সিস্টেমে প্রবেশ নিষেধ
          </h2>
          <p style={{ maxWidth: '520px', fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
            দোকানের হিসাব, পণ্য স্টক ও ক্যাশ কাউন্টারের তথ্য সম্পূর্ণ সুরক্ষিত রাখতে দয়া করে আপনার সুপাবেস একাউন্ট দিয়ে সাইন ইন করুন।
          </p>
          <button
            onClick={() => openAuthModal('login')}
            className="btn btn-primary"
            style={{
              padding: '12px 28px',
              fontSize: '1rem',
              fontWeight: '800',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              boxShadow: '0 4px 18px rgba(16, 185, 129, 0.4)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            🔐 সাইন ইন করুন (Sign In)
          </button>
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
          return <DebtKhataManager profile="personal" />;
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
          return <DebtKhataManager profile="business" />;
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
        case 'super_admin':
          return <SuperAdminPanel />;
        default:
          return <BusinessDashboard />;
      }
    }
  };

  const handlePullRefresh = React.useCallback(async () => {
    if (showToast) {
      showToast(lang === 'bn' ? 'সিস্টেম ডাটা রিফ্রেশ সম্পন্ন!' : 'System data refreshed!', 'success');
    }
  }, [showToast, lang]);

  return (
    <div className="app-container">
      <Navbar />
      <PullToRefresh onRefresh={handlePullRefresh}>
        <main className="main-content">
          <Suspense fallback={<ViewLoadingFallback />}>
            {renderContent()}
          </Suspense>
        </main>
      </PullToRefresh>
      <Suspense fallback={null}>
        <AuthModal />
        <ReceiptModal />
        <InvoicePrintModal />
        <QuotationPrintModal />
        <BarcodePrintModal />
        <BarcodeScannerModal />
        <ShareInvoiceModal />
        <HelpSupportModal />
        <GlobalVoiceWidget />
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
        <LiveCashCounterWidget />

        {/* Global Floating Quick Pad (Pocket Calculator, Scratchpad & Denomination Tool) */}
        <FloatingQuickPad />

        <ScreenLockModal
          isOpen={isScreenLocked}
          onClose={unlockScreen}
          businessSettings={businessSettings}
          lang={lang}
        />

        {/* Enterprise Security Audit Trail Modal */}
        <AuditTrailModal
          isOpen={showAuditTrailModal}
          onClose={() => setShowAuditTrailModal(false)}
          lang={lang}
        />

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
