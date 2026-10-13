/**
 * HisabKitab 360 - Payment Reconciliation Engine
 * ----------------------------------------------
 * Tip 8: End-of-day reconciliation comparing physical cash in drawer,
 * MFS merchant statement, card slips, and credit memos against recorded sales.
 */

class PaymentReconciliationService {
  /**
   * Run end-of-day audit reconciliation
   * @param {Object} data - { salesHistory, physicalCashCount, reportedMfs, reportedCard }
   */
  reconcileDailyPayments({ salesHistory = [], physicalCashCount = 0, reportedMfs = 0, reportedCard = 0 }) {
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySales = salesHistory.filter(s => (s.date || s.timestamp || '').startsWith(todayStr));

    // Calculate system recorded totals by method
    let systemCash = 0;
    let systemMfs = 0;
    let systemCard = 0;
    let systemDue = 0;

    todaySales.forEach(s => {
      const paid = Number(s.paidAmount || s.paid) || 0;
      const method = (s.paymentMethod || 'cash').toLowerCase();

      if (method === 'cash') systemCash += paid;
      else if (method === 'bkash' || method === 'nagad' || method === 'rocket') systemMfs += paid;
      else if (method === 'card' || method === 'bank') systemCard += paid;
      else if (method === 'due') systemDue += (Number(s.dueAmount || s.due) || 0);
    });

    const cashDiff = physicalCashCount - systemCash;
    const mfsDiff = reportedMfs - systemMfs;
    const cardDiff = reportedCard - systemCard;
    const totalDiscrepancy = cashDiff + mfsDiff + cardDiff;

    return {
      date: todayStr,
      reconciledAt: new Date().toISOString(),
      invoiceCount: todaySales.length,
      systemTotals: {
        cash: systemCash,
        mfs: systemMfs,
        card: systemCard,
        due: systemDue,
        totalRevenue: systemCash + systemMfs + systemCard
      },
      actualTotals: {
        physicalCash: physicalCashCount,
        reportedMfs,
        reportedCard
      },
      discrepancies: {
        cash: cashDiff,
        mfs: mfsDiff,
        card: cardDiff,
        total: totalDiscrepancy,
        isBalanced: Math.abs(totalDiscrepancy) < 0.01
      },
      status: Math.abs(totalDiscrepancy) < 0.01 ? 'BALANCED' : (totalDiscrepancy > 0 ? 'SURPLUS' : 'DEFICIT')
    };
  }
}

export const paymentReconciliationService = new PaymentReconciliationService();
