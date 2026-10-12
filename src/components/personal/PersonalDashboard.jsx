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
  ShoppingCart
} from 'lucide-react';
import { DailyExpenseAddEditModal } from './DailyExpenseAddEditModal';
import { CashflowCalendarModal } from './CashflowCalendarModal';
import { FamilyBudgetAllocationModal } from './FamilyBudgetAllocationModal';
import { RecurringBillsManagerModal } from './RecurringBillsManagerModal';
import { SavingsGoalManagerModal } from './SavingsGoalManagerModal';
import { ZakatCalculatorModal } from './ZakatCalculatorModal';
import { BazaarShoppingListModal } from './BazaarShoppingListModal';

export const PersonalDashboard = () => {
  const {
    personalExpenses,
    personalIncomes,
    personalSavings,
    personalEvents = [],
    updatePersonalExpense,
    deletePersonalExpense,
    t,
    lang
  } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [modalType, setModalType] = useState('daily'); // 'daily' | 'family'
  const [showAllEntries, setShowAllEntries] = useState(false);

  // Category 7 Modals
  const [showCashflowModal, setShowCashflowModal] = useState(false);
  const [showFamilyBudgetModal, setShowFamilyBudgetModal] = useState(false);
  const [showRecurringBillsModal, setShowRecurringBillsModal] = useState(false);
  const [showSavingsGoalModal, setShowSavingsGoalModal] = useState(false);
  const [showZakatModal, setShowZakatModal] = useState(false);
  const [showShoppingListModal, setShowShoppingListModal] = useState(false);

  // Calculate totals (Memoized)
  const totalIncome = useMemo(() => personalIncomes.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0), [personalIncomes]);
  const totalExpense = useMemo(() => personalExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0), [personalExpenses]);
  const netBalance = totalIncome - totalExpense;

  const dailyExpensesTotal = useMemo(() => personalExpenses
    .filter(e => e.type === 'daily')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0), [personalExpenses]);

  const familyExpensesTotal = useMemo(() => personalExpenses
    .filter(e => e.type === 'family')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0), [personalExpenses]);

  const familySharePercent = totalExpense > 0 ? Math.round((familyExpensesTotal / totalExpense) * 100) : 0;

  // 🕒 Multi-Timeframe Personal Expense Intelligence (Today, This Month, Last Month - with imported records)
  const timeframeExpenses = useMemo(() => {
    const now = new Date();
    const toYMD = (d) => d.toISOString().split('T')[0];
    const todayStr = toYMD(now);

    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth();
    const pad = (n) => String(n).padStart(2, '0');

    const thisMonthPrefix = `${thisYear}-${pad(thisMonth + 1)}`;
    const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);
    const lastMonthPrefix = `${lastMonthDate.getFullYear()}-${pad(lastMonthDate.getMonth() + 1)}`;

    const todayList = personalExpenses.filter(e => (e.date || '').startsWith(todayStr));
    const todayTotal = todayList.reduce((s, e) => s + (Number(e.amount) || 0), 0);

    const thisMonthList = personalExpenses.filter(e => (e.date || '').startsWith(thisMonthPrefix));
    const thisMonthTotal = thisMonthList.reduce((s, e) => s + (Number(e.amount) || 0), 0);

    const lastMonthList = personalExpenses.filter(e => (e.date || '').startsWith(lastMonthPrefix));
    const lastMonthTotal = lastMonthList.reduce((s, e) => s + (Number(e.amount) || 0), 0);

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
      thisMonthTotal,
      thisMonthCount: thisMonthList.length,
      lastMonthTotal,
      lastMonthCount: lastMonthList.length,
      lastMonthName,
      past7Days
    };
  }, [personalExpenses, lang]);

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

        <div style={{ display: 'flex', gap: '8px' }}>
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

      {/* Quick Smart Finance Suite Chips Row */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '1.5rem', scrollbarWidth: 'none' }}>
        <button
          onClick={() => setShowCashflowModal(true)}
          className="badge"
          style={{ padding: '7px 14px', background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', border: '1px solid rgba(6, 182, 212, 0.25)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', fontWeight: 600, borderRadius: '20px', whiteSpace: 'nowrap' }}
        >
          <Calendar size={14} /> ক্যাশফ্লো ক্যালেন্ডার
        </button>

        <button
          onClick={() => setShowFamilyBudgetModal(true)}
          className="badge"
          style={{ padding: '7px 14px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.25)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', fontWeight: 600, borderRadius: '20px', whiteSpace: 'nowrap' }}
        >
          <Users size={14} /> পারিবারিক বাজেট বণ্টন
        </button>

        <button
          onClick={() => setShowRecurringBillsModal(true)}
          className="badge"
          style={{ padding: '7px 14px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.25)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', fontWeight: 600, borderRadius: '20px', whiteSpace: 'nowrap' }}
        >
          <Zap size={14} /> রিকারিং বিল ও ইউটিলিটি
        </button>

        <button
          onClick={() => setShowSavingsGoalModal(true)}
          className="badge"
          style={{ padding: '7px 14px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', fontWeight: 600, borderRadius: '20px', whiteSpace: 'nowrap' }}
        >
          <Target size={14} /> সঞ্চয় লক্ষ্যমাত্রা পোর্টফোলিও
        </button>

        <button
          onClick={() => setShowZakatModal(true)}
          className="badge"
          style={{ padding: '7px 14px', background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', border: '1px solid rgba(236, 72, 153, 0.25)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', fontWeight: 600, borderRadius: '20px', whiteSpace: 'nowrap' }}
        >
          <Coins size={14} /> যাকাত ক্যালকুলেটর
        </button>

        <button
          onClick={() => setShowShoppingListModal(true)}
          className="badge"
          style={{ padding: '7px 14px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', fontWeight: 600, borderRadius: '20px', whiteSpace: 'nowrap' }}
        >
          <ShoppingCart size={14} /> বাজারের ফর্দ
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        {/* Total Income */}
        <div className="glass-card stat-card glow-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <Wallet size={24} />
          </div>
          <div className="stat-info">
            <h3>{t.personal.totalIncome}</h3>
            <div className="stat-value">৳{totalIncome.toLocaleString()}</div>
            <div className="stat-trend" style={{ color: '#10b981' }}>
              <TrendingUp size={14} /> {lang === 'bn' ? 'চলতি মাস' : 'Current Month'}
            </div>
          </div>
        </div>

        {/* Total Expense */}
        <div className="glass-card stat-card glow-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <TrendingDown size={24} />
          </div>
          <div className="stat-info">
            <h3>{t.personal.totalExpense}</h3>
            <div className="stat-value">৳{totalExpense.toLocaleString()}</div>
            <div className="stat-trend" style={{ color: '#ef4444' }}>
              {dailyExpensesTotal.toLocaleString()} {lang === 'bn' ? 'দৈনিক' : 'Daily'} + {familyExpensesTotal.toLocaleString()} {lang === 'bn' ? 'পারিবারিক' : 'Family'}
            </div>
          </div>
        </div>

        {/* Net Remaining Balance */}
        <div className="glass-card stat-card glow-card">
          <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
            <PieIcon size={24} />
          </div>
          <div className="stat-info">
            <h3>{t.personal.netBalance}</h3>
            <div className="stat-value" style={{ color: netBalance >= 0 ? '#10b981' : '#ef4444' }}>
              ৳{netBalance.toLocaleString()}
            </div>
            <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>
              {netBalance >= 0 ? (lang === 'bn' ? 'সঞ্চয়ের সুযোগ আছে' : 'Positive Surplus') : (lang === 'bn' ? 'বাজেট ঘাটতি' : 'Overbudget')}
            </div>
          </div>
        </div>

        {/* Family Share */}
        <div className="glass-card stat-card glow-card">
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
            <Home size={24} />
          </div>
          <div className="stat-info">
            <h3>{t.personal.familyShare}</h3>
            <div className="stat-value">{familySharePercent}%</div>
            <div className="stat-trend" style={{ color: '#8b5cf6' }}>
              ৳{familyExpensesTotal.toLocaleString()} {lang === 'bn' ? 'পারিবারিক ব্যয়' : 'Family Cost'}
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
              const pct = totalExpense > 0 ? Math.round((item.total / totalExpense) * 100) : 0;
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
              {lang === 'bn' ? 'ব্যক্তিগত ও পারিবারিক খরচের তালিকা (এডিট ও রিনেম সুবিধা সহ)' : 'Personal & Family Expenses (Editable)'}
            </h3>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              {personalExpenses.length} {lang === 'bn' ? 'টি মোট এন্ট্রি' : 'total entries'}
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
              : (lang === 'bn' ? `সবগুলো দেখুন (${personalExpenses.length}টি)` : `Show All (${personalExpenses.length})`)}
          </button>
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
              {(showAllEntries ? personalExpenses : personalExpenses.slice(0, 10)).map((exp) => (
                <tr key={exp.id}>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} />
                    {exp.date}
                  </td>
                  <td>
                    <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-main)' }}>
                      <Tag size={12} />
                      {t.personal.expenseCategories[exp.category] || exp.folder || exp.category}
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
              ))}
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
    </div>
  );
};
