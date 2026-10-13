/**
 * HisabKitab 360 - Smart Basket Analysis & Cross-Selling Engine (Tip 43)
 * Association Rule Mining (Apriori algorithm principles) to discover frequent itemsets,
 * co-purchase affinity, lift scores, and trigger real-time POS upsell/cross-sell suggestions.
 */

class BasketCrossSellEngine {
  constructor() {
    this.ruleCache = new Map();
  }

  /**
   * Mine association rules from sales history
   * @param {Array} salesHistory - List of historical transactions
   * @param {number} minSupport - Minimum frequency threshold (e.g., 0.02 = 2%)
   * @returns {Array} List of association rules { antecedent, consequent, support, confidence, lift }
   */
  mineAssociationRules(salesHistory = [], minSupport = 0.01) {
    if (!Array.isArray(salesHistory) || salesHistory.length === 0) return [];

    const totalTransactions = salesHistory.length;
    const itemCounts = new Map(); // frequency of individual items
    const pairCounts = new Map(); // frequency of item pairs

    salesHistory.forEach(sale => {
      const items = (sale.items || []).map(i => i.id || i.productId).filter(Boolean);
      const uniqueItems = Array.from(new Set(items));

      // 1-item counts
      uniqueItems.forEach(item => {
        itemCounts.set(item, (itemCounts.get(item) || 0) + 1);
      });

      // 2-item pair counts
      for (let i = 0; i < uniqueItems.length; i++) {
        for (let j = i + 1; j < uniqueItems.length; j++) {
          const pairKey = [uniqueItems[i], uniqueItems[j]].sort().join(':::');
          pairCounts.set(pairKey, (pairCounts.get(pairKey) || 0) + 1);
        }
      }
    });

    const rules = [];

    pairCounts.forEach((pairFreq, pairKey) => {
      const [itemA, itemB] = pairKey.split(':::');
      const supportPair = pairFreq / totalTransactions;

      if (supportPair >= minSupport) {
        const countA = itemCounts.get(itemA) || 1;
        const countB = itemCounts.get(itemB) || 1;

        const supportA = countA / totalTransactions;
        const supportB = countB / totalTransactions;

        // Rule A -> B
        const confidenceAtoB = pairFreq / countA;
        const liftAtoB = confidenceAtoB / supportB;

        // Rule B -> A
        const confidenceBtoA = pairFreq / countB;
        const liftBtoA = confidenceBtoA / supportA;

        if (liftAtoB > 1.05) {
          rules.push({
            antecedentId: itemA,
            consequentId: itemB,
            support: Number((supportPair * 100).toFixed(1)),
            confidence: Number((confidenceAtoB * 100).toFixed(1)),
            lift: Number(liftAtoB.toFixed(2))
          });
        }

        if (liftBtoA > 1.05) {
          rules.push({
            antecedentId: itemB,
            consequentId: itemA,
            support: Number((supportPair * 100).toFixed(1)),
            confidence: Number((confidenceBtoA * 100).toFixed(1)),
            lift: Number(liftBtoA.toFixed(2))
          });
        }
      }
    });

    // Sort rules by highest Lift score
    rules.sort((a, b) => b.lift - a.lift);
    return rules;
  }

  /**
   * Get cross-sell recommendations for current cart items
   * @param {Array} cartItems - Items currently in POS cart
   * @param {Array} products - Master product list
   * @param {Array} salesHistory - Historical sales
   * @returns {Array} Recommended products with affinity score & rationale
   */
  getRecommendationsForCart(cartItems = [], products = [], salesHistory = []) {
    if (!Array.isArray(cartItems) || cartItems.length === 0) return [];

    const cartProductIds = new Set(cartItems.map(i => i.id || i.productId));
    const rules = this.mineAssociationRules(salesHistory, 0.005);

    const candidates = new Map();

    cartProductIds.forEach(id => {
      const matchingRules = rules.filter(r => r.antecedentId === id && !cartProductIds.has(r.consequentId));
      matchingRules.forEach(rule => {
        const existing = candidates.get(rule.consequentId);
        if (!existing || rule.lift > existing.lift) {
          candidates.set(rule.consequentId, rule);
        }
      });
    });

    const recommendations = [];
    candidates.forEach((rule, targetId) => {
      const targetProd = products.find(p => p.id === targetId);
      if (targetProd && Number(targetProd.stock || 0) > 0) {
        recommendations.push({
          product: targetProd,
          confidence: rule.confidence,
          lift: rule.lift,
          support: rule.support,
          reasonBn: `যেসব ক্রেতা কার্টের পণ্য কিনেছেন তাদের ${rule.confidence}% এটিও নিয়েছেন (লিফ্ট: ${rule.lift}x)`
        });
      }
    });

    return recommendations.slice(0, 4); // top 4 recommendations
  }
}

export const basketCrossSellEngine = new BasketCrossSellEngine();
export default basketCrossSellEngine;
