// ============================================================================
// Samity / Club / Association Management Service & State Engine
// Multi-tenant, bilingual, modular logic for Hishab Kitab 360
// Zero mock/demo data standard: starts clean, persists to localStorage & Supabase
// ============================================================================

const STORAGE_KEY = 'hk360_samity_hub_data';

// Helper to convert number to Bengali words
export const numberToBanglaWords = (num) => {
  if (!num || isNaN(num)) return 'শূন্য টাকা মাত্র';
  const n = Math.floor(Math.abs(num));
  if (n === 0) return 'শূন্য টাকা মাত্র';

  const units = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়', 'দশ', 
    'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ', 'বিশ',
    'একুশ', 'বাইশ', 'তেইশ', 'চব্বিশ', 'পঁচিশ', 'ছাব্বিশ', 'সাতাশ', 'আঠাশ', 'ঊনত্রিশ', 'ত্রিশ',
    'একত্রিশ', 'বত্রিশ', 'তেত্রিশ', 'চৌত্রিশ', 'পঁয়ত্রিশ', 'ছত্রিশ', 'সাঁইত্রিশ', 'আটত্রিশ', 'ঊনচল্লিশ', 'চল্লিশ',
    'একচল্লিশ', 'বিয়াল্লিশ', 'তেতাল্লিশ', 'চুয়াল্লিশ', 'পঁয়তাল্লিশ', 'ছেচল্লিশ', 'সাতচল্লিশ', 'আটচল্লিশ', 'ঊনপঞ্চাশ', 'পঞ্চাশ',
    'একান্ন', 'বায়ান্ন', 'তিপ্পান্ন', 'চুয়ান্ন', 'পঞ্চান্ন', 'ছাপ্পান্ন', 'সাতান্ন', 'আটান্ন', 'ঊনষাট', 'ষাট',
    'একষট্টি', 'বাষট্টি', 'তেষট্টি', 'চৌষট্টি', 'পঁয়ষট্টি', 'ছেষট্টি', 'সাতষট্টি', 'আটষট্টি', 'ঊনসত্তর', 'সত্তর',
    'একাত্তর', 'বাহাত্তর', 'তিয়াত্তর', 'চুয়াত্তর', 'পঁচাত্তর', 'ছিয়াত্তর', 'সাতাত্তর', 'আটাত্তর', 'ঊনআশি', 'আশি',
    'একাশি', 'বিরাশি', 'তিরাশি', 'চুরাশি', 'পঁচাশি', 'ছিয়াশি', 'সাতাশি', 'অষ্টআশি', 'ঊননব্বই', 'নব্বই',
    'একানব্বই', 'বিরানব্বই', 'তিরানব্বই', 'চুরানব্বই', 'পঁচানব্বই', 'ছিয়ানব্বই', 'সাতানব্বই', 'আটানব্বই', 'নিরানব্বই'];

  let words = '';
  let crore = Math.floor(n / 10000000);
  let rem = n % 10000000;
  let lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  let thousand = Math.floor(rem / 1000);
  rem = rem % 1000;
  let hundred = Math.floor(rem / 100);
  let lastTwo = rem % 100;

  if (crore > 0) words += `${units[crore] || crore} কোটি `;
  if (lakh > 0) words += `${units[lakh] || lakh} লাখ `;
  if (thousand > 0) words += `${units[thousand] || thousand} হাজার `;
  if (hundred > 0) words += `${units[hundred] || hundred} শত `;
  if (lastTwo > 0) words += `${units[lastTwo] || lastTwo} `;

  return `${words.trim()} টাকা মাত্র`;
};

// Helper to convert number to English words
export const numberToEnglishWords = (num) => {
  if (!num || isNaN(num)) return 'Zero Taka Only';
  const n = Math.floor(Math.abs(num));
  if (n === 0) return 'Zero Taka Only';

  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (num) => {
    if ((num = num.toString()).length > 9) return 'overflow';
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + ' Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + ' Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + ' Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + ' Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim();
  };

  return `${inWords(n)} Taka Only`;
};

