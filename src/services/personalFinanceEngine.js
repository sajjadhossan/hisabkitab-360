/**
 * HisabKitab 360 - Personal & Family Finance Intelligence Engine
 * ----------------------------------------------------------------
 * Core engine powering Domain 1 (Tips 1 to 50):
 * 1. Smart AI Budget Prediction & Burn-Rate Velocity
 * 2. Multi-Wallet Cashless Balances & Inter-Wallet Transfer Ledger
 * 3. Family Member Consumption Distribution
 * 4. Personal Real-Time Net-Worth & Solvency Meter
 * 5. Quick 1-Tap Micro-Expense Presets
 */

const WALLETS_STORAGE_KEY = 'hk360_personal_wallets_v2';
const TRANSFERS_STORAGE_KEY = 'hk360_personal_wallet_transfers_v2';
const ASSETS_STORAGE_KEY = 'hk360_personal_assets_registry_v2';

export const DEFAULT_WALLETS = [
  { id: 'cash', name: 'নগদ ক্যাশ', icon: 'Wallet', balance: 0, color: '#10b981' },
  { id: 'bkash', name: 'বিকাশ (bKash)', icon: 'Smartphone', balance: 0, color: '#ec4899' },
  { id: 'nagad', name: 'নগদ ওয়ালেট (Nagad)', icon: 'Smartphone', balance: 0, color: '#f97316' },
  { id: 'bank', name: 'ব্যাংক একাউন্ট', icon: 'Building2', balance: 0, color: '#3b82f6' },
  { id: 'card', name: 'ডেবিট / ক্রেডিট কার্ড', icon: 'CreditCard', balance: 0, color: '#8b5cf6' }
];

export const QUICK_MICRO_PRESETS = [
  { label: 'চা / কফি', amount: 10, icon: '☕', category: 'snacks', subCategory: 'বিকালের চা-নাস্তা' },
  { label: 'রিকশা ভাড়া', amount: 30, icon: '🛺', category: 'transport', subCategory: 'রিকশা ভাড়া' },
  { label: 'হালকা নাস্তা', amount: 50, icon: '🥟', category: 'snacks', subCategory: 'বিকালের চা-নাস্তা' },
  { label: 'মিনারেল ওয়াটার', amount: 25, icon: '💧', category: 'bazaar', subCategory: 'ডিম ও দুধ' },
  { label: 'বিবিধ টুকিটাকি', amount: 100, icon: '🛒', category: 'other', subCategory: 'বিবিধ টুকিটাকি' },
  { label: 'বাস / অটো ভাড়া', amount: 40, icon: '🚌', category: 'transport', subCategory: 'বাস ভাড়া' }
];

/**
 * Gets registered personal wallets with initial balances
 */
export const getPersonalWallets = () => {
  if (typeof localStorage === 'undefined') return DEFAULT_WALLETS;
  try {
    const raw = localStorage.getItem(WALLETS_STORAGE_KEY);
    if (!raw) return DEFAULT_WALLETS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_WALLETS;
  } catch (err) {
    return DEFAULT_WALLETS;
  }
};

/**
 * Saves personal wallets configuration
 */
export const savePersonalWallets = (wallets) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(WALLETS_STORAGE_KEY, JSON.stringify(wallets));
  } catch (err) {
    console.error('Failed to save personal wallets:', err);
  }
};

/**
 * Gets registered custom physical/financial assets
 */
export const getPersonalNetWorthAssets = () => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ASSETS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
};

/**
 * Saves registered custom physical/financial assets
 */
export const savePersonalNetWorthAssets = (assets) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(assets));
  } catch (err) {
    console.error('Failed to save personal net-worth assets:', err);
  }
};

/**
 * Standard Bangladeshi currency formatter
 */
export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return '৳' + num.toLocaleString('en-IN');
};

/**
 * Gets wallet transfer logs
 */
export const getWalletTransfers = () => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TRANSFERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Records an inter-wallet transfer (e.g. Bank to bKash)
 */
