import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  X,
  Printer,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Coffee,
  Truck,
  Sparkles,
  Zap,
  User,
  FileText,
  Clock,
  ArrowDownRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export const CounterExpenseModal = ({ isOpen, onClose }) => {
  const {
    activeCounter,
    businessExpenses = [],
    addBusinessExpense,
    businessSettings = {},
    lang = 'bn',
    showToast
  } = useApp();

  const { user } = useAuth();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('চা-নাস্তা ও মেহমানদারি');
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState('');
  const [lastVoucher, setLastVoucher] = useState(null);

  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];
  const currentCounterId = activeCounter?.id || 'cnt-1';

  // Today's expenses from this cash drawer
  const todayDrawerExpenses = useMemo(() => {
    return businessExpenses.filter(e =>
      (e.isDrawerExpense || e.subCategory === 'ক্যাশ ড্রয়ার খরচ' || e.counterId === currentCounterId) &&
      String(e.date || '').startsWith(today)
    );
  }, [businessExpenses, currentCounterId, today]);

  const totalTodaySpent = useMemo(() => {
    return todayDrawerExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [todayDrawerExpenses]);

  // Fast preset expense categories
  const PRESET_CATEGORIES = [
    { label: 'চা-নাস্তা ও মেহমানদারি', icon: Coffee, defaultAmt: 50 },
    { label: 'পরিবহন ও কুলি ভাড়া', icon: Truck, defaultAmt: 100 },
    { label: 'ক্লিনিং ও দোকান সামগ্রী', icon: Sparkles, defaultAmt: 150 },
    { label: 'বিদ্যুৎ ও রিচার্জ', icon: Zap, defaultAmt: 200 },
    { label: 'স্টাফ অগ্রিম পেটি ক্যাশ', icon: User, defaultAmt: 500 }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      alert(lang === 'bn' ? 'অনুগ্রহ করে খরচের সঠিক পরিমাণ লিখুন' : 'Please enter valid expense amount');
      return;
    }

    const voucherNo = `EXP-${Date.now().toString().slice(-6)}`;
    const newRecord = {
      id: `bex-${Date.now()}`,
      voucherNo,
      amount: numAmount,
      category,
      subCategory: 'ক্যাশ ড্রয়ার খরচ',
      recipient: recipient.trim() || 'সাধারণ খরচ',
      person: recipient.trim() || 'কাউন্টার পেটি ক্যাশ',
      note: note.trim() || category,
      isDrawerExpense: true,
      counterId: currentCounterId,
      counterName: activeCounter?.name || 'কাউন্টার ১',
      cashierName: user?.name || 'কাউন্টার ক্যাশিয়ার',
      date: today,
      time: new Date().toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    };

    addBusinessExpense(newRecord);
    setLastVoucher(newRecord);
    setAmount('');
    setRecipient('');
    setNote('');
    if (showToast) {
      showToast(
        lang === 'bn'
          ? `ক্যাশ ড্রয়ার থেকে ৳${numAmount.toLocaleString()} পেটি ক্যাশ খরচ নথিভুক্ত হয়েছে!`
          : `Recorded ৳${numAmount} petty cash drawer expense!`,
        'success'
      );
    }
  };

  const handlePrintVoucher = (vch) => {
    const item = vch || lastVoucher;
    if (!item) return;

    const printWin = window.open('', '_blank', 'width=450,height=550');
    if (!printWin) return;

    const storeName = businessSettings?.companyName || 'হিসাবকিতাব ৩৬০ স্টোর';

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Petty Cash Voucher - ${item.voucherNo}</title>
          <style>
            body { font-family: monospace; padding: 20px; text-align: center; color: #000; }
            .voucher { border: 2px dashed #000; padding: 16px; border-radius: 8px; }
            .title { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
            .sub { font-size: 11px; margin-bottom: 12px; }
            .amount { font-size: 26px; font-weight: 900; margin: 12px 0; border: 1px solid #000; padding: 6px; }
            .meta { text-align: left; font-size: 12px; line-height: 1.8; margin-top: 10px; }
            .sig { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; }
            .sig-line { border-top: 1px dotted #000; width: 100px; text-align: center; padding-top: 4px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="voucher">
            <div class="title">${storeName}</div>
            <div class="sub">💸 ক্যাশ ড্রয়ার পেটি ক্যাশ ভাউচার (Drawer Expense Slip)</div>
            <div style="font-size: 11px; font-weight: bold;">ভাউচার নং: #${item.voucherNo}</div>
            <div class="amount">৳${item.amount.toLocaleString()}</div>
            <div class="meta">
              <strong>তারিখ ও সময়:</strong> ${item.date} ${item.time || ''}<br/>
              <strong>ক্যাটাগরি:</strong> ${item.category}<br/>
              <strong>প্রাপক / ব্যক্তি:</strong> ${item.recipient || item.person}<br/>
              <strong>বিবরণ:</strong> ${item.note}<br/>
              <strong>কাউন্টার:</strong> ${item.counterName || 'কাউন্টার ১'}<br/>
              <strong>ক্যাশিয়ার:</strong> ${item.cashierName}
            </div>
            <div class="sig">
              <div class="sig-line">টাকা গ্রহণকারীর স্বাক্ষর</div>
              <div class="sig-line">ক্যাশিয়ার / অনুমোদনকারী</div>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface)',
          borderRadius: '18px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
              }}
            >
              <DollarSign size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'ক্যাশ ড্রয়ার পেটি ক্যাশ খরচ ভাউচার' : 'Cash Drawer Petty Cash Expense'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'দোকানের ক্যাশ ড্রয়ার থেকে ছোটখাটো খরচের এন্ট্রি ও Z-রিপোর্ট সমন্বয়' : 'Record cash drawer petty expense and synchronize shift closing'}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            style={{ padding: '8px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* Today's Expense Barometer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: '10px',
              marginBottom: '1.25rem'
            }}
          >
            <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: '600' }}>
              আজকের এই শিফটে ড্রয়ার থেকে মোট খরচ:
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
              -৳{totalTodaySpent.toLocaleString()}
            </div>
          </div>

          {/* Preset Buttons */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>
              ⚡ এক-ক্লিকে দ্রুত ক্যাটাগরি বাছাই:
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {PRESET_CATEGORIES.map((preset, idx) => {
                const Icon = preset.icon;
                const isSelected = category === preset.label;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCategory(preset.label);
                      if (!amount) setAmount(String(preset.defaultAmt));
                    }}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '8px',
                      border: isSelected ? '1.5px solid #f59e0b' : '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-subtle, rgba(255,255,255,0.02))',
                      color: isSelected ? '#f59e0b' : 'var(--text-main)',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Icon size={13} />
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1rem' }}>
              <div>
                <label className="field-label" style={{ fontWeight: '700' }}>
                  টাকার পরিমাণ (৳) *:
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  className="input-field"
                  placeholder="যেমন: ৫০, ১০০, ৩০০"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  style={{ fontSize: '1.1rem', fontWeight: '800', color: '#ef4444' }}
                />
              </div>

              <div>
                <label className="field-label" style={{ fontWeight: '700' }}>
                  খরচ ক্যাটাগরি:
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="ক্যাটাগরি..."
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1.25rem' }}>
              <div>
                <label className="field-label">টাকা গ্রহণকারী / প্রাপক:</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="যেমন: চা দোকানদার, রিকশাওয়ালা"
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                />
              </div>

              <div>
                <label className="field-label">নোট বা কারণ:</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="যেমন: দোকানের মেহমানদারির জন্য"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  padding: '9px 22px',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  borderColor: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <CheckCircle2 size={16} />
                <span>ড্রয়ার থেকে খরচ অনুমোদন করুন</span>
              </button>
            </div>
          </form>

          {/* Today's Shift Drawer Expenses Table */}
          {todayDrawerExpenses.length > 0 && (
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Receipt size={16} style={{ color: '#f59e0b' }} />
                <span>আজকের শিফট খরচের তালিকা ({todayDrawerExpenses.length}টি)</span>
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                {todayDrawerExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'var(--bg-subtle, rgba(255,255,255,0.02))',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {exp.category}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {exp.recipient ? `প্রাপক: ${exp.recipient} • ` : ''}{exp.time || exp.date}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#ef4444', fontFamily: 'var(--font-mono)' }}>
                        -৳{Number(exp.amount).toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handlePrintVoucher(exp)}
                        className="btn-icon"
                        title="ভাউচার স্লিপ প্রিন্ট"
                        style={{ padding: '4px' }}
                      >
                        <Printer size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--header-bg, rgba(255,255,255,0.02))'
          }}
        >
          {lastVoucher ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handlePrintVoucher(lastVoucher)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700 }}
            >
              <Printer size={15} />
              <span>সর্বশেষ ভাউচার (#{lastVoucher.voucherNo}) প্রিন্ট</span>
            </button>
          ) : (
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              * ড্রয়ার খরচ শিফট ক্লোজিং Z-রিপোর্টে স্বয়ংক্রিয়ভাবে বিয়োগ হবে
            </span>
          )}

          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '6px 20px', fontSize: '0.85rem' }}>
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};

export default CounterExpenseModal;
