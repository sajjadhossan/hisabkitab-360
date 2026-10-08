import React, { useEffect, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';
import { playButtonClick } from '../../services/soundFeedback';

/**
 * Universal Floating Undo Banner
 * ------------------------------
 * Replaces frustrating confirm pop-ups with modern optimistic delete + undo.
 * Automatically dismisses after `durationMs` (default 5000ms).
 */
export function UndoBanner({
  message = 'আইটেম মুছে ফেলা হয়েছে',
  onUndo,
  onDismiss,
  durationMs = 5000,
  lang = 'bn'
}) {
  const [timeLeft, setTimeLeft] = useState(durationMs);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const rem = Math.max(0, durationMs - elapsed);
      setTimeLeft(rem);
      if (rem <= 0) {
        clearInterval(interval);
        if (typeof onDismiss === 'function') onDismiss();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [durationMs, onDismiss]);

  const progressPercent = Math.max(0, (timeLeft / durationMs) * 100);

  const handleUndoClick = () => {
    playButtonClick();
    if (typeof onUndo === 'function') onUndo();
  };

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%) translate3d(0, 0, 0)',
        zIndex: 99999,
        background: '#0B1120',
        border: '1px solid rgba(255, 255, 255, 0.16)',
        boxShadow: '0 16px 36px -4px rgba(0, 0, 0, 0.6)',
        borderRadius: '30px',
        padding: '8px 16px 8px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        color: '#ffffff',
        fontSize: '0.88rem',
        fontWeight: '700',
        minWidth: '290px',
        maxWidth: '90vw',
        animation: 'fastFadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden'
      }}
    >
      {/* Progress Line */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '2.5px',
          width: `${progressPercent}%`,
          background: 'var(--personal-primary, #10b981)',
          transition: 'width 0.1s linear'
        }}
      />

      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {message}
      </span>

      <button
        type="button"
        onClick={handleUndoClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          background: 'var(--personal-primary, #10b981)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '20px',
          padding: '5px 12px',
          fontSize: '0.8rem',
          fontWeight: '800',
          cursor: 'pointer',
          touchAction: 'manipulation'
        }}
      >
        <RotateCcw size={13} />
        {lang === 'bn' ? 'পূর্বাবস্থায় আনুন' : 'Undo'}
      </button>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{
          background: 'transparent',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          padding: '2px',
          touchAction: 'manipulation'
        }}
      >
        <X size={15} />
      </button>
    </div>
  );
}
