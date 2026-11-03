import React from 'react';
import { 
  Sparkles, 
  Plus, 
  Coffee, 
  ShoppingBag, 
  Zap, 
  Flame, 
  Star 
} from 'lucide-react';
import { playButtonClick } from '../../services/soundFeedback';

export const FastFavoriteProductGrid = ({
  products = [],
  onAddToCart,
  lang = 'bn',
  maxItems = 12
}) => {
  // Select fast-selling products or top products
  const fastItems = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    // Prioritize products marked as favorite, or top items
    const favs = products.filter(p => p.isFavorite || p.isFastSelling);
    if (favs.length >= 4) return favs.slice(0, maxItems);
    return products.slice(0, maxItems);
  }, [products, maxItems]);

  if (fastItems.length === 0) return null;

  return (
    <div 
      className="fast-favorite-product-grid"
      style={{
        marginBottom: '10px',
        padding: '8px 10px',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(234, 88, 12, 0.04))',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        borderRadius: '12px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Flame size={14} color="#f59e0b" />
          <span style={{ fontSize: '0.74rem', fontWeight: '800', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            {lang === 'bn' ? '⚡ দ্রুততম ফেভারিট আইটেম গ্রিড (১-ক্লিক কার্ট):' : '⚡ Fast Favorites Quick Grid:'}
          </span>
        </div>
        <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
          {lang === 'bn' ? 'বারকোড ছাড়া সরাসরি বিক্রি' : 'Direct 1-tap addition'}
        </span>
      </div>

      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
          gap: '6px',
          maxHeight: '130px',
          overflowY: 'auto',
          scrollbarWidth: 'thin'
        }}
      >
        {fastItems.map((prod) => {
          const price = Number(prod.sellPrice || prod.price || 0);
          const stock = Number(prod.stock || 0);
          return (
            <button
              key={prod.id}
              type="button"
              onClick={() => {
                playButtonClick();
                if (onAddToCart) onAddToCart(prod);
              }}
              className="press-scale"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                padding: '6px 8px',
                borderRadius: '8px',
                background: 'var(--bg-primary)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: '44px',
                transition: 'all 0.15s ease'
              }}
              title={`${prod.name} - ৳${price} (${stock > 0 ? stock + ' ' + (prod.unit || 'পিস') : 'স্টক শেষ'})`}
            >
              <div 
                style={{ 
                  fontSize: '0.72rem', 
                  fontWeight: '700', 
                  color: 'var(--text-main)', 
                  lineHeight: '1.2',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  width: '100%'
                }}
              >
                {prod.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: '3px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '900', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                  ৳{price}
                </span>
                <span style={{ fontSize: '0.62rem', color: stock <= 5 ? '#f87171' : 'var(--text-muted)' }}>
                  {stock} {prod.unit || 'পিস'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FastFavoriteProductGrid;
