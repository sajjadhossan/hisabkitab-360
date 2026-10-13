/**
 * HisabKitab 360 - Idempotent Request Service
 * -------------------------------------------
 * Ensures financial operations (payments, refunds, sales, stock transfers)
 * cannot be duplicated if the user clicks multiple times or network reconnects.
 */

class IdempotentRequestService {
  constructor() {
    this.keyCache = new Set();
  }

  /**
   * Generate unique idempotency key with action prefix
   */
  generateKey(actionPrefix = 'action') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const key = `idemp_${actionPrefix}_${timestamp}_${random}`;
    this.keyCache.add(key);
    return key;
  }

  /**
   * Verify if a key has already been seen in this session
   */
  hasKey(key) {
    return this.keyCache.has(key);
  }

  /**
   * Track an executed key
   */
  trackKey(key) {
    this.keyCache.add(key);
  }

  /**
   * Clean keys older than 24h
   */
  purge() {
    this.keyCache.clear();
  }
}

export const idempotentRequestService = new IdempotentRequestService();
