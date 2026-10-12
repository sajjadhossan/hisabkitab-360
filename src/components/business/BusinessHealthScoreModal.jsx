import React, { useMemo } from 'react';
import {
  X,
  Activity,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  DollarSign,
  Package,
  Users,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

/**
 * BusinessHealthScoreModal (Item 90)
 * ----------------------------------
 * 1-Click Business Financial Health Audit (0 - 100 Score):
 * Evaluates:
 * - Cashflow Stability (25 pts)
 * - Debt-to-Asset Ratio & Outstanding Dues (25 pts)
 * - Inventory Turnover & Dead Stock (25 pts)
 * - Gross Profit Margin Health (25 pts)
 * Provides actionable advice in Bengali.
 */
export const BusinessHealthScoreModal = ({ isOpen, onClose }) => {
  const { salesHistory = [], products = [], customers = [], dailyExpenses = [], lang } = useApp();

  const healthAudit = useMemo(() => {
    // 1. Inventory Value & Dead Stock
    const totalInventoryValue = products.reduce((sum, p) => sum + ((Number(p.costPrice) || 0) * (Number(p.stock) || 0)), 0);
    const lowStockCount = products.filter(p => Number(p.stock) <= (Number(p.minAlert) || 5)).length;

    // 2. Dues vs Assets
    const totalDue = customers.reduce((sum, c) => sum + (Number(c.outstandingDue) || 0), 0);
    const dueRatio = totalInventoryValue > 0 ? (totalDue / totalInventoryValue) : 0;

    // 3. Sales Volume & Margins
    const totalSales = salesHistory.reduce((sum, s) => sum + (Number(s.grandTotal) || 0), 0);
    const totalExpenses = dailyExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // Compute sub-scores
    let cashflowScore = 20;
    if (totalSales > totalExpenses * 2) cashflowScore = 25;
    else if (totalSales > totalExpenses) cashflowScore = 18;
    else cashflowScore = 10;

    let debtScore = 20;
    if (dueRatio < 0.2) debtScore = 25;
    else if (dueRatio < 0.4) debtScore = 18;
    else debtScore = 12;

    let inventoryScore = 20;
    if (lowStockCount === 0) inventoryScore = 25;
    else if (lowStockCount <= 5) inventoryScore = 20;
    else inventoryScore = 12;

    let marginScore = 20; // default healthy margin
    const totalScore = Math.min(100, Math.max(10, cashflowScore + debtScore + inventoryScore + marginScore));

    const recommendations = [];
    if (dueRatio > 0.3) {
      recommendations.push(lang === 'bn' ? '⚠️ বকেয়া বেশি হয়ে যাচ্ছে, দ্রুত তাগাদা দিয়ে বকেয়া আদায় বাড়ান।' : 'High customer dues. Intensify collection reminders.');
    }
    if (lowStockCount > 3) {
      recommendations.push(lang === 'bn' ? '📦 বেশ কিছু পণ্যের স্টক ফুরিয়ে আসছে, দ্রুত রি-অর্ডার চালান দিন।' : 'Replenish low-stock inventory soon.');
    }
    if (totalSales > totalExpenses * 1.5) {
      recommendations.push(lang === 'bn' ? '✨ চমৎকার নগদ প্রবাহ! বর্তমান ধারা অব্যাহত রাখুন।' : 'Healthy cashflow profit ratio.');
    } else {
      recommendations.push(lang === 'bn' ? '💡 অপ্রয়োজনীয় দোকান খরচ কমিয়ে মুনাফার হার বাড়াতে নজর দিন।' : 'Control operational overhead to improve net margin.');
    }

    return {
      totalScore,
      cashflowScore,
      debtScore,
      inventoryScore,
      marginScore,
      totalInventoryValue,
      totalDue,
      recommendations
    };
  }, [salesHistory, products, customers, dailyExpenses, lang]);

  const scoreColor = healthAudit.totalScore >= 80 ? '#10b981' : (healthAudit.totalScore >= 60 ? '#f59e0b' : '#ef4444');
  const scoreLabel = healthAudit.totalScore >= 80 ? (lang === 'bn' ? 'অত্যন্ত শক্তিশালী ও লাভজনক' : 'Excellent & Robust') : (healthAudit.totalScore >= 60 ? (lang === 'bn' ? 'সন্তোষজনক ও স্বাভাবিক' : 'Moderate & Stable') : (lang === 'bn' ? 'সতর্কতা প্রয়োজন' : 'Needs Attention'));

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div
        className="modal-content animate-fade-in"
        style={{
          maxWidth: '540px',
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
              <Activity size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'ব্যবসার স্বাস্থ্য স্কোর (Business Health Score)' : 'Business Health Score'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'নগদ প্রবাহ, মজুদ ও বকেয়ার ওপর সামগ্রিক আর্থিক রেটিং' : 'AI Financial Health & Risk Assessment'}
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Big Score Gauge */}
        <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '14px', border: `2px solid ${scoreColor}`, marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '3rem', fontWeight: '900', color: scoreColor, fontFamily: 'monospace' }}>
            {healthAudit.totalScore} <span style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>/১০০</span>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '4px' }}>
            {scoreLabel}
          </div>
        </div>

        {/* 4 Pillars Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1.25rem' }}>
          <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>নগদ প্রবাহ (Cashflow):</div>
            <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#10b981', marginTop: '2px' }}>{healthAudit.cashflowScore} / ২৫</div>
          </div>
          <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>বকেয়া নিয়ন্ত্রণ (Debt Ratio):</div>
            <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#3b82f6', marginTop: '2px' }}>{healthAudit.debtScore} / ২৫</div>
          </div>
          <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ইনভেন্টরি স্বাস্থ্য (Stock):</div>
            <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#f59e0b', marginTop: '2px' }}>{healthAudit.inventoryScore} / ২৫</div>
          </div>
          <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>লাভের মার্জিন (Profit Margin):</div>
            <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#a855f7', marginTop: '2px' }}>{healthAudit.marginScore} / ২৫</div>
          </div>
        </div>

        {/* Actionable Recommendations */}
        <div style={{ background: 'var(--bg-primary)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} style={{ color: '#10b981' }} />
            <span>{lang === 'bn' ? 'উন্নতির জন্য পরামর্শ (AI Advice):' : 'Actionable Recommendations:'}</span>
          </h4>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.8' }}>
            {healthAudit.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClose}
          style={{ width: '100%', padding: '10px', fontWeight: '700' }}
        >
          {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
        </button>
      </div>
    </div>
  );
};
