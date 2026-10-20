/**
 * HisabKitab 360 - Granular Staff Role Menu & Permission Engine
 * -------------------------------------------------------------
 * Allows Business Owner/Admin to independently toggle any app feature/menu
 * ON or OFF for Cashier, Salesman, Delivery Man/Manager, and General Staff.
 */

export const STAFF_ROLES = [
  { id: 'cashier', label: 'ক্যাশিয়ার / কাউন্টারম্যান', enLabel: 'Cashier / Counter', badge: 'POS', color: '#10b981', icon: 'ScanLine' },
  { id: 'salesman', label: 'সেলসম্যান / এসআর', enLabel: 'Salesman / SR', badge: 'FIELD', color: '#f59e0b', icon: 'FileText' },
  { id: 'delivery', label: 'ডেলিভারি ম্যান / ম্যানেজার', enLabel: 'Delivery Rider / Mgr', badge: 'ROUTE', color: '#0ea5e9', icon: 'Truck' },
  { id: 'staff', label: 'সাধারণ কর্মচারী / স্টাফ', enLabel: 'General Staff', badge: 'STAFF', color: '#8b5cf6', icon: 'Users' }
];

export const MENU_CATEGORIES = [
  {
    id: 'sales_billing',
    title: '🛒 বিক্রয়, মেমো ও বিলিং মডিউল',
    enTitle: 'Sales & Billing Modules',
    items: [
      { id: 'pos', name: 'POS সেলস কাউন্টার', desc: 'খুচরা বিক্রয়, দ্রুত বিলিং ও থার্মাল প্রিন্ট', category: 'sales_billing' },
      { id: 'salesman_order', name: 'সেলসম্যান অর্ডার বুকিং', desc: 'দোকানে ঘুরে অর্ডার কাটা ও ড্রাফট বুকিং', category: 'sales_billing' },
      { id: 'sr_delivery', name: 'এসআর ডেলিভারি হাব ও ক্যাশ', desc: 'দোকানে মাল ডেলিভারি ও টাকা সংগ্রহ', category: 'sales_billing' },
      { id: 'invoices', name: 'চালান ও ইনভয়েস হিস্ট্রি', desc: 'সকল পূর্ববর্তী বিক্রয় মেমো ও চালান তালিকা', category: 'sales_billing' },
      { id: 'quotations', name: 'কোটেশন ও এস্টিমেট', desc: 'আনুমানিক খরচের অফার ও দরপত্র', category: 'sales_billing' },
      { id: 'branch_control', name: 'মাল্টি-ব্রাঞ্চ ও ক্যাশ কন্ট্রোল', desc: 'শাখা, কাউন্টার ও শিফট ক্যাশ তদারকি', category: 'sales_billing' }
    ]
  },
  {
    id: 'inventory_catalog',
    title: '📦 পণ্য, স্টক ও ক্যাটালগ',
    enTitle: 'Products & Inventory',
    items: [
      { id: 'inventory', name: 'পণ্য ও স্টক ইনভেন্টরি', desc: 'দোকানের মজুদ মাল, স্টক পরিমাণ ও পণ্যের তালিকা', category: 'inventory_catalog' },
      { id: 'master_hub', name: 'মাস্টার সেটআপ ও ফোল্ডার হাব', desc: '১০০+ ব্যবসার ফুল ক্যাটালগ ও বাল্ক সেটআপ', category: 'inventory_catalog' },
      { id: 'tool_categories', name: 'ক্যাটাগরি ম্যানেজার', desc: 'পণ্যের ক্যাটাগরি ও সাব-ক্যাটাগরি তৈরি/এডিট', category: 'inventory_catalog' }
    ]
  },
  {
    id: 'ledger_finance',
    title: '💰 হিসাব, দেনা-পাওনা ও লাভ-ক্ষতি',
    enTitle: 'Ledger & Finance',
    items: [
      { id: 'tool_cash', name: 'আজকের ক্যাশ ড্রয়ার ব্যালেন্স', desc: 'কাউন্টারের ক্যাশ ইন/আউট ও ড্রয়ার ব্যালেন্স', category: 'ledger_finance' },
      { id: 'debts', name: 'নগদ দেনা-পাওনা খাতা', desc: 'কাস্টমার ও মহাজন বাকি লেজার', category: 'ledger_finance' },
      { id: 'erp', name: 'ইআরপি ও লাভ-ক্ষতি হিসাব', desc: 'দোকানের নিট প্রফিট, খরচ ও ব্যালেন্স শিট', category: 'ledger_finance' },
      { id: 'reports', name: 'পূর্ণাঙ্গ বিজনেস রিপোর্ট হাব', desc: 'দৈনিক, সাপ্তাহিক ও মাসিক বিক্রয় রিপোর্ট', category: 'ledger_finance' }
    ]
  },
  {
    id: 'crm_field',
    title: '👥 কাস্টমার ও ফিল্ড অপারেশনস',
    enTitle: 'CRM & Field Operations',
    items: [
      { id: 'crm', name: 'কাস্টমার তালিকা (CRM)', desc: 'ক্রেতাদের নাম, মোবাইল ও বাকি খাতা', category: 'crm_field' },
      { id: 'hr', name: 'কর্মচারী ও বেতন (HR)', desc: 'স্টাফ হাজিরা, বেতন ও লোন শিট', category: 'crm_field' },
      { id: 'sr', name: 'এসআর ফিল্ড অফিসার হাব', desc: 'মার্কেট রুট কালেকশন ও অর্ডার তালিকা', category: 'crm_field' }
    ]
  },
  {
    id: 'verticals',
    title: '🏭 বিশেষায়িত ভার্টিক্যাল হাব',
    enTitle: 'Specialized Verticals',
    items: [
      { id: 'cattle', name: 'গরুর খামার ও ডেইরি হাব', desc: 'পশুর পাল, খাবার ও দুধের হিসাব', category: 'verticals' },
      { id: 'healthcare', name: 'হেলথকেয়ার ও ফার্মা হাব', desc: 'প্রেসক্রিপশন, রোগী ও ক্লিনিক্যাল রিপোর্ট', category: 'verticals' }
    ]
  },
  {
    id: 'tools_system',
    title: '⚙️ সিস্টেম, ব্যাকআপ ও মোবাইল টুলস',
    enTitle: 'System, Tools & Backup',
    items: [
      { id: 'settings', name: 'সফটওয়্যার বিজনেস সেটিংস', desc: 'দোকানের প্রোফাইল, প্রিন্টার ও সিকিউরিটি কনফিগ', category: 'tools_system' },
      { id: 'tool_diagnostics', name: 'সিস্টেম ডায়াগনোসিস ও SOS', desc: 'মেমোরি, ডাটাবেজ ও অফলাইন রিপেয়ার টুলস', category: 'tools_system' },
      { id: 'tool_backup', name: 'ব্যাকআপ ও ডেটা সেন্টার', desc: 'Excel/PDF ইমপোর্ট, রিকনসিল ও ব্যাকআপ', category: 'tools_system' },
      { id: 'tool_drive', name: 'গুগল ড্রাইভ ক্লাউড সিঙ্ক', desc: 'ক্লাউডে ১-ক্লিক ব্যাকআপ স্ন্যাপশট', category: 'tools_system' },
      { id: 'drawer_quick_scanner', name: 'ক্যামেরা বারকোড স্ক্যানার', desc: 'মোবাইল ক্যামেরা দিয়ে দ্রুত স্ক্যান', category: 'tools_system' },
      { id: 'drawer_voice_billing', name: 'বাংলা ভয়েস বিলিং', desc: 'মুখে বলে দ্রুত ক্যাশমেমো তৈরি', category: 'tools_system' },
      { id: 'drawer_customer_display', name: 'গ্রাহক লাইভ ডিসপ্লে (মিরর)', desc: '২য় স্ক্রিনে কাস্টমারের লাইভ কার্ট ভিউ', category: 'tools_system' },
      { id: 'drawer_internal_chat', name: 'অভ্যন্তরীণ চ্যাট ও সাপোর্ট', desc: 'মালিক ও কর্মচারীদের অভ্যন্তরীণ মেসেজিং', category: 'tools_system' },
      { id: 'tool_price_tracker', name: 'মার্কেট প্রাইস ট্র্যাকার', desc: 'বাজার দর ট্র্যাকিং ও কেনার তালিকা', category: 'tools_system' },
      { id: 'tool_calc', name: 'ডিজিটাল ক্যালকুলেটর', desc: 'দ্রুত হিসাব ও যোগ-বিয়োগ পপআপ', category: 'tools_system' },
      { id: 'tool_notes', name: 'চিরকুট ও নোটপ্যাড', desc: 'জরুরি মেমো ও তাৎক্ষণিক নোট', category: 'tools_system' }
    ]
  }
];

