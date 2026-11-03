import React from 'react';
import { X } from 'lucide-react';

/**
 * Universal Commercial Form Field & Input
 * Features High-Contrast Borders, Touch-Friendly 44px Height & Tabular Numeric Support
 */
export const FormField = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  icon: Icon,
  clearable = false,
  error,
  helperText,
  disabled = false,
  required = false,
  autoFocus = false,
  className = '',
  inputStyle = {},
  containerStyle = {},
  onClear,
  id,
  ...props
}) => {
  const inputId = id || `field-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        width: '100%',
        boxSizing: 'border-box',
        ...containerStyle
      }}
      className={`app-form-field ${className}`}
    >
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: '12.5px',
            fontWeight: 600,
            color: 'var(--text-main, #f1f5f9)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {label}
          {required && <span style={{ color: 'var(--color-danger, #ef4444)' }}>*</span>}
        </label>
      )}

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%'
        }}
      >
        {Icon && (
          <div
            style={{
              position: 'absolute',
              left: '12px',
              color: 'var(--text-muted, #94a3b8)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Icon size={16} />
          </div>
        )}

        <input
          id={inputId}
          type={type}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          style={{
            width: '100%',
            height: '44px',
            backgroundColor: 'var(--bg-card, rgba(18, 24, 38, 0.85))',
            color: 'var(--text-main, #f1f5f9)',
            border: error
              ? '1px solid var(--color-danger, #ef4444)'
              : '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
            borderRadius: '10px',
            paddingLeft: Icon ? '38px' : '14px',
            paddingRight: clearable && value ? '38px' : '14px',
            fontSize: '13.5px',
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
            fontVariantNumeric: type === 'number' ? 'tabular-nums' : 'normal',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            ...inputStyle
          }}
          {...props}
        />

        {clearable && value && !disabled && (
          <button
            type="button"
            onClick={onClear}
            style={{
              position: 'absolute',
              right: '10px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #94a3b8)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '50%'
            }}
            title="Clear"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {error ? (
        <span style={{ fontSize: '11px', color: 'var(--color-danger, #ef4444)', marginTop: '2px' }}>
          {error}
        </span>
      ) : helperText ? (
        <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
          {helperText}
        </span>
      ) : null}
    </div>
  );
};
