import React from 'react';

/**
 * Modern Ultra-Smooth Shimmer Skeleton Component
 * -----------------------------------------------
 * Replaces jarring circular spinners with an elegant content-shaped skeleton screen.
 * Gives the perceptual impression that the app is already loaded and ready.
 */
export function ShimmerSkeleton({
  width = '100%',
  height = '20px',
  borderRadius = '8px',
  className = '',
  style = {}
}) {
  return (
    <div
      className={`shimmer-skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style
      }}
    />
  );
}

export function SkeletonMetricCard() {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <ShimmerSkeleton width="110px" height="16px" borderRadius="6px" />
        <ShimmerSkeleton width="36px" height="36px" borderRadius="10px" />
      </div>
      <ShimmerSkeleton width="160px" height="28px" borderRadius="8px" />
      <ShimmerSkeleton width="80px" height="14px" borderRadius="4px" />
    </div>
  );
}

export function SkeletonTableRow({ columns = 5 }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '14px 16px',
        borderBottom: '1px solid var(--border-color)'
      }}
    >
      {Array.from({ length: columns }).map((_, i) => (
        <ShimmerSkeleton
          key={i}
          width={i === 0 ? '40%' : `${60 / (columns - 1)}%`}
          height="18px"
          borderRadius="6px"
        />
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 4 }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px'
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonMetricCard key={i} />
      ))}
    </div>
  );
}