export const DEFAULT_STAFF_MENU_PERMISSIONS = {
  // Cashier: Only POS, cash drawer, and quick checkout utilities
  cashier: {
    pos: true,
    tool_cash: true,
    drawer_quick_scanner: true,
    drawer_voice_billing: true,
    drawer_customer_display: true,
    drawer_internal_chat: true,
    tool_calc: true,
    tool_notes: true,
    // Sensitive/admin modules strictly blocked
    salesman_order: false,
    sr_delivery: false,
    invoices: false,
    quotations: false,
    branch_control: false,
    inventory: false,
    master_hub: false,
    tool_categories: false,
    debts: false,
    erp: false,
    reports: false,
    crm: false,
    hr: false,
    sr: false,
    cattle: false,
    healthcare: false,
    settings: false,
    tool_diagnostics: false,
    tool_backup: false,
    tool_drive: false,
    tool_price_tracker: false
  },

  // Salesman: Only Products/Stock view, Order Booking, and Chat
  salesman: {
    inventory: true,
    salesman_order: true,
    drawer_internal_chat: true,
    tool_calc: true,
    tool_notes: true,
    drawer_quick_scanner: true,
    // Everything else blocked
    pos: false,
    sr_delivery: false,
    invoices: false,
    quotations: false,
    branch_control: false,
    master_hub: false,
    tool_categories: false,
    tool_cash: false,
    debts: false,
    erp: false,
    reports: false,
    crm: false,
    hr: false,
    sr: false,
    cattle: false,
    healthcare: false,
    settings: false,
    tool_diagnostics: false,
    tool_backup: false,
    tool_drive: false,
    drawer_voice_billing: false,
    drawer_customer_display: false,
    tool_price_tracker: false
  },

  // Delivery Man / Manager: Only Delivery & Cash collection
  delivery: {
    sr_delivery: true,
    drawer_internal_chat: true,
    tool_calc: true,
    tool_notes: true,
    // Everything else blocked
    pos: false,
    salesman_order: false,
    inventory: false,
    invoices: false,
    quotations: false,
    branch_control: false,
    master_hub: false,
    tool_categories: false,
    tool_cash: false,
    debts: false,
    erp: false,
    reports: false,
    crm: false,
    hr: false,
    sr: false,
    cattle: false,
    healthcare: false,
    settings: false,
    tool_diagnostics: false,
    tool_backup: false,
    tool_drive: false,
    drawer_quick_scanner: false,
    drawer_voice_billing: false,
    drawer_customer_display: false,
    tool_price_tracker: false
  },

  // General Staff: Minimal
  staff: {
    pos: false,
    inventory: true,
    salesman_order: false,
    sr_delivery: false,
    invoices: false,
    quotations: false,
    branch_control: false,
    master_hub: false,
    tool_categories: false,
    tool_cash: false,
    debts: false,
    erp: false,
    reports: false,
    crm: false,
    hr: false,
    sr: false,
    cattle: false,
    healthcare: false,
    settings: false,
    tool_diagnostics: false,
    tool_backup: false,
    tool_drive: false,
    drawer_internal_chat: true,
    tool_calc: true,
    tool_notes: true,
    drawer_quick_scanner: false,
    drawer_voice_billing: false,
    drawer_customer_display: false,
    tool_price_tracker: false
  }
};

