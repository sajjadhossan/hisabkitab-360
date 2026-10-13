/**
 * HisabKitab 360 - FEFO / Lot & Expiry Batch Tracking Engine (Feature 2)
 * ---------------------------------------------------------------------
 * Implements First-Expiry-First-Out (FEFO) inventory management:
 * - Products can have multiple batches/lots with distinct expiry dates & cost prices.
 * - At checkout/sale, automatically allocates deductions from the earliest expiring batch.
 * - Real-time expiry alerts (Expired vs Near-Expiry <= 30 days).
 * - Automatic batch traceability on invoices and receipts.
 */

/**
 * Evaluates the expiry health status of a batch
 * @param {string} expiryDate - Format 'YYYY-MM-DD'
 * @param {number} warningDays - Default 30 days
 * @returns {'expired' | 'critical' | 'warning' | 'healthy'}
 */
export function getBatchHealth(expiryDate, warningDays = 30) {
  if (!expiryDate) return 'healthy';

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'expired';
  if (diffDays <= 7) return 'critical';
  if (diffDays <= warningDays) return 'warning';
  return 'healthy';
}

/**
 * Calculates days remaining until batch expiry
 */
export function getDaysUntilExpiry(expiryDate) {
  if (!expiryDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Allocates stock deduction from a product using First-Expiry-First-Out (FEFO)
 * @param {object} product - Product object with optional batches array
 * @param {number} qtyToDeduct - Quantity requested for checkout
 * @returns {{
 *   updatedProduct: object,
 *   deductions: Array<{batchNo: string, expiryDate: string, qty: number, costPrice: number}>,
 *   unallocatedQty: number
 * }}
 */
export function allocateFefoStockDeduction(product, qtyToDeduct) {
  const reqQty = Number(qtyToDeduct) || 0;
  if (reqQty <= 0) {
    return { updatedProduct: product, deductions: [], unallocatedQty: 0 };
  }

  // If product has no explicit batches, simple deduction
  if (!Array.isArray(product.batches) || product.batches.length === 0) {
    const nextStock = Math.max(0, (Number(product.stock) || 0) - reqQty);
    return {
      updatedProduct: {
        ...product,
        stock: nextStock
      },
      deductions: [
        {
          batchNo: product.batchNo || 'DEFAULT-LOT',
          expiryDate: product.expiryDate || null,
          qty: reqQty,
          costPrice: Number(product.costPrice) || 0
        }
      ],
      unallocatedQty: 0
    };
  }

  // Sort batches by earliest expiry date first (FEFO rule)
  // Batches with no expiry are prioritized last
  const sortedBatches = [...product.batches].sort((a, b) => {
    if (!a.expiryDate) return 1;
    if (!b.expiryDate) return -1;
    return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
  });

  let remaining = reqQty;
  const deductions = [];
  const updatedBatches = [];

  for (const b of sortedBatches) {
    const available = Number(b.stock) || 0;
    if (available <= 0) {
      updatedBatches.push(b);
      continue;
    }

    if (remaining <= 0) {
      updatedBatches.push(b);
      continue;
    }

    const deductAmount = Math.min(available, remaining);
    const newStock = available - deductAmount;
    remaining -= deductAmount;

    deductions.push({
      batchNo: b.batchNo || 'LOT-AUTO',
      expiryDate: b.expiryDate || null,
      qty: deductAmount,
      costPrice: Number(b.costPrice ?? product.costPrice ?? 0)
    });

    updatedBatches.push({
      ...b,
      stock: newStock
    });
  }

  // Calculate total stock remaining across all batches
  const totalBatchStock = updatedBatches.reduce((acc, b) => acc + (Number(b.stock) || 0), 0);

  return {
    updatedProduct: {
      ...product,
      stock: totalBatchStock,
      batches: updatedBatches
    },
    deductions,
    unallocatedQty: remaining
  };
}

/**
 * Scan all inventory products to find batches that are expired or expiring soon
 * @param {Array} products - Product list
 * @param {number} warningDays - Days threshold (default 30)
 * @returns {Array<{product: object, batch: object, status: string, daysLeft: number}>}
 */
export function getExpiringBatchesSummary(products = [], warningDays = 30) {
  const alerts = [];

  for (const p of products) {
    if (Array.isArray(p.batches) && p.batches.length > 0) {
      for (const b of p.batches) {
        if (!b.expiryDate || (Number(b.stock) || 0) <= 0) continue;
        const status = getBatchHealth(b.expiryDate, warningDays);
        if (status !== 'healthy') {
          alerts.push({
            productId: p.id,
            productName: p.name,
            batchNo: b.batchNo,
            expiryDate: b.expiryDate,
            stock: b.stock,
            status,
            daysLeft: getDaysUntilExpiry(b.expiryDate)
          });
        }
      }
    } else if (p.expiryDate && (Number(p.stock) || 0) > 0) {
      const status = getBatchHealth(p.expiryDate, warningDays);
      if (status !== 'healthy') {
        alerts.push({
          productId: p.id,
          productName: p.name,
          batchNo: p.batchNo || 'MAIN-LOT',
          expiryDate: p.expiryDate,
          stock: p.stock,
          status,
          daysLeft: getDaysUntilExpiry(p.expiryDate)
        });
      }
    }
  }

  // Sort with expired and critical first
  alerts.sort((a, b) => a.daysLeft - b.daysLeft);
  return alerts;
}

/**
 * Add or receive a new batch lot to a product
 */
export function addBatchToProduct(product, newBatch) {
  const existingBatches = Array.isArray(product.batches) ? [...product.batches] : [];
  const batchEntry = {
    batchNo: newBatch.batchNo || `LOT-${Date.now().toString().slice(-6)}`,
    expiryDate: newBatch.expiryDate || null,
    mfgDate: newBatch.mfgDate || null,
    stock: Number(newBatch.stock) || 0,
    costPrice: Number(newBatch.costPrice ?? product.costPrice ?? 0)
  };

  const updatedBatches = [...existingBatches, batchEntry];
  const totalStock = updatedBatches.reduce((acc, b) => acc + (Number(b.stock) || 0), 0);

  return {
    ...product,
    stock: totalStock,
    batches: updatedBatches
  };
}
