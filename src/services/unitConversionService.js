// ========================================================
// HisabKitab 360 - Multi-UOM & Unit Conversion Engine
// Supports compound wholesale-to-retail conversions:
// e.g. Sack -> Kg -> Gm, Cartoon -> Box -> Pcs, Dozen -> Pcs
// ========================================================

export const STANDARD_UNITS = [
  { id: 'pcs', label: 'পিস (Pcs)', category: 'count', baseFactor: 1 },
  { id: 'box', label: 'বক্স (Box)', category: 'count', baseFactor: 1 },
  { id: 'cartoon', label: 'কার্টুন (Ctn)', category: 'count', baseFactor: 24 },
  { id: 'dozen', label: 'ডজন (Doz)', category: 'count', baseFactor: 12 },
  { id: 'bundle', label: 'বান্ডিল (Bundle)', category: 'count', baseFactor: 10 },
  { id: 'kg', label: 'কেজি (Kg)', category: 'weight', baseFactor: 1 },
  { id: 'gm', label: 'গ্রাম (Gm)', category: 'weight', baseFactor: 0.001 },
  { id: 'maund', label: 'মণ (Maund)', category: 'weight', baseFactor: 40 },
  { id: 'sack', label: 'বস্তা (Sack)', category: 'weight', baseFactor: 50 },
  { id: 'liter', label: 'লিটার (Ltr)', category: 'volume', baseFactor: 1 },
  { id: 'ml', label: 'মিলি (Ml)', category: 'volume', baseFactor: 0.001 },
  { id: 'meter', label: 'মিটার (Meter)', category: 'length', baseFactor: 1 },
  { id: 'yard', label: 'গজ (Yard)', category: 'length', baseFactor: 0.9144 },
  { id: 'feet', label: 'ফুট (Feet)', category: 'length', baseFactor: 0.3048 }
];

/**
 * Calculates stock deduction in base unit when selling in a secondary unit
 * e.g. If product baseUnit is 'pcs' and secondaryUnit is 'cartoon' with factor 24,
 * selling 2 cartoons deductions = 2 * 24 = 48 pcs.
 * @param {number} qty Quantity entered in sales/cart
 * @param {string} unit Unit selected (e.g. 'cartoon' or 'pcs')
 * @param {object} product Product definition containing baseUnit, secondaryUnit, conversionFactor
 * @returns {number} Deductible quantity in base unit
 */
export const calculateStockDeduction = (qty = 1, unit = 'pcs', product = {}) => {
  const numericQty = Number(qty) || 0;
  if (!product || !unit) return numericQty;

  const baseUnit = product.baseUnit || product.unit || 'pcs';
  const secondaryUnit = product.secondaryUnit;
  const factor = Number(product.conversionFactor) || 1;

  if (unit === secondaryUnit && factor > 1) {
    return numericQty * factor;
  }

  // Weight standard conversions (kg <-> gm)
  if (baseUnit === 'kg' && unit === 'gm') {
    return numericQty / 1000;
  }
  if (baseUnit === 'gm' && unit === 'kg') {
    return numericQty * 1000;
  }

  return numericQty;
};

/**
 * Returns a human-friendly compound breakdown of base stock
 * e.g. 50 pcs (factor 24) -> "২ কার্টুন ২ পিস"
 */
export const formatCompoundStockDisplay = (baseStock = 0, product = {}, lang = 'bn') => {
  const stock = Number(baseStock) || 0;
  const baseUnit = product.baseUnit || product.unit || (lang === 'bn' ? 'পিস' : 'pcs');
  const secondaryUnit = product.secondaryUnit;
  const factor = Number(product.conversionFactor) || 0;

  if (!secondaryUnit || factor <= 1) {
    return `${stock.toLocaleString()} ${baseUnit}`;
  }

  const secondaryQty = Math.floor(stock / factor);
  const remainderBaseQty = stock % factor;

  if (secondaryQty > 0 && remainderBaseQty > 0) {
    return `${secondaryQty} ${secondaryUnit} ${remainderBaseQty} ${baseUnit}`;
  }
  if (secondaryQty > 0 && remainderBaseQty === 0) {
    return `${secondaryQty} ${secondaryUnit} (${stock} ${baseUnit})`;
  }
  return `${stock} ${baseUnit}`;
};

/**
 * Gets unit price based on selected unit
 */
export const getUnitPriceForUnit = (unit, product = {}) => {
  if (!product) return 0;
  const basePrice = Number(product.sellPrice) || 0;
  const secondaryUnit = product.secondaryUnit;
  const secondaryPrice = Number(product.secondarySellPrice);
  const factor = Number(product.conversionFactor) || 1;

  if (unit === secondaryUnit) {
    if (secondaryPrice && secondaryPrice > 0) return secondaryPrice;
    return basePrice * factor;
  }

  if (unit === 'gm' && (product.baseUnit === 'kg' || product.unit === 'kg')) {
    return basePrice / 1000;
  }

  return basePrice;
};
