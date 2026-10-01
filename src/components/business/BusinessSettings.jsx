import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings,
  Store,
  Phone,
  MapPin,
  Percent,
  Download,
  Upload,
  RefreshCw,
  Save,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Printer,
  FileBadge,
  Eye,
  Sliders,
  Building,
  CreditCard,
  Image as ImageIcon,
  Check,
  Cloud,
  CloudUpload,
  HardDrive,
  HelpCircle,
  Copy,
  ExternalLink,
  Clock,
  Trash2,
  Key,
  Award,
  Monitor,
  Globe,
  UserCheck,
  LogOut,
  ScanLine,
  FolderOpen,
  Zap,
  Radio
} from 'lucide-react';

export const BusinessSettings = () => {
  const {
    operatingMode,
    setOperatingMode,
    businessSettings,
    updateBusinessSettings,
    exportAllData,
    importAllData,
    resetToDemo,
    snapshots,
    createAutoSnapshot,
    restoreFromSnapshot,
    deleteSnapshot,
    syncToGoogleDrive,
    licenseInfo,
    updateLicenseInfo,
    generateNewLicenseKey,
    startFreshStore,
    activateSoftwareWithKey,
    deactivateLicense,
    openCashDrawer,
    playScannerBeep,
    products,
    t,
    lang,
    isDriveConnected,
    driveUser,
    connectDriveOAuth,
    disconnectDriveOAuth,
    getGoogleClientId,
    saveGoogleClientId,
    switchDriveOAuth
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState('profile'); // 'profile' | 'receipt' | 'hardware' | 'backup' | 'commercial'
  const [formState, setFormState] = useState({ ...businessSettings });
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [isConnectingDriveOAuth, setIsConnectingDriveOAuth] = useState(false);
  const [clientIdInput, setClientIdInput] = useState(() => getGoogleClientId());
  const [showDriveGuide, setShowDriveGuide] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [scannerLiveInput, setScannerLiveInput] = useState('');
  const [lastScannedTestProduct, setLastScannedTestProduct] = useState(null);
  const [drawerTestCount, setDrawerTestCount] = useState(0);
  const [copiedKey, setCopiedKey] = useState(false);
  const [inputLicenseKey, setInputLicenseKey] = useState('');

  // Commercial / Reseller and Clean Slate setup states
  const [resellerForm, setResellerForm] = useState({
    resellerName: licenseInfo?.resellerName || businessSettings?.vendorSupport?.supportName || 'হিসাব কিতাব ৩৬০ টেকনোলজিস',
    resellerPhone: licenseInfo?.resellerPhone || businessSettings?.vendorSupport?.phone || '+880 1700-000000',
    resellerEmail: licenseInfo?.resellerEmail || businessSettings?.vendorSupport?.email || 'support@hisabkitab360.com',
    resellerWebsite: licenseInfo?.resellerWebsite || 'www.hisabkitab360.com',
    vendorWhatsApp: businessSettings?.vendorSupport?.whatsapp || businessSettings?.phone || '8801700000000',
    vendorFacebook: businessSettings?.vendorSupport?.facebook || 'https://m.me/hisabkitab360',
    vendorTelegram: businessSettings?.vendorSupport?.telegram || 'https://t.me/hisabkitab360',
    vendorHours: businessSettings?.vendorSupport?.availableHours || 'সকাল ৯:০০ টা - রাত ১১:০০ টা (সপ্তাহের ৭ দিন)'
  });

  const [freshStoreForm, setFreshStoreForm] = useState({
    shopName: '',
    ownerName: '',
    phone: '',
    address: '',
    bin: '',
    currency: '৳',
    initialNote: 'আমাদের সাথে কেনাকাটা করার জন্য ধন্যবাদ। পণ্য পরিবর্তনের সময় ক্যাশমেমো সঙ্গে রাখুন।'
  });

  // Handle file uploads into base64 for logo, signature, trade license, NID
  const handleFileUpload = (field, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormState(prev => ({
        ...prev,
        [field]: e.target.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleToggle = (field) => {
    setFormState(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateBusinessSettings({
      ...formState,
      vatRate: Number(formState.vatRate) || 0
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        importAllData(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={22} style={{ color: 'var(--business-primary)' }} />
            <span>{lang === 'bn' ? 'কোম্পানি প্রোফাইল, ডকুমেন্ট ও প্রিন্টার সেটিংস' : 'Company Profile, Documents & Print Settings'}</span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {lang === 'bn' ? 'প্রতিষ্ঠানের নাম, ঠিকানা, ট্রেড লাইসেন্স, লোগো এবং রিসিটে কি কি প্রিন্ট হবে তা কাস্টমাইজ করুন' : 'Configure company identity, upload documents and customize printed receipt layout'}
          </p>
        </div>

        {/* Sub-tab Navigation Pills */}
        <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)', gap: '4px' }}>
          <button
            onClick={() => setActiveSubTab('profile')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeSubTab === 'profile' ? 'var(--business-primary)' : 'transparent',
              color: activeSubTab === 'profile' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Building size={14} />
            <span>{lang === 'bn' ? 'কোম্পানি প্রোফাইল ও ডকুমেন্ট' : 'Company Profile & Docs'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('receipt')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeSubTab === 'receipt' ? 'var(--business-primary)' : 'transparent',
              color: activeSubTab === 'receipt' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Printer size={14} />
            <span>{lang === 'bn' ? 'রিসিট ও প্রিন্ট কাস্টমাইজার' : 'Receipt & Print Designer'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('hardware')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeSubTab === 'hardware' ? 'var(--business-primary)' : 'transparent',
              color: activeSubTab === 'hardware' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FolderOpen size={14} />
            <span>{lang === 'bn' ? 'ক্যাশ বক্স ও বারকোড স্ক্যানার' : 'POS Hardware & Drawer'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('backup')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeSubTab === 'backup' ? 'var(--business-primary)' : 'transparent',
              color: activeSubTab === 'backup' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={14} />
            <span>{lang === 'bn' ? 'ব্যাকআপ ও রিস্টোর' : 'Backup & Reset'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('commercial')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeSubTab === 'commercial' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
              color: activeSubTab === 'commercial' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: activeSubTab === 'commercial' ? '0 2px 10px rgba(16, 185, 129, 0.3)' : 'none'
            }}
          >
            <Sparkles size={14} />
            <span>{lang === 'bn' ? 'সফটওয়্যার লাইসেন্স ও সেলস' : 'License & Reselling'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ========================================================= */}
        {/* TAB 1: COMPANY PROFILE, BRANDING & DOCUMENTS */}
        {/* ========================================================= */}
        {activeSubTab === 'profile' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
            {/* OPERATING MODE SELECTOR CARD */}
            <div
              className="glass-card"
              style={{
                gridColumn: '1 / -1',
                padding: '1.25rem',
                borderRadius: '16px',
                border: '1.5px solid var(--border-color)',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)',
                marginBottom: '0.25rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                    <span>⚡ সিস্টেম অপারেটিং মোড ও লাইটনেস কন্ট্রোল (Operating Mode)</span>
                    <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', fontSize: '0.7rem', fontWeight: '800' }}>
                      LIGHT & FAST
                    </span>
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn'
                      ? 'প্রয়োজন অনুযায়ী মোড নির্বাচন করুন। অপ্রয়োজনীয় মডিউল নিষ্ক্রিয় থাকবে যাতে সিস্টেম সর্বোচ্চ হালকা ও দ্রুতগতিতে কাজ করে।'
                      : 'Choose your desired operating mode. Inactive modules will be disabled to optimize speed and responsiveness.'}
                  </p>
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--mode-color)', background: 'var(--bg-primary)', padding: '5px 12px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                  {operatingMode === 'business_only' && '🏢 অ্যাক্টিভ: শুধুমাত্র ব্যবসা মোড'}
                  {operatingMode === 'personal_only' && '👤 অ্যাক্টিভ: শুধুমাত্র পার্সোনাল মোড'}
                  {operatingMode === 'dual' && '🔄 অ্যাক্টিভ: ডুয়েল মোড (উভয়ই সচল)'}
                </div>
              </div>

              {/* 3 Selectable Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {/* 1. Business Only */}
                <div
                  type="button"
                  onClick={() => setOperatingMode('business_only')}
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    border: operatingMode === 'business_only' ? '2px solid #6366f1' : '1px solid var(--border-color)',
                    background: operatingMode === 'business_only' ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: operatingMode === 'business_only' ? '0 4px 18px rgba(99, 102, 241, 0.25)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.4rem' }}>🏢</span>
                      <strong style={{ fontSize: '0.95rem', color: operatingMode === 'business_only' ? '#6366f1' : 'var(--text-main)' }}>
                        {lang === 'bn' ? 'শুধু ব্যবসা (Business Only)' : 'Business Only'}
                      </strong>
                    </div>
                    {operatingMode === 'business_only' && (
                      <CheckCircle2 size={18} style={{ color: '#6366f1' }} />
                    )}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    {lang === 'bn'
                      ? 'দোকান বা ব্যবসা প্রতিষ্ঠানের জন্য। পার্সোনাল ও পারিবারিক খরচের হিসাব সম্পূর্ণ বন্ধ থাকবে। মেমরি খরচ সর্বনিম্ন ও সুপারফাস্ট পিওএস।'
                      : 'Optimized for stores & businesses. Disables all personal expense trackers for peak speed.'}
                  </p>
                </div>

                {/* 2. Personal Only */}
                <div
                  type="button"
                  onClick={() => setOperatingMode('personal_only')}
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    border: operatingMode === 'personal_only' ? '2px solid #10b981' : '1px solid var(--border-color)',
                    background: operatingMode === 'personal_only' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: operatingMode === 'personal_only' ? '0 4px 18px rgba(16, 185, 129, 0.25)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.4rem' }}>👤</span>
                      <strong style={{ fontSize: '0.95rem', color: operatingMode === 'personal_only' ? '#10b981' : 'var(--text-main)' }}>
                        {lang === 'bn' ? 'শুধু পার্সোনাল (Personal Only)' : 'Personal Only'}
                      </strong>
                    </div>
                    {operatingMode === 'personal_only' && (
                      <CheckCircle2 size={18} style={{ color: '#10b981' }} />
                    )}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    {lang === 'bn'
                      ? 'ব্যক্তিগত ও পারিবারিক খরচের জন্য। ভারী ইনভেন্টরি, বারকোড স্ক্যানার ও পিওএস লোড হবে না। অতি হালকা ও সহজ।'
                      : 'Tailored for personal & family finance. Strips out commercial ERP & POS modules.'}
                  </p>
                </div>

                {/* 3. Dual Mode */}
                <div
                  type="button"
                  onClick={() => setOperatingMode('dual')}
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    border: operatingMode === 'dual' ? '2px solid #a855f7' : '1px solid var(--border-color)',
                    background: operatingMode === 'dual' ? 'rgba(168, 85, 247, 0.1)' : 'var(--bg-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: operatingMode === 'dual' ? '0 4px 18px rgba(168, 85, 247, 0.25)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.4rem' }}>🔄</span>
                      <strong style={{ fontSize: '0.95rem', color: operatingMode === 'dual' ? '#a855f7' : 'var(--text-main)' }}>
                        {lang === 'bn' ? 'উভয় মোড (Dual Mode)' : 'Dual Suite (All-In-One)'}
                      </strong>
                    </div>
                    {operatingMode === 'dual' && (
                      <CheckCircle2 size={18} style={{ color: '#a855f7' }} />
                    )}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    {lang === 'bn'
                      ? 'ব্যক্তিগত ও ব্যবসায়িক—উভয় হিসাব পরিচালনা করতে চাইলে এই মোডটি ব্যবহার করুন। যেকোনো সময় মোড পরিবর্তন করতে পারবেন।'
                      : 'Run both your personal life and business from one unified system with easy top switching.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Left: Company Details Form */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Store size={18} style={{ color: 'var(--business-primary)' }} />
                <span>{lang === 'bn' ? 'প্রতিষ্ঠান ও ব্যবসার মৌলিক তথ্য' : 'Business Identity & Legal Info'}</span>
              </h3>

              <div className="form-group">
                <label>{lang === 'bn' ? 'কোম্পানি / দোকানের নাম *' : 'Company Name *'}</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formState.companyName}
                  onChange={(e) => setFormState({ ...formState, companyName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>{lang === 'bn' ? 'ব্যবসার স্লোগান / ট্যাগলাইন' : 'Tagline / Slogan'}</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder={lang === 'bn' ? 'যেমন: পাইকারি ও খুচরা বিক্রেতা' : 'e.g. Premium Groceries & Wholesale'}
                  value={formState.tagline}
                  onChange={(e) => setFormState({ ...formState, tagline: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>{lang === 'bn' ? 'প্রধান ফোন / হটলাইন *' : 'Primary Phone *'}</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formState.phone}
                    onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>{lang === 'bn' ? 'বিকল্প মোবাইল নম্বর' : 'Alternate Phone'}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formState.altPhone || ''}
                    onChange={(e) => setFormState({ ...formState, altPhone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>{lang === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}</label>
                  <input
                    type="email"
                    className="input-field"
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>{lang === 'bn' ? 'ওয়েবসাইট / ফেসবুক পেজ' : 'Website / Social'}</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="www.mybusiness.com"
                    value={formState.website || ''}
                    onChange={(e) => setFormState({ ...formState, website: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{lang === 'bn' ? 'দোকান / অফিসের পূর্ণাঙ্গ ঠিকানা *' : 'Business Address *'}</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formState.address}
                  onChange={(e) => setFormState({ ...formState, address: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>{lang === 'bn' ? 'ভ্যাট / BIN নম্বর' : 'VAT / BIN No'}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formState.binNo || ''}
                    onChange={(e) => setFormState({ ...formState, binNo: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>{lang === 'bn' ? 'ট্রেড লাইসেন্স নং' : 'Trade License No'}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formState.tradeLicenseNo || ''}
                    onChange={(e) => setFormState({ ...formState, tradeLicenseNo: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>{lang === 'bn' ? 'ডিফল্ট ভ্যাট হার (%)' : 'VAT Rate (%)'}</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="input-field"
                    value={formState.vatRate}
                    onChange={(e) => setFormState({ ...formState, vatRate: e.target.value })}
                  />
                </div>
              </div>

              {/* Bank & Mobile Banking */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginTop: '1rem', marginBottom: '0.75rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CreditCard size={16} style={{ color: 'var(--business-primary)' }} />
                <span>{lang === 'bn' ? 'ব্যাংক হিসাব ও পেমেন্ট তথ্য (ইনভয়েসে প্রিন্ট হবে)' : 'Bank & Payment Details'}</span>
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>{lang === 'bn' ? 'ব্যাংকের নাম ও শাখা' : 'Bank Name & Branch'}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formState.bankName || ''}
                    onChange={(e) => setFormState({ ...formState, bankName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>{lang === 'bn' ? 'ব্যাংক হিসাব নম্বর (A/C No)' : 'Bank Account No'}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formState.bankAccountNo || ''}
                    onChange={(e) => setFormState({ ...formState, bankAccountNo: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>{lang === 'bn' ? 'বিকাশ মার্চেন্ট / পার্সোনাল নম্বর' : 'bKash Number'}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formState.bkashMerchant || ''}
                    onChange={(e) => setFormState({ ...formState, bkashMerchant: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>{lang === 'bn' ? 'নগদ / রকেট নম্বর' : 'Nagad / Rocket'}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formState.nagadMerchant || ''}
                    onChange={(e) => setFormState({ ...formState, nagadMerchant: e.target.value })}
                  />
                </div>
              </div>

              {/* WhatsApp Alert & Store Communications */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginTop: '1.25rem', marginBottom: '0.75rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1.1rem' }}>💬</span>
                <span>{lang === 'bn' ? 'হোয়াটসঅ্যাপ অ্যালার্ট ও নোটিফিকেশন সেটিংস' : 'WhatsApp Alerts & Notification'}</span>
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>{lang === 'bn' ? 'মালিকের হোয়াটসঅ্যাপ নম্বর (শিফট রিপোর্ট পাওয়ার জন্য)' : 'Owner WhatsApp Alert Number'}</label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="017XXXXXXXX বা 88017XXXXXXXX"
                    value={formState.whatsappAlertNumber || ''}
                    onChange={(e) => setFormState({ ...formState, whatsappAlertNumber: e.target.value })}
                  />
                  <small style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                    {lang === 'bn' ? 'কাউন্টার ক্যাশিয়ার শিফট ক্লোজ করলে এই নম্বরে সরাসরি রিপোর্ট পাঠানো যাবে।' : 'Cashiers can 1-click send shift closing report to this number.'}
                  </small>
                </div>

                <div className="form-group">
                  <label>{lang === 'bn' ? 'বিকাশ নম্বর (বকেয়া তাগাদা মেসেজে যাবে)' : 'bKash Number for Due Reminders'}</label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="01XXXXXXXXX"
                    value={formState.bkashNumber || formState.bkashMerchant || ''}
                    onChange={(e) => setFormState({ ...formState, bkashNumber: e.target.value, bkashMerchant: e.target.value })}
                  />
                  <small style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                    {lang === 'bn' ? 'কাস্টমারকে বকেয়া তাগাদা পাঠালে এই বিকাশ নম্বরটি মেসেজে যুক্ত হবে।' : 'Included in customer due reminder WhatsApp messages.'}
                  </small>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontWeight: '700', marginTop: '0.5rem' }}>
                <Save size={16} />
                <span>{lang === 'bn' ? 'কোম্পানি তথ্য সংরক্ষণ করুন' : 'Save Company Profile'}</span>
              </button>
            </div>

            {/* Right: Company Logo, Trade License & Seal Uploads */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Logo Upload Card */}
              <div className="glass-card">
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ImageIcon size={16} style={{ color: 'var(--business-primary)' }} />
                  <span>{lang === 'bn' ? 'কোম্পানির লোগো (Company Logo)' : 'Company Logo'}</span>
                </h4>
                <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {lang === 'bn' ? 'রিসিট ও ইনভয়েসের শীর্ষে এই লোগো প্রিন্ট হবে' : 'Prints at top of receipts & invoices'}
                </p>

                <div style={{ textAlign: 'center', padding: '12px', border: '2px dashed var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)' }}>
                  {formState.companyLogo ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img src={formState.companyLogo} alt="Logo" style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }} />
                      <button
                        type="button"
                        onClick={() => setFormState({ ...formState, companyLogo: null })}
                        style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer' }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                      <Store size={32} style={{ margin: '0 auto 6px', opacity: 0.4 }} />
                      <div>{lang === 'bn' ? 'কোনো লোগো আপলোড করা হয়নি' : 'No logo uploaded'}</div>
                    </div>
                  )}

                  <label style={{ display: 'inline-block', marginTop: '10px', cursor: 'pointer' }}>
                    <div className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Upload size={14} />
                      <span>{lang === 'bn' ? 'লোগো ফাইল নির্বাচন করুন' : 'Upload Logo'}</span>
                    </div>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload('companyLogo', e.target.files[0])} />
                  </label>
                </div>
              </div>

              {/* Official Seal & Signature */}
              <div className="glass-card">
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} style={{ color: '#10b981' }} />
                  <span>{lang === 'bn' ? 'অফিসিয়াল সিল ও স্বাক্ষর (Stamp & Signature)' : 'Official Stamp & Signature'}</span>
                </h4>
                <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {lang === 'bn' ? 'ইনভয়েস ও কোটেশনের অনুমোদিত স্বাক্ষর অংশে প্রদর্শিত হবে' : 'Shown in authorized signatory box'}
                </p>

                <div style={{ textAlign: 'center', padding: '12px', border: '2px dashed var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)' }}>
                  {formState.signatureStamp ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img src={formState.signatureStamp} alt="Stamp" style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }} />
                      <button
                        type="button"
                        onClick={() => setFormState({ ...formState, signatureStamp: null })}
                        style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer' }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                      <ShieldCheck size={32} style={{ margin: '0 auto 6px', opacity: 0.4 }} />
                      <div>{lang === 'bn' ? 'কোনো সিল আপলোড করা হয়নি' : 'No stamp uploaded'}</div>
                    </div>
                  )}

                  <label style={{ display: 'inline-block', marginTop: '10px', cursor: 'pointer' }}>
                    <div className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Upload size={14} />
                      <span>{lang === 'bn' ? 'সিল / স্বাক্ষর আপলোড' : 'Upload Stamp'}</span>
                    </div>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload('signatureStamp', e.target.files[0])} />
                  </label>
                </div>
              </div>

              {/* Trade License Document Upload */}
              <div className="glass-card">
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileBadge size={16} style={{ color: '#3b82f6' }} />
                  <span>{lang === 'bn' ? 'প্রতিষ্ঠানের ট্রেড লাইসেন্স কপি (Trade License)' : 'Company Trade License'}</span>
                </h4>
                <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {lang === 'bn' ? 'কোম্পানির অফিসিয়াল ট্রেড লাইসেন্স ডকুমেন্ট সংরক্ষণ' : 'Store company trade license document'}
                </p>

                <div style={{ textAlign: 'center', padding: '12px', border: '2px dashed var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)' }}>
                  {formState.tradeLicenseDoc ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img src={formState.tradeLicenseDoc} alt="License" style={{ maxHeight: '90px', maxWidth: '100%', objectFit: 'contain', borderRadius: '4px' }} />
                      <button
                        type="button"
                        onClick={() => setFormState({ ...formState, tradeLicenseDoc: null })}
                        style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer' }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                      <Building size={32} style={{ margin: '0 auto 6px', opacity: 0.4 }} />
                      <div>{lang === 'bn' ? 'ট্রেড লাইসেন্স কপি আপলোড নেই' : 'No license uploaded'}</div>
                    </div>
                  )}

                  <label style={{ display: 'inline-block', marginTop: '10px', cursor: 'pointer' }}>
                    <div className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Upload size={14} />
                      <span>{lang === 'bn' ? 'ট্রেড লাইসেন্স আপলোড করুন' : 'Upload License'}</span>
                    </div>
                    <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={(e) => handleFileUpload('tradeLicenseDoc', e.target.files[0])} />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: RECEIPT & PRINT DESIGNER (WHAT PRINTS ON RECEIPT) */}
        {/* ========================================================= */}
        {activeSubTab === 'receipt' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
            {/* Left: Customization Controls */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={18} style={{ color: 'var(--business-primary)' }} />
                <span>{lang === 'bn' ? 'প্রিন্ট রিসিট কনফিগারেশন (রিসিটে কি কি লেখা থাকবে)' : 'Print Content & Receipt Options'}</span>
              </h3>

              {/* Greeting & Header message */}
              <div className="form-group">
                <label>{lang === 'bn' ? 'রিসিটের শীর্ষ অভিবাদন (Header Greeting):' : 'Header Greeting:'}</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="বিসমিল্লাহির রাহমানির রাহিম"
                  value={formState.headerGreeting || ''}
                  onChange={(e) => setFormState({ ...formState, headerGreeting: e.target.value })}
                />
              </div>

              {/* Content Toggles Checklist */}
              <div style={{ marginBottom: '1.25rem', background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '10px', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? 'রিসিটে প্রদর্শন করার উপাদানসমূহ টিক দিন:' : 'Select Elements to Print on Receipt:'}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                    <input
                      type="checkbox"
                      checked={formState.showGreetingOnReceipt !== false}
                      onChange={() => handleToggle('showGreetingOnReceipt')}
                    />
                    <span>{lang === 'bn' ? 'শীর্ষ অভিবাদন (Greeting)' : 'Header Greeting'}</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                    <input
                      type="checkbox"
                      checked={formState.showLogoOnReceipt !== false}
                      onChange={() => handleToggle('showLogoOnReceipt')}
                    />
                    <span>{lang === 'bn' ? 'কোম্পানির লোগো (Logo)' : 'Company Logo'}</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                    <input
                      type="checkbox"
                      checked={formState.showAddressOnReceipt !== false}
                      onChange={() => handleToggle('showAddressOnReceipt')}
                    />
                    <span>{lang === 'bn' ? 'কোম্পানির ঠিকানা (Address)' : 'Store Address'}</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                    <input
                      type="checkbox"
                      checked={formState.showPhoneOnReceipt !== false}
                      onChange={() => handleToggle('showPhoneOnReceipt')}
                    />
                    <span>{lang === 'bn' ? 'ফোন নম্বর (Phone No)' : 'Phone Number'}</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                    <input
                      type="checkbox"
                      checked={formState.showBinOnReceipt !== false}
                      onChange={() => handleToggle('showBinOnReceipt')}
                    />
                    <span>{lang === 'bn' ? 'ভ্যাট / BIN নম্বর' : 'VAT / BIN No'}</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                    <input
                      type="checkbox"
                      checked={formState.showCustomerDetails !== false}
                      onChange={() => handleToggle('showCustomerDetails')}
                    />
                    <span>{lang === 'bn' ? 'গ্রাহকের নাম ও ফোন' : 'Customer Info'}</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                    <input
                      type="checkbox"
                      checked={formState.showBarcodeOnReceipt !== false}
                      onChange={() => handleToggle('showBarcodeOnReceipt')}
                    />
                    <span>{lang === 'bn' ? 'রিসিটের বারকোড লাইন' : 'Receipt Barcode'}</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                    <input
                      type="checkbox"
                      checked={formState.showSignatureOnReceipt !== false}
                      onChange={() => handleToggle('showSignatureOnReceipt')}
                    />
                    <span>{lang === 'bn' ? 'স্বাক্ষর ও সিল (Signature)' : 'Authorized Signature'}</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                    <input
                      type="checkbox"
                      checked={formState.showReturnPolicyOnReceipt !== false}
                      onChange={() => handleToggle('showReturnPolicyOnReceipt')}
                    />
                    <span>{lang === 'bn' ? 'পণ্য ফেরত নীতি (Policy)' : 'Return Policy'}</span>
                  </label>
                </div>
              </div>

              {/* Footer Note */}
              <div className="form-group">
                <label>{lang === 'bn' ? 'রিসিটের ধন্যবাদ ও নিচের বার্তা (Footer Note):' : 'Footer Thank You Message:'}</label>
                <textarea
                  rows="2"
                  className="textarea-field"
                  value={formState.invoiceFooter || ''}
                  onChange={(e) => setFormState({ ...formState, invoiceFooter: e.target.value })}
                />
              </div>

              {/* Return Policy Notice */}
              <div className="form-group">
                <label>{lang === 'bn' ? 'পণ্য পরিবর্তন ও ফেরত নীতিমালা (Return Policy Note):' : 'Return & Exchange Policy:'}</label>
                <textarea
                  rows="2"
                  className="textarea-field"
                  value={formState.returnPolicy || ''}
                  onChange={(e) => setFormState({ ...formState, returnPolicy: e.target.value })}
                />
              </div>

              {/* Paper Width */}
              <div className="form-group">
                <label>{lang === 'bn' ? 'প্রিন্টার পেপারের সাইজ (Paper Width):' : 'Printer Paper Width:'}</label>
                <select
                  className="input-field"
                  value={formState.receiptPaperWidth || '80mm'}
                  onChange={(e) => setFormState({ ...formState, receiptPaperWidth: e.target.value })}
                >
                  <option value="80mm">80mm POS Thermal Receipt (স্ট্যান্ডার্ড)</option>
                  <option value="58mm">58mm Mini POS Thermal Receipt (ছোট সাইজ)</option>
                  <option value="a4">A4 Full Page Invoice (বড় পৃষ্ঠা)</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontWeight: '700' }}>
                <Save size={16} />
                <span>{lang === 'bn' ? 'রিসিট সেটিংস সংরক্ষণ করুন' : 'Save Receipt Design'}</span>
              </button>
            </div>

            {/* Right: LIVE REAL-TIME RECEIPT PREVIEW */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Eye size={16} style={{ color: 'var(--business-primary)' }} />
                  {lang === 'bn' ? 'লাইভ প্রিন্ট রিসিট প্রিভিউ (Live Preview)' : 'Live Receipt Print Preview'}
                </span>
                <span className="badge badge-info">{formState.receiptPaperWidth || '80mm'}</span>
              </div>

              {/* Simulated Paper */}
              <div
                style={{
                  background: '#ffffff',
                  color: '#0f172a',
                  borderRadius: '8px',
                  padding: '1.25rem 1rem',
                  fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                  fontSize: '11px',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
                  border: '1px solid #cbd5e1',
                  maxWidth: '380px',
                  margin: '0 auto'
                }}
              >
                {/* Greeting */}
                {formState.showGreetingOnReceipt !== false && formState.headerGreeting && (
                  <div style={{ textAlign: 'center', fontSize: '10px', color: '#475569', marginBottom: '4px', fontWeight: '600' }}>
                    {formState.headerGreeting}
                  </div>
                )}

                {/* Logo */}
                {formState.showLogoOnReceipt !== false && formState.companyLogo && (
                  <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                    <img src={formState.companyLogo} alt="Logo" style={{ maxHeight: '42px', maxWidth: '120px' }} />
                  </div>
                )}

                {/* Company Name */}
                <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '800', margin: '0 0 2px', color: '#0f172a' }}>
                    {formState.companyName || 'Company Name'}
                  </h3>
                  {formState.tagline && (
                    <div style={{ fontSize: '9px', color: '#64748b' }}>{formState.tagline}</div>
                  )}
                  {formState.showAddressOnReceipt !== false && formState.address && (
                    <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>
                      📍 {formState.address}
                    </div>
                  )}
                  {formState.showPhoneOnReceipt !== false && formState.phone && (
                    <div style={{ fontSize: '10px', color: '#475569' }}>
                      📞 {formState.phone} {formState.altPhone && `| ${formState.altPhone}`}
                    </div>
                  )}
                  {formState.showBinOnReceipt !== false && formState.binNo && (
                    <div style={{ fontSize: '9px', color: '#64748b' }}>
                      BIN / TAX: {formState.binNo}
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px dashed #94a3b8', margin: '8px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#334155' }}>
                  <span>INV-2026-0042</span>
                  <span>{new Date().toISOString().split('T')[0]}</span>
                </div>

                {formState.showCustomerDetails !== false && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#334155', marginTop: '2px' }}>
                    <span>{lang === 'bn' ? 'ক্রেতা:' : 'Cust:'} হাজী আব্দুর রহমান</span>
                    <span>01711-XXXXXX</span>
                  </div>
                )}

                <div style={{ borderTop: '1px dashed #94a3b8', margin: '8px 0' }} />

                {/* Mock Items Table */}
                <div style={{ width: '100%', marginBottom: '6px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr', fontWeight: '700', paddingBottom: '3px', borderBottom: '1px solid #cbd5e1', fontSize: '10px' }}>
                    <span>আইটেম</span>
                    <span style={{ textAlign: 'center' }}>পরিমাণ</span>
                    <span style={{ textAlign: 'right' }}>মোট</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr', padding: '3px 0', fontSize: '10px', borderBottom: '1px dotted #e2e8f0' }}>
                    <span>মিনিকেট চাল ২৫ কেজি</span>
                    <span style={{ textAlign: 'center' }}>১</span>
                    <span style={{ textAlign: 'right' }}>২০৫০</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr', padding: '3px 0', fontSize: '10px', borderBottom: '1px dotted #e2e8f0' }}>
                    <span>সয়াবিন তেল ৫ লিটার</span>
                    <span style={{ textAlign: 'center' }}>২</span>
                    <span style={{ textAlign: 'right' }}>১৭৮০</span>
                  </div>
                </div>

                {/* Totals */}
                <div style={{ fontSize: '10px', lineHeight: 1.5, textAlign: 'right' }}>
                  <div>সাবটোটাল: ৳৩৮৩০</div>
                  <div>ভ্যাট ({formState.vatRate || 5}%): + ৳১৯২</div>
                  <div style={{ borderTop: '1px solid #0f172a', fontWeight: '800', fontSize: '12px', marginTop: '3px', paddingTop: '2px' }}>
                    সর্বমোট প্রদেয়: ৳৪০২২
                  </div>
                  <div style={{ fontSize: '9px', color: '#16a34a', fontWeight: '700' }}>
                    [পরিশোধিত - বিকাশ মার্চেন্ট]
                  </div>
                </div>

                {/* Return Policy */}
                {formState.showReturnPolicyOnReceipt !== false && formState.returnPolicy && (
                  <div style={{ borderTop: '1px dashed #94a3b8', marginTop: '8px', paddingTop: '6px', fontSize: '9px', color: '#475569', textAlign: 'center', lineHeight: 1.4 }}>
                    ⚠️ {formState.returnPolicy}
                  </div>
                )}

                {/* Footer Barcode */}
                {formState.showBarcodeOnReceipt !== false && (
                  <div style={{ textAlign: 'center', marginTop: '10px' }}>
                    <div style={{ letterSpacing: '3px', fontSize: '14px', fontWeight: '900', color: '#1e293b' }}>
                      ||||| | |||| ||| |||||
                    </div>
                  </div>
                )}

                {/* Signature Stamp */}
                {formState.showSignatureOnReceipt !== false && formState.signatureStamp && (
                  <div style={{ textAlign: 'center', marginTop: '8px' }}>
                    <img src={formState.signatureStamp} alt="Stamp" style={{ maxHeight: '36px', maxWidth: '80px' }} />
                  </div>
                )}

                {/* Footer Note */}
                <div style={{ textAlign: 'center', marginTop: '8px', borderTop: '1px dashed #cbd5e1', paddingTop: '6px', fontSize: '9px', color: '#64748b' }}>
                  <div>{formState.invoiceFooter}</div>
                  <div style={{ fontSize: '8px', color: '#94a3b8', marginTop: '2px' }}>Powered by HisabKitab 360</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: POS HARDWARE, CASH DRAWER & BARCODE SCANNER */}
        {/* ========================================================= */}
        {activeSubTab === 'hardware' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* 1. CASH DRAWER / CASH BOX HARDWARE SECTION */}
            <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '8px', borderRadius: '8px', color: '#10b981' }}>
                    <FolderOpen size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {lang === 'bn' ? 'ক্যাশ বক্স / ক্যাশ ড্রয়ার (POS Cash Drawer) ইন্টিগ্রেশন' : 'POS Cash Drawer Integration'}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {lang === 'bn' ? 'থার্মাল প্রিন্টারের মাধ্যমে স্বয়ংক্রিয়ভাবে ক্যাশ ড্রয়ার খোলার কনফিগারেশন' : 'RJ11/RJ12 auto-kick configuration via thermal receipt printer'}
                    </p>
                  </div>
                </div>

                {/* Instant Test Drawer Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      openCashDrawer('manual');
                      setDrawerTestCount(prev => prev + 1);
                    }}
                    style={{ background: '#10b981', borderColor: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
                  >
                    <FolderOpen size={16} />
                    <span>{lang === 'bn' ? '🗄️ টেস্ট ড্রয়ার কিক (Test Open)' : '🗄️ Test Drawer Kick'}</span>
                  </button>
                  {drawerTestCount > 0 && (
                    <span className="badge badge-success">
                      ✓ {drawerTestCount} {lang === 'bn' ? 'বার টেস্ট সফল' : 'pulses sent'}
                    </span>
                  )}
                </div>
              </div>

              {/* Toggles & Options Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'var(--bg-primary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    <span>{lang === 'bn' ? 'বিক্রয়ে অটো ক্যাশ ড্রয়ার ওপেন' : 'Auto-Kick on Checkout'}</span>
                    <input
                      type="checkbox"
                      checked={formState.autoOpenCashDrawer !== false}
                      onChange={(e) => setFormState({ ...formState, autoOpenCashDrawer: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--business-primary)' }}
                    />
                  </label>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.5 }}>
                    {lang === 'bn' ? 'পিওএস-এ নগদ টাকায় বিক্রয় সম্পন্ন হলে বা রসিদ তৈরি হলে সাথে সাথে ক্যাশ ড্রয়ার স্বয়ংক্রিয়ভাবে খুলে যাবে।' : 'Triggers cash drawer pulse whenever a cash sale or payment is completed.'}
                  </p>
                </div>

                <div style={{ background: 'var(--bg-primary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    <span>{lang === 'bn' ? 'ESC/POS ড্রয়ার পালস সিগন্যাল' : 'ESC/POS Drawer Pulse (DK)'}</span>
                    <input
                      type="checkbox"
                      checked={formState.cashDrawerKickEnabled !== false}
                      onChange={(e) => setFormState({ ...formState, cashDrawerKickEnabled: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--business-primary)' }}
                    />
                  </label>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.5 }}>
                    {lang === 'bn' ? 'প্রিন্টার পোর্টে ESC p 0 25 250 পালস সংকেত প্রেরণ সক্রিয় রাখে।' : 'Sends standard ESC/POS drawer kick command to the thermal printer.'}
                  </p>
                </div>
              </div>

              {/* Hardware Connection Blueprint & Windows Guide */}
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.95rem', fontWeight: '800', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={16} />
                  <span>{lang === 'bn' ? 'ক্যাশ বক্স কীভাবে কানেক্ট ও কনফিগার করবেন (A-to-Z গাইড):' : 'How to Connect & Configure Cash Drawer (Step-by-step)'}</span>
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', fontSize: '0.82rem', color: 'var(--text-main)' }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                      🔌 ধাপ ১: কেবল সংযোগ (RJ11/RJ12)
                    </strong>
                    <span style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      ক্যাশ ড্রয়ারের পেছনের তারটি (টেলিফোন লাইনের মতো ৬-পিন কেবল) আপনার POS থার্মাল প্রিন্টারের পেছনের <strong>"DK" (Drawer Kick)</strong> পোর্টে শক্তভাবে লাগিয়ে দিন।
                    </span>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                      ⚙️ ধাপ ২: উইন্ডোজ প্রিন্টার ড্রাইভার সেটিংস
                    </strong>
                    <span style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      Control Panel &gt; Devices &amp; Printers &gt; আপনার থার্মাল প্রিন্টারে রাইট-ক্লিক &gt; <strong>Printer Properties &gt; Device Settings</strong> &gt; Cash Drawer অপশনে গিয়ে <strong>"Open Before Printing"</strong> সিলেক্ট করুন।
                    </span>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                      ⌨️ ধাপ ৩: কুইক শর্টকাট (F9) ও রসিদ
                    </strong>
                    <span style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      দোকানে যেকোনো সময় ভাঙতি বা টাকা রাখার জন্য কিবোর্ডে <strong>F9</strong> চাপলেই অথবা সফটওয়্যারের <strong>"ড্রয়ার খুলুন"</strong> বাটনে ক্লিক করলেই ক্যাশ বক্স অটোমেটিক খুলে যাবে।
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. HANDHELD BARCODE SCANNER HARDWARE SECTION */}
            <div className="glass-card" style={{ borderLeft: '4px solid #6366f1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '8px', borderRadius: '8px', color: '#6366f1' }}>
                    <ScanLine size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {lang === 'bn' ? 'হ্যান্ড বারকোড স্ক্যানার গান (USB / Wireless Scanner) ইন্টিগ্রেশন' : 'Handheld Barcode Scanner Integration'}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {lang === 'bn' ? 'ইউএসবি বা ওয়্যারলেস হ্যান্ড স্ক্যানার দিয়ে নো-ক্লিক ইনস্ট্যান্ট প্রোডাক্ট স্ক্যানিং' : 'Zero-click instant barcode scanning via USB / Wireless barcode guns'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-info" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', border: '1px solid #6366f1' }}>
                    {lang === 'bn' ? '✓ প্লাগ অ্যান্ড প্লে (Plug & Play)' : '✓ Plug & Play HID'}
                  </span>
                </div>
              </div>

              {/* Toggles & Options Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'var(--bg-primary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    <span>{lang === 'bn' ? 'জিরো-ক্লিক গ্লোবাল স্ক্যানিং (Zero-Click)' : 'Global Auto-Scan'}</span>
                    <input
                      type="checkbox"
                      checked={formState.enableGlobalScanner !== false}
                      onChange={(e) => setFormState({ ...formState, enableGlobalScanner: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--business-primary)' }}
                    />
                  </label>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.5 }}>
                    {lang === 'bn' ? 'সার্চ বক্সে মাউস দিয়ে ক্লিক না করেও পিওএস স্ক্রিনের যেকোনো জায়গা থেকে স্ক্যানার গান দিয়ে স্ক্যান করলেই পণ্য কার্টে যোগ হবে।' : 'Allows cashier to point and scan barcodes from anywhere without touching the mouse.'}
                  </p>
                </div>

                {/* Live Scanner Interactive Test Field */}
                <div style={{ background: 'var(--bg-primary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    {lang === 'bn' ? '🎯 হ্যান্ড স্ক্যানার লাইভ টেস্ট ফিল্ড:' : '🎯 Live Scanner Test Field:'}
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="input-field"
                      style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.85rem' }}
                      placeholder={lang === 'bn' ? 'স্ক্যানার গান দিয়ে এখানে স্ক্যান করুন...' : 'Scan here with scanner gun...'}
                      value={scannerLiveInput}
                      onChange={(e) => setScannerLiveInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const code = scannerLiveInput.trim();
                          if (!code) return;
                          playScannerBeep();
                          const matched = products.find(p => p.barcode === code || p.sku.toLowerCase() === code.toLowerCase());
                          setLastScannedTestProduct(matched || { notFound: true, code });
                          setScannerLiveInput('');
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                      onClick={() => {
                        const code = scannerLiveInput.trim();
                        if (!code) return;
                        playScannerBeep();
                        const matched = products.find(p => p.barcode === code || p.sku.toLowerCase() === code.toLowerCase());
                        setLastScannedTestProduct(matched || { notFound: true, code });
                        setScannerLiveInput('');
                      }}
                    >
                      {lang === 'bn' ? 'টেস্ট' : 'Test'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Test Result Banner if scanned */}
              {lastScannedTestProduct && (
                <div
                  style={{
                    background: lastScannedTestProduct.notFound ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    border: `1px solid ${lastScannedTestProduct.notFound ? '#ef4444' : '#10b981'}`,
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontSize: '1.5rem' }}>{lastScannedTestProduct.notFound ? '⚠️' : '✅'}</div>
                    <div>
                      <div style={{ fontWeight: '800', color: lastScannedTestProduct.notFound ? '#ef4444' : '#10b981' }}>
                        {lastScannedTestProduct.notFound
                          ? (lang === 'bn' ? `স্ক্যানার রেসপন্স করেছে! বারকোড (${lastScannedTestProduct.code}) কিন্তু ইনভেন্টরিতে এই পণ্যটি নেই` : `Scanner responded! Code: ${lastScannedTestProduct.code} not found in inventory`)
                          : (lang === 'bn' ? `সফল! স্ক্যানার দিয়ে শনাক্ত হয়েছে: ${lastScannedTestProduct.name}` : `Success! Scanned: ${lastScannedTestProduct.name}`)}
                      </div>
                      {!lastScannedTestProduct.notFound && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          SKU: {lastScannedTestProduct.sku} • বারকোড: {lastScannedTestProduct.barcode} • বিক্রয় মূল্য: ৳{lastScannedTestProduct.sellPrice} • বর্তমান স্টক: {lastScannedTestProduct.stock} টি
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setLastScannedTestProduct(null)}
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    {lang === 'bn' ? 'মুছে ফেলুন' : 'Clear'}
                  </button>
                </div>
              )}

              {/* Handheld Scanner Setup Guide */}
              <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.95rem', fontWeight: '800', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Radio size={16} />
                  <span>{lang === 'bn' ? 'হ্যান্ড স্ক্যানার কীভাবে সেটআপ করবেন (A-to-Z গাইড):' : 'How to Setup Handheld Scanner (A-to-Z Guide):'}</span>
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', fontSize: '0.82rem', color: 'var(--text-main)' }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                      🔌 ১. কম্পিউটার বা ল্যাপটপে প্লাগ করুন
                    </strong>
                    <span style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      স্ক্যানার গানের USB ক্যাবল অথবা ওয়্যারলেস 2.4G USB ডংগলটি পিসির যেকোনো USB পোর্টে লাগান। এটি <strong>সম্পূর্ণ ড্রাইভার-লেস (Plug &amp; Play)</strong>, কোনো সিডি বা ড্রাইভার ইনস্টল করতে হবে না।
                    </span>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                      🎯 ২. এন্টার কী সাফিক্স (Enter Suffix)
                    </strong>
                    <span style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      সব বারকোড স্ক্যানারে ডিফল্টভাবে প্রতিটি বারকোড রিড করার পর একটি স্বয়ংক্রিয় <strong>Enter Key</strong> প্রেস পাঠায়। যদি আপনার স্ক্যানারটি এন্টার না দেয়, তবে স্ক্যানার বক্সের ম্যানুয়ালের <strong>"Add CR/LF Suffix"</strong> বারকোডটি একবার স্ক্যান করে নিন।
                    </span>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                      ⚡ ৩. পিওএস-এ দ্রুততম ক্যাশিয়ার বিক্রয়
                    </strong>
                    <span style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      এখন ক্যাশিয়ার পিওএস-এ গিয়ে একের পর এক পণ্যের বারকোডে স্ক্যানার গান ধরলেই বিপ শব্দ হয়ে সেকেন্ডের মধ্যে কার্টে যোগ হবে এবং স্বয়ংক্রিয়ভাবে মোট বিল হিসাব হবে।
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Hardware Settings Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontWeight: '700' }}>
                <Save size={16} />
                <span>{lang === 'bn' ? 'হার্ডওয়্যার সেটিংস সংরক্ষণ করুন' : 'Save Hardware Settings'}</span>
              </button>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: AUTOMATIC & MANUAL BACKUP, GOOGLE DRIVE CLOUD SYNC */}
        {/* ========================================================= */}
        {activeSubTab === 'backup' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* 1. GOOGLE DRIVE CLOUD AUTO-BACKUP SYSTEM */}
            <div className="glass-card" style={{ borderLeft: '4px solid #4285F4' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: 'rgba(66, 133, 244, 0.15)', padding: '8px', borderRadius: '8px', color: '#4285F4' }}>
                    <Cloud size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {lang === 'bn' ? 'গুগল ড্রাইভ অটো ব্যাকআপ ও ক্লাউড সিঙ্ক' : 'Google Drive Cloud Auto-Backup'}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {lang === 'bn' ? 'আপনার ব্যক্তিগত বা প্রাতিষ্ঠানিক Google Drive ফোল্ডারে স্বয়ংক্রিয় ব্যাকআপ' : 'Sync daily snapshots automatically to your Google Drive'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    className="badge"
                    style={{
                      background: isDriveConnected ? 'rgba(16, 185, 129, 0.15)' : (formState.googleDriveWebhookUrl ? 'rgba(59, 130, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)'),
                      color: isDriveConnected ? '#10b981' : (formState.googleDriveWebhookUrl ? '#3b82f6' : '#f59e0b'),
                      border: `1px solid ${isDriveConnected ? '#10b981' : (formState.googleDriveWebhookUrl ? '#3b82f6' : '#f59e0b')}`
                    }}
                  >
                    {isDriveConnected
                      ? (lang === 'bn' ? '✓ ড্রাইভ সরাসরি সংযুক্ত (OAuth)' : '✓ Connected (OAuth)')
                      : (formState.googleDriveWebhookUrl
                        ? (lang === 'bn' ? 'ওয়েবহুক সংযুক্ত' : 'Webhook Connected')
                        : (lang === 'bn' ? 'সেটআপ প্রয়োজন' : 'Setup Required'))}
                  </span>
                </div>
              </div>

              {/* Status & Last Sync banner */}
              <div style={{ background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'সর্বশেষ গুগল ড্রাইভ সিঙ্ক:' : 'Last Drive Sync:'}</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={15} style={{ color: '#4285F4' }} />
                    <span>{formState.googleDriveLastSync || (lang === 'bn' ? 'এখনও সিঙ্ক করা হয়নি' : 'Never synced')}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={isSyncingDrive}
                    onClick={async () => {
                      if (!isDriveConnected && !formState.googleDriveWebhookUrl) {
                        alert(lang === 'bn' ? 'দয়া করে আগে Google Drive কানেক্ট করুন অথবা Webhook URL দিন।' : 'Please connect Google Drive or enter Webhook URL first.');
                        return;
                      }
                      setIsSyncingDrive(true);
                      updateBusinessSettings(formState);
                      await syncToGoogleDrive(formState.googleDriveWebhookUrl);
                      setIsSyncingDrive(false);
                    }}
                    style={{ background: '#4285F4', borderColor: '#4285F4', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
                  >
                    <CloudUpload size={16} className={isSyncingDrive ? 'animate-spin' : ''} />
                    <span>{isSyncingDrive ? (lang === 'bn' ? 'সিঙ্ক হচ্ছে...' : 'Syncing...') : (lang === 'bn' ? 'এখনই ড্রাইভে সিঙ্ক করুন' : 'Sync to Drive Now')}</span>
                  </button>
                </div>
              </div>

              {/* Primary 1-Click OAuth 2.0 Connection Box */}
              <div style={{ background: 'rgba(66, 133, 244, 0.05)', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(66, 133, 244, 0.25)', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#4285F4', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={16} />
                      <span>{lang === 'bn' ? 'পদ্ধতি ১: ১-ক্লিক গুগল ড্রাইভ কানেক্ট (OAuth 2.0 - সুপারিশকৃত)' : 'Method 1: 1-Click Google Drive OAuth (Recommended)'}</span>
                    </h4>
                    <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {lang === 'bn' ? 'কোনো স্ক্রিপ্ট বা কোডিং ছাড়া সরাসরি আপনার গুগল অ্যাকাউন্টে ব্যাকআপ ফোল্ডার তৈরি হয়।' : 'Uploads directly into your Google Drive securely without any code.'}
                    </p>
                  </div>

                  {isDriveConnected ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', padding: '6px 12px', borderRadius: '8px', border: '1px solid #10b981' }}>
                        {driveUser?.picture ? (
                          <img src={driveUser.picture} alt="Avatar" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                        ) : (
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#4285F4', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                            G
                          </div>
                        )}
                        <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#10b981' }}>
                          {driveUser?.name || 'Connected'}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={async () => {
                          setIsConnectingDriveOAuth(true);
                          try {
                            if (clientIdInput && clientIdInput.trim()) {
                              saveGoogleClientId(clientIdInput.trim());
                            }
                            await switchDriveOAuth(clientIdInput);
                            setFormState(prev => ({ ...prev, googleDriveEnabled: true }));
                            updateBusinessSettings({ googleDriveEnabled: true });
                          } catch {
                            // toast handled
                          } finally {
                            setIsConnectingDriveOAuth(false);
                          }
                        }}
                        disabled={isConnectingDriveOAuth}
                        title={lang === 'bn' ? 'অন্য গুগল ড্রাইভ অ্যাকাউন্ট নির্বাচন করুন' : 'Switch Google Account'}
                        style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <RefreshCw size={13} className={isConnectingDriveOAuth ? 'animate-spin' : ''} />
                        <span>{lang === 'bn' ? 'অ্যাকাউন্ট পরিবর্তন করুন' : 'Switch Account'}</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={disconnectDriveOAuth}
                        style={{ padding: '6px 10px', color: '#ef4444', fontSize: '0.78rem' }}
                      >
                        <LogOut size={14} />
                        <span>{lang === 'bn' ? 'সংযোগ বিচ্ছিন্ন' : 'Disconnect'}</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={isConnectingDriveOAuth}
                      onClick={async () => {
                        setIsConnectingDriveOAuth(true);
                        try {
                          if (clientIdInput && clientIdInput.trim()) {
                            saveGoogleClientId(clientIdInput.trim());
                          }
                          await connectDriveOAuth(clientIdInput);
                          setFormState(prev => ({ ...prev, googleDriveEnabled: true }));
                          updateBusinessSettings({ googleDriveEnabled: true });
                        } catch {
                          // toast in context
                        } finally {
                          setIsConnectingDriveOAuth(false);
                        }
                      }}
                      style={{
                        background: '#4285F4',
                        borderColor: '#4285F4',
                        fontWeight: '700',
                        padding: '8px 18px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(66, 133, 244, 0.25)'
                      }}
                    >
                      {isConnectingDriveOAuth ? (
                        <RefreshCw size={16} className="spin" />
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24">
                          <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                          <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                      )}
                      <span>{isConnectingDriveOAuth ? (lang === 'bn' ? 'সংযোগ হচ্ছে...' : 'Connecting...') : (lang === 'bn' ? 'Google Drive দিয়ে ১-ক্লিকে কানেক্ট করুন' : '1-Click Connect Google Drive')}</span>
                    </button>
                  )}
                </div>

                {/* Google Client ID Config */}
                <div style={{ marginTop: '10px' }}>
                  <label className="field-label" style={{ fontSize: '0.75rem', fontWeight: '700' }}>
                    {lang === 'bn' ? 'Google Cloud Console Client ID (আপনার তৈরি করা ক্রেডেনশিয়াল):' : 'Google Cloud Console Client ID:'}
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="input-field"
                      style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}
                      value={clientIdInput}
                      onChange={(e) => {
                        setClientIdInput(e.target.value);
                        saveGoogleClientId(e.target.value);
                      }}
                      placeholder="442090260759-...apps.googleusercontent.com"
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        saveGoogleClientId(clientIdInput);
                        alert(lang === 'bn' ? 'Client ID সংরক্ষিত হয়েছে!' : 'Client ID saved!');
                      }}
                      style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                    >
                      {lang === 'bn' ? 'সংরক্ষণ' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Webhook & Folders Settings */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label className="field-label">{lang === 'bn' ? 'গুগল ড্রাইভ ফোল্ডারের নাম:' : 'Drive Backup Folder Name:'}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formState.googleDriveFolder || 'HisabKitab-360-Backups'}
                    onChange={(e) => setFormState({ ...formState, googleDriveFolder: e.target.value })}
                  />
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {lang === 'bn' ? 'ড্রাইভে এই ফোল্ডারের ভেতর স্বয়ংক্রিয় ব্যাকআপ ফাইল জমা হবে' : 'Folder created in your Google Drive'}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="field-label" style={{ fontWeight: '700' }}>
                      {lang === 'bn' ? 'পদ্ধতি ২: Apps Script Webhook URL (বিকল্প):' : 'Method 2: Apps Script Webhook URL:'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowDriveGuide(!showDriveGuide)}
                      style={{ background: 'transparent', border: 'none', color: '#4285F4', fontSize: '0.72rem', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      {showDriveGuide ? (lang === 'bn' ? 'গাইড লুকান' : 'Hide Guide') : (lang === 'bn' ? 'স্ক্রিপ্ট গাইড' : 'Script Guide')}
                    </button>
                  </div>
                  <input
                    type="url"
                    className="input-field"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={formState.googleDriveWebhookUrl || ''}
                    onChange={(e) => setFormState({ ...formState, googleDriveWebhookUrl: e.target.value })}
                  />
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {lang === 'bn' ? 'যদি Webhook স্ক্রিপ্ট ব্যবহার করতে চান' : 'Optional Webhook alternative'}
                  </div>
                </div>
              </div>

              {/* Step-by-Step Google Drive Setup Guide */}
              {showDriveGuide && (
                <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: '10px', border: '1px solid #4285F4', marginBottom: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: '0.95rem', fontWeight: '800', color: '#4285F4', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} />
                    <span>{lang === 'bn' ? 'কীভাবে ২ মিনিটে Google Drive কানেক্ট করবেন (১০০% ফ্রি):' : 'How to connect Google Drive in 2 minutes (100% Free):'}</span>
                  </h4>
                  <ol style={{ fontSize: '0.85rem', color: 'var(--text-main)', paddingLeft: '1.25rem', margin: '0 0 12px', lineHeight: 1.7 }}>
                    <li>
                      ব্রাউজারে <strong><a href="https://script.google.com" target="_blank" rel="noreferrer" style={{ color: '#4285F4', textDecoration: 'underline' }}>script.google.com</a></strong> ওপেন করুন এবং <strong>"New Project"</strong> এ ক্লিক করুন।
                    </li>
                    <li>
                      নিচের কোডটি কপি করে সেখানে পেস্ট করুন:
                    </li>
                  </ol>

                  {/* Copyable Code Block */}
                  <div style={{ position: 'relative', marginBottom: '12px' }}>
                    <pre style={{ background: '#0f172a', color: '#38bdf8', padding: '12px 14px', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace', overflowX: 'auto', margin: 0 }}>
{`function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var folderName = "HisabKitab-360-Backups";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
    var dateStr = Utilities.formatDate(new Date(), "GMT+6", "yyyy-MM-dd_HH-mm");
    var filename = "hisabkitab_backup_" + dateStr + ".json";
    var file = folder.createFile(filename, JSON.stringify(payload, null, 2), "application/json");
    return ContentService.createTextOutput(JSON.stringify({ status: "success", fileId: file.getId() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`}
                    </pre>
                    <button
                      type="button"
                      onClick={() => {
                        const code = `function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var folderName = "HisabKitab-360-Backups";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
    var dateStr = Utilities.formatDate(new Date(), "GMT+6", "yyyy-MM-dd_HH-mm");
    var filename = "hisabkitab_backup_" + dateStr + ".json";
    var file = folder.createFile(filename, JSON.stringify(payload, null, 2), "application/json");
    return ContentService.createTextOutput(JSON.stringify({ status: "success", fileId: file.getId() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
                        navigator.clipboard.writeText(code);
                        setCopiedScript(true);
                        setTimeout(() => setCopiedScript(false), 2500);
                      }}
                      className="btn btn-secondary"
                      style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {copiedScript ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                      <span>{copiedScript ? (lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (lang === 'bn' ? 'কোড কপি করুন' : 'Copy Code')}</span>
                    </button>
                  </div>

                  <ol start="3" style={{ fontSize: '0.85rem', color: 'var(--text-main)', paddingLeft: '1.25rem', margin: 0, lineHeight: 1.7 }}>
                    <li>
                      উপরে ডানপাশে <strong>Deploy</strong> ➔ <strong>New Deployment</strong> ➔ গিয়ার আইকন থেকে <strong>Web app</strong> সিলেক্ট করুন।
                    </li>
                    <li>
                      <strong>Execute as:</strong> "Me" এবং <strong>Who has access:</strong> "Anyone" দিয়ে <strong>Deploy</strong> বাটনে চাপুন।
                    </li>
                    <li>
                      যে <strong>Web App URL</strong> টি পাবেন তা কপি করে উপরের ঘরে পেস্ট করে <strong>"কনফিগারেশন সংরক্ষণ করুন"</strong> এ চাপুন। ব্যাস! এখন থেকে স্বয়ংক্রিয়ভাবে আপনার গুগল ড্রাইভে ব্যাকআপ জমা হবে।
                    </li>
                  </ol>
                </div>
              )}
            </div>

            {/* 2. AUTOMATIC LOCAL BACKUP & SNAPSHOTS */}
            <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '8px', borderRadius: '8px', color: '#10b981' }}>
                    <HardDrive size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {lang === 'bn' ? 'স্বয়ংক্রিয় ব্যাকআপ স্ন্যাপশট ও রোলব্যাক' : 'Auto Backup Snapshots & Instant Rollback'}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {lang === 'bn' ? 'সিস্টেম স্বয়ংক্রিয়ভাবে স্ন্যাপশট রাখে যাতে যে কোনো সময় পূর্বে ফিরে যাওয়া যায়' : 'Local snapshots created automatically for instant point-in-time recovery'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => createAutoSnapshot(lang === 'bn' ? 'ম্যানুয়াল স্ন্যাপশট' : 'Manual Snapshot')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
                >
                  <Sparkles size={15} style={{ color: '#10b981' }} />
                  <span>{lang === 'bn' ? 'এখনই স্ন্যাপশট নিন' : 'Take Snapshot Now'}</span>
                </button>
              </div>

              {/* Auto Backup Configuration Controls */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                      {lang === 'bn' ? 'দৈনিক অটো-ব্যাকআপ সক্রিয়' : 'Enable Daily Auto-Backup'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {lang === 'bn' ? 'প্রতিদিন প্রথম চালুর সময় ব্যাকআপ নেবে' : 'Creates snapshot on first daily open'}
                    </div>
                  </div>
                  <label className="switch" style={{ margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={formState.autoBackupEnabled !== false}
                      onChange={() => handleToggle('autoBackupEnabled')}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div style={{ padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <label className="field-label" style={{ marginBottom: '4px' }}>
                    {lang === 'bn' ? 'স্বয়ংক্রিয় ব্যাকআপের ফ্রিকোয়েন্সি:' : 'Auto-Backup Frequency:'}
                  </label>
                  <select
                    className="input-field"
                    value={formState.autoBackupInterval || 'daily'}
                    onChange={(e) => setFormState({ ...formState, autoBackupInterval: e.target.value })}
                  >
                    <option value="daily">{lang === 'bn' ? 'প্রতিদিন একবার (Daily)' : 'Daily'}</option>
                    <option value="weekly">{lang === 'bn' ? 'প্রতি সপ্তাহে একবার (Weekly)' : 'Weekly'}</option>
                    <option value="realtime">{lang === 'bn' ? 'গুরুত্বপূর্ণ বিক্রয় শেষে (After Sales)' : 'After Major Sales'}</option>
                  </select>
                </div>
              </div>

              {/* Snapshots Table */}
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>
                  {lang === 'bn' ? `সংরক্ষিত স্ন্যাপশট হিস্টোরি (${snapshots.length})` : `Saved Snapshots History (${snapshots.length})`}
                </div>
                {snapshots.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--bg-primary)', borderRadius: '8px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                    {lang === 'bn' ? 'এখনও কোনো অটো-স্ন্যাপশট সংরক্ষিত নেই। উপরের "এখনই স্ন্যাপশট নিন" বাটনে ক্লিক করে তৈরি করতে পারেন।' : 'No snapshots yet.'}
                  </div>
                ) : (
                  <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', textAlign: 'left' }}>
                          <th style={{ padding: '8px 10px' }}>{lang === 'bn' ? 'তারিখ ও সময়' : 'Timestamp'}</th>
                          <th style={{ padding: '8px 10px' }}>{lang === 'bn' ? 'স্ন্যাপশট টাইটেল' : 'Snapshot Label'}</th>
                          <th style={{ padding: '8px 10px' }}>{lang === 'bn' ? 'আকার' : 'Size'}</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center' }}>{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {snapshots.map((snap) => (
                          <tr key={snap.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '8px 10px', fontWeight: '600', color: 'var(--text-main)' }}>
                              {snap.date} <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>({snap.time})</span>
                            </td>
                            <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>
                              {snap.label}
                            </td>
                            <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#10b981' }}>
                              {snap.size || '30 KB'}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  onClick={() => restoreFromSnapshot(snap.id)}
                                  style={{ padding: '3px 8px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  title={lang === 'bn' ? 'এই অবস্থায় ফিরিয়ে নিন' : 'Rollback to this snapshot'}
                                >
                                  <RefreshCw size={11} />
                                  <span>{lang === 'bn' ? 'রিস্টোর' : 'Restore'}</span>
                                </button>
                                <button
                                  type="button"
                                  className="btn-icon"
                                  onClick={() => deleteSnapshot(snap.id)}
                                  style={{ color: '#ef4444', padding: '3px' }}
                                  title={t.delete}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* 3. MANUAL BACKUP & FACTORY RESET */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                {lang === 'bn' ? 'ম্যানুয়াল ব্যাকআপ ও অফলাইন রিস্টোর' : 'Manual Backup & Offline Restore'}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                {/* Export */}
                <div style={{ padding: '1.25rem', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <Download size={20} style={{ color: '#10b981' }} />
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>
                      {lang === 'bn' ? 'সম্পূর্ণ ডাটা ব্যাকআপ ডাউনলোড' : 'Download Complete Backup'}
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
                    {lang === 'bn'
                      ? 'আপনার সমস্ত ইনভয়েস, কোটেশন, কাস্টমার প্রোফাইল, স্টক পণ্য এবং ব্যক্তিগত খরচের ব্যাকআপ JSON ফাইলে সুরক্ষিত রাখুন।'
                      : 'Download full JSON snapshot including invoices, quotations, customer profiles, inventory and expenses.'}
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={exportAllData}
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                  >
                    <Download size={16} />
                    <span>{lang === 'bn' ? 'JSON ব্যাকআপ ডাউনলোড' : 'Export JSON Backup'}</span>
                  </button>
                </div>

                {/* Import */}
                <div style={{ padding: '1.25rem', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <Upload size={20} style={{ color: '#6366f1' }} />
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>
                      {lang === 'bn' ? 'ব্যাকআপ থেকে রিস্টোর' : 'Restore from Backup'}
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
                    {lang === 'bn'
                      ? 'পূর্বে সংরক্ষিত JSON ব্যাকআপ ফাইল নির্বাচন করে সমস্ত তথ্য স্বয়ংক্রিয়ভাবে ফিরিয়ে আনুন।'
                      : 'Select a previously saved backup file to restore your company data and records.'}
                  </p>
                  <label style={{ display: 'block', cursor: 'pointer' }}>
                    <div
                      className="btn btn-secondary"
                      style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                    >
                      <Upload size={16} />
                      <span>{lang === 'bn' ? 'ফাইল সিলেক্ট করে রিস্টোর' : 'Choose File & Restore'}</span>
                    </div>
                    <input
                      type="file"
                      accept=".json"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                  </label>
                </div>

                {/* Reset */}
                <div style={{ padding: '1.25rem', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <RefreshCw size={20} style={{ color: '#ef4444' }} />
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#ef4444' }}>
                      {lang === 'bn' ? 'ডেমো ডাটা ফ্যাক্টরি রিসেট' : 'Factory Reset to Demo'}
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
                    {lang === 'bn'
                      ? 'আপনার সমস্ত ডাটা মুছে দিয়ে সফটওয়্যারটিকে প্রাথমিক ডেমো অবস্থায় ফিরিয়ে নেবে।'
                      : 'Clear custom modifications and reload pristine sample demo data across all modules.'}
                  </p>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={resetToDemo}
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                  >
                    <RefreshCw size={16} />
                    <span>{lang === 'bn' ? 'ডেমো ডাটা রিসেট করুন' : 'Reset to Initial Demo'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: COMMERCIAL RESELLING, LICENSING & CLIENT SETUP */}
        {/* ========================================================= */}
        {activeSubTab === 'commercial' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* 1. FRESH CLIENT STORE ONBOARDING (0-RECORD CLEAN SLATE) */}
            <div className="glass-card" style={{ borderLeft: '4px solid #10b981', background: 'var(--card-bg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '10px', borderRadius: '10px' }}>
                    <Store size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {lang === 'bn' ? 'নতুন ক্লায়েন্ট অনবোর্ডিং উইজার্ড (Clean Slate Store)' : 'New Client Clean Slate Onboarding'}
                    </h3>
                    <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {lang === 'bn'
                        ? 'কোন নতুন দোকানে সফটওয়্যারটি সেল করার পর ডেমো ডাটা মুছে ফ্রেশ এবং পরিচ্ছন্নভাবে স্টার্ট করার উইজার্ড'
                        : 'Wipe all dummy/demo transactions and initialize a clean 0-record production store for a paying customer'}
                    </p>
                  </div>
                </div>

                <span className="badge badge-success" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                  ১০০% রিয়েল স্টোর
                </span>
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '10px', padding: '14px', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Sparkles size={20} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                    <strong>{lang === 'bn' ? 'সতর্কতা ও কাজের নিয়ম:' : 'Important Notice:'}</strong> {lang === 'bn'
                      ? 'এই বাটনে ক্লিক করলে সিস্টেমের পূর্বের সকল টেস্ট ডেমো পণ্য, বিক্রয় হিসাব, বাকির খাতা ও খরচ সম্পূর্ণ মুছে গিয়ে আপনার নতুন কাস্টমারের নামে ফ্রেশ দোকান তৈরি হবে। কাস্টমার নিজে পণ্য ও স্টক এন্ট্রি দিয়ে শুরু করতে পারবেন।'
                      : 'This will purge all mock/demo sales, stock, and expenses to create an authentic zero-record database for the shop owner.'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label className="field-label" style={{ fontWeight: '700' }}>
                    {lang === 'bn' ? 'দোকান বা ব্যবসা প্রতিষ্ঠানের নাম *' : 'Client Store Name *'}
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder={lang === 'bn' ? 'যেমন: ভাই ভাই ডিপার্টমেন্টাল স্টোর' : 'e.g. Apex Super Mart'}
                    value={freshStoreForm.shopName}
                    onChange={(e) => setFreshStoreForm({ ...freshStoreForm, shopName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label">{lang === 'bn' ? 'প্রোপাইটর / মালিকের নাম' : 'Owner / Proprietor Name'}</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder={lang === 'bn' ? 'যেমন: মোঃ রফিকুল ইসলাম' : 'e.g. Md. Rafiqul Islam'}
                    value={freshStoreForm.ownerName}
                    onChange={(e) => setFreshStoreForm({ ...freshStoreForm, ownerName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label">{lang === 'bn' ? 'দোকানের মোবাইল নম্বর *' : 'Contact Phone *'}</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="01XXXXXXXXX"
                    value={freshStoreForm.phone}
                    onChange={(e) => setFreshStoreForm({ ...freshStoreForm, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label">{lang === 'bn' ? 'দোকানের পূর্ণ ঠিকানা' : 'Store Address'}</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder={lang === 'bn' ? 'যেমন: দোকান নং ৪, নিউ মার্কেট, ঢাকা' : 'e.g. Shop 4, New Market, Dhaka'}
                    value={freshStoreForm.address}
                    onChange={(e) => setFreshStoreForm({ ...freshStoreForm, address: e.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label">{lang === 'bn' ? 'ট্যাক্স / ভ্যাট BIN নম্বর (ঐচ্ছিক)' : 'VAT / BIN Number'}</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="BIN-XXXXXXXXX"
                    value={freshStoreForm.bin}
                    onChange={(e) => setFreshStoreForm({ ...freshStoreForm, bin: e.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label">{lang === 'bn' ? 'কারেন্সি প্রতীক' : 'Currency Symbol'}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={freshStoreForm.currency}
                    onChange={(e) => setFreshStoreForm({ ...freshStoreForm, currency: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    if (!freshStoreForm.shopName.trim()) {
                      alert(lang === 'bn' ? 'দয়া করে নতুন ক্লায়েন্টের দোকানের নাম প্রদান করুন।' : 'Please enter the client store name.');
                      return;
                    }
                    if (window.confirm(lang === 'bn' ? `আপনি কি নিশ্চিত যে "${freshStoreForm.shopName}" এর জন্য ফ্রেশ অ্যাকাউন্ট তৈরি করতে চান? পূর্বের সকল ডেমো ডাটা মুছে যাবে।` : `Initialize fresh store for "${freshStoreForm.shopName}"?`)) {
                      startFreshStore(freshStoreForm);
                      setFormState(prev => ({
                        ...prev,
                        companyName: freshStoreForm.shopName,
                        ownerName: freshStoreForm.ownerName,
                        phone: freshStoreForm.phone,
                        address: freshStoreForm.address,
                        binNumber: freshStoreForm.bin,
                        currency: freshStoreForm.currency
                      }));
                      setFreshStoreForm({
                        shopName: '',
                        ownerName: '',
                        phone: '',
                        address: '',
                        bin: '',
                        currency: '৳',
                        initialNote: 'আমাদের সাথে কেনাকাটা করার জন্য ধন্যবাদ। পণ্য পরিবর্তনের সময় ক্যাশমেমো সঙ্গে রাখুন।'
                      });
                    }
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    borderColor: '#10b981',
                    padding: '10px 24px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Sparkles size={16} />
                  <span>{lang === 'bn' ? '🚀 ক্লিন স্টোর তৈরি করুন (Clean Slate Store)' : 'Initialize Clean Slate Store'}</span>
                </button>
              </div>
            </div>

            {/* 2. COMMERCIAL LICENSE STATUS & KEY GENERATOR */}
            <div className="glass-card" style={{ borderLeft: '4px solid #6366f1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', padding: '10px', borderRadius: '10px' }}>
                    <Key size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {lang === 'bn' ? 'সফটওয়্যার কমার্শিয়াল লাইসেন্স ও এক্টিভেশন' : 'Software Commercial License & Key'}
                    </h3>
                    <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {lang === 'bn' ? 'ক্লায়েন্টের লাইসেন্স স্টেটাস এবং জেনুইন লাইসেন্স কী ব্যবস্থাপনা' : 'Manage client license validity and generate authentic enterprise keys'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {licenseInfo?.status === 'active' ? (
                    <span className="badge badge-success" style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={14} />
                      <span>{lang === 'bn' ? 'লাইফটাইম সক্রিয় (Lifetime Active)' : 'Active Lifetime'}</span>
                    </span>
                  ) : (
                    <span className="badge badge-warning" style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', background: '#f59e0b', color: '#fff' }}>
                      <AlertTriangle size={14} />
                      <span>{lang === 'bn' ? 'ট্রায়াল মোড (Trial Mode)' : 'Trial Mode'}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* License Status Banner */}
              {licenseInfo?.status !== 'active' && (
                <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid #f59e0b', borderRadius: '10px', padding: '14px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertTriangle size={24} style={{ color: '#f59e0b' }} />
                    <div>
                      <div style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                        {lang === 'bn' ? 'সফটওয়্যারটি বর্তমানে ট্রায়াল মোডে চলছে' : 'Software is currently in Trial Mode'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {lang === 'bn' ? `লাইফটাইম লাইসেন্স সংগ্রহ করতে হটলাইনে কল করুন: ${licenseInfo?.resellerPhone || '01700000000'}` : `Contact support to upgrade: ${licenseInfo?.resellerPhone || '01700000000'}`}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'var(--bg-primary)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {lang === 'bn' ? 'লাইসেন্স প্ল্যান:' : 'License Plan:'}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '4px' }}>
                    {licenseInfo?.planName || (licenseInfo?.status === 'active' ? 'Enterprise Commercial Lifetime' : '14-Day Evaluation Trial')}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: licenseInfo?.status === 'active' ? '#10b981' : '#f59e0b', marginTop: '4px', fontWeight: '600' }}>
                    {licenseInfo?.status === 'active' ? '✓ আনলিমিটেড ইনভয়েস ও সেলস টার্মিনাল' : '⚠️ ট্রায়াল সংস্করণ (সীমিত ব্যবহারের পর লক হবে)'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#10b981', marginTop: '2px', fontWeight: '600' }}>
                    ✓ অফলাইন লোকাল ডেটাবেস + ক্লাউড ব্যাকআপ
                  </div>
                </div>

                <div style={{ background: 'var(--bg-primary)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {lang === 'bn' ? 'বর্তমান অফিসিয়াল লাইসেন্স কী:' : 'Current License Key:'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: '800', color: licenseInfo?.status === 'active' ? '#10b981' : '#f59e0b', background: 'var(--bg-secondary)', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {licenseInfo?.licenseKey || 'UNLICENSED'}
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '6px 10px' }}
                      title="Copy Key"
                      onClick={() => {
                        if (licenseInfo?.licenseKey) {
                          navigator.clipboard.writeText(licenseInfo.licenseKey);
                          setCopiedKey(true);
                          setTimeout(() => setCopiedKey(false), 2000);
                        }
                      }}
                    >
                      {copiedKey ? <Check size={16} style={{ color: '#10b981' }} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    নিবন্ধিত প্রতিষ্ঠান: <strong>{licenseInfo?.clientShopName || formState.companyName || 'ক্লিন স্টোর'}</strong>
                  </div>
                </div>
              </div>

              {/* REAL LICENSE ACTIVATION INPUT BOX */}
              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Key size={16} style={{ color: 'var(--business-primary)' }} />
                  <span>{lang === 'bn' ? 'লাইসেন্স কী প্রবেশ করে সফটওয়্যার অ্যাক্টিভেট করুন:' : 'Enter License Key to Activate Software:'}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 10px' }}>
                  {lang === 'bn'
                    ? 'আপনার ভেন্ডরের নিকট থেকে প্রাপ্ত লাইসেন্স কোডটি (যেমন: HK360-xxxx-2026-xxxx-xxxx) এখানে লিখে অ্যাক্টিভেট করুন।'
                    : 'Paste the official license key provided by your reseller to unlock lifetime access.'}
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className="input-field"
                    style={{ flex: 1, minWidth: '260px', fontFamily: 'var(--font-mono)', fontWeight: '700', textTransform: 'uppercase' }}
                    placeholder="HK360-XXXX-2026-XXXX-XXXX"
                    value={inputLicenseKey}
                    onChange={(e) => setInputLicenseKey(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      if (!inputLicenseKey.trim()) {
                        alert(lang === 'bn' ? 'দয়া করে একটি লাইসেন্স কী লিখুন।' : 'Please enter a license key.');
                        return;
                      }
                      const res = activateSoftwareWithKey(inputLicenseKey);
                      if (res.success) {
                        setInputLicenseKey('');
                      }
                    }}
                    style={{ padding: '8px 20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <CheckCircle2 size={16} />
                    <span>{lang === 'bn' ? 'যাচাই ও অ্যাক্টিভেট করুন' : 'Verify & Activate'}</span>
                  </button>
                </div>
              </div>

              {/* Vendor Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      const newKey = generateNewLicenseKey(formState.companyName);
                      updateLicenseInfo({ licenseKey: newKey });
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <RefreshCw size={14} />
                    <span>{lang === 'bn' ? 'নতুন লাইসেন্স কী তৈরি করুন' : 'Regenerate License Key'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      const quickKey = generateNewLicenseKey(formState.companyName);
                      activateSoftwareWithKey(quickKey);
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10b981' }}
                  >
                    <Sparkles size={14} />
                    <span>{lang === 'bn' ? '১-ক্লিকে অটো লাইসেন্স দিন' : '1-Click Auto Activate'}</span>
                  </button>
                </div>

                {licenseInfo?.status === 'active' && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      if (window.confirm(lang === 'bn' ? 'আপনি কি ট্রায়াল মোড টেস্ট করার জন্য লাইসেন্স নিষ্ক্রিয় করতে চান?' : 'Deactivate to test trial mode?')) {
                        deactivateLicense();
                      }
                    }}
                    style={{ fontSize: '0.78rem', color: '#ef4444' }}
                    title="Test how unlicensed software behaves"
                  >
                    <span>{lang === 'bn' ? '🔒 ট্রায়াল মোড টেস্ট করুন' : '🔒 Test Trial Lock'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* 3. RESELLER / AGENCY BRANDING */}
            <div className="glass-card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '10px', borderRadius: '10px' }}>
                    <Building size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {lang === 'bn' ? 'সফটওয়্যার ভেন্ডর ও রিসেলার ব্র্যান্ডিং' : 'Vendor & Reseller Company Branding'}
                    </h3>
                    <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {lang === 'bn' ? 'এখানে আপনার নিজের এজেন্সি বা কোম্পানির নাম দিন—যা ক্লায়েন্টের অ্যাপ ফুটার ও সাপোর্টে দেখাবে' : 'Configure your tech agency details to show on the software footer and support credits'}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label className="field-label" style={{ fontWeight: '700' }}>
                    {lang === 'bn' ? 'আপনার সফটওয়্যার কোম্পানি / এজেন্সির নাম:' : 'Your Agency / Reseller Company Name:'}
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={resellerForm.resellerName}
                    onChange={(e) => setResellerForm({ ...resellerForm, resellerName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label">{lang === 'bn' ? 'কাস্টমার সাপোর্ট হটলাইন নম্বর:' : 'Support Hotline Number:'}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={resellerForm.resellerPhone}
                    onChange={(e) => setResellerForm({ ...resellerForm, resellerPhone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label">{lang === 'bn' ? 'সাপোর্ট ইমেইল ঠিকানা:' : 'Support Email Address:'}</label>
                  <input
                    type="email"
                    className="input-field"
                    value={resellerForm.resellerEmail}
                    onChange={(e) => setResellerForm({ ...resellerForm, resellerEmail: e.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label">{lang === 'bn' ? 'কোম্পানি ওয়েবসাইট / ফেসবুক পেজ:' : 'Website / Facebook Page:'}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={resellerForm.resellerWebsite}
                    onChange={(e) => setResellerForm({ ...resellerForm, resellerWebsite: e.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label">{lang === 'bn' ? 'সাপোর্ট WhatsApp নম্বর (আন্তর্জাতিক ফরম্যাটে):' : 'Support WhatsApp Number:'}</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="88017XXXXXXXX"
                    value={resellerForm.vendorWhatsApp}
                    onChange={(e) => setResellerForm({ ...resellerForm, vendorWhatsApp: e.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label">{lang === 'bn' ? 'ফেসবুক মেসেঞ্জার বা পেজ লিংক:' : 'Facebook / Messenger Link:'}</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="https://m.me/yourpage"
                    value={resellerForm.vendorFacebook}
                    onChange={(e) => setResellerForm({ ...resellerForm, vendorFacebook: e.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label">{lang === 'bn' ? 'টেলিগ্রাম চ্যানেল বা ইউজারনেম:' : 'Telegram Channel / Username:'}</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="https://t.me/yourchannel"
                    value={resellerForm.vendorTelegram}
                    onChange={(e) => setResellerForm({ ...resellerForm, vendorTelegram: e.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label">{lang === 'bn' ? 'গ্রাহক সেবা প্রদানের সময়সূচি:' : 'Available Support Hours:'}</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="সকাল ৯:০০ টা - রাত ১১:০০ টা"
                    value={resellerForm.vendorHours}
                    onChange={(e) => setResellerForm({ ...resellerForm, vendorHours: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    updateLicenseInfo({
                      resellerName: resellerForm.resellerName,
                      resellerPhone: resellerForm.resellerPhone,
                      resellerEmail: resellerForm.resellerEmail,
                      resellerWebsite: resellerForm.resellerWebsite
                    });
                    updateBusinessSettings({
                      vendorSupport: {
                        supportName: resellerForm.resellerName,
                        phone: resellerForm.resellerPhone,
                        whatsapp: resellerForm.vendorWhatsApp || resellerForm.resellerPhone,
                        facebook: resellerForm.vendorFacebook || 'https://m.me/hisabkitab360',
                        telegram: resellerForm.vendorTelegram || 'https://t.me/hisabkitab360',
                        email: resellerForm.resellerEmail,
                        availableHours: resellerForm.vendorHours || 'সকাল ৯:০০ টা - রাত ১১:০০ টা (সপ্তাহের ৭ দিন)'
                      }
                    });
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
                >
                  <Save size={16} />
                  <span>{lang === 'bn' ? 'রিসেলার ও সাপোর্ট চ্যানেল সংরক্ষণ করুন' : 'Save Reseller & Support'}</span>
                </button>
              </div>
            </div>

            {/* 4. PACKAGING & SELLING BLUEPRINT FOR BANGLADESH */}
            <div className="glass-card" style={{ borderLeft: '4px solid #06b6d4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <div style={{ background: 'rgba(06, 182, 212, 0.15)', color: '#06b6d4', padding: '10px', borderRadius: '10px' }}>
                  <Monitor size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'সফটওয়্যার প্যাকেজিং ও বিক্রির পূর্ণাঙ্গ গাইড (Bangladesh Market Blueprint)' : 'Packaging & Selling Blueprint'}
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn' ? 'কীভাবে দোকানে গিয়ে এই সফটওয়্যারটি সেল ও ইনস্টল করবেন তার স্টেপ-বাই-স্টেপ নিয়ম' : 'How to package as offline desktop .exe, connect thermal printers, and bundle with hardware'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {/* Method 1: Offline Desktop */}
                <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>💻</span>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {lang === 'bn' ? 'পদ্ধতি ১: অফলাইন ডেস্কটপ ইনস্টলার (.exe)' : 'Offline Windows Desktop (.exe)'}
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 10px' }}>
                    {lang === 'bn'
                      ? 'বাংলাদেশের মুদি দোকান, ফার্মেসি ও ডিপার্টমেন্টাল স্টোরে ইন্টারনেট সবসময় থাকে না। তাই অফলাইন উইন্ডোজ অ্যাপ হিসেবে বিক্রি করা সবচেয়ে বেশি জনপ্রিয়।'
                      : 'Best for local retail shops without reliable internet. 100% offline data persistence.'}
                  </p>
                  <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '6px', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', border: '1px solid var(--border-color)', marginBottom: '8px' }}>
                    cd hisabkitab-360<br />
                    npm run build
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: '600' }}>
                    ✓ ইউএসবি থার্মাল প্রিন্টার (80mm/58mm) অটো কাজ করে<br />
                    ✓ বারকোড স্ক্যানার সরাসরি প্লাগ-এন্ড-প্লে
                  </div>
                </div>

                {/* Method 2: Cloud SaaS */}
                <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🌐</span>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {lang === 'bn' ? 'পদ্ধতি ২: অনলাইন ক্লাউড সংস্করণ (Web SaaS)' : 'Online Cloud SaaS'}
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 10px' }}>
                    {lang === 'bn'
                      ? 'Vercel অথবা Netlify তে ফ্রি ডিপ্লয় করে কাস্টমারকে লিঙ্ক দিয়ে দেওয়া যায়। দোকানদার যেকোনো কম্পিউটার, ট্যাব বা মোবাইল থেকে চালাতে পারবেন।'
                      : 'Deploy on Vercel/Netlify. Accessible from any computer, tablet or mobile phone.'}
                  </p>
                  <div style={{ fontSize: '0.78rem', color: '#6366f1', fontWeight: '600' }}>
                    ✓ গুগল ড্রাইভ অটো-ব্যাকআপ কানেক্টেড<br />
                    ✓ মাসিক ৫০০-১,০০০ টাকা সাবস্ক্রিপশন মডেল
                  </div>
                </div>

                {/* Method 3: Hardware Bundles */}
                <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>💰</span>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {lang === 'bn' ? 'প্রাইসিং ও হার্ডওয়্যার প্যাকেজ (বাংলাদেশ মার্কেট)' : 'Pricing & Hardware Packages'}
                    </h4>
                  </div>
                  <ul style={{ fontSize: '0.82rem', color: 'var(--text-main)', paddingLeft: '1.2rem', margin: 0, lineHeight: 1.7 }}>
                    <li><strong>শুধু সফটওয়্যার লাইসেন্স:</strong> ৳৫,০০০ - ৳১০,০০০ (এককালীন)</li>
                    <li><strong>হার্ডওয়্যার বান্ডল (প্রিন্টার + স্ক্যানার + সফটওয়্যার):</strong> ৳১৫,০০০ - ৳২২,০০০</li>
                    <li><strong>বাৎসরিক মেইনটেন্যান্স ফি (AMC):</strong> ৳২,০০০ - ৳৩,০০০/বছর</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        )}
      </form>
    </div>
  );
};
