import React, { useState, useMemo } from 'react';
import {
  X,
  Building2,
  Smartphone,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Printer,
  TrendingUp,
  RefreshCw,
  Percent,
  Search,
  Download,
  CreditCard
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playButtonClick, playSuccessChime } from '../../services/soundFeedback';
import { VAT_RATES } from '../../services/nbrVatComplianceService';

/**
 * HisabKitab 360 - Bank & MFS Reconciliation & NBR VAT 6.3 Hub (Phase 7, Features 66 & 69)
 */
export const BankMfsReconciliationModal = ({ isOpen, onClose, lang = 'bn' }) => {
  const {
    salesHistory = [],
    businessSettings = {},
    showToast = () => {}
  } = useApp() || {};

  const [activeTab, setActiveTab] = useState('mfs_reconcile'); // 'mfs_reconcile' | 'nbr_vat_63'

  // MFS Merchant Balances input
  const [actualBalances, setActualBalances] = useState({
    bkash: '',
    nagad: '',
    rocket: '',
    bank: ''
  });

  // NBR VAT Config
  const [vatRateType, setVatRateType] = useState('REDUCED_RETAIL'); // 5%
  const [selectedInvoiceForVat, setSelectedInvoiceForVat] = useState(null);

  // Calculate software recorded totals
  const systemRecordedTotals = useMemo(() => {
    let bkash = 0;
    let nagad = 0;
    let rocket = 0;
    let bank = 0;

    (salesHistory || []).forEach((s) => {
      const paid = Number(s.paidAmount || s.grandTotal || 0);
      const method = String(s.paymentMethod || '').toLowerCase();

      if (method.includes('bkash') || method.includes('বিকাশ')) bkash += paid;
      else if (method.includes('nagad') || method.includes('নগদ')) nagad += paid;
      else if (method.includes('rocket') || method.includes('রকেট')) rocket += paid;
      else if (method.includes('bank') || method.includes('card') || method.includes('ব্যাংক')) bank += paid;
    });

    return { bkash, nagad, rocket, bank };
  }, [salesHistory]);

  const handleBalanceChange = (field, val) => {
    const clean = val.replace(/[^0-9.]/g, '');
    setActualBalances((prev) => ({ ...prev, [field]: clean }));
  };

  // NBR VAT Calculation on Total Sales
  const vatCalculations = useMemo(() => {
    const rate = VAT_RATES[vatRateType] || 0.05;
    const totalSales = (salesHistory || []).reduce((sum, s) => sum + Number(s.grandTotal || s.total || 0), 0);
    const taxableBase = totalSales / (1 + rate);
    const vatAmount = totalSales - taxableBase;

    return {
      ratePercent: rate * 100,
      totalSales,
      taxableBase: Math.round(taxableBase),
      vatAmount: Math.round(vatAmount)
    };
  }, [salesHistory, vatRateType]);

  const handlePrintMushak63 = () => {
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-pink-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  ব্যাংক/এমএফএস রিকনসিলিয়েশন ও মূসক ৬.৩ হাব
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-400 font-semibold border border-pink-300 dark:border-pink-800">
                  NBR Tax Standard
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                বিকাশ/নগদ স্টেটমেন্ট ভেরিফিকেশন এবং জাতীয় রাজস্ব বোর্ড মূসক-৬.৩ চালান
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
            onClick={() => setActiveTab('mfs_reconcile')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'mfs_reconcile'
                ? 'border-pink-500 text-pink-600 dark:text-pink-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            বিকাশ / নগদ / ব্যাংক রিকনসিলিয়েশন
          </button>
          <button
            onClick={() => setActiveTab('nbr_vat_63')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'nbr_vat_63'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            এনবিআর মূসক-৬.৩ কর চালান ও ভ্যাট অডিট
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {activeTab === 'mfs_reconcile' && (
            <div className="space-y-6">
              <div className="p-3.5 rounded-xl bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800 flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-pink-600 dark:text-pink-400 shrink-0 mt-0.5" />
                <div className="text-xs text-pink-800 dark:text-pink-200 leading-relaxed">
                  <strong>ডিজিটাল পেমেন্ট অডিট:</strong> সফ্টওয়্যারের ডিজিটাল বিক্রয়ের সাথে আপনার বিকাশ মার্চেন্ট অ্যাপ,
                  নগদ একাউন্ট এবং ব্যাংকের প্রকৃত ব্যালেন্স মিলিয়ে দেখুন। কোনো গরমিল বা চার্জের অপচয় থাকলে তা সাথে সাথে
                  শনাক্ত হবে।
                </div>
              </div>

              {/* Grid of Channels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: 'bkash', label: 'বিকাশ মার্চেন্ট (bKash)', icon: '📱', color: 'border-pink-300 text-pink-600' },
                  { id: 'nagad', label: 'নগদ ইসলামিক (Nagad)', icon: '🟠', color: 'border-orange-300 text-orange-600' },
                  { id: 'rocket', label: 'রকেট ডিবিবিএল (Rocket)', icon: '🟣', color: 'border-purple-300 text-purple-600' },
                  { id: 'bank', label: 'ব্যাংক / পিওএস কার্ড (Bank Card)', icon: '🏦', color: 'border-blue-300 text-blue-600' }
                ].map((channel) => {
                  const sysVal = systemRecordedTotals[channel.id] || 0;
                  const actVal = parseFloat(actualBalances[channel.id]) || 0;
                  const diff = actVal - sysVal;
                  const hasInput = actualBalances[channel.id] !== '';

                  return (
                    <div
                      key={channel.id}
                      className="p-4 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <span>{channel.icon}</span> {channel.label}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          সিস্টেমে সেলস: ৳{sysVal.toLocaleString('bn-BD')}
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          মার্চেন্ট অ্যাপের বর্তমান ব্যালেন্স (৳ লিখুন):
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="টাকার সংখ্যা..."
                          value={actualBalances[channel.id]}
                          onChange={(e) => handleBalanceChange(channel.id, e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      </div>

                      {hasInput && (
                        <div
                          className={`p-2.5 rounded-lg text-xs font-semibold flex items-center justify-between ${
                            diff === 0
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                              : diff < 0
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                              : 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300'
                          }`}
                        >
                          <span>ভ্যারিয়েন্স: ৳{Math.abs(diff).toLocaleString('bn-BD')}</span>
                          <span>{diff === 0 ? '✓ ব্যালেন্সড' : diff < 0 ? 'চার্জ বা ঘাটতি' : 'উদ্বৃত্ত ব্যালেন্স'}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'nbr_vat_63' && (
            <div className="space-y-6">
              <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex items-start gap-3">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-800 dark:text-indigo-200 leading-relaxed">
                  <strong>জাতীয় রাজস্ব বোর্ড (NBR) স্ট্যান্ডার্ড:</strong> মূসক ৬.৩ কর চালানপত্র আইন অনুযায়ী প্রতিটি
                  রেজিস্টার্ড ব্যবসায়িক বিক্রয়ের জন্য প্রযোজ্য।
                </div>
              </div>

              {/* VAT Tier Selector */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    ব্যবসায়ের প্রযোজ্য ভ্যাট হার নির্বাচন:
                  </span>
                  <p className="text-[11px] text-slate-500">রিটেইল পিওএস ৫%, রেস্টুরেন্ট ৭.৫%, স্ট্যান্ডার্ড ১৫%</p>
                </div>
                <div className="flex gap-2">
                  {[
                    { id: 'REDUCED_RETAIL', label: '৫% রিটেইল ভ্যাট' },
                    { id: 'SWEETS_RESTAURANT', label: '৭.৫% রেস্টুরেন্ট' },
                    { id: 'STANDARD', label: '১৫% স্ট্যান্ডার্ড' }
                  ].map((tier) => (
                    <button
                      key={tier.id}
                      onClick={() => setVatRateType(tier.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        vatRateType === tier.id
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* NBR Mushak 6.3 Preview Box */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 shadow-lg space-y-4 font-serif">
                <div className="text-center pb-3 border-b border-slate-300 dark:border-slate-700">
                  <h4 className="text-sm font-black tracking-wide text-slate-900 dark:text-white">
                    গণপ্রজাতন্ত্রী বাংলাদেশ সরকার - জাতীয় রাজস্ব বোর্ড
                  </h4>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                    কর চালানপত্র (মূসক-৬.৩)
                  </div>
                  <span className="text-[10px] text-slate-500">[বিধি ৪০ এর উপ-বিধি (১) এর দফা (গ) দ্রষ্টব্য]</span>
                </div>

                <div className="grid grid-cols-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <div>
                    <p>
                      <strong>প্রতিষ্ঠানের নাম:</strong> {businessSettings?.businessName || 'হিসাবকিতাব ৩৬০ এন্টারপ্রাইজ'}
                    </p>
                    <p>
                      <strong>বিআইএন (BIN):</strong> {businessSettings?.binNumber || '002847592-0101'}
                    </p>
                    <p>
                      <strong>ঠিকানা:</strong> {businessSettings?.businessAddress || 'ঢাকা, বাংলাদেশ'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p>
                      <strong>চালান নম্বর:</strong> MSK-20261017-094
                    </p>
                    <p>
                      <strong>ইস্যুর তারিখ ও সময়:</strong> {new Date().toLocaleString('bn-BD')}
                    </p>
                    <p>
                      <strong>ক্রেতার নাম:</strong> খুচরা সাধারণ খদ্দের
                    </p>
                  </div>
                </div>

                {/* Calculation Summary Table */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-xs">
                  <div className="flex justify-between py-1">
                    <span>মোট বিক্রয় মূল্য (ভ্যাটসহ):</span>
                    <span className="font-bold">৳ {vatCalculations.totalSales.toLocaleString('bn-BD')}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>মূল করযোগ্য মূল্য (Taxable Base Value):</span>
                    <span className="font-bold">৳ {vatCalculations.taxableBase.toLocaleString('bn-BD')}</span>
                  </div>
                  <div className="flex justify-between py-1 font-bold text-indigo-600 dark:text-indigo-400">
                    <span>প্রদেয় ভ্যাট ({vatCalculations.ratePercent}%):</span>
                    <span>৳ {vatCalculations.vatAmount.toLocaleString('bn-BD')}</span>
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    onClick={handlePrintMushak63}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition"
                  >
                    <Printer className="w-4 h-4" />
                    মূসক ৬.৩ চালান প্রিন্ট করুন
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs text-slate-500">
          <span>HisabKitab 360 Bank Reconciliation & NBR Tax Engine</span>
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

export default BankMfsReconciliationModal;
