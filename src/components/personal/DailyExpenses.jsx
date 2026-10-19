import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShoppingCart,
  Plus,
  Search,
  Calendar,
  Tag,
  Trash2,
  Edit2,
  Scale,
  X,
  ArrowUpRight,
  Filter,
  Sparkles,
  Home,
  FileSpreadsheet,
  User,
  Users,
  Layers,
  Compass,
  Check,
  FolderOpen,
  MoreVertical,
  Mic,
  MicOff,
  AlertTriangle,
  Zap,
  Coins,
  Target as TargetIcon
} from 'lucide-react';
import { CategoryManagerModal } from '../common/CategoryManagerModal';
import { DataExportImportModal } from '../common/DataExportImportModal';
import { BazaarShoppingListModal } from './BazaarShoppingListModal';
import { MasterHubModal } from '../common/MasterHubModal';
import { showConfirmDialog, showPromptDialog } from '../../services/dialogService';
import { isPersonalExpenseTombstoned } from '../../services/cloudStateSyncService';
import { DailyExpenseAddEditModal } from './DailyExpenseAddEditModal';
import { CashflowCalendarModal } from './CashflowCalendarModal';
import { FamilyBudgetAllocationModal } from './FamilyBudgetAllocationModal';
import { RecurringBillsManagerModal } from './RecurringBillsManagerModal';
import { SavingsGoalManagerModal } from './SavingsGoalManagerModal';
import { ZakatCalculatorModal } from './ZakatCalculatorModal';
import { MarketPriceTrackerModal } from '../common/MarketPriceTrackerModal';
import { RoutineShoppingPresetsModal } from '../common/RoutineShoppingPresetsModal';
import RecycleBinModal from './RecycleBinModal';
import SmartExpenseExportModal from './SmartExpenseExportModal';
import SmartAITextImportModal from './SmartAITextImportModal';
import SmartGroceryFolderModal from './SmartGroceryFolderModal';

const DEFAULT_CATEGORY_SUB_MAP = {
  transport: ['বাস ভাড়া', 'অটো / সিএনজি ভাড়া', 'রিকশা ভাড়া', 'উবার / পাঠাও রাইড', 'মেট্রোরেল ভাড়া', 'মোটরসাইকেল তেল', 'ট্রেন / লঞ্চ ভাড়া'],
  education: ['স্কুলের মাসিক বেতন', 'কোচিং ফি', 'প্রাইভেট টিউটর বেতন', 'বই ও খাতা কেনা', 'স্কুল ড্রেস / জুতো', 'টিফিন খরচ', 'পরীক্ষার ফি'],
  bazaar: ['কাঁচা শাকসবজি', 'তাজা মাছ', 'মাংস (মুরগি/গরু)', 'চাল ও আটা', 'ডাল ও সয়াবিন তেল', 'ডিম ও দুধ', 'ফলমূল'],
  medical: ['ডাক্তারের ভিজিট ফি', 'প্রেসক্রিপশনের ওষুধ', 'ল্যাব ও প্যাথলজি টেস্ট', 'হাসপাতাল চার্জ'],
  utility: ['বিদ্যুৎ বিল (ডেসকো/ডিপিডিসি)', 'গ্যাস বিল', 'পানির বিল (ওয়াসা)', 'ইন্টারনেট / ওয়াইফাই বিল', 'মোবাইল রিচার্জ', 'ময়লার বিল'],
  rent: ['মাসিক ফ্ল্যাট বাসা ভাড়া', 'গ্যারেজ ভাড়া', 'সার্ভিস চার্জ ও সিকিউরিটি'],
  food: ['রেস্টুরেন্টে খাবার', 'ফাস্টফুড ও স্ন্যাক্স', 'চা ও বিস্কুট', 'মেহমান আপ্যায়ন'],
  other: ['বিবিধ কেনাকাটা', 'জরুরি খরচ', 'দান ও সদকা']
};

