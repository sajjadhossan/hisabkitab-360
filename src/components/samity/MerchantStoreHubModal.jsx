import React, { useState, useEffect, useMemo } from 'react';
import {
  Store,
  QrCode,
  ShoppingBag,
  Users,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  DollarSign,
  TrendingUp,
  Printer,
  Share2,
  Calendar,
  Sparkles,
  ShieldCheck,
  Check,
  ChevronRight,
  ArrowRight,
  Wallet,
  Activity,
  Sprout,
  Wrench,
  Download
} from 'lucide-react';
import {
  MERCHANT_CATEGORIES,
  getMerchantsList,
  saveMerchantRecord,
  getMerchantTransactions,
  recordMerchantPurchase,
  settleMerchantPayment,
  buildMerchantStandeeQrString
} from '../../services/merchantService';
import { generateQrDataUrl } from '../../services/qrService';
import { hapticFeedback } from '../../services/nativeAppService';
import { playButtonClick, playSuccessChime } from '../../services/soundFeedback';

export default function MerchantStoreHubModal({
  isOpen,
  onClose,
  members = [],
  currentSamity = {},
  showToast = () => {}
}) {
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'purchase' | 'transactions'
  const [merchants, setMerchants] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Registration Form State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regForm, setRegForm] = useState({
    businessName: '',
    ownerName: '',
    mobile: '',
    category: 'grocery',
    address: '',
    commissionRate: 1.5
  });

  // Purchase Entry Form State
  const [purchaseForm, setPurchaseForm] = useState({
    merchantId: '',
    memberId: '',
    amount: '',
    itemsDescription: ''
  });

  // Settlement Form State
  const [settleTargetMerchant, setSettleTargetMerchant] = useState(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleMethod, setSettleMethod] = useState('ক্যাশ');

  // Standee Modal State
  const [standeeMerchant, setStandeeMerchant] = useState(null);
  const [standeeQrUrl, setStandeeQrUrl] = useState('');

  const samityId = currentSamity?.id || 'SAMITY-001';

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, samityId]);

  const loadData = () => {
    const mList = getMerchantsList(samityId);
    setMerchants(mList);
    const txList = getMerchantTransactions(samityId);
    setTransactions(txList);

    if (mList.length > 0 && !purchaseForm.merchantId) {
      setPurchaseForm(prev => ({ ...prev, merchantId: mList[0].id }));
    }
    if (members.length > 0 && !purchaseForm.memberId) {
      setPurchaseForm(prev => ({ ...prev, memberId: members[0].id }));
    }
  };

  // Generate Standee QR
  useEffect(() => {
    if (standeeMerchant) {
      const qrPayload = buildMerchantStandeeQrString(standeeMerchant, currentSamity);
      generateQrDataUrl(qrPayload, { width: 400, margin: 2 }).then(url => {
        setStandeeQrUrl(url || '');
      });
    } else {
      setStandeeQrUrl('');
    }
  }, [standeeMerchant, currentSamity]);

  // Filtered Merchants
  const filteredMerchants = useMemo(() => {
    if (!searchQuery.trim()) return merchants;
    const q = searchQuery.toLowerCase().trim();
    return merchants.filter(m => 
      m.businessName.toLowerCase().includes(q) ||
      m.ownerName.toLowerCase().includes(q) ||
      m.mobile.includes(q)
    );
  }, [merchants, searchQuery]);

  // Total Metrics
  const metrics = useMemo(() => {
    const totalReceivable = merchants.reduce((sum, m) => sum + Number(m.currentReceivable || 0), 0);
    const totalVolume = merchants.reduce((sum, m) => sum + Number(m.totalSales || 0), 0);
    return {
      count: merchants.length,
      totalReceivable,
      totalVolume
    };
  }, [merchants]);

  if (!isOpen) return null;

  // Handle New Merchant Registration
  const handleSaveMerchant = (e) => {
    e.preventDefault();
    if (!regForm.businessName.trim() || !regForm.mobile.trim()) {
      showToast('দোকানের নাম ও মোবাইল নম্বর আবশ্যক', 'warning');
      return;
    }

    playButtonClick?.();
    hapticFeedback.medium();

    const updated = saveMerchantRecord(regForm, samityId);
    setMerchants(updated);
    setIsRegisterOpen(false);
    setRegForm({
      businessName: '',
      ownerName: '',
      mobile: '',
      category: 'grocery',
      address: '',
      commissionRate: 1.5
    });

    playSuccessChime?.();
    showToast('নতুন মার্চেন্ট সফলভাবে তালিকাভুক্ত হয়েছে!', 'success');
  };

  // Handle Purchase Entry
  const handleExecutePurchase = (e) => {
    e.preventDefault();
    const amount = Number(purchaseForm.amount || 0);
    if (!amount || amount <= 0) {
      showToast('টাকার সঠিক পরিমাণ দিন', 'warning');
      return;
    }

    const selectedMerchant = merchants.find(m => m.id === purchaseForm.merchantId);
    const selectedMember = members.find(m => m.id === purchaseForm.memberId);

    if (!selectedMerchant || !selectedMember) {
      showToast('সদস্য বা দোকান নির্বাচন করুন', 'error');
      return;
    }

    playButtonClick?.();
    hapticFeedback.success();

    const result = recordMerchantPurchase({
      merchantId: selectedMerchant.id,
      merchantName: selectedMerchant.businessName,
      memberId: selectedMember.id,
      memberName: selectedMember.nameBn || selectedMember.nameEn || 'সদস্য',
      amount: amount,
      itemsDescription: purchaseForm.itemsDescription
    }, currentSamity);

    setMerchants(result.updatedMerchants);
    setTransactions(result.updatedTxs);
    setPurchaseForm(prev => ({ ...prev, amount: '', itemsDescription: '' }));
    setActiveTab('transactions');

    playSuccessChime?.();
    showToast(`৳${amount.toLocaleString()} কিউআর পেমেন্ট সফলভাবে রেকর্ড হয়েছে!`, 'success');
  };

  // Handle Settlement
  const handleExecuteSettlement = (e) => {
    e.preventDefault();
    const amount = Number(settleAmount || 0);
    if (!amount || amount <= 0) {
      showToast('পরিশোধের টাকার পরিমাণ দিন', 'warning');
      return;
    }

    playButtonClick?.();
    hapticFeedback.success();

    const result = settleMerchantPayment({
      merchantId: settleTargetMerchant.id,
      merchantName: settleTargetMerchant.businessName,
      amount: amount,
      paymentMethod: settleMethod,
      remarks: 'দোকানদারের পাওনা বিল পরিশোধ'
    }, currentSamity);

    setMerchants(result.updatedMerchants);
    setTransactions(result.updatedTxs);
    setSettleTargetMerchant(null);
    setSettleAmount('');

    playSuccessChime?.();
    showToast(`মার্চেন্টকে ৳${amount.toLocaleString()} বিল পরিশোধ সফল হয়েছে!`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col h-[94vh] overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base sm:text-lg">
                  মার্চেন্ট ও পার্টনার স্টোর হাব
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  QR Code Pay
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                সদস্যদের স্থানীয় মুদি ও ফার্মেসিতে কিউআর কোডে কেনাকাটা ও সমিতির বিল সমন্বয়
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              নতুন মার্চেন্ট
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metrics Summary Strip */}
        <div className="grid grid-cols-3 gap-3 p-3.5 bg-amber-50/40 dark:bg-slate-800/40 border-b border-amber-100/80 dark:border-slate-800">
          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">তালিকাভুক্ত দোকান</div>
            <div className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100">
              {metrics.count} টি পার্টনার
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">দোকানদারদের মোট পাওনা</div>
            <div className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400">
              ৳ {metrics.totalReceivable.toLocaleString()}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">মোট কিউআর লেনদেন ভলিউম</div>
            <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
              ৳ {metrics.totalVolume.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          {[
            { id: 'directory', label: `১. মার্চেন্ট তালিকা (${merchants.length})`, icon: Store },
            { id: 'purchase', label: '২. কিউআর কেনাকাটা এন্ট্রি', icon: ShoppingBag },
            { id: 'transactions', label: `৩. লেনদেন ইতিহাস (${transactions.length})`, icon: Activity }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); hapticFeedback.selection(); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
                  activeTab === tab.id
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950">
          
          {/* TAB 1: DIRECTORY */}
          {activeTab === 'directory' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="দোকানের নাম, মালিক বা মোবাইল নম্বর দিয়ে খুঁজুন..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredMerchants.map(m => (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                          <Store className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                            {m.businessName}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            মালিক: {m.ownerName} • ফোন: {m.mobile}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                        সক্রিয়
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">বর্তমান পাওনা:</span>
                        <div className="font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                          ৳ {Number(m.currentReceivable || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 dark:text-slate-400">মোট বিক্রয়:</span>
                        <div className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">
                          ৳ {Number(m.totalSales || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setStandeeMerchant(m);
                          hapticFeedback.light();
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center gap-1.5"
                      >
                        <QrCode className="w-3.5 h-3.5 text-amber-600" />
                        কাউন্টার স্ট্যান্ডি QR
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSettleTargetMerchant(m);
                            setSettleAmount(m.currentReceivable || '');
                            hapticFeedback.light();
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-200"
                        >
                          বিল পরিশোধ
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPurchaseForm(p => ({ ...p, merchantId: m.id }));
                            setActiveTab('purchase');
                            hapticFeedback.light();
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm"
                        >
                          পেমেন্ট এন্ট্রি
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: PURCHASE ENTRY */}
          {activeTab === 'purchase' && (
            <div className="max-w-lg mx-auto bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <ShoppingBag className="w-5 h-5 text-amber-600" />
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                  সদস্যের কিউআর কেনাকাটা এন্ট্রি
                </h4>
              </div>

              <form onSubmit={handleExecutePurchase} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">মার্চেন্ট দোকান নির্বাচন করুন:</label>
                  <select
                    value={purchaseForm.merchantId}
                    onChange={(e) => setPurchaseForm(p => ({ ...p, merchantId: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                  >
                    {merchants.map(m => (
                      <option key={m.id} value={m.id}>
                        🏪 {m.businessName} (মালিক: {m.ownerName})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">ক্রেতা সদস্য নির্বাচন করুন:</label>
                  <select
                    value={purchaseForm.memberId}
                    onChange={(e) => setPurchaseForm(p => ({ ...p, memberId: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                  >
                    {members.map(mem => (
                      <option key={mem.id} value={mem.id}>
                        👤 {mem.nameBn || mem.nameEn} (ID: {mem.memberCode || mem.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">কেনাকাটার পরিমাণ (টাকা):</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={purchaseForm.amount}
                    onChange={(e) => setPurchaseForm(p => ({ ...p, amount: e.target.value }))}
                    placeholder="যেমন: ১৫০০"
                    className="w-full p-2.5 text-base font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-amber-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">মালামালের বিবরণ:</label>
                  <input
                    type="text"
                    value={purchaseForm.itemsDescription}
                    onChange={(e) => setPurchaseForm(p => ({ ...p, itemsDescription: e.target.value }))}
                    placeholder="যেমন: চাল, তেল, মসলা ও ডাল"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-extrabold text-white bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all text-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  কিউআর পেমেন্ট নিশ্চিত করুন (সাউন্ডবক্স এনাউন্স হবে)
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: TRANSACTIONS & SETTLEMENTS */}
          {activeTab === 'transactions' && (
            <div className="space-y-3">
              {transactions.length > 0 ? (
                transactions.map(tx => (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.type === 'purchase'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                        }`}>
                          {tx.type === 'purchase' ? '🛒 কেনাকাটা' : '💵 বিল সেটেলমেন্ট'}
                        </span>
                        <strong className="text-slate-800 dark:text-slate-100">
                          {tx.merchantName}
                        </strong>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">
                        {tx.type === 'purchase' ? `সদস্য: ${tx.memberName} (${tx.itemsDescription})` : tx.remarks}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className={`font-mono font-bold text-sm ${
                        tx.type === 'purchase' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        ৳ {Number(tx.amount || 0).toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-400">{tx.date} {tx.time}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400">
                  <Activity className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs">এখনও কোনো মার্চেন্ট কেনাকাটা সম্পন্ন হয়নি</p>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* SUB-MODAL 1: REGISTER NEW MERCHANT */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Store className="w-4 h-4 text-amber-600" />
                নতুন পার্টনার মার্চেন্ট নিবন্ধন
              </h4>
              <button onClick={() => setIsRegisterOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMerchant} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-slate-600 dark:text-slate-300">দোকান / ব্যবসার নাম:</label>
                <input
                  type="text"
                  required
                  value={regForm.businessName}
                  onChange={(e) => setRegForm(p => ({ ...p, businessName: e.target.value }))}
                  placeholder="যেমন: মেসার্স রহিম স্টোর"
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-600 dark:text-slate-300">মালিকের নাম:</label>
                <input
                  type="text"
                  required
                  value={regForm.ownerName}
                  onChange={(e) => setRegForm(p => ({ ...p, ownerName: e.target.value }))}
                  placeholder="মালিকের নাম"
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-600 dark:text-slate-300">মোবাইল নম্বর:</label>
                <input
                  type="tel"
                  required
                  value={regForm.mobile}
                  onChange={(e) => setRegForm(p => ({ ...p, mobile: e.target.value }))}
                  placeholder="017xxxxxxxx"
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-600 dark:text-slate-300">ব্যবসার ধরন / ক্যাটাগরি:</label>
                <select
                  value={regForm.category}
                  onChange={(e) => setRegForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  {MERCHANT_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.nameBn}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-600 dark:text-slate-300">দোকানের ঠিকানা:</label>
                <input
                  type="text"
                  value={regForm.address}
                  onChange={(e) => setRegForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="বাজার, রাস্তা বা মোড়"
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-white font-bold bg-amber-600 hover:bg-amber-700 shadow-md"
                >
                  নিবন্ধন সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL 2: SETTLE MERCHANT BILL */}
      {settleTargetMerchant && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                দোকানদারের পাওনা বিল পরিশোধ
              </h4>
              <button onClick={() => setSettleTargetMerchant(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteSettlement} className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500">দোকানের নাম:</span>
                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {settleTargetMerchant.businessName}
                </p>
                <span className="text-xs text-rose-600 font-semibold">
                  মোট পাওনা: ৳{Number(settleTargetMerchant.currentReceivable || 0).toLocaleString()}
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-600 dark:text-slate-300">পরিশোধের পরিমাণ (টাকা):</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full p-2.5 text-base font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 text-emerald-600 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-600 dark:text-slate-300">পরিশোধের মাধ্যম:</label>
                <select
                  value={settleMethod}
                  onChange={(e) => setSettleMethod(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                >
                  <option value="ক্যাশ (অফিস ভল্ট)">ক্যাশ (অফিস ভল্ট)</option>
                  <option value="ব্যাংক একাউন্ট ট্রান্সফার">ব্যাংক একাউন্ট ট্রান্সফার</option>
                  <option value="বিকাশ / নগদ MFS">বিকাশ / নগদ MFS</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSettleTargetMerchant(null)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-white font-bold bg-emerald-600 hover:bg-emerald-700 shadow-md"
                >
                  পরিশোধ নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL 3: PRINTABLE COUNTER STANDEE QR CODE */}
      {standeeMerchant && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 text-center border-4 border-amber-500">
            
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-black tracking-widest text-amber-700">
                {currentSamity?.nameBn || currentSamity?.name || 'সমিতি ৩৬০'} অফিসিয়াল পার্টনার
              </span>
              <h3 className="font-black text-lg text-slate-900">
                {standeeMerchant.businessName}
              </h3>
              <p className="text-xs text-slate-600">
                এখানে সমিতির ডিজিটাল কার্ড ও কিউআর স্ক্যান গ্রহণ করা হয়
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 inline-block mx-auto">
              {standeeQrUrl ? (
                <img src={standeeQrUrl} alt="Merchant QR" className="w-48 h-48 mx-auto" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                  কিউআর কোড জেনারেট হচ্ছে...
                </div>
              )}
              <div className="text-[11px] font-mono font-bold text-slate-700 mt-2">
                মার্চেন্ট আইডি: {standeeMerchant.id}
              </div>
            </div>

            <p className="text-[10px] text-slate-500">
              স্মার্টফোন ক্যামেরা দিয়ে স্ক্যান করে সমিতির অ্যাকাউন্ট থেকে সরাসরি ক্যাশলেস পেমেন্ট করুন
            </p>

            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setStandeeMerchant(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                বন্ধ করুন
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 flex items-center gap-1.5 shadow-md"
              >
                <Printer className="w-3.5 h-3.5" />
                কাউন্টার স্ট্যান্ডি প্রিন্ট
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