/**
 * Reads staff menu permissions with fallback to defaults
 */
export const getStaffMenuPermissions = (businessSettings) => {
  try {
    const fromSettings = businessSettings?.staffMenuPermissions;
    if (fromSettings && typeof fromSettings === 'object' && Object.keys(fromSettings).length > 0) {
      return {
        cashier: { ...DEFAULT_STAFF_MENU_PERMISSIONS.cashier, ...(fromSettings.cashier || {}) },
        salesman: { ...DEFAULT_STAFF_MENU_PERMISSIONS.salesman, ...(fromSettings.salesman || {}) },
        delivery: { ...DEFAULT_STAFF_MENU_PERMISSIONS.delivery, ...(fromSettings.delivery || {}) },
        staff: { ...DEFAULT_STAFF_MENU_PERMISSIONS.staff, ...(fromSettings.staff || {}) }
      };
    }

    const saved = localStorage.getItem('hk360_staff_menu_permissions');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        cashier: { ...DEFAULT_STAFF_MENU_PERMISSIONS.cashier, ...(parsed.cashier || {}) },
        salesman: { ...DEFAULT_STAFF_MENU_PERMISSIONS.salesman, ...(parsed.salesman || {}) },
        delivery: { ...DEFAULT_STAFF_MENU_PERMISSIONS.delivery, ...(parsed.delivery || {}) },
        staff: { ...DEFAULT_STAFF_MENU_PERMISSIONS.staff, ...(parsed.staff || {}) }
      };
    }
  } catch (err) {
    console.warn('Error reading staff menu permissions:', err);
  }

  return DEFAULT_STAFF_MENU_PERMISSIONS;
};

