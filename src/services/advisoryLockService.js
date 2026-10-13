/**
 * HisabKitab 360 - Distributed Advisory Lock Service
 * Tip 16: Pessimistic Row-Locking, Concurrency Mutex & Over-Selling Prevention
 * ----------------------------------------------------------------------------
 * Prevents race conditions when multiple cashiers or mobile POS terminals attempt
 * to checkout the same last-stock item simultaneously during peak rush hours.
 * Uses PostgreSQL pg_advisory_xact_lock semantics with automatic lease timeouts.
 */

class AdvisoryLockService {
  constructor() {
    this.activeLocks = new Map(); // key -> { holder, acquiredAt, leaseExpiresAt, timer }
    this.lockHistory = [];
    this.listeners = new Set();
  }

  getLockKey(entityType = 'product', entityId = '') {
    return `${entityType}:${entityId}`;
  }

  async acquireLock(entityType = 'product', entityId = '', holder = 'POS-Terminal', leaseMs = 8000) {
    const key = this.getLockKey(entityType, entityId);
    const now = Date.now();

    // Check if locked by someone else
    if (this.activeLocks.has(key)) {
      const current = this.activeLocks.get(key);
      if (current.leaseExpiresAt > now) {
        if (current.holder === holder) {
          // Re-entrant lock by same terminal
          current.leaseExpiresAt = now + leaseMs;
          return { success: true, key, lockId: current.lockId, reentrant: true };
        }
        // Conflict
        this.recordHistory(key, holder, 'denied_busy', current.holder);
        return {
          success: false,
          key,
          error: `[Concurrency Conflict] '${entityType}' লক করা আছে টার্মিনাল '${current.holder}' দ্বারা।`,
          lockedBy: current.holder,
          expiresInMs: current.leaseExpiresAt - now
        };
      }
    }

    // Acquire lock
    const lockId = `lock_${now}_${Math.random().toString(36).slice(2, 6)}`;
    const timer = setTimeout(() => {
      this.releaseLock(entityType, entityId, holder, true);
    }, leaseMs);

    const lockEntry = {
      lockId,
      key,
      entityType,
      entityId,
      holder,
      acquiredAt: now,
      leaseExpiresAt: now + leaseMs,
      timer
    };

    this.activeLocks.set(key, lockEntry);
    this.recordHistory(key, holder, 'acquired');
    this.notify();

    return {
      success: true,
      key,
      lockId,
      release: () => this.releaseLock(entityType, entityId, holder)
    };
  }

  releaseLock(entityType = 'product', entityId = '', holder = '', wasAutoExpired = false) {
    const key = this.getLockKey(entityType, entityId);
    if (!this.activeLocks.has(key)) return false;

    const lock = this.activeLocks.get(key);
    if (!wasAutoExpired && holder && lock.holder !== holder) {
      return false; // Cannot release someone else's lock
    }

    clearTimeout(lock.timer);
    this.activeLocks.delete(key);
    this.recordHistory(key, lock.holder, wasAutoExpired ? 'expired' : 'released');
    this.notify();
    return true;
  }

  recordHistory(key, holder, action, conflictingHolder = null) {
    this.lockHistory.unshift({
      timestamp: new Date().toISOString(),
      key,
      holder,
      action,
      conflictingHolder
    });
    if (this.lockHistory.length > 50) this.lockHistory.pop();
  }

  getActiveLocksList() {
    return Array.from(this.activeLocks.values()).map(l => ({
      key: l.key,
      entityType: l.entityType,
      entityId: l.entityId,
      holder: l.holder,
      acquiredAt: new Date(l.acquiredAt).toLocaleTimeString(),
      remainingSec: Math.max(0, Math.round((l.leaseExpiresAt - Date.now()) / 1000))
    }));
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    const active = this.getActiveLocksList();
    this.listeners.forEach(fn => {
      try { fn({ active, history: this.lockHistory }); } catch {}
    });
  }

  generatePostgresAdvisoryLockSql() {
    return `-- =========================================================================
-- HISABKITAB 360 - POSTGRESQL TRANSACTION ADVISORY ROW-LOCKING RPC
-- =========================================================================

-- ১. নিরাপদ কনকারেন্ট স্টক কর্তন ও রো-লকিং ফাংশন
CREATE OR REPLACE FUNCTION checkout_product_atomic(
    p_product_id UUID,
    p_quantity_deduct NUMERIC,
    p_terminal_id TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_current_stock NUMERIC;
    v_lock_key BIGINT;
    v_updated_stock NUMERIC;
BEGIN
    -- হ্যাশ কী দিয়ে ট্রানজ্যাকশন অ্যাডভাইজরি লক গ্রহণ
    v_lock_key := ('x' || substr(md5(p_product_id::text), 1, 15))::bit(64)::bigint;
    PERFORM pg_advisory_xact_lock(v_lock_key);

    -- স্টক চেক
    SELECT stock INTO v_current_stock
    FROM products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'পণ্য পাওয়া যায়নি');
    END IF;

    IF v_current_stock < p_quantity_deduct THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'অপর্যাপ্ত স্টক! অবশিষ্ট আছে মাত্র ' || v_current_stock,
            'availableStock', v_current_stock
        );
    END IF;

    -- নিরাপদ কর্তন
    UPDATE products
    SET stock = stock - p_quantity_deduct,
        updated_at = NOW()
    WHERE id = p_product_id
    RETURNING stock INTO v_updated_stock;

    RETURN jsonb_build_object(
        'success', true,
        'previousStock', v_current_stock,
        'remainingStock', v_updated_stock,
        'terminal', p_terminal_id
    );
END;
$$ LANGUAGE plpgsql;
`;
  }
}

export const advisoryLockService = new AdvisoryLockService();
export default advisoryLockService;
