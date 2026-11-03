// ========================================================
// HisabKitab 360 - Customer Debt Aging Analysis Service
// Categorizes unpaid market receivables into standard accounting aging buckets:
// - Current (0-30 days): Safe / স্বাভাবিক বকেয়া
// - Notice (31-60 days): Reminder / তাগাদা বকেয়া
// - Risk (61-90 days): Warning / উচ্চ ঝুঁকিপূর্ণ বকেয়া
// - Bad Debt (90+ days): Critical / খেলাপি ঋণ
// ========================================================

export const AGING_BUCKETS = {
  CURRENT: { id: '0_30', label: '০-৩০ দিন (নিরাপদ)', enLabel: '0-30 Days (Current)', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', badge: '🟢', min: 0, max: 30 },
  NOTICE: { id: '31_60', label: '৩১-৬০ দিন (সতর্কতা)', enLabel: '31-60 Days (Notice)', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', badge: '🟡', min: 31, max: 60 },
  RISK: { id: '61_90', label: '৬১-৯০ দিন (ঝুঁকিপূর্ণ)', enLabel: '61-90 Days (High Risk)', color: '#ea580c', bg: 'rgba(234, 88, 12, 0.1)', badge: '🟠', min: 61, max: 90 },
  CRITICAL: { id: '90_plus', label: '৯০+ দিন (খেলাপি)', enLabel: '90+ Days (Critical / Bad Debt)', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', badge: '🔴', min: 91, max: Infinity }
};

/**
 * Calculates the age in days between invoice date and today
 */
export const calculateDaysAge = (dateStr) => {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 0;
  const now = new Date();
  const diffTime = Math.max(0, now.getTime() - d.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Determines which aging bucket an age in days falls into
 */
export const getAgingBucketForDays = (days) => {
  if (days <= 30) return AGING_BUCKETS.CURRENT;
  if (days <= 60) return AGING_BUCKETS.NOTICE;
  if (days <= 90) return AGING_BUCKETS.RISK;
  return AGING_BUCKETS.CRITICAL;
};

/**
 * Computes customer debt aging matrix across all customers and sales/invoices
 * @param {Array} customers Array of customer objects
 * @param {Array} invoices Array of invoices/sales
 * @returns {object} Comprehensive debt aging report and customer breakdowns
 */
export const computeCustomerDebtAging = (customers = [], invoices = []) => {
  const summary = {
    totalReceivable: 0,
    bucket_0_30: 0,
    bucket_31_60: 0,
    bucket_61_90: 0,
    bucket_90_plus: 0,
    customerCount_0_30: 0,
    customerCount_31_60: 0,
    customerCount_61_90: 0,
    customerCount_90_plus: 0,
  };

  const customerAgingMap = new Map();

  // Index unpaid/partial invoices by customer
  const unpaidInvoicesByCustomer = new Map();
  (invoices || []).forEach(inv => {
    const custId = inv.customerId;
    if (!custId) return;

    const remainingDue = Number(inv.dueAmount) || 0;
    const isDue = remainingDue > 0 || inv.status === 'due' || inv.status === 'partial';
    if (!isDue) return;

    const list = unpaidInvoicesByCustomer.get(custId) || [];
    list.push(inv);
    unpaidInvoicesByCustomer.set(custId, list);
  });

  (customers || []).forEach(cust => {
    const totalDue = Number(cust.outstandingDue) || 0;
    if (totalDue <= 0) return;

    summary.totalReceivable += totalDue;

    const custInvoices = unpaidInvoicesByCustomer.get(cust.id) || [];
    let b_0_30 = 0;
    let b_31_60 = 0;
    let b_61_90 = 0;
    let b_90_plus = 0;
    let maxDaysOverdue = 0;

    if (custInvoices.length > 0) {
      let allocatedInvoiceDue = 0;

      custInvoices.forEach(inv => {
        const invDue = Number(inv.dueAmount) || 0;
        const days = calculateDaysAge(inv.date || inv.createdAt);
        if (days > maxDaysOverdue) maxDaysOverdue = days;

        allocatedInvoiceDue += invDue;
        if (days <= 30) b_0_30 += invDue;
        else if (days <= 60) b_31_60 += invDue;
        else if (days <= 90) b_61_90 += invDue;
        else b_90_plus += invDue;
      });

      // If customer has additional balance not bound to an individual invoice (e.g. Opening Balance)
      const unallocated = totalDue - allocatedInvoiceDue;
      if (unallocated > 0) {
        // Assume unallocated balance has the age of customer creation or current bucket
        const custAge = calculateDaysAge(cust.createdAt);
        if (custAge <= 30) b_0_30 += unallocated;
        else if (custAge <= 60) b_31_60 += unallocated;
        else if (custAge <= 90) b_61_90 += unallocated;
        else b_90_plus += unallocated;
        if (custAge > maxDaysOverdue) maxDaysOverdue = custAge;
      }
    } else {
      // Customer has opening balance or due without recorded invoices
      const custAge = calculateDaysAge(cust.createdAt);
      maxDaysOverdue = custAge;
      if (custAge <= 30) b_0_30 = totalDue;
      else if (custAge <= 60) b_31_60 = totalDue;
      else if (custAge <= 90) b_61_90 = totalDue;
      else b_90_plus = totalDue;
    }

    summary.bucket_0_30 += b_0_30;
    summary.bucket_31_60 += b_31_60;
    summary.bucket_61_90 += b_61_90;
    summary.bucket_90_plus += b_90_plus;

    const primaryBucket = getAgingBucketForDays(maxDaysOverdue);

    if (b_0_30 > 0) summary.customerCount_0_30++;
    if (b_31_60 > 0) summary.customerCount_31_60++;
    if (b_61_90 > 0) summary.customerCount_61_90++;
    if (b_90_plus > 0) summary.customerCount_90_plus++;

    customerAgingMap.set(cust.id, {
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      totalDue,
      maxDaysOverdue,
      primaryBucket,
      breakdown: {
        bucket_0_30: b_0_30,
        bucket_31_60: b_31_60,
        bucket_61_90: b_61_90,
        bucket_90_plus: b_90_plus
      }
    });
  });

  return {
    summary,
    customerAgingMap
  };
};