export const recordWalletTransfer = ({
  fromWalletId,
  toWalletId,
  amount,
  note = '',
  date = new Date().toISOString()
}) => {
  const transfers = getWalletTransfers();
  const newTransfer = {
    id: `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    fromWalletId,
    toWalletId,
    amount: Number(amount) || 0,
    note,
    date
  };
  transfers.unshift(newTransfer);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(TRANSFERS_STORAGE_KEY, JSON.stringify(transfers.slice(0, 200)));
  }
  return newTransfer;
};

/**
 * Computes live balances of all wallets based on initial balance, incomes, expenses, and transfers
 */
export const computeLiveWalletBalances = (incomes = [], expenses = [], transfers = []) => {
  const wallets = getPersonalWallets();
  const balanceMap = {};

  wallets.forEach((w) => {
    balanceMap[w.id] = Number(w.balance || 0);
  });

  // 1. Add Incomes
  incomes.forEach((inc) => {
    const wId = inc.walletId || inc.paymentMethod || 'cash';
    const amt = Number(inc.amount) || 0;
    if (balanceMap[wId] !== undefined) {
      balanceMap[wId] += amt;
    } else {
      balanceMap['cash'] = (balanceMap['cash'] || 0) + amt;
    }
  });

  // 2. Subtract Expenses
  expenses.forEach((exp) => {
    const wId = exp.walletId || exp.paymentMethod || 'cash';
    const amt = Number(exp.amount) || 0;
    if (balanceMap[wId] !== undefined) {
      balanceMap[wId] -= amt;
    } else {
      balanceMap['cash'] = (balanceMap['cash'] || 0) - amt;
    }
  });

  // 3. Process Transfers
  transfers.forEach((tr) => {
    const amt = Number(tr.amount) || 0;
    if (balanceMap[tr.fromWalletId] !== undefined) {
      balanceMap[tr.fromWalletId] -= amt;
    }
    if (balanceMap[tr.toWalletId] !== undefined) {
      balanceMap[tr.toWalletId] += amt;
    }
  });

  return wallets.map((w) => ({
    ...w,
    currentBalance: balanceMap[w.id] !== undefined ? balanceMap[w.id] : Number(w.balance || 0)
  }));
};

/**
 * Tip 1: Smart AI Budget Velocity & Runaway Predictor
 * Projects month-end total expense based on current velocity
 */
export const calculateBudgetBurnVelocity = (
  expenses = [],
  monthlyBudget = 0,
  referenceDate = new Date()
) => {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const currentDay = Math.max(1, referenceDate.getDate());
  const remainingDays = Math.max(0, totalDaysInMonth - currentDay);

  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const thisMonthExpenses = expenses.filter((e) => (e.date || '').startsWith(prefix));
  const currentSpent = thisMonthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Daily burn velocity
  const dailyBurnRate = currentSpent / currentDay;

  // Projected month-end expense
  const projectedMonthEndSpent = Math.round(currentSpent + dailyBurnRate * remainingDays);

  const budget = Number(monthlyBudget) || 0;
  const isBudgetSet = budget > 0;
  const projectedDifference = isBudgetSet ? projectedMonthEndSpent - budget : 0;
  const percentOfBudgetBurned = isBudgetSet ? Math.round((currentSpent / budget) * 100) : 0;
  const expectedNormalProgress = Math.round((currentDay / totalDaysInMonth) * 100);

  // Status: 'healthy' | 'caution' | 'critical'
  let velocityStatus = 'healthy';
  let message = 'খরচের গতি স্বাভাবিক ও নিয়ন্ত্রিত রয়েছে।';

  if (isBudgetSet) {
    if (percentOfBudgetBurned > expectedNormalProgress + 15) {
      velocityStatus = 'critical';
      message = `সতর্কতা: খরচের গতি তীব্র! বর্তমান হারে চললে মাসের শেষে বাজেট ৳${Math.abs(projectedDifference).toLocaleString()} টাকা ছাড়িয়ে যেতে পারে!`;
    } else if (percentOfBudgetBurned > expectedNormalProgress + 5) {
      velocityStatus = 'caution';
      message = 'সতর্কতা: খরচের গতি কিছুটা বেশি। অপচয় কমানোর চেষ্টা করুন।';
    }
  }

  return {
    currentSpent,
    dailyBurnRate: Math.round(dailyBurnRate),
    projectedMonthEndSpent,
    remainingDays,
    totalDaysInMonth,
    currentDay,
    budget,
    isBudgetSet,
    projectedDifference,
    percentOfBudgetBurned,
    expectedNormalProgress,
    velocityStatus,
    message
  };
};

/**
 * Tip 4: Family Member Consumption Distribution
 */
export const calculateMemberExpenseDistribution = (expenses = [], referencePrefix = '') => {
  const relevant = referencePrefix
    ? expenses.filter((e) => (e.date || '').startsWith(referencePrefix))
    : expenses;

  const memberMap = {};
  let total = 0;

  relevant.forEach((e) => {
    const member = (e.familyMember || 'পুরো পরিবার').trim();
    const amt = Number(e.amount) || 0;
    memberMap[member] = (memberMap[member] || 0) + amt;
    total += amt;
  });

  const memberList = Object.keys(memberMap).map((name) => {
    const amount = memberMap[name];
    const percentage = total > 0 ? Math.round((amount / total) * 100) : 0;
    return { name, amount, percentage };
  });

  memberList.sort((a, b) => b.amount - a.amount);
  return { total, members: memberList };
};

/**
 * Tip 5: Personal Net-Worth (Asset - Liability) Calculator
 */
export const calculatePersonalNetWorth = ({
  liquidCash = 0,
  bankBalances = 0,
  savingsDeposit = 0,
  customAssets = [],
  personalDebtsReceivable = 0,
  personalDebtsPayable = 0,
  loansPayable = 0
}) => {
  const assetsSum =
    Number(liquidCash || 0) +
    Number(bankBalances || 0) +
    Number(savingsDeposit || 0) +
    Number(personalDebtsReceivable || 0) +
    (customAssets || []).reduce((s, a) => s + (Number(a.value) || 0), 0);

  const liabilitiesSum =
    Number(personalDebtsPayable || 0) + Number(loansPayable || 0);

  const netWorth = assetsSum - liabilitiesSum;
  const solvencyRatio = liabilitiesSum > 0 ? (assetsSum / liabilitiesSum).toFixed(2) : '100+';

  let solvencyStatus = 'excellent'; // 'excellent' | 'moderate' | 'vulnerable'
  if (netWorth < 0) {
    solvencyStatus = 'vulnerable';
  } else if (Number(solvencyRatio) < 1.5 && liabilitiesSum > 0) {
    solvencyStatus = 'moderate';
  }

  return {
    totalAssets: assetsSum,
    totalLiabilities: liabilitiesSum,
    totalNetWorth: netWorth,
    assetsSum,
    liabilitiesSum,
    netWorth,
    solvencyRatio,
    solvencyStatus,
    financialHealth: solvencyStatus
  };
};

export const personalFinanceEngine = {
  getPersonalWallets,
  savePersonalWallets,
  getPersonalNetWorthAssets,
  savePersonalNetWorthAssets,
  formatCurrency,
  getWalletTransfers,
  recordWalletTransfer,
  computeLiveWalletBalances,
  calculateBudgetBurnVelocity,
  calculateMemberExpenseDistribution,
  calculatePersonalNetWorth,
  DEFAULT_WALLETS,
  QUICK_MICRO_PRESETS
};
