import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
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
  VolumeX
} from 'lucide-react';
import { isSoundMuted, toggleSoundMute, playButtonClick, playSuccessChime } from '../services/soundFeedback';
import { QuickToolsModal } from './common/QuickToolsModal';
import { DataExportImportModal } from './common/DataExportImportModal';
import { MasterPinModal } from './admin/MasterPinModal';
import { SystemDiagnosticsModal } from './common/SystemDiagnosticsModal';
import { TemplateReviewModal } from './common/TemplateReviewModal';

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
    openHelpSupport
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
  const [showMasterPinModal, setShowMasterPinModal] = useState(false);
  const [activeTool, setActiveTool] = useState(null); // 'calculator' | 'cash' | 'notes' | 'backup_hub' | 'shortcuts'
  const [showExportImportHub, setShowExportImportHub] = useState(false);
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState(false);
  const [showTemplateReviewModal, setShowTemplateReviewModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const [soundMuted, setSoundMuted] = useState(isSoundMuted());
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState('');
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
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

  // Listen to keyboard shortcut for Super Admin (Ctrl+Shift+S or Alt+S)
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

  const personalNavItems = [
    { id: 'dashboard', label: t.personalNav.dashboard, icon: LayoutDashboard },
    { id: 'daily', label: t.personalNav.daily, icon: ShoppingCart },
    { id: 'family', label: t.personalNav.family, icon: Home },
    { id: 'events', label: t.personalNav.events || (lang === 'bn' ? 'ইভেন্ট ও অনুষ্ঠান' : 'Events & Occasions'), icon: Sparkles },
    { id: 'debts', label: t.personalNav.debts || (lang === 'bn' ? 'দেনা-পাওনা খাতা' : 'Debt Ledger'), icon: HandCoins },
    { id: 'income', label: t.personalNav.income, icon: Wallet },
    { id: 'analytics', label: t.personalNav.analytics, icon: PieChart }
  ];

  const isModEnabled = (modId) => {
    if (!licenseInfo?.modules) return true;
    return licenseInfo.modules[modId] !== false;
  };

  const businessNavItems = [
    { id: 'dashboard', label: t.businessNav.dashboard, icon: LayoutDashboard },
    ...(isOwner && isModEnabled('branch_control') ? [{ id: 'branch_control', label: lang === 'bn' ? '👑 ক্যাশ ও ব্রাঞ্চ কন্ট্রোল' : '👑 Cash & Branches', icon: Building2, highlight: true }] : []),
    ...(isModEnabled('pos') ? [{ id: 'pos', label: t.businessNav.pos, icon: ScanLine, highlight: true }] : []),
    ...(isModEnabled('debts') ? [{ id: 'debts', label: t.businessNav.debts || (lang === 'bn' ? 'নগদ দেনা-পাওনা' : 'Cash Debts'), icon: HandCoins }] : []),
    ...(isModEnabled('invoices') ? [{ id: 'invoices', label: t.businessNav.invoices, icon: FileText }] : []),
    ...(isModEnabled('quotations') ? [{ id: 'quotations', label: t.businessNav.quotations, icon: FileCheck }] : []),
    ...(isModEnabled('inventory') ? [{ id: 'inventory', label: t.businessNav.inventory, icon: Boxes }] : []),
    { id: 'master_hub', label: lang === 'bn' ? '📁 ফোল্ডার ও মাস্টার ডাটা' : '📁 Master Setup Hub', icon: FolderOpen, highlight: true },
    ...(isModEnabled('erp') ? [{ id: 'erp', label: t.businessNav.erp, icon: Calculator }] : []),
    ...(isModEnabled('crm') ? [{ id: 'crm', label: t.businessNav.crm, icon: Users }] : []),
    ...(isModEnabled('hr') ? [{ id: 'hr', label: t.businessNav.hr, icon: BadgeDollarSign }] : []),
    ...(isModEnabled('sr') ? [{ id: 'sr', label: lang === 'bn' ? 'এসআর ফিল্ড' : 'SR Field', icon: Users }] : []),
    { id: 'settings', label: t.businessNav.settings, icon: Settings },
    ...(isSuperAdmin ? [{ id: 'super_admin', label: lang === 'bn' ? '🛡️ সুপার অ্যাডমিন' : '🛡️ Super Admin', icon: ShieldCheck, highlight: true }] : [])
  ];

  let filteredBusinessNavItems = businessNavItems;
  if (role === 'cashier') {
    filteredBusinessNavItems = businessNavItems.filter(i => ['pos', 'invoices', 'debts', 'master_hub'].includes(i.id));
  } else if (role === 'salesman') {
    filteredBusinessNavItems = businessNavItems.filter(i => ['pos', 'inventory', 'crm', 'master_hub'].includes(i.id));
  } else if (role === 'sr') {
    filteredBusinessNavItems = businessNavItems.filter(i => ['sr', 'crm', 'debts', 'inventory'].includes(i.id));
  }

  const navItems = profile === 'personal' ? personalNavItems : filteredBusinessNavItems;

  // Mobile Categorized Drawer Groups
  const businessDrawerGroups = [
    {
      title: lang === 'bn' ? '🛒 বিক্রয়, মেমো ও বিলিং' : '🛒 Sales & Billing',
      items: [
        { id: 'pos', label: lang === 'bn' ? 'POS সেলস কাউন্টার' : 'POS Terminal', desc: lang === 'bn' ? 'দ্রুত খুচরা বিক্রয় ও বিল' : 'Retail checkout', icon: ScanLine, color: '#6366f1', badge: 'HOT' },
        { id: 'invoices', label: lang === 'bn' ? 'চালান ও ইনভয়েস' : 'Invoices & Bills', desc: lang === 'bn' ? 'সকল ইনভয়েস ও মেমো' : 'All sales history', icon: FileText, color: '#3b82f6' },
        { id: 'quotations', label: lang === 'bn' ? 'কোটেশন / এস্টিমেট' : 'Quotations', desc: lang === 'bn' ? 'আনুমানিক খরচের অফার' : 'Estimates & quotes', icon: FileCheck, color: '#06b6d4' },
        ...(isOwner && isModEnabled('branch_control') ? [{ id: 'branch_control', label: lang === 'bn' ? 'ক্যাশ ও ব্রাঞ্চ কন্ট্রোল' : 'Branch & Cash', desc: lang === 'bn' ? 'শাখা ও কাউন্টার তদারকি' : 'Multi-branch cash', icon: Building2, color: '#ec4899', badge: '👑' }] : [])
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
        { id: 'super_admin_drawer', label: lang === 'bn' ? '🛡️ সুপার অ্যাডমিন' : '🛡️ Super Admin', desc: lang === 'bn' ? 'মাস্টার পিন ও লাইসেন্স' : 'Master PIN control', icon: ShieldCheck, color: '#ef4444', isAction: () => { setShowMobileDrawer(false); if (isSuperAdmin) { setActiveTab('super_admin'); } else { setShowMasterPinModal(true); } }, badge: 'ROOT' }
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
        { id: 'super_admin_personal_drawer', label: lang === 'bn' ? '🛡️ সুপার অ্যাডমিন' : '🛡️ Super Admin', desc: lang === 'bn' ? 'মাস্টার পিন ও সিস্টেম মোড' : 'Master PIN control', icon: ShieldCheck, color: '#ef4444', isAction: () => { setShowMobileDrawer(false); if (isSuperAdmin) { setActiveTab('super_admin'); } else { setShowMasterPinModal(true); } }, badge: 'ROOT' }
      ]
    }
  ];

  const handleDrawerItemClick = (item) => {
    if (item.isAction) {
      item.isAction();
    } else if (item.isTool) {
      setActiveTool(item.isTool);
    } else {
      setActiveTab(item.id);
    }
    setShowMobileDrawer(false);
  };

  const currentDrawerGroups = profile === 'business' ? businessDrawerGroups : personalDrawerGroups;

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

  return (
    <>
      <header className="no-print" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, zIndex: 100 }}>
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
                      className="badge"
                      title={licenseInfo?.licenseKey || 'Active License'}
                      onClick={() => setActiveTab('settings')}
                      style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981', fontSize: '0.7rem', cursor: 'pointer', fontWeight: '700' }}
                    >
                      ✓ লাইফটাইম সক্রিয়
                    </span>
                  ) : (
                    <span
                      className="badge"
                      onClick={() => setActiveTab('settings')}
                      style={{ background: '#f59e0b', color: '#fff', fontSize: '0.7rem', cursor: 'pointer', fontWeight: '700', animation: 'pulse 2s infinite' }}
                    >
                      ⚠️ ট্রায়াল মোড (অ্যাক্টিভেট)
                    </span>
                  )
                )}
                {/* Super Admin Quick Button */}
                <span
                  className="badge"
                  onClick={() => {
                    if (isSuperAdmin) {
                      setActiveTab('super_admin');
                    } else {
                      setShowMasterPinModal(true);
                    }
                  }}
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

                {/* Industry Template Review & Customizer Hub Button */}
                <span
                  className="badge"
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

            {/* Direct Owner Central Cash & Multi-Branch Control Hub Button */}
            {profile === 'business' && isOwner && (
              <button
                type="button"
                className="hide-mobile"
                onClick={() => setActiveTab('branch_control')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: activeTab === 'branch_control' ? '1.5px solid #10b981' : '1px solid rgba(16, 185, 129, 0.4)',
                  background: activeTab === 'branch_control' ? '#10b981' : 'rgba(16, 185, 129, 0.12)',
                  color: activeTab === 'branch_control' ? '#ffffff' : '#10b981',
                  fontSize: '0.78rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: activeTab === 'branch_control' ? '0 2px 10px rgba(16, 185, 129, 0.4)' : 'none'
                }}
                title={lang === 'bn' ? 'মালিকের সেন্ট্রাল ক্যাশ ও ব্রাঞ্চ কন্ট্রোল হাব' : 'Central Cash & Branch Control'}
              >
                <Building2 size={14} />
                <span>{lang === 'bn' ? '👑 ক্যাশ ও ব্রাঞ্চ কন্ট্রোল' : '👑 Cash & Branches'}</span>
              </button>
            )}

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

            {/* Quick Diagnostics Health Button */}
            <button
              className="btn-icon"
              onClick={() => setShowDiagnosticsModal(true)}
              title={lang === 'bn' ? 'সিস্টেম ডায়াগনোসিস, হেলথ চেক ও SOS রিপোর্ট' : 'System Diagnostics & Health'}
              style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)' }}
            >
              <Activity size={17} />
            </button>

            {/* THREE-DOT MENU (ব্যাকআপ ও প্রয়োজনীয় প্রোগ্রাম মেনু) */}
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button
                className="btn-icon"
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                title={lang === 'bn' ? 'আরও অপশন, ব্যাকআপ ও টুলস মেনু' : 'More Options & Backup Menu'}
                style={{
                  background: showMoreMenu ? 'var(--mode-color)' : undefined,
                  color: showMoreMenu ? '#ffffff' : undefined,
                  border: showMoreMenu ? 'none' : undefined,
                  position: 'relative'
                }}
              >
                <MoreVertical size={18} />
                {/* Cloud indicator dot */}
                {businessSettings.googleDriveWebhookUrl && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: '#10b981',
                      border: '1.5px solid var(--bg-secondary)'
                    }}
                    title={lang === 'bn' ? 'গুগল ড্রাইভ সক্রিয়' : 'Google Drive Active'}
                  />
                )}
              </button>

              {/* DROPDOWN MENU */}
              {showMoreMenu && (
                <div
                  className="navbar-more-dropdown animate-fade-in"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '320px',
                    maxHeight: 'calc(100dvh - 140px)',
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehavior: 'contain',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '14px',
                    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45)',
                    padding: '8px 8px 40px 8px',
                    zIndex: 1000,
                    backdropFilter: 'blur(16px)'
                  }}
                >
                  {/* HEADER */}
                  <div style={{
                    position: 'sticky',
                    top: '-8px',
                    background: 'var(--bg-secondary)',
                    zIndex: 10,
                    padding: '8px 10px 6px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTopLeftRadius: '12px',
                    borderTopRightRadius: '12px'
                  }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                      {lang === 'bn' ? 'টুলস ও ব্যাকআপ হাব' : 'TOOLS & BACKUP HUB'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: '600' }}>
                      v2.4.0
                    </span>
                  </div>

                  {/* OPERATING MODE SELECTOR (1-Click Switch: Dual / Business / Personal) */}
                  <div style={{ padding: '8px 10px', background: 'var(--bg-primary)', borderRadius: '10px', margin: '6px 0', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{lang === 'bn' ? '⚡ সিস্টেম মোড (Operating Mode):' : 'Operating Mode:'}</span>
                      <span style={{ color: 'var(--mode-color)', fontWeight: '800' }}>
                        {operatingMode === 'dual' ? (lang === 'bn' ? '🔄 ডুয়েল' : 'Dual') : operatingMode === 'business_only' ? (lang === 'bn' ? '🏢 ব্যবসা' : 'Business') : (lang === 'bn' ? '👤 পার্সোনাল' : 'Personal')}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => { setOperatingMode('dual'); setShowMoreMenu(false); }}
                        style={{
                          padding: '5px 2px',
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          borderRadius: '6px',
                          border: operatingMode === 'dual' ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                          background: operatingMode === 'dual' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                          color: operatingMode === 'dual' ? '#10b981' : 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                      >
                        🔄 ডুয়েল
                      </button>
                      <button
                        type="button"
                        onClick={() => { setOperatingMode('business_only'); setShowMoreMenu(false); }}
                        style={{
                          padding: '5px 2px',
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          borderRadius: '6px',
                          border: operatingMode === 'business_only' ? '1.5px solid #6366f1' : '1px solid var(--border-color)',
                          background: operatingMode === 'business_only' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                          color: operatingMode === 'business_only' ? '#6366f1' : 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                      >
                        🏢 ব্যবসা
                      </button>
                      <button
                        type="button"
                        onClick={() => { setOperatingMode('personal_only'); setShowMoreMenu(false); }}
                        style={{
                          padding: '5px 2px',
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          borderRadius: '6px',
                          border: operatingMode === 'personal_only' ? '1.5px solid #06b6d4' : '1px solid var(--border-color)',
                          background: operatingMode === 'personal_only' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                          color: operatingMode === 'personal_only' ? '#06b6d4' : 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                      >
                        👤 পার্সোনাল
                      </button>
                    </div>
                  </div>

                  {/* DIRECT SUPER ADMIN BUTTON */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      if (isSuperAdmin) {
                        setActiveTab('super_admin');
                        showToast(lang === 'bn' ? '🛡️ সুপার অ্যাডমিন প্যানেল খোলা হয়েছে' : 'Super Admin opened');
                      } else {
                        setShowMasterPinModal(true);
                      }
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      fontSize: '0.84rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      textAlign: 'left',
                      marginBottom: '6px',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                  >
                    <ShieldCheck size={16} style={{ color: '#ef4444' }} />
                    <div style={{ flex: 1 }}>
                      <div>{lang === 'bn' ? '🛡️ সুপার অ্যাডমিন প্যানেল' : '🛡️ Super Admin Panel'}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                        {lang === 'bn' ? 'মাস্টার পিন ও সিস্টেম লাইসেন্স' : 'Master PIN & License'}
                      </div>
                    </div>
                  </button>

                  {/* SECTION 0: SYSTEM HEALTH & DIAGNOSTICS */}
                  <div style={{ padding: '6px 0 4px', borderBottom: '1px solid var(--border-color)' }}>
                    <button
                      onClick={() => { setShowDiagnosticsModal(true); setShowMoreMenu(false); }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981',
                        fontSize: '0.84rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.18)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'}
                    >
                      <Activity size={18} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '800' }}>{lang === 'bn' ? '🩺 সিস্টেম ডায়াগনোসিস ও SOS' : 'System Diagnostics & SOS'}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'প্রিন্টার, ডাটাবেজ টেস্ট ও সাপোর্ট টিকিট' : 'Printer & storage health'}</div>
                      </div>
                      <span style={{ fontSize: '0.65rem', background: '#10b981', color: '#ffffff', padding: '1px 5px', borderRadius: '4px', fontWeight: '800' }}>
                        SCAN
                      </span>
                    </button>
                  </div>

                  {/* SECTION 1: CLOUD & BACKUP (গুগল ড্রাইভ ও ব্যাকআপ সিস্টেম) */}
                  <div style={{ padding: '4px 0' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--mode-color)', fontWeight: '700', padding: '4px 10px', textTransform: 'uppercase' }}>
                      ☁️ {lang === 'bn' ? 'ক্লাউড ও ব্যাকআপ সিস্টেম' : 'Cloud & Backup System'}
                    </div>

                    {/* Google Drive Sync Now */}
                    <button
                      onClick={handleQuickDriveSync}
                      disabled={isDriveSyncing}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Cloud size={16} style={{ color: '#3b82f6' }} />
                        <div>
                          <div style={{ fontWeight: '600' }}>
                            {lang === 'bn' ? 'গুগল ড্রাইভে সিঙ্ক করুন' : 'Sync to Google Drive'}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {isDriveConnected
                              ? (businessSettings.googleDriveLastSync ? `শেষ: ${businessSettings.googleDriveLastSync.split(' ')[1]}` : (lang === 'bn' ? 'ড্রাইভ সংযুক্ত' : 'Drive Connected'))
                              : (businessSettings.googleDriveWebhookUrl
                                ? (businessSettings.googleDriveLastSync ? `শেষ: ${businessSettings.googleDriveLastSync.split(' ')[1]}` : 'ওয়েবহুক সংযুক্ত')
                                : (lang === 'bn' ? 'সেটআপ প্রয়োজন' : 'Needs Setup'))}
                          </div>
                        </div>
                      </div>
                      <span className="badge" style={{ fontSize: '0.65rem', background: (isDriveConnected || businessSettings.googleDriveWebhookUrl) ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: (isDriveConnected || businessSettings.googleDriveWebhookUrl) ? '#10b981' : '#f59e0b' }}>
                        {(isDriveConnected || businessSettings.googleDriveWebhookUrl) ? 'Live' : 'Setup'}
                      </span>
                    </button>

                    {/* Quick Snapshot */}
                    <button
                      onClick={handleQuickSnapshot}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <Camera size={16} style={{ color: '#10b981' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600' }}>{lang === 'bn' ? 'ইনস্ট্যান্ট স্ন্যাপশট ব্যাকআপ' : 'Instant Snapshot Backup'}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? '১-ক্লিকে পূর্বের অবস্থায় ফেরা' : '1-click local rollback'}</div>
                      </div>
                    </button>

                    {/* Manual JSON Download */}
                    <button
                      onClick={() => { exportAllData(); setShowMoreMenu(false); }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <Download size={16} style={{ color: 'var(--text-dim)' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600' }}>{lang === 'bn' ? 'ব্যাকআপ ডাউনলোড (.json)' : 'Download Backup (.json)'}</div>
                      </div>
                    </button>

                    {/* Manual JSON Restore */}
                    <button
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <Upload size={16} style={{ color: 'var(--text-dim)' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600' }}>{lang === 'bn' ? 'ব্যাকআপ ফাইল রিস্টোর...' : 'Restore Backup File...'}</div>
                      </div>
                    </button>

                    {/* Excel & PDF Export/Import Hub */}
                    <button
                      onClick={() => { setShowExportImportHub(true); setShowMoreMenu(false); }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <FileSpreadsheet size={16} style={{ color: '#0f766e' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600' }}>{lang === 'bn' ? 'এক্সেল ও পিডিএফ ডেটা হাব' : 'Excel & PDF Data Hub'}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'Excel ও PDF এক্সপোর্ট ও স্মার্ট ইমপোর্ট' : 'Excel/PDF Export & Import'}</div>
                      </div>
                    </button>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".json"
                      style={{ display: 'none' }}
                      onChange={handleFileRestore}
                    />
                  </div>

                  <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />

                  {/* SECTION 2: SMART UTILITIES (প্রয়োজনীয় স্মার্ট টুলস ও প্রোগ্রাম) */}
                  <div style={{ padding: '4px 0' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--mode-color)', fontWeight: '700', padding: '4px 10px', textTransform: 'uppercase' }}>
                      🛠️ {lang === 'bn' ? 'প্রয়োজনীয় স্মার্ট টুলস' : 'Smart Utilities'}
                    </div>

                    {/* Quick Calculator */}
                    <button
                      onClick={() => { setActiveTool('calculator'); setShowMoreMenu(false); }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <Calculator size={16} style={{ color: '#a855f7' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600' }}>{lang === 'bn' ? 'দ্রুত ক্যালকুলেটর (Calculator)' : 'Quick Calculator'}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'হিসাব ও যোগ-বিয়োগের পপআপ' : 'Popup digital calculator'}</div>
                      </div>
                    </button>

                    {/* Daily Cash & Drawer Balance */}
                    <button
                      onClick={() => { setActiveTool('cash'); setShowMoreMenu(false); }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <Wallet size={16} style={{ color: '#10b981' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600' }}>{lang === 'bn' ? 'আজকের নগদ ক্যাশ ও ড্রয়ার' : 'Daily Cash & Drawer'}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'দৈনিক ক্যাশ ইন-আউট ব্যালেন্স' : 'Today cash inflow & outflow'}</div>
                      </div>
                    </button>

                    {/* Scratchpad & Notes */}
                    <button
                      onClick={() => { setActiveTool('notes'); setShowMoreMenu(false); }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <FileText size={16} style={{ color: '#f59e0b' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600' }}>{lang === 'bn' ? 'চিরকুট ও দ্রুত নোটপ্যাড' : 'Quick Sticky Notes'}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'জরুরি চিরকুট ও মেমো সংরক্ষণ' : 'Autosaved scratchpad'}</div>
                      </div>
                    </button>

                    {/* Category Hub (Add / Rename / Delete) */}
                    <button
                      onClick={() => { setActiveTool('categories'); setShowMoreMenu(false); }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <Tag size={16} style={{ color: '#06b6d4' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600' }}>{lang === 'bn' ? '🏷️ ক্যাটাগরি হাব (ম্যানেজার)' : '🏷️ Categories Hub'}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'সব ধরনের ক্যাটাগরি রিনেম, যোগ ও মুছুন' : 'Add, rename, delete all categories'}</div>
                      </div>
                    </button>

                    {/* Fullscreen Toggle */}
                    <button
                      onClick={toggleFullscreen}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {isFullscreen ? <Minimize2 size={16} style={{ color: '#6366f1' }} /> : <Maximize2 size={16} style={{ color: '#6366f1' }} />}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600' }}>
                          {isFullscreen ? (lang === 'bn' ? 'ফুলস্ক্রিন থেকে প্রস্থান' : 'Exit Fullscreen') : (lang === 'bn' ? 'ফুলস্ক্রিন ডিসপ্লে মোড' : 'Fullscreen Display Mode')}
                        </div>
                      </div>
                    </button>

                    {/* Shortcuts Guide */}
                    <button
                      onClick={() => { setActiveTool('shortcuts'); setShowMoreMenu(false); }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <Keyboard size={16} style={{ color: 'var(--text-dim)' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600' }}>{lang === 'bn' ? 'কীবোর্ড শর্টকাট গাইড' : 'Keyboard Shortcuts'}</div>
                      </div>
                    </button>

                    {/* Customer Support & Helpdesk */}
                    <button
                      onClick={() => { openHelpSupport(); setShowMoreMenu(false); }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'rgba(16, 185, 129, 0.08)',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        marginTop: '3px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.18)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'}
                    >
                      <HelpCircle size={16} style={{ color: '#10b981' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', color: '#10b981' }}>{lang === 'bn' ? '📞 গ্রাহক সেবা ও হেল্পডেস্ক' : 'Customer Support & Helpdesk'}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'WhatsApp, FB, Telegram ও কল' : 'WhatsApp, FB, Telegram & Hotline'}</div>
                      </div>
                    </button>
                  </div>

                  <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />

                  {/* SECTION 3: SUPABASE & AUTH */}
                  <div style={{ padding: '4px 0' }}>
                    <div style={{ fontSize: '0.7rem', color: '#3ecf8e', fontWeight: '700', padding: '4px 10px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Database size={12} />
                      <span>{lang === 'bn' ? 'সুপাবেস ও একাউন্ট' : 'Supabase & Account'}</span>
                    </div>

                    {/* Operating Mode Selector (Dual vs Business Only vs Personal Only) */}
                    <div style={{ padding: '8px 10px', background: 'var(--bg-primary)', borderRadius: '8px', margin: '4px 0', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                          {lang === 'bn' ? '⚡ অপারেটিং মোড (সুপারফাস্ট স্পিড):' : '⚡ Operating Mode:'}
                        </span>
                        <span style={{ fontSize: '0.65rem', background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', padding: '1px 5px', borderRadius: '4px', fontWeight: '800' }}>
                          SPEED
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                        {[
                          { id: 'dual', label: lang === 'bn' ? '🔄 ডুয়েল' : 'Dual', desc: 'উভয় মোড' },
                          { id: 'business_only', label: lang === 'bn' ? '🏢 ব্যবসা' : 'Business', desc: 'শুধু ইআরপি' },
                          { id: 'personal_only', label: lang === 'bn' ? '👤 পার্সোনাল' : 'Personal', desc: 'শুধু পার্সোনাল' }
                        ].map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => { setOperatingMode(m.id); setShowMoreMenu(false); }}
                            style={{
                              padding: '5px 2px',
                              fontSize: '0.68rem',
                              fontWeight: '700',
                              borderRadius: '6px',
                              border: operatingMode === m.id ? '1.5px solid var(--mode-color)' : '1px solid var(--border-color)',
                              background: operatingMode === m.id ? 'var(--mode-color)' : 'transparent',
                              color: operatingMode === m.id ? '#ffffff' : 'var(--text-muted)',
                              cursor: 'pointer',
                              textAlign: 'center',
                              transition: 'all 0.15s ease'
                            }}
                            title={m.desc}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Auth Modal Switcher */}
                    <button
                      onClick={() => { openAuthModal('login'); setShowMoreMenu(false); }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <ShieldCheck size={16} style={{ color: '#6366f1' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600' }}>
                          {user ? (lang === 'bn' ? 'ব্যবহারকারী অ্যাকাউন্ট / পিন' : 'User Account / PIN') : (lang === 'bn' ? 'লগইন / সাইন আপ' : 'Login / Register')}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {user ? `${user.email} (${user.role})` : (lang === 'bn' ? 'মালিক ও ক্যাশিয়ার প্যানেল' : 'Owner & Staff Panel')}
                        </div>
                      </div>
                    </button>

                    {/* Quick Role Switcher for Owner & Staff Testing */}
                    <div style={{ padding: '6px 10px', background: 'var(--bg-primary)', borderRadius: '8px', margin: '6px 0', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '5px' }}>
                        {lang === 'bn' ? 'অ্যাক্টিভ রোল পরিবর্তন (টেস্টিং ভিউ):' : 'Switch Role (Test View):'}
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
                            onClick={() => { switchRole(r.id); setShowMoreMenu(false); }}
                            style={{
                              padding: '4px 2px',
                              fontSize: '0.7rem',
                              fontWeight: '700',
                              borderRadius: '4px',
                              border: role === r.id ? `1.5px solid ${r.color}` : '1px solid var(--border-color)',
                              background: role === r.id ? r.color : 'transparent',
                              color: role === r.id ? '#ffffff' : 'var(--text-muted)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Logout Button if logged in */}
                    {user && (
                      <button
                        onClick={() => { logout(); setShowMoreMenu(false); }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'rgba(239, 68, 68, 0.08)',
                          color: '#ef4444',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                          marginTop: '4px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
                      >
                        <LogOut size={16} style={{ color: '#ef4444' }} />
                        <div style={{ flex: 1, fontWeight: '700' }}>
                          {lang === 'bn' ? 'লগআউট (Sign Out)' : 'Sign Out'}
                        </div>
                      </button>
                    )}
                  </div>

                  <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />

                  {/* SECTION 4: SYSTEM & DATABASE */}
                  <div style={{ padding: '6px 10px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <HardDrive size={13} />
                      <span>{lang === 'bn' ? 'স্টোরেজ:' : 'Storage:'} ~{getStorageSizeKb()} KB</span>
                    </div>

                    <button
                      onClick={() => { resetToDemo(); setShowMoreMenu(false); }}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                    >
                      <RefreshCw size={12} />
                      <span>{lang === 'bn' ? 'ডেমো রিসেট' : 'Reset Demo'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sub Navigation Bar for Selected Profile (Auto-wraps neatly within screen) */}
        <div className="subnav-scroll-container">
          <div
            style={{
              maxWidth: '1440px',
              margin: '0 auto',
              padding: '4px 0.75rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 11px',
                    borderRadius: '8px',
                    background: isActive ? 'var(--mode-color)' : 'rgba(255, 255, 255, 0.04)',
                    border: isActive ? '1px solid var(--mode-color)' : '1px solid var(--border-color)',
                    color: isActive ? '#ffffff' : 'var(--text-main)',
                    fontWeight: isActive ? '700' : '600',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isActive ? '0 2px 8px var(--mode-glow)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'var(--bg-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  }}
                >
                  <Icon size={14} style={{ color: isActive ? '#ffffff' : 'var(--mode-color)' }} />
                  <span>{item.label}</span>
                  {item.highlight && (
                    <span
                      style={{
                        background: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(239, 68, 68, 0.15)',
                        color: isActive ? '#ffffff' : '#ef4444',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        fontSize: '0.62rem',
                        fontWeight: '800'
                      }}
                    >
                      HOT
                    </span>
                  )}
                </button>
              );
            })}

            {/* Quick All-Modules Drawer Launcher for Desktop */}
            <button
              type="button"
              onClick={() => setShowMobileDrawer(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px dashed #6366f1',
                color: '#6366f1',
                fontWeight: '700',
                fontSize: '0.78rem',
                cursor: 'pointer',
                marginLeft: 'auto',
                transition: 'all 0.15s ease'
              }}
              title={lang === 'bn' ? 'সকল মডিউল ও মেনু হাব এক নজরে খুলুন' : 'Open All Modules Drawer Hub'}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.18)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)'}
            >
              <Menu size={14} />
              <span>{lang === 'bn' ? '☰ মেনু হাব' : '☰ All Modules'}</span>
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

      {/* ========================================================
          MODERN MOBILE BOTTOM NAVIGATION BAR (ANDROID / TOUCH)
          ======================================================== */}
      <nav className="mobile-bottom-nav no-print" aria-label="Mobile Navigation">
        {profile === 'business' ? (
          <>
            {/* 1. Dashboard */}
            <button
              type="button"
              className={`mobile-bottom-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setActiveTab('dashboard'); setShowMobileDrawer(false); }}
            >
              <LayoutDashboard size={20} />
              <span>{lang === 'bn' ? 'ড্যাশবোর্ড' : 'Home'}</span>
            </button>

            {/* 2. Debts */}
            <button
              type="button"
              className={`mobile-bottom-nav-item ${activeTab === 'debts' ? 'active' : ''}`}
              onClick={() => { setActiveTab('debts'); setShowMobileDrawer(false); }}
            >
              <HandCoins size={20} />
              <span>{lang === 'bn' ? 'দেনা-পাওনা' : 'Debts'}</span>
            </button>

            {/* 3. Center Hero POS Button */}
            <div className="mobile-bottom-hero-container">
              <button
                type="button"
                className={`mobile-bottom-hero-btn ${activeTab === 'pos' ? 'active' : ''}`}
                onClick={() => { setActiveTab('pos'); setShowMobileDrawer(false); }}
                title={lang === 'bn' ? 'POS সেলস কাউন্টার' : 'POS Checkout'}
              >
                <ScanLine size={24} />
                <span className="hero-btn-label">POS</span>
              </button>
            </div>

            {/* 4. Inventory */}
            <button
              type="button"
              className={`mobile-bottom-nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => { setActiveTab('inventory'); setShowMobileDrawer(false); }}
            >
              <Boxes size={20} />
              <span>{lang === 'bn' ? 'ইনভেন্টরি' : 'Stock'}</span>
            </button>

            {/* 5. Menu Drawer */}
            <button
              type="button"
              className={`mobile-bottom-nav-item ${showMobileDrawer ? 'active' : ''}`}
              onClick={() => setShowMobileDrawer(!showMobileDrawer)}
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
              onClick={() => { setActiveTab('dashboard'); setShowMobileDrawer(false); }}
            >
              <LayoutDashboard size={20} />
              <span>{lang === 'bn' ? 'ড্যাশবোর্ড' : 'Home'}</span>
            </button>

            {/* 2. Daily Expenses */}
            <button
              type="button"
              className={`mobile-bottom-nav-item ${activeTab === 'daily' ? 'active' : ''}`}
              onClick={() => { setActiveTab('daily'); setShowMobileDrawer(false); }}
            >
              <ShoppingCart size={20} />
              <span>{lang === 'bn' ? 'দৈনিক খরচ' : 'Daily'}</span>
            </button>

            {/* 3. Center Hero Family Button */}
            <div className="mobile-bottom-hero-container">
              <button
                type="button"
                className={`mobile-bottom-hero-btn personal ${activeTab === 'family' ? 'active' : ''}`}
                onClick={() => { setActiveTab('family'); setShowMobileDrawer(false); }}
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
              onClick={() => { setActiveTab('debts'); setShowMobileDrawer(false); }}
            >
              <HandCoins size={20} />
              <span>{lang === 'bn' ? 'দেনা-পাওনা' : 'Debts'}</span>
            </button>

            {/* 5. Menu Drawer */}
            <button
              type="button"
              className={`mobile-bottom-nav-item ${showMobileDrawer ? 'active' : ''}`}
              onClick={() => setShowMobileDrawer(!showMobileDrawer)}
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
            </div>
          </div>
        </div>
      )}
    </>
  );
};
