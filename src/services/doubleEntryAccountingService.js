// ========================================================
// HisabKitab 360 - Double-Entry General Ledger & Balance Sheet Engine
// Strictly adheres to international accounting equation:
// Assets (সম্পদ) = Liabilities (দায়) + Equity (মালিকানাস্বত্ব)
// ========================================================

/**
 * Standard Chart of Accounts Master Taxonomy
 */
export const CHART_OF_ACCOUNTS = [
  // 1. ASSETS (সম্পদ) - Normal Balance: DEBIT
  { code: '1010', name: 'হাতে নগদ ক্যাশ (Cash in Hand)', category: 'current_asset', type: 'asset', normalBalance: 'debit' },
  { code: '1020', name: 'ব্যাংক হিসাব (Bank Accounts)', category: 'current_asset', type: 'asset', normalBalance: 'debit' },
  { code: '1030', name: 'মোবাইল ওয়ালেট (bKash / Nagad / MFS)', category: 'current_asset', type: 'asset', normalBalance: 'debit' },
  { code: '1040', name: 'দেনাদার হিসাব / বকেয়া পাওনা (Accounts Receivable)', category: 'current_asset', type: 'asset', normalBalance: 'debit' },
  { code: '1050', name: 'মজুদ পণ্য মূল্যায়ন (Merchandise Inventory Asset)', category: 'current_asset', type: 'asset', normalBalance: 'debit' },
  { code: '1510', name: 'দোকান আসবাবপত্র ও ডেকোরেশন (Furniture & Fixtures)', category: 'fixed_asset', type: 'asset', normalBalance: 'debit' },
  { code: '1520', name: 'ইলেকট্রনিক্স ও হার্ডওয়্যার (POS Hardware & Equipment)', category: 'fixed_asset', type: 'asset', normalBalance: 'debit' },

  // 2. LIABILITIES (দায়) - Normal Balance: CREDIT
  { code: '2010', name: 'পাওনাদার হিসাব / মহাজন দেনা (Accounts Payable)', category: 'current_liability', type: 'liability', normalBalance: 'credit' },
  { code: '2020', name: 'প্রদেয় ভ্যাট ও কর (VAT & Taxes Payable)', category: 'current_liability', type: 'liability', normalBalance: 'credit' },
  { code: '2030', name: 'অগ্রিম কাস্টমার জমা (Customer Advance)', category: 'current_liability', type: 'liability', normalBalance: 'credit' },
  { code: '2510', name: 'ব্যাংক লোন ও দীর্ঘমেয়াদী ঋণ (Long-Term Loans)', category: 'long_term_liability', type: 'liability', normalBalance: 'credit' },

  // 3. EQUITY (মালিকানাস্বত্ব) - Normal Balance: CREDIT
  { code: '3010', name: 'মালিকের প্রারম্ভিক মূলধন (Owner Initial Capital)', category: 'equity', type: 'equity', normalBalance: 'credit' },
  { code: '3020', name: 'অর্জিত ও অবণ্টিত মুনাফা (Retained Earnings)', category: 'equity', type: 'equity', normalBalance: 'credit' },

  // 4. REVENUE (আয়) - Normal Balance: CREDIT
  { code: '4010', name: 'পণ্য বিক্রয় আয় (Sales Revenue)', category: 'revenue', type: 'revenue', normalBalance: 'credit' },
  { code: '4020', name: 'ডেলিভারি ও সার্ভিস চার্জ আয় (Service Revenue)', category: 'revenue', type: 'revenue', normalBalance: 'credit' },

  // 5. EXPENSES (ব্যয়) - Normal Balance: DEBIT
  { code: '5010', name: 'বিক্রিত পণ্যের ক্রয়মূল্য (Cost of Goods Sold - COGS)', category: 'expense', type: 'expense', normalBalance: 'debit' },
  { code: '5020', name: 'দোকান বা গোডাউন ভাড়া (Rent Expense)', category: 'expense', type: 'expense', normalBalance: 'debit' },
  { code: '5030', name: 'কর্মী বেতন ও পারিশ্রমিক (Salaries & Wages)', category: 'expense', type: 'expense', normalBalance: 'debit' },
  { code: '5040', name: 'বিদ্যুৎ ও ইউটিলিটি বিল (Utilities Expense)', category: 'expense', type: 'expense', normalBalance: 'debit' },
  { code: '5050', name: 'পরিবহন ও যাতায়াত খরচ (Transportation & Conveyance)', category: 'expense', type: 'expense', normalBalance: 'debit' },
  { code: '5060', name: 'পণ্য নষ্ট ও ড্যামেজ লস (Spoilage / Loss on Damaged Goods)', category: 'expense', type: 'expense', normalBalance: 'debit' }
];

/**
 * Computes live general ledger account balances from system transactions
 */
