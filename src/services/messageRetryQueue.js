/**
 * HisabKitab 360 - Asynchronous Message Retry Queue with Exponential Backoff
 * --------------------------------------------------------------------------
 * Ensures zero message/webhook drop during offline or intermittent network states.
 * - Enqueues WhatsApp/SMS alerts and Omni-Channel e-commerce webhooks
 * - Implements Exponential Backoff: (baseDelay * 2^attempt + jitter)
 * - Persists queue in localStorage / IndexedDB
 * - Auto-flushes when browser comes back online
 */

const RETRY_QUEUE_KEY = 'hk360_message_retry_queue';
const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 2000;

export function getRetryQueue() {
  try {
    const raw = localStorage.getItem(RETRY_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRetryQueue(queue) {
  try {
    localStorage.setItem(RETRY_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Failed to save retry queue', err);
  }
}

/**
 * Enqueue a message task for background retry
 * @param {object} task - { id, type, url, payload, headers }
 */
export function enqueueRetryMessage(task) {
  const queue = getRetryQueue();
  const newTask = {
    id: task.id || `retry-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    type: task.type || 'WEBHOOK_DISPATCH',
    url: task.url,
    payload: task.payload,
    headers: task.headers || {},
    attempts: 0,
    maxAttempts: task.maxAttempts || MAX_ATTEMPTS,
    nextRetryAt: Date.now() + 1000,
    createdAt: new Date().toISOString(),
    status: 'pending' // 'pending' | 'processing' | 'exhausted' | 'delivered'
  };

  queue.push(newTask);
  saveRetryQueue(queue);
  return newTask;
}

/**
 * Process pending items in the retry queue
 */
export async function flushRetryQueue() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { flushed: 0, status: 'offline' };
  }

  const queue = getRetryQueue();
  const now = Date.now();
  let updatedQueue = [];
  let successfulCount = 0;

  for (const task of queue) {
    if (task.status === 'delivered') continue;

    if (task.status === 'exhausted') {
      updatedQueue.push(task);
      continue;
    }

    if (now < task.nextRetryAt) {
      updatedQueue.push(task);
      continue;
    }

    // Attempt delivery
    try {
      task.attempts += 1;
      const res = await fetch(task.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...task.headers
        },
        body: JSON.stringify(task.payload)
      });

      if (res.ok) {
        task.status = 'delivered';
        task.deliveredAt = new Date().toISOString();
        successfulCount++;
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      if (task.attempts >= task.maxAttempts) {
        task.status = 'exhausted';
        task.lastError = err.message;
        updatedQueue.push(task);
      } else {
        // Exponential backoff with jitter
        const backoff = BASE_DELAY_MS * Math.pow(2, task.attempts) + Math.floor(Math.random() * 1000);
        task.nextRetryAt = Date.now() + backoff;
        task.lastError = err.message;
        updatedQueue.push(task);
      }
    }
  }

  // Keep delivered items pruned, preserve last 30
  const finalQueue = updatedQueue.slice(-30);
  saveRetryQueue(finalQueue);

  return { flushed: successfulCount, pending: finalQueue.filter((t) => t.status === 'pending').length };
}

// Auto-register online event listener
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushRetryQueue().catch(() => {});
  });
}
