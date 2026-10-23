import React from 'react';

/**
 * Premium Modern Somiti 360 Vector Emblem
 * Razor-sharp SVG emblem with high-end glassmorphism, transparent background,
 * and metallic emerald & gold gradients.
 */
export const SomitiBrandEmblem = ({ size = 40, className = '', glow = true }) => {
  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 relative ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        filter: glow ? 'drop-shadow(0 4px 12px rgba(20, 184, 166, 0.35))' : 'none'
      }}
    >
      <img
        src="/somiti-emblem.svg"
        alt="Somiti 360 Emblem"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
        onError={(e) => {
          // Fallback to inline SVG if image fails to load
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
};

export default SomitiBrandEmblem;
