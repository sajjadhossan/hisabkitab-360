/**
 * Offline-First Background Sync Queue for HisabKitab 360
 * --------------------------------------------------------
 * Guarantees zero transaction loss even when internet disconnects in a busy shop.
 * Enqueues local mutations in IndexedDB and automatically syncs with Supabase
 * as soon as network connectivity is restored.
 */

import { openOfflineDB, getAllIndexedDbItems, setIndexedDbItem, clearIndexedDbStore, removeIndexedDbItem } from './indexedDbCache';
import { broadcastLiveEvent } from './liveSyncService';
import { broadcastLocalTerminalEvent } from './lanSyncProtocol';
import { resolveConflictLWW } from './conflictResolver';

const QUEUE_STORE = 'offline_mutations';
const syncListeners = new Set();
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
let isSyncing = false;

export const getSyncStatus = () => ({
  isOnline,
  isSyncing
});

export const subscribeSyncStatus = (callback) => {
  syncListeners.add(callback);
  return () => syncListeners.delete(callback);
};

const notifyStatusChange = (pendingCount = 0) => {
  syncListeners.forEach((cb) => {
    try {
      cb({ isOnline, isSyncing, pendingCount });
    } catch {}
  });
};

/**
 * Enqueue a mutation when device is offline or network is unreliable
 */
export const enqueueOfflineMutation = async (actionType, payload) => {
  const mutationId = 'mut_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const record = {
    id: mutationId,
    actionType,
    payload,
    timestamp: Date.now(),
    retryCount: 0
  };

  await setIndexedDbItem(QUEUE_STORE, mutationId, record);
  const queue = await getAllIndexedDbItems(QUEUE_STORE);
  notifyStatusChange(queue.length);
  
  // Instant 0ms broadcast to sibling counter windows/tabs on LAN
  try {
    broadcastLocalTerminalEvent(actionType, payload);
  } catch {}

  return record;
};

/**
 * Get all raw pending mutations for inspector UI
 */
export const getPendingMutationsList = async () => {
  try {
    return await getAllIndexedDbItems(QUEUE_STORE);
  } catch {
    return [];
  }
};

/**
 * Flush and synchronize pending offline mutations
 */
export const flushOfflineQueue = async () => {
  if (isSyncing || !isOnline) return { syncedCount: 0, skipped: true };

  try {
    isSyncing = true;
    notifyStatusChange();

    const pendingMutations = await getAllIndexedDbItems(QUEUE_STORE);
    if (!pendingMutations || pendingMutations.length === 0) {
      isSyncing = false;
      notifyStatusChange(0);
      return { syncedCount: 0 };
    }

    let successCount = 0;
    const { pushMutationToCloud } = await import('./supabaseBackendService');

    for (const mutation of pendingMutations) {
      try {
        // 1. Submit mutation to Supabase PostgreSQL Backend
        let cloudOk = false;
        if (pushMutationToCloud) {
          const res = await pushMutationToCloud(mutation);
          cloudOk = Boolean(res?.success);
        }

        // 2. Broadcast live event to any sibling devices
        try {
          await broadcastLiveEvent(mutation.actionType, mutation.payload);
        } catch {}

        // 3. If synced to cloud or already acknowledged, remove from local queue
        if (cloudOk && removeIndexedDbItem && mutation.id) {
          await removeIndexedDbItem(QUEUE_STORE, mutation.id);
        }

        successCount++;
      } catch (err) {
        console.debug('[OfflineQueue] Mutation sync deferred:', err);
      }
    }

    // Refresh remaining pending count
    const remaining = await getAllIndexedDbItems(QUEUE_STORE);
    isSyncing = false;
    notifyStatusChange(remaining.length);

    return { syncedCount: successCount, remainingCount: remaining.length };
  } catch (err) {
    console.warn('[OfflineQueue] Flush error:', err);
    isSyncing = false;
    notifyStatusChange();
    return { syncedCount: 0, error: err.message };
  }
};

/**
 * Initialize network listeners for auto-recovery
 */
export const initOfflineSyncEngine = () => {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', () => {
    isOnline = true;
    notifyStatusChange();
    setTimeout(() => {
      flushOfflineQueue();
    }, 1200);
  });

  window.addEventListener('offline', () => {
    isOnline = false;
    notifyStatusChange();
  });
};

// Initialize on import
initOfflineSyncEngine();
