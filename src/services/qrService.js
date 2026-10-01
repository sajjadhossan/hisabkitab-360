import QRCode from 'qrcode';

/**
 * Generates an ultra high-resolution QR code Data URL (PNG base64)
 * that is crisp both on screen and thermal paper print.
 */
export const generateQrDataUrl = async (text, options = {}) => {
  try {
    return await QRCode.toDataURL(text, {
      width: options.width || 300,
      margin: options.margin !== undefined ? options.margin : 1,
      color: {
        dark: options.darkColor || '#000000',
        light: options.lightColor || '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
  } catch (err) {
    console.warn('QR code generation warning:', err);
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

/**
 * Builds a portable verification URL with compact encoded invoice payload
 * so that any smartphone scanning the QR code can display the official invoice details
 * even without requiring a cloud backend database.
 */
export const createInvoiceVerificationUrl = (invoice, businessSettings) => {
  if (!invoice) return typeof window !== 'undefined' ? window.location.href : '';

  const grandTotal = Number(invoice.grandTotal) || 0;
  const paid = invoice.paidAmount !== undefined
    ? Number(invoice.paidAmount)
    : (invoice.status === 'paid' ? grandTotal : 0);
  const due = invoice.dueAmount !== undefined
    ? Number(invoice.dueAmount)
    : Math.max(0, grandTotal - paid);

  const payload = {
    id: invoice.id,
    date: invoice.date,
    customerName: invoice.customerName,
    customerPhone: invoice.customerPhone || '',
    grandTotal,
    paidAmount: paid,
    dueAmount: due,
    status: invoice.status,
    paymentMethod: invoice.paymentMethod,
    companyName: businessSettings?.companyName || 'HisabKitab 360',
    companyPhone: businessSettings?.phone || '',
    companyAddress: businessSettings?.address || '',
    items: (invoice.items || []).map(item => ({
      name: item.name,
      qty: item.qty,
      price: item.price,
      subtotal: item.subtotal || (item.price * item.qty)
    }))
  };

  try {
    const jsonStr = JSON.stringify(payload);
    // Safe utf8 base64 encoding
    const token = encodeURIComponent(btoa(unescape(encodeURIComponent(jsonStr))));
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?verify=${encodeURIComponent(invoice.id)}&data=${token}`;
  } catch {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?verify=${encodeURIComponent(invoice.id)}`;
  }
};

/**
 * Decodes the verification token back into full invoice object
 */
export const decodeInvoiceVerificationToken = (token) => {
  if (!token) return null;
  try {
    const jsonStr = decodeURIComponent(escape(atob(decodeURIComponent(token))));
    return JSON.parse(jsonStr);
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
export const formatVendorSupportWhatsAppMessage = (userInfo, shopName, appVersion = 'v2.0.0') => {
  const userText = userInfo?.name || userInfo?.email || 'নতুন ব্যবহারকারী';
  const store = shopName || 'আমার প্রতিষ্ঠান';
  return `হ্যালো HisabKitab 360 সাপোর্ট টিম 👋
আমি *${store}* (${userText}) থেকে যোগাযোগ করছি।

সফটওয়্যারটির (${appVersion}) ব্যবহারের বিষয়ে আমার কিছু কারিগরি ও ব্যবহারিক সহায়তা প্রয়োজন। অনুগ্রহ করে আমাকে সহযোগিতা করবেন কি?

ধন্যবাদ!`;
};
