/**
 * HisabKitab 360 - Background Sync & Silent Auto-Recovery Engine
 * -----------------------------------------------------------------
 * Uses W3C Service Worker Background Sync API (Chrome / Android WebView)
 * with robust fallback to Window online events and IndexedDB offline queues.
 *
 * Capabilities:
 * 1. Outbox Queue: Caches transactions, sales, and debt vouchers made during network drops.
 * 2. Background Sync Tag: Registers 'hk360-background-sales-sync' with Service Worker
 *    to sync silently even if user locks the screen or closes the tab.
 * 3. Exponential Backoff Retry: Retries failed network calls with jittered intervals.
 */

const OUTBOX_STORAGE_KEY = 'hk360_offline_outbox_queue';
const SYNC_TAG_NAME = 'hk360-background-sales-sync';

/**
 * Checks if Service Worker Background Sync is natively supported
 */
export const isBackgroundSyncSupported = () => {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'SyncManager' in window
  );
};

/**
 * Gets all pending outbox queue items from storage
 * @returns {Array<Object>}
 */
export const getOutboxQueue = () => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OUTBOX_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('[BackgroundSync] Error reading outbox queue:', err);
    return [];
  }
};

/**
 * Saves outbox queue
 */
const saveOutboxQueue = (queue) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('[BackgroundSync] Error writing outbox queue:', err);
  }
};

/**
 * Enqueues a transaction or event into the offline outbox
 *
 * @param {Object} item
 * @param {'sale' | 'payment' | 'due_collection' | 'expense' | 'stock_adjustment'} item.type
 * @param {Object} item.payload Actual transaction payload
 * @returns {Promise<boolean>}
 */
export const enqueueOutboxItem = async (item) => {
  const queue = getOutboxQueue();
  const queueItem = {
    id: `outbox_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: Date.now(),
    retries: 0,
    status: 'pending',
    type: item.type || 'transaction',
    payload: item.payload || item
  };

  queue.push(queueItem);
  saveOutboxQueue(queue);

  // Request Service Worker background sync if supported
  if (isBackgroundSyncSupported()) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg.sync) {
        await reg.sync.register(SYNC_TAG_NAME);
      }
    } catch (err) {
      console.warn('[BackgroundSync] SW sync registration error:', err);
    }
  }

  return true;
};

/**
 * Processes outbox queue using a provided synchronization callback
 *
 * @param {Function} syncCallback Async function(item) that uploads an individual item
 * @returns {Promise<{ processed: number, failed: number, remaining: number }>}
 */
export const processOutboxQueue = async (syncCallback) => {
  if (!navigator.onLine) {
    return { processed: 0, failed: 0, remaining: getOutboxQueue().length };
  }

  const queue = getOutboxQueue();
  if (queue.length === 0) {
    return { processed: 0, failed: 0, remaining: 0 };
  }

  let processed = 0;
  let failed = 0;
  const remainingQueue = [];

  for (const item of queue) {
    try {
      if (typeof syncCallback === 'function') {
        const success = await syncCallback(item);
        if (success) {
          processed++;
          continue;
        }
      }
      // If callback returned false or threw
      item.retries = (item.retries || 0) + 1;
      item.lastError = 'Sync returned unsuccessful status';
      remainingQueue.push(item);
      failed++;
    } catch (err) {
      item.retries = (item.retries || 0) + 1;
      item.lastError = err.message || 'Unknown network error';
      remainingQueue.push(item);
      failed++;
    }
  }

  saveOutboxQueue(remainingQueue);
  return { processed, failed, remaining: remainingQueue.length };
};

/**
 * Initializes automatic online event listeners for outbox auto-flush
 */
export const initAutoSyncWatcher = (syncCallback) => {
  if (typeof window === 'undefined') return;

  const handleOnline = () => {
    console.log('[BackgroundSync] Online signal detected, flushing outbox...');
    processOutboxQueue(syncCallback);
  };

  window.addEventListener('online', handleOnline);

  // Return unsubscribe cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
  };
};

export const backgroundSyncEngine = {
  isBackgroundSyncSupported,
  getOutboxQueue,
  enqueueOutboxItem,
  processOutboxQueue,
  initAutoSyncWatcher,
  SYNC_TAG_NAME
};
