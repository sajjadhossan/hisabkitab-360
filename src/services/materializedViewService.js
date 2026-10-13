/**
 * HisabKitab 360 - PostgreSQL Materialized View & Aggregation Service
 * Tip 13: Pre-computed Rollups, Stale-While-Revalidate Caching & Instant Analytics
 * ---------------------------------------------------------------------------------
 * Computes high-speed daily/monthly aggregates (gross revenue, margins, taxes,
 * customer debt rollups) without scanning millions of raw rows on each screen load.
 */

const STORAGE_ROLLUP_CACHE_KEY = 'hk360_materialized_rollups_cache';

export const MATERIALIZED_VIEW_DEFINITIONS = [
  {
    name: 'mv_daily_sales_summary',
    title: 'দৈনিক বিক্রয় সারসংক্ষেপ (Daily Sales Summary)',
    refreshIntervalMinutes: 15,
    columns: ['sale_date', 'total_invoices', 'gross_revenue', 'total_discount', 'net_revenue', 'cash_collected', 'mfs_collected']
  },
  {
    name: 'mv_product_profitability_rollup',
    title: 'পণ্য লাভজনকতা রোল-আপ (Product Profitability)',
    refreshIntervalMinutes: 60,
    columns: ['product_id', 'product_name', 'units_sold', 'total_revenue', 'total_cost', 'net_profit', 'margin_pct']
  },
  {
    name: 'mv_customer_debt_ledger_rollup',
    title: 'গ্রাহক দেনা-পাওনা খতিয়ান রোল-আপ (Customer Debt Aging)',
    refreshIntervalMinutes: 30,
    columns: ['customer_id', 'customer_name', 'total_due', 'current_due', 'overdue_30_days', 'overdue_60_days']
  }
];

export const computeClientMaterializedRollup = (salesHistory = [], products = []) => {
  const productMap = new Map();
  products.forEach(p => productMap.set(p.id, p));

  const dailySummaryMap = {};
  let totalGross = 0;
  let totalNet = 0;
  let totalProfit = 0;

  salesHistory.forEach(sale => {
    const dateStr = (sale.date || sale.created_at || new Date().toISOString()).split('T')[0];
    if (!dailySummaryMap[dateStr]) {
      dailySummaryMap[dateStr] = {
        date: dateStr,
        invoicesCount: 0,
        gross: 0,
        discount: 0,
        net: 0,
        profit: 0
      };
    }

    const row = dailySummaryMap[dateStr];
    row.invoicesCount++;
    const total = Number(sale.total || sale.grandTotal || sale.finalTotal || 0);
    const disc = Number(sale.discount || 0);
    const net = total;

    row.gross += total + disc;
    row.discount += disc;
    row.net += net;
    totalGross += total + disc;
    totalNet += net;

    // Calculate approximate cost & profit
    let cost = 0;
    if (Array.isArray(sale.items)) {
      sale.items.forEach(item => {
        const prod = productMap.get(item.id || item.productId);
        const buyPrice = Number(prod?.buyPrice || prod?.costPrice || item.buyPrice || 0);
        const qty = Number(item.quantity || item.qty || 1);
        cost += buyPrice * qty;
      });
    } else {
      cost = net * 0.75; // Estimate 25% margin fallback
    }

    const p = Math.max(0, net - cost);
    row.profit += p;
    totalProfit += p;
  });

  const dailyList = Object.values(dailySummaryMap).sort((a, b) => b.date.localeCompare(a.date));

  const rollupData = {
    lastRefreshed: new Date().toISOString(),
    totalGross,
    totalNet,
    totalProfit,
    marginPercentage: totalNet > 0 ? ((totalProfit / totalNet) * 100).toFixed(1) : 0,
    dailyList: dailyList.slice(0, 30) // Last 30 days
  };

  try {
    localStorage.setItem(STORAGE_ROLLUP_CACHE_KEY, JSON.stringify(rollupData));
  } catch {}

  return rollupData;
};

export const getCachedMaterializedRollup = () => {
  try {
    const raw = localStorage.getItem(STORAGE_ROLLUP_CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
};

export const generatePostgresMaterializedViewSql = () => {
  return `-- =========================================================================
-- HISABKITAB 360 - POSTGRESQL MATERIALIZED VIEWS & CONCURRENT REFRESH
-- =========================================================================

-- ১. দৈনিক বিক্রয় ও লাভের প্রি-কম্পিউটেড ম্যাটেরিয়ালাইজড ভিউ
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_sales_summary AS
SELECT 
    DATE(i.created_at) AS sale_date,
    COUNT(i.id) AS total_invoices,
    SUM(i.total_amount) AS gross_revenue,
    SUM(COALESCE(i.discount_amount, 0)) AS total_discount,
    SUM(i.total_amount - COALESCE(i.discount_amount, 0)) AS net_revenue,
    SUM(CASE WHEN i.payment_method = 'CASH' THEN i.paid_amount ELSE 0 END) AS cash_collected,
    SUM(CASE WHEN i.payment_method IN ('BKASH', 'NAGAD', 'ROCKET') THEN i.paid_amount ELSE 0 END) AS mfs_collected
FROM invoices i
GROUP BY DATE(i.created_at)
WITH DATA;

-- ইউনিক ইনডেক্স (কনকারেন্ট রিফ্রেশের জন্য আবশ্যক)
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_sales_date ON mv_daily_sales_summary (sale_date);

-- ২. কনকারেন্ট ব্যাকগ্রাউন্ড রিফ্রেশ ফাংশন
CREATE OR REPLACE FUNCTION refresh_hisabkitab_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_sales_summary;
END;
$$ LANGUAGE plpgsql;

-- ৩. ক্রন জব সিডিউল (প্রতি ১৫ মিনিট অন্তর অটো রিফ্রেশ)
-- SELECT cron.schedule('refresh-mv-sales', '*/15 * * * *', 'SELECT refresh_hisabkitab_materialized_views();');
`;
};

export const materializedViewService = {
  computeRollup: computeClientMaterializedRollup,
  getCachedRollup: getCachedMaterializedRollup,
  generateSql: generatePostgresMaterializedViewSql,
  viewDefinitions: MATERIALIZED_VIEW_DEFINITIONS
};

export default materializedViewService;