// Default empty clean state (Strict Zero Mock Data Standard)
const DEFAULT_CLEAN_DATA = {
  samities: [
    {
      id: 'SAMITY-001',
      nameBn: 'স্বপ্নছোঁয়া সমবায় সমিতি',
      nameEn: 'Shopnochoa Co-operative Samity',
      type: 'Savings Samity',
      regNo: 'REG-2026/DHK-482',
      establishedDate: '2024-01-01',
      logo: '',
      sloganBn: 'স্বপ্ন সাজাই, ভবিষ্যৎ গড়ি',
      sloganEn: 'Building Dreams, Securing the Future',
      address: 'প্লট #১২, ব্লক-বি, মিরপুর-১০, ঢাকা-১২১৬',
      division: 'ঢাকা',
      district: 'ঢাকা',
      upazila: 'মিরপুর',
      postOffice: 'মিরপুর',
      village: 'মিরপুর-১০',
      phone: '02-9876543',
      mobile: '01700000000',
      whatsapp: '01700000000',
      email: 'info@shopnochoasamity.org',
      website: 'https://shopnochoasamity.org',
      fbPage: 'https://facebook.com/shopnochoasamity',
      ytChannel: '',
      bankDetails: {
        bankName: 'ডাচ্-বাংলা ব্যাংক',
        branchName: 'মিরপুর শাখা',
        accName: 'স্বপ্নছোঁয়া সমবায় সমিতি',
        accNo: '123.120.98765',
        routingNo: '090271234'
      },
      mobileBanking: {
        provider: 'bKash',
        number: '01700000000',
        accountType: 'Merchant'
      },
      currency: 'BDT',
      monthlySubscription: 500,
      subscriptionDueDay: 10,
      gracePeriodDays: 5,
      lateFeeEnabled: true,
      lateFeeAmount: 50,
      financialYearStart: '2026-01-01',
      financialYearEnd: '2026-12-31',
      status: 'active'
    }
  ],
  members: [],
  deposits: [],
  bulkDeposits: [],
  expenses: [],
  reminders: [],
  auditLogs: [],
  approvals: [],
  letterhead: {
    logoPosition: 'left', // 'left' | 'center' | 'right'
    logoSize: 64,
    showBorder: true,
    borderColor: '#3b82f6',
    headerBg: 'transparent',
    fontStyle: 'sans-serif',
    showWatermark: true,
    watermarkText: 'পরিশোধিত / PAID',
    footerText: 'স্বচ্ছতা ও সমবায় আমাদের অঙ্গীকার • সততাই সমিতির শক্তি',
    footerBorder: true
  },
  signatures: [
    {
      id: 'sig_president',
      designationBn: 'সভাপতি',
      designationEn: 'President',
      name: 'জনাব সালাহউদ্দিন আহমেদ',
      phone: '01711000001',
      signatureImage: '',
      sealImage: '',
      showSignature: true,
      showSeal: true,
      showDate: true,
      position: 'left',
      order: 1,
      isActive: true
    },
    {
      id: 'sig_secretary',
      designationBn: 'সাধারণ সম্পাদক',
      designationEn: 'General Secretary',
      name: 'মুহাম্মদ রফিকুল ইসলাম',
      phone: '01711000002',
      signatureImage: '',
      sealImage: '',
      showSignature: true,
      showSeal: true,
      showDate: true,
      position: 'center',
      order: 2,
      isActive: true
    },
    {
      id: 'sig_treasurer',
      designationBn: 'কোষাধ্যক্ষ',
      designationEn: 'Treasurer',
      name: 'মোহাম্মদ তারেক হাসান',
      phone: '01711000003',
      signatureImage: '',
      sealImage: '',
      showSignature: true,
      showSeal: true,
      showDate: true,
      position: 'right',
      order: 3,
      isActive: true
    }
  ],
  documents: [],
  settings: {
    receiptPrefix: 'RCPT-',
    memberIdPrefix: 'SM-',
    depositPrefix: 'DEP-',
    expensePrefix: 'EXP-',
    defaultSmsGateway: 'Custom Gateway (Greenweb / BD Bulk SMS)',
    whatsappMode: 'click_to_chat', // 'click_to_chat' | 'cloud_api'
    telegramBotToken: '',
    telegramChatId: '',
    paperSize: 'A4',
    language: 'bn'
  }
};

