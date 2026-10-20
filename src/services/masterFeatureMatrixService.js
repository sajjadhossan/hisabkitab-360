// ============================================================================
// Master Feature Matrix & Tenant Customization Engine for HisabKitab 360
// Centralizes all app modules, 100+ template mapping, presets & dynamic toggles
// ============================================================================

export const MASTER_FEATURE_CATEGORIES = [
  {
    id: 'pos_sales',
    name: 'পয়েন্ট অব সেল (POS) ও বিলিং',
    enName: 'Point of Sale & Billing',
    icon: 'Store',
    color: '#10b981',
    description: 'ক্যাশ কাউন্টার সেল, দ্রুত বিলিং ও চালান প্রিন্ট'
  },
  {
    id: 'inventory_supply',
    name: 'পণ্য, স্টক ও সাপ্লাই চেইন',
    enName: 'Inventory & Supply Chain',
    icon: 'Boxes',
    color: '#3b82f6',
    description: 'মালামাল ট্র্যাকিং, ব্যাচ, এক্সপায়ারি ও সাপ্লায়ার ক্রয়'
  },
  {
    id: 'accounts_finance',
    name: 'হিসাব, বাকি ও ব্যাংকিং',
    enName: 'Accounts, Due & Banking',
    icon: 'HandCoins',
    color: '#f59e0b',
    description: 'বাকির খাতা, মহাজন দেনা, খরচ, লাভ-ক্ষতি ও ব্যাংক'
  },
  {
    id: 'field_operations',
    name: 'সেলসম্যান ও ডেলিভারি অপারেশন',
    enName: 'Field Sales & Delivery Ops',
    icon: 'Truck',
    color: '#06b6d4',
    description: 'ফিল্ড সেলসম্যান অর্ডার বুকিং, রাইডার ও সাপ্লাই ট্র্যাকিং'
  },
  {
    id: 'hr_payroll',
    name: 'এইচআর, স্টাফ ও পে-রোল',
    enName: 'HR, Staff & Payroll',
    icon: 'Users',
    color: '#8b5cf6',
    description: 'কর্মচারী উপস্থিতি, বেতন শিট ও অ্যাডভান্স'
  },
  {
    id: 'hospitality_special',
    name: 'রেস্টুরেন্ট, কিচেন ও বিশেষায়িত',
    enName: 'Hospitality & Specialized',
    icon: 'UtensilsCrossed',
    color: '#ec4899',
    description: 'KOT কিচেন ডিসপ্লে, টেবিল বুকিং ও বিশেষ অর্ডার'
  },
  {
    id: 'enterprise_automation',
    name: 'এন্টারপ্রাইজ, মাল্টি-ব্রাঞ্চ ও ক্লাউড',
    enName: 'Enterprise, Branch & Cloud',
    icon: 'Building2',
    color: '#6366f1',
    description: 'মাল্টি-ব্রাঞ্চ, স্টক ট্রান্সফার, ক্লাউড ব্যাকআপ ও অডিট ট্রেইল'
  }
];

