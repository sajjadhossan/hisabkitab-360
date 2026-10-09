import React, { memo } from 'react';
import { Package } from 'lucide-react';

/**
 * High-Performance Memoized Mobile POS Product Card
 * Isolated component preventing full-screen re-renders on mobile.
 */
export const MobilePOSProductCard = memo(({
  product,
  inCartQty = 0,
  onSelect
}) => {
  const p = product;
  const inCart = inCartQty > 0;
  const stock = Number(p.stock) || 0;

  return (
    <div
      className="glass-card press-scale"
      onClick={() => onSelect(p)}
      style={{
        padding: '0.65rem',
        borderRadius: '14px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: inCart ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-secondary)',
        border: inCart ? '1.5px solid var(--business-primary)' : '1px solid var(--border-color)',
        position: 'relative',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation'
      }}
    >
      {/* Cart count badge */}
      {inCart && (
        <span
          style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            background: 'var(--business-primary)',
            color: '#fff',
            borderRadius: '8px',
            padding: '1px 6px',
            fontSize: '0.65rem',
            fontWeight: '800',
            zIndex: 2
          }}
        >
          ✓ {inCartQty}
        </span>
      )}

      {/* Image / Icon container */}
      <div
        style={{
          width: '100%',
          height: '75px',
          borderRadius: '10px',
          background: 'rgba(255, 255, 255, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          marginBottom: '6px'
        }}
      >
        {p.image ? (
          <img
            src={p.image}
            alt={p.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        ) : (
          <div style={{ color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Package size={28} />
          </div>
        )}
      </div>

      <div>
        <div
          style={{
            fontSize: '0.82rem',
            fontWeight: '700',
            color: 'var(--text-main)',
            lineHeight: 1.25,
            marginBottom: '4px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {p.name}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
          <span style={{ fontSize: '0.92rem', fontWeight: '800', color: 'var(--business-primary)', fontFamily: 'var(--font-mono)' }}>
            ৳{Number(p.sellPrice || 0).toLocaleString()}
          </span>
          <span style={{ fontSize: '0.65rem', color: stock <= 5 ? '#ef4444' : 'var(--text-dim)', fontWeight: '600' }}>
            {stock} {p.unit || 'টি'}
          </span>
        </div>
      </div>
    </div>
  );
}, (prev, next) => {
  return (
    prev.product.id === next.product.id &&
    prev.product.stock === next.product.stock &&
    prev.product.sellPrice === next.product.sellPrice &&
    prev.inCartQty === next.inCartQty
  );
});
