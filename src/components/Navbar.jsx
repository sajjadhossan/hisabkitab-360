import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { registerBackAction, hapticFeedback, triggerWhatsAppSelfBackup } from '../services/nativeAppService';
import {
  User,
  Briefcase,
  Moon,
  Sun,
  Globe,
  Download,
  LayoutDashboard,
  ShoppingCart,
  Home,
  Wallet,
  PieChart,
  ScanLine,
  Boxes,
  Calculator,
  Users,
  BadgeDollarSign,
  Settings,
  RefreshCw,
  FileText,
  FileCheck,
  MoreVertical,
  Cloud,
  Camera,
  Upload,
  Maximize2,
  Minimize2,
  Keyboard,
  HardDrive,
  CheckCircle2,
  HelpCircle,
  LogIn,
  LogOut,
  Database,
  ShieldCheck,
  HandCoins,
  Tag,
  Sparkles,
  FileSpreadsheet,
  Building2,
  FolderOpen,
  Menu,
  X,
  Search,
  ChevronRight,
  Activity,
  Volume2,
  VolumeX,
  Lock,
  Bell,
  AlertTriangle,
  TrendingDown,
  MessageCircle,
  Truck,
  Wheat,
  GitBranch,
  ExternalLink
} from 'lucide-react';
import { isSoundMuted, toggleSoundMute, playButtonClick, playSuccessChime } from '../services/soundFeedback';
import { QuickToolsModal } from './common/QuickToolsModal';
import { DataExportImportModal } from './common/DataExportImportModal';
import { MasterPinModal } from './admin/MasterPinModal';
import { SystemDiagnosticsModal } from './common/SystemDiagnosticsModal';
import { TemplateReviewModal } from './common/TemplateReviewModal';
import { PermissionManagerModal } from './common/PermissionManagerModal';

