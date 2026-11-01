/**
 * Fail-safe JSON Parser Utility for HisabKitab 360
 * Prevents blank screen crashes from corrupted local storage or malformed network payloads
 */

export const safeJsonParse = (str, fallback = null) => {
  if (str === null || str === undefined || str === '') {
    return fallback;
  }
  if (typeof str === 'object') {
    return str;
  }
  try {
    return JSON.parse(str);
  } catch (err) {
    console.warn('[SafeJSON] Prevented crash on malformed JSON payload:', err.message);
    return fallback;
  }
};

export const safeJsonStringify = (data, fallback = '{}') => {
  try {
    return JSON.stringify(data);
  } catch (err) {
    console.warn('[SafeJSON] Failed to stringify data:', err.message);
    return fallback;
  }
};

export default safeJsonParse;
