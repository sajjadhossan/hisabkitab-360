/**
 * Dedicated Web Worker Client Service
 * -----------------------------------
 * Communicates with calcWorker.js asynchronously.
 * Automatically falls back to requestIdleCallback / microtasks if Web Workers are unsupported.
 */

let workerInstance = null;
let reqCounter = 0;
const pendingJobs = new Map();

function getWorker() {
  if (typeof window === 'undefined') return null;

  if (!workerInstance && typeof Worker !== 'undefined') {
    try {
      workerInstance = new Worker(
        new URL('../workers/calcWorker.js', import.meta.url),
        { type: 'module' }
      );

      workerInstance.onmessage = (e) => {
        const { id, success, result, error } = e.data || {};
        if (pendingJobs.has(id)) {
          const { resolve, reject } = pendingJobs.get(id);
          pendingJobs.delete(id);
          if (success) {
            resolve(result);
          } else {
            reject(new Error(error || 'Worker execution failed'));
          }
        }
      };

      workerInstance.onerror = (err) => {
        console.warn('CalcWorker error, falling back to main-thread async fallback:', err);
      };
    } catch (e) {
      console.warn('Could not initialize Worker module, using non-blocking fallback:', e);
      workerInstance = null;
    }
  }

  return workerInstance;
}

function postToWorker(type, payload) {
  const worker = getWorker();
  const id = ++reqCounter;

  if (worker) {
    return new Promise((resolve, reject) => {
      pendingJobs.set(id, { resolve, reject });
      worker.postMessage({ id, type, payload });
    });
  }

  // Graceful Non-blocking Fallback (runs in setTimeout/idle callback)
  return new Promise((resolve) => {
    const runFallback = () => {
      if (type === 'CALCULATE_SALES_METRICS') {
        const sales = payload?.sales || [];
        let totalRevenue = 0, totalProfit = 0, totalCogs = 0, totalDiscounts = 0, totalTax = 0;
        const paymentMethods = {}, dailyBuckets = {};

        for (let i = 0; i < sales.length; i++) {
          const s = sales[i];
          const grand = Number(s.grandTotal) || Number(s.paidAmount) || 0;
          totalRevenue += grand;
          totalDiscounts += Number(s.discount) || 0;
          totalTax += Number(s.tax) || 0;
          paymentMethods[s.paymentMethod || 'cash'] = (paymentMethods[s.paymentMethod || 'cash'] || 0) + grand;

          let saleCost = 0;
          (s.items || []).forEach(item => {
            saleCost += (Number(item.costPrice) || 0) * (Number(item.qty) || 1);
          });
          totalCogs += saleCost;
          totalProfit += (grand - saleCost);

          const dateStr = (s.date || s.createdAt || '').slice(0, 10);
          if (dateStr) dailyBuckets[dateStr] = (dailyBuckets[dateStr] || 0) + grand;
        }

        resolve({
          totalRevenue,
          totalProfit,
          totalCogs,
          totalDiscounts,
          totalTax,
          paymentMethods,
          dailyBuckets,
          count: sales.length
        });
      } else if (type === 'FUZZY_SEARCH_PRODUCTS') {
        const products = payload?.products || [];
        const query = (payload?.query || '').trim().toLowerCase();
        if (!query) {
          resolve(products);
          return;
        }
        const tokens = query.split(/\s+/).filter(Boolean);
        const filtered = products.filter(p => {
          if (!p) return false;
          const name = String(p.name || '').toLowerCase();
          const barcode = String(p.barcode || '').toLowerCase();
          const sku = String(p.sku || '').toLowerCase();
          const cat = String(p.category || '').toLowerCase();
          return tokens.every(tok => name.includes(tok) || barcode.includes(tok) || sku.includes(tok) || cat.includes(tok));
        });
        resolve(filtered);
      } else {
        resolve(null);
      }
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(runFallback, { timeout: 100 });
    } else {
      setTimeout(runFallback, 0);
    }
  });
}

export function calculateSalesMetricsAsync(sales = []) {
  return postToWorker('CALCULATE_SALES_METRICS', { sales });
}

export function fuzzySearchProductsAsync(products = [], query = '') {
  return postToWorker('FUZZY_SEARCH_PRODUCTS', { products, query });
}

export function calculateFinancialSummaryAsync({ sales = [], bizExpenses = [], personalIncomes = [], personalExpenses = [] }) {
  return postToWorker('CALCULATE_FINANCIAL_SUMMARY', { sales, bizExpenses, personalIncomes, personalExpenses });
}
