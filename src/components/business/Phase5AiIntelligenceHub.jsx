import React, { useState, useEffect } from 'react';
import {
  Brain,
  TrendingDown,
  TrendingUp,
  CreditCard,
  ShoppingCart,
  Scan,
  Mic,
  MicOff,
  Clock,
  UserX,
  Award,
  Tags,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Package,
  Volume2,
  Copy,
  Check,
  Send,
  Zap
} from 'lucide-react';

import predictiveStockForecastingService from '../../services/predictiveStockForecastingService';
import customerCreditScoringService from '../../services/customerCreditScoringService';
import basketCrossSellEngine from '../../services/basketCrossSellEngine';
import ocrInvoiceParserService from '../../services/ocrInvoiceParserService';
import bengaliVoiceCommandDispatcher from '../../services/bengaliVoiceCommandDispatcher';
import expiryMarkdownEngine from '../../services/expiryMarkdownEngine';
import churnPredictionService from '../../services/churnPredictionService';
import supplierScoringService from '../../services/supplierScoringService';
import expenseAutoClassifierService from '../../services/expenseAutoClassifierService';
import dynamicTierPricingEngine from '../../services/dynamicTierPricingEngine';

export default function Phase5AiIntelligenceHub({
  products = [],
  salesHistory = [],
  customers = [],
  suppliers = [],
  businessSettings = {}
}) {
  const [activeTab, setActiveTab] = useState('stock_forecasting');
  const [copiedKey, setCopiedKey] = useState('');

  // Sample data fallback if empty
  const sampleProducts = products.length > 0 ? products : [
    { id: 'p1', name: 'মিনিকেট চাল (২৫ কেজি)', stock: 12, sellingPrice: 1850, costPrice: 1600, expiryDate: '2026-11-20' },
    { id: 'p2', name: 'রূপচাঁদা সয়াবিন তেল (৫ লিটার)', stock: 4, sellingPrice: 940, costPrice: 850, expiryDate: '2026-10-18' },
    { id: 'p3', name: 'তীর চিনি (১ কেজি)', stock: 45, sellingPrice: 135, costPrice: 120, expiryDate: '2027-01-10' },
    { id: 'p4', name: 'লাক্স সাবান (১০০ গ্রাম)', stock: 2, sellingPrice: 65, costPrice: 52, expiryDate: '2026-10-25' },
    { id: 'p5', name: 'প্যারাসিটামল ৫০০ মিগ্রা (পাতা)', stock: 80, sellingPrice: 30, costPrice: 22, expiryDate: '2026-10-15' }
  ];

  const sampleCustomers = customers.length > 0 ? customers : [
    { id: 'c1', name: 'আব্দুর রহিম ট্রেডার্স', phone: '01711223344', balance: 45000, creditLimit: 50000, createdAt: '2025-01-10' },
    { id: 'c2', name: 'করিম সাহেব', phone: '01819887766', balance: 5000, creditLimit: 20000, createdAt: '2025-06-12' },
    { id: 'c3', name: 'সোবহান স্টোর', phone: '01911445566', balance: 88000, creditLimit: 60000, createdAt: '2024-11-01' }
  ];

  const sampleSuppliers = suppliers.length > 0 ? suppliers : [
    { id: 's1', name: 'মেঘনা গ্রুপ ডিস্ট্রিবিউশন', phone: '01700112233', company: 'Meghna Group' },
    { id: 's2', name: 'সিটি গ্রুপ সাপ্লাই', phone: '01800223344', company: 'City Group' },
    { id: 's3', name: 'আকিজ ভেন্ডর কনসোর্টিয়াম', phone: '01900334455', company: 'Akij Ltd' }
  ];

  // 1. Stock Forecasting State
  const [stockForecasts, setStockForecasts] = useState([]);
  useEffect(() => {
    const res = predictiveStockForecastingService.forecastInventory(sampleProducts, salesHistory, 5);
    setStockForecasts(res);
  }, [products, salesHistory]);

  // 2. Customer Credit Score State
  const [creditScores, setCreditScores] = useState([]);
  useEffect(() => {
    const scores = customerCreditScoringService.evaluateAllCustomers(sampleCustomers, salesHistory);
    setCreditScores(scores);
  }, [customers, salesHistory]);

  // 3. Basket Cross-Sell State
  const [cartSim, setCartSim] = useState([sampleProducts[0]]);
  const [crossSellSuggestions, setCrossSellSuggestions] = useState([]);
  useEffect(() => {
    const suggestions = basketCrossSellEngine.getRecommendationsForCart(cartSim, sampleProducts, salesHistory);
    setCrossSellSuggestions(suggestions);
  }, [cartSim, products, salesHistory]);

  // 4. OCR Invoice Parser State
  const [ocrInput, setOcrInput] = useState(`মেসার্স নিউ ব্রাদার্স ট্রেডার্স
মেমো নং: INV-2026-781
তারিখ: 12/10/2026
মিনিকেট চাল 25 কেজি @ 1800 45000
সয়াবিন তেল 10 লিটার @ 180 1800
চিনি 50 কেজি @ 130 6500
সাবটোটাল: 53300
ভ্যাট: 800
সর্বমোট: 54100`);
  const [parsedInvoice, setParsedInvoice] = useState(null);

  const handleParseOcr = () => {
    const res = ocrInvoiceParserService.parseInvoice(ocrInput);
    setParsedInvoice(res);
  };

  // 5. Bengali Voice Dispatcher State
  const [isListening, setIsListening] = useState(false);
  const [voiceLog, setVoiceLog] = useState([]);
  const [testVoiceText, setTestVoiceText] = useState('৫ কেজি চাল বিক্রি করো');

  useEffect(() => {
    const unsubscribe = bengaliVoiceCommandDispatcher.subscribe((event) => {
      if (event.type === 'STATUS') {
        setIsListening(event.isListening);
      } else if (event.type === 'INTENT') {
        setVoiceLog(prev => [event, ...prev.slice(0, 9)]);
      }
    });
    return unsubscribe;
  }, []);

  const handleSimulateVoice = () => {
    bengaliVoiceCommandDispatcher.handleTranscript(testVoiceText);
    bengaliVoiceCommandDispatcher.speakBengali('আপনার ভয়েস কমান্ড সফলভাবে প্রসেস করা হয়েছে');
  };

  // 6. Expiry Markdown State
  const [expiryReport, setExpiryReport] = useState({ items: [], summary: {} });
  useEffect(() => {
    const rep = expiryMarkdownEngine.auditInventoryExpiry(sampleProducts);
    setExpiryReport(rep);
  }, [products]);

  // 7. Churn Retention State
  const [churnRiskList, setChurnRiskList] = useState([]);
  useEffect(() => {
    const list = churnPredictionService.analyzeCustomerBase(sampleCustomers, salesHistory);
    setChurnRiskList(list);
  }, [customers, salesHistory]);

  // 8. Supplier Scoring State
  const [supplierScores, setSupplierScores] = useState([]);
  useEffect(() => {
    const list = supplierScoringService.scoreAllSuppliers(sampleSuppliers, []);
    setSupplierScores(list);
  }, [suppliers]);

  // 9. Smart Expense Classifier State
  const [expenseNote, setExpenseNote] = useState('দোকানের গত মাসের বিদ্যুৎ বিল ও পানি বিল প্রদান');
  const [expenseAmount, setExpenseAmount] = useState('3450');
  const [classifiedExpense, setClassifiedExpense] = useState(null);

  const handleClassifyExpense = () => {
    const res = expenseAutoClassifierService.classifyExpense(expenseNote, Number(expenseAmount));
    setClassifiedExpense(res);
  };

  // 10. Tier Pricing State
  const [tierQuantity, setTierQuantity] = useState(30);
  const [tierCustomerType, setTierCustomerType] = useState('WHOLESALE');
  const [tierResult, setTierResult] = useState(null);

  useEffect(() => {
    if (sampleProducts[0]) {
      const res = dynamicTierPricingEngine.calculateTierPrice(sampleProducts[0], tierQuantity, tierCustomerType);
      setTierResult(res);
    }
  }, [tierQuantity, tierCustomerType, products]);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 text-white shadow-2xl space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-gradient-to-tr from-cyan-600 to-indigo-600 rounded-xl shadow-lg shadow-cyan-500/20 text-white">
              <Brain className="w-6 h-6 animate-pulse" />
            </span>
            <div>
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                এআই ও বিজনেস ইন্টেলিজেন্স হাব
              </h2>
              <p className="text-xs md:text-sm text-slate-400">
                স্বয়ংক্রিয় স্টক পূর্বাভাস, এআই ভয়েস কমান্ড, ঝুড়ি অ্যানালাইসিস ও গ্রাহক ঝুঁকি রেটিং
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            ১০টি এআই সার্ভিস সক্রিয়
          </span>
        </div>
      </div>

      {/* Modern Tabs Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
        {[
          { id: 'stock_forecasting', label: 'স্টক পূর্বাভাস', icon: TrendingDown },
          { id: 'credit_scoring', label: 'স্মার্ট ক্রেডিট স্কোর', icon: CreditCard },
          { id: 'cross_sell', label: 'ঝুড়ি ক্রস-সেলিং', icon: ShoppingCart },
          { id: 'ocr_parser', label: 'ওসিআর ইনভয়েস রিডার', icon: Scan },
          { id: 'voice_dispatcher', label: 'বাংলা ভয়েস সহকারী', icon: Mic },
          { id: 'expiry_markdown', label: 'মেয়াদ ক্লিয়ারেন্স', icon: Clock },
          { id: 'churn_retention', label: 'কাস্টমার চার্ন', icon: UserX },
          { id: 'supplier_score', label: 'ভেন্ডর রেটিং', icon: Award },
          { id: 'expense_classifier', label: 'খরচ ক্লাসিফায়ার', icon: Tags },
          { id: 'tier_pricing', label: 'হোলসেল রেট', icon: DollarSign }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: PREDICTIVE STOCK FORECASTING */}
      {activeTab === 'stock_forecasting' && (
        <div className="space-y-4">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h3 className="text-base font-semibold text-cyan-300 flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                প্রিডিক্টিভ স্টকআউট ও রি-অর্ডার ক্যালকুলেটর
              </h3>
              <p className="text-xs text-slate-400">
                বিক্রয় গতিবেগ ও সরবরাহকারী লিড-টাইম বিশ্লেষণ করে মাল ফুরিয়ে যাওয়ার সম্ভাব্য দিন গণনা
              </p>
            </div>
            <button
              onClick={() => setStockForecasts(predictiveStockForecastingService.forecastInventory(sampleProducts, salesHistory, 5))}
              className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
            >
              <Zap className="w-3.5 h-3.5" /> পুনরায় হিসেব করুন
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stockForecasts.map(f => (
              <div
                key={f.productId}
                className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-sm text-slate-100">{f.productName}</h4>
                    <span className="text-[11px] text-slate-400">দৈনিক বিক্রয় গড়: {f.dailyRunRate} টি</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      f.urgency === 'DEPLETED'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : f.urgency === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : f.urgency === 'WARNING'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {f.urgency}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">বর্তমান স্টক</span>
                    <span className="font-bold text-slate-200">{f.currentStock} টি</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">স্টকআউট হতে বাকি</span>
                    <span className="font-bold text-cyan-400">{f.daysUntilStockout} দিন</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">রি-অর্ডার পয়েন্ট</span>
                    <span className="font-bold text-amber-300">{f.reorderPoint} টি</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">সুপারিশকৃত অর্ডার</span>
                    <span className="font-bold text-emerald-400">{f.suggestedReorderQty} টি</span>
                  </div>
                </div>

                {f.isReorderNeeded && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>অবিলম্বে নতুন অর্ডারের তাগিদ দিন (স্টক সীমা পার হয়েছে)</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: CUSTOMER CREDIT SCORING */}
      {activeTab === 'credit_scoring' && (
        <div className="space-y-4">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <h3 className="text-base font-semibold text-cyan-300 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              স্মার্ট ক্রেডিট স্কোরিং ও ঝুঁকি মূল্যায়ন
            </h3>
            <p className="text-xs text-slate-400">
              পরিশোধের ধারাবাহিকতা, বকেয়া-টার্নওভার অনুপাত ও লয়ালটি অনুযায়ী ০-১০০ স্কেলে গ্রাহক মূল্যায়ন
            </p>
          </div>

          <div className="space-y-3">
            {creditScores.map(c => (
              <div
                key={c.customerId}
                className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-slate-100">{c.customerName}</h4>
                    <span
                      style={{ backgroundColor: `${c.badgeColor}20`, color: c.badgeColor, borderColor: `${c.badgeColor}50` }}
                      className="px-2 py-0.5 rounded text-[11px] font-bold border"
                    >
                      স্কোর: {c.score}/১০০ ({c.riskTier})
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">মোবাইল: {c.phone} | বর্তমান বকেয়া: ৳{c.totalDue.toLocaleString()}</p>
                  <p className="text-xs text-slate-300 font-medium">{c.riskLabelBn}</p>
                </div>

                <div className="flex flex-col md:items-end gap-1.5 text-xs">
                  <span className="text-slate-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                    পরামর্শ: <span className="font-semibold text-cyan-300">{c.recommendedAction}</span>
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    প্রস্তাবিত সর্বোচ্চ বাকির সিলিং: <strong className="text-emerald-400">৳{c.suggestedCreditCeiling.toLocaleString()}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: BASKET CROSS-SELL ENGINE */}
      {activeTab === 'cross_sell' && (
        <div className="space-y-4">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <h3 className="text-base font-semibold text-cyan-300 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              স্মার্ট ঝুড়ি বিশ্লেষণ ও ক্রস-সেলিং ইঞ্জিন
            </h3>
            <p className="text-xs text-slate-400">
              Apriori অ্যালগরিদম ভিত্তিক কো-পারচেজ সম্পর্ক - ক্যাশিয়ারের সামনে স্বয়ংক্রিয় অ্যাড-অন প্রস্তাবনা
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">বর্তমান বিক্রয় কার্ট (নমুনা)</h4>
              <div className="space-y-2">
                {cartSim.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-sm font-medium text-slate-200">{item.name}</span>
                    <span className="text-xs text-emerald-400 font-semibold">৳{item.sellingPrice}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setCartSim([sampleProducts[0], sampleProducts[1]])}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-200"
                >
                  কার্টে তেল যোগ করুন
                </button>
                <button
                  onClick={() => setCartSim([sampleProducts[0]])}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-200"
                >
                  রিসেট কার্ট
                </button>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                এআই রিকমেন্ডেড ক্রস-সেল প্রডাক্টস
              </h4>
              {crossSellSuggestions.length > 0 ? (
                <div className="space-y-2">
                  {crossSellSuggestions.map((rec, idx) => (
                    <div key={idx} className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-lg flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-sm text-cyan-200">{rec.product.name}</div>
                        <div className="text-[11px] text-cyan-400/80">{rec.reasonBn}</div>
                      </div>
                      <button
                        onClick={() => setCartSim(prev => [...prev, rec.product])}
                        className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-medium"
                      >
                        + যোগ করুন
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-900 rounded-lg text-center text-xs text-slate-400">
                  সাধারণ সমন্বিত পণ্য: চিনি ও ডাল ক্রয়ের প্রবণতা দেখা গেছে (কনফিডেন্স: ৮২%)
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: OCR INVOICE PARSER */}
      {activeTab === 'ocr_parser' && (
        <div className="space-y-4">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <h3 className="text-base font-semibold text-cyan-300 flex items-center gap-2">
              <Scan className="w-4 h-4" />
              ওসিআর ইনভয়েস ও ক্রয় মেমো পার্সার
            </h3>
            <p className="text-xs text-slate-400">
              ক্যামেরা বা স্ক্যানার থেকে ক্রয় চালানের টেক্সট পড়ে স্বয়ংক্রিয় আইটেম, দর ও ভ্যাট এক্সট্রাক্ট করুন
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">স্ক্যানকৃত ইনভয়েস টেক্সট (বাংলা / ইংরেজি)</label>
              <textarea
                value={ocrInput}
                onChange={e => setOcrInput(e.target.value)}
                rows={9}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleParseOcr}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2"
              >
                <Scan className="w-4 h-4" /> টেক্সট পার্স ও চালানে রূপান্তর করুন
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">পার্সকৃত ক্রয় চালান ফলাফল</h4>
              {parsedInvoice ? (
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">মেমো নং:</span>
                    <span className="font-mono font-bold text-cyan-400">{parsedInvoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">সরবরাহকারী:</span>
                    <span className="font-semibold text-slate-200">{parsedInvoice.supplierName}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 block text-[11px]">আইটেম তালিকা ({parsedInvoice.itemCount} টি):</span>
                    {parsedInvoice.lineItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between bg-slate-900 p-2 rounded text-[11px]">
                        <span className="text-slate-200">{item.name} ({item.quantity} একক)</span>
                        <span className="font-mono text-emerald-400">৳{item.total}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm">
                    <span className="text-slate-300">সর্বমোট (Grand Total):</span>
                    <span className="text-emerald-400 font-mono">৳{parsedInvoice.grandTotal}</span>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  বামপাশের বাটনে ক্লিক করে পার্স করুন
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: BENGALI VOICE COMMAND DISPATCHER */}
      {activeTab === 'voice_dispatcher' && (
        <div className="space-y-4">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <h3 className="text-base font-semibold text-cyan-300 flex items-center gap-2">
              <Mic className="w-4 h-4" />
              এআই বাংলা ভয়েস কমান্ড ও পিওএস ডিসপ্যাচার
            </h3>
            <p className="text-xs text-slate-400">
              বাংলা প্রাকৃতিক ভাষায় কথা বলে কার্টে পণ্য যোগ, বাকি অনুসন্ধান ও মেমো প্রিন্ট করুন
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">লাইভ মাইক্রোফোন লিসেনার</span>
                <button
                  onClick={() => {
                    if (isListening) bengaliVoiceCommandDispatcher.stopListening();
                    else bengaliVoiceCommandDispatcher.startListening();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  {isListening ? 'শোনা বন্ধ করুন' : 'মাইক চালু করুন'}
                </button>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-700/50">
                <label className="text-xs text-slate-400">কমান্ড সিমুলেশন টেস্ট:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testVoiceText}
                    onChange={e => setTestVoiceText(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                    placeholder="যেমন: ৫ কেজি চাল বিক্রি করো"
                  />
                  <button
                    onClick={handleSimulateVoice}
                    className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shrink-0"
                  >
                    চালান
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300 block">সমর্থিত কিছু কমান্ডের উদাহরণ:</span>
                <div>• &quot;৫ কেজি চাল বিক্রি করো&quot; ➔ কার্টে ৫টি চাল যোগ</div>
                <div>• &quot;বাকি কত আছে&quot; ➔ বকেয়া লেজার ও ভয়েস উত্তর</div>
                <div>• &quot;আজকের মোট বিক্রি কত&quot; ➔ দৈনিক বিক্রয় রিপোর্ট</div>
                <div>• &quot;মেমো প্রিন্ট করো&quot; ➔ থার্মাল প্রিন্ট ট্রিগার</div>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">ভয়েস কমান্ড এক্সিকিউশন হিস্ট্রি</h4>
              {voiceLog.length > 0 ? (
                <div className="space-y-2">
                  {voiceLog.map((log, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="font-semibold">&quot;{log.transcript}&quot;</span>
                        <span className="px-1.5 py-0.5 bg-cyan-900/40 text-cyan-400 rounded text-[10px] font-mono">
                          {log.parsed?.intent}
                        </span>
                      </div>
                      {log.parsed?.productQuery && (
                        <div className="text-[11px] text-slate-400">
                          পণ্য: <span className="text-emerald-400">{log.parsed.productQuery}</span>, পরিমাণ: {log.parsed.quantity}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  কোনো ভয়েস কমান্ড পাওয়া যায়নি
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: EXPIRY MARKDOWN CLEARANCE */}
      {activeTab === 'expiry_markdown' && (
        <div className="space-y-4">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h3 className="text-base font-semibold text-cyan-300 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                ডায়নামিক এক্সপায়রি ডিসকাউন্ট ও ক্লিয়ারেন্স সেল
              </h3>
              <p className="text-xs text-slate-400">
                মেয়াদ শেষের আর কতদিন বাকি তা অনুযায়ী স্বয়ংক্রিয় ১০%, ২৫%, ৫০% ছাড় দিয়ে মোট ক্ষতি প্রতিরোধ
              </p>
            </div>
            <div className="text-right text-xs">
              <span className="text-slate-400 block text-[11px]">সম্ভাব্য ক্লিয়ারেন্স রিকভারি:</span>
              <span className="font-bold text-emerald-400 text-sm">৳{expiryReport.summary.totalClearancePotential?.toLocaleString() || 0}</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {expiryReport.items.map(item => (
              <div
                key={item.productId}
                className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-slate-100">{item.name}</h4>
                    <span
                      style={{ backgroundColor: `${item.badgeColor}20`, color: item.badgeColor, borderColor: `${item.badgeColor}50` }}
                      className="px-2 py-0.5 rounded text-[10px] font-bold border"
                    >
                      মেয়াদ বাকি: {item.daysRemaining} দিন
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">ব্যাচ: {item.batchNo} | মেয়াদ: {item.expiryDate} | স্টক: {item.stockQty} টি</p>
                  <p className="text-xs text-slate-300 font-medium">{item.urgencyBn}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-slate-400 line-through text-xs block">৳{item.basePrice}</span>
                    <span className="font-bold text-sm text-cyan-300">ক্লিয়ারেন্স দর: ৳{item.markdownPrice}</span>
                  </div>
                  {item.discountPercent > 0 && (
                    <span className="px-2.5 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-lg text-xs font-bold">
                      -{item.discountPercent}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 7: CHURN PREDICTION */}
      {activeTab === 'churn_retention' && (
        <div className="space-y-4">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <h3 className="text-base font-semibold text-cyan-300 flex items-center gap-2">
              <UserX className="w-4 h-4" />
              কাস্টমার চার্ন প্রেডিকশন ও রিভাইভাল এসএমএস
            </h3>
            <p className="text-xs text-slate-400">
              RFM মডেলের মাধ্যমে নিষ্ক্রিয় গ্রাহকদের চিহ্নিত করে স্বয়ংক্রিয় অফার ও রি-এনগেজমেন্ট এসএমএস তৈরি
            </p>
          </div>

          <div className="space-y-3">
            {churnRiskList.map(c => (
              <div
                key={c.customerId}
                className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-3"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-slate-100">{c.customerName}</h4>
                      <span
                        style={{ backgroundColor: `${c.badgeColor}20`, color: c.badgeColor, borderColor: `${c.badgeColor}50` }}
                        className="px-2 py-0.5 rounded text-[10px] font-bold border"
                      >
                        চার্ন ঝুঁকি: {c.churnProbability}% ({c.statusBn})
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">সর্বশেষ কেনাকাটা: {c.daysSinceLastVisit} দিন পূর্বে</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-2">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>প্রস্তাবিত রিভাইভাল এসএমএস:</span>
                    <button
                      onClick={() => copyToClipboard(c.reEngagementSms, c.customerId)}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
                    >
                      {copiedKey === c.customerId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      কপি করুন
                    </button>
                  </div>
                  <p className="text-slate-200 font-sans italic leading-relaxed">{c.reEngagementSms}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 8: SUPPLIER SCORECARD */}
      {activeTab === 'supplier_score' && (
        <div className="space-y-4">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <h3 className="text-base font-semibold text-cyan-300 flex items-center gap-2">
              <Award className="w-4 h-4" />
              ভেন্ডর পারফরম্যান্স স্কোরকার্ড ও লিড-টাইম অ্যানালিটিক্স
            </h3>
            <p className="text-xs text-slate-400">
              সময়মতো ডেলিভারি হার, পূরণকৃত পণ্যের অনুপাত ও রিটার্ন হারের ভিত্তিতে ভেন্ডর গ্রেডিং (A+, A, B, C)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {supplierScores.map(s => (
              <div
                key={s.supplierId}
                className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-sm text-slate-100">{s.name}</h4>
                    <span className="text-xs text-slate-400">{s.company}</span>
                  </div>
                  <span
                    style={{ backgroundColor: `${s.badgeColor}20`, color: s.badgeColor, borderColor: `${s.badgeColor}50` }}
                    className="px-2 py-0.5 rounded text-xs font-bold border"
                  >
                    গ্রেড: {s.grade}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">অন-টাইম ডেলিভারি</span>
                    <span className="font-bold text-emerald-400">{s.onTimeRate}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">অর্ডার পূরণ হার</span>
                    <span className="font-bold text-cyan-400">{s.fillRate}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">গড় লিড-টাইম</span>
                    <span className="font-bold text-amber-300">{s.avgLeadTimeDays} দিন</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">গুণগত মান স্কোর</span>
                    <span className="font-bold text-indigo-400">{s.qualityRate}%</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-800/60">
                  {s.recommendationBn}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 9: EXPENSE AUTO CLASSIFIER */}
      {activeTab === 'expense_classifier' && (
        <div className="space-y-4">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <h3 className="text-base font-semibold text-cyan-300 flex items-center gap-2">
              <Tags className="w-4 h-4" />
              স্মার্ট খরচ ক্যাটাগরাইজার ও লেজার হেড ক্লাসিফায়ার
            </h3>
            <p className="text-xs text-slate-400">
              অসংগঠিত খরচের বিবরণী পড়ে স্বয়ংক্রিয় হিসাবের খতিয়ানে (Utility, Rent, Entertainment ইত্যাদি) ম্যাপিং
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">খরচের বিবরণী (বাংলা / ইংরেজি)</label>
                <input
                  type="text"
                  value={expenseNote}
                  onChange={e => setExpenseNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">টাকার পরিমাণ (৳)</label>
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={e => setExpenseAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
              </div>
              <button
                onClick={handleClassifyExpense}
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold"
              >
                এআই ক্লাসিফিকেশন রান করুন
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">চিহ্নিত খতিয়ান হেড</h4>
              {classifiedExpense ? (
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-cyan-950/30 border border-cyan-800/50 rounded-lg space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-cyan-300">{classifiedExpense.category.nameBn}</span>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded font-bold">
                        কনফিডেন্স: {Math.round(classifiedExpense.confidence * 100)}%
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block">{classifiedExpense.category.nameEn}</span>
                    <span className="text-[11px] text-slate-300">
                      কর কর্তনযোগ্য (Tax Deductible): {classifiedExpense.isTaxDeductible ? 'হ্যাঁ (Yes)' : 'না (No)'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  বামপাশের টেস্ট বাটনে চাপুন
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 10: DYNAMIC TIER PRICING */}
      {activeTab === 'tier_pricing' && (
        <div className="space-y-4">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <h3 className="text-base font-semibold text-cyan-300 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              পাইকারি বনাম খুচরা ভলিউম টিয়ার প্রাইসিং ইঞ্জিন
            </h3>
            <p className="text-xs text-slate-400">
              পরিমাণের ওপর ভিত্তি করে স্বয়ংক্রিয় টিয়ার পরিবর্তন (১-৫ খুচরা, ৬-২৪ সেমি-হোলসেল, ২৫+ মাস্টার হোলসেল)
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">পণ্য: {sampleProducts[0]?.name}</label>
                <span className="text-[11px] text-slate-400">খুচরা দর: ৳{sampleProducts[0]?.sellingPrice} | ক্রয়মূল্য: ৳{sampleProducts[0]?.costPrice}</span>
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">অর্ডারকৃত পরিমাণ (Quantity): {tierQuantity} টি</label>
                <input
                  type="range"
                  min="1"
                  max="120"
                  value={tierQuantity}
                  onChange={e => setTierQuantity(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
              <div className="flex gap-2">
                {['RETAIL', 'WHOLESALE', 'VIP'].map(type => (
                  <button
                    key={type}
                    onClick={() => setTierCustomerType(type)}
                    className={`flex-1 py-1.5 rounded text-xs font-semibold ${
                      tierCustomerType === type ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">ডায়নামিক প্রাইসিং ফলাফল</h4>
              {tierResult && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">সক্রিয় টিয়ার:</span>
                    <span className="font-bold text-cyan-300">{tierResult.tierNameBn}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">কার্যকর একক মূল্য:</span>
                    <span className="font-bold text-emerald-400 text-sm">৳{tierResult.effectiveUnitPrice} / একক</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">গ্রাহকের মোট সাশ্রয়:</span>
                    <span className="font-bold text-cyan-400">৳{tierResult.totalSavings} (-{tierResult.discountPercent}%)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">মোট লাইন বিল (Line Total):</span>
                    <span className="font-bold text-slate-100 text-base">৳{tierResult.lineTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 pt-1">
                    <span>দোকানের মুনাফা মার্জিন:</span>
                    <span className="text-emerald-400 font-semibold">৳{tierResult.profitMargin.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
