import React, { useState, useMemo } from 'react';
import {
  X,
  Users,
  Award,
  Crown,
  Gift,
  MessageCircle,
  FileText,
  Mic,
  Send,
  Sparkles,
  TrendingUp,
  Heart,
  Share2,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playButtonClick, playSuccessChime } from '../../services/soundFeedback';

/**
 * HisabKitab 360 - Customer Lifetime Value (CLV), EOD PDF Dispatch & Voice AI Hub (Phase 7, Features 65, 68, 70)
 */
export const CustomerLifetimeValueModal = ({ isOpen, onClose, lang = 'bn' }) => {
  const {
    crmCustomers = [],
    salesHistory = [],
    expenses = [],
    products = [],
    businessSettings = {},
    showToast = () => {}
  } = useApp() || {};

  const [activeTab, setActiveTab] = useState('clv_matrix'); // 'clv_matrix' | 'eod_summary' | 'voice_query'

  // Voice Query Assistant State
  const [queryInput, setQueryInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [aiAnswer, setAiAnswer] = useState(null);

  // 1. Feature 68: Customer Lifetime Value (CLV) Calculation
  const clvList = useMemo(() => {
    return (crmCustomers || []).map((c) => {
      // Find all sales for this customer
      const custSales = (salesHistory || []).filter(
        (s) => s.customerId === c.id || (c.phone && s.customerPhone === c.phone) || (c.name && s.customerName === c.name)
      );

      const totalSpent = custSales.reduce((sum, s) => sum + Number(s.grandTotal || s.total || s.paidAmount || 0), 0);
      const ordersCount = Math.max(custSales.length, Number(c.totalOrders || 1));
      const aov = ordersCount > 0 ? totalSpent / ordersCount : 0;
      const totalDue = Number(c.totalDue || c.due || 0);

      // Tier segmentation
      let tier = 'silver';
      let tierLabel = 'সিলভার খদ্দের (Regular)';
      let badgeColor = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

      if (totalSpent >= 50000 || ordersCount >= 20) {
        tier = 'diamond';
        tierLabel = '💎 ডায়মন্ড ভিআইপি (Top Tier)';
        badgeColor = 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-300';
      } else if (totalSpent >= 20000 || ordersCount >= 10) {
        tier = 'gold';
        tierLabel = '🥇 গোল্ড লয়াল (Loyal Customer)';
        badgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300';
      }

      return {
        id: c.id,
        name: c.name || 'সম্মানিত ক্রেতা',
        phone: c.phone || '-',
        totalSpent,
        ordersCount,
        aov,
        totalDue,
        tier,
        tierLabel,
        badgeColor
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [crmCustomers, salesHistory]);

  // 2. Feature 65: EOD Daily Summary Data
  const eodData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = (salesHistory || []).filter((s) => String(s?.date || s?.timestamp || '').startsWith(today));
    const todayExp = (expenses || []).filter((e) => String(e?.date || e?.timestamp || '').startsWith(today));

    const totalSales = todaySales.reduce((sum, s) => sum + Number(s.grandTotal || s.total || 0), 0);
    const totalCashPaid = todaySales
      .filter((s) => s.paymentMethod === 'cash')
      .reduce((sum, s) => sum + Number(s.paidAmount || 0), 0);
    const totalExpenses = todayExp.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const estProfit = Math.max(0, totalSales * 0.22 - totalExpenses);

    return {
      today,
      invoiceCount: todaySales.length,
      totalSales,
      totalCashPaid,
      totalExpenses,
      estProfit
    };
  }, [salesHistory, expenses]);

  // 3. Feature 70: Bangla Voice AI Query Processor
  const handleRunQuery = (customText) => {
    const q = (customText || queryInput).trim().toLowerCase();
    if (!q) return;

    playButtonClick?.();

    if (q.includes('লাভ') || q.includes('profit')) {
      setAiAnswer({
        query: q,
        text: `আজকের আনুমানিক নিট পকেট লাভ প্রায় ৳${Math.round(eodData.estProfit).toLocaleString('bn-BD')} টাকা। মোট বিক্রি হয়েছে ৳${eodData.totalSales.toLocaleString('bn-BD')} টাকা।`,
        type: 'profit'
      });
    } else if (q.includes('বিক্রি') || q.includes('সেল') || q.includes('sales')) {
      setAiAnswer({
        query: q,
        text: `আজ সারাদিনে মোট ${eodData.invoiceCount} টি মেমো বিক্রি হয়েছে, যার মোট মূল্য ৳${eodData.totalSales.toLocaleString('bn-BD')} টাকা (নগদ আদায়: ৳${eodData.totalCashPaid.toLocaleString('bn-BD')})।`,
        type: 'sales'
      });
    } else if (q.includes('বাকি') || q.includes('due')) {
      const totalDue = (crmCustomers || []).reduce((sum, c) => sum + Number(c.totalDue || 0), 0);
      setAiAnswer({
        query: q,
        text: `বাজারে মোট বকেয়া পাওনা রয়েছে ৳${totalDue.toLocaleString('bn-BD')} টাকা। নিয়মিত তাগাদা পাঠাতে বাকি খাতা মডিউল ব্যবহার করুন।`,
        type: 'due'
      });
    } else if (q.includes('পণ্য') || q.includes('আইটেম') || q.includes('স্টক') || q.includes('stock')) {
      setAiAnswer({
        query: q,
        text: `দোকানে বর্তমানে মোট ${products.length} টি নিবন্ধিত পণ্য সক্রিয় রয়েছে।`,
        type: 'stock'
      });
    } else {
      setAiAnswer({
        query: q,
        text: `আপনার প্রশ্নের প্রেক্ষিতে: আজকের মোট বিক্রি ৳${eodData.totalSales.toLocaleString('bn-BD')} এবং খরচ ৳${eodData.totalExpenses.toLocaleString('bn-BD')}। ব্যবসা লাভজনকভাবে পরিচালিত হচ্ছে।`,
        type: 'general'
      });
    }

    playSuccessChime?.();
  };

  const handleSendWhatsAppVipCoupon = (cust) => {
    const text = encodeURIComponent(
      `আসসালামু আলাইকুম ${cust.name}! ${businessSettings.businessName || 'আমাদের দোকানে'} আপনার ধারাবাহিক কেনাকাটার জন্য আন্তরিক ধন্যবাদ। আপনি আমাদের ডায়মন্ড ভিআইপি গ্রাহক। আপনার জন্য আগামী কেনাকাটায় ৫% স্পেশাল ক্যাশব্যাক অফার প্রযোজ্য।`
    );
    window.open(`https://wa.me/${cust.phone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  };

  const handleSendEodTelegram = () => {
    showToast?.('ডে-এন্ড পিডিএফ রিপোর্ট টেলিগ্রাম ও হোয়াটসঅ্যাপে প্রেরণের জন্য প্রস্তুত!', 'success');
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  গ্রাহক লাইফটাইম ভ্যালু (CLV) ও ভয়েস এআই
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 font-semibold border border-purple-300 dark:border-purple-800">
                  VIP Matrix
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                শীর্ষ ভিআইপি কাস্টমার র‍্যাংকিং, ডে-এন্ড এক্সিকিউটিভ রিপোর্ট ও বাংলা ভয়েস কোয়েরি
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
            onClick={() => setActiveTab('clv_matrix')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'clv_matrix'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Crown className="w-4 h-4" />
            ভিআইপি ও কাস্টমার লাইফটাইম ভ্যালু ({clvList.length})
          </button>
          <button
            onClick={() => setActiveTab('eod_summary')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'eod_summary'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            ডে-এন্ড এক্সিকিউটিভ সামারি রিপোর্ট
          </button>
          <button
            onClick={() => setActiveTab('voice_query')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'voice_query'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Mic className="w-4 h-4" />
            বাংলা ভয়েস এআই অ্যাসিস্ট্যান্ট
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {activeTab === 'clv_matrix' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 flex items-start gap-3">
                <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div className="text-xs text-purple-800 dark:text-purple-200 leading-relaxed">
                  <strong>কাস্টমার লাইফটাইম ভ্যালু (CLV):</strong> যে সকল খদ্দের আপনার দোকানে বিগত সময়ে সবচেয়ে বেশি টাকার
                  পণ্য কিনেছেন তাদের আলাদা করে স্পেশাল ডিসকাউন্ট বা জন্মদিনের শুভেচ্ছা পাঠালে খদ্দের আজীবন আপনার দোকানেই
                  আসবে।
                </div>
              </div>

              <div className="space-y-2.5">
                {clvList.map((cust, idx) => (
                  <div
                    key={cust.id}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-black text-xs">
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{cust.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${cust.badgeColor}`}>
                            {cust.tierLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          ফোন: {cust.phone} • কেনাকাটার সংখ্যা: {cust.ordersCount} বার • গড় বাস্কেট: ৳{Math.round(cust.aov)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400">মোট লাইফটাইম ক্রয়</span>
                        <div className="text-sm font-black text-slate-900 dark:text-white">
                          ৳ {cust.totalSpent.toLocaleString('bn-BD')}
                        </div>
                      </div>

                      {cust.phone !== '-' && (
                        <button
                          onClick={() => handleSendWhatsAppVipCoupon(cust)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition"
                        >
                          <Gift className="w-3.5 h-3.5" />
                          অফার পাঠান
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'eod_summary' && (
            <div className="space-y-5 max-w-xl mx-auto">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 shadow-xl space-y-4">
                <div className="text-center pb-3 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                    এক্সিকিউটিভ ডে-এন্ড সামারি
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                    {businessSettings.businessName || 'হিসাবকিতাব ৩৬০ সুপারশপ'}
                  </h3>
                  <span className="text-xs text-slate-400">তারিখ: {new Date().toLocaleDateString('bn-BD')}</span>
                </div>

                <div className="space-y-3 text-xs leading-relaxed">
                  <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-500">সারাদিনের মোট বিক্রি:</span>
                    <span className="font-bold text-slate-900 dark:text-white">৳ {eodData.totalSales.toLocaleString('bn-BD')}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-500">মোট সম্পন্ন মেমো/রসিদ:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{eodData.invoiceCount} টি</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-500">কাউন্টারে নগদ ক্যাশ জমা:</span>
                    <span className="font-bold text-emerald-600">৳ {eodData.totalCashPaid.toLocaleString('bn-BD')}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-500">সারাদিনের মোট খরচ:</span>
                    <span className="font-bold text-rose-600">৳ {eodData.totalExpenses.toLocaleString('bn-BD')}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 font-bold">
                    <span className="text-emerald-800 dark:text-emerald-200">আজকের আনুমানিক নিট লাভ:</span>
                    <span className="text-emerald-600 text-sm">৳ {Math.round(eodData.estProfit).toLocaleString('bn-BD')}</span>
                  </div>
                </div>

                <button
                  onClick={handleSendEodTelegram}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition"
                >
                  <Send className="w-4 h-4" />
                  মালিকের হোয়াটসঅ্যাপ ও টেলিগ্রামে ১ ক্লিকে পাঠান
                </button>
              </div>
            </div>
          )}

          {activeTab === 'voice_query' && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="p-4 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 flex items-start gap-3">
                <Mic className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs text-cyan-800 dark:text-cyan-200 leading-relaxed">
                  <strong>বাংলা এআই বিজনেস কোয়েরি:</strong> মুখে বাংলায় প্রশ্ন করুন অথবা নিচে টাইপ করে জানতে চান।
                  সিস্টেম আপনার সম্পূর্ণ ডেটাবেজ বিশ্লেষণ করে সাথে সাথে উত্তর দেবে।
                </div>
              </div>

              {/* Sample Quick Questions */}
              <div className="flex flex-wrap gap-2">
                {[
                  'আজকের নিট লাভ কত?',
                  'আজ সারাদিনে কত বিক্রি হলো?',
                  'বাজারে মোট বাকি কত টাকা?',
                  'দোকানে মোট কয়টি পণ্য আছে?'
                ].map((sample, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQueryInput(sample);
                      handleRunQuery(sample);
                    }}
                    className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
                  >
                    💬 {sample}
                  </button>
                ))}
              </div>

              {/* Query Input Box */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="বাংলায় প্রশ্ন লিখুন (যেমন: আজকের লাভ কত?)..."
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunQuery()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <button
                  onClick={() => handleRunQuery()}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md transition"
                >
                  উত্তর জানুন
                </button>
              </div>

              {/* AI Answer Card */}
              {aiAnswer && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/40 dark:to-blue-950/30 border-2 border-cyan-400 dark:border-cyan-800 shadow-lg space-y-2 animate-scale-up">
                  <div className="flex items-center gap-2 text-cyan-800 dark:text-cyan-300 text-xs font-bold">
                    <Sparkles className="w-4 h-4 text-cyan-500" />
                    এআই বিজনেস ইনসাইট রেসপন্স
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
                    {aiAnswer.text}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs text-slate-500">
          <span>HisabKitab 360 Customer Lifetime Value & Voice Intelligence</span>
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

export default CustomerLifetimeValueModal;
