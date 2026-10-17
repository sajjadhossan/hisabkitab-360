import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

/**
 * HisabKitab 360 - Dynamic Anti-Leak Security Watermark (Phase 6, Feature 58)
 * Renders an unobtrusive, repeating faint overlay with User ID, Branch, and dynamic timestamp.
 * Blocks confidential financial and customer phone number leakage through camera snapshots.
 */
export const AntiLeakWatermark = () => {
  const { businessSettings } = useApp() || {};
  const { user } = useAuth() || {};

  const [isEnabled, setIsEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('hk360_security_anti_leak_watermark');
      if (saved !== null) return saved === 'true';
      return !!businessSettings?.enableAntiLeakWatermark;
    } catch {
      return false;
    }
  });

  const [currentDateTime, setCurrentDateTime] = useState(() =>
    new Date().toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  );

  useEffect(() => {
    // Listen for storage or custom events when settings change
    const handleStorage = () => {
      try {
        const saved = localStorage.getItem('hk360_security_anti_leak_watermark');
        if (saved !== null) setIsEnabled(saved === 'true');
      } catch {}
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('hk360_watermark_toggle', handleStorage);

    // Refresh timestamp every 3 minutes
    const interval = setInterval(() => {
      setCurrentDateTime(
        new Date().toLocaleDateString('bn-BD', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      );
    }, 180000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('hk360_watermark_toggle', handleStorage);
      clearInterval(interval);
    };
  }, []);

  if (!isEnabled) return null;

  const watermarkText = `${user?.name || user?.email || 'হিসাবকিতাব ৩৬০'} • [UID: ${(user?.id || 'SEC-01').slice(0, 8)}] • ${currentDateTime}`;

  return (
    <div
      className="anti-leak-watermark-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9990,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '80px 40px',
        padding: '30px',
        overflow: 'hidden',
        userSelect: 'none',
        opacity: 0.045
      }}
      aria-hidden="true"
    >
      {Array.from({ length: 24 }).map((_, idx) => (
        <div
          key={idx}
          style={{
            transform: 'rotate(-25deg)',
            fontSize: '11px',
            fontWeight: 700,
            color: 'currentColor',
            whiteSpace: 'nowrap',
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}
        >
          {watermarkText}
        </div>
      ))}
    </div>
  );
};

export default AntiLeakWatermark;