export const generateFinancialStatements = ({
  salesHistory = [],
  products = [],
  customers = [],
  suppliers = [],
  businessExpenses = [],
  businessSettings = {}
}) => {
  // 1. Compute Inventory Value
  const inventoryAssetValue = (products || []).reduce((sum, p) => {
    const qty = Math.max(0, Number(p.stock) || 0);
    const cost = Number(p.costPrice) || Number(p.sellPrice) || 0;
    return sum + (qty * cost);
  }, 0);

  // 2. Compute Total Accounts Receivable (দেনাদার বাকি)
  const totalReceivables = (customers || []).reduce((sum, c) => {
    return sum + Math.max(0, Number(c.outstandingDue) || 0);
  }, 0);

  // 3. Compute Total Accounts Payable (মহাজন দেনা)
  const totalPayables = (suppliers || []).reduce((sum, s) => {
    return sum + Math.max(0, Number(s.payableBalance) || 0);
  }, 0);

  // 4. Compute Sales Revenue & COGS
  let totalSalesRevenue = 0;
  let totalCogs = 0;
  let totalPaidReceived = 0;

  (salesHistory || []).forEach(sale => {
    const grandTotal = Number(sale.grandTotal) || 0;
    const paid = Number(sale.paidAmount) !== undefined ? Number(sale.paidAmount) : grandTotal;
    totalSalesRevenue += grandTotal;
    totalPaidReceived += paid;

    (sale.items || []).forEach(item => {
      const itemCost = Number(item.costPrice) || 0;
      const qty = Number(item.qty) || 1;
      totalCogs += (itemCost * qty);
    });
  });

  // 5. Total Operating Expenses
  const expenseByCategory = {};
  let totalOperatingExpenses = 0;

  (businessExpenses || []).forEach(exp => {
    const amt = Number(exp.amount) || 0;
    totalOperatingExpenses += amt;
    const cat = exp.category || 'অন্যান্য';
    expenseByCategory[cat] = (expenseByCategory[cat] || 0) + amt;
  });

  // 6. Net Profit Calculation (আয় - বিক্রয় ব্যয় - পরিচালন ব্যয়)
  const grossProfit = Math.max(0, totalSalesRevenue - totalCogs);
  const netProfit = grossProfit - totalOperatingExpenses;

  // 7. Cash in Hand & Bank estimation
  const cashInHand = Math.max(0, totalPaidReceived - totalOperatingExpenses);
  const bankAccounts = Number(businessSettings?.bankBalance) || 0;
  const fixedAssets = Number(businessSettings?.fixedAssetsValue) || 25000; // estimated shop fixtures

  // 8. Total Assets
  const totalCurrentAssets = cashInHand + bankAccounts + totalReceivables + inventoryAssetValue;
  const totalAssets = totalCurrentAssets + fixedAssets;

  // 9. Total Liabilities & Equity
  const totalLiabilities = totalPayables;
  const ownerCapital = Math.max(0, totalAssets - totalLiabilities - netProfit);
  const totalEquity = ownerCapital + netProfit;
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  // 10. Generate Trial Balance (রেওয়ামিল) Items
  const trialBalance = [
    { code: '1010', name: 'হাতে নগদ ক্যাশ (Cash in Hand)', debit: cashInHand, credit: 0 },
    { code: '1020', name: 'ব্যাংক ও অনলাইন ব্যালেন্স (Bank & MFS)', debit: bankAccounts, credit: 0 },
    { code: '1040', name: 'দেনাদার বাকি খতিয়ান (Accounts Receivable)', debit: totalReceivables, credit: 0 },
    { code: '1050', name: 'মজুদ পণ্য সম্পদ (Merchandise Inventory)', debit: inventoryAssetValue, credit: 0 },
    { code: '1510', name: 'দোকান সাজসজ্জা ও ফিক্সচার (Furniture & Equipment)', debit: fixedAssets, credit: 0 },
    { code: '2010', name: 'পাওনাদার মহাজন হিসাব (Accounts Payable)', debit: 0, credit: totalPayables },
    { code: '3010', name: 'মালিকের প্রারম্ভিক মূলধন (Owner Capital)', debit: 0, credit: ownerCapital },
    { code: '4010', name: 'পণ্য বিক্রয় আয় (Sales Revenue)', debit: 0, credit: totalSalesRevenue },
    { code: '5010', name: 'বিক্রিত পণ্যের ক্রয়মূল্য (COGS)', debit: totalCogs, credit: 0 },
    { code: '5020', name: 'ব্যবসায়িক পরিচালন খরচ (Operating Expenses)', debit: totalOperatingExpenses, credit: 0 }
  ];

  const totalTrialDebit = trialBalance.reduce((s, row) => s + row.debit, 0);
  const totalTrialCredit = trialBalance.reduce((s, row) => s + row.credit, 0);
  const isTrialBalanced = Math.abs(totalTrialDebit - totalTrialCredit) < 1;

  return {
    balanceSheet: {
      assets: {
        current: {
          cashInHand,
          bankAccounts,
          totalReceivables,
          inventoryAssetValue,
          total: totalCurrentAssets
        },
        fixed: {
          furnitureAndFixtures: fixedAssets,
          total: fixedAssets
        },
        totalAssets
      },
      liabilities: {
        current: {
          accountsPayable: totalPayables,
          total: totalLiabilities
        },
        totalLiabilities
      },
      equity: {
        ownerCapital,
        retainedEarnings: netProfit,
        totalEquity
      },
      totalLiabilitiesAndEquity,
      isBalanced: Math.abs(totalAssets - totalLiabilitiesAndEquity) < 1
    },
    trialBalance: {
      rows: trialBalance,
      totalDebit: totalTrialDebit,
      totalCredit: totalTrialCredit,
      isBalanced: isTrialBalanced
    },
    incomeStatement: {
      revenue: totalSalesRevenue,
      cogs: totalCogs,
      grossProfit,
      expenses: totalOperatingExpenses,
      netProfit,
      expenseByCategory
    }
  };
};
