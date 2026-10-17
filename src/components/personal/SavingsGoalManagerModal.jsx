import React, { useState, useMemo } from 'react';
import {
  Target,
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  Award,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Sparkles,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { showConfirmDialog } from '../../services/dialogService';
import { useApp } from '../../context/AppContext';

export const SavingsGoalManagerModal = ({ isOpen, onClose }) => {
  const { personalSavings = [], setPersonalSavings, lang = 'bn' } = useApp();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [adjustingItem, setAdjustingItem] = useState(null); // { item, type: 'deposit' | 'withdraw' }
  const [adjustAmount, setAdjustAmount] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    target: '',
    saved: '',
    deadline: '',
    color: '#10b981',
    note: ''
  });

  // Totals
  const totalTarget = useMemo(() => {
    return personalSavings.reduce((sum, s) => sum + (Number(s.target) || 0), 0);
  }, [personalSavings]);

  const totalSaved = useMemo(() => {
    return personalSavings.reduce((sum, s) => sum + (Number(s.saved) || 0), 0);
  }, [personalSavings]);

  const overallPercent = totalTarget > 0 ? Math.min(Math.round((totalSaved / totalTarget) * 100), 100) : 0;

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setEditingId(null);
    setFormData({
      title: '',
      target: '',
      saved: '0',
      deadline: '',
      color: '#10b981',
      note: ''
    });
    setIsAdding(true);
  };

  const handleStartEdit = (s) => {
    setEditingId(s.id);
    setFormData({
      title: s.title,
      target: s.target,
      saved: s.saved,
      deadline: s.deadline || '',
      color: s.color || '#10b981',
      note: s.note || ''
    });
    setIsAdding(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.target) return;

    const targetVal = Number(formData.target);
    const savedVal = Number(formData.saved) || 0;

    if (editingId) {
      const updated = personalSavings.map(s => s.id === editingId ? {
        ...s,
        title: formData.title,
        target: targetVal,
        saved: savedVal,
        deadline: formData.deadline,
        color: formData.color,
        note: formData.note
      } : s);
      setPersonalSavings(updated);
      try { localStorage.setItem('hk360_personal_savings', JSON.stringify(updated)); } catch (e) { }
    } else {
      const newItem = {
        id: `psav-${Date.now()}`,
        title: formData.title,
        target: targetVal,
        saved: savedVal,
        deadline: formData.deadline,
        color: formData.color,
        note: formData.note
      };
      const updated = [...personalSavings, newItem];
      setPersonalSavings(updated);
      try { localStorage.setItem('hk360_personal_savings', JSON.stringify(updated)); } catch (e) { }
    }

    setIsAdding(false);
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    const ok = await showConfirmDialog({
      title: 'সঞ্চয় লক্ষ্য মুছবেন?',
      message: 'আপনি কি এই সঞ্চয় লক্ষ্যটি মুছে ফেলতে চান?',
      confirmText: 'হ্যাঁ, মুছুন',
      type: 'danger'
    });
    if (ok) {
      const updated = personalSavings.filter(s => s.id !== id);
      setPersonalSavings(updated);
      try { localStorage.setItem('hk360_personal_savings', JSON.stringify(updated)); } catch (e) { }
    }
  };

  // Adjust Deposit / Withdraw
  const handleApplyAdjustment = (e) => {
    e.preventDefault();
    if (!adjustingItem || !adjustAmount) return;

    const val = Number(adjustAmount);
    if (isNaN(val) || val <= 0) return;

    const updated = personalSavings.map(s => {
      if (s.id === adjustingItem.item.id) {
        const cur = Number(s.saved) || 0;
        const newSaved = adjustingItem.type === 'deposit' ? cur + val : Math.max(0, cur - val);
        return { ...s, saved: newSaved };
      }
      return s;
    });

    setPersonalSavings(updated);
    try { localStorage.setItem('hk360_personal_savings', JSON.stringify(updated)); } catch (e) { }
    setAdjustingItem(null);
    setAdjustAmount('');
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
                background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
              }}
            >
              <Target size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'লক্ষ্যভিত্তিক সঞ্চয় ও ফান্ড ট্র্যাকার' : 'Target Savings & Fund Tracker'}
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'জরুরি রিজার্ভ ফান্ড, হজ/ওমরাহ, ডিপিএস ও ভবিষ্যৎ স্বপ্নের সঞ্চয় পোর্টফোলিও' : 'Emergency funds, Hajj/Umrah goals, DPS & future dream targets'}
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
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}
          >
            <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '14px', padding: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#06b6d4', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Target size={15} /> মোট সঞ্চয়ের লক্ষ্যমাত্রা
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                ৳{totalTarget.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {personalSavings.length} টি লক্ষ্য সক্রিয়
              </div>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '14px', padding: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={15} /> ইতিমধ্যে জমাকৃত মোট
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                ৳{totalSaved.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                লক্ষ্যের {overallPercent}% অর্জিত
              </div>
            </div>

            <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '14px', padding: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={15} /> অবশিষ্ট সঞ্চয় প্রয়োজন
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
                ৳{Math.max(0, totalTarget - totalSaved).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                ধৈর্য ও নিয়মিত সঞ্চয়েই স্বপ্নপূরণ
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              ব্যক্তিগত সঞ্চয় পোর্টফোলিও
            </h4>
            {!isAdding && !adjustingItem && (
              <button
                className="btn btn-primary"
                onClick={handleStartAdd}
                style={{ padding: '6px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} /> নতুন লক্ষ্য যুক্ত করুন
              </button>
            )}
          </div>

          {/* Adjust Deposit/Withdraw Modal prompt */}
          {adjustingItem && (
            <form onSubmit={handleApplyAdjustment} style={{ background: 'var(--bg-subtle, rgba(255,255,255,0.04))', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
              <h5 style={{ margin: '0 0 10px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {adjustingItem.type === 'deposit' ? <ArrowUpRight size={18} color="#10b981" /> : <ArrowDownLeft size={18} color="#ef4444" />}
                {adjustingItem.item.title} — {adjustingItem.type === 'deposit' ? 'টাকা জমা করুন (Deposit)' : 'টাকা উত্তোলন করুন (Withdraw)'}
              </h5>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="number"
                  className="form-control"
                  placeholder="টাকার পরিমাণ (৳)"
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(e.target.value)}
                  required
                  min="1"
                  autoFocus
                  style={{ maxWidth: '240px' }}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '7px 16px', fontSize: '0.85rem' }}>
                  নিশ্চিত করুন
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setAdjustingItem(null)} style={{ padding: '7px 14px', fontSize: '0.85rem' }}>
                  বাতিল
                </button>
              </div>
            </form>
          )}

          {/* Add / Edit Form */}
          {isAdding && (
            <form onSubmit={handleSave} style={{ background: 'var(--bg-subtle, rgba(255,255,255,0.03))', padding: '1rem', borderRadius: '12px', border: '1px dashed var(--border-color)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                    লক্ষ্যের নাম
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="যেমন: ওমরাহ হজ ফান্ড"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                    টার্গেট বা কাঙ্ক্ষিত পরিমাণ (৳)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="যেমন: ৩,৫০,০০০"
                    value={formData.target}
                    onChange={e => setFormData({ ...formData, target: e.target.value })}
                    required
                    min="1"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                    বর্তমান জমাকৃত পরিমাণ (৳)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="যেমন: ৫০,০০০"
                    value={formData.saved}
                    onChange={e => setFormData({ ...formData, saved: e.target.value })}
                    min="0"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                    টার্গেট সমাপ্তির তারিখ (ঐচ্ছিক)
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.deadline}
                    onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                    থিম কালার
                  </label>
                  <input
                    type="color"
                    className="form-control"
                    value={formData.color}
                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                    style={{ height: '38px', padding: '2px 6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                    নোট বা বিবরণ
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="কোন ব্যাংকে বা কোথায় জমা হচ্ছে"
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

          {/* Goals List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {personalSavings.map(item => {
              const target = Number(item.target) || 1;
              const saved = Number(item.saved) || 0;
              const percent = Math.min(Math.round((saved / target) * 100), 100);
              const isAchieved = saved >= target;
              const color = item.color || '#10b981';

              return (
                <div
                  key={item.id}
                  style={{
                    background: 'var(--bg-card, rgba(255,255,255,0.02))',
                    border: `1px solid ${isAchieved ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-color)'}`,
                    borderRadius: '16px',
                    padding: '1.25rem',
                    transition: 'all 0.2s ease',
                    boxShadow: isAchieved ? '0 4px 20px rgba(16, 185, 129, 0.1)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color }} />
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                          {item.title}
                        </span>
                        {isAchieved && (
                          <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '0.75rem', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Award size={13} /> ১০০% লক্ষ্য অর্জিত!
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', gap: '12px' }}>
                        {item.deadline && <span>📅 মেয়াদ: {item.deadline}</span>}
                        {item.note && <span>📝 {item.note}</span>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                          ৳{saved.toLocaleString()} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ ৳{target.toLocaleString()}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: color, fontWeight: 700 }}>
                          {percent}% সম্পন্ন
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => { setAdjustingItem({ item, type: 'deposit' }); setAdjustAmount(''); }}
                          style={{ padding: '5px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="টাকা জমা করুন"
                        >
                          <ArrowUpRight size={14} color="#10b981" /> জমা
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => { setAdjustingItem({ item, type: 'withdraw' }); setAdjustAmount(''); }}
                          style={{ padding: '5px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="টাকা উত্তোলন করুন"
                        >
                          <ArrowDownLeft size={14} color="#ef4444" /> উত্তোলন
                        </button>
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
                  <div style={{ width: '100%', height: '10px', background: 'var(--border-color, rgba(255,255,255,0.06))', borderRadius: '8px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${percent}%`,
                        height: '100%',
                        background: color,
                        borderRadius: '8px',
                        transition: 'width 0.4s ease'
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
