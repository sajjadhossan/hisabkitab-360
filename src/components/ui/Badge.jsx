import React from 'react';

/**
 * Universal Commercial Status Badge
 * Supports Bangla & English tabular numbers and clean theme adaptation
 */
export const Badge = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  icon: Icon,
  className = '',
  style = {}
}) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
      case 'paid':
        return {
          bg: 'rgba(16, 185, 129, 0.12)',
          text: '#10b981',
          border: 'rgba(16, 185, 129, 0.3)'
        };
      case 'danger':
      case 'due':
        return {
          bg: 'rgba(239, 68, 68, 0.12)',
          text: '#ef4444',
          border: 'rgba(239, 68, 68, 0.3)'
        };
      case 'warning':
      case 'partial':
        return {
          bg: 'rgba(245, 158, 11, 0.12)',
          text: '#f59e0b',
          border: 'rgba(245, 158, 11, 0.3)'
        };
      case 'info':
      case 'primary':
        return {
          bg: 'rgba(99, 102, 241, 0.12)',
          text: '#6366f1',
          border: 'rgba(99, 102, 241, 0.3)'
        };
      case 'cyan':
        return {
          bg: 'rgba(6, 182, 212, 0.12)',
          text: '#06b6d4',
          border: 'rgba(6, 182, 212, 0.3)'
        };
      case 'neutral':
      default:
        return {
          bg: 'rgba(148, 163, 184, 0.12)',
          text: 'var(--text-muted, #94a3b8)',
          border: 'rgba(148, 163, 184, 0.2)'
        };
    }
  };

  const colors = getColors();

  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: size === 'sm' ? '2px 8px' : '4px 10px',
    borderRadius: '9999px',
    fontSize: size === 'sm' ? '11px' : '12px',
    fontWeight: 600,
    lineHeight: 1.3,
    background: colors.bg,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums',
    userSelect: 'none',
    ...style
  };

  return (
    <span style={baseStyles} className={`app-badge ${className}`}>
      {dot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: colors.text,
            boxShadow: `0 0 6px ${colors.text}`
          }}
        />
      )}
      {Icon && <Icon size={size === 'sm' ? 12 : 13} />}
      <span>{children}</span>
    </span>
  );
};
