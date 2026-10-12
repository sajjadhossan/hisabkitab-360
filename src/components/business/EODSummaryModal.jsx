import React, { useMemo } from 'react';
import {
  X,
  Calendar,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  MessageCircle,
  Share2,
  Printer,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

/**
 * EODSummaryModal (Item 84)
 * -------------------------
 * Computes End-of-Day (EOD) Summary for shop closing:
 * - Today's Total Gross Sales
 * - Cash in Hand vs Digital Payments (bKash/Card/Nagad)
 * - Due Sales vs Collections
 * - Total Shop Expenses
 * - Net Daily Cashflow & Profit
 * - 1-Click WhatsApp / SMS Share to Business Owner
 */
export const EODSummaryModal = ({ isOpen, onClose }) => {
  const { salesHistory = [], dailyExpenses = [], businessSettings = {}, lang, showToast } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  const todayStats = useMemo(() => {
    const todaySales = (salesHistory || []).filter(s => s.date && s.date.startsWith(todayStr));
    const todayExp = (dailyExpenses || []).filter(e => e.date && e.date.startsWith(todayStr));

    const totalSales = todaySales.reduce((sum, s) => sum + (Number(s.grandTotal) || 0), 0);
    const cashSales = todaySales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + (Number(s.paidAmount) || 0), 0);
    const digitalSales = todaySales.filter(s => s.paymentMethod !== 'cash' && s.paymentMethod !== 'due').reduce((sum, s) => sum + (Number(s.paidAmount) || 0), 0);
    const dueSales = todaySales.reduce((sum, s) => sum + (Number(s.dueAmount) || 0), 0);
    const totalExpenses = todayExp.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const netCashflow = cashSales - totalExpenses;

    return {
      date: new Date().toLocaleDateString('bn-BD'),
      invoiceCount: todaySales.length,
      totalSales,
      cashSales,
      digitalSales,
      dueSales,
      totalExpenses,
      netCashflow
    };
  }, [salesHistory, dailyExpenses, todayStr]);

  const handleShareWhatsApp = () => {
    const storeName = businessSettings?.storeName || businessSettings?.companyName || (lang === 'bn' ? 'আমাদের দোকান' : 'My Store');
    const msg =
      `🌙 *${storeName} - দিনশেষের স্বয়ংক্রিয় সারসংক্ষেপ (EOD Summary)*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📅 *তারিখ:* ${todayStats.date}\n` +
      `🧾 *আজকের মোট ইনভয়েস:* ${todayStats.invoiceCount} টি\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🛒 *মোট বিক্রয়:* ৳${todayStats.totalSales.toLocaleString()}\n` +
      `💵 *নগদ ক্যাশ আদায়:* ৳${todayStats.cashSales.toLocaleString()}\n` +
      `📱 *ডিজিটাল/বিকাশ কালেকশন:* ৳${todayStats.digitalSales.toLocaleString()}\n` +
      `⚠️ *আজকের বাকি বিক্রয়:* ৳${todayStats.dueSales.toLocaleString()}\n` +
      `💸 *আজকের দোকান খরচ:* ৳${todayStats.totalExpenses.toLocaleString()}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *আজকের নেট ক্যাশ-ইন-হ্যান্ড:* ৳${todayStats.netCashflow.toLocaleString()}\n\n` +
      `আলহামদুলিল্লাহ, আজকের হিসাব সফলভাবে সমাপ্ত হয়েছে।`;

    const ownerPhone = (businessSettings?.phone || '').replace(/[^0-9]/g, '');
    const phoneParam = ownerPhone ? (ownerPhone.startsWith('88') ? ownerPhone : (ownerPhone.startsWith('0') ? `88${ownerPhone}` : ownerPhone)) : '';
    const url = phoneParam
      ? `https://api.whatsapp.com/send?phone=${phoneParam}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;

    window.open(url, '_blank', 'noopener,noreferrer');
    if (showToast) showToast(lang === 'bn' ? 'হোয়াটসঅ্যাপ চালু হচ্ছে...' : 'Opening WhatsApp...');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div
        className="modal-content animate-fade-in"
        style={{
          maxWidth: '520px',
          width: '95%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.5rem',
          borderRadius: '16px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <Calendar size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'দিনশেষের সারসংক্ষেপ (EOD Closing Summary)' : 'End-of-Day (EOD) Summary'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'দোকান বন্ধের সময় আজকের মোট বিক্রি, ক্যাশ ও খরচের হিসাব' : 'Daily sales, cash-in-hand, and closing report'}
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Date & Invoice Strip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '10px', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
            📅 {todayStats.date}
          </div>
          <span className="badge badge-primary" style={{ fontWeight: '700' }}>
            {todayStats.invoiceCount} টি বিক্রয়
          </span>
        </div>

        {/* Breakdown Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
          <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'মোট বিক্রয় (Gross Sales)' : 'Gross Sales'}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--text-main)', marginTop: '4px' }}>
              ৳{todayStats.totalSales.toLocaleString()}
            </div>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'নগদ ক্যাশ আদায়' : 'Cash Collected'}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#10b981', marginTop: '4px' }}>
              ৳{todayStats.cashSales.toLocaleString()}
            </div>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'বিকাশ / ডিজিটাল' : 'Digital / MFS'}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#3b82f6', marginTop: '4px' }}>
              ৳{todayStats.digitalSales.toLocaleString()}
            </div>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'আজকের দোকান খরচ' : 'Daily Expenses'}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#ef4444', marginTop: '4px' }}>
              ৳{todayStats.totalExpenses.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Net Cash-In-Hand Highlight */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(99, 102, 241, 0.15))',
          border: '1.5px solid #10b981',
          borderRadius: '12px',
          padding: '14px 16px',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#10b981' }}>
              {lang === 'bn' ? 'আজকের নেট ক্যাশ ইন হ্যান্ড (ক্যাশ - খরচ):' : 'Net Cash-In-Hand (Cash - Expense):'}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--text-main)', fontFamily: 'monospace' }}>
              ৳{todayStats.netCashflow.toLocaleString()}
            </div>
          </div>
          <CheckCircle2 size={32} style={{ color: '#10b981' }} />
        </div>

        {/* 1-Click WhatsApp Share to Owner */}
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleShareWhatsApp}
          style={{
            width: '100%',
            background: '#25D366',
            borderColor: '#25D366',
            padding: '12px',
            fontSize: '0.95rem',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            borderRadius: '10px'
          }}
        >
          <MessageCircle size={18} />
          <span>{lang === 'bn' ? 'মালিকের হোয়াটসঅ্যাপে সারসংক্ষেপ পাঠান' : 'Send EOD Summary to Owner on WhatsApp'}</span>
        </button>
      </div>
    </div>
  );
};
