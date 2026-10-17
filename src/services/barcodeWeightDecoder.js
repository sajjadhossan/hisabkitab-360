/**
 * HisabKitab 360 - Embedded Weighing Scale Barcode Decoder (EAN-13)
 * Decodes retail scale barcodes (Prefix 20-29) containing Product Code + Weight/Price
 * Standard Format: [2X][PPPP][WWWWW][C]
 * - 2X: In-store variable weight prefix (e.g., 20, 21, 22, 23, 24, 28)
 * - PPPP: 4 or 5 digit product lookup code
 * - WWWWW: 5-digit weight (grams) or price (cents/paisa)
 * - C: Check digit
 */

export const isScaleBarcode = (barcodeString) => {
  if (!barcodeString || typeof barcodeString !== 'string') return false;
  const cleaned = barcodeString.trim();
  if (cleaned.length !== 12 && cleaned.length !== 13) return false;
  const prefix = cleaned.substring(0, 2);
  return ['20', '21', '22', '23', '24', '25', '26', '27', '28', '29'].includes(prefix);
};

export const decodeScaleBarcode = (barcodeString, products = []) => {
  if (!barcodeString || typeof barcodeString !== 'string') return null;
  const cleaned = barcodeString.trim();

  // Must be 12 or 13 digits
  if (cleaned.length !== 12 && cleaned.length !== 13) return null;

  const prefix = cleaned.substring(0, 2);
  const isScalePrefix = ['20', '21', '22', '23', '24', '25', '26', '27', '28', '29'].includes(prefix);
  if (!isScalePrefix) return null;

  // Format 1: 2-digit prefix, 5-digit item code, 5-digit weight in grams, 1 check digit
  const itemCode5 = cleaned.substring(2, 7);
  const weightGrams5 = parseInt(cleaned.substring(7, 12), 10);

  // Format 2: 2-digit prefix, 4-digit item code, 6-digit weight/price, 1 check digit
  const itemCode4 = cleaned.substring(2, 6);
  const weightGrams4 = parseInt(cleaned.substring(6, 11), 10);

  const matchedProduct = products.length > 0 ? products.find(p =>
    p.barcode === cleaned ||
    p.barcode === itemCode5 ||
    p.barcode === itemCode4 ||
    p.itemCode === itemCode5 ||
    p.itemCode === itemCode4 ||
    (p.sku && (p.sku === itemCode5 || p.sku === itemCode4))
  ) : null;

  const weightInKg = (weightGrams5 || weightGrams4 || 1000) / 1000;
  const unitPrice = Number(matchedProduct?.sellPrice || matchedProduct?.sellingPrice || matchedProduct?.price || 0);
  const calculatedTotal = Math.round(unitPrice * weightInKg);

  return {
    isValid: true,
    isScaleBarcode: true,
    itemCode: itemCode5 || itemCode4,
    product: matchedProduct,
    weightKg: weightInKg,
    weightGrams: weightGrams5 || weightGrams4,
    isWeightEmbedded: true,
    isPriceEmbedded: prefix === '28' || prefix === '29',
    price: calculatedTotal,
    calculatedTotal,
    rawBarcode: cleaned
  };
};

export default {
  isScaleBarcode,
  decodeScaleBarcode
};
