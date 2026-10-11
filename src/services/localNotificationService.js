/**
 * Smart Scheduled & Real-Time Local Notification Engine for Android / PWA
 * -----------------------------------------------------------------------
 * Handles morning due reminders, evening shop closing Z-reports,
 * instant low-stock alerts, and successful sale confirmations.
 */

import { hapticFeedback } from './nativeAppService';

export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined') return false;

  // In Android APK, native notifications are handled via system bridge
  if (window.AndroidNotificationBridge) {
    return true;
  }

  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    try {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    } catch {
      return false;
    }
  }
  return false;
};

export const sendLocalNotification = (title, options = {}) => {
  if (typeof window === 'undefined') return false;

  // 1. Native Android OS Status-Bar Notification (High Priority + Sound & Vibration)
  if (window.AndroidNotificationBridge && typeof window.AndroidNotificationBridge.showNotification === 'function') {
    try {
      const body = options.body || '';
      const tag = options.tag || ('notif_' + Date.now());
      const success = window.AndroidNotificationBridge.showNotification(title, body, tag);
      if (success) return true;
    } catch (e) {
      console.warn('Native notification bridge error:', e);
    }
  }

  // 2. Standard Web Notification API Fallback (Desktop / PWA)
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        vibrate: [200, 100, 200],
        ...options
      });

      notif.onclick = () => {
        window.focus();
        if (options.url) {
          window.location.href = options.url;
        }
      };
      return true;
    } catch {
      return false;
    }
  }
  return false;
};

/**
 * Triggers instant Low-Stock alert notification
 */
export const notifyLowStockAlert = (productName, remainingStock) => {
  hapticFeedback.warning();
  sendLocalNotification('⚠️ লো-স্টক সতর্কতা | HisabKitab 360', {
    body: `"${productName}" এর মজুদ কমে ${remainingStock} টিতে নেমেছে! নতুন মাল তোলার অর্ডার দিন।`,
    tag: `low_stock_${productName}`,
    url: '/?tab=inventory'
  });
};

/**
 * Triggers instant Sale Completion notification
 */
export const notifySaleCompleted = (invoiceNumber, grandTotal) => {
  hapticFeedback.success();
  sendLocalNotification('🧾 বিক্রয় সম্পন্ন!', {
    body: `ইনভয়েস #${invoiceNumber}: মোট ৳${Number(grandTotal).toLocaleString()} সফলভাবে ক্যাশ ইন হয়েছে।`,
    tag: 'sale_success',
    url: '/?tab=invoices'
  });
};

/**
 * Checks if morning due reminder or evening closing prompt is due today
 */
export const checkDailyScheduledNotifications = ({ overdueDebtsCount = 0, todaySalesTotal = 0 }) => {
  const now = new Date();
  const currentHour = now.getHours();
  const todayStr = now.toISOString().split('T')[0];

  // Morning 9 AM - 12 PM: Overdue debts alert
  if (currentHour >= 9 && currentHour < 12 && overdueDebtsCount > 0) {
    const key = `hk360_notif_due_${todayStr}`;
    if (!localStorage.getItem(key)) {
      sendLocalNotification('📒 সকালের বাকি তাগাদা রিমাইন্ডার', {
        body: `আজ ${overdueDebtsCount} জন কাস্টমারের বকেয়া মেয়াদোত্তীর্ণ। ১-ট্যাপে তাগাদা মেসেজ পাঠান।`,
        tag: 'morning_due',
        url: '/?tab=debts'
      });
      localStorage.setItem(key, 'true');
    }
  }

  // Evening 9 PM - 11 PM: Daily closing reminder
  if (currentHour >= 21) {
    const key = `hk360_notif_close_${todayStr}`;
    if (!localStorage.getItem(key)) {
      sendLocalNotification('🌙 হিসাবকিতাব ৩৬০ - দোকান ক্লোজিং রিমাইন্ডার', {
        body: `আজকের বিক্রয়: ৳${Number(todaySalesTotal).toLocaleString()}। ক্যাশ ড্রয়ার ও Z-রিপোর্ট ক্লোজ করুন।`,
        tag: 'evening_close',
        url: '/?tab=dashboard'
      });
      localStorage.setItem(key, 'true');
    }
  }
};
