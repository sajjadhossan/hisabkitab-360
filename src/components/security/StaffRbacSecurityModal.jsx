import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  ShieldAlert,
  Users,
  Smartphone,
  Lock,
  Unlock,
  Key,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Power,
  Sliders,
  Check,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { playButtonClick, playSuccessChime } from '../../services/soundFeedback';
import { logAuditEvent, AUDIT_ACTIONS } from '../../services/auditService';
import { getInactivityTimeoutMs, setInactivityTimeoutMs } from '../../services/inactivityWatchdogService';

/**
 * HisabKitab 360 - Staff RBAC, Device Whitelisting & Emergency Lockdown Hub (Phase 6, Features 51, 57, 59, 60)
 */
export const StaffRbacSecurityModal = ({ isOpen, onClose, lang = 'bn' }) => {
  const {
    businessSettings = {},
    updateBusinessSettings = () => {},
    showToast = () => {},
    lockScreen = () => {}
  } = useApp() || {};

  const { user } = useAuth() || {};

  const [activeTab, setActiveTab] = useState('rbac_roles'); // 'rbac_roles' | 'device_binding' | 'lockdown_settings'
  const [selectedRole, setSelectedRole] = useState('cashier');

  // RBAC Permission Matrix State
  const [rolePermissions, setRolePermissions] = useState(() => {
    try {
      const saved = localStorage.getItem('hk360_security_rbac_matrix');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      manager: {
        hideCostPrice: false,
        preventInvoiceDelete: false,
        maxDiscountPercent: 20,
        preventStockOverwrite: false,
        blockProfitReports: false,
        preventManualDrawerOpen: false
      },
      cashier: {
        hideCostPrice: true,
        preventInvoiceDelete: true,
        maxDiscountPercent: 10,
        preventStockOverwrite: true,
        blockProfitReports: true,
        preventManualDrawerOpen: true
      },
      salesman: {
        hideCostPrice: true,
        preventInvoiceDelete: true,
        maxDiscountPercent: 5,
        preventStockOverwrite: true,
        blockProfitReports: true,
        preventManualDrawerOpen: true
      },
      godown_keeper: {
        hideCostPrice: false,
        preventInvoiceDelete: true,
        maxDiscountPercent: 0,
        preventStockOverwrite: false,
        blockProfitReports: true,
        preventManualDrawerOpen: true
      },
      auditor: {
        hideCostPrice: false,
        preventInvoiceDelete: true,
        maxDiscountPercent: 0,
        preventStockOverwrite: true,
        blockProfitReports: false,
        preventManualDrawerOpen: true
      }
    };
  });

  // Device Whitelist
  const [authorizedDevices, setAuthorizedDevices] = useState(() => {
    try {
      const saved = localStorage.getItem('hk360_authorized_devices');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 'DEV-POS-01', name: 'দোকানের মূল পিওএস পিসি (Counter 1)', type: 'desktop', status: 'authorized', addedAt: '2026-09-01' },
      { id: 'DEV-TAB-02', name: 'ক্যাশিয়ার স্যামসাং ট্যাব (Samsung A9)', type: 'tablet', status: 'authorized', addedAt: '2026-09-15' }
    ];
  });

  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceId, setNewDeviceId] = useState('');

  // Inactivity timeout setting
  const [inactivityMinutes, setInactivityMinutes] = useState(() => {
    const ms = getInactivityTimeoutMs();
    return Math.round(ms / 60000);
  });

  // Watermark toggle
  const [enableWatermark, setEnableWatermark] = useState(() => {
    try {
      return localStorage.getItem('hk360_security_anti_leak_watermark') === 'true';
    } catch {
      return false;
    }
  });

  const handleTogglePermission = (role, permKey) => {
    playButtonClick?.();
    setRolePermissions((prev) => {
      const updated = {
        ...prev,
        [role]: {
          ...prev[role],
          [permKey]: !prev[role][permKey]
        }
      };
      try {
        localStorage.setItem('hk360_security_rbac_matrix', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast?.('পারমিশন রুলস আপডেট হয়েছে', 'success');
  };

  const handleUpdateDiscountLimit = (role, val) => {
    const num = Math.max(0, Math.min(100, parseInt(val, 10) || 0));
    setRolePermissions((prev) => {
      const updated = {
        ...prev,
        [role]: {
          ...prev[role],
          maxDiscountPercent: num
        }
      };
      try {
        localStorage.setItem('hk360_security_rbac_matrix', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleAddDevice = (e) => {
    e.preventDefault();
    if (!newDeviceName.trim()) return;
    const item = {
      id: newDeviceId.trim() || `DEV-${Date.now().toString(36).toUpperCase()}`,
      name: newDeviceName.trim(),
      type: 'mobile',
      status: 'authorized',
      addedAt: new Date().toISOString().split('T')[0]
    };
    const updated = [...authorizedDevices, item];
    setAuthorizedDevices(updated);
    try {
      localStorage.setItem('hk360_authorized_devices', JSON.stringify(updated));
    } catch {}
    setNewDeviceName('');
    setNewDeviceId('');
    playSuccessChime?.();
    showToast?.('নতুন ডিভাইস অনুমোদিত তালিকায় যুক্ত হয়েছে', 'success');
  };

  const handleRemoveDevice = (id) => {
    const updated = authorizedDevices.filter((d) => d.id !== id);
    setAuthorizedDevices(updated);
    try {
      localStorage.setItem('hk360_authorized_devices', JSON.stringify(updated));
    } catch {}
    showToast?.('ডিভাইসের অনুমোদন প্রত্যাহার করা হয়েছে', 'info');
  };

  const handleEmergencyLockdown = () => {
    const confirmed = window.confirm(
      'সতর্কতা: জরুরি লকডাউন সক্রিয় করলে সমস্ত কর্মচারীর সেশন তাৎক্ষণিক বাতিল হয়ে যাবে এবং অ্যাপটি পাসওয়ার্ড ছাড়া খোলা যাবে না। আপনি কি নিশ্চিত?'
    );
    if (!confirmed) return;

    // Invalidate sessions in storage
    try {
      localStorage.setItem('hk360_emergency_lockdown_active', 'true');
      localStorage.setItem('hk360_session_token_epoch', String(Date.now()));
    } catch {}

    logAuditEvent?.('EMERGENCY_PANIC_LOCKDOWN', {
      triggeredBy: user?.email || 'Admin',
      timestamp: new Date().toISOString()
    });

    playSuccessChime?.();
    showToast?.('জরুরি লকডাউন সক্রিয় করা হয়েছে! স্ক্রিন লক হচ্ছে...', 'error');
    setTimeout(() => {
      onClose();
      lockScreen?.();
    }, 1200);
  };

  const handleWatermarkToggle = () => {
    playButtonClick?.();
    const nextVal = !enableWatermark;
    setEnableWatermark(nextVal);
    try {
      localStorage.setItem('hk360_security_anti_leak_watermark', String(nextVal));
      window.dispatchEvent(new Event('hk360_watermark_toggle'));
    } catch {}
    showToast?.(
      nextVal ? 'অ্যান্টি-লিক ওয়াটারমার্ক স্ক্রিনে চালু হয়েছে' : 'ওয়াটারমার্ক বন্ধ করা হয়েছে',
      nextVal ? 'success' : 'info'
    );
  };

  const handleInactivityChange = (mins) => {
    setInactivityMinutes(mins);
    setInactivityTimeoutMs(mins * 60000);
    showToast?.(`ইনঅ্যাক্টিভিটি অটো-লক ${mins > 0 ? mins + ' মিনিটে' : 'বন্ধ'} নির্ধারণ করা হয়েছে`, 'success');
  };

  if (!isOpen) return null;

  const rolesList = [
    { id: 'manager', label: 'ম্যানেজার (Manager)', desc: 'দৈনিক কার্যক্রম ও হিসাব পর্যবেক্ষণ' },
    { id: 'cashier', label: 'ক্যাশিয়ার (Cashier)', desc: 'পিওএস বিলিং ও ক্যাশ ড্রয়ার পরিচালনা' },
    { id: 'salesman', label: 'সেলসম্যান / এসআর (Salesman)', desc: 'অর্ডার সংগ্রহ ও পণ্য ডেলিভারি' },
    { id: 'godown_keeper', label: 'গোডাউন কিপার (Godown)', desc: 'মাল খালাস, স্টক ইন ও ওয়্যারহাউজ' },
    { id: 'auditor', label: 'অডিটর (Auditor)', desc: 'হিসাব নিরীক্ষা ও লেজার ভেরিফিকেশন' }
  ];

  return (
    <div
      className="fixed inset-0 z-[9995] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  সিকিউরিটি, রোলস ও অ্যান্টি-থেফ্ট গার্ড
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-semibold border border-rose-300 dark:border-rose-800">
                  Phase 6 Standard
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                গ্র্যানুলার স্টাফ পারমিশন, ডিভাইস বাইন্ডিং, ওয়াটারমার্ক ও জরুরি সেশন লকডাউন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 bg-slate-100/50 dark:bg-slate-800/40 overflow-x-auto">
          <button
            onClick={() => setActiveTab('rbac_roles')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'rbac_roles'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            রোল ও পারমিশন ম্যাট্রিক্স (RBAC)
          </button>
          <button
            onClick={() => setActiveTab('device_binding')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'device_binding'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            ডিভাইস বাইন্ডিং ও অনুমোদিত তালিকা
          </button>
          <button
            onClick={() => setActiveTab('lockdown_settings')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'lockdown_settings'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            জরুরি লকডাউন ও অ্যান্টি-লিক
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {activeTab === 'rbac_roles' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Role Selection Column */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  পদবি / রোল নির্বাচন করুন
                </h4>
                {rolesList.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      playButtonClick?.();
                      setSelectedRole(r.id);
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                      selectedRole === r.id
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-sm'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{r.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{r.desc}</div>
                    </div>
                    {selectedRole === r.id && <ChevronRight className="w-4 h-4 text-indigo-500 shrink-0" />}
                  </button>
                ))}
              </div>

              {/* Right Permission Toggle Column */}
              <div className="md:col-span-2 space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    রোল: {rolesList.find((r) => r.id === selectedRole)?.label} এর জন্য সিকিউরিটি রুলস
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold">
                    সক্রিয় নীতি
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      key: 'hideCostPrice',
                      title: 'পাইকারি কেনা দাম গোপন রাখা (Hide Purchase Price)',
                      desc: 'পণ্য বিক্রি বা ইনভেন্টরি ব্রাউজ করার সময় কর্মচারীরা কেনা দাম বা মার্জিন দেখতে পারবে না।'
                    },
                    {
                      key: 'preventInvoiceDelete',
                      title: 'বিক্রিত মেমো/বিল মোছা নিষিদ্ধ (Prevent Invoice Delete)',
                      desc: 'একবার বিক্রি সম্পন্ন হলে সুপারভাইজারের মাস্টার পিন ছাড়া বিল ডিলিট বা ক্যানসেল করা যাবে না।'
                    },
                    {
                      key: 'preventManualDrawerOpen',
                      title: 'বিল ছাড়া ক্যাশ ড্রয়ার খোলা নিষিদ্ধ (Prevent No-Sale Drawer Open)',
                      desc: 'বিক্রয় ছাড়া ম্যানুয়ালি ড্রয়ার খুললে তাৎক্ষণিক অডিট অ্যালার্ট ট্রিপ হবে।'
                    },
                    {
                      key: 'preventStockOverwrite',
                      title: 'ইনভেন্টরি স্টক কারেকশন লক (Lock Direct Stock Overwrite)',
                      desc: 'গোডাউন কিপার বা ক্যাশিয়ার সরাসরি পণ্যের স্টক সংখ্যা পরিবর্তন করতে পারবে না।'
                    },
                    {
                      key: 'blockProfitReports',
                      title: 'নিট লাভ ও ব্যবসায়ের আয় গোপন (Block Profit Reports)',
                      desc: 'ব্যবসায়ের প্রকৃত নিট লাভ, খরচ ও আর্থিক রিপোর্ট দেখার অধিকার থাকবে না।'
                    }
                  ].map((rule) => {
                    const isChecked = rolePermissions[selectedRole]?.[rule.key];
                    return (
                      <div
                        key={rule.key}
                        onClick={() => handleTogglePermission(selectedRole, rule.key)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start justify-between gap-3 ${
                          isChecked
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80'
                            : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            {rule.title}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{rule.desc}</p>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition ${
                            isChecked
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-200 dark:bg-slate-700 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    );
                  })}

                  {/* Max Discount Allowed */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        সুপারভাইজার পিন ছাড়া সর্বোচ্চ ছাড়ের সীমা (%)
                      </span>
                      <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                        {rolePermissions[selectedRole]?.maxDiscountPercent || 0}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      এই সীমার চেয়ে বেশি ডিসকাউন্ট দিতে গেলে ম্যানেজারের মাস্টার পিন পপ-আপ হবে।
                    </p>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="5"
                      value={rolePermissions[selectedRole]?.maxDiscountPercent || 0}
                      onChange={(e) => handleUpdateDiscountLimit(selectedRole, e.target.value)}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'device_binding' && (
            <div className="space-y-6">
              <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-800 dark:text-indigo-200 leading-relaxed">
                  <strong>অনুমোদিত ডিভাইস সিকিউরিটি:</strong> বাইরের কোনো কম্পিউটার বা অজ্ঞাত মোবাইল দিয়ে আপনার
                  ব্যবসায়ের সফটওয়্যারে লগইন করা সম্পূর্ণ ব্লক থাকবে। কেবল নিচের অনুমোদিত ডিভাইসগুলো দিয়ে কর্মীরা কাজ করতে
                  পারবে।
                </div>
              </div>

              {/* Add Device Form */}
              <form
                onSubmit={handleAddDevice}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    ডিভাইসের নাম / পরিচিতি:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: সেলসম্যান সুমনের মোবাইল"
                    value={newDeviceName}
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    ম্যাক / ডিভাইস আইডি (ঐচ্ছিক):
                  </label>
                  <input
                    type="text"
                    placeholder="স্বয়ংক্রিয় তৈরি হবে"
                    value={newDeviceId}
                    onChange={(e) => setNewDeviceId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition"
                >
                  ডিভাইস অনুমোদন করুন
                </button>
              </form>

              {/* Device List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  বর্তমান অনুমোদিত ডিভাইসের তালিকা ({authorizedDevices.length})
                </h4>
                {authorizedDevices.map((dev) => (
                  <div
                    key={dev.id}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{dev.name}</div>
                        <div className="text-[10px] text-slate-400">
                          আইডি: {dev.id} • অনুমোদনের তারিখ: {dev.addedAt}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold">
                        অনুমোদিত (Active)
                      </span>
                      <button
                        onClick={() => handleRemoveDevice(dev.id)}
                        className="text-xs text-rose-500 hover:text-rose-700 font-semibold p-1"
                        title="অনুমোদন বাতিল"
                      >
                        রিমুভ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'lockdown_settings' && (
            <div className="space-y-6">
              {/* Emergency Lockdown */}
              <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-300 dark:border-rose-800 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                      প্যানিক বাটন: জরুরি রিমোট সেশন লকডাউন (Emergency Session Revoke)
                    </h4>
                    <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
                      দোকানে চুরি বা কোনো কর্মচারীর অসৎ আচরণের সন্দেহ হলে, অথবা কোনো স্টাফের মোবাইল হারিয়ে গেলে মাত্র ১
                      ক্লিকে সকল ব্রাঞ্চ ও কাউন্টারের লগইন তাৎক্ষণিক বাতিল করে অ্যাপ লক করে দেওয়া যাবে।
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleEmergencyLockdown}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition"
                  >
                    <Power className="w-4 h-4" />
                    জরুরি লকডাউন কার্যকর করুন (Lock All Sessions Now)
                  </button>
                </div>
              </div>

              {/* Inactivity Auto-Lock Settings */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      স্বয়ংক্রিয় সেশন টাইমআউট (Inactivity Auto-Lock)
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      নির্দিষ্ট সময় সফটওয়্যারে কোনো স্পর্শ বা কী-প্রেস না হলে স্বয়ংক্রিয়ভাবে স্ক্রিন লক হয়ে যাবে।
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { label: '২ মিনিট', val: 2 },
                    { label: '৫ মিনিট (স্ট্যান্ডার্ড)', val: 5 },
                    { label: '১০ মিনিট', val: 10 },
                    { label: '৩০ মিনিট', val: 30 },
                    { label: 'বন্ধ রাখুন', val: 0 }
                  ].map((t) => (
                    <button
                      key={t.val}
                      onClick={() => handleInactivityChange(t.val)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        inactivityMinutes === t.val
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Screen Watermark Toggle */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    অ্যান্টি-লিক স্ক্রিন ওয়াটারমার্ক (Watermarked Anti-Leak Screen)
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    স্ক্রিনে মৃদু ওয়াটারমার্কে স্টাফ আইডি ও লাইভ সময় দেখাবে; মোবাইল দিয়ে ছবি তুলে গোপন তথ্য ফাঁসের ঝুঁকি বন্ধ
                    হবে।
                  </p>
                </div>
                <button
                  onClick={handleWatermarkToggle}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                    enableWatermark ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
                      enableWatermark ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs text-slate-500">
          <span>HisabKitab 360 Enterprise Role-Based Access Control</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition"
          >
            সংরক্ষণ ও বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffRbacSecurityModal;
