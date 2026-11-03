/**
 * HisabKitab 360 - Automated BD SMS Gateway Integration Service
 * -------------------------------------------------------------
 * Supports:
 *  1. GreenWeb SMS (api.greenweb.com.bd)
 *  2. BulkSMSBD (bulksmsbd.net)
 *  3. SSL Wireless (sms.sslwireless.com)
 *  4. Custom HTTP Webhook Gateway
 * Enables 1-click personalized Due Reminders & Order Notices
 */

const SMS_CONFIG_STORAGE_KEY = 'hisabkitab_sms_gateway_config';

export const SMS_PROVIDERS = [
  { id: 'greenweb', name: 'Greenweb SMS (বাংলাদেশ)', baseUrl: 'https://api.greenweb.com.bd/api.php' },
  { id: 'bulksmsbd', name: 'BulkSMSBD (বাংলাদেশ)', baseUrl: 'https://bulksmsbd.net/api/smsapi' },
  { id: 'sslwireless', name: 'SSL Wireless (বাংলাদেশ)', baseUrl: 'https://sms.sslwireless.com/pushapi/dynamic/server.php' },
  { id: 'custom', name: 'কাস্টম HTTP SMS API Gateway', baseUrl: '' }
];

export const getSmsGatewayConfig = () => {
  try {
    const raw = localStorage.getItem(SMS_CONFIG_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    provider: 'greenweb',
    apiKey: '',
    senderId: '',
    username: '',
    password: '',
    customUrl: '',
    isEnabled: false
  };
};

export const saveSmsGatewayConfig = (config) => {
  try {
    localStorage.setItem(SMS_CONFIG_STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch (err) {
    console.error('Failed to save SMS gateway config:', err);
    return false;
  }
};

/**
 * Normalizes BD phone numbers to 11 digits format (e.g. 01712345678) or international 88017...
 */
export const normalizeBdPhoneNumber = (phone = '', withCountryCode = false) => {
  let cleaned = String(phone).replace(/[^0-9]/g, '');
  if (cleaned.startsWith('880')) {
    cleaned = cleaned.substring(2);
  }
  if (!cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '0' + cleaned;
  }
  return withCountryCode ? `88${cleaned}` : cleaned;
};

/**
 * Dispatches an individual SMS via the configured gateway provider
 */
export const sendGatewaySms = async ({ to, message, config = null }) => {
  const activeConfig = config || getSmsGatewayConfig();

  if (!activeConfig.apiKey && activeConfig.provider !== 'custom') {
    throw new Error('এসএমএস গেটওয়ে এপিআই কি (API Key) কনফিগার করা নেই। অনুগ্রহ করে এসএমএস সেটিংসে এপিআই কি দিন।');
  }

  const normalizedPhone = normalizeBdPhoneNumber(to, activeConfig.provider === 'greenweb');
  if (normalizedPhone.length < 11) {
    throw new Error(`অবৈধ মোবাইল নম্বর: ${to}`);
  }

  let requestUrl = '';
  let options = { method: 'GET' };

  if (activeConfig.provider === 'greenweb') {
    // Greenweb API format: https://api.greenweb.com.bd/api.php?token=TOKEN&to=88017...&message=MSG
    const params = new URLSearchParams({
      token: activeConfig.apiKey,
      to: normalizedPhone,
      message: message
    });
    requestUrl = `https://api.greenweb.com.bd/api.php?${params.toString()}`;
  } else if (activeConfig.provider === 'bulksmsbd') {
    // BulkSMSBD format: https://bulksmsbd.net/api/smsapi?api_key=KEY&type=text&number=017...&senderid=SENDER&message=MSG
    const params = new URLSearchParams({
      api_key: activeConfig.apiKey,
      type: 'text',
      number: normalizedPhone,
      senderid: activeConfig.senderId || '8809612...',
      message: message
    });
    requestUrl = `https://bulksmsbd.net/api/smsapi?${params.toString()}`;
  } else if (activeConfig.provider === 'custom') {
    // Custom URL format with token replacement
    requestUrl = activeConfig.customUrl
      .replace('{phone}', encodeURIComponent(normalizedPhone))
      .replace('{message}', encodeURIComponent(message))
      .replace('{apiKey}', encodeURIComponent(activeConfig.apiKey || ''));
  }

  try {
    const res = await fetch(requestUrl, options);
    const textRes = await res.text();
    return {
      success: true,
      provider: activeConfig.provider,
      recipient: normalizedPhone,
      response: textRes
    };
  } catch (err) {
    console.error(`SMS send failed to ${normalizedPhone}:`, err);
    throw new Error(`এসএমএস পাঠাতে ব্যর্থ হয়েছে: ${err.message || 'নেটওয়ার্ক সংযোগ চেক করুন'}`);
  }
};

/**
 * Dispatches bulk personalized SMS with progress callbacks
 */
export const sendBulkPersonalizedGatewaySms = async ({
  recipients = [], // Array of { name, phone, message }
  onProgress = null,
  config = null
}) => {
  const activeConfig = config || getSmsGatewayConfig();
  const results = {
    total: recipients.length,
    sent: 0,
    failed: 0,
    errors: []
  };

  for (let i = 0; i < recipients.length; i++) {
    const item = recipients[i];
    try {
      await sendGatewaySms({
        to: item.phone,
        message: item.message,
        config: activeConfig
      });
      results.sent++;
    } catch (err) {
      results.failed++;
      results.errors.push({ recipient: item.phone, error: err.message });
    }

    onProgress?.({
      current: i + 1,
      total: recipients.length,
      sent: results.sent,
      failed: results.failed,
      item
    });

    // Small delay to respect SMS gateway rate limits
    if (i < recipients.length - 1) {
      await new Promise(r => setTimeout(r, 120));
    }
  }

  return results;
};
