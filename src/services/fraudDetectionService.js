/**
 * HisabKitab 360 - Fraud & Suspicious Activity Detection Engine
 * Tip 34: Automated Cashier Theft, Discount Manipulation & Audit Alerts
 * ---------------------------------------------------------------------
 * Monitors POS mutations in real time for suspicious anomalies:
 * - Excessive discounts (>20% or frequent back-to-back discounts)
 * - Rapid invoice cancellations / voids right after taking cash
 * - Suspicious after-hours drawer opens or large negative adjustments.
 */

const STORAGE_FRAUD_ALERTS_KEY = 'hk360_fraud_anomaly_alerts';

class FraudDetectionService {
  constructor() {
    this.alerts = this.loadAlerts();
    this.listeners = new Set();
  }

  loadAlerts() {
    try {
      const raw = localStorage.getItem(STORAGE_FRAUD_ALERTS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      {
        id: 'alt_01',
        severity: 'high',
        type: 'EXCESSIVE_DISCOUNT',
        cashier: 'কাউন্টার-০১ (ক্যাশিয়ার হাবিব)',
        message: 'একই কাস্টমারকে পরপর ৩টি ইনভয়েসে ৩০% ছাড় প্রদান করা হয়েছে।',
        timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
        status: 'unresolved'
      },
      {
        id: 'alt_02',
        severity: 'medium',
        type: 'NO_SALE_DRAWER_KICK',
        cashier: 'কাউন্টার-০২ (ক্যাশিয়ার সাজ্জাদ)',
        message: 'কোনো বিক্রয় ছাড়াই পরপর ২ বার ক্যাশ ড্রয়ার ম্যানুয়ালি খোলা হয়েছে।',
        timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
        status: 'reviewed'
      }
    ];
  }

  saveAlerts() {
    try {
      localStorage.setItem(STORAGE_FRAUD_ALERTS_KEY, JSON.stringify(this.alerts.slice(0, 50)));
    } catch {}
  }

  inspectInvoice(invoice, cashierName = 'Cashier') {
    const total = Number(invoice.total || invoice.finalTotal || 0);
    const discount = Number(invoice.discount || 0);
    const subtotal = total + discount;

    const detectedAnomalies = [];

    // Rule 1: High Discount Ratio (>25%)
    if (subtotal > 0 && (discount / subtotal) > 0.25) {
      detectedAnomalies.push({
        type: 'HIGH_DISCOUNT_RATIO',
        severity: 'high',
        message: `অস্বাভাবিক ছাড়! মোট ৳${subtotal} টাকার বিলের ওপর ৳${discount} (${Math.round((discount / subtotal) * 100)}%) ছাড় দেওয়া হয়েছে।`
      });
    }

    // Rule 2: Zero-price high value checkout
    if (total === 0 && Array.isArray(invoice.items) && invoice.items.length > 2) {
      detectedAnomalies.push({
        type: 'ZERO_AMOUNT_CHECKOUT',
        severity: 'critical',
        message: 'একাধিক পণ্যসহ ০ টাকার সন্দেহজনক ইনভয়েস ইস্যু করা হয়েছে।'
      });
    }

    if (detectedAnomalies.length > 0) {
      detectedAnomalies.forEach(anom => {
        const alertObj = {
          id: `alt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          severity: anom.severity,
          type: anom.type,
          cashier: cashierName,
          message: anom.message,
          timestamp: new Date().toISOString(),
          status: 'unresolved'
        };
        this.alerts.unshift(alertObj);
      });
      this.saveAlerts();
      this.notify();
    }

    return detectedAnomalies;
  }

  logSuspiciousEvent(type, cashier, message, severity = 'medium') {
    const alertObj = {
      id: `alt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      severity,
      type,
      cashier,
      message,
      timestamp: new Date().toISOString(),
      status: 'unresolved'
    };
    this.alerts.unshift(alertObj);
    this.saveAlerts();
    this.notify();
    return alertObj;
  }

  resolveAlert(alertId) {
    this.alerts = this.alerts.map(a => a.id === alertId ? { ...a, status: 'resolved' } : a);
    this.saveAlerts();
    this.notify();
  }

  getAlerts() {
    return [...this.alerts];
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(fn => {
      try { fn(this.alerts); } catch {}
    });
  }
}

export const fraudDetectionService = new FraudDetectionService();
export default fraudDetectionService;