export const Navbar = () => {
  const {
    operatingMode,
    setOperatingMode,
    profile,
    setProfile,
    lang,
    setLang,
    theme,
    setTheme,
    densityMode,
    toggleDensityMode,
    activeTab,
    setActiveTab,
    t,
    exportAllData,
    importAllData,
    resetToDemo,
    createAutoSnapshot,
    syncToGoogleDrive,
    businessSettings,
    licenseInfo,
    showToast,
    isDriveConnected,
    openHelpSupport,
    openScanner,
    lockScreen,
    products = [],
    businessDebts = [],
    personalDebts = [],
    customers = [],
    salesHistory = []
  } = useApp();

  const {
    user,
    isAuthenticated,
    openAuthModal,
    logout,
    role,
    isOwner,
    isCashier,
    isSalesman,
    isSR,
    switchRole,
    isSupabaseActive,
    isSuperAdmin
  } = useAuth();

  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showAlertCenter, setShowAlertCenter] = useState(false);
  const [showMasterPinModal, setShowMasterPinModal] = useState(false);
  const [activeTool, setActiveTool] = useState(null); // 'calculator' | 'cash' | 'notes' | 'backup_hub' | 'shortcuts'
  const [showExportImportHub, setShowExportImportHub] = useState(false);
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showTemplateReviewModal, setShowTemplateReviewModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const [soundMuted, setSoundMuted] = useState(isSoundMuted());
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState('');
  const menuRef = useRef(null);
  const alertRef = useRef(null);
  const fileInputRef = useRef(null);

  // In-App Smart Alert Center calculations (Low stock & Pending debts)
  const lowStockAlerts = useMemo(() => {
    if (profile !== 'business') return [];
    return (products || []).filter(p => {
      const stock = Number(p.stock) || 0;
      const minStock = Number(p.minStock) || 5;
      return stock <= minStock;
    });
  }, [profile, products]);

  const debtAlerts = useMemo(() => {
    const list = profile === 'business' ? (businessDebts || []) : (personalDebts || []);
    return list.filter(d => (Number(d.netDebt) || Number(d.amount) || 0) > 0);
  }, [profile, businessDebts, personalDebts]);

  const totalAlertCount = lowStockAlerts.length + debtAlerts.length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
      if (alertRef.current && !alertRef.current.contains(e.target)) {
        setShowAlertCenter(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  // Listen to fullscreen changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Native Android Hardware Back Button Listeners for Mobile Drawer & Modals
  useEffect(() => {
    if (showMobileDrawer) {
      return registerBackAction(() => {
        setShowMobileDrawer(false);
        return true;
      });
    }
  }, [showMobileDrawer]);

  useEffect(() => {
    if (showAlertCenter) {
      return registerBackAction(() => {
        setShowAlertCenter(false);
        return true;
      });
    }
  }, [showAlertCenter]);

  useEffect(() => {
    if (showExportImportHub) {
      return registerBackAction(() => {
        setShowExportImportHub(false);
        return true;
      });
    }
  }, [showExportImportHub]);

  useEffect(() => {
    if (showDiagnosticsModal) {
      return registerBackAction(() => {
        setShowDiagnosticsModal(false);
        return true;
      });
    }
  }, [showDiagnosticsModal]);

  // Listen to keyboard shortcut for Super Admin (Ctrl+Shift+S or Alt+S) & All Menus Drawer (Alt+M or F4)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') || (e.altKey && e.key.toLowerCase() === 's')) {
        e.preventDefault();
        if (isSuperAdmin) {
          setActiveTab('super_admin');
          showToast(lang === 'bn' ? '🛡️ সুপার অ্যাডমিন প্যানেল খোলা হয়েছে' : 'Super Admin opened');
        } else {
          setShowMasterPinModal(true);
        }
      }
      if ((e.altKey && e.key.toLowerCase() === 'm') || e.key === 'F4') {
        e.preventDefault();
        setShowMobileDrawer(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSuperAdmin, lang, setActiveTab, showToast]);

  const toggleLanguage = () => {
    playButtonClick();
    setLang(lang === 'bn' ? 'en' : 'bn');
  };

  const toggleTheme = () => {
    playButtonClick();
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleToggleSound = () => {
    const muted = toggleSoundMute();
    setSoundMuted(muted);
    if (!muted) {
      playSuccessChime();
    } else {
      playButtonClick();
    }
    showToast(muted ? (lang === 'bn' ? '🔇 সাউন্ড মিউট করা হয়েছে' : 'Sound muted') : (lang === 'bn' ? '🔊 সাউন্ড সক্রিয় করা হয়েছে' : 'Sound enabled'));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setShowMoreMenu(false);
  };

  const handleQuickDriveSync = async () => {
    if (!isDriveConnected && !businessSettings.googleDriveWebhookUrl) {
      setActiveTool('backup_hub');
      setShowMoreMenu(false);
      return;
    }
    setIsDriveSyncing(true);
    await syncToGoogleDrive();
    setIsDriveSyncing(false);
    setShowMoreMenu(false);
  };

  const handleQuickSnapshot = () => {
    createAutoSnapshot(lang === 'bn' ? 'মেনু কুইক স্ন্যাপশট' : 'Menu Quick Snapshot');
    showToast(lang === 'bn' ? 'স্ন্যাপশট ব্যাকআপ সফলভাবে সংরক্ষিত হয়েছে!' : 'Snapshot saved!');
    setShowMoreMenu(false);
  };

  const handleFileRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      importAllData(event.target.result);
    };
    reader.readAsText(file);
    e.target.value = '';
    setShowMoreMenu(false);
  };

  // Estimate localStorage usage
  const getStorageSizeKb = () => {
    try {
      let total = 0;
      for (let x in localStorage) {
        if (localStorage.hasOwnProperty(x)) {
          total += ((localStorage[x].length + x.length) * 2);
        }
      }
      return (total / 1024).toFixed(1);
    } catch {
      return '120';
    }
  };

  const personalNavItems = useMemo(() => [
    { id: 'dashboard', label: t.personalNav?.dashboard || 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { id: 'daily', label: t.personalNav?.daily || 'দৈনন্দিন খরচ', icon: ShoppingCart },
    { id: 'family', label: t.personalNav?.family || 'পারিবারিক বাজেট', icon: Home },
    { id: 'events', label: t.personalNav?.events || (lang === 'bn' ? 'ইভেন্ট ও অনুষ্ঠান' : 'Events & Occasions'), icon: Sparkles },
    { id: 'debts', label: t.personalNav?.debts || (lang === 'bn' ? 'দেনা-পাওনা খাতা' : 'Debt Ledger'), icon: HandCoins },
    { id: 'income', label: t.personalNav?.income || 'আয় ও সঞ্চয়', icon: Wallet },
    { id: 'analytics', label: t.personalNav?.analytics || 'বিশ্লেষণ', icon: PieChart }
  ], [t.personalNav, lang]);

  const isModEnabled = useCallback((modId) => {
    // Core retail and management hubs are permanently active and fast-loaded
    if (['dashboard', 'branch_control', 'pos', 'debts', 'invoices', 'quotations', 'inventory', 'master_hub', 'erp', 'crm', 'hr', 'sr', 'settings', 'super_admin'].includes(modId)) {
      return true;
    }
    if (!licenseInfo?.modules) return true;
    return licenseInfo.modules[modId] !== false;
  }, [licenseInfo]);

  const businessNavItems = useMemo(() => [
    ...(isModEnabled('dashboard') ? [{ id: 'dashboard', label: t.businessNav?.dashboard || '📊 ড্যাশবোর্ড', icon: LayoutDashboard }] : []),
    ...(isModEnabled('branch_control') ? [{ id: 'branch_control', label: lang === 'bn' ? '🏢 ব্রাঞ্চ ও ক্যাশ' : '🏢 Branch & Cash Hub', icon: Building2, highlight: true }] : []),
    ...(isModEnabled('pos') ? [{ id: 'pos', label: t.businessNav?.pos || '⚡ পিওএস সেলস', icon: ScanLine, highlight: true }] : []),
    ...(isModEnabled('debts') ? [{ id: 'debts', label: t.businessNav?.debts || (lang === 'bn' ? '📒 দেনা-পাওনা' : 'Cash Debts'), icon: HandCoins }] : []),
    ...(isModEnabled('invoices') ? [{ id: 'invoices', label: t.businessNav?.invoices || '🧾 বিক্রয় মেমো', icon: FileText }] : []),
    ...(isModEnabled('quotations') ? [{ id: 'quotations', label: t.businessNav?.quotations || '📑 কোটেশন', icon: FileCheck }] : []),
    ...(isModEnabled('inventory') ? [{ id: 'inventory', label: t.businessNav?.inventory || '📦 ইনভেন্টরি স্টক', icon: Boxes }] : []),
    ...(isModEnabled('master_hub') ? [{ id: 'master_hub', label: lang === 'bn' ? '📁 মাস্টার ডাটা' : '📁 Master Setup Hub', icon: FolderOpen, highlight: true }] : []),
    ...(isModEnabled('erp') ? [{ id: 'erp', label: t.businessNav?.erp || '💹 হিসাব ও লাভ-ক্ষতি', icon: Calculator }] : []),
    ...(isModEnabled('crm') ? [{ id: 'crm', label: t.businessNav?.crm || '👥 কাস্টমার ডিরেক্টরি', icon: Users }] : []),
    ...(isModEnabled('hr') ? [{ id: 'hr', label: t.businessNav?.hr || '👔 স্টাফ ও বেতন', icon: BadgeDollarSign }] : []),
    ...(isModEnabled('sr') ? [{ id: 'sr', label: lang === 'bn' ? '🛵 এসআর ফিল্ড' : 'SR Field', icon: Users }] : []),
    { id: 'settings', label: t.businessNav?.settings || '⚙️ সেটিংস', icon: Settings },
    ...(isSuperAdmin ? [{ id: 'super_admin', label: lang === 'bn' ? '🛡️ সুপার অ্যাডমিন' : '🛡️ Super Admin', icon: ShieldCheck, highlight: true }] : [])
  ], [isModEnabled, t.businessNav, lang, isSuperAdmin]);

  const filteredBusinessNavItems = useMemo(() => {
    if (isOwner || isSuperAdmin || !isAuthenticated || !role || role === 'owner' || role === 'admin') {
      return businessNavItems;
    }
    if (role === 'cashier') {
      return businessNavItems.filter(i => ['pos', 'invoices', 'debts', 'master_hub', 'branch_control'].includes(i.id));
    } else if (role === 'salesman') {
      return businessNavItems.filter(i => ['pos', 'inventory', 'crm', 'master_hub'].includes(i.id));
    } else if (role === 'sr') {
      return businessNavItems.filter(i => ['sr', 'crm', 'debts', 'inventory'].includes(i.id));
    }
    return businessNavItems;
  }, [businessNavItems, isOwner, isSuperAdmin, isAuthenticated, role]);

  const navItems = useMemo(() => {
    return profile === 'personal' ? personalNavItems : filteredBusinessNavItems;
  }, [profile, personalNavItems, filteredBusinessNavItems]);

  const primaryQuickTabs = useMemo(() => {
    if (profile === 'business') {
      const candidates = [
        { id: 'dashboard', label: t.businessNav?.dashboard || (lang === 'bn' ? '📊 ড্যাশবোর্ড' : '📊 Dashboard'), icon: LayoutDashboard },
        { id: 'pos', label: t.businessNav?.pos || (lang === 'bn' ? '⚡ পিওএস সেলস' : '⚡ POS Terminal'), icon: ScanLine },
        { id: 'inventory', label: t.businessNav?.inventory || (lang === 'bn' ? '📦 ইনভেন্টরি স্টক' : '📦 Inventory'), icon: Boxes },
        { id: 'debts', label: t.businessNav?.debts || (lang === 'bn' ? '📒 দেনা-পাওনা' : '📒 Debt Ledger'), icon: HandCoins },
        { id: 'invoices', label: t.businessNav?.invoices || (lang === 'bn' ? '🧾 বিক্রয় মেমো' : '🧾 Invoices'), icon: FileText }
      ];
      return candidates.filter(c => isModEnabled(c.id));
    } else {
      return [
        { id: 'dashboard', label: lang === 'bn' ? '📊 ড্যাশবোর্ড' : '📊 Dashboard', icon: LayoutDashboard },
        { id: 'daily', label: lang === 'bn' ? '🛒 দৈনিক খরচ' : '🛒 Daily Expenses', icon: ShoppingCart },
        { id: 'family', label: lang === 'bn' ? '🏠 পারিবারিক খরচ' : '🏠 Family', icon: Home },
        { id: 'debts', label: lang === 'bn' ? '📒 দেনা-পাওনা' : '📒 Debt Ledger', icon: HandCoins },
        { id: 'income', label: lang === 'bn' ? '💵 ব্যক্তিগত আয়' : '💵 Income', icon: Wallet }
      ];
    }
  }, [profile, isModEnabled, t.businessNav, lang]);

  // Mobile Categorized Drawer Groups
  const businessDrawerGroups = [
    {
      title: lang === 'bn' ? '📱 মোবাইল স্পেশাল ও কুইক অ্যাকশন' : '📱 Mobile Quick POS & Scanner',
      items: [
        {
          id: 'drawer_quick_scanner',
          label: lang === 'bn' ? '📷 ক্যামেরা বারকোড স্ক্যানার' : 'Camera Barcode Scanner',
          desc: lang === 'bn' ? 'ক্যামেরা দিয়ে সরাসরি পণ্য স্ক্যান' : 'Fast camera barcode reader',
          icon: ScanLine,
          color: '#6366f1',
          badge: 'QUICK',
          isAction: () => {
            setShowMobileDrawer(false);
            openScanner(null, 'pos', 'barcode');
          }
        },
        {
          id: 'drawer_mobile_pos',
          label: lang === 'bn' ? '⚡ মোবাইল POS মোড' : 'Mobile POS Mode',
          desc: lang === 'bn' ? 'মোবাইলে হালকা ও দ্রুত বিক্রয় কাউন্টার' : 'Lightweight mobile checkout',
          icon: ShoppingCart,
          color: '#10b981',
          badge: 'LITE',
          isAction: () => {
            setShowMobileDrawer(false);
            setProfile('business');
            setActiveTab('pos');
          }
        }
      ]
    },
    {
      title: lang === 'bn' ? '🛒 বিক্রয়, মেমো ও বিলিং' : '🛒 Sales & Billing',
      items: [
        { id: 'pos', label: lang === 'bn' ? 'POS সেলস কাউন্টার' : 'POS Terminal', desc: lang === 'bn' ? 'দ্রুত খুচরা বিক্রয় ও বিল' : 'Retail checkout', icon: ScanLine, color: '#6366f1', badge: 'HOT' },
        { id: 'salesman_order', label: lang === 'bn' ? '📝 সেলসম্যান অর্ডার বুকিং' : '📝 Salesman Order Booking', desc: lang === 'bn' ? 'দোকানে ঘুরে অর্ডার কাটা' : 'Field retailer order booking', icon: FileText, color: '#4f46e5', badge: 'FIELD' },
        { id: 'sr_delivery', label: lang === 'bn' ? '🚚 এসআর ডেলিভারি হাব' : '🚚 SR Delivery & Cash Hub', desc: lang === 'bn' ? 'মাল ডেলিভারি ও টাকা আদায়' : 'Deliver orders & collect cash', icon: Truck, color: '#10b981', badge: 'SR' },
        { id: 'invoices', label: lang === 'bn' ? 'চালান ও ইনভয়েস' : 'Invoices & Bills', desc: lang === 'bn' ? 'সকল ইনভয়েস ও মেমো' : 'All sales history', icon: FileText, color: '#3b82f6' },
        { id: 'quotations', label: lang === 'bn' ? 'কোটেশন / এস্টিমেট' : 'Quotations', desc: lang === 'bn' ? 'আনুমানিক খরচের অফার' : 'Estimates & quotes', icon: FileCheck, color: '#06b6d4' },
        ...(isModEnabled('branch_control') ? [{ id: 'branch_control', label: lang === 'bn' ? '🏢 ব্রাঞ্চ ও ক্যাশ কন্ট্রোল' : '🏢 Branch & Cash Hub', desc: lang === 'bn' ? 'শাখা, কাউন্টার ও স্টাফ কন্ট্রোল' : 'Multi-branch cash & staff', icon: Building2, color: '#10b981', badge: 'PRO' }] : [])
      ]
    },
    {
      title: lang === 'bn' ? '📦 পণ্য, স্টক ও মাস্টার ডাটা' : '📦 Products & Inventory',
      items: [
        { id: 'inventory', label: lang === 'bn' ? 'মালামাল ও ইনভেন্টরি' : 'Inventory & Stock', desc: lang === 'bn' ? 'মজুদ স্টক ও ক্রয়মূল্য' : 'Stock & item catalog', icon: Boxes, color: '#10b981' },
        { id: 'master_hub', label: lang === 'bn' ? 'ফোল্ডার ও মাস্টার ডাটা' : 'Master Setup Hub', desc: lang === 'bn' ? 'এক ক্লিকে ফুল ডাটা সেটআপ' : 'Fast inventory setup', icon: FolderOpen, color: '#8b5cf6', badge: 'PRO' }
      ]
    },
    {
      title: lang === 'bn' ? '💰 হিসাব, দেনা-পাওনা ও ক্যাশ' : '💰 Ledger & Finance',
      items: [
        { id: 'debts', label: lang === 'bn' ? 'নগদ দেনা-পাওনা খাতা' : 'Debt & Credit Ledger', desc: lang === 'bn' ? 'কাস্টমার ও মহাজন বাকি' : 'Cash dues & credit', icon: HandCoins, color: '#f59e0b', badge: lang === 'bn' ? 'জরুরি' : 'Ledger' },
        { id: 'erp', label: lang === 'bn' ? 'ইআরপি ও লাভ-ক্ষতি' : 'ERP & Accounting', desc: lang === 'bn' ? 'ব্যবসায়িক খরচ ও প্রফিট' : 'Profit & loss overview', icon: Calculator, color: '#14b8a6' },
        { id: 'tool_cash', label: lang === 'bn' ? 'আজকের ক্যাশ ড্রয়ার' : 'Today Drawer Balance', desc: lang === 'bn' ? 'ক্যাশ ইন/আউট হিসাব' : 'Cash register status', icon: Wallet, color: '#10b981', isTool: 'cash' }
      ]
    },
    {
      title: lang === 'bn' ? '👥 কাস্টমার ও টিম' : '👥 CRM & Team',
      items: [
        { id: 'crm', label: lang === 'bn' ? 'কাস্টমার তালিকা (CRM)' : 'Customer CRM', desc: lang === 'bn' ? 'ক্রেতাদের ফোন ও বাকি' : 'Customer directory', icon: Users, color: '#6366f1' },
        { id: 'hr', label: lang === 'bn' ? 'কর্মচারী ও বেতন (HR)' : 'Staff & Payroll', desc: lang === 'bn' ? 'হাজিরা ও মাসিক বেতন' : 'Employee salaries', icon: BadgeDollarSign, color: '#8b5cf6' },
        { id: 'sr', label: lang === 'bn' ? 'এসআর ফিল্ড অফিসার' : 'SR Field Rep', desc: lang === 'bn' ? 'অর্ডার কালেকশন ও রুট' : 'Field route collection', icon: Users, color: '#3b82f6' }
      ]
    },
    {
      title: lang === 'bn' ? '🐄 কৃষি, খামার ও ডেইরি অপারেশনস' : '🐄 Cattle & Dairy Farm Hub',
      items: [
        { id: 'cattle', label: lang === 'bn' ? 'গরুর খামার ও ডেইরি হাব' : 'Cattle & Dairy Hub', desc: lang === 'bn' ? 'গরুর পাল, খাদ্য হিস্ট্রি, টিকা, দুধ ও লাভ-ক্ষতি' : 'Herd, Feed Log, Vaccine, Milk & P&L', icon: Wheat, color: '#10b981', badge: 'PRO' }
      ]
    },
    {
      title: lang === 'bn' ? '🏥 হেলথকেয়ার ও ক্লিনিক অপারেশনস' : '🏥 Healthcare & Clinic Operations',
      items: [
        { id: 'healthcare', label: lang === 'bn' ? 'হেলথকেয়ার ইআরপি হাব' : 'Healthcare ERP Hub', desc: lang === 'bn' ? 'রোগী, প্রেসক্রিপশন, ডায়াগনস্টিক ল্যাব ও ফার্মেসি' : 'Patient, Rx, LIMS & Pharmacy', icon: Activity, color: '#0d9488', badge: 'PRO' }
      ]
    },
    {
      title: lang === 'bn' ? '⚙️ সিস্টেম, ব্যাকআপ ও টুলস' : '⚙️ System & Backup',
      items: [
        { id: 'settings', label: lang === 'bn' ? 'সফটওয়্যার সেটিংস' : 'Business Settings', desc: lang === 'bn' ? 'দোকানের নাম, ভ্যাট ও প্রিন্ট' : 'Store profile & print', icon: Settings, color: '#64748b' },
        { id: 'tool_diagnostics', label: lang === 'bn' ? '🩺 সিস্টেম ডায়াগনোসিস ও SOS' : 'System Diagnostics & SOS', desc: lang === 'bn' ? 'প্রিন্টার, মেমোরি ও SOS রিপোর্ট' : 'Hardware & repair hub', icon: Activity, color: '#10b981', isAction: () => { setShowDiagnosticsModal(true); setShowMobileDrawer(false); }, badge: 'SOS' },
        { id: 'tool_categories', label: lang === 'bn' ? 'ক্যাটাগরি হাব' : 'Category Manager', desc: lang === 'bn' ? 'সকল ক্যাটাগরি ম্যানেজ' : 'Manage all categories', icon: Tag, color: '#06b6d4', isTool: 'categories' },
        { id: 'tool_backup', label: lang === 'bn' ? 'এক্সেল ও ব্যাকআপ হাব' : 'Export & Import Hub', desc: lang === 'bn' ? 'ডাটা ডাউনলোড ও আপলোড' : 'Excel, PDF, JSON', icon: Download, color: '#10b981', isAction: () => setShowExportImportHub(true) },
        { id: 'tool_drive', label: lang === 'bn' ? 'গুগল ড্রাইভ সিঙ্ক' : 'Google Drive Sync', desc: lang === 'bn' ? 'ক্লাউডে অটো ব্যাকআপ' : 'Direct cloud backup', icon: Cloud, color: '#3b82f6', isAction: handleQuickDriveSync },
        { id: 'tool_calc', label: lang === 'bn' ? 'ডিজিটাল ক্যালকুলেটর' : 'Calculator', desc: lang === 'bn' ? 'দ্রুত হিসাব ও যোগ-বিয়োগ' : 'Popup calculator', icon: Calculator, color: '#a855f7', isTool: 'calculator' },
        { id: 'tool_notes', label: lang === 'bn' ? 'চিরকুট ও নোটবুক' : 'Quick Scratchpad', desc: lang === 'bn' ? 'জরুরি খসড়া ও মেমো' : 'Autosaved notes', icon: FileText, color: '#f59e0b', isTool: 'notes' },
        { id: 'support_helpdesk', label: lang === 'bn' ? '📞 হেল্পডেস্ক ও সহায়তা' : 'Support & Helpdesk', desc: lang === 'bn' ? 'WhatsApp, FB, Telegram সাপোর্ট' : 'WhatsApp, FB & Hotline', icon: HelpCircle, color: '#10b981', isAction: () => openHelpSupport(), badge: '24/7' },
        ...(isSuperAdmin ? [{ id: 'super_admin_drawer', label: lang === 'bn' ? '🛡️ সুপার অ্যাডমিন' : '🛡️ Super Admin', desc: lang === 'bn' ? 'মাস্টার পিন ও লাইসেন্স' : 'Master PIN control', icon: ShieldCheck, color: '#ef4444', isAction: () => { setShowMobileDrawer(false); setActiveTab('super_admin'); }, badge: 'ROOT' }] : [])
      ]
    }
  ];

  const personalDrawerGroups = [
    {
      title: lang === 'bn' ? '🏠 পারিবারিক ও দৈনন্দিন খরচ' : '🏠 Household & Daily Expenses',
      items: [
        { id: 'dashboard', label: lang === 'bn' ? 'পার্সোনাল ড্যাশবোর্ড' : 'Personal Dashboard', desc: lang === 'bn' ? 'মাসিক সামারি ও ব্যালেন্স' : 'Monthly overview', icon: LayoutDashboard, color: '#10b981' },
        { id: 'daily', label: lang === 'bn' ? 'দৈনিক বাজার ও খরচ' : 'Daily Market Expense', desc: lang === 'bn' ? 'প্রতিদিনের বাজার ও খরচ' : 'Groceries & items', icon: ShoppingCart, color: '#0ea5e9', badge: lang === 'bn' ? 'নিত্য' : 'Daily' },
        { id: 'family', label: lang === 'bn' ? 'পারিবারিক ফোল্ডার' : 'Family Folders', desc: lang === 'bn' ? 'বাসা ভাড়া, ইউটিলিটি, চিকিৎসা' : 'Rent, utility & bills', icon: Home, color: '#f97316' }
      ]
    },
    {
      title: lang === 'bn' ? '🎯 ইভেন্ট, সঞ্চয় ও দেনা-পাওনা' : '🎯 Events, Savings & Debts',
      items: [
        { id: 'events', label: lang === 'bn' ? 'ইভেন্ট ও উৎসব' : 'Events & Occasions', desc: lang === 'bn' ? 'বিয়ে, জন্মদিন ও ট্যুর বাজেট' : 'Special event budgets', icon: Sparkles, color: '#8b5cf6', badge: lang === 'bn' ? 'স্পেশাল' : 'Special' },
        { id: 'debts', label: lang === 'bn' ? 'দেনা-পাওনা খাতা' : 'Personal Debt Ledger', desc: lang === 'bn' ? 'আত্মীয় ও বন্ধুদের ধার' : 'Friends & family loans', icon: HandCoins, color: '#f59e0b', badge: lang === 'bn' ? 'জরুরি' : 'Ledger' },
        { id: 'income', label: lang === 'bn' ? 'আয়ের উৎস ও সঞ্চয়' : 'Income & Savings', desc: lang === 'bn' ? 'বেতন ও মাসিক জমার হিসাব' : 'Salary & savings goal', icon: Wallet, color: '#10b981' },
        { id: 'analytics', label: lang === 'bn' ? 'অ্যানালিটিক্স ও রিপোর্ট' : 'Reports & Insights', desc: lang === 'bn' ? 'মাসিক খরচের পাই চার্ট' : 'Pie charts & trends', icon: PieChart, color: '#6366f1' }
      ]
    },
    {
      title: lang === 'bn' ? '⚙️ টুলস ও ব্যাকআপ' : '⚙️ Utilities & Backup',
      items: [
        { id: 'tool_diagnostics', label: lang === 'bn' ? '🩺 ডায়াগনোসিস ও হেলথ' : 'Diagnostics & Health', desc: lang === 'bn' ? 'ডাটাবেজ ও মেমোরি টেস্ট' : 'Storage & health', icon: Activity, color: '#10b981', isAction: () => { setShowDiagnosticsModal(true); setShowMobileDrawer(false); } },
        { id: 'tool_categories', label: lang === 'bn' ? 'ক্যাটাগরি হাব' : 'Category Hub', desc: lang === 'bn' ? 'খরচের ক্যাটাগরি তৈরি ও এডিট' : 'Manage categories', icon: Tag, color: '#06b6d4', isTool: 'categories' },
        { id: 'tool_backup', label: lang === 'bn' ? 'এক্সেল ও ব্যাকআপ' : 'Export & Import', desc: lang === 'bn' ? 'হিসাব ডাউনলোড ও ব্যাকআপ' : 'Data export / import', icon: Download, color: '#10b981', isAction: () => setShowExportImportHub(true) },
        { id: 'tool_calc', label: lang === 'bn' ? 'ক্যালকুলেটর' : 'Calculator', desc: lang === 'bn' ? 'দ্রুত যোগ-বিয়োগ' : 'Fast digital math', icon: Calculator, color: '#a855f7', isTool: 'calculator' },
        { id: 'tool_notes', label: lang === 'bn' ? 'চিরকুট ও নোটপ্যাড' : 'Sticky Notes', desc: lang === 'bn' ? 'বাজারের ফর্দ ও জরুরি নোট' : 'Quick autosaved notes', icon: FileText, color: '#f59e0b', isTool: 'notes' },
        { id: 'support_helpdesk', label: lang === 'bn' ? '📞 হেল্পডেস্ক ও সহায়তা' : 'Support & Helpdesk', desc: lang === 'bn' ? 'WhatsApp ও জরুরি সাপোর্ট' : 'WhatsApp & Hotline', icon: HelpCircle, color: '#10b981', isAction: () => openHelpSupport(), badge: '24/7' },
        ...(isSuperAdmin ? [{ id: 'super_admin_personal_drawer', label: lang === 'bn' ? '🛡️ সুপার অ্যাডমিন' : '🛡️ Super Admin', desc: lang === 'bn' ? 'মাস্টার পিন ও সিস্টেম মোড' : 'Master PIN control', icon: ShieldCheck, color: '#ef4444', isAction: () => { setShowMobileDrawer(false); setActiveTab('super_admin'); }, badge: 'ROOT' }] : [])
      ]
    }
  ];

  const handleDrawerItemClick = (item) => {
    hapticFeedback.light();
    if (item.isAction) {
      item.isAction();
    } else if (item.isTool) {
      setActiveTool(item.isTool);
    } else {
      setActiveTab(item.id);
    }
    setShowMobileDrawer(false);
  };

  const handleBottomNavTabClick = (tabId, hapticType = 'light') => {
    if (hapticType === 'medium') {
      hapticFeedback.medium();
    } else {
      hapticFeedback.light();
    }
    setActiveTab(tabId);
    setShowMobileDrawer(false);
  };

  const enabledBusinessDrawerGroups = useMemo(() => {
    return businessDrawerGroups.map(group => ({
      ...group,
      items: group.items.filter(item => {
        if (item.isAction || item.isTool) return true;
        if (item.id === 'healthcare') return isModEnabled('healthcare');
        if (item.id === 'cattle') return true;
        return isModEnabled(item.id);
      })
    })).filter(group => group.items && group.items.length > 0);
  }, [businessDrawerGroups, licenseInfo]);

  const currentDrawerGroups = profile === 'business' ? enabledBusinessDrawerGroups : personalDrawerGroups;

  const filteredDrawerGroups = useMemo(() => {
    if (!drawerSearch.trim()) return currentDrawerGroups;
    const query = drawerSearch.toLowerCase().trim();
    return currentDrawerGroups.map(group => ({
      ...group,
      items: group.items.filter(item =>
        item.label.toLowerCase().includes(query) ||
        item.desc.toLowerCase().includes(query)
      )
    })).filter(group => group.items && group.items.length > 0);
  }, [currentDrawerGroups, drawerSearch]);

  // Dynamic business mobile bottom nav items based on admin/owner active modules
  const businessBottomNavSlots = useMemo(() => {
    const isPosActive = isModEnabled('pos');
    const allCandidates = [
      { id: 'dashboard', label: lang === 'bn' ? 'ড্যাশবোর্ড' : 'Home', icon: LayoutDashboard },
      { id: 'debts', label: lang === 'bn' ? 'দেনা-পাওনা' : 'Debts', icon: HandCoins },
      { id: 'inventory', label: lang === 'bn' ? 'ইনভেন্টরি' : 'Stock', icon: Boxes },
      { id: 'invoices', label: lang === 'bn' ? 'চালান' : 'Invoices', icon: FileText },
      { id: 'master_hub', label: lang === 'bn' ? 'মাস্টার ডাটা' : 'Master', icon: FolderOpen },
      { id: 'erp', label: lang === 'bn' ? 'লাভ-ক্ষতি' : 'Accounts', icon: Calculator },
      { id: 'crm', label: lang === 'bn' ? 'কাস্টমার' : 'CRM', icon: Users }
    ];

    const activeNonHero = allCandidates.filter(c => isModEnabled(c.id));

    return {
      isPosActive,
      leftItems: activeNonHero.slice(0, 2),
      rightItems: activeNonHero.slice(2, isPosActive ? 3 : 4)
    };
  }, [licenseInfo, lang]);

  return (
    <>
      <header className="no-print" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, zIndex: 1100 }}>
        {/* Top Bar: Brand, Switcher, Controls */}
        <div className="navbar-top-bar" style={{ maxWidth: '1440px', margin: '0 auto' }}>
          
          {/* Brand */}
          <div className="navbar-brand-group">
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'var(--mode-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 14px var(--mode-glow)',
                fontWeight: '800',
                fontSize: '1.25rem'
              }}
            >
              {profile === 'personal' ? '👤' : '💼'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.02em', margin: 0, color: 'var(--text-main)' }}>
                  {t.appName}
                </h1>
                <span className="badge badge-mode">
                  {profile === 'personal' ? (lang === 'bn' ? 'ব্যক্তিগত মোড' : 'Personal Mode') : (lang === 'bn' ? 'ব্যবসায়িক ইআরপি' : 'Business ERP')}
                </span>
                {profile === 'business' && (
                  licenseInfo?.status === 'active' ? (
                    <span
                      className="badge hide-mobile"
                      title={licenseInfo?.licenseKey || 'Active License'}
                      onClick={() => setActiveTab('settings')}
                      style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981', fontSize: '0.7rem', cursor: 'pointer', fontWeight: '700' }}
                    >
                      ✓ লাইফটাইম সক্রিয়
                    </span>
                  ) : (
                    <span
                      className="badge hide-mobile"
                      onClick={() => setActiveTab('settings')}
                      style={{ background: '#f59e0b', color: '#fff', fontSize: '0.7rem', cursor: 'pointer', fontWeight: '700', animation: 'pulse 2s infinite' }}
                    >
                      ⚠️ ট্রায়াল মোড (অ্যাক্টিভেট)
                    </span>
                  )
                )}
                {/* Super Admin Quick Button (Only for Software Owner / Master Vendor) */}
                {isSuperAdmin && (
                  <span
                    className="badge hide-mobile"
                    onClick={() => setActiveTab('super_admin')}
                    title="সুপার অ্যাডমিন ও ভেন্ডর মাস্টার কন্ট্রোল (Ctrl+Shift+S)"
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#ef4444',
                      border: '1px solid #ef4444',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      fontWeight: '800',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    🛡️ {lang === 'bn' ? 'সুপার অ্যাডমিন' : 'Super Admin'}
                  </span>
                )}

                {/* Industry Template Review & Customizer Hub Button */}
                <span
                  className="badge hide-mobile"
                  onClick={() => setShowTemplateReviewModal(true)}
                  title="সকল ইন্ডাস্ট্রি টেমপ্লেট রিভিউ ও কাস্টমাইজ করুন (100+ Templates Review)"
                  style={{
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#6366f1',
                    border: '1px solid #6366f1',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    fontWeight: '800',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  🎨 {lang === 'bn' ? 'টেমপ্লেট রিভিউ' : 'Templates Review'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Center: Profile Switcher (Personal vs Business) or Single Mode Badge */}
          {operatingMode === 'dual' ? (
            <div className="navbar-profile-switcher-wrap">
              <button
                onClick={() => setProfile('personal')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: profile === 'personal' ? 'var(--personal-primary)' : 'transparent',
                  color: profile === 'personal' ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: profile === 'personal' ? '0 2px 10px rgba(16, 185, 129, 0.35)' : 'none'
                }}
              >
                <User size={16} />
                <span>{t.personalMode}</span>
              </button>

              <button
                onClick={() => setProfile('business')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: profile === 'business' ? 'var(--business-primary)' : 'transparent',
                  color: profile === 'business' ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: profile === 'business' ? '0 2px 10px rgba(99, 102, 241, 0.35)' : 'none'
                }}
              >
                <Briefcase size={16} />
                <span>{t.businessMode}</span>
              </button>
            </div>
          ) : (
            <div
              className="navbar-profile-switcher-wrap"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 8px 4px 12px',
                borderRadius: '12px',
                background: operatingMode === 'business_only' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                border: operatingMode === 'business_only' ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid rgba(16, 185, 129, 0.35)',
                color: operatingMode === 'business_only' ? 'var(--business-primary)' : 'var(--personal-primary)',
                fontWeight: '700',
                fontSize: '0.82rem'
              }}
            >
              {operatingMode === 'business_only' ? (
                <>
                  <Briefcase size={15} />
                  <span>{lang === 'bn' ? '🏢 ব্যবসা মোড' : '🏢 Business Mode'}</span>
                </>
              ) : (
                <>
                  <User size={15} />
                  <span>{lang === 'bn' ? '👤 পার্সোনাল মোড' : '👤 Personal Mode'}</span>
                </>
              )}

              {/* 1-Click Button to restore Dual Mode */}
              <button
                type="button"
                onClick={() => setOperatingMode('dual')}
                style={{
                  background: 'var(--mode-color)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 6px var(--mode-glow)',
                  transition: 'all 0.15s ease'
                }}
                title={lang === 'bn' ? 'ডুয়েল মোডে (উভয় প্রোফাইল) ফিরে যান' : 'Switch back to Dual Mode'}
              >
                <RefreshCw size={11} />
                <span>{lang === 'bn' ? 'ডুয়েল মোড' : 'Dual Mode'}</span>
              </button>
            </div>
          )}

          {/* Right Controls: Auth, Language, Theme, and 3-Dot Menu */}
          <div className="navbar-right-controls">
            {/* Prominent Login Status Indicator (সবুজ বাতি = লগইন সক্রিয়, লাল বাতি = লগইন নেই) */}
            {user ? (
              <div
                className="navbar-user-pill"
                onClick={() => openAuthModal('login')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '5px 12px 5px 8px',
                  borderRadius: '24px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1.5px solid #10b981',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  userSelect: 'none',
                  boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)'
                }}
                title={lang === 'bn' ? `লগইন সক্রিয়: ${user.name || user.email} (ক্লিক করে প্রোফাইল দেখুন)` : `Logged in: ${user.name || user.email}`}
              >
                {/* 🟢 সবুজ বাতি (Green Indicator) */}
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 8px #10b981, 0 0 3px #10b981',
                    display: 'inline-block',
                    animation: 'pulse 1.8s infinite'
                  }}
                />
                <div className="navbar-user-pill-text" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.15 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#10b981', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name?.split(' ')[0] || user.email?.split('@')[0]}
                  </span>
                  <span style={{
                    fontSize: '0.62rem',
                    fontWeight: '700',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase'
                  }}>
                    {isOwner ? (lang === 'bn' ? '🟢 মালিক (সক্রিয়)' : '🟢 Owner') :
                     (isSalesman ? (lang === 'bn' ? '🟡 সেলসম্যান' : '🟡 Salesman') :
                      (isSR ? (lang === 'bn' ? '🔵 এসআর অফিসার' : '🔵 SR Rep') :
                       (lang === 'bn' ? '🟢 ক্যাশিয়ার' : '🟢 Cashier')))}
                  </span>
                </div>
              </div>
            ) : (
              <div
                className="navbar-user-pill"
                onClick={() => openAuthModal('login')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '5px 14px 5px 10px',
                  borderRadius: '24px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1.5px solid #ef4444',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  userSelect: 'none',
                  boxShadow: '0 0 12px rgba(239, 68, 68, 0.25)'
                }}
                title={lang === 'bn' ? 'সিস্টেম লকড: সুপাবেসের মাধ্যমে সাইন ইন করুন' : 'Locked: Supabase sign in required'}
              >
                {/* 🔴 লাল বাতি (Red Indicator) */}
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    boxShadow: '0 0 8px #ef4444, 0 0 3px #ef4444',
                    display: 'inline-block',
                    animation: 'pulse 1.2s infinite'
                  }}
                />
                <div className="navbar-user-pill-text" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.15 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#ef4444' }}>
                    {lang === 'bn' ? 'লাল: লগইন নেই' : 'Sign In Required'}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn' ? 'লগইন করুন →' : 'Click to Log In'}
                  </span>
                </div>
              </div>
            )}

            {/* Real-time Google Drive 1-Min Auto-Backup & 30-File Status Pill */}
            <button
              className="hide-mobile"
              onClick={handleQuickDriveSync}
              disabled={isDriveSyncing}
              title={
                isDriveConnected || businessSettings.googleDriveWebhookUrl
                  ? (lang === 'bn' 
                      ? `গুগল ড্রাইভ অটো-ব্যাকআপ সক্রিয় (প্রতি ১ মিনিট) | শেষ সিঙ্ক: ${businessSettings.googleDriveLastSync || 'হয়নি'} | সর্বোচ্চ ৩০ ফাইল সংরক্ষিত`
                      : `Google Drive 1-Min Auto-Sync Active | Last: ${businessSettings.googleDriveLastSync || 'Never'} | Max 30 files retained`)
                  : (lang === 'bn' ? 'গুগল ড্রাইভ সংযুক্ত করুন (১ ক্লিকে অটো-ব্যাকআপ)' : 'Connect Google Drive for Auto-Backup')
              }
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 11px',
                borderRadius: '8px',
                border: (isDriveConnected || businessSettings.googleDriveWebhookUrl)
                  ? '1px solid rgba(16, 185, 129, 0.4)'
                  : '1px solid rgba(245, 158, 11, 0.4)',
                background: (isDriveConnected || businessSettings.googleDriveWebhookUrl)
                  ? 'rgba(16, 185, 129, 0.12)'
                  : 'rgba(245, 158, 11, 0.12)',
                color: (isDriveConnected || businessSettings.googleDriveWebhookUrl)
                  ? '#10b981'
                  : '#f59e0b',
                fontSize: '0.78rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Cloud size={14} className={isDriveSyncing ? 'animate-spin' : ''} />
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: (isDriveConnected || businessSettings.googleDriveWebhookUrl) ? '#10b981' : '#f59e0b',
                    display: 'inline-block'
                  }}
                />
                {(isDriveConnected || businessSettings.googleDriveWebhookUrl) ? (
                  <span>
                    {businessSettings.googleDriveLastSync
                      ? `${businessSettings.googleDriveLastSync.split(' ')[1] || businessSettings.googleDriveLastSync}`
                      : (lang === 'bn' ? '১-মি. অটো' : '1-Min Auto')}
                    <span style={{ opacity: 0.75, fontSize: '0.7rem', marginLeft: '3px' }}>(৩০টি)</span>
                  </span>
                ) : (
                  <span>{lang === 'bn' ? 'ড্রাইভ ব্যাকআপ' : 'Drive Backup'}</span>
                )}
              </span>
            </button>



            {/* Language Switch */}
            <button
              className="btn btn-secondary navbar-lang-btn"
              onClick={toggleLanguage}
              title={lang === 'bn' ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}
            >
              <Globe size={15} />
              <span className="navbar-lang-full">{lang === 'bn' ? 'English' : 'বাংলা'}</span>
              <span className="navbar-lang-compact">{lang === 'bn' ? 'EN' : 'বাং'}</span>
            </button>

            {/* Theme Switch */}
            <button
              className="btn-icon press-scale"
              onClick={toggleTheme}
              title={t.themeToggle}
              style={{ transition: 'transform 0.1s ease' }}
            >
              {theme === 'dark' ? <Sun size={17} color="#fbbf24" /> : <Moon size={17} color="#6366f1" />}
            </button>

            {/* High-Density Compact Mode Switch */}
            <button
              className="btn-icon press-scale hide-mobile-sm"
              onClick={toggleDensityMode}
              title={densityMode === 'compact' ? (lang === 'bn' ? 'স্ট্যান্ডার্ড ভিউতে ফিরুন' : 'Switch to Standard Density') : (lang === 'bn' ? 'হাই-ডেনসিটি কম্প্যাক্ট মোড' : 'High-Density Compact Mode')}
              style={{
                color: densityMode === 'compact' ? 'var(--personal-primary, #10b981)' : 'var(--text-muted)',
                background: densityMode === 'compact' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                border: densityMode === 'compact' ? '1px solid rgba(16, 185, 129, 0.3)' : undefined,
                transition: 'transform 0.1s ease'
              }}
            >
              {densityMode === 'compact' ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Sound Feedback Toggle */}
            <button
              className="btn-icon press-scale hide-mobile-sm"
              onClick={handleToggleSound}
              title={soundMuted ? (lang === 'bn' ? 'সাউন্ড আনমিউট করুন' : 'Unmute Sound') : (lang === 'bn' ? 'সাউন্ড মিউট করুন' : 'Mute Sound')}
              style={{
                color: soundMuted ? 'var(--text-muted)' : '#10b981',
                background: soundMuted ? 'transparent' : 'rgba(16, 185, 129, 0.1)',
                border: soundMuted ? undefined : '1px solid rgba(16, 185, 129, 0.25)',
                transition: 'transform 0.1s ease'
              }}
            >
              {soundMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>

            {/* Quick Diagnostics Health Button (Hidden on narrow mobile screens, accessible inside 3-Dot menu) */}
            <button
              className="btn-icon hide-mobile-sm"
              onClick={() => setShowDiagnosticsModal(true)}
              title={lang === 'bn' ? 'সিস্টেম ডায়াগনোসিস, হেলথ চেক ও SOS রিপোর্ট' : 'System Diagnostics & Health'}
              style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)' }}
            >
              <Activity size={17} />
            </button>

            {/* Quick POS Counter Screen Lock */}
            <button
              className="btn-icon press-scale"
              onClick={lockScreen}
              title={lang === 'bn' ? 'কাউন্টার স্ক্রিন লক করুন (কুইক লক)' : 'Lock Counter Screen (PIN Protected)'}
              style={{
                color: '#f59e0b',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                transition: 'transform 0.1s ease'
              }}
            >
              <Lock size={16} />
            </button>

            {/* IN-APP SMART ALERT CENTER (BELL) */}
            <div style={{ position: 'relative', flexShrink: 0 }} ref={alertRef}>
              <button
                type="button"
                className="btn-icon press-scale"
                onClick={() => {
                  hapticFeedback.light();
                  setShowAlertCenter(!showAlertCenter);
                }}
                title={lang === 'bn' ? `অ্যালার্ট সেন্টার (${totalAlertCount}টি নোটিফিকেশন)` : `Alert Center (${totalAlertCount} alerts)`}
                style={{
                  position: 'relative',
                  background: totalAlertCount > 0 ? 'rgba(239, 68, 68, 0.15)' : showAlertCenter ? 'var(--mode-color)' : undefined,
                  color: totalAlertCount > 0 ? '#ef4444' : showAlertCenter ? '#ffffff' : 'var(--text-muted)',
                  border: totalAlertCount > 0 ? '1px solid rgba(239, 68, 68, 0.35)' : undefined,
                  transition: 'transform 0.1s ease'
                }}
              >
                <Bell size={17} />
                {totalAlertCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: '#ef4444',
                      color: '#ffffff',
                      borderRadius: '10px',
                      padding: '1px 5px',
                      fontSize: '0.62rem',
                      fontWeight: '900',
                      minWidth: '16px',
                      textAlign: 'center',
                      boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
                      animation: 'pulse 1.8s infinite'
                    }}
                  >
                    {totalAlertCount > 99 ? '99+' : totalAlertCount}
                  </span>
                )}
              </button>

              {/* ALERT CENTER DROPDOWN */}
              {showAlertCenter && (
                <div
                  className="glass-card animate-fade-in"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '320px',
                    maxWidth: '92vw',
                    maxHeight: '440px',
                    overflowY: 'auto',
                    zIndex: 1050,
                    borderRadius: '14px',
                    padding: '0.85rem',
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: '0.86rem', color: 'var(--text-main)' }}>
                      <Bell size={15} style={{ color: '#ef4444' }} />
                      <span>{lang === 'bn' ? 'স্মার্ট অ্যালার্ট সেন্টার' : 'Smart Alert Center'}</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', padding: '2px 7px', borderRadius: '12px', background: totalAlertCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: totalAlertCount > 0 ? '#ef4444' : '#10b981', fontWeight: '800' }}>
                      {totalAlertCount} {lang === 'bn' ? 'টি এলার্ট' : 'Alerts'}
                    </span>
                  </div>

                  {/* Section 1: Low Stock Alert */}
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                      <AlertTriangle size={13} />
                      <span>{lang === 'bn' ? `স্টক সতর্কতা (${lowStockAlerts.length})` : `Low Stock (${lowStockAlerts.length})`}</span>
                    </div>
                    {lowStockAlerts.length === 0 ? (
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', padding: '6px 8px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                        ✓ {lang === 'bn' ? 'সকল পণ্যের স্টক পর্যাপ্ত আছে' : 'All stock levels healthy'}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {lowStockAlerts.slice(0, 4).map(item => (
                          <div
                            key={item.id}
                            onClick={() => {
                              setActiveTab('inventory');
                              setShowAlertCenter(false);
                            }}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '6px 8px',
                              background: 'rgba(245, 158, 11, 0.08)',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              border: '1px solid rgba(245, 158, 11, 0.25)',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-main)', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.name}
                            </span>
                            <span style={{ fontSize: '0.72rem', fontWeight: '800', color: (Number(item.stock) || 0) <= 0 ? '#ef4444' : '#f59e0b', background: 'var(--bg-primary)', padding: '1px 6px', borderRadius: '4px' }}>
                              {lang === 'bn' ? 'স্টক:' : 'Stock:'} {item.stock || 0}
                            </span>
                          </div>
                        ))}
                        {lowStockAlerts.length > 4 && (
                          <button
                            type="button"
                            onClick={() => { setActiveTab('inventory'); setShowAlertCenter(false); }}
                            style={{ background: 'none', border: 'none', color: 'var(--business-primary)', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer', textAlign: 'right', padding: '2px 4px' }}
                          >
                            {lang === 'bn' ? `আরও ${lowStockAlerts.length - 4}টি দেখুন ➔` : `View all ➔`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Section 2: Overdue / Due Debts Alert */}
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                      <TrendingDown size={13} />
                      <span>{lang === 'bn' ? `বকেয়া তাগাদা (${debtAlerts.length})` : `Overdue Receivables (${debtAlerts.length})`}</span>
                    </div>
                    {debtAlerts.length === 0 ? (
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', padding: '6px 8px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                        ✓ {lang === 'bn' ? 'কোনো অতিরিক্ত বকেয়া পাওনা নেই' : 'No overdue dues'}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {debtAlerts.slice(0, 4).map(item => (
                          <div
                            key={item.id}
                            onClick={() => {
                              setActiveTab('debts');
                              setShowAlertCenter(false);
                            }}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '6px 8px',
                              background: 'rgba(239, 68, 68, 0.08)',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-main)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.name || item.personName}
                            </span>
                            <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#ef4444', background: 'var(--bg-primary)', padding: '1px 6px', borderRadius: '4px' }}>
                              ৳{(Number(item.netDebt) || Number(item.amount) || 0).toLocaleString()}
                            </span>
                          </div>
                        ))}
                        {debtAlerts.length > 4 && (
                          <button
                            type="button"
                            onClick={() => { setActiveTab('debts'); setShowAlertCenter(false); }}
                            style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer', textAlign: 'right', padding: '2px 4px' }}
                          >
                            {lang === 'bn' ? `আরও ${debtAlerts.length - 4}টি দেখুন ➔` : `View all ➔`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Streamlined Focused Navigation Bar (Only Dashboard & Single Large Three-Dot / Hamburger Menu) */}
        <div className="subnav-scroll-container" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
          <div
            style={{
              maxWidth: '1440px',
              margin: '0 auto',
              padding: '6px 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            {/* Primary Action Tabs (Only Dashboard) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Primary Action Tabs (Dashboard, POS, Inventory, Debts, Invoices) */}
              {primaryQuickTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      borderRadius: '11px',
                      background: isActive ? 'var(--mode-color)' : 'rgba(255, 255, 255, 0.05)',
                      border: isActive ? '1.5px solid var(--mode-color)' : '1px solid var(--border-color)',
                      color: isActive ? '#ffffff' : 'var(--text-main)',
                      fontWeight: isActive ? '800' : '600',
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isActive ? '0 3px 12px var(--mode-glow)' : 'none'
                    }}
                    title={tab.label}
                  >
                    <IconComponent size={17} style={{ color: isActive ? '#ffffff' : 'var(--mode-color)' }} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}

              {/* Current Active Module Pill if outside primaryQuickTabs */}
              {!primaryQuickTabs.some(t => t.id === activeTab) && (() => {
                const currentActiveItem = (profile === 'business' ? businessNavItems : personalNavItems).find(i => i.id === activeTab);
                if (!currentActiveItem) return null;
                const CurrIcon = currentActiveItem.icon;
                return (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '7px 14px',
                      borderRadius: '11px',
                      background: 'rgba(99, 102, 241, 0.15)',
                      border: '1.5px solid rgba(99, 102, 241, 0.45)',
                      color: 'var(--business-primary)',
                      fontSize: '0.84rem',
                      fontWeight: '800'
                    }}
                  >
                    <CurrIcon size={16} />
                    <span>{currentActiveItem.label}</span>
                    <span style={{ fontSize: '0.68rem', opacity: 0.9, background: 'var(--business-primary)', color: '#ffffff', padding: '1px 6px', borderRadius: '10px' }}>
                      {lang === 'bn' ? 'চলমান পৃষ্ঠা' : 'Active View'}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* ONE SINGLE LARGE THREE-DOT / HAMBURGER MENU BUTTON */}
            <button
              type="button"
              onClick={() => {
                playButtonClick();
                setShowMobileDrawer(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '9px',
                padding: '8px 18px',
                borderRadius: '12px',
                background: showMobileDrawer ? 'var(--mode-color)' : 'rgba(99, 102, 241, 0.12)',
                border: showMobileDrawer ? '2px solid var(--mode-color)' : '1.5px solid rgba(99, 102, 241, 0.4)',
                color: showMobileDrawer ? '#ffffff' : 'var(--mode-color)',
                fontWeight: '800',
                fontSize: '0.92rem',
                cursor: 'pointer',
                transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: showMobileDrawer ? '0 4px 16px var(--mode-glow)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
                marginLeft: 'auto'
              }}
              title={lang === 'bn' ? 'সকল ফিচার, খাতা ও সেটিংস মেনু (Alt+M / F4)' : 'Open All Features Menu (Alt+M / F4)'}
              onMouseEnter={(e) => {
                if (!showMobileDrawer) e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
              }}
              onMouseLeave={(e) => {
                if (!showMobileDrawer) e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)';
              }}
            >
              <Menu size={19} strokeWidth={2.4} />
              <span>{lang === 'bn' ? '☰ মেনু ও ফিচারস' : '☰ All Menu'}</span>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '900',
                  padding: '2px 7px',
                  borderRadius: '12px',
                  background: showMobileDrawer ? '#ffffff' : 'var(--mode-color)',
                  color: showMobileDrawer ? 'var(--mode-color)' : '#ffffff'
                }}
              >
                {profile === 'business' ? '12+' : '7+'}
              </span>
            </button>
          </div>
        </div>
</header>

      {/* QUICK TOOLS MODAL DIALOGS */}
      <QuickToolsModal activeTool={activeTool} onClose={() => setActiveTool(null)} />

      {/* EXCEL & PDF EXPORT / IMPORT DATA HUB */}
      <DataExportImportModal
        isOpen={showExportImportHub}
        onClose={() => setShowExportImportHub(false)}
        defaultTab="export"
        initialTarget={profile === 'business' ? 'business_inventory' : 'family'}
      />

      {/* MASTER PIN MODAL FOR SUPER ADMIN */}
      <MasterPinModal
        isOpen={showMasterPinModal}
        onClose={() => setShowMasterPinModal(false)}
        onSuccess={() => setActiveTab('super_admin')}
      />

      {/* SYSTEM DIAGNOSTICS & SOS RECOVERY MODAL */}
      <SystemDiagnosticsModal
        isOpen={showDiagnosticsModal}
        onClose={() => setShowDiagnosticsModal(false)}
      />

      {/* INDUSTRY TEMPLATE REVIEW & CUSTOMIZER MODAL */}
      <TemplateReviewModal
        isOpen={showTemplateReviewModal}
        onClose={() => setShowTemplateReviewModal(false)}
      />

      {/* DEVICE PERMISSIONS & ACCESS CENTER MODAL */}
      <PermissionManagerModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        lang={lang}
      />

      {/* ========================================================
          MODERN MOBILE BOTTOM NAVIGATION BAR (ANDROID / TOUCH)
          ======================================================== */}
      <nav className="mobile-bottom-nav no-print" aria-label="Mobile Navigation">
        {profile === 'business' ? (
          <>
            {/* Dynamic Active Left Items */}
            {businessBottomNavSlots.leftItems.map(item => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`mobile-bottom-nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => handleBottomNavTabClick(item.id, 'light')}
                >
                  <IconComp size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Center Hero POS Button (Only when POS module is enabled) */}
            {businessBottomNavSlots.isPosActive && (
              <div className="mobile-bottom-hero-container">
                <button
                  type="button"
                  className={`mobile-bottom-hero-btn ${activeTab === 'pos' ? 'active' : ''}`}
                  onClick={() => handleBottomNavTabClick('pos', 'medium')}
                  title={lang === 'bn' ? 'POS সেলস কাউন্টার' : 'POS Checkout'}
                >
                  <ScanLine size={24} />
                  <span className="hero-btn-label">POS</span>
                </button>
              </div>
            )}

            {/* Dynamic Active Right Items */}
            {businessBottomNavSlots.rightItems.map(item => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`mobile-bottom-nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => handleBottomNavTabClick(item.id, 'light')}
                >
                  <IconComp size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Menu Drawer Toggle */}
            <button
              type="button"
              className={`mobile-bottom-nav-item ${showMobileDrawer ? 'active' : ''}`}
              onClick={() => {
                hapticFeedback.light();
                setShowMobileDrawer(!showMobileDrawer);
              }}
            >
              <Menu size={20} />
              <span>{lang === 'bn' ? 'মেনু' : 'Menu'}</span>
            </button>
          </>
        ) : (
          <>
            {/* 1. Personal Dashboard */}
            <button
              type="button"
              className={`mobile-bottom-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleBottomNavTabClick('dashboard', 'light')}
            >
              <LayoutDashboard size={20} />
              <span>{lang === 'bn' ? 'ড্যাশবোর্ড' : 'Home'}</span>
            </button>

            {/* 2. Daily Expenses */}
            <button
              type="button"
              className={`mobile-bottom-nav-item ${activeTab === 'daily' ? 'active' : ''}`}
              onClick={() => handleBottomNavTabClick('daily', 'light')}
            >
              <ShoppingCart size={20} />
              <span>{lang === 'bn' ? 'দৈনিক খরচ' : 'Daily'}</span>
            </button>

            {/* 3. Center Hero Family Button */}
            <div className="mobile-bottom-hero-container">
              <button
                type="button"
                className={`mobile-bottom-hero-btn personal ${activeTab === 'family' ? 'active' : ''}`}
                onClick={() => handleBottomNavTabClick('family', 'medium')}
                title={lang === 'bn' ? 'পারিবারিক খরচ' : 'Family Expenses'}
              >
                <Home size={24} />
                <span className="hero-btn-label">{lang === 'bn' ? 'ফ্যামিলি' : 'Family'}</span>
              </button>
            </div>

            {/* 4. Debts */}
            <button
              type="button"
              className={`mobile-bottom-nav-item ${activeTab === 'debts' ? 'active' : ''}`}
              onClick={() => handleBottomNavTabClick('debts', 'light')}
            >
              <HandCoins size={20} />
              <span>{lang === 'bn' ? 'দেনা-পাওনা' : 'Debts'}</span>
            </button>

            {/* 5. Menu Drawer */}
            <button
              type="button"
              className={`mobile-bottom-nav-item ${showMobileDrawer ? 'active' : ''}`}
              onClick={() => {
                hapticFeedback.light();
                setShowMobileDrawer(!showMobileDrawer);
              }}
            >
              <Menu size={20} />
              <span>{lang === 'bn' ? 'মেনু' : 'Menu'}</span>
            </button>
          </>
        )}
      </nav>


      {/* ========================================================
          ALL-IN-ONE MOBILE FEATURE DRAWER / BOTTOM SHEET
          ======================================================== */}
      {showMobileDrawer && (
        <div className="mobile-drawer-overlay no-print" onClick={() => setShowMobileDrawer(false)}>
          <div
            className="mobile-drawer-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle Bar */}
            <div className="mobile-drawer-handle-bar">
              <span className="mobile-drawer-handle-pill" />
            </div>

            {/* Drawer Header */}
            <div className="mobile-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem' }}>{profile === 'business' ? '💼' : '👤'}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {profile === 'business'
                      ? (lang === 'bn' ? 'ব্যবসা পরিচালনা হাব' : 'Business Management')
                      : (lang === 'bn' ? 'ব্যক্তিগত হিসাব হাব' : 'Personal Finance Hub')}
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {profile === 'business'
                      ? (isOwner ? (lang === 'bn' ? '🟢 মালিক মোড' : '🟢 Owner') :
                         isCashier ? (lang === 'bn' ? '🟢 ক্যাশিয়ার' : '🟢 Cashier') :
                         isSalesman ? (lang === 'bn' ? '🟡 সেলসম্যান' : '🟡 Salesman') :
                         (lang === 'bn' ? '🔵 এসআর অফিসার' : '🔵 SR'))
                      : (lang === 'bn' ? 'দৈনন্দিন ও পারিবারিক ট্র্যাকার' : 'Daily & Family Tracker')}
                  </div>
                </div>
              </div>

              {/* Mode Switch & Close Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {operatingMode === 'dual' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setProfile(profile === 'business' ? 'personal' : 'business');
                      setActiveTab('dashboard');
                    }}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-primary)',
                      color: 'var(--mode-color)',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {profile === 'business' ? '👤 পার্সোনাল' : '💼 বিজনেস'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setOperatingMode('dual');
                      setActiveTab('dashboard');
                    }}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--mode-color)',
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    🔄 ডুয়েল মোড
                  </button>
                )}

                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => { setShowMobileDrawer(false); lockScreen(); }}
                  title={lang === 'bn' ? 'পর্দা লক করুন' : 'Lock Screen'}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)' }}
                >
                  <Lock size={16} />
                </button>

                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setShowMobileDrawer(false)}
                  style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Fast Feature Search Box */}
            <div style={{ padding: '8px 1rem 4px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'ফিচার বা টুলস খুঁজুন (যেমন: কোটেশন, ইনভয়েস)...' : 'Search features or tools...'}
                  value={drawerSearch}
                  onChange={(e) => setDrawerSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px 7px 32px',
                    fontSize: '0.84rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-main)'
                  }}
                />
                {drawerSearch && (
                  <button
                    onClick={() => setDrawerSearch('')}
                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Categorized Features Grid */}
            <div className="mobile-drawer-body">
              {filteredDrawerGroups.map((group, gIdx) => {
                if (!group.items || group.items.length === 0) return null;
                return (
                  <div key={gIdx}>
                    <div className="mobile-drawer-group-title">
                      {group.title}
                    </div>
                    <div className="mobile-drawer-grid">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isCurrentActive = activeTab === item.id;
                        return (
                          <div
                            key={item.id}
                            className={`mobile-drawer-tile ${isCurrentActive ? 'active' : ''}`}
                            onClick={() => handleDrawerItemClick(item)}
                          >
                            <div
                              className="mobile-drawer-tile-icon"
                              style={{
                                background: `${item.color}18`,
                                color: item.color
                              }}
                            >
                              <Icon size={18} />
                            </div>
                            <div className="mobile-drawer-tile-info">
                              <div className="mobile-drawer-tile-title">
                                {item.label}
                              </div>
                              <div className="mobile-drawer-tile-desc">
                                {item.desc}
                              </div>
                            </div>
                            {item.badge && (
                              <span
                                style={{
                                  position: 'absolute',
                                  top: '6px',
                                  right: '6px',
                                  fontSize: '0.6rem',
                                  fontWeight: '800',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  background: item.badge === 'HOT' ? 'rgba(239, 68, 68, 0.15)' : 'var(--mode-badge)',
                                  color: item.badge === 'HOT' ? '#ef4444' : 'var(--mode-color)'
                                }}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Account, Role Switcher & System Section inside Single Mega Drawer */}
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={16} style={{ color: 'var(--mode-color)' }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {user ? (user.email || 'ব্যবহারকারী') : (lang === 'bn' ? 'মালিক ও স্টাফ অ্যাকাউন্ট' : 'Staff Account')}
                    </span>
                    {user && (
                      <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--business-primary)', fontWeight: '800' }}>
                        {user.role}
                      </span>
                    )}
                  </div>

                  {user ? (
                    <button
                      type="button"
                      onClick={() => { logout(); setShowMobileDrawer(false); }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                        fontSize: '0.74rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <LogOut size={13} />
                      <span>{lang === 'bn' ? 'লগআউট' : 'Logout'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { openAuthModal(); setShowMobileDrawer(false); }}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        background: 'var(--mode-color)',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '0.74rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <LogIn size={13} />
                      <span>{lang === 'bn' ? 'লগইন / সাইন আপ' : 'Login'}</span>
                    </button>
                  )}
                </div>

                {/* Role Switcher Test View */}
                {profile === 'business' && (
                  <div style={{ padding: '6px 8px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px' }}>
                      {lang === 'bn' ? 'রোল পরিবর্তন (টেস্টিং ভিউ):' : 'Switch Role:'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                      {[
                        { id: 'owner', label: 'মালিক', color: '#6366f1' },
                        { id: 'cashier', label: 'ক্যাশিয়ার', color: '#10b981' },
                        { id: 'salesman', label: 'সেলসম্যান', color: '#f59e0b' },
                        { id: 'sr', label: 'এসআর', color: '#3b82f6' }
                      ].map(r => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => { switchRole(r.id); setShowMobileDrawer(false); }}
                          style={{
                            padding: '4px 2px',
                            fontSize: '0.68rem',
                            fontWeight: '700',
                            borderRadius: '4px',
                            border: role === r.id ? '1.5px solid ' + r.color : '1px solid var(--border-color)',
                            background: role === r.id ? r.color : 'transparent',
                            color: role === r.id ? '#ffffff' : 'var(--text-muted)',
                            cursor: 'pointer'
                          }}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* GitHub Integration & Live Cloud Deployment Card */}
                <div style={{ marginTop: '8px', padding: '10px 12px', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      <GitBranch size={14} style={{ color: '#10b981' }} />
                      <span>{lang === 'bn' ? 'গিটহাব সিঙ্ক ও ডিপ্লয়মেন্ট' : 'GitHub Sync & Cloud Status'}</span>
                    </div>
                    <span style={{ fontSize: '0.65rem', padding: '1px 7px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: '800', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      🟢 লিঙ্কড (Connected)
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <a
                      href="https://github.com/sajjadhossan/hisabkitab-360"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '6px 8px',
                        borderRadius: '6px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        color: 'var(--mode-color)',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px'
                      }}
                    >
                      <GitBranch size={12} />
                      <span>{lang === 'bn' ? 'গিটহাব কোড' : 'GitHub Repo'}</span>
                      <ExternalLink size={10} />
                    </a>
                    <a
                      href="https://github.com/sajjadhossan/hisabkitab-360/releases"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '6px 8px',
                        borderRadius: '6px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#10b981',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px'
                      }}
                    >
                      <Download size={12} />
                      <span>{lang === 'bn' ? 'APK রিলিজ' : 'Download APK'}</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                  <a
                    href="https://sajjadhossan.github.io/hisabkitab-360/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      marginTop: '6px',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      background: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      color: '#3b82f6',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    <Globe size={12} />
                    <span>{lang === 'bn' ? '🌐 লাইভ ক্লাউড ওয়েবসাইট (GitHub Pages)' : '🌐 Live Web Preview'}</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
