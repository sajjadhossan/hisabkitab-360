/**
 * Messaging & Notification Service for HisabKitab 360
 * Generates formatted Bengali WhatsApp & SMS templates for:
 * 1. Due collection reminders (বাকি আদায়ের তাগাদা)
 * 2. Invoices & digital receipts
 * 3. Supplier stock purchase orders (মহাজনদের অর্ডার তালিকা)
 * 4. Employee salary slips (বেতন পরিশোধের ভাউচার)
 */

/**
 * Normalizes a Bangladeshi phone number to international WhatsApp format (e.g. 8801712345678)
 */
export const normalizeBDPhoneForWhatsApp = (rawPhone) => {
  if (!rawPhone) return '';
  let cleaned = String(rawPhone).replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+880')) {
    return cleaned.substring(1);
  }
  if (cleaned.startsWith('880')) {
    return cleaned;
  }
  if (cleaned.startsWith('0')) {
    return '88' + cleaned;
  }
  if (cleaned.length === 10 && cleaned.startsWith('1')) {
    return '880' + cleaned;
  }
  return cleaned;
};

/**
 * Normalizes phone for standard mobile SMS
 */
export const normalizeBDPhoneForSMS = (rawPhone) => {
  if (!rawPhone) return '';
  let cleaned = String(rawPhone).replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+880')) {
    return '0' + cleaned.substring(4);
  }
  if (cleaned.startsWith('880')) {
    return '0' + cleaned.substring(3);
  }
  return cleaned;
};

/**
 * Generates tailored Bengali due payment reminder messages with 3 tone variations
 */
export const buildDueReminderMessage = ({
  customerName = 'সম্মানিত গ্রাহক',
  dueAmount = 0,
  dueDate = '',
  memoId = '',
  companyName = 'আমাদের প্রতিষ্ঠান',
  companyPhone = '',
  bkashNumber = '',
  tone = 'standard' // 'gentle' | 'standard' | 'urgent'
}) => {
  const formattedDue = Number(dueAmount).toLocaleString('bn-BD');
  const memoText = memoId ? ` (মেমো #${memoId})` : '';
  const dateText = dueDate ? `\n📅 পরিশোধের নির্ধারিত তারিখ: ${dueDate}` : '';
  const bkashText = bkashNumber
    ? `\n💳 *বিকাশ/নগদে পরিশোধের নম্বর:* ${bkashNumber}`
    : '';

  if (tone === 'gentle') {
    return (
      `আসসালামু আলাইকুম ${customerName},\n\n` +
      `আশা করি ভালো আছেন। *${companyName}*-এর সাথে কেনাকাটা করার জন্য ধন্যবাদ।\n\n` +
      `বিনীতভাবে জানানো যাচ্ছে যে, আপনার পূর্বের কেনাকাটা বাবদ *৳${formattedDue}* টাকা বকেয়া রয়েছে${memoText}।${dateText}\n\n` +
      `আপনার সুবিধাজনক সময়ে উক্ত বকেয়া টাকা পরিশোধের জন্য অনুরোধ করা হলো।${bkashText}\n\n` +
      `যেকোনো প্রয়োজনে যোগাযোগ করুন: ${companyPhone || 'আমাদের দোকানে'}\n\n` +
      `ধন্যবাদ,\n*${companyName}*`
    );
  }

  if (tone === 'urgent') {
    return (
      `জরুরি বকেয়া তাগাদা!\n\n` +
      `জনাব/জনাবা ${customerName},\n` +
      `*${companyName}*-এর পক্ষ থেকে দৃষ্টি আকর্ষণ করা হচ্ছে। আপনার বকেয়া *৳${formattedDue}* টাকা পরিশোধের সময়সীমা ইতিমধ্যে উত্তীর্ণ হয়েছে${memoText}।${dateText}\n\n` +
      `হিসাব সমন্বয় করার স্বার্থে আগামী ২৪ ঘণ্টার মধ্যে বকেয়া টাকা পরিশোধ করার জন্য অনুরোধ করা হলো।${bkashText}\n\n` +
      `জরুরি যোগাযোগ: ${companyPhone}\n\n` +
      `ধন্যবাদান্তে,\n*${companyName}*`
    );
  }

  // Standard tone (default)
  return (
    `বকেয়া বিল সংক্রান্ত নোটিশ\n\n` +
    `শ্রদ্ধেয় ${customerName},\n` +
    `*${companyName}*-এর পক্ষ থেকে শুভেচ্ছা।\n\n` +
    `আপনার কাছে প্রতিষ্ঠানের মোট বকেয়া পাওনা: *৳${formattedDue}* টাকা${memoText}।${dateText}\n\n` +
    `অনুগ্রহ করে দ্রুততম সময়ে বকেয়া পরিশোধ করে সহযোগিতার হাত বাড়াবেন।${bkashText}\n\n` +
    `প্রয়োজনে কল করুন: ${companyPhone || 'আমাদের দোকানে'}\n\n` +
    `ধন্যবাদান্তে,\n*${companyName}*`
  );
};

