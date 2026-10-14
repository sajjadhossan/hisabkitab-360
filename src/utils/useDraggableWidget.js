import { useState, useRef, useEffect, useCallback } from 'react';
import { hapticFeedback } from '../services/nativeAppService';

/**
 * useDraggableWidget
 * -------------------
 * Reusable hook that makes any floating widget freely movable / draggable across the screen
 * with bulletproof Pointer, Mouse AND Touch event support (Desktop PC, Laptop, and Android / iOS WebView).
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
  const dragRef = useRef({
    hasMoved: false,
    active: false
  });
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

  // Unified Mouse & Pointer Drag Starter
  const handlePointerDown = useCallback((e) => {
    // Only primary mouse button (0) or touch/pen
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.button !== undefined && e.button !== 0) return;

    const target = elementRef.current;
    if (!target) return;
    const rect = target.getBoundingClientRect();

    const startX = e.clientX;
    const startY = e.clientY;
    const origX = rect.left;
    const origY = rect.top;
    const pointerId = e.pointerId;

    let hasMoved = false;
    dragRef.current.active = true;

    // Global Movement handler
    const onMove = (moveEvt) => {
      if (pointerId !== undefined && moveEvt.pointerId !== undefined && moveEvt.pointerId !== pointerId) {
        return;
      }

      const clientX = moveEvt.clientX;
      const clientY = moveEvt.clientY;
      const dx = clientX - startX;
      const dy = clientY - startY;

      // 4px movement deadband to distinguish click from drag
      if (!hasMoved && Math.hypot(dx, dy) < 4) {
        return;
      }

      if (moveEvt.cancelable) moveEvt.preventDefault();

      if (!hasMoved) {
        hasMoved = true;
        dragRef.current.hasMoved = true;
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

    // Global Release / End handler
    const onUp = (upEvt) => {
      if (pointerId !== undefined && upEvt && upEvt.pointerId !== undefined && upEvt.pointerId !== pointerId) {
        return;
      }

      window.removeEventListener('pointermove', onMove, { passive: false });
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);

      dragRef.current.active = false;

      try {
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
      } catch {}

      if (hasMoved) {
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
          dragRef.current.hasMoved = false;
          justDraggedRef.current = false;
        }, 120);
      } else {
        setIsDragging(false);
        dragRef.current.hasMoved = false;
        justDraggedRef.current = false;
      }
    };

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [storageKey]);

  // Direct Touch Events (100% Reliable on Android Capacitor & WebViews)
  const handleTouchStart = useCallback((e) => {
    const t = e.touches[0];
    if (!t) return;

    const target = elementRef.current;
    if (!target) return;
    const rect = target.getBoundingClientRect();

    const startX = t.clientX;
    const startY = t.clientY;
    const origX = rect.left;
    const origY = rect.top;

    let hasMoved = false;
    dragRef.current.active = true;

    const onTouchMove = (moveEvt) => {
      const touch = moveEvt.touches[0];
      if (!touch) return;

      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;

      if (!hasMoved && Math.hypot(dx, dy) < 4) {
        return;
      }

      if (moveEvt.cancelable) moveEvt.preventDefault();

      if (!hasMoved) {
        hasMoved = true;
        dragRef.current.hasMoved = true;
        justDraggedRef.current = true;
        setIsDragging(true);
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

    const onTouchEnd = () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);

      dragRef.current.active = false;

      if (hasMoved) {
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
          dragRef.current.hasMoved = false;
          justDraggedRef.current = false;
        }, 120);
      } else {
        setIsDragging(false);
        dragRef.current.hasMoved = false;
        justDraggedRef.current = false;
      }
    };

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);
  }, [storageKey]);

  // Shield click triggers so dragging doesn't open the modal
  const handleClickCapture = useCallback((e) => {
    if (dragRef.current.hasMoved || justDraggedRef.current) {
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
    onMouseDown: handlePointerDown,
    onTouchStart: handleTouchStart,
    onClickCapture: handleClickCapture
  };

  return {
    ref: elementRef,
    pos,
    isDragging,
    hasMoved: dragRef.current.hasMoved || justDraggedRef.current,
    style,
    bind,
    resetPosition
  };
};
