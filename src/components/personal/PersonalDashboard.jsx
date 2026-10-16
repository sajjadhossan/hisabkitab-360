import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  PieChart as PieIcon,
  PlusCircle,
  Calendar,
  Trash2,
  Tag,
  Target,
  Home,
  ShoppingBag,
  Edit2,
  Users,
  Zap,
  Coins,
  ShoppingCart,
  FileSpreadsheet,
  Sparkles
} from 'lucide-react';
import { DailyExpenseAddEditModal } from './DailyExpenseAddEditModal';
import { CashflowCalendarModal } from './CashflowCalendarModal';
import { FamilyBudgetAllocationModal } from './FamilyBudgetAllocationModal';
import { RecurringBillsManagerModal } from './RecurringBillsManagerModal';
import { SavingsGoalManagerModal } from './SavingsGoalManagerModal';
import { ZakatCalculatorModal } from './ZakatCalculatorModal';
import { BazaarShoppingListModal } from './BazaarShoppingListModal';
import RecycleBinModal from './RecycleBinModal';
import SmartExpenseExportModal from './SmartExpenseExportModal';
import SmartAITextImportModal from './SmartAITextImportModal';

export const PersonalDashboard = () => {
  const {
    personalExpenses,
    personalIncomes,
    personalSavings,
    personalEvents = [],
    updatePersonalExpense,
    deletePersonalExpense,
    trashBin = [],
    t,
    lang
  } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [modalType, setModalType] = useState('daily'); // 'daily' | 'family'
  const [showAllEntries, setShowAllEntries] = useState(false);
  const [showRecycleBinModal, setShowRecycleBinModal] = useState(false);
  const [showSmartExportModal, setShowSmartExportModal] = useState(false);
  const [showAIImportModal, setShowAIImportModal] = useState(false);

  // Category 7 Modals
  const [showCashflowModal, setShowCashflowModal] = useState(false);
  const [showFamilyBudgetModal, setShowFamilyBudgetModal] = useState(false);
  const [showRecurringBillsModal, setShowRecurringBillsModal] = useState(false);
  const [showSavingsGoalModal, setShowSavingsGoalModal] = useState(false);
  const [showZakatModal, setShowZakatModal] = useState(false);
  const [showShoppingListModal, setShowShoppingListModal] = useState(false);

  // ----------------------------------------------------
  // 📅 TIME FRAME INTELLIGENCE & SCOPED METRICS
  // ----------------------------------------------------
  const now = useMemo(() => new Date(), []);
  const toYMD = (d) => d.toISOString().split('T')[0];
  const pad = (n) => String(n).padStart(2, '0');

  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth();
  const thisMonthPrefix = `${thisYear}-${pad(thisMonth + 1)}`;
  const lastMonthDate = useMemo(() => new Date(thisYear, thisMonth - 1, 1), [thisYear, thisMonth]);
  const lastMonthPrefix = `${lastMonthDate.getFullYear()}-${pad(lastMonthDate.getMonth() + 1)}`;
  const thisYearPrefix = String(thisYear);

  // Available unique months from dataset
  const availableMonths = useMemo(() => {
    const set = new Set();
    personalExpenses.forEach(e => {
      if (e.date && e.date.length >= 7) set.add(e.date.slice(0, 7));
    });
    return Array.from(set).sort().reverse();
  }, [personalExpenses]);

  const getMonthNameBengali = (yyyyMm) => {
    if (!yyyyMm) return '';
    const parts = yyyyMm.split('-');
    if (parts.length !== 2) return yyyyMm;
    const monthNum = parseInt(parts[1], 10);
    const monthsBn = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    return `${monthsBn[monthNum - 1] || parts[1]} ${parts[0]}`;
  };

  // Strictly Scoped Metrics
  const thisMonthExpenseList = useMemo(() => {
    return personalExpenses.filter(e => (e.date || '').startsWith(thisMonthPrefix));
  }, [personalExpenses, thisMonthPrefix]);

  const thisMonthTotalExpense = useMemo(() => {
    return thisMonthExpenseList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [thisMonthExpenseList]);

  const thisMonthDailyTotal = useMemo(() => {
    return thisMonthExpenseList.filter(e => e.type === 'daily').reduce((s, e) => s + (Number(e.amount) || 0), 0);
  }, [thisMonthExpenseList]);

  const thisMonthFamilyTotal = useMemo(() => {
    return thisMonthExpenseList.filter(e => e.type === 'family').reduce((s, e) => s + (Number(e.amount) || 0), 0);
  }, [thisMonthExpenseList]);

  const lastMonthExpenseList = useMemo(() => {
    return personalExpenses.filter(e => (e.date || '').startsWith(lastMonthPrefix));
  }, [personalExpenses, lastMonthPrefix]);

  const lastMonthTotalExpense = useMemo(() => {
    return lastMonthExpenseList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [lastMonthExpenseList]);

  const thisYearExpenseList = useMemo(() => {
    return personalExpenses.filter(e => (e.date || '').startsWith(thisYearPrefix));
  }, [personalExpenses, thisYearPrefix]);

  const thisYearTotalExpense = useMemo(() => {
    return thisYearExpenseList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [thisYearExpenseList]);

  // Income metrics
  const thisMonthIncome = useMemo(() => {
    return personalIncomes
      .filter(i => (i.date || '').startsWith(thisMonthPrefix))
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [personalIncomes, thisMonthPrefix]);

  const totalAllTimeIncome = useMemo(() => {
    return personalIncomes.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [personalIncomes]);

  const totalAllTimeExpense = useMemo(() => {
    return personalExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [personalExpenses]);
  const totalExpense = totalAllTimeExpense;

  const thisMonthNetBalance = thisMonthIncome - thisMonthTotalExpense;
  const totalAllTimeNetBalance = totalAllTimeIncome - totalAllTimeExpense;

  const familySharePercent = thisMonthTotalExpense > 0
    ? Math.round((thisMonthFamilyTotal / thisMonthTotalExpense) * 100)
    : (totalAllTimeExpense > 0 ? Math.round((personalExpenses.filter(e => e.type === 'family').reduce((s, e) => s + (Number(e.amount) || 0), 0) / totalAllTimeExpense) * 100) : 0);

  // 🕒 Multi-Timeframe Personal Expense Intelligence (Today, This Month, Last Month - with imported records)
  const timeframeExpenses = useMemo(() => {
    const todayStr = toYMD(now);
    const todayList = personalExpenses.filter(e => (e.date || '').startsWith(todayStr));
    const todayTotal = todayList.reduce((s, e) => s + (Number(e.amount) || 0), 0);

    // 7-day breakdown
    const bnDayNames = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
    const past7Days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dStr = toYMD(d);
      const dayList = personalExpenses.filter(e => (e.date || '').startsWith(dStr));
      const total = dayList.reduce((s, e) => s + (Number(e.amount) || 0), 0);
      let label = bnDayNames[d.getDay()];
      if (i === 0) label = lang === 'bn' ? 'আজ' : 'Today';
      else if (i === 1) label = lang === 'bn' ? 'গতকাল' : 'Yesterday';
      past7Days.push({ date: dStr, label, total, count: dayList.length });
    }

    const lastMonthName = lastMonthDate.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', { month: 'long', year: 'numeric' });

    return {
      todayTotal,
      todayCount: todayList.length,
      thisMonthTotal: thisMonthTotalExpense,
      thisMonthCount: thisMonthExpenseList.length,
      lastMonthTotal: lastMonthTotalExpense,
      lastMonthCount: lastMonthExpenseList.length,
      lastMonthName,
      past7Days
    };
  }, [personalExpenses, lang, now, lastMonthDate, thisMonthTotalExpense, thisMonthExpenseList.length, lastMonthTotalExpense, lastMonthExpenseList.length]);

  // ----------------------------------------------------
  // 🔍 TABLE TIMEFRAME FILTER STATE
  // ----------------------------------------------------
  const [tableTimeframe, setTableTimeframe] = useState('this_month'); // 'this_month' | 'last_month' | 'today' | 'week' | 'custom_month' | 'year' | 'all'
  const [customSelectedMonth, setCustomSelectedMonth] = useState(() => availableMonths[0] || thisMonthPrefix);

  const filteredTableExpenses = useMemo(() => {
    const todayStr = toYMD(now);
    const d7 = new Date(now);
    d7.setDate(now.getDate() - 7);
    const weekAgoStr = toYMD(d7);

    return personalExpenses.filter(e => {
      const d = e.date || '';
      if (tableTimeframe === 'today') return d.startsWith(todayStr);
      if (tableTimeframe === 'week') return d >= weekAgoStr && d <= todayStr;
      if (tableTimeframe === 'this_month') return d.startsWith(thisMonthPrefix);
      if (tableTimeframe === 'last_month') return d.startsWith(lastMonthPrefix);
      if (tableTimeframe === 'custom_month') return customSelectedMonth ? d.startsWith(customSelectedMonth) : true;
      if (tableTimeframe === 'year') return d.startsWith(thisYearPrefix);
      if (tableTimeframe === 'all') return true;
      return true;
    });
  }, [personalExpenses, tableTimeframe, customSelectedMonth, now, thisMonthPrefix, lastMonthPrefix, thisYearPrefix]);

  const tableFilterTotalAmount = useMemo(() => {
    return filteredTableExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  }, [filteredTableExpenses]);

  // Quick Rename Handler
  const handleQuickRename = (expense) => {
    const cur = expense.item || expense.title || '';
    const next = window.prompt(lang === 'bn' ? 'খরচের আইটেম বা বিবরণ রিনেম করুন:' : 'Rename expense item:', cur);
    if (next && next.trim() && next.trim() !== cur) {
      updatePersonalExpense(expense.id, {
        item: next.trim(),
        title: next.trim()
      });
    }
  };

  // Category breakdown for chart (Memoized)
  const categories = useMemo(() => [
    { key: 'bazaar', label: t.personal.expenseCategories.bazaar, color: '#10b981' },
    { key: 'rent', label: t.personal.expenseCategories.rent, color: '#6366f1' },
    { key: 'utility', label: t.personal.expenseCategories.utility, color: '#f59e0b' },
    { key: 'medical', label: t.personal.expenseCategories.medical, color: '#ec4899' },
    { key: 'education', label: t.personal.expenseCategories.education, color: '#8b5cf6' },
    { key: 'transport', label: t.personal.expenseCategories.transport, color: '#06b6d4' },
    { key: 'snacks', label: t.personal.expenseCategories.snacks, color: '#f97316' },
    { key: 'internet', label: t.personal.expenseCategories.internet, color: '#14b8a6' },
    { key: 'shopping', label: t.personal.expenseCategories.shopping, color: '#a855f7' },
    { key: 'other', label: t.personal.expenseCategories.other, color: '#64748b' }
  ], [t]);

  const categoryTotals = useMemo(() => {
    return categories.map(cat => {
      const total = personalExpenses
        .filter(e => e.category === cat.key)
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      return { ...cat, total };
    }).filter(c => c.total > 0);
  }, [categories, personalExpenses]);

  const handleOpenModal = (type) => {
    setEditingExpense(null);
    setModalType(type);
    setShowAddModal(true);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setModalType(expense.type || 'daily');
    setShowAddModal(true);
  };

  return (
    <div className="animate-fade-in">
      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
            {lang === 'bn' ? 'ব্যক্তিগত ও পারিবারিক আর্থিক ড্যাশবোর্ড' : 'Personal & Household Finance Dashboard'}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {lang === 'bn' ? 'দৈনন্দিন কেনাকাটা, পারিবারিক ইউটিলিটি বিল ও ব্যক্তিগত সঞ্চয় ট্র্যাকার' : 'Track daily spending, household recurring bills, and savings targets'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Recycle Bin Button */}
          <button
            onClick={() => setShowRecycleBinModal(true)}
            title={lang === 'bn' ? 'রিসাইকেল বিন (মুছে ফেলা খরচ ও রিস্টোর)' : 'Recycle Bin'}
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Trash2 size={16} />
            <span>{lang === 'bn' ? 'রিসাইকেল বিন' : 'Trash'}</span>
            {trashBin.length > 0 && (
              <span
                style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  borderRadius: '10px',
                  padding: '1px 6px',
                  marginLeft: '2px'
                }}
              >
                {trashBin.length}
              </span>
            )}
          </button>

          {/* Smart Export Button */}
          <button
            onClick={() => setShowSmartExportModal(true)}
            title={lang === 'bn' ? 'মান্থ-ওয়াইজ, প্রোডাক্ট-ওয়াইজ ও প্রাইস-ওয়াইজ এক্সপোর্ট' : 'Smart Expense Export'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.12)',
              color: '#818cf8',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <FileSpreadsheet size={16} />
            <span>{lang === 'bn' ? 'স্মার্ট এক্সপোর্ট' : 'Smart Export'}</span>
          </button>

          {/* Smart AI Text Import Button */}
          <button
            onClick={() => setShowAIImportModal(true)}
            title={lang === 'bn' ? 'ChatGPT বা Gemini-র টেক্সট থেকে স্মার্ট ইমপোর্ট' : 'Smart AI Text Import'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.15))',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
            }}
          >
            <Sparkles size={16} />
            <span>{lang === 'bn' ? '⚡ এআই টেক্সট ইমপোর্ট' : '⚡ AI Text Import'}</span>
          </button>

          <button className="btn btn-primary" onClick={() => handleOpenModal('daily')}>
            <ShoppingBag size={16} />
            <span>{t.personal.addDailyExpense}</span>
          </button>
          <button className="btn btn-secondary" onClick={() => handleOpenModal('family')}>
            <Home size={16} />
            <span>{t.personal.addFamilyExpense}</span>
          </button>
        </div>
      </div>

      {/* 🚀 Mobile / Desktop Slidable Smart Personal Suite Bar */}
      <div
        className="personal-suite-slidable-bar"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01))',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '10px 12px',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.15)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', padding: '0 4px' }}>
          <span style={{ fontSize: '0.76rem', fontWeight: '800', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.02em' }}>
            <span>⚡ স্মার্ট পার্সোনাল স্যুট (স্ক্রল/স্লাইড করুন):</span>
          </span>
          <span style={{ fontSize: '0.68rem', color: '#0ea5e9', fontWeight: '700' }}>
            {lang === 'bn' ? '👉 ডানে স্লাইড করুন' : '👉 Slide right'}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* 1. Trash (রিসাইকেল বিন) */}
          <button
            onClick={() => setShowRecycleBinModal(true)}
            style={{
              flex: '0 0 auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Trash2 size={15} />
            <span>{lang === 'bn' ? 'ট্র্যাশ (রিসাইকেল)' : 'Trash Bin'}</span>
            {trashBin.length > 0 && (
              <span style={{ backgroundColor: '#ef4444', color: '#ffffff', fontSize: '0.68rem', fontWeight: '800', borderRadius: '10px', padding: '1px 6px', marginLeft: '2px' }}>
                {trashBin.length}
              </span>
            )}
          </button>

          {/* 2. Smart Export */}
          <button
            onClick={() => setShowSmartExportModal(true)}
            style={{
              flex: '0 0 auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.12)',
              color: '#818cf8',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <FileSpreadsheet size={15} />
            <span>{lang === 'bn' ? 'স্মার্ট এক্সপোর্ট' : 'Smart Export'}</span>
          </button>

          {/* 3. AI Text Export */}
          <button
            onClick={() => setShowSmartExportModal(true)}
            style={{
              flex: '0 0 auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(99, 102, 241, 0.12))',
              color: '#38bdf8',
              border: '1px solid rgba(14, 165, 233, 0.35)',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Sparkles size={15} />
            <span>{lang === 'bn' ? 'AI টেক্সট এক্সপোর্ট' : 'AI Text Export'}</span>
          </button>

          {/* 4. AI Text Import */}
          <button
            onClick={() => setShowAIImportModal(true)}
            style={{
              flex: '0 0 auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.15))',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Sparkles size={15} />
            <span>{lang === 'bn' ? '⚡ AI টেক্সট ইমপোর্ট' : '⚡ AI Text Import'}</span>
          </button>

          {/* 5. Cash Flow */}
          <button
            onClick={() => setShowCashflowModal(true)}
            style={{
              flex: '0 0 auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              background: 'rgba(6, 182, 212, 0.1)',
              color: '#06b6d4',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <TrendingUp size={15} />
            <span>{lang === 'bn' ? 'ক্যাশ ফ্লো (Cash Flow)' : 'Cash Flow'}</span>
          </button>

          {/* 6. Calendar */}
          <button
            onClick={() => setShowCashflowModal(true)}
            style={{
              flex: '0 0 auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Calendar size={15} />
            <span>{lang === 'bn' ? 'ক্যালেন্ডার ও দিনলিপি' : 'Calendar'}</span>
          </button>

          {/* 7. Paribarik Budget */}
          <button
            onClick={() => setShowFamilyBudgetModal(true)}
            style={{
              flex: '0 0 auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              background: 'rgba(139, 92, 246, 0.1)',
              color: '#a78bfa',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Users size={15} />
            <span>{lang === 'bn' ? 'পারিবারিক বাজেট' : 'Family Budget'}</span>
          </button>

          {/* 8. Sonchoy */}
          <button
            onClick={() => setShowSavingsGoalModal(true)}
            style={{
              flex: '0 0 auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Target size={15} />
            <span>{lang === 'bn' ? 'সঞ্চয় ও সেভিংস লক্ষ্য' : 'Savings Goals'}</span>
          </button>

          {/* 9. Zakat Calculation */}
          <button
            onClick={() => setShowZakatModal(true)}
            style={{
              flex: '0 0 auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              background: 'rgba(236, 72, 153, 0.1)',
              color: '#f472b6',
              border: '1px solid rgba(236, 72, 153, 0.25)',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Coins size={15} />
            <span>{lang === 'bn' ? 'যাকাত ক্যালকুলেটর' : 'Zakat Calculator'}</span>
          </button>

          {/* 10. Recurring Bills */}
          <button
            onClick={() => setShowRecurringBillsModal(true)}
            style={{
              flex: '0 0 auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.1)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Zap size={15} />
            <span>{lang === 'bn' ? 'রিকারিং বিল' : 'Recurring Bills'}</span>
          </button>

          {/* 11. Shopping List */}
          <button
            onClick={() => setShowShoppingListModal(true)}
            style={{
              flex: '0 0 auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <ShoppingCart size={15} />
            <span>{lang === 'bn' ? 'বাজারের ফর্দ' : 'Shopping List'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        {/* Card 1: Current Month Expenses */}
        <div className="glass-card stat-card glow-card" style={{ border: '1.5px solid rgba(14, 165, 233, 0.35)' }}>
          <div className="stat-icon" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9' }}>
            <TrendingDown size={24} />
          </div>
          <div className="stat-info">
            <h3 style={{ color: '#0ea5e9' }}>{lang === 'bn' ? 'চলতি মাসের মোট খরচ' : 'This Month Expense'}</h3>
            <div className="stat-value" style={{ color: '#0ea5e9' }}>৳{thisMonthTotalExpense.toLocaleString()}</div>
            <div className="stat-trend" style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
              ৳{thisMonthDailyTotal.toLocaleString()} {lang === 'bn' ? 'দৈনিক' : 'Daily'} + ৳{thisMonthFamilyTotal.toLocaleString()} {lang === 'bn' ? 'পারিবারিক' : 'Family'}
            </div>
          </div>
        </div>

        {/* Card 2: Last Month Expenses (Pre-imported Month) */}
        <div className="glass-card stat-card glow-card" style={{ border: '1.5px solid rgba(245, 158, 11, 0.35)' }}>
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <h3 style={{ color: '#f59e0b' }}>{lang === 'bn' ? `গত মাসের খরচ (${timeframeExpenses.lastMonthName})` : 'Last Month Expense'}</h3>
            <div className="stat-value" style={{ color: '#f59e0b' }}>৳{lastMonthTotalExpense.toLocaleString()}</div>
            <div className="stat-trend" style={{ color: '#f59e0b', fontSize: '0.74rem' }}>
              {lastMonthExpenseList.length} {lang === 'bn' ? 'টি এন্ট্রি (এক্সেল/পিডিএফ ইমপোর্ট)' : 'items (imported)'}
            </div>
          </div>
        </div>

        {/* Card 3: This Year Total Expense */}
        <div className="glass-card stat-card glow-card" style={{ border: '1.5px solid rgba(139, 92, 246, 0.35)' }}>
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
            <Home size={24} />
          </div>
          <div className="stat-info">
            <h3 style={{ color: '#8b5cf6' }}>{lang === 'bn' ? `এই বছরের খরচ (${thisYear})` : 'This Year Expense'}</h3>
            <div className="stat-value" style={{ color: '#8b5cf6' }}>৳{thisYearTotalExpense.toLocaleString()}</div>
            <div className="stat-trend" style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
              {lang === 'bn' ? 'সর্বমোট অল-টাইম:' : 'All-time:'} ৳{totalAllTimeExpense.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Card 4: Current Month Income & Net Balance */}
        <div className="glass-card stat-card glow-card" style={{ border: '1.5px solid rgba(16, 185, 129, 0.35)' }}>
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <Wallet size={24} />
          </div>
          <div className="stat-info">
            <h3 style={{ color: '#10b981' }}>{lang === 'bn' ? 'চলতি মাসের আয় ও ব্যালেন্স' : 'This Month Income & Net'}</h3>
            <div className="stat-value" style={{ color: '#10b981' }}>৳{thisMonthIncome.toLocaleString()}</div>
            <div className="stat-trend" style={{ color: thisMonthNetBalance >= 0 ? '#10b981' : '#ef4444', fontSize: '0.74rem', fontWeight: '700' }}>
              {lang === 'bn' ? 'নিট ব্যালেন্স:' : 'Net:'} ৳{thisMonthNetBalance.toLocaleString()} {thisMonthNetBalance >= 0 ? '(উদ্বৃত্ত)' : '(ঘাটতি)'}
            </div>
          </div>
        </div>
      </div>

      {/* 🕒 সময়কালভিত্তিক ব্যক্তিগত ও পারিবারিক খরচের তুলনা (Timeframe Comparison) */}
      <div
        className="glass-card"
        style={{
          padding: '16px',
          borderRadius: '16px',
          marginBottom: '1.5rem',
          background: 'var(--bg-card)',
          border: '1.5px solid rgba(6, 182, 212, 0.25)',
          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.05)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🕒</span>
              <span>{lang === 'bn' ? 'সময়কালভিত্তিক খরচের বিস্তারিত বিবরণ' : 'Timeframe Expense Comparison'}</span>
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {lang === 'bn'
                ? 'আজকের খরচ, চলতি মাসের হিসাব এবং আগের মাসের ইমপোর্টকৃত মোট ব্যয়ের পরিসংখ্যান'
                : "Today's spending, current month total, and previous month imported records"}
            </p>
          </div>
        </div>

        {/* 3 Metric Comparison Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '14px' }}>
          {/* Card 1: Today */}
          <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#10b981' }}>
                🟢 {lang === 'bn' ? 'আজকের খরচ (Today)' : 'Today'}
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{timeframeExpenses.todayCount} {lang === 'bn' ? 'টি' : 'items'}</span>
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
              ৳{timeframeExpenses.todayTotal.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Card 2: This Month */}
          <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#0ea5e9' }}>
                📆 {lang === 'bn' ? 'চলতি মাসের মোট খরচ' : 'This Month'}
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{timeframeExpenses.thisMonthCount} {lang === 'bn' ? 'টি' : 'items'}</span>
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#0ea5e9', fontFamily: 'var(--font-mono)' }}>
              ৳{timeframeExpenses.thisMonthTotal.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Card 3: Last Month (Pre-imported Month) */}
          <div style={{ background: 'var(--bg-main)', border: '1.5px solid rgba(245, 158, 11, 0.4)', borderRadius: '12px', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#f59e0b' }}>
                📂 {lang === 'bn' ? `গত মাস (${timeframeExpenses.lastMonthName})` : 'Last Month'}
              </span>
              <span style={{ fontSize: '0.68rem', color: '#f59e0b', fontWeight: '700' }}>
                {timeframeExpenses.lastMonthCount} {lang === 'bn' ? 'টি (ইমপোর্টকৃত)' : 'imported'}
              </span>
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
              ৳{timeframeExpenses.lastMonthTotal.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {lang === 'bn' ? 'পিডিএফ থেকে ইমপোর্টকৃত খরচসমূহ অন্তর্ভুক্ত' : 'Includes imported PDF records'}
            </div>
          </div>
        </div>

        {/* 7-Day Day-by-Day Strip */}
        <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 12px' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>
            {lang === 'bn' ? '📊 বিগত ৭ দিনের দিনভিত্তিক খরচ:' : 'Past 7 Days Daily Breakdown:'}
          </div>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
            {timeframeExpenses.past7Days.map((d) => (
              <div
                key={d.date}
                style={{
                  flex: '1 0 90px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '6px 8px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)' }}>{d.label}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: '900', color: d.total > 0 ? '#ef4444' : 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  ৳{d.total.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Charts & Savings Goals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        
        {/* Category Breakdown Progress */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieIcon size={18} style={{ color: 'var(--personal-primary)' }} />
            <span>{lang === 'bn' ? 'ক্যাটাগরি অনুযায়ী খরচের বিবরণ' : 'Expense Breakdown by Category'}</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {categoryTotals.map((item, idx) => {
              const catTotalSum = categoryTotals.reduce((s, c) => s + c.total, 0) || totalExpense || 1;
              const pct = catTotalSum > 0 ? Math.round((item.total / catTotalSum) * 100) : 0;
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }} />
                      {item.label}
                    </span>
                    <span style={{ fontWeight: '600', fontFamily: 'var(--font-mono)' }}>
                      ৳{item.total.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: item.color, borderRadius: '4px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Savings Goals */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={18} style={{ color: '#06b6d4' }} />
            <span>{t.personal.savingsGoal}</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {personalSavings.map((goal) => {
              const progress = Math.min(100, Math.round((goal.saved / goal.target) * 100));
              return (
                <div key={goal.id} style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>{goal.title}</span>
                    <span className="badge" style={{ background: `${goal.color}25`, color: goal.color }}>
                      {progress}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    <span>{t.personal.saved}: ৳{goal.saved.toLocaleString()}</span>
                    <span>{t.personal.target}: ৳{goal.target.toLocaleString()}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: goal.color, borderRadius: '4px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Personal Transactions Table */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: 0 }}>
              {lang === 'bn' ? 'ব্যক্তিগত ও পারিবারিক খরচের তালিকা (সময়কাল ফিল্টার সহ)' : 'Personal & Family Expenses (Filtered)'}
            </h3>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              {lang === 'bn' ? 'নির্বাচিত ফিল্টারে মোট এন্ট্রি:' : 'Filtered Entries:'} <strong style={{ color: '#0ea5e9' }}>{filteredTableExpenses.length}</strong> {lang === 'bn' ? 'টি' : ''} | {lang === 'bn' ? 'মোট:' : 'Total:'} <strong style={{ color: '#ef4444' }}>৳{tableFilterTotalAmount.toLocaleString('en-IN')}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAllEntries(!showAllEntries)}
            style={{
              padding: '5px 12px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              fontSize: '0.76rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            {showAllEntries
              ? (lang === 'bn' ? 'সংক্ষিপ্ত দেখুন (১০টি)' : 'Show 10')
              : (lang === 'bn' ? `সবগুলো দেখুন (${filteredTableExpenses.length}টি)` : `Show All (${filteredTableExpenses.length})`)}
          </button>
        </div>

        {/* 📅 Comprehensive Timeframe Filter Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '1rem',
            padding: '10px 14px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}
        >
          <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} style={{ color: '#0ea5e9' }} /> {lang === 'bn' ? 'ফিল্টার:' : 'Filter:'}
          </span>

          {[
            { id: 'today', label: lang === 'bn' ? 'আজ' : 'Today' },
            { id: 'week', label: lang === 'bn' ? 'এই সপ্তাহ' : 'This Week' },
            { id: 'this_month', label: lang === 'bn' ? 'চলতি মাস (অক্টোবর)' : 'This Month' },
            { id: 'last_month', label: lang === 'bn' ? 'গত মাস (সেপ্টেম্বর)' : 'Last Month' },
            { id: 'year', label: lang === 'bn' ? `এই বছর (${thisYear})` : 'This Year' },
            { id: 'all', label: lang === 'bn' ? 'সকল লেনদেন' : 'All Time' }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setTableTimeframe(f.id)}
              style={{
                padding: '5px 12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: tableTimeframe === f.id ? '#0284c7' : 'rgba(255, 255, 255, 0.06)',
                color: tableTimeframe === f.id ? '#ffffff' : 'var(--text-muted)',
                fontWeight: tableTimeframe === f.id ? '800' : '600',
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {f.label}
            </button>
          ))}

          {/* Specific Month Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'নির্দিষ্ট মাস:' : 'Specific Month:'}</span>
            <select
              value={tableTimeframe === 'custom_month' ? customSelectedMonth : ''}
              onChange={(e) => {
                if (e.target.value) {
                  setCustomSelectedMonth(e.target.value);
                  setTableTimeframe('custom_month');
                }
              }}
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                backgroundColor: tableTimeframe === 'custom_month' ? '#0284c7' : 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                border: '1px solid var(--border-color)',
                fontSize: '0.78rem',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="" style={{ backgroundColor: '#1e2230' }}>
                {lang === 'bn' ? '📅 মাস নির্বাচন করুন...' : 'Select month...'}
              </option>
              {availableMonths.map(m => (
                <option key={m} value={m} style={{ backgroundColor: '#1e2230' }}>
                  {getMonthNameBengali(m)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t.date}</th>
                <th>{t.category}</th>
                <th>{lang === 'bn' ? 'আইটেম / কী কিনছি' : 'Item Description'}</th>
                <th>{lang === 'bn' ? 'ধরন' : 'Type'}</th>
                <th style={{ textAlign: 'right' }}>{t.amount}</th>
                <th style={{ textAlign: 'center' }}>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredTableExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)' }}>
                    {lang === 'bn' ? 'নির্বাচিত সময়কালে কোনো খরচের তথ্য পাওয়া যায়নি।' : 'No expenses found in selected timeframe.'}
                  </td>
                </tr>
              ) : (
                (showAllEntries ? filteredTableExpenses : filteredTableExpenses.slice(0, 10)).map((exp) => (
                <tr key={exp.id}>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} />
                    {exp.date}
                  </td>
                  <td>
                    <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-main)' }}>
                      <Tag size={12} />
                      {t.personal.expenseCategories[exp.category] || (exp.category && exp.category !== 'other' ? exp.category : (exp.type === 'family' ? (exp.folder || 'পারিবারিক খরচ') : (exp.folder || 'দৈনন্দিন বাজার')))}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{exp.item || exp.title}</div>
                    {exp.quantity !== null && exp.quantity !== undefined && exp.quantity !== '' && (
                      <div style={{ fontSize: '0.75rem', color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', fontWeight: '600' }}>
                        <span>⚖️ {exp.quantity} {exp.unit}</span>
                      </div>
                    )}
                    {exp.note && <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{exp.note}</div>}
                  </td>
                  <td>
                    <span className={`badge ${exp.type === 'family' ? 'badge-warning' : 'badge-mode'}`}>
                      {exp.type === 'family' ? (lang === 'bn' ? 'পারিবারিক' : 'Family') : (lang === 'bn' ? 'দৈনন্দিন' : 'Daily')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '700', fontFamily: 'var(--font-mono)', color: '#ef4444' }}>
                    -৳{exp.amount.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <button
                        className="btn-icon"
                        onClick={() => handleQuickRename(exp)}
                        title={lang === 'bn' ? 'রিনেম / নাম পরিবর্তন' : 'Rename Expense'}
                        style={{ color: '#06b6d4', padding: '4px' }}
                      >
                        <span style={{ fontSize: '13px' }}>🏷️</span>
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleEditExpense(exp)}
                        title={lang === 'bn' ? 'সম্পাদনা / রি-এডিট' : 'Edit Expense'}
                        style={{ color: '#10b981', padding: '4px' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => {
                          if (window.confirm(lang === 'bn' ? 'এই খরচের রেকর্ডটি মুছে ফেলতে চান?' : 'Delete this expense?')) {
                            deletePersonalExpense(exp.id);
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
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {/* Unified Add Expense Modal (Identical to DailyExpenses.jsx) */}
      <DailyExpenseAddEditModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingExpense(null);
        }}
        editingExpense={editingExpense}
        initialType={modalType}
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

      {/* Bazaar Shopping List Modal (Item 61) */}
      <BazaarShoppingListModal
        isOpen={showShoppingListModal}
        onClose={() => setShowShoppingListModal(false)}
        onOpenExpenseModal={() => handleOpenModal('daily')}
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
    </div>
  );
};