/**
 * Checks if a menu item or tab is permitted for the given role
 */
export const isMenuItemAllowedForRole = (
  itemId,
  userRole,
  staffPermissions,
  isOwner = false,
  isSuperAdmin = false
) => {
  // Master Super Admin and Business Owner have complete unrestricted access
  if (isSuperAdmin || isOwner || !userRole || userRole === 'owner' || userRole === 'admin' || userRole === 'superadmin') {
    return true;
  }

  const roleKey = (userRole || 'cashier').toLowerCase();
  
  // Normalized role mapping
  let targetRole = 'cashier';
  if (roleKey === 'salesman' || roleKey === 'sr') {
    targetRole = 'salesman';
  } else if (roleKey === 'delivery' || roleKey === 'rider') {
    targetRole = 'delivery';
  } else if (roleKey === 'manager' || roleKey === 'branch_manager') {
    // Branch manager gets cashier permissions plus reports/invoices if configured
    targetRole = 'cashier';
  } else if (roleKey === 'staff' || roleKey === 'godown_keeper') {
    targetRole = 'staff';
  }

  const roleConfig = staffPermissions?.[targetRole] || DEFAULT_STAFF_MENU_PERMISSIONS[targetRole];
  if (!roleConfig) return true;

  // If explicitly defined in matrix
  if (roleConfig[itemId] !== undefined) {
    return Boolean(roleConfig[itemId]);
  }

  // Any action or system tool not explicitly granted is denied for staff
  return false;
};

/**
 * Finds the first allowed landing tab for the staff user
 */
export const getFirstAllowedTabForRole = (userRole, staffPermissions) => {
  const roleKey = (userRole || 'cashier').toLowerCase();
  if (roleKey === 'salesman' || roleKey === 'sr') {
    if (isMenuItemAllowedForRole('inventory', userRole, staffPermissions)) return 'inventory';
    if (isMenuItemAllowedForRole('salesman_order', userRole, staffPermissions)) return 'salesman_order';
  }
  if (roleKey === 'delivery') {
    if (isMenuItemAllowedForRole('sr_delivery', userRole, staffPermissions)) return 'sr_delivery';
  }
  if (isMenuItemAllowedForRole('pos', userRole, staffPermissions)) return 'pos';
  if (isMenuItemAllowedForRole('inventory', userRole, staffPermissions)) return 'inventory';
  if (isMenuItemAllowedForRole('salesman_order', userRole, staffPermissions)) return 'salesman_order';
  if (isMenuItemAllowedForRole('sr_delivery', userRole, staffPermissions)) return 'sr_delivery';
  return 'pos';
};
