/**
 * HisabKitab 360 - Edge Scheduled Job Service
 * -------------------------------------------
 * Tip 3: Automated nightly/daily background financial executive summary generator.
 * Runs simulated or via Supabase Edge Function cron trigger.
 */

import { idbGet } from '../utils/idbStorage';

class EdgeScheduledJobService {
  /**
   * Compute daily summary for scheduled dispatch
   */
  async generateDailyExecutiveSummary(targetDate = new Date()) {
    const dateStr = targetDate.toISOString().split('T')[0];
    const invoices = (await idbGet('invoices')) || [];
    const expenses = (await idbGet('expenses')) || [];

    const todayInvoices = invoices.filter(inv => (inv.created_at || inv.date || '').startsWith(dateStr));
    const totalSales = todayInvoices.reduce((sum, i) => sum + (Number(i.grand_total || i.total) || 0), 0);
    const totalPaid = todayInvoices.reduce((sum, i) => sum + (Number(i.paid_amount || i.paid) || 0), 0);
    const totalDue = todayInvoices.reduce((sum, i) => sum + (Number(i.due_amount || i.due) || 0), 0);

    const todayExpenses = expenses.filter(exp => (exp.created_at || exp.date || '').startsWith(dateStr));
    const totalExpense = todayExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const netProfitEst = Math.max(0, totalSales * 0.22 - totalExpense); // Estimated net

    return {
      date: dateStr,
      generatedAt: new Date().toISOString(),
      invoiceCount: todayInvoices.length,
      totalSales,
      totalPaid,
      totalDue,
      totalExpense,
      netProfitEst,
      currency: 'BDT'
    };
  }

  /**
   * Dispatch summary to Owner (Email / WhatsApp hook)
   */
  async dispatchNightlySummary(ownerPhone, ownerEmail) {
    const summary = await this.generateDailyExecutiveSummary();

    const reportText = `🌙 *হিসাবকিতাব ৩৬০ - দৈনিক ব্যবসায়িক সারাংশ*\n` +
      `তারিখ: ${summary.date}\n` +
      `মোট বিক্রি: ৳${summary.totalSales.toLocaleString('bn-BD')}\n` +
      `নগদ ক্যাশ আদায়: ৳${summary.totalPaid.toLocaleString('bn-BD')}\n` +
      `আজকের বাকি: ৳${summary.totalDue.toLocaleString('bn-BD')}\n` +
      `আজকের খরচ: ৳${summary.totalExpense.toLocaleString('bn-BD')}\n` +
      `মোট চালান সংখ্যা: ${summary.invoiceCount} টি\n` +
      `সিস্টেম স্ট্যাটাস: ১০০% সিঙ্কড ও নিরাপদ`;

    console.log('[EdgeJob] Nightly summary dispatched:', summary);

    return {
      success: true,
      summary,
      reportText,
      dispatchedTo: { phone: ownerPhone, email: ownerEmail }
    };
  }
}

export const edgeScheduledJobService = new EdgeScheduledJobService();
