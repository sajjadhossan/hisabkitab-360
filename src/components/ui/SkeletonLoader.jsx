import React from 'react';

/**
 * Universal Shimmer Skeleton Loader
 * Eliminates blank screens and improves perceived performance
 */
export const SkeletonLoader = ({
  type = 'line', // 'line' | 'card' | 'table-row' | 'avatar'
  count = 1,
  height,
  width,
  style = {},
  className = ''
}) => {
  const items = Array.from({ length: count }, (_, i) => i);

  const baseStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: '8px',
    animation: 'shimmerPulse 1.5s ease-in-out infinite',
    ...style
  };

  if (type === 'table-row') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
        {items.map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: 'var(--bg-card, rgba(18, 24, 38, 0.5))',
              borderRadius: '10px'
            }}
          >
            <div style={{ ...baseStyle, width: '40px', height: '40px', borderRadius: '8px' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ ...baseStyle, width: '40%', height: '14px' }} />
              <div style={{ ...baseStyle, width: '25%', height: '11px' }} />
            </div>
            <div style={{ ...baseStyle, width: '80px', height: '16px' }} />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', width: '100%' }}>
        {items.map((i) => (
          <div
            key={i}
            style={{
              padding: '16px',
              backgroundColor: 'var(--bg-card, rgba(18, 24, 38, 0.5))',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ ...baseStyle, width: '32px', height: '32px', borderRadius: '8px' }} />
            <div style={{ ...baseStyle, width: '70%', height: '14px' }} />
            <div style={{ ...baseStyle, width: '50%', height: '22px' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      {items.map((i) => (
        <div
          key={i}
          style={{
            ...baseStyle,
            width: width || '100%',
            height: height || '16px'
          }}
          className={className}
        />
      ))}
    </div>
  );
};
