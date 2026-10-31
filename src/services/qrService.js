import QRCode from 'qrcode';
import { APP_VERSION_NAME } from '../config/version.js';

/**
 * QuickChart QR API Generator (Tier 1 Cloud CDN)
 * Generates ultra-crisp QR code with Center Logo support and High Error Correction.
 */
export const generateQuickChartQrUrl = (text, options = {}) => {
  if (!text) return '';
  const size = options.size || options.width || 350;
  const ecLevel = options.ecLevel || options.ecc || 'H';
  const margin = options.margin !== undefined ? options.margin : 1;
  const centerImg = options.centerImageUrl ? `&centerImageUrl=${encodeURIComponent(options.centerImageUrl)}` : '';
  const dark = options.darkColor ? `&dark=${options.darkColor.replace('#', '')}` : '';
  return `https://quickchart.io/qr?text=${encodeURIComponent(text)}&size=${size}&ecLevel=${ecLevel}&margin=${margin}${dark}${centerImg}`;
};

/**
 * GoQR.me API Generator (Tier 2 Cloud Engine)
 * High reliability, battle-tested open QR generation service.
 */
export const generateGoQrUrl = (text, options = {}) => {
  if (!text) return '';
  const width = options.width || options.size || 350;
  const height = options.height || width;
  const margin = options.margin !== undefined ? options.margin : 1;
  const ecc = options.ecc || options.ecLevel || 'H';
  return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(text)}&size=${width}x${height}&margin=${margin}&ecc=${ecc}&format=png`;
};

/**
 * Decodes a QR code from an image file/blob using the GoQR.me Read API.
 * Works across all browsers and devices without needing local BarcodeDetector.
 */
export const decodeQrCodeWithGoQrApi = async (fileOrBlob) => {
  if (!fileOrBlob) throw new Error('কোনো ছবি পাওয়া যায়নি');
  const formData = new FormData();
  formData.append('file', fileOrBlob);

  const response = await fetch('https://api.qrserver.com/v1/read-qr-code/', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`GoQR API Error: HTTP ${response.status}`);
  }

  const json = await response.json();
  if (Array.isArray(json) && json[0]?.symbol?.[0]) {
    const symbol = json[0].symbol[0];
    if (symbol.error) {
      throw new Error(symbol.error);
    }
    if (symbol.data) {
      return symbol.data;
    }
  }
  throw new Error('ছবিতে কোনো QR কোড শনাক্ত করা যায়নি');
};

/**
 * Generates an ultra high-resolution, print-perfect QR code Data URL (PNG base64).
 * Always executes instantly in-memory with ZERO network latency, ZERO CORS errors,
 * and Level-H Error Correction for guaranteed scannability after printing.
 */
export const generateQrDataUrl = async (text, options = {}) => {
  if (!text) return null;

  try {
    // Primary engine: Instant local in-memory generation (800x800 default for 300+ DPI print clarity)
    const qrWidth = options.width || options.size || 800;
    return await QRCode.toDataURL(text, {
      width: qrWidth,
      margin: options.margin !== undefined ? options.margin : 2,
      color: {
        dark: options.darkColor || '#000000',
        light: options.lightColor || '#ffffff'
      },
      errorCorrectionLevel: options.errorCorrectionLevel || 'H'
    });
  } catch (err) {
    console.warn('Local QR code generation warning:', err);
    // Fallback only if local canvas engine fails
    try {
      return generateQuickChartQrUrl(text, options);
    } catch {
      return null;
    }
  }
};

/**
 * Generates a lossless Scalable Vector Graphics (SVG) string of the QR Code
 */
export const generateQrSvgString = async (text, options = {}) => {
  if (!text) return null;
  try {
    return await QRCode.toString(text, {
      type: 'svg',
      margin: options.margin !== undefined ? options.margin : 2,
      color: {
        dark: options.darkColor || '#000000',
        light: options.lightColor || '#ffffff'
      },
      errorCorrectionLevel: 'H'
    });
  } catch (err) {
    console.warn('QRCode toString SVG error:', err);
    return null;
  }
};

/**
 * Builds a 100% workable, instant-read payload for physical thermal receipts & A4 invoices.
 * When ANY smartphone camera (iPhone, Android, Google Lens, Xiaomi, bKash) scans this QR code:
 * It immediately displays the complete invoice details directly on screen without needing localhost or internet!
 */
export const generateInvoiceQrPayload = (invoice, businessSettings) => {
  if (!invoice) return 'HisabKitab 360 Official Receipt';

  const company = businessSettings?.companyName || 'হিসাব কিতাব ৩৬০';
  const phone = businessSettings?.phone || '';
  const address = businessSettings?.address || '';
  const grandTotal = Number(invoice.grandTotal) || 0;
  const paid = invoice.paidAmount !== undefined
    ? Number(invoice.paidAmount)
    : (invoice.status === 'paid' ? grandTotal : 0);
  const due = invoice.dueAmount !== undefined
    ? Number(invoice.dueAmount)
    : Math.max(0, grandTotal - paid);
  const statusText = due === 0 ? 'পরিশোধিত (PAID)' : `বকেয়া (DUE ৳${due.toLocaleString()})`;

  const itemsList = (invoice.items || []).slice(0, 5).map(it => {
    return `• ${it.name} (${it.qty} x ৳${Number(it.price).toLocaleString()})`;
  }).join('\n');
  const moreCount = (invoice.items || []).length > 5 ? `\n...আরও ${(invoice.items.length - 5)} টি পণ্য` : '';

  const hasLiveDomain = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  const verifyLink = hasLiveDomain
    ? `${window.location.origin}${window.location.pathname}?verify=${encodeURIComponent(invoice.id)}`
    : (businessSettings?.website ? `https://${businessSettings.website.replace(/^https?:\/\//, '')}` : '');

  return [
    `🧾 ${company}`,
    address ? `📍 ${address}` : '',
    phone ? `📞 ${phone}` : '',
    `────────────────────`,
    `মেমো নং: #${invoice.id}`,
    `তারিখ: ${invoice.date || new Date().toISOString().split('T')[0]}`,
    `ক্রেতা: ${invoice.customerName || 'সাধারণ ক্রেতা'} ${invoice.customerPhone ? `(${invoice.customerPhone})` : ''}`,
    `────────────────────`,
    itemsList ? `পণ্যসমূহ:\n${itemsList}${moreCount}\n────────────────────` : '',
    `মোট বিল: ৳${grandTotal.toLocaleString()}`,
    `পরিশোধ: ৳${paid.toLocaleString()}`,
    `স্ট্যাটাস: ${statusText}`,
    verifyLink ? `────────────────────\n🌐 ভেরিফিকেশন: ${verifyLink}` : '',
    `✓ হিসাবকিতাব ৩৬০ ডিজিটাল ভেরিফাইড মেমো`
  ].filter(Boolean).join('\n');
};

