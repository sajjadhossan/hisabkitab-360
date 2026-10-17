import React from 'react';
import { ShoppingCart, Plus, X, Pause } from 'lucide-react';
import { soundService } from '../../services/soundService';

export const MultiCartHoldTabs = ({
  carts = [{ id: 1, name: 'কার্ট ১', items: [], customerName: '' }],
  activeCartId = 1,
  onSelectCart,
  onAddCart,
  onRemoveCart,
  lang = 'bn'
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        background: 'rgba(0, 0, 0, 0.25)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        overflowX: 'auto',
        whiteSpace: 'nowrap'
      }}
      className="multi-cart-tabs-bar"
    >
      {carts.map((cart) => {
        const isActive = cart.id === activeCartId;
        const itemCount = (cart.items || []).reduce((sum, it) => sum + (Number(it.qty || it.quantity) || 1), 0);
        const cartTotal = (cart.items || []).reduce((sum, it) => sum + ((Number(it.price || it.sellingPrice) || 0) * (Number(it.qty || it.quantity) || 1)), 0);

        return (
          <div
            key={cart.id}
            onClick={() => {
              soundService.playBeep();
              onSelectCart(cart.id);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '10px',
              background: isActive
                ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(99, 102, 241, 0.2))'
                : 'rgba(255, 255, 255, 0.04)',
              border: isActive ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
              color: isActive ? '#f8fafc' : '#94a3b8',
              cursor: 'pointer',
              fontWeight: isActive ? '700' : '500',
              fontSize: '0.84rem',
              transition: 'all 0.12s ease'
            }}
          >
            <ShoppingCart size={14} style={{ color: isActive ? '#38bdf8' : '#94a3b8' }} />
            <span>{cart.name || `কার্ট ${cart.id}`}</span>

            {itemCount > 0 && (
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '1px 6px',
                  borderRadius: '12px',
                  background: isActive ? '#0284c7' : 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontWeight: '700'
                }}
              >
                {itemCount} | ৳{cartTotal}
              </span>
            )}

            {carts.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundService.playDeleteTone();
                  onRemoveCart(cart.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={lang === 'bn' ? 'কার্ট বন্ধ করুন' : 'Close cart'}
              >
                <X size={12} />
              </button>
            )}
          </div>
        );
      })}

      {carts.length < 5 && (
        <button
          type="button"
          onClick={() => {
            soundService.playSuccessChime();
            onAddCart();
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px dashed rgba(16, 185, 129, 0.4)',
            color: '#10b981',
            fontSize: '0.82rem',
            fontWeight: '700',
            cursor: 'pointer'
          }}
          title={lang === 'bn' ? 'নতুন কার্ট যোগ করুন' : 'Add new cart'}
        >
          <Plus size={14} />
          <span>{lang === 'bn' ? 'নতুন কার্ট' : 'New Cart'}</span>
        </button>
      )}
    </div>
  );
};
