/**
 * HisabKitab 360 - Intelligent Customer Credit Scoring & Risk Assessment (Tip 42)
 * Computes multidimensional creditworthiness score (0 to 100), risk tiers,
 * repayment velocity, and dynamic credit limit recommendation.
 */

class CustomerCreditScoringService {
  /**
   * Calculate customer credit score
   * @param {Object} customer - Customer record
   * @param {Array} transactions - Customer transaction history
   * @returns {Object} Score evaluation details
   */
  evaluateCreditScore(customer, transactions = []) {
    if (!customer) return null;

    const totalDue = Number(customer.balance || customer.due || customer.currentDue || 0);
    const creditLimit = Number(customer.creditLimit || 50000);
    const customerId = customer.id;

    // Filter relevant customer transactions
    const custTxs = transactions.filter(t => t.customerId === customerId || t.customerPhone === customer.phone);

    // 1. Repayment Punctuality Metric (0 - 35 points)
    let totalPurchases = 0;
    let totalPayments = 0;
    let onTimePayments = 0;
    let delayedPayments = 0;

    custTxs.forEach(tx => {
      const type = (tx.type || '').toUpperCase();
      const amount = Number(tx.amount || tx.total || 0);
      if (type.includes('SALE') || type.includes('PURCHASE') || type.includes('DUE')) {
        totalPurchases += amount;
      } else if (type.includes('PAYMENT') || type.includes('RECEIVE') || type.includes('COLLECT')) {
        totalPayments += amount;
        // Check days to settle
        const daysToPay = tx.daysToPay || 7;
        if (daysToPay <= 15) {
          onTimePayments++;
        } else {
          delayedPayments++;
        }
      }
    });

    const totalSettlements = onTimePayments + delayedPayments;
    const punctualityRatio = totalSettlements > 0 ? onTimePayments / totalSettlements : 0.8;
    const punctualityScore = Math.round(punctualityRatio * 35);

    // 2. Debt-to-Turnover Ratio Metric (0 - 25 points)
    // Low debt relative to overall business volume is good
    let debtRatioScore = 25;
    if (totalPurchases > 0) {
      const debtRatio = totalDue / totalPurchases;
      if (debtRatio > 0.8) debtRatioScore = 5;
      else if (debtRatio > 0.5) debtRatioScore = 12;
      else if (debtRatio > 0.25) debtRatioScore = 18;
      else debtRatioScore = 25;
    } else if (totalDue > 0) {
      debtRatioScore = 10;
    }

    // 3. Credit Limit Utilization Metric (0 - 20 points)
    let limitUtilizationScore = 20;
    if (creditLimit > 0) {
      const utilization = (totalDue / creditLimit) * 100;
      if (utilization >= 100) limitUtilizationScore = 0;
      else if (utilization >= 80) limitUtilizationScore = 6;
      else if (utilization >= 50) limitUtilizationScore = 14;
      else limitUtilizationScore = 20;
    }

    // 4. Loyalty & Longevity Metric (0 - 20 points)
    const createdAt = new Date(customer.createdAt || customer.created_at || '2025-01-01').getTime();
    const monthsActive = Math.max(1, Math.floor((Date.now() - createdAt) / (30 * 24 * 60 * 60 * 1000)));
    const loyaltyScore = Math.min(20, Math.round(monthsActive * 2 + (custTxs.length * 0.5)));

    // Total Score (0 - 100)
    const overallScore = Math.min(100, Math.max(0, punctualityScore + debtRatioScore + limitUtilizationScore + loyaltyScore));

    // Determine Risk Tier
    let riskTier = 'TIER_A';
    let riskLabelBn = 'সবুজ - অত্যন্ত বিশ্বস্ত (Low Risk)';
    let badgeColor = '#10B981';
    let recommendedAction = 'সর্বোচ্চ বাকির সুবিধা অনুমোদনযোগ্য';
    let suggestedCreditCeiling = Math.round(creditLimit * 1.5);

    if (overallScore < 40) {
      riskTier = 'TIER_D';
      riskLabelBn = 'লাল - উচ্চ ঝুঁকিপূর্ণ / বকেয়া অনাদায়ী (Critical Risk)';
      badgeColor = '#EF4444';
      recommendedAction = 'নতুন বাকি সম্পূর্ণ স্থগিত রাখুন ও বকেয়া আদায়ের তাগাদা পাঠান';
      suggestedCreditCeiling = 0;
    } else if (overallScore < 60) {
      riskTier = 'TIER_C';
      riskLabelBn = 'কমলা - মাঝারি ঝুঁকি (Moderate Risk)';
      badgeColor = '#F59E0B';
      recommendedAction = 'সীমিত বাকি ও তাৎক্ষণিক কিস্তি আদায়ে জোর দিন';
      suggestedCreditCeiling = Math.round(creditLimit * 0.5);
    } else if (overallScore < 75) {
      riskTier = 'TIER_B';
      riskLabelBn = 'হলুদ - সন্তোষজনক (Good Standing)';
      badgeColor = '#3B82F6';
      recommendedAction = 'স্বাভাবিক বাকির সুবিধা বহাল রাখুন';
      suggestedCreditCeiling = creditLimit;
    }

    return {
      customerId,
      customerName: customer.name || 'সম্মানিত কাস্টমার',
      phone: customer.phone || 'N/A',
      score: overallScore,
      riskTier,
      riskLabelBn,
      badgeColor,
      totalDue,
      currentCreditLimit: creditLimit,
      suggestedCreditCeiling,
      recommendedAction,
      breakdown: {
        punctualityScore,
        debtRatioScore,
        limitUtilizationScore,
        loyaltyScore
      }
    };
  }

  /**
   * Evaluate all customers and rank by risk
   */
  evaluateAllCustomers(customers = [], transactions = []) {
    if (!Array.isArray(customers) || customers.length === 0) return [];
    return customers.map(c => this.evaluateCreditScore(c, transactions))
      .sort((a, b) => a.score - b.score); // Riskiest first
  }
}

export const customerCreditScoringService = new CustomerCreditScoringService();
export default customerCreditScoringService;