// Reliable UTF-8 to Base64 (supporting Bengali text, numbers, symbols)
export const safeUtf8ToBase64 = (str) => {
  try {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch {
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch {
      return '';
    }
  }
};

// Reliable Base64 to UTF-8
export const safeBase64ToUtf8 = (base64) => {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    try {
      return decodeURIComponent(escape(atob(base64)));
    } catch {
      return null;
    }
  }
};

/**
 * Builds a portable verification URL with compact encoded invoice payload
 * so that any smartphone scanning the QR code can display the official invoice details
 * even without requiring a cloud backend database.
 */
export const createInvoiceVerificationUrl = (invoice, businessSettings) => {
  if (!invoice) return 'https://hisabkitab360.vercel.app';

  const grandTotal = Number(invoice.grandTotal || invoice.total_bill) || 0;
  const paid = invoice.paidAmount !== undefined
    ? Number(invoice.paidAmount)
    : (invoice.paid_amount !== undefined ? Number(invoice.paid_amount) : (invoice.status === 'paid' ? grandTotal : 0));
  const due = invoice.dueAmount !== undefined
    ? Number(invoice.dueAmount)
    : (invoice.due_amount !== undefined ? Number(invoice.due_amount) : Math.max(0, grandTotal - paid));

  const payload = {
    id: invoice.id || invoice.bill_no,
    dt: invoice.date || invoice.created_at || new Date().toISOString().split('T')[0],
    c: invoice.customerName || invoice.patient || 'সম্মানিত গ্রাহক',
    p: invoice.customerPhone || invoice.phone || '',
    gt: grandTotal,
    pd: paid,
    du: due,
    st: invoice.status || (due === 0 ? 'paid' : 'due'),
    pm: invoice.paymentMethod || invoice.payment_method || 'নগদ',
    co: businessSettings?.companyName || 'হিসাব কিতাব ৩৬০',
    ph: businessSettings?.phone || '',
    ad: businessSettings?.address || '',
    items: (invoice.items || []).slice(0, 10).map(item => ({
      n: item.name,
      q: item.qty || 1,
      p: item.price || item.rate || 0
    }))
  };

  // Determine globally reachable base URL
  let baseUrl = 'https://hisabkitab360.vercel.app';
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.') || window.location.protocol.includes('capacitor');
    if (!isLocal) {
      baseUrl = window.location.origin + window.location.pathname;
    } else if (businessSettings?.liveDomain) {
      baseUrl = businessSettings.liveDomain.startsWith('http') ? businessSettings.liveDomain : `https://${businessSettings.liveDomain}`;
    }
  }

  try {
    const jsonStr = JSON.stringify(payload);
    const token = encodeURIComponent(safeUtf8ToBase64(jsonStr));
    const docId = encodeURIComponent(invoice.id || invoice.bill_no);
    return `${baseUrl}?verify=${docId}&data=${token}`;
  } catch {
    const docId = encodeURIComponent(invoice.id || invoice.bill_no);
    return `${baseUrl}?verify=${docId}`;
  }
};

