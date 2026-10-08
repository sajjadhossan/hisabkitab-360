/**
 * Network Quality & Ping Latency Measurement Service
 * ---------------------------------------------------
 * Tracks connection health so shopkeepers know if cloud sync is instant or queued.
 */

let currentQuality = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  latencyMs: 45,
  effectiveType: '4g',
  grade: 'fast' // 'fast' | 'medium' | 'slow' | 'offline'
};

const listeners = new Set();

const determineGrade = (isOnline, latencyMs, effectiveType) => {
  if (!isOnline) return 'offline';
  if (effectiveType === '2g' || effectiveType === 'slow-2g' || latencyMs > 600) return 'slow';
  if (effectiveType === '3g' || latencyMs > 250) return 'medium';
  return 'fast';
};

const notify = () => {
  listeners.forEach((fn) => {
    try { fn({ ...currentQuality }); } catch {}
  });
};

export const getNetworkQuality = () => ({ ...currentQuality });

export const measureLatency = async () => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    currentQuality = {
      isOnline: false,
      latencyMs: 0,
      effectiveType: 'offline',
      grade: 'offline'
    };
    notify();
    return currentQuality;
  }

  const start = performance.now();
  try {
    // Lightweight fetch head ping
    await fetch('/index.html?ping=' + Date.now(), { method: 'HEAD', cache: 'no-store' });
    const elapsed = Math.round(performance.now() - start);
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const effectiveType = conn?.effectiveType || '4g';

    currentQuality = {
      isOnline: true,
      latencyMs: elapsed,
      effectiveType,
      grade: determineGrade(true, elapsed, effectiveType)
    };
  } catch {
    currentQuality = {
      isOnline: navigator.onLine,
      latencyMs: 999,
      effectiveType: 'slow',
      grade: navigator.onLine ? 'slow' : 'offline'
    };
  }
  notify();
  return currentQuality;
};

export const subscribeToNetworkQuality = (cb) => {
  listeners.add(cb);
  cb({ ...currentQuality });
  return () => listeners.delete(cb);
};

// Auto listen to window events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    measureLatency();
  });
  window.addEventListener('offline', () => {
    currentQuality = {
      isOnline: false,
      latencyMs: 0,
      effectiveType: 'offline',
      grade: 'offline'
    };
    notify();
  });

  // Measure every 35 seconds
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      measureLatency();
    }
  }, 35000);
}
