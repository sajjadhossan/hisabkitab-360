import React, { useState } from 'react';
import { useHealthcare } from '../../context/HealthcareContext';
import {
  Building2,
  ChevronDown,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  Lock,
  ArrowRight,
  Info,
  Layers,
  Sparkles
} from 'lucide-react';

export const BranchSelectorBar = () => {
  const {
    branches = [
      { id: 'all', name: 'সব শাখা (একীভূত রূপ)', code: 'ALL', address: 'সকল শাখা সম্মিলিত ভিউ', isAll: true },
      { id: 'dhanmondi', name: 'ধানমন্ডি মেইন ব্রাঞ্চ', code: 'DHD-01', address: 'রোড ৫, ধানমন্ডি, ঢাকা', isMain: true },
      { id: 'uttara', name: 'উত্তরা শাখা', code: 'UTT-02', address: 'সেক্টর ৩, উত্তরা, ঢাকা' },
      { id: 'mirpur', name: 'মিরপুর শাখা', code: 'MIR-03', address: 'মিরপুর ১০, ঢাকা' },
      { id: 'chattogram', name: 'চট্টগ্রাম শাখা', code: 'CTG-04', address: 'জিইসি মোড়, চট্টগ্রাম' }
    ],
    activeBranchId = 'dhanmondi',
    setActiveBranchId,
    currentStaffRole = 'admin',
    setCurrentStaffRole
  } = useHealthcare();

  // Branch Switch Confirmation Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingBranchId, setPendingBranchId] = useState(null);
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  // Available roles for demonstration & testing
  const staffRoles = [
    { id: 'admin', label: 'মালিক / প্রতিষ্ঠান অ্যাডমিন', desc: 'সব শাখা দেখতে ও পরিচালনা করতে পারবেন', canViewAll: true, allowed: ['all', 'dhanmondi', 'uttara', 'mirpur', 'chattogram'] },
    { id: 'manager', label: 'শাখা ম্যানেজার', desc: 'নিজের শাখা ও অনুমোদিত অতিরিক্ত শাখা দেখতে পারবেন', canViewAll: false, allowed: ['dhanmondi', 'uttara'] },
    { id: 'doctor', label: 'ডাক্তার', desc: 'শুধুমাত্র নির্দিষ্ট কর্মরত শাখায় কাজ করবেন', canViewAll: false, allowed: ['dhanmondi'] },
    { id: 'reception', label: 'রিসেপশনিস্ট', desc: 'শুধুমাত্র নির্দিষ্ট কর্মরত শাখায় সিরিয়াল ও বুকিং', canViewAll: false, allowed: ['dhanmondi'] },
    { id: 'lab', label: 'ল্যাব টেকনিশিয়ান', desc: 'শুধুমাত্র নির্দিষ্ট শাখায় স্যাম্পল ও রিপোর্ট', canViewAll: false, allowed: ['dhanmondi'] },
    { id: 'pharmacy', label: 'ফার্মাসিস্ট', desc: 'শুধুমাত্র নির্দিষ্ট শাখার ওষুধ ও কাউন্টার POS', canViewAll: false, allowed: ['dhanmondi'] },
    { id: 'cashier', label: 'ক্যাশিয়ার', desc: 'শুধুমাত্র নিজস্ব শাখার বিলিং ও ক্যাশ ক্লোজিং', canViewAll: false, allowed: ['dhanmondi'] }
  ];

  const currentRoleConfig = staffRoles.find(r => r.id === currentStaffRole) || staffRoles[0];
  const allowedBranchIds = currentRoleConfig.allowed;

  const currentBranch = branches.find(b => b.id === activeBranchId) || branches[1];
  const pendingBranch = branches.find(b => b.id === pendingBranchId);

  // Handle click on branch dropdown
  const handleBranchSelectChange = (e) => {
    const targetId = e.target.value;
    if (targetId === activeBranchId) return;

    // Check permission
    if (!allowedBranchIds.includes(targetId) && !currentRoleConfig.canViewAll) {
      alert(`অনুমতি নেই: আপনার বর্তমান ভূমিকা (${currentRoleConfig.label}) অনুযায়ী এই শাখায় প্রবেশের অনুমতি নেই!`);
      return;
    }

    // Trigger confirmation modal to prevent accidental data contamination
    setPendingBranchId(targetId);
    setShowConfirmModal(true);
  };

  const handleConfirmBranchSwitch = () => {
    if (pendingBranchId) {
      setActiveBranchId(pendingBranchId);
      localStorage.setItem('hisabkitab_hc_active_branch', pendingBranchId);
    }
    setShowConfirmModal(false);
    setPendingBranchId(null);
  };

  const handleCancelBranchSwitch = () => {
    setShowConfirmModal(false);
    setPendingBranchId(null);
  };

  return (
    <div className="w-full mb-3 font-sans">
      {/* Top Persistent Bar */}
      <div
        className="p-3 sm:px-4 rounded-2xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
          borderColor: 'rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(12px)'
        }}
      >
        {/* Left: Active Branch Indicator & Selector */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <Building2 size={17} />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  ১.২ শাখা-নির্বাচক:
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    currentBranch.isAll
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {currentBranch.isAll ? '🌐 ভিউ মোড' : '✓ সক্রিয় শাখা'}
                </span>
              </div>

              {/* Branch Selector Dropdown */}
              <div className="relative mt-0.5">
                <select
                  value={activeBranchId}
                  onChange={handleBranchSelectChange}
                  className="bg-slate-800 text-white font-extrabold text-sm rounded-xl px-3 py-1.5 pr-8 border border-slate-600 focus:outline-teal-400 focus:border-teal-400 cursor-pointer shadow-inner"
                  style={{ minWidth: '220px' }}
                >
                  {branches.map(branch => {
                    const isAllowed = allowedBranchIds.includes(branch.id) || currentRoleConfig.canViewAll;
                    return (
                      <option
                        key={branch.id}
                        value={branch.id}
                        disabled={!isAllowed}
                        className={!isAllowed ? 'text-slate-500 bg-slate-900' : 'text-white bg-slate-800'}
                      >
                        {branch.name} {!isAllowed ? '🔒 (অনুমতি নেই)' : branch.isMain ? '★ (প্রধান)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* Active Branch Location / Badge */}
          <div className="hidden lg:block pl-3 border-l border-slate-700 text-xs">
            <div className="font-bold text-slate-200">{currentBranch.name}</div>
            <div className="text-[11px] text-slate-400">{currentBranch.address}</div>
          </div>
        </div>

        {/* Right: Current Staff Role Badge & Switcher for Testing */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold text-slate-400">বর্তমান ভূমিকা ও পারমিশন</div>
            <div className="text-xs font-black text-teal-400">{currentRoleConfig.label}</div>
          </div>

          {/* Role switcher toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowRoleSelector(!showRoleSelector)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
              title="ভূমিকা অনুযায়ী পারমিশন টেস্ট করতে ক্লিক করুন"
            >
              <UserCheck size={14} className="text-teal-400" />
              <span>ভূমিকা পরিবর্তন</span>
              <ChevronDown size={13} />
            </button>

            {/* Role Selector Popup */}
            {showRoleSelector && (
              <div
                className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-3 z-50 text-xs text-white animate-scale-in"
                style={{ backdropFilter: 'blur(20px)' }}
              >
                <div className="font-black text-slate-300 mb-2 pb-2 border-b border-slate-800 flex justify-between items-center">
                  <span>ভূমিকা অনুযায়ী পারমিশন টেস্ট করুন</span>
                  <button onClick={() => setShowRoleSelector(false)} className="text-slate-400 hover:text-white">✕</button>
                </div>
                <div className="space-y-1">
                  {staffRoles.map(role => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => {
                        setCurrentStaffRole(role.id);
                        // If current branch not allowed, fall back to first allowed
                        if (!role.allowed.includes(activeBranchId) && !role.canViewAll) {
                          setActiveBranchId(role.allowed[0]);
                        }
                        setShowRoleSelector(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl transition-all flex flex-col ${
                        currentStaffRole === role.id
                          ? 'bg-teal-600/30 border border-teal-500/50 text-teal-300'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="font-black flex justify-between">
                        <span>{role.label}</span>
                        {currentStaffRole === role.id && <span>✓</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{role.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Warning banner when "All Branches" is selected (Rule: সব শাখার তথ্য দেখানোর সুবিধা মানে সব শাখার তথ্য সম্পাদনার অনুমতি নয়) */}
      {currentBranch.isAll && (
        <div
          className="mt-2 p-2.5 px-4 rounded-xl border flex items-center justify-between gap-3 text-xs animate-fade-in"
          style={{
            background: 'rgba(147, 51, 234, 0.15)',
            borderColor: 'rgba(168, 85, 247, 0.4)',
            color: '#e9d5ff'
          }}
        >
          <div className="flex items-center gap-2">
            <Info size={16} className="text-purple-400 shrink-0" />
            <span>
              <strong>👁️ সব শাখা একীভূত রূপ (Consolidated View):</strong> আপনি বর্তমানে সকল শাখার সম্মিলিত তথ্য পর্যবেক্ষণ করছেন। নতুন কোনো বিল, প্রেসক্রিপশন বা অর্ডার তৈরি করার জন্য অনুগ্রহ করে উপরের ড্রপডাউন থেকে একটি নির্দিষ্ট সক্রিয় শাখা নির্বাচন করুন।
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setPendingBranchId('dhanmondi');
              setShowConfirmModal(true);
            }}
            className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-[11px] shrink-0 shadow-sm"
          >
            ধানমন্ডি মেইনে যান
          </button>
        </div>
      )}

      {/* Rule: ব্যবহারকারী শাখা বদলালে আগের শাখার অর্ডার/বিল ভুল করে নতুন শাখায় জমা হওয়া ঠেকাতে নিশ্চিতকরণ দেখাতে হবে */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl text-white space-y-4 animate-scale-in">
            <div className="flex items-start gap-3">
              <span className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <AlertTriangle size={24} />
              </span>
              <div>
                <h3 className="text-base font-black text-white">শাখা পরিবর্তনের নিশ্চিতকরণ (Branch Switch Guard)</h3>
                <p className="text-xs text-slate-400 mt-1">
                  আগের শাখার কোনো অর্ডার বা বিল ভুল করে নতুন শাখায় জমা হওয়া রোধ করতে অনুগ্রহ করে নিশ্চিত করুন।
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">বর্তমান সক্রিয় শাখা:</span>
                <span className="font-bold text-rose-400">{currentBranch.name}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-700/60">
                <span className="text-slate-400">নতুন নির্বাচিত শাখা:</span>
                <span className="font-black text-emerald-400">{pendingBranch?.name}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
              ⚠️ <strong>সতর্কতা:</strong> আপনার স্ক্রিনে কোনো অসম্পূর্ণ প্রেসক্রিপশন, ল্যাব টেস্ট বা ফার্মেসি বিল খসড়া থাকলে তা আগের শাখায় সংরক্ষণ করে নিন। শাখা পরিবর্তন করলে পরবর্তী সমস্ত এন্ট্রি <strong>{pendingBranch?.name}</strong>-এর অ্যাকাউন্টে জমা হবে।
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCancelBranchSwitch}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-600 hover:bg-slate-800 text-slate-300"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={handleConfirmBranchSwitch}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-lg flex items-center gap-1.5"
              >
                <span>হ্যাঁ, শাখা পরিবর্তন করুন</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchSelectorBar;
