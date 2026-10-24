// ============================================================================
// Samity / Club / Association Management Service & State Engine
// Multi-tenant, bilingual, modular logic for Hishab Kitab 360
// Zero mock/demo data standard: starts clean, persists to localStorage & Supabase
// ============================================================================

import { broadcastSamityStateUpdate, markRecordAsDeletedTombstone } from './somitiCloudSyncService';
export { markRecordAsDeletedTombstone };

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

// Samity Setup Constants & Multi-Tenant Specs
export const SAMITY_TYPES = [
  { value: 'General Samity', labelBn: 'সাধারণ সমিতি / সমবায় সমিতি', labelEn: 'General Samity' },
  { value: 'Club', labelBn: 'ক্লাব / ক্রীড়া ও সাংস্কৃতিক সংস্থা', labelEn: 'Club' },
  { value: 'Social Organization', labelBn: 'সামাজিক ও যুব সংগঠন', labelEn: 'Social Organization' },
  { value: 'Savings Samity', labelBn: 'সঞ্চয় ও ঋণদান সমবায় সমিতি', labelEn: 'Savings Samity' },
  { value: 'Business Samity', labelBn: 'ব্যবসায়ী সমিতি / বণিক সমিতি', labelEn: 'Business Samity' },
  { value: 'Religious Committee', labelBn: 'ধর্মীয় কমিটি (মসজিদ/মন্দির/মাদ্রাসা)', labelEn: 'Religious Committee' },
  { value: 'School Committee', labelBn: 'স্কুল / কলেজ পরিচালনা পর্ষদ (SMC)', labelEn: 'School Committee' },
  { value: 'Charity Organization', labelBn: 'দাতব্য ও সেবামূলক সংস্থা (NGO)', labelEn: 'Charity Organization' },
  { value: 'Other', labelBn: 'অন্যান্য সমিতি / অ্যাসোসিয়েশন', labelEn: 'Other' }
];

export const BD_DIVISIONS = ['ঢাকা', 'চট্টগ্রাম', 'রাজশাহী', 'খুলনা', 'বরিশাল', 'সিলেট', 'রংপুর', 'ময়মনসিংহ'];

export const MOBILE_BANKING_PROVIDERS = ['bKash', 'Nagad', 'Rocket', 'Upay'];

export const MOBILE_BANKING_ACCOUNT_TYPES = ['Personal', 'Merchant'];

export const SAMITY_STATUSES = [
  { value: 'active', labelBn: 'সক্রিয় (Active)', color: '#10b981' },
  { value: 'inactive', labelBn: 'নিষ্ক্রিয় (Inactive)', color: '#f59e0b' },
  { value: 'archived', labelBn: 'সংরক্ষিত (Archived)', color: '#94a3b8' }
];

// Member Management Module (#2) Specifications & Constants
export const MEMBER_TYPES = [
  { value: 'General Member', labelBn: 'সাধারণ সদস্য', labelEn: 'General Member' },
  { value: 'Life Member', labelBn: 'আজীবন সদস্য', labelEn: 'Life Member' },
  { value: 'Executive Member', labelBn: 'কার্যনির্বাহী সদস্য', labelEn: 'Executive Member' },
  { value: 'Advisor', labelBn: 'উপদেষ্টা', labelEn: 'Advisor' },
  { value: 'President', labelBn: 'সভাপতি', labelEn: 'President' },
  { value: 'Vice President', labelBn: 'সহ-সভাপতি', labelEn: 'Vice President' },
  { value: 'General Secretary', labelBn: 'সাধারণ সম্পাদক', labelEn: 'General Secretary' },
  { value: 'Treasurer', labelBn: 'কোষাধ্যক্ষ', labelEn: 'Treasurer' },
  { value: 'Other', labelBn: 'অন্যান্য পদবি', labelEn: 'Other' }
];

export const MEMBER_STATUSES = [
  { value: 'Active', labelBn: 'সক্রিয় (Active)', color: '#10b981' },
  { value: 'Inactive', labelBn: 'নিষ্ক্রিয় (Inactive)', color: '#f59e0b' },
  { value: 'Suspended', labelBn: 'স্থগিত (Suspended)', color: '#ef4444' },
  { value: 'Cancelled', labelBn: 'বাতিলকৃত (Cancelled)', color: '#dc2626' },
  { value: 'Left', labelBn: 'অব্যাহতিপ্রাপ্ত (Left)', color: '#64748b' }
];

export const PAYMENT_CYCLES = [
  { value: 'Monthly', labelBn: 'মাসিক (Monthly)' },
  { value: 'Quarterly', labelBn: 'ত্রৈমাসিক (Quarterly)' },
  { value: 'Half-Yearly', labelBn: 'ষাণ্মাসিক (Half-Yearly)' },
  { value: 'Yearly', labelBn: 'বার্ষিক (Yearly)' },
  { value: 'One-Time', labelBn: 'এককালীন (One-Time)' }
];

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const GENDERS = [
  { value: 'Male', labelBn: 'পুরুষ (Male)' },
  { value: 'Female', labelBn: 'মহিলা (Female)' },
  { value: 'Other', labelBn: 'অন্যান্য (Other)' }
];

// Bank Deposit Module Specifications & Constants
export const DEPOSIT_TYPES = [
  { value: 'Monthly Subscription', labelBn: 'মাসিক চাঁদা (Monthly Subscription)', color: '#10b981' },
  { value: 'Special Subscription', labelBn: 'বিশেষ চাঁদা (Special Subscription)', color: '#3b82f6' },
  { value: 'Donation', labelBn: 'দান / অনুদান (Donation)', color: '#8b5cf6' },
  { value: 'Fine', labelBn: 'জরিমানা / বিলম্ব ফি (Fine)', color: '#f59e0b' },
  { value: 'Event Collection', labelBn: 'অনুষ্ঠান কালেকশন (Event Collection)', color: '#06b6d4' },
  { value: 'Loan Repayment', labelBn: 'ঋণ পরিশোধ (Loan Repayment)', color: '#ec4899' },
  { value: 'Other Income', labelBn: 'অন্যান্য আয় (Other Income)', color: '#64748b' }
];

export const DEPOSIT_METHODS = [
  { value: 'Bank Counter', labelBn: 'ব্যাংক কাউন্টার (Bank Counter)', icon: 'Landmark' },
  { value: 'Online Banking', labelBn: 'অনলাইন ব্যাংকিং (Online Banking / EFT / NPSB)', icon: 'Globe' },
  { value: 'ATM', labelBn: 'এটিএম বুথ জমা (ATM Deposit)', icon: 'CreditCard' },
  { value: 'Cheque', labelBn: 'ব্যাংক চেক (Cheque)', icon: 'FileText' },
  { value: 'bKash', labelBn: 'বিকাশ (bKash)', icon: 'Smartphone' },
  { value: 'Nagad', labelBn: 'নগদ (Nagad)', icon: 'Smartphone' },
  { value: 'Rocket', labelBn: 'রকেট (Rocket)', icon: 'Smartphone' },
  { value: 'Upay', labelBn: 'উপায় (Upay)', icon: 'Smartphone' },
  { value: 'Cash', labelBn: 'নগদ ক্যাশ (Cash)', icon: 'Wallet' }
];

export const DEPOSIT_APPROVAL_STATUSES = [
  { value: 'approved', labelBn: 'অনুমোদিত (Approved)', color: '#10b981' },
  { value: 'pending', labelBn: 'অপেক্ষমাণ (Pending)', color: '#f59e0b' },
  { value: 'rejected', labelBn: 'বাতিলকৃত (Rejected)', color: '#ef4444' },
  { value: 'cancelled', labelBn: 'স্থগিত (Cancelled)', color: '#64748b' }
];

// Helper to create an initialized Bank Deposit object with all 35 user-requested fields
export const createDefaultDepositObject = (samity = {}, nextCount = 1, custom = {}) => {
  const now = new Date();
  const year = now.getFullYear();
  const monthName = now.toLocaleString('en-US', { month: 'long' });
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().slice(0, 5);
  const pad = String(nextCount).padStart(5, '0');
  const voucherNo = `DEP-${year}-${pad}`;
  const receiptNo = `RCPT-${year}-${pad}`;

  return {
    id: `DEP-${Date.now()}`,
    voucherNo: voucherNo,
    receiptNo: receiptNo,
    depositDate: dateStr,
    depositTime: timeStr,
    samityId: samity?.id || 'SAMITY-001',
    samityName: samity?.nameBn || 'স্বপ্নছোঁয়া সমবায় সমিতি',
    bankName: samity?.bankDetails?.bankName || 'ডাচ্-বাংলা ব্যাংক',
    bankBranch: samity?.bankDetails?.branchName || 'মিরপুর শাখা',
    bankAccountNo: samity?.bankDetails?.accNo || '123.120.98765',
    bankAccountName: samity?.bankDetails?.accName || samity?.nameBn || '',
    depositType: 'Monthly Subscription',
    depositMethod: 'Bank Counter',
    amount: Number(samity?.monthlySubscription || 500),
    bankReceiptNo: '',
    bankReceiptDate: dateStr,
    depositSlipNo: '',
    transactionId: '',
    chequeNo: '',
    chequeDate: '',
    depositorName: '',
    depositorPhone: '',
    depositorWhatsApp: '',
    memberId: '',
    memberName: '',
    paymentMonth: monthName,
    paymentYear: year,
    paymentPeriod: 'Monthly',
    remarks: '',
    bankReceiptImage: '',
    depositSlipImage: '',
    transactionScreenshot: '',
    entryBy: 'Admin / Treasurer',
    entryDate: now.toISOString(),
    approvalStatus: 'approved',
    approvedBy: 'Admin / Treasurer',
    approvedAt: now.toISOString(),
    approvalRemarks: 'স্বয়ংক্রিয়ভাবে যাচাইকৃত ও অনুমোদিত',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...custom
  };
};

// Helper to create an initialized Bulk Bank Deposit object
export const createDefaultBulkDepositObject = (samity = {}, nextCount = 1, custom = {}) => {
  const now = new Date();
  const year = now.getFullYear();
  const dateStr = now.toISOString().split('T')[0];
  const pad = String(nextCount).padStart(4, '0');
  const bulkVoucherNo = `BULK-${year}-${pad}`;

  return {
    id: `BULK-${Date.now()}`,
    bulkVoucherNo: bulkVoucherNo,
    depositDate: dateStr,
    bankName: samity?.bankDetails?.bankName || 'ডাচ্-বাংলা ব্যাংক',
    branchName: samity?.bankDetails?.branchName || 'ঢাকা শাখা',
    accountNo: samity?.bankDetails?.accNo || '123456789',
    bankReceiptNo: '',
    totalSlipAmount: '',
    depositorName: 'কোষাধ্যক্ষ / প্রতিনিধি',
    depositorPhone: '',
    depositorRole: 'Treasurer',
    slipImage: '',
    approvalStatus: 'approved',
    approvedBy: 'Admin / President',
    approvedAt: now.toISOString(),
    allowPartialMatch: false,
    mismatchReason: '',
    remarks: '',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...custom
  };
};

// Helper to create an empty or initialized Member object with all 38 specification fields
export const createDefaultMemberObject = (samityId = 'SAMITY-001', nextCount = 1, custom = {}) => {
  const pad = String(nextCount).padStart(4, '0');
  const memberId = `SM-${pad}`;
  return {
    // 1-8: Core Personal
    id: memberId,
    memberCode: memberId,
    nameBn: '',
    nameEn: '',
    fatherName: '',
    motherName: '',
    dateOfBirth: '',
    gender: 'Male',
    // 9-11: ID & Photo
    nidNumber: '',
    passportNumber: '',
    photo: '',
    // 12-18: Contact & Social
    mobile: '',
    altMobile: '',
    whatsappNumber: '',
    telegramHandle: '',
    facebookProfileUrl: '',
    messengerUsername: '',
    email: '',
    // 19-23: Address & Occupation
    presentAddress: '',
    permanentAddress: '',
    occupation: '',
    organization: '',
    bloodGroup: '',
    // 24-30: Membership & Subscription
    samityId: samityId || 'SAMITY-001',
    membershipType: 'General Member',
    membershipStartDate: new Date().toISOString().split('T')[0],
    membershipEndDate: '',
    monthlySubscription: 500,
    customSubscription: '',
    paymentCycle: 'Monthly',
    status: 'Active',
    // 31-34: Financial & Status Details
    totalPaid: 0,
    totalDue: 0,
    currentMonthPaymentStatus: 'unpaid',
    remarks: '',
    // 35-38: Audit Tracking
    createdBy: 'Admin',
    createdAt: new Date().toISOString(),
    updatedBy: 'Admin',
    updatedAt: new Date().toISOString(),
    ...custom
  };
};

