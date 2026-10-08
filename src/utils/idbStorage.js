/**
 * HisabKitab 360 - Resilient High-Capacity IndexedDB Engine
 * Backs up all financial transactions, products, invoices, and debt khata.
 * Unlocks GB-level storage capacity beyond LocalStorage's 5MB mobile limit.
 */

const DB_NAME = 'hisabkitab_360_db';
const DB_VERSION = 1;
const STORE_NAME = 'app_key_val';

let dbPromise = null;

const getDB = () => {
  if (typeof window === 'undefined' || !window.indexedDB) return null;
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
};

export const idbSet = async (key, value) => {
  try {
    const db = await getDB();
    if (!db) return;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.debug('[IndexedDB] Set error:', err);
  }
};

export const idbGet = async (key) => {
  try {
    const db = await getDB();
    if (!db) return null;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.debug('[IndexedDB] Get error:', err);
    return null;
  }
};
