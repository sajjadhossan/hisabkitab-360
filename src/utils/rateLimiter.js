/**
 * HisabKitab 360 - Token Bucket & Sliding Window Security Rate Limiter
 * --------------------------------------------------------------------
 * Protects critical endpoints and actions against brute-force attacks and abuse:
 * - Supervisor PIN validation attempts (max 5 attempts per 60s)
 * - POS auth logins (max 10 attempts per 60s)
 * - Bulk export / webhook bursts (max 30 requests per minute)
 * Runs synchronously in-memory with automatic expiration cleanup.
 */

class SecurityRateLimiter {
  constructor() {
    this.buckets = new Map();
  }

  /**
   * Check if an action is allowed for a given key
   * @param {string} key - Identifier (e.g., 'pin_attempt:supervisor', 'login:admin')
   * @param {number} maxAttempts - Maximum attempts allowed in window
   * @param {number} windowMs - Window duration in milliseconds (default: 60,000ms = 1 min)
   * @returns {{ allowed: boolean, remaining: number, retryAfterMs: number }}
   */
  check(key, maxAttempts = 5, windowMs = 60000) {
    const now = Date.now();
    let record = this.buckets.get(key);

    if (!record) {
      record = { timestamps: [] };
      this.buckets.set(key, record);
    }

    // Filter out timestamps outside current sliding window
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    if (record.timestamps.length >= maxAttempts) {
      const oldest = record.timestamps[0];
      const retryAfterMs = Math.max(0, windowMs - (now - oldest));
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs,
        retryAfterSec: Math.ceil(retryAfterMs / 1000)
      };
    }

    record.timestamps.push(now);
    const remaining = maxAttempts - record.timestamps.length;

    return {
      allowed: true,
      remaining,
      retryAfterMs: 0,
      retryAfterSec: 0
    };
  }

  /**
   * Reset attempts for a key upon successful authorization
   */
  reset(key) {
    this.buckets.delete(key);
  }

  /**
   * Get current statistics for monitoring
   */
  getStats() {
    const now = Date.now();
    const stats = [];
    for (const [key, record] of this.buckets.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 60000);
      if (record.timestamps.length > 0) {
        stats.push({
          key,
          activeHits: record.timestamps.length,
          lastHit: new Date(record.timestamps[record.timestamps.length - 1]).toLocaleTimeString()
        });
      }
    }
    return stats;
  }
}

export const rateLimiter = new SecurityRateLimiter();
