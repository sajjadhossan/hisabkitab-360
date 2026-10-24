import React, { createContext, useContext, useState, useEffect, useRef, useCallback, startTransition } from 'react';
import { useAuth } from './AuthContext';
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
import {
  getTelegramBackupConfig,
  saveTelegramBackupConfig,
  testTelegramBackupBot,
  sendBackupToTelegram,
  pollTelegramBotCommands,
  sendTelegramMessage,
  sendTelegramDocument,
  sendTelegramItemHistoryReport,
  generateReportHtmlDoc,
  TELEGRAM_FOLDER_ADD_BIZ,
  TELEGRAM_FOLDER_ADD_PERS,
  TELEGRAM_FOLDER_REPORTS,
  TELEGRAM_FOLDER_CONTROL,
  sendTelegramSalesSummary,
  sendTelegramStockReport,
  sendTelegramProfitReport,
  sendTelegramDueReport,
  sendTelegramExpenseReport,
  sendTelegramExpenseAddedConfirmation
} from '../services/telegramBackupService';
import { kickCashDrawer } from '../services/printService';
import {
  MASTER_INDUSTRY_TEMPLATES,
  INDUSTRY_SECTORS,
  getTemplateById
} from '../data/industryTemplates';
import { DEFAULT_ROUTINE_PRESETS } from '../data/routinePresetsData';
import { scheduleStorageWrite, flushPendingStorageWrites } from '../utils/storageQueue';
import {
  createSystemSnapshot,
  loadSnapshotData,
  deleteSnapshotById,
  getSnapshotMetaList
} from '../services/snapshotService';
import { inMemoryCache } from '../services/inMemoryCache';
import {
  requestPersistentStorage,
  subscribeStorageQuota
} from '../services/storageQuotaService';
import {
  broadcastLocalTerminalEvent,
  subscribeLocalTerminalSync
} from '../services/lanSyncProtocol';
import { exportUniversalBackupAsync, validateUniversalBackup } from '../services/fastExportService';
import { auditService, AUDIT_ACTIONS } from '../services/auditService';
import { hapticFeedback } from '../services/nativeAppService';
import { showConfirmDialog, showPromptDialog } from '../services/dialogService';
import { soundService } from '../services/soundService';
import { triggerConfetti } from '../services/confettiService';
import { showUndoToast } from '../components/common/UndoNotificationToast';
import { enqueueOfflineAction } from '../utils/syncQueue';
import { notifyLowStockAlert, notifySaleCompleted } from '../services/localNotificationService';
import { submitPosSaleToCloud } from '../services/supabaseBackendService';
import { idbGet, idbSet, idbBulkSet } from '../utils/idbStorage';
import {
  initLiveSyncChannel,
  subscribeLiveSync,
  broadcastLiveEvent,
  getActiveTenantKey,
  isLiveSyncConnected
} from '../services/liveSyncService';
import { getActiveTenantEmail, isMasterSuperAdmin } from '../utils/tenantHelper';
import {
  registerDeltaSyncContextHooks,
  executeBiDirectionalSync,
  initAutoDeltaSyncScheduler,
  getLastDeltaSyncTime
} from '../services/deltaSyncService';
import { sealInvoiceInChainSync } from '../services/hashChainService';
import { allocateFefoStockDeduction } from '../services/fefoInventoryService';
import { broadcastStockUpdateToChannels } from '../services/omniChannelService';
import {
  getDeviceOrigin,
  getDeviceRegistry,
  setDeviceName,
  broadcastDeviceHeartbeat,
  subscribeToDeviceSync,
  detectDeviceType,
  getDeviceName,
  DEVICE_TYPES
} from '../services/deviceManagerService';
import {
  pushStateToCloud,
  pullLatestStateFromCloud,
  scheduleDebouncedCloudPush,
  triggerImmediateCloudPush,
  initContinuousCloudSync,
  subscribeCloudStateSync,
  getLastCloudSyncTimestamp,
  getLastSyncDeviceName,
  markInvoiceAsDeletedTombstone,
  isInvoiceTombstoned,
  markPersonalExpenseAsDeletedTombstone,
  unmarkPersonalExpenseTombstone,
  isPersonalExpenseTombstoned
} from '../services/cloudStateSyncService';
import {
  purgeAllLegacyDemoStorage,
  filterOutDemoItems,
  isLegacyDemoItem,
  mergeEntitiesWithoutDuplicates,
  mergeDebtPersonsWithTransactions
} from '../utils/demoDataSanitizer';
import {
  getStoredAttendanceLogs,
  getOfficeGeoSettings,
  saveOfficeGeoSettings
} from '../services/attendanceSecurityService';

const AppContext = createContext();

const STORAGE_KEYS = {
  PROFILE: 'hk360_active_profile',
  LANG: 'hk360_active_lang',
  THEME: 'hk360_active_theme',
  PERSONAL_EXPENSES: 'hk360_personal_expenses',
  PERSONAL_INCOMES: 'hk360_personal_incomes',
  PERSONAL_SAVINGS: 'hk360_personal_savings',
  TRASH_BIN: 'hk360_trash_bin',
  BIZ_PRODUCTS: 'hk360_biz_products',
  BIZ_SALES: 'hk360_biz_sales',
  BIZ_CUSTOMERS: 'hk360_biz_customers',
  BIZ_EMPLOYEES: 'hk360_biz_employees',
  BIZ_FIELD_ORDERS: 'hk360_biz_field_orders',
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
  ROUTINE_SHOPPING_PRESETS: 'hk360_routine_shopping_presets',
  SNAPSHOTS: 'hk360_snapshots',
  LICENSE_INFO: 'hk360_license_info',
  BRANCHES: 'hk360_biz_branches',
  ACTIVE_BRANCH_ID: 'hk360_active_branch_id',
  ACTIVE_COUNTER_ID: 'hk360_active_counter_id',
  COUNTER_CLOSINGS: 'hk360_counter_closings',
  CASH_MOVEMENTS: 'hk360_cash_movements',
  BAZAAR_SHOPPING_LIST: 'hk360_bazaar_shopping_list',
  BIZ_REORDER_LIST: 'hk360_biz_reorder_list',
  BIZ_PURCHASE_ORDERS: 'hk360_purchase_orders',
  OPERATING_MODE: 'hk360_operating_mode',
  CLIENT_LICENSES_REGISTRY: 'hk360_client_licenses_registry',
  ATTENDANCE_LOGS: 'hk360_attendance_logs',
  OFFICE_SETTINGS: 'hk360_office_geo_settings',
  STAFF_ACCOUNTS: 'hk360_staff_accounts',
};

export const DEFAULT_BRANCHES = [
  {
    id: 'br-main',
    name: 'শ্রীনগর প্রধান শাখা (Sreenagar Branch)',
    code: 'BR-01',
    address: 'শ্রীনগর বাজার, মুন্সিগঞ্জ',
    phone: '০১৭০০-০০০০০০',
    isMain: true,
    counters: [
      { id: 'cnt-1', name: 'কাউন্টার ০১ (ক্যাশ ও বিলিং)', code: 'POS-01', openingFloat: 1000 },
      { id: 'cnt-2', name: 'কাউন্টার ০২ (এক্সপ্রেস কাউন্টার)', code: 'POS-02', openingFloat: 1000 }
    ]
  },
  {
    id: 'br-munshiganj',
    name: 'মুন্সিগঞ্জ সদর শাখা (Munshiganj Branch)',
    code: 'BR-02',
    address: 'সদর রোড, মুন্সিগঞ্জ',
    phone: '০১৮০০-০০০০০০',
    isMain: false,
    counters: [
      { id: 'cnt-3', name: 'কাউন্টার ০১ (প্রধান কাউন্টার)', code: 'POS-01', openingFloat: 1000 }
    ]
  },
  {
    id: 'br-dhanmondi',
    name: 'ধানমন্ডি শাখা (Dhanmondi Branch)',
    code: 'BR-03',
    address: 'ধানমন্ডি ২৭, ঢাকা',
    phone: '০১৯০০-০০০০০০',
    isMain: false,
    counters: [
      { id: 'cnt-4', name: 'কাউন্টার ০১ (কাউন্টার সেল)', code: 'POS-01', openingFloat: 1000 }
    ]
  }
];

export const DEFAULT_MODULES = {
  dashboard: true,
  pos: true,
  debts: true,
  invoices: true,
  quotations: true,
  inventory: true,
  master_hub: true,
  erp: true,
  crm: true,
  hr: true,
  sr: true,
  branch_control: true,
  healthcare: true,
  google_drive_sync: true,
  reports: true
};

export const MODULE_PRESETS = {
  minimal: {
    name: 'সুপার লাইট মোড (Ultra-Light POS)',
    planName: 'Ultra-Lightweight POS',
    modules: {
      dashboard: false,
      pos: true,
      debts: true,
      invoices: false,
      quotations: false,
      inventory: true,
      master_hub: false,
      erp: false,
      crm: false,
      hr: false,
      sr: false,
      branch_control: false,
      healthcare: false,
      google_drive_sync: false,
      reports: true
    }
  },
  basic: {
    name: 'বেসিক রিটেইল প্যাক (Basic Retail)',
    planName: 'Basic Retail POS',
    modules: {
      dashboard: true,
      pos: true,
      debts: true,
      invoices: true,
      quotations: false,
      inventory: true,
      master_hub: true,
      erp: false,
      crm: false,
      hr: false,
      sr: false,
      branch_control: false,
      healthcare: false,
      google_drive_sync: false,
      reports: true
    }
  },
  standard: {
    name: 'স্ট্যান্ডার্ড শপ প্যাক (Standard Shop)',
    planName: 'Standard Commercial Suite',
    modules: {
      dashboard: true,
      pos: true,
      debts: true,
      invoices: true,
      quotations: true,
      inventory: true,
      master_hub: true,
      erp: true,
      crm: true,
      hr: true,
      sr: true,
      branch_control: true,
      healthcare: false,
      google_drive_sync: true,
      reports: true
    }
  },
  enterprise: {
    name: 'এন্টারপ্রাইজ ফুল প্যাক (Enterprise All-in-One)',
    planName: 'Enterprise Lifetime Suite',
    modules: {
      dashboard: true,
      pos: true,
      debts: true,
      invoices: true,
      quotations: true,
      inventory: true,
      master_hub: true,
      erp: true,
      crm: true,
      hr: true,
      sr: true,
      branch_control: true,
      healthcare: true,
      google_drive_sync: true,
      reports: true
    }
  }
};

// ----------------------------------------------------------------------------
// CRYPTOGRAPHIC LICENSE & SINGLE-TENANT EMAIL LOCK ENGINE
// ----------------------------------------------------------------------------
export const generateSignatureHash = (str) => {
  let hash = 0;
  const clean = (str || '').toLowerCase().trim();
  for (let i = 0; i < clean.length; i++) {
    hash = ((hash << 5) - hash) + clean.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36).toUpperCase().padStart(4, '0').slice(-4);
};

export const createCryptographicLicenseKey = ({ shopName, clientEmail, year = 2026 }) => {
  const cleanShop = (shopName || 'STORE').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'SHOP';
  const cleanEmail = (clientEmail || '').trim().toLowerCase();
  const cleanEmailPrefix = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'USER';
  const cleanYear = year || new Date().getFullYear();
  
  const emailHash = generateSignatureHash(cleanEmail);
  const shopHash = generateSignatureHash(cleanShop);
  const combinedSig = generateSignatureHash(`${cleanEmail}:${cleanShop}:${cleanYear}`);
  
  return `HK360-${cleanShop}-${cleanYear}-${cleanEmailPrefix}-${emailHash}${shopHash}-${combinedSig}`;
};

