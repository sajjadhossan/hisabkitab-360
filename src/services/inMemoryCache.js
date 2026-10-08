/**
 * HisabKitab 360 - Instant In-Memory Cache with Reactive Invalidation
 * ---------------------------------------------------------------------
 * High-speed O(1) in-memory indexing cache for high-volume POS shops.
 * Provides instant 0ms lookups for barcode scanners, customer phone search,
 * and category resolution without hitting disk or re-iterating large arrays.
 */

class FastInMemoryStore {
  constructor() {
    this.productBarcodeMap = new Map();
    this.productIdMap = new Map();
    this.customerPhoneMap = new Map();
    this.customerIdMap = new Map();
    this.categoryMap = new Map();
    this.lastWarmed = 0;
  }

  /**
   * Warm product maps from array
   */
  warmProducts(products = []) {
    this.productBarcodeMap.clear();
    this.productIdMap.clear();

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      if (!p) continue;
      if (p.id) this.productIdMap.set(String(p.id), p);
      if (p.barcode) {
        this.productBarcodeMap.set(String(p.barcode).trim(), p);
      }
      if (p.sku) {
        this.productBarcodeMap.set(String(p.sku).trim(), p);
      }
    }
    this.lastWarmed = Date.now();
  }

  /**
   * Warm customer maps from array
   */
  warmCustomers(customers = []) {
    this.customerPhoneMap.clear();
    this.customerIdMap.clear();

    for (let i = 0; i < customers.length; i++) {
      const c = customers[i];
      if (!c) continue;
      if (c.id) this.customerIdMap.set(String(c.id), c);
      if (c.phone) {
        const cleanPhone = String(c.phone).replace(/\s+/g, '');
        this.customerPhoneMap.set(cleanPhone, c);
      }
    }
  }

  /**
   * Instant O(1) Barcode lookup
   */
  getProductByBarcode(barcode) {
    if (!barcode) return null;
    const clean = String(barcode).trim();
    return this.productBarcodeMap.get(clean) || null;
  }

  /**
   * Instant O(1) Product ID lookup
   */
  getProductById(id) {
    if (!id) return null;
    return this.productIdMap.get(String(id)) || null;
  }

  /**
   * Instant O(1) Customer lookup by phone
   */
  getCustomerByPhone(phone) {
    if (!phone) return null;
    const cleanPhone = String(phone).replace(/\s+/g, '');
    return this.customerPhoneMap.get(cleanPhone) || null;
  }

  /**
   * Instant O(1) Customer lookup by ID
   */
  getCustomerById(id) {
    if (!id) return null;
    return this.customerIdMap.get(String(id)) || null;
  }

  /**
   * Reactive Invalidation / Update for single product
   */
  updateProduct(product) {
    if (!product || !product.id) return;
    const idStr = String(product.id);
    this.productIdMap.set(idStr, product);
    if (product.barcode) {
      this.productBarcodeMap.set(String(product.barcode).trim(), product);
    }
  }

  /**
   * Invalidate removed product
   */
  removeProduct(productId) {
    const p = this.productIdMap.get(String(productId));
    if (p && p.barcode) {
      this.productBarcodeMap.delete(String(p.barcode).trim());
    }
    this.productIdMap.delete(String(productId));
  }

  clear() {
    this.productBarcodeMap.clear();
    this.productIdMap.clear();
    this.customerPhoneMap.clear();
    this.customerIdMap.clear();
    this.categoryMap.clear();
  }
}

export const inMemoryCache = new FastInMemoryStore();
