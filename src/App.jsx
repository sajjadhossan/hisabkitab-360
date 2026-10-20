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
import { initChatRealtimeListener } from './services/internalChatService';
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

// Phase 9 Offline-First Synchronization & Backend Resilience
const OfflineCloudResilienceHubModal = lazyNamed(() => import('./components/offline/OfflineCloudResilienceHubModal'), 'OfflineCloudResilienceHubModal');

// Phase 10 Hardware Connectivity, Printing Engine & Business Scaling Hub
const HardwareScalingHubModal = lazyNamed(() => import('./components/hardware/HardwareScalingHubModal'), 'HardwareScalingHubModal');

// Field Force Live GPS Radar & Agent Tracking Modal
const FieldForceRadarModal = lazyNamed(() => import('./components/business/FieldForceRadarModal'), 'FieldForceRadarModal');

import { AutoUpdateToast } from './components/common/AutoUpdateToast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { DynamicBreadcrumbs } from './components/common/DynamicBreadcrumbs';
import { CommandPaletteModal } from './components/common/CommandPaletteModal';
import { UndoNotificationToast } from './components/common/UndoNotificationToast';
import { ThemeCustomizerModal } from './components/common/ThemeCustomizerModal';
import { initInactivityWatchdog } from './services/inactivityWatchdogService';
import { startStaffGpsTracker, stopStaffGpsTracker } from './services/fieldGpsTrackerService';
import { getStaffMenuPermissions, isMenuItemAllowedForRole, getFirstAllowedTabForRole } from './services/staffRolePermissionEngine';

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
    closeThemeCustomizer = () => {},
    activateSoftwareWithKey = () => {}
  } = appContext;
  const { user = null, openAuthModal = () => {}, isAuthModalOpen = false, closeAuthModal = () => {}, isSuperAdmin = false, isOwner = false, logout = () => {} } = useAuth() || {};

  const [unlockKeyInput, setUnlockKeyInput] = useState('');
  const [unlockError, setUnlockError] = useState('');
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

  // Phase 9 Offline & Cloud Resilience Modal State
  const [showOfflineCloudResilienceModal, setShowOfflineCloudResilienceModal] = useState(false);

  // Phase 10 Hardware Connectivity & Scaling Modal State
  const [showHardwareScalingModal, setShowHardwareScalingModal] = useState(false);

  // Field Force Live GPS Radar Modal State
  const [showFieldForceRadarModal, setShowFieldForceRadarModal] = useState(false);

  // Automatic Smart Pulse GPS Tracking for Field Agents
  React.useEffect(() => {
    if (user) {
      startStaffGpsTracker(user);
    } else {
      stopStaffGpsTracker();
    }
    return () => {
      stopStaffGpsTracker();
    };
  }, [user]);

  React.useEffect(() => {
    telemetryService.init();
    pwaSyncManager.register();
    window.__openAuditTrail = () => setShowAuditTrailModal(true);
    window.__openShortcutsGuide = () => setShowShortcutsModal(true);
    window.__openRbacSecurity = () => setShowRbacModal(true);
    window.__openBlindShiftHandover = () => setShowBlindShiftModal(true);
    window.__openAntiTheftAudit = () => setShowAntiTheftModal(true);
    window.__openFieldForceRadar = () => setShowFieldForceRadarModal(true);

    const handleOpenRbac = () => setShowRbacModal(true);
    window.addEventListener('hk360_open_rbac_security', handleOpenRbac);

    // Phase 7 Window Triggers
    window.__openFinancialIntelligence = () => setShowFinancialIntelligenceModal(true);
    window.__openBankMfsReconciliation = () => setShowBankMfsModal(true);
    window.__openClvIntelligence = () => setShowClvModal(true);

    // Phase 8 Window Triggers
    window.__openSpecializedVerticals = () => setShowSpecializedVerticalsModal(true);
    window.__openPharmacyClinical = () => setShowPharmacyClinicalModal(true);

    // Phase 9 Window Triggers
    window.__openOfflineCloudResilience = () => setShowOfflineCloudResilienceModal(true);

    // Phase 10 Window Triggers
    window.__openHardwareScaling = () => setShowHardwareScalingModal(true);

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
      delete window.__openFieldForceRadar;
      delete window.__openFinancialIntelligence;
      delete window.__openBankMfsReconciliation;
      delete window.__openClvIntelligence;
      delete window.__openSpecializedVerticals;
      delete window.__openPharmacyClinical;
      delete window.__openOfflineCloudResilience;
      delete window.__openHardwareScaling;
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

  // Strict Staff Route Guard: Protect against unauthorized direct tab navigation
  React.useEffect(() => {
    if (!user || isSuperAdmin || isOwner) return;

    // Only guard if user is a restricted staff role
    const staffRole = user.role || (user.isCashier ? 'cashier' : (user.isSalesman ? 'salesman' : null));
    if (!staffRole) return;

    const staffMenuPerms = getStaffMenuPermissions(businessSettings);
    const isAllowed = isMenuItemAllowedForRole(activeTab, staffRole, staffMenuPerms, false, false);

    // If active tab is not allowed for this staff role, gracefully route to their first allowed tab
    if (!isAllowed) {
      const fallbackTab = getFirstAllowedTabForRole(staffRole, staffMenuPerms);
      if (fallbackTab && fallbackTab !== activeTab) {
        setActiveTab(fallbackTab);
        showToast(
          lang === 'bn'
            ? '⛔ এই মডিউলে প্রবেশের অনুমতি আপনার রোলের জন্য বন্ধ রয়েছে।'
            : '⛔ Access to this module is restricted for your role.',
          'warning'
        );
      }
    }
  }, [activeTab, user, isSuperAdmin, isOwner, businessSettings?.staffMenuPermissions]);

  // Initialize Native Android Hardware Handlers & Fast Live Engines
  React.useEffect(() => {
    initNativeKeyboardListeners();
    hideNativeSplashScreen(350);
    initHardwareBarcodeScannerListener();
    initPowerOptimizer();
    initFastOfflineCache();
    initOfflineSyncEngine();

    const unsubChat = initChatRealtimeListener((incomingMsg) => {
      const cur = appStateRef.current;
      if (cur?.showToast) {
        const isFromSuper = incomingMsg.senderRole === 'Super Admin' || incomingMsg.senderId === 'super_admin';
        cur.showToast(
          isFromSuper
            ? (cur.lang === 'bn' ? `🛡️ সুপার এডমিনের নতুন বার্তা: "${incomingMsg.text || 'নতুন বার্তা'}"` : `🛡️ Super Admin: "${incomingMsg.text || 'New message'}"`)
            : (cur.lang === 'bn' ? `💬 ${incomingMsg.senderName || 'টিম'}: "${incomingMsg.text || 'নতুন বার্তা'}"` : `💬 ${incomingMsg.senderName || 'Team'}: "${incomingMsg.text || 'New message'}"`),
          'info'
        );
      }
    });

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
      if (unsubChat) unsubChat();
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
    const sp = new URLSearchParams(window.location.search);
    return sp.get('verify') || sp.get('id') || sp.get('doc');
  });
  const [tokenParam, setTokenParam] = useState(() => {
    const sp = new URLSearchParams(window.location.search);
    return sp.get('data') || sp.get('sig');
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

    // Commercial License Gate: Check if user is pending approval, expired, suspended, or unlicensed
    const isLicenseActive = licenseInfo?.status === 'active' || isSuperAdmin || user?.isStaffUser || user?.isCounterUser;
    const isLockedOut = !isLicenseActive && activeTab !== 'super_admin';

    if (isLockedOut) {
      const isPending = licenseInfo?.status === 'pending_approval' || licenseInfo?.status === 'unlicensed' || !licenseInfo?.status;
      const isSuspended = licenseInfo?.status === 'suspended';

      const clientName = user?.name || 'ব্যবহারকারী';
      const clientShop = user?.shopName || licenseInfo?.clientShopName || 'আমার প্রতিষ্ঠান';
      const clientEmail = user?.email || licenseInfo?.clientEmail || '';
      const clientPhone = user?.phone || '';

      const resellerPhone = licenseInfo?.resellerPhone || '+880 1700-000000';
      const rawWaPhone = resellerPhone.replace(/[^0-9]/g, '');
      const waNumber = rawWaPhone.startsWith('880') ? rawWaPhone : `880${rawWaPhone.replace(/^0+/, '')}`;

      const waMessage = encodeURIComponent(
        `হ্যালো সাজ্জাদ ভাই, আমি হিসাবকিতাব ৩৬০-এ নতুন অ্যাকাউন্ট খুলেছি।\n` +
        `প্রতিষ্ঠান: ${clientShop}\n` +
        `নাম: ${clientName}\n` +
        `ইমেইল: ${clientEmail}\n` +
        `${clientPhone ? `মোবাইল: ${clientPhone}\n` : ''}` +
        `অনুগ্রহ করে আমার সফটওয়্যার লাইসেন্সটি সক্রিয় করে দিন।`
      );

      const handleQuickUnlock = (e) => {
        e.preventDefault();
        setUnlockError('');
        if (!unlockKeyInput.trim()) {
          setUnlockError('অনুগ্রহ করে লাইসেন্স কি প্রবেশ করান');
          return;
        }
        const res = activateSoftwareWithKey(unlockKeyInput.trim(), clientEmail);
        if (!res?.success) {
          setUnlockError(res?.message || 'অবৈধ লাইসেন্স কি!');
        } else {
          setUnlockKeyInput('');
        }
      };

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
          {/* Status Badge & Icon */}
          <div style={{
            width: '84px',
            height: '84px',
            borderRadius: '24px',
            background: isPending 
              ? 'rgba(245, 158, 11, 0.12)' 
              : 'rgba(239, 68, 68, 0.12)',
            border: `2px solid ${isPending ? '#f59e0b' : '#ef4444'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            marginBottom: '1.25rem',
            boxShadow: `0 0 35px ${isPending ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
          }}>
            {isPending ? '⏳' : isSuspended ? '⛔' : '⚠️'}
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '20px',
            background: isPending ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: isPending ? '#f59e0b' : '#ef4444',
            fontWeight: '800',
            fontSize: '0.82rem',
            marginBottom: '12px'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isPending ? '#f59e0b' : '#ef4444', display: 'inline-block' }} />
            <span>
              {isPending 
                ? 'অ্যাকাউন্ট অনুমোদনের অপেক্ষায় (Pending Master Approval)' 
                : isSuspended 
                  ? 'লাইসেন্স সাময়িক স্থগিত (Suspended)' 
                  : 'লাইসেন্সের মেয়াদ শেষ (License Expired)'}
            </span>
          </div>

          <h2 style={{ fontSize: '1.65rem', fontWeight: '900', margin: '0 0 10px', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {isPending 
              ? 'লাইসেন্স অনুমোদন প্রয়োজন' 
              : isSuspended 
                ? 'সফটওয়্যার এক্সেস স্থগিত রয়েছে' 
                : 'সফটওয়্যার লাইসেন্সের মেয়াদ শেষ হয়েছে'}
          </h2>

          <p style={{ maxWidth: '520px', fontSize: '0.94rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
            {isPending
              ? 'আপনার অ্যাকাউন্টটি সফলভাবে তৈরি হয়েছে। হিসাবকিতাব ৩৬০ একটি বাণিজ্যিক ব্যবসায়িক সফটওয়্যার। আপনার প্রতিষ্ঠানের জন্য সফটওয়্যার লাইসেন্স সক্রিয় করতে অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন অথবা লাইসেন্স কি প্রবেশ করান।'
              : `আপনার প্রতিষ্ঠান "${clientShop}" এর লাইসেন্স পুনরায় সচল করতে অবিলম্বে সফটওয়্যার প্রোভাইডারের সাথে যোগাযোগ করুন।`}
          </p>

          {/* Account Summary Card */}
          <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            padding: '1.25rem 1.5rem',
            borderRadius: '14px',
            marginBottom: '1.5rem',
            textAlign: 'left',
            maxWidth: '460px',
            width: '100%',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              নিবন্ধিত ক্লায়েন্ট তথ্য:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.88rem', color: 'var(--text-main)' }}>
              <div>🏢 প্রতিষ্ঠান: <strong>{clientShop}</strong></div>
              <div>👤 স্বত্বাধিকারী: <strong>{clientName}</strong></div>
              <div>📧 ইমেইল: <code>{clientEmail}</code></div>
              {clientPhone && <div>📞 ফোন: <strong>{clientPhone}</strong></div>}
            </div>
          </div>

          {/* Direct Support & Approval Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1.75rem', maxWidth: '460px', width: '100%' }}>
            <a
              href={`https://wa.me/${waNumber}?text=${waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-icon-label"
              style={{
                flex: '1 1 min(100%, 200px)',
                minHeight: '46px',
                padding: '12px 18px',
                fontSize: '0.92rem',
                fontWeight: '800',
                borderRadius: '10px',
                background: '#25d366',
                color: '#fff',
                border: 'none',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                lineHeight: 1.25,
                boxShadow: '0 4px 15px rgba(37, 211, 102, 0.35)',
                boxSizing: 'border-box'
              }}
            >
              <span>💬 হোয়াটসঅ্যাপে অনুমোদন চান</span>
            </a>

            <a
              href={`tel:${resellerPhone.replace(/[\s\-]/g, '')}`}
              className="btn btn-icon-label"
              style={{
                flex: '1 1 min(100%, 200px)',
                minHeight: '46px',
                padding: '12px 18px',
                fontSize: '0.92rem',
                fontWeight: '800',
                borderRadius: '10px',
                background: 'var(--card-bg)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                lineHeight: 1.25,
                boxSizing: 'border-box'
              }}
            >
              <span>📞 সরাসরি কল করুন</span>
            </a>
          </div>

          {/* Instant License Key Activation Form */}
          <form onSubmit={handleQuickUnlock} style={{ maxWidth: '460px', width: '100%', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px', textAlign: 'left' }}>
              আপনার কাছে লাইসেন্স কি থাকলে লিখুন:
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={unlockKeyInput}
                onChange={(e) => setUnlockKeyInput(e.target.value)}
                placeholder="HK360-XXXX-2026-..."
                className="input-field"
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.88rem',
                  fontWeight: '700'
                }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '0.88rem',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                সক্রিয় করুন
              </button>
            </div>
            {unlockError && (
              <div style={{ color: '#ef4444', fontSize: '0.82rem', fontWeight: '700', marginTop: '6px', textAlign: 'left' }}>
                {unlockError}
              </div>
            )}
          </form>

          {/* Secondary Utility Controls */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => {
                if (showToast) showToast('অনুমোদন স্ট্যাটাস রিফ্রেশ করা হচ্ছে...', 'info');
                window.location.reload();
              }}
              className="btn btn-secondary"
              style={{
                padding: '8px 16px',
                fontSize: '0.82rem',
                borderRadius: '8px',
                background: 'transparent',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer'
              }}
            >
              🔄 স্ট্যাটাস রিফ্রেশ
            </button>

            <button
              onClick={() => setActiveTab('super_admin')}
              className="btn"
              style={{
                padding: '8px 16px',
                fontSize: '0.82rem',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              🛡️ মাস্টার অ্যাডমিন লগইন
            </button>

            <button
              onClick={logout}
              className="btn"
              style={{
                padding: '8px 16px',
                fontSize: '0.82rem',
                borderRadius: '8px',
                background: 'transparent',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer'
              }}
            >
              🚪 সাইন আউট (Sign Out)
            </button>
          </div>
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

        {/* Phase 9 Features 81-90: Offline Engine & Cloud Resilience Hub Modal */}
        {showOfflineCloudResilienceModal && (
          <OfflineCloudResilienceHubModal
            isOpen={showOfflineCloudResilienceModal}
            onClose={() => setShowOfflineCloudResilienceModal(false)}
            lang={lang}
          />
        )}

        {/* Phase 10 Features 91-100: Hardware Connectivity, Printing & Business Scale Modal */}
        {showHardwareScalingModal && (
          <HardwareScalingHubModal
            isOpen={showHardwareScalingModal}
            onClose={() => setShowHardwareScalingModal(false)}
            lang={lang}
          />
        )}

        {/* Field Force Live GPS Radar & Staff Monitoring Hub Modal */}
        {showFieldForceRadarModal && (
          <FieldForceRadarModal
            isOpen={showFieldForceRadarModal}
            onClose={() => setShowFieldForceRadarModal(false)}
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