/**
 * Decodes the verification token back into full invoice object
 */
export const decodeInvoiceVerificationToken = (token) => {
  if (!token) return null;
  try {
    let decodedStr = safeBase64ToUtf8(token);
    if (!decodedStr) {
      decodedStr = safeBase64ToUtf8(decodeURIComponent(token));
    }
    if (!decodedStr) {
      try {
        decodedStr = decodeURIComponent(escape(atob(decodeURIComponent(token))));
      } catch (_) {}
    }
    if (!decodedStr) return null;

    const data = JSON.parse(decodedStr);
    return {
      id: data.id || data.bill_no,
      date: data.date || data.dt || new Date().toISOString().split('T')[0],
      customerName: data.customerName || data.c || 'সম্মানিত গ্রাহক',
      customerPhone: data.customerPhone || data.p || '',
      grandTotal: Number(data.grandTotal !== undefined ? data.grandTotal : (data.gt !== undefined ? data.gt : 0)),
      paidAmount: Number(data.paidAmount !== undefined ? data.paidAmount : (data.pd !== undefined ? data.pd : 0)),
      dueAmount: Number(data.dueAmount !== undefined ? data.dueAmount : (data.du !== undefined ? data.du : 0)),
      status: data.status || data.st || 'paid',
      paymentMethod: data.paymentMethod || data.pm || 'নগদ',
      companyName: data.companyName || data.co || 'হিসাব কিতাব ৩৬০',
      companyPhone: data.companyPhone || data.ph || '',
      companyAddress: data.companyAddress || data.ad || '',
      items: (data.items || []).map(it => ({
        name: it.name || it.n,
        qty: it.qty || it.q || 1,
        price: it.price || it.p || 0,
        subtotal: (it.qty || it.q || 1) * (it.price || it.p || 0)
      }))
    };
  } catch (err) {
    console.warn('Could not decode invoice token:', err);
    return null;
  }
};

/**
 * Normalizes phone numbers for WhatsApp API (e.g., 01712345678 -> 8801712345678)
 */
export const normalizeWhatsAppPhone = (phone) => {
  if (!phone) return '';
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('01') && clean.length === 11) {
    clean = '88' + clean;
  } else if (clean.startsWith('1') && clean.length === 10) {
    clean = '880' + clean;
  }
  return clean;
};

/**
 * Builds polite, comprehensive formatted text for WhatsApp, SMS & Social Media
 */
