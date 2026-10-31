/**
 * Somiti 360 - Retail Merchant & Vendor Partner Service
 * --------------------------------------------------------
 * Enables closed-loop cashless shopping and microcredit settlements
 * between Samity members and local retail merchants (Groceries, Pharmacies, Agri-stores).
 */

import { putLocalRecord, STORES } from './somitiOfflineStore';
import { generateReceiptNumber } from './samityService';
import { announceDepositSoundbox } from './voiceSoundboxService';

const STORAGE_PREFIX = 'somiti360_merchants_';
const TX_STORAGE_PREFIX = 'somiti360_merchant_txs_';

export const MERCHANT_CATEGORIES = [
  { id: 'grocery', nameBn: 'মুদি ও ডিপার্টমেন্টাল স্টোর', nameEn: 'Grocery & Superstore', icon: 'ShoppingBag' },
  { id: 'pharmacy', nameBn: 'ফার্মেসি ও ড্রাগ হাউস', nameEn: 'Pharmacy & Healthcare', icon: 'Activity' },
  { id: 'agriculture', nameBn: 'সার, কীটনাশক ও বীজ ভাণ্ডার', nameEn: 'Agri Fertilizer & Seeds', icon: 'Sprout' },
  { id: 'feed_poultry', nameBn: 'পোল্ট্রি, ডেইরি ও মাছের খাদ্য', nameEn: 'Feed & Poultry Supplies', icon: 'Feather' },
  { id: 'hardware', nameBn: 'হার্ডওয়্যার ও ইলেকট্রনিক্স', nameEn: 'Hardware & Electronics', icon: 'Wrench' },
  { id: 'clothing', nameBn: 'বস্ত্রালয় ও গার্মেন্টস', nameEn: 'Clothing & Fabrics', icon: 'Scissors' },
  { id: 'other', nameBn: 'অন্যান্য পাইকারি ও খুচরা ব্যবসা', nameEn: 'General Retailer', icon: 'Store' }
];

// Initial realistic seed merchants for local demo & onboarding
const DEFAULT_SEED_MERCHANTS = [
  {
    id: 'MRC-001',
    businessName: 'মেসার্স ভাই ভাই জেনারেল স্টোর',
    ownerName: 'মোঃ বাবুল হোসেন',
    mobile: '01711223344',
    category: 'grocery',
    address: 'চৌরাস্তা বাজার, সমিতি মোড়',
    commissionRate: 1.5,
    totalSales: 45000,
    currentReceivable: 12500,
    status: 'active',
    rating: '5.0',
    joinedDate: '2026-01-15'
  },
  {
    id: 'MRC-002',
    businessName: 'জনসেবা ফার্মেসি ও মেডিসিন কর্নার',
    ownerName: 'ডাঃ রফিকুল ইসলাম',
    mobile: '01822334455',
    category: 'pharmacy',
    address: 'হাসপাতাল গেট রোড, দোকান নং ৪',
    commissionRate: 1.0,
    totalSales: 28000,
    currentReceivable: 6200,
    status: 'active',
    rating: '4.9',
    joinedDate: '2026-02-01'
  },
  {
    id: 'MRC-003',
    businessName: 'কৃষি বান্ধব সার ও বীজ ভাণ্ডার',
    ownerName: 'মোঃ মোজাম্মেল হক',
    mobile: '01933445566',
    category: 'agriculture',
    address: 'কৃষি ভবন সংলগ্ন, নতুন বাজার',
    commissionRate: 2.0,
    totalSales: 64000,
    currentReceivable: 18000,
    status: 'active',
    rating: '4.8',
    joinedDate: '2026-02-10'
  }
];

/**
 * Get Merchants List for Samity
 */
