/**
 * HisabKitab 360 - Stale-While-Revalidate (SWR) Data Pipe Engine
 * ------------------------------------------------------------
 * Implements Stale-While-Revalidate caching pattern:
 * - 0ms Instant Response: Serves cached data from L1 Memory / IndexedDB immediately.
 * - Silent Background Revalidation: Re-fetches latest delta from Supabase/API.
 * - Broadcasts updates to active subscribers only when actual changes are detected.
 * - Request deduplication prevents redundant simultaneous fetches.
 */

import { idbGet, idbSet } from '../utils/idbStorage';

class SWRDataPipe {
  constructor() {
    this.memoryCache = new Map();
    this.pendingPromises = new Map();
    this.subscribers = new Map();
  }

  /**
   * Subscribe to background updates for a specific cache key
   */
  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);

    return () => {
      const subs = this.subscribers.get(key);
      if (subs) subs.delete(callback);
    };
  }

  /**
   * Fetch with SWR pattern
   * @param {string} key - Cache identifier
   * @param {Function} fetcher - Async fetch function () => Promise<any>
   * @param {object} options - { ttl: number, forceRefresh: boolean }
   * @returns {Promise<{ data: any, isStale: boolean, fromCache: boolean }>}
   */
  async swrFetch(key, fetcher, options = {}) {
    const { ttl = 300000, forceRefresh = false } = options;
    const now = Date.now();

    // 1. Check L1 Memory Cache
    const memoryRecord = this.memoryCache.get(key);
    let cachedData = null;
    let isStale = true;

    if (memoryRecord && !forceRefresh) {
      cachedData = memoryRecord.data;
      isStale = now > memoryRecord.expireAt;
    } else {
      // 2. Fallback to L2 IndexedDB
      try {
        const idbRecord = await idbGet(`swr_${key}`);
        if (idbRecord && !forceRefresh) {
          cachedData = idbRecord.data;
          isStale = now > idbRecord.expireAt;
          this.memoryCache.set(key, idbRecord);
        }
      } catch {
        // non-blocking
      }
    }

    // Trigger silent background revalidation if stale or forceRefresh
    if (isStale || forceRefresh || !cachedData) {
      this._triggerBackgroundRevalidation(key, fetcher, ttl, cachedData);
    }

    // Return instant cached data if available
    if (cachedData) {
      return { data: cachedData, isStale, fromCache: true };
    }

    // If completely cold (no cache yet), await revalidation
    const freshData = await this._triggerBackgroundRevalidation(key, fetcher, ttl, null);
    return { data: freshData, isStale: false, fromCache: false };
  }

  /**
   * Background revalidator with request deduplication
   */
  async _triggerBackgroundRevalidation(key, fetcher, ttl, existingData) {
    if (this.pendingPromises.has(key)) {
      return this.pendingPromises.get(key);
    }

    const promise = (async () => {
      try {
        const freshData = await fetcher();
        const record = {
          data: freshData,
          updatedAt: Date.now(),
          expireAt: Date.now() + ttl
        };

        // Update L1 and L2
        this.memoryCache.set(key, record);
        await idbSet(`swr_${key}`, record).catch(() => {});

        // Compare with existing data and notify subscribers if changed
        const hasChanged = JSON.stringify(existingData) !== JSON.stringify(freshData);
        if (hasChanged) {
          const subs = this.subscribers.get(key);
          if (subs) {
            subs.forEach((cb) => {
              try {
                cb(freshData);
              } catch (e) {
                console.warn('SWR subscriber callback error:', e);
              }
            });
          }
        }

        return freshData;
      } finally {
        this.pendingPromises.delete(key);
      }
    })();

    this.pendingPromises.set(key, promise);
    return promise;
  }

  /**
   * Clear cache for key
   */
  invalidate(key) {
    this.memoryCache.delete(key);
  }

  getMetrics() {
    return {
      cachedKeys: this.memoryCache.size,
      activeSubscribers: this.subscribers.size,
      inFlightRequests: this.pendingPromises.size
    };
  }
}

export const swrDataPipe = new SWRDataPipe();
