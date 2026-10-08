/**
 * Optimistic UI Action Executor
 * -----------------------------
 * Guarantees zero-latency immediate UI updates on button clicks.
 * Applies the state change instantly, then runs the asynchronous task in background.
 * If the background task fails, rolls back cleanly and alerts the error handler.
 */

export async function executeOptimisticAction({
  actionName = 'action',
  applyInstant,
  asyncCommit,
  rollback,
  onError,
  onSuccess
}) {
  let rollbackData = null;

  try {
    // 1. Instant Synchronous UI update
    if (typeof applyInstant === 'function') {
      rollbackData = applyInstant();
    }

    // 2. Background asynchronous task / network / storage queue commit
    if (typeof asyncCommit === 'function') {
      const result = await asyncCommit();
      if (typeof onSuccess === 'function') {
        onSuccess(result);
      }
      return { success: true, result };
    }

    return { success: true };
  } catch (error) {
    console.error(`[OptimisticAction] Failed during "${actionName}":`, error);

    // 3. Rollback state to preserve consistency
    if (typeof rollback === 'function') {
      try {
        rollback(rollbackData);
      } catch (rollbackErr) {
        console.error(`[OptimisticAction] Rollback failure in "${actionName}":`, rollbackErr);
      }
    }

    if (typeof onError === 'function') {
      onError(error);
    }

    return { success: false, error };
  }
}
