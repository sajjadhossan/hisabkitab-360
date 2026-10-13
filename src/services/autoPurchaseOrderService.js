/**
 * HisabKitab 360 - Automated Supplier Purchase Requisition Service
 * -----------------------------------------------------------------
 * Tip 7: Scans inventory for depleted products and automatically prepares
 * optimized draft purchase orders (PO) grouped by primary supplier.
 */

class AutoPurchaseOrderService {
  /**
   * Scan products and generate automated replenishment list
   * @param {Array} products - List of inventory items
   */
  generateReplenishmentOrders(products = []) {
    const lowStockItems = products.filter(p => {
      const stock = Number(p.stock) || 0;
      const minStock = Number(p.minStock || p.min_stock || p.reorderLevel || 5);
      return stock <= minStock;
    });

    // Group items by supplier
    const supplierGroups = {};

    lowStockItems.forEach(item => {
      const supplierName = item.supplier || item.supplier_name || 'সাধারণ সরবরাহকারী';
      if (!supplierGroups[supplierName]) {
        supplierGroups[supplierName] = [];
      }

      const currentStock = Number(item.stock) || 0;
      const targetStock = Number(item.targetStock || item.max_stock || 20);
      const suggestedQty = Math.max(1, targetStock - currentStock);
      const costPrice = Number(item.costPrice || item.cost_price || item.buyPrice || 0);

      supplierGroups[supplierName].push({
        id: item.id,
        name: item.name,
        currentStock,
        suggestedQty,
        costPrice,
        estimatedTotal: suggestedQty * costPrice
      });
    });

    const orders = Object.entries(supplierGroups).map(([supplier, items]) => {
      const totalAmount = items.reduce((sum, it) => sum + it.estimatedTotal, 0);
      return {
        id: `PO_AUTO_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        supplier,
        createdAt: new Date().toISOString(),
        itemCount: items.length,
        items,
        totalAmount,
        status: 'DRAFT_PENDING_APPROVAL'
      };
    });

    return {
      totalLowStockItems: lowStockItems.length,
      ordersGenerated: orders.length,
      orders
    };
  }
}

export const autoPurchaseOrderService = new AutoPurchaseOrderService();
