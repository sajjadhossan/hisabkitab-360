/**
 * High-Capacity Non-Blocking IndexedDB Cache Engine for HisabKitab 360
 * -------------------------------------------------------------------
 * Overcomes localStorage 5MB size limits, enables millisecond loading
 * of large product catalogs (10,000+ items), invoices, debts, and zero-lag
 * offline persistence. Runs completely asynchronous off the main UI thread.
 * Supports indexed queries to prevent RAM bloat.
 */

const DB_NAME = 'HisabKitab360_OfflineDB';
const DB_VERSION = 3;
const STORES = ['products_cache', 'sales_cache', 'debts_cache', 'app_meta', 'offline_mutations', 'live_state'];

let dbInstance = null;

export const openOfflineDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      STORES.forEach((storeName) => {
        let store;
        if (!db.objectStoreNames.contains(storeName)) {
          store = db.createObjectStore(storeName, { keyPath: 'id' });
        } else {
          store = e.target.transaction.objectStore(storeName);
        }

        // Add indices for fast non-blocking range & filter queries
        if (store && !store.indexNames.contains('updatedAt')) {
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
        if (store && (storeName === 'products_cache' || storeName === 'sales_cache')) {
          if (!store.indexNames.contains('category')) {
            store.createIndex('category', 'category', { unique: false });
          }
        }
      });
    };

    request.onsuccess = (e) => {
      dbInstance = e.target.result;
      resolve(dbInstance);
    };

    request.onerror = (e) => {
      console.warn('[IndexedDB] Open error:', e.target.error);
      reject(e.target.error);
    };
  });
};

export const setIndexedDbItem = async (storeName, id, data) => {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      const record = {
        id,
        data,
        updatedAt: Date.now(),
        category: data?.category || ''
      };
      const req = store.put(record);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB] setItem (${storeName}) failed:`, err);
    return false;
  }
};

export const getIndexedDbItem = async (storeName, id) => {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve) => {
      const tx = db.transaction([storeName], 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);

      req.onsuccess = () => {
        resolve(req.result ? req.result.data : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};

export const getAllIndexedDbItems = async (storeName) => {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve) => {
      const tx = db.transaction([storeName], 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();

      req.onsuccess = () => {
        resolve((req.result || []).map((r) => r.data));
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
};

/**
 * High-speed Indexed query (bypasses full array scan in memory)
 */
export const queryIndexedDbByIndex = async (storeName, indexName, value, limit = 50) => {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve) => {
      const tx = db.transaction([storeName], 'readonly');
      const store = tx.objectStore(storeName);
      if (!store.indexNames.contains(indexName)) {
        resolve([]);
        return;
      }
      const index = store.index(indexName);
      const req = index.getAll(value, limit);

      req.onsuccess = () => {
        resolve((req.result || []).map(r => r.data));
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
};

export const clearIndexedDbStore = async (storeName) => {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve) => {
      const tx = db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
};

export const removeIndexedDbItem = async (storeName, id) => {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve) => {
      const tx = db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
};

// ============================================================================
// NON-BLOCKING DEBOUNCED SNAPSHOT CACHING (Zero-lag React rendering)
// ============================================================================
const writeDebounceTimers = new Map();

/**
 * Saves heavy data to IndexedDB without choking UI frames.
 * Uses requestIdleCallback with 300ms debounce.
 */
export const cacheAppStateAsync = (storeName, id, data, debounceMs = 300) => {
  if (typeof window === 'undefined') return;

  const timerKey = `${storeName}_${id}`;
  if (writeDebounceTimers.has(timerKey)) {
    clearTimeout(writeDebounceTimers.get(timerKey));
  }

  const timer = setTimeout(() => {
    writeDebounceTimers.delete(timerKey);
    const scheduleWrite = () => {
      setIndexedDbItem(storeName, id, data).catch((err) => {
        console.debug(`[IndexedDB Cache] Deferred write suppressed:`, err);
      });
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(scheduleWrite, { timeout: 1000 });
    } else {
      setTimeout(scheduleWrite, 10);
    }
  }, debounceMs);

  writeDebounceTimers.set(timerKey, timer);
};

/**
 * Instant initialization of IndexedDB offline cache on application mount
 */
export const initFastOfflineCache = async () => {
  try {
    await openOfflineDB();
    return true;
  } catch (err) {
    console.debug('[IndexedDB Cache] Init failed:', err);
    return false;
  }
};
