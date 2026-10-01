import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Wallet, Plus, Target, Trash2, Calendar, TrendingUp } from 'lucide-react';

export const PersonalIncome = () => {
  const {
    personalIncomes,
    addPersonalIncome,
    deletePersonalIncome,
    personalSavings,
    updateSavingsGoal,
    t,
    lang
  } = useApp();

  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [incomeForm, setIncomeForm] = useState({
    source: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  const [selectedGoal, setSelectedGoal] = useState(null);
  const [savingsAmount, setSavingsAmount] = useState('');

  const totalIncome = personalIncomes.reduce((s, i) => s + i.amount, 0);

  const handleIncomeSubmit = (e) => {
    e.preventDefault();
    if (!incomeForm.source || !incomeForm.amount) return;
    addPersonalIncome({
      source: incomeForm.source,
      amount: Number(incomeForm.amount),
      date: incomeForm.date,
      note: incomeForm.note
    });
    setIncomeForm({
      source: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      note: ''
    });
    setShowIncomeModal(false);
  };

  const handleSavingsUpdate = (e) => {
    e.preventDefault();
    if (!selectedGoal || !savingsAmount) return;
    updateSavingsGoal(selectedGoal.id, savingsAmount);
    setSelectedGoal(null);
    setSavingsAmount('');
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={22} style={{ color: 'var(--personal-primary)' }} />
            <span>{t.personal.incomeTitle}</span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {lang === 'bn' ? 'ব্যক্তিগত আয়, বেতন ও সঞ্চয় তহবিলের হিসাব' : 'Track personal revenue streams, freelance remuneration & savings progress'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '6px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>{lang === 'bn' ? 'চলতি মাসের মোট আয়:' : 'Total Month Income:'} </span>
            <span style={{ fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#10b981' }}>৳{totalIncome.toLocaleString()}</span>
          </div>

          <button className="btn btn-primary" onClick={() => setShowIncomeModal(true)}>
            <Plus size={16} />
            <span>{t.personal.addIncome}</span>
          </button>
        </div>
      </div>

      {/* Grid: Incomes and Savings Goals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        
        {/* Income Sources Table */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} style={{ color: '#10b981' }} />
            <span>{lang === 'bn' ? 'আয়ের উৎস ও ইতিহাস' : 'Income Streams & History'}</span>
          </h3>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.date}</th>
                  <th>{lang === 'bn' ? 'আয়ের উৎস / খাত' : 'Source'}</th>
                  <th style={{ textAlign: 'right' }}>{t.amount}</th>
                  <th style={{ textAlign: 'center' }}>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {personalIncomes.map((item) => (
                  <tr key={item.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} />
                      {item.date}
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{item.source}</div>
                      {item.note && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.note}</div>}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '700', fontFamily: 'var(--font-mono)', color: '#10b981' }}>
                      +৳{item.amount.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn-icon" onClick={() => deletePersonalIncome(item.id)} title={t.delete}>
                        <Trash2 size={15} style={{ color: '#ef4444' }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Savings Targets with Deposit Button */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={18} style={{ color: '#06b6d4' }} />
            <span>{t.personal.savingsGoal}</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {personalSavings.map((goal) => {
              const progress = Math.min(100, Math.round((goal.saved / goal.target) * 100));
              return (
                <div key={goal.id} style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{goal.title}</span>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      onClick={() => setSelectedGoal(goal)}
                    >
                      + {lang === 'bn' ? 'টাকা জমান' : 'Deposit'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <span>{t.personal.saved}: <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>৳{goal.saved.toLocaleString()}</strong></span>
                    <span>{t.personal.target}: <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>৳{goal.target.toLocaleString()}</strong></span>
                  </div>

                  <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: goal.color, borderRadius: '5px', transition: 'width 0.4s ease' }} />
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', fontWeight: '700', marginTop: '4px', color: goal.color }}>
                    {progress}% {lang === 'bn' ? 'অর্জিত' : 'Achieved'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Income Modal */}
      {showIncomeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1rem' }}>
              {t.personal.addIncome}
            </h3>

            <form onSubmit={handleIncomeSubmit}>
              <div className="form-group">
                <label>{lang === 'bn' ? 'আয়ের উৎস বা খাত' : 'Income Source'} *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder={lang === 'bn' ? 'যেমন: মাসিক মূল বেতন, ফ্রিল্যান্সিং রেমিট্যান্স' : 'e.g. Monthly Salary, Freelancing'}
                  value={incomeForm.source}
                  onChange={(e) => setIncomeForm({ ...incomeForm, source: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>{t.amount} (৳) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="input-field"
                  placeholder="0"
                  value={incomeForm.amount}
                  onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>{t.date}</label>
                <input
                  type="date"
                  className="input-field"
                  value={incomeForm.date}
                  onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>{t.note}</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder={lang === 'bn' ? 'ব্যাংক বা মোবাইল অ্যাকাউন্টের বিবরণ...' : 'Bank / Account details...'}
                  value={incomeForm.note}
                  onChange={(e) => setIncomeForm({ ...incomeForm, note: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {t.save}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowIncomeModal(false)}>
                  {t.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit to Goal Modal */}
      {selectedGoal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '0.5rem' }}>
              {selectedGoal.title}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              {lang === 'bn' ? 'এই সঞ্চয় তহবিলে নতুন টাকা জমা করুন' : 'Deposit funds into this savings target'}
            </p>

            <form onSubmit={handleSavingsUpdate}>
              <div className="form-group">
                <label>{lang === 'bn' ? 'জমার পরিমাণ (৳)' : 'Deposit Amount (৳)'} *</label>
                <input
                  type="number"
                  required
                  min="100"
                  className="input-field"
                  placeholder="5000"
                  value={savingsAmount}
                  onChange={(e) => setSavingsAmount(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {lang === 'bn' ? 'সঞ্চয় নিশ্চিত করুন' : 'Confirm Deposit'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedGoal(null)}>
                  {t.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
