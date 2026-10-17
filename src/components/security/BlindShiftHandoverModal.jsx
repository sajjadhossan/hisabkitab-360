import React, { useState, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  Banknote,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Printer,
  History,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Vault,
  Send,
  Eye,
  EyeOff,
  UserCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { playButtonClick, playSuccessChime } from '../../services/soundFeedback';
import { logAuditEvent, AUDIT_ACTIONS } from '../../services/auditService';

/**
 * HisabKitab 360 - Blind Shift Handover & Mid-Day Cash Drop Hub (Phase 6, Features 54 & 56)
 * Features:
 * - Blind Cash Counting (Hides expected system cash until counted to prevent skimming)
 * - Denomination Calculator (1000, 500, 200, 100, 50, 20, 10, coins)
 * - Variance & Short-Cash calculation
 * - Mid-Day Safe Locker Cash Drop engine
 * - Tamper-evident closing log
 */
export const BlindShiftHandoverModal = ({ isOpen, onClose, lang = 'bn' }) => {
  const {
    activeBranch,
    activeCounter,
    salesHistory = [],
    expenses = [],
    businessSettings = {},
    showToast = () => {}
  } = useApp() || {};

  const { user } = useAuth() || {};

  const [activeTab, setActiveTab] = useState('blind_closing'); // 'blind_closing' | 'cash_drop' | 'shift_logs'

  // Denominations state
  const [denominations, setDenominations] = useState({
    1000: '',
    500: '',
    200: '',
    100: '',
    50: '',
    20: '',
    10: '',
    coins: ''
  });

  const [isRevealed, setIsRevealed] = useState(false);
  const [closingNote, setClosingNote] = useState('');
  const [supervisorPin, setSupervisorPin] = useState('');
  const [supervisorName, setSupervisorName] = useState('');

  // Cash Drop State
  const [dropAmount, setDropAmount] = useState('');
  const [dropReason, setDropReason] = useState('ড্রয়ারে অতিরিক্ত নগদ টাকা লকারে স্থানান্তর');
  const [dropSupervisor, setDropSupervisor] = useState('');

  // History of shift closings and cash drops stored locally
  const [historyList, setHistoryList] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('hk360_shift_handover_history') || '[]');
    } catch {
      return [];
    }
  });

  // Calculate actual physical cash from denomination counts
  const countedPhysicalCash = useMemo(() => {
    let sum = 0;
    sum += (parseInt(denominations[1000], 10) || 0) * 1000;
    sum += (parseInt(denominations[500], 10) || 0) * 500;
    sum += (parseInt(denominations[200], 10) || 0) * 200;
    sum += (parseInt(denominations[100], 10) || 0) * 100;
    sum += (parseInt(denominations[50], 10) || 0) * 50;
    sum += (parseInt(denominations[20], 10) || 0) * 20;
    sum += (parseInt(denominations[10], 10) || 0) * 10;
    sum += parseFloat(denominations.coins) || 0;
    return sum;
  }, [denominations]);

  // Calculate today's expected cash from sales and expenses
  const today = new Date().toISOString().split('T')[0];
  const todayCashSales = useMemo(() => {
    return (salesHistory || [])
      .filter((s) => String(s?.date || '').startsWith(today) && s.paymentMethod === 'cash')
      .reduce((sum, s) => sum + (Number(s.paidAmount || s.grandTotal) || 0), 0);
  }, [salesHistory, today]);

  const todayCashExpenses = useMemo(() => {
    return (expenses || [])
      .filter((e) => String(e?.date || '').startsWith(today))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses, today]);

  // Total drops recorded today
  const todayDrops = useMemo(() => {
    return historyList
      .filter((h) => h.type === 'cash_drop' && String(h.timestamp || '').startsWith(today))
      .reduce((sum, h) => sum + (Number(h.amount) || 0), 0);
  }, [historyList, today]);

  const openingFloat = Number(businessSettings?.counterOpeningFloat || 2000);
  const expectedSystemCash = Math.max(0, openingFloat + todayCashSales - todayCashExpenses - todayDrops);
  const discrepancy = countedPhysicalCash - expectedSystemCash;

  const handleDenominationChange = (val, denomKey) => {
    const clean = val.replace(/[^0-9.]/g, '');
    setDenominations((prev) => ({ ...prev, [denomKey]: clean }));
  };

  const handleRevealAndSubmit = () => {
    if (countedPhysicalCash <= 0) {
      showToast?.('দয়া করে নোট বা কয়েনের সঠিক সংখ্যা প্রদান করুন', 'warning');
      return;
    }
    playButtonClick?.();
    setIsRevealed(true);

    const record = {
      id: `SHF-${Date.now()}`,
      type: 'shift_closing',
      timestamp: new Date().toISOString(),
      cashier: user?.name || user?.email || 'ক্যাশিয়ার',
      counter: activeCounter?.name || 'Counter 1',
      branch: activeBranch?.name || 'প্রধান শাখা',
      countedCash: countedPhysicalCash,
      expectedCash: expectedSystemCash,
      discrepancy,
      openingFloat,
      todayCashSales,
      todayCashExpenses,
      todayDrops,
      closingNote,
      supervisorName: supervisorName || 'অনুমোদিত'
    };

    const updated = [record, ...historyList];
    setHistoryList(updated);
    try {
      localStorage.setItem('hk360_shift_handover_history', JSON.stringify(updated));
    } catch {}

    logAuditEvent?.(AUDIT_ACTIONS?.SHIFT_CLOSING || 'SHIFT_CLOSING', {
      ...record,
      severity: Math.abs(discrepancy) > 500 ? 'HIGH' : 'NORMAL'
    });

    playSuccessChime?.();
    showToast?.('অন্ধ শিফট গণনা সম্পন্ন ও সংরক্ষিত হয়েছে!', 'success');
  };

  const handleExecuteCashDrop = (e) => {
    e.preventDefault();
    const amt = parseFloat(dropAmount);
    if (!amt || amt <= 0) {
      showToast?.('ড্রপ করার জন্য টাকার পরিমাণ লিখুন', 'warning');
      return;
    }
    if (amt > countedPhysicalCash && countedPhysicalCash > 0) {
      showToast?.('কাউন্টার ক্যাশের চেয়ে অতিরিক্ত টাকা ড্রপ করা যাবে না', 'warning');
      return;
    }

    const dropRecord = {
      id: `DROP-${Date.now()}`,
      type: 'cash_drop',
      timestamp: new Date().toISOString(),
      amount: amt,
      cashier: user?.name || user?.email || 'ক্যাশিয়ার',
      supervisor: dropSupervisor || 'ম্যানেজার',
      reason: dropReason,
      branch: activeBranch?.name || 'প্রধান শাখা'
    };

    const updated = [dropRecord, ...historyList];
    setHistoryList(updated);
    try {
      localStorage.setItem('hk360_shift_handover_history', JSON.stringify(updated));
    } catch {}

    logAuditEvent?.('CASH_DROP_TO_SAFE', dropRecord);

    playSuccessChime?.();
    showToast?.(`৳${amt.toLocaleString('bn-BD')} লকারে সফলভাবে ড্রপ করা হয়েছে`, 'success');
    setDropAmount('');
    setActiveTab('shift_logs');
  };

  const handlePrintZReport = () => {
    window.print();
  };

  if (!isOpen) return null;

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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  শিফট হ্যান্ডওভার ও অন্ধ ক্যাশ গণনা
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-300 dark:border-emerald-800">
                  অ্যান্টি-থেফ্ট গার্ড
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ক্যাশিয়ার শিফট ক্লোজিং, ব্লাইন্ড ক্যাশ রিকনসিলিয়েশন এবং সেফ-লকার ক্যাশ ড্রপ
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
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 bg-slate-100/50 dark:bg-slate-800/40">
          <button
            onClick={() => setActiveTab('blind_closing')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'blind_closing'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Lock className="w-4 h-4" />
            অন্ধ ক্যাশ গণনা (Blind Shift)
          </button>
          <button
            onClick={() => setActiveTab('cash_drop')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'cash_drop'
                ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Vault className="w-4 h-4" />
            লকার ক্যাশ ড্রপ (Mid-Day Drop)
          </button>
          <button
            onClick={() => setActiveTab('shift_logs')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'shift_logs'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <History className="w-4 h-4" />
            হ্যান্ডওভার ও ড্রপ হিস্ট্রি ({historyList.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {activeTab === 'blind_closing' && (
            <div className="space-y-6">
              {/* Notice Banner */}
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                  <strong>ব্লাইন্ড হ্যান্ডওভার স্ট্যান্ডার্ড:</strong> কর্মচারীর অনিয়ম রোধে ড্রয়ারের প্রত্যাশিত ব্যালেন্স
                  গণনা সম্পন্ন হওয়ার পূর্বে সিস্টেম সম্পূর্ণ গোপন রাখে। ক্যাশিয়ারকে ড্রয়ারের প্রতিটি নোট গুনে এখানে
                  সংখ্যা বসাতে হবে।
                </div>
              </div>

              {/* Denominations Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  ১. ড্রয়ারের নগদ নোট ও কয়েনের সংখ্যা লিখুন
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: '৳ ১,০০০ নোট', key: 1000, color: 'text-purple-600 dark:text-purple-400' },
                    { label: '৳ ৫০০ নোট', key: 500, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: '৳ ২০০ নোট', key: 200, color: 'text-cyan-600 dark:text-cyan-400' },
                    { label: '৳ ১০০ নোট', key: 100, color: 'text-blue-600 dark:text-blue-400' },
                    { label: '৳ ৫০ নোট', key: 50, color: 'text-amber-600 dark:text-amber-400' },
                    { label: '৳ ২০ নোট', key: 20, color: 'text-orange-600 dark:text-orange-400' },
                    { label: '৳ ১০ নোট', key: 10, color: 'text-rose-600 dark:text-rose-400' },
                    { label: 'খুচরা কয়েন/পয়সা (টাকায়)', key: 'coins', color: 'text-slate-600 dark:text-slate-300' }
                  ].map((denom) => (
                    <div
                      key={denom.key}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className={`font-bold ${denom.color}`}>{denom.label}</span>
                        {denom.key !== 'coins' && denominations[denom.key] > 0 && (
                          <span className="text-[11px] font-semibold text-slate-500">
                            = ৳{(denominations[denom.key] * denom.key).toLocaleString('bn-BD')}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="সংখ্যা (0)"
                        value={denominations[denom.key]}
                        onChange={(e) => handleDenominationChange(e.target.value, denom.key)}
                        disabled={isRevealed}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Physical Count Summary */}
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xl">
                    ৳
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                      মোট গুনে পাওয়া নগদ টাকা (Actual Physical Cash)
                    </span>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      ৳ {countedPhysicalCash.toLocaleString('bn-BD')}
                    </div>
                  </div>
                </div>

                {!isRevealed ? (
                  <button
                    onClick={handleRevealAndSubmit}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
                  >
                    <Unlock className="w-4 h-4" />
                    গণনা সাবমিট ও ক্লোজিং ভেরিফাই করুন
                  </button>
                ) : (
                  <button
                    onClick={handlePrintZReport}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <Printer className="w-4 h-4" />
                    Z-Report হ্যান্ডওভার প্রিন্ট
                  </button>
                )}
              </div>

              {/* Revealed Reconciliation Box */}
              {isRevealed && (
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-500/40 shadow-xl space-y-4 animate-scale-up">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        সিস্টেম ক্যাশ রিকনসিলিয়েশন অডিট রেজাল্ট
                      </h4>
                    </div>
                    <span className="text-xs text-slate-400">সময়: {new Date().toLocaleTimeString('bn-BD')}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs text-slate-500">ড্রয়ারে থাকার কথা ছিল (Expected):</span>
                      <div className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1">
                        ৳ {expectedSystemCash.toLocaleString('bn-BD')}
                      </div>
                      <span className="text-[10px] text-slate-400">ওপেনিং + নগদ সেলস - খরচ/ড্রপ</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs text-slate-500">বাস্তবে গুনে পাওয়া ক্যাশ (Counted):</span>
                      <div className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1">
                        ৳ {countedPhysicalCash.toLocaleString('bn-BD')}
                      </div>
                      <span className="text-[10px] text-slate-400">ক্যাশিয়ারের নিজ হাতে গোনা</span>
                    </div>

                    <div
                      className={`p-3.5 rounded-xl border ${
                        discrepancy === 0
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                          : discrepancy < 0
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                          : 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">পার্থক্য / ভ্যারিয়েন্স:</span>
                        {discrepancy === 0 ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : discrepancy < 0 ? (
                          <TrendingDown className="w-4 h-4 text-rose-500" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-cyan-500" />
                        )}
                      </div>
                      <div className="text-xl font-black mt-1">
                        {discrepancy === 0
                          ? '০.০০ (পরিপূর্ণ নিখুঁত)'
                          : `৳ ${Math.abs(discrepancy).toLocaleString('bn-BD')} (${
                              discrepancy < 0 ? 'ক্যাশ শর্ট' : 'উদ্বৃত্ত ক্যাশ'
                            })`}
                      </div>
                      <span className="text-[10px] opacity-80">
                        {discrepancy === 0
                          ? 'কোনো গরমিল পাওয়া যায়নি'
                          : discrepancy < 0
                          ? 'ক্যাশিয়ারের নিকট থেকে আদায়যোগ্য'
                          : 'অতিরিক্ত নগদ টাকা লকারে জমা হবে'}
                      </span>
                    </div>
                  </div>

                  {/* Supervisor Acknowledgment */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        ক্লোজিং নোট / মন্তব্য (ঐচ্ছিক):
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: খুচরা ২০ টাকা কম ছিল..."
                        value={closingNote}
                        onChange={(e) => setClosingNote(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        সুপারভাইজার / ব্রাঞ্চ ম্যানেজার নাম:
                      </label>
                      <input
                        type="text"
                        placeholder="অনুমোদনকারী অফিসারের নাম"
                        value={supervisorName}
                        onChange={(e) => setSupervisorName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'cash_drop' && (
            <form onSubmit={handleExecuteCashDrop} className="space-y-5 max-w-xl mx-auto">
              <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 flex items-start gap-3">
                <Vault className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <div className="text-xs text-teal-800 dark:text-teal-200 leading-relaxed">
                  <strong>ক্যাশ ড্রপ অডিট:</strong> দিনের বেলায় কাউন্টারে অতিরিক্ত টাকা জমা হলে চুরির ঝুঁকি এড়াতে তা
                  নিরাপদ ব্যাক-অফিস সেফ লকারে স্থানান্তর করা হয়। এই লেনদেন স্বয়ংক্রিয়ভাবে অডিট লগে রেকর্ড হবে।
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  স্থানান্তরযোগ্য টাকার পরিমাণ (৳)*
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-400">৳</span>
                  <input
                    type="number"
                    required
                    placeholder="যেমন: 20000"
                    value={dropAmount}
                    onChange={(e) => setDropAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-base font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  ড্রপ করার কারণ / খাত
                </label>
                <select
                  value={dropReason}
                  onChange={(e) => setDropReason(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="ড্রয়ারে অতিরিক্ত নগদ টাকা লকারে স্থানান্তর">
                    ড্রয়ারে অতিরিক্ত নগদ টাকা লকারে স্থানান্তর
                  </option>
                  <option value="ব্যাংকে ক্যাশ ডিপোজিটের প্রস্তুতি">ব্যাংকে ক্যাশ ডিপোজিটের প্রস্তুতি</option>
                  <option value="সাপ্লায়ারকে বড় অঙ্কের ক্যাশ পেমেন্ট">সাপ্লায়ারকে বড় অঙ্কের ক্যাশ পেমেন্ট</option>
                  <option value="অন্য কাউন্টারে তারল্য সহায়তা">অন্য কাউন্টারে তারল্য সহায়তা</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  রিসিভকারী ম্যানেজার / লকার ইনচার্জ
                </label>
                <input
                  type="text"
                  placeholder="লকার ম্যানেজারের নাম"
                  value={dropSupervisor}
                  onChange={(e) => setDropSupervisor(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 transition"
              >
                <Vault className="w-4 h-4" />
                লকারে ক্যাশ ড্রপ নিশ্চিত ও রেকর্ড করুন
              </button>
            </form>
          )}

          {activeTab === 'shift_logs' && (
            <div className="space-y-3">
              {historyList.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  এখনো কোনো হ্যান্ডওভার বা ক্যাশ ড্রপের রেকর্ড নেই।
                </div>
              ) : (
                historyList.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          item.type === 'cash_drop'
                            ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {item.type === 'cash_drop' ? <Vault className="w-4 h-4" /> : <Banknote className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {item.type === 'cash_drop' ? 'লকার ক্যাশ ড্রপ' : 'ব্লাইন্ড শিফট ক্লোজিং'}
                          </span>
                          <span className="text-[10px] text-slate-400">{item.id}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {item.cashier} • {new Date(item.timestamp).toLocaleString('bn-BD')}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        ৳{' '}
                        {(item.type === 'cash_drop'
                          ? item.amount
                          : item.countedCash
                        )?.toLocaleString('bn-BD')}
                      </div>
                      {item.type === 'shift_closing' && (
                        <span
                          className={`text-[10px] font-semibold ${
                            item.discrepancy === 0
                              ? 'text-emerald-600'
                              : item.discrepancy < 0
                              ? 'text-rose-500'
                              : 'text-cyan-500'
                          }`}
                        >
                          ভ্যারিয়েন্স: ৳{Math.abs(item.discrepancy || 0)} ({item.discrepancy < 0 ? 'শর্ট' : 'উদ্বৃত্ত'})
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs text-slate-500">
          <span>HisabKitab 360 Enterprise Fraud Prevention Standard</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlindShiftHandoverModal;