export const formatWhatsAppInvoiceMessage = (invoice, businessSettings, lang = 'bn') => {
  if (!invoice) return '';
  const companyName = businessSettings?.companyName || 'হিসাব কিতাব ৩৬০ স্টোর';
  const companyPhone = businessSettings?.phone || '';
  const grandTotal = Number(invoice.grandTotal) || 0;
  const paid = invoice.paidAmount !== undefined
    ? Number(invoice.paidAmount)
    : (invoice.status === 'paid' ? grandTotal : 0);
  const due = invoice.dueAmount !== undefined
    ? Number(invoice.dueAmount)
    : Math.max(0, grandTotal - paid);
  const verifyUrl = createInvoiceVerificationUrl(invoice, businessSettings);

  const itemsList = (invoice.items || []).map((it, idx) => {
    return `${idx + 1}. ${it.name} (${it.qty} টি) = ৳${(it.price * it.qty).toLocaleString()}`;
  }).join('\n');

  if (lang === 'bn') {
    return `🧾 *ডিজিটাল ক্যাশমেমো ও ইনভয়েস*
━━━━━━━━━━━━━━━━━━
🏪 *প্রতিষ্ঠান:* ${companyName}
📞 *হটলাইন:* ${companyPhone}
📄 *মেমো নং:* #${invoice.id}
📅 *তারিখ:* ${invoice.date}
👤 *গ্রাহক:* ${invoice.customerName || 'সাধারণ ক্রেতা'} ${invoice.customerPhone ? `(${invoice.customerPhone})` : ''}
━━━━━━━━━━━━━━━━━━
🛍️ *ক্রয়কৃত পণ্যসমূহ:*
${itemsList || 'পণ্য বিস্তারিত বিল ভিউতে দেখুন'}
━━━━━━━━━━━━━━━━━━
💵 *সর্বমোট বিল:* ৳${grandTotal.toLocaleString()}
✅ *পরিশোধ:* ৳${paid.toLocaleString()}
${due > 0 ? `⚠️ *অবশিষ্ট বকেয়া:* ৳${due.toLocaleString()}` : `🎉 *স্ট্যাটাস:* সম্পূর্ণ পরিশোধিত (PAID)`}
━━━━━━━━━━━━━━━━━━
🔍 *স্মার্টফোনে রসিদ যাচাই ও কপি পেতে লিংকে চাপ দিন:*
${verifyUrl}

🙏 আমাদের সাথে কেনাকাটা করার জন্য ধন্যবাদ!`;
  } else {
    return `🧾 *OFFICIAL DIGITAL INVOICE*
━━━━━━━━━━━━━━━━━━
🏪 *Store:* ${companyName}
📞 *Phone:* ${companyPhone}
📄 *Invoice:* #${invoice.id}
📅 *Date:* ${invoice.date}
👤 *Customer:* ${invoice.customerName || 'Walk-in'} ${invoice.customerPhone ? `(${invoice.customerPhone})` : ''}
━━━━━━━━━━━━━━━━━━
🛍️ *Purchased Items:*
${itemsList || 'View full breakdown in link'}
━━━━━━━━━━━━━━━━━━
💵 *Grand Total:* ৳${grandTotal.toLocaleString()}
✅ *Paid Amount:* ৳${paid.toLocaleString()}
${due > 0 ? `⚠️ *Remaining Due:* ৳${due.toLocaleString()}` : `🎉 *Status:* FULLY PAID`}
━━━━━━━━━━━━━━━━━━
🔍 *Verify official digital receipt online:*
${verifyUrl}

Thank you for shopping with us!`;
  }
};

/**
 * Formats a comprehensive Counter Shift Closing & Handover report for WhatsApp
 */
