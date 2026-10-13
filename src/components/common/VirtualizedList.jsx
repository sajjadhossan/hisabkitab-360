import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * HisabKitab 360 - High-Performance Virtualized List
 * ---------------------------------------------------
 * Renders only visible items within viewport + buffer.
 * Eliminates DOM lag even with 50,000+ products or invoice rows.
 *
 * @param {Array} items - Array of data items to render
 * @param {number} itemHeight - Approximate height per row in pixels (default: 48)
 * @param {number} containerHeight - Height of viewport container in pixels (default: 360)
 * @param {function} renderItem - Render callback: (item, index) => ReactNode
 * @param {number} overscan - Extra items to render above/below viewport (default: 5)
 */
export const VirtualizedList = ({
  items = [],
  itemHeight = 52,
  containerHeight = 380,
  renderItem,
  overscan = 5,
  emptyMessage = 'কোনো তথ্য নেই',
  className = '',
  style = {}
}) => {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);

  const totalItems = items.length;
  const totalHeight = totalItems * itemHeight;

  const handleScroll = useCallback((e) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    totalItems,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  if (totalItems === 0) {
    return (
      <div
        style={{
          height: containerHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted, #94a3b8)',
          fontSize: '0.85rem',
          background: 'var(--bg-primary, rgba(0,0,0,0.02))',
          borderRadius: '10px',
          ...style
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={className}
      style={{
        height: containerHeight,
        overflowY: 'auto',
        position: 'relative',
        boxSizing: 'border-box',
        borderRadius: '10px',
        border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
        background: 'var(--card-bg, #ffffff)',
        ...style
      }}
    >
      <div
        style={{
          height: totalHeight,
          width: '100%',
          position: 'relative'
        }}
      >
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, idx) => {
            const actualIndex = startIndex + idx;
            return (
              <div
                key={item?.id || actualIndex}
                style={{
                  height: itemHeight,
                  boxSizing: 'border-box'
                }}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