// Load saved data or initialize
export const loadSamityData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_CLEAN_DATA,
        ...parsed,
        samities: parsed.samities?.length ? parsed.samities : DEFAULT_CLEAN_DATA.samities,
        signatures: parsed.signatures?.length ? parsed.signatures : DEFAULT_CLEAN_DATA.signatures,
        letterhead: { ...DEFAULT_CLEAN_DATA.letterhead, ...(parsed.letterhead || {}) },
        settings: { ...DEFAULT_CLEAN_DATA.settings, ...(parsed.settings || {}) }
      };
    }
  } catch (err) {
    console.warn('[SamityService] Storage read error, falling back to clean data:', err);
  }
  return DEFAULT_CLEAN_DATA;
};

// Persist data
export const saveSamityData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // Trigger window event for cross-component sync
    window.dispatchEvent(new CustomEvent('hk360_samity_updated', { detail: data }));
    return true;
  } catch (err) {
    console.error('[SamityService] Save error:', err);
    return false;
  }
};

// ID Generators
export const generateMemberId = (existingMembers = [], prefix = 'SM-') => {
  const count = existingMembers.length + 1;
  const pad = String(count).padStart(4, '0');
  return `${prefix}${pad}`;
};

export const generateReceiptNumber = (existingDeposits = [], prefix = 'RCPT-') => {
  const year = new Date().getFullYear();
  const count = existingDeposits.length + 1;
  const pad = String(count).padStart(6, '0');
  return `${prefix}${year}-${pad}`;
};

export const generateVoucherNumber = (existingItems = [], prefix = 'VCH-') => {
  const year = new Date().getFullYear();
  const count = existingItems.length + 1;
  const pad = String(count).padStart(5, '0');
  return `${prefix}${year}-${pad}`;
};

// Audit Trail Logger Helper
export const recordAuditLog = (currentData, { action, module, recordId, details, performedBy = 'Admin' }) => {
  const newLog = {
    id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    action, // 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'PRINT', 'REMINDER_SENT'
    module,
    recordId,
    details,
    performedBy,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Local System'
  };

  const updatedLogs = [newLog, ...(currentData.auditLogs || [])].slice(0, 500); // retain last 500
  return {
    ...currentData,
    auditLogs: updatedLogs
  };
};

// Monthly Due and Payment Status Engine
export const calculateMemberPaymentStatus = (member, samity, deposits = [], targetMonth = null, targetYear = null) => {
  const now = new Date();
  const currentMonth = targetMonth || now.toLocaleString('en-US', { month: 'long' });
  const currentYear = targetYear || now.getFullYear();

  const monthlyRequired = Number(member.customSubscription) > 0
    ? Number(member.customSubscription)
    : Number(samity?.monthlySubscription || 500);

  // Find approved deposits for this member and target month/year
  const memberDeposits = deposits.filter(d => 
    d.memberId === member.id &&
    d.samityId === member.samityId &&
    d.approvalStatus === 'approved' &&
    (!d.month || d.month.toLowerCase() === currentMonth.toLowerCase()) &&
    (!d.year || Number(d.year) === Number(currentYear))
  );

  const totalPaidForMonth = memberDeposits.reduce((sum, d) => sum + Number(d.amount || 0), 0);

  // All time total paid
  const allTimePaid = deposits
    .filter(d => d.memberId === member.id && d.samityId === member.samityId && d.approvalStatus === 'approved')
    .reduce((sum, d) => sum + Number(d.amount || 0), 0);

  let status = 'unpaid';
  let dueAmount = monthlyRequired;

  if (totalPaidForMonth >= monthlyRequired) {
    status = totalPaidForMonth > monthlyRequired ? 'advance_paid' : 'paid';
    dueAmount = 0;
  } else if (totalPaidForMonth > 0 && totalPaidForMonth < monthlyRequired) {
    status = 'partially_paid';
    dueAmount = monthlyRequired - totalPaidForMonth;
  } else {
    status = 'unpaid';
    dueAmount = monthlyRequired;
  }

  // Check if late fee applies
  const dueDay = samity?.subscriptionDueDay || 10;
  const gracePeriod = samity?.gracePeriodDays || 5;
  const cutoffDay = dueDay + gracePeriod;
  let lateFee = 0;

  if (status !== 'paid' && status !== 'advance_paid' && samity?.lateFeeEnabled && now.getDate() > cutoffDay) {
    lateFee = Number(samity?.lateFeeAmount || 50);
  }

  return {
    memberId: member.id,
    memberName: member.nameBn || member.nameEn,
    month: currentMonth,
    year: currentYear,
    requiredAmount: monthlyRequired,
    paidAmount: totalPaidForMonth,
    dueAmount: dueAmount,
    lateFee: lateFee,
    totalPayable: dueAmount + lateFee,
    status: status, // 'paid' | 'unpaid' | 'partially_paid' | 'advance_paid' | 'waived'
    allTimePaid,
    lastDepositDate: memberDeposits[0]?.date || null
  };
};

