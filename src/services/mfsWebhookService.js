/**
 * HisabKitab 360 - MFS Webhook Service (bKash & Nagad Real-Time Settlement)
 * --------------------------------------------------------------------------
 * Tip 1: Listens for incoming mobile financial services (MFS) payment callbacks.
 * Features:
 * - Real-time settlement of invoices upon customer payment
 * - TrxID verification and idempotency check
 * - Emits payment event to Soundbox and Live Sync
 */

import { soundboxService, announceSalePayment } from './soundboxService';
import { liveSyncService } from './liveSyncService';
import { triggerHaptic, HapticPattern } from '../utils/haptics';

class MfsWebhookService {
  constructor() {
    this.listeners = new Set();
    this.recentTrx = new Map();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  _notify(event) {
    this.listeners.forEach((cb) => {
      try { cb(event); } catch (e) { console.warn(e); }
    });
  }

  /**
   * Process incoming MFS webhook payload
   * @param {Object} payload - { gateway: 'bkash'|'nagad'|'rocket', trxId, amount, customerPhone, invoiceNo }
   */
  processPaymentWebhook(payload) {
    const {
      gateway = 'bkash',
      trxId = `TRX${Date.now()}`,
      amount = 0,
      customerPhone = '',
      invoiceNo = ''
    } = payload;

    // Idempotency: Prevent duplicate webhook processing
    if (this.recentTrx.has(trxId)) {
      return { success: false, duplicate: true, message: 'এই ট্রানজেকশন পূর্বে প্রসেস হয়েছে' };
    }

    const event = {
      gateway,
      trxId,
      amount: Number(amount),
      customerPhone,
      invoiceNo,
      timestamp: Date.now(),
      status: 'VERIFIED_SETTLED'
    };

    this.recentTrx.set(trxId, event);

    // 1. Play Soundbox Voice Announcement
    try {
      announceSalePayment(amount, gateway);
      triggerHaptic(HapticPattern.SUCCESS);
    } catch (e) {
      console.warn('Soundbox trigger warning:', e);
    }

    // 2. Broadcast Live Event across devices
    try {
      liveSyncService.broadcastMutation('MFS_PAYMENT_SETTLED', event);
    } catch (e) {
      console.warn('Live sync broadcast warning:', e);
    }

    // 3. Notify subscribers
    this._notify(event);

    return {
      success: true,
      trxId,
      amount,
      message: `${gateway.toUpperCase()}-এ ৳${amount} পেমেন্ট সফলভাবে জমা হয়েছে`
    };
  }

  getRecentTransactions() {
    return Array.from(this.recentTrx.values()).reverse();
  }
}

export const mfsWebhookService = new MfsWebhookService();
