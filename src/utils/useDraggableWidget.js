import { useState, useRef, useEffect, useCallback } from 'react';
import { hapticFeedback } from '../services/nativeAppService';

/**
 * useDraggableWidget
 * -------------------
 * Reusable hook that makes any floating widget freely movable / draggable across the screen
 * with 100% unified Pointer, Mouse AND Touch event support across all devices:
 * - Desktop PC with mouse
 * - Touchscreen laptops (HP x360, Lenovo Yoga, Surface, etc.) with both mouse and touch
 * - Mobile phones & tablets (Android Capacitor & iOS WebView)
 *
 * Automatically clamps within screen boundaries, handles edge docking, and persists position.
 *
 * @param {string} storageKey - Unique localStorage key to persist position
 * @param {Object} defaultPos - Default positioning when not moved yet (e.g. { right: 16, bottom: 84 })
 */
export const useDraggableWidget = (storageKey, defaultPos = { right: 16, bottom: 84 }) => {
  const [pos, setPos] = useState(() => {
    try {
      if (typeof window === 'undefined') return null;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          const safeMaxX = Math.max(8, window.innerWidth - 65);
          const safeMaxY = Math.max(50, window.innerHeight - 65);
          return {
            x: Math.max(8, Math.min(safeMaxX, parsed.x)),
            y: Math.max(50, Math.min(safeMaxY, parsed.y))
          };
        }
      }
    } catch {}
    return null; // Fall back to default CSS dock
  });

  const [isDragging, setIsDragging] = useState(false);
  const elementRef = useRef(null);
  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const justDraggedRef = useRef(false);

  // Auto-clamp inside screen whenever window resizes or phone rotates
  useEffect(() => {
    const handleResize = () => {
      setPos((current) => {
        if (!current) return null;
        const elemWidth = elementRef.current?.offsetWidth || 60;
        const elemHeight = elementRef.current?.offsetHeight || 44;
        const safeMaxX = Math.max(8, window.innerWidth - elemWidth - 8);
        const safeMaxY = Math.max(50, window.innerHeight - elemHeight - 16);
        const clampedX = Math.max(8, Math.min(safeMaxX, current.x));
        const clampedY = Math.max(50, Math.min(safeMaxY, current.y));
        if (clampedX !== current.x || clampedY !== current.y) {
          const updated = { x: clampedX, y: clampedY };
          try {
            localStorage.setItem(storageKey, JSON.stringify(updated));
          } catch {}
          return updated;
        }
        return current;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [storageKey]);

  // Unified Drag Core Engine for any input device
  const handleDragStart = useCallback((clientX, clientY) => {
    const target = elementRef.current;
    if (!target) return;
    const rect = target.getBoundingClientRect();

    const startX = clientX;
    const startY = clientY;
    const origX = rect.left;
    const origY = rect.top;

    isDraggingRef.current = true;
    hasMovedRef.current = false;

    const onMove = (moveX, moveY) => {
      if (!isDraggingRef.current) return;

      const dx = moveX - startX;
      const dy = moveY - startY;

      // 4px movement deadband to distinguish click from drag
      if (!hasMovedRef.current && Math.hypot(dx, dy) < 4) {
        return;
      }

      if (!hasMovedRef.current) {
        hasMovedRef.current = true;
        justDraggedRef.current = true;
        setIsDragging(true);
        try {
          document.body.style.userSelect = 'none';
          document.body.style.webkitUserSelect = 'none';
        } catch {}
        try {
          hapticFeedback.light();
        } catch {}
      }

      const elemWidth = target.offsetWidth || 60;
      const elemHeight = target.offsetHeight || 44;
      const safeMaxX = Math.max(8, window.innerWidth - elemWidth - 8);
      const safeMaxY = Math.max(50, window.innerHeight - elemHeight - 16);

      const clampedX = Math.max(8, Math.min(safeMaxX, origX + dx));
      const clampedY = Math.max(50, Math.min(safeMaxY, origY + dy));

      setPos({ x: clampedX, y: clampedY });
    };

    const onEnd = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;

      // Clean up window listeners
      window.removeEventListener('pointermove', onGlobalPointerMove);
      window.removeEventListener('pointerup', onGlobalPointerUp);
      window.removeEventListener('pointercancel', onGlobalPointerUp);
      window.removeEventListener('mousemove', onGlobalMouseMove);
      window.removeEventListener('mouseup', onGlobalMouseUp);
      window.removeEventListener('touchmove', onGlobalTouchMove);
      window.removeEventListener('touchend', onGlobalTouchEnd);
      window.removeEventListener('touchcancel', onGlobalTouchEnd);

      try {
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
      } catch {}

      if (hasMovedRef.current) {
        justDraggedRef.current = true;
        setPos((latestPos) => {
          if (latestPos) {
            try {
              localStorage.setItem(storageKey, JSON.stringify(latestPos));
            } catch {}
          }
          return latestPos;
        });
        try {
          hapticFeedback.light();
        } catch {}

        setTimeout(() => {
          setIsDragging(false);
          hasMovedRef.current = false;
          justDraggedRef.current = false;
        }, 120);
      } else {
        setIsDragging(false);
        hasMovedRef.current = false;
        justDraggedRef.current = false;
      }
    };

    const onGlobalPointerMove = (e) => {
      if (e.cancelable) e.preventDefault();
      onMove(e.clientX, e.clientY);
    };

    const onGlobalPointerUp = () => {
      onEnd();
    };

    const onGlobalMouseMove = (e) => {
      onMove(e.clientX, e.clientY);
    };

    const onGlobalMouseUp = () => {
      onEnd();
    };

    const onGlobalTouchMove = (e) => {
      const t = e.touches[0];
      if (t) {
        if (e.cancelable) e.preventDefault();
        onMove(t.clientX, t.clientY);
      }
    };

    const onGlobalTouchEnd = () => {
      onEnd();
    };

    window.addEventListener('pointermove', onGlobalPointerMove, { passive: false });
    window.addEventListener('pointerup', onGlobalPointerUp);
    window.addEventListener('pointercancel', onGlobalPointerUp);
    window.addEventListener('mousemove', onGlobalMouseMove);
    window.addEventListener('mouseup', onGlobalMouseUp);
    window.addEventListener('touchmove', onGlobalTouchMove, { passive: false });
    window.addEventListener('touchend', onGlobalTouchEnd);
    window.addEventListener('touchcancel', onGlobalTouchEnd);
  }, [storageKey]);

  // Pointer Down (Catches Mouse, Touch, Stylus Pen seamlessly)
  const handlePointerDown = useCallback((e) => {
    if (e.button !== undefined && e.button !== 0) return; // Only primary button
    handleDragStart(e.clientX, e.clientY);
  }, [handleDragStart]);

  // Touch Start (Ensures 100% native responsiveness on mobile touchscreens)
  const handleTouchStart = useCallback((e) => {
    if (isDraggingRef.current) return;
    const t = e.touches[0];
    if (t) {
      handleDragStart(t.clientX, t.clientY);
    }
  }, [handleDragStart]);

  // Shield click triggers so dragging doesn't open the modal
  const handleClickCapture = useCallback((e) => {
    if (hasMovedRef.current || justDraggedRef.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, []);

  const resetPosition = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setPos(null);
  }, [storageKey]);

  // Derived style: explicitly sets auto for opposite sides so CSS stylesheets cannot override or stretch!
  const style = {
    position: 'fixed',
    left: pos ? `${pos.x}px` : (defaultPos.left !== undefined ? `${defaultPos.left}px` : 'auto'),
    top: pos ? `${pos.y}px` : (defaultPos.top !== undefined ? `${defaultPos.top}px` : 'auto'),
    right: pos ? 'auto' : (defaultPos.right !== undefined ? `${defaultPos.right}px` : 'auto'),
    bottom: pos ? 'auto' : (defaultPos.bottom !== undefined ? `${defaultPos.bottom}px` : 'auto'),
    touchAction: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    cursor: isDragging ? 'grabbing' : 'grab',
    transition: isDragging ? 'none' : 'box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isDragging ? 'scale(1.08)' : 'scale(1)',
    zIndex: isDragging ? 99999 : 1050
  };

  const bind = {
    ref: elementRef,
    draggable: false,
    onDragStart: (e) => e.preventDefault(),
    onPointerDown: handlePointerDown,
    onTouchStart: handleTouchStart,
    onClickCapture: handleClickCapture
  };

  return {
    ref: elementRef,
    pos,
    isDragging,
    hasMoved: hasMovedRef.current || justDraggedRef.current,
    style,
    bind,
    resetPosition
  };
};
