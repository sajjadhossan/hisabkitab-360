/**
 * HisabKitab 360 - Customer Churn Prediction & Auto Re-engagement (Tip 47)
 * RFM (Recency, Frequency, Monetary) segmentation algorithm.
 * Detects at-risk slipping clients, calculates churn likelihood,
 * and generates automated Bengali SMS campaigns with revival coupons.
 */

class ChurnPredictionService {
  /**
   * Evaluate customer churn probability
   * @param {Object} customer - Customer object
   * @param {Array} customerSales - Transactions for this customer
   * @returns {Object} Churn assessment
   */
  assessChurnRisk(customer, customerSales = []) {
    if (!customer) return null;

    const now = Date.now();
    let lastPurchaseDate = null;
    let totalSpend = 0;
    const frequency = customerSales.length;

    customerSales.forEach(sale => {
      const d = new Date(sale.date || sale.timestamp || sale.createdAt).getTime();
      if (!lastPurchaseDate || d > lastPurchaseDate) {
        lastPurchaseDate = d;
      }
      totalSpend += Number(sale.total || sale.amount || 0);
    });

    // Default to created date or 60 days ago if no sales recorded
    if (!lastPurchaseDate) {
      const created = new Date(customer.createdAt || customer.created_at || now - 60 * 24 * 60 * 60 * 1000).getTime();
      lastPurchaseDate = created;
    }

    const daysSinceLastVisit = Math.floor((now - lastPurchaseDate) / (24 * 60 * 60 * 1000));

    // Calculate Churn Score (0 to 100%)
    let churnProbability = 10;
    let statusBn = 'সক্রিয় ক্রেতা (Active)';
    let statusClass = 'ACTIVE';
    let badgeColor = '#10B981';

    if (daysSinceLastVisit > 90) {
      churnProbability = 95;
      statusBn = 'হারিয়ে যাওয়া ক্রেতা (Churned / Dormant)';
      statusClass = 'CHURNED';
      badgeColor = '#DC2626';
    } else if (daysSinceLastVisit > 60) {
      churnProbability = 75;
      statusBn = 'উচ্চ ঝুঁকি (High Risk of Churn)';
      statusClass = 'HIGH_RISK';
      badgeColor = '#EF4444';
    } else if (daysSinceLastVisit > 30) {
      churnProbability = 45;
      statusBn = 'মনোযোগ প্রয়োজন (Slipping)';
      statusClass = 'SLIPPING';
      badgeColor = '#F59E0B';
    } else if (daysSinceLastVisit > 15) {
      churnProbability = 25;
      statusBn = 'স্বাভাবিক ব্যবধান (Warm)';
      statusClass = 'WARM';
      badgeColor = '#3B82F6';
    }

    // Dynamic Promo Code and Revival SMS in Bengali
    const couponCode = `COMEBACK${Math.floor(100 + Math.random() * 900)}`;
    const discountOffer = daysSinceLastVisit > 60 ? '১০%' : '৫%';
    const shopName = 'হিসাবকিতাব ৩৬০';

    const smsBengali = `প্রিয় ${customer.name || 'গ্রাহক'}, অনেকদিন আপনাকে কাছে পাইনি! আজই ${shopName}-এ এসে পরবর্তী কেনাকাটায় স্পেশাল ${discountOffer} ছাড় উপভোগ করুন। কুপন কোড: ${couponCode}। আমরা আপনার অপেক্ষায় আছি!`;

    return {
      customerId: customer.id,
      customerName: customer.name || 'গ্রাহক',
      phone: customer.phone || 'N/A',
      daysSinceLastVisit,
      lastVisitDateFormatted: new Date(lastPurchaseDate).toISOString().split('T')[0],
      totalSpend,
      purchaseFrequency: frequency,
      churnProbability,
      statusBn,
      statusClass,
      badgeColor,
      couponCode,
      discountOffer,
      reEngagementSms: smsBengali
    };
  }

  /**
   * Run churn diagnostics across all customers
   */
  analyzeCustomerBase(customers = [], salesHistory = []) {
    if (!Array.isArray(customers) || customers.length === 0) return [];

    const assessed = customers.map(c => {
      const custSales = salesHistory.filter(s => s.customerId === c.id || s.customerPhone === c.phone);
      return this.assessChurnRisk(c, custSales);
    }).filter(Boolean);

    // Sort by highest churn risk first
    return assessed.sort((a, b) => b.churnProbability - a.churnProbability);
  }
}

export const churnPredictionService = new ChurnPredictionService();
export default churnPredictionService;
