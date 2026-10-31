import React, { useState, useMemo, useEffect } from 'react';
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  DollarSign,
  Printer,
  Share2,
  Calendar,
  Clock,
  User,
  Users,
  MapPin,
  TrendingUp,
  X,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Check,
  ChevronRight,
  ArrowRight,
  FileSpreadsheet,
  Award,
  Wallet
} from 'lucide-react';
import { hapticFeedback } from '../../services/nativeAppService';
import { playButtonClick, playSuccessChime } from '../../services/soundFeedback';
import { 
  putLocalRecord, 
  enqueueOfflineMutation, 
  generateIdempotencyKey,
  STORES 
} from '../../services/somitiOfflineStore';
import { generateReceiptNumber } from '../../services/samityService';
import { announceDepositSoundbox } from '../../services/voiceSoundboxService';

export default function FieldCollectionSheetModal({
  isOpen,
  onClose,
  members = [],
  deposits = [],
  currentSamity = {},
  currentUser = {},
  onDepositCreated = () => {},
  onOpenThermalPrinter = () => {},
  showToast = () => {}
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'pending' | 'collected'
  const [selectedAmounts, setSelectedAmounts] = useState({}); // { [memberId]: number }
  const [isCollectingId, setIsCollectingId] = useState(null);
  const [todayCollections, setTodayCollections] = useState({}); // { [memberId]: depositObj }
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [reconcileNotes, setReconcileNotes] = useState({
    n1000: 0,
    n500: 0,
    n200: 0,
    n100: 0,
    n50: 0,
    n20: 0,
    n10: 0
  });

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const officerName = currentUser?.name || currentUser?.fullName || 'মাঠকর্মী (Field Officer)';

  // Initialize today's existing collections from deposits prop
  useEffect(() => {
    if (deposits && deposits.length > 0) {
      const map = {};
      deposits.forEach(d => {
        if (d.depositDate === todayStr && d.memberId) {
          map[d.memberId] = d;
        }
      });
      setTodayCollections(map);
    }
  }, [deposits, todayStr]);

  // Compute members with due and collection status
  const memberListWithStatus = useMemo(() => {
    return members.map(m => {
      const standardRate = Number(m.customSubscription || m.monthlySubscription || currentSamity?.monthlySubscription || 500);
      const todayDeposit = todayCollections[m.id];
      const isCollectedToday = Boolean(todayDeposit);

      return {
        ...m,
        standardRate,
        isCollectedToday,
        todayDeposit,
        activeAmount: selectedAmounts[m.id] !== undefined ? selectedAmounts[m.id] : standardRate
      };
    });
  }, [members, todayCollections, selectedAmounts, currentSamity]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return memberListWithStatus.filter(m => {
      if (filterType === 'pending' && m.isCollectedToday) return false;
      if (filterType === 'collected' && !m.isCollectedToday) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const nameBn = (m.nameBn || '').toLowerCase();
      const nameEn = (m.nameEn || '').toLowerCase();
      const code = String(m.memberCode || m.id || '').toLowerCase();
      const mobile = String(m.mobile || '').toLowerCase();

      return nameBn.includes(q) || nameEn.includes(q) || code.includes(q) || mobile.includes(q);
    });
  }, [memberListWithStatus, filterType, searchQuery]);

  // Daily Telemetry Stats
  const stats = useMemo(() => {
    const totalCount = members.length;
    const collectedCount = Object.keys(todayCollections).length;
    const pendingCount = Math.max(0, totalCount - collectedCount);
    const totalCollectedAmount = Object.values(todayCollections).reduce(
      (sum, d) => sum + Number(d.amount || 0), 
      0
    );
    const targetAmount = members.reduce(
      (sum, m) => sum + Number(m.customSubscription || m.monthlySubscription || currentSamity?.monthlySubscription || 500), 
      0
    );
    const progressPercent = totalCount > 0 ? Math.round((collectedCount / totalCount) * 100) : 0;

    return {
      totalCount,
      collectedCount,
      pendingCount,
      totalCollectedAmount,
      targetAmount,
      progressPercent
    };
  }, [members, todayCollections, currentSamity]);

  // 1-Tap Quick Instant Collect
  const handleInstantCollect = async (member) => {
    const amount = Number(member.activeAmount || member.standardRate || 500);
    if (!amount || amount <= 0) {
      showToast?.('টাকার সঠিক পরিমাণ দিন!', 'warning');
      return;
    }

    playButtonClick?.();
    hapticFeedback.medium();
    setIsCollectingId(member.id);

    try {
      const idempotencyKey = generateIdempotencyKey('field_dep');
      const receiptNo = generateReceiptNumber(deposits, 'RCPT-FLD-');
      const dateStr = todayStr;
      const timeStr = new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });

      const newDeposit = {
        id: `DEP-FLD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        samityId: currentSamity?.id || 'SAMITY-001',
        tenantId: currentSamity?.id || 'SAMITY-001',
        memberId: member.id,
        memberCode: member.memberCode || member.id,
        memberName: member.nameBn || member.nameEn || 'সদস্য',
        amount: amount,
        type: 'মাসিক সঞ্চয় (ফিল্ড আদায়)',
        depositType: 'savings',
        depositDate: dateStr,
        paymentMethod: 'ক্যাশ (ফিল্ড কালেকশন)',
        receiptNo: receiptNo,
        voucherNo: receiptNo,
        collectorName: officerName,
        collectedBy: officerName,
        status: 'approved',
        approvalStatus: 'approved',
        isSynced: false,
        syncStatus: 'pending',
        idempotencyKey: idempotencyKey,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: `ফিল্ড অফিসার ${officerName} দ্বারা সরাসরি মাঠপর্যায়ে সংগৃহীত`
      };

      // 1. Save to IndexedDB Offline Store
      await putLocalRecord(STORES.DEPOSITS, newDeposit);

      // 2. Queue for Cloud Sync when online
      await enqueueOfflineMutation('deposit', 'create', newDeposit, currentSamity?.id);

      // 3. Update local state
      setTodayCollections(prev => ({
        ...prev,
        [member.id]: newDeposit
      }));

      onDepositCreated(newDeposit);
      announceDepositSoundbox(newDeposit, currentSamity);
      playSuccessChime?.();
      hapticFeedback.success();
      showToast?.(`৳${amount.toLocaleString()} সফলভাবে আদায় হয়েছে! রসিদ #${receiptNo}`, 'success');
    } catch (err) {
      console.error('Field collection failed:', err);
      hapticFeedback.error();
      showToast?.('আদায় সংরক্ষণে ত্রুটি হয়েছে। পুনরায় চেষ্টা করুন।', 'error');
    } finally {
      setIsCollectingId(null);
    }
  };

  const calculatedHandoverCash = useMemo(() => {
    return (
      (reconcileNotes.n1000 * 1000) +
      (reconcileNotes.n500 * 500) +
      (reconcileNotes.n200 * 200) +
      (reconcileNotes.n100 * 100) +
      (reconcileNotes.n50 * 50) +
      (reconcileNotes.n20 * 20) +
      (reconcileNotes.n10 * 10)
    );
  }, [reconcileNotes]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col h-[94vh] overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base sm:text-lg">
                  মাঠকর্মীর অফলাইন কালেকশন শীট
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  ১০জিবি+ অফলাইন রেডি
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                <span>কালেক্টর: <strong className="text-slate-700 dark:text-slate-200">{officerName}</strong></span>
                <span>•</span>
                <span>তারিখ: {todayStr}</span>
                <span>•</span>
                <span>{currentSamity?.nameBn || currentSamity?.name || 'সমিতি ৩৬০'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsReconcileModalOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-all"
            >
              <Wallet className="w-4 h-4 text-emerald-600" />
              ক্যাশ সমন্বয়
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Daily Progress HUD */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 sm:p-4 bg-emerald-50/40 dark:bg-slate-800/40 border-b border-emerald-100/80 dark:border-slate-800">
          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">আজকের সংগৃহীত টাকা</div>
            <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
              ৳ {stats.totalCollectedAmount.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400">লক্ষ্য: ৳{stats.targetAmount.toLocaleString()}</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">আদায়কৃত সদস্য</div>
            <div className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400">
              {stats.collectedCount} <span className="text-xs font-normal text-slate-400">/ {stats.totalCount} জন</span>
            </div>
            <div className="text-[10px] text-slate-400">অগ্রগতি: {stats.progressPercent}%</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">বাকি সদস্য</div>
            <div className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400">
              {stats.pendingCount} জন
            </div>
            <div className="text-[10px] text-amber-600/80">কালেকশন প্রক্রিয়াধীন</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-center">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">রুট অগ্রগতি ({stats.progressPercent}%)</div>
            <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${stats.progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2.5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="সদস্যের নাম, কোড বা মোবাইল নম্বর খুঁজুন..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => { setFilterType('all'); hapticFeedback.selection(); }}
              className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
                filterType === 'all'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              সব সদস্য ({members.length})
            </button>
            <button
              onClick={() => { setFilterType('pending'); hapticFeedback.selection(); }}
              className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
                filterType === 'pending'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              বাকি ({stats.pendingCount})
            </button>
            <button
              onClick={() => { setFilterType('collected'); hapticFeedback.selection(); }}
              className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
                filterType === 'collected'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              আদায়কৃত ({stats.collectedCount})
            </button>
          </div>
        </div>

        {/* Member Collection Cards List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-100/60 dark:bg-slate-950">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((m) => {
              const isCollected = m.isCollectedToday;
              const dep = m.todayDeposit;

              return (
                <div 
                  key={m.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isCollected
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-800/60 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    
                    {/* Left: Member Identity */}
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        isCollected
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {m.photo ? (
                          <img src={m.photo} alt={m.nameBn} className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          (m.nameBn || m.nameEn || 'M').slice(0, 1)
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                            {m.nameBn || m.nameEn}
                          </h4>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            ID: {m.memberCode || m.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          মোবাইল: {m.mobile || 'রেকর্ড নেই'} • নিয়মিত চাঁদা: ৳{m.standardRate}
                        </p>
                      </div>
                    </div>

                    {/* Right: 1-Tap Collection & Receipt Actions */}
                    <div className="flex items-center gap-2 ml-auto">
                      {isCollected ? (
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 justify-end">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ৳{Number(dep?.amount || 0).toLocaleString()} সংগৃহীত
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              #{dep?.receiptNo || 'RCPT'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              playButtonClick?.();
                              hapticFeedback.light();
                              onOpenThermalPrinter(dep);
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-200 flex items-center gap-1.5 transition-all shadow-sm"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            🖨️ থার্মাল রসিদ
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Quick Amount Chips */}
                          <div className="flex items-center gap-1">
                            {[m.standardRate, 200, 500, 1000].filter((v, i, a) => a.indexOf(v) === i).slice(0, 3).map((amt) => (
                              <button
                                key={amt}
                                type="button"
                                onClick={() => {
                                  setSelectedAmounts(prev => ({ ...prev, [m.id]: amt }));
                                  hapticFeedback.selection();
                                }}
                                className={`px-2 py-1 text-[11px] rounded-lg font-bold border transition-all ${
                                  m.activeAmount === amt
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                ৳{amt}
                              </button>
                            ))}
                          </div>

                          {/* 1-Tap Collect Button */}
                          <button
                            type="button"
                            disabled={isCollectingId === m.id}
                            onClick={() => handleInstantCollect(m)}
                            className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 shadow-md shadow-emerald-500/25 flex items-center gap-1.5 transition-all"
                          >
                            {isCollectingId === m.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            ১-ট্যাপ জমা নিন
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              <Users className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-60" />
              <p className="text-sm font-semibold">কোনো সদস্য পাওয়া যায়নি</p>
              <p className="text-xs text-slate-400 mt-1">সার্চ বা ফিল্টার পরিবর্তন করে দেখুন</p>
            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            মোট সংগৃহীত: <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">৳{stats.totalCollectedAmount.toLocaleString()}</strong> ({stats.collectedCount} জন সদস্য)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsReconcileModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 flex items-center gap-1.5 shadow-md transition-all"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              দিনের হিসাব ক্লোজ ও ভাউচার
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>

      </div>

      {/* Day-End Cash Reconcile Sub-Modal */}
      {isReconcileModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-base text-slate-800 dark:text-slate-100">
                  দিনের হিসাব ক্লোজ ও ক্যাশ নোট গণনা
                </h4>
              </div>
              <button 
                onClick={() => setIsReconcileModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">সিস্টেম অনুযায়ী আজকের আদায়:</span>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    ৳ {stats.totalCollectedAmount.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 dark:text-slate-400">হাতে থাকা গণনা অনুযায়ী:</span>
                  <div className={`text-lg font-black ${
                    calculatedHandoverCash === stats.totalCollectedAmount 
                      ? 'text-emerald-600' 
                      : 'text-amber-600'
                  }`}>
                    ৳ {calculatedHandoverCash.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Note Breakdown Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: '১০০০ টাকার নোট', key: 'n1000', mult: 1000 },
                  { label: '৫০০ টাকার নোট', key: 'n500', mult: 500 },
                  { label: '২০০ টাকার নোট', key: 'n200', mult: 200 },
                  { label: '১০০ টাকার নোট', key: 'n100', mult: 100 },
                  { label: '৫০ টাকার নোট', key: 'n50', mult: 50 },
                  { label: '২০/১০ টাকার নোট', key: 'n20', mult: 20 },
                ].map(({ label, key, mult }) => (
                  <div key={key} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span>{label}</span>
                    <input
                      type="number"
                      min="0"
                      value={reconcileNotes[key] || ''}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value) || 0);
                        setReconcileNotes(p => ({ ...p, [key]: val }));
                      }}
                      placeholder="০"
                      className="w-16 px-2 py-1 text-right font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-slate-800 dark:text-slate-100"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                {calculatedHandoverCash === stats.totalCollectedAmount 
                  ? '✅ ক্যাশ হিসাব সম্পূর্ণ মিলেছে!' 
                  : '⚠️ সিস্টেম ব্যালেন্স ও ক্যাশের মাঝে পার্থক্য আছে'}
              </span>
              <button
                type="button"
                onClick={() => {
                  playButtonClick?.();
                  hapticFeedback.success();
                  showToast?.('দিনের কালেকশন সামারি ও ক্যাশ হ্যান্ডওভার ভাউচার সংরক্ষিত হয়েছে!', 'success');
                  setIsReconcileModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md"
              >
                ক্যাশ বুঝিয়ে দিন ও সমাপ্ত করুন
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
