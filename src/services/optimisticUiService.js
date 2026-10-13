/**
 * HisabKitab 360 - Enterprise Optimistic UI Engine
 * -----------------------------------------------
 * Guarantees 0ms perceived latency for user operations.
 * Features:
 * - Immediate optimistic state commit
 * - Automatic snapshot rollback on server failure
 * - Queue of in-flight optimistic mutations
 * - Event broadcast for UI loading spinners / optimistic badges
 */

class OptimisticUiService {
  constructor() {
    this.pendingMutations = new Map();
    this.listeners = new Set();
  }

  /**
   * Subscribe to mutation status changes
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  _notify() {
    const list = Array.from(this.pendingMutations.values());
    this.listeners.forEach(cb => {
      try {
        cb(list);
      } catch (err) {
        console.warn('[OptimisticUiService] Listener error:', err);
      }
    });
  }

  /**
   * Run an action with full optimistic guarantee
   * @param {Object} options
   * @param {string} options.id - Unique ID of the mutation
   * @param {string} options.type - Category (e.g., 'SALE_CREATE', 'STOCK_UPDATE')
   * @param {Function} options.applyOptimistic - () => snapshotData (state applied instantly)
   * @param {Function} options.commitAsync - () => Promise<any> (network / DB write)
   * @param {Function} options.rollback - (snapshotData) => void (called if commit fails)
   * @param {Function} [options.onSuccess] - (result) => void
   * @param {Function} [options.onError] - (error) => void
   */
  async runMutation({
    id = `opt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type = 'MUTATION',
    applyOptimistic,
    commitAsync,
    rollback,
    onSuccess,
    onError
  }) {
    let snapshot = null;
    const mutationRecord = {
      id,
      type,
      startedAt: Date.now(),
      status: 'pending'
    };

    this.pendingMutations.set(id, mutationRecord);
    this._notify();

    // 1. Instant local state update
    try {
      if (typeof applyOptimistic === 'function') {
        snapshot = applyOptimistic();
      }
    } catch (err) {
      this.pendingMutations.delete(id);
      this._notify();
      console.error('[OptimisticUiService] Failed in applyOptimistic:', err);
      if (onError) onError(err);
      return { success: false, error: err };
    }

    // 2. Commit async in background
    try {
      const result = typeof commitAsync === 'function' ? await commitAsync() : null;
      mutationRecord.status = 'committed';
      this.pendingMutations.delete(id);
      this._notify();

      if (typeof onSuccess === 'function') {
        onSuccess(result);
      }
      return { success: true, result, id };
    } catch (error) {
      console.error(`[OptimisticUiService] Commit failed for ${type} (${id}), rolling back...`, error);
      mutationRecord.status = 'rolled_back';
      mutationRecord.error = error.message;

      // 3. Rollback
      if (typeof rollback === 'function') {
        try {
          rollback(snapshot);
        } catch (rbErr) {
          console.error('[OptimisticUiService] Rollback function threw error:', rbErr);
        }
      }

      this.pendingMutations.delete(id);
      this._notify();

      if (typeof onError === 'function') {
        onError(error);
      }

      return { success: false, error, rolledBack: true, id };
    }
  }

  getPendingList() {
    return Array.from(this.pendingMutations.values());
  }

  hasPending() {
    return this.pendingMutations.size > 0;
  }
}

export const optimisticUiService = new OptimisticUiService();
