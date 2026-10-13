/**
 * HisabKitab 360 - Wholesale vs Retail Dynamic Tier Pricing Engine (Tip 50)
 * Real-time quantity-break volume pricing and customer-tier discount matrix.
 * Recalculates unit prices dynamically during POS cart mutations.
 */

class DynamicTierPricingEngine {
  /**
   * Determine the effective unit price and discount tier for a product & quantity
   * @param {Object} product - Product with base price and optional custom tiers
   * @param {number} quantity - Purchased quantity
   * @param {string} customerType - 'RETAIL' | 'WHOLESALE' | 'VIP'
   * @returns {Object} Tier pricing breakdown
   */
  calculateTierPrice(product, quantity = 1, customerType = 'RETAIL') {
    if (!product) return null;

    const baseRetailPrice = Number(product.sellingPrice || product.price || 0);
    const costPrice = Number(product.costPrice || product.purchasePrice || baseRetailPrice * 0.75);
    const qty = Math.max(1, Number(quantity || 1));

    // Custom tiers if defined on product, otherwise use enterprise defaults
    const tiers = product.customTiers || [
      { minQty: 1, maxQty: 5, tierName: 'RETAIL', nameBn: 'খুচরা মূল্য (Retail)', discountPercent: 0 },
      { minQty: 6, maxQty: 24, tierName: 'SEMI_WHOLESALE', nameBn: 'সেমি-পাইকারি (Semi-Wholesale)', discountPercent: 6 },
      { minQty: 25, maxQty: 99, tierName: 'WHOLESALE', nameBn: 'পাইকারি রেট (Wholesale)', discountPercent: 12 },
      { minQty: 100, maxQty: Infinity, tierName: 'DISTRIBUTOR', nameBn: 'ডিলার / বাল্ক রেট (Distributor)', discountPercent: 18 }
    ];

    // Find tier matching quantity
    let matchedTier = tiers.find(t => qty >= t.minQty && qty <= t.maxQty);
    if (!matchedTier) {
      matchedTier = tiers[0];
    }

    let discountPercent = matchedTier.discountPercent;

    // Additional customer VIP / Wholesale multiplier
    if (customerType === 'WHOLESALE' && discountPercent < 12) {
      discountPercent = 12; // Wholesale customers always get at least wholesale tier
      matchedTier = {
        tierName: 'WHOLESALE_OVERRIDE',
        nameBn: 'পাইকারি গ্রাহক বিশেষ দর (Wholesale VIP)',
        discountPercent: 12
      };
    } else if (customerType === 'VIP') {
      discountPercent = Math.min(25, discountPercent + 3);
    }

    const unitDiscount = Number(((baseRetailPrice * discountPercent) / 100).toFixed(2));
    const effectiveUnitPrice = Math.max(costPrice, Number((baseRetailPrice - unitDiscount).toFixed(2)));
    const lineTotal = Number((effectiveUnitPrice * qty).toFixed(2));
    const totalSavings = Number(((baseRetailPrice - effectiveUnitPrice) * qty).toFixed(2));
    const profitMargin = Number(((effectiveUnitPrice - costPrice) * qty).toFixed(2));

    return {
      productId: product.id,
      productName: product.name || 'পণ্য',
      quantity: qty,
      baseRetailPrice,
      costPrice,
      activeTier: matchedTier.tierName,
      tierNameBn: matchedTier.nameBn,
      discountPercent,
      effectiveUnitPrice,
      lineTotal,
      totalSavings,
      profitMargin,
      isDiscounted: discountPercent > 0
    };
  }

  /**
   * Recalculate entire cart with dynamic tier pricing
   */
  evaluateCart(cartItems = [], customerType = 'RETAIL') {
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return { items: [], cartSubtotal: 0, totalSavings: 0 };
    }

    const items = cartItems.map(item => {
      const tierResult = this.calculateTierPrice(item, item.quantity || 1, customerType);
      return {
        ...item,
        tierPricing: tierResult,
        unitPrice: tierResult.effectiveUnitPrice,
        total: tierResult.lineTotal
      };
    });

    const cartSubtotal = items.reduce((sum, i) => sum + i.total, 0);
    const totalSavings = items.reduce((sum, i) => sum + (i.tierPricing?.totalSavings || 0), 0);

    return {
      items,
      cartSubtotal: Number(cartSubtotal.toFixed(2)),
      totalSavings: Number(totalSavings.toFixed(2))
    };
  }
}

export const dynamicTierPricingEngine = new DynamicTierPricingEngine();
export default dynamicTierPricingEngine;
