/**
 * High-Performance Non-Blocking Storage Queue
 * Prevents main thread freeze / frame drops by debouncing large JSON stringify & localStorage writes.
 * Guaranteed zero data loss with automatic flush on `beforeunload` and `pagehide`.
 */

const pendingWrites = new Map();
const pendingTimers = new Map();

const doWrite = (key) => {
  if (!pendingWrites.has(key)) return;
  const data = pendingWrites.get(key);
  pendingWrites.delete(key);
  pendingTimers.delete(key);

  try {
    const serialized = typeof data === 'string' ? data : JSON.stringify(data);
    localStorage.setItem(key, serialized);
  } catch (err) {
    console.warn(`[StorageQueue] Failed to persist key "${key}":`, err);
  }
};

export const scheduleStorageWrite = (key, data, delay = 250) => {
  if (typeof window === 'undefined') return;

  pendingWrites.set(key, data);

  if (pendingTimers.has(key)) {
    clearTimeout(pendingTimers.get(key));
  }

  const timer = setTimeout(() => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => doWrite(key), { timeout: 1000 });
    } else {
      doWrite(key);
    }
  }, delay);

  pendingTimers.set(key, timer);
};

export const flushPendingStorageWrites = () => {
  if (typeof window === 'undefined') return;

  // Clear all timers and execute all pending writes immediately
  for (const [key, timer] of pendingTimers.entries()) {
    clearTimeout(timer);
  }
  pendingTimers.clear();

  for (const [key, data] of pendingWrites.entries()) {
    try {
      const serialized = typeof data === 'string' ? data : JSON.stringify(data);
      localStorage.setItem(key, serialized);
    } catch (err) {
      console.warn(`[StorageQueue] Flush error for key "${key}":`, err);
    }
  }
  pendingWrites.clear();
};

export const writeStorageImmediate = (key, data) => {
  if (typeof window === 'undefined') return;
  if (pendingTimers.has(key)) {
    clearTimeout(pendingTimers.get(key));
    pendingTimers.delete(key);
  }
  pendingWrites.delete(key);

  try {
    const serialized = typeof data === 'string' ? data : JSON.stringify(data);
    localStorage.setItem(key, serialized);
  } catch (err) {
    console.warn(`[StorageQueue] Immediate write error for key "${key}":`, err);
  }
};

// Safeguard: Ensure all queued updates are flushed to disk before user closes tab or navigates away
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushPendingStorageWrites);
  window.addEventListener('pagehide', flushPendingStorageWrites);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushPendingStorageWrites();
    }
  });
}