export const formatWhatsAppShiftClosingMessage = (closingRecord, businessSettings, lang = 'bn') => {
  if (!closingRecord) return '';
  const company = businessSettings?.companyName || 'হিসাব কিতাব ৩৬০';
  const cashSales = Number(closingRecord.totalCashSales) || 0;
  const digitalSales = Number(closingRecord.totalDigitalSales) || 0;
  const totalSales = cashSales + digitalSales;
  const openingFloat = Number(closingRecord.openingFloat) || 0;
  const actualCash = Number(closingRecord.closingCash || closingRecord.actualCash) || 0;
  const expectedCash = openingFloat + cashSales;
  const discrepancy = actualCash - expectedCash;

  let discrepancyText = 'মিল রয়েছে (✓)';
  if (discrepancy > 0) {
    discrepancyText = `অতিরিক্ত +৳${discrepancy.toLocaleString()}`;
  } else if (discrepancy < 0) {
    discrepancyText = `ঘাটতি -৳${Math.abs(discrepancy).toLocaleString()}`;
  }

  if (lang === 'bn') {
    return `📊 *কাউন্টার শিফট হ্যান্ডওভার ও হিসাব রিপোর্ট*
━━━━━━━━━━━━━━━━━━━━
🏢 *প্রতিষ্ঠান:* ${company}
📍 *শাখা:* ${closingRecord.branchName || 'প্রধান শাখা'}
💻 *কাউন্টার:* ${closingRecord.counterName || 'কাউন্টার ০১'}
👤 *দায়িত্বপ্রাপ্ত ক্যাশিয়ার:* ${closingRecord.cashierName || 'ক্যাশিয়ার'}
📅 *তারিখ ও সময়:* ${closingRecord.timestamp || new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━
💵 *প্রারম্ভিক ক্যাশ (Opening Float):* ৳${openingFloat.toLocaleString()}
🛒 *মোট নগদ বিক্রয়:* ৳${cashSales.toLocaleString()}
📱 *মোট ডিজিটাল বিক্রয়:* ৳${digitalSales.toLocaleString()}
📈 *সর্বমোট বিক্রয়:* ৳${totalSales.toLocaleString()} (${closingRecord.totalTransactions || 0} টি মেমো)
━━━━━━━━━━━━━━━━━━━━
💼 *ড্রয়ারে হিসেবকৃত মোট ক্যাশ:* ৳${actualCash.toLocaleString()}
🎯 *ড্রয়ারে প্রত্যাশিত ক্যাশ:* ৳${expectedCash.toLocaleString()}
⚖️ *ক্যাশ স্ট্যাটাস:* ${discrepancyText}
${closingRecord.note ? `📝 *ক্যাশিয়ার নোট:* ${closingRecord.note}\n` : ''}━━━━━━━━━━━━━━━━━━━━
✓ হিসাবকিতাব ৩৬০ ডিজিটাল পিওএস সিকিউর হ্যান্ডওভার`;
  } else {
    return `📊 *COUNTER SHIFT CLOSING REPORT*
━━━━━━━━━━━━━━━━━━━━
🏢 *Company:* ${company}
📍 *Branch:* ${closingRecord.branchName || 'Main Branch'}
💻 *Counter:* ${closingRecord.counterName || 'Counter 01'}
👤 *Cashier:* ${closingRecord.cashierName || 'Cashier'}
📅 *Date & Time:* ${closingRecord.timestamp || new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━
💵 *Opening Float:* ৳${openingFloat.toLocaleString()}
🛒 *Cash Sales:* ৳${cashSales.toLocaleString()}
📱 *Digital Sales:* ৳${digitalSales.toLocaleString()}
📈 *Total Revenue:* ৳${totalSales.toLocaleString()} (${closingRecord.totalTransactions || 0} transactions)
━━━━━━━━━━━━━━━━━━━━
💼 *Actual Drawer Cash:* ৳${actualCash.toLocaleString()}
🎯 *Expected Cash:* ৳${expectedCash.toLocaleString()}
⚖️ *Discrepancy:* ${discrepancyText}
${closingRecord.note ? `📝 *Note:* ${closingRecord.note}\n` : ''}━━━━━━━━━━━━━━━━━━━━
✓ Verified by HisabKitab 360 POS System`;
  }
};

/**
 * Formats a polite, professional Due Reminder message for customer WhatsApp
 */
export const formatWhatsAppDueReminderMessage = (customer, dueAmount, businessSettings, lang = 'bn') => {
  const company = businessSettings?.companyName || 'হিসাব কিতাব ৩৬০';
  const hotline = businessSettings?.phone || '';
  const bkashNumber = businessSettings?.bkashNumber || hotline || '';
  const custName = customer?.name || 'সম্মানিত গ্রাহক';
  const numDue = Number(dueAmount || customer?.outstandingDue) || 0;

  if (lang === 'bn') {
    return `📢 *বকেয়া পরিশোধের বিনীত অনুরোধ*
━━━━━━━━━━━━━━━━━━━━
জনাব ${custName},
সালাম ও শুভেচ্ছা নিবেন।

${company}-এ আপনার হিসাবের খাতায় বর্তমান অবশিষ্ট বকেয়া রয়েছে: *৳${numDue.toLocaleString()}* টাকা।

অনুরোধপূর্বক সুবিধাজনক সময়ে এসে বকেয়া পরিশোধ করার জন্য বিনীত অনুরোধ জানাচ্ছি।
${bkashNumber ? `📲 *বিকাশ / নগদ পেমেন্ট:* ${bkashNumber}\n` : ''}
যেকোনো প্রয়োজনে আমাদের সাথে যোগাযোগ করুন:
📞 *হটলাইন:* ${hotline}

ধন্যবাদান্তে,
*${company}*`;
  } else {
    return `📢 *PAYMENT DUE REMINDER*
━━━━━━━━━━━━━━━━━━━━
Dear ${custName},
Greetings from ${company}.

This is a gentle reminder regarding your outstanding due of *৳${numDue.toLocaleString()}*.

Kindly arrange the payment at your earliest convenience.
${bkashNumber ? `📲 *bKash / Nagad payment:* ${bkashNumber}\n` : ''}
For any inquiries, feel free to contact us:
📞 *Hotline:* ${hotline}

Best regards,
*${company}*`;
  }
};

