import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  TrendingUp,
  PieChart,
  ShieldCheck,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const STORAGE_KEY = 'hk360_family_budgets';

const DEFAULT_BUDGETS = [
  { id: 'fb-1', member: 'নিজে (Self)', monthlyBudget: 15000, note: 'ব্যক্তিগত যাতায়াত ও দৈনন্দিন খরচ' },
  { id: 'fb-2', member: 'স্ত্রী (Wife)', monthlyBudget: 18000, note: 'গৃহস্থালি ও রান্নাঘরের ব্যবস্থাপনা' },
  { id: 'fb-3', member: 'ছেলে (Son)', monthlyBudget: 8000, note: 'স্কুল ফি ও টিফিন' },
  { id: 'fb-4', member: 'মেয়ে (Daughter)', monthlyBudget: 6000, note: 'পড়াশোনা ও বইপত্র' },
  { id: 'fb-5', member: 'বাবা (Father)', monthlyBudget: 10000, note: 'মাসিক ওষুধ ও ব্যক্তিগত খরচ' },
  { id: 'fb-6', member: 'মা (Mother)', monthlyBudget: 10000, note: 'মাসিক ওষুধ ও চিকিৎসা' },
  { id: 'fb-7', member: 'পুরো পরিবার (সবার জন্য)', monthlyBudget: 25000, note: 'মাসিক বাজার, চাল-ডাল ও গ্যাস-বিদ্যুৎ' }
];