export function getMerchantsList(samityId = 'SAMITY-001') {
  if (typeof window === 'undefined') return DEFAULT_SEED_MERCHANTS;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${samityId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_SEED_MERCHANTS;
}

/**
 * Save / Update Merchant
 */
export function saveMerchantRecord(merchant, samityId = 'SAMITY-001') {
  const currentList = getMerchantsList(samityId);
  const now = new Date().toISOString();

  let updatedList;
  if (merchant.id && currentList.some(m => m.id === merchant.id)) {
    updatedList = currentList.map(m => m.id === merchant.id ? { ...m, ...merchant, updatedAt: now } : m);
  } else {
    const newMerchant = {
      ...merchant,
      id: merchant.id || `MRC-${Date.now().toString().slice(-4)}`,
      totalSales: merchant.totalSales || 0,
      currentReceivable: merchant.currentReceivable || 0,
      status: merchant.status || 'active',
      joinedDate: merchant.joinedDate || now.split('T')[0],
      createdAt: now,
      updatedAt: now
    };
    updatedList = [newMerchant, ...currentList];
  }

  try {
    localStorage.setItem(`${STORAGE_PREFIX}${samityId}`, JSON.stringify(updatedList));
  } catch {}

  return updatedList;
}

/**
 * Get Merchant Transactions
 */
export function getMerchantTransactions(samityId = 'SAMITY-001') {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${TX_STORAGE_PREFIX}${samityId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

/**
 * Record a Merchant QR Purchase Transaction
 */
export function recordMerchantPurchase(purchaseData, samityInfo = {}) {
  const samityId = samityInfo.id || 'SAMITY-001';
  const txs = getMerchantTransactions(samityId);
  const merchants = getMerchantsList(samityId);
  const now = new Date().toISOString();

  const amount = Number(purchaseData.amount || 0);
  const txId = `MTX-${Date.now().toString().slice(-6)}`;

  const newTx = {
    id: txId,
    type: 'purchase',
    samityId,
    merchantId: purchaseData.merchantId,
    merchantName: purchaseData.merchantName,
    memberId: purchaseData.memberId,
    memberName: purchaseData.memberName,
    amount: amount,
    itemsDescription: purchaseData.itemsDescription || 'নিত্যপ্রয়োজনীয় মালামাল',
    date: now.split('T')[0],
    time: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
    status: 'approved',
    createdAt: now
  };

  const updatedTxs = [newTx, ...txs];
  localStorage.setItem(`${TX_STORAGE_PREFIX}${samityId}`, JSON.stringify(updatedTxs));

  // Update merchant balance
  const updatedMerchants = merchants.map(m => {
    if (m.id === purchaseData.merchantId) {
      return {
        ...m,
        totalSales: (m.totalSales || 0) + amount,
        currentReceivable: (m.currentReceivable || 0) + amount
      };
    }
    return m;
  });
  localStorage.setItem(`${STORAGE_PREFIX}${samityId}`, JSON.stringify(updatedMerchants));

  // Trigger Soundbox E-Voice Announcement
  announceDepositSoundbox({
    memberName: purchaseData.memberName,
    amount: amount,
    type: `মার্চেন্ট ${purchaseData.merchantName} কেনাকাটা`
  }, samityInfo);

  return { newTx, updatedMerchants, updatedTxs };
}

/**
 * Settle / Pay Merchant Receivable Balance
 */
export function settleMerchantPayment(settlementData, samityInfo = {}) {
  const samityId = samityInfo.id || 'SAMITY-001';
  const txs = getMerchantTransactions(samityId);
  const merchants = getMerchantsList(samityId);
  const now = new Date().toISOString();

  const amount = Number(settlementData.amount || 0);
  const txId = `SETTLE-${Date.now().toString().slice(-6)}`;

  const newTx = {
    id: txId,
    type: 'settlement',
    samityId,
    merchantId: settlementData.merchantId,
    merchantName: settlementData.merchantName,
    amount: amount,
    paymentMethod: settlementData.paymentMethod || 'ক্যাশ',
    date: now.split('T')[0],
    time: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
    remarks: settlementData.remarks || 'দোকানদারের পাওনা বিল পরিশোধ',
    status: 'completed',
    createdAt: now
  };

  const updatedTxs = [newTx, ...txs];
  localStorage.setItem(`${TX_STORAGE_PREFIX}${samityId}`, JSON.stringify(updatedTxs));

  // Reduce merchant receivable balance
  const updatedMerchants = merchants.map(m => {
    if (m.id === settlementData.merchantId) {
      return {
        ...m,
        currentReceivable: Math.max(0, (m.currentReceivable || 0) - amount)
      };
    }
    return m;
  });
  localStorage.setItem(`${STORAGE_PREFIX}${samityId}`, JSON.stringify(updatedMerchants));

  return { newTx, updatedMerchants, updatedTxs };
}

/**
 * Builds QR Code string for Counter Standee
 */
export function buildMerchantStandeeQrString(merchant, samityInfo = {}) {
  const samityName = samityInfo.nameBn || samityInfo.name || 'Somiti 360';
  return `SOMITI360:MERCHANT:${merchant.id}:${encodeURIComponent(merchant.businessName)}:${samityInfo.id || 'SAMITY'}`;
}