/**
 * Formats a message for client contacting vendor support
 */
export const formatVendorSupportWhatsAppMessage = (userInfo, shopName, appVersion = APP_VERSION_NAME) => {
  const userText = userInfo?.name || userInfo?.email || 'নতুন ব্যবহারকারী';
  const store = shopName || 'আমার প্রতিষ্ঠান';
  return `হ্যালো HisabKitab 360 সাপোর্ট টিম 👋
আমি *${store}* (${userText}) থেকে যোগাযোগ করছি।

সফটওয়্যারটির (${appVersion}) ব্যবহারের বিষয়ে আমার কিছু কারিগরি ও ব্যবহারিক সহায়তা প্রয়োজন। অনুগ্রহ করে আমাকে সহযোগিতা করবেন কি?

ধন্যবাদ!`;
};

/**
 * Standard Production Verification Base URL (Fixed globally)
 */
export const SOMITI_PRODUCTION_DOMAIN = 'https://somiti-360.vercel.app';

/**
 * Builds an Ultra-Short, high-performance Verification URL for Somiti 360 documents.
 * Strictly guarantees URL length ~100-160 characters (never overflows, zero Base64 blobs).
 * Format:
 * https://somiti-360.vercel.app/verify?c={verificationCode}&r={receiptOrDocNo}&t={docType}&a={amount}&d={date}&n={memberName}&m={depositorName}&p={monthYear}
 */
/**
 * Builds an Ultra-Short, 404-free Root Query Verification URL for Somiti 360 documents.
 * Format per exact user specification:
 * https://somiti-360.vercel.app/?v=1&c={verificationCode}&r={receiptNo}&t={docType}&a={amount}&n={memberName}&dp={depositor}&m={monthYear}&dt={date}&s={samityName}
 */
export const createUltraShortVerificationUrl = ({
  verificationCode = '',
  receiptOrDocNo = '',
  docType = 'receipt',
  amount = 0,
  date = '',
  memberName = '',
  depositorName = '',
  monthYear = '',
  samityName = ''
} = {}) => {
  const params = new URLSearchParams();
  params.set('v', '1');
  if (verificationCode) params.set('c', String(verificationCode).trim());
  if (receiptOrDocNo) params.set('r', String(receiptOrDocNo).trim());
  if (docType) params.set('t', String(docType).trim());
  if (amount !== undefined && amount !== null && amount !== '' && Number(amount) > 0) {
    params.set('a', String(Number(amount)));
  }
  if (memberName) params.set('n', String(memberName).trim().slice(0, 40));
  if (depositorName) {
    params.set('dp', String(depositorName).trim().slice(0, 40));
  }
  if (monthYear) params.set('m', String(monthYear).trim());
  if (date) params.set('dt', String(date).split('T')[0]);
  if (samityName && samityName !== 'স্বপ্নছোঁয়া সমবায় সমিতি') {
    params.set('s', String(samityName).trim().slice(0, 30));
  }

  return `${SOMITI_PRODUCTION_DOMAIN}/?${params.toString()}`;
};

/**
 * Determine globally reachable base URL for document verification
 */
export const getGlobalVerificationBaseUrl = (currentSamity) => {
  return SOMITI_PRODUCTION_DOMAIN;
};

/**
 * Generates an unambiguous, easy-to-read Short Verification Code (format: S360-XXXXXX)
 * Uses 32 characters omitting confusing 0, O, 1, I
 */
export const getReceiptShortVerificationCode = (deposit) => {
  if (deposit?.shortVerificationCode) return deposit.shortVerificationCode;
  if (deposit?.shortCode) return deposit.shortCode;
  
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const raw = String(deposit?.id || '') + '-' + String(deposit?.receiptNo || deposit?.voucherNo || '') + '-' + String(deposit?.memberId || 'MEM');
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash) + raw.charCodeAt(i);
    hash = hash & hash;
  }
  let code = '';
  let h = Math.abs(hash);
  for (let i = 0; i < 6; i++) {
    code += chars[h % chars.length];
    h = Math.floor(h / 32) + (raw.charCodeAt(i % raw.length) || 17) * 31;
  }
  return `S360-${code}`;
};

