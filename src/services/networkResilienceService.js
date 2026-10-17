/**
 * HisabKitab 360 - Enterprise Network Resilience & Flaky-Connection Handler
 * Designed for reliable offline/online operation across mobile 3G/4G/WiFi in Bangladesh.
 */

// Exponential backoff with jitter
export const executeWithRetry = async (
  asyncFn,
  {
    maxRetries = 3,
    initialDelayMs = 500,
    maxDelayMs = 5000,
    backoffFactor = 2,
    onRetry = null
  } = {}
) => {
  let attempt = 0;
  let delay = initialDelayMs;

  while (attempt < maxRetries) {
    try {
      return await asyncFn();
    } catch (err) {
      attempt++;
      if (attempt >= maxRetries) {
        throw err;
      }

      // Add full jitter (0 to delay) to prevent thundering herd
      const jitteredDelay = Math.min(maxDelayMs, delay * (0.5 + Math.random() * 0.5));
      if (typeof onRetry === 'function') {
        onRetry({ attempt, maxRetries, delay: jitteredDelay, error: err });
      }

      await new Promise((resolve) => setTimeout(resolve, jitteredDelay));
      delay = Math.min(maxDelayMs, delay * backoffFactor);
    }
  }
};

/**
 * Generate a unique idempotency key to prevent double-posting of bills/transactions
 */
export const generateIdempotencyKey = (actionType = 'tx', payload = '') => {
  const timestamp = Date.now().toString(36);
  const randomSalt = Math.random().toString(36).substring(2, 8);
  let hash = 0;
  if (typeof payload === 'string' && payload.length > 0) {
    for (let i = 0; i < payload.length; i++) {
      hash = (hash << 5) - hash + payload.charCodeAt(i);
      hash |= 0;
    }
  }
  return `idemp_${actionType}_${timestamp}_${Math.abs(hash).toString(36)}_${randomSalt}`;
};

/**
 * Check if actual network connection is alive and data can transfer
 */
export const checkInternetReachable = async (timeoutMs = 3000) => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    // Ping a zero-payload or favicon endpoint with cache busting
    const res = await fetch(`https://www.google.com/generate_204?_t=${Date.now()}`, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeout);
    return true;
  } catch {
    // If standard ping blocked by CORS/firewall, fallback to navigator online
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }
};

/**
 * Get device network quality metrics from browser Network Information API
 */
export const getNetworkQuality = () => {
  if (typeof navigator === 'undefined') return { online: true, effectiveType: '4g' };

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return {
    online: navigator.onLine,
    effectiveType: conn?.effectiveType || '4g',
    downlinkMbps: conn?.downlink || null,
    rttMs: conn?.rtt || null,
    saveData: Boolean(conn?.saveData)
  };
};

export default {
  executeWithRetry,
  generateIdempotencyKey,
  checkInternetReachable,
  getNetworkQuality
};
