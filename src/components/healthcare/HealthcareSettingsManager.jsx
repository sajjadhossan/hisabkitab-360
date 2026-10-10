import React, { useState } from 'react';
import { useHealthcare } from '../../context/HealthcareContext';
import {
  Building2,
  Building,
  Check,
  Save,
  Edit3,
  Trash2,
  Plus,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Unlock,
  Power,
  Sparkles,
  Clock,
  Calendar,
  MapPin,
  Phone,
  Mail,
  User,
  Layers,
  Globe,
  FileText,
  CheckCircle2,
  XCircle,
  X,
  Search,
  Filter,
  Key,
  Sliders,
  DollarSign,
  Languages,
  Image as ImageIcon
} from 'lucide-react';

export const HealthcareSettingsManager = ({ onInstitutionTypeChange }) => {
  const {
    institutionInfo = {
      name: 'হেলথকেয়ার 360° হাসপাতাল ও ডায়াগনস্টিক কমপ্লেক্স',
      logo: '',
      type: 'হাসপাতাল + ডায়াগনস্টিক + ফার্মেসি',
      phone: '+৮৮০ ১৭০০-১২৩৪৫৬',
      email: 'contact@healthcare360.com.bd',
      address: 'বাড়ি ১২, রোড ৫, ধানমন্ডি, ঢাকা ১২০৫',
      country: 'বাংলাদেশ',
      timezone: 'Asia/Dhaka (GMT+6)',
      currency: 'BDT (৳)',
      defaultLanguage: 'বাংলা (Bengali)',
      receiptFooter: 'সুস্থ থাকুন, ভালো থাকুন। জরুরি প্রয়োজনে কল করুন: ১৬২৬৩। যেকোনো অভিযোগ বা পরামর্শে যোগাযোগ করুন admin@healthcare360.com.bd',
      isActive: true
    },
    updateInstitutionInfo,
    branches = [],
    addBranch,
    updateBranch,
    toggleBranchStatus,
    activeBranchId,
    setActiveBranchId
  } = useHealthcare();

  // Active Subtab: 'institution' | 'branches' | 'permissions' | 'rules'
  const [activeSubTab, setActiveSubTab] = useState('institution');

  // 1. Institution Form State (12 fields requested)
  const [instForm, setInstForm] = useState(() => ({
    name: institutionInfo?.name || 'হেলথকেয়ার 360° হাসপাতাল ও ডায়াগনস্টিক কমপ্লেক্স',
    logo: institutionInfo?.logo || '',
    type: institutionInfo?.type || 'হাসপাতাল + ডায়াগনস্টিক + ফার্মেসি',
    phone: institutionInfo?.phone || '+৮৮০ ১৭০০-১২৩৪৫৬',
    email: institutionInfo?.email || 'contact@healthcare360.com.bd',
    address: institutionInfo?.address || 'বাড়ি ১২, রোড ৫, ধানমন্ডি, ঢাকা ১২০৫',
    country: institutionInfo?.country || 'বাংলাদেশ',
    timezone: institutionInfo?.timezone || 'Asia/Dhaka (GMT+6)',
    currency: institutionInfo?.currency || 'BDT (৳)',
    defaultLanguage: institutionInfo?.defaultLanguage || 'বাংলা (Bengali)',
    receiptFooter: institutionInfo?.receiptFooter || 'সুস্থ থাকুন, ভালো থাকুন। জরুরি প্রয়োজনে কল করুন: ১৬২৬৩। সরকারি নিয়ম অনুযায়ী টেস্ট রিপোর্ট সংরক্ষণ করুন।',
    isActive: institutionInfo?.isActive !== undefined ? institutionInfo.isActive : true
  }));

  const [institutionSaveNotice, setInstitutionSaveNotice] = useState(false);

  // Institution Types list
  const institutionTypesList = [
    { id: 'ডাক্তার চেম্বার', label: 'ডাক্তার চেম্বার', desc: 'একক বা যৌথ কনসালটেন্সি ও ডিজিটাল প্রেসক্রিপশন' },
    { id: 'ডায়াগনস্টিক সেন্টার', label: 'ডায়াগনস্টিক সেন্টার', desc: 'প্যাথলজিক্যাল ল্যাব, স্যাম্পল ট্র্যাকিং ও টেস্ট রিপোর্ট' },
    { id: 'ফার্মেসি', label: 'ফার্মেসি', desc: 'ওষুধ ইনভেন্টরি, FEFO ব্যাচ ট্র্যাকিং ও কাউন্টার POS' },
    { id: 'ক্লিনিক / ছোট হাসপাতাল', label: 'ক্লিনিক / ছোট হাসপাতাল', desc: 'আউটডোর ও সীমিত ডে-কেয়ার বেড সুবিধা' },
    { id: 'হাসপাতাল + ডায়াগনস্টিক + ফার্মেসি', label: 'হাসপাতাল + ডায়াগনস্টিক + ফার্মেসি', desc: '৩-ইন-১ পূর্ণাঙ্গ একীভূত হেলথকেয়ার ইকোসিস্টেম (প্রস্তাবিত)' },
    { id: 'একাধিক শাখার প্রতিষ্ঠান', label: 'একাধিক শাখার প্রতিষ্ঠান', desc: 'কেন্দ্রীয় সার্ভার ও শাখাভিত্তিক মাল্টি-লোকেশন নেটওয়ার্ক' }
  ];

  // 2. Branch Search & Filter State
  const [branchFilter, setBranchFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [branchSearch, setBranchSearch] = useState('');

  // 3. Branch Create/Edit Modal State
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState(null); // null means new branch
  const [branchFormData, setBranchFormData] = useState({
    name: '',
    code: '',
    phone: '',
    email: '',
    address: '',
    manager: '',
    openTime: '08:00 AM',
    closeTime: '10:00 PM',
    holiday: 'শুক্রবার',
    stockLocation: 'Central-Rack-01',
    receiptTitle: '',
    isActive: true
  });
  const [branchModalError, setBranchModalError] = useState('');

  // 4. Branch Deactivation / Delete Rule Notification Modal State
  const [ruleModalInfo, setRuleModalInfo] = useState(null);

  // 5. Branch Permission Matrix State
  const [rolePermissions, setRolePermissions] = useState(() => {
    try {
      const saved = localStorage.getItem('hisabkitab_hc_role_branch_perms');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      admin: { label: 'মালিক / প্রতিষ্ঠান অ্যাডমিন', allBranches: true, allowedBranches: ['dhanmondi', 'uttara', 'mirpur', 'chattogram'] },
      manager: { label: 'শাখা ম্যানেজার', allBranches: false, allowedBranches: ['dhanmondi', 'uttara'] },
      doctor: { label: 'ডাক্তার', allBranches: false, allowedBranches: ['dhanmondi'] },
      reception: { label: 'রিসেপশনিস্ট', allBranches: false, allowedBranches: ['dhanmondi'] },
      lab: { label: 'ল্যাব টেকনোলজিস্ট', allBranches: false, allowedBranches: ['dhanmondi'] },
      pharmacy: { label: 'ফার্মাসিস্ট', allBranches: false, allowedBranches: ['dhanmondi'] },
      cashier: { label: 'ক্যাশিয়ার', allBranches: false, allowedBranches: ['dhanmondi'] }
    };
  });
  const [permSaveNotice, setPermSaveNotice] = useState(false);

  // Handle Save Institution Form
  const handleSaveInstitution = (e) => {
    e.preventDefault();
    if (updateInstitutionInfo) {
      updateInstitutionInfo(instForm);
    }
    localStorage.setItem('hisabkitab_hc_institution_info', JSON.stringify(instForm));
    if (onInstitutionTypeChange) {
      onInstitutionTypeChange(instForm.type);
    }
    setInstitutionSaveNotice(true);
    setTimeout(() => setInstitutionSaveNotice(false), 3500);
  };

  // Open Add Branch Modal
  const handleOpenAddBranch = () => {
    setEditingBranchId(null);
    setBranchFormData({
      name: '',
      code: '',
      phone: '',
      email: '',
      address: '',
      manager: '',
      openTime: '08:00 AM',
      closeTime: '10:00 PM',
      holiday: 'শুক্রবার',
      stockLocation: 'Central-Rack-01',
      receiptTitle: '',
      isActive: true
    });
    setBranchModalError('');
    setIsBranchModalOpen(true);
  };

  // Open Edit Branch Modal
  const handleOpenEditBranch = (branch) => {
    if (branch.isAll) {
      alert('একীভূত গ্লোবাল ভিউ এডিটযোগ্য নয়। অনুগ্রহ করে নির্দিষ্ট শাখা নির্বাচন করুন।');
      return;
    }
    setEditingBranchId(branch.id);
    setBranchFormData({
      name: branch.name || '',
      code: branch.code || '',
      phone: branch.phone || '',
      email: branch.email || '',
      address: branch.address || '',
      manager: branch.manager || '',
      openTime: branch.openTime || '08:00 AM',
      closeTime: branch.closeTime || '10:00 PM',
      holiday: branch.holiday || 'শুক্রবার',
      stockLocation: branch.stockLocation || 'Main-Rack',
      receiptTitle: branch.receiptTitle || branch.name || '',
      isActive: branch.isActive !== undefined ? branch.isActive : true
    });
    setBranchModalError('');
    setIsBranchModalOpen(true);
  };

  // Rule 1 Verification & Save Branch (Add or Edit)
  const handleSaveBranchForm = (e) => {
    e.preventDefault();
    const trimmedCode = branchFormData.code.trim().toUpperCase();
    const trimmedName = branchFormData.name.trim();

    if (!trimmedName) {
      setBranchModalError('শাখার নাম প্রদান করা বাধ্যতামূলক!');
      return;
    }

    if (!trimmedCode) {
      setBranchModalError('শাখা কোড প্রদান করা বাধ্যতামূলক!');
      return;
    }

    // Rule 1: শাখা কোড একই প্রতিষ্ঠানের মধ্যে ইউনিক হবে।
    const duplicate = branches.find(
      b => !b.isAll && b.code?.toUpperCase() === trimmedCode && b.id !== editingBranchId
    );

    if (duplicate) {
      setBranchModalError(`⚠️ নিয়ম ১ লঙ্ঘন: "${trimmedCode}" শাখা কোডটি ইতিমধ্যে "${duplicate.name}" শাখার জন্য ব্যবহৃত হয়েছে। প্রতিষ্ঠানের প্রতিটি শাখা কোড ইউনিক হতে হবে!`);
      return;
    }

    if (editingBranchId) {
      // Edit existing branch
      if (updateBranch) {
        updateBranch(editingBranchId, {
          ...branchFormData,
          code: trimmedCode
        });
      }
    } else {
      // Add new branch
      const newId = `branch_${Date.now()}`;
      if (addBranch) {
        addBranch({
          id: newId,
          ...branchFormData,
          code: trimmedCode,
          isMain: false,
          transactionCount: 0
        });
      }
    }

    setIsBranchModalOpen(false);
  };

  // Rule 2 & Deactivate Branch Handler
  // নিয়ম ২: শাখায় লেনদেন থাকলে শাখা স্থায়ীভাবে ডিলিট না করে নিষ্ক্রিয় করতে হবে।
  const handleAttemptDeleteOrDeactivate = (branch) => {
    if (branch.isAll) return;

    const txCount = branch.transactionCount || 0;

    if (txCount > 0) {
      // Cannot delete permanently! Must deactivate instead.
      setRuleModalInfo({
        branch,
        title: 'নিয়ম ২ প্রযোজ্য: শাখা স্থায়ীভাবে ডিলিট নিষিদ্ধ',
        message: `এই শাখাটিতে (${branch.name}) ইতিমধ্যে মোট ${txCount} টি লেনদেন সম্পন্ন হয়েছে। অডিট ট্রেইল, রোগীর রেকর্ড ও রাজস্ব হিসাবের নিরাপত্তার জন্য এটি স্থায়ীভাবে ডিলিট করা সম্ভব নয়।`,
        actionLabel: branch.isActive ? 'শাখাটি নিষ্ক্রিয় করুন' : 'শাখাটি পুনরায় সক্রিয় করুন',
        actionType: 'toggle_status'
      });
    } else {
      // Zero transactions: Confirm status toggle or safe deletion
      setRuleModalInfo({
        branch,
        title: branch.isActive ? 'শাখা নিষ্ক্রিয়করণ' : 'শাখা সক্রিয়করণ',
        message: `আপনি কি "${branch.name}" (${branch.code}) এর স্ট্যাটাস পরিবর্তন করতে চান?`,
        actionLabel: branch.isActive ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন',
        actionType: 'toggle_status'
      });
    }
  };

  const handleConfirmRuleModalAction = () => {
    if (!ruleModalInfo || !ruleModalInfo.branch) return;
    const branch = ruleModalInfo.branch;
    if (toggleBranchStatus) {
      toggleBranchStatus(branch.id);
    }
    setRuleModalInfo(null);
  };

  // Permission Matrix Toggle
  const handleTogglePerm = (roleKey, branchId) => {
    setRolePermissions(prev => {
      const currentRole = prev[roleKey];
      const hasBranch = currentRole.allowedBranches.includes(branchId);
      const updatedAllowed = hasBranch
        ? currentRole.allowedBranches.filter(id => id !== branchId)
        : [...currentRole.allowedBranches, branchId];

      const updated = {
        ...prev,
        [roleKey]: {
          ...currentRole,
          allowedBranches: updatedAllowed
        }
      };
      localStorage.setItem('hisabkitab_hc_role_branch_perms', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSavePermissions = () => {
    localStorage.setItem('hisabkitab_hc_role_branch_perms', JSON.stringify(rolePermissions));
    setPermSaveNotice(true);
    setTimeout(() => setPermSaveNotice(false), 3000);
  };

  // Filter branches
  const filteredBranches = branches.filter(b => {
    if (b.isAll) return false; // Show in summary, but list specific branches
    if (branchFilter === 'active' && !b.isActive) return false;
    if (branchFilter === 'inactive' && b.isActive) return false;
    if (branchSearch) {
      const q = branchSearch.toLowerCase();
      const matchName = b.name?.toLowerCase().includes(q);
      const matchCode = b.code?.toLowerCase().includes(q);
      const matchManager = b.manager?.toLowerCase().includes(q);
      return matchName || matchCode || matchManager;
    }
    return true;
  });

  const totalBranchesCount = branches.filter(b => !b.isAll).length;
  const activeBranchesCount = branches.filter(b => !b.isAll && b.isActive).length;
  const inactiveBranchesCount = branches.filter(b => !b.isAll && !b.isActive).length;
  const totalTxCount = branches.filter(b => !b.isAll).reduce((acc, curr) => acc + (curr.transactionCount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      {/* HERO BANNER */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white shadow-xl relative overflow-hidden border border-teal-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30">
                <Building2 size={13} />
                <span>মডিউল ১৭: প্রতিষ্ঠান ও শাখা সেটআপ</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
                <ShieldCheck size={13} />
                <span>মাল্টি-টেন্যান্ট ও ইউনিক শাখা কোড এনফোর্সমেন্ট</span>
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">প্রতিষ্ঠান ও শাখা সেটআপ (Setup & Branches)</h2>
            <p className="text-sm text-teal-100/80 mt-1 max-w-2xl">
              প্রতিষ্ঠানের ১২টি কোর প্রোফাইল ফিল্ড, স্বতন্ত্র শাখা কোড, লেনদেন থাকলে নিষ্ক্রিয়করণ নীতি ও শাখা-অনুমতি ম্যাট্রিক্স নিয়ন্ত্রণ করুন।
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleOpenAddBranch}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-xs font-black shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
            >
              <Plus size={16} />
              <span>[নতুন শাখা]</span>
            </button>
          </div>
        </div>
      </div>

      {/* TOP NAVIGATION SUBTABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('institution')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap ${
            activeSubTab === 'institution'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Building size={15} />
          <span>🏛️ প্রতিষ্ঠানের তথ্য (১২টি ফিল্ড)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('branches')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap ${
            activeSubTab === 'branches'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Building2 size={15} />
          <span>🏢 শাখার তথ্য ও তালিকা ({totalBranchesCount} টি শাখা)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('permissions')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap ${
            activeSubTab === 'permissions'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Key size={15} />
          <span>🔐 [শাখা-অনুমতি নির্ধারণ]</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('rules')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap ${
            activeSubTab === 'rules'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Shield size={15} />
          <span>📋 নিয়ম ও অডিট গাইডলাইন (৪টি নিয়ম)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: প্রতিষ্ঠানের তথ্য (12 Requested Fields) */}
      {/* ========================================================================= */}
      {activeSubTab === 'institution' && (
        <form onSubmit={handleSaveInstitution} className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Building className="text-teal-600" size={18} />
                  <span>প্রতিষ্ঠানের মৌলিক তথ্য (Organization Profile)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  নিচের ১২টি ফিল্ড প্রতিষ্ঠানের সেন্ট্রাল ইনভয়েস, প্রেসক্রিপশন ও হেডারে স্বয়ংক্রিয়ভাবে ব্যবহৃত হবে।
                </p>
              </div>

              {/* সক্রিয় / নিষ্ক্রিয় সুইচ (Field 12) */}
              <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                <span className="text-xs font-black text-slate-700">প্রতিষ্ঠানের অবস্থা:</span>
                <button
                  type="button"
                  onClick={() => setInstForm({ ...instForm, isActive: !instForm.isActive })}
                  className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 transition-all ${
                    instForm.isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-rose-600 text-white shadow-sm'
                  }`}
                >
                  <Power size={13} />
                  <span>{instForm.isActive ? '✓ সক্রিয় (Active)' : '✕ নিষ্ক্রিয় (Inactive)'}</span>
                </button>
              </div>
            </div>

            {/* Form Grid with exactly the 12 fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
              {/* ১. প্রতিষ্ঠানের নাম */}
              <div className="md:col-span-2">
                <label className="font-extrabold text-slate-800 block mb-1.5 flex items-center gap-1">
                  <FileText size={14} className="text-teal-600" />
                  <span>১. প্রতিষ্ঠানের নাম *</span>
                </label>
                <input
                  type="text"
                  required
                  value={instForm.name}
                  onChange={e => setInstForm({ ...instForm, name: e.target.value })}
                  placeholder="যেমন: হেলথকেয়ার 360° হাসপাতাল ও ডায়াগনস্টিক কমপ্লেক্স"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-teal-500 text-sm font-semibold"
                />
              </div>

              {/* ২. লোগো */}
              <div>
                <label className="font-extrabold text-slate-800 block mb-1.5 flex items-center gap-1">
                  <ImageIcon size={14} className="text-teal-600" />
                  <span>২. লোগো (Logo URL / Image)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={instForm.logo}
                    onChange={e => setInstForm({ ...instForm, logo: e.target.value })}
                    placeholder="https://... অথবা স্যাম্পল বেছে নিন"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setInstForm({ ...instForm, logo: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=100' })}
                    className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold border border-slate-300"
                  >
                    স্যাম্পল
                  </button>
                </div>
                {instForm.logo && (
                  <div className="mt-2 flex items-center gap-2 p-1.5 rounded-lg bg-slate-50 border border-slate-200">
                    <img src={instForm.logo} alt="Logo Preview" className="w-8 h-8 rounded object-cover" />
                    <span className="text-[10px] text-slate-600 truncate">{instForm.logo}</span>
                    <button
                      type="button"
                      onClick={() => setInstForm({ ...instForm, logo: '' })}
                      className="ml-auto text-rose-500 hover:text-rose-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* ৩. প্রতিষ্ঠানের ধরন */}
              <div>
                <label className="font-extrabold text-slate-800 block mb-1.5 flex items-center gap-1">
                  <Layers size={14} className="text-teal-600" />
                  <span>৩. প্রতিষ্ঠানের ধরন *</span>
                </label>
                <select
                  value={instForm.type}
                  onChange={e => setInstForm({ ...instForm, type: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-teal-500 text-xs font-bold bg-white"
                >
                  {institutionTypesList.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* ৪. প্রধান যোগাযোগ নম্বর */}
              <div>
                <label className="font-extrabold text-slate-800 block mb-1.5 flex items-center gap-1">
                  <Phone size={14} className="text-teal-600" />
                  <span>৪. প্রধান যোগাযোগ নম্বর *</span>
                </label>
                <input
                  type="text"
                  required
                  value={instForm.phone}
                  onChange={e => setInstForm({ ...instForm, phone: e.target.value })}
                  placeholder="+৮৮০ ১৭০০-১২৩৪৫৬"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-teal-500 text-xs font-semibold"
                />
              </div>

              {/* ৫. ইমেইল */}
              <div>
                <label className="font-extrabold text-slate-800 block mb-1.5 flex items-center gap-1">
                  <Mail size={14} className="text-teal-600" />
                  <span>৫. অফিশিয়াল ইমেইল *</span>
                </label>
                <input
                  type="email"
                  required
                  value={instForm.email}
                  onChange={e => setInstForm({ ...instForm, email: e.target.value })}
                  placeholder="contact@healthcare360.com.bd"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-teal-500 text-xs font-semibold"
                />
              </div>

              {/* ৬. ঠিকানা */}
              <div className="md:col-span-2">
                <label className="font-extrabold text-slate-800 block mb-1.5 flex items-center gap-1">
                  <MapPin size={14} className="text-teal-600" />
                  <span>৬. প্রধান ঠিকানা *</span>
                </label>
                <input
                  type="text"
                  required
                  value={instForm.address}
                  onChange={e => setInstForm({ ...instForm, address: e.target.value })}
                  placeholder="বাড়ি ১২, রোড ৫, ধানমন্ডি, ঢাকা ১২০৫"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-teal-500 text-xs font-semibold"
                />
              </div>

              {/* ৭. দেশ */}
              <div>
                <label className="font-extrabold text-slate-800 block mb-1.5 flex items-center gap-1">
                  <Globe size={14} className="text-teal-600" />
                  <span>৭. দেশ *</span>
                </label>
                <input
                  type="text"
                  required
                  value={instForm.country}
                  onChange={e => setInstForm({ ...instForm, country: e.target.value })}
                  placeholder="বাংলাদেশ"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-teal-500 text-xs font-semibold"
                />
              </div>

              {/* ৮. সময় অঞ্চল */}
              <div>
                <label className="font-extrabold text-slate-800 block mb-1.5 flex items-center gap-1">
                  <Clock size={14} className="text-teal-600" />
                  <span>৮. সময় অঞ্চল (Timezone) *</span>
                </label>
                <select
                  value={instForm.timezone}
                  onChange={e => setInstForm({ ...instForm, timezone: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-teal-500 text-xs font-semibold bg-white"
                >
                  <option value="Asia/Dhaka (GMT+6)">Asia/Dhaka (GMT+6 - বাংলাদেশ)</option>
                  <option value="Asia/Kolkata (GMT+5:30)">Asia/Kolkata (GMT+5:30 - ভারত)</option>
                  <option value="UTC (GMT+0)">UTC (GMT+0)</option>
                </select>
              </div>

              {/* ৯. মুদ্রা */}
              <div>
                <label className="font-extrabold text-slate-800 block mb-1.5 flex items-center gap-1">
                  <DollarSign size={14} className="text-teal-600" />
                  <span>৯. মুদ্রা (Currency) *</span>
                </label>
                <select
                  value={instForm.currency}
                  onChange={e => setInstForm({ ...instForm, currency: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-teal-500 text-xs font-semibold bg-white"
                >
                  <option value="BDT (৳)">BDT (৳ - বাংলাদেশী টাকা)</option>
                  <option value="USD ($)">USD ($ - US Dollar)</option>
                  <option value="INR (₹)">INR (₹ - ভারতীয় রুপি)</option>
                  <option value="EUR (€)">EUR (€ - Euro)</option>
                </select>
              </div>

              {/* ১০. ডিফল্ট ভাষা */}
              <div>
                <label className="font-extrabold text-slate-800 block mb-1.5 flex items-center gap-1">
                  <Languages size={14} className="text-teal-600" />
                  <span>১০. ডিফল্ট ভাষা *</span>
                </label>
                <select
                  value={instForm.defaultLanguage}
                  onChange={e => setInstForm({ ...instForm, defaultLanguage: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-teal-500 text-xs font-semibold bg-white"
                >
                  <option value="বাংলা (Bengali)">বাংলা (Bengali)</option>
                  <option value="English">English</option>
                  <option value="দ্বিভাষিক (বাংলা + English)">দ্বিভাষিক (বাংলা + English)</option>
                </select>
              </div>

              {/* ১১. ইনভয়েস/রসিদের ফুটার */}
              <div className="md:col-span-3">
                <label className="font-extrabold text-slate-800 block mb-1.5 flex items-center gap-1">
                  <FileText size={14} className="text-teal-600" />
                  <span>১১. ইনভয়েস / রসিদের ফুটার টেক্সট (Invoice & Receipt Footer Note)</span>
                </label>
                <textarea
                  rows={2}
                  value={instForm.receiptFooter}
                  onChange={e => setInstForm({ ...instForm, receiptFooter: e.target.value })}
                  placeholder="রসিদ বা রিপোর্টের পাদদেশে প্রিন্ট হওয়ার টেক্সট লিখুন..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-teal-500 text-xs"
                />
              </div>
            </div>

            {/* Save Button Row */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                {institutionSaveNotice ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    <CheckCircle2 size={15} />
                    <span>✓ প্রতিষ্ঠানের ১২টি তথ্য সফলভাবে সংরক্ষিত হয়েছে!</span>
                  </span>
                ) : (
                  <span>* পরিবর্তনের পর নিচে [সংরক্ষণ] বোতাম চেপে তথ্য স্থায়ী করুন।</span>
                )}
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-sm shadow-md flex items-center gap-2 transition-transform hover:scale-105"
              >
                <Save size={16} />
                <span>[সংরক্ষণ] (Save Institution Info)</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: শাখার তথ্য (Branch Information & Management) */}
      {/* ========================================================================= */}
      {activeSubTab === 'branches' && (
        <div className="space-y-6">
          {/* Branch Statistics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-slate-500">মোট শাখা</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalBranchesCount} টি</div>
              <div className="text-[11px] text-teal-600 mt-1">সব কোড ইউনিক</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-emerald-600">সক্রিয় শাখা</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{activeBranchesCount} টি</div>
              <div className="text-[11px] text-slate-500 mt-1">নতুন লেনদেন চালু</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-rose-600">নিষ্ক্রিয় শাখা</div>
              <div className="text-2xl font-black text-rose-600 mt-1">{inactiveBranchesCount} টি</div>
              <div className="text-[11px] text-slate-500 mt-1">রেকর্ড দেখা যাবে, নতুন লেনদেন বন্ধ</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-purple-600">শাখাভিত্তিক মোট লেনদেন</div>
              <div className="text-2xl font-black text-purple-600 mt-1">{totalTxCount} টি</div>
              <div className="text-[11px] text-slate-500 mt-1">নিয়ম ২: লেনদেন থাকলে ডিলিট নিষিদ্ধ</div>
            </div>
          </div>

          {/* Branch Search, Filter & [নতুন শাখা] Button */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full md:w-auto flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                <input
                  type="text"
                  value={branchSearch}
                  onChange={e => setBranchSearch(e.target.value)}
                  placeholder="শাখার নাম, ইউনিক কোড (যেমন UTT-02) বা ম্যানেজার খুঁজুন..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500 text-xs font-medium"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setBranchFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    branchFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  সব ({totalBranchesCount})
                </button>
                <button
                  type="button"
                  onClick={() => setBranchFilter('active')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    branchFilter === 'active' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  সক্রিয় ({activeBranchesCount})
                </button>
                <button
                  type="button"
                  onClick={() => setBranchFilter('inactive')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    branchFilter === 'inactive' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-600 hover:text-rose-700'
                  }`}
                >
                  নিষ্ক্রিয় ({inactiveBranchesCount})
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenAddBranch}
              className="w-full md:w-auto px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black shadow-md flex items-center justify-center gap-2"
            >
              <Plus size={15} />
              <span>[নতুন শাখা] (Add New Branch)</span>
            </button>
          </div>

          {/* Branches Cards / Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBranches.map(branch => {
              const hasTransactions = (branch.transactionCount || 0) > 0;
              return (
                <div
                  key={branch.id}
                  className={`p-5 rounded-3xl border shadow-sm transition-all flex flex-col justify-between relative ${
                    branch.isActive
                      ? 'bg-white border-slate-200 hover:border-teal-400'
                      : 'bg-slate-50/80 border-rose-200'
                  }`}
                >
                  <div>
                    {/* Top Header of Card */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-slate-900">{branch.name}</h4>
                          {branch.isMain && (
                            <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-extrabold">
                              ★ প্রধান শাখা
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono text-[11px] font-black">
                            কোড: {branch.code}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              branch.isActive
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {branch.isActive ? '● সক্রিয়' : '✕ নিষ্ক্রিয় (নতুন লেনদেন বন্ধ)'}
                          </span>
                        </div>
                      </div>

                      {/* Transaction Count Badge */}
                      <div className="text-right">
                        <span className="inline-block px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
                          {branch.transactionCount || 0} টি লেনদেন
                        </span>
                      </div>
                    </div>

                    {/* Branch 12 Fields Display */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 py-3 border-y border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">ম্যানেজার</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <User size={12} className="text-teal-600" />
                          {branch.manager || 'নির্ধারিত হয়নি'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">যোগাযোগ</span>
                        <span className="font-semibold text-slate-700 flex items-center gap-1 truncate">
                          <Phone size={12} className="text-teal-600" />
                          {branch.phone || 'তথ্য নেই'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">সময়সূচি</span>
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <Clock size={12} className="text-teal-600" />
                          {branch.openTime || '08:00 AM'} - {branch.closeTime || '10:00 PM'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">সাপ্তাহিক ছুটি</span>
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <Calendar size={12} className="text-teal-600" />
                          {branch.holiday || 'শুক্রবার'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">স্টক লোকেশন</span>
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <Layers size={12} className="text-teal-600" />
                          {branch.stockLocation || 'Rack-Main'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">ইমেইল</span>
                        <span className="font-semibold text-slate-700 flex items-center gap-1 truncate">
                          <Mail size={12} className="text-teal-600" />
                          {branch.email || 'N/A'}
                        </span>
                      </div>

                      <div className="sm:col-span-2">
                        <span className="text-slate-400 block text-[10px] font-bold">ঠিকানা</span>
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <MapPin size={12} className="text-teal-600" />
                          {branch.address || 'তথ্য নেই'}
                        </span>
                      </div>

                      <div className="sm:col-span-2">
                        <span className="text-slate-400 block text-[10px] font-bold">রসিদে দেখানোর নাম/ঠিকানা</span>
                        <span className="font-bold text-teal-800 text-[11px] bg-teal-50/60 px-2 py-1 rounded-lg block">
                          {branch.receiptTitle || branch.name}
                        </span>
                      </div>
                    </div>

                    {/* Inactive Branch Rule 3 Banner */}
                    {!branch.isActive && (
                      <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-[11px] flex items-start gap-2">
                        <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>নিয়ম ৩ কার্যকর:</strong> এই শাখাটি নিষ্ক্রিয়। পুরনো হিসাব ও রোগীর অতীত রেকর্ড দেখা যাবে; তবে নতুন কোনো বিল, অর্ডার বা স্টক লেনদেন সম্পন্ন করা যাবে না।
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ACTION BUTTONS (Requested Buttons) */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      {/* [সম্পাদনা] বাটন */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditBranch(branch)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Edit3 size={13} />
                        <span>[সম্পাদনা]</span>
                      </button>

                      {/* [নিষ্ক্রিয় করুন] / [সক্রিয় করুন] বাটন (Rule 2 enforced) */}
                      <button
                        type="button"
                        onClick={() => handleAttemptDeleteOrDeactivate(branch)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors ${
                          branch.isActive
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        <Power size={13} />
                        <span>{branch.isActive ? '[নিষ্ক্রিয় করুন]' : '[সক্রিয় করুন]'}</span>
                      </button>
                    </div>

                    {/* [শাখা-অনুমতি নির্ধারণ] বাটন */}
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('permissions')}
                      className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold flex items-center gap-1 border border-purple-200"
                    >
                      <Key size={13} />
                      <span>[শাখা-অনুমতি নির্ধারণ]</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: [শাখা-অনুমতি নির্ধারণ] (Branch Permission Matrix) */}
      {/* ========================================================================= */}
      {activeSubTab === 'permissions' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Key className="text-teal-600" size={18} />
                <span>শাখা-অনুমতি নির্ধারণ (Role-based Branch Permissions)</span>
              </h3>
              <p className="text-xs text-slate-500">
                মালিক ও প্রতিষ্ঠান অ্যাডমিন সকল শাখায় পূর্ণ অ্যাক্সেস পাবেন। শাখা ম্যানেজার, ডাক্তার, রিসেপশন ও ফার্মাসিস্টের অনুমতি নির্দিষ্ট করুন।
              </p>
            </div>

            <button
              type="button"
              onClick={handleSavePermissions}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md flex items-center gap-2"
            >
              <Save size={15} />
              <span>অনুমতি সংরক্ষণ করুন</span>
            </button>
          </div>

          {permSaveNotice && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>✓ সকল শাখার অনুমতি সেটিংস সফলভাবে আপডেট ও এনফোর্স করা হয়েছে!</span>
            </div>
          )}

          {/* Matrix Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-black text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">কর্মকর্তা / রোল (Staff Role)</th>
                  <th className="p-3.5 text-center">সব শাখা অনুমতি</th>
                  {branches.filter(b => !b.isAll).map(b => (
                    <th key={b.id} className="p-3.5 text-center">
                      <div>{b.name}</div>
                      <div className="text-[10px] text-teal-300 font-mono font-normal">({b.code})</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {Object.entries(rolePermissions).map(([roleKey, roleData]) => {
                  return (
                    <tr key={roleKey} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold text-slate-800">
                        <div className="text-xs font-extrabold">{roleData.label}</div>
                        <div className="text-[10px] text-slate-400 font-normal">role: {roleKey}</div>
                      </td>

                      <td className="p-3.5 text-center">
                        {roleData.allBranches ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            <Check size={12} />
                            <span>পূর্ণ অনুমতি</span>
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold text-[10px]">
                            সীমিত
                          </span>
                        )}
                      </td>

                      {branches.filter(b => !b.isAll).map(b => {
                        const isChecked = roleData.allBranches || roleData.allowedBranches.includes(b.id);
                        return (
                          <td key={b.id} className="p-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={roleData.allBranches}
                              onChange={() => handleTogglePerm(roleKey, b.id)}
                              className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer disabled:opacity-50"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: নিয়মাবলী ও অডিট গাইডলাইন (Rules & Compliance Audit) */}
      {/* ========================================================================= */}
      {activeSubTab === 'rules' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Shield className="text-teal-600" size={18} />
              <span>প্রতিষ্ঠান ও শাখা পরিচালনার ৪টি মৌলিক নিয়মাবলী</span>
            </h3>
            <p className="text-xs text-slate-500">
              সিস্টেমে ডেটা ইন্টিগ্রিটি ও আইনি অডিট বজায় রাখতে নিচের নিয়মগুলো সিস্টেম দ্বারা স্বয়ংক্রিয়ভাবে বলবৎ থাকে।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Rule 1 */}
            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 space-y-2">
              <div className="flex items-center gap-2 font-black text-teal-900">
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs">১</span>
                <span>ইউনিক শাখা কোড নিয়ম</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-semibold">
                শাখা কোড একই প্রতিষ্ঠানের মধ্যে বাধ্যতামূলকভাবে ইউনিক হবে।
              </p>
              <div className="text-[11px] text-teal-800 bg-white/70 p-2 rounded-xl border border-teal-200">
                ✓ কোনো দুটি শাখার কোড এক হতে পারবে না (যেমন: DHD-01, UTT-02)। সেভ করার সময় সিস্টেম স্বয়ংক্রিয়ভাবে যাচাই করে।
              </div>
            </div>

            {/* Rule 2 */}
            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-2">
              <div className="flex items-center gap-2 font-black text-purple-900">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">২</span>
                <span>লেনদেন থাকলে ডিলিট নিষিদ্ধ নিয়ম</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-semibold">
                শাখায় লেনদেন থাকলে শাখা স্থায়ীভাবে ডিলিট না করে নিষ্ক্রিয় করতে হবে।
              </p>
              <div className="text-[11px] text-purple-800 bg-white/70 p-2 rounded-xl border border-purple-200">
                ✓ ১টি লেনদেন হলেও স্থায়ী ডিলিট বোতাম ব্লক থাকবে এবং শুধুমাত্র [নিষ্ক্রিয়করণ] কার্যকর হবে।
              </div>
            </div>

            {/* Rule 3 */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-black text-amber-900">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">৩</span>
                <span>নিষ্ক্রিয় শাখার ডেটা নিরাপত্তা ও লেনদেন ব্লক</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-semibold">
                নিষ্ক্রিয় শাখার পুরোনো হিসাব ও রোগীর রেকর্ড দেখা যাবে; নতুন লেনদেন বন্ধ থাকবে।
              </p>
              <div className="text-[11px] text-amber-800 bg-white/70 p-2 rounded-xl border border-amber-200">
                ✓ অডিটর ও পরিচালকরা অতীত ইতিহাস দেখতে পারবেন, কিন্তু নতুন প্রেসক্রিপশন, বিল বা টেস্ট অর্ডার তৈরি বন্ধ থাকবে।
              </div>
            </div>

            {/* Rule 4 */}
            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-2">
              <div className="flex items-center gap-2 font-black text-rose-900">
                <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs">৪</span>
                <span>শাখার ID বাধ্যতামূলক নিয়ম</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-semibold">
                নতুন বিল / অর্ডার / স্টক লেনদেনে শাখার ID বাধ্যতামূলক।
              </p>
              <div className="text-[11px] text-rose-800 bg-white/70 p-2 rounded-xl border border-rose-200">
                ✓ কোনো বিল বা চালান শাখাবিহীন রাখা যাবে না; প্রতিটি লেনদেন বাধ্যতামূলকভাবে একটি নির্দিষ্ট শাখা আইডি ধারণ করবে।
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: শাখা তৈরি বা সম্পাদনা (Add / Edit Branch Modal) */}
      {/* ========================================================================= */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Building2 size={18} className="text-teal-600" />
                  <span>{editingBranchId ? 'শাখা সম্পাদনা করুন (Edit Branch)' : '[নতুন শাখা] তৈরি করুন (Create New Branch)'}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  শাখার ১২টি তথ্য পূরণ করুন। মনে রাখবেন, শাখা কোড ইউনিক হতে হবে।
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBranchModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {branchModalError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2">
                <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <span>{branchModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveBranchForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ১. শাখার নাম */}
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">১. শাখার নাম *</label>
                  <input
                    type="text"
                    required
                    value={branchFormData.name}
                    onChange={e => setBranchFormData({ ...branchFormData, name: e.target.value })}
                    placeholder="যেমন: উত্তরা শাখা"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500 font-semibold"
                  />
                </div>

                {/* ২. শাখা কোড (ইউনিক) */}
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">
                    ২. শাখা কোড * (ইউনিক হতে হবে)
                  </label>
                  <input
                    type="text"
                    required
                    value={branchFormData.code}
                    onChange={e => setBranchFormData({ ...branchFormData, code: e.target.value })}
                    placeholder="যেমন: UTT-02"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500 font-mono font-bold uppercase"
                  />
                </div>

                {/* ৩. ফোন নম্বর */}
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">৩. ফোন নম্বর *</label>
                  <input
                    type="text"
                    required
                    value={branchFormData.phone}
                    onChange={e => setBranchFormData({ ...branchFormData, phone: e.target.value })}
                    placeholder="০১৭৭০০০০০২০"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500"
                  />
                </div>

                {/* ৪. ইমেইল */}
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">৪. ইমেইল</label>
                  <input
                    type="email"
                    value={branchFormData.email}
                    onChange={e => setBranchFormData({ ...branchFormData, email: e.target.value })}
                    placeholder="uttara@healthcare360.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500"
                  />
                </div>

                {/* ৫. ঠিকানা */}
                <div className="sm:col-span-2">
                  <label className="font-extrabold text-slate-800 block mb-1">৫. ঠিকানা *</label>
                  <input
                    type="text"
                    required
                    value={branchFormData.address}
                    onChange={e => setBranchFormData({ ...branchFormData, address: e.target.value })}
                    placeholder="সেক্টর ৩, উত্তরা, ঢাকা"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500"
                  />
                </div>

                {/* ৬. শাখা ম্যানেজার */}
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">৬. শাখা ম্যানেজার *</label>
                  <input
                    type="text"
                    required
                    value={branchFormData.manager}
                    onChange={e => setBranchFormData({ ...branchFormData, manager: e.target.value })}
                    placeholder="যেমন: মাহমুদুল হাসান"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500 font-semibold"
                  />
                </div>

                {/* ৭. খোলার সময় */}
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">৭. খোলার সময়</label>
                  <input
                    type="text"
                    value={branchFormData.openTime}
                    onChange={e => setBranchFormData({ ...branchFormData, openTime: e.target.value })}
                    placeholder="08:00 AM"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500"
                  />
                </div>

                {/* ৮. বন্ধের সময় */}
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">৮. বন্ধের সময়</label>
                  <input
                    type="text"
                    value={branchFormData.closeTime}
                    onChange={e => setBranchFormData({ ...branchFormData, closeTime: e.target.value })}
                    placeholder="10:00 PM"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500"
                  />
                </div>

                {/* ৯. সাপ্তাহিক ছুটির দিন */}
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">৯. সাপ্তাহিক ছুটির দিন</label>
                  <select
                    value={branchFormData.holiday}
                    onChange={e => setBranchFormData({ ...branchFormData, holiday: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500 bg-white"
                  >
                    <option value="শুক্রবার">শুক্রবার</option>
                    <option value="শনিবার">শনিবার</option>
                    <option value="রবিবার">রবিবার</option>
                    <option value="কোনো ছুটি নেই (২৪/৭ খোলা)">কোনো ছুটি নেই (২৪/৭ খোলা)</option>
                  </select>
                </div>

                {/* ১০. স্টক লোকেশন */}
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">১০. স্টক লোকেশন</label>
                  <input
                    type="text"
                    value={branchFormData.stockLocation}
                    onChange={e => setBranchFormData({ ...branchFormData, stockLocation: e.target.value })}
                    placeholder="যেমন: Uttara-Rack-01"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500"
                  />
                </div>

                {/* ১১. রসিদে দেখানোর নাম/ঠিকানা */}
                <div className="sm:col-span-2">
                  <label className="font-extrabold text-slate-800 block mb-1">
                    ১১. রসিদে দেখানোর নাম / ঠিকানা
                  </label>
                  <input
                    type="text"
                    value={branchFormData.receiptTitle}
                    onChange={e => setBranchFormData({ ...branchFormData, receiptTitle: e.target.value })}
                    placeholder="হেলথকেয়ার 360° - উত্তরা শাখা"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500"
                  />
                </div>

                {/* ১২. সক্রিয় / নিষ্ক্রিয় */}
                <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="font-bold text-slate-800">১২. সক্রিয় / নিষ্ক্রিয় স্ট্যাটাস</div>
                    <div className="text-[11px] text-slate-500">নিষ্ক্রিয় করলে নতুন লেনদেন বন্ধ হবে, কিন্তু রেকর্ড দৃশ্যমান থাকবে</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBranchFormData({ ...branchFormData, isActive: !branchFormData.isActive })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                      branchFormData.isActive ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                    }`}
                  >
                    {branchFormData.isActive ? '✓ সক্রিয়' : '✕ নিষ্ক্রিয়'}
                  </button>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black shadow-md flex items-center gap-1.5"
                >
                  <Save size={15} />
                  <span>[সংরক্ষণ]</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: নিয়ম ২ ডিলিট নিষিদ্ধ ও নিষ্ক্রিয়করণ ডায়ালগ */}
      {/* ========================================================================= */}
      {ruleModalInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2 rounded-2xl bg-amber-100">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-base font-black text-slate-900">{ruleModalInfo.title}</h3>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {ruleModalInfo.message}
            </p>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <div><strong>শাখা:</strong> {ruleModalInfo.branch.name} ({ruleModalInfo.branch.code})</div>
              <div><strong>বর্তমান অবস্থা:</strong> {ruleModalInfo.branch.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</div>
              <div><strong>সম্পন্ন লেনদেন:</strong> {ruleModalInfo.branch.transactionCount || 0} টি</div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRuleModalInfo(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmRuleModalAction}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md"
              >
                {ruleModalInfo.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthcareSettingsManager;
