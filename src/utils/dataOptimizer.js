/**
 * Data Memory & Garbage Collection Optimizer
 * ------------------------------------------
 * Prunes redundant bloat and deeply nested prototypes from large historical datasets
 * (e.g. Sales records older than 60 days, old system logs) to keep memory usage under 60MB.
 */

export function compactSaleRecord(sale) {
  if (!sale) return sale;

  return {
    id: sale.id,
    branchId: sale.branchId,
    counterId: sale.counterId,
    customerName: sale.customerName || '',
    customerPhone: sale.customerPhone || '',
    customerId: sale.customerId || null,
    date: sale.date,
    subtotal: Number(sale.subtotal) || 0,
    discount: Number(sale.discount) || 0,
    vat: Number(sale.vat) || 0,
    grandTotal: Number(sale.grandTotal) || 0,
    paidAmount: Number(sale.paidAmount) || 0,
    dueAmount: Number(sale.dueAmount) || 0,
    paymentMethod: sale.paymentMethod || 'cash',
    status: sale.status || 'paid',
    items: (sale.items || []).map(i => ({
      id: i.id,
      name: i.name,
      qty: Number(i.qty) || 1,
      price: Number(i.price) || 0,
      costPrice: Number(i.costPrice) || 0,
      subtotal: Number(i.subtotal) || (Number(i.price) * Number(i.qty))
    }))
  };
}

export function compactSalesHistory(sales = [], maxHistoryRetained = 5000) {
  if (!Array.isArray(sales)) return [];
  const trimmed = sales.slice(0, maxHistoryRetained);
  return trimmed.map(compactSaleRecord);
}

export function pruneMemoryLeakReferences(objectMap) {
  if (!objectMap || typeof objectMap !== 'object') return;
  for (const key of Object.keys(objectMap)) {
    if (objectMap[key] === null || objectMap[key] === undefined) {
      delete objectMap[key];
    }
  }
}