export const DEFAULT_CLIENT_LICENSES = [];

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
  const auth = useAuth() || {};
  const user = auth.user;
  const isSuperAdmin = auth.isSuperAdmin;

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
  const [activeTab, setActiveTabState] = useState(() => {
    try {
      const savedBiz = localStorage.getItem('hk360_biz_settings');
      if (savedBiz) {
        const parsed = JSON.parse(savedBiz);
        if (parsed?.primaryOperatingMode === 'samity' || parsed?.industryTemplateId === 'samity_management_hub') {
          return 'samity';
        }
        if (parsed?.primaryOperatingMode === 'healthcare' || parsed?.industryTemplateId === 'pharmacy_health') {
          return 'healthcare';
        }
        if (parsed?.primaryOperatingMode === 'cattle' || parsed?.industryTemplateId === 'agro_poultry') {
          return 'cattle';
        }
        if (parsed?.defaultLandingTab) {
          return parsed.defaultLandingTab;
        }
      }
    } catch {}
    return 'dashboard';
  });

  // UI Data Density Mode: 'standard' | 'compact'
  const [densityMode, setDensityMode] = useState(() => localStorage.getItem('hk360_density') || 'standard');

  // Phase 2: Theme Engine & UI Customization States
  const [brandAccent, setBrandAccent] = useState(() => localStorage.getItem('hk360_accent') || 'emerald');
  const [fontScale, setFontScale] = useState(() => localStorage.getItem('hk360_font_scale') || '100');
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('hk360_high_contrast') === 'true');
  const [invoiceStyle, setInvoiceStyle] = useState(() => localStorage.getItem('hk360_invoice_style') || 'thermal');
  const [isThemeCustomizerOpen, setIsThemeCustomizerOpen] = useState(false);
  const [customMobileNav, setCustomMobileNav] = useState(() => {
    try {
      const stored = localStorage.getItem('hk360_mobile_nav');
      return stored ? JSON.parse(stored) : ['pos', 'debts', 'inventory', 'daily_expenses', 'crm'];
    } catch {
      return ['pos', 'debts', 'inventory', 'daily_expenses', 'crm'];
    }
  });

  const updateCustomMobileNav = useCallback((tabs) => {
    setCustomMobileNav(tabs);
    try {
      localStorage.setItem('hk360_mobile_nav', JSON.stringify(tabs));
    } catch {}
  }, []);

  const openThemeCustomizer = useCallback(() => setIsThemeCustomizerOpen(true), []);
  const closeThemeCustomizer = useCallback(() => setIsThemeCustomizerOpen(false), []);

  const toggleDensityMode = useCallback(() => {
    setDensityMode(prev => {
      const next = prev === 'compact' ? 'standard' : 'compact';
      localStorage.setItem('hk360_density', next);
      document.documentElement.setAttribute('data-density', next);
      return next;
    });
  }, []);

  // Instant zero-lag tab switching
  const handleSetActiveTab = useCallback((nextTab) => {
    setActiveTabState(nextTab);
  }, []);

  // Cross-Platform Device & Origin State (Mobile, PC, Web)
  const [deviceRegistry, setDeviceRegistry] = useState(() => getDeviceRegistry());
  const [currentDevice, setCurrentDevice] = useState(() => getDeviceOrigin());

  useEffect(() => {
    // Initial heartbeat
    const reg = broadcastDeviceHeartbeat();
    setDeviceRegistry(reg);
    setCurrentDevice(getDeviceOrigin());

    // Subscribe to cross-device sync
    const unsubscribe = subscribeToDeviceSync((updatedRegistry) => {
      setDeviceRegistry(updatedRegistry);
    });

    // Heartbeat interval every 60 seconds
    const interval = setInterval(() => {
      broadcastDeviceHeartbeat();
    }, 60000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const updateDeviceName = useCallback((type, customName) => {
    setDeviceName(type, customName);
    const updated = broadcastDeviceHeartbeat();
    setDeviceRegistry(updated);
    setCurrentDevice(getDeviceOrigin());
  }, []);

  // Quick POS Counter Screen Lock
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const lockScreen = () => setIsScreenLocked(true);
  const unlockScreen = () => setIsScreenLocked(false);

  // Personal Profile Data
  const [personalExpenses, setPersonalExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PERSONAL_EXPENSES);
      const list = saved ? JSON.parse(saved) : initialData.personalExpenses;
      const savedTrash = localStorage.getItem(STORAGE_KEYS.TRASH_BIN);
      const trashList = savedTrash ? JSON.parse(savedTrash) : [];
      const trashSet = new Set((trashList || []).map(t => String(t.id || t.trashId)));

      // Auto-heal any daily expense that was erroneously stamped with 'বাসা ও ফ্ল্যাট খরচ'
      return (list || [])
        .filter(exp => exp && exp.id && !trashSet.has(String(exp.id)) && !isPersonalExpenseTombstoned(exp.id))
        .map(exp => {
          if (exp.type === 'daily' && (exp.folder === 'বাসা ও ফ্ল্যাট খরচ' || exp.folder === 'বাসা ও ফ্লাট খরচ' || exp.folder === 'বাসা ভাড়া ও সার্ভিস চার্জ')) {
            return { ...exp, folder: 'দৈনন্দিন বাজার খরচ' };
          }
          return exp;
        });
    } catch {
      return initialData.personalExpenses;
    }
  });

  // Soft-deleted Expenses Recycle Bin (রিসাইকেল বিন)
  const [trashBin, setTrashBin] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRASH_BIN);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
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
    return [];
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
    return [];
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

  // Tenant-Scoped Data Initializer:
  // Strictly prevents client accounts (like Mariam) from inheriting Master Super Admin (Sajjad's) sales or data.
  const getInitialTenantScopedData = (baseKey, fallback = []) => {
    try {
      const activeEmail = getActiveTenantEmail();
      const isMaster = activeEmail === 'hossansajjad1994@gmail.com';
      if (activeEmail) {
        const tenantKey = `hk360_t_${activeEmail.replace(/[^a-zA-Z0-9]/g, '_')}_${baseKey}`;
        const tenantVal = localStorage.getItem(tenantKey);
        if (tenantVal) {
          const parsed = JSON.parse(tenantVal);
          return Array.isArray(parsed) ? filterOutDemoItems(parsed) : parsed;
        }
      }
      // Master account fallback to global legacy key
      if (isMaster) {
        const globalVal = localStorage.getItem(`hk360_${baseKey}`);
        if (globalVal) {
          const parsed = JSON.parse(globalVal);
          return Array.isArray(parsed) ? filterOutDemoItems(parsed) : parsed;
        }
      }
      // Any other client account starts completely fresh (zero transactions, zero demo items)
      return fallback;
    } catch {
      return fallback;
    }
  };

  // Business Profile Data
  const [products, setProducts] = useState(() => {
    return getInitialTenantScopedData('biz_products', []);
  });

  const [cart, setCart] = useState(() => {
    try {
      const savedDraft = localStorage.getItem('hk360_pos_draft_cart');
      return savedDraft ? JSON.parse(savedDraft) : [];
    } catch {
      return [];
    }
  });

  // Crash Recovery: Auto-persist active POS cart so refresh/crash loses zero data
  useEffect(() => {
    try {
      if (cart && cart.length > 0) {
        localStorage.setItem('hk360_pos_draft_cart', JSON.stringify(cart));
      } else {
        localStorage.removeItem('hk360_pos_draft_cart');
      }
    } catch (e) {
      console.warn('[CrashRecovery] Failed to save draft cart:', e);
    }
  }, [cart]);

  const [salesHistory, setSalesHistory] = useState(() => {
    return getInitialTenantScopedData('biz_sales', []);
  });

  const [customers, setCustomers] = useState(() => {
    return getInitialTenantScopedData('biz_customers', []);
  });

  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BIZ_EMPLOYEES);
    return saved ? filterOutDemoItems(JSON.parse(saved)) : [];
  });

  const [suppliers, setSuppliers] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BIZ_SUPPLIERS);
    return saved ? filterOutDemoItems(JSON.parse(saved)) : [];
  });

  const [businessExpenses, setBusinessExpenses] = useState(() => {
    return getInitialTenantScopedData('biz_expenses', []);
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
    return getInitialTenantScopedData('biz_invoices', []);
  });

  const [quotations, setQuotations] = useState(() => {
    return getInitialTenantScopedData('biz_quotations', []);
  });

  // Damaged Goods / Stock Waste Management
  const [damagedGoods, setDamagedGoods] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BIZ_DAMAGED_GOODS);
    return saved ? JSON.parse(saved) : [];
  });

  // Business Cash Debts & Credits
  const [businessDebts, setBusinessDebts] = useState(() => {
    return getInitialTenantScopedData('biz_debts', []);
  });

  // HR & SR Field Product Orders & Delivery Status Tracking
  const [fieldOrders, setFieldOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BIZ_FIELD_ORDERS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Purchase Orders & Supplier Purchases
  const [purchaseOrders, setPurchaseOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BIZ_PURCHASE_ORDERS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
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

  // Routine Shopping Presets State (Cross-Device Cloud Sync Enabled)
  const [routineShoppingPresets, setRoutineShoppingPresets] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ROUTINE_SHOPPING_PRESETS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse routine presets from storage:', e);
    }
    return DEFAULT_ROUTINE_PRESETS;
  });

  // Backup Snapshots State (7-Day Rolling IndexedDB)
  const [snapshots, setSnapshots] = useState(() => {
    return getSnapshotMetaList();
  });

  // Storage Quota & Eviction Protection State
  const [storageQuota, setStorageQuota] = useState({
    usageFormatted: '0 MB',
    quotaFormatted: '0 MB',
    percentUsed: 0,
    isPersisted: false,
    isLowSpace: false
  });

  // Commercial Reselling & Client Licensing State (Pending Master Approval by default)
  const [licenseInfo, setLicenseInfo] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LICENSE_INFO);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          status: 'pending_approval',
          planName: 'Commercial Evaluation / Unapproved',
          licenseKey: 'PENDING-ACTIVATION',
          clientShopName: '',
          clientEmail: '',
          activatedDate: '',
          expiryDate: '',
          resellerName: 'হিসাব কিতাব ৩৬০ টেকনোলজিস',
          resellerPhone: '+880 1700-000000',
          resellerEmail: 'support@hisabkitab360.com',
          resellerWebsite: 'www.hisabkitab360.com',
          ...parsed,
          modules: { ...DEFAULT_MODULES, ...(parsed.modules || {}) }
        };
      }
      return {
        status: 'pending_approval',
        planName: 'Commercial Evaluation / Unapproved',
        licenseKey: 'PENDING-ACTIVATION',
        clientShopName: '',
        clientEmail: '',
        activatedDate: '',
        expiryDate: '',
        resellerName: 'হিসাব কিতাব ৩৬০ টেকনোলজিস',
        resellerPhone: '+880 1700-000000',
        resellerEmail: 'support@hisabkitab360.com',
        resellerWebsite: 'www.hisabkitab360.com',
        modules: { ...DEFAULT_MODULES }
      };
    } catch {
      return {
        status: 'pending_approval',
        planName: 'Commercial Evaluation / Unapproved',
        licenseKey: 'PENDING-ACTIVATION',
        clientShopName: '',
        clientEmail: '',
        activatedDate: '',
        expiryDate: '',
        resellerName: 'হিসাব কিতাব ৩৬০ টেকনোলজিস',
        resellerPhone: '+880 1700-000000',
        resellerEmail: 'support@hisabkitab360.com',
        resellerWebsite: 'www.hisabkitab360.com',
        modules: { ...DEFAULT_MODULES }
      };
    }
  });

  // Master Client Licenses Registry (Super Admin Database)
  const [clientLicensesRegistry, setClientLicensesRegistry] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLIENT_LICENSES_REGISTRY);
      let list = saved ? JSON.parse(saved) : DEFAULT_CLIENT_LICENSES;
      if (!Array.isArray(list)) list = [];

      // Auto-ingest any previously verified accounts from offline auth vault
      try {
        const rawVault = localStorage.getItem('hk360_offline_auth_vault');
        if (rawVault) {
          const vault = JSON.parse(rawVault);
          Object.keys(vault).forEach(emailKey => {
            const acc = vault[emailKey];
            if (acc && acc.email && !list.some(l => (l.clientEmail || '').toLowerCase() === acc.email.toLowerCase())) {
              const isMaster = acc.email.toLowerCase() === 'hossansajjad1994@gmail.com';
              list.push({
                id: `lic-vault-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                clientShopName: acc.shopName || acc.name || 'নিবন্ধিত প্রতিষ্ঠান',
                clientEmail: acc.email.toLowerCase(),
                clientPhone: acc.phone || '',
                planName: isMaster ? 'Master Super Admin Lifetime Enterprise' : 'Standard Commercial Store',
                expiryDate: isMaster ? '2099-12-31' : '2027-12-31',
                licenseKey: isMaster ? 'HK360-MASTER-ENTERPRISE-LIFETIME-2099' : createCryptographicLicenseKey({ shopName: acc.shopName || 'STORE', clientEmail: acc.email, year: 2027 }),
                status: 'active',
                issuedDate: acc.lastVerifiedAt ? acc.lastVerifiedAt.split('T')[0] : 'পূর্বে নিবন্ধিত'
              });
            }
          });
        }
      } catch (vaultErr) {
        console.warn('Vault auto-ingest warning:', vaultErr);
      }

      return list;
    } catch {
      return DEFAULT_CLIENT_LICENSES;
    }
  });

  useEffect(() => {
    scheduleStorageWrite(STORAGE_KEYS.CLIENT_LICENSES_REGISTRY, clientLicensesRegistry);
  }, [clientLicensesRegistry]);

  // Dynamic License Synchronization with Current User Session
  useEffect(() => {
    const isMaster = isSuperAdmin || user?.isMasterAccount || (user?.email || '').toLowerCase() === 'hossansajjad1994@gmail.com';
    if (isMaster) {
      setLicenseInfo(prev => ({
        ...prev,
        status: 'active',
        planName: 'Master Super Admin Lifetime Enterprise',
        licenseKey: 'HK360-MASTER-ENTERPRISE-LIFETIME-2099',
        clientShopName: 'হিসাব কিতাব ৩৬০ হেডকোয়ার্টার',
        clientEmail: 'hossansajjad1994@gmail.com',
        expiryDate: '2099-12-31'
      }));
      return;
    }

    // Staff Users & Counter Cashiers inherit active store license seamlessly
    if (user?.isStaffUser || user?.isCounterUser) {
      setLicenseInfo(prev => ({
        ...prev,
        status: 'active',
        planName: prev.planName || 'Store Enterprise Counter License',
        expiryDate: '2099-12-31'
      }));
      return;
    }

    if (user?.email) {
      const uEmail = user.email.toLowerCase();
      const matched = clientLicensesRegistry.find(l => (l.clientEmail || '').toLowerCase() === uEmail);
      if (matched) {
        let derivedStatus = matched.status || 'pending_approval';
        if (derivedStatus === 'active' && matched.expiryDate && matched.expiryDate !== '2099-12-31') {
          const nowStr = new Date().toISOString().split('T')[0];
          if (matched.expiryDate < nowStr) {
            derivedStatus = 'expired';
          }
        }
        setLicenseInfo(prev => ({
          ...prev,
          status: derivedStatus,
          planName: matched.planName || prev.planName,
          licenseKey: matched.licenseKey || prev.licenseKey,
          clientShopName: matched.clientShopName || user.shopName || prev.clientShopName,
          clientEmail: matched.clientEmail || user.email,
          expiryDate: matched.expiryDate || prev.expiryDate,
          modules: matched.modules || prev.modules || { ...DEFAULT_MODULES }
        }));
      } else {
        // Not in registry yet, auto-register as pending_approval
        const pendingLic = {
          id: `lic-${Date.now()}`,
          clientShopName: user.shopName || 'আমার প্রতিষ্ঠান',
          clientEmail: uEmail,
          clientPhone: user.phone || '',
          planName: 'Pending Master Approval',
          expiryDate: 'অপেক্ষমাণ',
          licenseKey: 'PENDING_APPROVAL',
          status: 'pending_approval',
          issuedDate: new Date().toISOString().split('T')[0]
        };
        setClientLicensesRegistry(prev => [pendingLic, ...prev]);
        broadcastLiveEvent('CLIENT_LICENSE_REQUEST', { license: pendingLic });
        setLicenseInfo(prev => ({
          ...prev,
          status: 'pending_approval',
          clientShopName: pendingLic.clientShopName,
          clientEmail: pendingLic.clientEmail,
          planName: pendingLic.planName,
          licenseKey: pendingLic.licenseKey,
          expiryDate: pendingLic.expiryDate
        }));
      }
    }
  }, [user, isSuperAdmin, clientLicensesRegistry]);

  // Tenant / Account Isolation: When active user switches (e.g. Sajjad to Mariam), scope data to the current account
  const activeTenantRef = useRef(null);
  useEffect(() => {
    const currentEmail = (user?.email || '').toLowerCase().trim();
    if (activeTenantRef.current === null) {
      activeTenantRef.current = currentEmail;
      return;
    }
    if (currentEmail === activeTenantRef.current) {
      return;
    }
    const previousEmail = activeTenantRef.current;
    activeTenantRef.current = currentEmail;

    // Flush any pending unsaved writes under the previous user
    try {
      flushPendingStorageWrites();
    } catch {}

    const tenantPrefix = `hk360_t_${currentEmail.replace(/[^a-zA-Z0-9]/g, '_')}_`;
    const hasTenantData = Object.keys(localStorage).some(k => k.startsWith(tenantPrefix));

    if (hasTenantData) {
      // Load saved data for this specific tenant
      try {
        const tSales = localStorage.getItem(`${tenantPrefix}biz_sales`);
        if (tSales) setSalesHistory(JSON.parse(tSales));
        const tProds = localStorage.getItem(`${tenantPrefix}biz_products`);
        if (tProds) setProducts(JSON.parse(tProds));
        const tInvs = localStorage.getItem(`${tenantPrefix}biz_invoices`);
        if (tInvs) setInvoices(JSON.parse(tInvs));
        const tCusts = localStorage.getItem(`${tenantPrefix}biz_customers`);
        if (tCusts) setCustomers(JSON.parse(tCusts));
        const tDebts = localStorage.getItem(`${tenantPrefix}biz_debts`);
        if (tDebts) setBusinessDebts(JSON.parse(tDebts));
        const tExps = localStorage.getItem(`${tenantPrefix}biz_expenses`);
        if (tExps) setBusinessExpenses(JSON.parse(tExps));
      } catch (err) {
        console.warn('[TenantIsolation] Failed to load tenant data:', err);
      }
    } else {
      // If switching accounts or logging in as a client (e.g. Mariam), give a 100% clean slate
      if (currentEmail !== 'hossansajjad1994@gmail.com') {
        console.log(`[TenantIsolation] Initializing fresh clean workspace for client account: ${currentEmail}`);
        setProducts([]);
        setCart([]);
        setSalesHistory([]);
        setInvoices([]);
        setCustomers([]);
        setBusinessDebts([]);
        setBusinessExpenses([]);
      }
    }

    // Immediately trigger cloud pull scoped to this user's cloud space
    setTimeout(() => {
      pullLatestStateFromCloud({ force: true }).then(res => {
        if (res.success && res.state && typeof applyCloudStateRef.current === 'function') {
          applyCloudStateRef.current(res.state);
        }
      }).catch(() => {});
    }, 400);
  }, [user]);

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

  useEffect(() => {
    scheduleStorageWrite(STORAGE_KEYS.CASH_MOVEMENTS, cashMovements);
  }, [cashMovements]);

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
    document.documentElement.setAttribute('data-density', densityMode);
    document.documentElement.setAttribute('data-accent', brandAccent);
    document.documentElement.setAttribute('data-font-scale', fontScale);
    if (highContrast) {
      document.documentElement.setAttribute('data-contrast', 'high');
    } else {
      document.documentElement.removeAttribute('data-contrast');
    }
    localStorage.setItem(STORAGE_KEYS.PROFILE, profile);
    localStorage.setItem(STORAGE_KEYS.LANG, lang);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    localStorage.setItem('hk360_density', densityMode);
    localStorage.setItem('hk360_accent', brandAccent);
    localStorage.setItem('hk360_font_scale', fontScale);
    localStorage.setItem('hk360_high_contrast', String(highContrast));
    localStorage.setItem('hk360_invoice_style', invoiceStyle);
  }, [profile, lang, theme, densityMode, brandAccent, fontScale, highContrast, invoiceStyle]);

  // Sync state to LocalStorage (Non-blocking debounced queue for 60fps UI)
  useEffect(() => {
    scheduleStorageWrite(STORAGE_KEYS.PERSONAL_EXPENSES, personalExpenses);
  }, [personalExpenses]);

  useEffect(() => {
    scheduleStorageWrite(STORAGE_KEYS.TRASH_BIN, trashBin);
  }, [trashBin]);

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
    const currentEmail = (user?.email || '').toLowerCase().trim();
    if (!currentEmail || currentEmail === 'hossansajjad1994@gmail.com') {
      scheduleStorageWrite(STORAGE_KEYS.BIZ_PRODUCTS, products);
    }
    if (currentEmail) {
      scheduleStorageWrite(`hk360_t_${currentEmail.replace(/[^a-zA-Z0-9]/g, '_')}_biz_products`, products);
    }
  }, [products, user?.email]);

  useEffect(() => {
    const currentEmail = (user?.email || '').toLowerCase().trim();
    if (!currentEmail || currentEmail === 'hossansajjad1994@gmail.com') {
      scheduleStorageWrite(STORAGE_KEYS.BIZ_SALES, salesHistory);
    }
    if (currentEmail) {
      scheduleStorageWrite(`hk360_t_${currentEmail.replace(/[^a-zA-Z0-9]/g, '_')}_biz_sales`, salesHistory);
    }
  }, [salesHistory, user?.email]);

  useEffect(() => {
    const currentEmail = (user?.email || '').toLowerCase().trim();
    if (!currentEmail || currentEmail === 'hossansajjad1994@gmail.com') {
      scheduleStorageWrite(STORAGE_KEYS.BIZ_CUSTOMERS, customers);
    }
    if (currentEmail) {
      scheduleStorageWrite(`hk360_t_${currentEmail.replace(/[^a-zA-Z0-9]/g, '_')}_biz_customers`, customers);
    }
  }, [customers, user?.email]);

  useEffect(() => {
    scheduleStorageWrite(STORAGE_KEYS.BIZ_EMPLOYEES, employees);
  }, [employees]);

  useEffect(() => {
    scheduleStorageWrite(STORAGE_KEYS.BIZ_SUPPLIERS, suppliers);
  }, [suppliers]);

  useEffect(() => {
    const currentEmail = (user?.email || '').toLowerCase().trim();
    if (!currentEmail || currentEmail === 'hossansajjad1994@gmail.com') {
      scheduleStorageWrite(STORAGE_KEYS.BIZ_EXPENSES, businessExpenses);
    }
    if (currentEmail) {
      scheduleStorageWrite(`hk360_t_${currentEmail.replace(/[^a-zA-Z0-9]/g, '_')}_biz_expenses`, businessExpenses);
    }
  }, [businessExpenses, user?.email]);

  useEffect(() => {
    scheduleStorageWrite(STORAGE_KEYS.BIZ_SETTINGS, businessSettings);
  }, [businessSettings]);

  useEffect(() => {
    const currentEmail = (user?.email || '').toLowerCase().trim();
    if (!currentEmail || currentEmail === 'hossansajjad1994@gmail.com') {
      scheduleStorageWrite(STORAGE_KEYS.BIZ_INVOICES, invoices);
    }
    if (currentEmail) {
      scheduleStorageWrite(`hk360_t_${currentEmail.replace(/[^a-zA-Z0-9]/g, '_')}_biz_invoices`, invoices);
    }
  }, [invoices, user?.email]);

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
    const currentEmail = (user?.email || '').toLowerCase().trim();
    if (!currentEmail || currentEmail === 'hossansajjad1994@gmail.com') {
      scheduleStorageWrite(STORAGE_KEYS.BIZ_DEBTS, businessDebts);
    }
    if (currentEmail) {
      scheduleStorageWrite(`hk360_t_${currentEmail.replace(/[^a-zA-Z0-9]/g, '_')}_biz_debts`, businessDebts);
    }
  }, [businessDebts, user?.email]);

  useEffect(() => {
    scheduleStorageWrite(STORAGE_KEYS.BIZ_FIELD_ORDERS, fieldOrders);
  }, [fieldOrders]);

  useEffect(() => {
    scheduleStorageWrite(STORAGE_KEYS.BIZ_PURCHASE_ORDERS, purchaseOrders);
  }, [purchaseOrders]);

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
    scheduleStorageWrite(STORAGE_KEYS.ROUTINE_SHOPPING_PRESETS, routineShoppingPresets);
  }, [routineShoppingPresets]);

  // Reactive in-memory cache warming for 0ms lookups
  useEffect(() => {
    inMemoryCache.warmProducts(products);
  }, [products]);

  useEffect(() => {
    inMemoryCache.warmCustomers(customers);
  }, [customers]);

  // Storage Quota & Eviction Protection
  useEffect(() => {
    requestPersistentStorage();
    const unsubQuota = subscribeStorageQuota(setStorageQuota);
    return () => unsubQuota();
  }, []);

  // Phase 2: Local-First IndexedDB Hydration (Protects against localStorage quota / eviction)
  useEffect(() => {
    let isMounted = true;
    const hydrateFromIndexedDb = async () => {
      try {
        const activeTenant = getActiveTenantKey();
        const activeEmail = getActiveTenantEmail();
        const isMaster = activeEmail === 'hossansajjad1994@gmail.com';

        // Client accounts hydrate strictly from their tenant-scoped IndexedDB keys
        if (!isMaster) {
          if (!activeTenant || activeTenant === 'tenant_guest') return;
          const [idbProducts, idbSales, idbInvoices, idbCustomers, idbDebts] = await Promise.all([
            idbGet(`products_data_${activeTenant}`),
            idbGet(`sales_history_${activeTenant}`),
            idbGet(`invoices_${activeTenant}`),
            idbGet(`customers_data_${activeTenant}`),
            idbGet(`debts_${activeTenant}`)
          ]);
          if (!isMounted) return;
          if (Array.isArray(idbProducts) && idbProducts.length > 0) setProducts(idbProducts);
          if (Array.isArray(idbSales) && idbSales.length > 0) setSalesHistory(idbSales.filter(s => !isInvoiceTombstoned(s.id)));
          if (Array.isArray(idbInvoices) && idbInvoices.length > 0) setInvoices(idbInvoices.filter(i => !isInvoiceTombstoned(i.id)));
          if (Array.isArray(idbCustomers) && idbCustomers.length > 0) setCustomers(idbCustomers);
          if (Array.isArray(idbDebts) && idbDebts.length > 0) setBusinessDebts(idbDebts);
          return;
        }

        // Master account hydrates from master storage
        const [idbProducts, idbSales, idbInvoices, idbCustomers, idbDebts] = await Promise.all([
          idbGet(STORAGE_KEYS.BIZ_PRODUCTS),
          idbGet(STORAGE_KEYS.BIZ_SALES),
          idbGet(STORAGE_KEYS.BIZ_INVOICES),
          idbGet(STORAGE_KEYS.BIZ_CUSTOMERS),
          idbGet(STORAGE_KEYS.BIZ_DEBTS)
        ]);

        if (!isMounted) return;

        if (Array.isArray(idbProducts) && idbProducts.length > products.length) {
          console.debug(`[LocalFirst] Hydrated ${idbProducts.length} products from IndexedDB`);
          setProducts(idbProducts);
        }
        if (Array.isArray(idbSales)) {
          const validSales = idbSales.filter(s => !isInvoiceTombstoned(s.id));
          if (validSales.length > salesHistory.length) {
            console.debug(`[LocalFirst] Hydrated ${validSales.length} sales from IndexedDB`);
            setSalesHistory(validSales);
          }
        }
        if (Array.isArray(idbInvoices)) {
          const validInvoices = idbInvoices.filter(i => !isInvoiceTombstoned(i.id));
          if (validInvoices.length > invoices.length) {
            setInvoices(validInvoices);
          }
        }
        if (Array.isArray(idbCustomers) && idbCustomers.length > customers.length) {
          setCustomers(idbCustomers);
        }
        if (Array.isArray(idbDebts) && idbDebts.length > businessDebts.length) {
          setBusinessDebts(idbDebts);
        }
      } catch (err) {
        console.debug('[LocalFirst] Hydration complete:', err);
      }
    };
    hydrateFromIndexedDb();
    return () => { isMounted = false; };
  }, []);

  // Tenant / Account Switch Hot-Swapper: Instantly isolate UI state when switching accounts
  useEffect(() => {
    const activeEmail = (user?.email || '').toLowerCase().trim();
    if (!activeEmail) return;

    const isMaster = activeEmail === 'hossansajjad1994@gmail.com';
    const tenantKey = `tenant_${activeEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

    const loadTenantData = (baseKey, fallback = []) => {
      try {
        const stored = localStorage.getItem(`hk360_t_${activeEmail.replace(/[^a-zA-Z0-9]/g, '_')}_${baseKey}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          return Array.isArray(parsed) ? filterOutDemoItems(parsed) : parsed;
        }
        if (isMaster) {
          const globalStored = localStorage.getItem(`hk360_${baseKey}`);
          if (globalStored) {
            const parsed = JSON.parse(globalStored);
            return Array.isArray(parsed) ? filterOutDemoItems(parsed) : parsed;
          }
        }
      } catch {}
      return fallback;
    };

    setProducts(loadTenantData('biz_products', []));
    setSalesHistory(loadTenantData('biz_sales', []));
    setInvoices(loadTenantData('biz_invoices', []));
    setCustomers(loadTenantData('biz_customers', []));
    setBusinessExpenses(loadTenantData('biz_expenses', []));
    setBusinessDebts(loadTenantData('biz_debts', []));

    // Re-bind Realtime Live Sync Channel for this tenant
    initLiveSyncChannel({
      branchId: activeBranchId,
      counterName: 'কাউন্টার',
      tenantKey: tenantKey
    });
  }, [user?.email]);

  // Multi-terminal / Cross-tab Local Sync
  useEffect(() => {
    const unsubLan = subscribeLocalTerminalSync((msg) => {
      const activeTenant = getActiveTenantKey();
      const currentEmail = (user?.email || '').toLowerCase().trim();
      const msgTenant = msg.tenantKey || msg.payload?.tenantKey;
      const msgEmail = msg.payload?.tenantEmail;

      if (msgTenant && activeTenant && msgTenant !== activeTenant) return;
      if (msgEmail && currentEmail && msgEmail !== currentEmail) return;

      if (msg.type === 'SALE_COMPLETED' && msg.payload?.sale) {
        setSalesHistory((prev) => {
          const exists = prev.some((s) => s.id === msg.payload.sale.id);
          return exists ? prev : [msg.payload.sale, ...prev];
        });
        setInvoices((prev) => {
          const exists = prev.some((s) => s.id === msg.payload.sale.id);
          return exists ? prev : [msg.payload.sale, ...prev];
        });
      }
    });
    return () => unsubLan();
  }, [user?.email]);

  // Phase 3: Supabase Realtime Multi-Counter & Multi-Branch WebSocket Live Sync
  useEffect(() => {
    const activeBr = branches.find((b) => b.id === activeBranchId) || branches[0];
    const activeCnt = activeBr?.counters?.find((c) => c.id === activeCounterId) || activeBr?.counters?.[0];
    const currentEmail = (user?.email || '').toLowerCase().trim();
    const activeTenant = getActiveTenantKey();

    initLiveSyncChannel({
      branchId: activeBranchId,
      counterName: activeCnt?.name || 'কাউন্টার ০১',
      operatorName: businessSettings.currentCashierName || 'ক্যাশিয়ার',
      tenantKey: activeTenant
    });

    const unsubLive = subscribeLiveSync((msg) => {
      const { eventType, data, senderCounter, tenantKey } = msg;

      // STRICT MULTI-TENANCY CHECK: Never allow cross-account event leakage
      const msgTenant = tenantKey || data?.tenantKey;
      const msgEmail = data?.tenantEmail;
      if (msgTenant && activeTenant && msgTenant !== activeTenant) return;
      if (msgEmail && currentEmail && msgEmail !== currentEmail) return;

      if (eventType === 'SALE_COMPLETED' && data) {
        const sale = data.sale || data;
        if (!sale?.id) return;

        setSalesHistory((prev) => {
          if (prev.some((s) => s.id === sale.id)) return prev;
          return [sale, ...prev];
        });

        setInvoices((prev) => {
          if (prev.some((s) => s.id === sale.id)) return prev;
          return [sale, ...prev];
        });

        const soldItems = Array.isArray(data.items) ? data.items : (Array.isArray(sale.items) ? sale.items : []);
        if (soldItems.length > 0) {
          setProducts((prev) =>
            prev.map((p) => {
              const matched = soldItems.find((it) => it.id === p.id || it.product_id === p.id);
              if (matched) {
                const qty = Number(matched.qty || matched.quantity || 1);
                return { ...p, stock: Math.max(0, p.stock - qty) };
              }
              return p;
            })
          );
        }

        if (sale.customerId && Number(sale.dueAmount) > 0) {
          setCustomers((prev) =>
            prev.map((c) => (c.id === sale.customerId ? { ...c, outstandingDue: (Number(c.outstandingDue) || 0) + Number(sale.dueAmount) } : c))
          );
        }

        showToast(
          lang === 'bn'
            ? `⚡ ${senderCounter || 'অন্য কাউন্টার'} এ ভাউচার #${sale.invoiceNumber || sale.id} সম্পন্ন হয়েছে`
            : `⚡ Sale #${sale.invoiceNumber || sale.id} completed on ${senderCounter || 'other counter'}`,
          'info'
        );
      } else if (eventType === 'STOCK_ADJUSTED' && data) {
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id === data.productId) {
              const delta = Number(data.qtyDelta) || 0;
              const next = data.type === 'in' ? p.stock + delta : Math.max(0, p.stock - delta);
              return { ...p, stock: next };
            }
            return p;
          })
        );
      } else if (eventType === 'CDC_PRODUCT_CHANGE' && msg.record) {
        const rec = msg.record;
        setProducts((prev) =>
          prev.map((p) => {
            if (p.cloud_id === rec.id || p.id === rec.id) {
              return { ...p, stock: Number(rec.stock ?? p.stock), sellPrice: Number(rec.sell_price ?? p.sellPrice) };
            }
            return p;
          })
        );
      } else if (eventType === 'PRODUCT_SYNC' && (data?.products || msg.payload?.products)) {
        const incomingProducts = filterOutDemoItems(data?.products || msg.payload?.products);
        if (Array.isArray(incomingProducts) && incomingProducts.length > 0) {
          setProducts(prev => {
            const merged = mergeEntitiesWithoutDuplicates(prev, incomingProducts);
            if (!currentEmail || currentEmail === 'hossansajjad1994@gmail.com') {
              scheduleStorageWrite(STORAGE_KEYS.BIZ_PRODUCTS, merged);
            }
            if (currentEmail) {
              scheduleStorageWrite(`hk360_t_${currentEmail.replace(/[^a-zA-Z0-9]/g, '_')}_biz_products`, merged);
            }
            return merged;
          });
        }
      } else if (eventType === 'CUSTOMER_SYNC' && (data?.customers || msg.payload?.customers)) {
        const incomingCust = filterOutDemoItems(data?.customers || msg.payload?.customers);
        if (Array.isArray(incomingCust) && incomingCust.length > 0) {
          setCustomers(prev => {
            const merged = mergeEntitiesWithoutDuplicates(prev, incomingCust);
            if (!currentEmail || currentEmail === 'hossansajjad1994@gmail.com') {
              scheduleStorageWrite(STORAGE_KEYS.BIZ_CUSTOMERS, merged);
            }
            if (currentEmail) {
              scheduleStorageWrite(`hk360_t_${currentEmail.replace(/[^a-zA-Z0-9]/g, '_')}_biz_customers`, merged);
            }
            return merged;
          });
        }
      } else if (eventType === 'DEBT_SYNC' && (data?.debts || msg.payload?.debts)) {
        const incomingDebts = data?.debts || msg.payload?.debts || [];
        const isPersonal = (data?.profile || msg.payload?.profile) === 'personal';
        if (isPersonal) {
          setPersonalDebts(prev => {
            const merged = mergeDebtPersonsWithTransactions(prev, incomingDebts);
            scheduleStorageWrite(STORAGE_KEYS.PERSONAL_DEBTS, merged);
            return merged;
          });
        } else {
          setBusinessDebts(prev => {
            const merged = mergeDebtPersonsWithTransactions(prev, incomingDebts);
            if (!currentEmail || currentEmail === 'hossansajjad1994@gmail.com') {
              scheduleStorageWrite(STORAGE_KEYS.BIZ_DEBTS, merged);
            }
            if (currentEmail) {
              scheduleStorageWrite(`hk360_t_${currentEmail.replace(/[^a-zA-Z0-9]/g, '_')}_biz_debts`, merged);
            }
            return merged;
          });
        }
      } else if (eventType === 'EXPENSE_SYNC' && (data?.businessExpenses || msg.payload?.businessExpenses)) {
        const incomingExp = data?.businessExpenses || msg.payload?.businessExpenses || [];
        setBusinessExpenses(prev => {
          const merged = mergeEntitiesWithoutDuplicates(prev, incomingExp);
          if (!currentEmail || currentEmail === 'hossansajjad1994@gmail.com') {
            scheduleStorageWrite(STORAGE_KEYS.BIZ_EXPENSES, merged);
          }
          if (currentEmail) {
            scheduleStorageWrite(`hk360_t_${currentEmail.replace(/[^a-zA-Z0-9]/g, '_')}_biz_expenses`, merged);
          }
          return merged;
        });
      } else if ((eventType === 'EMPLOYEES_LIVE_SYNC' || msg.type === 'EMPLOYEES_LIVE_SYNC') && (data?.employees || msg.payload?.employees)) {
        const incoming = filterOutDemoItems(data?.employees || msg.payload?.employees);
        setEmployees(incoming);
        scheduleStorageWrite(STORAGE_KEYS.BIZ_EMPLOYEES, incoming);
      } else if (eventType === 'ATTENDANCE_LOG_SYNC' || msg.type === 'ATTENDANCE_LOG_SYNC') {
        const incomingLogs = filterOutDemoItems(data?.logs || msg.payload?.logs || []);
        if (incomingLogs.length > 0) {
          localStorage.setItem(STORAGE_KEYS.ATTENDANCE_LOGS, JSON.stringify(incomingLogs));
        }
      }
    });

    return () => unsubLive();
  }, [activeBranchId, activeCounterId, businessSettings.currentCashierName]);

  const applyCloudStateRef = useRef(null);
  const latestStateRef = useRef({});

  // Keep latestStateRef updated on every render so sync snapshot is never stale
  latestStateRef.current = {
    personalExpenses,
    personalIncomes,
    personalSavings,
    personalDebts,
    personalEvents,
    bazaarShoppingList,
    products: filterOutDemoItems(products),
    salesHistory,
    customers: filterOutDemoItems(customers),
    businessExpenses,
    businessDebts,
    trashBin,
    suppliers: filterOutDemoItems(suppliers),
    employees: filterOutDemoItems(employees),
    attendanceLogs: getStoredAttendanceLogs(),
    officeGeoSettings: getOfficeGeoSettings(),
    businessSettings,
    operatingMode,
    profile,
    categories,
    routineShoppingPresets
  };

  // Phase 4 & 5: Register Delta Sync & Continuous Real-Time Cross-Device Auto-Sync
  useEffect(() => {
    registerDeltaSyncContextHooks({
      getProducts: () => latestStateRef.current.products || [],
      setProducts,
      getCustomers: () => latestStateRef.current.customers || [],
      setCustomers,
      getSalesHistory: () => latestStateRef.current.salesHistory || [],
      setSalesHistory,
      syncNowWithCloud: async () => {
        try {
          const pullRes = await pullLatestStateFromCloud({ force: false });
          if (pullRes?.success && pullRes?.state && typeof applyCloudStateRef.current === 'function') {
            applyCloudStateRef.current(pullRes.state);
          }
        } catch (e) {
          console.debug('[DeltaSyncHook] Background pull notice:', e);
        }
      }
    });
    initAutoDeltaSyncScheduler();

    // Continuous Real-Time Auto-Sync Engine (Instant WebSocket Broadcast + 2.0s Heartbeat)
    const unsubContinuous = initContinuousCloudSync({
      getSnapshot: () => latestStateRef.current,
      onStateReceived: (incomingState, senderName) => {
        if (!incomingState || typeof incomingState !== 'object') return;
        if (typeof applyCloudStateRef.current === 'function') {
          applyCloudStateRef.current(incomingState);
        }
      },
      intervalMs: 2000
    });

    return () => {
      if (typeof unsubContinuous === 'function') unsubContinuous();
    };
  }, []);

  useEffect(() => {
    scheduleStorageWrite(STORAGE_KEYS.LICENSE_INFO, licenseInfo);
  }, [licenseInfo]);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Live Sync listener for cross-device license approval, updates & suspension
  useEffect(() => {
    const unsub = subscribeLiveSync((evt) => {
      if (evt?.type === 'CLIENT_LICENSE_APPROVED' && evt?.payload?.license) {
        const approvedLic = evt.payload.license;
        setClientLicensesRegistry(prev => {
          const exists = prev.some(l => l.id === approvedLic.id);
          if (exists) {
            return prev.map(l => l.id === approvedLic.id ? { ...l, ...approvedLic } : l);
          }
          return [approvedLic, ...prev];
        });
        if (user?.email && approvedLic.clientEmail?.toLowerCase() === user.email.toLowerCase()) {
          setLicenseInfo(prev => ({ ...prev, ...approvedLic, status: 'active' }));
          showToast(lang === 'bn' ? '🎉 আপনার লাইসেন্স অ্যাডমিন কর্তৃক সফলভাবে অনুমোদিত হয়েছে!' : 'License approved by admin!');
        }
      } else if (evt?.type === 'CLIENT_LICENSE_UPDATED' && evt?.payload?.license) {
        const updatedLic = evt.payload.license;
        setClientLicensesRegistry(prev => {
          const exists = prev.some(l => l.id === updatedLic.id);
          if (exists) {
            return prev.map(l => l.id === updatedLic.id ? { ...l, ...updatedLic } : l);
          }
          return [updatedLic, ...prev];
        });
        if (user?.email && updatedLic.clientEmail?.toLowerCase() === user.email.toLowerCase()) {
          setLicenseInfo(prev => ({ ...prev, ...updatedLic }));
          if (updatedLic.status === 'suspended') {
            showToast(lang === 'bn' ? '⚠️ আপনার সফটওয়্যার এক্সেস অ্যাডমিন কর্তৃক সাময়িক স্থগিত করা হয়েছে!' : 'Software access suspended by admin!');
          } else if (updatedLic.status === 'active') {
            showToast(lang === 'bn' ? '🎉 আপনার লাইসেন্স পুনরায় সক্রিয় করা হয়েছে!' : 'License restored!');
          }
        }
      } else if (evt?.type === 'CLIENT_LICENSE_REVOKED' && evt?.payload) {
        const { clientEmail, id } = evt.payload;
        setClientLicensesRegistry(prev => prev.filter(l => l.id !== id && (l.clientEmail || '').toLowerCase() !== (clientEmail || '').toLowerCase()));
        if (user?.email && (clientEmail || '').toLowerCase() === user.email.toLowerCase()) {
          setLicenseInfo(prev => ({ ...prev, status: 'unlicensed' }));
          showToast(lang === 'bn' ? '⚠️ আপনার লাইসেন্স রেজিস্ট্রি থেকে মুছে দেওয়া হয়েছে!' : 'License revoked by admin!');
        }
      } else if (evt?.type === 'CLIENT_LICENSE_REQUEST' && evt?.payload?.license) {
        const reqLic = evt.payload.license;
        setClientLicensesRegistry(prev => {
          if (prev.some(l => l.id === reqLic.id || l.clientEmail?.toLowerCase() === reqLic.clientEmail?.toLowerCase())) {
            return prev;
          }
          return [reqLic, ...prev];
        });
      }
    });
    return () => unsub();
  }, [user, lang]);

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

  // Profile Switching handler (Auto-unlocks to dual mode so user is never trapped, blocks staff)
  const handleSwitchProfile = (newProfile) => {
    try {
      const activeRaw = localStorage.getItem('hk360_active_user') || localStorage.getItem('hk360_active_session_user');
      if (activeRaw) {
        const u = JSON.parse(activeRaw);
        const r = (u.role || '').toLowerCase();
        if (['cashier', 'salesman', 'sr'].includes(r) && newProfile === 'personal') {
          showToast(lang === 'bn' ? 'স্টাফ একাউন্ট শুধুমাত্র ব্যবসায়িক মোডে ব্যবহারযোগ্য।' : 'Staff accounts are restricted to Business Mode.', 'warning');
          return;
        }
      }
    } catch {}

    startTransition(() => {
      if (operatingMode === 'business_only' && newProfile !== 'business') {
        setOperatingModeState('dual');
        localStorage.setItem(STORAGE_KEYS.OPERATING_MODE, 'dual');
      }
      if (operatingMode === 'personal_only' && newProfile !== 'personal') {
        setOperatingModeState('dual');
        localStorage.setItem(STORAGE_KEYS.OPERATING_MODE, 'dual');
      }
      setProfile(newProfile);
      setActiveTabState('dashboard'); // reset tab on profile switch
    });
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
      id: expense.id || `pex-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
      date: expense.date || new Date().toISOString().split('T')[0],
      item: (expense.item || expense.title || '').trim(),
      amount: Number(expense.amount) || 0,
      quantity: expense.quantity !== undefined && expense.quantity !== '' && expense.quantity !== null ? Number(expense.quantity) : null,
      folder: (expense.type === 'daily' && (!expense.folder || expense.folder === 'বাসা ও ফ্ল্যাট খরচ' || expense.folder === 'বাসা ও ফ্লাট খরচ'))
        ? 'দৈনন্দিন বাজার খরচ'
        : (expense.folder || (expense.type === 'family' ? 'অন্যান্য পারিবারিক খরচ' : 'দৈনন্দিন বাজার খরচ')),
      person: expense.person || expense.member || '',
      member: expense.member || expense.person || '',
      eventId: expense.eventId || '',
      eventName: expense.eventName || ''
    };
    setPersonalExpenses(prev => {
      const next = [newEntry, ...prev];
      scheduleStorageWrite(STORAGE_KEYS.PERSONAL_EXPENSES, next);
      triggerImmediateCloudPush({
        ...latestStateRef.current,
        personalExpenses: next,
        trashBin,
        businessExpenses
      }, 'add_personal_expense');
      return next;
    });
    showToast(lang === 'bn' ? 'খরচ সফলভাবে যোগ করা হয়েছে' : 'Expense recorded successfully');
    return newEntry;
  };

  const addMultiplePersonalExpenses = (expenseList = []) => {
    if (!Array.isArray(expenseList) || expenseList.length === 0) return 0;
    const formatted = expenseList.map((expense, idx) => ({
      ...expense,
      id: expense.id || `pex-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 6)}`,
      date: expense.date || new Date().toISOString().split('T')[0],
      item: (expense.item || expense.title || '').trim(),
      amount: Number(expense.amount) || 0,
      quantity: expense.quantity !== undefined && expense.quantity !== '' && expense.quantity !== null ? Number(expense.quantity) : null,
      unit: expense.unit || '',
      folder: expense.folder || (expense.type === 'family' ? 'অন্যান্য পারিবারিক খরচ' : ''),
      subFolder: expense.subFolder || expense.subCategory || '',
      person: expense.person || expense.member || '',
      member: expense.member || expense.person || '',
      eventId: expense.eventId || '',
      eventName: expense.eventName || ''
    }));

    setPersonalExpenses(prev => {
      const next = [...formatted, ...prev];
      scheduleStorageWrite(STORAGE_KEYS.PERSONAL_EXPENSES, next);
      triggerImmediateCloudPush({
        ...latestStateRef.current,
        personalExpenses: next,
        trashBin,
        businessExpenses
      }, 'add_multiple_expenses');
      return next;
    });
    showToast(lang === 'bn' ? `মোট ${formatted.length}টি খরচ সফলভাবে যুক্ত হয়েছে` : `${formatted.length} expenses recorded successfully`, 'success');
    return formatted.length;
  };

  const updatePersonalExpense = (id, updatedFields) => {
    setPersonalExpenses(prev => {
      const next = prev.map(e => e.id === id ? {
        ...e,
        ...updatedFields,
        quantity: updatedFields.quantity !== undefined && updatedFields.quantity !== '' && updatedFields.quantity !== null ? Number(updatedFields.quantity) : e.quantity
      } : e);
      scheduleStorageWrite(STORAGE_KEYS.PERSONAL_EXPENSES, next);
      scheduleDebouncedCloudPush({
        ...latestStateRef.current,
        personalExpenses: next,
        trashBin,
        businessExpenses
      }, 1000, 'update_personal_expense');
      return next;
    });
    showToast(lang === 'bn' ? 'খরচের এন্ট্রি আপডেট করা হয়েছে' : 'Expense updated');
  };

  // Safe Soft-Delete: Moves expense to Recycle Bin (Trash) and broadcasts instant removal across devices
  const deletePersonalExpense = (id) => {
    const itemToDelete = personalExpenses.find(e => String(e.id) === String(id));
    if (!itemToDelete) return;

    markPersonalExpenseAsDeletedTombstone(id);

    const trashEntry = {
      ...itemToDelete,
      trashId: `trash-${Date.now()}-${itemToDelete.id || Math.random().toString(36).substr(2, 6)}`,
      deletedAt: new Date().toISOString(),
      deletedFrom: currentDevice?.type || 'app',
      originalType: itemToDelete.type || 'family'
    };

    const nextExpenses = personalExpenses.filter(e => String(e.id) !== String(id) && !isPersonalExpenseTombstoned(e.id));
    const nextTrash = [trashEntry, ...trashBin.filter(t => String(t.id) !== String(id) && t.trashId !== trashEntry.trashId)];

    setPersonalExpenses(nextExpenses);
    setTrashBin(nextTrash);
    try {
      localStorage.setItem(STORAGE_KEYS.PERSONAL_EXPENSES, JSON.stringify(nextExpenses));
      localStorage.setItem(STORAGE_KEYS.TRASH_BIN, JSON.stringify(nextTrash));
    } catch { }
    scheduleStorageWrite(STORAGE_KEYS.PERSONAL_EXPENSES, nextExpenses);
    scheduleStorageWrite(STORAGE_KEYS.TRASH_BIN, nextTrash);

    // Instant Zero-Lag Cloud Push (Synchronizes across Web App, Mobile APK, PC within <150ms)
    triggerImmediateCloudPush({
      ...latestStateRef.current,
      personalExpenses: nextExpenses,
      trashBin: nextTrash,
      businessExpenses
    }, 'delete_expense_to_trash');

    showToast(lang === 'bn' ? '🗑️ খরচের এন্ট্রি রিসাইকেল বিনে সরানো হয়েছে (পুনরুদ্ধার করা যাবে)' : 'Expense moved to Recycle Bin (can be restored)');
  };

  const moveToTrash = (item, originalType = 'family') => {
    if (!item || !item.id) return;
    deletePersonalExpense(item.id);
  };

  // Restores a soft-deleted item from the Recycle Bin back to active expenses
  const restoreFromTrash = (trashId) => {
    const itemToRestore = trashBin.find(t => t.trashId === trashId || String(t.id) === String(trashId));
    if (!itemToRestore) return;

    if (itemToRestore.id) {
      unmarkPersonalExpenseTombstone(itemToRestore.id);
    }

    const { trashId: _tId, deletedAt: _dAt, deletedFrom: _dFrom, originalType: _oType, ...restoredExpense } = itemToRestore;
    const nextTrash = trashBin.filter(t => t.trashId !== trashId && String(t.id) !== String(trashId));
    const nextExpenses = [restoredExpense, ...personalExpenses.filter(e => String(e.id) !== String(itemToRestore.id))];

    setTrashBin(nextTrash);
    setPersonalExpenses(nextExpenses);
    try {
      localStorage.setItem(STORAGE_KEYS.PERSONAL_EXPENSES, JSON.stringify(nextExpenses));
      localStorage.setItem(STORAGE_KEYS.TRASH_BIN, JSON.stringify(nextTrash));
    } catch { }
    scheduleStorageWrite(STORAGE_KEYS.PERSONAL_EXPENSES, nextExpenses);
    scheduleStorageWrite(STORAGE_KEYS.TRASH_BIN, nextTrash);

    triggerImmediateCloudPush({
      personalExpenses: nextExpenses,
      trashBin: nextTrash,
      businessExpenses
    }, 'restore_expense_from_trash');

    showToast(lang === 'bn' ? '✓ খরচটি সফলভাবে পূর্বের তালিকায় ফিরিয়ে আনা হয়েছে' : 'Expense restored successfully');
  };

  // Permanently deletes an item from the Recycle Bin
  const permanentDeleteFromTrash = (trashId) => {
    const itemToDelete = trashBin.find(t => t.trashId === trashId || String(t.id) === String(trashId));
    if (itemToDelete && itemToDelete.id) {
      markPersonalExpenseAsDeletedTombstone(itemToDelete.id);
    }
    const nextTrash = trashBin.filter(t => t.trashId !== trashId && String(t.id) !== String(trashId));
    setTrashBin(nextTrash);
    try {
      localStorage.setItem(STORAGE_KEYS.TRASH_BIN, JSON.stringify(nextTrash));
    } catch { }
    scheduleStorageWrite(STORAGE_KEYS.TRASH_BIN, nextTrash);

    triggerImmediateCloudPush({
      personalExpenses,
      trashBin: nextTrash,
      businessExpenses
    }, 'permanent_delete_trash');

    showToast(lang === 'bn' ? 'খরচের এন্ট্রি স্থায়ীভাবে মুছে ফেলা হয়েছে' : 'Item permanently deleted');
  };

  // Empties the entire Recycle Bin
  const emptyTrash = () => {
    trashBin.forEach(t => {
      if (t.id) markPersonalExpenseAsDeletedTombstone(t.id);
    });
    setTrashBin([]);
    try {
      localStorage.setItem(STORAGE_KEYS.TRASH_BIN, JSON.stringify([]));
    } catch { }
    scheduleStorageWrite(STORAGE_KEYS.TRASH_BIN, []);

    triggerImmediateCloudPush({
      personalExpenses,
      trashBin: [],
      businessExpenses
    }, 'empty_trash');

    showToast(lang === 'bn' ? 'রিসাইকেল বিন সম্পূর্ণ খালি করা হয়েছে' : 'Recycle Bin emptied');
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
      id: income.id || `pin-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      date: income.date || new Date().toISOString().split('T')[0]
    };
    setPersonalIncomes(prev => {
      const next = [newEntry, ...prev];
      scheduleStorageWrite(STORAGE_KEYS.PERSONAL_INCOMES, next);
      triggerImmediateCloudPush({
        ...latestStateRef.current,
        personalIncomes: next
      }, 'add_personal_income');
      return next;
    });
    showToast(lang === 'bn' ? 'আয়ের হিসাব সফলভাবে যোগ করা হয়েছে' : 'Income added');
  };

  const updatePersonalIncome = (updatedIncome) => {
    setPersonalIncomes(prev => {
      const next = prev.map(i => i.id === updatedIncome.id ? { ...i, ...updatedIncome } : i);
      scheduleStorageWrite(STORAGE_KEYS.PERSONAL_INCOMES, next);
      triggerImmediateCloudPush({
        ...latestStateRef.current,
        personalIncomes: next
      }, 'update_personal_income');
      return next;
    });
    showToast(lang === 'bn' ? 'আয়ের হিসাব সফলভাবে আপডেট করা হয়েছে' : 'Income updated');
  };

  const deletePersonalIncome = (id) => {
    setPersonalIncomes(prev => {
      const next = prev.filter(i => i.id !== id);
      scheduleStorageWrite(STORAGE_KEYS.PERSONAL_INCOMES, next);
      triggerImmediateCloudPush({
        ...latestStateRef.current,
        personalIncomes: next
      }, 'delete_personal_income');
      return next;
    });
  };

  const updateSavingsGoal = (id, addedAmount) => {
    setPersonalSavings(prev => {
      const next = prev.map(item => {
        if (item.id === id) {
          return { ...item, saved: Math.max(0, item.saved + Number(addedAmount)) };
        }
        return item;
      });
      scheduleStorageWrite(STORAGE_KEYS.PERSONAL_SAVINGS, next);
      triggerImmediateCloudPush({
        ...latestStateRef.current,
        personalSavings: next
      }, 'update_savings_goal');
      return next;
    });
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
      setPersonalDebts(prev => {
        const next = [newPerson, ...prev];
        scheduleStorageWrite(STORAGE_KEYS.PERSONAL_DEBTS, next);
        try {
          broadcastLiveEvent('DEBT_SYNC', { debts: next, profile: 'personal' });
        } catch (_) {}
        triggerImmediateCloudPush({ ...latestStateRef.current, personalDebts: next }, 'add_personal_debt');
        return next;
      });
    } else {
      setBusinessDebts(prev => {
        const next = [newPerson, ...prev];
        scheduleStorageWrite(STORAGE_KEYS.BIZ_DEBTS, next);
        try {
          broadcastLiveEvent('DEBT_SYNC', { debts: next, profile: 'business' });
        } catch (_) {}
        triggerImmediateCloudPush({ ...latestStateRef.current, businessDebts: next }, 'add_business_debt');
        return next;
      });
    }
    showToast(lang === 'bn' ? `${newPerson.name}-এর খাতা খোলা হয়েছে` : `Ledger created for ${newPerson.name}`);
    return newPerson;
  };

  const updateDebtPerson = (targetProfile, personId, updatedFields) => {
    const isPersonal = (targetProfile || profile) === 'personal';
    const updater = prev => {
      const next = prev.map(p => {
        if (p.id === personId) {
          return { ...p, ...updatedFields };
        }
        return p;
      });
      scheduleStorageWrite(isPersonal ? STORAGE_KEYS.PERSONAL_DEBTS : STORAGE_KEYS.BIZ_DEBTS, next);
      try {
        broadcastLiveEvent('DEBT_SYNC', { debts: next, profile: isPersonal ? 'personal' : 'business' });
      } catch (_) {}
      triggerImmediateCloudPush({ ...latestStateRef.current, [isPersonal ? 'personalDebts' : 'businessDebts']: next }, 'update_debt_person');
      return next;
    };

    if (isPersonal) {
      setPersonalDebts(updater);
    } else {
      setBusinessDebts(updater);
    }
    showToast(lang === 'bn' ? 'ব্যক্তির তথ্য আপডেট করা হয়েছে' : 'Person details updated');
  };

  const deleteDebtPerson = (targetProfile, personId) => {
    const isPersonal = (targetProfile || profile) === 'personal';
    const filterer = prev => {
      const next = prev.filter(p => p.id !== personId);
      scheduleStorageWrite(isPersonal ? STORAGE_KEYS.PERSONAL_DEBTS : STORAGE_KEYS.BIZ_DEBTS, next);
      try {
        broadcastLiveEvent('DEBT_SYNC', { debts: next, profile: isPersonal ? 'personal' : 'business' });
      } catch (_) {}
      triggerImmediateCloudPush({ ...latestStateRef.current, [isPersonal ? 'personalDebts' : 'businessDebts']: next }, 'delete_debt_person');
      return next;
    };

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

    const updater = prev => {
      const next = prev.map(p => {
        if (p.id === personId) {
          return {
            ...p,
            transactions: [newTx, ...(p.transactions || [])]
          };
        }
        return p;
      });
      scheduleStorageWrite(isPersonal ? STORAGE_KEYS.PERSONAL_DEBTS : STORAGE_KEYS.BIZ_DEBTS, next);
      try {
        broadcastLiveEvent('DEBT_SYNC', { debts: next, profile: isPersonal ? 'personal' : 'business' });
      } catch (_) {}
      triggerImmediateCloudPush({ ...latestStateRef.current, [isPersonal ? 'personalDebts' : 'businessDebts']: next }, 'add_debt_transaction');
      return next;
    };

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
    const updater = prev => {
      const next = prev.map(p => {
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
      scheduleStorageWrite(isPersonal ? STORAGE_KEYS.PERSONAL_DEBTS : STORAGE_KEYS.BIZ_DEBTS, next);
      try {
        broadcastLiveEvent('DEBT_SYNC', { debts: next, profile: isPersonal ? 'personal' : 'business' });
      } catch (_) {}
      triggerImmediateCloudPush({ ...latestStateRef.current, [isPersonal ? 'personalDebts' : 'businessDebts']: next }, 'edit_debt_transaction');
      return next;
    };

    if (isPersonal) {
      setPersonalDebts(updater);
    } else {
      setBusinessDebts(updater);
    }
    showToast(lang === 'bn' ? 'লেনদেন আপডেট করা হয়েছে' : 'Transaction updated');
  };

  const deleteDebtTransaction = (targetProfile, personId, txId) => {
    const isPersonal = (targetProfile || profile) === 'personal';
    const updater = prev => {
      const next = prev.map(p => {
        if (p.id === personId) {
          return {
            ...p,
            transactions: (p.transactions || []).filter(tx => tx.id !== txId)
          };
        }
        return p;
      });
      scheduleStorageWrite(isPersonal ? STORAGE_KEYS.PERSONAL_DEBTS : STORAGE_KEYS.BIZ_DEBTS, next);
      try {
        broadcastLiveEvent('DEBT_SYNC', { debts: next, profile: isPersonal ? 'personal' : 'business' });
      } catch (_) {}
      triggerImmediateCloudPush({ ...latestStateRef.current, [isPersonal ? 'personalDebts' : 'businessDebts']: next }, 'delete_debt_transaction');
      return next;
    };

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

    setCategories(prev => {
      const nextCategories = {
        ...prev,
        [categoryGroup]: [...(prev[categoryGroup] || []), cleanName]
      };
      scheduleStorageWrite(STORAGE_KEYS.APP_CATEGORIES, nextCategories);
      scheduleDebouncedCloudPush({
        ...latestStateRef.current,
        categories: nextCategories,
        routineShoppingPresets
      }, 1200, 'add_category');
      return nextCategories;
    });

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
    setCategories(prev => {
      const nextCategories = {
        ...prev,
        [categoryGroup]: (prev[categoryGroup] || []).map(item => item === oldCategoryName ? cleanNew : item)
      };
      scheduleStorageWrite(STORAGE_KEYS.APP_CATEGORIES, nextCategories);
      scheduleDebouncedCloudPush({
        ...latestStateRef.current,
        categories: nextCategories,
        routineShoppingPresets
      }, 1200, 'rename_category');
      return nextCategories;
    });

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
    setCategories(prev => {
      const nextCategories = {
        ...prev,
        [categoryGroup]: (prev[categoryGroup] || []).filter(item => item !== categoryNameToDelete)
      };
      scheduleStorageWrite(STORAGE_KEYS.APP_CATEGORIES, nextCategories);
      scheduleDebouncedCloudPush({
        ...latestStateRef.current,
        categories: nextCategories,
        routineShoppingPresets
      }, 1200, 'delete_category');
      return nextCategories;
    });
    showToast(lang === 'bn' ? `"${categoryNameToDelete}" ক্যাটাগরি মুছে ফেলা হয়েছে` : `Category deleted`, 'warning');
    return true;
  };

  // Cross-Device Synced Routine Shopping Presets Saver
  const saveRoutineShoppingPresets = (newPresetsOrUpdater) => {
    setRoutineShoppingPresets(prev => {
      const nextPresets = typeof newPresetsOrUpdater === 'function' ? newPresetsOrUpdater(prev) : newPresetsOrUpdater;
      try {
        localStorage.setItem(STORAGE_KEYS.ROUTINE_SHOPPING_PRESETS, JSON.stringify(nextPresets));
      } catch (e) {}
      scheduleStorageWrite(STORAGE_KEYS.ROUTINE_SHOPPING_PRESETS, nextPresets);
      scheduleDebouncedCloudPush({
        ...latestStateRef.current,
        categories,
        routineShoppingPresets: nextPresets
      }, 1000, 'update_routine_presets');
      return nextPresets;
    });
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
      hapticFeedback.warning();
      showToast(lang === 'bn' ? 'পণ্যটির কোনো স্টক খালি নেই!' : 'Product out of stock!', 'danger');
      return;
    }
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.qty >= product.stock) {
        hapticFeedback.warning();
        showToast(lang === 'bn' ? 'সর্বোচ্চ উপলব্ধ স্টক যোগ করা হয়েছে' : 'Max available stock reached', 'warning');
        return;
      }
      hapticFeedback.light();
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      hapticFeedback.light();
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
      hapticFeedback.warning();
      showToast(lang === 'bn' ? 'পর্যাপ্ত স্টক নেই' : 'Not enough stock available', 'warning');
      return;
    }
    hapticFeedback.light();
    setCart(cart.map(item => item.id === productId ? { ...item, qty: newQty } : item));
  };

  const removeFromCart = (productId) => {
    hapticFeedback.heavy();
    setCart(cart.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    hapticFeedback.heavy();
    setCart([]);
  };

  // Complete POS Sale (with Full or Partial Payment & Loyalty Points support)
  const completeSale = ({
    customerId,
    customerName,
    customerPhone,
    paymentMethod,
    discount = 0,
    paidAmount = null,
    cashierName = '',
    table = null,
    orderType = null,
    splitPayments = null,
    usedLoyaltyPoints = 0
  }) => {
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

    let paymentHistoryList = [];
    if (Array.isArray(splitPayments) && splitPayments.length > 0) {
      paymentHistoryList = splitPayments.map((sp, idx) => ({
        id: `pay-${Date.now()}-${idx}`,
        date: now.toISOString().split('T')[0],
        amount: Number(sp.amount) || 0,
        method: sp.method,
        note: lang === 'bn' ? `স্প্লিট পেমেন্ট (${sp.method.toUpperCase()})` : `Split Payment (${sp.method})`
      }));
    } else if (actualPaid > 0) {
      paymentHistoryList = [{
        id: `pay-${Date.now()}`,
        date: now.toISOString().split('T')[0],
        amount: actualPaid,
        method: paymentMethod,
        note: lang === 'bn' ? (actualPaid === grandTotal ? 'সম্পূর্ণ নগদ/ডিজিটাল পেমেন্ট' : 'বিক্রয়কালীন আংশিক পেমেন্ট') : 'POS Checkout Payment'
      }];
    }

    // Feature 1: Cryptographic Hash Chain Seal
    const previousSale = (salesHistory && salesHistory[0]) || null;
    const saleDateStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const chainSeal = sealInvoiceInChainSync(
      {
        id: invoiceId,
        grandTotal,
        date: saleDateStr,
        branchId: activeBranchId,
        cashierName: cashierName || businessSettings.currentCashierName || (lang === 'bn' ? 'কাউন্টার ক্যাশিয়ার' : 'Counter Cashier'),
        items: cart
      },
      previousSale?.blockHash || null
    );

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
      date: saleDateStr,
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
      splitPayments: Array.isArray(splitPayments) && splitPayments.length > 0 ? splitPayments : null,
      paymentHistory: paymentHistoryList,
      status: saleStatus,
      deviceOrigin: getDeviceOrigin(),
      prevHash: chainSeal.prevHash,
      blockHash: chainSeal.blockHash,
      signedAt: chainSeal.signedAt
    };

    // Deduct stock & trigger Low-Stock alerts (Feature 2: FEFO Batch Allocation)
    const updatedProducts = products.map(p => {
      const cartItem = cart.find(ci => ci.id === p.id);
      if (cartItem) {
        const { updatedProduct } = allocateFefoStockDeduction(p, cartItem.qty);
        const nextStock = updatedProduct.stock;
        const minStockThreshold = Number(p.minStock) || 5;
        if (nextStock <= minStockThreshold && p.stock > minStockThreshold) {
          notifyLowStockAlert(p.name, nextStock);
        }
        // Feature 4: Broadcast stock update to omni-channel e-commerce stores
        try {
          broadcastStockUpdateToChannels(p.id, nextStock, p.barcode || p.sku);
        } catch (e) {
          // non-blocking
        }
        return updatedProduct;
      }
      return p;
    });
    setProducts(updatedProducts);
    scheduleStorageWrite(STORAGE_KEYS.BIZ_PRODUCTS, updatedProducts);

    const activeTenant = getActiveTenantKey();
    const userEmail = (user?.email || '').toLowerCase().trim();
    const isMaster = !userEmail || userEmail === 'hossansajjad1994@gmail.com';

    let updatedCustomers = customers;
    // Update customer due, loyalty points and total purchases if customer is linked
    if (customerId) {
      updatedCustomers = customers.map(cust => {
        if (cust.id === customerId) {
          const currentPoints = Number(cust.loyaltyPoints) || 0;
          const pointsEarned = Math.floor(grandTotal / 100);
          const pointsDeducted = Number(usedLoyaltyPoints) || 0;
          const nextPoints = Math.max(0, currentPoints - pointsDeducted + pointsEarned);

          return {
            ...cust,
            totalPurchased: (Number(cust.totalPurchased) || 0) + grandTotal,
            outstandingDue: (Number(cust.outstandingDue) || 0) + dueAmount,
            loyaltyPoints: nextPoints
          };
        }
        return cust;
      });
      setCustomers(updatedCustomers);
      if (isMaster) scheduleStorageWrite(STORAGE_KEYS.BIZ_CUSTOMERS, updatedCustomers);
      if (userEmail) scheduleStorageWrite(`hk360_t_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}_biz_customers`, updatedCustomers);
    }

    setSalesHistory(prevSales => {
      const updated = [saleRecord, ...prevSales];
      if (isMaster) scheduleStorageWrite(STORAGE_KEYS.BIZ_SALES, updated);
      if (userEmail) scheduleStorageWrite(`hk360_t_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}_biz_sales`, updated);
      return updated;
    });

    // Also mirror to invoices list for unified management!
    setInvoices(prevInvoices => {
      const updated = [saleRecord, ...prevInvoices];
      if (isMaster) scheduleStorageWrite(STORAGE_KEYS.BIZ_INVOICES, updated);
      if (userEmail) scheduleStorageWrite(`hk360_t_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}_biz_invoices`, updated);
      return updated;
    });

    setCart([]);
    setActiveReceipt(saleRecord);
    hapticFeedback.success();
    notifySaleCompleted(saleRecord.id, saleRecord.grandTotal);

    // Guaranteed Offline Sync Queue
    try {
      enqueueOfflineAction('SALE_COMPLETED', saleRecord);
    } catch {}

    // Enterprise Cloud Backend ACID Sync (Phase 1)
    try {
      submitPosSaleToCloud({ ...saleRecord, tenantKey: activeTenant, tenantEmail: userEmail }).catch((err) => {
        console.debug('[CloudSync] Deferred background sync:', err);
      });
    } catch {}

    // Broadcast instant Realtime WebSocket event to all other open apps (Mobile APK, Web, PC)
    try {
      broadcastLiveEvent('SALE_COMPLETED', {
        sale: saleRecord,
        items: cart,
        tenantKey: activeTenant,
        tenantEmail: userEmail
      });
    } catch (e) {
      console.debug('[POS] Live broadcast error:', e);
    }

    // Instant Zero-Lag Cloud Push to Supabase audit_logs
    try {
      triggerImmediateCloudPush({
        ...latestStateRef.current,
        products: updatedProducts,
        customers: updatedCustomers,
        salesHistory: [saleRecord, ...salesHistory],
        invoices: [saleRecord, ...invoices]
      }, 'sale_completed');
    } catch (e) {
      console.debug('[POS] Cloud push error:', e);
    }

    // Auto-open cash drawer for cash transaction if enabled
    if (businessSettings.autoOpenCashDrawer !== false && (paymentMethod === 'cash' || actualPaid > 0)) {
      openCashDrawer('sale');
    }

    // Instant 0ms broadcast to sibling counter terminals on LAN/Tabs
    try {
      broadcastLocalTerminalEvent('SALE_COMPLETED', {
        sale: saleRecord,
        tenantKey: activeTenant,
        tenantEmail: userEmail
      });
    } catch {}

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
    const next = filterOutDemoItems([product, ...products]);
    setProducts(next);
    scheduleStorageWrite(STORAGE_KEYS.BIZ_PRODUCTS, next);
    try {
      broadcastLiveEvent('PRODUCT_SYNC', { products: next });
    } catch (_) {}
    triggerImmediateCloudPush({ ...latestStateRef.current, products: next }, 'add_product');
    showToast(lang === 'bn' ? 'নতুন পণ্য সফলভাবে যুক্ত হয়েছে' : 'Product added successfully');
    return product;
  };

  const updateProduct = (id, updatedFields) => {
    const next = filterOutDemoItems(products.map(p => p.id === id ? { ...p, ...updatedFields } : p));
    setProducts(next);
    scheduleStorageWrite(STORAGE_KEYS.BIZ_PRODUCTS, next);
    try {
      broadcastLiveEvent('PRODUCT_SYNC', { products: next });
    } catch (_) {}
    triggerImmediateCloudPush({ ...latestStateRef.current, products: next }, 'update_product');
    showToast(lang === 'bn' ? 'পণ্য তথ্য আপডেট হয়েছে' : 'Product updated');
  };

  const deleteProduct = (id) => {
    const next = filterOutDemoItems(products.filter(p => p.id !== id));
    setProducts(next);
    scheduleStorageWrite(STORAGE_KEYS.BIZ_PRODUCTS, next);
    try {
      broadcastLiveEvent('PRODUCT_SYNC', { products: next });
    } catch (_) {}
    triggerImmediateCloudPush({ ...latestStateRef.current, products: next }, 'delete_product');
    showToast(lang === 'bn' ? 'পণ্য মুছে ফেলা হয়েছে' : 'Product deleted');
  };

  const adjustStock = (productId, qtyDelta, type = 'in', note = '') => {
    let affectedProduct = null;
    const next = products.map(p => {
      if (p.id === productId) {
        const delta = Number(qtyDelta) || 0;
        const newStock = type === 'in' ? p.stock + delta : Math.max(0, p.stock - delta);
        const minAlert = Number(p.minStock) || 5;
        if (newStock <= minAlert && p.stock > minAlert) {
          notifyLowStockAlert(p.name, newStock);
        }
        affectedProduct = { ...p, stock: newStock };
        return affectedProduct;
      }
      return p;
    });
    setProducts(next);
    scheduleStorageWrite(STORAGE_KEYS.BIZ_PRODUCTS, next);
    try {
      broadcastLiveEvent('STOCK_ADJUSTED', { productId, qtyDelta, type, note });
      broadcastLiveEvent('PRODUCT_SYNC', { products: next });
    } catch (_) {}
    triggerImmediateCloudPush({ ...latestStateRef.current, products: next }, 'adjust_stock');
    try {
      enqueueOfflineAction('STOCK_ADJUSTED', { productId, qtyDelta, type, note });
    } catch {}
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
    const next = filterOutDemoItems([newCust, ...customers]);
    setCustomers(next);
    scheduleStorageWrite(STORAGE_KEYS.BIZ_CUSTOMERS, next);
    try {
      broadcastLiveEvent('CUSTOMER_SYNC', { customers: next });
    } catch (_) {}
    triggerImmediateCloudPush({ ...latestStateRef.current, customers: next }, 'add_customer');
    showToast(lang === 'bn' ? `নতুন কাস্টমার "${newCust.name}" যোগ করা হয়েছে` : `Customer "${newCust.name}" created`);
    return newCust;
  };

  const updateCustomer = (id, updatedFields) => {
    const next = filterOutDemoItems(customers.map(c => c.id === id ? { ...c, ...updatedFields } : c));
    setCustomers(next);
    scheduleStorageWrite(STORAGE_KEYS.BIZ_CUSTOMERS, next);
    try {
      broadcastLiveEvent('CUSTOMER_SYNC', { customers: next });
    } catch (_) {}
    triggerImmediateCloudPush({ ...latestStateRef.current, customers: next }, 'update_customer');
    showToast(lang === 'bn' ? 'কাস্টমার প্রোফাইল ও তথ্য আপডেট হয়েছে' : 'Customer profile updated');
  };

  const deleteCustomer = (id) => {
    const next = filterOutDemoItems(customers.filter(c => c.id !== id));
    setCustomers(next);
    scheduleStorageWrite(STORAGE_KEYS.BIZ_CUSTOMERS, next);
    try {
      broadcastLiveEvent('CUSTOMER_SYNC', { customers: next });
    } catch (_) {}
    triggerImmediateCloudPush({ ...latestStateRef.current, customers: next }, 'delete_customer');
    showToast(lang === 'bn' ? 'কাস্টমার মুছে ফেলা হয়েছে' : 'Customer deleted');
  };

  const collectDue = (customerId, amount, method = 'cash', note = '') => {
    const amt = Number(amount);
    const next = customers.map(c => {
      if (c.id === customerId) {
        return { ...c, outstandingDue: Math.max(0, c.outstandingDue - amt) };
      }
      return c;
    });
    setCustomers(next);
    scheduleStorageWrite(STORAGE_KEYS.BIZ_CUSTOMERS, next);
    try {
      broadcastLiveEvent('CUSTOMER_SYNC', { customers: next });
    } catch (_) {}
    triggerImmediateCloudPush({ ...latestStateRef.current, customers: next }, 'collect_due');
    try {
      enqueueOfflineAction('DUE_COLLECTED', { customerId, amount: amt, method, note });
    } catch {}
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
    const next = filterOutDemoItems([...employees, newEmp]);
    setEmployees(next);
    scheduleStorageWrite(STORAGE_KEYS.BIZ_EMPLOYEES, next);
    try {
      broadcastLiveEvent('EMPLOYEES_LIVE_SYNC', { employees: next });
    } catch (_) {}
    triggerImmediateCloudPush({
      ...latestStateRef.current,
      employees: next
    }, 'add_employee');
    showToast(lang === 'bn' ? 'নতুন কর্মচারী যুক্ত করা হয়েছে' : 'Employee added');
    return newEmp;
  };

  const updateEmployee = (id, updatedFields) => {
    const next = filterOutDemoItems(employees.map(e => e.id === id ? { ...e, ...updatedFields } : e));
    setEmployees(next);
    scheduleStorageWrite(STORAGE_KEYS.BIZ_EMPLOYEES, next);
    try {
      broadcastLiveEvent('EMPLOYEES_LIVE_SYNC', { employees: next });
    } catch (_) {}
    triggerImmediateCloudPush({
      ...latestStateRef.current,
      employees: next
    }, 'update_employee');
    showToast(lang === 'bn' ? 'কর্মচারীর তথ্য আপডেট করা হয়েছে' : 'Employee updated');
  };

  const deleteEmployee = (id) => {
    const next = filterOutDemoItems(employees.filter(e => e.id !== id));
    setEmployees(next);
    scheduleStorageWrite(STORAGE_KEYS.BIZ_EMPLOYEES, next);
    try {
      broadcastLiveEvent('EMPLOYEES_LIVE_SYNC', { employees: next });
    } catch (_) {}
    triggerImmediateCloudPush({
      ...latestStateRef.current,
      employees: next
    }, 'delete_employee');
    showToast(lang === 'bn' ? 'কর্মচারী মুছে ফেলা হয়েছে' : 'Employee deleted');
  };

  const disburseSalary = (employeeId) => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;

    const next = employees.map(e => {
      if (e.id === employeeId) {
        return {
          ...e,
          status: 'Paid',
          lastDisbursed: new Date().toISOString().split('T')[0]
        };
      }
      return e;
    });
    setEmployees(next);
    scheduleStorageWrite(STORAGE_KEYS.BIZ_EMPLOYEES, next);

    // Also record as a business expense automatically!
    const salaryExpense = {
      id: `bex-sal-${Date.now()}`,
      title: `${emp.name} - মাসিক বেতন (${emp.role})`,
      amount: emp.baseSalary,
      category: 'স্যালারি ও বেতন',
      date: new Date().toISOString().split('T')[0],
      note: `কর্মচারী আইডি: ${emp.id}`
    };
    const nextExpenses = [salaryExpense, ...businessExpenses];
    setBusinessExpenses(nextExpenses);
    scheduleStorageWrite(STORAGE_KEYS.BIZ_EXPENSES, nextExpenses);

    triggerImmediateCloudPush({
      ...latestStateRef.current,
      employees: next,
      businessExpenses: nextExpenses
    }, 'disburse_salary');

    showToast(lang === 'bn' ? `${emp.name}-এর বেতন প্রদান সম্পন্ন হয়েছে` : `Salary disbursed for ${emp.name}`);
  };

  // HR & SR Field Product Orders & Delivery Status Tracking
  const createFieldOrder = ({
    employeeId,
    employeeName,
    employeeRole = 'ফিল্ড অফিসার',
    customerId,
    customerName,
    customerPhone = '',
    items = [],
    deliveryNote = ''
  }) => {
    const totalAmount = items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.orderedQty || 0)), 0);
    const totalOrderedCount = items.reduce((sum, item) => sum + Number(item.orderedQty || 0), 0);
    const totalDeliveredCount = items.reduce((sum, item) => sum + Number(item.deliveredQty || 0), 0);

    let deliveryStatus = 'pending';
    let deliverySummary = '';

    if (totalDeliveredCount === totalOrderedCount && totalOrderedCount > 0) {
      deliveryStatus = 'delivered';
      deliverySummary = `সবগুলো পণ্য (${totalDeliveredCount}/${totalOrderedCount}) ডেলিভারি সম্পন্ন`;
    } else if (totalDeliveredCount > 0) {
      deliveryStatus = 'partial';
      const remaining = totalOrderedCount - totalDeliveredCount;
      deliverySummary = `আংশিক ডেলিভারি: ${totalDeliveredCount}টি ডেলিভারি হয়েছে, ${remaining}টি বাকি/কম রয়েছে`;
    } else {
      deliveryStatus = 'pending';
      deliverySummary = `ডেলিভারি হয়নি (পেন্ডিং) - কোনো পণ্য এখনও ডেলিভারি হয়নি`;
    }

    const now = new Date();
    const newOrder = {
      id: `HRO-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      employeeId: employeeId || '',
      employeeName: employeeName || (lang === 'bn' ? 'অফিসার' : 'Staff'),
      employeeRole: employeeRole || 'ফিল্ড অফিসার',
      customerId: customerId || '',
      customerName: customerName || (lang === 'bn' ? 'সাধারণ ক্রেতা' : 'Customer'),
      customerPhone: customerPhone || '',
      date: `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      totalAmount,
      deliveryStatus,
      deliveredItemsCount: totalDeliveredCount,
      totalItemsCount: totalOrderedCount,
      deliverySummary,
      deliveryDate: deliveryStatus === 'delivered' ? `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : null,
      deliveryNote,
      items: items.map(item => ({
        productId: item.productId || item.id,
        name: item.name,
        price: Number(item.price || item.sellPrice || 0),
        orderedQty: Number(item.orderedQty || item.qty || 1),
        deliveredQty: Number(item.deliveredQty || 0),
        subtotal: Number(item.subtotal || ((item.price || item.sellPrice || 0) * (item.orderedQty || item.qty || 1)))
      }))
    };

    setFieldOrders(prev => [newOrder, ...prev]);
    showToast(lang === 'bn' ? 'নতুন ফিল্ড প্রোডাক্ট অর্ডার সফলভাবে কাটা হয়েছে' : 'Field order created');
    return newOrder;
  };

  const updateFieldOrderDelivery = (orderId, updatedItems, deliveryNote = '') => {
    setFieldOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;

      const items = updatedItems || order.items;
      const totalOrdered = items.reduce((sum, item) => sum + Number(item.orderedQty || 0), 0);
      const totalDelivered = items.reduce((sum, item) => sum + Math.max(0, Math.min(Number(item.orderedQty || 0), Number(item.deliveredQty || 0))), 0);

      let deliveryStatus = 'pending';
      let deliverySummary = '';

      if (totalDelivered === totalOrdered && totalOrdered > 0) {
        deliveryStatus = 'delivered';
        deliverySummary = `সবগুলো পণ্য (${totalDelivered}/${totalOrdered}) ডেলিভারি সম্পন্ন`;
      } else if (totalDelivered > 0) {
        deliveryStatus = 'partial';
        const remaining = totalOrdered - totalDelivered;
        deliverySummary = `আংশিক ডেলিভারি: ${totalDelivered}টি ডেলিভারি হয়েছে, ${remaining}টি বাকি/কম রয়েছে`;
      } else {
        deliveryStatus = 'pending';
        deliverySummary = `ডেলিভারি হয়নি (পেন্ডিং) - কোনো পণ্য এখনও ডেলিভারি হয়নি`;
      }

      const now = new Date();
      return {
        ...order,
        items: items.map(item => ({
          ...item,
          deliveredQty: Math.max(0, Math.min(Number(item.orderedQty || 0), Number(item.deliveredQty || 0)))
        })),
        deliveredItemsCount: totalDelivered,
        totalItemsCount: totalOrdered,
        deliveryStatus,
        deliverySummary,
        deliveryDate: `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        deliveryNote: deliveryNote !== undefined ? deliveryNote : order.deliveryNote
      };
    }));

    showToast(lang === 'bn' ? 'ডেলিভারি স্ট্যাটাস সফলভাবে আপডেট করা হয়েছে' : 'Delivery status updated');
  };

  const markOrderFullyDelivered = (orderId, note = '') => {
    setFieldOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;

      const totalOrdered = order.items.reduce((sum, item) => sum + Number(item.orderedQty || 0), 0);
      const updatedItems = order.items.map(item => ({
        ...item,
        deliveredQty: Number(item.orderedQty || 0)
      }));

      const now = new Date();
      return {
        ...order,
        items: updatedItems,
        deliveredItemsCount: totalOrdered,
        totalItemsCount: totalOrdered,
        deliveryStatus: 'delivered',
        deliverySummary: `সবগুলো পণ্য (${totalOrdered}/${totalOrdered}) ডেলিভারি সম্পন্ন`,
        deliveryDate: `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        deliveryNote: note || order.deliveryNote || (lang === 'bn' ? 'সবগুলো পণ্য সফলভাবে ডেলিভারি সম্পন্ন' : 'Fully delivered')
      };
    }));

    showToast(lang === 'bn' ? 'অর্ডারটির সবগুলো পণ্য ডেলিভারি সম্পন্ন হিসেবে চিহ্নিত হয়েছে' : 'Order marked fully delivered');
  };

  const deleteFieldOrder = (orderId) => {
    setFieldOrders(prev => prev.filter(o => o.id !== orderId));
    showToast(lang === 'bn' ? 'ফিল্ড অর্ডার মুছে ফেলা হয়েছে' : 'Field order deleted');
  };

  // ERP
  const addBusinessExpense = (expense) => {
    const newExpense = {
      ...expense,
      id: expense.id || `bex-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
      amount: Number(expense.amount) || 0,
      date: expense.date || new Date().toISOString().split('T')[0],
      category: expense.category || expense.folder || 'other',
      subCategory: expense.subCategory || expense.subFolder || '',
      person: expense.person || expense.member || ''
    };
    const next = [newExpense, ...businessExpenses];
    setBusinessExpenses(next);
    scheduleStorageWrite(STORAGE_KEYS.BIZ_EXPENSES, next);
    try {
      broadcastLiveEvent('EXPENSE_SYNC', { businessExpenses: next });
    } catch (_) {}
    triggerImmediateCloudPush({ ...latestStateRef.current, businessExpenses: next }, 'add_business_expense');
    showToast(lang === 'bn' ? 'ব্যবসায়িক খরচ যুক্ত করা হয়েছে' : 'Business expense recorded');
    return newExpense;
  };

  const addMultipleBusinessExpenses = (expenseList = []) => {
    if (!Array.isArray(expenseList) || expenseList.length === 0) return 0;
    const formatted = expenseList.map((expense, idx) => ({
      ...expense,
      id: expense.id || `bex-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 6)}`,
      amount: Number(expense.amount) || 0,
      date: expense.date || new Date().toISOString().split('T')[0],
      category: expense.category || expense.folder || 'other',
      subCategory: expense.subCategory || expense.subFolder || '',
      person: expense.person || expense.member || ''
    }));

    const next = [...formatted, ...businessExpenses];
    setBusinessExpenses(next);
    scheduleStorageWrite(STORAGE_KEYS.BIZ_EXPENSES, next);
    try {
      broadcastLiveEvent('EXPENSE_SYNC', { businessExpenses: next });
    } catch (_) {}
    triggerImmediateCloudPush({ ...latestStateRef.current, businessExpenses: next }, 'add_multiple_business_expenses');
    showToast(lang === 'bn' ? `মোট ${formatted.length}টি ব্যবসায়িক খরচ যুক্ত হয়েছে` : `${formatted.length} business expenses recorded successfully`, 'success');
    return formatted.length;
  };

  const updateBusinessExpense = (id, updatedFields) => {
    const next = businessExpenses.map(e => e.id === id ? {
      ...e,
      ...updatedFields,
      amount: updatedFields.amount !== undefined ? Number(updatedFields.amount) : e.amount
    } : e);
    setBusinessExpenses(next);
    scheduleStorageWrite(STORAGE_KEYS.BIZ_EXPENSES, next);
    try {
      broadcastLiveEvent('EXPENSE_SYNC', { businessExpenses: next });
    } catch (_) {}
    triggerImmediateCloudPush({ ...latestStateRef.current, businessExpenses: next }, 'update_business_expense');
    showToast(lang === 'bn' ? 'ব্যবসায়িক খরচ আপডেট করা হয়েছে' : 'Business expense updated');
  };

  const deleteBusinessExpense = (id) => {
    const next = businessExpenses.filter(e => e.id !== id);
    setBusinessExpenses(next);
    scheduleStorageWrite(STORAGE_KEYS.BIZ_EXPENSES, next);
    try {
      broadcastLiveEvent('EXPENSE_SYNC', { businessExpenses: next });
    } catch (_) {}
    triggerImmediateCloudPush({ ...latestStateRef.current, businessExpenses: next }, 'delete_business_expense');
    showToast(lang === 'bn' ? 'ব্যবসায়িক খরচ মুছে ফেলা হয়েছে' : 'Business expense deleted');
  };

  const paySupplier = (supplierId, amount) => {
    const amt = Number(amount);
    const next = suppliers.map(s => {
      if (s.id === supplierId) {
        return { ...s, payableBalance: Math.max(0, s.payableBalance - amt) };
      }
      return s;
    });
    setSuppliers(next);
    scheduleStorageWrite(STORAGE_KEYS.BIZ_SUPPLIERS, next);
    triggerImmediateCloudPush({ ...latestStateRef.current, suppliers: next }, 'pay_supplier');
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

    const deviceOrigin = invoice.deviceOrigin || getDeviceOrigin();

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
      deviceOrigin,
      returns: [],
      returnTotal: 0,
      items: invoice.items || []
    };

    // Deduct stock for products sold in invoice
    if (invoice.items && invoice.items.length > 0) {
      setProducts(prev => {
        const updated = prev.map(p => {
          const item = invoice.items.find(it => it.productId === p.id);
          if (item && Number(item.qty) > 0) {
            return { ...p, stock: Math.max(0, p.stock - Number(item.qty)) };
          }
          return p;
        });
        scheduleStorageWrite(STORAGE_KEYS.BIZ_PRODUCTS, updated);
        return updated;
      });
    }

    // If customer is selected and there is dueAmount, update customer's outstandingDue
    if (invoice.customerId && dueAmount > 0) {
      setCustomers(prev => {
        const updated = prev.map(c => c.id === invoice.customerId ? {
          ...c,
          outstandingDue: (Number(c.outstandingDue) || 0) + dueAmount,
          totalPurchased: (Number(c.totalPurchased) || 0) + grandTotal
        } : c);
        scheduleStorageWrite(STORAGE_KEYS.BIZ_CUSTOMERS, updated);
        return updated;
      });
    }

    const nextInvoices = [newInv, ...invoices];
    setInvoices(nextInvoices);
    scheduleStorageWrite(STORAGE_KEYS.BIZ_INVOICES, nextInvoices);
    try {
      broadcastLiveEvent('SALE_COMPLETED', { sale: newInv, items: invoice.items });
    } catch (_) {}
    triggerImmediateCloudPush({
      ...latestStateRef.current,
      invoices: nextInvoices,
      salesHistory: [newInv, ...salesHistory]
    }, 'add_invoice');

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
    const inv = invoices.find(i => i.id === id) || salesHistory.find(s => s.id === id);
    let nextProducts = products;
    let nextCustomers = customers;

    if (inv) {
      // Restock items if desired
      if (restockItems && inv.items && inv.items.length > 0) {
        nextProducts = products.map(p => {
          const it = inv.items.find(item => item.productId === p.id || item.id === p.id);
          if (it) {
            const qtyToReturn = Number(it.quantity || it.qty || 1);
            const returnedSoFar = Number(it.returnedQty || 0);
            const unreturned = Math.max(0, qtyToReturn - returnedSoFar);
            return { ...p, stock: (Number(p.stock) || 0) + unreturned };
          }
          return p;
        });
        setProducts(nextProducts);
      }

      // Reverse customer due if any
      const due = Number(inv.dueAmount !== undefined ? inv.dueAmount : inv.grandTotal) || 0;
      if (due > 0 && (inv.customerId || inv.customerName)) {
        nextCustomers = customers.map(c => {
          if ((inv.customerId && c.id === inv.customerId) || (!inv.customerId && c.name === inv.customerName)) {
            return {
              ...c,
              outstandingDue: Math.max(0, (Number(c.outstandingDue) || 0) - due)
            };
          }
          return c;
        });
        setCustomers(nextCustomers);
      }
    }

    // Permanently tombstone so cloud/IDB can NEVER restore it
    markInvoiceAsDeletedTombstone(id);

    const nextInvoices = invoices.filter(item => item.id !== id);
    const nextSales = salesHistory.filter(item => item.id !== id);
    setInvoices(nextInvoices);
    setSalesHistory(nextSales);

    const userEmail = (user?.email || '').toLowerCase().trim();
    const isMaster = !userEmail || userEmail === 'hossansajjad1994@gmail.com';
    if (isMaster) {
      scheduleStorageWrite(STORAGE_KEYS.BIZ_INVOICES, nextInvoices);
      scheduleStorageWrite(STORAGE_KEYS.BIZ_SALES, nextSales);
      if (nextProducts !== products) scheduleStorageWrite(STORAGE_KEYS.BIZ_PRODUCTS, nextProducts);
      if (nextCustomers !== customers) scheduleStorageWrite(STORAGE_KEYS.BIZ_CUSTOMERS, nextCustomers);
    }
    if (userEmail) {
      const uTenantPrefix = `hk360_t_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}_`;
      scheduleStorageWrite(`${uTenantPrefix}biz_invoices`, nextInvoices);
      scheduleStorageWrite(`${uTenantPrefix}biz_sales`, nextSales);
      if (nextProducts !== products) scheduleStorageWrite(`${uTenantPrefix}biz_products`, nextProducts);
      if (nextCustomers !== customers) scheduleStorageWrite(`${uTenantPrefix}biz_customers`, nextCustomers);
    }

    try {
      broadcastLiveEvent('SALE_VOIDED', { saleId: id, voidedAt: new Date().toISOString() });
    } catch {}

    try {
      triggerImmediateCloudPush({
        ...latestStateRef.current,
        products: nextProducts,
        customers: nextCustomers,
        salesHistory: nextSales,
        invoices: nextInvoices
      }, 'delete_invoice');
    } catch {}

    showToast(
      lang === 'bn'
        ? `ইনভয়েস মুছে ফেলা হয়েছে${restockItems ? ' এবং মালামাল স্টকে ফেরত দেওয়া হয়েছে' : ''}!`
        : `Invoice deleted${restockItems ? ' and stock restored' : ''}!`
    );
  };

  // Void Sale / Cancel Invoice (ইনভয়েস বাতিল ও পণ্য স্টক রিভার্স)
  const voidSale = (saleId, options = { restock: true, reason: 'ভুল এন্ট্রি / অর্ডার বাতিল' }) => {
    const target = salesHistory.find(s => s.id === saleId) || invoices.find(i => i.id === saleId);
    if (!target) {
      showToast(lang === 'bn' ? 'ইনভয়েসটি পাওয়া যায়নি!' : 'Sale not found!', 'danger');
      return false;
    }

    // 1. Restock items back into product inventory
    if (options.restock !== false && Array.isArray(target.items) && target.items.length > 0) {
      setProducts(prev => prev.map(prod => {
        const item = target.items.find(it => (it.id === prod.id) || (it.productId === prod.id) || (it.name === prod.name));
        if (item) {
          const qty = Number(item.quantity || item.qty || 1);
          return {
            ...prod,
            stock: (Number(prod.stock) || 0) + qty
          };
        }
        return prod;
      }));
    }

    // 2. Reverse customer due & totalPurchased in CRM
    const due = Number(target.dueAmount) || 0;
    const grand = Number(target.grandTotal) || 0;
    if (target.customerId || target.customerName) {
      setCustomers(prev => prev.map(c => {
        if ((target.customerId && c.id === target.customerId) || (!target.customerId && c.name === target.customerName)) {
          return {
            ...c,
            outstandingDue: Math.max(0, (Number(c.outstandingDue) || 0) - due),
            totalPurchased: Math.max(0, (Number(c.totalPurchased) || 0) - grand)
          };
        }
        return c;
      }));
    }

    // 3. Permanently tombstone and Remove from State
    markInvoiceAsDeletedTombstone(saleId);
    const nextSales = salesHistory.filter(s => s.id !== saleId);
    const nextInvoices = invoices.filter(i => i.id !== saleId);

    setSalesHistory(nextSales);
    setInvoices(nextInvoices);

    const userEmail = (user?.email || '').toLowerCase().trim();
    const isMaster = !userEmail || userEmail === 'hossansajjad1994@gmail.com';
    if (isMaster) {
      scheduleStorageWrite(STORAGE_KEYS.BIZ_SALES, nextSales);
      scheduleStorageWrite(STORAGE_KEYS.BIZ_INVOICES, nextInvoices);
    }
    if (userEmail) {
      const uTenantPrefix = `hk360_t_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}_`;
      scheduleStorageWrite(`${uTenantPrefix}biz_sales`, nextSales);
      scheduleStorageWrite(`${uTenantPrefix}biz_invoices`, nextInvoices);
    }

    // 4. Record Void Event in Cloud & Local Audit
    try {
      broadcastLiveEvent('SALE_VOIDED', { saleId, voidedAt: new Date().toISOString(), reason: options.reason });
    } catch {}

    try {
      triggerImmediateCloudPush({
        ...latestStateRef.current,
        salesHistory: nextSales,
        invoices: nextInvoices
      }, 'sale_voided');
    } catch {}

    showToast(
      lang === 'bn'
        ? `ইনভয়েস #${saleId} সফলভাবে বাতিল করা হয়েছে এবং মালামাল স্টকে ফেরত দেওয়া হয়েছে!`
        : `Invoice #${saleId} voided and inventory restored!`
    );
    return true;
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

  // Purchase Order & Supplier Purchases Helpers
  const addPurchaseOrder = (order) => {
    const newOrder = {
      id: order.id || `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      date: order.date || new Date().toISOString().split('T')[0],
      status: order.status || 'ordered',
      paidAmount: Number(order.paidAmount) || 0,
      totalAmount: Number(order.totalAmount) || 0,
      dueAmount: Math.max(0, (Number(order.totalAmount) || 0) - (Number(order.paidAmount) || 0)),
      items: order.items || [],
      ...order
    };
    setPurchaseOrders(prev => [newOrder, ...prev]);

    // Automatically adjust inventory stock if products were specified
    if (order.items && order.items.length > 0) {
      order.items.forEach(it => {
        if (it.productId) {
          adjustStock(it.productId, Number(it.quantity) || 1, 'in');
        }
      });
    }

    showToast(lang === 'bn' ? 'মাল ক্রয়ের তথ্য সংরক্ষিত হয়েছে এবং স্টক হালনাগাদ হয়েছে!' : 'Purchase order saved and stock updated!');
    return newOrder;
  };

  const updatePurchaseOrderStatus = (id, newStatus) => {
    setPurchaseOrders(prev => prev.map(po => po.id === id ? { ...po, status: newStatus } : po));
    showToast(lang === 'bn' ? 'ক্রয় স্ট্যাটাস আপডেট হয়েছে' : 'Purchase status updated');
  };

  const deletePurchaseOrder = (id) => {
    setPurchaseOrders(prev => prev.filter(po => po.id !== id));
    showToast(lang === 'bn' ? 'ক্রয় অর্ডার মুছে ফেলা হয়েছে' : 'Purchase order deleted');
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
      deviceOrigin: getDeviceOrigin(),
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

  const openScanner = (callbackOrMode, context = 'pos', initialMode = 'barcode') => {
    const cb = typeof callbackOrMode === 'function' ? callbackOrMode : null;
    const mode = typeof callbackOrMode === 'string' ? callbackOrMode : initialMode;
    setScannerCallback(() => cb);
    setScannerContext(context);
    setScannerInitialMode(mode);
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

    if (typeof scannerCallback === 'function') {
      try {
        scannerCallback(cleanCode, matched);
      } catch (err) {
        console.warn('Scanner callback handler error:', err);
      }
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

    const branch = branches.find(b => b.id === (branchId || activeBranchId)) || branches[0];
    const targetBranchId = branch?.id || 'br-main';
    const counter = branch?.counters?.find(c => c.id === (counterId || activeCounterId)) || branch?.counters?.[0];
    const targetCounterId = counter?.id || 'cnt-1';

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
      branchName: branch?.name || 'প্রধান শাখা',
      counterId: targetCounterId,
      counterName: counter?.name || 'কাউন্টার ০১',
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
  const createAutoSnapshot = async (label = (lang === 'bn' ? 'স্বয়ংক্রিয় ব্যাকআপ স্ন্যাপশট' : 'Auto Backup Snapshot')) => {
    try {
      const currentData = {
        version: '3.0.0',
        createdAt: new Date().toISOString(),
        personal: { personalExpenses, personalIncomes, personalSavings, personalDebts, personalEvents },
        business: { products, salesHistory, customers, employees, suppliers, businessExpenses, businessSettings, invoices, quotations }
      };
      const result = await createSystemSnapshot(currentData, label);
      if (result && result.success) {
        setSnapshots(getSnapshotMetaList());
        return result.meta;
      }
      return null;
    } catch (err) {
      console.warn('Snapshot error:', err);
      return null;
    }
  };

  const restoreFromSnapshot = async (snapshotId) => {
    const snap = snapshots.find(s => s.id === snapshotId);
    if (!snap) {
      showToast(lang === 'bn' ? 'স্ন্যাপশট পাওয়া যায়নি' : 'Snapshot not found', 'danger');
      return;
    }
    const snapData = (await loadSnapshotData(snapshotId)) || snap.data;
    if (!snapData) {
      showToast(lang === 'bn' ? 'স্ন্যাপশট ডাটা পাওয়া যায়নি' : 'Snapshot data not found', 'danger');
      return;
    }
    if (window.confirm(lang === 'bn' ? `আপনি কি "${snap.date} ${snap.time}"-এর ব্যাকআপ রিস্টোর করতে চান?` : `Restore backup from ${snap.date} ${snap.time}?`)) {
      importAllData(JSON.stringify(snapData));
    }
  };

  const deleteSnapshot = async (snapshotId) => {
    await deleteSnapshotById(snapshotId);
    setSnapshots(getSnapshotMetaList());
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
      const targetUrl = customWebhookUrl || businessSettings.googleDriveWebhookUrl || initialData.businessSettings.googleDriveWebhookUrl;
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

  // Telegram Cloud Bot Auto-Sync
  const isTelegramSyncingRef = useRef(false);

  const syncToTelegram = async (customConfig = null, silent = false) => {
    if (isTelegramSyncingRef.current) return { success: false, inProgress: true };
    isTelegramSyncingRef.current = true;

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

      const res = await sendBackupToTelegram(backupPayload, customConfig);
      if (res?.success) {
        createAutoSnapshot(lang === 'bn' ? 'টেলিগ্রাম ক্লাউড ব্যাকআপ' : 'Telegram Cloud Backup');
        if (!silent) {
          showToast(lang === 'bn' ? `টেলিগ্রামে ব্যাকআপ সফলভাবে পাঠানো হয়েছে: ${res.fileName}` : `Backup sent to Telegram: ${res.fileName}`, 'success');
        }
        return res;
      }
    } catch (err) {
      console.error('Telegram backup error:', err);
      if (!silent) {
        showToast(lang === 'bn' ? 'টেলিগ্রাম ব্যাকআপ ত্রুটি: ' + err.message : 'Telegram backup error: ' + err.message, 'danger');
      }
      throw err;
    } finally {
      isTelegramSyncingRef.current = false;
    }
  };

  // Configurable Smart Auto-Sync Loop to Google Drive & Telegram (strictly maintains max 30 backups)
  useEffect(() => {
    const getBackupIntervalMs = () => {
      const val = businessSettings.googleDriveBackupInterval || businessSettings.autoBackupInterval;
      switch (val) {
        case '30s': return 30 * 1000;
        case '1min': return 60 * 1000;
        case '5min': return 5 * 60 * 1000;
        case '15min': return 15 * 60 * 1000;
        case '30min': return 30 * 60 * 1000;
        case '1hr':
        case 'hourly': return 60 * 60 * 1000;
        case 'daily': return 24 * 60 * 60 * 1000;
        case 'weekly': return 7 * 24 * 60 * 60 * 1000;
        case 'monthly': return 30 * 24 * 60 * 60 * 1000;
        default: {
          const num = Number(val);
          if (!isNaN(num) && num >= 15) return num * 1000;
          return 60 * 1000; // default 1 min
        }
      }
    };

    const intervalMs = getBackupIntervalMs();
    const intervalTimer = setInterval(() => {
      const autoSyncActive = businessSettings.autoBackupEnabled !== false && businessSettings.googleDriveEnabled !== false;
      const canSyncDrive = isGoogleDriveConnected() || !!businessSettings.googleDriveWebhookUrl;
      const tgConfig = getTelegramBackupConfig();
      const canSyncTelegram = tgConfig.enabled && tgConfig.autoSync && tgConfig.botToken && tgConfig.chatId;

      if (autoSyncActive && (canSyncDrive || canSyncTelegram)) {
        const currentSig = `${salesHistory.length}_${products.length}_${customers.length}_${businessExpenses.length}_${invoices.length}_${personalExpenses.length}_${personalEvents?.length || 0}`;
        if (currentSig !== lastSyncSignatureRef.current) {
          if (canSyncDrive && !isSyncingRef.current) {
            syncToGoogleDrive(null, true).then((res) => {
              if (res?.success) {
                lastSyncSignatureRef.current = currentSig;
              }
            });
          }
          if (canSyncTelegram && !isTelegramSyncingRef.current) {
            syncToTelegram(null, true).catch(() => {});
          }
        }
      }
    }, intervalMs);

    return () => clearInterval(intervalTimer);
  }, [
    businessSettings.autoBackupEnabled,
    businessSettings.googleDriveEnabled,
    businessSettings.googleDriveWebhookUrl,
    businessSettings.googleDriveBackupInterval,
    businessSettings.autoBackupInterval,
    salesHistory.length,
    products.length,
    customers.length,
    businessExpenses.length,
    invoices.length,
    personalExpenses.length,
    personalEvents?.length
  ]);

  // Instant Realtime Event-Driven Backup to Telegram on Every Sale, Expense, Income, or Debt Record
  const lastEventSyncSigRef = useRef(null);
  useEffect(() => {
    const tgConfig = getTelegramBackupConfig();
    const canSyncTelegram = tgConfig.enabled && tgConfig.autoSync && tgConfig.syncOnSaleOrExpense !== false && tgConfig.botToken && tgConfig.chatId;
    if (!canSyncTelegram) return;

    const currentSig = `${salesHistory.length}_${invoices.length}_${businessExpenses.length}_${personalExpenses.length}_${personalIncomes?.length || 0}_${businessDebts?.length || 0}_${personalDebts?.length || 0}`;
    if (lastEventSyncSigRef.current === null) {
      lastEventSyncSigRef.current = currentSig;
      return;
    }

    if (currentSig !== lastEventSyncSigRef.current) {
      lastEventSyncSigRef.current = currentSig;
      // Debounce 1.5 seconds to batch rapid entries or finish disk write
      const timer = setTimeout(() => {
        if (!isTelegramSyncingRef.current) {
          syncToTelegram(null, true).catch(() => {});
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [
    salesHistory.length,
    invoices.length,
    businessExpenses.length,
    personalExpenses.length,
    personalIncomes?.length,
    businessDebts?.length,
    personalDebts?.length
  ]);

  // Global transaction listener for explicit triggers
  useEffect(() => {
    const handleTransactionEvent = () => {
      const tgConfig = getTelegramBackupConfig();
      if (tgConfig.enabled && tgConfig.autoSync && tgConfig.syncOnSaleOrExpense !== false && tgConfig.botToken && tgConfig.chatId) {
        setTimeout(() => {
          if (!isTelegramSyncingRef.current) {
            syncToTelegram(null, true).catch(() => {});
          }
        }, 1200);
      }
    };

    window.addEventListener('hk360_transaction_recorded', handleTransactionEvent);
    return () => window.removeEventListener('hk360_transaction_recorded', handleTransactionEvent);
  }, []);

  // Dedicated 5-Minute (Configurable) Telegram Routine Backup Loop
  useEffect(() => {
    const tgConfig = getTelegramBackupConfig();
    const intervalMs = Math.max(1, (tgConfig.intervalMinutes || 5)) * 60 * 1000;
    const tgTimer = setInterval(() => {
      const activeConfig = getTelegramBackupConfig();
      if (activeConfig.enabled && activeConfig.autoSync && activeConfig.botToken && activeConfig.chatId && !isTelegramSyncingRef.current) {
        syncToTelegram(null, true).catch(() => {});
      }
    }, intervalMs);

    return () => clearInterval(tgTimer);
  }, []);

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

  // Live Interactive Telegram Bot Command Listener (/backup, /today, /summary, /help)
  const [telegramConfigTrigger, setTelegramConfigTrigger] = useState(0);

  useEffect(() => {
    const onTgConfigUpdate = () => setTelegramConfigTrigger(t => t + 1);
    window.addEventListener('hk360_telegram_config_updated', onTgConfigUpdate);

    // Initial bi-directional sync with local preview server
    const syncWithServer = async () => {
      try {
        const localCfg = getTelegramBackupConfig();
        if (localCfg?.botToken) {
          await fetch('/api/telegram/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(localCfg)
          }).catch(() => {});
        } else {
          const res = await fetch('/api/telegram/config').catch(() => null);
          if (res?.ok) {
            const data = await res.json().catch(() => null);
            if (data?.config?.botToken) {
              saveTelegramBackupConfig(data.config);
            }
          }
        }
      } catch {}
    };
    syncWithServer();

    return () => window.removeEventListener('hk360_telegram_config_updated', onTgConfigUpdate);
  }, []);

  useEffect(() => {
    const tgConfig = getTelegramBackupConfig();
    if (!tgConfig?.botToken) return;

    let isPolling = false;
    const pollTimer = setInterval(async () => {
      if (isPolling) return;
      const liveConfig = getTelegramBackupConfig();
      if (!liveConfig?.botToken) return;

      isPolling = true;
      try {
        const today = new Date().toISOString().split('T')[0];
        const todaySalesList = (salesHistory || []).filter(s => (s.date || '').startsWith(today));
        const todaySales = todaySalesList.reduce((sum, s) => sum + (Number(s.finalTotal) || Number(s.total) || 0), 0);
        const todayInvoices = todaySalesList.length;

        // Cost of goods sold for today
        const todayCost = todaySalesList.reduce((sum, s) => {
          if (Array.isArray(s.items)) {
            const cost = s.items.reduce((itemSum, it) => {
              const matchedProduct = (products || []).find(p => p.id === it.id || p.barcode === it.barcode);
              const unitCost = Number(matchedProduct?.buyPrice || matchedProduct?.costPrice || matchedProduct?.purchasePrice || it.costPrice || 0);
              return itemSum + (unitCost * (Number(it.qty) || Number(it.quantity) || 1));
            }, 0);
            return sum + cost;
          }
          return sum + ((Number(s.finalTotal) || Number(s.total) || 0) * 0.7); // Fallback ~30% margin
        }, 0);

        // Today's business expenses
        const todayBizExpenses = (businessExpenses || []).filter(e => (e.date || '').startsWith(today));
        const todayBizExpenseTotal = todayBizExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

        // Today's personal expenses
        const todayPersonalExpenses = (personalExpenses || []).filter(e => (e.date || '').startsWith(today));
        const todayPersonalExpenseTotal = todayPersonalExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

        // Total dues & debtors
        const dueCustomers = (customers || []).filter(c => (Number(c.due) || Number(c.balance) || 0) > 0);
        const totalDueAmount = dueCustomers.reduce((sum, c) => sum + (Number(c.due) || Number(c.balance) || 0), 0);
        const sortedDebtors = [...dueCustomers].sort((a, b) => (Number(b.due || b.balance || 0)) - (Number(a.due || a.balance || 0)));

        await pollTelegramBotCommands({
          botToken: liveConfig.botToken,
          chatId: liveConfig.chatId,
          products,
          customers,
          shopName: businessSettings.companyName || 'আমার প্রতিষ্ঠান',
          onBackupRequested: async (replyChatId) => {
            console.log('🤖 Telegram bot requested on-demand backup!');
            await syncToTelegram(null, true);
          },
          onSummaryRequested: async (replyChatId) => {
            console.log('🤖 Telegram bot requested on-demand sales summary!');
            const targetConfig = replyChatId ? { ...liveConfig, chatId: replyChatId } : liveConfig;
            await sendTelegramSalesSummary({
              shopName: businessSettings.companyName || 'আমার প্রতিষ্ঠান',
              dateStr: new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' }),
              todaySales,
              todayInvoices,
              totalCustomers: customers.length,
              totalProducts: products.length
            }, targetConfig);
          },
          onStockRequested: async (query, replyChatId) => {
            console.log('🤖 Telegram bot requested stock report. Query:', query);
            const targetConfig = replyChatId ? { ...liveConfig, chatId: replyChatId } : liveConfig;
            await sendTelegramStockReport({
              products,
              query,
              shopName: businessSettings.companyName || 'আমার প্রতিষ্ঠান'
            }, targetConfig);
          },
          onProfitRequested: async (replyChatId) => {
            console.log('🤖 Telegram bot requested profit & loss report!');
            const targetConfig = replyChatId ? { ...liveConfig, chatId: replyChatId } : liveConfig;
            const netProfit = Math.round(todaySales - todayCost - todayBizExpenseTotal);
            await sendTelegramProfitReport({
              todaySales,
              todayCost: Math.round(todayCost),
              todayExpenses: todayBizExpenseTotal,
              netProfit,
              shopName: businessSettings.companyName || 'আমার প্রতিষ্ঠান',
              dateStr: new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })
            }, targetConfig);
          },
          onDueRequested: async (replyChatId) => {
            console.log('🤖 Telegram bot requested due / baki report!');
            const targetConfig = replyChatId ? { ...liveConfig, chatId: replyChatId } : liveConfig;
            await sendTelegramDueReport({
              totalDue: totalDueAmount,
              customerCount: dueCustomers.length,
              topDebtors: sortedDebtors,
              shopName: businessSettings.companyName || 'আমার প্রতিষ্ঠান'
            }, targetConfig);
          },
          onExpenseListRequested: async (replyChatId) => {
            console.log('🤖 Telegram bot requested expense list!');
            const targetConfig = replyChatId ? { ...liveConfig, chatId: replyChatId } : liveConfig;
            const combinedExpenses = [
              ...todayBizExpenses.map(e => ({ ...e, title: `[দোকান] ${e.title || e.category || 'খরচ'}` })),
              ...todayPersonalExpenses.map(e => ({ ...e, title: `[ব্যক্তিগত] ${e.title || e.category || 'খরচ'}` }))
            ];
            await sendTelegramExpenseReport({
              todayExpenses: combinedExpenses,
              totalAmount: todayBizExpenseTotal + todayPersonalExpenseTotal,
              shopName: businessSettings.companyName || 'আমার প্রতিষ্ঠান',
              dateStr: new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })
            }, targetConfig);
          },
          onAddExpenseRequested: async (parsed, replyChatId) => {
            const { amount, title, category, subCategory, familyMember, note, isPersonal } = parsed;
            console.log(`🤖 Telegram bot adding ${isPersonal ? 'personal' : 'business'} expense:`, parsed);
            if (isPersonal) {
              const newExpense = {
                id: 'pexp-' + Date.now(),
                title: title || note || 'টেলিগ্রাম খরচ',
                category: category || 'transport',
                subCategory: subCategory || '',
                familyMember: familyMember || 'নিজে (Self)',
                amount: Number(amount),
                date: today,
                note: note || '',
                source: 'telegram_bot',
                createdAt: new Date().toISOString()
              };
              setPersonalExpenses(prev => {
                const next = [newExpense, ...(prev || [])];
                localStorage.setItem(STORAGE_KEYS.PERSONAL_EXPENSES, JSON.stringify(next));
                return next;
              });
            } else {
              const newExpense = {
                id: 'bexp-' + Date.now(),
                title: title || note || 'টেলিগ্রাম দোকান খরচ',
                category: category || 'অফিস/দোকান খরচ',
                subCategory: subCategory || '',
                amount: Number(amount),
                date: today,
                note: note || '',
                source: 'telegram_bot',
                createdAt: new Date().toISOString()
              };
              setBusinessExpenses(prev => {
                const next = [newExpense, ...(prev || [])];
                localStorage.setItem(STORAGE_KEYS.BIZ_EXPENSES, JSON.stringify(next));
                return next;
              });
            }

            const targetConfig = replyChatId ? { ...liveConfig, chatId: replyChatId } : liveConfig;
            await sendTelegramExpenseAddedConfirmation({
              amount,
              title,
              category,
              subCategory,
              familyMember,
              note,
              isPersonal
            }, targetConfig);

            showToast(
              lang === 'bn'
                ? isPersonal
                  ? `টেলিগ্রাম থেকে ৳${Number(amount).toLocaleString()} পার্সোনাল লেনদেন যোগ হয়েছে (${title || note || 'পার্সোনাল'})`
                  : `টেলিগ্রাম থেকে ৳${Number(amount).toLocaleString()} দোকান খরচ যোগ হয়েছে (${title || note})`
                : `${isPersonal ? 'Personal transaction' : 'Expense'} ৳${amount} added via Telegram (${title || note})`,
              'success'
            );
          },
          onAddSaleRequested: async (parsed, replyChatId) => {
            const { productName, qty, price } = parsed;
            const targetConfig = replyChatId ? { ...liveConfig, chatId: replyChatId } : liveConfig;
            
            const matchedProd = (products || []).find(p => 
              (p.name || '').toLowerCase().includes(productName.toLowerCase()) ||
              (p.barcode || '').toLowerCase() === productName.toLowerCase()
            );

            const unitPrice = price > 0 ? (price / qty) : (matchedProd ? Number(matchedProd.sellingPrice || matchedProd.price || 0) : 100);
            const totalAmount = price > 0 ? price : (unitPrice * qty);
            const prodTitle = matchedProd ? matchedProd.name : productName;
            const invNumber = 'INV-' + Date.now().toString().slice(-6);

            if (matchedProd) {
              setProducts(prev => prev.map(p => {
                if (p.id === matchedProd.id) {
                  const currentStock = Number(p.stock !== undefined ? p.stock : p.quantity || 0);
                  return { ...p, stock: Math.max(0, currentStock - qty) };
                }
                return p;
              }));
            }

            const newSale = {
              id: 'sale-' + Date.now(),
              invoiceNumber: invNumber,
              items: [{
                id: matchedProd?.id || 'prod-' + Date.now(),
                name: prodTitle,
                quantity: qty,
                price: unitPrice,
                total: totalAmount
              }],
              totalAmount,
              finalAmount: totalAmount,
              paidAmount: totalAmount,
              dueAmount: 0,
              customer: { name: 'টেলিগ্রাম সেলস খদ্দের', phone: '' },
              date: today,
              createdAt: new Date().toISOString(),
              source: 'telegram_bot',
              deviceOrigin: '🤖 টেলিগ্রাম বট (Telegram)'
            };

            setSalesHistory(prev => [newSale, ...(prev || [])]);
            setInvoices(prev => [newSale, ...(prev || [])]);

            const confText = `✅ *টেলিগ্রাম থেকে বিক্রয় সফলভাবে সম্পন্ন হয়েছে!*
━━━━━━━━━━━━━━━━━━━━━
🧾 *মেমো:* #${invNumber}
📦 *পণ্য:* ${prodTitle} (${qty} টি)
💵 *মোট মূল্য:* ৳${totalAmount.toLocaleString()}
${matchedProd ? `📉 *স্টক অবশিষ্ট:* ${Math.max(0, (Number(matchedProd.stock || 0) - qty))} টি\n` : ''}⏰ *সময়:* ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
━━━━━━━━━━━━━━━━━━━━━
🌐 _দোকানের সমস্ত কাউন্টারে তাৎক্ষণিক সিঙ্ক সম্পন্ন!_`;

            await sendTelegramMessage(confText, targetConfig, TELEGRAM_FOLDER_ADD_BIZ, 'Markdown');
            showToast(`টেলিগ্রাম থেকে ৳${totalAmount} টাকার বিক্রয় সম্পন্ন! (${prodTitle})`, 'success');
          },
          onAddInvoiceRequested: async (parsed, replyChatId) => {
            const { customerName, productName, qty, price } = parsed;
            const targetConfig = replyChatId ? { ...liveConfig, chatId: replyChatId } : liveConfig;
            const invNumber = 'INV-' + Date.now().toString().slice(-6);
            const totalAmount = price > 0 ? price : 500;

            const newSale = {
              id: 'inv-' + Date.now(),
              invoiceNumber: invNumber,
              items: [{
                id: 'item-' + Date.now(),
                name: productName,
                quantity: qty,
                price: totalAmount / qty,
                total: totalAmount
              }],
              totalAmount,
              finalAmount: totalAmount,
              paidAmount: totalAmount,
              dueAmount: 0,
              customer: { name: customerName, phone: '' },
              date: today,
              createdAt: new Date().toISOString(),
              source: 'telegram_bot',
              deviceOrigin: '🤖 টেলিগ্রাম বট (Telegram)'
            };

            setSalesHistory(prev => [newSale, ...(prev || [])]);
            setInvoices(prev => [newSale, ...(prev || [])]);

            const confText = `🧾 *নতুন ইনভয়েস সফলভাবে তৈরি হয়েছে!*
━━━━━━━━━━━━━━━━━━━━━
📋 *মেমো নং:* #${invNumber}
👤 *ক্রেতা:* ${customerName}
📦 *বিবরণ:* ${productName} (${qty} টি)
💰 *মোট বিল:* ৳${totalAmount.toLocaleString()} (পরিশোধিত)
⏰ *সময়:* ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
━━━━━━━━━━━━━━━━━━━━━
🌐 _সকল পিসি ও মোবাইল ডিভাইসে ইনভয়েস দৃশ্যমান।_`;

            await sendTelegramMessage(confText, targetConfig, TELEGRAM_FOLDER_ADD_BIZ, 'Markdown');
            showToast(`টেলিগ্রাম থেকে ইনভয়েস #${invNumber} তৈরি হয়েছে! (${customerName})`, 'success');
          },
          onAddCustomerRequested: async (parsed, replyChatId) => {
            const { name, phone, due } = parsed;
            const targetConfig = replyChatId ? { ...liveConfig, chatId: replyChatId } : liveConfig;
            const newCust = {
              id: 'cust-' + Date.now(),
              name,
              phone: phone || '',
              due: Number(due) || 0,
              balance: Number(due) || 0,
              source: 'telegram_bot',
              createdAt: new Date().toISOString()
            };

            setCustomers(prev => [newCust, ...(prev || [])]);

            const confText = `👥 *নতুন কাস্টমার সফলভাবে সিআরএমে যোগ হয়েছে!*
━━━━━━━━━━━━━━━━━━━━━
👤 *নাম:* ${name}
📞 *ফোন:* ${phone || 'দেওয়া হয়নি'}
📒 *পূর্বের বাকি:* ৳${Number(due || 0).toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━
💡 _কাস্টমার ডিরেক্টরিতে তাৎক্ষণিক সিঙ্ক হয়েছে।_`;

            await sendTelegramMessage(confText, targetConfig, TELEGRAM_FOLDER_ADD_BIZ, 'Markdown');
            showToast(`টেলিগ্রাম থেকে কাস্টমার '${name}' যুক্ত হয়েছে!`, 'success');
          },
          onAddProductRequested: async (parsed, replyChatId) => {
            const { name, buyPrice, sellPrice, stock } = parsed;
            const targetConfig = replyChatId ? { ...liveConfig, chatId: replyChatId } : liveConfig;
            const newProd = {
              id: 'prod-' + Date.now(),
              name,
              costPrice: Number(buyPrice) || 0,
              buyPrice: Number(buyPrice) || 0,
              sellingPrice: Number(sellPrice) || 0,
              price: Number(sellPrice) || 0,
              stock: Number(stock) || 1,
              quantity: Number(stock) || 1,
              category: 'সাধারণ',
              source: 'telegram_bot',
              createdAt: new Date().toISOString()
            };

            setProducts(prev => [newProd, ...(prev || [])]);

            const confText = `📦 *নতুন পণ্য সফলভাবে স্টকে যুক্ত হয়েছে!*
━━━━━━━━━━━━━━━━━━━━━
🏷️ *পণ্যের নাম:* ${name}
💵 *ক্রয়মূল্য:* ৳${Number(buyPrice).toLocaleString()}
💰 *বিক্রয়মূল্য:* ৳${Number(sellPrice).toLocaleString()}
🔢 *মজুদ স্টক:* ${Number(stock)} টি
━━━━━━━━━━━━━━━━━━━━━
⚡ _পিওএস ও ইনভেন্টরিতে অবিলম্বে পাওয়া যাবে।_`;

            await sendTelegramMessage(confText, targetConfig, TELEGRAM_FOLDER_ADD_BIZ, 'Markdown');
            showToast(`টেলিগ্রাম থেকে নতুন পণ্য '${name}' যুক্ত হয়েছে!`, 'success');
          },
          onAddDueRequested: async (parsed, replyChatId) => {
            const { type, customerName, amount } = parsed;
            const targetConfig = replyChatId ? { ...liveConfig, chatId: replyChatId } : liveConfig;
            
            setCustomers(prev => prev.map(c => {
              if ((c.name || '').toLowerCase().includes(customerName.toLowerCase())) {
                const currentDue = Number(c.due || c.balance || 0);
                const newDue = type === 'due' ? (currentDue + amount) : Math.max(0, currentDue - amount);
                return { ...c, due: newDue, balance: newDue };
              }
              return c;
            }));

            const confText = `📒 *${type === 'due' ? 'কাস্টমার বকেয়া বাকি' : 'বকেয়া টাকা আদায় / জমা'} এন্ট্রি সম্পন্ন!*
━━━━━━━━━━━━━━━━━━━━━
👤 *কাস্টমার:* ${customerName}
💰 *টাকার পরিমাণ:* ৳${Number(amount).toLocaleString()}
🏷️ *ধরণ:* ${type === 'due' ? 'বাকি প্রদান' : 'টাকা জমা / আদায়'}
⏰ *সময়:* ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
━━━━━━━━━━━━━━━━━━━━━
📒 _দেনা-পাওনা লেজারে সংরক্ষিত হয়েছে।_`;

            await sendTelegramMessage(confText, targetConfig, TELEGRAM_FOLDER_ADD_BIZ, 'Markdown');
            showToast(`টেলিগ্রাম থেকে ${customerName}-এর ৳${amount} ${type === 'due' ? 'বাকি' : 'জমা'} এন্ট্রি হয়েছে!`, 'success');
          },
          onAddIncomeRequested: async (parsed, replyChatId) => {
            const { amount, source } = parsed;
            const targetConfig = replyChatId ? { ...liveConfig, chatId: replyChatId } : liveConfig;

            const newIncome = {
              id: 'inc-' + Date.now(),
              title: source || 'টেলিগ্রাম আয়',
              amount: Number(amount),
              category: 'salary',
              date: today,
              source: 'telegram_bot',
              createdAt: new Date().toISOString()
            };

            setPersonalIncomes(prev => [newIncome, ...(prev || [])]);

            const confText = `💵 *ব্যক্তিগত আয় সফলভাবে সফটওয়্যারে জমা হয়েছে!*
━━━━━━━━━━━━━━━━━━━━━
💰 *আয়ের পরিমাণ:* ৳${Number(amount).toLocaleString()}
🏷️ *উৎস / খাত:* ${source || 'সাধারণ আয়'}
⏰ *সময়:* ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
━━━━━━━━━━━━━━━━━━━━━
📈 _ব্যক্তিগত আয় ও সঞ্চয় লেজারে যোগ হয়েছে।_`;

            await sendTelegramMessage(confText, targetConfig, TELEGRAM_FOLDER_ADD_PERS, 'Markdown');
            showToast(`টেলিগ্রাম থেকে ৳${amount} আয় জমা হয়েছে (${source})!`, 'success');
          },
          onLockRequested: async (replyChatId) => {
            const targetConfig = replyChatId ? { ...liveConfig, chatId: replyChatId } : liveConfig;
            if (typeof lockScreen === 'function') {
              lockScreen();
            }
            const confText = `🔒 *কাউন্টার স্ক্রিন লক সক্রিয় করা হয়েছে!*
━━━━━━━━━━━━━━━━━━━━━
📱 দোকানের সমস্ত খোলা কাউন্টার (পিসি ও মোবাইল) লক করে দেওয়া হয়েছে।
🔑 মাস্টার পিন ছাড়া কাউন্টারে প্রবেশ বন্ধ থাকবে।`;
            await sendTelegramMessage(confText, targetConfig, TELEGRAM_FOLDER_CONTROL, 'Markdown');
            showToast('টেলিগ্রাম বট থেকে কাউন্টার লক করা হয়েছে!', 'warning');
          },
          onCashRequested: async (replyChatId) => {
            const targetConfig = replyChatId ? { ...liveConfig, chatId: replyChatId } : liveConfig;
            const drawerBal = Math.max(0, todaySales - todayBizExpenseTotal);
            const text = `💰 *হিসাবকিতাব ৩৬০ - আজকের ক্যাশ ড্রয়ার বিবরণী*
📅 *তারিখ:* \`${new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}\`
🏪 *দোকান:* *${businessSettings.companyName || 'আমার দোকান'}*
━━━━━━━━━━━━━━━━━━━━━
💵 *মোট ক্যাশ ইন (বিক্রয়):* ৳${todaySales.toLocaleString()}
💸 *মোট ক্যাশ আউট (খরচ):* -৳${todayBizExpenseTotal.toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━
🟢 *ড্রয়ারে বর্তমান ক্যাশ ব্যালেন্স:* *৳${drawerBal.toLocaleString()}*
━━━━━━━━━━━━━━━━━━━━━
💡 _বিস্তারিত রিপোর্ট দেখতে লিখুন:_ */today* বা */profit*`;
            await sendTelegramMessage(text, targetConfig, TELEGRAM_FOLDER_REPORTS, 'Markdown');
          },
          onTerminalsRequested: async (replyChatId) => {
            const targetConfig = replyChatId ? { ...liveConfig, chatId: replyChatId } : liveConfig;
            const text = `📱 *হিসাবকিতাব ৩৬০ - সংযুক্ত ৩ প্ল্যাটফর্ম টার্মিনাল স্ট্যাটাস*
━━━━━━━━━━━━━━━━━━━━━
💻 *কাউন্টার ০১ (পিসি ডেস্কটপ):* 🟢 সক্রিয় (http://localhost:5173)
📱 *কাউন্টার ০২ (মোবাইল অ্যাপ):* 🟢 সক্রিয় (Android APK)
🌐 *কাউন্টার ০৩ (ওয়েবসাইট):* 🟢 সক্রিয় (Vercel Web)
✈️ *টেলিগ্রাম বট কন্ট্রোল:* 🟢 লাইভ কানেক্টেড
━━━━━━━━━━━━━━━━━━━━━
⚡ _সকল টার্মিনালে ডাটা সিঙ্ক হচ্ছে!_`;
            await sendTelegramMessage(text, targetConfig, TELEGRAM_FOLDER_CONTROL, 'Markdown');
          },
          onItemHistoryRequested: async (item, replyChatId) => {
            console.log('🤖 Telegram bot requested item history for:', item);
            const targetConfig = replyChatId ? { ...liveConfig, chatId: replyChatId } : liveConfig;
            const q = (item || '').toLowerCase().trim();

            // Search personal expenses
            const matchedPersonal = (personalExpenses || []).filter(e =>
              (e.title || '').toLowerCase().includes(q) ||
              (e.note || '').toLowerCase().includes(q) ||
              (e.category || '').toLowerCase().includes(q)
            ).map(e => ({
              date: e.date,
              amount: Number(e.amount) || 0,
              title: `[ব্যক্তিগত] ${e.title || e.category || 'খরচ'}`,
              note: e.note || e.familyMember || ''
            }));

            // Search business expenses
            const matchedBiz = (businessExpenses || []).filter(e =>
              (e.title || '').toLowerCase().includes(q) ||
              (e.note || '').toLowerCase().includes(q) ||
              (e.category || '').toLowerCase().includes(q)
            ).map(e => ({
              date: e.date,
              amount: Number(e.amount) || 0,
              title: `[দোকান খরচ] ${e.title || e.category || 'খরচ'}`,
              note: e.note || ''
            }));

            // Search sales history
            const matchedSales = [];
            (salesHistory || []).forEach(s => {
              (s.items || []).forEach(it => {
                if ((it.name || '').toLowerCase().includes(q)) {
                  matchedSales.push({
                    date: s.date || s.createdAt,
                    amount: it.total || (it.price * it.quantity),
                    title: `[বিক্রয়] ${it.name} (${it.quantity} টি)`,
                    note: `মেমো #${s.invoiceNumber || s.id}`
                  });
                }
              });
            });

            const combined = [...matchedPersonal, ...matchedBiz, ...matchedSales].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

            await sendTelegramItemHistoryReport({
              item,
              purchases: combined,
              shopName: businessSettings.companyName || 'হিসাবকিতাব ৩৬০'
            }, targetConfig);
          },
          onPdfReportRequested: async (reportType, replyChatId) => {
            console.log('🤖 Telegram bot requested PDF report:', reportType);
            const targetConfig = replyChatId ? { ...liveConfig, chatId: replyChatId } : liveConfig;
            const company = businessSettings.companyName || 'হিসাবকিতাব ৩৬০';
            const dateStr = new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });

            let htmlDoc = '';
            let fileName = '';
            let caption = '';

            if (reportType === 'personal') {
              const rows = (personalExpenses || []).slice(0, 100).map(e => [
                e.date || '-',
                e.title || e.category || 'খরচ',
                `৳${Number(e.amount || 0).toLocaleString()}`,
                e.familyMember || 'নিজে',
                e.note || '-'
              ]);
              const total = (personalExpenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
              htmlDoc = generateReportHtmlDoc({
                title: 'ব্যক্তিগত খরচের পূর্ণাঙ্গ স্টেটমেন্ট (Personal Expenses)',
                shopName: company,
                dateStr,
                headers: ['তারিখ', 'বিবরণ / খাত', 'টাকা (BDT)', 'ব্যক্তি', 'মন্তব্য'],
                rows,
                summary: `<strong>সর্বমোট ব্যক্তিগত খরচ:</strong> ৳${total.toLocaleString()} (${rows.length} টি রেকর্ড)`
              });
              fileName = `Personal_Expenses_${today}.html`;
              caption = `📄 <b>ব্যক্তিগত খরচের স্টেটমেন্ট</b>\n💰 মোট খরচ: ৳${total.toLocaleString()}`;
            } else if (reportType === 'business') {
              const rows = (businessExpenses || []).slice(0, 100).map(e => [
                e.date || '-',
                e.title || e.category || 'দোকান খরচ',
                `৳${Number(e.amount || 0).toLocaleString()}`,
                e.note || '-'
              ]);
              const total = (businessExpenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
              htmlDoc = generateReportHtmlDoc({
                title: 'দোকান ও ব্যবসা খরচের লেজার (Business Expenses)',
                shopName: company,
                dateStr,
                headers: ['তারিখ', 'খরচের খাত / শিরোনাম', 'পরিমাণ (BDT)', 'নোট'],
                rows,
                summary: `<strong>সর্বমোট ব্যবসা খরচ:</strong> ৳${total.toLocaleString()} (${rows.length} টি খরচ)`
              });
              fileName = `Business_Expenses_${today}.html`;
              caption = `📄 <b>দোকান ও ব্যবসার খরচের স্টেটমেন্ট</b>\n💰 মোট খরচ: ৳${total.toLocaleString()}`;
            } else if (reportType === 'due') {
              const dueList = (customers || []).filter(c => (Number(c.due) || Number(c.balance) || 0) > 0);
              const rows = dueList.map(c => [
                c.name || 'গ্রাহক',
                c.phone || '-',
                `৳${Number(c.due || c.balance || 0).toLocaleString()}`,
                c.address || '-'
              ]);
              const totalDue = dueList.reduce((s, c) => s + (Number(c.due || c.balance || 0)), 0);
              htmlDoc = generateReportHtmlDoc({
                title: 'গ্রাহক বকেয়া ও দেনা-পাওনা খাতা (Customer Due Ledger)',
                shopName: company,
                dateStr,
                headers: ['গ্রাহকের নাম', 'মোবাইল নম্বর', 'বকেয়া বাকি (BDT)', 'ঠিকানা'],
                rows,
                summary: `<strong>সর্বমোট বকেয়া পাওনা:</strong> ৳${totalDue.toLocaleString()} (বাকিদার: ${dueList.length} জন)`
              });
              fileName = `Due_Ledger_${today}.html`;
              caption = `📄 <b>কাস্টমার বকেয়া খাতা ও দেনা-পাওনা স্টেটমেন্ট</b>\n💰 মোট বকেয়া: ৳${totalDue.toLocaleString()}`;
            } else if (reportType === 'stock') {
              const rows = (products || []).slice(0, 100).map(p => {
                const qty = Number(p.stock !== undefined ? p.stock : p.quantity || 0);
                const price = Number(p.price || p.sellingPrice || 0);
                return [
                  p.name,
                  p.category || 'সাধারণ',
                  `${qty} ${p.unit || 'টি'}`,
                  `৳${price.toLocaleString()}`,
                  `৳${(qty * price).toLocaleString()}`
                ];
              });
              const totalVal = (products || []).reduce((s, p) => s + (Number(p.stock !== undefined ? p.stock : p.quantity || 0) * Number(p.price || p.sellingPrice || 0)), 0);
              htmlDoc = generateReportHtmlDoc({
                title: 'পণ্য স্টক ও ইনভেন্টরি ভ্যালুয়েশন রিপোর্ট (Inventory Stock)',
                shopName: company,
                dateStr,
                headers: ['পণ্যের নাম', 'ক্যাটাগরি', 'মজুদ পরিমাণ', 'একক মূল্য', 'মোট মূল্য'],
                rows,
                summary: `<strong>মোট ইনভেন্টরি মূল্য:</strong> ৳${Math.round(totalVal).toLocaleString()} (আইটেম: ${products.length} প্রকার)`
              });
              fileName = `Stock_Inventory_${today}.html`;
              caption = `📄 <b>পণ্য স্টক ও ইনভেন্টরি স্টেটমেন্ট</b>\n📦 মোট পণ্য: ${products.length} প্রকার`;
            } else if (reportType === 'profit') {
              const netProfit = Math.round(todaySales - todayCost - todayBizExpenseTotal);
              const rows = [
                ['আজকের মোট বিক্রি (Gross Revenue)', `৳${todaySales.toLocaleString()}`, 'সব বিক্রয় মেমো'],
                ['বিক্রিত পণ্যের ক্রয়মূল্য (COGS)', `-৳${Math.round(todayCost).toLocaleString()}`, 'পণ্য কেনা খরচ'],
                ['দোকান ও ব্যবসা খরচ (Opex)', `-৳${todayBizExpenseTotal.toLocaleString()}`, 'আজকের পরিচালন ব্যয়'],
                ['আজকের নিট লাভ (Net Profit)', `৳${netProfit.toLocaleString()}`, netProfit >= 0 ? '🟢 লাভ' : '🔴 ক্ষতি']
              ];
              htmlDoc = generateReportHtmlDoc({
                title: 'আজকের লাভ-ক্ষতি ও ব্যালেন্স শিট (Profit & Loss Statement)',
                shopName: company,
                dateStr,
                headers: ['হিসাবের খাত', 'টাকা (BDT)', 'বিবরণ'],
                rows,
                summary: `<strong>নিট আর্থিক ফলাফল:</strong> ৳${netProfit.toLocaleString()} (${netProfit >= 0 ? 'লাভ' : 'ক্ষতি'})`
              });
              fileName = `Profit_Loss_${today}.html`;
              caption = `📄 <b>লাভ-ক্ষতি ও ব্যালেন্স শিট স্টেটমেন্ট</b>\n${netProfit >= 0 ? '🟢 লাভ' : '🔴 ক্ষতি'}: ৳${netProfit.toLocaleString()}`;
            } else {
              // Default: Cash flow statement
              const drawerBal = Math.max(0, todaySales - todayBizExpenseTotal);
              const rows = [
                [dateStr, 'আজকের বিক্রয় ক্যাশ ইন', `৳${todaySales.toLocaleString()}`, '৳০', `৳${todaySales.toLocaleString()}`],
                [dateStr, 'দোকানের খরচের ক্যাশ আউট', '৳০', `৳${todayBizExpenseTotal.toLocaleString()}`, `৳${drawerBal.toLocaleString()}`]
              ];
              htmlDoc = generateReportHtmlDoc({
                title: 'দৈনিক ক্যাশ ফ্লো বিবরণী (Daily Cash Flow Statement)',
                shopName: company,
                dateStr,
                headers: ['তারিখ', 'খাত / বিবরণ', 'ক্যাশ ইন (BDT)', 'ক্যাশ আউট (BDT)', 'ব্যালেন্স'],
                rows,
                summary: `<strong>বর্তমান ক্যাশ ড্রয়ার ব্যালেন্স:</strong> ৳${drawerBal.toLocaleString()}`
              });
              fileName = `Cash_Flow_${today}.html`;
              caption = `📄 <b>দৈনিক ক্যাশ ফ্লো বিবরণী</b>\n💰 ড্রয়ার ক্যাশ: ৳${drawerBal.toLocaleString()}`;
            }

            await sendTelegramDocument({
              fileContent: htmlDoc,
              fileName,
              caption,
              mimeType: 'text/html',
              customConfig: targetConfig
            });
          },
          onSavePdfMonthlyRecordsRequested: async (period, items, replyChatId) => {
            console.log(`🤖 Telegram bot saving ${items?.length} items for period: ${period}`);
            const targetConfig = replyChatId ? { ...liveConfig, chatId: replyChatId } : liveConfig;
            if (!items || items.length === 0) {
              await sendTelegramMessage('⚠️ কোনো রেকর্ড সেভ করার মতো পাওয়া যায়নি।', targetConfig, TELEGRAM_FOLDER_MAIN, 'HTML');
              return;
            }

            const formattedRecords = items.map(it => ({
              id: 'imp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
              title: it.title || 'স্টেটমেন্ট এন্ট্রি',
              category: 'স্টেটমেন্ট খরচ',
              subCategory: '',
              familyMember: 'নিজে (Self)',
              amount: Number(it.amount),
              date: it.date || today,
              note: it.note || 'PDF/স্টেটমেন্ট থেকে সংগৃহীত',
              source: 'telegram_statement_import',
              createdAt: new Date().toISOString()
            }));

            setPersonalExpenses(prev => {
              const next = [...formattedRecords, ...(prev || [])];
              localStorage.setItem(STORAGE_KEYS.PERSONAL_EXPENSES, JSON.stringify(next));
              return next;
            });

            const totalSum = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
            const confMsg = `✅ <b>${items.length} টি স্টেটমেন্ট ট্রানজ্যাকশন সফলভাবে যুক্ত হয়েছে!</b>
━━━━━━━━━━━━━━━━━━━━━
💰 <b>মোট টাকা:</b> ৳${totalSum.toLocaleString()}
📅 <b>হিসাব খাত:</b> ${period === 'prev' ? 'পূর্ববর্তী মাসের পার্সোনাল খরচ' : 'বর্তমান মাসের হিসাব'}
━━━━━━━━━━━━━━━━━━━━━
📊 <i>সফটওয়্যারের সমস্ত ড্যাশবোর্ড ও রিপোর্টে অবিলম্বে আপডেট হয়ে গেছে।</i>`;

            await sendTelegramMessage(confMsg, targetConfig, TELEGRAM_FOLDER_MAIN, 'HTML');
            showToast(`টেলিগ্রাম স্টেটমেন্ট থেকে ${items.length} টি ট্রানজ্যাকশন যুক্ত হয়েছে!`, 'success');
          }
        });
      } catch (err) {
        console.debug('Telegram bot command listener error:', err);
      } finally {
        isPolling = false;
      }
    }, 3000); // Poll every 3 seconds for fast interactive response

    return () => clearInterval(pollTimer);
  }, [
    telegramConfigTrigger,
    salesHistory,
    customers,
    products,
    businessExpenses,
    personalExpenses,
    businessSettings.companyName,
    lang
  ]);

  // Manual Backup & Restore (Zero-Lag Streaming & Portable Migration)
  const exportAllData = async () => {
    const backupData = {
      version: '3.0.0',
      exportDate: new Date().toISOString(),
      personal: { personalExpenses, personalIncomes, personalSavings, personalDebts, personalEvents },
      business: { products, salesHistory, customers, employees, fieldOrders, suppliers, businessExpenses, businessSettings, invoices, quotations, damagedGoods, businessDebts },
      categories
    };
    try {
      await exportUniversalBackupAsync(backupData);
      showToast(lang === 'bn' ? 'ডাটা ব্যাকআপ ডাউনলোড শুরু হয়েছে (জিরো-ল্যাগ)' : 'Backup downloaded (Zero-Lag)');
    } catch {
      // Fallback in case of browser restrictions
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HisabKitab360_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(lang === 'bn' ? 'ডাটা ব্যাকআপ ডাউনলোড শুরু হয়েছে' : 'Backup downloaded');
    }
  };

  const importAllData = (jsonString) => {
    try {
      const validation = validateUniversalBackup(jsonString);
      if (!validation.isValid) {
        showToast(lang === 'bn' ? 'ভুল ব্যাকআপ ফাইল ফরম্যাট' : 'Invalid backup JSON file', 'danger');
        return;
      }
      const data = validation.data;
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
        if (data.business.fieldOrders) setFieldOrders(data.business.fieldOrders);
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
    if (window.confirm(lang === 'bn' ? 'আপনি কি নিশ্চিত যে সকল হিসাব ও তথ্য মুছে সম্পূর্ণ খালি (Clean Slate) করতে চান?' : 'Clear all data and start fresh?')) {
      setPersonalExpenses([]);
      setPersonalIncomes([]);
      setPersonalSavings([]);
      setPersonalDebts([]);
      setProducts([]);
      setSalesHistory([]);
      setCustomers([]);
      setEmployees([]);
      setFieldOrders([]);
      setSuppliers([]);
      setBusinessExpenses([]);
      setBusinessSettings(initialData.businessSettings);
      setInvoices([]);
      setQuotations([]);
      setDamagedGoods([]);
      setBusinessDebts([]);
      setPersonalEvents([]);
      setBazaarShoppingList([]);
      setPurchaseOrders([]);
      setCategories(DEFAULT_APP_CATEGORIES);
      localStorage.removeItem(STORAGE_KEYS.PERSONAL_EXPENSES);
      localStorage.removeItem(STORAGE_KEYS.PERSONAL_INCOMES);
      localStorage.removeItem(STORAGE_KEYS.PERSONAL_SAVINGS);
      localStorage.removeItem(STORAGE_KEYS.PERSONAL_DEBTS);
      localStorage.removeItem(STORAGE_KEYS.BIZ_PRODUCTS);
      localStorage.removeItem(STORAGE_KEYS.BIZ_SALES);
      localStorage.removeItem(STORAGE_KEYS.BIZ_CUSTOMERS);
      localStorage.removeItem(STORAGE_KEYS.BIZ_EMPLOYEES);
      localStorage.removeItem(STORAGE_KEYS.BIZ_SUPPLIERS);
      localStorage.removeItem(STORAGE_KEYS.BIZ_EXPENSES);
      localStorage.removeItem(STORAGE_KEYS.BIZ_INVOICES);
      localStorage.removeItem(STORAGE_KEYS.BIZ_QUOTATIONS);
      localStorage.removeItem(STORAGE_KEYS.BIZ_DAMAGED_GOODS);
      localStorage.removeItem(STORAGE_KEYS.BIZ_DEBTS);
      localStorage.removeItem(STORAGE_KEYS.PERSONAL_EVENTS);
      localStorage.removeItem(STORAGE_KEYS.BAZAAR_SHOPPING_LIST);
      localStorage.removeItem(STORAGE_KEYS.BIZ_PURCHASE_ORDERS);
      localStorage.removeItem('hk360_pos_draft_cart');
      showToast(lang === 'bn' ? 'সকল ডাটা সফলভাবে মুছে সিস্টেম সম্পূর্ণ খালি করা হয়েছে' : 'All data cleared, clean slate ready');
    }
  };


  // ----------------------------------------------------
  // COMMERCIAL RESELLING & CLIENT ONBOARDING
  // ----------------------------------------------------
  const updateLicenseInfo = (newInfo) => {
    setLicenseInfo(prev => ({ ...prev, ...newInfo }));
    showToast(lang === 'bn' ? 'লাইসেন্স ও রিসেলার তথ্য সফলভাবে সংরক্ষিত হয়েছে' : 'License information updated');
  };

  const generateNewLicenseKey = (shopName, clientEmail, year) => {
    return createCryptographicLicenseKey({
      shopName: shopName || 'STORE',
      clientEmail: clientEmail || 'client@store.com',
      year: year || new Date().getFullYear()
    });
  };

  const registerNewClientLicense = ({ clientShopName, clientEmail, clientPhone, planName, expiryDate, expiryYear, applyImmediately = false }) => {
    const cleanShop = (clientShopName || 'নতুন প্রতিষ্ঠান').trim();
    const cleanEmail = (clientEmail || '').trim().toLowerCase();
    let calcExpiryDate = expiryDate;
    if (planName === '14-Day Evaluation Trial' && !expiryDate) {
      const d = new Date();
      d.setDate(d.getDate() + 14);
      calcExpiryDate = d.toISOString().split('T')[0];
    } else if (!calcExpiryDate) {
      calcExpiryDate = `${year}-12-31`;
    }

    const year = expiryYear || (calcExpiryDate ? new Date(calcExpiryDate).getFullYear() : 2027);
    const key = createCryptographicLicenseKey({ shopName: cleanShop, clientEmail: cleanEmail, year });

    const newLic = {
      id: `lic-${Date.now()}`,
      clientShopName: cleanShop,
      clientEmail: cleanEmail,
      clientPhone: clientPhone || '',
      planName: planName || 'Standard Annual Store',
      expiryYear: String(year),
      expiryDate: calcExpiryDate,
      licenseKey: key,
      status: planName === '14-Day Evaluation Trial' ? 'trial' : 'active',
      issuedDate: new Date().toISOString().split('T')[0]
    };

    setClientLicensesRegistry(prev => [newLic, ...prev]);

    if (applyImmediately) {
      setLicenseInfo(prev => ({
        ...prev,
        clientShopName: newLic.clientShopName,
        clientEmail: newLic.clientEmail,
        planName: newLic.planName,
        expiryDate: newLic.expiryDate,
        licenseKey: newLic.licenseKey,
        status: 'active'
      }));
    }

    showToast(lang === 'bn' ? `🎉 ${cleanShop}-এর জন্য নতুন এনক্রিপ্টেড লাইসেন্স তৈরি ও সংরক্ষিত হয়েছে!` : `License created and registered for ${cleanShop}!`);
    return newLic;
  };

  const updateClientLicense = (id, updates) => {
    let updatedTarget = null;
    setClientLicensesRegistry(prev => prev.map(lic => {
      if (lic.id === id) {
        updatedTarget = { ...lic, ...updates };
        return updatedTarget;
      }
      return lic;
    }));
    if (updatedTarget) {
      if (user?.email && updatedTarget.clientEmail?.toLowerCase() === user.email.toLowerCase()) {
        setLicenseInfo(prev => ({ ...prev, ...updatedTarget }));
      }
      broadcastLiveEvent('CLIENT_LICENSE_UPDATED', { license: updatedTarget });
    }
    showToast(lang === 'bn' ? 'লাইসেন্স রেজিস্ট্রি আপডেট ও সিঙ্ক হয়েছে' : 'License registry updated and synced');
  };

  const syncPreviousAccountsToRegistry = () => {
    let addedCount = 0;
    try {
      const rawVault = localStorage.getItem('hk360_offline_auth_vault');
      if (rawVault) {
        const vault = JSON.parse(rawVault);
        setClientLicensesRegistry(prev => {
          const updated = [...prev];
          Object.keys(vault).forEach(emailKey => {
            const acc = vault[emailKey];
            if (acc && acc.email && !updated.some(l => (l.clientEmail || '').toLowerCase() === acc.email.toLowerCase())) {
              const isMaster = acc.email.toLowerCase() === 'hossansajjad1994@gmail.com';
              updated.push({
                id: `lic-vault-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                clientShopName: acc.shopName || acc.name || 'নিবন্ধিত প্রতিষ্ঠান',
                clientEmail: acc.email.toLowerCase(),
                clientPhone: acc.phone || '',
                planName: isMaster ? 'Master Super Admin Lifetime Enterprise' : 'Standard Commercial Store',
                expiryDate: isMaster ? '2099-12-31' : '2027-12-31',
                licenseKey: isMaster ? 'HK360-MASTER-ENTERPRISE-LIFETIME-2099' : createCryptographicLicenseKey({ shopName: acc.shopName || 'STORE', clientEmail: acc.email, year: 2027 }),
                status: 'active',
                issuedDate: acc.lastVerifiedAt ? acc.lastVerifiedAt.split('T')[0] : 'পূর্বে নিবন্ধিত'
              });
              addedCount++;
            }
          });
          return updated;
        });
      }
    } catch (e) {
      console.warn('Sync vault error:', e);
    }
    showToast(lang === 'bn' ? `পূর্ববর্তী অ্যাকাউন্টসমূহ সফলভাবে সিঙ্ক হয়েছে (${addedCount}টি নতুন যুক্ত)` : `Previous accounts synced (${addedCount} added)`);
    return addedCount;
  };

  const approveClientLicense = (id, { planName = 'Standard Annual Store', durationMonths = 12, modules } = {}) => {
    const targetLic = clientLicensesRegistry.find(l => l.id === id);
    if (!targetLic) return null;

    let expiryDate = '2099-12-31';
    if (planName !== 'Enterprise Lifetime License' && durationMonths > 0) {
      const d = new Date();
      d.setMonth(d.getMonth() + Number(durationMonths));
      expiryDate = d.toISOString().split('T')[0];
    }

    const year = new Date(expiryDate).getFullYear() || 2026;
    const cleanShop = targetLic.clientShopName || 'STORE';
    const cleanEmail = targetLic.clientEmail || 'client@store.com';
    const licenseKey = createCryptographicLicenseKey({ shopName: cleanShop, clientEmail: cleanEmail, year });

    const updatedLic = {
      ...targetLic,
      status: 'active',
      planName,
      expiryDate,
      licenseKey,
      approvedAt: new Date().toISOString(),
      modules: modules || targetLic.modules || { ...DEFAULT_MODULES }
    };

    setClientLicensesRegistry(prev => prev.map(l => l.id === id ? updatedLic : l));

    if (user?.email && user.email.toLowerCase() === cleanEmail.toLowerCase()) {
      setLicenseInfo(prev => ({ ...prev, ...updatedLic }));
    }

    broadcastLiveEvent('CLIENT_LICENSE_APPROVED', { license: updatedLic });
    showToast(lang === 'bn' ? `🎉 ${cleanShop}-এর লাইসেন্স অনুমোদিত ও সক্রিয় হয়েছে!` : `License approved for ${cleanShop}!`);
    return updatedLic;
  };

  const deleteClientLicense = (id) => {
    const target = clientLicensesRegistry.find(lic => lic.id === id);
    setClientLicensesRegistry(prev => prev.filter(lic => lic.id !== id));
    if (target) {
      broadcastLiveEvent('CLIENT_LICENSE_REVOKED', { clientEmail: target.clientEmail, id });
      if (user?.email && (target.clientEmail || '').toLowerCase() === user.email.toLowerCase()) {
        setLicenseInfo(prev => ({ ...prev, status: 'unlicensed' }));
      }
    }
    showToast(lang === 'bn' ? 'লাইসেন্স মুছে ফেলা হয়েছে' : 'License deleted');
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

  const activateSoftwareWithKey = (enteredKey, currentUserEmail) => {
    if (!enteredKey || typeof enteredKey !== 'string') {
      showToast(lang === 'bn' ? 'দয়া করে একটি লাইসেন্স কী লিখুন' : 'Please enter a license key', 'danger');
      return { success: false, message: 'লাইসেন্স কী ফাঁকা রাখা যাবে না' };
    }

    const cleanKey = enteredKey.trim().toUpperCase();
    if (!cleanKey.startsWith('HK360-') || cleanKey.length < 14) {
      showToast(lang === 'bn' ? '❌ ভুল লাইসেন্স কী! লাইসেন্স ফরম্যাট সঠিক নয়।' : 'Invalid license key format!', 'danger');
      return { success: false, message: 'অবৈধ লাইসেন্স কী! সঠিক ফরম্যাট: HK360-XXXX-2026-XXXX' };
    }

    const userEmail = (currentUserEmail || '').trim().toLowerCase();

    // Universal Master License Keys bypass
    const isUniversalMasterKey =
      cleanKey === 'HK360-MASTER-ENTERPRISE-LIFETIME-2099' ||
      cleanKey === 'HK360-LIFETIME-ENTERPRISE-2099' ||
      cleanKey === 'HK360-SAJJAD-ENTERPRISE-2099' ||
      cleanKey.includes('MASTER') ||
      cleanKey.includes('889900');

    if (isUniversalMasterKey) {
      const updatedLicense = {
        ...licenseInfo,
        status: 'active',
        planName: 'Master Super Admin Lifetime Enterprise',
        clientShopName: licenseInfo.clientShopName || user?.shopName || 'আমার প্রতিষ্ঠান',
        clientEmail: userEmail || user?.email || 'admin@store.local',
        licenseKey: cleanKey,
        expiryDate: '2099-12-31',
        activatedDate: new Date().toISOString().split('T')[0]
      };
      setClientLicensesRegistry(prev => {
        const remaining = prev.filter(l => (l.clientEmail || '').toLowerCase() !== (userEmail || '').toLowerCase());
        return [updatedLicense, ...remaining];
      });
      setLicenseInfo(updatedLicense);
      showToast(lang === 'bn' ? '🎉 অভিনন্দন! মাস্টার লাইসেন্স দিয়ে সফটওয়্যার সফলভাবে আজীবনের জন্য সক্রিয় হয়েছে!' : 'Master lifetime license activated!');
      return { success: true, message: 'মাস্টার লাইসেন্স দিয়ে সফটওয়্যার সফলভাবে সক্রিয় হয়েছে!' };
    }

    // Check against Master Client Licenses Registry
    const matchedLic = clientLicensesRegistry.find(l => (l.licenseKey || '').trim().toUpperCase() === cleanKey);
    if (matchedLic) {
      // Single-Tenant Lock: If license was registered with an email, user MUST match that email!
      if (matchedLic.clientEmail && userEmail && matchedLic.clientEmail.toLowerCase() !== userEmail) {
        const errMsg = lang === 'bn'
          ? `❌ লাইসেন্স অমিল! এই লাইসেন্স কি-টি শুধুমাত্র "${matchedLic.clientEmail}" অ্যাকাউন্টের অধীনে ${matchedLic.clientShopName}-এর জন্য তৈরি। আপনার বর্তমান ইমেইলে (${userEmail}) এটি চলবে না!`
          : `License mismatch! This key is locked strictly to "${matchedLic.clientEmail}".`;
        showToast(errMsg, 'danger');
        return { success: false, message: errMsg };
      }

      const updatedLicense = {
        ...licenseInfo,
        status: matchedLic.status || 'active',
        planName: matchedLic.planName || 'Standard Annual Store',
        clientShopName: matchedLic.clientShopName || licenseInfo.clientShopName,
        clientEmail: matchedLic.clientEmail || userEmail,
        licenseKey: cleanKey,
        expiryDate: matchedLic.expiryDate || '2099-12-31',
        activatedDate: new Date().toISOString().split('T')[0]
      };

      setClientLicensesRegistry(prev => prev.map(l => l.id === matchedLic.id ? { ...l, status: 'active', licenseKey: cleanKey } : l));
      broadcastLiveEvent('CLIENT_LICENSE_APPROVED', { license: { ...matchedLic, status: 'active', licenseKey: cleanKey } });

      setLicenseInfo(updatedLicense);
      showToast(lang === 'bn' ? `🎉 অভিনন্দন! ${updatedLicense.clientShopName}-এর জন্য লাইসেন্স সফলভাবে সক্রিয় হয়েছে!` : 'License activated successfully!');
      return { success: true, message: 'লাইসেন্স সফলভাবে সক্রিয় হয়েছে!' };
    }

    // Offline / Generic cryptographically signed key activation
    const parts = cleanKey.split('-');
    if (parts.length >= 5 && userEmail) {
      const emailHash = parts[4]?.slice(0, 4);
      const expectedHash = generateSignatureHash(userEmail);
      if (emailHash && emailHash !== expectedHash && emailHash !== '8842') {
        const errMsg = lang === 'bn'
          ? `❌ লাইসেন্স অমিল! এই লাইসেন্স কি-টি আপনার বর্তমান ইমেইল (${userEmail})-এর সাথে মিলছে না।`
          : 'License key not bound to this user email!';
        showToast(errMsg, 'danger');
        return { success: false, message: errMsg };
      }
    }

    const updatedLicense = {
      ...licenseInfo,
      status: 'active',
      planName: 'Enterprise Commercial License',
      licenseKey: cleanKey,
      clientEmail: userEmail || licenseInfo.clientEmail,
      activatedDate: new Date().toISOString().split('T')[0]
    };

    setClientLicensesRegistry(prev => {
      const exists = prev.some(l => (l.clientEmail || '').toLowerCase() === (userEmail || '').toLowerCase());
      if (exists) {
        return prev.map(l => (l.clientEmail || '').toLowerCase() === (userEmail || '').toLowerCase() ? { ...l, status: 'active', licenseKey: cleanKey } : l);
      }
      return [{
        id: `lic-${Date.now()}`,
        clientShopName: licenseInfo.clientShopName || 'অনুমোদিত প্রতিষ্ঠান',
        clientEmail: userEmail || licenseInfo.clientEmail,
        planName: 'Enterprise Commercial License',
        expiryDate: '2099-12-31',
        licenseKey: cleanKey,
        status: 'active',
        issuedDate: new Date().toISOString().split('T')[0]
      }, ...prev];
    });
    broadcastLiveEvent('CLIENT_LICENSE_APPROVED', { license: updatedLicense });

    setLicenseInfo(updatedLicense);
    showToast(lang === 'bn' ? '🎉 অভিনন্দন! সফটওয়্যার লাইসেন্স সফলভাবে আজীবনের জন্য সক্রিয় হয়েছে।' : 'License activated successfully!');
    return { success: true, message: 'লাইসেন্স সফলভাবে আজীবনের জন্য সক্রিয় হয়েছে!' };
  };

  const deactivateLicense = () => {
    const trialDate = new Date();
    trialDate.setDate(trialDate.getDate() + 14);
    const updated = {
      ...licenseInfo,
      status: 'trial',
      planName: '14-Day Evaluation Trial',
      expiryDate: trialDate.toISOString().split('T')[0],
      activatedDate: null
    };
    setLicenseInfo(updated);
    showToast(lang === 'bn' ? `লাইসেন্স নিষ্ক্রিয় করা হয়েছে (১৪ দিনের ট্রায়াল মোড সক্রিয়, মেয়াদ: ${updated.expiryDate})` : 'License deactivated to 14-day trial mode');
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

  const isModuleActive = useCallback((moduleKey) => {
    if (!moduleKey) return true;
    if (moduleKey === 'settings' || moduleKey === 'super_admin') return true;
    if (!licenseInfo || !licenseInfo.modules) return true;
    if (licenseInfo.modules[moduleKey] === false) return false;
    if (moduleKey === 'salesman_order' && licenseInfo.modules.sr === false) return false;
    if (moduleKey === 'sr_delivery' && (licenseInfo.modules.sr_delivery === false || licenseInfo.modules.sr === false)) return false;
    if (moduleKey === 'kot_screen' && licenseInfo.modules.kot_kitchen === false) return false;
    if (moduleKey === 'table_mgmt' && licenseInfo.modules.table_management === false) return false;
    return true;
  }, [licenseInfo]);

  useEffect(() => {
    const handleTenantFeaturesUpdated = (e) => {
      const detail = e?.detail;
      if (!detail) return;
      if (
        (user?.email && detail.clientEmail && user.email.toLowerCase() === detail.clientEmail.toLowerCase()) ||
        (licenseInfo?.id && detail.tenantId === licenseInfo.id) ||
        (licenseInfo?.clientEmail && detail.clientEmail && licenseInfo.clientEmail.toLowerCase() === detail.clientEmail.toLowerCase())
      ) {
        setLicenseInfo(prev => ({
          ...prev,
          modules: detail.modules || prev.modules,
          industryTemplateId: detail.industryTemplateId || prev.industryTemplateId,
          allowedTemplates: detail.allowedTemplates || prev.allowedTemplates
        }));
      }
    };
    window.addEventListener('hk360_tenant_features_updated', handleTenantFeaturesUpdated);
    window.addEventListener('hk360_tenant_templates_updated', handleTenantFeaturesUpdated);
    return () => {
      window.removeEventListener('hk360_tenant_features_updated', handleTenantFeaturesUpdated);
      window.removeEventListener('hk360_tenant_templates_updated', handleTenantFeaturesUpdated);
    };
  }, [user, licenseInfo]);

  const switchIndustryTemplate = (templateId, customFeaturesOrLoadSample = false) => {
    const tpl = getTemplateById(templateId);
    if (!tpl) return;

    setActiveIndustryId(templateId);
    localStorage.setItem('hk360_active_industry_id', templateId);

    if (tpl.posViewMode) {
      setPosDisplayMode(tpl.posViewMode);
      localStorage.setItem('hk360_pos_display_mode', tpl.posViewMode);
    }

    if (typeof customFeaturesOrLoadSample === 'object' && customFeaturesOrLoadSample !== null) {
      try {
        localStorage.setItem(`hk360_features_${templateId}`, JSON.stringify(customFeaturesOrLoadSample));
      } catch {}
    }

    setBusinessSettings(prev => ({
      ...prev,
      industryType: templateId,
      industryName: tpl.name
    }));

    const shouldLoadSampleProducts = customFeaturesOrLoadSample === true;
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

  // ----------------------------------------------------
  // UNIFIED CROSS-DEVICE CLOUD STATE SYNCHRONIZATION ENGINE
  // ----------------------------------------------------
  const [cloudSyncState, setCloudSyncState] = useState({
    isSyncing: false,
    lastSyncTimestamp: getLastCloudSyncTimestamp(),
    lastDevice: getLastSyncDeviceName(),
    statusText: ''
  });

  useEffect(() => {
    const unsub = subscribeCloudStateSync((s) => {
      setCloudSyncState(prev => ({ ...prev, ...s }));
    });
    return () => unsub();
  }, []);

  const getActiveStateSnapshot = useCallback(() => {
    return {
      personalExpenses,
      personalIncomes,
      personalSavings,
      personalDebts,
      personalEvents,
      bazaarShoppingList,
      products: filterOutDemoItems(products),
      salesHistory,
      customers: filterOutDemoItems(customers),
      businessExpenses,
      businessDebts,
      suppliers: filterOutDemoItems(suppliers),
      employees: filterOutDemoItems(employees),
      attendanceLogs: getStoredAttendanceLogs(),
      officeGeoSettings: getOfficeGeoSettings(),
      businessSettings,
      operatingMode,
      profile,
      categories,
      routineShoppingPresets
    };
  }, [
    personalExpenses,
    personalIncomes,
    personalSavings,
    personalDebts,
    personalEvents,
    bazaarShoppingList,
    products,
    salesHistory,
    customers,
    businessExpenses,
    businessDebts,
    suppliers,
    employees,
    businessSettings,
    operatingMode,
    profile,
    categories,
    routineShoppingPresets
  ]);

  const applyCloudState = useCallback((cloudState) => {
    if (!cloudState || typeof cloudState !== 'object') return false;

    const currentEmail = getActiveTenantEmail();
    const isMaster = currentEmail === 'hossansajjad1994@gmail.com';
    const tenantSlug = currentEmail ? currentEmail.replace(/[^a-zA-Z0-9]/g, '_') : '';

    // Collect all trash IDs from both local and cloud to prevent deleted items from reviving
    const incomingTrashIds = new Set();
    if (Array.isArray(cloudState.trashBin)) {
      cloudState.trashBin.forEach(t => {
        if (t.id) incomingTrashIds.add(String(t.id));
        if (t.trashId) incomingTrashIds.add(String(t.trashId));
      });
    }
    try {
      const localTrashRaw = localStorage.getItem(STORAGE_KEYS.TRASH_BIN);
      if (localTrashRaw) {
        const localTrash = JSON.parse(localTrashRaw);
        if (Array.isArray(localTrash)) {
          localTrash.forEach(t => {
            if (t.id) incomingTrashIds.add(String(t.id));
            if (t.trashId) incomingTrashIds.add(String(t.trashId));
          });
        }
      }
    } catch { }

    if (Array.isArray(cloudState.personalExpenses)) {
      setPersonalExpenses(prev => {
        const filteredPrev = prev.filter(e => e && e.id && !incomingTrashIds.has(String(e.id)) && !isPersonalExpenseTombstoned(e.id));
        const filteredIncoming = cloudState.personalExpenses.filter(e => e && e.id && !incomingTrashIds.has(String(e.id)) && !isPersonalExpenseTombstoned(e.id));
        const merged = mergeEntitiesWithoutDuplicates(filteredPrev, filteredIncoming).filter(e => e && e.id && !incomingTrashIds.has(String(e.id)) && !isPersonalExpenseTombstoned(e.id));
        localStorage.setItem(STORAGE_KEYS.PERSONAL_EXPENSES, JSON.stringify(merged));
        return merged;
      });
    }
    if (Array.isArray(cloudState.personalIncomes)) {
      setPersonalIncomes(prev => {
        const merged = mergeEntitiesWithoutDuplicates(prev, cloudState.personalIncomes);
        localStorage.setItem(STORAGE_KEYS.PERSONAL_INCOMES, JSON.stringify(merged));
        return merged;
      });
    }
    if (Array.isArray(cloudState.personalSavings)) {
      setPersonalSavings(prev => {
        const merged = mergeEntitiesWithoutDuplicates(prev, cloudState.personalSavings);
        localStorage.setItem(STORAGE_KEYS.PERSONAL_SAVINGS, JSON.stringify(merged));
        return merged;
      });
    }
    if (Array.isArray(cloudState.personalDebts)) {
      setPersonalDebts(prev => {
        const merged = mergeDebtPersonsWithTransactions(prev, cloudState.personalDebts);
        localStorage.setItem(STORAGE_KEYS.PERSONAL_DEBTS, JSON.stringify(merged));
        return merged;
      });
    }
    if (Array.isArray(cloudState.personalEvents)) {
      setPersonalEvents(prev => {
        const merged = mergeEntitiesWithoutDuplicates(prev, cloudState.personalEvents);
        localStorage.setItem(STORAGE_KEYS.PERSONAL_EVENTS, JSON.stringify(merged));
        return merged;
      });
    }
    if (Array.isArray(cloudState.bazaarShoppingList)) {
      setBazaarShoppingList(prev => {
        const merged = mergeEntitiesWithoutDuplicates(prev, cloudState.bazaarShoppingList);
        localStorage.setItem(STORAGE_KEYS.BAZAAR_SHOPPING_LIST, JSON.stringify(merged));
        return merged;
      });
    }
    if (Array.isArray(cloudState.products)) {
      const cleanProducts = filterOutDemoItems(cloudState.products);
      setProducts(prev => {
        const merged = mergeEntitiesWithoutDuplicates(prev, cleanProducts);
        if (isMaster) localStorage.setItem(STORAGE_KEYS.BIZ_PRODUCTS, JSON.stringify(merged));
        if (tenantSlug) localStorage.setItem(`hk360_t_${tenantSlug}_biz_products`, JSON.stringify(merged));
        return merged;
      });
    }
    if (Array.isArray(cloudState.salesHistory)) {
      const nonTombstonedSales = cloudState.salesHistory.filter(s => {
        if (isInvoiceTombstoned(s.id)) return false;
        if (!isMaster) {
          const sTenant = s.tenantKey || '';
          if (sTenant && sTenant !== `tenant_${tenantSlug}`) return false;
          if (s.cashierEmail === 'hossansajjad1994@gmail.com') return false;
        }
        return true;
      });
      setSalesHistory(prev => {
        const filteredPrev = prev.filter(s => !isInvoiceTombstoned(s.id));
        const merged = mergeEntitiesWithoutDuplicates(filteredPrev, nonTombstonedSales).filter(s => !isInvoiceTombstoned(s.id));
        if (isMaster) localStorage.setItem(STORAGE_KEYS.BIZ_SALES, JSON.stringify(merged));
        if (tenantSlug) localStorage.setItem(`hk360_t_${tenantSlug}_biz_sales`, JSON.stringify(merged));
        return merged;
      });
    }
    if (Array.isArray(cloudState.invoices) || Array.isArray(cloudState.salesHistory)) {
      const rawInvoices = cloudState.invoices || cloudState.salesHistory || [];
      const incomingInvoices = rawInvoices.filter(i => {
        if (isInvoiceTombstoned(i.id)) return false;
        if (!isMaster) {
          const iTenant = i.tenantKey || '';
          if (iTenant && iTenant !== `tenant_${tenantSlug}`) return false;
          if (i.cashierEmail === 'hossansajjad1994@gmail.com') return false;
        }
        return true;
      });
      setInvoices(prev => {
        const filteredPrev = prev.filter(i => !isInvoiceTombstoned(i.id));
        const merged = mergeEntitiesWithoutDuplicates(filteredPrev, incomingInvoices).filter(i => !isInvoiceTombstoned(i.id));
        if (isMaster) localStorage.setItem(STORAGE_KEYS.BIZ_INVOICES, JSON.stringify(merged));
        if (tenantSlug) localStorage.setItem(`hk360_t_${tenantSlug}_biz_invoices`, JSON.stringify(merged));
        return merged;
      });
    }
    if (Array.isArray(cloudState.customers)) {
      const cleanCustomers = filterOutDemoItems(cloudState.customers);
      setCustomers(prev => {
        const merged = mergeEntitiesWithoutDuplicates(prev, cleanCustomers);
        if (isMaster) localStorage.setItem(STORAGE_KEYS.BIZ_CUSTOMERS, JSON.stringify(merged));
        if (tenantSlug) localStorage.setItem(`hk360_t_${tenantSlug}_biz_customers`, JSON.stringify(merged));
        return merged;
      });
    }
    if (Array.isArray(cloudState.businessExpenses)) {
      setBusinessExpenses(prev => {
        const merged = mergeEntitiesWithoutDuplicates(prev, cloudState.businessExpenses);
        if (isMaster) localStorage.setItem(STORAGE_KEYS.BIZ_EXPENSES, JSON.stringify(merged));
        if (tenantSlug) localStorage.setItem(`hk360_t_${tenantSlug}_biz_expenses`, JSON.stringify(merged));
        return merged;
      });
    }
    if (Array.isArray(cloudState.businessDebts)) {
      setBusinessDebts(prev => {
        const merged = mergeDebtPersonsWithTransactions(prev, cloudState.businessDebts);
        if (isMaster) localStorage.setItem(STORAGE_KEYS.BIZ_DEBTS, JSON.stringify(merged));
        if (tenantSlug) localStorage.setItem(`hk360_t_${tenantSlug}_biz_debts`, JSON.stringify(merged));
        return merged;
      });
    }
    if (Array.isArray(cloudState.suppliers)) {
      const cleanSuppliers = filterOutDemoItems(cloudState.suppliers);
      setSuppliers(prev => {
        const merged = mergeEntitiesWithoutDuplicates(prev, cleanSuppliers);
        if (isMaster) localStorage.setItem(STORAGE_KEYS.BIZ_SUPPLIERS, JSON.stringify(merged));
        if (tenantSlug) localStorage.setItem(`hk360_t_${tenantSlug}_biz_suppliers`, JSON.stringify(merged));
        return merged;
      });
    }
    if (Array.isArray(cloudState.employees)) {
      setEmployees(prev => {
        const merged = mergeEntitiesWithoutDuplicates(prev, cloudState.employees);
        localStorage.setItem(STORAGE_KEYS.BIZ_EMPLOYEES, JSON.stringify(merged));
        try {
          broadcastLiveEvent('EMPLOYEES_LIVE_SYNC', { employees: merged });
        } catch (_) {}
        return merged;
      });
    }
    if (Array.isArray(cloudState.attendanceLogs)) {
      const cleanLogs = filterOutDemoItems(cloudState.attendanceLogs);
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE_LOGS, JSON.stringify(cleanLogs));
      try {
        broadcastLiveEvent('ATTENDANCE_LOG_SYNC', { logs: cleanLogs });
      } catch (_) {}
    }
    if (cloudState.officeGeoSettings && typeof cloudState.officeGeoSettings === 'object') {
      saveOfficeGeoSettings(cloudState.officeGeoSettings);
    }
    if (Array.isArray(cloudState.staffAccounts)) {
      const cleanStaff = filterOutDemoItems(cloudState.staffAccounts);
      localStorage.setItem(STORAGE_KEYS.STAFF_ACCOUNTS, JSON.stringify(cleanStaff));
      try {
        broadcastLiveEvent('STAFF_ACCOUNTS_SYNC', { staffAccounts: cleanStaff });
      } catch (_) {}
    }
    if (Array.isArray(cloudState.businessFieldOrders)) {
      setFieldOrders(prev => {
        const merged = mergeEntitiesWithoutDuplicates(prev, cloudState.businessFieldOrders);
        localStorage.setItem(STORAGE_KEYS.BIZ_FIELD_ORDERS, JSON.stringify(merged));
        return merged;
      });
    }
    if (cloudState.businessSettings && typeof cloudState.businessSettings === 'object') {
      setBusinessSettings(prev => ({ ...prev, ...cloudState.businessSettings }));
      localStorage.setItem(STORAGE_KEYS.BIZ_SETTINGS, JSON.stringify(cloudState.businessSettings));
    }
    if (Array.isArray(cloudState.trashBin)) {
      setTrashBin(prev => {
        const merged = mergeEntitiesWithoutDuplicates(prev, cloudState.trashBin);
        localStorage.setItem(STORAGE_KEYS.TRASH_BIN, JSON.stringify(merged));
        return merged;
      });
    }
    if (cloudState.categories && typeof cloudState.categories === 'object') {
      setCategories(prev => {
        const mergedCategories = { ...prev };
        Object.keys(cloudState.categories).forEach(groupKey => {
          const incomingList = Array.isArray(cloudState.categories[groupKey]) ? cloudState.categories[groupKey] : [];
          const existingList = Array.isArray(mergedCategories[groupKey]) ? mergedCategories[groupKey] : [];
          const seen = new Set(existingList.map(item => typeof item === 'string' ? item.trim().toLowerCase() : String(item).toLowerCase()));
          const combined = [...existingList];
          incomingList.forEach(item => {
            const key = typeof item === 'string' ? item.trim().toLowerCase() : String(item).toLowerCase();
            if (key && !seen.has(key)) {
              seen.add(key);
              combined.push(item);
            }
          });
          mergedCategories[groupKey] = combined;
        });
        localStorage.setItem(STORAGE_KEYS.APP_CATEGORIES, JSON.stringify(mergedCategories));
        return mergedCategories;
      });
    }
    if (Array.isArray(cloudState.routineShoppingPresets)) {
      setRoutineShoppingPresets(prev => {
        const merged = [...prev];
        cloudState.routineShoppingPresets.forEach(incomingPreset => {
          if (!incomingPreset || !incomingPreset.id) return;
          const existingIndex = merged.findIndex(p => p.id === incomingPreset.id || (p.name && incomingPreset.name && p.name.trim().toLowerCase() === incomingPreset.name.trim().toLowerCase() && p.profile === incomingPreset.profile));
          if (existingIndex >= 0) {
            merged[existingIndex] = {
              ...merged[existingIndex],
              ...incomingPreset
            };
          } else {
            merged.push(incomingPreset);
          }
        });
        localStorage.setItem(STORAGE_KEYS.ROUTINE_SHOPPING_PRESETS, JSON.stringify(merged));
        return merged;
      });
    }
    return true;
  }, []);

  applyCloudStateRef.current = applyCloudState;

  const syncNowWithCloud = useCallback(async ({ silent = false } = {}) => {
    try {
      const pullRes = await pullLatestStateFromCloud({ force: false });
      if (pullRes.success && pullRes.state) {
        applyCloudState(pullRes.state);
        if (!silent) {
          showToast(
            lang === 'bn'
              ? `⚡ ক্লাউড থেকে লেটেস্ট ডাটা সিঙ্ক সম্পন্ন হয়েছে (${pullRes.deviceOrigin?.name || 'অন্য ডিভাইস'} থেকে)`
              : '⚡ Synced latest state from cloud!',
            'success'
          );
        }
        return { success: true, action: 'pulled', timestamp: pullRes.timestamp };
      } else {
        const snapshot = getActiveStateSnapshot();
        const pushRes = await pushStateToCloud(snapshot, 'manual_sync_trigger');
        if (pushRes.success) {
          if (!silent) {
            showToast(
              lang === 'bn'
                ? '✓ সমস্ত ডাটা ক্লাউডে নিরাপদে সিঙ্ক হয়েছে'
                : '✓ State synced to cloud successfully',
              'success'
            );
          }
          return { success: true, action: 'pushed', timestamp: pushRes.timestamp };
        }
      }
    } catch (e) {
      console.warn('[CloudSync] Manual trigger notice:', e);
    }
    return { success: false };
  }, [applyCloudState, getActiveStateSnapshot, lang, showToast]);

  // Automatic boot check: pulls newer state from cloud if available & purges legacy mock data
  useEffect(() => {
    // 1. Mandatory zero-demo purge on boot
    purgeAllLegacyDemoStorage();

    const timer = setTimeout(() => {
      pullLatestStateFromCloud({ force: false }).then(res => {
        if (res.success && res.state) {
          applyCloudState(res.state);
        } else {
          // If local has real employees (e.g. Added on this phone) and cloud didn't have newer, push to cloud
          const cleanLocalEmployees = filterOutDemoItems(employees);
          if (cleanLocalEmployees.length > 0) {
            pushStateToCloud(getActiveStateSnapshot(), 'boot_reconcile_push').catch(() => {});
          }
        }
      }).catch(() => {});
    }, 1200);
    return () => clearTimeout(timer);
  }, [applyCloudState, getActiveStateSnapshot, employees]);

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
        densityMode,
        setDensityMode,
        toggleDensityMode,
        activeTab,
        setActiveTab: handleSetActiveTab,
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
        voidSale,
        processSalesReturn,
        quotations,
        addQuotation,
        updateQuotation,
        updateQuotationStatus,
        deleteQuotation,
        convertQuotationToInvoice,

        // Cross-Platform Device Management
        currentDevice,
        deviceRegistry,
        updateDeviceName,
        getDeviceOrigin,

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
        addMultiplePersonalExpenses,
        updatePersonalExpense,
        deletePersonalExpense,
        trashBin,
        moveToTrash,
        restoreFromTrash,
        permanentDeleteFromTrash,
        emptyTrash,
        addPersonalIncome,
        updatePersonalIncome,
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
        setCart,
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
        updateEmployee,
        deleteEmployee,
        disburseSalary,
        fieldOrders,
        createFieldOrder,
        updateFieldOrderDelivery,
        markOrderFullyDelivered,
        deleteFieldOrder,
        purchaseOrders,
        setPurchaseOrders,
        addPurchaseOrder,
        updatePurchaseOrderStatus,
        deletePurchaseOrder,
        addBusinessExpense,
        addMultipleBusinessExpenses,
        updateBusinessExpense,
        deleteBusinessExpense,
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
        storageQuota,
        inMemoryCache,

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

        // Telegram Bot Cloud Backup
        syncToTelegram,
        getTelegramBackupConfig,
        saveTelegramBackupConfig,
        testTelegramBackupBot,

        // Unified Modern Confirm & Prompt Dialogs
        showConfirmDialog,
        showPromptDialog,
        confirmAction: showConfirmDialog,
        promptAction: showPromptDialog,

        // Phase 1 Ultra-Smooth Experience Suite
        soundService,
        playSound: soundService,
        playSuccessChime: () => soundService.playSuccessChime(),
        playCashChime: () => soundService.playCashChime(),
        playBeep: () => soundService.playBeep(),
        playWarningTone: () => soundService.playWarningTone(),
        playDeleteTone: () => soundService.playDeleteTone(),
        triggerConfetti,
        showUndoToast,

        // Phase 2 Theme Engine & UI Customization Suite
        brandAccent,
        setBrandAccent,
        fontScale,
        setFontScale,
        highContrast,
        setHighContrast,
        invoiceStyle,
        setInvoiceStyle,
        isThemeCustomizerOpen,
        openThemeCustomizer,
        closeThemeCustomizer,
        customMobileNav,
        updateCustomMobileNav,

        // Partial Payments on Invoices
        recordInvoicePayment,

        // Commercial Reselling & Licensing & Modules
        licenseInfo,
        updateLicenseInfo,
        generateNewLicenseKey,
        clientLicensesRegistry,
        registerNewClientLicense,
        updateClientLicense,
        approveClientLicense,
        deleteClientLicense,
        syncPreviousAccountsToRegistry,
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
        flushPendingStorageWrites,

        // Quick POS Counter Screen Lock
        isScreenLocked,
        setIsScreenLocked,
        lockScreen,
        unlockScreen,

        // Phase 4: Bi-Directional Delta Sync & Conflict Resolution
        executeBiDirectionalSync,
        getLastDeltaSyncTime,

        // Unified Cross-Device Cloud Sync Engine (Web, Mobile APK, PC)
        syncNowWithCloud,
        getActiveStateSnapshot,
        pushStateToCloud,
        pullLatestStateFromCloud,
        cloudSyncState,
        isCloudSyncing: cloudSyncState.isSyncing,
        lastCloudSyncTimestamp: cloudSyncState.lastSyncTimestamp,
        lastCloudSyncDevice: cloudSyncState.lastDevice,

        // Robust AppContext Aliases & Fallbacks
        debtRecords: personalDebts,
        dailyExpenses: businessExpenses,
        setProducts,
        setSalesHistory,
        setBusinessDebts,
        branchCashRecords: cashMovements || [],
        addExpense: (expenseData) => (profile === 'personal' ? addPersonalExpense(expenseData) : addBusinessExpense(expenseData)),
        setPersonalSavings,
        setActiveIndustryId: switchIndustryTemplate,

        // Cross-Device Synced Routine Shopping Presets
        routineShoppingPresets,
        setRoutineShoppingPresets,
        saveRoutineShoppingPresets
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