/**
 * Builds a formatted Purchase Order / Reorder list message for Wholesalers/Suppliers
 */
export const buildSupplierOrderMessage = ({
  supplierName = 'সম্মানিত মহাজন',
  items = [],
  companyName = 'আমাদের দোকান',
  companyPhone = '',
  deliveryDate = '',
  notes = ''
}) => {
  const itemRows = items.map((it, idx) => {
    const qty = it.reorderQty || it.qty || 1;
    const unit = it.unit || 'টি';
    return `${idx + 1}. *${it.name}* - ${qty} ${unit}`;
  }).join('\n');

  const notesText = notes ? `\n📝 *বিশেষ নোট:* ${notes}` : '';
  const dateText = deliveryDate ? `\n🚚 *প্রত্যাশিত ডেলিভারি:* ${deliveryDate}` : '';

  return (
    `📦 *নতুন ক্রয়াদের্শ / পণ্যের রিকোয়ারমেন্ট অর্ডার*\n\n` +
    `শ্রদ্ধেয় ${supplierName},\n` +
    `*${companyName}* থেকে নিচের মালামালগুলো সরবরাহের জন্য অনুরোধ করা হচ্ছে:\n\n` +
    `────────────────────\n` +
    `${itemRows}\n` +
    `────────────────────\n` +
    `${notesText}${dateText}\n\n` +
    `দরদাম চূড়ান্ত করে দ্রুত ডেলিভারি কনফার্ম করুন।\n` +
    `অর্ডারকারী: *${companyName}*\n` +
    `📞 যোগাযোগ: ${companyPhone}`
  );
};

/**
 * Builds a Salary Disbursement Voucher message for Employees
 */
export const buildSalaryVoucherMessage = ({
  employeeName = 'কর্মী',
  month = '',
  baseSalary = 0,
  bonus = 0,
  deductions = 0,
  netPaid = 0,
  paymentDate = '',
  companyName = 'আমাদের প্রতিষ্ঠান'
}) => {
  return (
    `📄 *বেতন পরিশোধের রসিদ (Salary Voucher)*\n\n` +
    `কর্মীর নাম: *${employeeName}*\n` +
    `মাস/মেয়াদ: *${month}*\n` +
    `────────────────────\n` +
    `মূল বেতন: ৳${Number(baseSalary).toLocaleString('bn-BD')}\n` +
    (bonus > 0 ? `বোনাস/ভাতা: +৳${Number(bonus).toLocaleString('bn-BD')}\n` : '') +
    (deductions > 0 ? `কর্তন/অগ্রিম: -৳${Number(deductions).toLocaleString('bn-BD')}\n` : '') +
    `────────────────────\n` +
    `*পরিশোধিত মোট বেতন: ৳${Number(netPaid).toLocaleString('bn-BD')}*\n` +
    `তারিখ: ${paymentDate || new Date().toISOString().split('T')[0]}\n\n` +
    `আপনার নিষ্ঠাবান অবদানের জন্য ধন্যবাদ।\n` +
    `*${companyName}*`
  );
};

/**
 * Opens WhatsApp directly via web or mobile app
 */
export const openWhatsAppDirect = ({ phone, message }) => {
  const normPhone = normalizeBDPhoneForWhatsApp(phone);
  let url = '';
  if (normPhone) {
    url = `https://api.whatsapp.com/send?phone=${normPhone}&text=${encodeURIComponent(message)}`;
  } else {
    url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Opens Native mobile SMS app
 */
export const openSMSDirect = ({ phone, message }) => {
  const cleanPhone = normalizeBDPhoneForSMS(phone);
  const smsUrl = `sms:${cleanPhone}?body=${encodeURIComponent(message)}`;
  window.location.href = smsUrl;
};
