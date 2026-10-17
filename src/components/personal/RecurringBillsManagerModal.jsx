import React, { useState, useMemo, useEffect } from 'react';
import {
  Zap,
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  FileText,
  DollarSign,
  Flame,
  Droplets,
  Wifi,
  Home,
  Shield,
  CreditCard
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { showConfirmDialog } from '../../services/dialogService';

const STORAGE_KEY = 'hk360_recurring_bills';

const DEFAULT_BILLS = [
  {
    id: 'rb-1',
    title: 'বাসা ভাড়া (House Rent)',
    category: 'rent',
    amount: 18000,
    dueDay: 5,
    provider: 'মালিক / ফ্ল্যাট কমিটি',
    note: 'প্রতি মাসের ৫ তারিখের মধ্যে',
    lastPaidMonth: ''
  },
  {
    id: 'rb-2',
    title: 'বিদ্যুৎ বিল (DESCO / DPDC)',
    category: 'utility',
    amount: 2200,
    dueDay: 15,
    provider: 'ডেসকো পোস্টপেইড',
    note: 'মিটার নং: ৫৬৪২৩',
    lastPaidMonth: ''
  },
  {
    id: 'rb-3',
    title: 'গ্যাস বিল (Titas Gas)',
    category: 'utility',
    amount: 1080,
    dueDay: 12,
    provider: 'তিতাস গ্যাস',
    note: 'দুই চুলার মাসিক বিল',
    lastPaidMonth: ''
  },
  {
    id: 'rb-4',
    title: 'পানির বিল (WASA)',
    category: 'utility',
    amount: 650,
    dueDay: 20,
    provider: 'ঢাকা ওয়াসা',
    note: '',
    lastPaidMonth: ''
  },
  {
    id: 'rb-5',
    title: 'ব্রডব্যান্ড ইন্টারনেট (WiFi)',
    category: 'utility',
    amount: 1000,
    dueDay: 10,
    provider: 'কার্নিভাল / অ্যাম্বারআইটি',
    note: '৩০ এমবিপিএস আনলিমিটেড',
    lastPaidMonth: ''
  },
  {
    id: 'rb-6',
    title: 'ব্যাংক ডিপিএস কিস্তি (DPS)',
    category: 'savings',
    amount: 5000,
    dueDay: 10,
    provider: 'ইসলামী ব্যাংক বাংলাদেশ',
    note: 'হিসাব নং: ৮৮৪৫',
    lastPaidMonth: ''
  }
];

export const RecurringBillsManagerModal = ({ isOpen, onClose }) => {
  const { addPersonalExpense, lang = 'bn' } = useApp();

  const [bills, setBills] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading recurring bills:', e);
    }
    return DEFAULT_BILLS;
  });

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'utility',
    amount: '',
    dueDay: 10,
    provider: '',
    note: ''
  });

  // Current month key (e.g. "2026-10")
  const currentMonthKey = useMemo(() => {
    const d = new Date();
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    return `${yr}-${mo}`;
  }, []);

  const todayDay = new Date().getDate();

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
    } catch (e) {
      console.error('Error saving recurring bills:', e);
    }
  }, [bills]);

  // Statistics
  const totalMonthlyCommitment = useMemo(() => {
    return bills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  }, [bills]);

  const paidThisMonthCount = useMemo(() => {
    return bills.filter(b => b.lastPaidMonth === currentMonthKey).length;
  }, [bills, currentMonthKey]);

  const paidThisMonthAmount = useMemo(() => {
    return bills
      .filter(b => b.lastPaidMonth === currentMonthKey)
      .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  }, [bills, currentMonthKey]);

  const pendingAmount = totalMonthlyCommitment - paidThisMonthAmount;

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setEditingId(null);
    setFormData({
      title: '',
      category: 'utility',
      amount: '',
      dueDay: 10,
      provider: '',
      note: ''
    });
    setIsAdding(true);
  };

  const handleStartEdit = (b) => {
    setEditingId(b.id);
    setFormData({
      title: b.title,
      category: b.category,
      amount: b.amount,
      dueDay: b.dueDay,
      provider: b.provider || '',
      note: b.note || ''
    });
    setIsAdding(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return;

    const amountVal = Number(formData.amount);
    if (isNaN(amountVal) || amountVal <= 0) return;

    if (editingId) {
      setBills(prev => prev.map(b => b.id === editingId ? {
        ...b,
        title: formData.title,
        category: formData.category,
        amount: amountVal,
        dueDay: Number(formData.dueDay) || 1,
        provider: formData.provider,
        note: formData.note
      } : b));
    } else {
      const newBill = {
        id: `rb-${Date.now()}`,
        title: formData.title,
        category: formData.category,
        amount: amountVal,
        dueDay: Number(formData.dueDay) || 1,
        provider: formData.provider,
        note: formData.note,
        lastPaidMonth: ''
      };
      setBills(prev => [...prev, newBill]);
    }

    setIsAdding(false);
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    const ok = await showConfirmDialog({
      title: 'রিকারিং বিল মুছবেন?',
      message: 'আপনি কি এই রিকারিং বিলের হিসাবটি তালিকা থেকে মুছে ফেলতে চান?',
      confirmText: 'হ্যাঁ, মুছুন',
      type: 'danger'
    });
    if (ok) {
      setBills(prev => prev.filter(b => b.id !== id));
    }
  };

  // One-click pay and add to Daily Expenses
  const handlePayBill = async (bill) => {
    const isAlreadyPaid = bill.lastPaidMonth === currentMonthKey;
    if (isAlreadyPaid) {
      // Toggle back to pending
      const ok = await showConfirmDialog({
        title: 'বিলের স্ট্যাটাস পরিবর্তন',
        message: 'আপনি কি এই বিলের স্ট্যাটাস পুনরায় বাকি (Pending) করতে চান?',
        confirmText: 'হ্যাঁ, বাকি করুন',
        type: 'warning'
      });
      if (ok) {
        setBills(prev => prev.map(b => b.id === bill.id ? { ...b, lastPaidMonth: '' } : b));
      }
      return;
    }

    // Mark as paid
    setBills(prev => prev.map(b => b.id === bill.id ? { ...b, lastPaidMonth: currentMonthKey } : b));

    // Automatically create a personal expense entry
    if (typeof addPersonalExpense === 'function') {
      const todayIso = new Date().toISOString().split('T')[0];
      addPersonalExpense({
        type: bill.category === 'rent' ? 'family' : 'daily',
        title: `${bill.title} পরিশোধ`,
        item: bill.title,
        category: bill.category || 'utility',
        subCategory: bill.title,
        amount: bill.amount,
        date: todayIso,
        note: `রিকারিং বিল থেকে স্বয়ংক্রিয় এন্ট্রি (${bill.provider || 'বিল পেমেন্ট'})`,
        familyMember: 'পুরো পরিবার (সবার জন্য)'
      });
    }
  };

  const getCategoryIcon = (cat, title = '') => {
    const tLower = title.toLowerCase();
    if (tLower.includes('বিদ্যুৎ') || tLower.includes('কারেন্ট') || tLower.includes('electricity')) return <Zap size={16} color="#f59e0b" />;
    if (tLower.includes('গ্যাস') || tLower.includes('gas')) return <Flame size={16} color="#ef4444" />;
    if (tLower.includes('পানি') || tLower.includes('wasa') || tLower.includes('water')) return <Droplets size={16} color="#06b6d4" />;
    if (tLower.includes('ইন্টারনেট') || tLower.includes('wifi')) return <Wifi size={16} color="#6366f1" />;
    if (tLower.includes('ভাড়া') || tLower.includes('rent')) return <Home size={16} color="#8b5cf6" />;
    if (tLower.includes('ডিপিএস') || tLower.includes('dps') || tLower.includes('কিস্তি')) return <CreditCard size={16} color="#10b981" />;
    return <FileText size={16} color="#64748b" />;
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
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)'
              }}
            >
              <Zap size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'রিকারিং বিল ও ইউটিলিটি ট্র্যাকার' : 'Recurring Bills & Utilities Tracker'}
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'মাসিক ইউটিলিটি বিল, বাসা ভাড়া ও কিস্তির রিমাইন্ডার এবং ১-ক্লিক খরচ এন্ট্রি' : 'Monthly utility bills, house rent, DPS reminders & 1-click expense logging'}
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
            <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '14px', padding: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={15} /> মাসিক মোট বিল দায়ের
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                ৳{totalMonthlyCommitment.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {bills.length} টি নিয়মিত বিল
              </div>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '14px', padding: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={15} /> চলতি মাসে পরিশোধিত
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                ৳{paidThisMonthAmount.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {paidThisMonthCount} টি পরিশোধিত
              </div>
            </div>

            <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '14px', padding: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={15} /> পরিশোধ বাকি (Pending)
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
                ৳{pendingAmount.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {bills.length - paidThisMonthCount} টি বিল বকেয়া
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              বিল ও ইউটিলিটি তালিকা ({currentMonthKey})
            </h4>
            {!isAdding && (
              <button
                className="btn btn-primary"
                onClick={handleStartAdd}
                style={{ padding: '6px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} /> নতুন বিল যুক্ত করুন
              </button>
            )}
          </div>

          {/* Add / Edit Form */}
          {isAdding && (
            <form onSubmit={handleSave} style={{ background: 'var(--bg-subtle, rgba(255,255,255,0.03))', padding: '1rem', borderRadius: '12px', border: '1px dashed var(--border-color)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                    বিলের নাম / খাত
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="যেমন: বিদ্যুৎ বিল"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                    ক্যাটাগরি
                  </label>
                  <select
                    className="form-control"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="utility">ইউটিলিটি (বিদ্যুৎ/গ্যাস/পানি/ইন্টারনেট)</option>
                    <option value="rent">বাসা ভাড়া / ফ্ল্যাট চার্জ</option>
                    <option value="savings">ডিপিএস / সঞ্চয় কিস্তি</option>
                    <option value="other">অন্যান্য নিয়মিত খরচ</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                    মাসিক আনুমানিক বিল (৳)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="যেমন: ২৫০০"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    required
                    min="1"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                    প্রতি মাসের শেষ তারিখ (Due Day)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="১ থেকে ৩১"
                    value={formData.dueDay}
                    onChange={e => setFormData({ ...formData, dueDay: e.target.value })}
                    required
                    min="1"
                    max="31"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                    সেবাদাতা প্রতিষ্ঠান (Provider)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="যেমন: ডেসকো, তিতাস"
                    value={formData.provider}
                    onChange={e => setFormData({ ...formData, provider: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                    মিটার নং / নোট (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="হিসাব বা মিটার নম্বর"
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

          {/* Bills List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {bills.map(item => {
              const isPaid = item.lastPaidMonth === currentMonthKey;
              const isOverdue = !isPaid && todayDay > item.dueDay;
              const isDueSoon = !isPaid && !isOverdue && (item.dueDay - todayDay <= 3);

              return (
                <div
                  key={item.id}
                  style={{
                    background: 'var(--bg-card, rgba(255,255,255,0.02))',
                    border: `1px solid ${isPaid ? 'rgba(16, 185, 129, 0.3)' : isOverdue ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-color)'}`,
                    borderRadius: '14px',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: 'var(--bg-subtle, rgba(255,255,255,0.05))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {getCategoryIcon(item.category, item.title)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                          {item.title}
                        </span>
                        {isPaid ? (
                          <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>
                            পরিশোধিত
                          </span>
                        ) : isOverdue ? (
                          <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>
                            সময় পার হয়েছে ({item.dueDay} তারিখ)
                          </span>
                        ) : isDueSoon ? (
                          <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>
                            শীঘ্রই দেয় ({item.dueDay} তারিখ)
                          </span>
                        ) : (
                          <span style={{ background: 'rgba(100, 116, 139, 0.15)', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: '12px' }}>
                            প্রতি মাসের {item.dueDay} তারিখ
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '10px' }}>
                        {item.provider && <span>🏢 {item.provider}</span>}
                        {item.note && <span>📝 {item.note}</span>}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        ৳{Number(item.amount).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {isPaid ? 'খরচে যোগ করা হয়েছে' : 'বকেয়া'}
                      </div>
                    </div>

                    <button
                      className={`btn ${isPaid ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => handlePayBill(item)}
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: isPaid ? 'rgba(16, 185, 129, 0.15)' : undefined,
                        color: isPaid ? '#10b981' : undefined,
                        borderColor: isPaid ? '#10b981' : undefined
                      }}
                    >
                      <CheckCircle2 size={15} />
                      <span>{isPaid ? 'পরিশোধিত ✓' : 'পরিশোধ ও খরচে যোগ'}</span>
                    </button>

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