// Helper to create an empty or initialized Samity profile with all 38 specification fields
export const createDefaultSamityObject = (id = 'SAMITY-001', customFields = {}) => {
  const currentYear = new Date().getFullYear();
  return {
    id: id || `SAMITY-${String(Date.now()).slice(-4)}`,
    nameBn: 'স্বপ্নছোঁয়া সমবায় সমিতি',
    nameEn: 'Shopnochoa Co-operative Samity',
    type: 'Savings Samity',
    regNo: 'REG-2026/DHK-482',
    establishedDate: '2024-01-01',
    logo: '/shopnochoa-logo.svg',
    letterpadImage: '',
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
      accName: 'স্বপ্নছোঁয়া সমবায় সমিতি',
      bankName: 'ডাচ্-বাংলা ব্যাংক',
      branchName: 'মিরপুর শাখা',
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
    financialYearStart: `${currentYear}-01-01`,
    financialYearEnd: `${currentYear}-12-31`,
    status: 'active',
    createdBy: 'Super Admin',
    createdAt: new Date().toISOString(),
    updatedBy: 'Super Admin',
    updatedAt: new Date().toISOString(),
    ...customFields
  };
};

export const generateSamityId = (existingSamities = []) => {
  const count = existingSamities.length + 1;
  const pad = String(count).padStart(3, '0');
  return `SAMITY-${pad}`;
};

