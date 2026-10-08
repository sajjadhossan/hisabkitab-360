import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { registerBackAction, hapticFeedback } from '../../services/nativeAppService';

/**
 * Mobile-First Swipeable Bottom Sheet Component
 * -----------------------------------------------
 * Modern native gesture sheet replacing intrusive modals on mobile devices.
 * Features:
 * - Touch swipe-down to dismiss
 * - Integrates with Android hardware Back button
 * - Backdrop blur & spring physics
 * - Safe area padding
 */
export const BottomSheet = ({
  isOpen,
  onClose,
  title,
  icon = null,
  children,
  maxHeight = '88vh',
  className = '',
  showCloseButton = true
}) => {
  const [dragY, setDragY] = useState(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);

  // Integrate Android Hardware Back Button
  useEffect(() => {
    if (!isOpen) return;

    hapticFeedback.light();
    const unregister = registerBackAction(() => {
      onClose();
      return true;
    });

    return () => unregister();
  }, [isOpen, onClose]);

  // Touch gesture handling for drag-to-dismiss
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0) {
      setDragY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (dragY > 80) {
      hapticFeedback.medium();
      onClose();
    }
    setDragY(0);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`bottom-sheet-backdrop active ${className}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          hapticFeedback.light();
          onClose();
        }
      }}
    >
      <div
        className="bottom-sheet-panel open"
        style={{
          maxHeight,
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: isDragging.current ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Drag handle pill */}
        <div
          className="bottom-sheet-handle-bar"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="bottom-sheet-handle-pill" />
        </div>

        {/* Header */}
        {(title || showCloseButton) && (
          <div
            style={{
              padding: '6px 1.25rem 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-color)',
              marginBottom: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {icon && <span style={{ color: 'var(--business-primary)', display: 'flex' }}>{icon}</span>}
              {title && <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>{title}</h3>}
            </div>

            {showCloseButton && (
              <button
                type="button"
                className="btn-icon"
                onClick={() => {
                  hapticFeedback.light();
                  onClose();
                }}
                style={{ color: 'var(--text-muted)', padding: '6px' }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Sheet Content Body */}
        <div className="bottom-sheet-body">
          {children}
        </div>
      </div>
    </div>
  );
};
