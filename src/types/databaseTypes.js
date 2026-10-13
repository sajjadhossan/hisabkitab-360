/**
 * HisabKitab 360 - Central Database Type & Contract Definitions
 * -------------------------------------------------------------
 * Provides runtime schema descriptors, field validators, and TypeScript-style
 * metadata to guarantee end-to-end consistency between Supabase and Frontend.
 */

export const Tables = {
  ORGANIZATIONS: 'organizations',
  BRANCHES: 'branches',
  COUNTERS: 'counters',
  USERS: 'user_profiles',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  INVOICES: 'invoices',
  INVOICE_ITEMS: 'invoice_items',
  CUSTOMERS: 'customers',
  DEBTS: 'debts',
  LEDGER_ENTRIES: 'ledger_entries',
  AUDIT_LEDGER: 'audit_ledger',
  IDEMPOTENCY_KEYS: 'idempotency_keys'
};

export const PaymentMethods = {
  CASH: 'cash',
  BKASH: 'bkash',
  NAGAD: 'nagad',
  ROCKET: 'rocket',
  CARD: 'card',
  BANK: 'bank',
  CREDIT: 'credit'
};

export const InvoiceStatus = {
  COMPLETED: 'completed',
  PENDING: 'pending',
  DRAFT: 'draft',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

/**
 * Validate Product Payload
 */
export function validateProductPayload(product) {
  const errors = [];
  if (!product.name || typeof product.name !== 'string' || product.name.trim().length === 0) {
    errors.push('পণ্যের নাম অবশ্যই দিতে হবে');
  }
  if (product.sell_price === undefined || Number(product.sell_price) < 0) {
    errors.push('বিক্রয়মূল্য সঠিক নয়');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate POS Sale Payload
 */
export function validateSalePayload(sale) {
  const errors = [];
  if (!sale.items || !Array.isArray(sale.items) || sale.items.length === 0) {
    errors.push('ইনভয়েসে কমপক্ষে একটি পণ্য থাকতে হবে');
  }
  if (sale.grand_total === undefined || Number(sale.grand_total) < 0) {
    errors.push('মোট টাকার পরিমাণ সঠিক নয়');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}
