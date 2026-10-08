import React, { useState, useRef } from 'react';
import { hapticFeedback } from '../../services/nativeAppService';

/**
 * Mobile Fluid Swipe-to-Action Component
 * Supports left & right reveal actions (e.g., Delete, Call, Edit) with momentum haptics.
 */
export const SwipeableRow = ({
  children,
  leftAction = null,   // { icon, label, bg, color, onClick }
  rightAction = null,  // { icon, label, bg, color, onClick }
  disabled = false,
  className = '',
  style = {}
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const hasTriggeredHapticRef = useRef(false);

  const ACTION_WIDTH = 75;

  const handleTouchStart = (e) => {
    if (disabled) return;
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = startXRef.current;
    setIsSwiping(true);
    hasTriggeredHapticRef.current = false;
  };

  const handleTouchMove = (e) => {
    if (!isSwiping || disabled) return;
    currentXRef.current = e.touches[0].clientX;
    const diff = currentXRef.current - startXRef.current;

    // Constrain offset
    let newOffset = 0;
    if (diff > 0 && leftAction) {
      // Swiping right to reveal left action
      newOffset = Math.min(diff * 0.65, ACTION_WIDTH + 15);
    } else if (diff < 0 && rightAction) {
      // Swiping left to reveal right action
      newOffset = Math.max(diff * 0.65, -(ACTION_WIDTH + 15));
    }

    setOffsetX(newOffset);

    // Haptic notch when reaching action threshold
    if (Math.abs(newOffset) >= ACTION_WIDTH && !hasTriggeredHapticRef.current) {
      hapticFeedback.selection();
      hasTriggeredHapticRef.current = true;
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping || disabled) return;
    setIsSwiping(false);

    if (offsetX > ACTION_WIDTH * 0.7 && leftAction) {
      setOffsetX(ACTION_WIDTH);
    } else if (offsetX < -ACTION_WIDTH * 0.7 && rightAction) {
      setOffsetX(-ACTION_WIDTH);
    } else {
      setOffsetX(0);
    }
  };

  const resetSwipe = () => {
    setOffsetX(0);
  };

  return (
    <div
      className={`swipeable-row-container ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        touchAction: 'pan-y',
        borderRadius: '12px',
        ...style
      }}
    >
      {/* Left Action Background */}
      {leftAction && (
        <div
          onClick={() => {
            resetSwipe();
            leftAction.onClick?.();
          }}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${ACTION_WIDTH}px`,
            background: leftAction.bg || '#10b981',
            color: leftAction.color || '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 1,
            gap: '2px',
            fontSize: '0.68rem',
            fontWeight: '800'
          }}
        >
          {leftAction.icon}
          {leftAction.label && <span>{leftAction.label}</span>}
        </div>
      )}

      {/* Right Action Background */}
      {rightAction && (
        <div
          onClick={() => {
            resetSwipe();
            rightAction.onClick?.();
          }}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: `${ACTION_WIDTH}px`,
            background: rightAction.bg || '#ef4444',
            color: rightAction.color || '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 1,
            gap: '2px',
            fontSize: '0.68rem',
            fontWeight: '800'
          }}
        >
          {rightAction.icon}
          {rightAction.label && <span>{rightAction.label}</span>}
        </div>
      )}

      {/* Main Foreground Item */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (offsetX !== 0) resetSwipe();
        }}
        style={{
          position: 'relative',
          zIndex: 2,
          background: 'var(--bg-secondary)',
          transform: `translateX(${offsetX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform'
        }}
      >
        {children}
      </div>
    </div>
  );
};
