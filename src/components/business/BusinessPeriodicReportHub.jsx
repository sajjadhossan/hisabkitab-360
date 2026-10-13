import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Truck,
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  AlertTriangle,
  Printer,
  Download,
  Share2,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  BarChart3,
  PieChart,
  UserCheck,
  Building,
  Phone,
  HelpCircle,
  Tag,
  Boxes,
  Percent,
  X,
  CreditCard,
  MessageCircle,
  AlertCircle
} from 'lucide-react';
import { printHtmlContent } from '../../services/printService';

export const BusinessPeriodicReportHub = () => {
  const {
    salesHistory = [],
    products = [],
    suppliers = [],
    customers = [],
    businessExpenses = [],
    damagedGoods = [],
    businessDebts = [],
    invoices = [],
    purchaseOrders = [],
    addPurchaseOrder,
    recordDamagedGoods,
    businessSettings = {},
    showToast,
    lang = 'bn',
    t = {}
  } = useApp();

  // Active Time Horizon: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
  const [horizon, setHorizon] = useState('daily');

  // Selected Anchors
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [customRange, setCustomRange] = useState({
    startDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Active Tab inside report:
  // 'overview' | 'sales_items' | 'purchases' | 'daily_trend' | 'invoices' | 'ledger' | 'pnl' | 'damage'
  const [activeReportTab, setActiveReportTab] = useState('overview');

  // Search & Filter state for items
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('highest_sales'); // 'highest_sales' | 'highest_profit' | 'highest_qty'

  // Modals for Quick Add within Report
  const [showAddPurchaseModal, setShowAddPurchaseModal] = useState(false);
  const [showAddDamageModal, setShowAddDamageModal] = useState(false);

  // New Purchase Form state
  const [newPurchase, setNewPurchase] = useState({
    supplierId: suppliers[0]?.id || '',
    supplierName: suppliers[0]?.name || '',
    productId: products[0]?.id || '',
    productName: products[0]?.name || '',
    quantity: 1,
    unitCost: products[0]?.costPrice || 0,
    paidAmount: 0,
    note: ''
  });

  // New Damage Form state
  const [newDamage, setNewDamage] = useState({
    productId: products[0]?.id || '',
    quantity: 1,
    reason: 'প্যাকেজিং নষ্ট / আর্দ্রতা',
    note: ''
  });

  // -------------------------------------------------------------------------
  // Date Range Computation
  // -------------------------------------------------------------------------
  const dateInterval = useMemo(() => {
    const base = new Date(selectedDate);
    if (isNaN(base.getTime())) {
      const today = new Date().toISOString().split('T')[0];
      return { start: today, end: today, label: today };
    }

    if (horizon === 'daily') {
      return {
        start: selectedDate,
        end: selectedDate,
        label: selectedDate
      };
    } else if (horizon === 'weekly') {
      // 7-day window ending at selectedDate
      const start = new Date(base);
      start.setDate(base.getDate() - 6);
      const startStr = start.toISOString().split('T')[0];
      return {
        start: startStr,
        end: selectedDate,
        label: `${startStr} থেকে ${selectedDate}`
      };
    } else if (horizon === 'monthly') {
      const year = base.getFullYear();
      const month = base.getMonth();
      const start = new Date(year, month, 1).toISOString().split('T')[0];
      const end = new Date(year, month + 1, 0).toISOString().split('T')[0];
      const monthNamesBn = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
      return {
        start,
        end,
        label: lang === 'bn' ? `${monthNamesBn[month]} ${year}` : `${base.toLocaleString('en', { month: 'long' })} ${year}`
      };
    } else if (horizon === 'yearly') {
      const year = base.getFullYear();
      const start = `${year}-01-01`;
      const end = `${year}-12-31`;
      return {
        start,
        end,
        label: lang === 'bn' ? `${year} সাল (বাৎসরিক)` : `Year ${year}`
      };
    } else {
      // Custom range
      return {
        start: customRange.startDate,
        end: customRange.endDate,
        label: `${customRange.startDate} থেকে ${customRange.endDate}`
      };
    }
  }, [horizon, selectedDate, customRange, lang]);

  // Navigate Previous / Next Date Interval
  const handleStepDate = (direction) => {
    const base = new Date(selectedDate);
    if (horizon === 'daily') {
      base.setDate(base.getDate() + (direction * 1));
    } else if (horizon === 'weekly') {
      base.setDate(base.getDate() + (direction * 7));
    } else if (horizon === 'monthly') {
      base.setMonth(base.getMonth() + (direction * 1));
    } else if (horizon === 'yearly') {
      base.setFullYear(base.getFullYear() + (direction * 1));
    }
    setSelectedDate(base.toISOString().split('T')[0]);
  };

  const isDateBetween = (dateStr, start, end) => {
    if (!dateStr) return false;
    const d = dateStr.slice(0, 10);
    return d >= start && d <= end;
  };

  // -------------------------------------------------------------------------
  // Filtered Core Business Data
  // -------------------------------------------------------------------------
  const filteredSales = useMemo(() => {
    return salesHistory.filter(s => isDateBetween(s.date, dateInterval.start, dateInterval.end));
  }, [salesHistory, dateInterval]);

  const filteredExpenses = useMemo(() => {
    return businessExpenses.filter(e => isDateBetween(e.date, dateInterval.start, dateInterval.end));
  }, [businessExpenses, dateInterval]);

  const filteredDamages = useMemo(() => {
    return damagedGoods.filter(d => isDateBetween(d.date, dateInterval.start, dateInterval.end));
  }, [damagedGoods, dateInterval]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => isDateBetween(inv.date, dateInterval.start, dateInterval.end));
  }, [invoices, dateInterval]);

  // Purchases from Purchase Orders + Expense purchases
  const filteredPurchases = useMemo(() => {
    const fromPOs = (purchaseOrders || []).filter(po => isDateBetween(po.date, dateInterval.start, dateInterval.end));
    
    // Also include expense category 'ক্রয়', 'পণ্য ক্রয়', 'মালামাল'
    const purchaseExpenses = filteredExpenses.filter(e => {
      const cat = (e.category || '').toLowerCase();
      return cat.includes('ক্রয়') || cat.includes('পণ্য') || cat.includes('মাল') || cat.includes('purchase');
    }).map(e => ({
      id: `exp-${e.id}`,
      supplierName: e.note || (lang === 'bn' ? 'সরাসরি নগদ ক্রয়' : 'Direct Cash Purchase'),
      date: e.date,
      totalAmount: Number(e.amount) || 0,
      paidAmount: Number(e.amount) || 0,
      dueAmount: 0,
      items: [{ name: e.title || 'পণ্য ক্রয়', quantity: 1, unitCost: Number(e.amount) || 0, total: Number(e.amount) || 0 }],
      isFromExpense: true
    }));

    return [...fromPOs, ...purchaseExpenses];
  }, [purchaseOrders, filteredExpenses, dateInterval, lang]);

  // -------------------------------------------------------------------------
  // Financial KPI Metrics
  // -------------------------------------------------------------------------
  const salesMetrics = useMemo(() => {
    let totalSales = 0;
    let cashSales = 0;
    let dueSales = 0;
    let totalDiscount = 0;
    let totalVat = 0;
    let cogsTotal = 0;

    filteredSales.forEach(sale => {
      const gTotal = Number(sale.grandTotal) || 0;
      totalSales += gTotal;
      totalDiscount += Number(sale.discount) || 0;
      totalVat += Number(sale.vat) || 0;

      if (sale.status === 'due' || sale.paymentMethod === 'due') {
        dueSales += gTotal;
      } else if (sale.status === 'partial') {
        const paid = Number(sale.paidAmount) || 0;
        cashSales += paid;
        dueSales += Math.max(0, gTotal - paid);
      } else {
        cashSales += gTotal;
      }

      // Cost of goods sold
      (sale.items || []).forEach(item => {
        const qty = Number(item.qty || item.quantity) || 1;
        const cost = Number(item.costPrice) || 0;
        cogsTotal += cost * qty;
      });
    });

    const grossProfit = totalSales - cogsTotal;

    return {
      totalSales,
      cashSales,
      dueSales,
      totalDiscount,
      totalVat,
      cogsTotal,
      grossProfit,
      invoiceCount: filteredSales.length
    };
  }, [filteredSales]);

  // Purchases Metrics (কয় টাকার মাল কিনলাম, কয় টাকা পেমেন্ট করলাম, কয় টাকা বাকি)
  const purchaseMetrics = useMemo(() => {
    let totalPurchased = 0;
    let paidOut = 0;
    let dueRemaining = 0;
    let itemsCount = 0;

    filteredPurchases.forEach(p => {
      const tot = Number(p.totalAmount) || 0;
      const pd = Number(p.paidAmount) || 0;
      totalPurchased += tot;
      paidOut += pd;
      dueRemaining += Math.max(0, tot - pd);
      (p.items || []).forEach(i => {
        itemsCount += (Number(i.quantity) || 1);
      });
    });

    return {
      totalPurchased,
      paidOut,
      dueRemaining,
      itemsCount,
      orderCount: filteredPurchases.length
    };
  }, [filteredPurchases]);

  // Expenses & Operating Costs
  const expenseMetrics = useMemo(() => {
    let totalExpenses = 0;
    const categoryMap = {};

    filteredExpenses.forEach(e => {
      const amt = Number(e.amount) || 0;
      totalExpenses += amt;
      const cat = e.category || (lang === 'bn' ? 'অন্যান্য খরচ' : 'General');
      categoryMap[cat] = (categoryMap[cat] || 0) + amt;
    });

    return {
      totalExpenses,
      categoryMap
    };
  }, [filteredExpenses, lang]);

  // Damaged Goods Loss
  const damageMetrics = useMemo(() => {
    let totalLoss = 0;
    let totalQty = 0;

    filteredDamages.forEach(d => {
      totalLoss += Number(d.totalLoss) || 0;
      totalQty += Number(d.quantity) || 0;
    });

    return {
      totalLoss,
      totalQty,
      count: filteredDamages.length
    };
  }, [filteredDamages]);

  // Net Profit: Gross Profit - Total Expenses (excluding inventory purchase expenses already counted) - Damage Loss
  const nonPurchaseExpenses = useMemo(() => {
    return filteredExpenses
      .filter(e => {
        const cat = (e.category || '').toLowerCase();
        return !cat.includes('ক্রয়') && !cat.includes('পণ্য') && !cat.includes('মাল') && !cat.includes('purchase');
      })
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  const netProfit = useMemo(() => {
    return salesMetrics.grossProfit - nonPurchaseExpenses - damageMetrics.totalLoss;
  }, [salesMetrics.grossProfit, nonPurchaseExpenses, damageMetrics.totalLoss]);

  const netProfitMargin = useMemo(() => {
    if (salesMetrics.totalSales <= 0) return 0;
    return ((netProfit / salesMetrics.totalSales) * 100).toFixed(1);
  }, [netProfit, salesMetrics.totalSales]);

  // Total Receivables & Payables (আমি কার কাছে পাই, কে আমার কাছে পায়)
  const ledgerMetrics = useMemo(() => {
    // Customers Due (আমি পাই)
    const customerReceivables = customers
      .filter(c => (Number(c.outstandingDue) || 0) > 0)
      .map(c => ({
        id: c.id,
        name: c.name,
        companyName: c.companyName,
        phone: c.phone,
        dueAmount: Number(c.outstandingDue) || 0,
        type: 'customer'
      }));

    // Invoices Due (from filtered or active invoices)
    const invoiceDues = invoices
      .filter(inv => (Number(inv.dueAmount) || 0) > 0)
      .map(inv => ({
        id: inv.id,
        name: inv.customerName,
        phone: inv.customerPhone,
        dueAmount: Number(inv.dueAmount) || 0,
        date: inv.date,
        type: 'invoice'
      }));

    // Business Debts: lend (আমি দিয়েছি = আমি পাই)
    const debtLends = businessDebts.map(person => {
      const txs = person.transactions || [];
      let lent = 0, repaid = 0;
      txs.forEach(t => {
        if (t.type === 'lend') lent += Number(t.amount) || 0;
        if (t.type === 'repay_lend') repaid += Number(t.amount) || 0;
      });
      const net = lent - repaid;
      return {
        id: person.id,
        name: person.name,
        phone: person.phone,
        relation: person.relation || 'ব্যবসায়ী পার্টনার',
        dueAmount: net,
        type: 'debt_khata'
      };
    }).filter(d => d.dueAmount > 0);

    const totalReceivable = customerReceivables.reduce((s, c) => s + c.dueAmount, 0) +
      debtLends.reduce((s, d) => s + d.dueAmount, 0);

    // Supplier Payables (কে আমার কাছে পায়)
    const supplierPayables = suppliers
      .filter(s => (Number(s.payableBalance) || 0) > 0)
      .map(s => ({
        id: s.id,
        name: s.name,
        contact: s.contact,
        items: s.items,
        payableAmount: Number(s.payableBalance) || 0,
        type: 'supplier'
      }));

    // Business Debts: borrow (আমি নিয়েছি = আমি দেনাদার / সে পায়)
    const debtBorrows = businessDebts.map(person => {
      const txs = person.transactions || [];
      let borrowed = 0, repaid = 0;
      txs.forEach(t => {
        if (t.type === 'borrow') borrowed += Number(t.amount) || 0;
        if (t.type === 'repay_borrow') repaid += Number(t.amount) || 0;
      });
      const net = borrowed - repaid;
      return {
        id: person.id,
        name: person.name,
        phone: person.phone,
        relation: person.relation || 'মহাজন',
        payableAmount: net,
        type: 'debt_borrow'
      };
    }).filter(d => d.payableAmount > 0);

    const totalPayable = supplierPayables.reduce((s, sup) => s + sup.payableAmount, 0) +
      debtBorrows.reduce((s, d) => s + d.payableAmount, 0);

    return {
      customerReceivables,
      debtLends,
      totalReceivable,
      supplierPayables,
      debtBorrows,
      totalPayable
    };
  }, [customers, invoices, businessDebts, suppliers]);

  // Invoice Breakdown (সম্পূর্ণ পে, আংশিক পে, সম্পূর্ণ বাকি)
  const invoiceBreakdown = useMemo(() => {
    let fullyPaidCount = 0;
    let fullyPaidAmount = 0;

    let partialPaidCount = 0;
    let partialPaidCash = 0;
    let partialRemainingDue = 0;

    let unpaidCount = 0;
    let unpaidAmount = 0;

    filteredInvoices.forEach(inv => {
      const grand = Number(inv.grandTotal) || 0;
      const paid = Number(inv.paidAmount) || 0;
      const due = Number(inv.dueAmount) || 0;

      if (inv.status === 'paid' || (due <= 0 && paid >= grand)) {
        fullyPaidCount++;
        fullyPaidAmount += grand;
      } else if (inv.status === 'partial' || (paid > 0 && due > 0)) {
        partialPaidCount++;
        partialPaidCash += paid;
        partialRemainingDue += due;
      } else {
        unpaidCount++;
        unpaidAmount += grand;
      }
    });

    const totalCollected = fullyPaidAmount + partialPaidCash;

    return {
      fullyPaidCount,
      fullyPaidAmount,
      partialPaidCount,
      partialPaidCash,
      partialRemainingDue,
      unpaidCount,
      unpaidAmount,
      totalCollected,
      totalInvoices: filteredInvoices.length
    };
  }, [filteredInvoices]);

  // Products Sold Breakdown (কী কী বিক্রি করলাম)
  const productsSoldBreakdown = useMemo(() => {
    const map = {};

    filteredSales.forEach(sale => {
      (sale.items || []).forEach(item => {
        const key = item.productId || item.name;
        const qty = Number(item.qty || item.quantity) || 1;
        const price = Number(item.price) || 0;
        const cost = Number(item.costPrice) || 0;
        const subtotal = Number(item.subtotal) || (qty * price);

        if (!map[key]) {
          map[key] = {
            id: key,
            name: item.name || 'পণ্য',
            sku: item.sku || '-',
            unit: item.unit || 'পিস',
            totalQty: 0,
            totalRevenue: 0,
            costPrice: cost,
            totalCost: 0,
            profit: 0
          };
        }

        map[key].totalQty += qty;
        map[key].totalRevenue += subtotal;
        map[key].totalCost += (cost * qty);
        map[key].profit = map[key].totalRevenue - map[key].totalCost;
      });
    });

    let list = Object.values(map);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(i => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));
    }

    if (sortOrder === 'highest_sales') {
      list.sort((a, b) => b.totalRevenue - a.totalRevenue);
    } else if (sortOrder === 'highest_profit') {
      list.sort((a, b) => b.profit - a.profit);
    } else if (sortOrder === 'highest_qty') {
      list.sort((a, b) => b.totalQty - a.totalQty);
    }

    return list;
  }, [filteredSales, searchQuery, sortOrder]);

  // Day-by-Day Sales Breakdown (প্রতিদিনের সেল গ্রাফ ও লিস্ট)
  const dayByDayTrend = useMemo(() => {
    const daysMap = {};

    // Populate all days in interval if weekly or daily
    const start = new Date(dateInterval.start);
    const end = new Date(dateInterval.end);
    const cur = new Date(start);

    // Limit maximum points to 31 to prevent UI choke
    let diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays > 31) diffDays = 31;

    for (let i = 0; i < diffDays; i++) {
      const dStr = cur.toISOString().split('T')[0];
      const dayNamesBn = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
      const dayName = dayNamesBn[cur.getDay()];
      daysMap[dStr] = {
        date: dStr,
        dayName,
        totalSales: 0,
        cashSales: 0,
        dueSales: 0,
        invoiceCount: 0,
        grossProfit: 0
      };
      cur.setDate(cur.getDate() + 1);
    }

    filteredSales.forEach(sale => {
      const dStr = (sale.date || '').slice(0, 10);
      if (daysMap[dStr]) {
        const grand = Number(sale.grandTotal) || 0;
        daysMap[dStr].totalSales += grand;
        daysMap[dStr].invoiceCount += 1;

        if (sale.status === 'due' || sale.paymentMethod === 'due') {
          daysMap[dStr].dueSales += grand;
        } else {
          daysMap[dStr].cashSales += grand;
        }

        let cogs = 0;
        (sale.items || []).forEach(it => {
          cogs += (Number(it.costPrice) || 0) * (Number(it.qty) || 1);
        });
        daysMap[dStr].grossProfit += (grand - cogs);
      }
    });

    return Object.values(daysMap);
  }, [filteredSales, dateInterval]);

  const maxDaySales = useMemo(() => {
    return Math.max(...dayByDayTrend.map(d => d.totalSales), 1000);
  }, [dayByDayTrend]);

  // -------------------------------------------------------------------------
  // Handlers for Adding Purchases & Damages within Report
  // -------------------------------------------------------------------------
  const handleSavePurchase = (e) => {
    e.preventDefault();
    if (!newPurchase.productName || !newPurchase.quantity || !newPurchase.unitCost) {
      showToast(lang === 'bn' ? 'সঠিক পণ্যের তথ্য দিন' : 'Please provide product details', 'danger');
      return;
    }

    const qty = Number(newPurchase.quantity) || 1;
    const cost = Number(newPurchase.unitCost) || 0;
    const total = qty * cost;
    const paid = Number(newPurchase.paidAmount) || 0;
    const due = Math.max(0, total - paid);

    addPurchaseOrder({
      supplierId: newPurchase.supplierId,
      supplierName: newPurchase.supplierName || 'সরাসরি সরবরাহকারী',
      date: new Date().toISOString().split('T')[0],
      totalAmount: total,
      paidAmount: paid,
      dueAmount: due,
      status: due > 0 ? 'ordered' : 'received',
      note: newPurchase.note || 'রিপোর্ট হাব থেকে যুক্ত',
      items: [
        {
          productId: newPurchase.productId,
          name: newPurchase.productName,
          quantity: qty,
          unitCost: cost,
          total
        }
      ]
    });

    setShowAddPurchaseModal(false);
    setNewPurchase({
      supplierId: suppliers[0]?.id || '',
      supplierName: suppliers[0]?.name || '',
      productId: products[0]?.id || '',
      productName: products[0]?.name || '',
      quantity: 1,
      unitCost: products[0]?.costPrice || 0,
      paidAmount: 0,
      note: ''
    });
  };

  const handleSaveDamage = (e) => {
    e.preventDefault();
    const prod = products.find(p => p.id === newDamage.productId) || products[0];
    if (!prod) return;

    const qty = Number(newDamage.quantity) || 1;
    recordDamagedGoods({
      productId: prod.id,
      quantity: qty,
      reason: newDamage.reason,
      unitCost: prod.costPrice || 0,
      date: new Date().toISOString().split('T')[0],
      note: newDamage.note
    });

    setShowAddDamageModal(false);
    setNewDamage({
      productId: products[0]?.id || '',
      quantity: 1,
      reason: 'প্যাকেজিং নষ্ট / আর্দ্রতা',
      note: ''
    });
  };

  // -------------------------------------------------------------------------
  // Print & WhatsApp Export Handlers
  // -------------------------------------------------------------------------
  const handlePrintReport = () => {
    const horizonLabels = {
      daily: 'দৈনিক রিপোর্ট',
      weekly: 'সাপ্তাহিক রিপোর্ট',
      monthly: 'মাসিক রিপোর্ট',
      yearly: 'বাৎসরিক রিপোর্ট',
      custom: 'কাস্টম সময়কালের রিপোর্ট'
    };

    const printableHtml = `
      <div style="font-family: 'Hind Siliguri', sans-serif; padding: 24px; color: #1e293b; max-width: 800px; margin: 0 auto;">
        <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px;">
          <h1 style="margin: 0 0 4px; font-size: 24px; color: #0f172a;">${businessSettings.companyName || 'ব্যবসা প্রতিষ্ঠান'}</h1>
          <p style="margin: 0 0 4px; font-size: 13px; color: #64748b;">${businessSettings.address || 'বাংলাদেশ'}</p>
          <p style="margin: 0; font-size: 13px; color: #64748b;">মোবাইল: ${businessSettings.phone || ''}</p>
          <div style="margin-top: 12px; display: inline-block; padding: 4px 16px; background: #f1f5f9; border-radius: 20px; font-weight: bold; font-size: 14px;">
            📊 ${horizonLabels[horizon]} (${dateInterval.label})
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px;">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px;">
            <div style="font-size: 12px; color: #64748b;">মোট বিক্রয় (Revenue)</div>
            <div style="font-size: 20px; font-weight: bold; color: #0284c7;">৳${salesMetrics.totalSales.toLocaleString('en-IN')}</div>
            <div style="font-size: 11px; color: #64748b;">নগদ: ৳${salesMetrics.cashSales.toLocaleString('en-IN')} | বাকি: ৳${salesMetrics.dueSales.toLocaleString('en-IN')}</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px;">
            <div style="font-size: 12px; color: #64748b;">মাল কেনা (Purchases)</div>
            <div style="font-size: 20px; font-weight: bold; color: #d97706;">৳${purchaseMetrics.totalPurchased.toLocaleString('en-IN')}</div>
            <div style="font-size: 11px; color: #64748b;">পরিশোধ: ৳${purchaseMetrics.paidOut.toLocaleString('en-IN')} | বাকি: ৳${purchaseMetrics.dueRemaining.toLocaleString('en-IN')}</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px;">
            <div style="font-size: 12px; color: #64748b;">নিট লাভ (Net Profit)</div>
            <div style="font-size: 20px; font-weight: bold; color: #16a34a;">৳${netProfit.toLocaleString('en-IN')}</div>
            <div style="font-size: 11px; color: #64748b;">প্রফিট মার্জিন: ${netProfitMargin}%</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px;">
            <div style="font-size: 12px; color: #64748b;">দেনা ও পাওনা বকেয়া</div>
            <div style="font-size: 14px; font-weight: bold; color: #0f172a;">আমি পাই: ৳${ledgerMetrics.totalReceivable.toLocaleString('en-IN')}</div>
            <div style="font-size: 14px; font-weight: bold; color: #ef4444;">কে পায়: ৳${ledgerMetrics.totalPayable.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <h3 style="font-size: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin: 20px 0 10px;">🛒 কী কী বিক্রি হলো (টপ আইটেম)</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left;">
              <th style="padding: 6px 8px; border: 1px solid #e2e8f0;">পণ্যের নাম</th>
              <th style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center;">পরিমাণ</th>
              <th style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: right;">মোট বিক্রয়</th>
              <th style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: right;">মুনাফা</th>
            </tr>
          </thead>
          <tbody>
            ${productsSoldBreakdown.slice(0, 15).map(item => `
              <tr>
                <td style="padding: 6px 8px; border: 1px solid #e2e8f0;">${item.name}</td>
                <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center;">${item.totalQty} ${item.unit}</td>
                <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: right;">৳${item.totalRevenue.toLocaleString('en-IN')}</td>
                <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: right; color: #16a34a;">৳${item.profit.toLocaleString('en-IN')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px dashed #94a3b8; display: flex; justify-content: space-between; font-size: 12px; color: #64748b;">
          <div>প্রিন্ট তারিখ: ${new Date().toLocaleString('bn-BD')}</div>
          <div>হিসাবকিতাব ৩৬০ স্মার্ট ইআরপি</div>
        </div>
      </div>
    `;

    printHtmlContent(printableHtml, {
      title: `${businessSettings.companyName || 'দোকান'} - ${horizonLabels[horizon]}`,
      paperType: 'a4'
    });
  };

  const handleShareWhatsApp = () => {
    const text = `📊 *${businessSettings.companyName || 'ব্যবসা প্রতিষ্ঠান'} - রিপোর্ট সামারি*
📅 সময়কাল: ${dateInterval.label}
----------------------------------
💰 মোট বিক্রয়: ৳${salesMetrics.totalSales.toLocaleString('en-IN')}
💵 নগদ আদায়: ৳${salesMetrics.cashSales.toLocaleString('en-IN')}
📦 মাল কেনা: ৳${purchaseMetrics.totalPurchased.toLocaleString('en-IN')}
💸 কেনায় পরিশোধ: ৳${purchaseMetrics.paidOut.toLocaleString('en-IN')}
⚠️ কেনায় বাকি: ৳${purchaseMetrics.dueRemaining.toLocaleString('en-IN')}
📈 নিট লাভ: ৳${netProfit.toLocaleString('en-IN')} (${netProfitMargin}%)
----------------------------------
📥 আমি পাই (বাজারে বাকি): ৳${ledgerMetrics.totalReceivable.toLocaleString('en-IN')}
📤 কে পায় (মহাজন দেনা): ৳${ledgerMetrics.totalPayable.toLocaleString('en-IN')}
----------------------------------
_হিসাবকিতাব ৩৬০ থেকে সংগৃহীত_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleExportCSV = () => {
    const headers = ['পণ্যের নাম', 'SKU', 'বিক্রয় পরিমাণ', 'মোট বিক্রয় (৳)', 'ক্রয়মূল্য (৳)', 'লাভ (৳)'];
    const rows = productsSoldBreakdown.map(i => [
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.sku}"`,
      i.totalQty,
      i.totalRevenue,
      i.totalCost,
      i.profit
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Report_${horizon}_${dateInterval.start}_to_${dateInterval.end}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0.5rem 0 3rem 0', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* =====================================================================
          TOP HEADER BAR & TIMEFRAME SELECTOR
          ===================================================================== */}
      <div
        className="glass-card"
        style={{
          padding: '1.25rem 1.5rem',
          borderRadius: '16px',
          marginBottom: '1.25rem',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)'
                }}
              >
                <BarChart3 size={20} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.35rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                  {lang === 'bn' ? '📊 পূর্ণাঙ্গ ব্যবসায়িক রিপোর্ট হাব' : '📊 Periodic Business Reports'}
                </h1>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {lang === 'bn'
                    ? 'ডেইলি, উইকলি, মান্থলি ও ইয়ারলি কেনা-বেচা, লাভ-ক্ষতি, দেনা-পাওনা ও ইনভয়েস বিশ্লেষণ'
                    : 'Daily, Weekly, Monthly & Yearly Sales, Purchases, P&L, Dues & Invoices'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions (Print, Export, WhatsApp, Add Purchase) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowAddPurchaseModal(true)}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '0.84rem',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #10b981, #059669)'
              }}
            >
              <Plus size={16} />
              <span>{lang === 'bn' ? '+ মাল কেনা এন্ট্রি' : '+ Record Purchase'}</span>
            </button>

            <button
              onClick={() => setShowAddDamageModal(true)}
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '10px',
                fontSize: '0.84rem',
                fontWeight: '700',
                color: '#ef4444',
                borderColor: 'rgba(239, 68, 68, 0.3)'
              }}
            >
              <AlertTriangle size={15} />
              <span>{lang === 'bn' ? '+ ড্যামেজ এন্ট্রি' : '+ Record Damage'}</span>
            </button>

            <button
              onClick={handlePrintReport}
              className="btn btn-secondary"
              title={lang === 'bn' ? 'প্রিন্ট বা PDF হিসেবে সংরক্ষণ' : 'Print / Save as PDF'}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '10px', fontSize: '0.84rem' }}
            >
              <Printer size={16} />
              <span className="hide-mobile">{lang === 'bn' ? 'প্রিন্ট' : 'Print'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="btn btn-secondary"
              title={lang === 'bn' ? 'এক্সেল CSV ফাইল ডাউনলোড' : 'Download CSV'}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '10px', fontSize: '0.84rem' }}
            >
              <Download size={16} />
              <span className="hide-mobile">Excel</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="btn btn-secondary"
              title={lang === 'bn' ? 'WhatsApp এ সামারি পাঠান' : 'Share on WhatsApp'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '10px',
                fontSize: '0.84rem',
                color: '#22c55e',
                borderColor: 'rgba(34, 197, 94, 0.3)'
              }}
            >
              <Share2 size={16} />
              <span className="hide-mobile">WhatsApp</span>
            </button>
          </div>
        </div>

        {/* TIME HORIZON TABS (Daily, Weekly, Monthly, Yearly, Custom) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
          <div style={{ display: 'inline-flex', background: 'var(--bg-main)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-color)', gap: '4px' }}>
            <button
              onClick={() => setHorizon('daily')}
              style={{
                padding: '7px 16px',
                borderRadius: '9px',
                border: 'none',
                background: horizon === 'daily' ? 'var(--business-primary)' : 'transparent',
                color: horizon === 'daily' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: horizon === 'daily' ? '800' : '600',
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              ☀️ {lang === 'bn' ? 'ডেইলি (দৈনিক)' : 'Daily'}
            </button>

            <button
              onClick={() => setHorizon('weekly')}
              style={{
                padding: '7px 16px',
                borderRadius: '9px',
                border: 'none',
                background: horizon === 'weekly' ? 'var(--business-primary)' : 'transparent',
                color: horizon === 'weekly' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: horizon === 'weekly' ? '800' : '600',
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              📅 {lang === 'bn' ? 'উইকলি (সাপ্তাহিক)' : 'Weekly'}
            </button>

            <button
              onClick={() => setHorizon('monthly')}
              style={{
                padding: '7px 16px',
                borderRadius: '9px',
                border: 'none',
                background: horizon === 'monthly' ? 'var(--business-primary)' : 'transparent',
                color: horizon === 'monthly' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: horizon === 'monthly' ? '800' : '600',
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              🗓️ {lang === 'bn' ? 'মান্থলি (মাসিক)' : 'Monthly'}
            </button>

            <button
              onClick={() => setHorizon('yearly')}
              style={{
                padding: '7px 16px',
                borderRadius: '9px',
                border: 'none',
                background: horizon === 'yearly' ? 'var(--business-primary)' : 'transparent',
                color: horizon === 'yearly' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: horizon === 'yearly' ? '800' : '600',
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              📆 {lang === 'bn' ? 'ইয়ারলি (বাৎসরিক)' : 'Yearly'}
            </button>

            <button
              onClick={() => setHorizon('custom')}
              style={{
                padding: '7px 16px',
                borderRadius: '9px',
                border: 'none',
                background: horizon === 'custom' ? 'var(--business-primary)' : 'transparent',
                color: horizon === 'custom' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: horizon === 'custom' ? '800' : '600',
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              ⏱️ {lang === 'bn' ? 'কাস্টম রেঞ্জ' : 'Custom'}
            </button>
          </div>

          {/* Date Picker Controls / Step Navigator */}
          {horizon !== 'custom' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => handleStepDate(-1)}
                className="btn-icon"
                title={lang === 'bn' ? 'আগের সময়কাল' : 'Previous Interval'}
                style={{ width: '32px', height: '32px', borderRadius: '8px' }}
              >
                <ChevronLeft size={16} />
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--bg-main)',
                  padding: '5px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  fontWeight: '700',
                  fontSize: '0.86rem',
                  color: 'var(--text-main)'
                }}
              >
                <Calendar size={15} style={{ color: 'var(--business-primary)' }} />
                <span>{dateInterval.label}</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'transparent',
                    width: '18px',
                    cursor: 'pointer',
                    padding: 0
                  }}
                  title={lang === 'bn' ? 'নির্দিষ্ট দিন পছন্দ করুন' : 'Pick Date'}
                />
              </div>

              <button
                onClick={() => handleStepDate(1)}
                className="btn-icon"
                title={lang === 'bn' ? 'পরের সময়কাল' : 'Next Interval'}
                style={{ width: '32px', height: '32px', borderRadius: '8px' }}
              >
                <ChevronRight size={16} />
              </button>

              <button
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="btn btn-secondary"
                style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700' }}
              >
                {lang === 'bn' ? 'আজ' : 'Today'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>হতে:</span>
                <input
                  type="date"
                  value={customRange.startDate}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="input-field"
                  style={{ padding: '4px 8px', fontSize: '0.82rem' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>পর্যন্ত:</span>
                <input
                  type="date"
                  value={customRange.endDate}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="input-field"
                  style={{ padding: '4px 8px', fontSize: '0.82rem' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          EXECUTIVE SUMMARY METRIC CARDS (ALL-IN-ONE OVERVIEW)
          ===================================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        
        {/* Total Sales Card */}
        <div
          className="glass-card"
          onClick={() => setActiveReportTab('sales_items')}
          style={{
            padding: '1.1rem',
            borderRadius: '14px',
            border: activeReportTab === 'sales_items' ? '2px solid #0284c7' : '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, border-color 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)' }}>
              {lang === 'bn' ? '🛒 মোট বিক্রি (Sales)' : 'Total Sales'}
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(2, 132, 199, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
              <ShoppingBag size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#0284c7', margin: '0 0 6px' }}>
            ৳{salesMetrics.totalSales.toLocaleString('en-IN')}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            <span>নগদ: <strong>৳{salesMetrics.cashSales.toLocaleString('en-IN')}</strong></span>
            <span>বাকি: <strong style={{ color: '#ef4444' }}>৳{salesMetrics.dueSales.toLocaleString('en-IN')}</strong></span>
          </div>
        </div>

        {/* Total Purchases Card (কয় টাকার মাল কিনলাম) */}
        <div
          className="glass-card"
          onClick={() => setActiveReportTab('purchases')}
          style={{
            padding: '1.1rem',
            borderRadius: '14px',
            border: activeReportTab === 'purchases' ? '2px solid #d97706' : '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, border-color 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)' }}>
              {lang === 'bn' ? '📦 মাল কেনা (Purchases)' : 'Total Purchases'}
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(217, 119, 6, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
              <Truck size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#d97706', margin: '0 0 6px' }}>
            ৳{purchaseMetrics.totalPurchased.toLocaleString('en-IN')}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            <span>পরিশোধ: <strong>৳{purchaseMetrics.paidOut.toLocaleString('en-IN')}</strong></span>
            <span>বাকি: <strong style={{ color: '#ef4444' }}>৳{purchaseMetrics.dueRemaining.toLocaleString('en-IN')}</strong></span>
          </div>
        </div>

        {/* Cash Collections (আমাকে কয়টা পে করছে ও কত টাকা পেয়েছি) */}
        <div
          className="glass-card"
          onClick={() => setActiveReportTab('invoices')}
          style={{
            padding: '1.1rem',
            borderRadius: '14px',
            border: activeReportTab === 'invoices' ? '2px solid #10b981' : '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, border-color 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)' }}>
              {lang === 'bn' ? '💰 নগদ আদায় (Collections)' : 'Collections In'}
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <ArrowDownLeft size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#10b981', margin: '0 0 6px' }}>
            ৳{invoiceBreakdown.totalCollected.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            {invoiceBreakdown.fullyPaidCount}টি পূর্ণ + {invoiceBreakdown.partialPaidCount}টি আংশিক চালান আদায়
          </div>
        </div>

        {/* Net Profit Card */}
        <div
          className="glass-card"
          onClick={() => setActiveReportTab('pnl')}
          style={{
            padding: '1.1rem',
            borderRadius: '14px',
            border: activeReportTab === 'pnl' ? '2px solid #16a34a' : '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, border-color 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)' }}>
              {lang === 'bn' ? '📈 নিট লাভ (Net Profit)' : 'Net Profit'}
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(22, 163, 74, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: '800', color: netProfit >= 0 ? '#16a34a' : '#ef4444', margin: '0 0 6px' }}>
            ৳{netProfit.toLocaleString('en-IN')}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            <span>মার্জিন: <strong>{netProfitMargin}%</strong></span>
            <span>গ্রস লাভ: <strong>৳{salesMetrics.grossProfit.toLocaleString('en-IN')}</strong></span>
          </div>
        </div>

        {/* Damages / Wastage Card */}
        <div
          className="glass-card"
          onClick={() => setActiveReportTab('damage')}
          style={{
            padding: '1.1rem',
            borderRadius: '14px',
            border: activeReportTab === 'damage' ? '2px solid #ef4444' : '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, border-color 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)' }}>
              {lang === 'bn' ? '⚠️ নষ্ট পণ্যের ক্ষতি' : 'Damaged Stock Loss'}
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#ef4444', margin: '0 0 6px' }}>
            ৳{damageMetrics.totalLoss.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            মোট {damageMetrics.totalQty}টি নষ্ট / ভাঙা আইটেম
          </div>
        </div>

        {/* Who Owes Whom (দেনা-পাওনা লেজার) */}
        <div
          className="glass-card"
          onClick={() => setActiveReportTab('ledger')}
          style={{
            padding: '1.1rem',
            borderRadius: '14px',
            border: activeReportTab === 'ledger' ? '2px solid #8b5cf6' : '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, border-color 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)' }}>
              {lang === 'bn' ? '📒 দেনা-পাওনা খতিয়ান' : 'Receivables & Payables'}
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
              <CreditCard size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '0 0 4px' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-main)' }}>
              আমি পাই: <span style={{ color: '#0284c7' }}>৳{ledgerMetrics.totalReceivable.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-main)' }}>
              কে পায়: <span style={{ color: '#ef4444' }}>৳{ledgerMetrics.totalPayable.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {ledgerMetrics.customerReceivables.length}জন কাস্টমার ও {ledgerMetrics.supplierPayables.length}জন মহাজন
          </div>
        </div>

      </div>

      {/* =====================================================================
          DETAILED SECTION SUB-NAVIGATION TABS
          ===================================================================== */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '1rem',
          borderBottom: '1px solid var(--border-color)'
        }}
      >
        {[
          { id: 'overview', label: lang === 'bn' ? '📊 এ টু জেড সামারি' : 'A-Z Overview' },
          { id: 'sales_items', label: lang === 'bn' ? '🛒 কী কী বিক্রি করলাম' : 'Products Sold' },
          { id: 'purchases', label: lang === 'bn' ? '📦 কী কী কিনলাম' : 'Purchases' },
          { id: 'daily_trend', label: lang === 'bn' ? '📈 প্রতিদিনের সেল' : 'Daily Trend' },
          { id: 'invoices', label: lang === 'bn' ? '🧾 ইনভয়েস স্ট্যাটাস' : 'Invoices' },
          { id: 'ledger', label: lang === 'bn' ? '📒 দেনা-পাওনা লেজার' : 'Who Owes Whom' },
          { id: 'pnl', label: lang === 'bn' ? '💹 লাভ-ক্ষতি ও খরচ' : 'Profit & Loss' },
          { id: 'damage', label: lang === 'bn' ? '⚠️ নষ্ট মালের হিসাব' : 'Damaged Stock' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveReportTab(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: activeReportTab === tab.id ? '1.5px solid var(--business-primary)' : '1px solid var(--border-color)',
              background: activeReportTab === tab.id ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-secondary)',
              color: activeReportTab === tab.id ? 'var(--business-primary)' : 'var(--text-muted)',
              fontWeight: activeReportTab === tab.id ? '800' : '600',
              fontSize: '0.84rem',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* =====================================================================
          TAB 1: PRODUCTS SOLD BREAKDOWN (কী কী বিক্রি করলাম)
          ===================================================================== */}
      {activeReportTab === 'sales_items' && (
        <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                {lang === 'bn' ? '🛒 এই সময়কালে কী কী বিক্রি হলো' : 'Products Sold Breakdown'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                মোট {productsSoldBreakdown.length}টি আলাদা পণ্য বিক্রি হয়েছে
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'পণ্য বা কোড খুঁজুন...' : 'Search product...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field"
                  style={{ padding: '6px 12px 6px 30px', fontSize: '0.82rem', width: '180px' }}
                />
              </div>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="input-field"
                style={{ padding: '6px 10px', fontSize: '0.82rem' }}
              >
                <option value="highest_sales">{lang === 'bn' ? 'সর্বোচ্চ বিক্রয়' : 'Highest Sales'}</option>
                <option value="highest_profit">{lang === 'bn' ? 'সর্বোচ্চ লাভ' : 'Highest Profit'}</option>
                <option value="highest_qty">{lang === 'bn' ? 'সর্বোচ্চ পরিমাণ' : 'Highest Qty'}</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>পণ্য ও SKU</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>পরিমাণ</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>মোট বিক্রয়</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>ক্রয়মূল্য (খরচ)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>লাভ / মার্জিন</th>
                </tr>
              </thead>
              <tbody>
                {productsSoldBreakdown.length > 0 ? (
                  productsSoldBreakdown.map((item, idx) => {
                    const margin = item.totalRevenue > 0 ? ((item.profit / item.totalRevenue) * 100).toFixed(1) : 0;
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{item.name}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>SKU: {item.sku}</div>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '800' }}>
                          {item.totalQty} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.unit}</span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '800', color: '#0284c7' }}>
                          ৳{item.totalRevenue.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>
                          ৳{item.totalCost.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <div style={{ fontWeight: '800', color: item.profit >= 0 ? '#16a34a' : '#ef4444' }}>
                            ৳{item.profit.toLocaleString('en-IN')}
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            ({margin}%)
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      এই সময়কালে কোনো পণ্য বিক্রির রেকর্ড পাওয়া যায়নি।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: PURCHASES / MAL KENA BREAKDOWN (কী কী মাল কিনলাম)
          ===================================================================== */}
      {activeReportTab === 'purchases' && (
        <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                {lang === 'bn' ? '📦 কী কী মাল কেনা হলো (Purchases)' : 'Purchases Breakdown'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                মোট ক্রয়: ৳{purchaseMetrics.totalPurchased.toLocaleString('en-IN')} | নগদ শোধ: ৳{purchaseMetrics.paidOut.toLocaleString('en-IN')} | বাকি: ৳{purchaseMetrics.dueRemaining.toLocaleString('en-IN')}
              </p>
            </div>

            <button
              onClick={() => setShowAddPurchaseModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '10px', fontSize: '0.84rem' }}
            >
              <Plus size={16} />
              <span>{lang === 'bn' ? '+ নতুন মাল ক্রয় যোগ করুন' : '+ Record Purchase'}</span>
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>তারিখ ও চালান</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>সরবরাহকারী (Supplier)</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>পণ্যের বিবরণ</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>মোট খরচ</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>পরিশোধিত</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>বাকি</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.length > 0 ? (
                  filteredPurchases.map((po, idx) => {
                    const due = Math.max(0, (Number(po.totalAmount) || 0) - (Number(po.paidAmount) || 0));
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{po.id}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{po.date}</div>
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: '700', color: 'var(--text-main)' }}>
                          {po.supplierName}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {(po.items || []).map((it, iIdx) => (
                            <div key={iIdx} style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                              • {it.name} ({it.quantity || it.qty}টি x ৳{it.unitCost || it.price})
                            </div>
                          ))}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '800', color: '#d97706' }}>
                          ৳{(Number(po.totalAmount) || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: '#10b981' }}>
                          ৳{(Number(po.paidAmount) || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '800', color: due > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                          ৳{due.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          {due <= 0 ? (
                            <span style={{ padding: '3px 8px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '0.72rem', fontWeight: '800' }}>
                              পরিশোধিত
                            </span>
                          ) : (
                            <span style={{ padding: '3px 8px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.72rem', fontWeight: '800' }}>
                              বাকি আছে
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      এই সময়কালে কোনো মালামাল ক্রয়ের রেকর্ড পাওয়া যায়নি। উপরে "+ নতুন মাল ক্রয় যোগ করুন" বাটনে ক্লিক করে ক্রয় যুক্ত করতে পারেন।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: DAY-BY-DAY SALES TREND (প্রতিদিনের সেল গ্রাফ ও লিস্ট)
          ===================================================================== */}
      {activeReportTab === 'daily_trend' && (
        <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
              {lang === 'bn' ? '📈 প্রতিদিনের সেল ও ট্রেন্ড বিশ্লেষণ' : 'Day-by-Day Sales Trend'}
            </h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              নির্বাচিত সময়কালের প্রতিটি দিনের বিক্রয় এবং নগদ বনাম বাকি হিসাব
            </p>
          </div>

          {/* Interactive SVG / CSS Bar Chart */}
          <div
            style={{
              background: 'var(--bg-main)',
              borderRadius: '12px',
              padding: '1.25rem 1rem 0.75rem',
              border: '1px solid var(--border-color)',
              marginBottom: '1.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '160px', overflowX: 'auto', paddingBottom: '8px' }}>
              {dayByDayTrend.map((day, idx) => {
                const heightPercent = maxDaySales > 0 ? (day.totalSales / maxDaySales) * 100 : 0;
                return (
                  <div
                    key={idx}
                    style={{
                      flex: '1 0 38px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%',
                      justifyContent: 'flex-end',
                      position: 'relative'
                    }}
                    title={`${day.date} (${day.dayName}): ৳${day.totalSales.toLocaleString('en-IN')}`}
                  >
                    {/* Tooltip on hover */}
                    <div style={{ fontSize: '0.65rem', fontWeight: '800', color: day.totalSales > 0 ? 'var(--business-primary)' : 'var(--text-muted)', marginBottom: '4px' }}>
                      {day.totalSales > 0 ? `৳${(day.totalSales / 1000).toFixed(0)}k` : '0'}
                    </div>

                    {/* Bar */}
                    <div
                      style={{
                        width: '24px',
                        height: `${Math.max(4, heightPercent)}%`,
                        background: day.totalSales > 0 ? 'linear-gradient(180deg, #6366f1, #4f46e5)' : 'var(--border-color)',
                        borderRadius: '6px 6px 0 0',
                        transition: 'height 0.3s ease',
                        boxShadow: day.totalSales > 0 ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none'
                      }}
                    />

                    {/* Day label */}
                    <div style={{ marginTop: '6px', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-main)', textAlign: 'center' }}>
                      {day.dayName}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                      {day.date.slice(8)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Table Breakdown */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>তারিখ ও বার</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>ইনভয়েস সংখ্যা</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>নগদ বিক্রি</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>বাকিতে বিক্রি</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>সর্বমোট বিক্রি</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>গ্রস লাভ</th>
                </tr>
              </thead>
              <tbody>
                {dayByDayTrend.map((day, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontWeight: '800', color: 'var(--text-main)' }}>{day.date}</span>
                      <span style={{ marginLeft: '6px', fontSize: '0.75rem', color: 'var(--business-primary)', background: 'rgba(99, 102, 241, 0.1)', padding: '2px 6px', borderRadius: '6px' }}>
                        {day.dayName}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '700' }}>
                      {day.invoiceCount}টি
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#10b981', fontWeight: '700' }}>
                      ৳{day.cashSales.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: day.dueSales > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: '700' }}>
                      ৳{day.dueSales.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '800', color: '#0284c7' }}>
                      ৳{day.totalSales.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '800', color: '#16a34a' }}>
                      ৳{day.grossProfit.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: INVOICES BREAKDOWN (ইনভয়েস স্ট্যাটাস: পেইড, আংশিক, বাকি)
          ===================================================================== */}
      {activeReportTab === 'invoices' && (
        <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
              {lang === 'bn' ? '🧾 চালান ও ইনভয়েস পেমেন্ট স্ট্যাটাস' : 'Invoices & Collection Status'}
            </h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              কয়টি ইনভয়েস সম্পূর্ণ পে করা হয়েছে, কয়টি আংশিক পে করা হয়েছে এবং কয়টি বকেয়া রয়েছে
            </p>
          </div>

          {/* 3 Status Summary Banners */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            {/* Fully Paid */}
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1.5px solid #10b981', borderRadius: '12px', padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: '800', fontSize: '0.85rem' }}>
                <CheckCircle2 size={16} />
                <span>সম্পূর্ণ পেইড (Fully Paid)</span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#10b981', margin: '6px 0 2px' }}>
                ৳{invoiceBreakdown.fullyPaidAmount.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                মোট {invoiceBreakdown.fullyPaidCount}টি চালান শতভাগ পরিশোধ
              </div>
            </div>

            {/* Partially Paid */}
            <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1.5px solid #f59e0b', borderRadius: '12px', padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontWeight: '800', fontSize: '0.85rem' }}>
                <Clock size={16} />
                <span>আংশিক পেইড (Partial Paid)</span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#f59e0b', margin: '6px 0 2px' }}>
                ৳{invoiceBreakdown.partialPaidCash.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {invoiceBreakdown.partialPaidCount}টি চালান | বাকি রয়ে গেছে: <strong style={{ color: '#ef4444' }}>৳{invoiceBreakdown.partialRemainingDue.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            {/* Fully Unpaid */}
            <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1.5px solid #ef4444', borderRadius: '12px', padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontWeight: '800', fontSize: '0.85rem' }}>
                <AlertCircle size={16} />
                <span>সম্পূর্ণ বকেয়া (Unpaid)</span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#ef4444', margin: '6px 0 2px' }}>
                ৳{invoiceBreakdown.unpaidAmount.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                মোট {invoiceBreakdown.unpaidCount}টি চালান এখনো সম্পূর্ণ বাকি
              </div>
            </div>
          </div>

          {/* Invoices List Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>চালান নম্বর</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>গ্রাহকের নাম ও ফোন</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>তারিখ</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>মোট বিল</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>পরিশোধিত</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>বকেয়া বাকি</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>পেমেন্ট স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((inv, idx) => {
                    const due = Number(inv.dueAmount) || 0;
                    const paid = Number(inv.paidAmount) || 0;
                    const grand = Number(inv.grandTotal) || 0;

                    let statusBadge = (
                      <span style={{ padding: '3px 8px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '0.72rem', fontWeight: '800' }}>
                        ✓ ফুল পেইড
                      </span>
                    );

                    if (due > 0 && paid > 0) {
                      statusBadge = (
                        <span style={{ padding: '3px 8px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '0.72rem', fontWeight: '800' }}>
                          ⚡ আংশিক পেইড
                        </span>
                      );
                    } else if (due > 0 && paid === 0) {
                      statusBadge = (
                        <span style={{ padding: '3px 8px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.72rem', fontWeight: '800' }}>
                          ⛔ আনপেইড
                        </span>
                      );
                    }

                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: '800', color: 'var(--business-primary)' }}>
                          {inv.id}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{inv.customerName}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{inv.customerPhone || 'মোবাইল নেই'}</div>
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {inv.date}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '800', color: 'var(--text-main)' }}>
                          ৳{grand.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: '#10b981' }}>
                          ৳{paid.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '800', color: due > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                          ৳{due.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          {statusBadge}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      এই সময়কালের কোনো ইনভয়েস বা মেমো পাওয়া যায়নি।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 5: WHO OWES WHOM (আমি কার কাছে পাই & কে আমার কাছে পায়)
          ===================================================================== */}
      {activeReportTab === 'ledger' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          
          {/* LEFT: AMI KAR KACHE PAI (Customer Receivables) */}
          <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ArrowDownLeft size={18} />
                  <span>আমি কার কাছে পাই (Customer Dues)</span>
                </h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  বাজারে মোট বকেয়া পাওনা হিসাব
                </p>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0284c7' }}>
                ৳{ledgerMetrics.totalReceivable.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
              {ledgerMetrics.customerReceivables.length > 0 ? (
                ledgerMetrics.customerReceivables.map((c, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-main)',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '0.88rem', color: 'var(--text-main)' }}>{c.name}</div>
                      {c.companyName && <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{c.companyName}</div>}
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={11} />
                        <span>{c.phone || 'ফোন নেই'}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '900', fontSize: '0.98rem', color: '#ef4444' }}>
                        ৳{c.dueAmount.toLocaleString('en-IN')}
                      </div>
                      {c.phone && (
                        <button
                          onClick={() => {
                            const msg = `আসসালামু আলাইকুম ${c.name}, ${businessSettings.companyName || 'আমাদের দোকান'} থেকে আপনার বর্তমান বকেয়া বাকি আছে ৳${c.dueAmount.toLocaleString('en-IN')}। দয়া করে পরিশোধ করুন।`;
                            window.open(`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '2px 8px', fontSize: '0.68rem', color: '#22c55e', borderColor: 'rgba(34, 197, 94, 0.3)', marginTop: '4px' }}
                        >
                          💬 WhatsApp
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  আলহামদুলিল্লাহ, কোনো কাস্টমারের কাছে বাকি পাওনা নেই!
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: KE AMAR KACHE PAI (Supplier Payables) */}
          <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ArrowUpRight size={18} />
                  <span>কে আমার কাছে পায় (Supplier Dues)</span>
                </h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  মহাজন ও সাপ্লায়ারদের প্রদেয় বকেয়া
                </p>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#ef4444' }}>
                ৳{ledgerMetrics.totalPayable.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
              {ledgerMetrics.supplierPayables.length > 0 ? (
                ledgerMetrics.supplierPayables.map((s, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-main)',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '0.88rem', color: 'var(--text-main)' }}>{s.name}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>মাল: {s.items || 'সাধারণ সরবরাহ'}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={11} />
                        <span>{s.contact || 'ফোন নেই'}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '900', fontSize: '0.98rem', color: '#ef4444' }}>
                        ৳{s.payableAmount.toLocaleString('en-IN')}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>প্রদেয় দেনা</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  কোনো সাপ্লায়ারের কাছে বকেয়া দেনা নেই!
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* =====================================================================
          TAB 6: PROFIT & LOSS STATEMENT (লাভ-ক্ষতি ও খরচ রিপোর্ট)
          ===================================================================== */}
      {activeReportTab === 'pnl' && (
        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', maxWidth: '820px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: '0 0 4px', color: 'var(--text-main)' }}>
              {lang === 'bn' ? '💹 লাভ ও ক্ষতির পূর্ণাঙ্গ বিবরণী (Income Statement)' : 'Income Statement (P&L)'}
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              সময়কাল: {dateInterval.label}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* 1. Gross Revenue */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-main)', borderRadius: '10px' }}>
              <div>
                <div style={{ fontWeight: '800', color: 'var(--text-main)' }}>মোট বিক্রয় রেভিনিউ (+)</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>ইনভয়েস ও মেমোর মোট বিক্রয় মূল্য</div>
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#0284c7' }}>
                ৳{salesMetrics.totalSales.toLocaleString('en-IN')}
              </div>
            </div>

            {/* 2. COGS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-main)', borderRadius: '10px' }}>
              <div>
                <div style={{ fontWeight: '800', color: 'var(--text-main)' }}>বিক্রিত পণ্যের আসল ক্রয়মূল্য (-)</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Cost of Goods Sold (COGS)</div>
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#d97706' }}>
                - ৳{salesMetrics.cogsTotal.toLocaleString('en-IN')}
              </div>
            </div>

            {/* 3. Gross Profit Line */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'rgba(99, 102, 241, 0.08)', border: '1px dashed var(--business-primary)', borderRadius: '10px' }}>
              <div style={{ fontWeight: '800', color: 'var(--business-primary)', fontSize: '0.95rem' }}>
                মোট গ্রস মুনাফা (= Gross Profit)
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--business-primary)' }}>
                ৳{salesMetrics.grossProfit.toLocaleString('en-IN')}
              </div>
            </div>

            {/* 4. Operating Expenses */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-main)', borderRadius: '10px' }}>
              <div>
                <div style={{ fontWeight: '800', color: 'var(--text-main)' }}>ব্যবসায়িক পরিচালন ব্যয় (-)</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>দোকান ভাড়া, বিদ্যুৎ, স্টাফ চা-নাস্তা, যাতায়াত বিল</div>
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#ef4444' }}>
                - ৳{nonPurchaseExpenses.toLocaleString('en-IN')}
              </div>
            </div>

            {/* 5. Damaged Goods Loss */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-main)', borderRadius: '10px' }}>
              <div>
                <div style={{ fontWeight: '800', color: 'var(--text-main)' }}>ড্যামেজ ও নষ্ট পণ্যের আর্থিক ক্ষতি (-)</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>মেয়াদোত্তীর্ণ বা বিনষ্ট পণ্য</div>
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#ef4444' }}>
                - ৳{damageMetrics.totalLoss.toLocaleString('en-IN')}
              </div>
            </div>

            {/* 6. FINAL NET PROFIT */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                background: netProfit >= 0 ? 'rgba(22, 163, 74, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: netProfit >= 0 ? '2px solid #16a34a' : '2px solid #ef4444',
                borderRadius: '12px',
                marginTop: '8px'
              }}
            >
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: '900', color: netProfit >= 0 ? '#16a34a' : '#ef4444' }}>
                  {netProfit >= 0 ? '🎉 চূড়ান্ত নিট লাভ (Net Profit)' : '⚠️ চূড়ান্ত নিট ক্ষতি (Net Loss)'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  নিট প্রফিট মার্জিন: <strong>{netProfitMargin}%</strong>
                </div>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: netProfit >= 0 ? '#16a34a' : '#ef4444' }}>
                ৳{netProfit.toLocaleString('en-IN')}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 7: DAMAGED GOODS REPORT (ড্যামেজ বা নষ্ট মালের হিসাব)
          ===================================================================== */}
      {activeReportTab === 'damage' && (
        <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                {lang === 'bn' ? '⚠️ নষ্ট ও ক্ষতিগ্রস্ত মালের হিসাব (Damage Log)' : 'Damaged Stock Log'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                মোট ক্ষতি: ৳{damageMetrics.totalLoss.toLocaleString('en-IN')} ({damageMetrics.totalQty}টি আইটেম)
              </p>
            </div>

            <button
              onClick={() => setShowAddDamageModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '10px', fontSize: '0.84rem', background: '#ef4444' }}
            >
              <Plus size={16} />
              <span>{lang === 'bn' ? '+ নতুন নষ্ট পণ্য যোগ করুন' : '+ Record Damage'}</span>
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>তারিখ</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>পণ্যের নাম</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>ক্ষতির কারণ</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>নষ্ট পরিমাণ</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>একক ক্রয়মূল্য</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>মোট ক্ষতি</th>
                </tr>
              </thead>
              <tbody>
                {filteredDamages.length > 0 ? (
                  filteredDamages.map((dmg, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {dmg.date}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: '700', color: 'var(--text-main)' }}>
                        {dmg.productName || 'পণ্য'}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                        {dmg.reason || 'অজ্ঞাত ক্ষতি'}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '800' }}>
                        {dmg.quantity} পিস
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>
                        ৳{(Number(dmg.unitCost) || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '800', color: '#ef4444' }}>
                        ৳{(Number(dmg.totalLoss) || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      এই সময়কালে কোনো ড্যামেজ বা নষ্ট মালের রেকর্ড নেই।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 0: A-TO-Z EXECUTIVE OVERVIEW (ডিফল্ট ওভারভিউ)
          ===================================================================== */}
      {activeReportTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Top 3 Quick Grids */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            
            {/* Quick Top Selling Items */}
            <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontWeight: '800', fontSize: '0.94rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShoppingBag size={16} style={{ color: 'var(--business-primary)' }} />
                  <span>টপ বিক্রিত পণ্য ({productsSoldBreakdown.length}টি)</span>
                </h4>
                <button
                  onClick={() => setActiveReportTab('sales_items')}
                  style={{ background: 'none', border: 'none', color: 'var(--business-primary)', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}
                >
                  সব দেখুন →
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {productsSoldBreakdown.slice(0, 5).map((p, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.84rem', color: 'var(--text-main)' }}>{p.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.totalQty} {p.unit} বিক্রি</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#0284c7' }}>৳{p.totalRevenue.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '0.7rem', color: '#16a34a' }}>+৳{p.profit.toLocaleString('en-IN')} লাভ</div>
                    </div>
                  </div>
                ))}
                {productsSoldBreakdown.length === 0 && (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>কোনো বিক্রি হয়নি</div>
                )}
              </div>
            </div>

            {/* Quick Purchases & Supplier Payables */}
            <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontWeight: '800', fontSize: '0.94rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Truck size={16} style={{ color: '#d97706' }} />
                  <span>মাল কেনা ও মহাজন হিসাব</span>
                </h4>
                <button
                  onClick={() => setActiveReportTab('purchases')}
                  style={{ background: 'none', border: 'none', color: '#d97706', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}
                >
                  সব দেখুন →
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ background: 'var(--bg-main)', padding: '10px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>মোট মাল কেনা:</span>
                  <span style={{ fontWeight: '800', color: '#d97706' }}>৳{purchaseMetrics.totalPurchased.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ background: 'var(--bg-main)', padding: '10px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>নগদ পরিশোধ:</span>
                  <span style={{ fontWeight: '800', color: '#10b981' }}>৳{purchaseMetrics.paidOut.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ background: 'var(--bg-main)', padding: '10px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>কেনাকাটায় বাকি:</span>
                  <span style={{ fontWeight: '800', color: '#ef4444' }}>৳{purchaseMetrics.dueRemaining.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ background: 'var(--bg-main)', padding: '10px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>মহাজন দেনা (কে পায়):</span>
                  <span style={{ fontWeight: '800', color: '#ef4444' }}>৳{ledgerMetrics.totalPayable.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Quick Cash Flow Balance */}
            <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontWeight: '800', fontSize: '0.94rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CreditCard size={16} style={{ color: '#10b981' }} />
                  <span>আদায় ও বকেয়া খতিয়ান</span>
                </h4>
                <button
                  onClick={() => setActiveReportTab('ledger')}
                  style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}
                >
                  সব দেখুন →
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ background: 'var(--bg-main)', padding: '10px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>নগদ আদায় হয়েছে:</span>
                  <span style={{ fontWeight: '800', color: '#10b981' }}>৳{invoiceBreakdown.totalCollected.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ background: 'var(--bg-main)', padding: '10px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>বাজারে বাকি (আমি পাই):</span>
                  <span style={{ fontWeight: '800', color: '#0284c7' }}>৳{ledgerMetrics.totalReceivable.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ background: 'var(--bg-main)', padding: '10px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>নষ্ট মালের ক্ষতি:</span>
                  <span style={{ fontWeight: '800', color: '#ef4444' }}>৳{damageMetrics.totalLoss.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ background: 'rgba(22, 163, 74, 0.1)', padding: '10px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#16a34a' }}>নিট প্রফিট:</span>
                  <span style={{ fontWeight: '900', color: '#16a34a', fontSize: '1rem' }}>৳{netProfit.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* =====================================================================
          MODAL 1: ADD NEW PURCHASE (মাল কেনা এন্ট্রি)
          ===================================================================== */}
      {showAddPurchaseModal && (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 1200 }}>
          <div className="glass-card modal-content" style={{ maxWidth: '500px', width: '92%', borderRadius: '16px', padding: '1.5rem', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={20} style={{ color: '#d97706' }} />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? '📦 মাল কেনা এন্ট্রি করুন' : 'Record Supplier Purchase'}
                </h3>
              </div>
              <button onClick={() => setShowAddPurchaseModal(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  সরবরাহকারী / সাপ্লায়ার
                </label>
                <select
                  value={newPurchase.supplierId}
                  onChange={(e) => {
                    const s = suppliers.find(sup => sup.id === e.target.value);
                    setNewPurchase(prev => ({
                      ...prev,
                      supplierId: e.target.value,
                      supplierName: s ? s.name : ''
                    }));
                  }}
                  className="input-field"
                  style={{ width: '100%', padding: '8px 12px' }}
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.items || 'সাপ্লায়ার'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  পণ্য নির্বাচন করুন
                </label>
                <select
                  value={newPurchase.productId}
                  onChange={(e) => {
                    const p = products.find(prod => prod.id === e.target.value);
                    setNewPurchase(prev => ({
                      ...prev,
                      productId: e.target.value,
                      productName: p ? p.name : '',
                      unitCost: p ? p.costPrice : prev.unitCost
                    }));
                  }}
                  className="input-field"
                  style={{ width: '100%', padding: '8px 12px' }}
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (ক্রয়মূল্য: ৳{p.costPrice})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                    পরিমাণ (Qty)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newPurchase.quantity}
                    onChange={(e) => setNewPurchase(prev => ({ ...prev, quantity: e.target.value }))}
                    className="input-field"
                    style={{ width: '100%', padding: '8px 12px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                    একক ক্রয়মূল্য (৳)
                  </label>
                  <input
                    type="number"
                    value={newPurchase.unitCost}
                    onChange={(e) => setNewPurchase(prev => ({ ...prev, unitCost: e.target.value }))}
                    className="input-field"
                    style={{ width: '100%', padding: '8px 12px' }}
                    required
                  />
                </div>
              </div>

              {/* Total Calculation Display */}
              <div style={{ background: 'var(--bg-main)', padding: '10px 14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>মোট ক্রয়ের দাম:</span>
                <span style={{ fontSize: '1.15rem', fontWeight: '900', color: '#d97706' }}>
                  ৳{((Number(newPurchase.quantity) || 1) * (Number(newPurchase.unitCost) || 0)).toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  এখন নগদ পরিশোধ (৳)
                </label>
                <input
                  type="number"
                  placeholder="কত টাকা নগদ দিলেন"
                  value={newPurchase.paidAmount}
                  onChange={(e) => setNewPurchase(prev => ({ ...prev, paidAmount: e.target.value }))}
                  className="input-field"
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  নোট বা বিবরণ
                </label>
                <input
                  type="text"
                  placeholder="চালান নম্বর বা মেমো বিবরণ..."
                  value={newPurchase.note}
                  onChange={(e) => setNewPurchase(prev => ({ ...prev, note: e.target.value }))}
                  className="input-field"
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '10px', borderRadius: '10px', fontWeight: '800', background: 'linear-gradient(135deg, #d97706, #b45309)', border: 'none', marginTop: '6px' }}
              >
                ✓ মাল ক্রয় সংরক্ষণ করুন
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: ADD NEW DAMAGE (নষ্ট পণ্য এন্ট্রি)
          ===================================================================== */}
      {showAddDamageModal && (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 1200 }}>
          <div className="glass-card modal-content" style={{ maxWidth: '480px', width: '92%', borderRadius: '16px', padding: '1.5rem', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} style={{ color: '#ef4444' }} />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? '⚠️ নষ্ট বা বিনষ্ট পণ্য এন্ট্রি' : 'Record Damaged Stock'}
                </h3>
              </div>
              <button onClick={() => setShowAddDamageModal(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDamage} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  ক্ষতিগ্রস্ত পণ্য নির্বাচন করুন
                </label>
                <select
                  value={newDamage.productId}
                  onChange={(e) => setNewDamage(prev => ({ ...prev, productId: e.target.value }))}
                  className="input-field"
                  style={{ width: '100%', padding: '8px 12px' }}
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (স্টক: {p.stock})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  নষ্ট হওয়া পরিমাণ (Quantity)
                </label>
                <input
                  type="number"
                  min="1"
                  value={newDamage.quantity}
                  onChange={(e) => setNewDamage(prev => ({ ...prev, quantity: e.target.value }))}
                  className="input-field"
                  style={{ width: '100%', padding: '8px 12px' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  নষ্ট হওয়ার কারণ
                </label>
                <select
                  value={newDamage.reason}
                  onChange={(e) => setNewDamage(prev => ({ ...prev, reason: e.target.value }))}
                  className="input-field"
                  style={{ width: '100%', padding: '8px 12px' }}
                >
                  <option value="প্যাকেজিং নষ্ট / আর্দ্রতা">প্যাকেজিং নষ্ট / আর্দ্রতা</option>
                  <option value="মেয়াদোত্তীর্ণ (Expired)">মেয়াদোত্তীর্ণ (Expired)</option>
                  <option value="ভাঙা বা ছিদ্র (Broken)">ভাঙা বা ছিদ্র (Broken)</option>
                  <option value="পরিবহনে ক্ষতি (Transit Damage)">পরিবহনে ক্ষতি (Transit Damage)</option>
                  <option value="অন্যান্য ক্ষতি">অন্যান্য ক্ষতি</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  নোট / মন্তব্য
                </label>
                <input
                  type="text"
                  placeholder="কীভাবে ক্ষতি হলো..."
                  value={newDamage.note}
                  onChange={(e) => setNewDamage(prev => ({ ...prev, note: e.target.value }))}
                  className="input-field"
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '10px', borderRadius: '10px', fontWeight: '800', background: '#ef4444', border: 'none', marginTop: '6px' }}
              >
                ✓ ড্যামেজ ক্ষতি নিশ্চিত করুন
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
