import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  DollarSign, 
  Landmark, 
  PiggyBank, 
  Coins, 
  Home, 
  CreditCard, 
  HelpCircle,
  AlertTriangle,
  Award
} from 'lucide-react';
import { 
  getPersonalNetWorthAssets, 
  savePersonalNetWorthAssets, 
  calculatePersonalNetWorth, 
  formatCurrency 
} from '../../services/personalFinanceEngine';

export default function PersonalNetWorthModal({
  isOpen,
  onClose,
  liquidCash = 0,
  bankBalances = 0,
  savingsDeposit = 0,
  personalDebtsReceivable = 0,
  personalDebtsPayable = 0,
  loansPayable = 0
}) {
  const [customAssets, setCustomAssets] = useState([]);
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetCategory, setNewAssetCategory] = useState('gold');
  const [newAssetValue, setNewAssetValue] = useState('');
  const [newAssetNotes, setNewAssetNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCustomAssets(getPersonalNetWorthAssets());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddCustomAsset = (e) => {
    e.preventDefault();
    const val = parseFloat(newAssetValue);
    if (!newAssetName.trim() || isNaN(val) || val <= 0) return;

    const item = {
      id: 'ast_' + Date.now(),
      name: newAssetName.trim(),
      category: newAssetCategory,
      value: val,
      notes: newAssetNotes.trim(),
      updatedAt: new Date().toISOString()
    };

    const updated = [item, ...customAssets];
    setCustomAssets(updated);
    savePersonalNetWorthAssets(updated);

    setNewAssetName('');
    setNewAssetValue('');
    setNewAssetNotes('');
  };

  const handleDeleteCustomAsset = (id) => {
    const updated = customAssets.filter(a => a.id !== id);
    setCustomAssets(updated);
    savePersonalNetWorthAssets(updated);
  };

  const netWorthData = calculatePersonalNetWorth({
    liquidCash,
    bankBalances,
    savingsDeposit,
    customAssets,
    personalDebtsReceivable,
    personalDebtsPayable,
    loansPayable
  });

  const getHealthBadge = (rating) => {
    switch (rating) {
      case 'excellent':
        return { label: 'অসাধারণ সচ্ছল (Excellent)', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      case 'good':
        return { label: 'নিরাপদ সচ্ছল (Good)', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      case 'moderate':
        return { label: 'মধ্যম ঝুঁকি (Moderate)', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      default:
        return { label: 'উচ্চ ঋণ ঝুঁকি (High Debt Risk)', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
    }
  };

  const health = getHealthBadge(netWorthData.financialHealth);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                ব্যক্তিগত নিট সম্পদ ও সচ্ছলতা (Net-Worth Solvency)
              </h2>
              <p className="text-xs text-slate-400">
                আপনার স্থাবর-অস্থাবর মোট সম্পদ ও দায়ের সামগ্রিক হিসাব
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar">
          
          {/* Main Net Worth Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800/90 via-slate-850 to-slate-900 border border-slate-700/60 p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  মোট নিট সম্পদ (Assets − Liabilities)
                </span>
                <div className={`text-3xl sm:text-4xl font-extrabold mt-1 tracking-tight ${netWorthData.totalNetWorth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(netWorthData.totalNetWorth)}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${health.color}`}>
                    <Award className="w-3.5 h-3.5" />
                    {health.label}
                  </span>
                  <span className="text-xs text-slate-400">
                    সলভেন্সি অনুপাত: <strong className="text-slate-200">{netWorthData.solvencyRatio}%</strong>
                  </span>
                </div>
              </div>

              {/* Progress gauge visual */}
              <div className="sm:w-48 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/50">
                <div className="text-[11px] text-slate-400 mb-1 flex justify-between">
                  <span>সম্পদ কভারেজ</span>
                  <span className="text-white font-mono">{Math.min(100, Math.max(0, Math.round(netWorthData.solvencyRatio)))}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${netWorthData.solvencyRatio >= 100 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-rose-500 to-amber-500'}`}
                    style={{ width: `${Math.min(100, Math.max(5, netWorthData.solvencyRatio))}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-1.5">
                  {netWorthData.totalLiabilities > 0 ? `প্রতি ৳১০০ ঋণের বিপরীতে ৳${Math.round(netWorthData.solvencyRatio)} সম্পদ আছে` : 'কোনো ঋণ বা দায় নেই!'}
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown Grid: Assets vs Liabilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Assets Column */}
            <div className="bg-slate-800/40 border border-emerald-500/20 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wide">
                    মোট সম্পদ (Total Assets)
                  </h3>
                </div>
                <span className="text-base font-extrabold text-emerald-400">
                  {formatCurrency(netWorthData.totalAssets)}
                </span>
              </div>

              <div className="divide-y divide-slate-800/60 mt-3 text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                    নগদ ক্যাশ (Liquid Cash)
                  </span>
                  <span className="font-semibold text-slate-200">{formatCurrency(liquidCash)}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-2">
                    <Landmark className="w-3.5 h-3.5 text-slate-400" />
                    ব্যাংক ও ডিজিটাল ব্যালেন্স
                  </span>
                  <span className="font-semibold text-slate-200">{formatCurrency(bankBalances)}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-2">
                    <PiggyBank className="w-3.5 h-3.5 text-slate-400" />
                    সঞ্চয় ও সেভিংস ডিপোজিট
                  </span>
                  <span className="font-semibold text-slate-200">{formatCurrency(savingsDeposit)}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                    অন্যদের কাছে পাওয়া (Receivables)
                  </span>
                  <span className="font-semibold text-slate-200">{formatCurrency(personalDebtsReceivable)}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-2">
                    <Coins className="w-3.5 h-3.5 text-slate-400" />
                    স্থাবর/কাস্টম সম্পদ (স্বর্ণ, জমি ইত্যাদি)
                  </span>
                  <span className="font-semibold text-emerald-300">
                    {formatCurrency(customAssets.reduce((s, a) => s + (parseFloat(a.value) || 0), 0))}
                  </span>
                </div>
              </div>
            </div>

            {/* Liabilities Column */}
            <div className="bg-slate-800/40 border border-rose-500/20 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wide">
                    মোট দায় ও ঋণ (Liabilities)
                  </h3>
                </div>
                <span className="text-base font-extrabold text-rose-400">
                  {formatCurrency(netWorthData.totalLiabilities)}
                </span>
              </div>

              <div className="divide-y divide-slate-800/60 mt-3 text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    ব্যক্তিগত দেনা (Payables)
                  </span>
                  <span className="font-semibold text-slate-200">{formatCurrency(personalDebtsPayable)}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                    ব্যাংক লোন / সমিতি ঋণ
                  </span>
                  <span className="font-semibold text-slate-200">{formatCurrency(loansPayable)}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between opacity-50">
                  <span className="text-slate-400">ভবিষ্যত কিস্তির দায়</span>
                  <span className="font-semibold text-slate-400">স্বয়ংক্রিয় সিঙ্ক</span>
                </div>
              </div>
            </div>

          </div>

          {/* Custom Assets Management Register */}
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  স্থাবর সম্পদ রেজিস্টার (স্বর্ণ, জমি, যানবাহন, শেয়ার)
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                {customAssets.length} টি আইটেম
              </span>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleAddCustomAsset} className="grid grid-cols-1 sm:grid-cols-12 gap-2 mb-4 bg-slate-900/60 p-3 rounded-xl border border-slate-700/40">
              <div className="sm:col-span-4">
                <input 
                  type="text"
                  placeholder="সম্পদের নাম (যেমন: স্বর্ণের গহনা ২ ভরি)"
                  value={newAssetName}
                  onChange={(e) => setNewAssetName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div className="sm:col-span-3">
                <select
                  value={newAssetCategory}
                  onChange={(e) => setNewAssetCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="gold">স্বর্ণ / অলংকার</option>
                  <option value="property">জমি / ফ্ল্যাট</option>
                  <option value="vehicle">গাড়ি / বাইক</option>
                  <option value="investment">শেয়ার / সঞ্চয়পত্র</option>
                  <option value="other">অন্যান্য সম্পদ</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <input 
                  type="number"
                  placeholder="বর্তমান বাজারমূল্য (৳)"
                  value={newAssetValue}
                  onChange={(e) => setNewAssetValue(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                  min="1"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="w-full h-full py-2 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> যোগ করুন
                </button>
              </div>
            </form>

            {/* Assets List */}
            {customAssets.length === 0 ? (
              <p className="text-center py-4 text-xs text-slate-500">
                এখনো কোনো অতিরিক্ত সম্পদ যুক্ত করা হয়নি। স্বর্ণ, জমি বা যানবাহন থাকলে উপরে যোগ করুন।
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {customAssets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-2.5 bg-slate-900/40 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">{asset.name}</span>
                      <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {asset.category === 'gold' ? 'স্বর্ণ' : asset.category === 'property' ? 'জমি/ফ্ল্যাট' : asset.category === 'vehicle' ? 'যানবাহন' : 'বিনিয়োগ'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-emerald-400">
                        {formatCurrency(asset.value)}
                      </span>
                      <button
                        onClick={() => handleDeleteCustomAsset(asset.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-850 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
}
