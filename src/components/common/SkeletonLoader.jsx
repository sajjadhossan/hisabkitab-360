import React from 'react';

/**
 * Reusable Shimmer Skeleton Loaders
 */

export const SkeletonCard = ({ height = '120px', borderRadius = '16px', style = {} }) => (
  <div
    className="shimmer-skeleton"
    style={{
      height,
      borderRadius,
      width: '100%',
      ...style
    }}
  />
);

export const SkeletonText = ({ lines = 3, gap = '8px', style = {} }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap, width: '100%', ...style }}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className="shimmer-skeleton"
        style={{
          height: '14px',
          borderRadius: '6px',
          width: i === lines - 1 ? '60%' : '100%'
        }}
      />
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <div
    style={{
      width: '100%',
      background: 'var(--card-bg, rgba(30, 41, 59, 0.5))',
      borderRadius: '16px',
      padding: '16px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}
  >
    {/* Table Header Skeleton */}
    <div style={{ display: 'flex', gap: '12px', paddingBottom: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
      {Array.from({ length: cols }).map((_, c) => (
        <div
          key={`th-${c}`}
          className="shimmer-skeleton"
          style={{ height: '20px', flex: 1, borderRadius: '6px' }}
        />
      ))}
    </div>

    {/* Table Rows Skeleton */}
    {Array.from({ length: rows }).map((_, r) => (
      <div key={`tr-${r}`} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        {Array.from({ length: cols }).map((_, c) => (
          <div
            key={`td-${r}-${c}`}
            className="shimmer-skeleton"
            style={{
              height: '16px',
              flex: c === 0 ? 1.5 : 1,
              borderRadius: '6px',
              opacity: 0.85
            }}
          />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonStats = ({ count = 4 }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fit, minmax(220px, 1fr))`,
      gap: '14px',
      width: '100%',
      marginBottom: '16px'
    }}
  >
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="shimmer-skeleton"
        style={{
          height: '110px',
          borderRadius: '16px',
          padding: '16px'
        }}
      />
    ))}
  </div>
);
