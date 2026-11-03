// ========================================================
// HisabKitab 360 - Customer Loyalty & Cashback Reward Points Service
// 100% Offline, Fast Calculation, Multi-tier Loyalty Engine
// ========================================================

export const LOYALTY_CONFIG = {
  SPEND_PER_POINT: 100, // ৳100 spent = 1 Loyalty Point earned
  REDEEM_RATE_BDT: 1,   // 1 Point = ৳1 BDT discount at checkout
  MIN_POINTS_TO_REDEEM: 10, // Minimum 10 points needed to redeem
  TIERS: [
    { id: 'bronze', label: 'ব্রোঞ্জ মেম্বার', enLabel: 'Bronze Member', minSpend: 0, color: '#b45309', badge: '🥉', bonusMultiplier: 1.0 },
    { id: 'silver', label: 'সিলভার ভিআইপি', enLabel: 'Silver VIP', minSpend: 15000, color: '#64748b', badge: '🥈', bonusMultiplier: 1.1 },
    { id: 'gold', label: 'গোল্ড প্রিমিয়াম', enLabel: 'Gold Premium', minSpend: 50000, color: '#eab308', badge: '🥇', bonusMultiplier: 1.25 },
    { id: 'platinum', label: 'প্লাটিনাম এলিট', enLabel: 'Platinum Elite', minSpend: 150000, color: '#8b5cf6', badge: '💎', bonusMultiplier: 1.5 }
  ]
};

/**
 * Calculates customer membership tier based on lifetime purchases
 * @param {number} totalPurchased Lifetime spend amount in BDT
 * @returns {object} Tier details
 */
export const getCustomerLoyaltyTier = (totalPurchased = 0) => {
  const spend = Number(totalPurchased) || 0;
  const tiers = [...LOYALTY_CONFIG.TIERS].reverse();
  const matched = tiers.find(t => spend >= t.minSpend);
  return matched || LOYALTY_CONFIG.TIERS[0];
};

/**
 * Calculates loyalty points earned from a transaction total
 * @param {number} grandTotal Net bill amount
 * @param {number} multiplier Optional tier multiplier
 * @returns {number} Points earned (integer)
 */
export const calculatePointsEarned = (grandTotal = 0, multiplier = 1.0) => {
  const amount = Math.max(0, Number(grandTotal) || 0);
  if (amount < LOYALTY_CONFIG.SPEND_PER_POINT) return 0;
  const rawPoints = Math.floor(amount / LOYALTY_CONFIG.SPEND_PER_POINT);
  return Math.floor(rawPoints * (multiplier || 1.0));
};

/**
 * Calculates the maximum discount BDT amount redeemable with current points
 * @param {number} currentPoints Available loyalty points balance
 * @param {number} cartSubtotal Current bill subtotal
 * @returns {{ redeemablePoints: number, discountAmount: number, canRedeem: boolean }}
 */
export const calculateLoyaltyRedemption = (currentPoints = 0, cartSubtotal = 0) => {
  const points = Math.max(0, Number(currentPoints) || 0);
  const subtotal = Math.max(0, Number(cartSubtotal) || 0);

  if (points < LOYALTY_CONFIG.MIN_POINTS_TO_REDEEM || subtotal <= 0) {
    return { redeemablePoints: 0, discountAmount: 0, canRedeem: false };
  }

  const maxRedeemablePoints = Math.min(points, Math.floor(subtotal));
  const discountAmount = maxRedeemablePoints * LOYALTY_CONFIG.REDEEM_RATE_BDT;

  return {
    redeemablePoints: maxRedeemablePoints,
    discountAmount,
    canRedeem: maxRedeemablePoints > 0
  };
};

/**
 * Formats a clean customer loyalty statement summary string
 */
export const formatLoyaltySummary = (customer, lang = 'bn') => {
  if (!customer) return '';
  const points = Number(customer.loyaltyPoints) || 0;
  const tier = getCustomerLoyaltyTier(customer.totalPurchased);
  const tierLabel = lang === 'bn' ? tier.label : tier.enLabel;

  if (lang === 'bn') {
    return `${tier.badge} ${tierLabel} | ব্যালেন্স: ${points} পয়েন্ট (৳${points * LOYALTY_CONFIG.REDEEM_RATE_BDT} সমমূল্য)`;
  }
  return `${tier.badge} ${tierLabel} | Balance: ${points} pts (৳${points * LOYALTY_CONFIG.REDEEM_RATE_BDT} value)`;
};
