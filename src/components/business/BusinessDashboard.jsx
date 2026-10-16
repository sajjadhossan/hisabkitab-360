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
  Award,
  Building2,
  PlusCircle,
  UserCheck,
  FileText,
  MessageCircle,
  Share2,
  X,
  Target,
  Wallet,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Activity,
  Check,
  BarChart3
} from 'lucide-react';
import { hapticFeedback } from '../../services/nativeAppService';
import { NLReportSearchModal } from './NLReportSearchModal';
import { EODSummaryModal } from './EODSummaryModal';
import { BusinessHealthScoreModal } from './BusinessHealthScoreModal';
import { ReceiptOCRScannerModal } from '../common/ReceiptOCRScannerModal';

export const BusinessDashboard = () => {
  const {
    products,
    salesHistory,
    customers,
    businessExpenses,
    businessSettings,
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

  // Modern Interactive Time Horizon ('today' | 'yesterday' | 'week' | 'month' | 'all')
  const [timeHorizon, setTimeHorizon] = useState('today');

  // Daily Sales Target Goal State (Persisted in localStorage)
  const [dailySalesTarget, setDailySalesTarget] = useState(() => {
    try {
      const saved = localStorage.getItem('hk_daily_sales_target');
      return saved ? Math.max(1000, Number(saved)) : 50000;
    } catch {
      return 50000;
    }
  });
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTargetInput, setTempTargetInput] = useState(dailySalesTarget.toString());

  // Collapsible Sections for Ultra-Lightweight & Smooth Scrolling
  const [isAiInsightsOpen, setIsAiInsightsOpen] = useState(true);
  const [isBranchMonitorOpen, setIsBranchMonitorOpen] = useState(false);

  // AI & Smart Modals states (Items 81, 82, 84, 90)
  const [showNLSearchModal, setShowNLSearchModal] = useState(false);
  const [showEODModal, setShowEODModal] = useState(false);
  const [showHealthScoreModal, setShowHealthScoreModal] = useState(false);
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [showSmartToolsMenu, setShowSmartToolsMenu] = useState(false);

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

  // Today's Real-time Performance Metrics
  const todayDateStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todaySalesList = useMemo(() => filteredSales.filter(s => (s.date || '').startsWith(todayDateStr)), [filteredSales, todayDateStr]);
  const todaySalesTotal = useMemo(() => todaySalesList.reduce((acc, s) => acc + (Number(s.grandTotal) || 0), 0), [todaySalesList]);
  const todayCogs = useMemo(() => {
    return todaySalesList.reduce((acc, sale) => {
      const saleCost = (sale.items || []).reduce((itemAcc, item) => itemAcc + ((Number(item.costPrice) || 0) * (Number(item.qty) || 0)), 0);
      return acc + saleCost;
    }, 0);
  }, [todaySalesList]);
  const todayExpensesTotal = useMemo(() => {
    return businessExpenses.filter(e => (e.date || '').startsWith(todayDateStr)).reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }, [businessExpenses, todayDateStr]);
  const todayNetProfit = todaySalesTotal - todayCogs - todayExpensesTotal;

  // Day-End Z-Report State & Today's Payment Method Breakdown
  const [showZReportModal, setShowZReportModal] = useState(false);

  const todayCashSales = useMemo(() => {
    return todaySalesList
      .filter(s => !s.paymentMethod || s.paymentMethod === 'cash')
      .reduce((acc, s) => acc + (Number(s.paidAmount) || Number(s.grandTotal) || 0), 0);
  }, [todaySalesList]);

  const todayDigitalSales = useMemo(() => {
    return todaySalesList
      .filter(s => s.paymentMethod && s.paymentMethod !== 'cash' && s.paymentMethod !== 'due')
      .reduce((acc, s) => acc + (Number(s.paidAmount) || Number(s.grandTotal) || 0), 0);
  }, [todaySalesList]);

  const todayDueSales = useMemo(() => {
    return todaySalesList.reduce((acc, s) => {
      const grand = Number(s.grandTotal) || 0;
      const paid = Number(s.paidAmount !== undefined ? s.paidAmount : grand);
      return acc + Math.max(0, grand - paid);
    }, 0);
  }, [todaySalesList]);

  // Selected Time Horizon Metrics (Today / Yesterday / 7 Days / This Month / Last Month / Year / All)
  const yesterdayDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  const thisMonthStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const lastMonthStr = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const thisYearStr = useMemo(() => {
    return `${new Date().getFullYear()}`;
  }, []);

  const periodSalesList = useMemo(() => {
    const now = new Date();
    if (timeHorizon === 'today') {
      return filteredSales.filter(s => (s.date || '').startsWith(todayDateStr));
    }
    if (timeHorizon === 'yesterday') {
      return filteredSales.filter(s => (s.date || '').startsWith(yesterdayDateStr));
    }
    if (timeHorizon === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      return filteredSales.filter(s => (s.date || '').split('T')[0] >= weekAgoStr);
    }
    if (timeHorizon === 'this_month' || timeHorizon === 'month') {
      return filteredSales.filter(s => (s.date || '').startsWith(thisMonthStr));
    }
    if (timeHorizon === 'last_month') {
      return filteredSales.filter(s => (s.date || '').startsWith(lastMonthStr));
    }
    if (timeHorizon === 'year') {
      return filteredSales.filter(s => (s.date || '').startsWith(thisYearStr));
    }
    return filteredSales;
  }, [filteredSales, timeHorizon, todayDateStr, yesterdayDateStr, thisMonthStr, lastMonthStr, thisYearStr]);

  const periodExpensesList = useMemo(() => {
    const now = new Date();
    if (timeHorizon === 'today') {
      return businessExpenses.filter(e => (e.date || '').startsWith(todayDateStr));
    }
    if (timeHorizon === 'yesterday') {
      return businessExpenses.filter(e => (e.date || '').startsWith(yesterdayDateStr));
    }
    if (timeHorizon === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      return businessExpenses.filter(e => (e.date || '').split('T')[0] >= weekAgoStr);
    }
    if (timeHorizon === 'this_month' || timeHorizon === 'month') {
      return businessExpenses.filter(e => (e.date || '').startsWith(thisMonthStr));
    }
    if (timeHorizon === 'last_month') {
      return businessExpenses.filter(e => (e.date || '').startsWith(lastMonthStr));
    }
    if (timeHorizon === 'year') {
      return businessExpenses.filter(e => (e.date || '').startsWith(thisYearStr));
    }
    return businessExpenses;
  }, [businessExpenses, timeHorizon, todayDateStr, yesterdayDateStr, thisMonthStr, lastMonthStr, thisYearStr]);

  const periodSalesTotal = useMemo(() => periodSalesList.reduce((acc, s) => acc + (Number(s.grandTotal) || 0), 0), [periodSalesList]);
  const periodExpensesTotal = useMemo(() => periodExpensesList.reduce((acc, e) => acc + (Number(e.amount) || 0), 0), [periodExpensesList]);
  const periodCogs = useMemo(() => {
    return periodSalesList.reduce((acc, sale) => {
      const saleCost = (sale.items || []).reduce((itemAcc, item) => itemAcc + ((Number(item.costPrice) || 0) * (Number(item.qty) || 0)), 0);
      return acc + saleCost;
    }, 0);
  }, [periodSalesList]);
  const periodNetProfit = periodSalesTotal - periodCogs - periodExpensesTotal;

  const periodCashSales = useMemo(() => {
    return periodSalesList
      .filter(s => !s.paymentMethod || s.paymentMethod === 'cash')
      .reduce((acc, s) => acc + (Number(s.paidAmount) || Number(s.grandTotal) || 0), 0);
  }, [periodSalesList]);

  const periodDigitalSales = useMemo(() => {
    return periodSalesList
      .filter(s => s.paymentMethod && s.paymentMethod !== 'cash' && s.paymentMethod !== 'due')
      .reduce((acc, s) => acc + (Number(s.paidAmount) || Number(s.grandTotal) || 0), 0);
  }, [periodSalesList]);

  const periodDueSales = useMemo(() => {
    return periodSalesList.reduce((acc, s) => {
      const grand = Number(s.grandTotal) || 0;
      const paid = Number(s.paidAmount !== undefined ? s.paidAmount : grand);
      return acc + Math.max(0, grand - paid);
    }, 0);
  }, [periodSalesList]);

  // Cash in Drawer live estimate (Cash collections - Expenses)
  const cashDrawerEstimate = Math.max(0, periodCashSales - periodExpensesTotal);
  const totalPeriodVolume = (periodCashSales + periodDigitalSales + periodDueSales) || 1;
  const cashPct = Math.round((periodCashSales / totalPeriodVolume) * 100);
  const digitalPct = Math.round((periodDigitalSales / totalPeriodVolume) * 100);
  const duePct = Math.round((periodDueSales / totalPeriodVolume) * 100);

  // Daily target completion
  const targetAchievedPct = Math.min(100, Math.round((todaySalesTotal / (dailySalesTarget || 1)) * 100));

  // 🕒 Multi-Timeframe Detailed Performance Intelligence (Today, Yesterday, 7 Days Day-by-Day, Weeks, Months, Years)
  const timeframeAnalytics = useMemo(() => {
    const now = new Date();
    const toYMD = (d) => d.toISOString().split('T')[0];

    const todayStr = toYMD(now);
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(now.getDate() - 1);
    const yesterdayStr = toYMD(yesterdayDate);

    const getSalesForDate = (dateStr) => filteredSales.filter(s => (s.date || '').startsWith(dateStr));
    const getExpForDate = (dateStr) => businessExpenses.filter(e => (e.date || '').startsWith(dateStr));

    const todaySales = getSalesForDate(todayStr).reduce((s, x) => s + (Number(x.grandTotal) || 0), 0);
    const todayExp = getExpForDate(todayStr).reduce((s, x) => s + (Number(x.amount) || 0), 0);

    const yesterdaySales = getSalesForDate(yesterdayStr).reduce((s, x) => s + (Number(x.grandTotal) || 0), 0);
    const yesterdayExp = getExpForDate(yesterdayStr).reduce((s, x) => s + (Number(x.amount) || 0), 0);

    // 7 Days Day-by-day Breakdown (Today and past 6 days)
    const bnDayNames = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
    const past7Days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dStr = toYMD(d);
      const daySales = getSalesForDate(dStr).reduce((s, x) => s + (Number(x.grandTotal) || 0), 0);
      const dayExp = getExpForDate(dStr).reduce((s, x) => s + (Number(x.amount) || 0), 0);
      const dayMargin = daySales - dayExp;
      let label = bnDayNames[d.getDay()];
      if (i === 0) label = lang === 'bn' ? 'আজ' : 'Today';
      else if (i === 1) label = lang === 'bn' ? 'গতকাল' : 'Yesterday';

      past7Days.push({
        date: dStr,
        dayLabel: label,
        sales: daySales,
        expenses: dayExp,
        margin: dayMargin,
        txCount: getSalesForDate(dStr).length
      });
    }

    // Weekly calculations:
    // This Week: past 0-6 days
    // Last Week: past 7-13 days
    // 3rd Last Week (2 weeks ago): past 14-20 days
    const getRangeTotal = (startDaysAgo, endDaysAgo) => {
      const startD = new Date(now);
      startD.setDate(now.getDate() - endDaysAgo);
      const endD = new Date(now);
      endD.setDate(now.getDate() - startDaysAgo);

      const startStr = toYMD(startD);
      const endStr = toYMD(endD);

      const rSales = filteredSales
        .filter(s => {
          const d = (s.date || '').split('T')[0];
          return d >= startStr && d <= endStr;
        })
        .reduce((sum, s) => sum + (Number(s.grandTotal) || 0), 0);

      const rExp = businessExpenses
        .filter(e => {
          const d = (e.date || '').split('T')[0];
          return d >= startStr && d <= endStr;
        })
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      return { sales: rSales, expenses: rExp, margin: rSales - rExp };
    };

    const thisWeek = getRangeTotal(0, 6);
    const lastWeek = getRangeTotal(7, 13);
    const thirdLastWeek = getRangeTotal(14, 20);

    // Monthly calculations:
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth();
    const pad = (n) => String(n).padStart(2, '0');

    const thisMonthPrefix = `${thisYear}-${pad(thisMonth + 1)}`;
    const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);
    const lastMonthPrefix = `${lastMonthDate.getFullYear()}-${pad(lastMonthDate.getMonth() + 1)}`;

    const thisMonthSales = filteredSales.filter(s => (s.date || '').startsWith(thisMonthPrefix)).reduce((s, x) => s + (Number(x.grandTotal) || 0), 0);
    const thisMonthExp = businessExpenses.filter(e => (e.date || '').startsWith(thisMonthPrefix)).reduce((s, x) => s + (Number(x.amount) || 0), 0);

    const lastMonthSales = filteredSales.filter(s => (s.date || '').startsWith(lastMonthPrefix)).reduce((s, x) => s + (Number(x.grandTotal) || 0), 0);
    const lastMonthExp = businessExpenses.filter(e => (e.date || '').startsWith(lastMonthPrefix)).reduce((s, x) => s + (Number(x.amount) || 0), 0);

    // Yearly calculations:
    const thisYearPrefix = `${thisYear}`;
    const lastYearPrefix = `${thisYear - 1}`;

    const thisYearSales = filteredSales.filter(s => (s.date || '').startsWith(thisYearPrefix)).reduce((s, x) => s + (Number(x.grandTotal) || 0), 0);
    const thisYearExp = businessExpenses.filter(e => (e.date || '').startsWith(thisYearPrefix)).reduce((s, x) => s + (Number(x.amount) || 0), 0);

    const lastYearSales = filteredSales.filter(s => (s.date || '').startsWith(lastYearPrefix)).reduce((s, x) => s + (Number(x.grandTotal) || 0), 0);
    const lastYearExp = businessExpenses.filter(e => (e.date || '').startsWith(lastYearPrefix)).reduce((s, x) => s + (Number(x.amount) || 0), 0);

    return {
      today: { sales: todaySales, expenses: todayExp, margin: todaySales - todayExp },
      yesterday: { sales: yesterdaySales, expenses: yesterdayExp, margin: yesterdaySales - yesterdayExp },
      past7Days,
      thisWeek,
      lastWeek,
      thirdLastWeek,
      thisMonth: { sales: thisMonthSales, expenses: thisMonthExp, margin: thisMonthSales - thisMonthExp },
      lastMonth: { sales: lastMonthSales, expenses: lastMonthExp, margin: lastMonthSales - lastMonthExp },
      thisYear: { sales: thisYearSales, expenses: thisYearExp, margin: thisYearSales - thisYearExp },
      lastYear: { sales: lastYearSales, expenses: lastYearExp, margin: lastYearSales - lastYearExp }
    };
  }, [filteredSales, businessExpenses, lang]);

  const handleSaveTarget = () => {
    const val = Math.max(1000, Number(tempTargetInput) || 50000);
    setDailySalesTarget(val);
    setIsEditingTarget(false);
    try {
      localStorage.setItem('hk_daily_sales_target', val.toString());
    } catch {}
  };

  const handleShareZReportWhatsApp = () => {
    hapticFeedback.medium();
    const storeName = businessSettings?.storeName || (lang === 'bn' ? 'আমার দোকান' : 'My Store');
    const msg =
      `🌙 *${storeName} - দৈনিক ক্লোজিং Z-রিপোর্ট*\n` +
      `📅 তারিখ: ${new Date().toLocaleDateString('bn-BD')}\n` +
      `🕒 সময়: ${new Date().toLocaleTimeString('bn-BD')}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `• মোট বিক্রয়: ৳${todaySalesTotal.toLocaleString()} (${todaySalesList.length}টি মেমো)\n` +
      `• ক্যাশ বিক্রয় আদায়: ৳${todayCashSales.toLocaleString()}\n` +
      `• ডিজিটাল/মোবাইল পেমেন্ট: ৳${todayDigitalSales.toLocaleString()}\n` +
      `• বকেয়া/বাকিতে বিক্রি: ৳${todayDueSales.toLocaleString()}\n` +
      `• আজকের মোট খরচ: ৳${todayExpensesTotal.toLocaleString()}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📈 *আজকের প্রাক্কলিত লাভ:* ৳${todayNetProfit.toLocaleString()}\n` +
      `💵 *ক্যাশ ড্রয়ার স্থিতি:* ৳${Math.max(0, todayCashSales - todayExpensesTotal).toLocaleString()}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `হিসাবকিতাব ৩৬০ সিস্টেম থেকে স্বয়ংক্রিয়ভাবে প্রস্তুতকৃত।`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  };

  // Today's Top 5 Selling Products
  const todayTopProducts = useMemo(() => {
    const itemMap = {};
    todaySalesList.forEach(s => {
      (s.items || []).forEach(item => {
        if (!item.name) return;
        if (!itemMap[item.name]) {
          itemMap[item.name] = { name: item.name, qty: 0, total: 0 };
        }
        itemMap[item.name].qty += (Number(item.qty) || 0);
        itemMap[item.name].total += ((Number(item.sellPrice) || 0) * (Number(item.qty) || 0));
      });
    });
    return Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [todaySalesList]);

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

  // 🎨 7-Day Jewel-Tone Color Palettes & Modular Tiles Definition
  const [selectedChartDay, setSelectedChartDay] = useState(null);
  const [trendViewMode, setTrendViewMode] = useState('both'); // 'both' | 'tiles' | 'curve'

  const last7DaysTrend = useMemo(() => {
    const DAY_PALETTES = [
      {
        id: 'day-0',
        primary: '#6366f1',
        accent: '#a5b4fc',
        lightBg: 'rgba(99, 102, 241, 0.14)',
        border: 'rgba(99, 102, 241, 0.4)',
        gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        glow: '0 8px 25px rgba(99, 102, 241, 0.35)'
      },
      {
        id: 'day-1',
        primary: '#0284c7',
        accent: '#7dd3fc',
        lightBg: 'rgba(2, 132, 199, 0.14)',
        border: 'rgba(2, 132, 199, 0.4)',
        gradient: 'linear-gradient(135deg, #0284c7, #0369a1)',
        glow: '0 8px 25px rgba(2, 132, 199, 0.35)'
      },
      {
        id: 'day-2',
        primary: '#06b6d4',
        accent: '#67e8f9',
        lightBg: 'rgba(6, 182, 212, 0.14)',
        border: 'rgba(6, 182, 212, 0.4)',
        gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
        glow: '0 8px 25px rgba(6, 182, 212, 0.35)'
      },
      {
        id: 'day-3',
        primary: '#f59e0b',
        accent: '#fde68a',
        lightBg: 'rgba(245, 158, 11, 0.14)',
        border: 'rgba(245, 158, 11, 0.4)',
        gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
        glow: '0 8px 25px rgba(245, 158, 11, 0.35)'
      },
      {
        id: 'day-4',
        primary: '#f43f5e',
        accent: '#fda4af',
        lightBg: 'rgba(244, 63, 94, 0.14)',
        border: 'rgba(244, 63, 94, 0.4)',
        gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)',
        glow: '0 8px 25px rgba(244, 63, 94, 0.35)'
      },
      {
        id: 'day-5',
        primary: '#8b5cf6',
        accent: '#c4b5fd',
        lightBg: 'rgba(139, 92, 246, 0.16)',
        border: 'rgba(139, 92, 246, 0.45)',
        gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
        glow: '0 8px 25px rgba(139, 92, 246, 0.35)'
      },
      {
        id: 'day-6',
        primary: '#10b981',
        accent: '#6ee7b7',
        lightBg: 'rgba(16, 185, 129, 0.18)',
        border: 'rgba(16, 185, 129, 0.55)',
        gradient: 'linear-gradient(135deg, #10b981, #059669)',
        glow: '0 8px 28px rgba(16, 185, 129, 0.45)'
      }
    ];

    const bnDayNames = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const daySales = (filteredSales || []).filter(s => s.date && s.date.startsWith(dateStr));
      const total = daySales.reduce((sum, s) => sum + (Number(s.grandTotal) || 0), 0);
      const cashTotal = daySales.reduce((sum, s) => sum + (Number(s.paidAmount || s.actualPaid || s.grandTotal) || 0), 0);
      const dueTotal = daySales.reduce((sum, s) => sum + (Number(s.dueAmount) || 0), 0);
      const idx = 6 - i;

      let dayBadge = '';
      if (i === 0) {
        dayBadge = lang === 'bn' ? '⚡ আজ' : '⚡ Today';
      } else if (i === 1) {
        dayBadge = lang === 'bn' ? 'গতকাল' : 'Yesterday';
      } else {
        dayBadge = lang === 'bn' ? bnDayNames[d.getDay()] : d.toLocaleDateString('en-US', { weekday: 'short' });
      }

      const shortDate = d.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short' });

      days.push({
        date: dateStr,
        dayBadge,
        shortDate,
        label: `${dayBadge} (${shortDate})`,
        total,
        count: daySales.length,
        cashTotal,
        dueTotal,
        salesList: daySales,
        isToday: i === 0,
        isYesterday: i === 1,
        palette: DAY_PALETTES[idx]
      });
    }
    return days;
  }, [filteredSales, lang]);

  const maxTrendTotal = useMemo(() => {
    return Math.max(...last7DaysTrend.map(d => d.total), 1000);
  }, [last7DaysTrend]);

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

        {/* Executive Action Controls: Smart Tools Dropdown & High-Visibility POS Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
          {/* Smart Tools & AI Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowSmartToolsMenu(prev => !prev)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 14px',
                borderRadius: '11px',
                fontWeight: '700',
                fontSize: '0.86rem',
                background: showSmartToolsMenu ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-secondary)',
                borderColor: showSmartToolsMenu ? 'var(--business-primary)' : 'var(--border-color)',
                color: 'var(--text-main)',
                cursor: 'pointer'
              }}
              title={lang === 'bn' ? 'রিপোর্ট, দিনশেষ ও এআই টুলস' : 'Reports, EOD & AI Tools'}
            >
              <Sparkles size={16} style={{ color: '#6366f1' }} />
              <span>{lang === 'bn' ? '⚡ স্মার্ট টুলস ও AI' : '⚡ Tools & AI'}</span>
              <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: showSmartToolsMenu ? 'rotate(180deg)' : 'none' }} />
            </button>

            {/* Floating Dropdown Menu */}
            {showSmartToolsMenu && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 998 }}
                  onClick={() => setShowSmartToolsMenu(false)}
                />
                <div
                  className="glass-card animate-scale-up"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    minWidth: '240px',
                    maxWidth: 'min(300px, calc(100vw - 24px))',
                    boxSizing: 'border-box',
                    zIndex: 999,
                    padding: '6px',
                    borderRadius: '14px',
                    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
                    background: 'var(--bg-card)',
                    border: '1.5px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => { setShowSmartToolsMenu(false); setActiveTab('reports'); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-main)',
                      fontSize: '0.84rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <BarChart3 size={16} style={{ color: '#6366f1' }} />
                    <div>
                      <div>{lang === 'bn' ? 'পূর্ণাঙ্গ রিপোর্ট হাব' : 'Full Reports Hub'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                        {lang === 'bn' ? 'ডেইলি, মান্থলি ও বাৎসরিক হিসাব' : 'Daily, monthly & annual reports'}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setShowSmartToolsMenu(false); setShowNLSearchModal(true); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-main)',
                      fontSize: '0.84rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Sparkles size={16} style={{ color: '#818cf8' }} />
                    <div>
                      <div>{lang === 'bn' ? 'AI রিপোর্ট অনুসন্ধান' : 'AI Report Search'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                        {lang === 'bn' ? 'সহজ ভাষায় প্রশ্ন করে রিপোর্ট' : 'Ask questions in Bengali'}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setShowSmartToolsMenu(false); setShowEODModal(true); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-main)',
                      fontSize: '0.84rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Calendar size={16} style={{ color: '#10b981' }} />
                    <div>
                      <div>{lang === 'bn' ? 'দিনশেষের সারসংক্ষেপ (EOD)' : 'End-of-Day (EOD)'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                        {lang === 'bn' ? 'দিনের ক্যাশ ও সেলস ক্লোজিং' : 'Daily sales & cash closing'}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setShowSmartToolsMenu(false); setShowHealthScoreModal(true); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-main)',
                      fontSize: '0.84rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <BrainCircuit size={16} style={{ color: '#f59e0b' }} />
                    <div>
                      <div>{lang === 'bn' ? 'বিজনেস হেলথ স্কোর' : 'Business Health Score'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                        {lang === 'bn' ? 'লাভ ও তারল্য স্বাস্থ্য অ্যানালাইসিস' : 'Profitability & health audit'}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setShowSmartToolsMenu(false); setShowOCRModal(true); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-main)',
                      fontSize: '0.84rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <FileText size={16} style={{ color: '#60a5fa' }} />
                    <div>
                      <div>{lang === 'bn' ? 'রসিদ OCR স্ক্যান' : 'Receipt OCR Scan'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                        {lang === 'bn' ? 'কাগজের ভাউচার ক্যামেরা স্ক্যান' : 'Camera receipt scanner'}
                      </div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Primary High-Contrast POS Button */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              hapticFeedback.medium();
              setActiveTab('pos');
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '11px',
              fontWeight: '800',
              fontSize: '0.88rem',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
              cursor: 'pointer'
            }}
            title={lang === 'bn' ? 'পিওএস সেলস কাউন্টার খুলুন (F1)' : 'Open POS Terminal (F1)'}
          >
            <ScanLine size={17} />
            <span>{lang === 'bn' ? '⚡ নতুন বিক্রয় (POS)' : '⚡ New Sale (POS)'}</span>
          </button>
        </div>
      </div>

      {/* 🧭 MODERN INTERACTIVE TIME HORIZON SWITCHER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '1rem',
          background: 'var(--bg-secondary)',
          padding: '8px 12px',
          borderRadius: '14px',
          border: '1px solid var(--border-color)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} style={{ color: '#10b981' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-main)' }}>
            {lang === 'bn' ? 'টাইমলাইন ফিল্টার:' : 'Time Horizon:'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'today', label: lang === 'bn' ? 'আজ' : 'Today' },
            { id: 'yesterday', label: lang === 'bn' ? 'গতকাল' : 'Yesterday' },
            { id: 'week', label: lang === 'bn' ? 'বিগত ৭ দিন' : 'Last 7 Days' },
            { id: 'this_month', label: lang === 'bn' ? 'চলতি মাস' : 'This Month' },
            { id: 'last_month', label: lang === 'bn' ? 'গত মাস' : 'Last Month' },
            { id: 'year', label: lang === 'bn' ? 'এই বছর' : 'This Year' },
            { id: 'all', label: lang === 'bn' ? 'সর্বমোট' : 'All Time' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                hapticFeedback.light();
                setTimeHorizon(tab.id);
              }}
              style={{
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: (timeHorizon === tab.id || (tab.id === 'this_month' && timeHorizon === 'month')) ? '800' : '600',
                background: (timeHorizon === tab.id || (tab.id === 'this_month' && timeHorizon === 'month')) ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--bg-card)',
                color: (timeHorizon === tab.id || (tab.id === 'this_month' && timeHorizon === 'month')) ? '#ffffff' : 'var(--text-muted)',
                border: (timeHorizon === tab.id || (tab.id === 'this_month' && timeHorizon === 'month')) ? '1px solid #10b981' : '1px solid var(--border-color)',
                boxShadow: (timeHorizon === tab.id || (tab.id === 'this_month' && timeHorizon === 'month')) ? '0 2px 8px rgba(16, 185, 129, 0.35)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ⚡ ULTRA-MODERN DIGITAL BUSINESS COCKPIT (FINTECH HUD) */}
      <div
        className="glass-card"
        style={{
          padding: '1.25rem',
          borderRadius: '18px',
          marginBottom: '1.25rem',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
          border: '1.5px solid rgba(16, 185, 129, 0.35)',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Cockpit Top Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 10px #10b981'
              }}
            />
            <span style={{ fontSize: '0.85rem', fontWeight: '800', letterSpacing: '0.5px', color: '#10b981', textTransform: 'uppercase' }}>
              {lang === 'bn' ? '⚡ লাইভ ডিজিটাল ককপিট ও ক্যাশ-ফ্লো' : '⚡ Live Digital Cockpit & Cashflow'}
            </span>
            <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              {timeHorizon === 'today' ? (lang === 'bn' ? 'আজকের লাইভ' : 'Today Live') :
               (timeHorizon === 'this_month' || timeHorizon === 'month') ? (lang === 'bn' ? 'চলতি মাস' : 'This Month') :
               timeHorizon === 'last_month' ? (lang === 'bn' ? 'গত মাস' : 'Last Month') :
               timeHorizon === 'year' ? (lang === 'bn' ? 'এই বছর' : 'This Year') :
               `${timeHorizon.toUpperCase()} VIEW`}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                hapticFeedback.light();
                setShowZReportModal(true);
              }}
              style={{
                padding: '6px 13px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#fbbf24',
                fontWeight: '800',
                fontSize: '0.78rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <span>🌙</span>
              <span>{lang === 'bn' ? 'দৈনিক Z-রিপোর্ট' : 'Z-Report'}</span>
            </button>
          </div>
        </div>

        {/* 4 Fintech HUD Grid Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          {/* Tile 1: Cash in Drawer */}
          <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <Wallet size={15} style={{ color: '#10b981' }} />
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: '700' }}>
                {lang === 'bn' ? 'ক্যাশ ড্রয়ার স্থিতি (নগদ)' : 'Cash in Drawer:'}
              </span>
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
              ৳{cashDrawerEstimate.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '3px' }}>
              {lang === 'bn' ? `ক্যাশ আদায় ৳${periodCashSales.toLocaleString()} - খরচ ৳${periodExpensesTotal.toLocaleString()}` : `Cash In ৳${periodCashSales.toLocaleString()} - Out ৳${periodExpensesTotal.toLocaleString()}`}
            </div>
          </div>

          {/* Tile 2: Digital Payments */}
          <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <CreditCard size={15} style={{ color: '#60a5fa' }} />
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: '700' }}>
                {lang === 'bn' ? 'ডিজিটাল (বিকাশ/নগদ/কার্ড)' : 'Digital Collection:'}
              </span>
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>
              ৳{periodDigitalSales.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '3px' }}>
              {digitalPct}% {lang === 'bn' ? 'অনলাইন ও কার্ড ট্রানজেকশন' : 'online & mfs share'}
            </div>
          </div>

          {/* Tile 3: Due on Credit */}
          <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <Users size={15} style={{ color: '#fbbf24' }} />
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: '700' }}>
                {lang === 'bn' ? 'বকেয়া বিক্রয় (বাকিতে)' : 'Due on Credit:'}
              </span>
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
              ৳{periodDueSales.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '3px' }}>
              {duePct}% {lang === 'bn' ? 'ক্রেতাদের কাছে বাকি রইল' : 'unsettled credit memo'}
            </div>
          </div>

          {/* Tile 4: Expenses */}
          <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <AlertTriangle size={15} style={{ color: '#f87171' }} />
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: '700' }}>
                {lang === 'bn' ? 'দোকানের মোট খরচ' : 'Period Expenses:'}
              </span>
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#f87171', fontFamily: 'var(--font-mono)' }}>
              ৳{periodExpensesTotal.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '3px' }}>
              {periodExpensesList.length} {lang === 'bn' ? 'টি খরচ ভাউচার রেকর্ড' : 'vouchers posted'}
            </div>
          </div>
        </div>

        {/* Cash-Flow Ratio Segmented Progress Strip */}
        <div style={{ background: 'rgba(0, 0, 0, 0.25)', borderRadius: '12px', padding: '10px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.72rem', color: '#94a3b8' }}>
            <span style={{ fontWeight: '700' }}>{lang === 'bn' ? '📊 পেমেন্ট মেথড অনুপাত (Cash Flow Breakdown):' : '📊 Payment Ratio Breakdown:'}</span>
            <span>
              <strong style={{ color: '#10b981' }}>{cashPct}% নগদ</strong> •{' '}
              <strong style={{ color: '#60a5fa' }}>{digitalPct}% ডিজিটাল</strong> •{' '}
              <strong style={{ color: '#fbbf24' }}>{duePct}% বাকি</strong>
            </span>
          </div>

          <div style={{ display: 'flex', height: '10px', borderRadius: '8px', overflow: 'hidden', background: '#334155' }}>
            <div style={{ width: `${cashPct}%`, background: '#10b981', transition: 'width 0.4s ease' }} title={`Cash: ${cashPct}%`} />
            <div style={{ width: `${digitalPct}%`, background: '#3b82f6', transition: 'width 0.4s ease' }} title={`Digital: ${digitalPct}%`} />
            <div style={{ width: `${duePct}%`, background: '#f59e0b', transition: 'width 0.4s ease' }} title={`Due: ${duePct}%`} />
          </div>
        </div>
      </div>

      {/* 🎯 DAILY SALES TARGET & MOTIVATION PROGRESS METER */}
      <div
        className="glass-card"
        style={{
          padding: '1rem 1.25rem',
          borderRadius: '16px',
          marginBottom: '1.25rem',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(16, 185, 129, 0.08))',
          border: '1.5px solid rgba(99, 102, 241, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '240px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
              flexShrink: 0
            }}
          >
            <Target size={22} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'দৈনিক বিক্রয় লক্ষ্যমাত্রা (Sales Goal Meter)' : 'Daily Sales Target Meter'}
              </strong>
              {targetAchievedPct >= 100 && (
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                  🎉 {lang === 'bn' ? 'অর্জিত!' : 'Goal Met!'}
                </span>
              )}
            </div>

            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {lang === 'bn' ? 'আজকের বিক্রয়:' : 'Today:'}{' '}
              <strong style={{ color: '#10b981', fontFamily: 'var(--font-mono)' }}>৳{todaySalesTotal.toLocaleString()}</strong> /{' '}
              {lang === 'bn' ? 'টার্গেট:' : 'Goal:'}{' '}
              <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>৳{dailySalesTarget.toLocaleString()}</strong> ({targetAchievedPct}%)
            </div>
          </div>
        </div>

        {/* Progress Bar & Target Adjustment */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 300px', maxWidth: '480px' }}>
          <div style={{ flex: 1, background: 'var(--bg-secondary)', height: '12px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, targetAchievedPct)}%`,
                background: targetAchievedPct >= 100 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #6366f1, #10b981)',
                borderRadius: '10px',
                transition: 'width 0.5s ease'
              }}
            />
          </div>

          {isEditingTarget ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="number"
                value={tempTargetInput}
                onChange={e => setTempTargetInput(e.target.value)}
                style={{
                  width: '90px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  border: '1px solid #6366f1',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)'
                }}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveTarget}
                style={{ padding: '4px 8px', fontSize: '0.72rem' }}
              >
                <Check size={13} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setTempTargetInput(dailySalesTarget.toString());
                setIsEditingTarget(true);
              }}
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.72rem', whiteSpace: 'nowrap' }}
            >
              {lang === 'bn' ? 'টার্গেট পরিবর্তন' : 'Edit Goal'}
            </button>
          )}
        </div>
      </div>

      {/* Item 87: ULTRA-MODERN 7-COLOR MODULAR TILES & INTERACTIVE SALES TREND HUD */}
      <div
        className="glass-card"
        style={{
          padding: '18px',
          borderRadius: '20px',
          marginBottom: '1.25rem',
          background: 'var(--bg-card)',
          border: '1.5px solid rgba(16, 185, 129, 0.3)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Top Header & View Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} style={{ color: '#10b981' }} />
              <span>{lang === 'bn' ? 'বিগত ৭ দিনের বিক্রয় প্রবাহ (৭ রঙের আধুনিক খোপ ও ট্রেন্ড)' : 'Last 7 Days Sales Trend (7-Color Modular HUD)'}</span>
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              {lang === 'bn' ? 'আলাদা রঙের ৭টি চারকোণা খোপে দৈনিক বিক্রয়—ক্লিক করে ঐ দিনের বিস্তারিত দেখুন' : '7 distinct jewel-tone modular tiles. Tap any tile to inspect daily breakdown.'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* View Mode Toggle Pill */}
            <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '3px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={() => setTrendViewMode('tiles')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '7px',
                  border: 'none',
                  background: trendViewMode === 'tiles' ? '#10b981' : 'transparent',
                  color: trendViewMode === 'tiles' ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {lang === 'bn' ? '🎴 ৭ খোপ' : 'Tiles'}
              </button>
              <button
                type="button"
                onClick={() => setTrendViewMode('curve')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '7px',
                  border: 'none',
                  background: trendViewMode === 'curve' ? '#10b981' : 'transparent',
                  color: trendViewMode === 'curve' ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {lang === 'bn' ? '📈 ওয়েভ' : 'Wave'}
              </button>
              <button
                type="button"
                onClick={() => setTrendViewMode('both')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '7px',
                  border: 'none',
                  background: trendViewMode === 'both' ? '#10b981' : 'transparent',
                  color: trendViewMode === 'both' ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {lang === 'bn' ? '⚡ উভয়' : 'Both'}
              </button>
            </div>
          </div>
        </div>

        {/* 🎴 7 DISTINCT COLOR-CODED MODULAR TILES (আধা ইঞ্চি করে খোপ খোপ বানায়ে ডিফারেন্ট ডিফারেন্ট কালার) */}
        {(trendViewMode === 'tiles' || trendViewMode === 'both') && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
              gap: '10px',
              marginBottom: trendViewMode === 'both' ? '18px' : '8px'
            }}
          >
            {last7DaysTrend.map((d) => {
              const palette = d.palette;
              const isSelected = selectedChartDay?.date === d.date;
              const pctOfPeak = maxTrendTotal > 0 ? Math.round((d.total / maxTrendTotal) * 100) : 0;

              return (
                <div
                  key={d.date}
                  className="press-scale"
                  onClick={() => {
                    hapticFeedback.light();
                    setSelectedChartDay(isSelected ? null : d);
                  }}
                  style={{
                    background: isSelected ? palette.gradient : palette.lightBg,
                    border: isSelected ? `2px solid ${palette.primary}` : `1.5px solid ${palette.border}`,
                    boxShadow: isSelected ? palette.glow : '0 4px 16px rgba(0, 0, 0, 0.05)',
                    borderRadius: '16px',
                    padding: '12px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '120px',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    transform: isSelected ? 'translateY(-3px)' : 'none',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  {/* Subtle Glow Accent Top Border */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: palette.gradient
                    }}
                  />

                  {/* Top: Day Badge & Date */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: '800',
                        padding: '2px 7px',
                        borderRadius: '6px',
                        background: isSelected
                          ? 'rgba(0, 0, 0, 0.3)'
                          : d.isToday
                          ? palette.primary
                          : 'rgba(255, 255, 255, 0.1)',
                        color: isSelected
                          ? '#ffffff'
                          : d.isToday
                          ? '#ffffff'
                          : palette.accent
                      }}
                    >
                      {d.dayBadge}
                    </span>
                    <span style={{ fontSize: '0.66rem', color: isSelected ? 'rgba(255, 255, 255, 0.85)' : 'var(--text-muted)', fontWeight: '600' }}>
                      {d.shortDate}
                    </span>
                  </div>

                  {/* Center: Sales Amount */}
                  <div style={{ margin: '4px 0 6px' }}>
                    <div
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: '900',
                        color: isSelected ? '#ffffff' : 'var(--text-main)',
                        fontFamily: 'var(--font-mono)',
                        lineHeight: 1.2
                      }}
                    >
                      ৳{d.total.toLocaleString()}
                    </div>
                    <div
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: '700',
                        color: isSelected ? 'rgba(255, 255, 255, 0.9)' : palette.accent,
                        marginTop: '3px'
                      }}
                    >
                      {d.count} {lang === 'bn' ? 'টি মেমো' : 'orders'}
                    </div>
                  </div>

                  {/* Bottom: Progress Bar vs 7-day Peak */}
                  <div>
                    <div
                      style={{
                        width: '100%',
                        height: '5px',
                        background: isSelected ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        marginBottom: '3px'
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.max(6, pctOfPeak)}%`,
                          background: isSelected ? '#ffffff' : palette.gradient,
                          borderRadius: '4px',
                          transition: 'width 0.4s ease'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.62rem', color: isSelected ? '#ffffff' : 'var(--text-muted)' }}>
                      <span>{pctOfPeak}% {lang === 'bn' ? 'সর্বোচ্চ' : 'peak'}</span>
                      {d.dueTotal > 0 && (
                        <span style={{ color: isSelected ? '#fed7aa' : '#f97316', fontWeight: '700' }}>
                          ৳{d.dueTotal} {lang === 'bn' ? 'বকেয়া' : 'due'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 🔍 INTERACTIVE SELECTED DAY INSPECTION DRAWER */}
        {selectedChartDay && (
          <div
            className="animate-fade-in"
            style={{
              background: 'var(--bg-secondary)',
              border: `1.5px solid ${selectedChartDay.palette?.primary || 'var(--border-color)'}`,
              borderRadius: '16px',
              padding: '14px 16px',
              marginBottom: trendViewMode === 'both' ? '18px' : '8px',
              boxShadow: selectedChartDay.palette?.glow || 'var(--shadow-md)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: selectedChartDay.palette?.gradient || '#10b981',
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '0.78rem'
                  }}
                >
                  📅 {selectedChartDay.label}
                </span>
                <span style={{ fontSize: '0.84rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? 'বিস্তারিত অডিট ও পরিসংখ্যান' : 'Detailed Day Performance'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedChartDay(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '12px'
                }}
              >
                ✕ {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>

            {/* Quick 4 Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
              <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'মোট বিক্রয়' : 'Total Sales'}</div>
                <div style={{ fontSize: '1.15rem', fontWeight: '900', color: selectedChartDay.palette?.primary || '#10b981', fontFamily: 'var(--font-mono)' }}>
                  ৳{selectedChartDay.total.toLocaleString()}
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'অর্ডার সংখ্যা' : 'Total Invoices'}</div>
                <div style={{ fontSize: '1.15rem', fontWeight: '900', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                  {selectedChartDay.count} {lang === 'bn' ? 'টি' : 'orders'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'গড় মেমো সাইজ' : 'Avg Order Value'}</div>
                <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                  ৳{selectedChartDay.count > 0 ? Math.round(selectedChartDay.total / selectedChartDay.count).toLocaleString() : '0'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'নগদ আদায়' : 'Cash Collected'}</div>
                <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                  ৳{selectedChartDay.cashTotal.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 📈 ULTRA-MODERN GLOWING SMOOTH WAVE / CURVE AREA SVG CHART */}
        {(trendViewMode === 'curve' || trendViewMode === 'both') && (
          <div style={{ width: '100%', height: '150px', position: 'relative', marginTop: '6px' }}>
            <svg width="100%" height="100%" viewBox="0 0 700 150" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="trendWaveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#6366f1" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="strokeLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="35%" stopColor="#06b6d4" />
                  <stop offset="70%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="30" x2="700" y2="30" stroke="var(--border-color)" strokeDasharray="3 3" opacity="0.35" />
              <line x1="0" y1="75" x2="700" y2="75" stroke="var(--border-color)" strokeDasharray="3 3" opacity="0.35" />
              <line x1="0" y1="120" x2="700" y2="120" stroke="var(--border-color)" opacity="0.6" />

              {/* Area Wave Fill & Curve Line */}
              {(() => {
                const points = last7DaysTrend.map((d, idx) => {
                  const x = 40 + idx * 103;
                  const ratio = maxTrendTotal > 0 ? d.total / maxTrendTotal : 0;
                  const y = 120 - Math.max(10, ratio * 95);
                  return { x, y, d };
                });

                // Generate Smooth Cubic Bezier SVG Path
                let pathD = `M ${points[0].x} ${points[0].y}`;
                for (let i = 0; i < points.length - 1; i++) {
                  const curr = points[i];
                  const next = points[i + 1];
                  const mx = (curr.x + next.x) / 2;
                  pathD += ` C ${mx} ${curr.y}, ${mx} ${next.y}, ${next.x} ${next.y}`;
                }

                // Closed Area Path
                const areaD = `${pathD} L ${points[points.length - 1].x} 120 L ${points[0].x} 120 Z`;

                return (
                  <>
                    <path d={areaD} fill="url(#trendWaveGrad)" />
                    <path d={pathD} fill="none" stroke="url(#strokeLineGrad)" strokeWidth="3.5" strokeLinecap="round" />

                    {/* Nodes at each day */}
                    {points.map((pt) => {
                      const isSelected = selectedChartDay?.date === pt.d.date;
                      return (
                        <g
                          key={pt.d.date}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            hapticFeedback.light();
                            setSelectedChartDay(isSelected ? null : pt.d);
                          }}
                        >
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isSelected ? 8 : 5}
                            fill={pt.d.palette?.primary || '#10b981'}
                            stroke="#ffffff"
                            strokeWidth="2"
                            style={{ filter: isSelected ? 'drop-shadow(0 0 6px #10b981)' : 'none', transition: 'all 0.2s ease' }}
                          />
                          {/* Top Amount Badge */}
                          <text
                            x={pt.x}
                            y={pt.y - 10}
                            textAnchor="middle"
                            fill={isSelected ? pt.d.palette?.primary : 'var(--text-main)'}
                            fontSize="10"
                            fontWeight="800"
                            fontFamily="monospace"
                          >
                            ৳{pt.d.total > 0 ? (pt.d.total >= 1000 ? `${(pt.d.total / 1000).toFixed(1)}k` : pt.d.total) : '0'}
                          </text>

                          {/* Bottom Day Label */}
                          <text
                            x={pt.x}
                            y="138"
                            textAnchor="middle"
                            fill={isSelected ? pt.d.palette?.primary : 'var(--text-muted)'}
                            fontSize="10"
                            fontWeight={isSelected ? '800' : '600'}
                          >
                            {pt.d.dayBadge}
                          </text>
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>
        )}
      </div>


      {/* 📊 সময়কালভিত্তিক বিস্তারিত বিক্রি ও খরচ (Timeframe Performance Intelligence) */}
      <div
        className="glass-card"
        style={{
          padding: '16px',
          borderRadius: '16px',
          marginBottom: '1.25rem',
          background: 'var(--bg-card)',
          border: '1.5px solid rgba(16, 185, 129, 0.25)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>📊</span>
              <span>{lang === 'bn' ? 'সময়কালভিত্তিক বিস্তারিত বিক্রি ও খরচ (লাইভ অডিট)' : 'Multi-Period Sales & Expense Intelligence'}</span>
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              {lang === 'bn'
                ? 'আজ, গতকাল, বিগত ৭ দিনের দিনভিত্তিক হিসাব, সপ্তাহভিত্তিক এবং মাস ও বাৎসরিক তুলনামূলক পরিসংখ্যান'
                : 'Today, yesterday, 7-day breakdown, weekly shifts, monthly & yearly comparisons'}
            </p>
          </div>
        </div>

        {/* 1. Comparison Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px', marginBottom: '14px' }}>
          {/* Card A: Today (আজ) */}
          <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#10b981' }}>
                🟢 {lang === 'bn' ? 'আজ (Today)' : 'Today'}
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{timeframeAnalytics.today.date || 'আজকের দিন'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-muted)' }}>{lang === 'bn' ? 'বিক্রি:' : 'Sales:'}</span>
              <strong style={{ color: '#10b981', fontFamily: 'var(--font-mono)' }}>৳{timeframeAnalytics.today.sales.toLocaleString('en-IN')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>{lang === 'bn' ? 'খরচ:' : 'Expenses:'}</span>
              <strong style={{ color: '#ef4444', fontFamily: 'var(--font-mono)' }}>৳{timeframeAnalytics.today.expenses.toLocaleString('en-IN')}</strong>
            </div>
            <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '5px', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{lang === 'bn' ? 'মার্জিন/উদ্বৃত্ত:' : 'Net:'}</span>
              <strong style={{ color: timeframeAnalytics.today.margin >= 0 ? '#10b981' : '#ef4444', fontFamily: 'var(--font-mono)' }}>
                {timeframeAnalytics.today.margin >= 0 ? '+' : ''}৳{timeframeAnalytics.today.margin.toLocaleString('en-IN')}
              </strong>
            </div>
          </div>

          {/* Card B: Yesterday (গতকাল) */}
          <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#6366f1' }}>
                🕒 {lang === 'bn' ? 'গতকাল (Yesterday)' : 'Yesterday'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-muted)' }}>{lang === 'bn' ? 'বিক্রি:' : 'Sales:'}</span>
              <strong style={{ color: '#6366f1', fontFamily: 'var(--font-mono)' }}>৳{timeframeAnalytics.yesterday.sales.toLocaleString('en-IN')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>{lang === 'bn' ? 'খরচ:' : 'Expenses:'}</span>
              <strong style={{ color: '#ef4444', fontFamily: 'var(--font-mono)' }}>৳{timeframeAnalytics.yesterday.expenses.toLocaleString('en-IN')}</strong>
            </div>
            <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '5px', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{lang === 'bn' ? 'মার্জিন/উদ্বৃত্ত:' : 'Net:'}</span>
              <strong style={{ color: timeframeAnalytics.yesterday.margin >= 0 ? '#10b981' : '#ef4444', fontFamily: 'var(--font-mono)' }}>
                {timeframeAnalytics.yesterday.margin >= 0 ? '+' : ''}৳{timeframeAnalytics.yesterday.margin.toLocaleString('en-IN')}
              </strong>
            </div>
          </div>

          {/* Card C: Weekly Comparison (This Week vs Last Week vs 3rd Last Week) */}
          <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#0ea5e9', marginBottom: '6px' }}>
              📅 {lang === 'bn' ? 'সপ্তাহভিত্তিক তুলনা (Weekly)' : 'Weekly Performance'}
            </div>
            <div style={{ fontSize: '0.76rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>{lang === 'bn' ? 'চলতি সপ্তাহ:' : 'This Week:'}</span>
                <span>
                  <strong style={{ color: '#10b981' }}>৳{timeframeAnalytics.thisWeek.sales.toLocaleString('en-IN')}</strong>
                  <span style={{ color: '#ef4444', marginLeft: '4px', fontSize: '0.7rem' }}>(-৳{timeframeAnalytics.thisWeek.expenses.toLocaleString('en-IN')})</span>
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>{lang === 'bn' ? 'লাস্ট উইক (বিগত সপ্তাহ):' : 'Last Week:'}</span>
                <span>
                  <strong style={{ color: 'var(--text-main)' }}>৳{timeframeAnalytics.lastWeek.sales.toLocaleString('en-IN')}</strong>
                  <span style={{ color: '#ef4444', marginLeft: '4px', fontSize: '0.7rem' }}>(-৳{timeframeAnalytics.lastWeek.expenses.toLocaleString('en-IN')})</span>
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>{lang === 'bn' ? 'পূর্ববর্তী সপ্তাহ (৩য় লাস্ট উইক):' : '2 Wks Ago:'}</span>
                <span>
                  <strong style={{ color: 'var(--text-main)' }}>৳{timeframeAnalytics.thirdLastWeek.sales.toLocaleString('en-IN')}</strong>
                  <span style={{ color: '#ef4444', marginLeft: '4px', fontSize: '0.7rem' }}>(-৳{timeframeAnalytics.thirdLastWeek.expenses.toLocaleString('en-IN')})</span>
                </span>
              </div>
            </div>
          </div>

          {/* Card D: Month & Year Comparison */}
          <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#f59e0b', marginBottom: '6px' }}>
              📆 {lang === 'bn' ? 'মাস ও বাৎসরিক তুলনা' : 'Monthly & Yearly'}
            </div>
            <div style={{ fontSize: '0.76rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>{lang === 'bn' ? 'চলতি মাস:' : 'This Month:'}</span>
                <span>
                  <strong style={{ color: '#10b981' }}>৳{timeframeAnalytics.thisMonth.sales.toLocaleString('en-IN')}</strong>
                  <span style={{ color: '#ef4444', marginLeft: '4px', fontSize: '0.7rem' }}>(-৳{timeframeAnalytics.thisMonth.expenses.toLocaleString('en-IN')})</span>
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>{lang === 'bn' ? 'গত মাস (Last Month):' : 'Last Month:'}</span>
                <span>
                  <strong style={{ color: '#3b82f6' }}>৳{timeframeAnalytics.lastMonth.sales.toLocaleString('en-IN')}</strong>
                  <span style={{ color: '#ef4444', marginLeft: '4px', fontSize: '0.7rem' }}>(-৳{timeframeAnalytics.lastMonth.expenses.toLocaleString('en-IN')})</span>
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '3px', marginTop: '2px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{lang === 'bn' ? 'চলতি বছর vs গত বছর:' : 'Yearly:'}</span>
                <span>
                  <strong style={{ color: '#10b981' }}>৳{timeframeAnalytics.thisYear.sales.toLocaleString('en-IN')}</strong> / <span style={{ color: 'var(--text-muted)' }}>৳{timeframeAnalytics.lastYear.sales.toLocaleString('en-IN')}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Last 7 Days Day-by-Day Detailed Audit Table */}
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🗓️</span>
              <span>{lang === 'bn' ? 'বিগত ৭ দিনের দিনভিত্তিক বিস্তারিত বিক্রি, খরচ ও মার্জিন' : 'Day-by-Day 7 Days Performance Breakdown'}</span>
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {lang === 'bn' ? 'সর্বশেষ ৭ দিনের লাইভ রেকর্ড' : 'Last 7 Days'}
            </span>
          </div>

          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px 12px' }}>{lang === 'bn' ? 'তারিখ ও বার' : 'Date & Day'}</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>{lang === 'bn' ? 'মোট বিক্রি (৳)' : 'Sales (৳)'}</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>{lang === 'bn' ? 'মোট খরচ (৳)' : 'Expenses (৳)'}</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>{lang === 'bn' ? 'প্রাক্কলিত মার্জিন (৳)' : 'Net Margin (৳)'}</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>{lang === 'bn' ? 'মেমো সংখ্যা' : 'Invoices'}</th>
                </tr>
              </thead>
              <tbody>
                {timeframeAnalytics.past7Days.map((row, idx) => (
                  <tr
                    key={row.date}
                    style={{
                      borderBottom: idx < 6 ? '1px solid var(--border-color)' : 'none',
                      background: idx === 0 ? 'rgba(16, 185, 129, 0.04)' : (idx === 1 ? 'rgba(99, 102, 241, 0.04)' : 'transparent'),
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: idx < 2 ? '800' : '600', color: 'var(--text-main)' }}>
                        {row.dayLabel}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {row.date}
                      </div>
                    </td>

                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '800', fontFamily: 'var(--font-mono)', color: row.sales > 0 ? '#10b981' : 'var(--text-muted)' }}>
                      ৳{row.sales.toLocaleString('en-IN')}
                    </td>

                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '800', fontFamily: 'var(--font-mono)', color: row.expenses > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                      ৳{row.expenses.toLocaleString('en-IN')}
                    </td>

                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '900', fontFamily: 'var(--font-mono)', color: row.margin >= 0 ? '#10b981' : '#ef4444' }}>
                      {row.margin >= 0 ? '+' : ''}৳{row.margin.toLocaleString('en-IN')}
                    </td>

                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          background: row.txCount > 0 ? 'rgba(14, 165, 233, 0.12)' : 'rgba(255,255,255,0.05)',
                          color: row.txCount > 0 ? '#0ea5e9' : 'var(--text-dim)'
                        }}
                      >
                        {row.txCount} {lang === 'bn' ? 'টি' : ''}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
          marginBottom: '1.25rem'
        }}
      >
        <button
          type="button"
          onClick={() => { hapticFeedback.light(); setActiveTab('pos'); }}
          className="glass-card press-scale"
          style={{
            padding: '12px 10px',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          <span style={{ fontSize: '1.4rem' }}>🛒</span>
          <span style={{ fontSize: '0.84rem', fontWeight: '800', color: 'var(--text-main)' }}>
            {lang === 'bn' ? 'নতুন বিক্রি (POS)' : 'New Sale (POS)'}
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            {lang === 'bn' ? 'দ্রুত ক্যাশ মেমো' : 'Fast Billing'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { hapticFeedback.light(); setActiveTab('debts'); }}
          className="glass-card press-scale"
          style={{
            padding: '12px 10px',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          <span style={{ fontSize: '1.4rem' }}>📒</span>
          <span style={{ fontSize: '0.84rem', fontWeight: '800', color: 'var(--text-main)' }}>
            {lang === 'bn' ? 'বাকি খাতা' : 'Debt Khata'}
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            {lang === 'bn' ? 'তাগাদা ও আদায়' : 'Due Ledger'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { hapticFeedback.light(); setActiveTab('inventory'); }}
          className="glass-card press-scale"
          style={{
            padding: '12px 10px',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          <span style={{ fontSize: '1.4rem' }}>📦</span>
          <span style={{ fontSize: '0.84rem', fontWeight: '800', color: 'var(--text-main)' }}>
            {lang === 'bn' ? 'মজুদ ইনভেন্টরি' : 'Inventory'}
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            {lang === 'bn' ? 'স্টক ও অ্যালার্ট' : 'Stock & Alert'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { hapticFeedback.light(); setActiveTab('invoices'); }}
          className="glass-card press-scale"
          style={{
            padding: '12px 10px',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          <span style={{ fontSize: '1.4rem' }}>🧾</span>
          <span style={{ fontSize: '0.84rem', fontWeight: '800', color: 'var(--text-main)' }}>
            {lang === 'bn' ? 'চালান ও রসিদ' : 'Invoices'}
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            {lang === 'bn' ? 'বিক্রয় ইতিহাস' : 'Sales History'}
          </span>
        </button>
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

          {/* Controls: Branch & Cash Hub Button, Quick Add Shortcuts & Branch Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setActiveTab('branch_control')}
              style={{
                padding: '7px 16px',
                fontSize: '0.85rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                borderColor: '#10b981',
                boxShadow: '0 3px 12px rgba(16, 185, 129, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                cursor: 'pointer'
              }}
              title={lang === 'bn' ? 'ব্রাঞ্চ ও ক্যাশ কন্ট্রোল হাব খুলুন' : 'Open Branch & Cash Hub'}
            >
              <Building2 size={16} />
              <span>{lang === 'bn' ? '🏢 ব্রাঞ্চ ও ক্যাশ কন্ট্রোল (শাখা/কাউন্টার/স্টাফ)' : '🏢 Branch & Cash Hub'} →</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                {lang === 'bn' ? 'ফিল্টার:' : 'Filter:'}
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

            <button
              type="button"
              onClick={() => setIsBranchMonitorOpen(!isBranchMonitorOpen)}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              {isBranchMonitorOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              <span>{isBranchMonitorOpen ? (lang === 'bn' ? 'লুকান' : 'Collapse') : (lang === 'bn' ? 'মনিটর দেখুন' : 'Expand')}</span>
            </button>
          </div>
        </div>

        {!isBranchMonitorOpen ? (
          <div
            onClick={() => setIsBranchMonitorOpen(true)}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.06)',
              border: '1px dashed rgba(99, 102, 241, 0.3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              🏢 {branches.length}টি শাখা ও কাউন্টারের রিয়েল-টাইম ক্যাশ ও বিক্রয় মনিটর — দেখতে এখানে ক্লিক করুন
            </span>
            <span style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: '700' }}>
              শাখা ও কাউন্টার বিস্তারিত দেখুন ↓
            </span>
          </div>
        ) : (
          <>

        {/* Quick Management Short-Bar for Branches, Counters, Staff, HR & SR */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            padding: '10px 14px',
            marginBottom: '1rem',
            borderRadius: '10px',
            background: 'rgba(99, 102, 241, 0.06)',
            border: '1px dashed rgba(99, 102, 241, 0.25)'
          }}
        >
          <span style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            ⚡ {lang === 'bn' ? 'দ্রুত পরিচালনা:' : 'Quick Actions:'}
          </span>

          <button
            type="button"
            onClick={() => setActiveTab('branch_control')}
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <PlusCircle size={13} color="#10b981" />
            <span>{lang === 'bn' ? '+ নতুন ব্রাঞ্চ' : '+ New Branch'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('branch_control')}
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <PlusCircle size={13} color="#3b82f6" />
            <span>{lang === 'bn' ? '+ নতুন কাউন্টার' : '+ New Counter'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('branch_control')}
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <UserCheck size={13} color="#8b5cf6" />
            <span>{lang === 'bn' ? '+ নতুন স্টাফ আইডি' : '+ New Staff ID'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hr')}
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Users size={13} color="#ec4899" />
            <span>{lang === 'bn' ? '+ নতুন HR কর্মী' : '+ New HR Employee'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sr')}
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Store size={13} color="#f59e0b" />
            <span>{lang === 'bn' ? '+ নতুন SR ফিল্ড' : '+ New SR Agent'}</span>
          </button>
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
          </>
        )}
      </div>

      {/* Today's Real-time Profit & Top Sellers Banner */}
      <div
        className="glass-card"
        style={{
          padding: '1rem',
          marginBottom: '1.25rem',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(99, 102, 241, 0.08))',
          border: '1.5px solid rgba(16, 185, 129, 0.3)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          alignItems: 'center'
        }}
      >
        {/* Today's Profit Summary */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '1.1rem' }}>💰</span>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
              {lang === 'bn' ? 'আজকের বিক্রয় ও নিট লাভ' : "Today's Sales & Net Profit"}
            </h3>
            <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
              LIVE
            </span>
          </div>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'baseline', marginTop: '4px' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                {lang === 'bn' ? 'আজকের বিক্রি' : 'Sales'}:
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#6366f1', fontFamily: 'monospace' }}>
                ৳{todaySalesTotal.toLocaleString()}
              </span>
            </div>
            {canViewNetProfit && (
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                  {lang === 'bn' ? 'আজকের নিট লাভ' : 'Net Profit'}:
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: '800', color: todayNetProfit >= 0 ? '#10b981' : '#ef4444', fontFamily: 'monospace' }}>
                  ৳{todayNetProfit.toLocaleString()}
                </span>
              </div>
            )}
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                {lang === 'bn' ? 'আজকের খরচ' : 'Expense'}:
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ef4444', fontFamily: 'monospace' }}>
                -৳{todayExpensesTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Today's Top 5 Selling Items */}
        <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            🔥 {lang === 'bn' ? 'আজকের শীর্ষ বিক্রীত পণ্য:' : "Today's Top Sellers:"}
          </span>
          {todayTopProducts.length === 0 ? (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              {lang === 'bn' ? 'আজ এখনও কোনো পণ্য বিক্রি হয়নি' : 'No sales today yet'}
            </span>
          ) : (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {todayTopProducts.map((item, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.74rem',
                    fontWeight: '700',
                    color: 'var(--text-main)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span style={{ color: '#10b981' }}>#{idx + 1}</span> {item.name} ({item.qty}টি)
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        {/* Total Sales (Dynamic with Time Horizon) */}
        <div className="glass-card stat-card glow-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <h3 style={{ margin: 0 }}>
                {timeHorizon === 'today'
                  ? (lang === 'bn' ? 'আজকের বিক্রয়' : "Today's Sales")
                  : timeHorizon === 'yesterday'
                  ? (lang === 'bn' ? 'গতকালের বিক্রয়' : "Yesterday's Sales")
                  : timeHorizon === 'week'
                  ? (lang === 'bn' ? 'বিগত ৭ দিনের বিক্রয়' : '7 Days Sales')
                  : timeHorizon === 'month'
                  ? (lang === 'bn' ? 'চলতি মাসের বিক্রয়' : '30 Days Sales')
                  : (lang === 'bn' ? 'সর্বমোট বিক্রয়' : 'All-Time Sales')}
              </h3>
              <span className="badge" style={{ fontSize: '0.62rem', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                {timeHorizon.toUpperCase()}
              </span>
            </div>
            <div className="stat-value">
              ৳{(timeHorizon === 'all' ? totalSales : periodSalesTotal).toLocaleString()}
            </div>
            <div className="stat-trend" style={{ color: '#10b981' }}>
              {(timeHorizon === 'all' ? filteredSales : periodSalesList).length} {lang === 'bn' ? 'টি মেমো/অর্ডার' : 'Orders'}
            </div>
          </div>
        </div>

        {/* Net Profit (Dynamic with Time Horizon - Owner only) */}
        {canViewNetProfit ? (
          <div className="glass-card stat-card glow-card">
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <DollarSign size={24} />
            </div>
            <div className="stat-info">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <h3 style={{ margin: 0 }}>
                  {timeHorizon === 'today'
                    ? (lang === 'bn' ? 'আজকের নিট লাভ' : "Today's Net Profit")
                    : timeHorizon === 'yesterday'
                    ? (lang === 'bn' ? 'গতকালের নিট লাভ' : "Yesterday's Profit")
                    : timeHorizon === 'week'
                    ? (lang === 'bn' ? '৭ দিনের নিট লাভ' : '7 Days Profit')
                    : timeHorizon === 'month'
                    ? (lang === 'bn' ? 'চলতি মাসের নিট লাভ' : '30 Days Profit')
                    : (lang === 'bn' ? 'সর্বমোট নিট লাভ' : 'All-Time Profit')}
                </h3>
                <span className="badge" style={{ fontSize: '0.62rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                  {timeHorizon.toUpperCase()}
                </span>
              </div>
              <div
                className="stat-value"
                style={{
                  color: (timeHorizon === 'all' ? netProfit : periodNetProfit) >= 0 ? '#10b981' : '#ef4444'
                }}
              >
                ৳{(timeHorizon === 'all' ? netProfit : periodNetProfit).toLocaleString()}
              </div>
              <div
                className="stat-trend"
                style={{
                  color: (timeHorizon === 'all' ? netProfit : periodNetProfit) >= 0 ? '#10b981' : '#ef4444'
                }}
              >
                {(timeHorizon === 'all' ? netProfit : periodNetProfit) >= 0
                  ? (lang === 'bn' ? 'লাভজনক মার্জিন' : 'Profitable')
                  : (lang === 'bn' ? 'ক্ষতিগ্রস্ত' : 'Negative Loss')}
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

          <button
            type="button"
            onClick={() => setIsAiInsightsOpen(!isAiInsightsOpen)}
            className="btn btn-secondary"
            style={{ padding: '5px 12px', fontSize: '0.78rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            {isAiInsightsOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            <span>{isAiInsightsOpen ? (lang === 'bn' ? 'লুকান' : 'Collapse') : (lang === 'bn' ? 'ইনসাইট দেখুন' : 'Expand')}</span>
          </button>
        </div>

        {!isAiInsightsOpen ? (
          <div
            onClick={() => setIsAiInsightsOpen(true)}
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'rgba(139, 92, 246, 0.08)',
              border: '1px dashed rgba(139, 92, 246, 0.3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              🧠 মার্জিন বিজয়ী পণ্য, অলস পুঁজি ও বিক্রয় পূর্বাভাসের ৪টি স্মার্ট অ্যানালিটিক্স সংরক্ষিত
            </span>
            <span style={{ fontSize: '0.8rem', color: '#8b5cf6', fontWeight: '700' }}>
              ইনসাইট কার্ডগুলো দেখুন ↓
            </span>
          </div>
        ) : (
          /* 4 Cards Grid */
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
        )}
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

      {/* 3. DAY-END Z-REPORT MODAL */}
      {showZReportModal && (
        <div className="modal-backdrop" style={{ zIndex: 1200 }}>
          <div
            className="modal-content animate-scale-up"
            style={{
              maxWidth: '460px',
              width: '95%',
              background: 'var(--bg-card)',
              borderRadius: '20px',
              border: '1.5px solid rgba(245, 158, 11, 0.5)',
              boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
              padding: '1.5rem',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.5rem' }}>🌙</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'দৈনিক ক্লোজিং Z-রিপোর্ট' : 'Daily Closing Z-Report'}
                  </h3>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {new Date().toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowZReportModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ background: 'var(--bg-main)', borderRadius: '14px', padding: '1rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>মোট বিক্রয় ({todaySalesList.length} মেমো):</span>
                <span style={{ fontWeight: '800', fontFamily: 'var(--font-mono)' }}>৳{todaySalesTotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>💵 ক্যাশ আদায়:</span>
                <span style={{ fontWeight: '800', color: '#10b981', fontFamily: 'var(--font-mono)' }}>৳{todayCashSales.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>📱 ডিজিটাল/মোবাইল পেমেন্ট:</span>
                <span style={{ fontWeight: '800', color: '#6366f1', fontFamily: 'var(--font-mono)' }}>৳{todayDigitalSales.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>📒 বকেয়া/বাকি দেওয়া:</span>
                <span style={{ fontWeight: '800', color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>৳{todayDueSales.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>💸 আজকের মোট খরচ:</span>
                <span style={{ fontWeight: '800', color: '#ef4444', fontFamily: 'var(--font-mono)' }}>-৳{todayExpensesTotal.toLocaleString()}</span>
              </div>
              <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: '800' }}>
                <span>💰 নিট ক্যাশ ড্রয়ার স্থিতি:</span>
                <span style={{ color: '#10b981', fontFamily: 'var(--font-mono)' }}>৳{Math.max(0, todayCashSales - todayExpensesTotal).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', fontWeight: '800' }}>
                <span>📈 আজকের প্রাক্কলিত লাভ:</span>
                <span style={{ color: todayNetProfit >= 0 ? '#10b981' : '#ef4444', fontFamily: 'var(--font-mono)' }}>৳{todayNetProfit.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={handleShareZReportWhatsApp}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#25D366',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <MessageCircle size={16} />
                <span>{lang === 'bn' ? 'হোয়াটসঅ্যাপ' : 'WhatsApp'}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-main)',
                  fontWeight: '800',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Printer size={16} />
                <span>{lang === 'bn' ? 'প্রিন্ট রসিদ' : 'Print'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI NATURAL LANGUAGE REPORT SEARCH MODAL (ITEM 82) */}
      <NLReportSearchModal
        isOpen={showNLSearchModal}
        onClose={() => setShowNLSearchModal(false)}
      />

      {/* END-OF-DAY EOD AUTO SUMMARY MODAL (ITEM 84) */}
      <EODSummaryModal
        isOpen={showEODModal}
        onClose={() => setShowEODModal(false)}
      />

      {/* BUSINESS HEALTH SCORE AUDIT MODAL (ITEM 90) */}
      <BusinessHealthScoreModal
        isOpen={showHealthScoreModal}
        onClose={() => setShowHealthScoreModal(false)}
      />

      {/* RECEIPT OCR SCANNER MODAL (ITEM 81) */}
      <ReceiptOCRScannerModal
        isOpen={showOCRModal}
        onClose={() => setShowOCRModal(false)}
      />
    </div>
  );
};
