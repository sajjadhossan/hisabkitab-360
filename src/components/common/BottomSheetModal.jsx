import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { registerBackAction } from '../../services/nativeAppService';

/**
 * Mobile-First Contextual Bottom Sheet Modal
 * Supports drag-down to dismiss, safe area insets, and smooth spring sliding
 */
export const BottomSheetModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxHeight = '88vh'
}) => {
  const sheetRef = useRef(null);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);

  useEffect(() => {
    if (!isOpen) return;
    const cleanupBack = registerBackAction(() => {
      onClose();
    });
    return cleanupBack;
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTouchStart = (e) => {
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    const diff = e.touches[0].clientY - startYRef.current;
    if (diff > 0 && sheetRef.current) {
      currentYRef.current = diff;
      sheetRef.current.style.transform = `translateY(${diff}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (currentYRef.current > 100) {
      onClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = 'translateY(0px)';
    }
    currentYRef.current = 0;
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          width: '100%',
          maxWidth: '680px',
          margin: '0 auto',
          background: 'linear-gradient(180deg, #1e293b, #0f172a)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderBottom: 'none',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.6)',
          maxHeight,
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.15s ease-out',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)'
        }}
      >
        {/* Grab Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px 0', cursor: 'grab' }}>
          <div style={{ width: '42px', height: '4px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.25)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px 14px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: '#f8fafc' }}>{title}</h3>
            {subtitle && <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ overflowY: 'auto', padding: '16px 20px', flex: 1, WebkitOverflowScrolling: 'touch' }}>
          {children}
        </div>
      </div>
    </div>
  );
};
