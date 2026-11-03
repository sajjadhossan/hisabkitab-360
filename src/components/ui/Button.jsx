import React from 'react';
import { hapticFeedback } from '../../services/nativeAppService';

/**
 * Universal Commercial Button Component
 * Supports Theme Tokens, Minimum 44px Touch Targets, Haptics & Loading States
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  className = '',
  style = {},
  type = 'button',
  title,
  ...props
}) => {
  const handleClick = (e) => {
    if (disabled || loading) return;
    try {
      hapticFeedback.light();
    } catch {}
    onClick?.(e);
  };

  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: 'inherit',
    fontWeight: 600,
    borderRadius: '10px',
    transition: 'all 0.18s ease-in-out',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    outline: 'none',
    border: '1px solid transparent',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    textDecoration: 'none',
    boxSizing: 'border-box',
    width: fullWidth ? '100%' : 'auto',
    minHeight: size === 'sm' ? '36px' : size === 'lg' ? '48px' : '44px', // Touch-target guard
    padding: size === 'sm' ? '6px 12px' : size === 'lg' ? '12px 24px' : '10px 18px',
    fontSize: size === 'sm' ? '12px' : size === 'lg' ? '15px' : '13.5px',
    ...style
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: 'linear-gradient(135deg, var(--business-primary, #6366f1) 0%, #4f46e5 100%)',
          color: '#ffffff',
          borderColor: 'rgba(255, 255, 255, 0.15)',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.28)'
        };
      case 'personal':
      case 'success':
        return {
          background: 'linear-gradient(135deg, var(--color-success, #10b981) 0%, #059669 100%)',
          color: '#ffffff',
          borderColor: 'rgba(255, 255, 255, 0.15)',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.28)'
        };
      case 'danger':
        return {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: '#ffffff',
          borderColor: 'rgba(239, 68, 68, 0.4)',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.28)'
        };
      case 'warning':
        return {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: '#ffffff',
          borderColor: 'rgba(245, 158, 11, 0.4)',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.28)'
        };
      case 'secondary':
        return {
          background: 'var(--bg-card, rgba(18, 24, 38, 0.85))',
          color: 'var(--text-main, #f1f5f9)',
          borderColor: 'var(--border-color, rgba(255, 255, 255, 0.12))',
          boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.2))'
        };
      case 'outline':
        return {
          background: 'transparent',
          color: 'var(--text-main, #f1f5f9)',
          borderColor: 'var(--border-color, rgba(255, 255, 255, 0.2))'
        };
      case 'ghost':
        return {
          background: 'transparent',
          color: 'var(--text-muted, #94a3b8)',
          borderColor: 'transparent'
        };
      default:
        return {};
    }
  };

  const finalStyles = { ...baseStyles, ...getVariantStyles(), ...style };

  return (
    <button
      type={type}
      style={finalStyles}
      className={`app-button btn-${variant} ${className}`}
      onClick={handleClick}
      disabled={disabled || loading}
      title={title}
      {...props}
    >
      {loading ? (
        <span
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderTopColor: '#ffffff',
            borderRadius: '50%',
            animation: 'spin 0.75s linear infinite'
          }}
        />
      ) : Icon && iconPosition === 'left' ? (
        <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
      ) : null}

      <span>{children}</span>

      {!loading && Icon && iconPosition === 'right' ? (
        <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
      ) : null}
    </button>
  );
};