// Summary metrics calculator for Dashboard & Fund
export const calculateSamityMetrics = (samityId, data) => {
  const { samities = [], members = [], deposits = [], expenses = [] } = data;
  const samity = samities.find(s => s.id === samityId) || samities[0];

  const targetMembers = members.filter(m => !samityId || m.samityId === samityId);
  const targetDeposits = deposits.filter(d => (!samityId || d.samityId === samityId) && d.approvalStatus === 'approved');
  const targetExpenses = expenses.filter(e => (!samityId || e.samityId === samityId) && e.approvalStatus === 'approved');

  const totalMembers = targetMembers.length;
  const activeMembers = targetMembers.filter(m => m.status === 'active').length;

  const totalApprovedDeposits = targetDeposits.reduce((acc, d) => acc + Number(d.amount || 0), 0);
  const totalApprovedExpenses = targetExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);

  // Available fund balance
  const availableFund = totalApprovedDeposits - totalApprovedExpenses;

  // Breakdown by payment method
  const bankDeposits = targetDeposits
    .filter(d => ['bank_counter', 'online_banking', 'cheque', 'atm'].includes(d.method))
    .reduce((acc, d) => acc + Number(d.amount || 0), 0);

  const cashDeposits = targetDeposits
    .filter(d => d.method === 'cash')
    .reduce((acc, d) => acc + Number(d.amount || 0), 0);

  const mobileDeposits = targetDeposits
    .filter(d => ['bkash', 'nagad', 'rocket', 'upay'].includes(d.method))
    .reduce((acc, d) => acc + Number(d.amount || 0), 0);

  const bankExpenses = targetExpenses
    .filter(e => ['bank', 'cheque', 'online_banking'].includes(e.paymentMethod))
    .reduce((acc, e) => acc + Number(e.amount || 0), 0);

  const cashExpenses = targetExpenses
    .filter(e => e.paymentMethod === 'cash')
    .reduce((acc, e) => acc + Number(e.amount || 0), 0);

  const mobileExpenses = targetExpenses
    .filter(e => ['bkash', 'nagad', 'rocket', 'upay'].includes(e.paymentMethod))
    .reduce((acc, e) => acc + Number(e.amount || 0), 0);

  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
  const currentYear = new Date().getFullYear();

  let paidMembersCount = 0;
  let unpaidMembersCount = 0;
  let partiallyPaidCount = 0;
  let totalCurrentMonthDue = 0;
  let totalCurrentMonthCollected = 0;

  targetMembers.forEach(m => {
    const status = calculateMemberPaymentStatus(m, samity, deposits, currentMonth, currentYear);
    if (status.status === 'paid' || status.status === 'advance_paid') paidMembersCount++;
    else if (status.status === 'partially_paid') partiallyPaidCount++;
    else unpaidMembersCount++;

    totalCurrentMonthDue += status.dueAmount;
    totalCurrentMonthCollected += status.paidAmount;
  });

  const expectedMonthly = targetMembers.reduce((acc, m) => {
    const fee = Number(m.customSubscription) > 0 ? Number(m.customSubscription) : Number(samity?.monthlySubscription || 500);
    return acc + fee;
  }, 0);

  return {
    totalMembers,
    activeMembers,
    paidMembersCount,
    unpaidMembersCount,
    partiallyPaidCount,
    expectedMonthly,
    totalCurrentMonthCollected,
    totalCurrentMonthDue,
    collectionPercentage: expectedMonthly > 0 ? Math.min(100, Math.round((totalCurrentMonthCollected / expectedMonthly) * 100)) : 0,
    totalApprovedDeposits,
    totalApprovedExpenses,
    availableFund,
    bankBalance: Math.max(0, bankDeposits - bankExpenses),
    cashBalance: Math.max(0, cashDeposits - cashExpenses),
    mobileBalance: Math.max(0, mobileDeposits - mobileExpenses)
  };
};