export const MASTER_FEATURE_REGISTRY = [
  // --- 1. POS & BILLING ---
  {
    id: 'pos',
    categoryId: 'pos_sales',
    name: 'POS ক্যাশ কাউন্টার টার্মিনাল',
    enName: 'POS Cash Register Terminal',
    description: 'কাউন্টারে দ্রুত ক্যাশ ও বাকি বিলিং সম্পন্ন করার মূল ইন্টারফেস',
    badge: 'কোর সেলস',
    navKeys: ['pos', 'pos_touch', 'pos_scanner'],
    defaultOn: true
  },
  {
    id: 'pos_barcode',
    categoryId: 'pos_sales',
    name: 'বারকোড স্ক্যানার ও লেবেল প্রিন্টার',
    enName: 'Barcode Scanner & Label Printing',
    description: 'ক্যামেরা/লেজার বারকোড স্ক্যান এবং পণ্যের স্টিকার প্রিন্ট',
    badge: 'বারকোড',
    navKeys: ['barcode_tools'],
    defaultOn: true
  },
  {
    id: 'pos_hold_cart',
    categoryId: 'pos_sales',
    name: 'হোল্ড কার্ট ও ড্রাফট বিলিং',
    enName: 'Hold Cart & Multiple Drafts',
    description: 'এক কাস্টমারকে থামিয়ে অন্য কাস্টমারের বিল কাটার সুবিধা',
    badge: 'POS স্পিড',
    navKeys: [],
    defaultOn: true
  },
  {
    id: 'pos_cash_drawer',
    categoryId: 'pos_sales',
    name: 'ক্যাশ ড্রয়ার ও ডে-এন্ড ক্লোজিং',
    enName: 'Cash Drawer & Day Closing',
    description: 'দিনের শুরুতে ক্যাশ ইনপুট, সারাদিনের ক্যাশ গণনা ও ড্রয়ার মিলানো',
    badge: 'ক্যাশ অডিট',
    navKeys: ['tool_cash'],
    defaultOn: true
  },
  {
    id: 'invoices',
    categoryId: 'pos_sales',
    name: 'ইনভয়েস ও রসিদ হিস্ট্রি',
    enName: 'Invoice & Receipts History',
    description: 'পূর্ববর্তী সকল বিক্রয় রসিদ দেখা, রিটার্ন ও প্রিন্ট করার সুবিধা',
    badge: 'চালান',
    navKeys: ['invoices'],
    defaultOn: true
  },
  {
    id: 'quotations',
    categoryId: 'pos_sales',
    name: 'কোটেশন ও প্রাক-বিলিং',
    enName: 'Quotations & Estimates',
    description: 'আনুষ্ঠানিক কোটেশন প্রস্তুত ও সরাসরি ইনভয়েসে রূপান্তর',
    badge: 'কোটেশন',
    navKeys: ['quotations'],
    defaultOn: false
  },

  // --- 2. INVENTORY & SUPPLY ---
  {
    id: 'inventory',
    categoryId: 'inventory_supply',
    name: 'পণ্য ক্যাটালগ ও স্টক ব্যবস্থাপনা',
    enName: 'Inventory & Stock Management',
    description: 'পণ্য যুক্ত করা, ক্রয় মূল্য, বিক্রয় মূল্য ও লাইভ স্টক সংখ্যা দেখা',
    badge: 'মৌলিক স্টক',
    navKeys: ['inventory'],
    defaultOn: true
  },
  {
    id: 'stock_batches',
    categoryId: 'inventory_supply',
    name: 'ব্যাচ ও মেয়াদ/এক্সপায়ারি ট্র্যাকিং',
    enName: 'Batch Numbers & Expiry Tracking',
    description: 'ফার্মেসি ও মুদির জন্য পণ্যের ব্যাচ এবং মেয়াদোত্তীর্ণ এলার্ট',
    badge: 'মেয়াদ ট্র্যাকিং',
    navKeys: [],
    defaultOn: true
  },
  {
    id: 'stock_variants',
    categoryId: 'inventory_supply',
    name: 'কালার, সাইজ ও ভ্যারিয়েন্ট স্টক',
    enName: 'Color, Size & Variant Matrix',
    description: 'পোশাক, জুতা ও হার্ডওয়্যারের জন্য বিভিন্ন সাইজ/কালার সংরক্ষণ',
    badge: 'ভ্যারিয়েন্ট',
    navKeys: [],
    defaultOn: true
  },
  {
    id: 'imei_serials',
    categoryId: 'inventory_supply',
    name: 'মোবাইল IMEI ও সিরিয়াল নম্বর',
    enName: 'IMEI & Device Serial Tracking',
    description: 'মোবাইল ও ইলেকট্রনিক্স পণ্যের জন্য ইউনিক সিরিয়াল বা IMEI ট্র্যাকিং',
    badge: 'IMEI/সিরিয়াল',
    navKeys: [],
    defaultOn: false
  },
  {
    id: 'purchase_suppliers',
    categoryId: 'inventory_supply',
    name: 'সাপ্লায়ার ও পাইকারি ক্রয় খাতা',
    enName: 'Suppliers & Wholesale Purchases',
    description: 'সাপ্লায়ারদের তালিকা ও নিয়মিত মালামাল ক্রয়ের হিসাব সংরক্ষণ',
    badge: 'সাপ্লায়ার',
    navKeys: ['suppliers', 'purchase_entry'],
    defaultOn: true
  },

  // --- 3. ACCOUNTS & FINANCE ---
  {
    id: 'debts',
    categoryId: 'accounts_finance',
    name: 'কাস্টমার বাকির খাতা ও তাগাদা',
    enName: 'Customer Due Ledger & Reminder',
    description: 'গ্রাহকের দেনা-পাওনা, এসএমএস তাগাদা ও বাকির স্টেটমেন্ট',
    badge: 'বাকির খাতা',
    navKeys: ['debts'],
    defaultOn: true
  },
  {
    id: 'supplier_due',
    categoryId: 'accounts_finance',
    name: 'মহাজন/সাপ্লায়ার দেনার খাতা',
    enName: 'Supplier Payables Ledger',
    description: 'কাদের কাছে প্রতিষ্ঠান ঋণী আছে তা ট্র্যাকিং ও পরিশোধ রসিদ',
    badge: 'মহাজন দেনা',
    navKeys: ['debts_supplier'],
    defaultOn: true
  },
  {
    id: 'daily_expense',
    categoryId: 'accounts_finance',
    name: 'দৈনিক দোকান খরচ ও বিল ভাউচার',
    enName: 'Daily Store Expenses & Vouchers',
    description: 'দোকান ভাড়া, চা-নাস্তা, পরিবহন খরচ ও অন্যান্য খরচের হিসাব',
    badge: 'দৈনিক খরচ',
    navKeys: ['expenses'],
    defaultOn: true
  },
  {
    id: 'bank_accounts',
    categoryId: 'accounts_finance',
    name: 'ব্যাংক ও মোবাইল ব্যাংকিং খাতা',
    enName: 'Bank & Mobile Wallet Ledger',
    description: 'বিকাশ, নগদ, রকেট ও ব্যাংক একাউন্টে জমা-খরচ স্টেটমেন্ট',
    badge: 'ব্যাংকিং',
    navKeys: ['bank_accounts'],
    defaultOn: true
  },
  {
    id: 'profit_loss',
    categoryId: 'accounts_finance',
    name: 'প্রকৃত লাভ-ক্ষতি ও ব্যালেন্স শিট',
    enName: 'Net Profit-Loss & Balance Sheet',
    description: 'বিক্রয় লাভ, মোট খরচ বাদ দিয়ে আসল নিট প্রফিট অ্যানালাইসিস',
    badge: 'লাভ-ক্ষতি',
    navKeys: ['profit_loss', 'reports'],
    defaultOn: true
  },
  {
    id: 'tax_vat',
    categoryId: 'accounts_finance',
    name: 'এনবিআর ভ্যাট ও ট্যাক্স কমপ্লায়েন্স',
    enName: 'NBR VAT & Tax Compliance',
    description: 'মুশক চালান প্রস্তুত ও সরকারি ভ্যাট রিপোর্ট জেনারেটর',
    badge: 'ভ্যাট/ট্যাক্স',
    navKeys: ['vat_reports'],
    defaultOn: false
  },

  // --- 4. FIELD SALES & DELIVERY ---
  {
    id: 'sr',
    categoryId: 'field_operations',
    name: 'সেলসম্যান (SR) ফিল্ড অর্ডার বুকিং',
    enName: 'Field Salesman (SR) Order Booking',
    description: 'দোকানে দোকানে গিয়ে সেলসম্যানদের মোবাইলে অর্ডার বুকিং নেওয়া',
    badge: 'SR সেলসম্যান',
    navKeys: ['salesman_order', 'sr'],
    defaultOn: false
  },
  {
    id: 'sr_delivery',
    categoryId: 'field_operations',
    name: 'ডেলিভারি ম্যান ও রাইডার সাপ্লাই',
    enName: 'Delivery Fleet & Rider Supply',
    description: 'অর্ডার মাল পৌঁছানো, চালান ডেলিভারি ও রুট ম্যাপ ট্র্যাকিং',
    badge: 'ডেলিভারি',
    navKeys: ['sr_delivery', 'delivery'],
    defaultOn: false
  },
  {
    id: 'cod_management',
    categoryId: 'field_operations',
    name: 'ক্যাশ অন ডেলিভারি (COD) কালেকশন',
    enName: 'Cash on Delivery (COD) Reconciliation',
    description: 'ডেলিভারি ম্যানের কাছ থেকে নগদ টাকা গ্রহণ ও ক্যাশ ড্রয়ারে জমা',
    badge: 'COD কালেকশন',
    navKeys: [],
    defaultOn: false
  },

  // --- 5. HR & TEAM ---
  {
    id: 'hr',
    categoryId: 'hr_payroll',
    name: 'কর্মচারী তালিকা ও এইচআর প্রোফাইল',
    enName: 'Staff Directory & HR Profiles',
    description: 'কর্মচারীদের এনআইডি, ছবি, পদবি ও কন্টাক্ট সংরক্ষণ',
    badge: 'টিম এইচআর',
    navKeys: ['hr'],
    defaultOn: false
  },
  {
    id: 'hr_attendance',
    categoryId: 'hr_payroll',
    name: 'উপস্থিতি ও শিফট ট্র্যাকিং',
    enName: 'Attendance & Shift Tracking',
    description: 'স্টাফদের দৈনিক আগমন-প্রস্থান ও ওভারটাইম হিসাব',
    badge: 'উপস্থিতি',
    navKeys: [],
    defaultOn: false
  },
  {
    id: 'hr_salary_payroll',
    categoryId: 'hr_payroll',
    name: 'বেতন শিট ও মাসিক পে-রোল',
    enName: 'Salary Sheet & Monthly Payroll',
    description: 'মাসিক বেতন তৈরি, বোনাস, কর্তন ও পে-স্লিপ প্রিন্টিং',
    badge: 'পে-রোল',
    navKeys: [],
    defaultOn: false
  },

  // --- 6. HOSPITALITY & SPECIALIZED ---
  {
    id: 'kot_kitchen',
    categoryId: 'hospitality_special',
    name: 'রেস্টুরেন্ট KOT ও কিচেন ডিসপ্লে',
    enName: 'Kitchen Order Ticket (KOT)',
    description: 'অর্ডার নেওয়া মাত্রই কিচেন প্রিন্টার বা স্ক্রিনে সরাসরি যাওয়া',
    badge: 'রেস্টুরেন্ট KOT',
    navKeys: ['kot_screen'],
    defaultOn: false
  },
  {
    id: 'table_management',
    categoryId: 'hospitality_special',
    name: 'রেস্টুরেন্ট টেবিল ও ওয়েটার ট্র্যাকিং',
    enName: 'Table Booking & Waiter Tracking',
    description: 'টেবিল নম্বর অনুযায়ী খাবার পরিবেশন ও বিল স্প্লিট সুবিধা',
    badge: 'টেবিল বুকিং',
    navKeys: ['table_mgmt'],
    defaultOn: false
  },
  {
    id: 'tailor_measurements',
    categoryId: 'hospitality_special',
    name: 'টেইলারিং মাপ ও অর্ডার ট্র্যাকিং',
    enName: 'Tailoring Measurements & Delivery',
    description: 'শার্ট, প্যান্ট, বোরকা বা স্যুটের বিশদ মাপ ও ডেলিভারি ট্র্যাকিং',
    badge: 'টেইলারিং',
    navKeys: [],
    defaultOn: false
  },

  // --- 7. ENTERPRISE & AUTOMATION ---
  {
    id: 'branch_control',
    categoryId: 'enterprise_automation',
    name: 'মাল্টি-ব্রাঞ্চ ও ওয়্যারহাউজ সেন্ট্রাল',
    enName: 'Multi-Branch & Warehouse Hub',
    description: 'একাধিক দোকান বা গুদামের হিসাব এক অ্যাডমিন প্যানেল থেকে দেখা',
    badge: 'মাল্টি-ব্রাঞ্চ',
    navKeys: ['branch_control', 'branches'],
    defaultOn: false
  },
  {
    id: 'crm',
    categoryId: 'enterprise_automation',
    name: 'গ্রাহক সিআরএম (CRM) ও লয়্যালটি পয়েন্ট',
    enName: 'Customer CRM & Loyalty Points',
    description: 'নিয়মিত গ্রাহকদের কেনাকাটায় পয়েন্ট ও বিশেষ ডিসকাউন্ট প্রদান',
    badge: 'লয়্যালটি CRM',
    navKeys: ['crm'],
    defaultOn: false
  },
  {
    id: 'google_drive_sync',
    categoryId: 'enterprise_automation',
    name: 'গুগল ড্রাইভ ও ক্লাউড অটো ব্যাকআপ',
    enName: 'Google Drive & Cloud Auto Backup',
    description: 'প্রতিদিনের লেনদেনের সম্পূর্ণ ব্যাকআপ সরাসরি ক্লাউডে সংরক্ষণ',
    badge: 'ক্লাউড ব্যাকআপ',
    navKeys: ['backup_drive'],
    defaultOn: true
  },
  {
    id: 'master_hub',
    categoryId: 'enterprise_automation',
    name: 'মাস্টার সেটআপ ও এন্টারপ্রাইজ হাব',
    enName: 'Master Setup Hub & Tools',
    description: 'সিস্টেমের ডিপ সেটিংস, ডেটা এক্সপোর্ট ও ডায়াগনস্টিকস টুলস',
    badge: 'মাস্টার হাব',
    navKeys: ['master_hub'],
    defaultOn: true
  },
  {
    id: 'erp',
    categoryId: 'enterprise_automation',
    name: 'উন্নত ইআরপি (ERP) ও উৎপাদন হিসাব',
    enName: 'Manufacturing ERP & Costing',
    description: 'কাঁচামাল থেকে ফিনিশড গুডস তৈরি ও উৎপাদন খরচ হিসাব',
    badge: 'ইআরপি',
    navKeys: ['erp'],
    defaultOn: false
  }
];

