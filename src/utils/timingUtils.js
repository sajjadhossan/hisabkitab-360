import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * High-performance Debounce function
 */
export function debounce(func, wait = 150) {
  let timeout;
  function debounced(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  }
  debounced.cancel = () => {
    clearTimeout(timeout);
  };
  return debounced;
}

/**
 * High-performance Throttle function
 */
export function throttle(func, limit = 100) {
  let inThrottle = false;
  let lastFn;
  let lastTime;

  function throttled(...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      lastTime = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFn);
      lastFn = setTimeout(() => {
        if (Date.now() - lastTime >= limit) {
          func.apply(context, args);
          lastTime = Date.now();
        }
      }, Math.max(limit - (Date.now() - lastTime), 0));
    }
  }

  throttled.cancel = () => {
    clearTimeout(lastFn);
    inThrottle = false;
  };

  return throttled;
}

/**
 * React Hook: useDebounce value
 */
export function useDebounce(value, delay = 200) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * React Hook: useThrottle value
 */
export function useThrottle(value, limit = 100) {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}
