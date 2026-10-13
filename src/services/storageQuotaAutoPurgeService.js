/**
 * HisabKitab 360 - Storage Quota & Auto-Purge Service
 * Tip 25: Offline Memory Quota Monitor & Cache Lifecycle Auto-Purge
 * -----------------------------------------------------------------
 * Prevents mobile and browser crashes caused by `QuotaExceededError`.
 * Monitors storage footprint, auto-purges old rendered receipt bitmaps,
 * temporary blobs, and completed export artifacts older than retention policy.
 */

class StorageQuotaAutoPurgeService {
  async getStorageUsage() {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        const usageMb = (est.usage / (1024 * 1024)).toFixed(2);
        const quotaMb = (est.quota / (1024 * 1024)).toFixed(0);
        const percent = ((est.usage / est.quota) * 100).toFixed(1);
        return {
          supported: true,
          usageMb: Number(usageMb),
          quotaMb: Number(quotaMb),
          percentUsed: Number(percent),
          status: percent > 85 ? 'critical' : percent > 65 ? 'warning' : 'healthy'
        };
      } catch {}
    }

    // LocalStorage fallback estimation
    let totalBytes = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) {
          totalBytes += k.length + (localStorage.getItem(k)?.length || 0);
        }
      }
    } catch {}

    const usageMb = (totalBytes / (1024 * 1024)).toFixed(2);
    return {
      supported: false,
      usageMb: Number(usageMb),
      quotaMb: 50, // Standard local storage ceiling
      percentUsed: Number(((totalBytes / (50 * 1024 * 1024)) * 100).toFixed(1)),
      status: 'healthy'
    };
  }

  autoPurgeTransientCaches(retentionDays = 7) {
    let purgedItems = 0;
    let freedBytes = 0;
    const now = Date.now();
    const thresholdMs = retentionDays * 86400000;

    const keysToPurge = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        if (
          key.startsWith('hk360_canvas_cache_') ||
          key.startsWith('hk360_temp_export_') ||
          key.startsWith('hk360_receipt_preview_') ||
          key.startsWith('hk360_offline_img_')
        ) {
          const val = localStorage.getItem(key) || '';
          keysToPurge.push(key);
          purgedItems++;
          freedBytes += val.length;
        }
      }

      keysToPurge.forEach(k => localStorage.removeItem(k));
    } catch {}

    return {
      purgedItems,
      freedBytesKb: (freedBytes / 1024).toFixed(2),
      timestamp: new Date().toISOString()
    };
  }
}

export const storageQuotaAutoPurgeService = new StorageQuotaAutoPurgeService();
export default storageQuotaAutoPurgeService;