// Fast package presets for Super Admin
export const SUPERADMIN_PACKAGE_PRESETS = [
  {
    id: 'preset_basic_retail',
    name: 'মুদি ও সাধারণ দোকান (Basic Store)',
    icon: 'Store',
    color: '#10b981',
    description: 'কাউন্টার সেল, পণ্য স্টক, বাকির খাতা ও দৈনিক খরচ',
    enabledIds: ['pos', 'pos_barcode', 'pos_hold_cart', 'pos_cash_drawer', 'invoices', 'inventory', 'stock_batches', 'purchase_suppliers', 'debts', 'supplier_due', 'daily_expense', 'bank_accounts', 'profit_loss', 'google_drive_sync']
  },
  {
    id: 'preset_restaurant_cafe',
    name: 'রেস্টুরেন্ট, ফাস্টফুড ও ক্যাফে (Food Pro)',
    icon: 'UtensilsCrossed',
    color: '#f59e0b',
    description: 'KOT কিচেন, টেবিল ট্র্যাকিং, দ্রুত বিলিং, খরচ ও স্টক',
    enabledIds: ['pos', 'pos_hold_cart', 'pos_cash_drawer', 'invoices', 'inventory', 'purchase_suppliers', 'daily_expense', 'bank_accounts', 'profit_loss', 'kot_kitchen', 'table_management', 'google_drive_sync']
  },
  {
    id: 'preset_distribution_salesman',
    name: 'পাইকারি, ডিলার ও সেলসম্যান (Wholesale SR)',
    icon: 'Truck',
    color: '#06b6d4',
    description: 'সেলসম্যান অর্ডার বুকিং, ডেলিভারি রাইডার, বড় বাকি খাতা ও ওয়্যারহাউজ',
    enabledIds: ['pos', 'pos_barcode', 'invoices', 'inventory', 'stock_batches', 'purchase_suppliers', 'debts', 'supplier_due', 'daily_expense', 'bank_accounts', 'profit_loss', 'sr', 'sr_delivery', 'cod_management', 'google_drive_sync']
  },
  {
    id: 'preset_fashion_electronics',
    name: 'পোশাক, জুতা ও ইলেকট্রনিক্স (Fashion & Tech)',
    icon: 'Smartphone',
    color: '#8b5cf6',
    description: 'সাইজ/কালার ভ্যারিয়েন্ট, মোবাইল IMEI, বারকোড স্টিকার প্রিন্ট ও সিআরএম',
    enabledIds: ['pos', 'pos_barcode', 'pos_hold_cart', 'pos_cash_drawer', 'invoices', 'inventory', 'stock_variants', 'imei_serials', 'purchase_suppliers', 'debts', 'daily_expense', 'bank_accounts', 'profit_loss', 'crm', 'google_drive_sync']
  },
  {
    id: 'preset_enterprise_all',
    name: 'অল-ইন-ওয়ান এন্টারপ্রাইজ (Full Suite ERP)',
    icon: 'Crown',
    color: '#6366f1',
    description: 'অ্যাপ্লিকেশনের প্রতিটি ফিচার ও এন্টারপ্রাইজ মডিউল সম্পূর্ণ চালু',
    enabledIds: MASTER_FEATURE_REGISTRY.map(f => f.id)
  }
];

