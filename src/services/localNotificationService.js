/**
 * Smart Scheduled Local Notification Engine for Android / PWA
 * -------------------------------------------------------------
 * Schedules morning due reminders and evening shop closing Z-reports.
 */

export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }
  return false;
};

export const sendLocalNotification = (title, options = {}) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;

  if (Notification.permission === 'granted') {
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
 * Checks if morning due reminder or evening closing prompt is due today
 */
export const checkDailyScheduledNotifications = ({ overdueDebtsCount = 0, todaySalesTotal = 0 }) => {
  const now = new Date();
  const currentHour = now.getHours();
  const todayStr = now.toISOString().split('T')[0];

  // Morning 9 AM - 11 AM: Overdue debts alert
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
        body: `আজকের বিক্রয়: ৳${todaySalesTotal.toLocaleString()}। ক্যাশ ড্রয়ার ও Z-রিপোর্ট ক্লোজ করুন।`,
        tag: 'evening_close',
        url: '/?tab=dashboard'
      });
      localStorage.setItem(key, 'true');
    }
  }
};
