/**
 * HisabKitab 360 - Predictive Inventory Stockout Forecasting Service (Tip 41)
 * Analyzes sales velocity, historical trends, and lead times to predict stockout dates,
 * safety stock requirements, and optimal reorder points.
 */

class PredictiveStockForecastingService {
  /**
   * Calculate daily sales velocity and stockout projections
   * @param {Object} product - Product data object
   * @param {Array} salesHistory - Historical sales list
   * @param {number} leadTimeDays - Supplier lead time in days (default 5)
   * @returns {Object} Forecast metrics
   */
  forecastStockout(product, salesHistory = [], leadTimeDays = 5) {
    if (!product) return null;

    const currentStock = Number(product.stock || product.quantity || 0);
    const productId = product.id;

    // Filter sales relevant to this product
    const relevantSales = salesHistory.filter(s => {
      if (Array.isArray(s.items)) {
        return s.items.some(i => i.id === productId || i.productId === productId);
      }
      return false;
    });

    // Calculate sales over the past 30 days
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    let unitsSold30d = 0;
    let unitsSold7d = 0;

    relevantSales.forEach(sale => {
      const saleTime = new Date(sale.date || sale.timestamp || sale.createdAt).getTime();
      const item = (sale.items || []).find(i => i.id === productId || i.productId === productId);
      const qty = Number(item?.quantity || item?.qty || 0);

      if (saleTime >= thirtyDaysAgo) {
        unitsSold30d += qty;
      }
      if (saleTime >= sevenDaysAgo) {
        unitsSold7d += qty;
      }
    });

    // Weighted Daily Run Rate (7-day velocity gets 65% weight, 30-day velocity gets 35%)
    const dailyVelocity7d = unitsSold7d / 7;
    const dailyVelocity30d = unitsSold30d / 30;
    const dailyRunRate = (dailyVelocity7d * 0.65) + (dailyVelocity30d * 0.35);

    // If no sales history, assign minimal conservative estimate
    const effectiveRunRate = dailyRunRate > 0 ? dailyRunRate : 0.1;

    // Days until stockout
    const daysUntilStockout = effectiveRunRate > 0 ? Math.floor(currentStock / effectiveRunRate) : 999;
    const stockoutDate = new Date(now + daysUntilStockout * 24 * 60 * 60 * 1000);

    // Reorder Point (ROP) = (Lead Time * Daily Run Rate) + Safety Stock
    const safetyStock = Math.ceil(effectiveRunRate * Math.sqrt(leadTimeDays) * 1.65); // 95% service level
    const reorderPoint = Math.ceil((leadTimeDays * effectiveRunRate) + safetyStock);

    // Recommended Order Quantity (EOQ estimate or 15 days of stock)
    const suggestedReorderQty = Math.max(reorderPoint * 2, Math.ceil(effectiveRunRate * 21));

    let urgency = 'NORMAL';
    if (daysUntilStockout <= leadTimeDays) {
      urgency = 'CRITICAL'; // Will run out before new delivery arrives!
    } else if (daysUntilStockout <= leadTimeDays * 2) {
      urgency = 'WARNING';
    } else if (currentStock === 0) {
      urgency = 'DEPLETED';
    }

    return {
      productId,
      productName: product.name || product.title || 'Unknown Product',
      currentStock,
      dailyRunRate: Number(effectiveRunRate.toFixed(2)),
      unitsSold7d,
      unitsSold30d,
      daysUntilStockout: daysUntilStockout > 999 ? '৯৯৯+' : daysUntilStockout,
      stockoutDateFormatted: stockoutDate.toISOString().split('T')[0],
      safetyStock,
      reorderPoint,
      suggestedReorderQty,
      urgency,
      isReorderNeeded: currentStock <= reorderPoint
    };
  }

  /**
   * Run bulk batch forecast across entire inventory
   */
  forecastInventory(products = [], salesHistory = [], leadTimeDays = 5) {
    if (!Array.isArray(products) || products.length === 0) return [];

    const forecasts = products.map(p => this.forecastStockout(p, salesHistory, leadTimeDays));
    
    // Sort by most critical stockout urgency first
    return forecasts.sort((a, b) => {
      const urgencyScore = { DEPLETED: 4, CRITICAL: 3, WARNING: 2, NORMAL: 1 };
      const diff = urgencyScore[b.urgency] - urgencyScore[a.urgency];
      if (diff !== 0) return diff;
      return (typeof a.daysUntilStockout === 'number' ? a.daysUntilStockout : 999) - 
             (typeof b.daysUntilStockout === 'number' ? b.daysUntilStockout : 999);
    });
  }
}

export const predictiveStockForecastingService = new PredictiveStockForecastingService();
export default predictiveStockForecastingService;
