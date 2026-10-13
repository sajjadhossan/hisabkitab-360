/**
 * HisabKitab 360 - Automated WhatsApp/SMS Alert Hub & Due Reminders (Feature 3)
 * ----------------------------------------------------------------------------
 * Manages automated multi-channel messaging:
 * - Daily P&L digest calculation & automated delivery formatting
 * - Customer Due Reminders with direct WhatsApp link & SMS webhook dispatch
 * - Low-stock alerts and emergency cash drawer digests
 * - Webhook bridge for external SMS/WhatsApp gateways (e.g., Twilio, Greenweb, UltraMsg)
 */

const NOTIFICATION_CONFIG_KEY = 'hk360_notification_gateway_cfg';

export const DEFAULT_NOTIFICATION_CONFIG = {
  enabled: true,
  webhookUrl: '',
  apiKey: '',
  senderId: 'HisabKitab',
  channel: 'whatsapp_web', // 'whatsapp_web' | 'webhook' | 'sms_gateway'
  autoDailyDigest: true,
  digestTime: '22:00',
  dueReminderTemplate: 'আসসালামু আলাইকুম {customer_name}, {shop_name} থেকে আপনার বকেয়া {due_amount} টাকা পরিশোধের জন্য বিনীত অনুরোধ করা হচ্ছে। ধন্যবাদ।'
};

export function getNotificationConfig() {
  try {
    const raw = localStorage.getItem(NOTIFICATION_CONFIG_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_CONFIG;
    return { ...DEFAULT_NOTIFICATION_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NOTIFICATION_CONFIG;
  }
}

export function saveNotificationConfig(cfg) {
  try {
    localStorage.setItem(NOTIFICATION_CONFIG_KEY, JSON.stringify(cfg));
  } catch (err) {
    console.error('Failed to save notification config', err);
  }
}

/**
 * Generates an instant WhatsApp Web direct click-to-chat URL
 */
export function generateWhatsAppLink(phoneNumber, message) {
  if (!phoneNumber) return null;
  // Clean phone number: remove non-digits
  let cleanPhone = String(phoneNumber).replace(/\D/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '88' + cleanPhone; // Bangladesh default country code
  }
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
}

/**
 * Creates formatted Due Reminder text
 */
export function buildDueReminderMessage(customer, businessSettings = {}) {
  const config = getNotificationConfig();
  const shopName = businessSettings.businessName || 'আমাদের দোকান';
  const customerName = customer.name || 'গ্রাহক';
  const dueAmount = Number(customer.outstandingDue || customer.dueAmount || 0).toLocaleString();

  let msg = config.dueReminderTemplate || DEFAULT_NOTIFICATION_CONFIG.dueReminderTemplate;
  msg = msg
    .replace('{customer_name}', customerName)
    .replace('{shop_name}', shopName)
    .replace('{due_amount}', dueAmount);

  return msg;
}

/**
 * Computes Daily P&L Digest Summary
 */
export function calculateDailyDigest({ sales = [], expenses = [], businessSettings = {} }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const shopName = businessSettings.businessName || 'HisabKitab 360';

  const todaySales = sales.filter((s) => s.date && s.date.startsWith(todayStr));
  const totalSalesRevenue = todaySales.reduce((acc, s) => acc + (Number(s.grandTotal) || 0), 0);
  const totalPaidCash = todaySales.reduce((acc, s) => acc + (Number(s.paidAmount) || 0), 0);
  const totalDueCreated = todaySales.reduce((acc, s) => acc + (Number(s.dueAmount) || 0), 0);
  const totalCost = todaySales.reduce((acc, s) => {
    if (!Array.isArray(s.items)) return acc;
    return acc + s.items.reduce((sum, item) => sum + ((Number(item.costPrice) || 0) * (Number(item.qty) || 1)), 0);
  }, 0);

  const todayExpenses = expenses.filter((e) => e.date && e.date.startsWith(todayStr));
  const totalExpenseAmount = todayExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

  const grossProfit = totalSalesRevenue - totalCost;
  const netProfit = grossProfit - totalExpenseAmount;

  const formattedMessage = `📊 *${shopName} - দৈনিক হিসাব বিবরণী*\n` +
    `📅 তারিখ: ${new Date().toLocaleDateString('bn-BD')}\n` +
    `--------------------------------\n` +
    `💰 মোট বিক্রয়: ৳ ${totalSalesRevenue.toLocaleString()}\n` +
    `💵 নগদ সংগৃহীত: ৳ ${totalPaidCash.toLocaleString()}\n` +
    `🧾 নতুন বকেয়া: ৳ ${totalDueCreated.toLocaleString()}\n` +
    `💸 মোট খরচ: ৳ ${totalExpenseAmount.toLocaleString()}\n` +
    `📈 আনুমানিক মোট লাভ: ৳ ${grossProfit.toLocaleString()}\n` +
    `💎 নেট লাভ (খরচ বাদে): ৳ ${netProfit.toLocaleString()}\n` +
    `🧾 মোট ইনভয়েস সংখ্যা: ${todaySales.length} টি\n` +
    `--------------------------------\n` +
    `স্বয়ংক্রিয়ভাবে প্রেরিত - HisabKitab 360 Enterprise`;

  return {
    date: todayStr,
    totalSalesRevenue,
    totalPaidCash,
    totalDueCreated,
    totalExpenseAmount,
    grossProfit,
    netProfit,
    invoicesCount: todaySales.length,
    formattedMessage
  };
}

/**
 * Dispatches notification to configured Webhook / SMS Gateway
 */
export async function dispatchNotificationWebhook({ eventType, recipientPhone, recipientName, message, payload = {} }) {
  const config = getNotificationConfig();

  // If user only wants WhatsApp Web link
  if (config.channel === 'whatsapp_web' || !config.webhookUrl) {
    const waUrl = generateWhatsAppLink(recipientPhone, message);
    return {
      success: true,
      channel: 'whatsapp_web',
      link: waUrl,
      message: 'WhatsApp Web লিঙ্ক তৈরি হয়েছে'
    };
  }

  // Webhook / SMS Gateway POST
  try {
    const body = {
      eventType, // 'DUE_REMINDER' | 'DAILY_DIGEST' | 'LOW_STOCK'
      recipientPhone,
      recipientName,
      message,
      senderId: config.senderId,
      timestamp: new Date().toISOString(),
      metadata: payload
    };

    const headers = { 'Content-Type': 'application/json' };
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
      headers['X-Api-Key'] = config.apiKey;
    }

    const res = await fetch(config.webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    }

    const data = await res.json().catch(() => ({}));
    return {
      success: true,
      channel: 'webhook',
      response: data,
      message: 'সফলভাবে নোটিফিকেশন ওয়েবহুকে পাঠানো হয়েছে'
    };
  } catch (err) {
    return {
      success: false,
      channel: 'webhook',
      error: err.message,
      message: `ওয়েবহুক পাঠাতে ব্যর্থ: ${err.message}`
    };
  }
}