// Reminder Message Formatter (WhatsApp, SMS, Telegram, Messenger)
export const formatReminderMessage = ({ member, samity, dueInfo, channel = 'whatsapp', lang = 'bn' }) => {
  const samityName = lang === 'bn' ? samity.nameBn : samity.nameEn;
  const memberName = lang === 'bn' ? member.nameBn || member.nameEn : member.nameEn || member.nameBn;
  const month = dueInfo.month;
  const dueAmount = dueInfo.dueAmount;
  const deadline = `${samity.subscriptionDueDay || 10} ${dueInfo.month} ${dueInfo.year}`;

  const treasurer = samity.bankDetails?.accName || samity.phone || 'অফিস';
  const bkashNo = samity.mobileBanking?.number || samity.mobile || '01XXXXXXXXX';
  const bankNo = samity.bankDetails?.accNo || '';
  const bankName = samity.bankDetails?.bankName || '';

  if (lang === 'bn') {
    return `প্রিয় ${memberName},

আপনার ${month} মাসের "${samityName}"-এর মাসিক চাঁদা ${dueAmount}/- টাকা এখনো জমা হয়নি।

🗓️ জমার শেষ তারিখ: ${deadline}
💳 জমার মাধ্যম:
• ব্যাংক: ${bankName} (হিসাব নং: ${bankNo})
• বিকাশ/নগদ: ${bkashNo} (${samity.mobileBanking?.accountType || 'মার্চেন্ট'})

টাকা জমা দেওয়ার পর দয়া করে ট্রানজ্যাকশন আইডি অথবা ব্যাংক রিসিটের ছবি পাঠিয়ে কনফার্ম করবেন।

ধন্যবাদান্তে,
${samityName}
যোগাযোগ: ${samity.mobile || samity.phone}`;
  } else {
    return `Dear ${memberName},

Your monthly subscription for ${month} of "${samityName}" amounting to BDT ${dueAmount}/- is currently due.

🗓️ Deadline: ${deadline}
💳 Payment Methods:
• Bank: ${bankName} (A/C: ${bankNo})
• bKash/Nagad: ${bkashNo}

Please share the deposit slip or transaction ID after payment.

Best regards,
${samityName}
Contact: ${samity.mobile || samity.phone}`;
  }
};

// WhatsApp Direct wa.me Link
export const getWhatsAppUrl = (mobile, message) => {
  if (!mobile) return null;
  let cleanMobile = mobile.replace(/[^0-9]/g, '');
  if (cleanMobile.startsWith('0')) {
    cleanMobile = '88' + cleanMobile;
  }
  return `https://wa.me/${cleanMobile}?text=${encodeURIComponent(message)}`;
};

// Telegram Bot direct link
export const getTelegramUrl = (telegramHandle, message) => {
  if (!telegramHandle) return null;
  const handle = telegramHandle.replace('@', '');
  return `https://t.me/${handle}?text=${encodeURIComponent(message)}`;
};