// Helper to resolve feature defaults for any of the 100+ industry templates
export const resolveFeaturesForIndustryTemplate = (templateId = '') => {
  const baseMap = {};
  // Start with defaultOn
  MASTER_FEATURE_REGISTRY.forEach(f => {
    baseMap[f.id] = !!f.defaultOn;
  });

  const tid = (templateId || '').toLowerCase();

  // If Restaurant / Food
  if (tid.includes('food') || tid.includes('restaurant') || tid.includes('cafe') || tid.includes('fastfood') || tid.includes('bakery')) {
    baseMap.kot_kitchen = true;
    baseMap.table_management = true;
    baseMap.imei_serials = false;
    baseMap.stock_variants = false;
  }
  // If Fashion / Clothing / Footwear
  else if (tid.includes('fashion') || tid.includes('cloth') || tid.includes('tailor') || tid.includes('shoe')) {
    baseMap.stock_variants = true;
    baseMap.pos_barcode = true;
    baseMap.kot_kitchen = false;
    baseMap.table_management = false;
    if (tid.includes('tailor')) {
      baseMap.tailor_measurements = true;
    }
  }
  // If Electronics / Mobile
  else if (tid.includes('electronics') || tid.includes('mobile') || tid.includes('gadget') || tid.includes('computer')) {
    baseMap.imei_serials = true;
    baseMap.pos_barcode = true;
    baseMap.stock_variants = true;
    baseMap.kot_kitchen = false;
  }
  // If Wholesale / Distribution
  else if (tid.includes('wholesale') || tid.includes('distribut') || tid.includes('dealer')) {
    baseMap.sr = true;
    baseMap.sr_delivery = true;
    baseMap.cod_management = true;
    baseMap.quotations = true;
  }
  // If Pharmacy / Healthcare
  else if (tid.includes('pharmacy') || tid.includes('medicine') || tid.includes('drug') || tid.includes('clinic')) {
    baseMap.stock_batches = true;
    baseMap.pos_barcode = true;
    baseMap.kot_kitchen = false;
  }

  return baseMap;
};

