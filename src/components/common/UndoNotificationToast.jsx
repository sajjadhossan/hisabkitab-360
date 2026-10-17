import React, { useState, useEffect } from 'react';
import { RotateCcw, X, CheckCircle2 } from 'lucide-react';
import { soundService } from '../../services/soundService';

let triggerUndoToastFn = null;

export const showUndoToast = (options) => {
  if (triggerUndoToastFn) {
    triggerUndoToastFn(options);
  }
};

export const UndoNotificationToast = ({ lang = 'bn' }) => {
  const [toastData, setToastData] = useState(null);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    triggerUndoToastFn = ({ message, onUndo, duration = 5000 }) => {
      soundService.playWarningTone();
      setToastData({ message, onUndo, duration, startTime: Date.now() });
      setProgress(100);
    };

    return () => {
      triggerUndoToastFn = null;
    };
  }, []);

  useEffect(() => {
    if (!toastData) return;

    const interval = 50;
    const step = (interval / toastData.duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          setToastData(null);
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [toastData]);

  if (!toastData) return null;

  const handleUndo = () => {
    if (toastData.onUndo) {
      soundService.playSuccessChime();
      toastData.onUndo();
    }
    setToastData(null);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '84px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        maxWidth: '480px',
        width: '90%',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98))',
        border: '1px solid rgba(56, 189, 248, 0.4)',
        borderRadius: '16px',
        padding: '12px 16px',
        boxShadow: '0 16px 36px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
          <CheckCircle2 size={18} style={{ color: '#38bdf8', flexShrink: 0 }} />
          <span style={{ fontSize: '0.88rem', color: '#f8fafc', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {toastData.message}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={handleUndo}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              border: 'none',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)'
            }}
          >
            <RotateCcw size={13} />
            <span>{lang === 'bn' ? 'পূর্বাবস্থায় ফেরান' : 'Undo'}</span>
          </button>

          <button
            onClick={() => setToastData(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Progress countdown bar */}
      <div style={{ width: '100%', height: '3px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
            transition: 'width 0.05s linear'
          }}
        />
      </div>
    </div>
  );
};