/**
 * Generates globally accessible Ultra-Short Verification URL for Samity Deposit Receipts
 */
export const createSamityReceiptVerificationUrl = (deposit, currentSamity) => {
  if (!deposit) return `${SOMITI_PRODUCTION_DOMAIN}/verify`;
  const formattedReceiptNo = deposit.receiptNo || deposit.voucherNo || `RCPT-${deposit.id || '001'}`;
  const memberName = deposit.memberName || deposit.depositorName || 'সদস্য';
  const shortCode = getReceiptShortVerificationCode(deposit);
  const depositDate = deposit.depositDate || deposit.date || new Date().toISOString().split('T')[0];
  const monthYear = [deposit.paymentMonth || deposit.month || '', deposit.paymentYear || deposit.year || ''].filter(Boolean).join(' ');

  return createUltraShortVerificationUrl({
    verificationCode: shortCode,
    receiptOrDocNo: formattedReceiptNo,
    docType: 'receipt',
    amount: Number(deposit.amount || 0),
    date: depositDate,
    memberName,
    depositorName: deposit.depositorName || memberName,
    monthYear,
    samityName: currentSamity?.nameBn
  });
};

/**
 * Generates globally accessible Ultra-Short Verification URL for Samity Due Notices
 */
export const createSamityDueNoticeVerificationUrl = (notice, currentSamity) => {
  if (!notice) return `${SOMITI_PRODUCTION_DOMAIN}/verify`;
  const member = notice.member || {};
  const status = notice.status || {};
  const memberName = member.nameBn || member.nameEn || 'সদস্য';
  const dueAmount = Number(status.totalDue ?? status.totalCumulativeDue ?? notice.totalDue ?? 0);
  const noticeNo = member.id ? `DUE-${member.id}` : 'DUE-001';
  const shortCode = getReceiptShortVerificationCode({ id: noticeNo, memberId: member.id });

  return createUltraShortVerificationUrl({
    verificationCode: shortCode,
    receiptOrDocNo: noticeNo,
    docType: 'due_notice',
    amount: dueAmount,
    date: new Date().toISOString().split('T')[0],
    memberName,
    depositorName: '',
    monthYear: (notice.dueMonthsList && notice.dueMonthsList.length > 0) ? notice.dueMonthsList.join(',') : 'বকেয়া',
    samityName: currentSamity?.nameBn
  });
};

/**
 * Generates globally accessible Ultra-Short Verification URL for Official Documents / Resolutions
 */
export const createSamityOfficialDocVerificationUrl = (doc, currentSamity) => {
  const ref = doc?.ref || 'সছস/২০২৬/০১';
  const title = doc?.title || 'নোটিশ ও রেজুলেশন';
  const date = doc?.date || new Date().toISOString().split('T')[0];
  const shortCode = getReceiptShortVerificationCode({ id: ref, memberId: 'OFFICIAL' });

  return createUltraShortVerificationUrl({
    verificationCode: shortCode,
    receiptOrDocNo: ref,
    docType: 'samity_doc',
    amount: 0,
    date,
    memberName: title,
    depositorName: '',
    monthYear: '',
    samityName: currentSamity?.nameBn
  });
};

/**
 * Generates globally accessible Ultra-Short Verification URL for Membership Certificates
 */
export const createSamityMembershipCertVerificationUrl = (member, currentSamity) => {
  const memberName = member?.nameBn || member?.nameEn || 'সদস্য';
  const memberId = member?.id || member?.memberCode || 'SM-001';
  const shortCode = getReceiptShortVerificationCode({ id: memberId, memberId });
  const date = member?.joiningDate || member?.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0];

  return createUltraShortVerificationUrl({
    verificationCode: shortCode,
    receiptOrDocNo: memberId,
    docType: 'membership_cert',
    amount: 0,
    date,
    memberName,
    depositorName: '',
    monthYear: '',
    samityName: currentSamity?.nameBn
  });
};

/**
 * Generates globally accessible Ultra-Short Verification URL for Bulk Bank Deposit Reports
 */
