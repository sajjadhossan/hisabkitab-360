import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { initialData } from '../data/initialData';
import { translations } from '../data/translations';
import {
  connectGoogleDrive,
  disconnectGoogleDrive,
  isGoogleDriveConnected,
  getGoogleDriveUser,
  uploadBackupToGoogleDrive,
  listDriveBackups,
  MAX_DRIVE_BACKUP_RETENTION,
  getGoogleClientId,
  saveGoogleClientId,
  switchGoogleDriveAccount
} from '../services/googleDriveService';
import { kickCashDrawer } from '../services/printService';
import {
  MASTER_INDUSTRY_TEMPLATES,
  INDUSTRY_SECTORS,
  getTemplateById
} from '../data/industryTemplates';
import { scheduleStorageWrite, flushPendingStorageWrites } from '../utils/storageQueue';

const AppContext = createContext();

const STORAGE_KEYS = {
  PROFILE: 'hk360_active_profile',
  LANG: 'hk360_active_lang',
  THEME: 'hk360_active_theme',
  PERSONAL_EXPENSES: 'hk360_personal_expenses',
  PERSONAL_INCOMES: 'hk360_personal_incomes',
  PERSONAL_SAVINGS: 'hk360_personal_savings',
  BIZ_PRODUCTS: 'hk360_biz_products',
  BIZ_SALES: 'hk360_biz_sales',
  BIZ_CUSTOMERS: 'hk360_biz_customers',
  BIZ_EMPLOYEES: 'hk360_biz_employees',
  BIZ_SUPPLIERS: 'hk360_biz_suppliers',
  BIZ_EXPENSES: 'hk360_biz_expenses',
  BIZ_SETTINGS: 'hk360_biz_settings',
  BIZ_INVOICES: 'hk360_biz_invoices',
  BIZ_QUOTATIONS: 'hk360_biz_quotations',
  BIZ_DAMAGED_GOODS: 'hk360_biz_damaged_goods',
  PERSONAL_DEBTS: 'hk360_personal_debts',
  PERSONAL_EVENTS: 'hk360_personal_events',
  BIZ_DEBTS: 'hk360_biz_debts',
  APP_CATEGORIES: 'hk360_app_categories',
  SNAPSHOTS: 'hk360_snapshots',
  LICENSE_INFO: 'hk360_license_info',
  BRANCHES: 'hk360_biz_branches',
  ACTIVE_BRANCH_ID: 'hk360_active_branch_id',
  ACTIVE_COUNTER_ID: 'hk360_active_counter_id',
  COUNTER_CLOSINGS: 'hk360_counter_closings',
  CASH_MOVEMENTS: 'hk360_cash_movements',
  BAZAAR_SHOPPING_LIST: 'hk360_bazaar_shopping_list',
  BIZ_REORDER_LIST: 'hk360_biz_reorder_list',
  OPERATING_MODE: 'hk360_operating_mode',
};

export const DEFAULT_BRANCHES = [
  {
    id: 'br-main',
    name: 'প্রধান শাখা (Main Branch)',
    code: 'BR-01',
    address: 'মিরপুর ১০, ঢাকা',
    phone: '০১৭০০-০০০০০০',
    isMain: true,
    counters: [
      { id: 'cnt-1', name: 'কাউন্টার ০১ (ক্যাশ ও কার্ড)', code: 'POS-01', openingFloat: 1000 },
      { id: 'cnt-2', name: 'কাউন্টার ০২ (এক্সপ্রেস ক্যাশ)', code: 'POS-02', openingFloat: 1000 }
    ]
  },
  {
    id: 'br-dhanmondi',
    name: 'ধানমন্ডি শাখা (Dhanmondi Branch)',
    code: 'BR-02',
    address: 'ধানমন্ডি ২৭, ঢাকা',
    phone: '০১৮০০-০০০০০০',
    isMain: false,
    counters: [
      { id: 'cnt-3', name: 'কাউন্টার ০১ (কাউন্টার সেল)', code: 'POS-01', openingFloat: 1000 }
    ]
  }
];

export const DEFAULT_MODULES = {
  pos: true,
  inventory: true,
  debts: true,
  invoices: true,
  quotations: true,
  erp: true,
  crm: true,
  hr: true,
  sr: true,
  branch_control: true,
  google_drive_sync: true
};

export const MODULE_PRESETS = {
  basic: {
    name: 'বেসিক রিটেইল প্যাক (Basic Retail)',
    planName: 'Basic Retail POS',
    modules: {
      pos: true,
      inventory: true,
      debts: true,
      invoices: true,
      quotations: false,
      erp: false,
      crm: false,
      hr: false,
      sr: false,
      branch_control: false,
      google_drive_sync: false
    }
  },
  standard: {
    name: 'স্ট্যান্ডার্ড শপ প্যাক (Standard Shop)',
    planName: 'Standard Commercial Suite',
    modules: {
      pos: true,
      inventory: true,
      debts: true,
      invoices: true,
      quotations: true,
      erp: true,
      crm: true,
      hr: false,
      sr: false,
      branch_control: false,
      google_drive_sync: true
    }
  },
  enterprise: {
    name: 'এন্টারপ্রাইজ ইআরপি প্যাক (Enterprise Full)',
    planName: 'Enterprise Lifetime Suite',
    modules: {
      pos: true,
      inventory: true,
      debts: true,
      invoices: true,
      quotations: true,
      erp: true,
      crm: true,
      hr: true,
      sr: true,
      branch_control: true,
      google_drive_sync: true
    }
  }
};

export const DEFAULT_APP_CATEGORIES = {
  // Debt Khata: Personal Relations / Types
  debtPersonalRelations: [
    'বন্ধু',
    'আত্মীয়',
    'সহকর্মী',
    'প্রতিবেশী',
    'পরিবার',
    'ব্যক্তিগত পরিচিত',
    'অন্যান্য'
  ],
  // Debt Khata: Business Relations / Types
  debtBusinessRelations: [
    'ব্যবসায়ী পার্টনার',
    'মহাজন',
    'কাস্টমার',
    'সাপ্লায়ার',
    'কর্মচারী/স্টাফ',
    'সাব-কন্ট্রাক্টর',
    'অন্যান্য'
  ],
  // Products (Inventory / POS)
  productCategories: [
    'খাদ্যপণ্য',
    'তেল ও ঘি',
    'পানীয়',
    'দুগ্ধজাত',
    'মশলা ও নিত্যপণ্য',
    'কসমেটিকস ও কেয়ার',
    'হাইজিন',
    'স্টেশনারি',
    'সাধারণ পণ্য'
  ],
  // Business Expenses
  businessExpenseCategories: [
    'দোকান ভাড়া',
    'বিদ্যুৎ ও ইউটিলিটি বিল',
    'কর্মচারী আপ্যায়ন ও খাবার',
    'পণ্য পরিবহন ও ডেলিভারি',
    'প্যাকেজিং ও ব্যাগ',
    'মেরামত ও রক্ষণাবেক্ষণ',
    'বিজ্ঞাপন ও প্রচারণা',
    'অন্যান্য খরচ'
  ],
  // Personal Expenses
  personalExpenseCategories: [
    'কাঁচাবাজার',
    'যাতায়াত ও ভাড়া',
    'বাসা ভাড়া',
    'ইউটিলিটি ও বিল',
    'সন্তানের শিক্ষা ও কোচিং',
    'চিকিৎসা ও ওষুধ',
    'ইন্টারনেট ও মোবাইল',
    'স্ন্যাক্স ও আপ্যায়ন',
    'বিনোদন ও ভ্রমণ',
    'অন্যান্য'
  ],
  // Personal Incomes
  personalIncomeCategories: [
    'মাসিক বেতন',
    'অনলাইন ফ্রিল্যান্সিং',
    'ব্যবসার লভ্যাংশ',
    'বাসা/দোকান ভাড়া',
    'বিনিয়োগ ও মুনাফা',
    'উপহার',
    'অন্যান্য'
  ],
  // Family Expense Folders
  familyExpenseFolders: [
    'বাসা ও ফ্ল্যাট খরচ',
    'বিদ্যুৎ, গ্যাস ও ইউটিলিটি',
    'সন্তানের পড়াশোনা ও স্কুল',
    'পারিবারিক চিকিৎসা ও ওষুধ',
    'ইন্টারনেট ও মোবাইল রিচার্জ',
    'গৃহস্থালি ও নিত্য কেনাকাটা',
    'অন্যান্য পারিবারিক খরচ'
  ],
  // Expense & Market Measurement Units
  expenseUnits: [
    'গ্রাম (g)',
    'কেজি (kg)',
    'লিটার (L)',
    'মিলি (ml)',
    'ফুট (ft)',
    'ইঞ্চি (in)',
    'টিপ / ট্রিপ (Trip)',
    'অটো ভাড়া',
    'পিস (Pcs)',
    'প্যাকেট (Pkt)',
    'ডজন (Dzn)',
    'বস্তা',
    'কার্টন'
  ],
  // Product & Inventory Measurement Units
  productUnits: [
    'কেজি (kg)',
    'গ্রাম (gm)',
    'লিটার (L)',
    'মিলি (ml)',
    'পিস (pcs)',
    'প্যাকেট (pkt)',
    'ডজন (doz)',
    'বস্তা (sack)',
    'কার্টন (ctn)',
    'গজ (yd)',
    'মিটার (m)',
    'বক্স (box)',
    'প্লেট (plate)',
    'কাপ (cup)',
    'স্ট্রিপ / পাতা (strip)'
  ],
  // Product Brands & Manufacturers
  productBrands: [
    'রূপচাঁদা (Rupchanda)',
    'তীর (Teer)',
    'ফ্রেশ (Fresh)',
    'বসুন্ধরা (Bashundhara)',
    'প্রাণ (PRAN)',
    'স্কয়ার (Square)',
    'এসিআই (ACI)',
    'নেসলে (Nestle)',
    'ইউনিলিভার (Unilever)',
    'ইস্পাহানি (Ispahani)',
    'রাধুনী (Radhuni)',
    'আকিজ (Akij)',
    'সাধারণ / নন-ব্র্যান্ড'
  ],
  // Restaurant Tables & Zones
  restaurantTables: [
    'টেবিল ০১ (Table 01)',
    'টেবিল ০২ (Table 02)',
    'টেবিল ০৩ (Table 03)',
    'টেবিল ০৪ (Table 04)',
    'টেবিল ০৫ (Table 05)',
    'টেবিল ০৬ (Table 06)',
    'ভিআইপি কেবিন (VIP Cabin)',
    'পার্সেল কাউন্টার (Parcel)'
  ],
  // Family Members (কার জন্য খরচ / কে খরচ করেছে)
  familyMembers: [
    'নিজে (Self)',
    'স্ত্রী (Wife)',
    'ছেলে (Son)',
    'মেয়ে (Daughter)',
    'বাবা (Father)',
    'মা (Mother)',
    'ছোট ভাই / বোন',
    'পুরো পরিবার (সবার জন্য)'
  ],
  // Expense Purposes & Tags (উদ্দেশ্য বা ইভেন্ট)
  expensePurposes: [
    'স্কুলে যাতায়াত ও পড়াশোনা',
    'অফিসে যাতায়াত ও কাজ',
    'কোচিং ও প্রাইভেট টিউশন',
    'নিত্যদিনের বাজার সদাই',
    'ডাক্তার দেখানো ও চিকিৎসা',
    'পারিবারিক অনুষ্ঠান ও দাওয়াত',
    'ঈদ ও উৎসবের কেনাকাটা',
    'ভ্রমণ ও ট্যুর',
    'জরুরি প্রয়োজন',
    'সাধারণ খরচ'
  ],
  // Common Sub-categories per category
  expenseSubCategories: [
    // যাতায়াত
    'বাস ভাড়া',
    'রিকশা ভাড়া',
    'অটো / সিএনজি ভাড়া',
    'উবার / পাঠাও রাইড',
    'মেট্রোরেল ভাড়া',
    'মোটরসাইকেল তেল / অকটেন',
    'ট্রেন / লঞ্চ ভাড়া',
    // শিক্ষা
    'স্কুলের মাসিক বেতন',
    'কোচিং ফি',
    'প্রাইভেট টিউটর বেতন',
    'বই ও খাতা কেনা',
    'স্কুল ড্রেস / জুতো',
    'টিফিন খরচ',
    // বাজার
    'কাঁচা শাকসবজি',
    'তাজা মাছ',
    'মুরগি / গরুর মাংস',
    'চাল ও আটা',
    'ডাল ও সয়াবিন তেল',
    'ডিম ও দুধ',
    'ফলমূল',
    // চিকিৎসা
    'ডাক্তারের ভিজিট ফি',
    'প্রেসক্রিপশনের ওষুধ',
    'প্যাথলজি ও টেস্ট ফি',
    'হাসপাতাল চার্জ',
    // ইউটিলিটি
    'বিদ্যুৎ বিল (ডেসকো/ডিপিডিসি)',
    'গ্যাস বিল',
    'পানির বিল (ওয়াসা)',
    'ইন্টারনেট / ওয়াইফাই বিল',
    'মোবাইল রিচার্জ',
    'বাসার ময়লা বিল',
    // স্ন্যাক্স
    'চা ও বিস্কুট',
    'বাইরে খাওয়া / রেস্টুরেন্ট',
    'মিষ্টি ও বেকারিজাতীয়',
    'মেহমান আপ্যায়ন'
  ]
};

