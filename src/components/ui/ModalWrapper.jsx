import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { hapticFeedback } from '../../services/nativeAppService';

/**
 * Universal Mobile-Safe Modal Wrapper
 * Prevents screen overflow, supports virtual keyboard, safe-area-inset & ESC key
 */
export const ModalWrapper = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  badgeText,
  badgeVariant = 'info',
  children,
  footer,
  maxWidth = '560px',
  zIndex = 99999,
  className = '',
  bodyStyle = {}
}) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        try {
          hapticFeedback.light();
        } catch {}
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll when modal is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        ref={modalRef}
        style={{
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-secondary, #101623)',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
          borderRadius: '16px',
          boxShadow: 'var(--elevation-float, 0 20px 40px -8px rgba(0, 0, 0, 0.5))',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'scaleUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        className={className}
      >
        {/* Sticky Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            backgroundColor: 'var(--bg-secondary, #101623)',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            {Icon && (
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--business-badge-bg, rgba(99, 102, 241, 0.15))',
                  color: 'var(--business-primary, #6366f1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Icon size={18} />
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--text-main, #f1f5f9)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {title}
                </h3>
                {badgeText && (
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(99, 102, 241, 0.15)',
                      color: '#818cf8',
                      fontWeight: 600
                    }}
                  >
                    {badgeText}
                  </span>
                )}
              </div>
              {subtitle && (
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: '12px',
                    color: 'var(--text-muted, #94a3b8)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              try {
                hapticFeedback.light();
              } catch {}
              onClose?.();
            }}
            aria-label="Close"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.06)',
              color: 'var(--text-muted, #94a3b8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.15s'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div
          style={{
            padding: '16px 18px',
            overflowY: 'auto',
            flex: 1,
            WebkitOverflowScrolling: 'touch',
            ...bodyStyle
          }}
        >
          {children}
        </div>

        {/* Optional Sticky Footer (Safe from keyboard overflow) */}
        {footer && (
          <div
            style={{
              padding: '12px 18px',
              borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
              backgroundColor: 'var(--bg-secondary, #101623)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              flexShrink: 0
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
