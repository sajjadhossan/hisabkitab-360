import { useState, useRef, useEffect, useCallback } from 'react';
import { hapticFeedback } from '../services/nativeAppService';

/**
 * useDraggableWidget
 * -------------------
 * Reusable hook that makes any floating widget freely movable / draggable across the screen
 * with bulletproof Pointer AND Touch event support (especially on Android / iOS WebView).
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
  const dragRef = useRef({
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    hasMoved: false,
    active: false,
    pointerId: null
  });
  const elementRef = useRef(null);

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

  // Unified drag start
  const startDrag = (clientX, clientY, pointerId = null) => {
    const target = elementRef.current;
    if (!target) return;
    const rect = target.getBoundingClientRect();

    dragRef.current = {
      startX: clientX,
      startY: clientY,
      origX: rect.left,
      origY: rect.top,
      hasMoved: false,
      active: true,
      pointerId
    };
  };

  // Unified drag move with boundary clamping
  const moveDrag = (clientX, clientY) => {
    if (!dragRef.current.active) return;

    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;

    // Movement deadband: 4px threshold before declaring a drag vs a tap
    if (!dragRef.current.hasMoved && Math.hypot(dx, dy) < 4) {
      return;
    }

    if (!dragRef.current.hasMoved) {
      dragRef.current.hasMoved = true;
      setIsDragging(true);
      try {
        hapticFeedback.light();
      } catch {}
    }

    const newX = dragRef.current.origX + dx;
    const newY = dragRef.current.origY + dy;

    const elemWidth = elementRef.current?.offsetWidth || 70;
    const elemHeight = elementRef.current?.offsetHeight || 44;
    const safeMaxX = Math.max(8, window.innerWidth - elemWidth - 8);
    const safeMaxY = Math.max(50, window.innerHeight - elemHeight - 16);

    const clampedX = Math.max(8, Math.min(safeMaxX, newX));
    const clampedY = Math.max(50, Math.min(safeMaxY, newY));

    setPos({ x: clampedX, y: clampedY });
  };

  // Unified drag end with edge-persistence
  const endDrag = () => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;

    if (dragRef.current.hasMoved) {
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
    }

    setTimeout(() => {
      setIsDragging(false);
      dragRef.current.hasMoved = false;
    }, 60);
  };

  // Pointer Event Handlers
  const handlePointerDown = useCallback((e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    startDrag(e.clientX, e.clientY, e.pointerId);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!dragRef.current.active || (dragRef.current.pointerId !== null && dragRef.current.pointerId !== e.pointerId)) return;
    moveDrag(e.clientX, e.clientY);
  }, []);

  const handlePointerUp = useCallback((e) => {
    if (dragRef.current.pointerId === e.pointerId || dragRef.current.active) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      endDrag();
    }
  }, [storageKey]);

  const handlePointerCancel = useCallback((e) => {
    if (dragRef.current.pointerId === e.pointerId || dragRef.current.active) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      endDrag();
    }
  }, []);

  // Direct Touch Events (100% Reliable on Android Capacitor & WebViews)
  const handleTouchStart = useCallback((e) => {
    const t = e.touches[0];
    if (!t) return;
    startDrag(t.clientX, t.clientY, 'touch');
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!dragRef.current.active) return;
    const t = e.touches[0];
    if (!t) return;
    if (e.cancelable) e.preventDefault(); // Prevents Android scroll/pull-to-refresh while dragging
    moveDrag(t.clientX, t.clientY);
  }, []);

  const handleTouchEnd = useCallback(() => {
    endDrag();
  }, [storageKey]);

  const handleTouchCancel = useCallback(() => {
    endDrag();
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
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel
  };

  return {
    ref: elementRef,
    pos,
    isDragging,
    hasMoved: dragRef.current.hasMoved,
    style,
    bind,
    resetPosition
  };
};
