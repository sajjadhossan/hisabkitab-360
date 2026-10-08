/**
 * HisabKitab 360 - Dedicated Background Web Worker
 * ------------------------------------------------
 * Offloads heavy financial calculations, aggregations, and fuzzy product searching
 * from the main thread so that UI clicks and 120 FPS animations stay 100% smooth.
 */

self.onmessage = function (e) {
  const { id, type, payload } = e.data || {};

  try {
    let result = null;

    switch (type) {
      case 'CALCULATE_SALES_METRICS': {
        const sales = payload?.sales || [];
        let totalRevenue = 0;
        let totalProfit = 0;
        let totalCogs = 0;
        let totalDiscounts = 0;
        let totalTax = 0;
        const paymentMethods = {};
        const dailyBuckets = {};

        for (let i = 0; i < sales.length; i++) {
          const s = sales[i];
          const grand = Number(s.grandTotal) || Number(s.paidAmount) || 0;
          totalRevenue += grand;
          totalDiscounts += Number(s.discount) || 0;
          totalTax += Number(s.tax) || 0;

          // Payment methods breakdown
          const method = s.paymentMethod || 'cash';
          paymentMethods[method] = (paymentMethods[method] || 0) + grand;

          // COGS & Profit
          let saleCost = 0;
          const items = s.items || [];
          for (let j = 0; j < items.length; j++) {
            const item = items[j];
            const cost = Number(item.costPrice) || 0;
            const qty = Number(item.qty) || 1;
            saleCost += cost * qty;
          }
          totalCogs += saleCost;
          totalProfit += (grand - saleCost);

          // Daily aggregation for fast charts
          const dateStr = (s.date || s.createdAt || '').slice(0, 10);
          if (dateStr) {
            dailyBuckets[dateStr] = (dailyBuckets[dateStr] || 0) + grand;
          }
        }

        result = {
          totalRevenue,
          totalProfit,
          totalCogs,
          totalDiscounts,
          totalTax,
          paymentMethods,
          dailyBuckets,
          count: sales.length
        };
        break;
      }

      case 'FUZZY_SEARCH_PRODUCTS': {
        const products = payload?.products || [];
        const query = (payload?.query || '').trim().toLowerCase();
        const tokens = query.split(/\s+/).filter(Boolean);

        if (!tokens.length) {
          result = products;
        } else {
          result = products.filter(p => {
            if (!p) return false;
            const name = String(p.name || '').toLowerCase();
            const barcode = String(p.barcode || '').toLowerCase();
            const sku = String(p.sku || '').toLowerCase();
            const cat = String(p.category || '').toLowerCase();

            return tokens.every(tok =>
              name.includes(tok) || barcode.includes(tok) || sku.includes(tok) || cat.includes(tok)
            );
          });
        }
        break;
      }

      case 'CALCULATE_FINANCIAL_SUMMARY': {
        const sales = payload?.sales || [];
        const bizExpenses = payload?.bizExpenses || [];
        const personalIncomes = payload?.personalIncomes || [];
        const personalExpenses = payload?.personalExpenses || [];

        let totalBizSales = 0;
        for (let i = 0; i < sales.length; i++) {
          totalBizSales += Number(sales[i].grandTotal || sales[i].paidAmount || 0);
        }

        let totalBizExpense = 0;
        for (let i = 0; i < bizExpenses.length; i++) {
          totalBizExpense += Number(bizExpenses[i].amount || 0);
        }

        let totalPersonalIncome = 0;
        for (let i = 0; i < personalIncomes.length; i++) {
          totalPersonalIncome += Number(personalIncomes[i].amount || 0);
        }

        let totalPersonalExpense = 0;
        for (let i = 0; i < personalExpenses.length; i++) {
          totalPersonalExpense += Number(personalExpenses[i].amount || 0);
        }

        result = {
          totalBizSales,
          totalBizExpense,
          bizNetProfit: totalBizSales - totalBizExpense,
          totalPersonalIncome,
          totalPersonalExpense,
          personalSavings: totalPersonalIncome - totalPersonalExpense
        };
        break;
      }

      default:
        throw new Error(`Unknown worker job type: ${type}`);
    }

    self.postMessage({ id, success: true, result });
  } catch (err) {
    self.postMessage({ id, success: false, error: err.message });
  }
};
