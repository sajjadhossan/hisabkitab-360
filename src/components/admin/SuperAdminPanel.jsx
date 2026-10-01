import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Sliders,
  Award,
  Key,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Save,
  RefreshCw,
  Sparkles,
  Building2,
  Phone,
  Mail,
  Globe,
  Trash2,
  ExternalLink,
  Layers,
  Copy,
  ScanLine,
  Boxes,
  HandCoins,
  FileText,
  FileCheck,
  Calculator,
  Users,
  BadgeDollarSign,
  UserCheck,
  Cloud,
  Check,
  Store,
  Clock,
  ArrowRight,
  HelpCircle,
  TrendingUp,
  Printer,
  MessageCircle,
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  CircleDot,
  CheckCircle
} from 'lucide-react';
import { TemplateReviewModal } from '../common/TemplateReviewModal';

export const SuperAdminPanel = () => {
  const {
    operatingMode,
    setOperatingMode,
    licenseInfo,
    updateLicenseInfo,
    generateNewLicenseKey,
    toggleLicenseModule,
    applyPackagePreset,
    startFreshStore,
    MODULE_PRESETS,
    showToast,
    lang,
    setActiveTab,
    products,
    salesHistory,
    customers,
    invoices,
    activeIndustryId,
    switchIndustryTemplate,
    MASTER_INDUSTRY_TEMPLATES = [],
    INDUSTRY_SECTORS = [],
    branches = [],
    counterClosings = [],
    approveCounterClosing,
    cashMovements = [],
    adjustCounterCash
  } = useApp();

  const {
    user,
    isSuperAdmin,
    changeMasterPin,
    lockSuperAdmin,
    getMasterPin
  } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState('executive_ops'); // 'executive_ops' | 'modules' | 'templates' | 'license' | 'branding' | 'onboarding' | 'security'
  const [templateSearch, setTemplateSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [copiedKey, setCopiedKey] = useState(false);
  const [generatedKey, setGeneratedKey] = useState('');
  const [showKeyConfirm, setShowKeyConfirm] = useState(false);

  // Executive Ops & Template Review states
  const [showTemplateReviewModal, setShowTemplateReviewModal] = useState(false);
  const [shiftFilter, setShiftFilter] = useState('all'); // 'all' | 'pending' | 'approved'
  const [cashAdjustModal, setCashAdjustModal] = useState({
    isOpen: false,
    branchId: '',
    counterId: '',
    counterName: '',
    type: 'deposit',
    amount: '',
    reason: ''
  });

  // Vendor branding state
  const [vendorForm, setVendorForm] = useState({
    resellerName: licenseInfo?.resellerName || 'হিসাব কিতাব ৩৬০ টেকনোলজিস',
    resellerPhone: licenseInfo?.resellerPhone || '+880 1700-000000',
    resellerEmail: licenseInfo?.resellerEmail || 'support@hisabkitab360.com',
    resellerWebsite: licenseInfo?.resellerWebsite || 'www.hisabkitab360.com'
  });

  // Client licensing form state
  const [licenseForm, setLicenseForm] = useState({
    clientShopName: licenseInfo?.clientShopName || '',
    planName: licenseInfo?.planName || 'Enterprise Lifetime License',
    status: licenseInfo?.status || 'active',
    expiryDate: licenseInfo?.expiryDate || '2099-12-31'
  });

  // Master PIN change state
  const [currentMasterPin, setCurrentMasterPin] = useState('');
  const [newMasterPin, setNewMasterPin] = useState('');
  const [confirmMasterPin, setConfirmMasterPin] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState({ text: '', type: '' });

  // Clean slate store form state
  const [cleanStoreForm, setCleanStoreForm] = useState({
    shopName: '',
    ownerName: '',
    phone: '',
    address: 'ঢাকা, বাংলাদেশ',
    bin: '',
    currency: '৳',
    confirmText: ''
  });

  const modulesList = [
    {
      id: 'pos',
      name: lang === 'bn' ? 'POS টার্মিনাল ও দ্রুত বিলিং' : 'POS Terminal & Quick Billing',
      desc: lang === 'bn' ? 'বারকোড স্ক্যানিং, ক্যাশ ড্রয়ার ও থার্মাল রিসিপ্ট প্রিন্টিং' : 'Barcode scanning, cash drawer kick & thermal receipts',
      icon: ScanLine,
      color: '#10b981',
      category: 'Core'
    },
    {
      id: 'inventory',
      name: lang === 'bn' ? 'পণ্য স্টক ও ইনভেন্টরি' : 'Inventory & Stock Management',
      desc: lang === 'bn' ? 'স্টক ট্র্যাকিং, ব্যাচ, ক্রয় মূল্য, বিক্রয় মূল্য ও লো-স্টক অ্যালার্ট' : 'Stock alerts, batch tracking, buy/sell prices',
      icon: Boxes,
      color: '#3b82f6',
      category: 'Core'
    },
    {
      id: 'debts',
      name: lang === 'bn' ? 'নগদ ও বাকি খাতা (দেনা-পাওনা)' : 'Debt Ledger (Due Khata)',
      desc: lang === 'bn' ? 'কাস্টমার ও মহাজনের বাকির হিসাব, তাগাদা ও পেমেন্ট হিস্ট্রি' : 'Customer & supplier dues tracking with SMS reminder',
      icon: HandCoins,
      color: '#f59e0b',
      category: 'Finance'
    },
    {
      id: 'invoices',
      name: lang === 'bn' ? 'ইনভয়েস ও বিক্রয় চালান' : 'Invoices & Sales Challan',
      desc: lang === 'bn' ? 'পেশাদার A4/Thermal ট্যাক্স চালান ও কিউআর ভেরিফিকেশন' : 'Tax invoices, partial payments & QR verification',
      icon: FileText,
      color: '#06b6d4',
      category: 'Sales'
    },
    {
      id: 'quotations',
      name: lang === 'bn' ? 'দরপত্র ও কোটেশন ম্যানেজার' : 'Quotations & Estimates',
      desc: lang === 'bn' ? 'কাস্টমারদের এস্টিমেট দেওয়া এবং ১-ক্লিকে ইনভয়েসে রূপান্তর' : 'Create proposals and convert to live sales in 1-click',
      icon: FileCheck,
      color: '#8b5cf6',
      category: 'Sales'
    },
    {
      id: 'erp',
      name: lang === 'bn' ? 'ERP ও প্রফিট/লস অ্যাকাউন্টস' : 'ERP Accounting & P/L',
      desc: lang === 'bn' ? 'ব্যালেন্স শিট, লেজার, ভাউচার ও সম্পূর্ণ লাভ-ক্ষতির বিশ্লেষণ' : 'Double-entry bookkeeping, ledger & net profit analytics',
      icon: Calculator,
      color: '#ec4899',
      category: 'Finance'
    },
    {
      id: 'crm',
      name: lang === 'bn' ? 'CRM ও কাস্টমার রিলেশন' : 'CRM & Customer Loyalty',
      desc: lang === 'bn' ? 'কাস্টমার প্রোফাইল, ক্রেডিট লিমিট ও বাকির খাতা নিয়ন্ত্রণ' : 'Customer profiles, credit limits and purchase history',
      icon: Users,
      color: '#6366f1',
      category: 'Sales'
    },
    {
      id: 'hr',
      name: lang === 'bn' ? 'HR ও স্টাফ পেরোল/স্যালারি' : 'HR & Staff Payroll',
      desc: lang === 'bn' ? 'কর্মচারীদের হাজিরা, বেতন শীট, কমিশন ও অ্যাডভান্স লোন' : 'Staff attendance, salary slips, commissions & loans',
      icon: BadgeDollarSign,
      color: '#14b8a6',
      category: 'Enterprise'
    },
    {
      id: 'sr',
      name: lang === 'bn' ? 'এসআর ফিল্ড ফোর্স ও অর্ডার বুকিং' : 'SR Field Force Management',
      desc: lang === 'bn' ? 'মার্কেটে এসআরদের ভিজিট, টার্গেট ও ফিল্ড কালেকশন ট্র্যাকিং' : 'Market visit tracking, targets and field collection',
      icon: UserCheck,
      color: '#f97316',
      category: 'Enterprise'
    },
    {
      id: 'branch_control',
      name: lang === 'bn' ? 'মাল্টি-ব্রাঞ্চ ও ক্যাশ কাউন্টার' : 'Multi-Branch & Cash Counters',
      desc: lang === 'bn' ? 'একাধিক দোকান শাখা এবং প্রতিটি কাউন্টারের ওপেনিং/ক্লোজিং ক্যাশ' : 'Manage multiple branch stores & individual cashier shifts',
      icon: Building2,
      color: '#e11d48',
      category: 'Enterprise'
    },
    {
      id: 'google_drive_sync',
      name: lang === 'bn' ? 'গুগল ড্রাইভ ক্লাউড ব্যাকআপ' : 'Google Drive Cloud Auto-Sync',
      desc: lang === 'bn' ? '১-ক্লিকে ক্লায়েন্টের নিজস্ব গুগল ড্রাইভে অটো ও সুরক্ষিত ব্যাকআপ' : 'Automated 1-click cloud backups to client Google Drive',
      icon: Cloud,
      color: '#0284c7',
      category: 'Cloud'
    }
  ];

  // Helper to copy key
  const handleCopyKey = (keyText) => {
    if (!keyText) return;
    navigator.clipboard.writeText(keyText);
    setCopiedKey(true);
    showToast(lang === 'bn' ? '📋 লাইসেন্স কি ক্লিপবোর্ডে কপি করা হয়েছে!' : 'License key copied to clipboard!');
    setTimeout(() => setCopiedKey(false), 2500);
  };

  // Generate key based on current parameters
  const handleGenerateKey = () => {
    const shop = licenseForm.clientShopName || 'STORE';
    const cleanPrefix = shop.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'HK36';
    const randA = Math.floor(1000 + Math.random() * 9000);
    const randB = Math.floor(1000 + Math.random() * 9000);
    const currentYear = new Date().getFullYear();
    const newKey = `HK360-${cleanPrefix}-${currentYear}-${randA}-${randB}`;
    setGeneratedKey(newKey);
  };

  const handleApplyLicenseForm = () => {
    updateLicenseInfo({
      clientShopName: licenseForm.clientShopName,
      planName: licenseForm.planName,
      status: licenseForm.status,
      expiryDate: licenseForm.expiryDate,
      ...(generatedKey ? { licenseKey: generatedKey } : {})
    });
    showToast(lang === 'bn' ? '✓ ক্লায়েন্ট লাইসেন্স সফলভাবে আপডেট করা হয়েছে!' : 'Client license successfully updated!');
  };

  const handleSaveVendorForm = () => {
    updateLicenseInfo(vendorForm);
    showToast(lang === 'bn' ? '✓ ভেন্ডর ও রিসেলার ব্র্যান্ডিং তথ্য সংরক্ষিত হয়েছে!' : 'Vendor branding info saved!');
  };

  const handlePinChangeSubmit = (e) => {
    e.preventDefault();
    const storedPin = getMasterPin();
    if (currentMasterPin !== storedPin && currentMasterPin !== '9999') {
      setPinChangeMsg({ text: lang === 'bn' ? 'বর্তমান মাস্টার পিনটি ভুল!' : 'Incorrect current master PIN!', type: 'danger' });
      return;
    }
    if (newMasterPin.length < 4) {
      setPinChangeMsg({ text: lang === 'bn' ? 'নতুন পিন কমপক্ষে ৪ সংখ্যার হতে হবে!' : 'New PIN must be at least 4 digits!', type: 'danger' });
      return;
    }
    if (newMasterPin !== confirmMasterPin) {
      setPinChangeMsg({ text: lang === 'bn' ? 'কনফার্ম পিন মিলছে না!' : 'PINs do not match!', type: 'danger' });
      return;
    }
    const success = changeMasterPin(newMasterPin);
    if (success) {
      setPinChangeMsg({ text: lang === 'bn' ? '🎉 মাস্টার পিন সফলভাবে পরিবর্তন করা হয়েছে!' : 'Master PIN successfully updated!', type: 'success' });
      setCurrentMasterPin('');
      setNewMasterPin('');
      setConfirmMasterPin('');
    } else {
      setPinChangeMsg({ text: lang === 'bn' ? 'পিন সংরক্ষণ ব্যর্থ হয়েছে' : 'Failed to save PIN', type: 'danger' });
    }
  };

  const handleCleanSlateExecute = (e) => {
    e.preventDefault();
    if (cleanStoreForm.confirmText !== 'RESET') {
      alert(lang === 'bn' ? 'নিশ্চিত করতে "RESET" শব্দটি বড়হাতে লিখুন!' : 'Type "RESET" to confirm!');
      return;
    }
    startFreshStore({
      shopName: cleanStoreForm.shopName,
      ownerName: cleanStoreForm.ownerName,
      phone: cleanStoreForm.phone,
      address: cleanStoreForm.address,
      bin: cleanStoreForm.bin,
      currency: cleanStoreForm.currency || '৳'
    });
    showToast(lang === 'bn' ? '🎉 নতুন ক্লায়েন্টের জন্য ফ্রেশ স্টোর প্রস্তুত করা হয়েছে!' : 'Clean store prepared for client!');
    setCleanStoreForm({
      shopName: '',
      ownerName: '',
      phone: '',
      address: 'ঢাকা, বাংলাদেশ',
      bin: '',
      currency: '৳',
      confirmText: ''
    });
  };

  // Calculate days remaining
  const calculateDaysRemaining = () => {
    if (!licenseInfo?.expiryDate || licenseInfo.expiryDate.startsWith('2099')) return 'Lifetime';
    const today = new Date();
    const expiry = new Date(licenseInfo.expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysLeft = calculateDaysRemaining();

  return (
    <div className="fade-in" style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Top Banner & Super Admin Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
        border: '1px solid rgba(239, 68, 68, 0.35)',
        borderRadius: '20px',
        padding: '1.75rem',
        marginBottom: '1.5rem',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(239, 68, 68, 0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.15), transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 8px 24px rgba(239, 68, 68, 0.45)',
              fontSize: '1.8rem'
            }}>
              🛡️
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.02em' }}>
                  {lang === 'bn' ? 'সুপার অ্যাডমিন ও ভেন্ডর মাস্টার কন্ট্রোল' : 'Super Admin & Vendor Master Suite'}
                </h1>
                <span style={{
                  background: 'rgba(239, 68, 68, 0.25)',
                  border: '1px solid #ef4444',
                  color: '#fca5a5',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Master Control
                </span>
              </div>
              <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                {lang === 'bn' 
                  ? 'সফটওয়্যারের নির্মাতা ও বিক্রেতা হিসেবে প্রতিটি ক্লায়েন্টের ফিচার, লাইসেন্স মেয়াদ ও প্যাকেজ নিয়ন্ত্রণ করুন।' 
                  : 'Manage client subscriptions, toggle modules on/off, generate license keys and control white-label branding.'}
              </p>
            </div>
          </div>

          {/* Quick Metrics / Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '8px 14px',
              borderRadius: '12px',
              textAlign: 'right'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>বর্তমান স্ট্যাটাস</div>
              <div style={{
                fontSize: '0.92rem',
                fontWeight: '800',
                color: licenseInfo?.status === 'active' ? '#10b981' : licenseInfo?.status === 'trial' ? '#f59e0b' : '#ef4444',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: licenseInfo?.status === 'active' ? '#10b981' : licenseInfo?.status === 'trial' ? '#f59e0b' : '#ef4444',
                  boxShadow: `0 0 8px ${licenseInfo?.status === 'active' ? '#10b981' : '#f59e0b'}`
                }} />
                {licenseInfo?.status === 'active' ? 'সক্রিয় (Active)' : licenseInfo?.status === 'trial' ? 'ট্রায়াল (Trial)' : 'লক করা (Locked)'}
              </div>
            </div>

            <button
              onClick={() => setActiveTab('pos')}
              className="btn"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                padding: '9px 16px',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
              title="ক্লায়েন্ট অ্যাপের প্রিভিউ দেখুন"
            >
              <Store size={16} />
              {lang === 'bn' ? 'দোকান ভিউ (POS)' : 'Store View'}
            </button>

            <button
              onClick={() => {
                lockSuperAdmin();
                setActiveTab('dashboard');
                showToast(lang === 'bn' ? 'সুপার অ্যাডমিন লক করা হয়েছে' : 'Super Admin locked');
              }}
              className="btn"
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#fca5a5',
                padding: '9px 16px',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <Lock size={16} />
              {lang === 'bn' ? 'লক করুন' : 'Lock Panel'}
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginTop: '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: '1rem',
          overflowX: 'auto'
        }}>
          {[
            { 
              id: 'executive_ops', 
              label: lang === 'bn' ? '⚡ লাইভ অপারেশন ও শিফট অ্যাপ্রুভাল' : '⚡ Live Ops & Shift Approvals', 
              icon: HandCoins,
              badge: counterClosings.filter(c => c.status !== 'approved').length
            },
            { id: 'modules', label: lang === 'bn' ? '🎛️ মডিউল সুইচবোর্ড' : '🎛️ Module Switchboard', icon: Sliders },
            { id: 'templates', label: lang === 'bn' ? '🏢 ১০০+ ইন্ডাস্ট্রি টেমপ্লেট' : '🏢 100+ Industry Templates', icon: Store },
            { id: 'license', label: lang === 'bn' ? '📜 লাইসেন্স ও মেয়াদ লক' : '📜 License & Subscription', icon: Award },
            { id: 'branding', label: lang === 'bn' ? '🏢 ভেন্ডর ব্র্যান্ডিং' : '🏢 Vendor White-Label', icon: Building2 },
            { id: 'onboarding', label: lang === 'bn' ? '🧹 ফ্রেশ ক্লায়েন্ট সেটআপ' : '🧹 Clean Slate Setup', icon: Sparkles },
            { id: 'security', label: lang === 'bn' ? '🔐 মাস্টার সিকিউরিটি ও পিন' : '🔐 Master Security & PIN', icon: Key }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                border: 'none',
                background: activeSubTab === tab.id ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'rgba(255, 255, 255, 0.06)',
                color: activeSubTab === tab.id ? '#ffffff' : '#94a3b8',
                fontWeight: '700',
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: activeSubTab === tab.id ? '0 4px 14px rgba(239, 68, 68, 0.35)' : 'none'
              }}
            >
              <tab.icon size={16} />
              {tab.label}
              {tab.badge > 0 && (
                <span style={{
                  background: '#f59e0b',
                  color: '#000000',
                  fontSize: '0.72rem',
                  fontWeight: '900',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  lineHeight: '1.2'
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* SUBTAB 0: EXECUTIVE OPERATIONS & SHIFT APPROVALS          */}
      {/* ======================================================== */}
      {activeSubTab === 'executive_ops' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Top Live Financial KPI Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem'
          }}>
            {/* Card 1: Active Drawer Cash */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 95, 70, 0.2))',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '16px',
              padding: '1.25rem',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {lang === 'bn' ? 'ড্রয়ারে বর্তমান ক্যাশ' : 'Active Drawer Cash'}
                </span>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <Wallet size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: '900', color: '#ffffff' }}>
                ৳{branches.reduce((acc, b) => acc + (b.counters || []).reduce((cAcc, c) => cAcc + (Number(c.openingFloat) || 0), 0), 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#a7f3d0', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CircleDot size={12} color="#10b981" />
                {branches.length}টি শাখা ও {branches.reduce((sum, b) => sum + (b.counters?.length || 0), 0)}টি সক্রিয় কাউন্টার ড্রয়ার
              </div>
            </div>

            {/* Card 2: Today's Sales */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(30, 64, 175, 0.2))',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '16px',
              padding: '1.25rem',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {lang === 'bn' ? 'আজকের বিক্রয় কালেকশন' : "Today's Sales Inflow"}
                </span>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                  <TrendingUp size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: '900', color: '#ffffff' }}>
                ৳{salesHistory
                  .filter(s => s.date?.startsWith(new Date().toISOString().split('T')[0]))
                  .reduce((sum, s) => sum + (Number(s.paidAmount) || 0), 0)
                  .toLocaleString()}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#bfdbfe', marginTop: '6px' }}>
                মোট {salesHistory.filter(s => s.date?.startsWith(new Date().toISOString().split('T')[0])).length} টি ক্যাশ মেমো চালান সম্পন্ন
              </div>
            </div>

            {/* Card 3: Pending Shift Approvals */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(180, 83, 9, 0.2))',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '16px',
              padding: '1.25rem',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#fde68a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {lang === 'bn' ? 'অনুমোদনের অপেক্ষায় শিফট' : 'Pending Shift Approvals'}
                </span>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                  <Clock size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: '900', color: '#ffffff' }}>
                {counterClosings.filter(c => c.status !== 'approved').length} <span style={{ fontSize: '1rem', color: '#fbbf24' }}>টি শিফট</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#fde68a', marginTop: '6px' }}>
                {counterClosings.filter(c => c.status !== 'approved').length > 0 
                  ? '⚠️ অবিলম্বে যাচাই করে হ্যান্ডওভার সিলগালা করুন' 
                  : '✅ সব শিফট ক্লোজিং অনুমোদিত ও ক্লিয়ার'}
              </div>
            </div>

            {/* Card 4: Customer Due */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(185, 28, 28, 0.2))',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '16px',
              padding: '1.25rem',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {lang === 'bn' ? 'মার্কেটে মোট বাকি পাওনা' : 'Market Due Receivables'}
                </span>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                  <HandCoins size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: '900', color: '#ffffff' }}>
                ৳{(customers || []).reduce((sum, c) => sum + (Number(c.due) || 0), 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#fecaca', marginTop: '6px' }}>
                {(customers || []).filter(c => Number(c.due) > 0).length} জন কাস্টমারের কাছে বাকি পাওনা
              </div>
            </div>
          </div>

          {/* SECTION: Shift Closing & Cash Handover Approvals Queue */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={22} color="#f59e0b" />
                  {lang === 'bn' ? 'ক্যাশিয়ার শিফট ক্লোজিং ও ক্যাশ হ্যান্ডওভার অনুমোদন কিউ' : 'Cashier Shift Closing & Cash Handover Approvals Queue'}
                </h3>
                <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                  {lang === 'bn' 
                    ? 'ক্যাশিয়ারদের ড্রয়ার ক্লোজিং রিপোর্ট পর্যালোচনা করুন, ক্যাশ ব্যবধান/ঘাটতি নিরীক্ষা করুন এবং সিলগালা অনুমোদন দিন।' 
                    : 'Review submitted cashier shift reports, verify cash discrepancies and approve handover seals.'}
                </p>
              </div>

              {/* Status Filter Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { id: 'all', label: lang === 'bn' ? `সব শিফট (${counterClosings.length})` : `All (${counterClosings.length})` },
                  { id: 'pending', label: lang === 'bn' ? `অনুমোদনের অপেক্ষায় (${counterClosings.filter(c => c.status !== 'approved').length})` : `Pending (${counterClosings.filter(c => c.status !== 'approved').length})` },
                  { id: 'approved', label: lang === 'bn' ? `অনুমোদিত (${counterClosings.filter(c => c.status === 'approved').length})` : `Approved (${counterClosings.filter(c => c.status === 'approved').length})` }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setShiftFilter(f.id)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '10px',
                      border: '1px solid',
                      borderColor: shiftFilter === f.id ? '#f59e0b' : 'var(--border-color)',
                      background: shiftFilter === f.id ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                      color: shiftFilter === f.id ? '#f59e0b' : 'var(--text-muted)',
                      fontWeight: '700',
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Shifts */}
            {counterClosings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <Clock size={40} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
                <p style={{ margin: 0, fontWeight: '700' }}>এখনো কোনো শিফট ক্লোজিং সাবমিট করা হয়নি।</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>POS স্ক্রিন থেকে 'শিফট ক্লোজিং' সম্পন্ন করলে এখানে সরাসরি প্রদর্শিত হবে।</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {counterClosings
                  .filter(c => {
                    if (shiftFilter === 'pending') return c.status !== 'approved';
                    if (shiftFilter === 'approved') return c.status === 'approved';
                    return true;
                  })
                  .map(shift => {
                    const isApproved = shift.status === 'approved';
                    const hasShortage = (shift.discrepancy || 0) < 0;
                    const hasSurplus = (shift.discrepancy || 0) > 0;
                    const isExact = (shift.discrepancy || 0) === 0;

                    return (
                      <div
                        key={shift.id}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: isApproved ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.4)',
                          borderRadius: '14px',
                          padding: '1.25rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1rem'
                        }}
                      >
                        {/* Top bar of Shift Row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{
                              background: isApproved ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                              color: isApproved ? '#10b981' : '#f59e0b',
                              border: isApproved ? '1px solid #10b981' : '1px solid #f59e0b',
                              padding: '3px 10px',
                              borderRadius: '8px',
                              fontSize: '0.78rem',
                              fontWeight: '800'
                            }}>
                              {isApproved ? '✓ অনুমোদিত ও সিলগালা' : '⏳ অনুমোদনের অপেক্ষায়'}
                            </span>
                            <span style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '1rem' }}>
                              {shift.counterName}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              ({shift.branchName})
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            <span>👤 ক্যাশিয়ার: <strong style={{ color: 'var(--text-main)' }}>{shift.cashierName}</strong></span>
                            <span>🕒 {shift.timestamp || shift.date}</span>
                          </div>
                        </div>

                        {/* Financial Figures Grid */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                          gap: '10px',
                          background: 'rgba(0, 0, 0, 0.25)',
                          borderRadius: '10px',
                          padding: '0.85rem'
                        }}>
                          <div>
                            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>প্রারম্ভিক ক্যাশ (Float)</span>
                            <span style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-main)' }}>৳{(shift.openingFloat || 0).toLocaleString()}</span>
                          </div>
                          <div>
                            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>ক্যাশ বিক্রয়</span>
                            <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#10b981' }}>+৳{(shift.totalCashSales || 0).toLocaleString()}</span>
                          </div>
                          <div>
                            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>ডিজিটাল বিক্রয়</span>
                            <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#3b82f6' }}>৳{(shift.totalDigitalSales || 0).toLocaleString()}</span>
                          </div>
                          <div>
                            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>মোট মেমো/ট্রানজ্যাকশন</span>
                            <span style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-main)' }}>{shift.totalTransactions || 0} টি</span>
                          </div>
                          <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.1)', paddingLeft: '8px' }}>
                            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>হিসাবকৃত ড্রয়ার ক্যাশ</span>
                            <span style={{ fontWeight: '800', fontSize: '0.95rem', color: '#93c5fd' }}>৳{(shift.expectedDrawerCash || 0).toLocaleString()}</span>
                          </div>
                          <div>
                            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>জমা দেওয়া ক্যাশ</span>
                            <span style={{ fontWeight: '900', fontSize: '1rem', color: '#ffffff' }}>৳{(shift.actualCash || 0).toLocaleString()}</span>
                          </div>
                          <div>
                            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>অমিল / পার্থক্য</span>
                            <span style={{
                              fontWeight: '800',
                              fontSize: '0.9rem',
                              color: isExact ? '#10b981' : hasShortage ? '#ef4444' : '#3b82f6'
                            }}>
                              {isExact ? '✓ ০ (নিখুঁত)' : (hasShortage ? `⚠️ -৳${Math.abs(shift.discrepancy).toLocaleString()} (ঘাটতি)` : `+৳${shift.discrepancy.toLocaleString()} (উদ্বৃত্ত)`)}
                            </span>
                          </div>
                        </div>

                        {/* Note and Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', flex: 1 }}>
                            {shift.note ? (
                              <span>💬 <em>"{shift.note}"</em></span>
                            ) : (
                              <span style={{ fontStyle: 'italic', opacity: 0.6 }}>কোনো বিশেষ নোট দেওয়া হয়নি।</span>
                            )}
                            {isApproved && shift.approvedBy && (
                              <span style={{ marginLeft: '12px', color: '#10b981', fontWeight: '700', fontSize: '0.8rem' }}>
                                • সিলমোহর অনুমোদনকারী: {shift.approvedBy} ({shift.approvedAt})
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {!isApproved && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (approveCounterClosing) {
                                    approveCounterClosing(shift.id, user?.name || 'সুপার অ্যাডমিন');
                                  }
                                }}
                                style={{
                                  background: 'linear-gradient(135deg, #10b981, #059669)',
                                  color: '#ffffff',
                                  border: 'none',
                                  padding: '8px 16px',
                                  borderRadius: '10px',
                                  fontWeight: '800',
                                  fontSize: '0.85rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                                }}
                              >
                                <CheckCircle size={16} />
                                {lang === 'bn' ? 'অনুমোদন ও সিলগালা করুন' : 'Approve & Seal Handover'}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                const phone = businessSettings?.whatsappAlertNumber || businessSettings?.phone || '';
                                const cleanPhone = phone.replace(/[^0-9]/g, '');
                                const text = `*হিসাব কিতাব ৩৬০ - কাউন্টার শিফট হ্যান্ডওভার স্লিপ*\nশাখা: ${shift.branchName}\nকাউন্টার: ${shift.counterName}\nক্যাশিয়ার: ${shift.cashierName}\nজমা ক্যাশ: ৳${(shift.actualCash || 0).toLocaleString()}\nহিসাবকৃত ড্রয়ার: ৳${(shift.expectedDrawerCash || 0).toLocaleString()}\nঅমিল: ৳${shift.discrepancy || 0}\nস্ট্যাটাস: ${isApproved ? 'অনুমোদিত' : 'পেন্ডিং'}`;
                                window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
                              }}
                              style={{
                                background: 'rgba(37, 211, 102, 0.15)',
                                border: '1px solid rgba(37, 211, 102, 0.4)',
                                color: '#25d366',
                                padding: '8px 12px',
                                borderRadius: '10px',
                                fontWeight: '700',
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                              title="WhatsApp এ স্লিপ পাঠান"
                            >
                              <MessageCircle size={15} />
                              WhatsApp
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* SECTION: Live Multi-Branch & Drawer Monitor */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={22} color="#3b82f6" />
                  {lang === 'bn' ? 'মাল্টি-আউটলেট শাখা ও কাউন্টার ড্রয়ার রিয়েলটাইম মনিটর' : 'Multi-Branch & Drawer Cash Monitor'}
                </h3>
                <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                  {lang === 'bn' ? 'প্রতিটি শাখার ক্যাশ কাউন্টারের অবস্থান ও ড্রয়ারের প্রারম্ভিক ক্যাশ পর্যবেক্ষণ ও সমন্বয় করুন।' : 'Monitor real-time drawer floats and balance shifts per counter.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
              {branches.map(branch => (
                <div
                  key={branch.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '14px',
                    padding: '1.25rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Store size={18} color="#3b82f6" />
                      <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>{branch.name}</strong>
                    </div>
                    <span style={{
                      background: 'rgba(59, 130, 246, 0.15)',
                      color: '#60a5fa',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      {branch.counters?.length || 0}টি কাউন্টার
                    </span>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    📍 {branch.address || 'ঠিকানা দেওয়া হয়নি'} | 📞 {branch.phone || 'ফোন নেই'}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(branch.counters || []).map(counter => (
                      <div
                        key={counter.id}
                        style={{
                          background: 'rgba(0, 0, 0, 0.25)',
                          borderRadius: '10px',
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                            {counter.name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            ড্রয়ার ক্যাশ: <strong style={{ color: '#10b981' }}>৳{(Number(counter.openingFloat) || 0).toLocaleString()}</strong>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setCashAdjustModal({
                              isOpen: true,
                              branchId: branch.id,
                              counterId: counter.id,
                              counterName: `${branch.name} - ${counter.name}`,
                              type: 'deposit',
                              amount: '',
                              reason: ''
                            });
                          }}
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-main)',
                            padding: '5px 10px',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          💸 ক্যাশ অ্যাডজাস্ট
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION: Cash Movements Audit Log */}
          {cashMovements && cashMovements.length > 0 && (
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
            }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={20} color="#ec4899" />
                {lang === 'bn' ? 'ড্রয়ার ক্যাশ মুভমেন্ট ও অডিট ট্রেইল' : 'Drawer Cash Movements Audit Log'}
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>তারিখ ও সময়</th>
                      <th style={{ padding: '8px' }}>কাউন্টার</th>
                      <th style={{ padding: '8px' }}>মুভমেন্ট ধরন</th>
                      <th style={{ padding: '8px' }}>পরিমাণ</th>
                      <th style={{ padding: '8px' }}>কারণ / বিবরণ</th>
                      <th style={{ padding: '8px' }}>কর্তৃপক্ষ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashMovements.slice(0, 10).map(m => (
                      <tr key={m.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{m.date} {m.time}</td>
                        <td style={{ padding: '8px', fontWeight: '700', color: 'var(--text-main)' }}>{m.counterName}</td>
                        <td style={{ padding: '8px' }}>
                          <span style={{
                            background: m.type === 'deposit' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: m.type === 'deposit' ? '#10b981' : '#ef4444',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontWeight: '800',
                            fontSize: '0.75rem'
                          }}>
                            {m.type === 'deposit' ? '⬇️ ক্যাশ ইন / জমা' : '⬆️ ক্যাশ আউট / উত্তোলন'}
                          </span>
                        </td>
                        <td style={{ padding: '8px', fontWeight: '800', color: m.type === 'deposit' ? '#10b981' : '#ef4444' }}>
                          {m.type === 'deposit' ? '+' : '-'}৳{m.amount.toLocaleString()}
                        </td>
                        <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{m.reason}</td>
                        <td style={{ padding: '8px', fontWeight: '700', color: 'var(--text-main)' }}>{m.authorizedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* SUBTAB 1: MODULE SWITCHBOARD & PRESETS                    */}
      {/* ======================================================== */}
      {activeSubTab === 'modules' && (
        <div className="fade-in">
          
          {/* Operating Mode Selector Section */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1.5px solid var(--border-color)',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⚡ সিস্টেম অপারেটিং মোড আর্কিটেকচার (Operating Mode Architecture)</span>
                  <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.7rem', fontWeight: '800' }}>
                    ROOT
                  </span>
                </h3>
                <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {lang === 'bn' 
                    ? 'ক্লায়েন্টের চাহিদা অনুসারে ক্লায়েন্টকে শুধু ব্যবসা, শুধু পার্সোনাল অথবা উভয় মোড সক্রিয় করে দিন:' 
                    : 'Configure the default operating mode for this client instance:'}
                </p>
              </div>

              <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--mode-color)', background: 'var(--bg-primary)', padding: '5px 12px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                {operatingMode === 'business_only' && '🏢 শুধুমাত্র ব্যবসা মোড সক্রিয়'}
                {operatingMode === 'personal_only' && '👤 শুধুমাত্র পার্সোনাল মোড সক্রিয়'}
                {operatingMode === 'dual' && '🔄 ডুয়েল মোড (উভয়ই সচল)'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div
                type="button"
                onClick={() => setOperatingMode('business_only')}
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  border: operatingMode === 'business_only' ? '2px solid #6366f1' : '1px solid var(--border-color)',
                  background: operatingMode === 'business_only' ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <strong>🏢 শুধু ব্যবসা (Business Only)</strong>
                  {operatingMode === 'business_only' && <CheckCircle size={18} color="#6366f1" />}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  পার্সোনাল মডিউল সম্পূর্ণ বন্ধ। বাণিজ্যিক প্রতিষ্ঠান ও দোকানের জন্য সর্বোচ্চ গতি ও হালকা।
                </div>
              </div>

              <div
                type="button"
                onClick={() => setOperatingMode('personal_only')}
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  border: operatingMode === 'personal_only' ? '2px solid #10b981' : '1px solid var(--border-color)',
                  background: operatingMode === 'personal_only' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <strong>👤 শুধু পার্সোনাল (Personal Only)</strong>
                  {operatingMode === 'personal_only' && <CheckCircle size={18} color="#10b981" />}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  ভারী ইআরপি/ইনভেন্টরি লোড হবে না। পরিবার ও ব্যক্তিগত আয়-ব্যয় ট্র্যাকিংয়ের জন্য নিখুঁত।
                </div>
              </div>

              <div
                type="button"
                onClick={() => setOperatingMode('dual')}
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  border: operatingMode === 'dual' ? '2px solid #a855f7' : '1px solid var(--border-color)',
                  background: operatingMode === 'dual' ? 'rgba(168, 85, 247, 0.1)' : 'var(--bg-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <strong>🔄 উভয় মোড (Dual Mode)</strong>
                  {operatingMode === 'dual' && <CheckCircle size={18} color="#a855f7" />}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  ব্যক্তিগত ও বাণিজ্যিক সব ফিচার একসাথে। ইউজার নিজের মতো যেকোনো সময় সুইচ করতে পারেন।
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Presets Section */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={20} color="#f59e0b" />
                  {lang === 'bn' ? '১-ক্লিক প্যাকেজ প্রিসেট (Quick Tier Buttons)' : '1-Click Tier Packages'}
                </h3>
                <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {lang === 'bn' ? 'ক্লায়েন্টের বাজেট অনুযায়ী এক ক্লিকেই পুরো প্যাকেজ সেট করে ফেলুন:' : 'Instantly activate presets based on client payment tier:'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => applyPackagePreset('basic')}
                  className="btn"
                  style={{
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#10b981',
                    border: '1px solid #10b981',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontWeight: '800',
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  🟢 বেসিক রিটেইল প্যাক
                </button>
                <button
                  onClick={() => applyPackagePreset('standard')}
                  className="btn"
                  style={{
                    background: 'rgba(59, 130, 246, 0.12)',
                    color: '#3b82f6',
                    border: '1px solid #3b82f6',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontWeight: '800',
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  🔵 স্ট্যান্ডার্ড শপ প্যাক
                </button>
                <button
                  onClick={() => applyPackagePreset('enterprise')}
                  className="btn"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '10px',
                    fontWeight: '800',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                  }}
                >
                  👑 এন্টারপ্রাইজ ফুল প্যাক (সব অন)
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Feature Modules Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '1.25rem'
          }}>
            {modulesList.map(mod => {
              const IconComp = mod.icon;
              const isEnabled = licenseInfo?.modules?.[mod.id] !== false;

              return (
                <div
                  key={mod.id}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: isEnabled ? `1.5px solid ${mod.color}40` : '1px solid var(--border-color)',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    transition: 'all 0.25s ease',
                    boxShadow: isEnabled ? `0 4px 20px ${mod.color}15` : 'none',
                    opacity: isEnabled ? 1 : 0.65
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        background: isEnabled ? `${mod.color}20` : 'rgba(148, 163, 184, 0.1)',
                        border: `1px solid ${isEnabled ? mod.color : 'rgba(148, 163, 184, 0.2)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isEnabled ? mod.color : 'var(--text-muted)'
                      }}>
                        <IconComp size={24} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '800', color: mod.color, letterSpacing: '0.04em' }}>
                          {mod.category}
                        </div>
                        <h4 style={{ margin: '2px 0 0', fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                          {mod.name}
                        </h4>
                      </div>
                    </div>

                    {/* Toggle Button */}
                    <button
                      onClick={() => toggleLicenseModule(mod.id, !isEnabled)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        color: isEnabled ? '#10b981' : '#64748b',
                        transition: 'transform 0.15s ease'
                      }}
                      title={isEnabled ? 'বন্ধ করতে ক্লিক করুন' : 'চালু করতে ক্লিক করুন'}
                    >
                      {isEnabled ? (
                        <div style={{
                          width: '50px',
                          height: '28px',
                          borderRadius: '14px',
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          padding: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          boxShadow: '0 2px 10px rgba(16, 185, 129, 0.4)'
                        }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                        </div>
                      ) : (
                        <div style={{
                          width: '50px',
                          height: '28px',
                          borderRadius: '14px',
                          background: 'rgba(148, 163, 184, 0.25)',
                          padding: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-start'
                        }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#94a3b8' }} />
                        </div>
                      )}
                    </button>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {mod.desc}
                  </p>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border-color)',
                    fontSize: '0.78rem'
                  }}>
                    <span style={{
                      fontWeight: '700',
                      color: isEnabled ? '#10b981' : '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      {isEnabled ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                      {isEnabled ? (lang === 'bn' ? 'সক্রিয় ও উন্মুক্ত' : 'Active & Enabled') : (lang === 'bn' ? 'অফ ও লক করা' : 'Disabled & Hidden')}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      id: {mod.id}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBTAB 2: 100+ INDUSTRY TEMPLATES & BUSINESS MODES       */}
      {/* ======================================================== */}
      {activeSubTab === 'templates' && (
        <div className="fade-in">
          {/* Header & Search */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Store size={22} color="#f59e0b" />
                  {lang === 'bn' ? '১০০+ ইন্ডাস্ট্রি বিজনেস টেমপ্লেট ক্যাটালগ' : '100+ Industry Business Templates'}
                </h3>
                <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                  {lang === 'bn' 
                    ? 'যেকোনো ক্লায়েন্টের ব্যবসার ধরন নির্বাচন করুন। স্বয়ংক্রিয়ভাবে তার উপযুক্ত ইউনিট, পরিভাষা ও পিওএস ডিসপ্লে মোড সেট হয়ে যাবে।' 
                    : 'Select any client business type. POS interface, default units, and features adapt automatically.'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setShowTemplateReviewModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '12px',
                    fontWeight: '800',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.35)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Sparkles size={16} />
                  {lang === 'bn' ? '🎨 ১০০+ টেমপ্লেট রিভিউ হাব খুলুন' : '🎨 Open Template Review Hub'}
                </button>

                {/* Search Bar */}
                <div style={{ minWidth: '260px', flex: 1, maxWidth: '400px' }}>
                  <input
                    type="text"
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    placeholder={lang === 'bn' ? '🔍 ব্যবসা খুঁজুন (রেস্টুরেন্ট, ফার্মেসি, বাস, স্বর্ণ, মুদি)...' : 'Search industry (restaurant, pharmacy, bus)...'}
                    className="input-field"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px' }}
                  />
                </div>
              </div>
            </div>

            {/* Sector Filters */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
              <button
                type="button"
                onClick={() => setSelectedSector('all')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  border: '1px solid',
                  borderColor: selectedSector === 'all' ? '#ef4444' : 'var(--border-color)',
                  background: selectedSector === 'all' ? '#ef4444' : 'transparent',
                  color: selectedSector === 'all' ? '#ffffff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                সব খাত ({MASTER_INDUSTRY_TEMPLATES.length})
              </button>
              {INDUSTRY_SECTORS.map(sec => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setSelectedSector(sec.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    border: '1px solid',
                    borderColor: selectedSector === sec.id ? sec.color : 'var(--border-color)',
                    background: selectedSector === sec.id ? `${sec.color}25` : 'transparent',
                    color: selectedSector === sec.id ? sec.color : 'var(--text-muted)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {sec.name}
                </button>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
            gap: '1.25rem'
          }}>
            {MASTER_INDUSTRY_TEMPLATES
              .filter(tpl => {
                const q = templateSearch.toLowerCase().trim();
                const matchesQ = !q ||
                  tpl.name.toLowerCase().includes(q) ||
                  tpl.enName.toLowerCase().includes(q) ||
                  (tpl.defaultCategories || []).some(c => c.toLowerCase().includes(q)) ||
                  (tpl.units || []).some(u => u.toLowerCase().includes(q));
                const matchesSec = selectedSector === 'all' || tpl.sectorId === selectedSector;
                return matchesQ && matchesSec;
              })
              .map(tpl => {
                const isActive = activeIndustryId === tpl.id;
                const sector = INDUSTRY_SECTORS.find(s => s.id === tpl.sectorId);

                return (
                  <div
                    key={tpl.id}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: isActive ? '2px solid #10b981' : '1px solid var(--border-color)',
                      borderRadius: '16px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      boxShadow: isActive ? '0 8px 24px rgba(16, 185, 129, 0.2)' : 'none',
                      position: 'relative'
                    }}
                  >
                    {isActive && (
                      <span style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '16px',
                        background: '#10b981',
                        color: '#ffffff',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
                      }}>
                        ✓ বর্তমানে সক্রিয়
                      </span>
                    )}

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          color: sector?.color || '#3b82f6',
                          textTransform: 'uppercase',
                          background: `${sector?.color || '#3b82f6'}15`,
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}>
                          {sector?.name || 'বাণিজ্যিক খাত'}
                        </span>
                        <span style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-muted)',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {tpl.uiMode.toUpperCase()}
                        </span>
                      </div>

                      <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                        {tpl.name}
                      </h4>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                        {tpl.enName}
                      </div>

                      {/* Units Badges */}
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '700' }}>
                          সমর্থিত পরিমাপক একক (Units):
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {(tpl.units || []).map(u => (
                            <span key={u} style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid var(--border-color)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              color: 'var(--text-main)'
                            }}>
                              {u}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Feature Highlights */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                        {tpl.supportsPhotos && (
                          <span style={{ fontSize: '0.7rem', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                            📷 ছবি কার্ড সাপোর্ট
                          </span>
                        )}
                        {(tpl.features || []).map(f => (
                          <span key={f} style={{ fontSize: '0.7rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                            ✓ {f.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                      <button
                        type="button"
                        onClick={() => switchIndustryTemplate(tpl.id, false)}
                        className="btn"
                        style={{
                          flex: 1,
                          padding: '8px 10px',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: '800',
                          background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                          color: isActive ? '#10b981' : 'var(--text-main)',
                          border: `1px solid ${isActive ? '#10b981' : 'var(--border-color)'}`,
                          cursor: 'pointer'
                        }}
                      >
                        {isActive ? '✓ সক্রিয় রয়েছে' : '🚀 শুধু মোড সক্রিয়'}
                      </button>

                      {tpl.sampleProducts && tpl.sampleProducts.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(lang === 'bn' ? `আপনি কি "${tpl.name}" এর নমুনা পণ্য ও খাদ্য ছবিগুলো লোড করতে চান?` : `Load sample products and photos for ${tpl.enName}?`)) {
                              switchIndustryTemplate(tpl.id, true);
                            }
                          }}
                          className="btn"
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: '800',
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            color: '#ffffff',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="নমুনা পণ্য ও ছবি সহ লোড করুন"
                        >
                          <Sparkles size={14} />
                          <span>ছবি সহ লোড</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}


      {/* ======================================================== */}
      {/* SUBTAB 2: CLIENT LICENSING & SUBSCRIPTION LOCK           */}
      {/* ======================================================== */}
      {activeSubTab === 'license' && (
        <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
          
          {/* License Configuration Form */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '18px',
            padding: '1.75rem'
          }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={22} color="#10b981" />
              {lang === 'bn' ? 'ক্লায়েন্ট লাইসেন্স ও মেয়াদ নিয়ন্ত্রণ' : 'Client Subscription & Expiry Control'}
            </h3>
            <p style={{ margin: '0 0 1.25rem', color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5 }}>
              {lang === 'bn' 
                ? 'ক্লায়েন্টের প্রতিষ্ঠানের নাম, সাবস্ক্রিপশন মেয়াদ ও লাইসেন্স স্ট্যাটাস নির্ধারণ করুন। মেয়াদ শেষ হলে সফটওয়্যার স্বয়ংক্রিয়ভাবে লক হয়ে যাবে।' 
                : 'Set client shop details and subscription validity. Software automatically freezes when expired.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
                  নিবন্ধিত প্রতিষ্ঠানের নাম (Client Shop Name)
                </label>
                <input
                  type="text"
                  value={licenseForm.clientShopName}
                  onChange={(e) => setLicenseForm(prev => ({ ...prev, clientShopName: e.target.value }))}
                  placeholder="যেমন: আল-মদিনা সুপার শপ"
                  className="input-field"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
                  প্ল্যানের ধরন (Subscription Plan)
                </label>
                <select
                  value={licenseForm.planName}
                  onChange={(e) => setLicenseForm(prev => ({ ...prev, planName: e.target.value }))}
                  className="input-field"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px' }}
                >
                  <option value="14-Day Evaluation Trial">১৪ দিনের ট্রায়াল (Evaluation Trial)</option>
                  <option value="Basic Monthly Retail">বেসিক মাসিক প্যাকেজ (Monthly)</option>
                  <option value="Standard Annual Store">স্ট্যান্ডার্ড বার্ষিক প্যাকেজ (Annual)</option>
                  <option value="Enterprise Lifetime License">এন্টারপ্রাইজ আজীবন লাইসেন্স (Lifetime)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
                  লাইসেন্স স্ট্যাটাস (Access Status)
                </label>
                <select
                  value={licenseForm.status}
                  onChange={(e) => setLicenseForm(prev => ({ ...prev, status: e.target.value }))}
                  className="input-field"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    color: licenseForm.status === 'active' ? '#10b981' : licenseForm.status === 'trial' ? '#f59e0b' : '#ef4444'
                  }}
                >
                  <option value="active">🟢 Active - সফটওয়্যার সম্পূর্ণ সক্রিয় ও আনলকড</option>
                  <option value="trial">🟡 Trial - মূল্যায়ন ট্রায়াল মোড</option>
                  <option value="expired">🔴 Expired - মেয়াদোত্তীর্ণ (সফটওয়্যার লক স্ক্রিন)</option>
                  <option value="suspended">⛔ Suspended - স্থগিত / ইমার্জেন্সি ফ্রিজ</option>
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    মেয়াদ শেষ হওয়ার তারিখ (Expiry Date)
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 30);
                        setLicenseForm(prev => ({ ...prev, expiryDate: d.toISOString().split('T')[0], status: 'active' }));
                      }}
                      className="btn"
                      style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: 'none' }}
                    >
                      +৩০ দিন
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setFullYear(d.getFullYear() + 1);
                        setLicenseForm(prev => ({ ...prev, expiryDate: d.toISOString().split('T')[0], status: 'active' }));
                      }}
                      className="btn"
                      style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'none' }}
                    >
                      +১ বছর
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLicenseForm(prev => ({ ...prev, expiryDate: '2099-12-31', status: 'active' }));
                      }}
                      className="btn"
                      style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', border: 'none' }}
                    >
                      লাইফটাইম
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  value={licenseForm.expiryDate}
                  onChange={(e) => setLicenseForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                  className="input-field"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px' }}
                />
              </div>

              <button
                onClick={handleApplyLicenseForm}
                className="btn btn-primary"
                style={{
                  marginTop: '0.5rem',
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '0.95rem',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Save size={18} />
                লাইসেন্স ও মেয়াদ সংরক্ষণ করুন
              </button>
            </div>
          </div>

          {/* License Key Generator & Status Card */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '18px',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={22} color="#f59e0b" />
                {lang === 'bn' ? 'লাইসেন্স কি জেনারেটর' : 'License Key Generator'}
              </h3>
              <p style={{ margin: '0 0 1.25rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                {lang === 'bn' 
                  ? 'ক্লায়েন্টের দোকানে দেওয়ার জন্য একটি বৈধ অ্যাক্টিভেশন কি জেনারেট করুন:' 
                  : 'Generate a cryptographic activation key to hand over to clients:'}
              </p>

              <div style={{
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '6px' }}>
                  বর্তমান সক্রিয় লাইসেন্স কি:
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.1rem',
                  fontWeight: '800',
                  color: '#10b981',
                  wordBreak: 'break-all',
                  marginBottom: '10px'
                }}>
                  {licenseInfo?.licenseKey || 'HK360-ENT-2026-8842-PRO'}
                </div>
                <button
                  onClick={() => handleCopyKey(licenseInfo?.licenseKey || 'HK360-ENT-2026-8842-PRO')}
                  className="btn"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  {copiedKey ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  {copiedKey ? 'কপি হয়েছে!' : 'কি কপি করুন'}
                </button>
              </div>

              {/* Generated New Key Display */}
              {generatedKey && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid #10b981',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: '800', marginBottom: '6px' }}>
                    🎉 নতুন জেনারেট করা কি (Generated Key):
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.15rem',
                    fontWeight: '900',
                    color: '#ffffff',
                    wordBreak: 'break-all',
                    marginBottom: '10px'
                  }}>
                    {generatedKey}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleCopyKey(generatedKey)}
                      className="btn"
                      style={{
                        background: '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Copy size={14} />
                      কপি করুন
                    </button>
                    <button
                      onClick={() => {
                        updateLicenseInfo({ licenseKey: generatedKey, status: 'active' });
                        showToast(lang === 'bn' ? 'নতুন কি অ্যাপে সেট করা হয়েছে!' : 'New key applied!');
                      }}
                      className="btn"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      অ্যাপে প্রয়োগ করুন
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleGenerateKey}
              className="btn"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                fontWeight: '800',
                fontSize: '0.92rem',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                border: '1px solid #f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <Sparkles size={18} />
              নতুন অ্যাক্টিভেশন কি তৈরি করুন (Generate Key)
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBTAB 3: VENDOR WHITE-LABEL BRANDING                     */}
      {/* ======================================================== */}
      {activeSubTab === 'branding' && (
        <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '18px',
            padding: '2rem'
          }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building2 size={24} color="#3b82f6" />
              {lang === 'bn' ? 'হোয়াইট-লেবেল ও ভেন্ডর প্রোফাইল' : 'White-Label Reseller Profile'}
            </h3>
            <p style={{ margin: '0 0 1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              {lang === 'bn'
                ? 'এখানে আপনার নিজের কোম্পানি বা আইটি এজেন্সির নাম ও সাপোর্ট নম্বর দিন। ক্লায়েন্টের অ্যাপের ফুটার, হেল্প উইন্ডো ও লাইসেন্স তথ্যে আপনার কোম্পানির নাম প্রদর্শিত হবে।'
                : 'Brand the software with your own software company / agency details.'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
                  সফটওয়্যার প্রোভাইডার / কোম্পানির নাম
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={vendorForm.resellerName}
                    onChange={(e) => setVendorForm(prev => ({ ...prev, resellerName: e.target.value }))}
                    placeholder="যেমন: হিসাব কিতাব ৩৬০ টেকনোলজিস"
                    className="input-field"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
                  হটলাইন / হোয়াটসঅ্যাপ সাপোর্ট নম্বর
                </label>
                <input
                  type="text"
                  value={vendorForm.resellerPhone}
                  onChange={(e) => setVendorForm(prev => ({ ...prev, resellerPhone: e.target.value }))}
                  placeholder="+880 1700-000000"
                  className="input-field"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
                  সাপোর্ট ইমেইল এড্রেস
                </label>
                <input
                  type="email"
                  value={vendorForm.resellerEmail}
                  onChange={(e) => setVendorForm(prev => ({ ...prev, resellerEmail: e.target.value }))}
                  placeholder="support@hisabkitab360.com"
                  className="input-field"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
                  অফিসিয়াল ওয়েবসাইট
                </label>
                <input
                  type="text"
                  value={vendorForm.resellerWebsite}
                  onChange={(e) => setVendorForm(prev => ({ ...prev, resellerWebsite: e.target.value }))}
                  placeholder="www.hisabkitab360.com"
                  className="input-field"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px' }}
                />
              </div>
            </div>

            <button
              onClick={handleSaveVendorForm}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                fontWeight: '800',
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <Save size={18} />
              ভেন্ডর ব্র্যান্ডিং তথ্য সংরক্ষণ করুন
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBTAB 4: CLEAN SLATE ONBOARDING (NEW CLIENT)            */}
      {/* ======================================================== */}
      {activeSubTab === 'onboarding' && (
        <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '18px',
            padding: '2rem'
          }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={24} color="#f59e0b" />
              {lang === 'bn' ? 'নতুন ক্লায়েন্টের জন্য ক্লিন স্লেট স্টোর প্রস্তুত' : 'Clean Slate Client Onboarding'}
            </h3>
            <p style={{ margin: '0 0 1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              {lang === 'bn'
                ? 'যখন আপনি নতুন কোনো দোকানদার বা ক্লায়েন্টের কাছে সফটওয়্যারটি বিক্রি করবেন, তখন এই অপশন ব্যবহার করে পূর্বের সব ডেমো পণ্য, কাল্পনিক ইনভয়েস ও ডেমো সেলস সম্পূর্ণ মুছে ফেলে তাদের জন্য একদম নতুন ও ফ্রেশ স্টোর তৈরি করে দিতে পারবেন।'
                : 'Wipe all demo transactions and sample products so the buyer starts with an empty, pristine database.'}
            </p>

            <form onSubmit={handleCleanSlateExecute} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
                    দোকান / সুপারশপের নাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={cleanStoreForm.shopName}
                    onChange={(e) => setCleanStoreForm(prev => ({ ...prev, shopName: e.target.value }))}
                    placeholder="যেমন: নিউ মডার্ন ডিপার্টমেন্টাল স্টোর"
                    className="input-field"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
                    মালিকের নাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={cleanStoreForm.ownerName}
                    onChange={(e) => setCleanStoreForm(prev => ({ ...prev, ownerName: e.target.value }))}
                    placeholder="মালিকের পূর্ণ নাম"
                    className="input-field"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
                    মোবাইল নম্বর *
                  </label>
                  <input
                    type="text"
                    required
                    value={cleanStoreForm.phone}
                    onChange={(e) => setCleanStoreForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="০১৭১১-০০০০০০"
                    className="input-field"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
                    দোকানের ঠিকানা
                  </label>
                  <input
                    type="text"
                    value={cleanStoreForm.address}
                    onChange={(e) => setCleanStoreForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="মার্কেট বা এলাকার নাম, শহর"
                    className="input-field"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px' }}
                  />
                </div>
              </div>

              {/* Safety Confirmation */}
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px dashed #ef4444',
                padding: '1.25rem',
                borderRadius: '12px'
              }}>
                <div style={{ color: '#ef4444', fontWeight: '800', fontSize: '0.9rem', marginBottom: '6px' }}>
                  ⚠️ সতর্কতা: এটি পূর্বের সকল সেলস রেকর্ড ও পণ্য স্টক ডিলিট করবে!
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  নিশ্চিত করতে নিচের বক্সে <strong style={{ color: '#ef4444' }}>RESET</strong> শব্দটি লিখুন:
                </div>
                <input
                  type="text"
                  required
                  value={cleanStoreForm.confirmText}
                  onChange={(e) => setCleanStoreForm(prev => ({ ...prev, confirmText: e.target.value }))}
                  placeholder="RESET লিখুন"
                  className="input-field"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', maxWidth: '300px' }}
                />
              </div>

              <button
                type="submit"
                className="btn"
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '0.95rem',
                  background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                  color: '#ffffff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={18} />
                ক্লিন স্লেট স্টোর প্রস্তুত করুন (Start Clean Store)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBTAB 5: MASTER SECURITY & PIN                           */}
      {/* ======================================================== */}
      {activeSubTab === 'security' && (
        <div className="fade-in" style={{ maxWidth: '650px', margin: '0 auto' }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '18px',
            padding: '2rem'
          }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Key size={24} color="#ec4899" />
              {lang === 'bn' ? 'মাস্টার সিকিউরিটি পিন পরিবর্তন' : 'Change Master Access PIN'}
            </h3>
            <p style={{ margin: '0 0 1.5rem', color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>
              {lang === 'bn'
                ? 'এই সিক্রেট মাস্টার পিনটি ব্যবহার করে আপনি যেকোনো ক্লায়েন্টের কম্পিউটারে সরাসরি সুপার অ্যাডমিন প্যানেল আনলক করতে পারবেন (ডিফল্ট পিন: 9999)।'
                : 'This secret PIN lets you unlock the Super Admin Panel on any client PC.'}
            </p>

            {pinChangeMsg.text && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '10px',
                marginBottom: '1.25rem',
                fontSize: '0.88rem',
                fontWeight: '700',
                background: pinChangeMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: pinChangeMsg.type === 'success' ? '#10b981' : '#ef4444',
                border: `1px solid ${pinChangeMsg.type === 'success' ? '#10b981' : '#ef4444'}`
              }}>
                {pinChangeMsg.text}
              </div>
            )}

            <form onSubmit={handlePinChangeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
                  বর্তমান মাস্টার পিন (Current Master PIN)
                </label>
                <input
                  type="password"
                  required
                  value={currentMasterPin}
                  onChange={(e) => setCurrentMasterPin(e.target.value)}
                  placeholder="বর্তমান পিন দিন (ডিফল্ট: 9999)"
                  className="input-field"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
                  নতুন মাস্টার পিন (New Master PIN - কমপক্ষে ৪ সংখ্যা)
                </label>
                <input
                  type="password"
                  required
                  value={newMasterPin}
                  onChange={(e) => setNewMasterPin(e.target.value)}
                  placeholder="যেমন: 7890"
                  className="input-field"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
                  নতুন পিন নিশ্চিত করুন (Confirm New PIN)
                </label>
                <input
                  type="password"
                  required
                  value={confirmMasterPin}
                  onChange={(e) => setConfirmMasterPin(e.target.value)}
                  placeholder="নতুন পিনটি পুনরায় লিখুন"
                  className="input-field"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px' }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '0.95rem',
                  background: 'linear-gradient(135deg, #ec4899, #be185d)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <Save size={18} />
                নতুন মাস্টার পিন সংরক্ষণ করুন
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Drawer Cash Adjust Modal */}
      {cashAdjustModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '1.5rem',
            maxWidth: '450px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
          }}>
            <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-main)', fontSize: '1.15rem', fontWeight: '800' }}>
              💸 ড্রয়ার ক্যাশ সমন্বয় / ইনজেকশন
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              কাউন্টার: <strong>{cashAdjustModal.counterName}</strong>
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (adjustCounterCash) {
                adjustCounterCash({
                  branchId: cashAdjustModal.branchId,
                  counterId: cashAdjustModal.counterId,
                  type: cashAdjustModal.type,
                  amount: Number(cashAdjustModal.amount),
                  reason: cashAdjustModal.reason,
                  authorizedBy: user?.name || 'সুপার অ্যাডমিন'
                });
              }
              setCashAdjustModal({ isOpen: false, branchId: '', counterId: '', counterName: '', type: 'deposit', amount: '', reason: '' });
            }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setCashAdjustModal(prev => ({ ...prev, type: 'deposit' }))}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: cashAdjustModal.type === 'deposit' ? '#10b981' : 'var(--border-color)',
                    background: cashAdjustModal.type === 'deposit' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                    color: cashAdjustModal.type === 'deposit' ? '#10b981' : 'var(--text-muted)',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                >
                  ⬇️ ক্যাশ জমা (Float In)
                </button>
                <button
                  type="button"
                  onClick={() => setCashAdjustModal(prev => ({ ...prev, type: 'withdraw' }))}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: cashAdjustModal.type === 'withdraw' ? '#ef4444' : 'var(--border-color)',
                    background: cashAdjustModal.type === 'withdraw' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                    color: cashAdjustModal.type === 'withdraw' ? '#ef4444' : 'var(--text-muted)',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                >
                  ⬆️ ক্যাশ উত্তোলন (Cash Out)
                </button>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)' }}>
                  টাকার পরিমাণ (৳)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={cashAdjustModal.amount}
                  onChange={(e) => setCashAdjustModal(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="যেমন: 5000"
                  className="input-field"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)' }}>
                  কারণ / নোট
                </label>
                <input
                  type="text"
                  value={cashAdjustModal.reason}
                  onChange={(e) => setCashAdjustModal(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="যেমন: খুচরা টাকা বৃদ্ধি বা মালিকের ব্যক্তিগত উত্তোলন"
                  className="input-field"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setCashAdjustModal({ isOpen: false, branchId: '', counterId: '', counterName: '', type: 'deposit', amount: '', reason: '' })}
                  className="btn"
                  style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '8px 18px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}
                >
                  নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive 100+ Template Review & Customizer Modal */}
      <TemplateReviewModal
        isOpen={showTemplateReviewModal}
        onClose={() => setShowTemplateReviewModal(false)}
      />

    </div>
  );
};