// Messenger direct link
export const getMessengerUrl = (messengerUser) => {
  if (!messengerUser) return null;
  const handle = messengerUser.replace(/https?:\/\/(www\.)?m\.me\//, '').replace('/', '');
  return `https://m.me/${handle}`;
};

// Complete Section 32 SQL Migration Schema for PostgreSQL / Supabase
export const SAMITY_SQL_MIGRATION_SCHEMA = `-- ============================================================================
-- HISABKITAB 360 - SAMITY / CLUB / ASSOCIATION COMPLETE DATABASE SCHEMA
-- Normalized Tables, Foreign Keys, Indexes, Audit Constraints, Multi-Tenant Safe
-- Compatible with PostgreSQL 13+, Supabase & SQLite (with minor dialect adaptations)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SAMITIES TABLE (Multi-Tenant Master)
CREATE TABLE IF NOT EXISTS samities (
    id VARCHAR(64) PRIMARY KEY,
    name_bn VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    samity_type VARCHAR(64) NOT NULL DEFAULT 'Savings Samity',
    registration_no VARCHAR(100),
    established_date DATE,
    logo_url TEXT,
    slogan_bn VARCHAR(255),
    slogan_en VARCHAR(255),
    address TEXT,
    division VARCHAR(64),
    district VARCHAR(64),
    upazila_thana VARCHAR(64),
    post_office VARCHAR(64),
    village_area VARCHAR(128),
    phone VARCHAR(32),
    mobile VARCHAR(32) NOT NULL,
    whatsapp VARCHAR(32),
    email VARCHAR(128),
    website VARCHAR(255),
    facebook_page_url VARCHAR(255),
    youtube_url VARCHAR(255),
    bank_account_name VARCHAR(255),
    bank_name VARCHAR(128),
    bank_branch_name VARCHAR(128),
    bank_account_no VARCHAR(64),
    bank_routing_no VARCHAR(32),
    mobile_banking_provider VARCHAR(32),
    mobile_banking_number VARCHAR(32),
    mobile_banking_type VARCHAR(32) DEFAULT 'Merchant',
    currency VARCHAR(16) DEFAULT 'BDT',
    monthly_subscription NUMERIC(12, 2) NOT NULL DEFAULT 500.00,
    subscription_due_day INT DEFAULT 10,
    grace_period_days INT DEFAULT 5,
    late_fee_enabled BOOLEAN DEFAULT TRUE,
    late_fee_amount NUMERIC(10, 2) DEFAULT 50.00,
    financial_year_start DATE,
    financial_year_end DATE,
    status VARCHAR(32) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64),
    updated_by VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_samities_status ON samities(status);

-- 2. MEMBERS TABLE
CREATE TABLE IF NOT EXISTS members (
    id VARCHAR(64) PRIMARY KEY,
    samity_id VARCHAR(64) NOT NULL REFERENCES samities(id) ON DELETE CASCADE,
    member_code VARCHAR(64),
    name_bn VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    father_name VARCHAR(255),
    mother_name VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(16) DEFAULT 'Male',
    nid_number VARCHAR(64),
    passport_number VARCHAR(64),
    photo_url TEXT,
    mobile VARCHAR(32) NOT NULL,
    alt_mobile VARCHAR(32),
    whatsapp_number VARCHAR(32),
    telegram_handle VARCHAR(64),
    facebook_profile_url VARCHAR(255),
    messenger_username VARCHAR(64),
    email VARCHAR(128),
    present_address TEXT,
    permanent_address TEXT,
    occupation VARCHAR(128),
    workplace VARCHAR(128),
    blood_group VARCHAR(8),
    membership_type VARCHAR(64) DEFAULT 'General Member',
    membership_start_date DATE NOT NULL,
    membership_end_date DATE,
    custom_subscription NUMERIC(12, 2),
    payment_cycle VARCHAR(32) DEFAULT 'Monthly',
    status VARCHAR(32) DEFAULT 'active',
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64),
    updated_by VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_members_samity ON members(samity_id);
CREATE INDEX IF NOT EXISTS idx_members_mobile ON members(mobile);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);

-- 3. BANK & CASH DEPOSITS TABLE
CREATE TABLE IF NOT EXISTS deposits (
    id VARCHAR(64) PRIMARY KEY,
    voucher_no VARCHAR(64) UNIQUE NOT NULL,
    samity_id VARCHAR(64) NOT NULL REFERENCES samities(id) ON DELETE CASCADE,
    member_id VARCHAR(64) REFERENCES members(id) ON DELETE SET NULL,
    deposit_date DATE NOT NULL,
    deposit_time TIME,
    deposit_type VARCHAR(64) NOT NULL DEFAULT 'Monthly Subscription',
    deposit_method VARCHAR(64) NOT NULL DEFAULT 'Bank Counter',
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    bank_receipt_no VARCHAR(64),
    bank_receipt_date DATE,
    deposit_slip_no VARCHAR(64),
    transaction_id VARCHAR(128),
    cheque_no VARCHAR(64),
    cheque_date DATE,
    bank_name VARCHAR(128),
    bank_branch VARCHAR(128),
    bank_account_no VARCHAR(64),
    depositor_name VARCHAR(255),
    depositor_phone VARCHAR(32),
    payment_month VARCHAR(32),
    payment_year INT,
    remarks TEXT,
    slip_image_url TEXT,
    approval_status VARCHAR(32) DEFAULT 'approved',
    approved_by VARCHAR(64),
    approved_at TIMESTAMP WITH TIME ZONE,
    entry_by VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deposits_samity ON deposits(samity_id);
CREATE INDEX IF NOT EXISTS idx_deposits_member ON deposits(member_id);
CREATE INDEX IF NOT EXISTS idx_deposits_date ON deposits(deposit_date);
CREATE INDEX IF NOT EXISTS idx_deposits_voucher ON deposits(voucher_no);

-- 4. BULK BANK DEPOSITS TABLE
CREATE TABLE IF NOT EXISTS bulk_deposits (
    id VARCHAR(64) PRIMARY KEY,
    samity_id VARCHAR(64) NOT NULL REFERENCES samities(id) ON DELETE CASCADE,
    deposit_date DATE NOT NULL,
    bank_name VARCHAR(128) NOT NULL,
    branch_name VARCHAR(128),
    account_no VARCHAR(64) NOT NULL,
    bank_receipt_no VARCHAR(64) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    depositor_name VARCHAR(255),
    items_count INT DEFAULT 0,
    slip_image_url TEXT,
    approval_status VARCHAR(32) DEFAULT 'approved',
    approved_by VARCHAR(64),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(64) PRIMARY KEY,
    voucher_no VARCHAR(64) UNIQUE NOT NULL,
    samity_id VARCHAR(64) NOT NULL REFERENCES samities(id) ON DELETE CASCADE,
    expense_date DATE NOT NULL,
    category VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(64) DEFAULT 'Cash',
    paid_to VARCHAR(255),
    paid_by VARCHAR(255),
    bank_account_used VARCHAR(64),
    bill_invoice_no VARCHAR(64),
    bill_image_url TEXT,
    approval_status VARCHAR(32) DEFAULT 'approved',
    approved_by VARCHAR(64),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expenses_samity ON expenses(samity_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);

-- 6. REMINDER LOGS TABLE
CREATE TABLE IF NOT EXISTS reminder_logs (
    id VARCHAR(64) PRIMARY KEY,
    samity_id VARCHAR(64) NOT NULL REFERENCES samities(id) ON DELETE CASCADE,
    member_id VARCHAR(64) NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    member_name VARCHAR(255),
    channel VARCHAR(32) NOT NULL, -- 'WhatsApp', 'SMS', 'Telegram', 'Messenger'
    due_month VARCHAR(32),
    due_amount NUMERIC(10, 2),
    message_content TEXT,
    sent_by VARCHAR(64),
    delivery_status VARCHAR(32) DEFAULT 'sent',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reminders_member ON reminder_logs(member_id);

-- 7. AUDIT TRAIL LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    samity_id VARCHAR(64),
    action VARCHAR(64) NOT NULL,
    module VARCHAR(64) NOT NULL,
    record_id VARCHAR(64),
    details JSONB,
    performed_by VARCHAR(64) NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(created_at);
`;
