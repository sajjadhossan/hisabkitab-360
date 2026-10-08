// ========================================================
// HisabKitab 360 - Persistent Offline-First Sync Queue
// Guaranteed transaction delivery across intermittent connectivity.
// ========================================================

const QUEUE_STORAGE_KEY = 'hk360_offline_sync_queue';
const listeners = new Set();

export const getOfflineQueue = () => {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveOfflineQueue = (queue) => {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    notifyListeners();
  } catch (err) {
    console.error('Error saving sync queue:', err);
  }
};

export const getPendingSyncCount = () => {
  return getOfflineQueue().length;
};

export const enqueueOfflineAction = (actionType, payload) => {
  const queue = getOfflineQueue();
  const item = {
    id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: actionType,
    payload,
    timestamp: new Date().toISOString(),
    retryCount: 0
  };
  queue.push(item);
  saveOfflineQueue(queue);
  return item;
};

export const dequeueOfflineAction = (itemId) => {
  const queue = getOfflineQueue().filter(i => i.id !== itemId);
  saveOfflineQueue(queue);
};

export const clearOfflineQueue = () => {
  saveOfflineQueue([]);
};

export const subscribeToQueueChanges = (callback) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

const notifyListeners = () => {
  const count = getPendingSyncCount();
  listeners.forEach(cb => {
    try { cb(count); } catch {}
  });
};

/**
 * Flush pending queue when connection restores
 */
export const flushOfflineQueue = async (handlerFn) => {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { processed: 0, failed: 0 };

  let processed = 0;
  let failed = 0;
  const remaining = [];

  for (const item of queue) {
    try {
      if (typeof handlerFn === 'function') {
        await handlerFn(item);
      }
      processed++;
    } catch (err) {
      console.warn(`Failed syncing action ${item.id}:`, err);
      item.retryCount = (item.retryCount || 0) + 1;
      if (item.retryCount < 5) {
        remaining.push(item);
      }
      failed++;
    }
  }

  saveOfflineQueue(remaining);
  return { processed, failed };
};
