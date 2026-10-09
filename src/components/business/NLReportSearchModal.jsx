import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Sparkles,
  TrendingUp,
  Package,
  Users,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { VoiceInputButton } from '../common/VoiceInputButton';

/**
 * NLReportSearchModal (Item 82)
 * -----------------------------
 * Natural Language Query Engine for Business Reports in Bengali & English.
 * Answers queries like:
 * - "সবচেয়ে বেশি বিক্রি হওয়া পণ্য"
 * - "আজকের মোট বিক্রি ও লাভ"
 * - "কার কাছে বেশি বাকি আছে"
 * - "স্টক শেষ হওয়া পণ্যগুলো দেখাও"
 */
export const NLReportSearchModal = ({ isOpen, onClose }) => {
  const { salesHistory = [], products = [], customers = [], dailyExpenses = [], lang, t } = useApp();

  const [query, setQuery] = useState('');
  const [selectedExample, setSelectedExample] = useState('');

  if (!isOpen) return null;

  const sampleQueries = [
    'সবচেয়ে বেশি বিক্রি হওয়া পণ্যগুলো দেখাও',
    'আজকের মোট বিক্রি ও কালেকশন কত',
    'কার কাছে সবচেয়ে বেশি বাকি আছে',
    'স্টক শেষ হয়ে যাওয়া পণ্যগুলো দেখাও',
    'চলতি মাসের মোট খরচ কত'
  ];

  // Natural Language Intent Engine
  const parsedResult = useMemo(() => {
    const q = (query || '').toLowerCase().trim();
    if (!q) return null;

    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Top Selling Products
    if (q.includes('বেশি বিক্রি') || q.includes('top sell') || q.includes('জনপ্রিয়') || q.includes('সেরা বিক্রি')) {
      const productSalesMap = {};
      salesHistory.forEach(sale => {
        (sale.items || []).forEach(item => {
          const name = item.name || 'Unknown';
          const qty = Number(item.quantity) || 1;
          const total = Number(item.price || item.total) * qty;
          if (!productSalesMap[name]) productSalesMap[name] = { name, qty: 0, total: 0 };
          productSalesMap[name].qty += qty;
          productSalesMap[name].total += total;
        });
      });
      const topProducts = Object.values(productSalesMap).sort((a, b) => b.qty - a.qty).slice(0, 5);
      return {
        type: 'top_products',
        title: lang === 'bn' ? '📊 শীর্ষ ৫টি বেশি বিক্রি হওয়া পণ্য:' : 'Top 5 Selling Products:',
        data: topProducts
      };
    }

    // 2. Today's Sales & Cash
    if (q.includes('আজকের') || q.includes('আজ') || q.includes('today')) {
      const todaySales = salesHistory.filter(s => s.date && s.date.startsWith(todayStr));
      const totalAmount = todaySales.reduce((sum, s) => sum + (Number(s.grandTotal) || 0), 0);
      const cashAmount = todaySales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + (Number(s.paidAmount) || 0), 0);
      return {
        type: 'today_summary',
        title: lang === 'bn' ? '📅 আজকের বিক্রির সারসংক্ষেপ:' : "Today's Sales Summary:",
        totalSales: totalAmount,
        cashSales: cashAmount,
        invoiceCount: todaySales.length
      };
    }

    // 3. Due / Debt defaulters
    if (q.includes('বাকি') || q.includes('due') || q.includes('খাতক') || q.includes('ঋণ')) {
      const topDebtors = [...customers]
        .filter(c => Number(c.outstandingDue) > 0)
        .sort((a, b) => Number(b.outstandingDue) - Number(a.outstandingDue))
        .slice(0, 5);
      return {
        type: 'top_due',
        title: lang === 'bn' ? '⚠️ সর্বোচ্চ বকেয়া থাকা শীর্ষ ৫ গ্রাহক:' : 'Top 5 Customers with Outstanding Due:',
        data: topDebtors
      };
    }

    // 4. Low stock or out of stock
    if (q.includes('স্টক') || q.includes('stock') || q.includes('ফুরিয়ে') || q.includes('শেষ')) {
      const outOfStock = products.filter(p => Number(p.stock) <= (Number(p.minAlert) || 5)).slice(0, 8);
      return {
        type: 'low_stock',
        title: lang === 'bn' ? '📦 স্টক শেষ বা ফুরিয়ে আসা পণ্যসমূহ:' : 'Low Stock & Depleted Products:',
        data: outOfStock
      };
    }

    // 5. Monthly Expenses
    if (q.includes('খরচ') || q.includes('expense') || q.includes('ব্যয়')) {
      const totalExp = dailyExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      return {
        type: 'expense_summary',
        title: lang === 'bn' ? '💸 মোট খরচের খতিয়ান:' : 'Total Expense Summary:',
        total: totalExp,
        count: dailyExpenses.length
      };
    }

    // General fallback search in products/customers
    const matchedProds = products.filter(p => p.name.toLowerCase().includes(q)).slice(0, 5);
    const matchedCusts = customers.filter(c => c.name.toLowerCase().includes(q)).slice(0, 5);

    return {
      type: 'general_match',
      title: lang === 'bn' ? `🔍 "${query}" এর সাথে মিল থাকা রেকর্ড:` : `Records matching "${query}":`,
      matchedProds,
      matchedCusts
    };
  }, [query, salesHistory, products, customers, dailyExpenses, lang]);

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div
        className="modal-content animate-fade-in"
        style={{
          maxWidth: '650px',
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
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
              <Sparkles size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'সহজ ভাষায় রিপোর্ট অনুসন্ধান (AI Assistant)' : 'Natural Language Report Search'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'যেকোনো প্রশ্ন বাংলায় লিখুন বা মুখে বলুন, সাথে সাথে রিপোর্ট পাবেন' : 'Type or speak naturally to get instant business insights'}
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Input Field with Mic */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            autoFocus
            className="input-field"
            style={{ paddingLeft: '42px', paddingRight: '48px', fontSize: '1rem', height: '48px', borderRadius: '12px' }}
            placeholder={lang === 'bn' ? 'যেমন: বেশি বিক্রি হওয়া পণ্য, আজকের মোট বিক্রি...' : 'e.g., top selling products, today sales...'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
            <VoiceInputButton
              onTranscript={(txt) => setQuery(txt)}
              title="মুখে বলুন"
              size={18}
            />
          </div>
        </div>

        {/* Quick Sample Prompts */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {sampleQueries.map((sq, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setQuery(sq)}
              style={{
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: '20px',
                background: query === sq ? 'var(--business-primary)' : 'var(--bg-secondary)',
                color: query === sq ? '#fff' : 'var(--text-muted)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer'
              }}
            >
              {sq}
            </button>
          ))}
        </div>

        {/* Query Result View */}
        {parsedResult && (
          <div className="animate-fade-in" style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '14px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.92rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '12px' }}>
              {parsedResult.title}
            </h4>

            {/* 1. Top Products */}
            {parsedResult.type === 'top_products' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {parsedResult.data.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.88rem' }}>
                      <span style={{ color: '#6366f1', marginRight: '6px' }}>#{idx + 1}</span> {item.name}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '800', color: '#10b981', fontSize: '0.88rem' }}>৳{item.total.toLocaleString()}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.qty} টি বিক্রি হয়েছে</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 2. Today's Summary */}
            {parsedResult.type === 'today_summary' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>আজকের মোট বিক্রি</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#10b981', marginTop: '2px' }}>৳{parsedResult.totalSales.toLocaleString()}</div>
                </div>
                <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>নগদ ক্যাশ</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#3b82f6', marginTop: '2px' }}>৳{parsedResult.cashSales.toLocaleString()}</div>
                </div>
                <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>মোট ইনভয়েস</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--text-main)', marginTop: '2px' }}>{parsedResult.invoiceCount} টি</div>
                </div>
              </div>
            )}

            {/* 3. Top Debtors */}
            {parsedResult.type === 'top_due' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {parsedResult.data.map((c, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.88rem' }}>{c.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.phone || 'মোবাইল নেই'}</div>
                    </div>
                    <div style={{ fontWeight: '800', color: '#ef4444', fontSize: '0.95rem', fontFamily: 'monospace' }}>
                      ৳{Number(c.outstandingDue).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 4. Low stock */}
            {parsedResult.type === 'low_stock' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {parsedResult.data.map((p, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{p.name}</div>
                    <span className="badge badge-danger" style={{ fontWeight: '700' }}>
                      মজুদ: {p.stock} টি
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 5. Expense Summary */}
            {parsedResult.type === 'expense_summary' && (
              <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>মোট খরচ এন্ট্রি: {parsedResult.count} টি</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#ef4444', marginTop: '4px' }}>
                  ৳{parsedResult.total.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
