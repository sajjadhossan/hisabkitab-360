/**
 * HisabKitab 360 - Speculative Prefetching & Micro-Cache Engine
 * ------------------------------------------------------------
 * Predictively pre-fetches data on user mouse hover or tab focus:
 * - When user hovers on 'Invoices' or 'Reports', fetches data 150ms before click.
 * - Result is ready in memory when clicked -> 0ms perceived latency!
 * - Short micro-cache TTL (60s) prevents stale data.
 */

class PrefetchService {
  constructor() {
    this.cache = new Map();
    this.inFlight = new Map();
    this.stats = {
      prefetchedCount: 0,
      cacheHitCount: 0
    };
  }

  /**
   * Speculatively prefetch a resource
   * @param {string} key - Resource key (e.g., 'invoices_summary', 'customer_dues')
   * @param {Function} fetcher - Async fetch function
   * @param {number} ttlMs - Micro-cache TTL (default: 60,000ms)
   */
  async prefetch(key, fetcher, ttlMs = 60000) {
    const now = Date.now();
    const existing = this.cache.get(key);

    if (existing && now < existing.expiresAt) {
      return existing.data;
    }

    if (this.inFlight.has(key)) {
      return this.inFlight.get(key);
    }

    const promise = (async () => {
      try {
        const data = await fetcher();
        this.cache.set(key, {
          data,
          expiresAt: Date.now() + ttlMs,
          prefetchedAt: new Date().toLocaleTimeString()
        });
        this.stats.prefetchedCount += 1;
        return data;
      } catch (err) {
        console.warn(`Prefetch failed for "${key}":`, err);
        return null;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return promise;
  }

  /**
   * Retrieve prefetched data if valid
   */
  get(key) {
    const now = Date.now();
    const entry = this.cache.get(key);

    if (entry && now < entry.expiresAt) {
      this.stats.cacheHitCount += 1;
      return entry.data;
    }

    return null;
  }

  getStats() {
    return {
      ...this.stats,
      activeEntries: this.cache.size,
      inFlightCount: this.inFlight.size
    };
  }
}

export const prefetchService = new PrefetchService();