// Normalize or retrieve tenant's enabled modules
export const getTenantActiveModules = (tenantLicense) => {
  if (!tenantLicense) return resolveFeaturesForIndustryTemplate();

  const stored = tenantLicense.modules || {};
  // If tenant already has a detailed modules map, merge with defaults to avoid missing keys
  const merged = {};
  MASTER_FEATURE_REGISTRY.forEach(feat => {
    if (typeof stored[feat.id] === 'boolean') {
      merged[feat.id] = stored[feat.id];
    } else {
      merged[feat.id] = feat.defaultOn ?? true;
    }
  });

  return merged;
};

// Check if a specific module is allowed for a tenant
export const isTenantModuleAllowed = (moduleId, tenantLicense) => {
  if (!moduleId) return true;
  const activeMods = getTenantActiveModules(tenantLicense);
  return activeMods[moduleId] !== false;
};

// ============================================================================
// TENANT TEMPLATE ENTITLEMENT HELPERS (100+ Templates Access Control)
// ============================================================================

export const TEMPLATE_QUICK_PRESETS = [
  {
    id: 'preset_all_templates',
    name: '👑 ১০০+ টেমপ্লেটই উন্মুক্ত (All Unlocked)',
    badge: 'ফুল ক্যাটালগ',
    color: '#6366f1',
    description: 'অ্যাপ্লিকেশনের সকল ইন্ডাস্ট্রির ১০০+ টেমপ্লেট সম্পূর্ণ এক্সেসযোগ্য'
  },
  {
    id: 'preset_grocery_retail',
    name: '🛒 মুদি, সুপারশপ ও কাঁচাবাজার',
    badge: 'রিটেইল প্যাক',
    color: '#10b981',
    description: 'মুদি দোকান, ডিপার্টমেন্টাল স্টোর, জেনারেল স্টোর ও মিনিমার্ট'
  },
  {
    id: 'preset_food_hospitality',
    name: '🍽️ রেস্টুরেন্ট, ক্যাফে ও ফাস্টফুড',
    badge: 'ফুড প্যাক',
    color: '#f59e0b',
    description: 'ডাইন-ইন রেস্টুরেন্ট, পিৎজা/বার্গার শপ, ক্যাফে, বেকারি ও জুস বার'
  },
  {
    id: 'preset_pharmacy_health',
    name: '💊 ফার্মেসি, ল্যাব ও স্বাস্থ্যসেবা',
    badge: 'মেডিকেল প্যাক',
    color: '#ef4444',
    description: 'ফার্মেসি ও ড্রাগ স্টোর, অপটিক্যাল চশমার দোকান ও ডেন্টাল ক্লিনিক'
  },
  {
    id: 'preset_fashion_lifestyle',
    name: '👔 ফ্যাশন, পোশাক, জুতা ও টেইলার্স',
    badge: 'ফ্যাশন প্যাক',
    color: '#8b5cf6',
    description: 'রেডিমেড পোশাক, জেন্টস ও লেডিস টেইলার্স, জুতার শোরুম'
  },
  {
    id: 'preset_electronics_mobile',
    name: '📱 মোবাইল, গ্যাজেট ও ইলেকট্রনিক্স',
    badge: 'টেক প্যাক',
    color: '#3b82f6',
    description: 'স্মার্টফোন শপ, কম্পিউটার/ল্যাপটপ, হোম অ্যাপ্লায়েন্স ও সার্ভিস'
  }
];

// Returns array of allowed template IDs for a tenant.
// If tenant.allowedTemplates is not defined, by default return null (meaning open or fallback to industryTemplateId)
export const getTenantAllowedTemplates = (tenantLicense) => {
  if (!tenantLicense) return null;
  if (Array.isArray(tenantLicense.allowedTemplates)) {
    return tenantLicense.allowedTemplates;
  }
  // If only specific single template is assigned
  if (tenantLicense.industryTemplateId) {
    return [tenantLicense.industryTemplateId];
  }
  return null;
};

// Check if a specific template is allowed for a tenant
export const isTenantTemplateAllowed = (templateId, tenantLicense, isSuperAdmin = false) => {
  if (isSuperAdmin) return true;
  if (!templateId) return true;
  const allowed = getTenantAllowedTemplates(tenantLicense);
  // If null or empty array, default is unlocked for backwards compatibility
  if (!allowed || allowed.length === 0) return true;
  return allowed.includes(templateId);
};

