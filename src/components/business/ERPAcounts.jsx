import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calculator,
  Plus,
  TrendingUp,
  TrendingDown,
  Building,
  DollarSign,
  Truck,
  Calendar,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { SmartVoiceFormBanner } from '../common/SmartVoiceFormBanner';
import { VoiceInputButton } from '../common/VoiceInputButton';
import { triggerSoundboxPayment } from '../../services/soundboxService';
import { convertBengaliDigitsToNumber } from '../../services/voiceBillingService';

export const ERPAcounts = () => {
  const {
    salesHistory,
    businessExpenses,
    addBusinessExpense,
    suppliers,
    paySupplier,
    t,
    lang
  } = useApp();

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierPayAmount, setSupplierPayAmount] = useState('');

  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amount: '',
    category: 'ভাড়া',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  // Financial Calculations
  const grossRevenue = salesHistory.reduce((acc, sale) => acc + sale.grandTotal, 0);
  
  // Calculate COGS (Cost of goods sold) from sales history items
  const cogs = salesHistory.reduce((acc, sale) => {
    const saleCost = sale.items.reduce((itemAcc, item) => itemAcc + ((item.costPrice || 0) * item.qty), 0);
    return acc + saleCost;
  }, 0);

  const grossProfit = grossRevenue - cogs;
  const totalBizExpenses = businessExpenses.reduce((acc, exp) => acc + exp.amount, 0);
  const netProfit = grossProfit - totalBizExpenses;

  const totalSupplierPayables = suppliers.reduce((acc, s) => acc + s.payableBalance, 0);

  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount) return;
    addBusinessExpense({
      ...expenseForm,
      amount: Number(expenseForm.amount)
    });
    setExpenseForm({
      title: '',
      amount: '',
      category: 'ভাড়া',
      date: new Date().toISOString().split('T')[0],
      note: ''
    });
    setShowExpenseModal(false);
  };

  const handleSupplierPayment = (e) => {
    e.preventDefault();
    if (!selectedSupplier || !supplierPayAmount) return;
    const paidAmt = Number(supplierPayAmount);
    paySupplier(selectedSupplier.id, paidAmt);

    // Trigger Soundbox payment announcement
    triggerSoundboxPayment({
      amount: paidAmt,
      method: 'cash',
      customerName: selectedSupplier.name,
      type: 'debt_collection'
    });

    setSelectedSupplier(null);
    setSupplierPayAmount('');
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calculator size={22} style={{ color: 'var(--business-primary)' }} />
            <span>{t.business.erpTitle}</span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {t.business.erpSubtitle}
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowExpenseModal(true)}>
          <Plus size={16} />
          <span>{t.business.addBizExpense}</span>
        </button>
      </div>

      {/* P&L Financial Summary Cards */}
      <div className="stats-grid">
        <div className="glass-card stat-card glow-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <h3>{t.business.grossSales}</h3>
            <div className="stat-value">৳{grossRevenue.toLocaleString()}</div>
            <div className="stat-trend" style={{ color: '#10b981' }}>
              {salesHistory.length} {lang === 'bn' ? 'টি সফল ইনভয়েস' : 'Invoices'}
            </div>
          </div>
        </div>

        <div className="glass-card stat-card glow-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <TrendingDown size={24} />
          </div>
          <div className="stat-info">
            <h3>{t.business.bizExpenses}</h3>
            <div className="stat-value">৳{totalBizExpenses.toLocaleString()}</div>
            <div className="stat-trend" style={{ color: '#ef4444' }}>
              {businessExpenses.length} {lang === 'bn' ? 'টি পরিচালন এন্ট্রি' : 'Operations'}
            </div>
          </div>
        </div>

        <div className="glass-card stat-card glow-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <h3>{t.business.netProfit}</h3>
            <div className="stat-value" style={{ color: netProfit >= 0 ? '#10b981' : '#ef4444' }}>
              ৳{netProfit.toLocaleString()}
            </div>
            <div className="stat-trend" style={{ color: netProfit >= 0 ? '#10b981' : '#ef4444' }}>
              {netProfit >= 0 ? (lang === 'bn' ? 'ব্যবসায়িক লাভজনক স্থিতি' : 'Net Profitable') : (lang === 'bn' ? 'ক্ষতিগ্রস্ত' : 'Net Loss')}
            </div>
          </div>
        </div>

        <div className="glass-card stat-card glow-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <Truck size={24} />
          </div>
          <div className="stat-info">
            <h3>{lang === 'bn' ? 'সাপ্লায়ার মোট দেনা' : 'Vendor Payables'}</h3>
            <div className="stat-value">৳{totalSupplierPayables.toLocaleString()}</div>
            <div className="stat-trend" style={{ color: '#f59e0b' }}>
              {suppliers.length} {lang === 'bn' ? 'টি ডিস্ট্রিবিউটর একাউন্ট' : 'Distributors'}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Profit & Loss Statement + Supplier Payables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        
        {/* Formal P&L Statement */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            {lang === 'bn' ? 'আনুষ্ঠানিক লাভ-ক্ষতি বিবরণী (P&L Statement)' : 'Profit & Loss Statement'}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span>{t.business.grossSales} (+)</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>৳{grossRevenue.toLocaleString()}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: 'var(--text-muted)' }}>
              <span>{t.business.cogs} (-)</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>৳{cogs.toLocaleString()}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px dashed var(--border-color)', fontWeight: '700', color: '#10b981' }}>
              <span>{lang === 'bn' ? 'মোট লাভ (Gross Profit)' : 'Gross Profit'}</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>৳{grossProfit.toLocaleString()}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#ef4444' }}>
              <span>{t.business.bizExpenses} (-)</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>৳{totalBizExpenses.toLocaleString()}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid var(--border-color)', fontSize: '1.15rem', fontWeight: '900', color: netProfit >= 0 ? '#10b981' : '#ef4444' }}>
              <span>{lang === 'bn' ? 'চূড়ান্ত নিট প্রফিট (Net Profit)' : 'Net Profit'}</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>৳{netProfit.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Suppliers & Vendor Payables */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0 }}>
              {t.business.suppliers}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{suppliers.length} {lang === 'bn' ? 'জন ভেন্ডর' : 'vendors'}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {suppliers.map((sup) => (
              <div key={sup.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{sup.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📞 {sup.contact} | {sup.items}</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '800', fontFamily: 'var(--font-mono)', color: sup.payableBalance > 0 ? '#f59e0b' : '#10b981' }}>
                    ৳{sup.payableBalance.toLocaleString()}
                  </div>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '3px 8px', fontSize: '0.75rem', marginTop: '4px' }}
                    onClick={() => { setSelectedSupplier(sup); setShowSupplierModal(true); }}
                  >
                    {t.business.paySupplier}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operational Expenses Table */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '1rem' }}>
          {lang === 'bn' ? 'ব্যবসায়িক পরিচালন খরচের তালিকা (দোকান ভাড়া, বিদ্যুৎ, স্যালারি, পরিবহন)' : 'Business Operating Expense Ledger'}
        </h3>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t.date}</th>
                <th>{t.category}</th>
                <th>{t.note}</th>
                <th style={{ textAlign: 'right' }}>{t.amount}</th>
              </tr>
            </thead>
            <tbody>
              {businessExpenses.map((exp) => (
                <tr key={exp.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} />
                    {exp.date}
                  </td>
                  <td>
                    <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.12)', color: 'var(--business-primary)' }}>
                      {exp.category}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{exp.title}</div>
                    {exp.note && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{exp.note}</div>}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#ef4444' }}>
                    -৳{exp.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1rem' }}>
              {t.business.addBizExpense}
            </h3>

            {/* Smart Voice Auto-Fill Banner */}
            <SmartVoiceFormBanner
              mode="biz_expense"
              lang={lang}
              onParsed={(parsed) => {
                setExpenseForm(prev => ({
                  ...prev,
                  title: parsed.title || prev.title,
                  amount: parsed.amount ? String(parsed.amount) : prev.amount,
                  category: parsed.bizCategory || prev.category,
                  date: parsed.date || prev.date
                }));
              }}
            />

            <form onSubmit={handleExpenseSubmit}>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ margin: 0 }}>{lang === 'bn' ? 'খরচের বিবরণ (যেমন: দোকান ভাড়া, পরিবহন, বিদ্যুৎ)' : 'Expense Title'} *</label>
                  <VoiceInputButton
                    onTranscript={(txt) => setExpenseForm(prev => ({ ...prev, title: txt }))}
                    title="মুখে বলুন খরচের বিবরণ"
                  />
                </div>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder={lang === 'bn' ? 'যেমন: শোরুম মাসিক ভাড়া' : 'e.g. Store Rent'}
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>{t.amount} (৳) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="input-field"
                    placeholder="5000"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>{t.category}</label>
                  <select
                    className="select-field"
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  >
                    <option value="ভাড়া">{lang === 'bn' ? 'দোকান/অফিস ভাড়া' : 'Rent'}</option>
                    <option value="ইউটিলিটি">{lang === 'bn' ? 'বিদ্যুৎ ও পানি' : 'Utilities'}</option>
                    <option value="পরিবহন">{lang === 'bn' ? 'পণ্য পরিবহন ও ভ্যান' : 'Transportation'}</option>
                    <option value="আপ্যায়ন">{lang === 'bn' ? 'আপ্যায়ন ও নাস্তা' : 'Refreshment'}</option>
                    <option value="ট্যাক্স ও লাইসেন্স">{lang === 'bn' ? 'ট্রেড লাইসেন্স ও ট্যাক্স' : 'Tax & License'}</option>
                    <option value="অন্যান্য">{lang === 'bn' ? 'অন্যান্য' : 'Other'}</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>{t.date}</label>
                <input
                  type="date"
                  className="input-field"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>{t.note}</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder={lang === 'bn' ? 'ভাউচার নম্বর বা নোট...' : 'Voucher number or note...'}
                  value={expenseForm.note}
                  onChange={(e) => setExpenseForm({ ...expenseForm, note: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {t.save}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowExpenseModal(false)}>
                  {t.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Pay Modal */}
      {showSupplierModal && selectedSupplier && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '0.5rem' }}>
              {t.business.paySupplier} - {selectedSupplier.name}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              {lang === 'bn' ? `মোট দেনা আছে: ৳${selectedSupplier.payableBalance.toLocaleString()}` : `Current Due: ৳${selectedSupplier.payableBalance.toLocaleString()}`}
            </p>

            <form onSubmit={handleSupplierPayment}>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ margin: 0 }}>{lang === 'bn' ? 'পরিশোধের পরিমাণ (৳)' : 'Payment Amount'} *</label>
                  <VoiceInputButton
                    onTranscript={(txt) => {
                      const num = convertBengaliDigitsToNumber(txt);
                      if (num) setSupplierPayAmount(String(num));
                    }}
                    title="মুখে বলুন পরিশোধের টাকা"
                    size={13}
                  />
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedSupplier.payableBalance}
                  className="input-field"
                  placeholder="5000"
                  value={supplierPayAmount}
                  onChange={(e) => setSupplierPayAmount(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {lang === 'bn' ? 'পরিশোধ সম্পন্ন করুন' : 'Confirm Payment'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSupplierModal(false)}>
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