export const DailyExpenses = () => {
  const {
    personalExpenses,
    personalEvents = [],
    bazaarShoppingList = [],
    addPersonalExpense,
    updatePersonalExpense,
    deletePersonalExpense,
    trashBin = [],
    categories = {},
    addCategory,
    t,
    lang
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedUnit, setSelectedUnit] = useState('all');
  const [selectedMember, setSelectedMember] = useState('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState('all');

  // ----------------------------------------------------
  // 📅 MONTH SEGREGATION & RUNNING MONTH LOGIC
  // ----------------------------------------------------
  const currentMonthKey = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return new Date().toISOString().slice(0, 7);
  });

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [modalInitialType, setModalInitialType] = useState('daily');
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showExportImportModal, setShowExportImportModal] = useState(false);
  const [showShoppingListModal, setShowShoppingListModal] = useState(false);
  const [showMasterHubModal, setShowMasterHubModal] = useState(false);
  const [showCashflowModal, setShowCashflowModal] = useState(false);
  const [showFamilyBudgetModal, setShowFamilyBudgetModal] = useState(false);
  const [showRecurringBillsModal, setShowRecurringBillsModal] = useState(false);
  const [showSavingsGoalModal, setShowSavingsGoalModal] = useState(false);
  const [showZakatModal, setShowZakatModal] = useState(false);
  const [showPriceTrackerModal, setShowPriceTrackerModal] = useState(false);
  const [showRoutinePresetsModal, setShowRoutinePresetsModal] = useState(false);
  const [showRecycleBinModal, setShowRecycleBinModal] = useState(false);
  const [showSmartExportModal, setShowSmartExportModal] = useState(false);
  const [showAIImportModal, setShowAIImportModal] = useState(false);
  const [showGroceryModal, setShowGroceryModal] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Daily Expense Limit State (Item 69)
  const [dailyLimit, setDailyLimit] = useState(() => {
    try {
      const saved = localStorage.getItem('hk360_daily_expense_limit');
      return saved ? Number(saved) : 2500;
    } catch {
      return 2500;
    }
  });
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [tempLimit, setTempLimit] = useState('');

  // Voice Expense Logging State (Item 70)
  const [isListening, setIsListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState('');

  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);

  const activeTrashIdSet = useMemo(() => {
    const s = new Set();
    (trashBin || []).forEach(t => {
      if (t.id) s.add(String(t.id));
      if (t.trashId) s.add(String(t.trashId));
    });
    return s;
  }, [trashBin]);

  const activeDailyExpenses = useMemo(() => {
    return (personalExpenses || []).filter(e => {
      if (!e || !e.id) return false;
      const strId = String(e.id);
      if (activeTrashIdSet.has(strId)) return false;
      if (isPersonalExpenseTombstoned(strId)) return false;
      return true;
    });
  }, [personalExpenses, activeTrashIdSet]);

  const todayTotal = useMemo(() => {
    return activeDailyExpenses
      .filter(e => e.type === 'daily' && e.date === todayIso)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [activeDailyExpenses, todayIso]);

  const isLimitExceeded = todayTotal > dailyLimit;

  // Voice NLP Parser
  const parseVoiceInput = (text) => {
    const bnToEnMap = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
    const normalized = text.replace(/[০-৯]/g, d => bnToEnMap[d]);

    const amountMatch = normalized.match(/(\d+)\s*(?:টাকা|tk|taka)?/i);
    const parsedAmount = amountMatch ? Number(amountMatch[1]) : '';

    let detectedCat = 'other';
    let detectedSub = 'সাধারণ খরচ';
    let itemName = text.replace(/(\d+|[০-৯]+)\s*(?:টাকা|tk|taka)?/gi, '').trim();

    const lower = text.toLowerCase();
    if (lower.includes('বাজার') || lower.includes('চাল') || lower.includes('ডাল') || lower.includes('তেল') || lower.includes('মাছ') || lower.includes('মাংস') || lower.includes('সবজি') || lower.includes('ডিম') || lower.includes('ফল')) {
      detectedCat = 'bazaar';
      detectedSub = 'কাঁচা শাকসবজি';
    } else if (lower.includes('রিকশা') || lower.includes('বাস') || lower.includes('ভাড়া') || lower.includes('সিএনজি') || lower.includes('উবার') || lower.includes('মেট্রো') || lower.includes('তেল')) {
      detectedCat = 'transport';
      detectedSub = 'রিকশা ভাড়া';
    } else if (lower.includes('ওষুধ') || lower.includes('ডাক্তার') || lower.includes('মেডিসিন') || lower.includes('টেস্ট')) {
      detectedCat = 'medical';
      detectedSub = 'প্রেসক্রিপশনের ওষুধ';
    } else if (lower.includes('বিদ্যুৎ') || lower.includes('গ্যাস') || lower.includes('পানি') || lower.includes('ওয়াইফাই') || lower.includes('বিল')) {
      detectedCat = 'utility';
      detectedSub = 'বিদ্যুৎ বিল (ডেসকো/ডিপিডিসি)';
    } else if (lower.includes('নাস্তা') || lower.includes('চা') || lower.includes('খাবার') || lower.includes('রেস্টুরেন্ট')) {
      detectedCat = 'food';
      detectedSub = 'ফাস্টফুড ও স্ন্যাক্স';
    } else if (lower.includes('স্কুল') || lower.includes('বই') || lower.includes('খাতা') || lower.includes('টিউশন')) {
      detectedCat = 'education';
      detectedSub = 'বই ও খাতা কেনা';
    }

    if (!itemName) itemName = 'দৈনিক খরচ';

    return {
      type: 'daily',
      title: itemName,
      item: itemName,
      amount: parsedAmount,
      category: detectedCat,
      subCategory: detectedSub,
      date: todayIso,
      unit: 'পিস (Pcs)',
      quantity: 1,
      familyMember: 'পুরো পরিবার (সবার জন্য)',
      note: `ভয়েস এন্ট্রি: "${text}"`
    };
  };

  const handleStartVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('আপনার ব্রাউজারে স্পিচ রিকগনিশন সমর্থিত নয়। অনুগ্রহ করে গুগল ক্রোম ব্রাউজার ব্যবহার করুন।');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = lang === 'bn' ? 'bn-BD' : 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceFeedback('শুনছি... যেমন বলুন: "আলু ও পেঁয়াজ ১২০ টাকা" বা "রিকশা ভাড়া ৩০ টাকা"');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setVoiceFeedback(`শনাক্ত হয়েছে: "${transcript}"`);
        setIsListening(false);
        const parsed = parseVoiceInput(transcript);
        setEditingExpense(parsed);
        setShowModal(true);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setVoiceFeedback('ভয়েস বুঝতে সমস্যা হয়েছে, আবার চেষ্টা করুন।');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  const handleSaveDailyLimit = (e) => {
    e.preventDefault();
    const val = Number(tempLimit);
    if (!isNaN(val) && val > 0) {
      setDailyLimit(val);
      try {
        localStorage.setItem('hk360_daily_expense_limit', String(val));
      } catch { }
    }
    setIsEditingLimit(false);
  };

  const availableMembers = categories.familyMembers || [
    'নিজে (Self)',
    'স্ত্রী (Wife)',
    'ছেলে (Son)',
    'মেয়ে (Daughter)',
    'বাবা (Father)',
    'মা (Mother)',
    'ছোট ভাই / বোন',
    'পুরো পরিবার (সবার জন্য)'
  ];

  const dailyList = useMemo(() => {
    return activeDailyExpenses.filter(e => e.type === 'daily');
  }, [activeDailyExpenses]);

  // Extract all distinct months available in daily transactions
  const availableMonths = useMemo(() => {
    const monthMap = new Map();
    (dailyList || []).forEach((item) => {
      const d = item.date || '';
      if (d.length >= 7) {
        const mKey = d.slice(0, 7);
        if (!monthMap.has(mKey)) {
          monthMap.set(mKey, { key: mKey, count: 0, total: 0 });
        }
        const m = monthMap.get(mKey);
        m.count += 1;
        m.total += Number(item.amount) || 0;
      }
    });

    if (!monthMap.has(currentMonthKey)) {
      monthMap.set(currentMonthKey, { key: currentMonthKey, count: 0, total: 0 });
    }

    return Array.from(monthMap.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [dailyList, currentMonthKey]);

  // Bangla Month Title Formatter
  const getBanglaMonthTitle = (monthKey) => {
    if (!monthKey || monthKey === 'all') return lang === 'bn' ? 'সকল মাসের খরচ (একসাথে)' : 'All Months';
    const parts = monthKey.split('-');
    if (parts.length < 2) return monthKey;
    const year = parts[0];
    const monthNum = parseInt(parts[1], 10);
    const bnMonths = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    const bnNums = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const toBnNum = (n) => String(n).split('').map(d => bnNums[parseInt(d, 10)] ?? d).join('');
    const monthName = bnMonths[monthNum - 1] || monthKey;
    const isCurrent = monthKey === currentMonthKey;
    return `${monthName} ${toBnNum(year)}${isCurrent ? (lang === 'bn' ? ' (চলতি মাস)' : ' (Current)') : ''}`;
  };

  // Scoped to selected month (Running month October by default)
  const activeMonthExpenses = useMemo(() => {
    if (selectedMonth === 'all') return dailyList;
    return dailyList.filter(e => (e.date || '').startsWith(selectedMonth));
  }, [dailyList, selectedMonth]);

  const filteredExpenses = useMemo(() => {
    return activeMonthExpenses.filter(item => {
      const search = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !search ||
        (item.title && item.title.toLowerCase().includes(search)) ||
        (item.item && item.item.toLowerCase().includes(search)) ||
        (item.note && item.note.toLowerCase().includes(search)) ||
        (item.subCategory && item.subCategory.toLowerCase().includes(search)) ||
        (item.familyMember && item.familyMember.toLowerCase().includes(search)) ||
        (item.purpose && item.purpose.toLowerCase().includes(search));

      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesUnit = selectedUnit === 'all' || item.unit === selectedUnit;
      const matchesMember = selectedMember === 'all' || item.familyMember === selectedMember;
      const matchesSubCat = selectedSubCategory === 'all' || item.subCategory === selectedSubCategory;

      return matchesSearch && matchesCat && matchesUnit && matchesMember && matchesSubCat;
    });
  }, [activeMonthExpenses, searchTerm, selectedCategory, selectedUnit, selectedMember, selectedSubCategory]);

  const totalDaily = useMemo(() => {
    return activeMonthExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [activeMonthExpenses]);

  const totalFiltered = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpenses]);

  const pendingShoppingCount = useMemo(() => {
    return (bazaarShoppingList || []).filter(i => !i.isPurchased).length;
  }, [bazaarShoppingList]);

  // Open Add Modal
  const handleOpenAddModal = (type = 'daily') => {
    setEditingExpense(null);
    setModalInitialType(type);
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (expense) => {
    setEditingExpense(expense);
    setShowModal(true);
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              <ShoppingCart size={22} />
            </div>
            <span>{t.personal.dailyTitle}</span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {lang === 'bn'
              ? 'প্রতিদিনের বাজার, নাস্তা ও খরচের হিসাব আইটেম, পরিমাণ ও একক (গ্রাম, কেজি, লিটার, অটো ভাড়া) সহ লিখে রাখুন'
              : t.personal.dailySubtitle}
          </p>
        </div>

        {/* ======================================================== */}
        {/* 💳 PINNED TOTAL AMOUNT + SMOOTH HORIZONTAL MOVABLE RIBBON */}
        {/* ======================================================== */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', width: '100%', maxWidth: '100%', marginTop: '6px' }}>
          {/* 1. Stable Fixed Total Amount Badge */}
          <div
            style={{
              background: 'var(--bg-card)',
              padding: '9px 18px',
              borderRadius: '14px',
              border: '1.5px solid var(--border-color)',
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
              flexShrink: 0
            }}
          >
            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: '700' }}>
              {lang === 'bn' ? 'মোট খরচ:' : 'Total:'}
            </span>
            <span style={{ fontWeight: '900', fontFamily: 'var(--font-mono)', color: '#ef4444', fontSize: '1.22rem' }}>
              ৳{totalDaily.toLocaleString('en-IN')}
            </span>
          </div>

          {/* 2. Unified Ultra-Smooth Horizontal Scrollable Carousel (Right & Left Movable) */}
          <div
            className="smooth-scroll-x"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              overflowX: 'auto',
              overflowY: 'hidden',
              padding: '4px 6px 6px 2px',
              flex: 1,
              minWidth: '240px',
              maxWidth: '100%',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x pan-y',
              scrollbarWidth: 'none'
            }}
          >
            {/* 1. Primary Add Daily Expense Button */}
            <button
              onClick={() => handleOpenAddModal('daily')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.92rem',
                fontWeight: '800',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                flexShrink: 0
              }}
            >
              <Plus size={18} />
              <span>{t.personal.addDailyExpense}</span>
            </button>

            {/* 1.1 Primary Add Family Expense Button (Side-by-side in same line) */}
            <button
              onClick={() => handleOpenAddModal('family')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.92rem',
                fontWeight: '800',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                flexShrink: 0
              }}
            >
              <Home size={18} />
              <span>{t.personal.addFamilyExpense}</span>
            </button>

            {/* 2. Smart AI Text Import Button */}
            <button
              onClick={() => setShowAIImportModal(true)}
              title={lang === 'bn' ? 'ChatGPT বা Gemini-র টেক্সট থেকে স্মার্ট ইমপোর্ট' : 'Smart AI Text Import'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '10px 16px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.16), rgba(6, 182, 212, 0.16))',
                color: '#10b981',
                border: '1.5px solid rgba(16, 185, 129, 0.4)',
                fontSize: '0.9rem',
                fontWeight: '800',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)',
                flexShrink: 0
              }}
            >
              <Sparkles size={17} />
              <span>{lang === 'bn' ? '⚡ এআই টেক্সট ইমপোর্ট' : '⚡ AI Text Import'}</span>
            </button>

            {/* 3. Bazaar Shopping List Button */}
            <button
              onClick={() => setShowShoppingListModal(true)}
              title={lang === 'bn' ? 'বাজারের ফর্দ ও শপিং লিস্ট ওপেন করুন' : 'Open Bazaar Shopping List'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '10px 16px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#059669',
                border: '1.5px solid rgba(16, 185, 129, 0.35)',
                fontSize: '0.9rem',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <ShoppingCart size={17} />
              <span>{lang === 'bn' ? 'বাজারের ফর্দ' : 'Shopping List'}</span>
              {pendingShoppingCount > 0 && (
                <span
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    padding: '2px 7px',
                    borderRadius: '10px',
                    fontSize: '0.72rem',
                    fontWeight: '900'
                  }}
                >
                  {pendingShoppingCount}
                </span>
              )}
            </button>

            {/* 4. Cashflow Calendar Button */}
            <button
              onClick={() => setShowCashflowModal(true)}
              title={lang === 'bn' ? 'ক্যাশফ্লো ক্যালেন্ডার' : 'Cashflow Calendar'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '10px 16px',
                borderRadius: '12px',
                background: 'rgba(6, 182, 212, 0.12)',
                color: '#06b6d4',
                border: '1.5px solid rgba(6, 182, 212, 0.35)',
                fontSize: '0.9rem',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <Calendar size={17} />
              <span>{lang === 'bn' ? 'ক্যাশফ্লো ক্যালেন্ডার' : 'Cashflow Calendar'}</span>
            </button>

            {/* 5. Family Budget Button */}
            <button
              onClick={() => setShowFamilyBudgetModal(true)}
              title={lang === 'bn' ? 'পারিবারিক বাজেট বণ্টন' : 'Family Budget'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '10px 16px',
                borderRadius: '12px',
                background: 'rgba(139, 92, 246, 0.12)',
                color: '#8b5cf6',
                border: '1.5px solid rgba(139, 92, 246, 0.35)',
                fontSize: '0.9rem',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <Users size={17} />
              <span>{lang === 'bn' ? 'পারিবারিক বাজেট' : 'Family Budget'}</span>
            </button>

            {/* 6. Smart Export Button */}
            <button
              onClick={() => setShowSmartExportModal(true)}
              title={lang === 'bn' ? 'মান্থ-ওয়াইজ, প্রোডাক্ট-ওয়াইজ ও প্রাইস-ওয়াইজ এক্সপোর্ট' : 'Smart Expense Export'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '10px 16px',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.12)',
                color: '#818cf8',
                border: '1.5px solid rgba(99, 102, 241, 0.35)',
                fontSize: '0.9rem',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <FileSpreadsheet size={17} />
              <span>{lang === 'bn' ? 'স্মার্ট এক্সপোর্ট' : 'Smart Export'}</span>
            </button>

            {/* 7. 1-Click Routine Shopping Presets Button */}
            <button
              onClick={() => setShowRoutinePresetsModal(true)}
              title={lang === 'bn' ? '⚡ ১-ক্লিক নিয়মিত বাজার প্রি-সেট (এক ক্লিকে সকল নিত্য খরচ যোগ করুন)' : '1-Click Routine Shopping Presets'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '10px 16px',
                borderRadius: '12px',
                background: 'rgba(139, 92, 246, 0.12)',
                color: '#8b5cf6',
                border: '1.5px solid rgba(139, 92, 246, 0.35)',
                fontSize: '0.9rem',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <Zap size={17} />
              <span>{lang === 'bn' ? '১-ক্লিক বাজার' : 'Routine Preset'}</span>
            </button>

            {/* 8. Market Price Tracker & Wishlist Button */}
            <button
              onClick={() => setShowPriceTrackerModal(true)}
              title={lang === 'bn' ? '🏷️ বাজার দর চেক ও কেনার ফর্দ' : 'Market Price Tracker & Wishlist'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '10px 16px',
                borderRadius: '12px',
                background: 'rgba(236, 72, 153, 0.12)',
                color: '#ec4899',
                border: '1.5px solid rgba(236, 72, 153, 0.35)',
                fontSize: '0.9rem',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <Tag size={17} />
              <span>{lang === 'bn' ? 'দর ও ফর্দ' : 'Price Tracker'}</span>
            </button>

            {/* 9. Voice Expense Button */}
            <button
              onClick={handleStartVoice}
              title={lang === 'bn' ? 'মুখে বলে খরচ লিখুন (যেমন: আলু পেঁয়াজ ১২০ টাকা)' : 'Voice Expense Input'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '10px 16px',
                borderRadius: '12px',
                background: isListening ? '#ef4444' : 'rgba(99, 102, 241, 0.15)',
                color: isListening ? '#ffffff' : '#6366f1',
                border: isListening ? 'none' : '1.5px solid rgba(99, 102, 241, 0.35)',
                fontSize: '0.9rem',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                animation: isListening ? 'pulse 1s infinite' : 'none'
              }}
            >
              {isListening ? <MicOff size={17} /> : <Mic size={17} />}
              <span>{isListening ? (lang === 'bn' ? 'শুনছি...' : 'Listening...') : (lang === 'bn' ? 'মুখে বলুন' : 'Voice')}</span>
            </button>

            {/* 10. Recurring Bills Button */}
            <button
              onClick={() => setShowRecurringBillsModal(true)}
              title={lang === 'bn' ? 'রিকারিং বিল ও ইউটিলিটি' : 'Recurring Bills'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '10px 16px',
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.12)',
                color: '#f59e0b',
                border: '1.5px solid rgba(245, 158, 11, 0.35)',
                fontSize: '0.9rem',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <Zap size={17} />
              <span>{lang === 'bn' ? 'রিকারিং বিল' : 'Recurring Bills'}</span>
            </button>

            {/* 11. Savings Goals Button */}
            <button
              onClick={() => setShowSavingsGoalModal(true)}
              title={lang === 'bn' ? 'সঞ্চয় লক্ষ্যমাত্রা পোর্টফোলিও' : 'Savings Goals'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '10px 16px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                border: '1.5px solid rgba(16, 185, 129, 0.35)',
                fontSize: '0.9rem',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <TargetIcon size={17} />
              <span>{lang === 'bn' ? 'সঞ্চয় লক্ষ্য' : 'Savings Goal'}</span>
            </button>

            {/* 12. Zakat Calculator Button */}
            <button
              onClick={() => setShowZakatModal(true)}
              title={lang === 'bn' ? 'যাকাত ও সদকা ক্যালকুলেটর' : 'Zakat Calculator'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '10px 16px',
                borderRadius: '12px',
                background: 'rgba(236, 72, 153, 0.12)',
                color: '#ec4899',
                border: '1.5px solid rgba(236, 72, 153, 0.35)',
                fontSize: '0.9rem',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <Coins size={17} />
              <span>{lang === 'bn' ? 'যাকাত ক্যালকুলেটর' : 'Zakat Calculator'}</span>
            </button>

            {/* 13. Unit Management Button */}
            <button
              onClick={() => setShowUnitModal(true)}
              title={lang === 'bn' ? 'পরিমাপক একক তালিকা' : 'Manage Units'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '10px 16px',
                borderRadius: '12px',
                background: 'rgba(6, 182, 212, 0.12)',
                color: '#06b6d4',
                border: '1.5px solid rgba(6, 182, 212, 0.35)',
                fontSize: '0.9rem',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <Scale size={17} />
              <span>{lang === 'bn' ? 'একক তালিকা' : 'Units'}</span>
            </button>

            {/* 14. Data Hub / Export-Import Button */}
            <button
              onClick={() => setShowExportImportModal(true)}
              title={lang === 'bn' ? 'এক্সপোর্ট / ইমপোর্ট ও ডেটা হাব' : 'Export / Import Hub'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '10px 16px',
                borderRadius: '12px',
                background: 'rgba(15, 118, 110, 0.12)',
                color: '#0f766e',
                border: '1.5px solid rgba(15, 118, 110, 0.35)',
                fontSize: '0.9rem',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <FolderOpen size={17} />
              <span>{lang === 'bn' ? 'ডেটা হাব' : 'Data Hub'}</span>
            </button>

            {/* 15. Recycle Bin Button */}
            <button
              onClick={() => setShowRecycleBinModal(true)}
              title={lang === 'bn' ? 'রিসাইকেল বিন (মুছে ফেলা খরচ ও রিস্টোর)' : 'Recycle Bin'}
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '10px 16px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                border: '1.5px solid rgba(239, 68, 68, 0.35)',
                fontSize: '0.9rem',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <Trash2 size={17} />
              <span>{lang === 'bn' ? 'রিসাইকেল বিন' : 'Trash'}</span>
              {trashBin.length > 0 && (
                <span
                  style={{
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: '900',
                    borderRadius: '10px',
                    padding: '1px 6px',
                    marginLeft: '2px'
                  }}
                >
                  {trashBin.length}
                </span>
              )}
            </button>

            {/* Smart Grocery Folders & Price Memory Button */}
            <button
              onClick={() => setShowGroceryModal(true)}
              title={lang === 'bn' ? 'ফোল্ডারভিত্তিক রেগুলার বাজার, ওজন হিসাব ও দর মেমোরি' : 'Smart Grocery Folders & Price Memory'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '10px 16px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(16, 185, 129, 0.15))',
                color: '#60a5fa',
                border: '1.5px solid rgba(59, 130, 246, 0.35)',
                fontSize: '0.9rem',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                boxShadow: '0 2px 10px rgba(59, 130, 246, 0.2)'
              }}
            >
              <ShoppingCart size={17} />
              <span>{lang === 'bn' ? '🛒 বাজার ও দর মেমোরি' : '🛒 Grocery & Price Memory'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 📅 MONTH SEGREGATION BAR (মাসভিত্তিক পৃথকীকরণ ও রানিং ফিল্টার) */}
      {/* ======================================================== */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(6, 182, 212, 0.05))',
          border: '1.5px solid rgba(16, 185, 129, 0.28)',
          borderRadius: '16px',
          padding: '14px 16px',
          marginBottom: '1.25rem',
          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.06)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Calendar size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.94rem', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span>{lang === 'bn' ? 'বাজারের মাস নির্বাচন:' : 'Select Bazaar Month:'}</span>
                <span style={{ fontSize: '0.82rem', padding: '2px 10px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.16)', color: '#10b981', fontWeight: '900', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  {getBanglaMonthTitle(selectedMonth)}
                </span>
                {selectedMonth === currentMonthKey && (
                  <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', background: '#10b981', color: '#ffffff', fontWeight: '800' }}>
                    {lang === 'bn' ? 'চলতি রানিং মাস' : 'Active Month'}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {lang === 'bn' ? 'চলতি মাস বা পূর্ববর্তী যেকোনো মাসের আলাদা হিসাব দেখতে নিচের বাটনগুলো চাপুন' : 'Click below to switch between active and previous months'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700' }}>
              {lang === 'bn' ? 'মাসের ড্রপডাউন:' : 'Jump to Month:'}
            </span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                fontSize: '0.84rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {getBanglaMonthTitle(m.key)} — ৳{m.total.toLocaleString('en-IN')} ({m.count}টি)
                </option>
              ))}
              <option value="all">
                {lang === 'bn' ? '🌐 সকল মাস (একসাথে সম্পূর্ণ তালিকা)' : '🌐 All Months Combined'}
              </option>
            </select>
          </div>
        </div>

        {/* Scrollable Month Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
            scrollbarWidth: 'thin'
          }}
        >
          {availableMonths.map((m) => {
            const isSelected = selectedMonth === m.key;
            const isCurrent = m.key === currentMonthKey;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setSelectedMonth(m.key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '12px',
                  border: isSelected ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                  background: isSelected
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : isCurrent
                    ? 'rgba(16, 185, 129, 0.08)'
                    : 'var(--bg-card)',
                  color: isSelected ? '#ffffff' : 'var(--text-main)',
                  fontSize: '0.82rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: isSelected ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Calendar size={14} style={{ color: isSelected ? '#ffffff' : '#10b981' }} />
                <span>{getBanglaMonthTitle(m.key)}</span>
                <span
                  style={{
                    fontSize: '0.74rem',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    background: isSelected ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0,0,0,0.06)',
                    color: isSelected ? '#ffffff' : '#f43f5e',
                    fontWeight: '900'
                  }}
                >
                  ৳{m.total.toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize: '0.7rem', opacity: isSelected ? 0.9 : 0.6 }}>
                  ({m.count}টি)
                </span>
              </button>
            );
          })}

          {/* All Months button */}
          <button
            type="button"
            onClick={() => setSelectedMonth('all')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '12px',
              border: selectedMonth === 'all' ? '1.5px solid #6366f1' : '1px solid var(--border-color)',
              background: selectedMonth === 'all' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'var(--bg-card)',
              color: selectedMonth === 'all' ? '#ffffff' : 'var(--text-main)',
              fontSize: '0.8rem',
              fontWeight: '800',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <span>{lang === 'bn' ? 'সব মাস' : 'All Months'}</span>
          </button>
        </div>
      </div>

      {/* Voice Recognition Feedback Toast */}
      {voiceFeedback && (
        <div style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#6366f1', padding: '8px 14px', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>🎙️ {voiceFeedback}</span>
          <button onClick={() => setVoiceFeedback('')} style={{ background: 'transparent', border: 'none', color: '#6366f1', cursor: 'pointer', padding: '2px' }}><X size={14} /></button>
        </div>
      )}

      {/* Daily Expense Limit Alert Banner (Item 69) */}
      <div
        style={{
          background: isLimitExceeded
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.08))'
            : 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(6, 182, 212, 0.05))',
          border: `1.5px solid ${isLimitExceeded ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.25)'}`,
          borderRadius: '14px',
          padding: '10px 16px',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: isLimitExceeded ? '#ef4444' : '#10b981',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isLimitExceeded ? '0 2px 8px rgba(239, 68, 68, 0.35)' : '0 2px 8px rgba(16, 185, 129, 0.35)'
            }}
          >
            {isLimitExceeded ? <AlertTriangle size={17} /> : <Zap size={17} />}
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: '800', color: isLimitExceeded ? '#ef4444' : 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{isLimitExceeded ? '⚠️ আজকের খরচের সীমা অতিক্রম করেছে!' : '📊 আজকের খরচ ও বাজেট সীমা:'}</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                (আজকের খরচ: ৳{todayTotal.toLocaleString()} / সীমা: ৳{dailyLimit.toLocaleString()})
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: isLimitExceeded ? '#ef4444' : 'var(--text-muted)', marginTop: '2px' }}>
              {isLimitExceeded
                ? `নির্ধারিত দৈনিক সীমার চেয়ে ৳${(todayTotal - dailyLimit).toLocaleString()} বেশি খরচ হয়েছে। অপচয় কমাতে নজর দিন!`
                : `আজকের অবশিষ্ট বাজেট: ৳${Math.max(0, dailyLimit - todayTotal).toLocaleString()}`}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isEditingLimit ? (
            <form onSubmit={handleSaveDailyLimit} style={{ display: 'flex', gap: '6px' }}>
              <input
                type="number"
                className="form-control"
                placeholder="নতুন সীমা"
                value={tempLimit}
                onChange={e => setTempLimit(e.target.value)}
                style={{ width: '100px', height: '32px', fontSize: '0.82rem' }}
                autoFocus
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>সংরক্ষণ</button>
              <button type="button" className="btn btn-secondary" onClick={() => setIsEditingLimit(false)} style={{ padding: '4px 8px', fontSize: '0.78rem' }}>বাতিল</button>
            </form>
          ) : (
            <button
              onClick={() => { setTempLimit(String(dailyLimit)); setIsEditingLimit(true); }}
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Edit2 size={12} /> সীমা পরিবর্তন
            </button>
          )}
        </div>
      </div>

      {/* Top Quick Bazaar Banner (Always visible at the top when items are in list) */}
      {pendingShoppingCount > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))',
            border: '1.5px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '14px',
            padding: '10px 16px',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
              }}
            >
              <ShoppingCart size={17} />
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{lang === 'bn' ? '📌 আজকের বাজারের ফর্দ (Shopping List):' : '📌 Today\'s Bazaar Shopping List:'}</span>
                <span
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.72rem',
                    fontWeight: '800'
                  }}
                >
                  {lang === 'bn' ? `${pendingShoppingCount} টি আইটেম বাকি` : `${pendingShoppingCount} items remaining`}
                </span>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '3px' }}>
                {(bazaarShoppingList || []).filter(i => !i.isPurchased).slice(0, 4).map(item => (
                  <span
                    key={item.id}
                    style={{
                      background: 'var(--bg-card)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      fontWeight: '600'
                    }}
                  >
                    • {item.name} {item.quantity ? `(${item.quantity} ${item.unit || ''})` : ''}
                  </span>
                ))}
                {pendingShoppingCount > 4 && (
                  <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>+{pendingShoppingCount - 4} আরও...</span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setShowShoppingListModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
              }}
            >
              <ShoppingCart size={14} />
              <span>{lang === 'bn' ? 'ফর্দ ওপেন করুন ↗' : 'Open Full List ↗'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '0.875rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '200px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-dim)'
            }}
          />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '36px', width: '100%', borderRadius: '8px' }}
            placeholder={lang === 'bn' ? 'আইটেম, পণ্য বা নোট দিয়ে খুঁজুন...' : 'Search item or notes...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Side-by-Side Dual Filters: Sub-Category and Family Member */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', flex: '2 1 300px', width: '100%' }}>
          {/* Sub-Category Filter */}
          <select
            className="select-field"
            style={{ width: '100%', borderRadius: '8px' }}
            value={selectedSubCategory}
            onChange={(e) => setSelectedSubCategory(e.target.value)}
          >
            <option value="all">🔀 {lang === 'bn' ? 'সকল সাব-ক্যাটাগরি' : 'All Sub-Categories'}</option>
            {(categories.expenseSubCategories || []).map((s) => (
              <option key={s} value={s}>🔀 {s}</option>
            ))}
          </select>

          {/* Family Member Filter */}
          <select
            className="select-field"
            style={{ width: '100%', borderRadius: '8px' }}
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
          >
            <option value="all">👤 {lang === 'bn' ? 'সকল ফ্যামিলি মেম্বার' : 'All Family Members'}</option>
            {availableMembers.map((m) => (
              <option key={m} value={m}>👤 {m}</option>
            ))}
          </select>
        </div>

        {/* Main Category Filter */}
        <select
          className="select-field"
          style={{ width: 'auto', minWidth: '140px', borderRadius: '8px' }}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">🏷️ {lang === 'bn' ? 'সব ক্যাটাগরি' : 'All Categories'}</option>
          {Object.entries(t.personal.expenseCategories).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
          {(categories.personalExpenseCategories || [])
            .filter(cat => !Object.keys(t.personal.expenseCategories || {}).includes(cat) && !Object.values(t.personal.expenseCategories || {}).includes(cat))
            .map((cat) => (
              <option key={cat} value={cat}>🏷️ {cat}</option>
            ))}
        </select>

        {/* Clear Filters Button if any filter active */}
        {(selectedCategory !== 'all' || selectedMember !== 'all' || selectedSubCategory !== 'all' || searchTerm) && (
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setSelectedMember('all');
              setSelectedSubCategory('all');
              setSearchTerm('');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <X size={14} />
            <span>{lang === 'bn' ? 'ফিল্টার রিসেট' : 'Reset'}</span>
          </button>
        )}

        {filteredExpenses.length !== dailyList.length && (
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {lang === 'bn' ? 'ফিল্টারকৃত মোট:' : 'Filtered Total:'}{' '}
            <strong style={{ color: '#ef4444', fontSize: '0.95rem' }}>৳{totalFiltered.toLocaleString('en-IN')}</strong> ({filteredExpenses.length}টি)
          </div>
        )}
      </div>

      {/* Expense Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 14px' }}>{t.date}</th>
                <th style={{ padding: '10px 14px' }}>{t.category}</th>
                <th style={{ padding: '10px 14px' }}>{lang === 'bn' ? 'কি কিনলাম / আইটেম' : 'Item Description'}</th>
                <th style={{ padding: '10px 14px' }}>{lang === 'bn' ? 'পরিমাণ ও একক' : 'Quantity & Unit'}</th>
                <th style={{ padding: '10px 14px' }}>{t.note}</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>{t.amount}</th>
                <th style={{ padding: '10px 14px', textAlign: 'center' }}>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '1.2rem', marginBottom: '6px' }}>🛒</div>
                    <div>{lang === 'bn' ? 'কোনো দৈনিক খরচের রেকর্ড পাওয়া যায়নি' : 'No daily expenses found'}</div>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((item) => {
                  const hasQty = item.quantity !== null && item.quantity !== undefined && item.quantity !== '';

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                          <span>{item.date}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--personal-primary)' }}>
                          <Tag size={12} />
                          {t.personal.expenseCategories[item.category] || item.category}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                          {item.item || item.title}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                          {item.subCategory && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                background: 'rgba(14, 165, 233, 0.12)',
                                color: '#0ea5e9',
                                fontSize: '0.72rem',
                                fontWeight: '700'
                              }}
                            >
                              <Layers size={10} />
                              <span>{item.subCategory}</span>
                            </span>
                          )}
                          {item.familyMember && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                background: 'rgba(5, 150, 105, 0.12)',
                                color: '#059669',
                                fontSize: '0.72rem',
                                fontWeight: '700'
                              }}
                            >
                              <User size={10} />
                              <span>{item.familyMember}</span>
                            </span>
                          )}
                          {item.purpose && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                background: 'rgba(217, 119, 6, 0.12)',
                                color: '#d97706',
                                fontSize: '0.72rem',
                                fontWeight: '700'
                              }}
                            >
                              <Compass size={10} />
                              <span>{item.purpose}</span>
                            </span>
                          )}
                          {item.eventName && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                background: 'rgba(236, 72, 153, 0.12)',
                                color: '#ec4899',
                                fontSize: '0.72rem',
                                fontWeight: '700'
                              }}
                            >
                              <Sparkles size={10} />
                              <span>{item.eventName}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        {hasQty ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: 'var(--bg-main)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-main)',
                              fontWeight: '700',
                              fontSize: '0.8rem'
                            }}
                          >
                            <Scale size={13} style={{ color: '#06b6d4' }} />
                            <span>
                              {item.quantity} {item.unit}
                            </span>
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {item.note || '—'}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#ef4444', fontSize: '0.95rem' }}>
                        -৳{Number(item.amount).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <button
                            className="btn-icon"
                            onClick={async () => {
                              const cur = item.item || item.title || '';
                              const next = await showPromptDialog({
                                title: lang === 'bn' ? 'খরচের বিবরণ পরিবর্তন' : 'Rename Expense',
                                message: lang === 'bn' ? 'আইটেম বা খরচের নতুন নাম লিখুন:' : 'Enter new item name:',
                                defaultValue: cur,
                                placeholder: lang === 'bn' ? 'যেমন: চাল, মাছ, বিদ্যুৎ বিল...' : 'Item name...'
                              });
                              if (next && next.trim() && next.trim() !== cur) {
                                updatePersonalExpense(item.id, { item: next.trim(), title: next.trim() });
                              }
                            }}
                            title={lang === 'bn' ? 'রিনেম / নাম সংশোধন' : 'Rename Item'}
                            style={{ color: '#06b6d4', padding: '4px' }}
                          >
                            <span style={{ fontSize: '12px' }}>🏷️</span>
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleOpenEditModal(item)}
                            title={lang === 'bn' ? 'সম্পাদনা / রি-এডিট' : 'Edit'}
                            style={{ color: 'var(--text-muted)', padding: '4px' }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={async () => {
                              const ok = await showConfirmDialog({
                                title: lang === 'bn' ? 'খরচ মুছে ফেলার নিশ্চিতকরণ' : 'Confirm Delete',
                                message: lang === 'bn' ? `আপনি কি "${item.item || item.title || 'এই খরচ'}" মুছে ফেলতে চান?` : 'Delete this daily expense?',
                                subMessage: lang === 'bn' ? `পরিমাণ: ৳${Number(item.amount || 0).toLocaleString()} • এটি মুছে ফেললে মোট হিসাব থেকে বাদ পড়বে।` : `Amount: ৳${item.amount || 0}`,
                                confirmText: lang === 'bn' ? 'মুছে ফেলুন' : 'Delete',
                                cancelText: lang === 'bn' ? 'বাতিল' : 'Cancel',
                                type: 'danger'
                              });
                              if (ok) {
                                deletePersonalExpense(item.id);
                              }
                            }}
                            title={t.delete}
                            style={{ color: '#ef4444', padding: '4px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal (Unified Component) */}
      <DailyExpenseAddEditModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingExpense(null);
        }}
        editingExpense={editingExpense}
        initialType={modalInitialType}
      />

      {/* Units Manager Modal */}
      <CategoryManagerModal
        isOpen={showUnitModal}
        onClose={() => setShowUnitModal(false)}
        defaultGroup="expenseUnits"
      />

      {/* Export / Import Modal */}
      <DataExportImportModal
        isOpen={showExportImportModal}
        onClose={() => setShowExportImportModal(false)}
        defaultTab="export"
        initialTarget="daily"
      />

      {/* Bazaar Shopping List Modal */}
      <BazaarShoppingListModal
        isOpen={showShoppingListModal}
        onClose={() => setShowShoppingListModal(false)}
        onOpenExpenseModal={handleOpenAddModal}
      />

      {/* Master Hub Modal */}
      <MasterHubModal
        isOpen={showMasterHubModal}
        onClose={() => setShowMasterHubModal(false)}
        defaultTab="units"
      />

      {/* Cashflow Calendar Modal (Item 62) */}
      <CashflowCalendarModal
        isOpen={showCashflowModal}
        onClose={() => setShowCashflowModal(false)}
      />

      {/* Family Budget Allocation Modal (Item 63) */}
      <FamilyBudgetAllocationModal
        isOpen={showFamilyBudgetModal}
        onClose={() => setShowFamilyBudgetModal(false)}
      />

      {/* Recurring Bills Manager Modal (Item 64) */}
      <RecurringBillsManagerModal
        isOpen={showRecurringBillsModal}
        onClose={() => setShowRecurringBillsModal(false)}
      />

      {/* Savings Goal Manager Modal (Item 65) */}
      <SavingsGoalManagerModal
        isOpen={showSavingsGoalModal}
        onClose={() => setShowSavingsGoalModal(false)}
      />

      {/* Zakat & Sadaqah Calculator Modal (Item 68) */}
      <ZakatCalculatorModal
        isOpen={showZakatModal}
        onClose={() => setShowZakatModal(false)}
      />

      {/* Market Price Tracker & Wishlist Modal */}
      <MarketPriceTrackerModal
        isOpen={showPriceTrackerModal}
        onClose={() => setShowPriceTrackerModal(false)}
        defaultProfile="personal"
      />

      {/* Routine Shopping 1-Click Presets Modal */}
      <RoutineShoppingPresetsModal
        isOpen={showRoutinePresetsModal}
        onClose={() => setShowRoutinePresetsModal(false)}
        defaultProfile="personal"
      />

      {/* Recycle Bin Modal */}
      <RecycleBinModal
        isOpen={showRecycleBinModal}
        onClose={() => setShowRecycleBinModal(false)}
      />

      {/* Smart Expense Export Modal */}
      <SmartExpenseExportModal
        isOpen={showSmartExportModal}
        onClose={() => setShowSmartExportModal(false)}
      />

      {/* Smart AI Text Import Modal */}
      <SmartAITextImportModal
        isOpen={showAIImportModal}
        onClose={() => setShowAIImportModal(false)}
        defaultType="daily"
      />

      {/* Smart Grocery Folders & Price Memory Modal */}
      <SmartGroceryFolderModal
        isOpen={showGroceryModal}
        onClose={() => setShowGroceryModal(false)}
      />
    </div>
  );
};

export default DailyExpenses;
