/**
 * High-Capacity IndexedDB Cache Engine for HisabKitab 360
 * --------------------------------------------------------
 * Overcomes localStorage 5MB size limits, enables instant
 * millisecond loading of large catalogs and zero-lag offline persistence.
 */

const DB_NAME = 'HisabKitab360_OfflineDB';
const DB_VERSION = 1;
const STORES = ['products_cache', 'sales_cache', 'debts_cache', 'app_meta'];

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
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
    };

    request.onsuccess = (e) => {
      dbInstance = e.target.result;
      resolve(dbInstance);
    };

    request.onerror = (e) => {
      console.warn('IndexedDB open error:', e.target.error);
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
      const record = { id, data, updatedAt: Date.now() };
      const req = store.put(record);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`IndexedDB setItem (${storeName}) failed:`, err);
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
