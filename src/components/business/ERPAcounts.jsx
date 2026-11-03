import React, { useState, useMemo } from 'react';
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
  CheckCircle2,
  BarChart3,
  Scale,
  FileSpreadsheet,
  RotateCcw,
  Printer
} from 'lucide-react';
import { SmartVoiceFormBanner } from '../common/SmartVoiceFormBanner';
import { VoiceInputButton } from '../common/VoiceInputButton';
import { triggerSoundboxPayment } from '../../services/soundboxService';
import { convertBengaliDigitsToNumber } from '../../services/voiceBillingService';
import { generateFinancialStatements, CHART_OF_ACCOUNTS } from '../../services/doubleEntryAccountingService';
import { SupplierPurchaseReturnModal } from './SupplierPurchaseReturnModal';

export const ERPAcounts = () => {
  const {
    salesHistory = [],
    businessExpenses = [],
    addBusinessExpense,
    suppliers = [],
    paySupplier,
    products = [],
    customers = [],
    adjustStock,
    businessSettings = {},
    showToast,
    setActiveTab,
    t,
    lang
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState('summary'); // 'summary' | 'balance_sheet' | 'trial_balance' | 'coa'
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPurchaseReturnModal, setShowPurchaseReturnModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierPayAmount, setSupplierPayAmount] = useState('');

  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amount: '',
    category: 'ভাড়া',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  // Live Double-Entry Financial Statements (Balance Sheet & Trial Balance)
  const financialData = useMemo(() => {
    return generateFinancialStatements({
      salesHistory,
      products,
      customers,
      suppliers,
      businessExpenses,
      businessSettings
    });
  }, [salesHistory, products, customers, suppliers, businessExpenses, businessSettings]);

  const handleConfirmPurchaseReturn = async (debitNote) => {
    for (const item of debitNote.items || []) {
      if (typeof adjustStock === 'function') {
        adjustStock(item.productId, -item.qty, 'out', `সাপ্লায়ার ক্রয় ফেরত: #${debitNote.debitNoteNo}`);
      }
    }
    if (debitNote.adjustmentType === 'deduct_due') {
      paySupplier(debitNote.supplierId, debitNote.totalAmount);
    }
    showToast(
      lang === 'bn'
        ? `✓ ডেবিট নোট #${debitNote.debitNoteNo} সফলভাবে রেকর্ড ও স্টক সমন্বয় করা হয়েছে!`
        : `✓ Debit Note #${debitNote.debitNoteNo} recorded!`,
      'success'
    );
  };

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

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setActiveTab('reports')}
            style={{
              borderColor: 'rgba(99, 102, 241, 0.4)',
              color: '#6366f1',
              fontWeight: '800'
            }}
          >
            <BarChart3 size={16} />
            <span>{lang === 'bn' ? '📊 পূর্ণাঙ্গ রিপোর্ট হাব' : '📊 Periodic Reports'}</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => setShowPurchaseReturnModal(true)}
            style={{
              borderColor: 'rgba(239, 68, 68, 0.4)',
              color: '#ef4444',
              fontWeight: '800'
            }}
          >
            <RotateCcw size={16} />
            <span>{lang === 'bn' ? '🔄 ক্রয় ফেরত (ডেবিট নোট)' : 'Purchase Return (Debit Note)'}</span>
          </button>

          <button className="btn btn-primary" onClick={() => setShowExpenseModal(true)}>
            <Plus size={16} />
            <span>{t.business.addBizExpense}</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', overflowX: 'auto' }}>
        {[
          { id: 'summary', label: lang === 'bn' ? '📊 আয়-ব্যয় ও প্রফিট লস' : '📊 P&L & Cash Flow' },
          { id: 'balance_sheet', label: lang === 'bn' ? '⚖️ উদ্বৃত্তপত্র (Balance Sheet)' : '⚖️ Balance Sheet' },
          { id: 'trial_balance', label: lang === 'bn' ? '📑 রেওয়ামিল (Trial Balance)' : '📑 Trial Balance' },
          { id: 'coa', label: lang === 'bn' ? '🏛️ চার্ট অব অ্যাকাউন্টস (COA)' : '🏛️ Chart of Accounts' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: activeSubTab === tab.id ? '2px solid var(--business-primary)' : '1px solid var(--border-color)',
              background: activeSubTab === tab.id ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
              color: activeSubTab === tab.id ? 'var(--business-primary)' : 'var(--text-muted)',
              fontWeight: '800',
              fontSize: '0.85rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: SUMMARY & PnL */}
      {activeSubTab === 'summary' && (
        <>
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
      </>
      )}

      {/* TAB 2: BALANCE SHEET (উদ্বৃত্তপত্র / আর্থিক অবস্থার বিবরণী) */}
      {activeSubTab === 'balance_sheet' && (
        <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', borderRadius: '14px', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Scale size={20} style={{ color: 'var(--business-primary)' }} />
                <span>{lang === 'bn' ? 'আর্থিক অবস্থার বিবরণী / উদ্বৃত্তপত্র (Balance Sheet)' : 'Statement of Financial Position (Balance Sheet)'}</span>
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'আন্তর্জাতিক হিসাববিজ্ঞান সমীকরণ: সম্পদ = দায় + মালিকানাস্বত্ব' : 'Accounting Equation: Assets = Liabilities + Equity'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: financialData.balanceSheet.isBalanced ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: financialData.balanceSheet.isBalanced ? '#10b981' : '#ef4444',
                  border: `1px solid ${financialData.balanceSheet.isBalanced ? '#10b981' : '#ef4444'}`
                }}
              >
                {financialData.balanceSheet.isBalanced ? '🟢 সমতা নিশ্চিত (Balanced)' : '🔴 অমিল (Discrepancy)'}
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }}
              >
                <Printer size={15} />
                <span>প্রিন্ট</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* ASSETS COLUMN */}
            <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: '800', color: '#10b981', borderBottom: '1.5px solid #10b981', paddingBottom: '6px' }}>
                {lang === 'bn' ? '১. সম্পদসমূহ (ASSETS)' : '1. ASSETS'}
              </h4>

              <div style={{ fontSize: '0.85rem', marginBottom: '14px' }}>
                <div style={{ fontWeight: '800', color: 'var(--text-main)', marginBottom: '6px' }}>চলতি সম্পদ (Current Assets):</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dotted var(--border-color)' }}>
                  <span>হাতে নগদ ক্যাশ (Cash in Hand)</span>
                  <span style={{ fontWeight: '700', fontFamily: 'var(--font-mono)' }}>৳{financialData.balanceSheet.assets.current.cashInHand.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dotted var(--border-color)' }}>
                  <span>ব্যাংক ও অনলাইন ব্যালেন্স (Bank / MFS)</span>
                  <span style={{ fontWeight: '700', fontFamily: 'var(--font-mono)' }}>৳{financialData.balanceSheet.assets.current.bankAccounts.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dotted var(--border-color)' }}>
                  <span>দেনাদার বাকি পাওনা (Accounts Receivable)</span>
                  <span style={{ fontWeight: '700', fontFamily: 'var(--font-mono)' }}>৳{financialData.balanceSheet.assets.current.totalReceivables.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dotted var(--border-color)' }}>
                  <span>মজুদ পণ্যের আর্থিক মূল্য (Merchandise Inventory)</span>
                  <span style={{ fontWeight: '700', fontFamily: 'var(--font-mono)' }}>৳{financialData.balanceSheet.assets.current.inventoryAssetValue.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontWeight: '800', color: '#059669' }}>
                  <span>মোট চলতি সম্পদ:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>৳{financialData.balanceSheet.assets.current.total.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
                <div style={{ fontWeight: '800', color: 'var(--text-main)', marginBottom: '6px' }}>স্থায়ী সম্পদ (Fixed Assets):</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dotted var(--border-color)' }}>
                  <span>দোকানের আসবাবপত্র ও ইকুইপমেন্ট</span>
                  <span style={{ fontWeight: '700', fontFamily: 'var(--font-mono)' }}>৳{financialData.balanceSheet.assets.fixed.furnitureAndFixtures.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontWeight: '800', color: '#059669' }}>
                  <span>মোট স্থায়ী সম্পদ:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>৳{financialData.balanceSheet.assets.fixed.total.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(16, 185, 129, 0.12)', borderRadius: '8px', border: '1.5px solid #10b981', fontSize: '1.05rem', fontWeight: '900', color: '#059669' }}>
                <span>সর্বমোট সম্পদ (TOTAL ASSETS):</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>৳{financialData.balanceSheet.assets.totalAssets.toLocaleString()}</span>
              </div>
            </div>

            {/* LIABILITIES & EQUITY COLUMN */}
            <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: '800', color: '#3b82f6', borderBottom: '1.5px solid #3b82f6', paddingBottom: '6px' }}>
                {lang === 'bn' ? '২. দায় ও মালিকানাস্বত্ব (LIABILITIES & EQUITY)' : '2. LIABILITIES & EQUITY'}
              </h4>

              <div style={{ fontSize: '0.85rem', marginBottom: '14px' }}>
                <div style={{ fontWeight: '800', color: 'var(--text-main)', marginBottom: '6px' }}>চলতি দায়সমূহ (Current Liabilities):</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dotted var(--border-color)' }}>
                  <span>পাওনাদার মহাজন হিসাব (Accounts Payable)</span>
                  <span style={{ fontWeight: '700', fontFamily: 'var(--font-mono)', color: '#f59e0b' }}>৳{financialData.balanceSheet.liabilities.current.accountsPayable.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontWeight: '800', color: '#ea580c' }}>
                  <span>মোট চলতি দায়:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>৳{financialData.balanceSheet.liabilities.totalLiabilities.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
                <div style={{ fontWeight: '800', color: 'var(--text-main)', marginBottom: '6px' }}>মালিকানাস্বত্ব (Owner Equity):</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dotted var(--border-color)' }}>
                  <span>মালিকের মূলধন (Owner Capital)</span>
                  <span style={{ fontWeight: '700', fontFamily: 'var(--font-mono)' }}>৳{financialData.balanceSheet.equity.ownerCapital.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dotted var(--border-color)' }}>
                  <span>অর্জিত নিট মুনাফা (Retained Profit)</span>
                  <span style={{ fontWeight: '700', fontFamily: 'var(--font-mono)', color: financialData.balanceSheet.equity.retainedEarnings >= 0 ? '#10b981' : '#ef4444' }}>
                    ৳{financialData.balanceSheet.equity.retainedEarnings.toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontWeight: '800', color: '#2563eb' }}>
                  <span>মোট মালিকানাস্বত্ব:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>৳{financialData.balanceSheet.equity.totalEquity.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(59, 130, 246, 0.12)', borderRadius: '8px', border: '1.5px solid #3b82f6', fontSize: '1.05rem', fontWeight: '900', color: '#2563eb' }}>
                <span>মোট দায় ও মূলধন (TOTAL LIABILITIES & EQUITY):</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>৳{financialData.balanceSheet.totalLiabilitiesAndEquity.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TRIAL BALANCE (রেওয়ামিল) */}
      {activeSubTab === 'trial_balance' && (
        <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', borderRadius: '14px', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '8px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileSpreadsheet size={20} style={{ color: 'var(--business-primary)' }} />
                <span>{lang === 'bn' ? 'সাধারণ খতিয়ান রেওয়ামিল (Trial Balance)' : 'General Ledger Trial Balance'}</span>
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'হিসাবের গাণিতিক শুদ্ধতা যাচাই (ডেবিট = ক্রেডিট)' : 'Mathematical accuracy verification'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: financialData.trialBalance.isBalanced ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: financialData.trialBalance.isBalanced ? '#10b981' : '#ef4444'
                }}
              >
                {financialData.trialBalance.isBalanced ? '🟢 রেওয়ামিল মিলেছে' : '🔴 অমিল'}
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                <Printer size={15} />
              </button>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#0f172a', color: '#ffffff', textAlign: 'left' }}>
                <th style={{ padding: '8px 10px', width: '90px' }}>কোড</th>
                <th style={{ padding: '8px 10px' }}>হিসাবের বিবরণ / লেজার নাম</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', width: '160px' }}>ডেবিট (৳)</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', width: '160px' }}>ক্রেডিট (৳)</th>
              </tr>
            </thead>
            <tbody>
              {financialData.trialBalance.rows.map((row, idx) => (
                <tr key={row.code} style={{ borderBottom: '1px solid var(--border-color)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)' }}>
                  <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{row.code}</td>
                  <td style={{ padding: '8px 10px', fontWeight: '600' }}>{row.name}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: row.debit > 0 ? '700' : '400' }}>
                    {row.debit > 0 ? `৳${row.debit.toLocaleString()}` : '-'}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: row.credit > 0 ? '700' : '400' }}>
                    {row.credit > 0 ? `৳${row.credit.toLocaleString()}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--text-main)', borderBottom: '3px double var(--text-main)', fontWeight: '900', fontSize: '1rem', background: 'rgba(99, 102, 241, 0.08)' }}>
                <td colSpan={2} style={{ padding: '10px' }}>সর্বমোট যোগফল (Total):</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#10b981' }}>
                  ৳{financialData.trialBalance.totalDebit.toLocaleString()}
                </td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#3b82f6' }}>
                  ৳{financialData.trialBalance.totalCredit.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* TAB 4: CHART OF ACCOUNTS (COA) */}
      {activeSubTab === 'coa' && (
        <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', borderRadius: '14px', marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800' }}>
              {lang === 'bn' ? 'মাস্টার চার্ট অব অ্যাকাউন্টস (Chart of Accounts Taxonomy)' : 'Chart of Accounts Master'}
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {lang === 'bn' ? 'আন্তর্জাতিক হিসাববিজ্ঞান মানদণ্ডে ৫টি মূল খাতের শ্রেণীবদ্ধ হিসাব তালিকা' : '5 Core Financial Heads'}
            </p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '8px 10px', width: '80px' }}>কোড</th>
                <th style={{ padding: '8px 10px' }}>হিসাবের নাম</th>
                <th style={{ padding: '8px 10px' }}>শ্রেণী</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>প্রকৃতি</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>স্বাভাবিক জের</th>
              </tr>
            </thead>
            <tbody>
              {CHART_OF_ACCOUNTS.map(coa => (
                <tr key={coa.code} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{coa.code}</td>
                  <td style={{ padding: '8px 10px', fontWeight: '600' }}>{coa.name}</td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{coa.category}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background:
                          coa.type === 'asset' ? 'rgba(16, 185, 129, 0.15)' :
                          coa.type === 'liability' ? 'rgba(239, 68, 68, 0.15)' :
                          coa.type === 'equity' ? 'rgba(59, 130, 246, 0.15)' :
                          coa.type === 'revenue' ? 'rgba(139, 92, 246, 0.15)' :
                          'rgba(245, 158, 11, 0.15)',
                        color:
                          coa.type === 'asset' ? '#10b981' :
                          coa.type === 'liability' ? '#ef4444' :
                          coa.type === 'equity' ? '#3b82f6' :
                          coa.type === 'revenue' ? '#8b5cf6' :
                          '#f59e0b'
                      }}
                    >
                      {coa.type.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: '700', textTransform: 'uppercase' }}>
                    {coa.normalBalance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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

      {/* Supplier Purchase Return & Debit Note Modal */}
      {showPurchaseReturnModal && (
        <SupplierPurchaseReturnModal
          isOpen={showPurchaseReturnModal}
          onClose={() => setShowPurchaseReturnModal(false)}
          suppliers={suppliers}
          products={products}
          onConfirmPurchaseReturn={handleConfirmPurchaseReturn}
          lang={lang}
          showToast={showToast}
        />
      )}
    </div>
  );
};
