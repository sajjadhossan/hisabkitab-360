import React from 'react';
import { useApp } from '../../context/AppContext';
import { PieChart, TrendingUp, TrendingDown, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const PersonalAnalytics = () => {
  const { personalExpenses, personalIncomes, personalSavings, t, lang } = useApp();

  const totalIncome = personalIncomes.reduce((s, i) => s + i.amount, 0);
  const totalExpense = personalExpenses.reduce((s, e) => s + e.amount, 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;

  const categories = [
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
  ];

  const categoryTotals = categories.map(cat => {
    const total = personalExpenses
      .filter(e => e.category === cat.key)
      .reduce((sum, e) => sum + e.amount, 0);
    return { ...cat, total };
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
          {lang === 'bn' ? 'ব্যক্তিগত আর্থিক স্বাস্থ্য ও খরচ বিশ্লেষণ' : 'Personal Financial Health & Analytics'}
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {lang === 'bn' ? 'আয়ের তুলনায় খরচের হার, সঞ্চয় অনুপাত এবং ক্যাটাগরি বিশ্লেষণ' : 'Monthly savings rate, expense breakdown, and budget compliance'}
        </p>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="stats-grid">
        <div className="glass-card stat-card glow-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <h3>{lang === 'bn' ? 'সঞ্চয়ের হার (Savings Rate)' : 'Savings Rate'}</h3>
            <div className="stat-value">{savingsRate}%</div>
            <div className="stat-trend" style={{ color: savingsRate >= 20 ? '#10b981' : '#f59e0b' }}>
              {savingsRate >= 20 ? (lang === 'bn' ? 'চমৎকার স্বাস্থ্যকর সঞ্চয়' : 'Healthy Savings Rate') : (lang === 'bn' ? 'খরচ কমানোর পরামর্শ' : 'Consider Reducing Expenses')}
            </div>
          </div>
        </div>

        <div className="glass-card stat-card glow-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
            <PieChart size={24} />
          </div>
          <div className="stat-info">
            <h3>{lang === 'bn' ? 'খরচের শীর্ষে থাকা খাত' : 'Top Expense Sector'}</h3>
            <div className="stat-value" style={{ fontSize: '1.2rem' }}>
              {categoryTotals[0] ? categoryTotals[0].label : 'N/A'}
            </div>
            <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>
              ৳{categoryTotals[0] ? categoryTotals[0].total.toLocaleString() : '0'}
            </div>
          </div>
        </div>

        <div className="glass-card stat-card glow-card">
          <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
            <ShieldCheck size={24} />
          </div>
          <div className="stat-info">
            <h3>{lang === 'bn' ? 'মোট সঞ্চিত তহবিল' : 'Total Saved Reserves'}</h3>
            <div className="stat-value">
              ৳{personalSavings.reduce((s, g) => s + g.saved, 0).toLocaleString()}
            </div>
            <div className="stat-trend" style={{ color: '#06b6d4' }}>
              {personalSavings.length} {lang === 'bn' ? 'টি সক্রিয় লক্ষ্য' : 'Active Goals'}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Comparison: Income vs Expense Bar */}
      <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem' }}>
          {lang === 'bn' ? 'মাসিক আয় বনাম মোট ব্যয়ের অনুপাত' : 'Monthly Income vs Expenditure Comparison'}
        </h3>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.personal.totalIncome}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#10b981' }}>৳{totalIncome.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.personal.totalExpense}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#ef4444' }}>৳{totalExpense.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.personal.netBalance}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: netSavings >= 0 ? '#06b6d4' : '#ef4444' }}>
              ৳{netSavings.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Visual Stacked Progress Bar */}
        <div style={{ width: '100%', height: '24px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '12px', overflow: 'hidden', display: 'flex' }}>
          <div
            style={{
              width: `${Math.min(100, (totalExpense / Math.max(1, totalIncome)) * 100)}%`,
              background: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '11px',
              fontWeight: '700'
            }}
          >
            {Math.round((totalExpense / Math.max(1, totalIncome)) * 100)}% {lang === 'bn' ? 'খরচ' : 'Expense'}
          </div>
          <div
            style={{
              flex: 1,
              background: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '11px',
              fontWeight: '700'
            }}
          >
            {savingsRate}% {lang === 'bn' ? 'উদ্বৃত্ত' : 'Savings'}
          </div>
        </div>
      </div>

      {/* Ranked Category Distribution */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem' }}>
          {lang === 'bn' ? 'খরচের শীর্ষ খাতসমূহ (র‍্যাংকিং)' : 'Expense Sectors by Volume'}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {categoryTotals.map((cat, idx) => (
            <div key={idx} style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: cat.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800' }}>
                  {idx + 1}
                </span>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{cat.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {Math.round((cat.total / totalExpense) * 100)}% {lang === 'bn' ? 'মোট খরচের' : 'of total'}
                  </div>
                </div>
              </div>
              <div style={{ fontWeight: '700', fontFamily: 'var(--font-mono)', fontSize: '1rem', color: 'var(--text-main)' }}>
                ৳{cat.total.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
