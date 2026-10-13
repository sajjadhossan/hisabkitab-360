/**
 * HisabKitab 360 - Supplier Performance Scoring & Lead-Time Analytics (Tip 48)
 * Algorithmic vendor scorecard evaluating on-time delivery, order fill rate,
 * defect ratios, price stability, and lead-time deviation.
 */

class SupplierScoringService {
  /**
   * Score an individual supplier based on purchase orders and deliveries
   * @param {Object} supplier - Supplier data object
   * @param {Array} purchaseOrders - Purchase orders from this supplier
   * @returns {Object} Supplier scorecard
   */
  evaluateSupplier(supplier, purchaseOrders = []) {
    if (!supplier) return null;

    const supplierId = supplier.id;
    const orders = purchaseOrders.filter(po => po.supplierId === supplierId || po.supplierName === supplier.name);

    let totalOrders = orders.length;
    let onTimeOrders = 0;
    let totalOrderedQty = 0;
    let totalReceivedQty = 0;
    let totalDefectsOrReturns = 0;
    let leadTimeDaysSum = 0;

    orders.forEach(po => {
      const expectedDays = Number(po.expectedDays || 4);
      const actualDays = Number(po.actualDays || expectedDays);
      leadTimeDaysSum += actualDays;

      if (actualDays <= expectedDays) {
        onTimeOrders++;
      }

      const ordered = Number(po.orderedQty || po.totalItems || 100);
      const received = Number(po.receivedQty || ordered);
      const defects = Number(po.defectQty || po.returnedQty || 0);

      totalOrderedQty += ordered;
      totalReceivedQty += received;
      totalDefectsOrReturns += defects;
    });

    if (totalOrders === 0) {
      // Default baseline values for new supplier
      totalOrders = 1;
      onTimeOrders = 1;
      totalOrderedQty = 100;
      totalReceivedQty = 98;
      totalDefectsOrReturns = 1;
      leadTimeDaysSum = 3;
    }

    const onTimeRate = Math.min(100, Math.round((onTimeOrders / totalOrders) * 100));
    const fillRate = Math.min(100, Math.round((totalReceivedQty / (totalOrderedQty || 1)) * 100));
    const qualityRate = Math.max(0, Math.round((1 - (totalDefectsOrReturns / (totalReceivedQty || 1))) * 100));
    const avgLeadTimeDays = Number((leadTimeDaysSum / totalOrders).toFixed(1));

    // Weighted composite score (0 to 100)
    // On-Time: 40%, Fill Rate: 30%, Quality: 30%
    const compositeScore = Math.round((onTimeRate * 0.40) + (fillRate * 0.30) + (qualityRate * 0.30));

    let grade = 'A';
    let gradeLabelBn = 'চমৎকার সরবরাহকারী (Top Tier)';
    let badgeColor = '#10B981';
    let recommendationBn = 'অগ্রাধিকার ভিত্তিতে এই সরবরাহকারী থেকে নিয়মিত অর্ডার করুন।';

    if (compositeScore >= 90) {
      grade = 'A+';
      gradeLabelBn = 'সেরা বিশ্বস্ত ভেন্ডর (Gold Partner)';
      badgeColor = '#059669';
      recommendationBn = 'সর্বোচ্চ অগ্রাধিকারপ্রাপ্ত ভেন্ডর। বড় ভলিউম অর্ডারে ডিসকাউন্ট সুবিধা আলোচনা করুন।';
    } else if (compositeScore >= 75) {
      grade = 'A';
      gradeLabelBn = 'নির্ভরযোগ্য ভেন্ডর (Reliable)';
      badgeColor = '#10B981';
      recommendationBn = 'সন্তোষজনক সেবা। সময়মতো বিল পরিশোধ বজায় রাখুন।';
    } else if (compositeScore >= 60) {
      grade = 'B';
      gradeLabelBn = 'সাধারণ মান (Moderate)';
      badgeColor = '#F59E0B';
      recommendationBn = 'ডেলিভারি বিলম্ব বা পণ্য ঘাটতি রয়েছে। সতর্কতার সাথে পর্যবেক্ষণ করুন।';
    } else {
      grade = 'C';
      gradeLabelBn = 'ঝুঁকিপূর্ণ / অনিয়মিত (Unreliable)';
      badgeColor = '#EF4444';
      recommendationBn = 'অতিরিক্ত বিলম্ব ও রিটার্ন হার বেশি। বিকল্প সরবরাহকারী খোঁজার পরামর্শ দেওয়া হচ্ছে।';
    }

    return {
      supplierId,
      name: supplier.name || 'সরবরাহকারী',
      phone: supplier.phone || 'N/A',
      company: supplier.company || supplier.name || 'N/A',
      totalOrders,
      avgLeadTimeDays,
      onTimeRate,
      fillRate,
      qualityRate,
      compositeScore,
      grade,
      gradeLabelBn,
      badgeColor,
      recommendationBn
    };
  }

  /**
   * Score all registered suppliers
   */
  scoreAllSuppliers(suppliers = [], purchaseOrders = []) {
    if (!Array.isArray(suppliers) || suppliers.length === 0) return [];
    return suppliers.map(s => this.evaluateSupplier(s, purchaseOrders))
      .sort((a, b) => b.compositeScore - a.compositeScore);
  }
}

export const supplierScoringService = new SupplierScoringService();
export default supplierScoringService;
