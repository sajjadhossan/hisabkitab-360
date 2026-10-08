/**
 * Non-blocking Async Worker Engine for HisabKitab 360
 * ----------------------------------------------------
 * Executes heavy calculations (COGS, large sales aggregation, CSV processing)
 * without blocking the 60fps/120fps UI render thread on Android devices.
 */

export const scheduleBackgroundJob = (jobFn, timeoutMs = 2000) => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    return window.requestIdleCallback(
      (deadline) => {
        try {
          jobFn(deadline);
        } catch (e) {
          console.warn('Background job error:', e);
        }
      },
      { timeout: timeoutMs }
    );
  }
  return setTimeout(jobFn, 10);
};

export const runChunkedTask = async (items = [], processorFn, chunkSize = 50) => {
  return new Promise((resolve) => {
    let index = 0;
    const results = [];

    function processBatch() {
      const end = Math.min(index + chunkSize, items.length);
      for (; index < end; index++) {
        results.push(processorFn(items[index], index));
      }

      if (index < items.length) {
        scheduleBackgroundJob(processBatch, 100);
      } else {
        resolve(results);
      }
    }

    if (items.length === 0) {
      resolve([]);
    } else {
      processBatch();
    }
  });
};

/**
 * Calculates COGS and gross profits asynchronously in chunks to prevent UI lag
 */
export const calculateAsyncSalesMetrics = async (sales = []) => {
  return new Promise((resolve) => {
    scheduleBackgroundJob(() => {
      let totalAmount = 0;
      let totalProfit = 0;
      let totalCogs = 0;

      for (let i = 0; i < sales.length; i++) {
        const s = sales[i];
        const grand = Number(s.grandTotal) || Number(s.paidAmount) || 0;
        totalAmount += grand;

        let saleCost = 0;
        (s.items || []).forEach((item) => {
          const cost = Number(item.costPrice) || 0;
          const qty = Number(item.qty) || 1;
          saleCost += cost * qty;
        });

        totalCogs += saleCost;
        totalProfit += Math.max(0, grand - saleCost);
      }

      resolve({
        totalSales: totalAmount,
        totalCogs,
        estimatedProfit: totalProfit,
        salesCount: sales.length
      });
    }, 500);
  });
};
