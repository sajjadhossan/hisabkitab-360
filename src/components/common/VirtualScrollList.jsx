import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

/**
 * Lightweight Zero-Dependency Virtual Scroll List
 * -----------------------------------------------
 * Keeps DOM node count ultra-low (< 30 items) even if the dataset has 10,000+ items.
 * Ensures consistent 60 FPS / 120 FPS scrolling and instantaneous click handling.
 */
export function VirtualScrollList({
  items = [],
  itemHeight = 72,
  containerHeight = 480,
  renderItem,
  overscan = 5,
  className = '',
  style = {},
  emptyMessage = 'কোনো রেকর্ড পাওয়া যায়নি'
}) {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);

  const totalCount = items.length;
  const totalHeight = totalCount * itemHeight;

  const handleScroll = useCallback((e) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const { startIndex, endIndex } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2 * overscan;
    const end = Math.min(totalCount, start + visibleCount);
    return { startIndex: start, endIndex: end };
  }, [scrollTop, itemHeight, containerHeight, overscan, totalCount]);

  const visibleItems = useMemo(() => {
    const list = [];
    for (let i = startIndex; i < endIndex; i++) {
      list.push({
        item: items[i],
        index: i,
        top: i * itemHeight
      });
    }
    return list;
  }, [items, startIndex, endIndex, itemHeight]);

  if (!items || items.length === 0) {
    return (
      <div
        className={`virtual-list-empty ${className}`}
        style={{
          height: containerHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
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
      className={`virtual-scroll-container ${className}`}
      style={{
        position: 'relative',
        height: containerHeight,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        contain: 'strict',
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
        {visibleItems.map(({ item, index, top }) => (
          <div
            key={item?.id || index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: itemHeight,
              transform: `translate3d(0, ${top}px, 0)`,
              willChange: 'transform'
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}
