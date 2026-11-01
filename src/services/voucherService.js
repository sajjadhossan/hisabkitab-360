/**
 * HisabKitab 360 - Store Credit & Exchange Voucher Engine
 * Handles generation, tracking, and redemption of product return vouchers & customer store credits.
 */

import { safeJsonParse } from '../utils/safeJson';

const VOUCHER_STORAGE_KEY = 'hk360_store_vouchers';

export const voucherService = {
  /**
   * Get all vouchers from local storage
   */
  getVouchers: () => {
    try {
      const raw = localStorage.getItem(VOUCHER_STORAGE_KEY);
      return safeJsonParse(raw, []);
    } catch {
      return [];
    }
  },

  /**
   * Save vouchers array to storage and emit update event
   */
  saveVouchers: (vouchers) => {
    try {
      localStorage.setItem(VOUCHER_STORAGE_KEY, JSON.stringify(vouchers));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hk360_vouchers_updated', { detail: vouchers }));
      }
      return true;
    } catch (e) {
      console.error('Failed to save vouchers:', e);
      return false;
    }
  },

  /**
   * Generate an official Exchange / Store Credit Voucher
   */
  createExchangeVoucher: ({
    amount,
    customerName = 'সাধারণ ক্রেতা',
    customerPhone = '',
    customerId = null,
    invoiceId = '',
    returnId = '',
    notes = '',
    validityDays = 30
  }) => {
    const numAmount = Math.max(0, Number(amount) || 0);
    if (numAmount <= 0) return null;

    // Generate readable, easy-to-type 6-digit code e.g. EX-581920
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const code = `EX-${randomDigits}`;

    const now = new Date();
    const expiry = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);

    const newVoucher = {
      id: `vch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      code,
      type: 'exchange', // 'exchange' | 'store_credit' | 'gift'
      initialAmount: numAmount,
      balance: numAmount,
      currency: 'BDT',
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerId: customerId || null,
      originalInvoiceId: invoiceId,
      returnId: returnId,
      notes: notes.trim(),
      issueDate: now.toISOString(),
      expiresAt: expiry.toISOString(),
      status: 'active', // 'active' | 'partially_used' | 'used' | 'cancelled' | 'expired'
      redemptions: []
    };

    const currentVouchers = voucherService.getVouchers();
    const updated = [newVoucher, ...currentVouchers];
    voucherService.saveVouchers(updated);

    return newVoucher;
  },

  /**
   * Find voucher by code or phone number
   */
  findVoucher: (query) => {
    if (!query) return null;
    const cleanQuery = query.toString().trim().toUpperCase();
    const vouchers = voucherService.getVouchers();
    
    return vouchers.find(v => {
      const matchCode = v.code && v.code.toUpperCase() === cleanQuery;
      const matchId = v.id && v.id.toUpperCase() === cleanQuery;
      return matchCode || matchId;
    }) || null;
  },

  /**
   * Find active vouchers by customer phone or customer ID
   */
  getCustomerActiveVouchers: (customerIdOrPhone) => {
    if (!customerIdOrPhone) return [];
    const query = customerIdOrPhone.toString().trim();
    const now = new Date();
    const vouchers = voucherService.getVouchers();

    return vouchers.filter(v => {
      const match = (v.customerId && v.customerId === query) || (v.customerPhone && v.customerPhone === query);
      const isUsable = (v.status === 'active' || v.status === 'partially_used') && v.balance > 0;
      const notExpired = !v.expiresAt || new Date(v.expiresAt) > now;
      return match && isUsable && notExpired;
    });
  },

  /**
   * Redeem voucher partially or fully
   */
  redeemVoucher: (code, amountToRedeem, saleId = null) => {
    const voucher = voucherService.findVoucher(code);
    if (!voucher) {
      return { success: false, message: 'ভাউচারটি পাওয়া যায়নি।' };
    }

    const now = new Date();
    if (voucher.expiresAt && new Date(voucher.expiresAt) < now) {
      return { success: false, message: 'ভাউচারটির মেয়াদ শেষ হয়ে গেছে!' };
    }

    if (voucher.status === 'used' || voucher.balance <= 0) {
      return { success: false, message: 'এই ভাউচারটির সম্পূর্ণ ব্যালেন্স ইতিমধ্যে ব্যবহৃত হয়েছে।' };
    }

    if (voucher.status === 'cancelled') {
      return { success: false, message: 'এই ভাউচারটি বাতিল করা হয়েছে।' };
    }

    const deductAmount = Math.min(voucher.balance, Math.max(0, Number(amountToRedeem) || 0));
    if (deductAmount <= 0) {
      return { success: false, message: 'ভাউচার ছাড়ের পরিমাণ শূন্য হতে পারে না।' };
    }

    const newBalance = Math.max(0, voucher.balance - deductAmount);
    const newStatus = newBalance === 0 ? 'used' : 'partially_used';

    const redemptionRecord = {
      id: `red_${Date.now()}`,
      amount: deductAmount,
      date: now.toISOString(),
      saleId: saleId || null,
      balanceBefore: voucher.balance,
      balanceAfter: newBalance
    };

    const updatedVoucher = {
      ...voucher,
      balance: newBalance,
      status: newStatus,
      redemptions: [...(voucher.redemptions || []), redemptionRecord]
    };

    const vouchers = voucherService.getVouchers();
    const updatedList = vouchers.map(v => v.id === voucher.id ? updatedVoucher : v);
    voucherService.saveVouchers(updatedList);

    return {
      success: true,
      redeemedAmount: deductAmount,
      remainingBalance: newBalance,
      voucher: updatedVoucher
    };
  },

  /**
   * Cancel or void a voucher (manager/owner action)
   */
  cancelVoucher: (code, reason = '') => {
    const voucher = voucherService.findVoucher(code);
    if (!voucher) return false;

    const updated = {
      ...voucher,
      status: 'cancelled',
      cancelReason: reason,
      cancelledAt: new Date().toISOString()
    };

    const vouchers = voucherService.getVouchers();
    const updatedList = vouchers.map(v => v.id === voucher.id ? updated : v);
    voucherService.saveVouchers(updatedList);
    return true;
  }
};

export default voucherService;
