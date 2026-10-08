/**
 * HisabKitab 360 - Storage Quota & Eviction Protection Service
 * -------------------------------------------------------------
 * Monitors browser storage usage, requests persistent storage from OS/browser
 * to prevent auto-eviction of business databases, and provides real-time quota telemetry.
 */

const STORAGE_LISTENERS = new Set();
let cachedQuota = {
  usageBytes: 0,
  quotaBytes: 0,
  usageFormatted: '0 MB',
  quotaFormatted: '0 MB',
  percentUsed: 0,
  isPersisted: false,
  isLowSpace: false
};

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 MB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Request browser persistent storage permission so data is never evicted.
 */
export const requestPersistentStorage = async () => {
  if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.persist) {
    return false;
  }
  try {
    const isPersisted = await navigator.storage.persisted();
    if (!isPersisted) {
      const granted = await navigator.storage.persist();
      cachedQuota.isPersisted = granted;
      notifyQuotaListeners();
      return granted;
    }
    cachedQuota.isPersisted = true;
    notifyQuotaListeners();
    return true;
  } catch (err) {
    console.debug('[StorageQuota] Persist request failed:', err);
    return false;
  }
};

/**
 * Estimate current browser storage usage and remaining quota.
 */
export const getStorageQuotaEstimate = async () => {
  if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.estimate) {
    return cachedQuota;
  }
  try {
    const estimate = await navigator.storage.estimate();
    const usageBytes = estimate.usage || 0;
    const quotaBytes = estimate.quota || 0;
    const percentUsed = quotaBytes > 0 ? parseFloat(((usageBytes / quotaBytes) * 100).toFixed(2)) : 0;
    const isPersisted = navigator.storage.persisted ? await navigator.storage.persisted() : false;

    cachedQuota = {
      usageBytes,
      quotaBytes,
      usageFormatted: formatBytes(usageBytes),
      quotaFormatted: formatBytes(quotaBytes),
      percentUsed,
      isPersisted,
      isLowSpace: percentUsed >= 85
    };

    notifyQuotaListeners();
    return cachedQuota;
  } catch (err) {
    console.debug('[StorageQuota] Estimate failed:', err);
    return cachedQuota;
  }
};

const notifyQuotaListeners = () => {
  STORAGE_LISTENERS.forEach((cb) => {
    try {
      cb({ ...cachedQuota });
    } catch {}
  });
};

export const subscribeStorageQuota = (callback) => {
  STORAGE_LISTENERS.add(callback);
  callback({ ...cachedQuota });
  return () => STORAGE_LISTENERS.delete(callback);
};

// Initial auto-check on import
if (typeof window !== 'undefined') {
  requestPersistentStorage();
  getStorageQuotaEstimate();
}