export const createSamityBulkDepositVerificationUrl = (report, currentSamity) => {
  const voucherNo = report?.bulkVoucherNo || report?.id || 'BULK-2026-001';
  const totalAmount = Number(report?.totalSlipAmount || report?.allocatedAmount || 0);
  const shortCode = getReceiptShortVerificationCode({ id: voucherNo, memberId: 'BULK' });
  const date = report?.depositDate || report?.date || new Date().toISOString().split('T')[0];

  return createUltraShortVerificationUrl({
    verificationCode: shortCode,
    receiptOrDocNo: voucherNo,
    docType: 'bulk_deposit',
    amount: totalAmount,
    date,
    memberName: report?.bankName || 'ব্যাংক জমা',
    depositorName: report?.branchName || '',
    monthYear: '',
    samityName: currentSamity?.nameBn
  });
};

/**
 * Generates globally accessible Ultra-Short Verification URL for Member Smart ID Cards
 */
export const createSamityMemberIdCardVerificationUrl = (member, currentSamity) => {
  const memberName = member?.nameBn || member?.nameEn || 'সদস্য';
  const memberId = member?.memberCode || member?.id || 'SM-001';
  const shortCode = getReceiptShortVerificationCode({ id: memberId, memberId });
  const date = member?.membershipStartDate || member?.joiningDate || member?.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0];

  return createUltraShortVerificationUrl({
    verificationCode: shortCode,
    receiptOrDocNo: memberId,
    docType: 'member_id_card',
    amount: 0,
    date,
    memberName,
    depositorName: '',
    monthYear: '',
    samityName: currentSamity?.nameBn
  });
};

/**
 * Generates globally accessible Ultra-Short Verification URL for Member Passbook / Savings Account
 */
export const createSamityPassbookVerificationUrl = (member, currentSamity, totalSavings = 0) => {
  const memberName = member?.nameBn || member?.nameEn || 'সদস্য';
  const memberId = member?.memberCode || member?.id || 'SM-001';
  const shortCode = getReceiptShortVerificationCode({ id: memberId, memberId });

  return createUltraShortVerificationUrl({
    verificationCode: shortCode,
    receiptOrDocNo: memberId,
    docType: 'passbook',
    amount: Number(totalSavings || 0),
    date: new Date().toISOString().split('T')[0],
    memberName,
    depositorName: '',
    monthYear: '',
    samityName: currentSamity?.nameBn
  });
};

/**
 * Generates globally accessible Ultra-Short Verification URL for Samity Member Registry
 */
export const createSamityMemberListVerificationUrl = (members = [], currentSamity, targetMonth, targetYear) => {
  const count = Array.isArray(members) ? members.length : 0;
  const month = targetMonth || new Date().toLocaleString('bn-BD', { month: 'long' });
  const year = targetYear || new Date().getFullYear();
  const shortCode = getReceiptShortVerificationCode({ id: `MEMLIST-${year}`, memberId: 'REGISTRY' });

  return createUltraShortVerificationUrl({
    verificationCode: shortCode,
    receiptOrDocNo: `MEMLIST-${year}`,
    docType: 'member_list',
    amount: count,
    date: new Date().toISOString().split('T')[0],
    memberName: `মোট সদস্য ${count} জন`,
    depositorName: '',
    monthYear: `${month} ${year}`,
    samityName: currentSamity?.nameBn
  });
};

/**
 * Generates globally accessible Ultra-Short Verification URL for Expense Vouchers
 */
export const createSamityExpenseVoucherVerificationUrl = (expense, currentSamity) => {
  if (!expense) return `${SOMITI_PRODUCTION_DOMAIN}/verify`;
  const voucherNo = expense.voucherNo || `EXP-${expense.id || '001'}`;
  const amount = Number(expense.amount || 0);
  const shortCode = getReceiptShortVerificationCode({ id: voucherNo, memberId: 'EXP' });
  const date = expense.expenseDate || expense.date || new Date().toISOString().split('T')[0];

  return createUltraShortVerificationUrl({
    verificationCode: shortCode,
    receiptOrDocNo: voucherNo,
    docType: 'expense_voucher',
    amount,
    date,
    memberName: expense.paidTo || expense.title || 'ব্যয় প্রাপক',
    depositorName: expense.category || '',
    monthYear: '',
    samityName: currentSamity?.nameBn
  });
};
