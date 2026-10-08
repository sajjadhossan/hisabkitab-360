import React, { useState, useEffect, useRef, useTransition, useCallback } from 'react';
import { Search, X } from 'lucide-react';

/**
 * Isolated Fast Search Input Component
 * --------------------------------------
 * Decouples immediate keystroke feedback from parent state re-renders.
 * Eliminates input stutter, virtual keyboard lagging, and frame drops.
 */
export function FastSearchInput({
  value = '',
  onChange,
  placeholder = 'সার্চ করুন...',
  debounceMs = 150,
  autoFocus = false,
  className = '',
  style = {},
  inputRef: externalRef
}) {
  const [localVal, setLocalVal] = useState(value);
  const [isPending, startTransition] = useTransition();
  const internalRef = useRef(null);
  const debounceTimer = useRef(null);

  // Keep localVal in sync if value changed externally (e.g. cleared)
  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  const handleChange = useCallback((e) => {
    const nextVal = e.target.value;
    setLocalVal(nextVal);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      startTransition(() => {
        if (typeof onChange === 'function') {
          onChange(nextVal);
        }
      });
    }, debounceMs);
  }, [onChange, debounceMs]);

  const handleClear = useCallback(() => {
    setLocalVal('');
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (typeof onChange === 'function') {
      onChange('');
    }
    const inputEl = externalRef?.current || internalRef.current;
    if (inputEl) inputEl.focus();
  }, [onChange, externalRef]);

  return (
    <div
      className={`fast-search-wrapper ${className}`}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        ...style
      }}
    >
      <Search
        size={18}
        style={{
          position: 'absolute',
          left: '12px',
          color: isPending ? 'var(--personal-primary, #10b981)' : 'var(--text-muted, #94a3b8)',
          pointerEvents: 'none',
          transition: 'color 0.2s ease'
        }}
      />
      <input
        ref={externalRef || internalRef}
        type="text"
        value={localVal}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          width: '100%',
          padding: '10px 36px 10px 38px',
          borderRadius: '12px',
          border: '1.5px solid var(--border-color)',
          background: 'var(--bg-card)',
          color: 'var(--text-main)',
          fontSize: '0.92rem',
          outline: 'none',
          touchAction: 'manipulation'
        }}
      />
      {localVal && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          style={{
            position: 'absolute',
            right: '10px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'manipulation'
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
