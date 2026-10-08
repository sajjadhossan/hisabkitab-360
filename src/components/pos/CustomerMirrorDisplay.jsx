import React, { useState, useEffect } from 'react';
import { ShoppingCart, CheckCircle2, Sparkles, Store, ArrowLeft } from 'lucide-react';
import { subscribeToCustomerDisplay } from '../../services/customerMirrorService';

export const CustomerMirrorDisplay = ({ onExit }) => {
  const [displayData, setDisplayData] = useState({
    cart: [],
    subtotal: 0,
    discount: 0,
    grandTotal: 0,
    storeName: 'হিসাবকিতাব ৩৬০',
    customerName: ''
  });

  useEffect(() => {
    const unsub = subscribeToCustomerDisplay((data) => {
      setDisplayData(data);
    });
    return unsub;
  }, []);

  const { cart, subtotal, discount, grandTotal, storeName, customerName } = displayData;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        color: '#f8fafc',
        fontFamily: "'Plus Jakarta Sans', 'Hind Siliguri', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        padding: '1.25rem'
      }}
    >
      {/* Top Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1, #10b981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)'
            }}
          >
            <Store size={24} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900', color: '#ffffff' }}>
              {storeName}
            </h1>
            <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              <span>লাইভ কাস্টমার কাউন্টার স্ক্রিন</span>
            </div>
          </div>
        </div>

        {onExit && (
          <button
            type="button"
            onClick={onExit}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#94a3b8',
              padding: '6px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: '700'
            }}
          >
            <ArrowLeft size={16} />
            <span>অ্যাপে ফিরুন</span>
          </button>
        )}
      </header>

      {/* Main Split Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: cart.length > 0 ? '1.4fr 1fr' : '1fr',
          gap: '1.25rem',
          flex: 1
        }}
      >
        {/* Left Column: Cart Items List */}
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.7)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(16px)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart size={18} color="#818cf8" />
              <span>নির্বাচিত পণ্যসামগ্রী ({cart.reduce((a, i) => a + (Number(i.qty) || 0), 0)} টি)</span>
            </span>
            {customerName && (
              <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '700' }}>
                👤 {customerName}
              </span>
            )}
          </div>

          {cart.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                padding: '3rem 1rem',
                textAlign: 'center'
              }}
            >
              <Sparkles size={48} style={{ opacity: 0.3, marginBottom: '12px', color: '#818cf8' }} />
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#cbd5e1' }}>
                স্বাগতম! পণ্য স্ক্যান করা হচ্ছে...
              </div>
              <p style={{ fontSize: '0.85rem', margin: '6px 0 0' }}>
                ক্যাশিয়ার পণ্য স্ক্যান বা যুক্ত করামাত্র এখানে রিয়েলটাইমে প্রদর্শিত হবে
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, maxHeight: '60vh' }}>
              {cart.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '1rem', fontWeight: '800', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      ৳{item.sellPrice} × {item.qty} {item.unit || 'পিস'}
                    </div>
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#10b981', fontFamily: 'monospace' }}>
                    ৳{(item.sellPrice * item.qty).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Grand Total & Live Pay Summary */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(16, 185, 129, 0.15))',
            borderRadius: '20px',
            border: '1.5px solid rgba(99, 102, 241, 0.3)',
            backdropFilter: 'blur(16px)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#cbd5e1', marginBottom: '1.25rem', letterSpacing: '0.5px' }}>
              বিল ও পরিশোধের সারাংশ
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#94a3b8' }}>
                <span>সাবটোটাল:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>৳{subtotal.toLocaleString()}</span>
              </div>

              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#ef4444' }}>
                  <span>ডিসকাউন্ট:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>-৳{discount.toLocaleString()}</span>
                </div>
              )}

              <div
                style={{
                  borderTop: '2px dashed rgba(255, 255, 255, 0.15)',
                  paddingTop: '1rem',
                  marginTop: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline'
                }}
              >
                <span style={{ fontSize: '1.25rem', fontWeight: '900', color: '#ffffff' }}>সর্বমোট প্রদেয়:</span>
                <span style={{ fontSize: '2.4rem', fontWeight: '900', color: '#10b981', fontFamily: 'monospace' }}>
                  ৳{grandTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '1rem',
              borderRadius: '14px',
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginTop: '1.5rem',
              textAlign: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#10b981', fontSize: '0.88rem', fontWeight: '800', marginBottom: '4px' }}>
              <CheckCircle2 size={16} />
              <span>ধন্যবাদ! আবার আসবেন</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              ক্যাশ, বিকাশ, নগদ বা কার্ডের মাধ্যমে বিল পরিশোধ করুন
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
