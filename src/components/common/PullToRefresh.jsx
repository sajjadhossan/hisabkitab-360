import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { hapticFeedback } from '../../services/nativeAppService';

export const PullToRefresh = ({ onRefresh, children }) => {
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const hasTriggeredHapticRef = useRef(false);

  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const pullYRef = useRef(0);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    const handleTouchStart = (e) => {
      if (window.scrollY <= 2 && e.touches.length === 1) {
        startYRef.current = e.touches[0].clientY;
        isPullingRef.current = true;
        hasTriggeredHapticRef.current = false;
      }
    };

    const handleTouchMove = (e) => {
      if (!isPullingRef.current || isRefreshingRef.current || window.scrollY > 5) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - startYRef.current;

      if (diff > 0) {
        // Damped pull distance
        const damped = Math.min(diff * 0.4, 75);
        pullYRef.current = damped;
        setPullY(damped);

        if (damped > 50 && !hasTriggeredHapticRef.current) {
          hasTriggeredHapticRef.current = true;
          hapticFeedback.light();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!isPullingRef.current) return;
      isPullingRef.current = false;

      if (pullYRef.current >= 50 && !isRefreshingRef.current) {
        isRefreshingRef.current = true;
        setIsRefreshing(true);
        setPullY(50);
        hapticFeedback.medium();

        try {
          if (onRefreshRef.current) {
            await onRefreshRef.current();
          }
        } catch {}

        setTimeout(() => {
          isRefreshingRef.current = false;
          setIsRefreshing(false);
          pullYRef.current = 0;
          setPullY(0);
          hapticFeedback.light();
        }, 500);
      } else {
        pullYRef.current = 0;
        setPullY(0);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <div className="pull-to-refresh-container" style={{ position: 'relative', width: '100%' }}>
      {/* Pull Indicator Pill */}
      <div
        className="pull-to-refresh-indicator no-print"
        style={{
          position: 'fixed',
          top: `calc(${pullY}px - 44px)`,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: 'var(--bg-secondary)',
          border: '1.5px solid var(--border-color)',
          borderRadius: '50px',
          padding: '6px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          opacity: pullY > 15 ? 1 : 0,
          transition: isPullingRef.current ? 'none' : 'top 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease',
          pointerEvents: 'none'
        }}
      >
        <RefreshCw
          size={16}
          style={{
            transform: `rotate(${pullY * 5}deg)`,
            animation: isRefreshing ? 'spin 0.7s linear infinite' : 'none',
            color: 'var(--personal-primary, #10b981)'
          }}
        />
        <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-main)' }}>
          {isRefreshing ? 'রিফ্রেশ হচ্ছে...' : pullY >= 50 ? 'ছেড়ে দিন রিফ্রেশ করতে' : 'নিচে টানুন'}
        </span>
      </div>

      {children}
    </div>
  );
};
