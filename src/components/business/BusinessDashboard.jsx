import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  TrendingUp,
  ScanLine,
  Boxes,
  Users,
  DollarSign,
  AlertTriangle,
  Receipt,
  Printer,
  Calendar,
  ArrowRight,
  PackageCheck,
  Store,
  Monitor,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  BrainCircuit,
  Zap,
  Award
} from 'lucide-react';

export const BusinessDashboard = () => {
  const {
    products,
    salesHistory,
    customers,
    businessExpenses,
    invoices = [],
    damagedGoods = [],
    branches = [],
    activeBranchId,
    activeCounterId,
    switchBranch,
    switchCounter,
    setActiveTab,
    setActiveReceipt,
    t,
    lang
  } = useApp();

  const { isOwner, canViewNetProfit } = useAuth();
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('all');

  // Filtered sales based on selected branch (Memoized)
  const filteredSales = useMemo(() => {
    return selectedBranchFilter === 'all'
      ? salesHistory
      : salesHistory.filter(s => s.branchId === selectedBranchFilter);
  }, [salesHistory, selectedBranchFilter]);

  const totalSales = useMemo(() => filteredSales.reduce((acc, s) => acc + (Number(s.grandTotal) || 0), 0), [filteredSales]);
  const totalBizExpenses = useMemo(() => businessExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0), [businessExpenses]);
  const totalDamagedLoss = useMemo(() => damagedGoods.reduce((acc, d) => acc + (Number(d.totalLoss) || 0), 0), [damagedGoods]);
  const totalSalesReturnVal = useMemo(() => invoices.reduce((acc, i) => acc + (Number(i.returnTotal) || 0), 0), [invoices]);

  const cogs = useMemo(() => {
    return filteredSales.reduce((acc, sale) => {
      const saleCost = (sale.items || []).reduce((itemAcc, item) => itemAcc + ((Number(item.costPrice) || 0) * (Number(item.qty) || 0)), 0);
      return acc + saleCost;
    }, 0);
  }, [filteredSales]);

  const netProfit = totalSales - cogs - totalBizExpenses - totalDamagedLoss;

  const lowStockProducts = useMemo(() => products.filter(p => (Number(p.stock) || 0) <= (Number(p.minAlert) || 5)), [products]);
  const totalMarketDue = useMemo(() => customers.reduce((acc, c) => acc + (Number(c.outstandingDue) || 0), 0), [customers]);

  // --- AI BUSINESS INTELLIGENCE CALCULATIONS (Memoized) ---
  // 1. Top Profit Margin Winners
  const sortedByMargin = useMemo(() => {
    return [...products]
      .map(p => {
        const cost = Number(p.costPrice) || 0;
        const sell = Number(p.sellPrice) || 0;
        const margin = sell - cost;
        const marginPercent = cost > 0 ? Math.round((margin / cost) * 100) : 0;
        const totalUnitsSold = filteredSales.reduce((acc, sale) => {
          const item = sale.items?.find(i => i.id === p.id);
          return acc + (item ? (Number(item.qty) || 0) : 0);
        }, 0);
        const totalProfitContributed = totalUnitsSold * margin;
        return { ...p, margin, marginPercent, totalUnitsSold, totalProfitContributed };
      })
      .sort((a, b) => b.margin - a.margin);
  }, [products, filteredSales]);

  const topMarginWinners = useMemo(() => sortedByMargin.slice(0, 3), [sortedByMargin]);

  // 2. Dead Stock & Blocked Capital Alert
  const deadStockProducts = useMemo(() => {
    const soldProductIds = new Set();
    filteredSales.forEach(s => {
      (s.items || []).forEach(item => {
        if (item.id) soldProductIds.add(item.id);
      });
    });
    return products.filter(p => (Number(p.stock) || 0) > 0 && !soldProductIds.has(p.id));
  }, [products, filteredSales]);

  const totalDeadStockCapital = useMemo(() => {
    return deadStockProducts.reduce((sum, p) => sum + ((Number(p.stock) || 0) * (Number(p.costPrice) || 0)), 0);
  }, [deadStockProducts]);

  // 3. 7-Day Predictive Sales Forecast
  const { avgDailySales, projected7DaySales, projected7DayProfit } = useMemo(() => {
    const uniqueDates = [...new Set(filteredSales.map(s => s.date).filter(Boolean))];
    const daysObserved = Math.max(uniqueDates.length, 1);
    const avgDaily = Math.round(totalSales / daysObserved);
    const projSales = avgDaily * 7;
    const avgProfitMarginRatio = totalSales > 0 ? (netProfit / totalSales) : 0.2;
    const projProfit = Math.round(projSales * Math.max(avgProfitMarginRatio, 0.05));
    return { avgDailySales: avgDaily, projected7DaySales: projSales, projected7DayProfit: projProfit };
  }, [filteredSales, totalSales, netProfit]);

  // 4. Customer Retention & Repeat Shoppers Rate
  const { identifiedCustomerKeys, repeatCustomerCount, customerRetentionRate } = useMemo(() => {
    const customerPurchaseCounts = {};
    filteredSales.forEach(s => {
      const key = s.customerPhone || s.customerName || 'walk-in';
      if (key !== 'walk-in' && key !== 'সাধারণ ক্রেতা' && key !== 'Walk-in Customer') {
        customerPurchaseCounts[key] = (customerPurchaseCounts[key] || 0) + 1;
      }
    });
    const keys = Object.keys(customerPurchaseCounts);
    const repeatCount = keys.filter(k => customerPurchaseCounts[k] > 1).length;
    const rate = keys.length > 0
      ? Math.round((repeatCount / keys.length) * 100)
      : 0;
    return { identifiedCustomerKeys: keys, repeatCustomerCount: repeatCount, customerRetentionRate: rate };
  }, [filteredSales]);

  return (
    <div className="animate-fade-in">
      {/* Top Welcome / Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
            {lang === 'bn' ? 'ব্যবসায়িক কার্যনির্বাহী ড্যাশবোর্ড' : 'Business Executive Dashboard'}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {lang === 'bn' ? 'মাল্টি-ব্রাঞ্চ সেলস, কাউন্টার ক্যাশ ড্রয়ার, ইনভেন্টরি স্টক ও লাভ-ক্ষতির চিত্র' : 'Multi-branch sales, drawer cash, inventory, dues, and profitability'}
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" onClick={() => setActiveTab('pos')}>
            <ScanLine size={16} />
            <span>{lang === 'bn' ? 'POS ক্যাশিয়ার চালু করুন' : 'Open POS Cashier'}</span>
          </button>

          <button className="btn btn-secondary" onClick={() => setActiveTab('inventory')}>
            <Boxes size={16} />
            <span>{t.businessNav.inventory}</span>
          </button>
        </div>
      </div>

      {/* MULTI-BRANCH & LIVE CASH COUNTER MONITORING (OWNER VIEW) */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #6366f1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', padding: '8px', borderRadius: '10px' }}>
              <Store size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'মাল্টি-ব্রাঞ্চ ও ক্যাশ কাউন্টার লাইভ মনিটর' : 'Multi-Branch & Live Cash Counter Monitor'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'সকল শাখা ও কাউন্টারের রিয়েল-টাইম ক্যাশ ড্রয়ার ও বিক্রয় অবস্থা' : 'Real-time drawer cash and sales across all branches & counters'}
              </p>
            </div>
          </div>

          {/* Controls: Owner Cash Hub Button & Branch Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {isOwner && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setActiveTab('branch_control')}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  borderColor: '#10b981',
                  boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>👑 {lang === 'bn' ? 'সরাসরি ক্যাশ কন্ট্রোল ও নতুন শাখা যোগ' : 'Direct Cash Control & Branches'} →</span>
              </button>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                {lang === 'bn' ? 'শাখা:' : 'Branch:'}
              </span>
              <select
                className="input-field"
                value={selectedBranchFilter}
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
                style={{ padding: '6px 12px', fontSize: '0.82rem', fontWeight: '700', borderRadius: '8px', background: 'var(--bg-primary)' }}
              >
                <option value="all">🏢 {lang === 'bn' ? 'সমস্ত শাখা একসাথে' : 'All Branches'}</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>🏢 {b.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Branches & Counters Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          {branches
            .filter(b => selectedBranchFilter === 'all' || b.id === selectedBranchFilter)
            .map(branch => {
              const branchSales = salesHistory.filter(s => s.branchId === branch.id);
              const branchTotalSales = branchSales.reduce((acc, s) => acc + s.grandTotal, 0);

              return (
                <div
                  key={branch.id}
                  style={{
                    background: 'var(--bg-primary)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '0.98rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🏢</span>
                        <span>{branch.name}</span>
                        {branch.isMain && (
                          <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
                            {lang === 'bn' ? 'প্রধান' : 'Main'}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {branch.address} • {branch.phone}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'শাখার মোট বিক্রয়' : 'Branch Sales'}</div>
                      <div style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        ৳{branchTotalSales.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Counters List inside Branch */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(branch.counters || []).map(counter => {
                      const counterSales = salesHistory.filter(s => s.counterId === counter.id);
                      const counterCash = counterSales
                        .filter(s => s.paymentMethod === 'cash')
                        .reduce((sum, s) => sum + (Number(s.paidAmount) || 0), 0);
                      const counterTotal = counterSales.reduce((sum, s) => sum + s.grandTotal, 0);
                      const isCurrent = activeBranchId === branch.id && activeCounterId === counter.id;

                      return (
                        <div
                          key={counter.id}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            background: isCurrent ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-secondary)',
                            border: isCurrent ? '1.5px solid #6366f1' : '1px solid var(--border-color)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '8px'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Monitor size={15} style={{ color: '#10b981' }} />
                              <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                                {counter.name}
                              </strong>
                              {isCurrent && (
                                <span className="badge" style={{ fontSize: '0.62rem', background: '#10b981', color: '#fff' }}>
                                  {lang === 'bn' ? 'সক্রিয়' : 'Active'}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {lang === 'bn' ? 'ক্যাশ ইন ড্রয়ার:' : 'Cash in Drawer:'} <span style={{ color: '#10b981', fontWeight: '700' }}>৳{((Number(counter.openingFloat) || 1000) + counterCash).toLocaleString()}</span> • {counterSales.length} {lang === 'bn' ? 'টি বিক্রয়' : 'Sales'}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: '800', fontSize: '0.88rem', color: 'var(--text-main)' }}>
                                ৳{counterTotal.toLocaleString()}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                switchBranch(branch.id);
                                switchCounter(counter.id);
                                setActiveTab('pos');
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '0.72rem', fontWeight: '700' }}
                            >
                              {lang === 'bn' ? 'কাউন্টারে যান →' : 'Open POS →'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        {/* Total Sales */}
        <div className="glass-card stat-card glow-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <h3>{t.business.todaySales}</h3>
            <div className="stat-value">৳{totalSales.toLocaleString()}</div>
            <div className="stat-trend" style={{ color: '#10b981' }}>
              {filteredSales.length} {lang === 'bn' ? 'টি সফল বিক্রয়' : 'Completed Sales'}
            </div>
          </div>
        </div>

        {/* Net Profit (Only visible to Owner, hidden from staff) */}
        {canViewNetProfit ? (
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
                {netProfit >= 0 ? (lang === 'bn' ? 'লাভজনক মার্জিন' : 'Profitable') : (lang === 'bn' ? 'ক্ষতিগ্রস্ত' : 'Negative Loss')}
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card stat-card glow-card" style={{ opacity: 0.9 }}>
            <div className="stat-icon" style={{ background: 'rgba(100, 116, 139, 0.15)', color: '#64748b' }}>
              <Lock size={24} />
            </div>
            <div className="stat-info">
              <h3>{lang === 'bn' ? 'নিট মুনাফা' : 'Net Profit'}</h3>
              <div className="stat-value" style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                🔒 {lang === 'bn' ? 'মালিকের জন্য সংরক্ষিত' : 'Owner Access Only'}
              </div>
              <div className="stat-trend" style={{ color: 'var(--text-dim)' }}>
                {lang === 'bn' ? 'স্টাফদের জন্য লকড' : 'Restricted for Staff'}
              </div>
            </div>
          </div>
        )}

        {/* Low Stock Alerts */}
        <div className="glass-card stat-card glow-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <h3>{t.business.stockAlerts}</h3>
            <div className="stat-value" style={{ color: lowStockProducts.length > 0 ? '#ef4444' : '#10b981' }}>
              {lowStockProducts.length}
            </div>
            <div className="stat-trend" style={{ color: '#ef4444' }}>
              {lowStockProducts.length > 0 ? (lang === 'bn' ? 'স্টক সংকট পণ্য' : 'Requires Reorder') : (lang === 'bn' ? 'স্টক পর্যাপ্ত' : 'Sufficient')}
            </div>
          </div>
        </div>

        {/* Total Market Due */}
        <div className="glass-card stat-card glow-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>{t.business.totalDue}</h3>
            <div className="stat-value" style={{ color: '#f59e0b' }}>
              ৳{totalMarketDue.toLocaleString()}
            </div>
            <div className="stat-trend" style={{ color: '#f59e0b' }}>
              {lang === 'bn' ? 'কাস্টমারদের কাছে পাওনা' : 'Receivables'}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar: Damaged Goods Loss & Sales Returns */}
      {(totalDamagedLoss > 0 || totalSalesReturnVal > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginBottom: '1.5rem' }}>
          {totalDamagedLoss > 0 && (
            <div
              className="glass-card"
              onClick={() => setActiveTab('inventory')}
              style={{
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                borderLeft: '4px solid #ef4444'
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                  {lang === 'bn' ? '⚠️ ড্যামেজ / নষ্ট পণ্যের মোট ক্ষতি' : 'Total Damaged Goods Loss'}
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#ef4444', fontFamily: 'monospace' }}>
                  ৳{totalDamagedLoss.toLocaleString()} ({damagedGoods.length} {lang === 'bn' ? 'টি এন্ট্রি' : 'entries'})
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span>{lang === 'bn' ? 'দেখুন' : 'View'}</span>
                <ArrowRight size={13} />
              </span>
            </div>
          )}

          {totalSalesReturnVal > 0 && (
            <div
              className="glass-card"
              onClick={() => setActiveTab('invoices')}
              style={{
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                borderLeft: '4px solid #f97316'
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                  {lang === 'bn' ? '🔄 বিক্রিত পণ্য ফেরত (Sales Return)' : 'Total Sales Returns'}
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#f97316', fontFamily: 'monospace' }}>
                  ৳{totalSalesReturnVal.toLocaleString()} {lang === 'bn' ? 'টাকা সমন্বয়' : 'adjusted'}
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span>{lang === 'bn' ? 'দেখুন' : 'View'}</span>
                <ArrowRight size={13} />
              </span>
            </div>
          )}
        </div>
      )}

      {/* Grid: Low Stock Alert Warning Box + Quick Nav Cards */}
      {lowStockProducts.length > 0 && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} style={{ color: '#ef4444' }} />
            <div>
              <strong style={{ color: '#ef4444' }}>
                {lang === 'bn' ? `মনোযোগ দিন! ${lowStockProducts.length}টি পণ্যের স্টক সংকট পর্যায়ে পৌঁছেছে:` : `Alert! ${lowStockProducts.length} products are below alert threshold:`}
              </strong>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {lowStockProducts.map(p => `${p.name} (বাকি: ${p.stock} টি)`).join(', ')}
              </div>
            </div>
          </div>

          <button
            className="btn btn-danger"
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            onClick={() => setActiveTab('inventory')}
          >
            <span>{lang === 'bn' ? 'স্টক ইন করুন' : 'Stock In Now'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* 🧠 AI BUSINESS INTELLIGENCE & PREDICTIVE FORECASTING */}
      <div
        className="glass-card"
        style={{
          marginBottom: '1.5rem',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.03) 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#ffffff', padding: '8px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.35)' }}>
              <BrainCircuit size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? '🧠 এআই বিজনেস ইনসাইট ও সেলস ফোরকাস্ট' : '🧠 AI Business Intelligence & Sales Forecast'}
                </h3>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    background: 'rgba(139, 92, 246, 0.15)',
                    color: '#8b5cf6',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Sparkles size={11} />
                  <span>{lang === 'bn' ? 'স্মার্ট অ্যানালিটিক্স' : 'Predictive AI'}</span>
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'মার্জিন লিডার, ডেড স্টক, বিক্রয় পূর্বাভাস ও কাস্টমার রিটেনশন অ্যালগরিদম' : 'Margin leaders, dead stock capital, 7-day forecast, and customer retention metrics'}
              </p>
            </div>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          {/* Card 1: Top Profit Margin Winners */}
          <div
            style={{
              background: 'var(--bg-primary)',
              borderRadius: '12px',
              padding: '1rem',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Award size={15} />
                  {lang === 'bn' ? 'সর্বোচ্চ লাভজনক পণ্য' : 'Top Margin Winners'}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                  Top 3
                </span>
              </div>

              {topMarginWinners.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  {topMarginWinners.map((p, idx) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', padding: '4px 0', borderBottom: idx < topMarginWinners.length - 1 ? '1px dashed var(--border-color)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                        <span style={{ fontWeight: '800', color: '#10b981' }}>#{idx + 1}</span>
                        <span style={{ fontWeight: '600', color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '120px' }}>
                          {p.name}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: '800', color: '#10b981', fontFamily: 'monospace' }}>+৳{p.margin}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '4px' }}>({p.marginPercent}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'পর্যাপ্ত পণ্য তথ্য নেই' : 'No data yet'}</div>
              )}
            </div>

            <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              💡 {lang === 'bn' ? 'পরামর্শ: এই পণ্যগুলো বিক্রির প্রধান স্তম্ভ, সবসময় স্টকে রাখুন।' : 'Key profit drivers. Keep in prime display shelf.'}
            </div>
          </div>

          {/* Card 2: Dead Stock & Blocked Capital */}
          <div
            style={{
              background: 'var(--bg-primary)',
              borderRadius: '12px',
              padding: '1rem',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: deadStockProducts.length > 0 ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <AlertTriangle size={15} />
                  {lang === 'bn' ? 'ডেড স্টক ও অলস পুঁজি' : 'Dead Stock & Capital'}
                </span>
                <span style={{ fontSize: '0.7rem', color: deadStockProducts.length > 0 ? '#ef4444' : '#10b981', background: deadStockProducts.length > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                  {deadStockProducts.length} {lang === 'bn' ? 'টি পণ্য' : 'items'}
                </span>
              </div>

              <div style={{ marginTop: '6px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {lang === 'bn' ? 'আটকে থাকা পুঁজির পরিমাণ:' : 'Total Blocked Capital:'}
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: deadStockProducts.length > 0 ? '#ef4444' : '#10b981', fontFamily: 'monospace', margin: '2px 0' }}>
                  ৳{totalDeadStockCapital.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  {deadStockProducts.length > 0
                    ? (lang === 'bn' ? `${deadStockProducts.slice(0, 2).map(p => p.name).join(', ')}${deadStockProducts.length > 2 ? '...' : ''}` : `${deadStockProducts.length} items with 0 sales`)
                    : (lang === 'bn' ? 'সকল পণ্য সক্রিয়ভাবে বিক্রি হচ্ছে!' : 'Healthy inventory turnover!')}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              ⚡ {lang === 'bn' ? 'পরামর্শ: ফ্ল্যাশ ডিসকাউন্ট বা বান্ডেল বানিয়ে ক্যাশ উদ্ধার করুন।' : 'Action: Bundle with popular items to liquidate.'}
            </div>
          </div>

          {/* Card 3: 7-Day Sales Forecast */}
          <div
            style={{
              background: 'var(--bg-primary)',
              borderRadius: '12px',
              padding: '1rem',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <TrendingUp size={15} />
                  {lang === 'bn' ? '৭ দিনের বিক্রয় পূর্বাভাস' : '7-Day Sales Forecast'}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#6366f1', background: 'rgba(99, 102, 241, 0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                  AI Run-rate
                </span>
              </div>

              <div style={{ marginTop: '6px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {lang === 'bn' ? 'প্রত্যাশিত আগামী ৭ দিনের বিক্রয়:' : 'Projected 7-Day Revenue:'}
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#6366f1', fontFamily: 'monospace', margin: '2px 0' }}>
                  ৳{projected7DaySales.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{lang === 'bn' ? 'দৈনিক গড়:' : 'Daily avg:'} ৳{avgDailySales.toLocaleString()}</span>
                  <span style={{ color: '#10b981', fontWeight: '700' }}>+৳{projected7DayProfit.toLocaleString()} লাভ</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              📈 {lang === 'bn' ? 'অনুমান: চলমান বিক্রয় গতির ভিত্তিতে প্রজেকশন।' : 'Based on weighted daily transaction velocity.'}
            </div>
          </div>

          {/* Card 4: Customer Retention Rate */}
          <div
            style={{
              background: 'var(--bg-primary)',
              borderRadius: '12px',
              padding: '1rem',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#ec4899', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Users size={15} />
                  {lang === 'bn' ? 'গ্রাহক রিটেনশন ও রিপিট রেট' : 'Customer Retention'}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#ec4899', background: 'rgba(236, 72, 153, 0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                  {repeatCustomerCount} {lang === 'bn' ? 'জন লয়াল' : 'Loyal'}
                </span>
              </div>

              <div style={{ marginTop: '6px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {lang === 'bn' ? 'পুনরায় ক্রয়কারী ক্রেতার হার:' : 'Repeat Shopper Ratio:'}
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ec4899', fontFamily: 'monospace', margin: '2px 0' }}>
                  {customerRetentionRate}%
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  {lang === 'bn' ? `${identifiedCustomerKeys.length} জন রেজিস্টার্ড ক্রেতার মধ্যে ${repeatCustomerCount} জন একাধিকবার কিনেছেন` : `${repeatCustomerCount} repeat buyers among ${identifiedCustomerKeys.length} customers`}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              💬 {lang === 'bn' ? 'পরামর্শ: লয়াল গ্রাহকদের শুভেচ্ছা এসএমএস ও ডিসকাউন্ট পাঠান।' : 'Nurture loyal customers with SMS/WhatsApp promos.'}
            </div>
          </div>
        </div>
      </div>

      {/* Recent POS Sales Invoices */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={18} style={{ color: 'var(--business-primary)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: 0 }}>
              {lang === 'bn' ? 'সাম্প্রতিক POS বিক্রয় রশিদ ও ইনভয়েস' : 'Recent POS Sales Invoices'}
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {salesHistory.length} {lang === 'bn' ? 'টি ইনভয়েস' : 'sales'}
          </span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>{lang === 'bn' ? 'ইনভয়েস নং' : 'Invoice #'}</th>
                <th>{t.date}</th>
                <th>{t.business.customerName}</th>
                <th>{lang === 'bn' ? 'আইটেম সংখ্যা' : 'Items'}</th>
                <th>{t.business.paymentMethod}</th>
                <th style={{ textAlign: 'right' }}>{t.total}</th>
                <th style={{ textAlign: 'center' }}>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {salesHistory.map((sale) => (
                <tr key={sale.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--business-primary)', fontSize: '0.825rem' }}>
                    {sale.id}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {sale.date}
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{sale.customerName}</div>
                    {sale.customerPhone && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sale.customerPhone}</div>}
                  </td>
                  <td>
                    <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)' }}>
                      {sale.items.reduce((s, i) => s + i.qty, 0)} {lang === 'bn' ? 'টি পণ্য' : 'pcs'}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-mode" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                    ৳{sale.grandTotal.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      onClick={() => setActiveReceipt(sale)}
                      title={t.print}
                    >
                      <Printer size={13} />
                      <span>{lang === 'bn' ? 'রসিদ' : 'Receipt'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
