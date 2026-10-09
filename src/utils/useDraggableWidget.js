import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * useDraggableWidget
 * -------------------
 * Reusable hook that makes any floating widget freely movable / draggable across the screen
 * with pointer capture (supports Mouse & Touch).
 * Automatically clamps within screen boundaries and persists position in localStorage.
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
          const safeMaxX = Math.max(10, window.innerWidth - 65);
          const safeMaxY = Math.max(60, window.innerHeight - 65);
          return {
            x: Math.max(10, Math.min(safeMaxX, parsed.x)),
            y: Math.max(60, Math.min(safeMaxY, parsed.y))
          };
        }
      }
    } catch {}
    return null; // Fall back to default CSS dock
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({
    pointerId: null,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    hasMoved: false
  });
  const elementRef = useRef(null);

  // Auto-clamp inside screen whenever window resizes or phone rotates
  useEffect(() => {
    const handleResize = () => {
      setPos((current) => {
        if (!current) return null;
        const elemWidth = elementRef.current?.offsetWidth || 56;
        const elemHeight = elementRef.current?.offsetHeight || 56;
        const safeMaxX = Math.max(10, window.innerWidth - elemWidth - 10);
        const safeMaxY = Math.max(60, window.innerHeight - elemHeight - 10);
        const clampedX = Math.max(10, Math.min(safeMaxX, current.x));
        const clampedY = Math.max(60, Math.min(safeMaxY, current.y));
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

  const handlePointerDown = useCallback((e) => {
    // Only primary button for mouse
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const target = elementRef.current || e.currentTarget;
    const rect = target.getBoundingClientRect();

    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: rect.left,
      origY: rect.top,
      hasMoved: false
    };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (dragRef.current.pointerId !== e.pointerId) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    // Movement deadband: Require at least 5px movement before starting drag
    if (!dragRef.current.hasMoved && Math.hypot(dx, dy) < 5) {
      return;
    }

    if (!dragRef.current.hasMoved) {
      dragRef.current.hasMoved = true;
      setIsDragging(true);
    }

    const newX = dragRef.current.origX + dx;
    const newY = dragRef.current.origY + dy;

    const elemWidth = elementRef.current?.offsetWidth || 56;
    const elemHeight = elementRef.current?.offsetHeight || 56;
    const safeMaxX = Math.max(10, window.innerWidth - elemWidth - 10);
    const safeMaxY = Math.max(60, window.innerHeight - elemHeight - 10);

    const clampedX = Math.max(10, Math.min(safeMaxX, newX));
    const clampedY = Math.max(60, Math.min(safeMaxY, newY));

    setPos({ x: clampedX, y: clampedY });
  }, []);

  const handlePointerUp = useCallback((e) => {
    if (dragRef.current.pointerId === e.pointerId) {
      if (dragRef.current.hasMoved) {
        setPos((latestPos) => {
          if (latestPos) {
            try {
              localStorage.setItem(storageKey, JSON.stringify(latestPos));
            } catch {}
          }
          return latestPos;
        });
      }
      dragRef.current.pointerId = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}

      // Short delay so onClick handler can check if this was a drag vs a tap
      setTimeout(() => {
        setIsDragging(false);
        dragRef.current.hasMoved = false;
      }, 50);
    }
  }, [storageKey]);

  const handlePointerCancel = useCallback((e) => {
    if (dragRef.current.pointerId === e.pointerId) {
      dragRef.current.pointerId = null;
      setIsDragging(false);
      dragRef.current.hasMoved = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  }, []);

  const resetPosition = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setPos(null);
  }, [storageKey]);

  // Derived style
  const style = {
    position: 'fixed',
    left: pos ? `${pos.x}px` : (defaultPos.left !== undefined ? `${defaultPos.left}px` : undefined),
    top: pos ? `${pos.y}px` : (defaultPos.top !== undefined ? `${defaultPos.top}px` : undefined),
    right: pos ? undefined : (defaultPos.right !== undefined ? `${defaultPos.right}px` : undefined),
    bottom: pos ? undefined : (defaultPos.bottom !== undefined ? `${defaultPos.bottom}px` : undefined),
    touchAction: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    cursor: isDragging ? 'grabbing' : 'grab',
    transition: isDragging ? 'none' : 'box-shadow 0.2s, transform 0.2s',
    transform: isDragging ? 'scale(1.08)' : undefined
  };

  const bind = {
    ref: elementRef,
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel
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
