/**
 * HisabKitab 360 - Inactivity Auto-Lock Watchdog Service (Phase 6, Feature 60)
 * Automatically monitors user interaction (mouse, touch, keyboard) and triggers
 * screen lock after a configurable idle duration (default 5 minutes).
 */

const STORAGE_KEY_TIMEOUT = 'hk360_security_inactivity_timeout_ms';
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000; // 5 Minutes

let timerId = null;
let onLockCallback = null;
let isEnabled = true;
let lastActivityTime = Date.now();

export function getInactivityTimeoutMs() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_TIMEOUT);
    if (saved) {
      const val = parseInt(saved, 10);
      if (!isNaN(val)) return val;
    }
  } catch (e) {
    // ignore
  }
  return DEFAULT_TIMEOUT_MS;
}

export function setInactivityTimeoutMs(ms) {
  try {
    localStorage.setItem(STORAGE_KEY_TIMEOUT, String(ms));
  } catch (e) {
    // ignore
  }
  resetInactivityTimer();
}

function handleUserActivity() {
  lastActivityTime = Date.now();
  if (timerId) {
    clearTimeout(timerId);
  }

  const timeoutMs = getInactivityTimeoutMs();
  if (timeoutMs <= 0 || !isEnabled) {
    return; // Disabled
  }

  timerId = setTimeout(() => {
    if (isEnabled && typeof onLockCallback === 'function') {
      try {
        onLockCallback();
      } catch (err) {
        console.warn('[InactivityWatchdog] onLockCallback failed:', err);
      }
    }
  }, timeoutMs);
}

export function initInactivityWatchdog(lockCallback) {
  onLockCallback = lockCallback;
  isEnabled = true;

  const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
  const throttledActivity = throttle(handleUserActivity, 2000);

  events.forEach((evt) => {
    window.addEventListener(evt, throttledActivity, { passive: true });
  });

  handleUserActivity();

  return () => {
    events.forEach((evt) => {
      window.removeEventListener(evt, throttledActivity);
    });
    if (timerId) clearTimeout(timerId);
  };
}

export function resetInactivityTimer() {
  handleUserActivity();
}

export function pauseInactivityWatchdog() {
  isEnabled = false;
  if (timerId) clearTimeout(timerId);
}

export function resumeInactivityWatchdog() {
  isEnabled = true;
  handleUserActivity();
}

function throttle(func, wait) {
  let timeout = null;
  let previous = 0;
  return function () {
    const now = Date.now();
    const remaining = wait - (now - previous);
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func();
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func();
      }, remaining);
    }
  };
}