export const AppProvider = ({ children }) => {
  // Mode & Preferences
  // Operating Mode: 'dual' | 'business_only' | 'personal_only'
  const [operatingMode, setOperatingModeState] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.OPERATING_MODE) || 'dual';
  });

  const [profile, setProfile] = useState(() => {
    const savedMode = localStorage.getItem(STORAGE_KEYS.OPERATING_MODE) || 'dual';
    if (savedMode === 'business_only') return 'business';
    if (savedMode === 'personal_only') return 'personal';
    return localStorage.getItem(STORAGE_KEYS.PROFILE) || 'business';
  });
  const [lang, setLang] = useState(() => localStorage.getItem(STORAGE_KEYS.LANG) || 'bn');
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEYS.THEME) || 'dark');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Personal Profile Data
  const [personalExpenses, setPersonalExpenses] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PERSONAL_EXPENSES);
    return saved ? JSON.parse(saved) : initialData.personalExpenses;
  });

  const [personalIncomes, setPersonalIncomes] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PERSONAL_INCOMES);
    return saved ? JSON.parse(saved) : initialData.personalIncomes;
  });

  const [personalSavings, setPersonalSavings] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PERSONAL_SAVINGS);
    return saved ? JSON.parse(saved) : initialData.personalSavings;
  });

  const [personalDebts, setPersonalDebts] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PERSONAL_DEBTS);
    return saved ? JSON.parse(saved) : (initialData.personalDebts || []);
  });

  const [personalEvents, setPersonalEvents] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PERSONAL_EVENTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error('Error parsing personal events:', err);
      }
    }
    return [
      {
        id: 'evt-school-2026',
        title: 'ছেলে-মেয়ের স্কুল ও পড়াশোনা খরচ',
        category: 'education',
        budget: 35000,
        status: 'active',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        note: 'স্কুল ফি, খাতা-কলম, ড্রেস ও পরীক্ষার বেতন'
      },
      {
        id: 'evt-wedding-2026',
        title: 'পারিবারিক বিয়ের অনুষ্ঠান',
        category: 'wedding',
        budget: 200000,
        status: 'active',
        startDate: '2026-10-01',
        endDate: '2026-11-15',
        note: 'কমিউনিটি সেন্টার, ক্যাটারিং, মিষ্টি ও কেনাকাটা'
      }
    ];
  });

  // Personal Bazaar Shopping List (বাজারের শপিং লিস্ট / ফর্দ)
  const [bazaarShoppingList, setBazaarShoppingList] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BAZAAR_SHOPPING_LIST);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error('Error parsing bazaar shopping list:', err);
      }
    }
    return [
      { id: 'bsl-1', name: 'আটা', quantity: 5, unit: 'কেজি (kg)', estimatedPrice: 260, category: 'bazaar', subCategory: 'চাল ও আটা', familyMember: 'পুরো পরিবার (সবার জন্য)', isPurchased: false, createdAt: new Date().toISOString() },
      { id: 'bsl-2', name: 'সয়াবিন তেল', quantity: 2, unit: 'লিটার (L)', estimatedPrice: 380, category: 'bazaar', subCategory: 'ডাল ও সয়াবিন তেল', familyMember: 'পুরো পরিবার (সবার জন্য)', isPurchased: false, createdAt: new Date().toISOString() },
      { id: 'bsl-3', name: 'ফার্মের ডিম', quantity: 1, unit: 'ডজন (Dzn)', estimatedPrice: 155, category: 'bazaar', subCategory: 'ডিম ও দুধ', familyMember: 'পুরো পরিবার (সবার জন্য)', isPurchased: true, createdAt: new Date().toISOString() }
    ];
  });

  // Business Reorder List (দোকানের মালের ক্রয়ের ফর্দ / Low Stock Reorder List)
  const [businessReorderList, setBusinessReorderList] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BIZ_REORDER_LIST);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error('Error parsing business reorder list:', err);
      }
    }
    return [];
  });

  // Business Profile Data
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BIZ_PRODUCTS);
    if (!saved) return initialData.businessProducts;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const existingIds = new Set(parsed.map(p => p.id));
        const missing = (initialData.businessProducts || []).filter(p => !existingIds.has(p.id));
        if (missing.length > 0) {
          const merged = [...parsed, ...missing];
          localStorage.setItem(STORAGE_KEYS.BIZ_PRODUCTS, JSON.stringify(merged));
          return merged;
        }
        return parsed;
      }
      return initialData.businessProducts;
    } catch {
      return initialData.businessProducts;
    }
  });

  const [cart, setCart] = useState([]);

  const [salesHistory, setSalesHistory] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BIZ_SALES);
    return saved ? JSON.parse(saved) : initialData.businessSalesHistory;
  });

  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BIZ_CUSTOMERS);
    return saved ? JSON.parse(saved) : initialData.businessCustomers;
  });

  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BIZ_EMPLOYEES);
    return saved ? JSON.parse(saved) : initialData.businessEmployees;
  });

  const [suppliers, setSuppliers] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BIZ_SUPPLIERS);
    return saved ? JSON.parse(saved) : initialData.businessSuppliers;
  });

  const [businessExpenses, setBusinessExpenses] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BIZ_EXPENSES);
    return saved ? JSON.parse(saved) : initialData.businessExpenses;
  });

  const [businessSettings, setBusinessSettings] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BIZ_SETTINGS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...initialData.businessSettings,
          ...parsed,
          googleDriveWebhookUrl: parsed.googleDriveWebhookUrl || initialData.businessSettings.googleDriveWebhookUrl,
          googleDriveEnabled: parsed.googleDriveEnabled !== undefined ? parsed.googleDriveEnabled : true
        };
      } catch {
        return initialData.businessSettings;
      }
    }
    return initialData.businessSettings;
  });

  // Business Invoices & Quotations
  const [invoices, setInvoices] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BIZ_INVOICES);
    return saved ? JSON.parse(saved) : (initialData.businessInvoices || []);
  });

  const [quotations, setQuotations] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BIZ_QUOTATIONS);
    return saved ? JSON.parse(saved) : (initialData.businessQuotations || []);
  });

  // Damaged Goods / Stock Waste Management
  const [damagedGoods, setDamagedGoods] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BIZ_DAMAGED_GOODS);
    return saved ? JSON.parse(saved) : (initialData.businessDamagedGoods || []);
  });

  // Business Cash Debts & Credits
  const [businessDebts, setBusinessDebts] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BIZ_DEBTS);
    return saved ? JSON.parse(saved) : (initialData.businessDebts || []);
  });

  // Dynamic Custom Categories Management
  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.APP_CATEGORIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_APP_CATEGORIES,
          ...parsed
        };
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_APP_CATEGORIES;
  });

  // Backup Snapshots State
  const [snapshots, setSnapshots] = useState(() => {
    try {
      const saved = localStorage.getItem('hk360_snapshots');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Commercial Reselling & Client Licensing State
  const [licenseInfo, setLicenseInfo] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LICENSE_INFO);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          status: 'active',
          planName: 'Enterprise Lifetime License',
          licenseKey: 'HK360-ENT-2026-8842-PRO',
          clientShopName: 'আল-মদিনা সুপার শপ',
          activatedDate: '2026-01-01',
          expiryDate: '2099-12-31',
          resellerName: 'হিসাব কিতাব ৩৬০ টেকনোলজিস',
          resellerPhone: '+880 1700-000000',
          resellerEmail: 'support@hisabkitab360.com',
          resellerWebsite: 'www.hisabkitab360.com',
          ...parsed,
          modules: { ...DEFAULT_MODULES, ...(parsed.modules || {}) }
        };
      }
      return {
        status: 'active',
        planName: 'Enterprise Lifetime License',
        licenseKey: 'HK360-ENT-2026-8842-PRO',
        clientShopName: 'আল-মদিনা সুপার শপ',
        activatedDate: '2026-01-01',
        expiryDate: '2099-12-31',
        resellerName: 'হিসাব কিতাব ৩৬০ টেকনোলজিস',
        resellerPhone: '+880 1700-000000',
        resellerEmail: 'support@hisabkitab360.com',
        resellerWebsite: 'www.hisabkitab360.com',
        modules: { ...DEFAULT_MODULES }
      };
    } catch {
      return {
        status: 'active',
        planName: 'Enterprise Lifetime License',
        licenseKey: 'HK360-ENT-2026-8842-PRO',
        clientShopName: 'আল-মদিনা সুপার শপ',
        activatedDate: '2026-01-01',
        expiryDate: '2099-12-31',
        resellerName: 'হিসাব কিতাব ৩৬০ টেকনোলজিস',
        resellerPhone: '+880 1700-000000',
        resellerEmail: 'support@hisabkitab360.com',
        resellerWebsite: 'www.hisabkitab360.com',
        modules: { ...DEFAULT_MODULES }
      };
    }
  });

  // Multi-Branch & Multi-Counter States
  const [branches, setBranches] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BRANCHES);
      return saved ? JSON.parse(saved) : DEFAULT_BRANCHES;
    } catch {
      return DEFAULT_BRANCHES;
    }
  });

  const [activeBranchId, setActiveBranchId] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_BRANCH_ID) || 'br-main';
  });

  const [activeCounterId, setActiveCounterId] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_COUNTER_ID) || 'cnt-1';
  });

  const [counterClosings, setCounterClosings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COUNTER_CLOSINGS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [cashMovements, setCashMovements] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CASH_MOVEMENTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    scheduleStorageWrite(STORAGE_KEYS.BRANCHES, branches);
  }, [branches]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_BRANCH_ID, activeBranchId);
  }, [activeBranchId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_COUNTER_ID, activeCounterId);
  }, [activeCounterId]);

  useEffect(() => {
    scheduleStorageWrite(STORAGE_KEYS.COUNTER_CLOSINGS, counterClosings);
  }, [counterClosings]);

  // Active Industry Template & POS Display Mode (100+ Businesses)
  const [activeIndustryId, setActiveIndustryId] = useState(() => {
    return localStorage.getItem('hk360_active_industry_id') || 'food_restaurant';
  });

  const [posDisplayMode, setPosDisplayMode] = useState(() => {
    return localStorage.getItem('hk360_pos_display_mode') || 'image_grid'; // 'image_grid' | 'hybrid' | 'compact'
  });

  // Modal / Receipt / Print / Scanner state
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [activeInvoicePrint, setActiveInvoicePrint] = useState(null);
  const [activeQuotationPrint, setActiveQuotationPrint] = useState(null);
  const [activeBarcodePrint, setActiveBarcodePrint] = useState(null);
  const [activeShareInvoice, setActiveShareInvoice] = useState(null);
  const [isHelpSupportOpen, setIsHelpSupportOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerCallback, setScannerCallback] = useState(null);
  const [scannerContext, setScannerContext] = useState('pos');
  const [scannerInitialMode, setScannerInitialMode] = useState('barcode');
  const [toastMessage, setToastMessage] = useState(null);

  const t = translations[lang] || translations.bn;

  // Effects for HTML attributes and localStorage sync
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-profile', profile);
    localStorage.setItem(STORAGE_KEYS.PROFILE, profile);
    localStorage.setItem(STORAGE_KEYS.LANG, lang);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [profile, lang, theme]);

  // Sync state to LocalStorage (Non-blocking debounced queue for 60fps UI)
  useEffect(() => {
    scheduleStorageWrite(STORAGE_KEYS.PERSONAL_EXPENSES, personalExpenses);
  }, [personalExpenses]);

  useEffect(() => {
    scheduleStorageWrite(STORAGE_KEYS.PERSONAL_INCOMES, personalIncomes);
  }, [personalIncomes]);

  useEffect(() => {
    scheduleStorageWrite(STORAGE_KEYS.PERSONAL_SAVINGS, personalSavings);
  }, [personalSavings]);

  useEffect(() => {
    scheduleStorageWrite(STORAGE_KEYS.PERSONAL_EVENTS, personalEvents);
  }, [personalEvents]);

  useEffect(() => {
    scheduleStorageWrite(STORAGE_KEYS.BIZ_PRODUCTS, products);
  }, [products]);

  useEffect(() => {
    scheduleStorageWrite(STORAGE_KEYS.BIZ_SALES, salesHistory);
  }, [salesHistory]);

  useEffect(() => {
    scheduleStorageWrite(STORAGE_KEYS.BIZ_CUSTOMERS, customers);
  }, [customers]);

  useEffect(() => {
    scheduleStorageWrite(STORAGE_KEYS.BIZ_EMPLOYEES, employees);
  }, [employees]);

  useEffect(() => {
    scheduleStorageWrite(STORAGE_KEYS.BIZ_SUPPLIERS, suppliers);
  }, [suppliers]);

  useEffect(() => {
    scheduleStorageWrite(STORAGE_KEYS.BIZ_EXPENSES, businessExpenses);
  }, [businessExpenses]);

  useEffect(() => {
    scheduleStorageWrite(STORAGE_KEYS.BIZ_SETTINGS, businessSettings);
  }, [businessSettings]);

  useEffect(() => {
    scheduleStorageWrite(STORAGE_KEYS.BIZ_INVOICES, invoices);
  }, [invoices]);

  useEffect(() => {
    scheduleStorageWrite(STORAGE_KEYS.BIZ_QUOTATIONS, quotations);
  }, [quotations]);

  useEffect(() => {
    scheduleStorageWrite(STORAGE_KEYS.BIZ_DAMAGED_GOODS, damagedGoods);
  }, [damagedGoods]);

  useEffect(() => {
    scheduleStorageWrite(STORAGE_KEYS.PERSONAL_DEBTS, personalDebts);
  }, [personalDebts]);

  useEffect(() => {
    scheduleStorageWrite(STORAGE_KEYS.BIZ_DEBTS, businessDebts);
  }, [businessDebts]);

  useEffect(() => {
    scheduleStorageWrite(STORAGE_KEYS.BAZAAR_SHOPPING_LIST, bazaarShoppingList);
  }, [bazaarShoppingList]);

  useEffect(() => {
    scheduleStorageWrite(STORAGE_KEYS.BIZ_REORDER_LIST, businessReorderList);
  }, [businessReorderList]);

  useEffect(() => {
    scheduleStorageWrite(STORAGE_KEYS.APP_CATEGORIES, categories);
  }, [categories]);

  useEffect(() => {
    scheduleStorageWrite('hk360_snapshots', snapshots);
  }, [snapshots]);

  useEffect(() => {
    scheduleStorageWrite(STORAGE_KEYS.LICENSE_INFO, licenseInfo);
  }, [licenseInfo]);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Operating Mode handler
  const setOperatingMode = (mode) => {
    setOperatingModeState(mode);
    localStorage.setItem(STORAGE_KEYS.OPERATING_MODE, mode);
    if (mode === 'business_only') {
      setProfile('business');
      setActiveTab('dashboard');
      showToast(lang === 'bn' ? '🏢 সফলভাবে "শুধুমাত্র ব্যবসা মোড" চালু করা হয়েছে (পার্সোনাল মডিউল লুকানো হয়েছে)' : 'Switched to Business Only mode');
    } else if (mode === 'personal_only') {
      setProfile('personal');
      setActiveTab('dashboard');
      showToast(lang === 'bn' ? '👤 সফলভাবে "শুধুমাত্র পার্সোনাল মোড" চালু করা হয়েছে (বিজনেস ইআরপি লুকানো হয়েছে)' : 'Switched to Personal Only mode');
    } else {
      showToast(lang === 'bn' ? '🔄 ডুয়েল মোড (উভয় প্রোফাইল সক্রিয়) চালু করা হয়েছে' : 'Dual Mode (Personal & Business) enabled');
    }
  };

  // Profile Switching handler (Auto-unlocks to dual mode so user is never trapped)
  const handleSwitchProfile = (newProfile) => {
    if (operatingMode === 'business_only' && newProfile !== 'business') {
      setOperatingModeState('dual');
      localStorage.setItem(STORAGE_KEYS.OPERATING_MODE, 'dual');
    }
    if (operatingMode === 'personal_only' && newProfile !== 'personal') {
      setOperatingModeState('dual');
      localStorage.setItem(STORAGE_KEYS.OPERATING_MODE, 'dual');
    }
    setProfile(newProfile);
    setActiveTab('dashboard'); // reset tab on profile switch
    showToast(
      newProfile === 'personal'
        ? (lang === 'bn' ? 'ব্যক্তিগত প্রোফাইলে পরিবর্তন করা হয়েছে' : 'Switched to Personal Profile')
        : (lang === 'bn' ? 'ব্যবসায়িক মোডে পরিবর্তন করা হয়েছে' : 'Switched to Business Mode')
    );
  };

  // ----------------------------------------------------
  // PERSONAL ACTIONS
  // ----------------------------------------------------
  const addPersonalExpense = (expense) => {
    const newEntry = {
      ...expense,
      id: `pex-${Date.now()}`,
      date: expense.date || new Date().toISOString().split('T')[0],
      item: (expense.item || expense.title || '').trim(),
      quantity: expense.quantity !== undefined && expense.quantity !== '' && expense.quantity !== null ? Number(expense.quantity) : null,
      unit: expense.unit || '',
      folder: expense.folder || (expense.type === 'family' ? 'অন্যান্য পারিবারিক খরচ' : ''),
      eventId: expense.eventId || '',
      eventName: expense.eventName || ''
    };
    setPersonalExpenses([newEntry, ...personalExpenses]);
    showToast(lang === 'bn' ? 'খরচ সফলভাবে যোগ করা হয়েছে' : 'Expense recorded successfully');
  };

  const updatePersonalExpense = (id, updatedFields) => {
    setPersonalExpenses(prev => prev.map(e => e.id === id ? {
      ...e,
      ...updatedFields,
      quantity: updatedFields.quantity !== undefined && updatedFields.quantity !== '' && updatedFields.quantity !== null ? Number(updatedFields.quantity) : e.quantity
    } : e));
    showToast(lang === 'bn' ? 'খরচের এন্ট্রি আপডেট করা হয়েছে' : 'Expense updated');
  };

  const deletePersonalExpense = (id) => {
    setPersonalExpenses(personalExpenses.filter(e => e.id !== id));
    showToast(lang === 'bn' ? 'খরচের এন্ট্রি মুছে ফেলা হয়েছে' : 'Expense deleted');
  };

  // ----------------------------------------------------
  // BAZAAR SHOPPING LIST ACTIONS (বাজারের শপিং লিস্ট / ফর্দ)
  // ----------------------------------------------------
  const addBazaarItem = (item) => {
    const cleanName = (item.name || item.item || '').trim();
    if (!cleanName) return;
    const newItem = {
      ...item,
      id: `bsl-${Date.now()}`,
      name: cleanName,
      quantity: item.quantity !== '' && item.quantity !== undefined && item.quantity !== null ? Number(item.quantity) : 1,
      unit: item.unit || 'কেজি (kg)',
      estimatedPrice: Number(item.estimatedPrice) || 0,
      category: item.category || 'bazaar',
      subCategory: item.subCategory || '',
      familyMember: item.familyMember || 'পুরো পরিবার (সবার জন্য)',
      isPurchased: false,
      createdAt: new Date().toISOString()
    };
    setBazaarShoppingList(prev => [newItem, ...prev]);
    showToast(lang === 'bn' ? `"${cleanName}" বাজারের ফর্দে যুক্ত হয়েছে` : 'Item added to bazaar list');
    return newItem;
  };

  const updateBazaarItem = (id, updates) => {
    setBazaarShoppingList(prev => prev.map(item => item.id === id ? {
      ...item,
      ...updates,
      quantity: updates.quantity !== undefined && updates.quantity !== '' ? Number(updates.quantity) : item.quantity,
      estimatedPrice: updates.estimatedPrice !== undefined ? Number(updates.estimatedPrice) : item.estimatedPrice
    } : item));
    showToast(lang === 'bn' ? 'ফর্দের আইটেম আপডেট হয়েছে' : 'Item updated');
  };

  const deleteBazaarItem = (id) => {
    setBazaarShoppingList(prev => prev.filter(item => item.id !== id));
    showToast(lang === 'bn' ? 'ফর্দ থেকে মুছে ফেলা হয়েছে' : 'Item removed');
  };

  const toggleBazaarItemPurchased = (id) => {
    setBazaarShoppingList(prev => prev.map(item => item.id === id ? {
      ...item,
      isPurchased: !item.isPurchased,
      purchasedAt: !item.isPurchased ? new Date().toISOString() : null
    } : item));
  };

  const convertBazaarItemToExpense = (id, actualAmount, extra = {}) => {
    const target = bazaarShoppingList.find(i => i.id === id);
    if (!target) return;
    const expenseAmount = Number(actualAmount !== undefined && actualAmount !== '' ? actualAmount : (target.estimatedPrice || 0));

    // Create daily expense automatically
    addPersonalExpense({
      title: target.name,
      item: target.name,
      quantity: target.quantity,
      unit: target.unit,
      amount: expenseAmount > 0 ? expenseAmount : 100,
      category: target.category || 'bazaar',
      subCategory: target.subCategory || '',
      familyMember: target.familyMember || 'পুরো পরিবার (সবার জন্য)',
      type: 'daily',
      date: new Date().toISOString().split('T')[0],
      note: extra.note || (lang === 'bn' ? 'বাজারের ফর্দ থেকে কেনা' : 'Purchased from Bazaar List')
    });

    // Mark as purchased & converted in shopping list
    setBazaarShoppingList(prev => prev.map(i => i.id === id ? {
      ...i,
      isPurchased: true,
      convertedToExpense: true,
      actualAmount: expenseAmount,
      purchasedAt: new Date().toISOString()
    } : i));

    showToast(lang === 'bn' ? `"${target.name}" দৈনিক খরচের খাতায় সফলভাবে যোগ হয়েছে!` : `Expense logged for "${target.name}"!`);
  };

  const clearPurchasedBazaarItems = () => {
    setBazaarShoppingList(prev => prev.filter(i => !i.isPurchased));
    showToast(lang === 'bn' ? 'কেনা সম্পন্ন হওয়া আইটেমগুলো ক্লিয়ার করা হয়েছে' : 'Cleared purchased items');
  };

  // ----------------------------------------------------
  // BUSINESS REORDER / LOW STOCK LIST ACTIONS (দোকানের ক্রয়ের ফর্দ)
  // ----------------------------------------------------
  const addBusinessReorderItem = (item) => {
    const cleanName = (item.productName || item.name || '').trim();
    if (!cleanName) return;
    const newItem = {
      ...item,
      id: `reord-${Date.now()}`,
      productName: cleanName,
      reorderQty: Number(item.reorderQty) || 10,
      unit: item.unit || 'পিস (pcs)',
      costPrice: Number(item.costPrice) || 0,
      supplier: item.supplier || '',
      status: 'pending', // 'pending' | 'ordered' | 'received'
      note: item.note || '',
      createdAt: new Date().toISOString()
    };
    setBusinessReorderList(prev => [newItem, ...prev]);
    showToast(lang === 'bn' ? 'মালের ক্রয়ের ফর্দে যোগ করা হয়েছে' : 'Added to reorder list');
    return newItem;
  };

  const updateBusinessReorderItem = (id, updates) => {
    setBusinessReorderList(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    showToast(lang === 'bn' ? 'ক্রয়ের ফর্দ আপডেট হয়েছে' : 'Reorder item updated');
  };

  const deleteBusinessReorderItem = (id) => {
    setBusinessReorderList(prev => prev.filter(item => item.id !== id));
    showToast(lang === 'bn' ? 'ক্রয়ের ফর্দ থেকে মুছে ফেলা হয়েছে' : 'Item removed from reorder list');
  };

  const syncReorderWithLowStock = () => {
    const lowStockItems = products.filter(p => Number(p.stock) <= Number(p.minAlert));
    if (lowStockItems.length === 0) {
      showToast(lang === 'bn' ? 'সব মালের পর্যাপ্ত স্টক রয়েছে (কোনো ঘাটতি নেই)' : 'All products have sufficient stock', 'info');
      return 0;
    }

    let addedCount = 0;
    setBusinessReorderList(prev => {
      const existingProductIds = new Set(prev.filter(item => item.status === 'pending').map(item => item.productId));
      const newItems = [];

      lowStockItems.forEach(p => {
        if (!existingProductIds.has(p.id)) {
          const needed = Math.max((Number(p.minAlert) * 3) - Number(p.stock), 10);
          newItems.push({
            id: `reord-${Date.now()}-${p.id}`,
            productId: p.id,
            productName: p.name,
            currentStock: Number(p.stock),
            minAlert: Number(p.minAlert),
            reorderQty: needed,
            unit: p.unit || 'পিস (pcs)',
            costPrice: Number(p.costPrice) || 0,
            category: p.category || '',
            supplier: p.supplier || '',
            status: 'pending',
            note: (lang === 'bn' ? `স্টক কমে গেছে (${p.stock}টি বাকি)` : `Low stock (${p.stock} left)`),
            createdAt: new Date().toISOString()
          });
          addedCount++;
        }
      });

      return [...newItems, ...prev];
    });

    showToast(lang === 'bn' ? `${addedCount}টি শেষ হয়ে যাওয়া পণ্য ক্রয়ের ফর্দে যুক্ত হয়েছে` : `${addedCount} low stock items synced to reorder list`);
    return addedCount;
  };

  const receiveReorderStock = (id, receivedQty) => {
    const item = businessReorderList.find(i => i.id === id);
    if (!item) return;

    const qtyToAdd = Number(receivedQty !== undefined && receivedQty !== '' ? receivedQty : item.reorderQty);

    // If associated with an existing product, increment stock directly
    if (item.productId) {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        updateProduct(prod.id, {
          stock: Number(prod.stock || 0) + qtyToAdd
        });
      }
    }

    // Mark as received
    setBusinessReorderList(prev => prev.map(i => i.id === id ? {
      ...i,
      status: 'received',
      receivedQty: qtyToAdd,
      receivedAt: new Date().toISOString()
    } : i));

    showToast(lang === 'bn' ? `"${item.productName}" এর ${qtyToAdd}টি স্টক ইনভেন্টরিতে যুক্ত হয়েছে!` : `Stock added to inventory!`);
  };

  // Event & Occasion Management Actions
  const addPersonalEvent = (eventData) => {
    const newEvent = {
      ...eventData,
      id: `evt-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      status: eventData.status || 'active',
      budget: Number(eventData.budget) || 0
    };
    setPersonalEvents(prev => [newEvent, ...prev]);
    showToast(lang === 'bn' ? 'নতুন ইভেন্ট সফলভাবে তৈরি হয়েছে' : 'Event created successfully');
    return newEvent;
  };

  const updatePersonalEvent = (id, updatedFields) => {
    setPersonalEvents(prev => prev.map(evt => evt.id === id ? {
      ...evt,
      ...updatedFields,
      budget: updatedFields.budget !== undefined ? Number(updatedFields.budget) : evt.budget
    } : evt));
    if (updatedFields.title) {
      setPersonalExpenses(prev => prev.map(exp => exp.eventId === id ? { ...exp, eventName: updatedFields.title } : exp));
    }
    showToast(lang === 'bn' ? 'ইভেন্ট তথ্য আপডেট করা হয়েছে' : 'Event updated');
  };

  const deletePersonalEvent = (id) => {
    setPersonalEvents(prev => prev.filter(evt => evt.id !== id));
    setPersonalExpenses(prev => prev.map(exp => exp.eventId === id ? { ...exp, eventId: '', eventName: '' } : exp));
    showToast(lang === 'bn' ? 'ইভেন্ট মুছে ফেলা হয়েছে' : 'Event deleted');
  };

  const addPersonalIncome = (income) => {
    const newEntry = {
      ...income,
      id: `pin-${Date.now()}`,
      date: income.date || new Date().toISOString().split('T')[0]
    };
    setPersonalIncomes([newEntry, ...personalIncomes]);
    showToast(lang === 'bn' ? 'আয়ের হিসাব সফলভাবে যোগ করা হয়েছে' : 'Income added');
  };

  const deletePersonalIncome = (id) => {
    setPersonalIncomes(personalIncomes.filter(i => i.id !== id));
  };

  const updateSavingsGoal = (id, addedAmount) => {
    setPersonalSavings(personalSavings.map(item => {
      if (item.id === id) {
        return { ...item, saved: Math.max(0, item.saved + Number(addedAmount)) };
      }
      return item;
    }));
    showToast(lang === 'bn' ? 'সঞ্চয়ের পরিমাণ আপডেট করা হয়েছে' : 'Savings updated');
  };

  // ----------------------------------------------------
  // CASH DEBT & CREDIT LEDGER (নগদ দেনা-পাওনা খাতা) ACTIONS
  // Supports multiple transactions per person & both profiles
  // ----------------------------------------------------
  const addDebtPerson = (targetProfile, personData) => {
    const isPersonal = (targetProfile || profile) === 'personal';
    const newPerson = {
      id: `dp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: (personData.name || '').trim(),
      phone: (personData.phone || '').trim(),
      address: (personData.address || '').trim(),
      relation: personData.relation || (isPersonal ? 'ব্যক্তিগত' : 'ব্যবসায়িক'),
      createdAt: personData.createdAt || new Date().toISOString().split('T')[0],
      notes: personData.notes || '',
      transactions: []
    };

    if (personData.initialTx && Number(personData.initialTx.amount) > 0) {
      newPerson.transactions.push({
        id: `tx-${Date.now()}-init`,
        date: personData.initialTx.date || new Date().toISOString().split('T')[0],
        type: personData.initialTx.type || 'lend', // lend, repay_lend, borrow, repay_borrow
        amount: Number(personData.initialTx.amount) || 0,
        purpose: (personData.initialTx.purpose || '').trim(),
        dueDate: personData.initialTx.dueDate || '',
        method: personData.initialTx.method || 'cash',
        note: (personData.initialTx.note || '').trim()
      });
    }

    if (isPersonal) {
      setPersonalDebts(prev => [newPerson, ...prev]);
    } else {
      setBusinessDebts(prev => [newPerson, ...prev]);
    }
    showToast(lang === 'bn' ? `${newPerson.name}-এর খাতা খোলা হয়েছে` : `Ledger created for ${newPerson.name}`);
    return newPerson;
  };

  const updateDebtPerson = (targetProfile, personId, updatedFields) => {
    const isPersonal = (targetProfile || profile) === 'personal';
    const updater = prev => prev.map(p => {
      if (p.id === personId) {
        return { ...p, ...updatedFields };
      }
      return p;
    });

    if (isPersonal) {
      setPersonalDebts(updater);
    } else {
      setBusinessDebts(updater);
    }
    showToast(lang === 'bn' ? 'ব্যক্তির তথ্য আপডেট করা হয়েছে' : 'Person details updated');
  };

  const deleteDebtPerson = (targetProfile, personId) => {
    const isPersonal = (targetProfile || profile) === 'personal';
    const filterer = prev => prev.filter(p => p.id !== personId);

    if (isPersonal) {
      setPersonalDebts(filterer);
    } else {
      setBusinessDebts(filterer);
    }
    showToast(lang === 'bn' ? 'ব্যক্তির খাতা মুছে ফেলা হয়েছে' : 'Person ledger deleted', 'warning');
  };

  const addDebtTransaction = (targetProfile, personId, txData) => {
    const isPersonal = (targetProfile || profile) === 'personal';
    const newTx = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date: txData.date || new Date().toISOString().split('T')[0],
      type: txData.type, // 'lend' | 'repay_lend' | 'borrow' | 'repay_borrow'
      amount: Number(txData.amount) || 0,
      purpose: (txData.purpose || '').trim(),
      dueDate: txData.dueDate || '',
      method: txData.method || 'cash',
      note: (txData.note || '').trim()
    };

    const updater = prev => prev.map(p => {
      if (p.id === personId) {
        return {
          ...p,
          transactions: [newTx, ...(p.transactions || [])]
        };
      }
      return p;
    });

    if (isPersonal) {
      setPersonalDebts(updater);
    } else {
      setBusinessDebts(updater);
    }

    showToast(lang === 'bn' ? 'লেনদেনের নতুন এন্ট্রি সফল হয়েছে' : 'Transaction recorded successfully');
    return newTx;
  };

  const editDebtTransaction = (targetProfile, personId, txId, updatedData) => {
    const isPersonal = (targetProfile || profile) === 'personal';
    const updater = prev => prev.map(p => {
      if (p.id === personId) {
        return {
          ...p,
          transactions: (p.transactions || []).map(tx => {
            if (tx.id === txId) {
              return {
                ...tx,
                ...updatedData,
                amount: updatedData.amount !== undefined ? Number(updatedData.amount) : tx.amount
              };
            }
            return tx;
          })
        };
      }
      return p;
    });

    if (isPersonal) {
      setPersonalDebts(updater);
    } else {
      setBusinessDebts(updater);
    }
    showToast(lang === 'bn' ? 'লেনদেন আপডেট করা হয়েছে' : 'Transaction updated');
  };

  const deleteDebtTransaction = (targetProfile, personId, txId) => {
    const isPersonal = (targetProfile || profile) === 'personal';
    const updater = prev => prev.map(p => {
      if (p.id === personId) {
        return {
          ...p,
          transactions: (p.transactions || []).filter(tx => tx.id !== txId)
        };
      }
      return p;
    });

    if (isPersonal) {
      setPersonalDebts(updater);
    } else {
      setBusinessDebts(updater);
    }
    showToast(lang === 'bn' ? 'লেনদেন মুছে ফেলা হয়েছে' : 'Transaction removed', 'warning');
  };

  // ----------------------------------------------------
  // DYNAMIC CATEGORY & RELATION MANAGEMENT ACTIONS
  // Add, Rename (with cascading updates), and Delete
  // ----------------------------------------------------
  const addCategory = (categoryGroup, newCategoryName) => {
    const cleanName = (newCategoryName || '').trim();
    if (!cleanName) {
      showToast(lang === 'bn' ? 'ক্যাটাগরির নাম দিন' : 'Category name cannot be empty', 'warning');
      return false;
    }

    const currentList = categories[categoryGroup] || [];
    if (currentList.some(item => item.toLowerCase() === cleanName.toLowerCase())) {
      showToast(lang === 'bn' ? 'এই ক্যাটাগরিটি ইতিমধ্যে বিদ্যমান' : 'Category already exists', 'warning');
      return false;
    }

    setCategories(prev => ({
      ...prev,
      [categoryGroup]: [...(prev[categoryGroup] || []), cleanName]
    }));

    showToast(lang === 'bn' ? `"${cleanName}" ক্যাটাগরি সফলভাবে যুক্ত হয়েছে` : `Category "${cleanName}" added`);
    return true;
  };

  const renameCategory = (categoryGroup, oldCategoryName, newCategoryName) => {
    const cleanNew = (newCategoryName || '').trim();
    if (!cleanNew) {
      showToast(lang === 'bn' ? 'নতুন ক্যাটাগরির নাম দিন' : 'New name cannot be empty', 'warning');
      return false;
    }

    if (cleanNew.toLowerCase() === oldCategoryName.toLowerCase()) {
      return true;
    }

    const currentList = categories[categoryGroup] || [];
    if (currentList.some(item => item.toLowerCase() === cleanNew.toLowerCase())) {
      showToast(lang === 'bn' ? 'এই নামের একটি ক্যাটাগরি ইতিমধ্যে আছে' : 'Category name already exists', 'warning');
      return false;
    }

    // 1. Update in categories list
    setCategories(prev => ({
      ...prev,
      [categoryGroup]: (prev[categoryGroup] || []).map(item => item === oldCategoryName ? cleanNew : item)
    }));

    // 2. Cascade update in records to maintain data consistency
    if (categoryGroup === 'debtPersonalRelations') {
      setPersonalDebts(prev => prev.map(p => p.relation === oldCategoryName ? { ...p, relation: cleanNew } : p));
    } else if (categoryGroup === 'debtBusinessRelations') {
      setBusinessDebts(prev => prev.map(p => p.relation === oldCategoryName ? { ...p, relation: cleanNew } : p));
    } else if (categoryGroup === 'productCategories') {
      setProducts(prev => prev.map(p => p.category === oldCategoryName ? { ...p, category: cleanNew } : p));
    } else if (categoryGroup === 'productUnits') {
      setProducts(prev => prev.map(p => p.unit === oldCategoryName ? { ...p, unit: cleanNew } : p));
    } else if (categoryGroup === 'productBrands') {
      setProducts(prev => prev.map(p => p.brand === oldCategoryName ? { ...p, brand: cleanNew } : p));
    } else if (categoryGroup === 'personalExpenseCategories') {
      setPersonalExpenses(prev => prev.map(e => e.category === oldCategoryName ? { ...e, category: cleanNew } : e));
    } else if (categoryGroup === 'businessExpenseCategories') {
      setBusinessExpenses(prev => prev.map(e => e.category === oldCategoryName ? { ...e, category: cleanNew } : e));
    } else if (categoryGroup === 'personalIncomeCategories') {
      setPersonalIncomes(prev => prev.map(i => i.source === oldCategoryName ? { ...i, source: cleanNew } : i));
    } else if (categoryGroup === 'familyExpenseFolders') {
      setPersonalExpenses(prev => prev.map(e => e.folder === oldCategoryName ? { ...e, folder: cleanNew } : e));
    } else if (categoryGroup === 'expenseUnits') {
      setPersonalExpenses(prev => prev.map(e => e.unit === oldCategoryName ? { ...e, unit: cleanNew } : e));
    } else if (categoryGroup === 'familyMembers') {
      setPersonalExpenses(prev => prev.map(e => e.familyMember === oldCategoryName ? { ...e, familyMember: cleanNew } : e));
    } else if (categoryGroup === 'expenseSubCategories') {
      setPersonalExpenses(prev => prev.map(e => e.subCategory === oldCategoryName ? { ...e, subCategory: cleanNew } : e));
    } else if (categoryGroup === 'expensePurposes') {
      setPersonalExpenses(prev => prev.map(e => e.purpose === oldCategoryName ? { ...e, purpose: cleanNew } : e));
    }

    showToast(lang === 'bn' ? `ক্যাটাগরি রিনেম করা হয়েছে: "${cleanNew}"` : `Category renamed to "${cleanNew}"`);
    return true;
  };

  const deleteCategory = (categoryGroup, categoryNameToDelete) => {
    setCategories(prev => ({
      ...prev,
      [categoryGroup]: (prev[categoryGroup] || []).filter(item => item !== categoryNameToDelete)
    }));
    showToast(lang === 'bn' ? `"${categoryNameToDelete}" ক্যাটাগরি মুছে ফেলা হয়েছে` : `Category deleted`, 'warning');
    return true;
  };

  const resetCategories = (categoryGroup) => {
    if (categoryGroup) {
      setCategories(prev => ({
        ...prev,
        [categoryGroup]: DEFAULT_APP_CATEGORIES[categoryGroup] || []
      }));
    } else {
      setCategories(DEFAULT_APP_CATEGORIES);
    }
    showToast(lang === 'bn' ? 'ডিফল্ট ক্যাটাগরি রিস্টোর করা হয়েছে' : 'Categories reset to defaults');
  };

  // ----------------------------------------------------
  // BUSINESS ACTIONS (POS, INVENTORY, ERP, CRM, HR)
  // ----------------------------------------------------

  // POS Cart
  const addToCart = (product) => {
    if (product.stock <= 0) {
      showToast(lang === 'bn' ? 'পণ্যটির কোনো স্টক খালি নেই!' : 'Product out of stock!', 'danger');
      return;
    }
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.qty >= product.stock) {
        showToast(lang === 'bn' ? 'সর্বোচ্চ উপলব্ধ স্টক যোগ করা হয়েছে' : 'Max available stock reached', 'warning');
        return;
      }
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const updateCartQty = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    const product = products.find(p => p.id === productId);
    if (product && newQty > product.stock) {
      showToast(lang === 'bn' ? 'পর্যাপ্ত স্টক নেই' : 'Not enough stock available', 'warning');
      return;
    }
    setCart(cart.map(item => item.id === productId ? { ...item, qty: newQty } : item));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Complete POS Sale (with Full or Partial Payment support)
  const completeSale = ({ customerId, customerName, customerPhone, paymentMethod, discount = 0, paidAmount = null, cashierName = '', table = null, orderType = null }) => {
    if (cart.length === 0) return null;

    const subtotal = cart.reduce((acc, item) => acc + (item.sellPrice * item.qty), 0);
    const vat = Math.round((subtotal - discount) * (businessSettings.vatRate / 100));
    const grandTotal = Math.max(0, subtotal - discount + vat);

    const actualPaid = paidAmount !== null && paidAmount !== undefined
      ? Math.min(grandTotal, Math.max(0, Number(paidAmount)))
      : (paymentMethod === 'due' ? 0 : grandTotal);
    const dueAmount = Math.max(0, grandTotal - actualPaid);
    const saleStatus = dueAmount === 0 ? 'paid' : (actualPaid > 0 ? 'partial' : 'unpaid');

    const now = new Date();
    const invoiceId = `INV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const activeBr = branches.find(b => b.id === activeBranchId) || branches[0] || null;
    const activeCnt = activeBr?.counters?.find(c => c.id === activeCounterId) || activeBr?.counters?.[0] || null;

    const saleRecord = {
      id: invoiceId,
      branchId: activeBranchId,
      branchName: activeBr?.name || 'প্রধান শাখা',
      counterId: activeCounterId,
      counterName: activeCnt?.name || 'কাউন্টার ০১',
      cashierName: cashierName || businessSettings.currentCashierName || (lang === 'bn' ? 'কাউন্টার ক্যাশিয়ার' : 'Counter Cashier'),
      customerName: customerName || (lang === 'bn' ? 'সাধারণ ক্রেতা (Walk-in)' : 'Walk-in Customer'),
      customerPhone: customerPhone || '',
      customerId: customerId || null,
      table: table || null,
      orderType: orderType || null,
      date: `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        qty: item.qty,
        price: item.sellPrice,
        costPrice: item.costPrice,
        subtotal: item.sellPrice * item.qty
      })),
      subtotal,
      discount: Number(discount),
      vat,
      grandTotal,
      paidAmount: actualPaid,
      dueAmount,
      paymentMethod,
      paymentHistory: actualPaid > 0 ? [{
        id: `pay-${Date.now()}`,
        date: now.toISOString().split('T')[0],
        amount: actualPaid,
        method: paymentMethod,
        note: lang === 'bn' ? (actualPaid === grandTotal ? 'সম্পূর্ণ নগদ/ডিজিটাল পেমেন্ট' : 'বিক্রয়কালীন আংশিক পেমেন্ট') : 'POS Checkout Payment'
      }] : [],
      status: saleStatus
    };

    // Deduct stock
    setProducts(prevProducts => {
      const updated = prevProducts.map(p => {
        const cartItem = cart.find(ci => ci.id === p.id);
        if (cartItem) {
          return { ...p, stock: Math.max(0, p.stock - cartItem.qty) };
        }
        return p;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.BIZ_PRODUCTS, JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving updated products to storage:', e);
      }
      return updated;
    });

    // Update customer due and total purchases if customer is linked
    if (customerId) {
      setCustomers(prevCustomers => {
        const updated = prevCustomers.map(cust => {
          if (cust.id === customerId) {
            return {
              ...cust,
              totalPurchased: (Number(cust.totalPurchased) || 0) + grandTotal,
              outstandingDue: (Number(cust.outstandingDue) || 0) + dueAmount
            };
          }
          return cust;
        });
        try {
          localStorage.setItem(STORAGE_KEYS.BIZ_CUSTOMERS, JSON.stringify(updated));
        } catch (e) {
          console.error('Error saving updated customers to storage:', e);
        }
        return updated;
      });
    }

    setSalesHistory(prevSales => {
      const updated = [saleRecord, ...prevSales];
      try {
        localStorage.setItem(STORAGE_KEYS.BIZ_SALES, JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving sales to storage:', e);
      }
      return updated;
    });

    // Also mirror to invoices list for unified management!
    setInvoices(prevInvoices => {
      const updated = [saleRecord, ...prevInvoices];
      try {
        localStorage.setItem(STORAGE_KEYS.BIZ_INVOICES, JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving invoices to storage:', e);
      }
      return updated;
    });

    setCart([]);
    setActiveReceipt(saleRecord);

    // Auto-open cash drawer for cash transaction if enabled
    if (businessSettings.autoOpenCashDrawer !== false && (paymentMethod === 'cash' || actualPaid > 0)) {
      openCashDrawer('sale');
    }

    showToast(lang === 'bn' ? `ইনভয়েস #${invoiceId} সফলভাবে সম্পন্ন হয়েছে!` : `Sale #${invoiceId} completed!`);
    return saleRecord;
  };

  // Inventory Management
  const addProduct = (newProduct) => {
    const product = {
      ...newProduct,
      id: `prod-${Date.now()}`,
      costPrice: Number(newProduct.costPrice) || 0,
      sellPrice: Number(newProduct.sellPrice) || 0,
      stock: Number(newProduct.stock) || 0,
      minAlert: Number(newProduct.minAlert) || 5
    };
    setProducts([product, ...products]);
    showToast(lang === 'bn' ? 'নতুন পণ্য সফলভাবে যুক্ত হয়েছে' : 'Product added successfully');
  };

  const updateProduct = (id, updatedFields) => {
    setProducts(products.map(p => p.id === id ? { ...p, ...updatedFields } : p));
    showToast(lang === 'bn' ? 'পণ্য তথ্য আপডেট হয়েছে' : 'Product updated');
  };

  const deleteProduct = (id) => {
    setProducts(products.filter(p => p.id !== id));
    showToast(lang === 'bn' ? 'পণ্য মুছে ফেলা হয়েছে' : 'Product deleted');
  };

  const adjustStock = (productId, qtyDelta, type = 'in', note = '') => {
    setProducts(products.map(p => {
      if (p.id === productId) {
        const newStock = type === 'in' ? p.stock + Number(qtyDelta) : Math.max(0, p.stock - Number(qtyDelta));
        return { ...p, stock: newStock };
      }
      return p;
    }));
    showToast(
      type === 'in'
        ? (lang === 'bn' ? 'স্টক ইন সফলভাবে সম্পন্ন হয়েছে' : 'Stock In recorded')
        : (lang === 'bn' ? 'স্টক আউট সম্পন্ন হয়েছে' : 'Stock Out recorded')
    );
  };

  // CRM
  const addCustomer = (customer) => {
    const newCust = {
      ...customer,
      id: customer.id || `cust-${Date.now()}`,
      totalPurchased: Number(customer.totalPurchased) || 0,
      outstandingDue: Number(customer.outstandingDue) || 0,
      creditLimit: Number(customer.creditLimit) || 0,
      createdDate: customer.createdDate || new Date().toISOString().split('T')[0]
    };
    setCustomers([newCust, ...customers]);
    showToast(lang === 'bn' ? `নতুন কাস্টমার "${newCust.name}" যোগ করা হয়েছে` : `Customer "${newCust.name}" created`);
    return newCust;
  };

  const updateCustomer = (id, updatedFields) => {
    setCustomers(customers.map(c => c.id === id ? { ...c, ...updatedFields } : c));
    showToast(lang === 'bn' ? 'কাস্টমার প্রোফাইল ও তথ্য আপডেট হয়েছে' : 'Customer profile updated');
  };

  const deleteCustomer = (id) => {
    setCustomers(customers.filter(c => c.id !== id));
    showToast(lang === 'bn' ? 'কাস্টমার মুছে ফেলা হয়েছে' : 'Customer deleted');
  };

  const collectDue = (customerId, amount) => {
    const amt = Number(amount);
    setCustomers(customers.map(c => {
      if (c.id === customerId) {
        return { ...c, outstandingDue: Math.max(0, c.outstandingDue - amt) };
      }
      return c;
    }));
    showToast(lang === 'bn' ? `৳${amt.toLocaleString()} বাকি আদায় সফল হয়েছে` : `Collected ৳${amt}`);
  };

  // HR & Payroll
  const addEmployee = (emp) => {
    const newEmp = {
      ...emp,
      id: `emp-${Date.now()}`,
      baseSalary: Number(emp.baseSalary) || 0,
      status: 'Pending',
      joinDate: emp.joinDate || new Date().toISOString().split('T')[0]
    };
    setEmployees([...employees, newEmp]);
    showToast(lang === 'bn' ? 'নতুন কর্মচারী যুক্ত করা হয়েছে' : 'Employee added');
  };

  const disburseSalary = (employeeId) => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;

    setEmployees(employees.map(e => {
      if (e.id === employeeId) {
        return {
          ...e,
          status: 'Paid',
          lastDisbursed: new Date().toISOString().split('T')[0]
        };
      }
      return e;
    }));

    // Also record as a business expense automatically!
    const salaryExpense = {
      id: `bex-sal-${Date.now()}`,
      title: `${emp.name} - মাসিক বেতন (${emp.role})`,
      amount: emp.baseSalary,
      category: 'স্যালারি ও বেতন',
      date: new Date().toISOString().split('T')[0],
      note: `কর্মচারী আইডি: ${emp.id}`
    };
    setBusinessExpenses([salaryExpense, ...businessExpenses]);

    showToast(lang === 'bn' ? `${emp.name}-এর বেতন প্রদান সম্পন্ন হয়েছে` : `Salary disbursed for ${emp.name}`);
  };

  // ERP
  const addBusinessExpense = (expense) => {
    const newExpense = {
      ...expense,
      id: `bex-${Date.now()}`,
      amount: Number(expense.amount),
      date: expense.date || new Date().toISOString().split('T')[0]
    };
    setBusinessExpenses([newExpense, ...businessExpenses]);
    showToast(lang === 'bn' ? 'ব্যবসায়িক খরচ যুক্ত করা হয়েছে' : 'Business expense recorded');
  };

  const paySupplier = (supplierId, amount) => {
    const amt = Number(amount);
    setSuppliers(suppliers.map(s => {
      if (s.id === supplierId) {
        return { ...s, payableBalance: Math.max(0, s.payableBalance - amt) };
      }
      return s;
    }));
    showToast(lang === 'bn' ? `সাপ্লায়ারকে ৳${amt.toLocaleString()} পরিশোধ সম্পন্ন` : `Paid ৳${amt} to supplier`);
  };

  // ----------------------------------------------------
  // INVOICES & QUOTATIONS ACTIONS (WITH PARTIAL PAYMENTS & INSTALLMENTS)
  // ----------------------------------------------------
  const addInvoice = (invoice) => {
    const grandTotal = Number(invoice.grandTotal) || 0;
    const paidAmount = Number(
      invoice.paidAmount !== undefined
        ? invoice.paidAmount
        : (invoice.status === 'paid' ? grandTotal : 0)
    );
    const dueAmount = Math.max(0, grandTotal - paidAmount);
    const status = dueAmount === 0 ? 'paid' : (paidAmount > 0 ? 'partial' : 'unpaid');
    const paymentMethod = invoice.paymentMethod || 'cash';
    const paymentHistory = invoice.paymentHistory || (paidAmount > 0 ? [{
      id: `pay-${Date.now()}`,
      date: invoice.date || new Date().toISOString().split('T')[0],
      amount: paidAmount,
      method: paymentMethod,
      note: invoice.paymentNote || (lang === 'bn' ? (paidAmount === grandTotal ? 'সম্পূর্ণ নগদ/ডিজিটাল পেমেন্ট' : 'প্রাথমিক আংশিক পেমেন্ট') : 'Initial Payment')
    }] : []);

    const newInv = {
      ...invoice,
      id: invoice.id || `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: invoice.date || new Date().toISOString().split('T')[0],
      grandTotal,
      paidAmount,
      dueAmount,
      status,
      paymentMethod,
      paymentHistory,
      returns: [],
      returnTotal: 0,
      items: invoice.items || []
    };

    // Deduct stock for products sold in invoice
    if (invoice.items && invoice.items.length > 0) {
      setProducts(prev => prev.map(p => {
        const item = invoice.items.find(it => it.productId === p.id);
        if (item && Number(item.qty) > 0) {
          return { ...p, stock: Math.max(0, p.stock - Number(item.qty)) };
        }
        return p;
      }));
    }

    // If customer is selected and there is dueAmount, update customer's outstandingDue
    if (invoice.customerId && dueAmount > 0) {
      setCustomers(prev => prev.map(c => c.id === invoice.customerId ? {
        ...c,
        outstandingDue: (Number(c.outstandingDue) || 0) + dueAmount,
        totalPurchased: (Number(c.totalPurchased) || 0) + grandTotal
      } : c));
    }

    setInvoices([newInv, ...invoices]);
    showToast(lang === 'bn' ? `ইনভয়েস #${newInv.id} সফলভাবে তৈরি হয়েছে!` : `Invoice #${newInv.id} created!`);
    return newInv;
  };

  const updateInvoice = (id, updatedFields) => {
    setInvoices(invoices.map(inv => inv.id === id ? { ...inv, ...updatedFields } : inv));
    showToast(lang === 'bn' ? 'ইনভয়েস আপডেট হয়েছে' : 'Invoice updated');
  };

  // Full Edit of an Existing Invoice with Inventory & Customer Balance Adjustment
  const editInvoice = (id, updatedData) => {
    const oldInv = invoices.find(inv => inv.id === id);
    if (!oldInv) return null;

    // 1. Stock adjustments based on item qty differences
    const oldItems = oldInv.items || [];
    const newItems = updatedData.items || [];

    setProducts(prev => prev.map(p => {
      const oldItem = oldItems.find(it => it.productId === p.id);
      const newItem = newItems.find(it => it.productId === p.id);
      const oldQty = oldItem ? Number(oldItem.qty) : 0;
      const newQty = newItem ? Number(newItem.qty) : 0;
      const delta = oldQty - newQty; // if delta > 0, items returned to stock; if delta < 0, more stock taken
      if (delta !== 0) {
        return { ...p, stock: Math.max(0, p.stock + delta) };
      }
      return p;
    }));

    // 2. Customer balance adjustment:
    const oldDue = Number(oldInv.dueAmount !== undefined ? oldInv.dueAmount : oldInv.grandTotal) || 0;
    const newDue = Number(updatedData.dueAmount !== undefined ? updatedData.dueAmount : updatedData.grandTotal) || 0;
    const dueDelta = newDue - oldDue;

    const targetCustId = updatedData.customerId || oldInv.customerId;
    if (dueDelta !== 0 && targetCustId) {
      setCustomers(prev => prev.map(c => {
        if (c.id === targetCustId) {
          return {
            ...c,
            outstandingDue: Math.max(0, (Number(c.outstandingDue) || 0) + dueDelta)
          };
        }
        return c;
      }));
    }

    const updatedInv = {
      ...oldInv,
      ...updatedData,
      id
    };

    setInvoices(invoices.map(inv => inv.id === id ? updatedInv : inv));
    showToast(lang === 'bn' ? `ইনভয়েস #${id} সফলভাবে এডিট ও আপডেট হয়েছে!` : `Invoice #${id} updated!`);
    return updatedInv;
  };

  // Process Sales Return (আংশিক বা সম্পূর্ণ পণ্য ফেরত ও বকেয়া/নগদ সমন্বয়)
  const processSalesReturn = (invoiceId, returnData) => {
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) return null;

    const {
      returnedItems = [], // [{ productId, name, returnedQty, refundPrice, subtotal }]
      refundType = 'deduct_due', // 'deduct_due' or 'cash_refund'
      returnDate = new Date().toISOString().split('T')[0],
      reason = '',
      restockToInventory = true
    } = returnData;

    const validReturns = returnedItems.filter(ri => Number(ri.returnedQty) > 0);
    if (validReturns.length === 0) {
      showToast(lang === 'bn' ? 'অনুগ্রহ করে ফেরত পণ্যের পরিমাণ দিন' : 'Specify returned quantity', 'danger');
      return null;
    }

    let totalRefundAmount = 0;
    validReturns.forEach(ri => {
      totalRefundAmount += Number(ri.subtotal || (Number(ri.returnedQty) * Number(ri.refundPrice)));
    });

    // 1. Restock to inventory if requested
    if (restockToInventory) {
      setProducts(prev => prev.map(p => {
        const match = validReturns.find(ri => ri.productId === p.id);
        if (match && Number(match.returnedQty) > 0) {
          return { ...p, stock: p.stock + Number(match.returnedQty) };
        }
        return p;
      }));
    }

    // 2. Update item quantities inside invoice
    const updatedItems = (inv.items || []).map(it => {
      const match = validReturns.find(ri => (ri.id && ri.id === it.id) || (ri.productId && ri.productId === it.productId) || ri.name === it.name);
      if (match && Number(match.returnedQty) > 0) {
        return {
          ...it,
          returnedQty: (Number(it.returnedQty) || 0) + Number(match.returnedQty)
        };
      }
      return it;
    });

    // Check if all items in invoice are fully returned
    const allFullyReturned = updatedItems.every(it => (Number(it.returnedQty) || 0) >= Number(it.qty));
    const anyReturned = updatedItems.some(it => (Number(it.returnedQty) || 0) > 0);

    const returnEntry = {
      id: `ret-${Date.now()}`,
      date: returnDate,
      items: validReturns,
      totalRefundAmount,
      refundType,
      reason,
      restocked: restockToInventory
    };

    const prevReturnTotal = Number(inv.returnTotal) || 0;
    const newReturnTotal = prevReturnTotal + totalRefundAmount;

    // Financial adjustments
    let currentDue = Number(inv.dueAmount !== undefined ? inv.dueAmount : inv.grandTotal);
    let currentPaid = Number(inv.paidAmount) || 0;
    let adjustedDue = currentDue;

    if (refundType === 'deduct_due') {
      // Deduct from due
      adjustedDue = Math.max(0, currentDue - totalRefundAmount);

      // Adjust CRM customer due
      if (inv.customerId || inv.customerName) {
        setCustomers(prev => prev.map(c => {
          if ((inv.customerId && c.id === inv.customerId) || (!inv.customerId && c.name === inv.customerName)) {
            return {
              ...c,
              outstandingDue: Math.max(0, (Number(c.outstandingDue) || 0) - totalRefundAmount)
            };
          }
          return c;
        }));
      }
    }

    let newStatus = inv.status;
    if (allFullyReturned) {
      newStatus = 'returned';
    } else if (anyReturned) {
      newStatus = adjustedDue === 0 && currentPaid > 0 ? 'paid' : 'partial_return';
    }

    const updatedInv = {
      ...inv,
      items: updatedItems,
      returnTotal: newReturnTotal,
      dueAmount: adjustedDue,
      status: newStatus,
      returns: [...(inv.returns || []), returnEntry]
    };

    setInvoices(invoices.map(i => i.id === invoiceId ? updatedInv : i));

    showToast(
      lang === 'bn'
        ? `পণ্য ফেরত সফল! মোট ৳${totalRefundAmount.toLocaleString()} টাকা সমন্বয় করা হয়েছে${restockToInventory ? ' এবং স্টক রিস্টোর হয়েছে' : ''}।`
        : `Sales return processed! ৳${totalRefundAmount.toLocaleString()} adjusted.`
    );

    return updatedInv;
  };

  const updateInvoiceStatus = (id, newStatus) => {
    setInvoices(invoices.map(inv => {
      if (inv.id === id) {
        const grandTotal = Number(inv.grandTotal) || 0;
        const paidAmount = newStatus === 'paid' ? grandTotal : 0;
        const dueAmount = newStatus === 'paid' ? 0 : grandTotal;
        return {
          ...inv,
          status: newStatus,
          paidAmount,
          dueAmount
        };
      }
      return inv;
    }));
    showToast(lang === 'bn' ? 'ইনভয়েসের স্ট্যাটাস আপডেট হয়েছে' : 'Invoice status updated');
  };

  // Record an installment / partial payment against an invoice
  const recordInvoicePayment = (invoiceId, { amount, method = 'cash', date, note = '' }) => {
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) return null;

    const paymentVal = Math.min(Number(amount) || 0, Number(inv.dueAmount !== undefined ? inv.dueAmount : inv.grandTotal));
    if (paymentVal <= 0) {
      showToast(lang === 'bn' ? 'অনুগ্রহ করে সঠিক পেমেন্টের পরিমাণ দিন' : 'Enter valid payment amount', 'danger');
      return null;
    }

    const currentPaid = Number(inv.paidAmount) || (inv.status === 'paid' ? Number(inv.grandTotal) : 0);
    const newPaid = currentPaid + paymentVal;
    const newDue = Math.max(0, Number(inv.grandTotal) - (Number(inv.returnTotal) || 0) - newPaid);
    const newStatus = newDue === 0 ? 'paid' : (inv.status === 'partial_return' ? 'partial_return' : 'partial');

    const newEntry = {
      id: `pay-${Date.now()}`,
      date: date || new Date().toISOString().split('T')[0],
      amount: paymentVal,
      method,
      note: note || (lang === 'bn' ? 'কিস্তি / আংশিক পরিশোধ' : 'Partial payment collection')
    };

    const updatedInv = {
      ...inv,
      paidAmount: newPaid,
      dueAmount: newDue,
      status: newStatus,
      paymentHistory: [...(inv.paymentHistory || []), newEntry]
    };

    setInvoices(invoices.map(i => i.id === invoiceId ? updatedInv : i));

    // Deduct from CRM customer's due balance if linked
    if (inv.customerId || inv.customerName) {
      setCustomers(prev => prev.map(c => {
        if ((inv.customerId && c.id === inv.customerId) || (!inv.customerId && c.name === inv.customerName)) {
          return {
            ...c,
            outstandingDue: Math.max(0, (Number(c.outstandingDue) || 0) - paymentVal)
          };
        }
        return c;
      }));
    }

    showToast(
      lang === 'bn'
        ? `৳${paymentVal.toLocaleString()} টাকা আদায় হয়েছে! (অবশিষ্ট বকেয়া: ৳${newDue.toLocaleString()})`
        : `Recorded ৳${paymentVal.toLocaleString()}! (Remaining Due: ৳${newDue.toLocaleString()})`
    );
    return updatedInv;
  };

  // Delete Invoice with optional Restock of unsold goods
  const deleteInvoice = (id, restockItems = true) => {
    const inv = invoices.find(i => i.id === id);
    if (inv) {
      // Restock items if desired
      if (restockItems && inv.items && inv.items.length > 0) {
        setProducts(prev => prev.map(p => {
          const it = inv.items.find(item => item.productId === p.id);
          if (it) {
            const unreturned = Math.max(0, Number(it.qty) - (Number(it.returnedQty) || 0));
            return { ...p, stock: p.stock + unreturned };
          }
          return p;
        }));
      }

      // Reverse customer due if any
      const due = Number(inv.dueAmount !== undefined ? inv.dueAmount : inv.grandTotal) || 0;
      if (due > 0 && inv.customerId) {
        setCustomers(prev => prev.map(c => {
          if (c.id === inv.customerId) {
            return {
              ...c,
              outstandingDue: Math.max(0, (Number(c.outstandingDue) || 0) - due)
            };
          }
          return c;
        }));
      }
    }

    setInvoices(invoices.filter(inv => inv.id !== id));
    showToast(
      lang === 'bn'
        ? `ইনভয়েস মুছে ফেলা হয়েছে${restockItems ? ' এবং মালামাল স্টকে ফেরত দেওয়া হয়েছে' : ''}!`
        : `Invoice deleted${restockItems ? ' and stock restored' : ''}!`
    );
  };

  // ----------------------------------------------------
  // DAMAGED GOODS / STOCK LOSS MANAGEMENT
  // ----------------------------------------------------
  const recordDamagedGoods = ({ productId, quantity, reason, unitCost, date, reportedBy, note, actionTaken }) => {
    const qty = Number(quantity) || 0;
    if (qty <= 0) {
      showToast(lang === 'bn' ? 'সঠিক পরিমাণ দিন' : 'Enter valid quantity', 'danger');
      return null;
    }
    const prod = products.find(p => p.id === productId);
    const cost = Number(unitCost) || (prod ? Number(prod.costPrice) || 0 : 0);
    const totalLoss = qty * cost;

    const newEntry = {
      id: `dmg-${Date.now()}`,
      productId: productId || null,
      productName: prod ? prod.name : (note || 'পণ্য'),
      sku: prod ? prod.sku : '',
      quantity: qty,
      unitCost: cost,
      totalLoss,
      reason: reason || (lang === 'bn' ? 'নষ্ট / ক্ষতি' : 'Damaged'),
      reportedBy: reportedBy || (lang === 'bn' ? 'স্টোর স্টাফ' : 'Staff'),
      actionTaken: actionTaken || (lang === 'bn' ? 'নষ্ট হিসেবে বাতিল' : 'Written off'),
      date: date || new Date().toISOString().split('T')[0],
      note: note || ''
    };

    // Deduct from product stock if productId matches
    if (productId) {
      setProducts(prev => prev.map(p => {
        if (p.id === productId) {
          return { ...p, stock: Math.max(0, p.stock - qty) };
        }
        return p;
      }));
    }

    setDamagedGoods(prev => [newEntry, ...prev]);
    showToast(
      lang === 'bn'
        ? `ড্যামেজ রেকর্ড সফল! ${qty} টি পণ্য (ক্ষতি: ৳${totalLoss.toLocaleString()}) স্টক থেকে বাদ দেওয়া হয়েছে।`
        : `Recorded damaged stock (${qty} units, loss ৳${totalLoss.toLocaleString()}).`
    );
    return newEntry;
  };

  const deleteDamagedRecord = (id, restoreStock = true) => {
    const record = damagedGoods.find(d => d.id === id);
    if (!record) return;

    if (restoreStock && record.productId) {
      setProducts(prev => prev.map(p => {
        if (p.id === record.productId) {
          return { ...p, stock: p.stock + Number(record.quantity) };
        }
        return p;
      }));
    }

    setDamagedGoods(prev => prev.filter(d => d.id !== id));
    showToast(
      lang === 'bn'
        ? `ড্যামেজ রেকর্ড বাতিল করা হয়েছে${restoreStock ? ' এবং স্টক ফেরত যোগ করা হয়েছে' : ''}!`
        : `Damage record removed${restoreStock ? ' and stock restored' : ''}!`
    );
  };

  const addQuotation = (quotation) => {
    const newQuote = {
      ...quotation,
      id: quotation.id || `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: quotation.date || new Date().toISOString().split('T')[0],
      validUntil: quotation.validUntil || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      status: quotation.status || 'sent',
      items: quotation.items || []
    };
    setQuotations([newQuote, ...quotations]);
    showToast(lang === 'bn' ? `কোটেশন #${newQuote.id} তৈরি হয়েছে!` : `Quotation #${newQuote.id} created!`);
    return newQuote;
  };

  const updateQuotation = (id, updatedFields) => {
    setQuotations(quotations.map(q => q.id === id ? { ...q, ...updatedFields } : q));
    showToast(lang === 'bn' ? 'কোটেশন আপডেট হয়েছে' : 'Quotation updated');
  };

  const updateQuotationStatus = (id, newStatus) => {
    setQuotations(quotations.map(q => q.id === id ? { ...q, status: newStatus } : q));
    showToast(lang === 'bn' ? 'কোটেশন স্ট্যাটাস আপডেট হয়েছে' : 'Quotation status updated');
  };

  const deleteQuotation = (id) => {
    setQuotations(quotations.filter(q => q.id !== id));
    showToast(lang === 'bn' ? 'কোটেশন মুছে ফেলা হয়েছে' : 'Quotation deleted');
  };

  const convertQuotationToInvoice = (quotationId) => {
    const quote = quotations.find(q => q.id === quotationId);
    if (!quote) return;

    const newInvoiceId = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newInvoice = {
      id: newInvoiceId,
      customerName: quote.customerName,
      customerPhone: quote.customerPhone,
      customerEmail: quote.customerEmail || '',
      customerAddress: quote.customerAddress || '',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      paymentTerms: 'Net 14 Days',
      items: quote.items || [],
      subtotal: quote.subtotal,
      discount: quote.discount || 0,
      vatRate: quote.vatRate || 5,
      vat: quote.vat || 0,
      grandTotal: quote.grandTotal,
      status: 'unpaid',
      notes: `অফিসিয়াল কোটেশন #${quote.id} থেকে স্বয়ংক্রিয়ভাবে তৈরি। ${quote.terms || ''}`
    };

    setInvoices([newInvoice, ...invoices]);
    setQuotations(quotations.map(q => q.id === quotationId ? { ...q, status: 'converted', convertedInvoiceId: newInvoiceId } : q));
    showToast(lang === 'bn' ? `কোটেশন #${quote.id} থেকে ইনভয়েস #${newInvoiceId} তৈরি হয়েছে!` : `Converted quotation #${quote.id} to invoice #${newInvoiceId}!`);
    setActiveInvoicePrint(newInvoice);
  };

  // ----------------------------------------------------
  // BARCODE SCANNER & AUDIO FEEDBACK
  // ----------------------------------------------------
  const playScannerBeep = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1250, audioCtx.currentTime); // crisp scanner tone
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      }
    } catch {
      // Audio might be constrained until user interaction
    }
  };

  const playCashDrawerSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        const now = audioCtx.currentTime;

        // Mechanical cash register bell / chime
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(987.77, now);
        osc1.frequency.exponentialRampToValueAtTime(1318.51, now + 0.07);
        gain1.gain.setValueAtTime(0.18, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);

        // Low drawer sliding kick
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(160, now);
        osc2.frequency.exponentialRampToValueAtTime(60, now + 0.18);
        gain2.gain.setValueAtTime(0.22, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start(now);
        osc2.stop(now + 0.25);
      }
    } catch {
      // Audio constrained
    }
  };

  const openCashDrawer = (reason = 'manual') => {
    playCashDrawerSound();
    if (businessSettings.cashDrawerKickEnabled !== false) {
      kickCashDrawer();
    }
    if (reason === 'manual') {
      showToast(lang === 'bn' ? '🗄️ ক্যাশ ড্রয়ার খোলার সংকেত সফলভাবে পাঠানো হয়েছে!' : '🗄️ Cash drawer kick signal sent!', 'success');
    }
  };

  const openScanner = (callback, context = 'pos', initialMode = 'barcode') => {
    setScannerCallback(() => callback);
    setScannerContext(context);
    setScannerInitialMode(initialMode);
    setIsScannerOpen(true);
  };

  const closeScanner = () => {
    setIsScannerOpen(false);
    setScannerCallback(null);
  };

  const handleBarcodeScanned = (barcode) => {
    playScannerBeep();
    const cleanCode = String(barcode).trim();
    const matched = products.find(
      p => p.barcode === cleanCode || p.sku.toLowerCase() === cleanCode.toLowerCase()
    );

    if (scannerCallback) {
      scannerCallback(cleanCode, matched);
    }

    if (matched) {
      showToast(lang === 'bn' ? `পণ্য স্ক্যান হয়েছে: ${matched.name}` : `Scanned: ${matched.name}`);
    } else {
      showToast(lang === 'bn' ? `বারকোড স্ক্যান হয়েছে: ${cleanCode}` : `Scanned code: ${cleanCode}`, 'warning');
    }
  };

  // Print helper actions
  const openInvoicePrint = (invoice) => setActiveInvoicePrint(invoice);
  const closeInvoicePrint = () => setActiveInvoicePrint(null);
  const openQuotationPrint = (quotation) => setActiveQuotationPrint(quotation);
  const closeQuotationPrint = () => setActiveQuotationPrint(null);
  const openBarcodePrint = (productsList) => setActiveBarcodePrint(productsList);
  const closeBarcodePrint = () => setActiveBarcodePrint(null);
  const openShareInvoice = (invoice) => setActiveShareInvoice(invoice);
  const closeShareInvoice = () => setActiveShareInvoice(null);
  const openHelpSupport = () => setIsHelpSupportOpen(true);
  const closeHelpSupport = () => setIsHelpSupportOpen(false);

  // Settings & SaaS White-label
  const updateBusinessSettings = (newSettings) => {
    const updated = {
      ...businessSettings,
      ...newSettings
    };
    setBusinessSettings(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.BIZ_SETTINGS, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving business settings:', e);
    }
    showToast(lang === 'bn' ? 'ব্যবসায়িক সেটিংস সংরক্ষণ করা হয়েছে!' : 'Business settings saved!');
  };

  // Multi-Branch and Multi-Counter Helper Functions & Handlers
  const activeBranch = branches.find(b => b.id === activeBranchId) || branches[0] || null;
  const activeCounter = activeBranch?.counters?.find(c => c.id === activeCounterId) || activeBranch?.counters?.[0] || null;

  const switchBranch = (branchId) => {
    const br = branches.find(b => b.id === branchId);
    if (br) {
      setActiveBranchId(branchId);
      if (br.counters && br.counters.length > 0) {
        setActiveCounterId(br.counters[0].id);
      }
      showToast(lang === 'bn' ? `শাখা পরিবর্তন করা হয়েছে: ${br.name}` : `Switched to branch: ${br.name}`);
    }
  };

  const switchCounter = (counterId) => {
    const cnt = activeBranch?.counters?.find(c => c.id === counterId);
    if (cnt) {
      setActiveCounterId(counterId);
      showToast(lang === 'bn' ? `কাউন্টার পরিবর্তন: ${cnt.name}` : `Switched to counter: ${cnt.name}`);
    }
  };

  const addBranch = (branchData) => {
    const newId = `br-${Date.now()}`;
    const newBranch = {
      id: newId,
      name: branchData.name || 'নতুন শাখা',
      code: branchData.code || `BR-0${branches.length + 1}`,
      address: branchData.address || '',
      phone: branchData.phone || '',
      isMain: false,
      counters: branchData.counters || [
        { id: `cnt-${Date.now()}-1`, name: 'কাউন্টার ০১ (POS)', code: 'POS-01', openingFloat: 1000 }
      ]
    };
    setBranches(prev => [...prev, newBranch]);
    showToast(lang === 'bn' ? `নতুন শাখা '${newBranch.name}' যুক্ত হয়েছে!` : `Branch '${newBranch.name}' added!`);
    return newBranch;
  };

  const updateBranch = (branchId, branchData) => {
    setBranches(prev => prev.map(b => b.id === branchId ? { ...b, ...branchData } : b));
    showToast(lang === 'bn' ? 'শাখার তথ্য আপডেট করা হয়েছে!' : 'Branch updated!');
  };

  const addCounter = (branchId, counterData) => {
    const newCounter = {
      id: `cnt-${Date.now()}`,
      name: counterData.name || 'নতুন কাউন্টার',
      code: counterData.code || `POS-0${Date.now().toString().slice(-2)}`,
      openingFloat: Number(counterData.openingFloat) || 1000
    };
    setBranches(prev => prev.map(b => {
      if (b.id === branchId) {
        return {
          ...b,
          counters: [...(b.counters || []), newCounter]
        };
      }
      return b;
    }));
    showToast(lang === 'bn' ? `কাউন্টার '${newCounter.name}' যুক্ত হয়েছে!` : `Counter '${newCounter.name}' added!`);
    return newCounter;
  };

  const updateCounter = (branchId, counterId, counterData) => {
    setBranches(prev => prev.map(b => {
      if (b.id === branchId) {
        return {
          ...b,
          counters: (b.counters || []).map(c => c.id === counterId ? { ...c, ...counterData } : c)
        };
      }
      return b;
    }));
    showToast(lang === 'bn' ? 'কাউন্টারের তথ্য সংরক্ষিত হয়েছে!' : 'Counter updated!');
  };

  // Perform Shift Closing / Handover
  const performCounterClosing = ({ counterId, closingCash, note, cashierName }) => {
    const today = new Date().toISOString().split('T')[0];
    const targetCounterId = counterId || activeCounterId;
    const counterSales = salesHistory.filter(s => 
      s.counterId === targetCounterId && s.date.startsWith(today)
    );
    const totalCashSales = counterSales
      .filter(s => s.paymentMethod === 'cash')
      .reduce((sum, s) => sum + (Number(s.paidAmount) || 0), 0);
    const totalDigitalSales = counterSales
      .filter(s => s.paymentMethod !== 'cash' && s.paymentMethod !== 'due')
      .reduce((sum, s) => sum + (Number(s.paidAmount) || 0), 0);
    const openingFloat = Number(activeCounter?.openingFloat) || 0;
    const expectedDrawerCash = openingFloat + totalCashSales;
    const actualCash = Number(closingCash) || 0;
    const discrepancy = actualCash - expectedDrawerCash;

    const closingRecord = {
      id: `cls-${Date.now()}`,
      branchId: activeBranchId,
      branchName: activeBranch?.name || 'প্রধান শাখা',
      counterId: targetCounterId,
      counterName: activeCounter?.name || 'কাউন্টার ০১',
      cashierName: cashierName || 'কাউন্টার ক্যাশিয়ার',
      timestamp: new Date().toLocaleString(),
      date: today,
      openingFloat,
      totalCashSales,
      totalDigitalSales,
      totalTransactions: counterSales.length,
      expectedDrawerCash,
      actualCash,
      discrepancy,
      status: 'pending',
      note: note || ''
    };

    setCounterClosings(prev => [closingRecord, ...prev]);
    showToast(
      lang === 'bn' 
        ? `কাউন্টার শিফট ক্লোজিং সম্পন্ন! ক্যাশ ইন হ্যান্ড: ৳${actualCash.toLocaleString()}` 
        : `Shift closed! Cash in hand: ৳${actualCash.toLocaleString()}`
    );
    return closingRecord;
  };

  // Super Admin / Manager Shift Handover Approval
  const approveCounterClosing = (closingId, adminName = 'সুপার অ্যাডমিন') => {
    setCounterClosings(prev => prev.map(c => {
      if (c.id === closingId) {
        return {
          ...c,
          status: 'approved',
          approvedBy: adminName,
          approvedAt: new Date().toLocaleString()
        };
      }
      return c;
    }));
    showToast(lang === 'bn' ? '✅ শিফট ক্লোজিং ও ক্যাশ হ্যান্ডওভার সফলভাবে অনুমোদিত হয়েছে!' : 'Shift closing approved & sealed!');
  };

  // Direct Owner Cash Control: Add Cash (Deposit/Float) or Withdraw Cash from Drawer
  const adjustCounterCash = ({ branchId, counterId, type, amount, reason, authorizedBy }) => {
    const numAmount = Number(amount) || 0;
    if (numAmount <= 0) {
      showToast(lang === 'bn' ? 'সঠিক টাকার পরিমাণ দিন' : 'Enter valid amount', 'danger');
      return null;
    }

    const targetBranchId = branchId || activeBranchId;
    const targetCounterId = counterId || activeCounterId;
    const branch = branches.find(b => b.id === targetBranchId);
    const counter = branch?.counters?.find(c => c.id === targetCounterId);

    setBranches(prev => prev.map(b => {
      if (b.id === targetBranchId) {
        return {
          ...b,
          counters: (b.counters || []).map(c => {
            if (c.id === targetCounterId) {
              const currentFloat = Number(c.openingFloat) || 0;
              const newFloat = type === 'deposit' 
                ? currentFloat + numAmount 
                : Math.max(0, currentFloat - numAmount);
              return { ...c, openingFloat: newFloat };
            }
            return c;
          })
        };
      }
      return b;
    }));

    const newMovement = {
      id: `csh-${Date.now()}`,
      branchId: targetBranchId,
      branchName: branch?.name || 'শাখা',
      counterId: targetCounterId,
      counterName: counter?.name || 'কাউন্টার',
      type, // 'deposit' or 'withdraw'
      amount: numAmount,
      reason: reason || (type === 'deposit' ? 'ক্যাশ ইন / ড্রয়ারে টাকা জমা' : 'ক্যাশ আউট / ড্রয়ার থেকে টাকা উত্তোলন'),
      authorizedBy: authorizedBy || 'মালিক (Owner)',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setCashMovements(prev => [newMovement, ...prev]);

    showToast(
      lang === 'bn'
        ? (type === 'deposit'
          ? `৳${numAmount.toLocaleString()} টাকা ক্যাশ ড্রয়ারে জমা হয়েছে!`
          : `৳${numAmount.toLocaleString()} টাকা ক্যাশ ড্রয়ার থেকে উত্তোলন করা হয়েছে!`)
        : (type === 'deposit'
          ? `৳${numAmount.toLocaleString()} added to cash drawer!`
          : `৳${numAmount.toLocaleString()} withdrawn from cash drawer!`)
    );
    return newMovement;
  };

  const deleteBranch = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    if (!branch) return;
    if (branch.isMain) {
      showToast(lang === 'bn' ? 'প্রধান শাখা মুছে ফেলা যাবে না!' : 'Cannot delete main branch!', 'danger');
      return;
    }
    if (branches.length <= 1) {
      showToast(lang === 'bn' ? 'কমপক্ষে একটি শাখা থাকতে হবে!' : 'At least one branch is required!', 'danger');
      return;
    }
    setBranches(prev => prev.filter(b => b.id !== branchId));
    if (activeBranchId === branchId) {
      setActiveBranchId(branches[0]?.id || 'br-main');
    }
    showToast(lang === 'bn' ? `শাখা '${branch.name}' মুছে ফেলা হয়েছে!` : `Branch deleted!`);
  };

  const deleteCounter = (branchId, counterId) => {
    const branch = branches.find(b => b.id === branchId);
    if (!branch) return;
    if ((branch.counters || []).length <= 1) {
      showToast(lang === 'bn' ? 'প্রতিটি শাখায় কমপক্ষে একটি কাউন্টার থাকতে হবে!' : 'At least one counter required!', 'danger');
      return;
    }
    setBranches(prev => prev.map(b => {
      if (b.id === branchId) {
        return {
          ...b,
          counters: (b.counters || []).filter(c => c.id !== counterId)
        };
      }
      return b;
    }));
    if (activeCounterId === counterId) {
      const remaining = branch.counters.filter(c => c.id !== counterId);
      if (remaining.length > 0) setActiveCounterId(remaining[0].id);
    }
    showToast(lang === 'bn' ? 'কাউন্টারটি মুছে ফেলা হয়েছে!' : 'Counter deleted!');
  };

  // ----------------------------------------------------
  // AUTOMATIC & MANUAL BACKUP, SNAPSHOTS & GOOGLE DRIVE SYNC
  // ----------------------------------------------------
  const createAutoSnapshot = (label = (lang === 'bn' ? 'স্বয়ংক্রিয় ব্যাকআপ স্ন্যাপশট' : 'Auto Backup Snapshot')) => {
    try {
      const currentData = {
        version: '2.0.0',
        createdAt: new Date().toISOString(),
        personal: { personalExpenses, personalIncomes, personalSavings, personalDebts, personalEvents },
        business: { products, salesHistory, customers, employees, suppliers, businessExpenses, businessSettings, invoices, quotations }
      };
      const serialized = JSON.stringify(currentData);
      const sizeKb = (serialized.length / 1024).toFixed(1);
      const now = new Date();
      const newSnapshot = {
        id: `snap-${Date.now()}`,
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        label,
        size: `${sizeKb} KB`,
        invoicesCount: invoices.length,
        customersCount: customers.length,
        productsCount: products.length,
        data: currentData
      };
      // Keep up to 10 snapshots in storage
      const updated = [newSnapshot, ...snapshots.slice(0, 9)];
      setSnapshots(updated);
      return newSnapshot;
    } catch (err) {
      console.warn('Snapshot error:', err);
      return null;
    }
  };

  const restoreFromSnapshot = (snapshotId) => {
    const snap = snapshots.find(s => s.id === snapshotId);
    if (!snap || !snap.data) {
      showToast(lang === 'bn' ? 'স্ন্যাপশট ডাটা পাওয়া যায়নি' : 'Snapshot not found', 'danger');
      return;
    }
    if (window.confirm(lang === 'bn' ? `আপনি কি "${snap.date} ${snap.time}"-এর ব্যাকআপ রিস্টোর করতে চান?` : `Restore backup from ${snap.date} ${snap.time}?`)) {
      importAllData(JSON.stringify(snap.data));
    }
  };

  const deleteSnapshot = (snapshotId) => {
    setSnapshots(snapshots.filter(s => s.id !== snapshotId));
    showToast(lang === 'bn' ? 'স্ন্যাপশট মুছে ফেলা হয়েছে' : 'Snapshot deleted');
  };

  // Google Drive OAuth 2.0 State
  const [isDriveConnected, setIsDriveConnected] = useState(() => isGoogleDriveConnected());
  const [driveUser, setDriveUser] = useState(() => getGoogleDriveUser());

  const connectDriveOAuth = async (customClientId = null) => {
    try {
      const res = await connectGoogleDrive(customClientId);
      setIsDriveConnected(true);
      setDriveUser(res.user);
      showToast(lang === 'bn' ? 'গুগল ড্রাইভ সফলভাবে সংযুক্ত হয়েছে!' : 'Google Drive connected successfully!');
      return res;
    } catch (err) {
      console.error('Google Drive connect error:', err);
      showToast(lang === 'bn' ? 'গুগল ড্রাইভ সংযোগ ব্যর্থ: ' + err.message : 'Google Drive connection failed: ' + err.message, 'danger');
      throw err;
    }
  };

  const disconnectDriveOAuth = () => {
    disconnectGoogleDrive();
    setIsDriveConnected(false);
    setDriveUser(null);
    showToast(lang === 'bn' ? 'গুগল ড্রাইভ সংযোগ বিচ্ছিন্ন করা হয়েছে' : 'Google Drive disconnected');
  };

  const switchDriveOAuth = async (customClientId = null) => {
    try {
      const res = await switchGoogleDriveAccount(customClientId);
      setIsDriveConnected(true);
      setDriveUser(res.user);
      showToast(lang === 'bn' ? `গুগল ড্রাইভ অ্যাকাউন্ট সফলভাবে পরিবর্তন হয়েছে: ${res.user?.email || ''}` : 'Switched Google account successfully!');
      return res;
    } catch (err) {
      console.error('Google Drive switch error:', err);
      showToast(lang === 'bn' ? 'অ্যাকাউন্ট পরিবর্তন ব্যর্থ: ' + err.message : 'Switch failed: ' + err.message, 'danger');
      throw err;
    }
  };

  // Google Drive Cloud Auto-Sync (Supports Direct OAuth 2.0 & Webhook, with 30-file auto retention)
  const isSyncingRef = useRef(false);
  const lastSyncSignatureRef = useRef('');

  const syncToGoogleDrive = async (customWebhookUrl = null, silent = false) => {
    if (isSyncingRef.current) return { success: false, inProgress: true };
    isSyncingRef.current = true;

    try {
      const backupPayload = {
        source: "HisabKitab 360 OS",
        appName: "HisabKitab 360",
        version: "2.0.0",
        backupDate: new Date().toISOString(),
        companyName: businessSettings.companyName || "HisabKitab Store",
        summary: {
          totalInvoices: invoices.length,
          totalCustomers: customers.length,
          totalProducts: products.length,
          totalSales: salesHistory.length,
          totalDamaged: damagedGoods.length
        },
        data: {
          personal: { personalExpenses, personalIncomes, personalSavings, personalDebts, personalEvents },
          business: { products, salesHistory, customers, employees, suppliers, businessExpenses, businessSettings, invoices, quotations, damagedGoods, businessDebts }
        }
      };

      // 1. Prioritize Direct Google Drive OAuth REST API Upload
      if (isGoogleDriveConnected()) {
        try {
          const folderName = businessSettings.googleDriveFolder || 'HisabKitab-360-Backups';
          const res = await uploadBackupToGoogleDrive(backupPayload, folderName, MAX_DRIVE_BACKUP_RETENTION);
          const syncTime = res.timestamp;
          const updatedSettings = {
            ...businessSettings,
            googleDriveLastSync: syncTime,
            googleDriveRemainingFiles: res.remainingFiles || 30,
            googleDrivePrunedCount: res.prunedCount || 0
          };
          setBusinessSettings(updatedSettings);
          createAutoSnapshot(lang === 'bn' ? 'গুগল ড্রাইভ অটো-সিঙ্ক' : 'Google Drive Auto-Sync');
          if (!silent) {
            const prunedNote = res.prunedCount > 0 ? (lang === 'bn' ? ` (${res.prunedCount}টি পুরোনো ফাইল মোছা হয়েছে)` : ` (${res.prunedCount} old files purged)`) : '';
            showToast(lang === 'bn' ? `গুগল ড্রাইভে ফাইল সংরক্ষিত হয়েছে: ${res.fileName}${prunedNote}` : `Saved to Google Drive: ${res.fileName}${prunedNote}`);
          }
          return { success: true, timestamp: syncTime, fileName: res.fileName, remainingFiles: res.remainingFiles };
        } catch (err) {
          console.error('Drive OAuth upload error:', err);
          setIsDriveConnected(isGoogleDriveConnected());
          if (!silent) {
            showToast(lang === 'bn' ? 'গুগল ড্রাইভে আপলোড ত্রুটি: ' + err.message : 'Google Drive upload error: ' + err.message, 'danger');
          }
          return { success: false, error: err.message };
        }
      }

      // 2. Fallback to Webhook URL if configured
      const targetUrl = customWebhookUrl || businessSettings.googleDriveWebhookUrl;
      if (targetUrl && targetUrl.trim()) {
        try {
          await fetch(targetUrl.trim(), {
            method: 'POST',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(backupPayload),
            mode: 'no-cors'
          });

          const now = new Date();
          const syncTime = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
          const updatedSettings = {
            ...businessSettings,
            googleDriveLastSync: syncTime
          };
          setBusinessSettings(updatedSettings);
          createAutoSnapshot(lang === 'bn' ? 'গুগল ড্রাইভ সিঙ্ক ব্যাকআপ' : 'Google Drive Sync Snapshot');
          if (!silent) {
            showToast(lang === 'bn' ? 'গুগল ড্রাইভে ডাটা সফলভাবে সংরক্ষিত হয়েছে!' : 'Backup successfully sent to Google Drive!');
          }
          return { success: true, timestamp: syncTime };
        } catch (err) {
          console.error('Google drive webhook error:', err);
          if (!silent) {
            showToast(lang === 'bn' ? 'ড্রাইভ ব্যাকআপ পাঠাতে সমস্যা: ' + err.message : 'Google Drive sync failed', 'danger');
          }
          return { success: false, error: err.message };
        }
      }

      // If neither OAuth nor Webhook is active
      if (!silent) {
        showToast(lang === 'bn' ? 'দয়া করে আগে Google Drive কানেক্ট করুন' : 'Please connect Google Drive first', 'danger');
      }
      return { success: false, message: 'Google Drive not connected' };
    } finally {
      isSyncingRef.current = false;
    }
  };

  // 1-Minute Smart Auto-Sync Loop to Google Drive (strictly maintains max 30 backups)
  useEffect(() => {
    // Runs every 60 seconds (1 minute)
    const intervalTimer = setInterval(() => {
      const autoSyncActive = businessSettings.autoBackupEnabled !== false && businessSettings.googleDriveEnabled !== false;
      const canSync = isGoogleDriveConnected() || !!businessSettings.googleDriveWebhookUrl;

      if (autoSyncActive && canSync && !isSyncingRef.current) {
        const currentSig = `${salesHistory.length}_${products.length}_${customers.length}_${businessExpenses.length}_${invoices.length}_${personalExpenses.length}_${personalEvents?.length || 0}`;
        if (currentSig !== lastSyncSignatureRef.current) {
          syncToGoogleDrive(null, true).then((res) => {
            if (res?.success) {
              lastSyncSignatureRef.current = currentSig;
            }
          });
        }
      }
    }, 60000); // 1 minute (60,000 ms)

    return () => clearInterval(intervalTimer);
  }, [
    businessSettings.autoBackupEnabled,
    businessSettings.googleDriveEnabled,
    businessSettings.googleDriveWebhookUrl,
    salesHistory.length,
    products.length,
    customers.length,
    businessExpenses.length,
    invoices.length,
    personalExpenses.length,
    personalEvents?.length
  ]);

  // Daily auto-backup snapshot check on startup
  useEffect(() => {
    if (businessSettings.autoBackupEnabled) {
      const today = new Date().toISOString().split('T')[0];
      if (businessSettings.autoBackupLastRun !== today) {
        createAutoSnapshot(lang === 'bn' ? `দৈনিক অটো-ব্যাকআপ (${today})` : `Daily Auto-Backup (${today})`);
        setBusinessSettings(prev => ({ ...prev, autoBackupLastRun: today }));
        if (businessSettings.googleDriveEnabled && (isGoogleDriveConnected() || businessSettings.googleDriveWebhookUrl)) {
          syncToGoogleDrive(null, true);
        }
      }
    }
  }, []);

  // Manual Backup & Restore
  const exportAllData = () => {
    const backupData = {
      version: '2.0.0',
      exportDate: new Date().toISOString(),
      personal: { personalExpenses, personalIncomes, personalSavings, personalDebts, personalEvents },
      business: { products, salesHistory, customers, employees, suppliers, businessExpenses, businessSettings, invoices, quotations, damagedGoods, businessDebts },
      categories
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HisabKitab360_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(lang === 'bn' ? 'ডাটা ব্যাকআপ ডাউনলোড শুরু হয়েছে' : 'Backup downloaded');
  };

  const importAllData = (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.personal) {
        if (data.personal.personalExpenses) setPersonalExpenses(data.personal.personalExpenses);
        if (data.personal.personalIncomes) setPersonalIncomes(data.personal.personalIncomes);
        if (data.personal.personalSavings) setPersonalSavings(data.personal.personalSavings);
        if (data.personal.personalDebts) setPersonalDebts(data.personal.personalDebts);
        if (data.personal.personalEvents) setPersonalEvents(data.personal.personalEvents);
      }
      if (data.business) {
        if (data.business.products) setProducts(data.business.products);
        if (data.business.salesHistory) setSalesHistory(data.business.salesHistory);
        if (data.business.customers) setCustomers(data.business.customers);
        if (data.business.employees) setEmployees(data.business.employees);
        if (data.business.suppliers) setSuppliers(data.business.suppliers);
        if (data.business.businessExpenses) setBusinessExpenses(data.business.businessExpenses);
        if (data.business.businessSettings) setBusinessSettings(data.business.businessSettings);
        if (data.business.invoices) setInvoices(data.business.invoices);
        if (data.business.quotations) setQuotations(data.business.quotations);
        if (data.business.damagedGoods) setDamagedGoods(data.business.damagedGoods);
        if (data.business.businessDebts) setBusinessDebts(data.business.businessDebts);
      }
      if (data.categories) {
        setCategories(prev => ({ ...prev, ...data.categories }));
      }
      showToast(lang === 'bn' ? 'ডাটা সফলভাবে রিস্টোর করা হয়েছে!' : 'Data restored successfully!');
    } catch {
      showToast(lang === 'bn' ? 'ভুল ব্যাকআপ ফাইল ফরম্যাট' : 'Invalid backup JSON file', 'danger');
    }
  };

  const resetToDemo = () => {
    if (window.confirm(lang === 'bn' ? 'আপনি কি নিশ্চিত যে ডেমো ডাটা ফিরিয়ে আনতে চান?' : 'Reset to default demo data?')) {
      setPersonalExpenses(initialData.personalExpenses);
      setPersonalIncomes(initialData.personalIncomes);
      setPersonalSavings(initialData.personalSavings);
      setPersonalDebts(initialData.personalDebts || []);
      setProducts(initialData.businessProducts);
      setSalesHistory(initialData.businessSalesHistory);
      setCustomers(initialData.businessCustomers);
      setEmployees(initialData.businessEmployees);
      setSuppliers(initialData.businessSuppliers);
      setBusinessExpenses(initialData.businessExpenses);
      setBusinessSettings(initialData.businessSettings);
      setInvoices(initialData.businessInvoices || []);
      setQuotations(initialData.businessQuotations || []);
      setDamagedGoods(initialData.businessDamagedGoods || []);
      setBusinessDebts(initialData.businessDebts || []);
      setCategories(DEFAULT_APP_CATEGORIES);
      showToast(lang === 'bn' ? 'ডেমো ডাটা সফলভাবে রিস্টোর হয়েছে' : 'Restored default demo data');
    }
  };

  // ----------------------------------------------------
  // COMMERCIAL RESELLING & CLIENT ONBOARDING
  // ----------------------------------------------------
  const updateLicenseInfo = (newInfo) => {
    setLicenseInfo(prev => ({ ...prev, ...newInfo }));
    showToast(lang === 'bn' ? 'লাইসেন্স ও রিসেলার তথ্য সফলভাবে সংরক্ষিত হয়েছে' : 'License information updated');
  };

  const generateNewLicenseKey = (shopName) => {
    const cleanPrefix = (shopName || 'STORE').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'HK360';
    const randA = Math.floor(1000 + Math.random() * 9000);
    const randB = Math.floor(1000 + Math.random() * 9000);
    const currentYear = new Date().getFullYear();
    return `HK360-${cleanPrefix}-${currentYear}-${randA}-${randB}`;
  };

  const bulkAddProducts = (newProductsList) => {
    if (!Array.isArray(newProductsList) || newProductsList.length === 0) return 0;
    const formatted = newProductsList.map((item, idx) => ({
      id: `prod-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      name: (item.name || `Product ${idx + 1}`).trim(),
      sku: (item.sku || `SKU-${Date.now().toString().slice(-4)}${idx}`).trim(),
      barcode: (item.barcode || Math.floor(1000000000 + Math.random() * 9000000000).toString()).trim(),
      category: (item.category || 'সাধারণ পণ্য').trim(),
      costPrice: Number(item.costPrice) || 0,
      sellPrice: Number(item.sellPrice) || 0,
      stock: Number(item.stock) || 0,
      unit: (item.unit || 'পিস').trim(),
      minAlert: Number(item.minAlert) || 5
    }));

    setProducts(prev => [...formatted, ...prev]);
    showToast(lang === 'bn' ? `🎉 সফলভাবে ${formatted.length}টি পণ্য ইনভেন্টরিতে যোগ করা হয়েছে!` : `Successfully imported ${formatted.length} products!`);
    return formatted.length;
  };

  const startFreshStore = ({ shopName, ownerName, phone, address, bin, currency, initialNote }) => {
    // 100% Real clean slate - wipes all demo transactions & stock
    setProducts([]);
    setCart([]);
    setSalesHistory([]);
    setCustomers([]);
    setInvoices([]);
    setQuotations([]);
    setDamagedGoods([]);
    setBusinessExpenses([]);
    setEmployees([]);
    setSuppliers([]);

    const freshSettings = {
      ...businessSettings,
      companyName: shopName || 'নতুন ব্যবসা প্রতিষ্ঠান',
      ownerName: ownerName || '',
      phone: phone || '',
      address: address || '',
      binNumber: bin || '',
      currency: currency || '৳',
      vatRate: 0,
      invoiceFooterNote: initialNote || 'আমাদের সাথে কেনাকাটা করার জন্য ধন্যবাদ। পণ্য পরিবর্তনের সময় ক্যাশমেমো সঙ্গে রাখুন।',
      companyLogo: null,
      ownerSignature: null
    };

    setBusinessSettings(freshSettings);

    const generatedKey = generateNewLicenseKey(shopName);
    setLicenseInfo(prev => ({
      ...prev,
      clientShopName: shopName || 'নতুন ব্যবসা প্রতিষ্ঠান',
      licenseKey: generatedKey,
      activatedDate: new Date().toISOString().split('T')[0],
      status: 'active'
    }));

    // Auto snapshot of the clean store
    createAutoSnapshot(lang === 'bn' ? `ক্লিন স্টোর অনবোর্ডিং (${shopName || 'New Store'})` : `Clean Store Setup (${shopName || 'New Store'})`);

    showToast(lang === 'bn' ? '🎉 সফলভাবে ফ্রেশ স্টোর সেটআপ হয়েছে! সকল ডেমো ডাটা ক্লিন করা হয়েছে।' : 'Fresh store initialized! All demo data cleared.');
  };

  const activateSoftwareWithKey = (enteredKey) => {
    if (!enteredKey || typeof enteredKey !== 'string') {
      showToast(lang === 'bn' ? 'দয়া করে একটি লাইসেন্স কী লিখুন' : 'Please enter a license key', 'danger');
      return { success: false, message: 'লাইসেন্স কী ফাঁকা রাখা যাবে না' };
    }

    const cleanKey = enteredKey.trim().toUpperCase();
    if (!cleanKey.startsWith('HK360-') || cleanKey.length < 14) {
      showToast(lang === 'bn' ? '❌ ভুল লাইসেন্স কী! লাইসেন্স ফরম্যাট সঠিক নয়।' : 'Invalid license key format!', 'danger');
      return { success: false, message: 'অবৈধ লাইসেন্স কী! সঠিক ফরম্যাট: HK360-XXXX-2026-XXXX' };
    }

    const updatedLicense = {
      ...licenseInfo,
      status: 'active',
      planName: 'Enterprise Lifetime License',
      licenseKey: cleanKey,
      activatedDate: new Date().toISOString().split('T')[0]
    };

    setLicenseInfo(updatedLicense);
    showToast(lang === 'bn' ? '🎉 অভিনন্দন! সফটওয়্যার লাইসেন্স সফলভাবে আজীবনের জন্য সক্রিয় হয়েছে।' : 'License activated successfully!');
    return { success: true, message: 'লাইসেন্স সফলভাবে আজীবনের জন্য সক্রিয় হয়েছে!' };
  };

  const deactivateLicense = () => {
    const updated = {
      ...licenseInfo,
      status: 'trial',
      planName: '14-Day Evaluation Trial',
      activatedDate: null
    };
    setLicenseInfo(updated);
    showToast(lang === 'bn' ? 'লাইসেন্স নিষ্ক্রিয় করা হয়েছে (ট্রায়াল মোড সক্রিয়)' : 'License deactivated to trial mode');
  };

  const toggleLicenseModule = (moduleKey, enabled) => {
    setLicenseInfo(prev => {
      const currentModules = prev.modules || DEFAULT_MODULES;
      const updatedModules = {
        ...currentModules,
        [moduleKey]: typeof enabled === 'boolean' ? enabled : !currentModules[moduleKey]
      };
      return {
        ...prev,
        modules: updatedModules
      };
    });
    showToast(lang === 'bn' ? 'মডিউল পারমিশন সফলভাবে আপডেট হয়েছে' : 'Module permission updated');
  };

  const applyPackagePreset = (presetKey) => {
    const preset = MODULE_PRESETS[presetKey];
    if (!preset) return;
    setLicenseInfo(prev => ({
      ...prev,
      planName: preset.planName || prev.planName,
      modules: { ...DEFAULT_MODULES, ...preset.modules }
    }));
    showToast(lang === 'bn' ? `🎉 ${preset.name} প্যাকেজ সক্রিয় করা হয়েছে!` : `Preset applied: ${preset.name}`);
  };

  const isModuleActive = (moduleKey) => {
    if (!moduleKey) return true;
    if (!licenseInfo || !licenseInfo.modules) return true;
    return licenseInfo.modules[moduleKey] !== false;
  };

  const switchIndustryTemplate = (templateId, shouldLoadSampleProducts = false) => {
    const tpl = getTemplateById(templateId);
    if (!tpl) return;

    setActiveIndustryId(templateId);
    localStorage.setItem('hk360_active_industry_id', templateId);

    if (tpl.posViewMode) {
      setPosDisplayMode(tpl.posViewMode);
      localStorage.setItem('hk360_pos_display_mode', tpl.posViewMode);
    }

    setBusinessSettings(prev => ({
      ...prev,
      industryType: templateId,
      industryName: tpl.name
    }));

    if (shouldLoadSampleProducts && tpl.sampleProducts && tpl.sampleProducts.length > 0) {
      const formatted = tpl.sampleProducts.map((p, idx) => ({
        id: `prod-${Date.now()}-${idx}`,
        name: p.name,
        sku: p.sku || `SKU-${Date.now().toString().slice(-4)}${idx}`,
        barcode: p.barcode || Math.floor(1000000000 + Math.random() * 9000000000).toString(),
        category: p.category || (tpl.defaultCategories ? tpl.defaultCategories[0] : 'সাধারণ পণ্য'),
        costPrice: Number(p.costPrice) || 0,
        sellPrice: Number(p.sellPrice) || 0,
        stock: Number(p.stock) || 50,
        unit: p.unit || (tpl.units ? tpl.units[0] : 'পিস'),
        minAlert: 5,
        image: p.image || '',
        genericName: p.genericName || '',
        batch: p.batch || '',
        expiryDate: p.expiryDate || ''
      }));
      setProducts(formatted);
    }

    showToast(lang === 'bn' ? `🎉 "${tpl.name}" টেমপ্লেট সক্রিয় করা হয়েছে!` : `Template activated: ${tpl.enName}`);
  };

  const updatePosDisplayMode = (mode) => {
    setPosDisplayMode(mode);
    localStorage.setItem('hk360_pos_display_mode', mode);
  };

  return (
    <AppContext.Provider
      value={{
        operatingMode,
        setOperatingMode,
        profile,
        setProfile: handleSwitchProfile,
        lang,
        setLang,
        theme,
        setTheme,
        activeTab,
        setActiveTab,
        t,
        toastMessage,
        showToast,
        activeReceipt,
        setActiveReceipt,

        // Invoices & Quotations
        invoices,
        addInvoice,
        updateInvoice,
        editInvoice,
        updateInvoiceStatus,
        deleteInvoice,
        processSalesReturn,
        quotations,
        addQuotation,
        updateQuotation,
        updateQuotationStatus,
        deleteQuotation,
        convertQuotationToInvoice,

        // Damaged Goods / Stock Loss
        damagedGoods,
        recordDamagedGoods,
        deleteDamagedRecord,

        // Print Modals
        activeInvoicePrint,
        openInvoicePrint,
        closeInvoicePrint,
        activeQuotationPrint,
        openQuotationPrint,
        closeQuotationPrint,
        activeBarcodePrint,
        openBarcodePrint,
        closeBarcodePrint,
        activeShareInvoice,
        openShareInvoice,
        closeShareInvoice,
        isHelpSupportOpen,
        openHelpSupport,
        closeHelpSupport,

        // Barcode Scanner & Audio
        isScannerOpen,
        scannerContext,
        scannerCallback,
        scannerInitialMode,
        openScanner,
        closeScanner,
        handleBarcodeScanned,
        playScannerBeep,
        openCashDrawer,
        playCashDrawerSound,

        // Personal State & Actions
        personalExpenses,
        personalIncomes,
        personalSavings,
        personalEvents,
        addPersonalEvent,
        updatePersonalEvent,
        deletePersonalEvent,
        addPersonalExpense,
        updatePersonalExpense,
        deletePersonalExpense,
        addPersonalIncome,
        deletePersonalIncome,
        updateSavingsGoal,

        // Bazaar Shopping List (বাজারের শপিং লিস্ট / ফর্দ)
        bazaarShoppingList,
        addBazaarItem,
        updateBazaarItem,
        deleteBazaarItem,
        toggleBazaarItemPurchased,
        convertBazaarItemToExpense,
        clearPurchasedBazaarItems,

        // Business Reorder List (দোকানের মালের ক্রয়ের ফর্দ)
        businessReorderList,
        addBusinessReorderItem,
        updateBusinessReorderItem,
        deleteBusinessReorderItem,
        syncReorderWithLowStock,
        receiveReorderStock,

        // Cash Debt & Credit Ledger (দেনা-পাওনা খাতা)
        personalDebts,
        businessDebts,
        addDebtPerson,
        updateDebtPerson,
        deleteDebtPerson,
        addDebtTransaction,
        editDebtTransaction,
        deleteDebtTransaction,

        // Dynamic Categories Management (Add, Rename, Delete)
        categories,
        addCategory,
        renameCategory,
        deleteCategory,
        resetCategories,

        // Business State & Actions
        products,
        cart,
        salesHistory,
        customers,
        employees,
        suppliers,
        businessExpenses,
        businessSettings,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        completeSale,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        collectDue,
        addEmployee,
        disburseSalary,
        addBusinessExpense,
        paySupplier,
        updateBusinessSettings,

        // Multi-Branch and Multi-Counter States & Actions
        branches,
        activeBranchId,
        activeCounterId,
        activeBranch,
        activeCounter,
        switchBranch,
        switchCounter,
        addBranch,
        updateBranch,
        deleteBranch,
        addCounter,
        updateCounter,
        deleteCounter,
        performCounterClosing,
        approveCounterClosing,
        counterClosings,
        adjustCounterCash,
        cashMovements,

        // Backup/Restore, Snapshots & Cloud Sync
        snapshots,
        createAutoSnapshot,
        restoreFromSnapshot,
        deleteSnapshot,
        syncToGoogleDrive,
        exportAllData,
        importAllData,
        resetToDemo,

        // Google Drive 1-Click OAuth 2.0
        isDriveConnected,
        driveUser,
        connectDriveOAuth,
        disconnectDriveOAuth,
        switchDriveOAuth,
        getGoogleClientId,
        saveGoogleClientId,
        listDriveBackups,
        MAX_DRIVE_BACKUP_RETENTION,

        // Partial Payments on Invoices
        recordInvoicePayment,

        // Commercial Reselling & Licensing & Modules
        licenseInfo,
        updateLicenseInfo,
        generateNewLicenseKey,
        bulkAddProducts,
        startFreshStore,
        activateSoftwareWithKey,
        deactivateLicense,
        toggleLicenseModule,
        applyPackagePreset,
        isModuleActive,
        MODULE_PRESETS,
        DEFAULT_MODULES,

        // 100+ Industry Templates & Visual POS Display
        activeIndustryId,
        posDisplayMode,
        switchIndustryTemplate,
        updatePosDisplayMode,
        MASTER_INDUSTRY_TEMPLATES,
        INDUSTRY_SECTORS,
        flushPendingStorageWrites
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
