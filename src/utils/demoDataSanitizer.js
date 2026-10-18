/**
 * HisabKitab 360 - Zero-Demo / Mock Data Sanitizer & Storage Purge Engine
 * ----------------------------------------------------------------------
 * Enforces Rule 7 (Zero Demo/Mock Data) across all platforms (Web, Android APK, PC).
 * Detects, filters out, and permanently purges any legacy demo/mock data
 * (employees, products, customers, suppliers, staff accounts, attendance logs).
 */

const LEGACY_DEMO_EMPLOYEE_IDS = new Set(['emp-1', 'emp-2', 'emp-3']);
const LEGACY_DEMO_EMPLOYEE_NAMES = ['রফিকুল ইসলাম', 'রাসেল মাহমুদ', 'আল-আমিন হোসেন', 'rafiqul islam', 'rasel mahmud', 'al-amin hossain'];
const LEGACY_DEMO_PHONES = new Set(['01715-001122', '01820-334455', '01912-667788']);

const LEGACY_DEMO_PRODUCT_IDS = new Set(['prod-1', 'prod-2', 'prod-3', 'prod-4', 'prod-5', 'prod-6', 'prod-7', 'prod-8']);
const LEGACY_DEMO_CUSTOMER_IDS = new Set(['cust-1', 'cust-2', 'cust-3', 'cust-4']);
const LEGACY_DEMO_SUPPLIER_IDS = new Set(['sup-1', 'sup-2']);

/**
 * Returns true if an item is a legacy mock/demo record
 */
export const isLegacyDemoItem = (item) => {
  if (!item || typeof item !== 'object') return false;
  const id = String(item.id || '').trim();
  const name = String(item.name || item.title || item.employeeName || '').toLowerCase().trim();
  const phone = String(item.phone || item.contact || '').trim();

  // 1. Employee / Staff checks
  if (LEGACY_DEMO_EMPLOYEE_IDS.has(id)) return true;
  for (const demoName of LEGACY_DEMO_EMPLOYEE_NAMES) {
    if (name.includes(demoName)) return true;
  }
  if (LEGACY_DEMO_PHONES.has(phone)) return true;

  // 2. Product checks
  if (LEGACY_DEMO_PRODUCT_IDS.has(id)) return true;
  if (id.startsWith('prod-rice-') || id.startsWith('prod-soap-') || id.startsWith('prod-oil-') || id.startsWith('prod-flour-') || id.startsWith('prod-egg-') || id.startsWith('prod-dal-')) {
    return true;
  }

  // 3. Customer checks
  if (LEGACY_DEMO_CUSTOMER_IDS.has(id)) return true;
  if (name.includes('আব্দুর রহমান') || name.includes('তানভীর আহমেদ') || name.includes('নুসরাত জাহান') || name.includes('নাজমুল হাসান')) {
    if (id.startsWith('cust-')) return true;
  }

  // 4. Supplier checks
  if (LEGACY_DEMO_SUPPLIER_IDS.has(id)) return true;
  if (name.includes('মেঘনা গ্রুপ') || name.includes('সিটি গ্রুপ')) {
    if (id.startsWith('sup-')) return true;
  }

  return false;
};

/**
 * Filters out demo items from an array
 */
export const filterOutDemoItems = (list) => {
  if (!Array.isArray(list)) return [];
  return list.filter(item => !isLegacyDemoItem(item));
};

/**
 * Smart merge two lists (e.g. Local state + Cloud state) without duplicate IDs
 * and strictly zero demo data.
 */
export const mergeEntitiesWithoutDuplicates = (localList = [], cloudList = []) => {
  const cleanLocal = filterOutDemoItems(localList);
  const cleanCloud = filterOutDemoItems(cloudList);

  const map = new Map();
  // Cloud items take precedence
  cleanCloud.forEach(item => {
    if (item && item.id) map.set(item.id, item);
  });
  // Local items added if not in cloud
  cleanLocal.forEach(item => {
    if (item && item.id && !map.has(item.id)) {
      map.set(item.id, item);
    }
  });

  return Array.from(map.values());
};

/**
 * Purges legacy demo entries from all known localStorage keys
 */
export const purgeAllLegacyDemoStorage = () => {
  if (typeof window === 'undefined' || !window.localStorage) return;

  const storageTargets = [
    { key: 'hk360_biz_employees', isArray: true },
    { key: 'hk360_biz_products', isArray: true },
    { key: 'hk360_biz_customers', isArray: true },
    { key: 'hk360_biz_suppliers', isArray: true },
    { key: 'hk360_staff_accounts', isArray: true },
    { key: 'hk360_attendance_logs', isArray: true }
  ];

  storageTargets.forEach(({ key, isArray }) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (isArray && Array.isArray(parsed)) {
        const filtered = filterOutDemoItems(parsed);
        if (filtered.length !== parsed.length) {
          localStorage.setItem(key, JSON.stringify(filtered));
          console.info(`[DemoSanitizer] Purged ${parsed.length - filtered.length} demo records from ${key}`);
        }
      }
    } catch (e) {
      console.warn(`[DemoSanitizer] Error cleaning ${key}:`, e);
    }
  });
};