// Default empty clean state (Strict Zero Mock Data Standard)
const DEFAULT_CLEAN_DATA = {
  samities: [createDefaultSamityObject('SAMITY-001')],
  members: [],
  deposits: [],
  bulkDeposits: [],
  expenses: [],
  bankStatements: [],
  reconciliations: [],
  reminders: [],
  subscriptionBills: [],
  waivers: [],
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
    defaultSmsGateway: 'greenweb',
    whatsappMode: 'click_to_chat', // 'click_to_chat' | 'cloud_api'
    whatsappCloudApi: {
      phoneNumberId: '',
      wabaId: '',
      permanentAccessToken: '',
      webhookVerifyToken: '',
      templateName: 'samity_monthly_due_reminder',
      templateLanguage: 'bn',
      perMessageCostUsd: 0.005,
      autoAttachPdfReceipt: true
    },
    smsConfig: {
      activeGateway: 'greenweb', // 'greenweb' | 'bulksmsbd' | 'sslwireless' | 'twilio' | 'custom'
      apiKey: '',
      apiEndpoint: 'https://api.greenweb.com.bd/api.php',
      senderId: 'HK360SAMITY',
      balance: 1250,
      banglaUnicode: true,
      roleRestricted: 'admin_only' // 'admin_only' | 'treasurer_and_admin' | 'all_staff'
    },
    telegramConfig: {
      botToken: '',
      defaultChatId: '',
      groupChatId: '',
      channelId: '',
      enableBotConfirmations: true
    },
    facebookConfig: {
      pageId: '',
      pageAccessToken: '',
      webhookVerifyToken: '',
      complianceAgreed: true
    },
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
        samities: (parsed.samities?.length ? parsed.samities : DEFAULT_CLEAN_DATA.samities).map(s => ({
          ...s,
          logo: s.logo || '/logo.png'
        })),
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
export const saveSamityData = (data, actionMeta = {}) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // Trigger window event for cross-component sync
    window.dispatchEvent(new CustomEvent('hk360_samity_updated', { detail: data }));
    // Broadcast live state across 4 platforms (Android APK, Mac, PC, Web) in <150ms
    try {
      broadcastSamityStateUpdate(data, actionMeta);
    } catch (syncErr) {
      console.debug('[SamityService] Cloud broadcast error:', syncErr);
    }
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

// Payment Status Types with Bengali labels and standard colors
export const PAYMENT_STATUS_TYPES = [
  { value: 'all', labelBn: 'সকল সদস্য (All)', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' },
  { value: 'paid', labelBn: 'পরিশোধিত (Paid)', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  { value: 'unpaid', labelBn: 'বাকি (Unpaid)', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  { value: 'partially_paid', labelBn: 'আংশিক পরিশোধিত (Partially Paid)', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  { value: 'advance_paid', labelBn: 'অগ্রিম পরিশোধিত (Advance Paid)', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  { value: 'waived', labelBn: 'মওকুফ (Waived)', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' },
  { value: 'cancelled', labelBn: 'বাতিলকৃত (Cancelled)', color: '#e11d48', bg: 'rgba(225, 29, 72, 0.15)' },
  { value: 'due', labelBn: 'বকেয়া সদস্য (Due Members)', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)' }
];

// Monthly Due and Payment Status Engine (with Advance, Partial, Waivers/Discounts, and Late Fees)
export const calculateMemberPaymentStatus = (member, samity, deposits = [], targetMonth = null, targetYear = null, waivers = []) => {
  const now = new Date();
  const currentMonth = targetMonth || now.toLocaleString('en-US', { month: 'long' });
  const currentYear = targetYear || now.getFullYear();

  const monthlyRequired = Number(member.customSubscription) > 0
    ? Number(member.customSubscription)
    : Number(samity?.monthlySubscription || 500);

  // Find approved deposits for this member and target month/year
  const memberDeposits = (deposits || []).filter(d => {
    if (d.memberId !== member.id) return false;
    if (d.samityId && member.samityId && d.samityId !== member.samityId) return false;
    const isApproved = (d.approvalStatus || 'approved').toLowerCase() === 'approved';
    if (!isApproved) return false;

    const dMonth = (d.paymentMonth || d.month || '').toLowerCase();
    const dYear = Number(d.paymentYear || d.year || 0);
    const monthMatches = !dMonth || dMonth === currentMonth.toLowerCase();
    const yearMatches = !dYear || dYear === Number(currentYear);
    return monthMatches && yearMatches;
  });

  const totalPaidForMonth = memberDeposits.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const latestDeposit = memberDeposits[memberDeposits.length - 1] || memberDeposits[0] || null;

  // Find authorized waivers/discounts for this member and target month/year
  const memberWaivers = (waivers || []).filter(w =>
    w.memberId === member.id &&
    (!w.samityId || !member.samityId || w.samityId === member.samityId) &&
    (!w.month || w.month.toLowerCase() === currentMonth.toLowerCase()) &&
    (!w.year || Number(w.year) === Number(currentYear))
  );
  const totalWaiver = memberWaivers.reduce((sum, w) => sum + Number(w.amount || 0), 0);

  // All time total paid
  const allTimePaid = (deposits || [])
    .filter(d => d.memberId === member.id && (!d.samityId || !member.samityId || d.samityId === member.samityId) && (d.approvalStatus || 'approved').toLowerCase() === 'approved')
    .reduce((sum, d) => sum + Number(d.amount || 0), 0);

  let status = 'unpaid';
  let dueAmount = monthlyRequired;
  let advanceAmount = 0;

  const isMemberCancelled = (member.status || '').toLowerCase() === 'cancelled' || (member.membershipStatus || '').toLowerCase() === 'cancelled';
  const effectiveCredit = totalPaidForMonth + totalWaiver;

  if (isMemberCancelled) {
    status = 'cancelled';
    dueAmount = 0;
  } else if (effectiveCredit >= monthlyRequired) {
    if (totalPaidForMonth > monthlyRequired) {
      status = 'advance_paid';
      dueAmount = 0;
      advanceAmount = totalPaidForMonth - monthlyRequired;
    } else if (totalWaiver >= monthlyRequired && totalPaidForMonth === 0) {
      status = 'waived';
      dueAmount = 0;
      advanceAmount = 0;
    } else {
      status = 'paid';
      dueAmount = 0;
      advanceAmount = 0;
    }
  } else if (effectiveCredit > 0 && effectiveCredit < monthlyRequired) {
    status = 'partially_paid';
    dueAmount = monthlyRequired - effectiveCredit;
  } else {
    status = 'unpaid';
    dueAmount = monthlyRequired;
  }

  // Calculate Previous Months' Cumulative Due
  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const targetMonthIndex = MONTH_NAMES.findIndex(m => m.toLowerCase() === currentMonth.toLowerCase());
  let previousMonthsDues = 0;
  const previousMonthsBreakdown = [];

  if (targetMonthIndex > 0) {
    for (let i = 0; i < targetMonthIndex; i++) {
      const prevM = MONTH_NAMES[i];
      const prevDeposits = (deposits || []).filter(d => {
        if (d.memberId !== member.id) return false;
        if (d.samityId && member.samityId && d.samityId !== member.samityId) return false;
        if ((d.approvalStatus || 'approved').toLowerCase() !== 'approved') return false;
        const dMonth = (d.paymentMonth || d.month || '').toLowerCase();
        const dYear = Number(d.paymentYear || d.year || 0);
        return dMonth === prevM.toLowerCase() && (!dYear || dYear === Number(currentYear));
      });
      const prevWaivers = (waivers || []).filter(w =>
        w.memberId === member.id &&
        (!w.samityId || !member.samityId || w.samityId === member.samityId) &&
        w.month && w.month.toLowerCase() === prevM.toLowerCase() &&
        (!w.year || Number(w.year) === Number(currentYear))
      );
      const prevPaid = prevDeposits.reduce((sum, d) => sum + Number(d.amount || 0), 0);
      const prevWaived = prevWaivers.reduce((sum, w) => sum + Number(w.amount || 0), 0);
      const prevDue = Math.max(0, monthlyRequired - (prevPaid + prevWaived));
      if (prevDue > 0) {
        previousMonthsDues += prevDue;
        previousMonthsBreakdown.push({ month: prevM, due: prevDue, paid: prevPaid, waived: prevWaived });
      }
    }
  }

  // Check if late fee applies (Fixed or Percentage, with auto-apply check)
  const dueDay = samity?.subscriptionDueDay || 10;
  const gracePeriod = samity?.gracePeriodDays || 5;
  const cutoffDay = dueDay + gracePeriod;
  let lateFee = 0;

  const lateFeeAuto = samity?.lateFeeAutoApply !== false;
  if (!isMemberCancelled && status !== 'paid' && status !== 'advance_paid' && status !== 'waived' && samity?.lateFeeEnabled && lateFeeAuto && now.getDate() > cutoffDay) {
    if (samity?.lateFeeType === 'percentage') {
      const pct = Number(samity?.lateFeePercent || 5);
      lateFee = Math.round((monthlyRequired * pct) / 100);
    } else {
      lateFee = Number(samity?.lateFeeAmount || 50);
    }
  }

  const totalCumulativeDue = dueAmount + previousMonthsDues + lateFee;

  return {
    memberId: member.id,
    memberName: member.nameBn || member.nameEn || 'সদস্য',
    mobile: member.mobile || member.phone || '',
    whatsappNumber: member.whatsappNumber || member.whatsapp || member.mobile || '',
    telegramHandle: member.telegramHandle || member.telegramUsername || member.telegram || '',
    facebookProfileUrl: member.facebookProfileUrl || member.facebookProfile || member.facebookUrl || '',
    month: currentMonth,
    year: currentYear,
    requiredAmount: monthlyRequired,
    paidAmount: totalPaidForMonth,
    waiverAmount: totalWaiver,
    dueAmount: dueAmount,
    advanceAmount: advanceAmount,
    previousMonthsDues: previousMonthsDues,
    previousMonthsBreakdown: previousMonthsBreakdown,
    lateFee: lateFee,
    totalPayable: dueAmount + lateFee,
    totalCumulativeDue: totalCumulativeDue,
    status: status, // 'paid' | 'unpaid' | 'partially_paid' | 'advance_paid' | 'waived' | 'cancelled'
    allTimePaid,
    depositDate: latestDeposit?.depositDate || latestDeposit?.date || '',
    bankReceiptNo: latestDeposit?.bankReceiptNo || '',
    paymentMethod: latestDeposit?.depositMethod || latestDeposit?.method || '',
    bankName: latestDeposit?.bankName || '',
    voucherNo: latestDeposit?.voucherNo || '',
    receiptNo: latestDeposit?.receiptNo || '',
    depositSlipNo: latestDeposit?.depositSlipNo || '',
    latestDeposit: latestDeposit,
    allMonthDeposits: memberDeposits
  };
};

// Auto-generate monthly subscription bills for all active members
export const generateMonthlySubscriptionBills = (samityId, data, targetMonth, targetYear) => {
  const samity = data.samities?.find(s => s.id === samityId) || data.samities?.[0] || {};
  const activeMembers = (data.members || []).filter(m => m.samityId === samityId && (m.status || 'Active').toLowerCase() === 'active');

  const generatedBills = activeMembers.map(member => {
    const status = calculateMemberPaymentStatus(member, samity, data.deposits || [], targetMonth, targetYear, data.waivers || []);
    return {
      id: `BILL-${targetYear}-${targetMonth.slice(0, 3).toUpperCase()}-${member.id}`,
      billNo: `BILL-${targetYear}-${member.id}`,
      samityId,
      memberId: member.id,
      memberName: member.nameBn || member.nameEn,
      memberCode: member.memberCode || member.id,
      month: targetMonth,
      year: targetYear,
      subscriptionAmount: status.requiredAmount,
      paidAmount: status.paidAmount,
      waiverAmount: status.waiverAmount || 0,
      currentDue: status.dueAmount,
      previousDues: status.previousMonthsDues || 0,
      lateFee: status.lateFee,
      totalPayable: status.totalCumulativeDue,
      status: status.status,
      generatedAt: new Date().toISOString()
    };
  });

  return generatedBills;
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

// Template Variable Replacer
export const replaceTemplateVariables = (templateStr, { member, samity, dueInfo, treasurer }) => {
  if (!templateStr) return '';
  const memberName = member?.nameBn || member?.nameEn || 'সম্মানিত সদস্য';
  const samityName = samity?.nameBn || samity?.nameEn || 'সমিতি';
  const month = dueInfo?.month || 'চলতি মাস';
  const dueAmount = dueInfo?.dueAmount || 0;
  const deadline = `${samity?.subscriptionDueDay || 10} ${dueInfo?.month || ''} ${dueInfo?.year || ''}`.trim();
  const treasurerName = treasurer?.name || 'কোষাধ্যক্ষ দপ্তর';
  const treasurerPhone = treasurer?.phone || samity?.mobile || '';

  return templateStr
    .replace(/\{\{member_name\}\}/g, memberName)
    .replace(/\{\{payment_month\}\}/g, month)
    .replace(/\{\{samity_name\}\}/g, samityName)
    .replace(/\{\{due_amount\}\}/g, dueAmount)
    .replace(/\{\{due_date\}\}/g, deadline)
    .replace(/\{\{treasurer_name\}\}/g, treasurerName)
    .replace(/\{\{treasurer_phone\}\}/g, treasurerPhone);
};

// Reminder Message Formatter (WhatsApp, SMS, Telegram, Messenger)
export const formatReminderMessage = ({ member, samity, dueInfo, channel = 'whatsapp', templateType = 'standard', lang = 'bn', treasurer = null }) => {
  const samityName = lang === 'bn' ? samity.nameBn : samity.nameEn;
  const memberName = lang === 'bn' ? member.nameBn || member.nameEn : member.nameEn || member.nameBn;
  const month = dueInfo.month || 'চলতি মাস';
  const dueAmount = dueInfo.dueAmount || 0;
  const deadline = `${samity.subscriptionDueDay || 10} ${dueInfo.month || ''} ${dueInfo.year || ''}`.trim();
  const treasurerName = treasurer?.name || 'কোষাধ্যক্ষ';
  const treasurerPhone = treasurer?.phone || samity.mobile || '';

  const bkashNo = samity.mobileBanking?.number || samity.mobile || '01XXXXXXXXX';
  const bankNo = samity.bankDetails?.accNo || '';
  const bankName = samity.bankDetails?.bankName || '';

  // 13. Specific SMS Concise Format
  if (channel === 'sms') {
    if (lang === 'bn') {
      return `প্রিয় ${memberName}, আপনার ${month} মাসের ${samityName} চাঁদা ${dueAmount} টাকা বাকি আছে। অনুগ্রহপূর্বক ${deadline} এর মধ্যে জমা দিন।`;
    } else {
      return `Dear ${memberName}, your ${month} subscription of ${dueAmount} BDT for ${samityName} is due. Please pay by ${deadline}.`;
    }
  }

  // 14. Specific Telegram Bot & Channel Format
  if (channel === 'telegram') {
    return `📢 *${samityName} — বকেয়া চাঁদা পরিশোধের তাগিদ*
সদস্য: *${memberName}* (আইডি: \`${member.id}\`)
পরিশোধের মাস: ${month}
বকেয়া পরিমাণ: *৳ ${dueAmount}/-*
জমার শেষ তারিখ: ${deadline}

টাকা জমা দেওয়ার মাধ্যম: ব্যাংক / বিকাশ / নগদ।
জমা দেওয়ার পর অনুগ্রহ করে স্লিপ বা ট্রানজ্যাকশন আইডি পাঠিয়ে নিশ্চিত করুন।
হেল্পলাইন: ${samity.mobile || samity.phone}`;
  }

  // 15. Facebook Messenger Format
  if (channel === 'messenger') {
    return `প্রিয় ${memberName}, ${samityName}-এ আপনার ${month} মাসের চাঁদা ৳${dueAmount}/- এখনো অপরিশোধিত রয়েছে। অনুগ্রহপূর্বক ${deadline}-এর মধ্যে জমা দিয়ে রসিদের ছবি বা ট্রানজ্যাকশন আইডি পাঠিয়ে নিশ্চিত করবেন। ধন্যবাদ!`;
  }

  // 10. WhatsApp Format
  if (templateType === 'sample_spec' || templateType === 'standard') {
    return `প্রিয় ${memberName},

আপনার ${month} মাসের ${samityName}-এর মাসিক চাঁদা ${dueAmount} টাকা এখনো জমা হয়নি।

জমার শেষ তারিখ: ${deadline}
জমার মাধ্যম: ব্যাংক / বিকাশ / নগদ

জমা দেওয়ার পর ব্যাংক রিসিটের ছবি পাঠাবেন।

ধন্যবাদ,
${samityName}
${treasurerName}
${treasurerPhone}`;
  }

  if (lang === 'bn') {
    let headerIntro = `আপনার ${month} মাসের "${samityName}"-এর মাসিক চাঁদা ৳${dueAmount}/- এখনো জমা হয়নি।`;
    if (templateType === 'pre_due_7') {
      headerIntro = `আসন্ন ${month} মাসের নিয়মিত মাসিক চাঁদা ৳${dueAmount}/- আগামী ৭ দিনের মধ্যে (${deadline}) জমা দেওয়ার জন্য অগ্রিম অনুরোধ করা হলো।`;
    } else if (templateType === 'pre_due_3') {
      headerIntro = `স্মরণ করিয়ে দিচ্ছি যে, ${month} মাসের চাঁদা ৳${dueAmount}/- পরিশোধের আর মাত্র ৩ দিন বাকি আছে (শেষ তারিখ: ${deadline})।`;
    } else if (templateType === 'due_date') {
      headerIntro = `আজকে ${month} মাসের নিয়মিত মাসিক চাঁদা ৳${dueAmount}/- জমা প্রদানের নির্ধারিত শেষ দিন (${deadline})। বিলম্ব ফি এড়াতে আজই জমা দিন।`;
    } else if (templateType === 'post_due_3') {
      headerIntro = `আপনার ${month} মাসের মাসিক চাঁদা ৳${dueAmount}/- নির্ধারিত সময়সীমা (${deadline}) অতিক্রান্ত হয়েছে। পরবর্তী জরিমানা এড়াতে অবিলম্বে পরিশোধ করুন।`;
    } else if (templateType === 'post_due_7') {
      headerIntro = `জরুরি নোটিশ: আপনার ${month} মাসের বকেয়া চাঁদা ৳${dueAmount}/- নির্ধারিত শেষ তারিখের ৭ দিন পরেও অপরিশোধিত রয়েছে।`;
    } else if (templateType === 'final_warning') {
      headerIntro = `⚠️ চূড়ান্ত সতর্কবার্তা / FINAL NOTICE: সমিতির বিধিমালা অনুযায়ী বারবার তাগাদা সত্ত্বেও আপনার বকেয়া ৳${dueAmount}/- পরিশোধ করা হয়নি। আগামী ৩ কার্যদিবসের মধ্যে পরিশোধ না করলে সদস্যপদ স্থগিতের প্রক্রিয়া শুরু হতে পারে।`;
    }

    return `সম্মানিত ${memberName},
আইডি: ${member.id}

${headerIntro}

🗓️ জমার শেষ সময়সীমা: ${deadline}
💳 জমার হিসাব বিবরণ:
• ব্যাংক: ${bankName} (হিসাব নং: ${bankNo})
• বিকাশ/নগদ: ${bkashNo} (${samity.mobileBanking?.accountType || 'মার্চেন্ট'}, Ref: ${member.id})

টাকা জমা দেওয়ার পর অনুগ্রহ করে ট্রানজ্যাকশন আইডি বা ব্যাংক রিসিটের ছবি পাঠিয়ে নিশ্চিত করুন।

ধন্যবাদান্তে,
${samityName}
হেল্পলাইন: ${samity.mobile || samity.phone}`;
  } else {
    return `Dear ${memberName} (ID: ${member.id}),

Your monthly subscription for ${month} of "${samityName}" amounting to BDT ${dueAmount}/- is currently due.

🗓️ Deadline: ${deadline}
💳 Payment Methods:
• Bank: ${bankName} (A/C: ${bankNo})
• bKash/Nagad: ${bkashNo} (Ref: ${member.id})

Please share deposit slip or transaction ID after payment.

Best regards,
${samityName}
Helpline: ${samity.mobile || samity.phone}`;
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

// Complete 28 Modules List & Specification Index
export const SAMITY_28_MODULES = [
  { id: 'samity_setup', num: 1, nameBn: '১. সমিতি সেটআপ মডিউল', nameEn: '1. Samity Setup Module', icon: 'Building2', desc: 'একাধিক সমিতি/শাখা তৈরি, প্রোফাইল, লোগো, স্লোগান ও ব্যাংক একাউন্ট কনফিগারেশন', descEn: 'Create branches, profiles, logos, slogans and bank accounts configuration' },
  { id: 'member_mgmt', num: 2, nameBn: '২. সদস্য ব্যবস্থাপনা মডিউল', nameEn: '2. Member Management Module', icon: 'Users', desc: 'সদস্য কোড, বাংলা ও ইংরেজি নাম, এনআইডি, ছবি, ঠিকানা, রক্তের গ্রুপ ও পদবি', descEn: 'Member code, English & Bengali names, NID, photo, address, blood group & designation' },
  { id: 'subscription_cfg', num: 3, nameBn: '৩. সাবস্ক্রিপশন / চাঁদা কনফিগারেশন', nameEn: '3. Subscription Policy & Config Module', icon: 'Settings', desc: 'মাসিক চাঁদার পরিমাণ, সদস্যভেদে ভিন্ন ফি, সাইকেল, শেষ তারিখ ও গ্রেস পিরিয়ড', descEn: 'Monthly subscription amount, tier fees, billing cycles, deadlines & grace period' },
  { id: 'bank_deposit', num: 4, nameBn: '৪. ব্যাংক ও নগদ জমা মডিউল', nameEn: '4. Bank & Cash Deposit Module', icon: 'Landmark', desc: 'কাউন্টার জমা, অনলাইন ব্যাংকিং, চেক, বিকাশ/নগদ ও ব্যাংক স্লিপ ট্র্যাকিং', descEn: 'Counter deposit, online banking, cheque, MFS & bank slip tracking' },
  { id: 'bulk_deposit', num: 5, nameBn: '৫. বাল্ক ব্যাংক জমা মডিউল', nameEn: '5. Bulk Bank Deposit Module', icon: 'Layers', desc: 'এক ক্লিকে একাধিক সদস্যের চাঁদা ও মোট ব্যাংক ডিপোজিট রেকর্ড এন্ট্রি', descEn: 'One-click multi-member subscription & total bank deposit entry' },
  { id: 'payment_status', num: 6, nameBn: '৬. পেমেন্ট স্ট্যাটাস ড্যাশবোর্ড', nameEn: '6. Payment Status Module', icon: 'CheckCircle2', desc: 'পরিশোধিত, অপরিশোধিত ও আংশিক পরিশোধিত সদস্যদের রিয়েল-টাইম লাইভ ট্র্যাকিং', descEn: 'Real-time live tracking of paid, unpaid, and partially paid members' },
  { id: 'due_mgmt', num: 7, nameBn: '৭. বকেয়া / ডিউ ব্যবস্থাপনা ও মওকুফ', nameEn: '7. Due Defaulters & Waiver Module', icon: 'Clock', desc: 'মাসিক বকেয়া গণনা, বিলম্ব ফি, বকেয়া নোটিশ প্রিন্ট ও বিশেষ মওকুফ (Waiver)', descEn: 'Monthly due calculation, late fees, due notices printing & special waivers' },
  { id: 'paid_receipt', num: 8, nameBn: '৮. পেইড রশিদ ও ভাউচার মডিউল', nameEn: '8. Paid Receipt & Voucher Module', icon: 'Receipt', desc: 'বাংলা ও ইংরেজি কথায় টাকা, কিউআর কোড ভেরিফিকেশন, A4 ও POS থার্মাল প্রিন্ট', descEn: 'Amount in words, QR code verification, A4 and POS thermal receipt printing' },
  { id: 'reminder_hub', num: 9, nameBn: '৯. সেন্ট্রাল রিমাইন্ডার ইঞ্জিন', nameEn: '9. Central Reminder Engine', icon: 'Send', desc: 'বকেয়া নোটিফিকেশন প্রস্তুত, ট্র্যাকিং লগ ও অটো রিমাইন্ডার মেসেজ তৈরি', descEn: 'Due notices dispatch, tracking logs & automated reminder generation' },
  { id: 'whatsapp_reminder', num: 10, nameBn: '১০. হোয়াটসঅ্যাপ রিমাইন্ডার মডিউল', nameEn: '10. WhatsApp Reminder Module', icon: 'MessageSquare', desc: '১-ক্লিকে বাংলা ফরম্যাটেড বকেয়া তাগাদা ও সরাসরি wa.me সংযোগ', descEn: 'One-click formatted due reminder alerts with direct WhatsApp wa.me links' },
  { id: 'sms_reminder', num: 11, nameBn: '১১. এসএমএস রিমাইন্ডার মডিউল', nameEn: '11. SMS Reminder Module', icon: 'Smartphone', desc: 'বাংলা ইউনিকোড ১৬০ ক্যারেক্টার এসএমএস এবং গেটওয়ে রেডি ইন্টিগ্রেশন', descEn: 'Bilingual 160-character SMS and ready gateway integration' },
  { id: 'telegram_reminder', num: 12, nameBn: '১২. টেলিগ্রাম রিমাইন্ডার মডিউল', nameEn: '12. Telegram Reminder Module', icon: 'Send', desc: 'সদস্যের টেলিগ্রাম ইউজারনেমে ডিরেক্ট মেসেজ ও বট নোটিফিকেশন', descEn: 'Direct Telegram username alerts and automated bot notifications' },
  { id: 'messenger_reminder', num: 13, nameBn: '১৩. ফেসবুক / মেসেঞ্জার রিমাইন্ডার', nameEn: '13. Facebook / Messenger Reminder Module', icon: 'Share2', desc: 'মেসেঞ্জার প্রোফাইল লিংক ও সরাসরি ক্লিপবোর্ড কপি পেস্ট নোটিশ', descEn: 'Messenger profile links and direct clipboard-ready reminder notices' },
  { id: 'expense_mgmt', num: 14, nameBn: '১৪. ব্যয় / খরচ ব্যবস্থাপনা মডিউল', nameEn: '14. Expense Management Module', icon: 'Wallet', desc: 'সমিতির পরিচালন ব্যয়, ভাউচার নম্বর, ক্যাটাগরি, প্রাপক ও অনুমোদন', descEn: 'Operating expenses, voucher numbers, categories, payees and approvals' },
  { id: 'fund_balance', num: 15, nameBn: '১৫. ফান্ড ও একাউন্টস ব্যালেন্স', nameEn: '15. Fund & Balance Module', icon: 'DollarSign', desc: 'ব্যাংক ব্যালান্স, নগদ ক্যাশ ইন হ্যান্ড, মোবাইল ব্যাংকিং ও নেট রিজার্ভ ফান্ড', descEn: 'Bank balances, petty cash in hand, mobile banking & net reserve fund' },
  { id: 'report_module', num: 16, nameBn: '১৬. ২৮টি পূর্ণাঙ্গ রিপোর্ট মডিউল', nameEn: '16. 28 Full Reports Module', icon: 'FileSpreadsheet', desc: 'কালেকশন রিপোর্ট, বকেয়া তালিকা, আয়-ব্যয় খতিয়ান ও অডিট স্টেটমেন্ট', descEn: 'Collection reports, defaulters list, income-expense ledgers & audit statements' },
  { id: 'letterhead_module', num: 17, nameBn: '১৭. লেটারহেড ও প্রিন্ট টেমপ্লেট', nameEn: '17. Letterhead & Print Template Module', icon: 'FileText', desc: 'অফিসিয়াল প্যাড, ওয়াটারমার্ক, হেডার কালার, বর্ডার ও ডায়নামিক ফুটার', descEn: 'Official letterhead pads, watermarks, header branding, borders & footers' },
  { id: 'signature_module', num: 18, nameBn: '১৮. স্বাক্ষর ও সিল ব্যবস্থাপনা', nameEn: '18. Signature & Seal Management Module', icon: 'PenTool', desc: 'সভাপতি, সাধারণ সম্পাদক ও কোষাধ্যক্ষের ডিজিটাল স্বাক্ষর ও অফিসিয়াল সিল', descEn: 'Digital signatures & official seals of President, Secretary & Treasurer' },
  { id: 'document_generator', num: 19, nameBn: '১৯. ডকুমেন্ট জেনারেটর মডিউল', nameEn: '19. Document Generator Module', icon: 'Award', desc: 'সদস্যপদ প্রত্যয়নপত্র, সভার নোটিশ, রেজোলিউশন ও অনাপত্তিপত্র (NOC)', descEn: 'Membership certificates, meeting notices, resolutions & NOC documents' },
  { id: 'rbac_module', num: 20, nameBn: '২০. ইউজার, রোল ও পারমিশন মডিউল', nameEn: '20. User, Role & Permission Module', icon: 'ShieldCheck', desc: 'সভাপতি, কোষাধ্যক্ষ, ক্যাশিয়ার, হিসাবরক্ষক ও অডিটরের সুনির্দিষ্ট ক্ষমতা', descEn: 'Granular permissions for President, Treasurer, Cashier, Accountant & Auditor' },
  { id: 'approval_module', num: 21, nameBn: '২১. অনুমোদন ওয়ার্কফ্লো মডিউল', nameEn: '21. Approval Workflow Module', icon: 'Check', desc: 'পেন্ডিং জমা ও খরচের ভাউচার যাচাই, ১-ক্লিক এপ্রুভ বা রিজেক্ট সিস্টেম', descEn: 'Review pending deposits & expense vouchers with one-click approval/rejection' },
  { id: 'audit_trail', num: 22, nameBn: '২২. অডিট ট্রেইল ও হিস্টোরি লগ', nameEn: '22. Audit Trail Module', icon: 'Search', desc: 'কে কখন কোন এন্ট্রি যুক্ত, পরিবর্তন বা মুছে ফেলেছে তার অপরিবর্তনীয় লগ', descEn: 'Immutable logs of who added, updated or deleted any system transaction' },
  { id: 'notification_center', num: 23, nameBn: '২৩. নোটিফিকেশন সেন্টার মডিউল', nameEn: '23. Notification Module', icon: 'Bell', desc: 'বকেয়া চাঁদার এলার্ট, ব্যাংকিং তারিখের রিমাইন্ডার ও ফান্ড সতর্কতা', descEn: 'Subscription due alerts, banking reminders & fund reserve notifications' },
  { id: 'dashboard_module', num: 24, nameBn: '২৪. লাইভ এক্সিকিউটিভ ড্যাশবোর্ড', nameEn: '24. Live Executive Dashboard', icon: 'TrendingUp', desc: 'টপ কেপিআই কার্ড, কালেকশন পার্সেন্টেজ, গ্রাফ চার্ট ও সাম্প্রতিক লেনদেন', descEn: 'Top KPI cards, collection percentage, charts & recent transactions' },
  { id: 'settings_module', num: 25, nameBn: '২৫. কনফিগারেশন ও সেটিংস মডিউল', nameEn: '25. Settings Module', icon: 'Sliders', desc: 'কারেন্সি, ভাউচার প্রিফিক্স, এসএমএস গেটওয়ে ও পেপার সাইজ প্রেফারেন্স', descEn: 'Currency, voucher prefixes, SMS gateways & paper size preferences' },
  { id: 'api_module', num: 26, nameBn: '২৬. রেস্ট এপিআই ও ওয়েবহুক মডিউল', nameEn: '26. REST API & Webhook Module', icon: 'Code', desc: 'নিরাপদ REST API এন্ডপয়েন্ট তালিকা, JSON ডকুমেন্টেশন ও cURL উদাহরণ', descEn: 'Secure REST API endpoints directory, JSON documentation & cURL examples' },
  { id: 'multilang_module', num: 27, nameBn: '২৭. মাল্টি-ল্যাঙ্গুয়েজ মডিউল', nameEn: '27. Multi-language Module', icon: 'Globe', desc: 'বাংলা ও ইংরেজি সম্পূর্ণ লেবেল, রসিদ ও রিপোর্ট এক ক্লিকে টগল', descEn: 'One-click toggle between complete Bengali and English UI, receipts & reports' },
  { id: 'backup_module', num: 28, nameBn: '২৮. ব্যাকআপ, এক্সপোর্ট ও ইমপোর্ট', nameEn: '28. Backup, Export & Import Module', icon: 'Download', desc: '১-ক্লিক সম্পূর্ণ ডাটাবেজ ব্যাকআপ (JSON), এক্সেল এক্সপোর্ট ও ডাটা রিস্টোর', descEn: 'One-click complete database backup (JSON), Excel export & data restore' }
];

// Samity Specific RBAC Role Definitions
export const SAMITY_RBAC_ROLES = [
  {
    role: 'president',
    titleBn: 'সভাপতি (President)',
    titleEn: 'President',
    permissions: ['all_view', 'approve_expense', 'approve_deposit', 'sign_documents', 'view_reports', 'manage_settings'],
    color: '#8b5cf6'
  },
  {
    role: 'secretary',
    titleBn: 'সাধারণ সম্পাদক (General Secretary)',
    titleEn: 'General Secretary',
    permissions: ['all_view', 'manage_members', 'create_documents', 'send_reminders', 'view_reports'],
    color: '#3b82f6'
  },
  {
    role: 'treasurer',
    titleBn: 'কোষাধ্যক্ষ (Treasurer)',
    titleEn: 'Treasurer',
    permissions: ['all_view', 'entry_deposit', 'entry_expense', 'bulk_deposit', 'approve_deposit', 'view_fund', 'sign_receipts'],
    color: '#10b981'
  },
  {
    role: 'accountant',
    titleBn: 'হিসাবরক্ষক (Accountant)',
    titleEn: 'Accountant',
    permissions: ['entry_deposit', 'entry_expense', 'view_reports', 'view_members', 'print_receipts'],
    color: '#f59e0b'
  },
  {
    role: 'auditor',
    titleBn: 'অভ্যন্তরীণ অডিটর (Auditor)',
    titleEn: 'Auditor',
    permissions: ['all_view', 'view_audit_trail', 'view_reports', 'verify_transactions'],
    color: '#06b6d4'
  },
  {
    role: 'general_member',
    titleBn: 'সাধারণ সদস্য (General Member)',
    titleEn: 'General Member',
    permissions: ['view_own_profile', 'view_own_ledger', 'download_receipts'],
    color: '#64748b'
  }
];

// REST API Endpoints Specification
export const SAMITY_API_SPEC = [
  { method: 'GET', endpoint: '/api/v1/samity/members', desc: 'Get all registered members with due status' },
  { method: 'POST', endpoint: '/api/v1/samity/members', desc: 'Register a new member with full contact profile' },
  { method: 'GET', endpoint: '/api/v1/samity/deposits', desc: 'List all verified bank & cash deposits' },
  { method: 'POST', endpoint: '/api/v1/samity/deposits/bulk', desc: 'Submit bulk monthly subscription deposits' },
  { method: 'POST', endpoint: '/api/v1/samity/reminders/send', desc: 'Trigger automated multi-channel payment reminder' },
  { method: 'GET', endpoint: '/api/v1/samity/fund-summary', desc: 'Retrieve current bank balance, cash reserve and net funds' },
  { method: 'POST', endpoint: '/api/v1/samity/waivers', desc: 'Record approved subscription or penalty waiver' },
  { method: 'GET', endpoint: '/api/v1/samity/audit-logs', desc: 'Fetch immutable compliance audit history' }
];

// Backup & Export Helpers
export const exportSamityBackupJson = (data) => {
  const exportPayload = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    system: 'HisabKitab 360 - Samity Management Hub',
    data: data
  };
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportPayload, null, 2))}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', `samity_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

export const exportMembersCsv = (members = [], samity = {}) => {
  const headers = [
    'Member ID', 'Member Code', 'Bangla Name', 'English Name', 'Father Name', 'Mother Name',
    'Gender', 'Date of Birth', 'Mobile', 'Alt Mobile', 'WhatsApp', 'Telegram', 'Facebook URL',
    'Email', 'NID Number', 'Passport Number', 'Blood Group', 'Present Address', 'Permanent Address',
    'Occupation', 'Organization', 'Membership Type', 'Start Date', 'End Date', 'Subscription Amount',
    'Payment Cycle', 'Status', 'Remarks'
  ];

  const rows = members.map(m => [
    m.id || '',
    m.memberCode || m.id || '',
    `"${(m.nameBn || '').replace(/"/g, '""')}"`,
    `"${(m.nameEn || '').replace(/"/g, '""')}"`,
    `"${(m.fatherName || '').replace(/"/g, '""')}"`,
    `"${(m.motherName || '').replace(/"/g, '""')}"`,
    m.gender || 'Male',
    m.dateOfBirth || '',
    m.mobile || '',
    m.altMobile || '',
    m.whatsappNumber || '',
    m.telegramHandle || '',
    `"${(m.facebookProfileUrl || '').replace(/"/g, '""')}"`,
    m.email || '',
    m.nidNumber || '',
    m.passportNumber || '',
    m.bloodGroup || '',
    `"${(m.presentAddress || '').replace(/"/g, '""')}"`,
    `"${(m.permanentAddress || '').replace(/"/g, '""')}"`,
    `"${(m.occupation || '').replace(/"/g, '""')}"`,
    `"${(m.organization || '').replace(/"/g, '""')}"`,
    m.membershipType || 'General Member',
    m.membershipStartDate || '',
    m.membershipEndDate || '',
    m.customSubscription || samity.monthlySubscription || 500,
    m.paymentCycle || 'Monthly',
    m.status || 'Active',
    `"${(m.remarks || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `samity_members_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

// CSV Template Downloader for Bulk Import
export const downloadMembersCsvTemplate = (defaultSamity = {}) => {
  const headers = [
    'Bangla Name', 'English Name', 'Mobile', 'Alt Mobile', 'WhatsApp', 'Father Name', 'Mother Name',
    'Gender', 'Date of Birth', 'NID Number', 'Blood Group', 'Present Address', 'Permanent Address',
    'Occupation', 'Organization', 'Membership Type', 'Subscription Amount', 'Payment Cycle', 'Status', 'Remarks'
  ];

  const sampleRows = [
    [
      '"জনাব মোহাম্মাদ আব্দুর রহিম"', '"Mohammad Abdur Rahim"', '01711000001', '01811000001', '01711000001',
      '"মোস্তাফিজুর রহমান"', '"রাহেলা বেগম"', 'Male', '1990-05-15', '19901234567890123', 'A+',
      '"মিরপুর-১০, ঢাকা"', '"চৌদ্দগ্রাম, কুমিল্লা"', '"ব্যবসায়ী"', '"রহিম ট্রেডার্স"',
      'General Member', defaultSamity.monthlySubscription || '500', 'Monthly', 'Active', '"নিয়মিত সদস্য"'
    ],
    [
      '"বেগম ফাতেমা খাতুন"', '"Fatema Khatun"', '01911000002', '', '01911000002',
      '"আলী হোসেন"', '"আমেনা খাতুন"', 'Female', '1994-08-20', '19941234567890456', 'O+',
      '"উত্তরা সেক্টর ৭, ঢাকা"', '"শিবগঞ্জ, বগুড়া"', '"শিক্ষিকা"', '"উত্তরা মডেল স্কুল"',
      'Executive Member', defaultSamity.monthlySubscription || '500', 'Monthly', 'Active', '"কার্যনির্বাহী সদস্য"'
    ]
  ];

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...sampleRows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'sample_members_bulk_import_template.csv');
  document.body.appendChild(link);
  link.click();
  link.remove();
};

// Robust CSV Line Splitter handling quotes and commas
export const parseCsvLine = (text) => {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cur += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
};

// Parse imported CSV text into standard member objects
export const parseMembersCsv = (csvText, activeSamityId, existingMembers = []) => {
  if (!csvText || !csvText.trim()) {
    return { success: false, error: 'ফাইলটি খালি বা কোনো তথ্য নেই।' };
  }

  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) {
    return { success: false, error: 'কমপক্ষে ১টি হেডার লাইন এবং ১টি সদস্যের সারি থাকতে হবে।' };
  }

  const headers = parseCsvLine(lines[0]).map(h => h.replace(/^["']|["']$/g, '').trim().toLowerCase());
  const parsedMembers = [];
  let nextCount = existingMembers.length + 1;

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (!cols || cols.length === 0 || cols.every(c => !c)) continue;

    const row = {};
    headers.forEach((h, idx) => {
      row[h] = (cols[idx] || '').replace(/^["']|["']$/g, '').trim();
    });

    const nameBn = row['bangla name'] || row['namebn'] || row['নাম (বাংলা)'] || row['name'] || '';
    const nameEn = row['english name'] || row['nameen'] || row['name (english)'] || '';
    const mobile = row['mobile'] || row['mobile number'] || row['phone'] || row['মোবাইল'] || '';

    if (!nameBn && !nameEn && !mobile) continue; // skip entirely empty rows

    const memberId = row['member id'] || row['id'] || `SM-${String(nextCount).padStart(4, '0')}`;
    nextCount++;

    const member = createDefaultMemberObject(activeSamityId, nextCount, {
      id: memberId,
      memberCode: row['member code'] || memberId,
      nameBn: nameBn || nameEn,
      nameEn: nameEn || nameBn,
      fatherName: row['father name'] || row['father'] || '',
      motherName: row['mother name'] || row['mother'] || '',
      gender: row['gender'] || 'Male',
      dateOfBirth: row['date of birth'] || row['dob'] || '',
      mobile: mobile,
      altMobile: row['alt mobile'] || row['alternative mobile'] || '',
      whatsappNumber: row['whatsapp'] || row['whatsapp number'] || mobile,
      telegramHandle: row['telegram'] || '',
      facebookProfileUrl: row['facebook url'] || row['facebook'] || '',
      email: row['email'] || '',
      nidNumber: row['nid number'] || row['nid'] || '',
      passportNumber: row['passport number'] || row['passport'] || '',
      bloodGroup: row['blood group'] || '',
      presentAddress: row['present address'] || row['address'] || '',
      permanentAddress: row['permanent address'] || '',
      occupation: row['occupation'] || '',
      organization: row['organization'] || '',
      membershipType: row['membership type'] || 'General Member',
      membershipStartDate: row['start date'] || new Date().toISOString().split('T')[0],
      membershipEndDate: row['end date'] || '',
      customSubscription: row['subscription amount'] || row['monthly fee'] || '',
      paymentCycle: row['payment cycle'] || 'Monthly',
      status: row['status'] || 'Active',
      remarks: row['remarks'] || 'Bulk imported via CSV'
    });

    parsedMembers.push(member);
  }

  if (parsedMembers.length === 0) {
    return { success: false, error: 'সঠিক ফরম্যাটের কোনো সদস্য রেকর্ড খুঁজে পাওয়া যায়নি।' };
  }

  return { success: true, members: parsedMembers };
};

// Generate System Alerts & Notifications for Module 23
export const getSamityNotifications = (data, activeSamityId) => {
  const notifications = [];
  const samity = data.samities?.find(s => s.id === activeSamityId) || data.samities?.[0] || {};
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
  const currentYear = new Date().getFullYear();

  // 1. Pending Approvals Alert
  const pendingDeposits = (data.deposits || []).filter(d => d.samityId === activeSamityId && d.approvalStatus === 'pending');
  const pendingExpenses = (data.expenses || []).filter(e => e.samityId === activeSamityId && e.approvalStatus === 'pending');
  const totalPending = pendingDeposits.length + pendingExpenses.length;
  if (totalPending > 0) {
    notifications.push({
      id: 'notif_pending',
      type: 'warning',
      title: 'অনুমোদনের জন্য অপেক্ষমাণ লেনদেন',
      message: `${totalPending}টি জমা ও খরচের ভাউচার কোষাধ্যক্ষ/সভাপতির অনুমোদনের অপেক্ষায় রয়েছে।`,
      timestamp: 'এখনই করণীয়'
    });
  }

  // 2. Overdue Dues Alert
  const members = (data.members || []).filter(m => m.samityId === activeSamityId && m.status === 'active');
  let overdueCount = 0;
  members.forEach(m => {
    const status = calculateMemberPaymentStatus(m, samity, data.deposits || [], currentMonth, currentYear);
    if (status.status === 'unpaid' || status.status === 'partially_paid') overdueCount++;
  });

  if (overdueCount > 0) {
    notifications.push({
      id: 'notif_due',
      type: 'info',
      title: `${currentMonth} মাসের বকেয়া তাগাদা`,
      message: `${overdueCount} জন সদস্যের চলতি মাসের চাঁদা এখনো সম্পূর্ণ পরিশোধিত হয়নি। তাগাদা রিমাইন্ডার প্রেরণ করুন।`,
      timestamp: 'চলতি মাস'
    });
  }

  // 3. Fund Health Alert
  const metrics = calculateSamityMetrics(activeSamityId, data);
  if (metrics.availableFund < 5000 && metrics.totalMembers > 5) {
    notifications.push({
      id: 'notif_fund',
      type: 'critical',
      title: 'ফান্ড রিজার্ভ সতর্কতা',
      message: 'সমিতির মোট রিজার্ভ ফান্ড তুলনামূলক কম রয়েছে। জরুরি পরিচালন ব্যয়ের জন্য জমা নিশ্চিত করুন।',
      timestamp: 'জরুরি'
    });
  }

  return notifications;
};

// ============================================================================
// EXPENSE / ব্যয় MANAGEMENT MODULE CONSTANTS & SPECIFICATIONS
// ============================================================================
export const EXPENSE_CATEGORIES = [
  { value: 'Office Rent', labelBn: 'অফিস ভাড়া (Office Rent)' },
  { value: 'Electricity Bill', labelBn: 'বিদ্যুৎ ও ইউটিলিটি বিল (Electricity Bill)' },
  { value: 'Event Cost', labelBn: 'অনুষ্ঠান বা বার্ষিক সভা খরচ (Event Cost)' },
  { value: 'Charity', labelBn: 'দান ও জনকল্যাণ (Charity)' },
  { value: 'Relief', labelBn: 'ত্রাণ বিতরণ ও সাহায্য (Relief)' },
  { value: 'Meeting Cost', labelBn: 'মিটিং ও আপ্যায়ন খরচ (Meeting Cost)' },
  { value: 'Stationery', labelBn: 'কাগজপত্র ও স্টেশনারি (Stationery)' },
  { value: 'Travel', labelBn: 'যাতায়াত ও ভ্রমণ ব্যয় (Travel)' },
  { value: 'Bank Charge', labelBn: 'ব্যাংক চার্জ ও ফি (Bank Charge)' },
  { value: 'Other', labelBn: 'অন্যান্য পরিচালনা ব্যয় (Other)' }
];

export const EXPENSE_PAYMENT_METHODS = ['Cash', 'Bank', 'bKash', 'Nagad', 'Rocket', 'Cheque'];

export const EXPENSE_APPROVAL_STATUSES = [
  { value: 'approved', labelBn: 'অনুমোদিত (Approved)', color: '#10b981' },
  { value: 'pending', labelBn: 'অপেক্ষমাণ (Pending)', color: '#f59e0b' },
  { value: 'rejected', labelBn: 'প্রত্যাখ্যাত (Rejected)', color: '#ef4444' }
];

export const EXPENSE_SUB_REPORTS = [
  { id: 'daily', titleBn: '১. দৈনিক খরচ রিপোর্ট (Daily Expense Report)', titleEn: 'Daily Expenses' },
  { id: 'monthly', titleBn: '২. মাসিক খরচ রিপোর্ট (Monthly Expense Report)', titleEn: 'Monthly Expenses' },
  { id: 'yearly', titleBn: '৩. বার্ষিক খরচ রিপোর্ট (Yearly Expense Report)', titleEn: 'Yearly Expenses' },
  { id: 'category', titleBn: '৪. খাতওয়ারি খরচ রিপোর্ট (Category-wise Expense Report)', titleEn: 'Category-wise' },
  { id: 'event', titleBn: '৫. সদস্য/ইভেন্টভিত্তিক খরচ রিপোর্ট (Member/Event-wise Expense Report)', titleEn: 'Event-wise' },
  { id: 'bank', titleBn: '৬. ব্যাংকভিত্তিক খরচ রিপোর্ট (Bank-wise Expense Report)', titleEn: 'Bank-wise' },
  { id: 'cash', titleBn: '৭. নগদ ক্যাশ খরচ রিপোর্ট (Cash-wise Expense Report)', titleEn: 'Cash-wise' },
  { id: 'status', titleBn: '৮. অনুমোদিত ও অপেক্ষমাণ রিপোর্ট (Approved & Pending Expense Report)', titleEn: 'Status-wise' }
];

// ============================================================================
// ALL 28 OFFICIAL SAMITY REPORTS SPECIFICATIONS
// ============================================================================
export const ALL_28_REPORTS_LIST = [
  { id: 'member_list', no: 1, titleBn: 'সাধারণ সদস্য তালিকা রিপোর্ট', titleEn: 'Member List Report', category: 'members', desc: 'সকল নিবন্ধিত সদস্যের পূর্ণ বিবরণ, কোড ও যোগাযোগের তথ্য' },
  { id: 'active_members', no: 2, titleBn: 'সক্রিয় সদস্য রিপোর্ট', titleEn: 'Active Member Report', category: 'members', desc: 'নিয়মিত চাঁদা প্রদানকারী সক্রিয় সদস্যদের তালিকা ও রেট' },
  { id: 'inactive_members', no: 3, titleBn: 'নিষ্ক্রিয় সদস্য রিপোর্ট', titleEn: 'Inactive Member Report', category: 'members', desc: 'স্থগিত, নিষ্ক্রিয় বা বকেয়া সদস্যদের তালিকা' },
  { id: 'paid_members', no: 4, titleBn: 'সম্পূর্ণ পরিশোধিত সদস্য রিপোর্ট', titleEn: 'Paid Member Report', category: 'collections', desc: 'চলতি মাসে কোনো বকেয়া নেই এমন শতভাগ পরিশোধিত সদস্য' },
  { id: 'unpaid_members', no: 5, titleBn: 'অপরিশোধিত সদস্য রিপোর্ট', titleEn: 'Unpaid Member Report', category: 'collections', desc: 'চলতি মাসে এখনো চাঁদা জমা দেননি এমন সদস্যের তালিকা' },
  { id: 'partially_paid_members', no: 6, titleBn: 'আংশিক পরিশোধিত সদস্য রিপোর্ট', titleEn: 'Partially Paid Member Report', category: 'collections', desc: 'চাঁদা আংশিক পরিশোধ করেছেন কিন্তু কিছু বকেয়া রয়েছে' },
  { id: 'member_wise_deposit', no: 7, titleBn: 'সদস্যভিত্তিক জমা লেজার রিপোর্ট', titleEn: 'Member-wise Deposit Report', category: 'deposits', desc: 'প্রত্যেক সদস্যের সর্বমোট জমাকৃত অর্থ ও ভাউচার বিবরণ' },
  { id: 'member_wise_due', no: 8, titleBn: 'সদস্যভিত্তিক মোট বকেয়া রিপোর্ট', titleEn: 'Member-wise Due Report', category: 'collections', desc: 'প্রত্যেক সদস্যের মোট প্রদেয়, জমাকৃত ও অবশিষ্ট বকেয়া' },
  { id: 'month_wise_collection', no: 9, titleBn: 'মাসিক চাঁদা আদায় রিপোর্ট', titleEn: 'Month-wise Collection Report', category: 'collections', desc: '১২ মাসের মাসওয়ারি চাঁদা আদায়ের তুলনামূলক চিত্র' },
  { id: 'year_wise_collection', no: 10, titleBn: 'বার্ষিক চাঁদা আদায় রিপোর্ট', titleEn: 'Year-wise Collection Report', category: 'collections', desc: 'বছরভিত্তিক সর্বমোট আদায় ও প্রবৃদ্ধির চিত্র' },
  { id: 'daily_collection', no: 11, titleBn: 'দৈনিক চাঁদা আদায় রিপোর্ট', titleEn: 'Daily Collection Report', category: 'collections', desc: 'নির্দিষ্ট তারিখ অনুযায়ী দৈনিক জমাকৃত রসিদের তালিকা' },
  { id: 'bank_wise_deposit', no: 12, titleBn: 'ব্যাংকভিত্তিক জমা রিপোর্ট', titleEn: 'Bank-wise Deposit Report', category: 'deposits', desc: 'ব্যাংক হিসাবওয়ারি সর্বমোট জমার স্টেটমেন্ট' },
  { id: 'bank_receipt_wise', no: 13, titleBn: 'ব্যাংক রসিদওয়ারি রিপোর্ট', titleEn: 'Bank Receipt-wise Report', category: 'deposits', desc: 'ব্যাংক স্ক্রোল / ডিপোজিট স্লিপ ও ট্রানজ্যাকশন আইডি রিপোর্ট' },
  { id: 'payment_method_wise', no: 14, titleBn: 'পেমেন্ট মাধ্যমভিত্তিক জমা রিপোর্ট', titleEn: 'Payment Method-wise Report', category: 'deposits', desc: 'ক্যাশ, ব্যাংক, বিকাশ, নগদ ও রকেটের আলাদা হিসাব' },
  { id: 'bulk_deposit', no: 15, titleBn: 'বাল্ক ব্যাংক ডিপোজিট রিপোর্ট', titleEn: 'Bulk Deposit Report', category: 'deposits', desc: 'একক স্লিপে একাধিক সদস্যের ব্যাংক জমা ভাউচার তালিকা' },
  { id: 'expense_report', no: 16, titleBn: 'সমিতির সর্বমোট খরচ রিপোর্ট', titleEn: 'Expense Report', category: 'finance', desc: 'সমিতির ফান্ড থেকে ব্যয়িত সকল ভাউচার ও খাতের হিসাব' },
  { id: 'fund_balance_report', no: 17, titleBn: 'তহবিল ব্যালেন্স ও স্থিতি রিপোর্ট', titleEn: 'Fund Balance Report', category: 'finance', desc: 'মোট জমা, মোট খরচ ও নিট ব্যাংক, ক্যাশ এবং মোবাইল স্থিতি' },
  { id: 'bank_reconciliation', no: 18, titleBn: 'ব্যাংক রিকনসিলেশন রিপোর্ট', titleEn: 'Bank Reconciliation Report', category: 'finance', desc: 'সফটওয়্যার রেকর্ড বনাম ব্যাংক স্টেটমেন্ট মিলকরণ বিবরণ' },
  { id: 'reminder_report', no: 19, titleBn: 'সর্বমোট তাগাদা ও রিমাইন্ডার রিপোর্ট', titleEn: 'Reminder Report', category: 'reminders', desc: 'সকল মাধ্যমে প্রেরিত তাগাদা বার্তার পূর্ণ ইতিহাস' },
  { id: 'whatsapp_reminder', no: 20, titleBn: 'হোয়াটসঅ্যাপ তাগাদা রিপোর্ট', titleEn: 'WhatsApp Reminder Report', category: 'reminders', desc: 'হোয়াটসঅ্যাপ (ক্লিক-টু-সেন্ড ও ক্লাউড এপিআই) মেসেজ রিপোর্ট' },
  { id: 'sms_reminder', no: 21, titleBn: 'এসএমএস তাগাদা রিপোর্ট', titleEn: 'SMS Reminder Report', category: 'reminders', desc: 'এসএমএস গেটওয়ের মাধ্যমে প্রেরিত বার্তার ডেলিভারি ও খরচ' },
  { id: 'telegram_reminder', no: 22, titleBn: 'টেলিগ্রাম তাগাদা রিপোর্ট', titleEn: 'Telegram Reminder Report', category: 'reminders', desc: 'টেলিগ্রাম বট ও গ্রুপে পাঠানো তাগাদার স্টেটমেন্ট' },
  { id: 'facebook_reminder', no: 23, titleBn: 'ফেসবুক ও মেসেঞ্জার তাগাদা রিপোর্ট', titleEn: 'Facebook Reminder Report', category: 'reminders', desc: 'মেসেঞ্জার ইনবক্সে পাঠানো তাগাদার ট্র্যাকিং লগ' },
  { id: 'reminder_effectiveness', no: 24, titleBn: 'তাগাদার কার্যকারিতা ও কনভার্শন রিপোর্ট', titleEn: 'Reminder Effectiveness Report', category: 'reminders', desc: 'তাগাদা পাঠানোর পর চাঁদা পরিশোধের হার ও কার্যকারিতা' },
  { id: 'audit_trail', no: 25, titleBn: 'অডিট ট্রেইল ও সিকিউরিটি লগ রিপোর্ট', titleEn: 'Audit Trail Report', category: 'audit', desc: 'ব্যবহারকারীর সকল এন্ট্রি, এডিট, ডিলিট ও পরিবর্তনের অকাট্য লগ' },
  { id: 'annual_financial', no: 26, titleBn: 'বার্ষিক পূর্ণাঙ্গ আর্থিক বিবরণী', titleEn: 'Annual Financial Report', category: 'finance', desc: 'সমগ্র অর্থবছরের আয়-ব্যয়, উদ্বৃত্ত/ঘাটতি ও নিট ব্যালেন্স শিট' },
  { id: 'samity_wise', no: 27, titleBn: 'সমিতিওয়ারি সারসংক্ষেপ রিপোর্ট', titleEn: 'Samity-wise Report', category: 'finance', desc: 'একাধিক সমিতির মধ্যে সদস্য সংখ্যা, ফান্ড ও পারফরম্যান্স তুলনা' },
  { id: 'custom_date_range', no: 28, titleBn: 'কাস্টম তারিখ রেঞ্জ সমন্বিত রিপোর্ট', titleEn: 'Custom Date Range Report', category: 'finance', desc: 'ব্যবহারকারীর নির্ধারিত যেকোনো দুটি তারিখের মধ্যবর্তী সামগ্রিক খতিয়ান' }
];

// Helper to auto-reconcile bank statement rows against software deposits
export const reconcileBankStatement = (deposits = [], statementRows = []) => {
  const depositBankRecords = deposits.filter(d => (d.paymentMethod === 'Bank' || d.bankReceiptNo) && d.approvalStatus !== 'rejected');

  const matched = [];
  const unmatchedStatement = [];
  const pendingDeposits = [];

  const matchedDepositIds = new Set();

  statementRows.forEach(stRow => {
    const stAmount = Number(stRow.credit || stRow.amount || 0);
    const stDate = stRow.date || '';
    const stRef = String(stRow.reference || stRow.chequeNo || '').toLowerCase().trim();

    // Find match in software deposits
    const match = depositBankRecords.find(d => {
      if (matchedDepositIds.has(d.id)) return false;
      const dAmount = Number(d.amount || 0);
      const isAmountMatch = Math.abs(dAmount - stAmount) < 0.01;
      const isDateMatch = d.depositDate === stDate;
      const isRefMatch = stRef && (
        String(d.bankReceiptNo || '').toLowerCase().includes(stRef) ||
        String(d.transactionId || '').toLowerCase().includes(stRef) ||
        String(d.voucherNo || '').toLowerCase().includes(stRef)
      );

      return isAmountMatch && (isRefMatch || isDateMatch);
    });

    if (match) {
      matchedDepositIds.add(match.id);
      matched.push({
        statementRow: stRow,
        depositRecord: match,
        status: 'matched',
        matchType: 'Exact Match'
      });
    } else {
      unmatchedStatement.push({
        statementRow: stRow,
        status: 'unmatched',
        reason: 'সফটওয়্যারে এই পরিমাণের কোনো ব্যাংক জমা এন্ট্রি পাওয়া যায়নি'
      });
    }
  });

  // Deposits in software not matched to statement
  depositBankRecords.forEach(d => {
    if (!matchedDepositIds.has(d.id)) {
      pendingDeposits.push({
        depositRecord: d,
        status: 'pending',
        reason: 'ব্যাংক স্টেটমেন্টে এখনো ক্রেডিট এন্ট্রি হিসেবে আসেনি (In-transit)'
      });
    }
  });

  const totalStatementCredit = statementRows.reduce((sum, r) => sum + Number(r.credit || r.amount || 0), 0);
  const totalSoftwareBankDeposit = depositBankRecords.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const discrepancy = totalSoftwareBankDeposit - totalStatementCredit;

  return {
    matched,
    unmatchedStatement,
    pendingDeposits,
    summary: {
      totalStatementCredit,
      totalSoftwareBankDeposit,
      discrepancy,
      matchedCount: matched.length,
      unmatchedCount: unmatchedStatement.length,
      pendingCount: pendingDeposits.length
    }
  };
};

// ============================================================================
// COMPREHENSIVE DATASET GENERATOR FOR ALL 28 REPORTS
// ============================================================================
export const generateReportDataset = (reportId, data, filters = {}) => {
  const {
    samityId,
    fromDate,
    toDate,
    memberId = 'all',
    bank = 'all',
    paymentMethod = 'all',
    status = 'all',
    searchQuery = '',
    sortBy = 'date',
    sortOrder = 'desc'
  } = filters;

  const currentSamity = data.samities.find(s => s.id === samityId) || data.samities[0] || {};
  const members = data.members.filter(m => m.samityId === samityId);
  const deposits = data.deposits.filter(d => d.samityId === samityId);
  const expenses = (data.expenses || []).filter(e => e.samityId === samityId);
  const reminders = (data.reminders || []).filter(r => r.samityId === samityId);
  const auditLogs = (data.auditLogs || []).filter(a => !a.samityId || a.samityId === samityId);

  // Helper date filter
  const isDateInRange = (dateStr) => {
    if (!dateStr) return true;
    if (fromDate && dateStr < fromDate) return false;
    if (toDate && dateStr > toDate) return false;
    return true;
  };

  const meta = ALL_28_REPORTS_LIST.find(r => r.id === reportId) || ALL_28_REPORTS_LIST[0];
  let columns = [];
  let rows = [];
  let summary = { totalCount: 0, totalAmount: 0 };

  switch (reportId) {
    case 'member_list':
    case 'active_members':
    case 'inactive_members': {
      columns = [
        { key: 'memberCode', label: 'সদস্য কোড', align: 'left' },
        { key: 'nameBn', label: 'সদস্যের নাম', align: 'left' },
        { key: 'mobile', label: 'মোবাইল নম্বর', align: 'left' },
        { key: 'whatsappNumber', label: 'হোয়াটসঅ্যাপ', align: 'left' },
        { key: 'membershipType', label: 'সদস্যতার ধরণ', align: 'center' },
        { key: 'monthlyRate', label: 'চাঁদার হার (৳)', align: 'right' },
        { key: 'status', label: 'স্ট্যাটাস', align: 'center' },
        { key: 'joinDate', label: 'যোগদানের তারিখ', align: 'center' }
      ];

      let list = members.filter(m => {
        if (reportId === 'active_members' && m.status !== 'Active') return false;
        if (reportId === 'inactive_members' && m.status === 'Active') return false;
        if (status !== 'all' && m.status !== status) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (m.nameBn?.toLowerCase().includes(q) || m.nameEn?.toLowerCase().includes(q) || m.memberCode?.toLowerCase().includes(q) || m.mobile?.includes(q));
        }
        return true;
      });

      rows = list.map(m => ({
        memberCode: m.memberCode || m.id,
        nameBn: m.nameBn || m.nameEn,
        mobile: m.mobile || '—',
        whatsappNumber: m.whatsappNumber || m.mobile || '—',
        membershipType: m.membershipType || 'General Member',
        monthlyRate: (m.customSubscription || currentSamity.monthlySubscription || 500).toLocaleString(),
        status: m.status || 'Active',
        joinDate: m.membershipStartDate || '—'
      }));
      summary.totalCount = rows.length;
      break;
    }

    case 'paid_members':
    case 'unpaid_members':
    case 'partially_paid_members':
    case 'member_wise_due': {
      columns = [
        { key: 'memberCode', label: 'সদস্য কোড', align: 'left' },
        { key: 'nameBn', label: 'সদস্যের নাম', align: 'left' },
        { key: 'mobile', label: 'মোবাইল', align: 'left' },
        { key: 'expected', label: 'প্রদেয় চাঁদা (৳)', align: 'right' },
        { key: 'paid', label: 'পরিশোধিত (৳)', align: 'right' },
        { key: 'due', label: 'বকেয়া (৳)', align: 'right' },
        { key: 'status', label: 'অবস্থা', align: 'center' }
      ];

      const now = new Date();
      const currentMonth = now.toLocaleString('en-US', { month: 'long' });
      const currentYear = now.getFullYear();

      rows = members.map(m => {
        const rate = Number(m.customSubscription || currentSamity.monthlySubscription || 500);
        const memberDeposits = deposits.filter(d => d.memberId === m.id && d.approvalStatus !== 'rejected');
        const totalPaid = memberDeposits.reduce((sum, d) => sum + Number(d.amount || 0), 0);
        const currentMonthPaid = memberDeposits.filter(d => d.paymentMonth === currentMonth && Number(d.paymentYear) === currentYear).reduce((sum, d) => sum + Number(d.amount || 0), 0);
        const netDue = Math.max(0, rate - currentMonthPaid);

        let st = 'পরিশোধিত';
        if (currentMonthPaid === 0) st = 'অপরিশোধিত';
        else if (currentMonthPaid < rate) st = 'আংশিক পরিশোধিত';

        return {
          memberCode: m.memberCode || m.id,
          nameBn: m.nameBn || m.nameEn,
          mobile: m.mobile,
          expected: rate,
          paid: currentMonthPaid,
          due: netDue,
          status: st
        };
      }).filter(r => {
        if (reportId === 'paid_members' && r.due > 0) return false;
        if (reportId === 'unpaid_members' && r.paid > 0) return false;
        if (reportId === 'partially_paid_members' && (r.paid === 0 || r.due === 0)) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return r.nameBn?.toLowerCase().includes(q) || r.memberCode?.toLowerCase().includes(q) || r.mobile?.includes(q);
        }
        return true;
      });

      summary.totalCount = rows.length;
      summary.totalAmount = rows.reduce((s, r) => s + r.due, 0);
      break;
    }

    case 'member_wise_deposit':
    case 'daily_collection':
    case 'bank_wise_deposit':
    case 'bank_receipt_wise':
    case 'payment_method_wise':
    case 'bulk_deposit':
    case 'custom_date_range': {
      columns = [
        { key: 'voucherNo', label: 'ভাউচার / রসিদ নং', align: 'left' },
        { key: 'date', label: 'তারিখ', align: 'center' },
        { key: 'member', label: 'সদস্যের নাম', align: 'left' },
        { key: 'method', label: 'পেমেন্ট মাধ্যম', align: 'center' },
        { key: 'bankRef', label: 'ব্যাংক / রসিদ রেফারেন্স', align: 'left' },
        { key: 'amount', label: 'পরিমাণ (৳)', align: 'right' },
        { key: 'approvalStatus', label: 'অনুমোদন', align: 'center' }
      ];

      let list = deposits.filter(d => {
        if (!isDateInRange(d.depositDate)) return false;
        if (memberId !== 'all' && d.memberId !== memberId) return false;
        if (paymentMethod !== 'all' && d.paymentMethod !== paymentMethod) return false;
        if (status !== 'all' && d.approvalStatus !== status) return false;
        if (bank !== 'all' && d.bankName !== bank) return false;
        if (reportId === 'bank_wise_deposit' && d.paymentMethod !== 'Bank') return false;
        if (reportId === 'bank_receipt_wise' && !d.bankReceiptNo) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (d.voucherNo?.toLowerCase().includes(q) || d.memberName?.toLowerCase().includes(q) || d.bankReceiptNo?.toLowerCase().includes(q));
        }
        return true;
      });

      rows = list.map(d => ({
        voucherNo: d.voucherNo || d.id,
        date: d.depositDate,
        member: d.memberName || d.memberId,
        method: d.paymentMethod,
        bankRef: d.paymentMethod === 'Bank' ? `${d.bankName || 'ব্যাংক'} (স্লিপ: ${d.bankReceiptNo || '—'})` : d.transactionId || 'নগদ',
        amount: Number(d.amount || 0),
        approvalStatus: d.approvalStatus || 'approved'
      }));

      summary.totalCount = rows.length;
      summary.totalAmount = rows.reduce((s, r) => s + r.amount, 0);
      break;
    }

    case 'month_wise_collection': {
      columns = [
        { key: 'month', label: 'মাস', align: 'left' },
        { key: 'year', label: 'বছর', align: 'center' },
        { key: 'depositsCount', label: 'মোট জমার সংখ্যা', align: 'center' },
        { key: 'totalCollected', label: 'সর্বমোট আদায় (৳)', align: 'right' }
      ];

      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const targetYear = new Date().getFullYear();

      rows = months.map(m => {
        const monthDeposits = deposits.filter(d => d.paymentMonth === m && Number(d.paymentYear) === targetYear && d.approvalStatus !== 'rejected');
        const sum = monthDeposits.reduce((acc, d) => acc + Number(d.amount || 0), 0);
        return {
          month: m,
          year: targetYear,
          depositsCount: monthDeposits.length,
          totalCollected: sum
        };
      });

      summary.totalCount = rows.length;
      summary.totalAmount = rows.reduce((s, r) => s + r.totalCollected, 0);
      break;
    }

    case 'year_wise_collection': {
      columns = [
        { key: 'year', label: 'অর্থবছর', align: 'center' },
        { key: 'depositsCount', label: 'মোট জমা সংখ্যা', align: 'center' },
        { key: 'totalCollected', label: 'সর্বমোট আদায় (৳)', align: 'right' }
      ];

      const currentY = new Date().getFullYear();
      const years = [currentY - 2, currentY - 1, currentY, currentY + 1];

      rows = years.map(y => {
        const yDeposits = deposits.filter(d => Number(d.paymentYear) === y && d.approvalStatus !== 'rejected');
        const sum = yDeposits.reduce((acc, d) => acc + Number(d.amount || 0), 0);
        return {
          year: y,
          depositsCount: yDeposits.length,
          totalCollected: sum
        };
      });

      summary.totalCount = rows.length;
      summary.totalAmount = rows.reduce((s, r) => s + r.totalCollected, 0);
      break;
    }

    case 'expense_report': {
      columns = [
        { key: 'voucherNo', label: 'ভাউচার নং', align: 'left' },
        { key: 'expenseDate', label: 'তারিখ', align: 'center' },
        { key: 'title', label: 'খরচের বিবরণ ও শিরোনাম', align: 'left' },
        { key: 'category', label: 'খাত', align: 'left' },
        { key: 'paymentMethod', label: 'পেমেন্ট মাধ্যম', align: 'center' },
        { key: 'paidTo', label: 'গ্রহীতা (Paid To)', align: 'left' },
        { key: 'amount', label: 'পরিমাণ (৳)', align: 'right' },
        { key: 'approvalStatus', label: 'অনুমোদন', align: 'center' }
      ];

      let list = expenses.filter(e => {
        if (!isDateInRange(e.expenseDate)) return false;
        if (paymentMethod !== 'all' && e.paymentMethod !== paymentMethod) return false;
        if (status !== 'all' && e.approvalStatus !== status) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (e.title?.toLowerCase().includes(q) || e.voucherNo?.toLowerCase().includes(q) || e.category?.toLowerCase().includes(q));
        }
        return true;
      });

      rows = list.map(e => ({
        voucherNo: e.voucherNo || e.id,
        expenseDate: e.expenseDate,
        title: e.title,
        category: e.category,
        paymentMethod: e.paymentMethod || 'Cash',
        paidTo: e.paidTo || '—',
        amount: Number(e.amount || 0),
        approvalStatus: e.approvalStatus || 'approved'
      }));

      summary.totalCount = rows.length;
      summary.totalAmount = rows.reduce((s, r) => s + r.amount, 0);
      break;
    }

    case 'fund_balance_report':
    case 'annual_financial': {
      columns = [
        { key: 'head', label: 'হিসাব খাত ও বিবরণ', align: 'left' },
        { key: 'bankAmt', label: 'ব্যাংক হিসাব (৳)', align: 'right' },
        { key: 'cashAmt', label: 'নগদ ক্যাশ (৳)', align: 'right' },
        { key: 'mobileAmt', label: 'মোবাইল ব্যাংকিং (৳)', align: 'right' },
        { key: 'totalAmt', label: 'মোট পরিমাণ (৳)', align: 'right' }
      ];

      const approvedDeposits = deposits.filter(d => d.approvalStatus !== 'rejected');
      const approvedExpenses = expenses.filter(e => e.approvalStatus !== 'rejected');

      const bankDep = approvedDeposits.filter(d => d.paymentMethod === 'Bank').reduce((s, d) => s + Number(d.amount || 0), 0);
      const cashDep = approvedDeposits.filter(d => d.paymentMethod === 'Cash').reduce((s, d) => s + Number(d.amount || 0), 0);
      const mobDep = approvedDeposits.filter(d => ['bKash', 'Nagad', 'Rocket', 'Upay'].includes(d.paymentMethod)).reduce((s, d) => s + Number(d.amount || 0), 0);
      const totalDep = bankDep + cashDep + mobDep;

      const bankExp = approvedExpenses.filter(e => e.paymentMethod === 'Bank').reduce((s, e) => s + Number(e.amount || 0), 0);
      const cashExp = approvedExpenses.filter(e => e.paymentMethod === 'Cash').reduce((s, e) => s + Number(e.amount || 0), 0);
      const mobExp = approvedExpenses.filter(e => ['bKash', 'Nagad', 'Rocket', 'Upay'].includes(e.paymentMethod)).reduce((s, e) => s + Number(e.amount || 0), 0);
      const totalExp = bankExp + cashExp + mobExp;

      const availBank = bankDep - bankExp;
      const availCash = cashDep - cashExp;
      const availMob = mobDep - mobExp;
      const netFund = totalDep - totalExp;

      rows = [
        { head: '১. সর্বমোট অনুমোদিত চাঁদা ও জমা (Income)', bankAmt: bankDep, cashAmt: cashDep, mobileAmt: mobDep, totalAmt: totalDep },
        { head: '২. সর্বমোট অনুমোদিত ব্যয় ও খরচ (Expenditure)', bankAmt: bankExp, cashAmt: cashExp, mobileAmt: mobExp, totalAmt: totalExp },
        { head: '৩. বিদ্যমান কার্যকরী উদ্বৃত্ত / নিট ফান্ড (Available Balance)', bankAmt: availBank, cashAmt: availCash, mobileAmt: availMob, totalAmt: netFund }
      ];

      summary.totalCount = 3;
      summary.totalAmount = netFund;
      break;
    }

    case 'bank_reconciliation': {
      columns = [
        { key: 'type', label: 'বিবরণ', align: 'left' },
        { key: 'reference', label: 'রেফারেন্স / ভাউচার', align: 'left' },
        { key: 'date', label: 'তারিখ', align: 'center' },
        { key: 'status', label: 'মিলকরণ স্ট্যাটাস', align: 'center' },
        { key: 'amount', label: 'টাকার পরিমাণ (৳)', align: 'right' }
      ];

      const recon = reconcileBankStatement(deposits, data.bankStatements || []);
      rows = [
        ...recon.matched.map(m => ({
          type: 'সফটওয়্যার ও ব্যাংক উভয় স্থানে মিলেছে',
          reference: `ভাউচার: ${m.depositRecord.voucherNo} | ব্যাংক স্লিপ: ${m.depositRecord.bankReceiptNo || '—'}`,
          date: m.depositRecord.depositDate,
          status: 'Matched (মিলেছে)',
          amount: Number(m.depositRecord.amount)
        })),
        ...recon.pendingDeposits.map(p => ({
          type: 'সফটওয়্যারে জমা এন্ট্রি আছে কিন্তু স্টেটমেন্টে নেই',
          reference: `ভাউচার: ${p.depositRecord.voucherNo}`,
          date: p.depositRecord.depositDate,
          status: 'Pending (অপেক্ষমাণ)',
          amount: Number(p.depositRecord.amount)
        })),
        ...recon.unmatchedStatement.map(u => ({
          type: 'ব্যাংক স্টেটমেন্টে ক্রেডিট আছে কিন্তু সফটওয়্যারে নেই',
          reference: u.statementRow.reference || 'অজ্ঞাত জমা',
          date: u.statementRow.date || '—',
          status: 'Unmatched (অমিল)',
          amount: Number(u.statementRow.credit || u.statementRow.amount)
        }))
      ];

      summary.totalCount = rows.length;
      summary.totalAmount = recon.summary.totalSoftwareBankDeposit;
      break;
    }

    case 'reminder_report':
    case 'whatsapp_reminder':
    case 'sms_reminder':
    case 'telegram_reminder':
    case 'facebook_reminder':
    case 'reminder_effectiveness': {
      columns = [
        { key: 'id', label: 'লগ আইডি', align: 'left' },
        { key: 'date', label: 'তারিখ ও সময়', align: 'center' },
        { key: 'member', label: 'সদস্যের নাম', align: 'left' },
        { key: 'channel', label: 'মাধ্যম', align: 'center' },
        { key: 'deliveryStatus', label: 'ডেলিভারি স্ট্যাটাস', align: 'center' },
        { key: 'paymentAfter', label: 'চাঁদা পরিশোধের অবস্থা', align: 'center' }
      ];

      let list = reminders.filter(r => {
        if (!isDateInRange(r.reminderDate)) return false;
        if (reportId === 'whatsapp_reminder' && r.channel !== 'WHATSAPP') return false;
        if (reportId === 'sms_reminder' && r.channel !== 'SMS') return false;
        if (reportId === 'telegram_reminder' && r.channel !== 'TELEGRAM') return false;
        if (reportId === 'facebook_reminder' && !['MESSENGER', 'FACEBOOK'].includes(r.channel)) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return r.memberName?.toLowerCase().includes(q) || r.channel?.toLowerCase().includes(q);
        }
        return true;
      });

      rows = list.map(r => ({
        id: r.id,
        date: `${r.reminderDate} ${r.reminderTime || ''}`,
        member: r.memberName || r.memberId,
        channel: r.channel,
        deliveryStatus: r.deliveryStatus || 'Sent',
        paymentAfter: r.paymentStatusAfter || 'বকেয়া রয়েছে'
      }));

      summary.totalCount = rows.length;
      break;
    }

    case 'audit_trail': {
      columns = [
        { key: 'timestamp', label: 'সময়', align: 'center' },
        { key: 'action', label: 'অ্যাকশন', align: 'center' },
        { key: 'module', label: 'মডিউল', align: 'center' },
        { key: 'recordId', label: 'রেকর্ড রেফারেন্স', align: 'left' },
        { key: 'performedBy', label: 'ব্যবহারকারী', align: 'center' }
      ];

      rows = auditLogs.map(a => ({
        timestamp: a.timestamp ? new Date(a.timestamp).toLocaleString('bn-BD') : '—',
        action: a.action || 'MODIFY',
        module: a.module || 'SYSTEM',
        recordId: a.recordId || '—',
        performedBy: a.performedBy || 'Admin'
      }));

      summary.totalCount = rows.length;
      break;
    }

    case 'samity_wise': {
      columns = [
        { key: 'samityName', label: 'সমিতির নাম', align: 'left' },
        { key: 'regNo', label: 'নিবন্ধন নং', align: 'center' },
        { key: 'membersCount', label: 'সদস্য সংখ্যা', align: 'center' },
        { key: 'totalDeposits', label: 'মোট জমা (৳)', align: 'right' },
        { key: 'totalExpenses', label: 'মোট খরচ (৳)', align: 'right' },
        { key: 'availableFund', label: 'মোট ফান্ড (৳)', align: 'right' }
      ];

      rows = data.samities.map(s => {
        const sM = data.members.filter(m => m.samityId === s.id).length;
        const sD = data.deposits.filter(d => d.samityId === s.id && d.approvalStatus !== 'rejected').reduce((acc, d) => acc + Number(d.amount || 0), 0);
        const sE = (data.expenses || []).filter(e => e.samityId === s.id && e.approvalStatus !== 'rejected').reduce((acc, e) => acc + Number(e.amount || 0), 0);
        return {
          samityName: s.nameBn || s.nameEn,
          regNo: s.regNo || '—',
          membersCount: sM,
          totalDeposits: sD,
          totalExpenses: sE,
          availableFund: sD - sE
        };
      });

      summary.totalCount = rows.length;
      summary.totalAmount = rows.reduce((s, r) => s + r.availableFund, 0);
      break;
    }

    default: {
      columns = [
        { key: 'col1', label: 'বিবরণ', align: 'left' },
        { key: 'col2', label: 'তারিখ', align: 'center' },
        { key: 'col3', label: 'পরিমাণ (৳)', align: 'right' }
      ];
      rows = [];
      summary.totalCount = 0;
      break;
    }
  }

  return {
    meta,
    columns,
    rows,
    summary,
    samity: currentSamity
  };
};

// Helper for CSV string conversion & download
export const exportReportToCsv = (reportTitle, columns, rows) => {
  const headers = columns.map(c => `"${c.label}"`).join(',');
  const rowStrings = rows.map(r => columns.map(c => `"${String(r[c.key] ?? '').replace(/"/g, '""')}"`).join(','));
  const csvContent = '\uFEFF' + [headers, ...rowStrings].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${reportTitle.replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Helper for Excel Export using SheetJS
export const exportReportToExcel = (XLSX, reportTitle, columns, rows) => {
  if (!XLSX) return;
  const sheetData = rows.map(r => {
    const obj = {};
    columns.forEach(c => {
      obj[c.label] = r[c.key];
    });
    return obj;
  });

  const ws = XLSX.utils.json_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, `${reportTitle.replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

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
