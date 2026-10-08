import { useEffect, useRef } from 'react';

/**
 * Auto-Focus Hook
 * ---------------
 * Reliably focuses and selects the input when a view or modal renders.
 * Handles mobile virtual keyboard timing and transition animations.
 */
export function useAutoFocus(delayMs = 60, shouldSelect = true) {
  const elementRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const el = elementRef.current;
      if (el && typeof el.focus === 'function') {
        el.focus();
        if (shouldSelect && typeof el.select === 'function') {
          el.select();
        }
      }
    }, delayMs);

    return () => clearTimeout(timer);
  }, [delayMs, shouldSelect]);

  return elementRef;
}
