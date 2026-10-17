import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  Trash2,
  AlertCircle,
  Info,
  CheckCircle2,
  X,
  HelpCircle,
  Edit3
} from 'lucide-react';
import { subscribeDialog } from '../../services/dialogService';
import { hapticFeedback } from '../../services/nativeAppService';

export const ModernConfirmModal = () => {
  const [dialog, setDialog] = useState({ isOpen: false });
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeDialog((state) => {
      setDialog(state);
      if (state.isOpen && state.isPrompt) {
        setInputValue(state.defaultValue || '');
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
          }
        }, 80);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!dialog.isOpen) return;
      if (e.key === 'Escape') {
        handleCancel();
      } else if (e.key === 'Enter' && !dialog.isPrompt) {
        handleConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialog]);

  if (!dialog.isOpen) return null;

  const handleConfirm = () => {
    try {
      hapticFeedback.light();
    } catch {}
    if (dialog.isPrompt) {
      dialog.resolve?.(inputValue);
    } else {
      dialog.resolve?.(true);
    }
  };

  const handleCancel = () => {
    try {
      hapticFeedback.light();
    } catch {}
    if (dialog.isPrompt) {
      dialog.resolve?.(null);
    } else {
      dialog.resolve?.(false);
    }
  };

  const isDanger = dialog.type === 'danger';
  const isWarning = dialog.type === 'warning';
  const isSuccess = dialog.type === 'success';

  const themeColors = isDanger
    ? {
        accent: '#ef4444',
        border: 'rgba(239, 68, 68, 0.4)',
        bgGlow: 'rgba(239, 68, 68, 0.12)',
        btnBg: 'linear-gradient(135deg, #ef4444, #dc2626)',
        btnShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
      }
    : isWarning
    ? {
        accent: '#f59e0b',
        border: 'rgba(245, 158, 11, 0.4)',
        bgGlow: 'rgba(245, 158, 11, 0.12)',
        btnBg: 'linear-gradient(135deg, #f59e0b, #d97706)',
        btnShadow: '0 4px 14px rgba(245, 158, 11, 0.4)'
      }
    : isSuccess
    ? {
        accent: '#10b981',
        border: 'rgba(16, 185, 129, 0.4)',
        bgGlow: 'rgba(16, 185, 129, 0.12)',
        btnBg: 'linear-gradient(135deg, #10b981, #059669)',
        btnShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
      }
    : {
        accent: '#3b82f6',
        border: 'rgba(59, 130, 246, 0.4)',
        bgGlow: 'rgba(59, 130, 246, 0.12)',
        btnBg: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        btnShadow: '0 4px 14px rgba(59, 130, 246, 0.4)'
      };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={handleCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '430px',
          background: 'var(--bg-card, #1e293b)',
          border: `1.5px solid ${themeColors.border}`,
          borderRadius: '20px',
          boxShadow: `0 20px 45px rgba(0, 0, 0, 0.5), ${themeColors.btnShadow}`,
          overflow: 'hidden',
          animation: 'modalSlideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          color: 'var(--text-main, #f8fafc)'
        }}
      >
        {/* Header Ribbon with Glow */}
        <div
          style={{
            padding: '16px 20px 12px',
            background: themeColors.bgGlow,
            borderBottom: `1px solid ${themeColors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: themeColors.btnBg,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: themeColors.btnShadow
              }}
            >
              {dialog.isPrompt ? (
                <Edit3 size={18} />
              ) : isDanger ? (
                <Trash2 size={18} />
              ) : isWarning ? (
                <AlertTriangle size={18} />
              ) : isSuccess ? (
                <CheckCircle2 size={18} />
              ) : (
                <HelpCircle size={18} />
              )}
            </div>
            <div>
              <div style={{ fontSize: '0.98rem', fontWeight: '800', letterSpacing: '-0.01em' }}>
                {dialog.title}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', fontWeight: '600' }}>
                হিসাবকিতাব ৩৬০ সিকিউর ডায়ালগ
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #94a3b8)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 22px' }}>
          <div
            style={{
              fontSize: '0.98rem',
              fontWeight: '700',
              lineHeight: '1.45',
              color: 'var(--text-main, #f8fafc)',
              marginBottom: dialog.subMessage || dialog.isPrompt ? '8px' : '0'
            }}
          >
            {dialog.message}
          </div>

          {dialog.subMessage && (
            <div
              style={{
                fontSize: '0.8rem',
                lineHeight: '1.4',
                color: 'var(--text-muted, #94a3b8)',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color, rgba(148, 163, 184, 0.15))',
                marginTop: '10px'
              }}
            >
              {dialog.subMessage}
            </div>
          )}

          {/* Prompt Input Field */}
          {dialog.isPrompt && (
            <div style={{ marginTop: '14px' }}>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={dialog.placeholder || 'এখানে টাইপ করুন...'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleConfirm();
                  }
                }}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: `1.5px solid ${themeColors.border}`,
                  background: 'var(--bg-primary, #0f172a)',
                  color: 'var(--text-main, #f8fafc)',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  outline: 'none',
                  boxShadow: `0 0 0 3px ${themeColors.bgGlow}`
                }}
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div
          style={{
            padding: '14px 20px 18px',
            borderTop: '1px solid var(--border-color, rgba(148, 163, 184, 0.12))',
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end',
            background: 'rgba(0, 0, 0, 0.15)'
          }}
        >
          <button
            type="button"
            onClick={handleCancel}
            style={{
              flex: '1 1 100px',
              padding: '10px 16px',
              borderRadius: '10px',
              border: '1px solid var(--border-color, rgba(148, 163, 184, 0.25))',
              background: 'transparent',
              color: 'var(--text-main, #f8fafc)',
              fontSize: '0.86rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {dialog.cancelText}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            style={{
              flex: '1 1 130px',
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              background: themeColors.btnBg,
              color: '#ffffff',
              fontSize: '0.86rem',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: themeColors.btnShadow,
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            {isDanger && <Trash2 size={16} />}
            <span>{dialog.confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
