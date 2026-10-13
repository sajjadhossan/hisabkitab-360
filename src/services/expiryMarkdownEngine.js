/**
 * HisabKitab 360 - Dynamic Expiry Markdown & Clearance Engine (Tip 46)
 * FEFO-driven automated markdown discounting engine for near-expiry FMCG, groceries,
 * and pharmaceuticals. Prevents dead-loss write-offs through staged clearance pricing.
 */

class ExpiryMarkdownEngine {
  /**
   * Evaluate a single product batch for expiry clearance discount
   * @param {Object} item - Product or batch object
   * @returns {Object} Markdown recommendation
   */
  evaluateExpiryMarkdown(item) {
    if (!item) return null;

    const basePrice = Number(item.sellingPrice || item.price || item.unitPrice || 0);
    const costPrice = Number(item.costPrice || item.purchasePrice || basePrice * 0.8);
    const stockQty = Number(item.stock || item.quantity || 0);
    const expiryDateStr = item.expiryDate || item.expireDate || item.expDate;

    if (!expiryDateStr) {
      return {
        productId: item.id,
        name: item.name || 'Unknown',
        hasExpiry: false,
        daysRemaining: 999,
        discountPercent: 0,
        markdownPrice: basePrice,
        tier: 'FRESH'
      };
    }

    const now = Date.now();
    const expiryTime = new Date(expiryDateStr).getTime();
    const diffMs = expiryTime - now;
    const daysRemaining = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

    let discountPercent = 0;
    let tier = 'FRESH';
    let urgencyBn = 'তাজা স্টক (কোনো ছাড় প্রয়োজন নেই)';
    let badgeColor = '#10B981';

    if (daysRemaining <= 0) {
      tier = 'EXPIRED';
      discountPercent = 100;
      urgencyBn = 'মেয়াদোত্তীর্ণ! অবিলম্বে তাক থেকে সরিয়ে ফেলুন';
      badgeColor = '#DC2626';
    } else if (daysRemaining <= 7) {
      tier = 'CLEARANCE_URGENT';
      discountPercent = 50; // 50% off
      urgencyBn = 'জরুরি ক্লিয়ারেন্স ছাড় (৫০% ছাড়)';
      badgeColor = '#EF4444';
    } else if (daysRemaining <= 15) {
      tier = 'CLEARANCE_MEDIUM';
      discountPercent = 25; // 25% off
      urgencyBn = 'মাঝারি ক্লিয়ারেন্স ছাড় (২৫% ছাড়)';
      badgeColor = '#F59E0B';
    } else if (daysRemaining <= 30) {
      tier = 'PROMOTIONAL';
      discountPercent = 10; // 10% off
      urgencyBn = 'অগ্রিম ডিসকাউন্ট অফার (১০% ছাড়)';
      badgeColor = '#3B82F6';
    }

    const discountAmount = Number(((basePrice * discountPercent) / 100).toFixed(2));
    const markdownPrice = Math.max(0, Number((basePrice - discountAmount).toFixed(2)));
    const potentialDeadLoss = tier === 'EXPIRED' ? stockQty * costPrice : 0;
    const projectedClearanceRecovery = tier !== 'EXPIRED' ? stockQty * markdownPrice : 0;

    return {
      productId: item.id,
      name: item.name || 'পণ্য',
      batchNo: item.batchNo || 'B-01',
      expiryDate: expiryDateStr,
      daysRemaining,
      basePrice,
      costPrice,
      stockQty,
      discountPercent,
      discountAmount,
      markdownPrice,
      tier,
      urgencyBn,
      badgeColor,
      potentialDeadLoss,
      projectedClearanceRecovery,
      shouldMarkdown: discountPercent > 0 && tier !== 'EXPIRED'
    };
  }

  /**
   * Audit complete inventory and group by clearance tiers
   */
  auditInventoryExpiry(products = []) {
    if (!Array.isArray(products) || products.length === 0) return { items: [], summary: {} };

    const evaluated = products.map(p => this.evaluateExpiryMarkdown(p)).filter(Boolean);

    let totalExpiredLoss = 0;
    let totalClearancePotential = 0;
    let urgentItemsCount = 0;

    evaluated.forEach(e => {
      if (e.tier === 'EXPIRED') totalExpiredLoss += e.potentialDeadLoss;
      else if (e.shouldMarkdown) {
        totalClearancePotential += e.projectedClearanceRecovery;
        if (e.tier === 'CLEARANCE_URGENT') urgentItemsCount++;
      }
    });

    // Sort: most urgent expiry first
    evaluated.sort((a, b) => a.daysRemaining - b.daysRemaining);

    return {
      items: evaluated,
      summary: {
        totalItemsAudited: evaluated.length,
        urgentItemsCount,
        totalExpiredLoss,
        totalClearancePotential
      }
    };
  }
}

export const expiryMarkdownEngine = new ExpiryMarkdownEngine();
export default expiryMarkdownEngine;