export const FamilyBudgetAllocationModal = ({ isOpen, onClose }) => {
  const { personalExpenses = [], categories = {}, lang = 'bn' } = useApp();

  const [budgets, setBudgets] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading family budgets:', e);
    }
    return DEFAULT_BUDGETS;
  });

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    member: '',
    monthlyBudget: '',
    note: ''
  });

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

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
    } catch (e) {
      console.error('Error saving family budgets:', e);
    }
  }, [budgets]);

  // Compute current month expenses per member
  const currentMonthExpenses = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const spendingMap = {};

    personalExpenses.forEach(exp => {
      if (!exp.date) return;
      const d = new Date(exp.date);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const mem = exp.familyMember || 'পুরো পরিবার (সবার জন্য)';
        spendingMap[mem] = (spendingMap[mem] || 0) + (Number(exp.amount) || 0);
      }
    });

    return spendingMap;
  }, [personalExpenses]);

  // Totals
  const totalAllocated = useMemo(() => {
    return budgets.reduce((sum, b) => sum + (Number(b.monthlyBudget) || 0), 0);
  }, [budgets]);

  const totalSpentThisMonth = useMemo(() => {
    return Object.values(currentMonthExpenses).reduce((sum, val) => sum + val, 0);
  }, [currentMonthExpenses]);

  const totalRemaining = totalAllocated - totalSpentThisMonth;

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setEditingId(null);
    setFormData({
      member: availableMembers[0] || 'নিজে (Self)',
      monthlyBudget: '',
      note: ''
    });
    setIsAdding(true);
  };

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      member: item.member,
      monthlyBudget: item.monthlyBudget,
      note: item.note || ''
    });
    setIsAdding(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.member || !formData.monthlyBudget) return;

    const budgetVal = Number(formData.monthlyBudget);
    if (isNaN(budgetVal) || budgetVal <= 0) return;

    if (editingId) {
      setBudgets(prev => prev.map(b => b.id === editingId ? {
        ...b,
        member: formData.member,
        monthlyBudget: budgetVal,
        note: formData.note
      } : b));
    } else {
      const newItem = {
        id: `fb-${Date.now()}`,
        member: formData.member,
        monthlyBudget: budgetVal,
        note: formData.note
      };
      setBudgets(prev => [...prev, newItem]);
    }

    setIsAdding(false);
    setEditingId(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('আপনি কি এই সদস্যের বাজেট ডিলিট করতে চান?')) {
      setBudgets(prev => prev.filter(b => b.id !== id));
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface)',
          borderRadius: '18px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          animation: 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--header-bg, rgba(255,255,255,0.03))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)'
              }}
            >
              <Users size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'পারিবারিক মাসিক বাজেট বণ্টন' : 'Family Monthly Budget Allocation'}
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'পরিবারের সদস্যভিত্তিক বরাদ্দ ও চলতি মাসের খরচের রিয়েল-টাইম তদারকি' : 'Member-wise budget limits vs actual spending'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* Top Summary Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}
          >
            <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '14px', padding: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PieChart size={15} /> মোট নির্ধারিত বাজেট
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                ৳{totalAllocated.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {budgets.length} জন সদস্যের জন্য
              </div>
            </div>

            <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '14px', padding: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={15} /> চলতি মাসে খরচ হয়েছে
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
                ৳{totalSpentThisMonth.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                বরাদ্দের {totalAllocated > 0 ? Math.round((totalSpentThisMonth / totalAllocated) * 100) : 0}% খরচ সম্পন্ন
              </div>
            </div>

            <div style={{ background: totalRemaining >= 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.12)', border: `1px solid ${totalRemaining >= 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.35)'}`, borderRadius: '14px', padding: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: totalRemaining >= 0 ? '#10b981' : '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={15} /> {totalRemaining >= 0 ? 'অবশিষ্ট উদ্বৃত্ত' : 'বাজেট ঘাটতি (Overrun)'}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: totalRemaining >= 0 ? '#10b981' : '#ef4444', marginTop: '4px' }}>
                ৳{Math.abs(totalRemaining).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {totalRemaining >= 0 ? 'নিয়ন্ত্রণে আছে' : 'সতর্ক থাকুন, সীমা ছাড়িয়েছে'}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              সদস্যভিত্তিক বাজেট ও খরচের অগ্রগতি
            </h4>
            {!isAdding && (
              <button
                className="btn btn-primary"
                onClick={handleStartAdd}
                style={{ padding: '6px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} /> নতুন বাজেট যোগ করুন
              </button>
            )}
          </div>

          {/* Add / Edit Form */}
          {isAdding && (
            <form onSubmit={handleSave} style={{ background: 'var(--bg-subtle, rgba(255,255,255,0.03))', padding: '1rem', borderRadius: '12px', border: '1px dashed var(--border-color)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                    পরিবারের সদস্য
                  </label>
                  <select
                    className="form-control"
                    value={formData.member}
                    onChange={e => setFormData({ ...formData, member: e.target.value })}
                    required
                  >
                    {availableMembers.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                    মাসিক বাজেট বরাদ্দ (৳)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="যেমন: ১৫০০০"
                    value={formData.monthlyBudget}
                    onChange={e => setFormData({ ...formData, monthlyBudget: e.target.value })}
                    required
                    min="1"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                    বিবরণ / নোট (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="যেমন: পকেট মানি ও যাতায়াত"
                    value={formData.note}
                    onChange={e => setFormData({ ...formData, note: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAdding(false)}
                  style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '6px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Check size={16} /> সংরক্ষণ করুন
                </button>
              </div>
            </form>
          )}

          {/* Budgets List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {budgets.map(item => {
              const spent = currentMonthExpenses[item.member] || 0;
              const percent = item.monthlyBudget > 0 ? Math.min(Math.round((spent / item.monthlyBudget) * 100), 100) : 0;
              const isOver = spent > item.monthlyBudget;
              const diff = item.monthlyBudget - spent;

              // Color determination
              let barColor = '#10b981';
              if (percent > 85) barColor = '#f59e0b';
              if (isOver) barColor = '#ef4444';

              return (
                <div
                  key={item.id}
                  style={{
                    background: 'var(--bg-card, rgba(255,255,255,0.02))',
                    border: `1px solid ${isOver ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-color)'}`,
                    borderRadius: '14px',
                    padding: '1rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                          {item.member}
                        </span>
                        {isOver && (
                          <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertCircle size={12} /> বাজেট অতিক্রম করেছে!
                          </span>
                        )}
                      </div>
                      {item.note && (
                        <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {item.note}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
                          ৳{spent.toLocaleString()} / <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>৳{item.monthlyBudget.toLocaleString()}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: isOver ? '#ef4444' : 'var(--text-muted)' }}>
                          {isOver ? `ঘাটতি: ৳${Math.abs(diff).toLocaleString()}` : `অবশিষ্ট: ৳${diff.toLocaleString()}`}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => handleStartEdit(item)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
                          title="সম্পাদনা"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
                          title="মুছে ফেলুন"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: '8px', background: 'var(--border-color, rgba(255,255,255,0.06))', borderRadius: '8px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${percent}%`,
                        height: '100%',
                        background: barColor,
                        borderRadius: '8px',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'var(--header-bg, rgba(255,255,255,0.02))'
          }}
        >
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '7px 20px' }}>
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
