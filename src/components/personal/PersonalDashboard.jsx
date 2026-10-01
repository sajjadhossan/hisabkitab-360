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
  ShoppingBag
} from 'lucide-react';
import { DailyExpenseAddEditModal } from './DailyExpenseAddEditModal';

export const PersonalDashboard = () => {
  const {
    personalExpenses,
    personalIncomes,
    personalSavings,
    personalEvents = [],
    deletePersonalExpense,
    t,
    lang
  } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState('daily'); // 'daily' | 'family'

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
    setModalType(type);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>
            {lang === 'bn' ? 'সাম্প্রতিক ব্যক্তিগত ও পারিবারিক খরচের তালিকা' : 'Recent Personal & Family Expenses'}
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {personalExpenses.length} {lang === 'bn' ? 'টি এন্ট্রি' : 'entries'}
          </span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t.date}</th>
                <th>{t.category}</th>
                <th>{t.note}</th>
                <th>{lang === 'bn' ? 'ধরন' : 'Type'}</th>
                <th style={{ textAlign: 'right' }}>{t.amount}</th>
                <th style={{ textAlign: 'center' }}>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {personalExpenses.slice(0, 8).map((exp) => (
                <tr key={exp.id}>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} />
                    {exp.date}
                  </td>
                  <td>
                    <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-main)' }}>
                      <Tag size={12} />
                      {t.personal.expenseCategories[exp.category] || exp.category}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{exp.item || exp.title}</div>
                    {exp.quantity !== null && exp.quantity !== undefined && exp.quantity !== '' && (
                      <div style={{ fontSize: '0.75rem', color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', fontWeight: '600' }}>
                        <span>⚖️ {exp.quantity} {exp.unit}</span>
                      </div>
                    )}
                    {exp.note && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{exp.note}</div>}
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
                    <button
                      className="btn-icon"
                      onClick={() => deletePersonalExpense(exp.id)}
                      title={t.delete}
                      style={{ color: '#ef4444' }}
                    >
                      <Trash2 size={15} />
                    </button>
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
        onClose={() => setShowAddModal(false)}
        initialType={modalType}
      />
    </div>
  );
};
