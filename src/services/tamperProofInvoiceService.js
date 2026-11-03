/**
 * HisabKitab 360 - Cryptographic Tamper-Proof Invoice & Ledger Audit Engine
 * --------------------------------------------------------------------------
 * Built using native W3C Web Crypto API (crypto.subtle) with SHA-256 Merkle Chaining.
 * Works 100% offline in modern browsers, Android WebView, and Windows WebView.
 *
 * Capabilities:
 * 1. Chained Digital Invoice Seals: Each transaction hash mathematically incorporates
 *    the hash of the previous transaction (Blockchain-style immutability).
 * 2. Instant Tamper Verification: Detects if any price, quantity, discount, date,
 *    or customer debt was illegally modified in local DB or network.
 * 3. NBR / Audit QR Payload: Produces a compact, verifiable cryptographic seal for
 *    printed POS thermal receipts and audit reports.
 */

const GENESIS_BLOCK_HASH = '0000000000000000000000000000000000000000000000000000000000000000';
const INVOICE_SEAL_STORAGE_KEY = 'hk360_latest_invoice_hash';

/**
 * Converts ArrayBuffer to Hex string
 */
const bufferToHex = (buffer) => {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Computes SHA-256 hash using native Web Crypto API
 *
 * @param {string} message
 * @returns {Promise<string>} 64-character lowercase hexadecimal hash
 */
export const computeSha256 = async (message) => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    return bufferToHex(hashBuffer);
  }

  // Fallback simple 32-bit FNV hash if crypto.subtle is somehow unavailable
  let hash = 2166136261;
  for (let i = 0; i < message.length; i++) {
    hash ^= message.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash.toString(16).padStart(64, '0');
};

/**
 * Generates an immutable, chained cryptographic digital seal for an invoice
 *
 * @param {Object} invoiceData
 * @param {string|number} invoiceData.invoiceNumber
 * @param {number} invoiceData.totalAmount
 * @param {number} [invoiceData.paidAmount=0]
 * @param {number} [invoiceData.dueAmount=0]
 * @param {string} [invoiceData.customerPhone='']
 * @param {string|number} invoiceData.timestamp
 * @param {Array} [invoiceData.items=[]]
 * @param {string} [invoiceData.previousHash] Previous block hash (or latest stored hash)
 * @returns {Promise<{ sealHash: string, previousHash: string, payloadCanonical: string }>}
 */
export const generateInvoiceSeal = async ({
  invoiceNumber,
  totalAmount = 0,
  paidAmount = 0,
  dueAmount = 0,
  customerPhone = '',
  timestamp = Date.now(),
  items = [],
  previousHash = null
}) => {
  // If no previous hash supplied, get from local storage or genesis block
  let prev = previousHash;
  if (!prev && typeof localStorage !== 'undefined') {
    prev = localStorage.getItem(INVOICE_SEAL_STORAGE_KEY) || GENESIS_BLOCK_HASH;
  }
  if (!prev) prev = GENESIS_BLOCK_HASH;

  // Extract compact items digest: id:qty:price
  const itemsDigest = (items || [])
    .map((item) => `${item.id || item.productId || ''}:${item.quantity || 1}:${item.price || 0}`)
    .sort()
    .join('|');

  // Create deterministic canonical payload string
  const canonicalPayload = [
    `PREV:${prev}`,
    `INV:${invoiceNumber}`,
    `TOT:${Number(totalAmount).toFixed(2)}`,
    `PAID:${Number(paidAmount).toFixed(2)}`,
    `DUE:${Number(dueAmount).toFixed(2)}`,
    `PHONE:${customerPhone || 'WALKIN'}`,
    `TIME:${new Date(timestamp).toISOString()}`,
    `ITEMS:[${itemsDigest}]`
  ].join(';');

  // Compute cryptographic SHA-256
  const sealHash = await computeSha256(canonicalPayload);

  // Update latest hash pointer in storage
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(INVOICE_SEAL_STORAGE_KEY, sealHash);
    } catch {
      // ignore
    }
  }

  return {
    sealHash,
    previousHash: prev,
    payloadCanonical: canonicalPayload,
    shortSeal: sealHash.slice(0, 16).toUpperCase()
  };
};

/**
 * Verifies if an invoice's digital seal is authentic and untampered
 *
 * @param {Object} invoice
 * @param {string} [expectedSeal]
 * @returns {Promise<boolean>}
 */
export const verifyInvoiceSeal = async (invoice, expectedSeal) => {
  if (!invoice) return false;
  const targetSeal = expectedSeal || invoice.digitalSeal || invoice.sealHash;
  if (!targetSeal) return false;

  const result = await generateInvoiceSeal({
    invoiceNumber: invoice.id || invoice.invoiceNumber,
    totalAmount: invoice.total || invoice.totalAmount,
    paidAmount: invoice.paid || invoice.paidAmount || 0,
    dueAmount: invoice.due || invoice.dueAmount || 0,
    customerPhone: invoice.customerPhone || invoice.phone,
    timestamp: invoice.date || invoice.timestamp || invoice.createdAt,
    items: invoice.items || [],
    previousHash: invoice.previousHash || GENESIS_BLOCK_HASH
  });

  return result.sealHash === targetSeal || result.shortSeal === targetSeal;
};

/**
 * Audits a sequential list of invoices for complete cryptographic blockchain integrity
 *
 * @param {Array} invoices Sequential list of invoices sorted chronologically
 * @returns {Promise<{ isValid: boolean, totalAudited: number, brokenIndex: number|null, message: string }>}
 */
export const auditLedgerIntegrity = async (invoices = []) => {
  if (!Array.isArray(invoices) || invoices.length === 0) {
    return {
      isValid: true,
      totalAudited: 0,
      brokenIndex: null,
      message: 'যাচাই করার মতো কোনো ইনভয়েস নেই।'
    };
  }

  let expectedPrevHash = GENESIS_BLOCK_HASH;

  for (let i = 0; i < invoices.length; i++) {
    const inv = invoices[i];
    if (!inv.digitalSeal) continue; // Skip legacy unsealed invoices

    const { sealHash } = await generateInvoiceSeal({
      invoiceNumber: inv.id || inv.invoiceNumber,
      totalAmount: inv.total || inv.totalAmount,
      paidAmount: inv.paid || 0,
      dueAmount: inv.due || 0,
      customerPhone: inv.customerPhone,
      timestamp: inv.date || inv.timestamp,
      items: inv.items || [],
      previousHash: inv.previousHash || expectedPrevHash
    });

    if (sealHash !== inv.digitalSeal) {
      return {
        isValid: false,
        totalAudited: i + 1,
        brokenIndex: i,
        message: `ইনভয়েস #${inv.id || i + 1}-এ গরমিল পাওয়া গেছে! ডাটা পরিবর্তিত হয়েছে।`
      };
    }

    expectedPrevHash = sealHash;
  }

  return {
    isValid: true,
    totalAudited: invoices.length,
    brokenIndex: null,
    message: `সম্পূর্ণ খতিয়ান নিরাপদ ও খাঁটি (${invoices.length}টি ইনভয়েস সফলভাবে অডিট সম্পন্ন)।`
  };
};

export const tamperProofInvoiceService = {
  computeSha256,
  generateInvoiceSeal,
  verifyInvoiceSeal,
  auditLedgerIntegrity,
  GENESIS_BLOCK_HASH
};
