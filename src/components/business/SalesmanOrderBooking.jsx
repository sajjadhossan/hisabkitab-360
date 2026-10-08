import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  User,
  CheckCircle2,
  Package,
  Store,
  Clock,
  Sparkles,
  Phone,
  MapPin,
  Send,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { hapticFeedback } from '../../services/nativeAppService';
import { playCartPop, playSuccessChime, playButtonClick } from '../../services/soundFeedback';

export const SalesmanOrderBooking = ({ onSwitchToSR = null }) => {
  const { products, customers, lang, showToast, businessSettings = {} } = useApp();
  const { user } = useAuth();

  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', address: '' });
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [bookedSuccessOrder, setBookedSuccessOrder] = useState(null);

  // Cart operations
  const addToCart = (product) => {
    playCartPop();
    hapticFeedback.light();
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: Number(product.sellingPrice || product.price || 0),
          unit: product.unit || 'টি',
          qty: 1
        }
      ];
    });
  };

  const updateQty = (id, delta) => {
    playButtonClick();
    hapticFeedback.light();
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id === id) {
            const nextQty = i.qty + delta;
            return nextQty > 0 ? { ...i, qty: nextQty } : null;
          }
          return i;
        })
        .filter(Boolean)
    );
  };

  const removeItem = (id) => {
    hapticFeedback.medium();
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products || [];
    const term = searchTerm.toLowerCase();
    return (products || []).filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.barcode && p.barcode.toLowerCase().includes(term)) ||
        (p.category && p.category.toLowerCase().includes(term))
    );
  }, [products, searchTerm]);

  const selectedCustomer = useMemo(() => {
    return (customers || []).find((c) => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [cart]);

  const handleBookOrder = (e) => {
    e?.preventDefault();
    if (cart.length === 0) {
      showToast(lang === 'bn' ? 'অর্ডার কাটার জন্য পণ্য কার্টে নিন!' : 'Cart is empty!', 'warning');
      return;
    }

    const customerData = isNewCustomer
      ? {
          id: `lead-${Date.now()}`,
          name: newCustomerForm.name || 'নতুন রিটেইলার/দোকানদার',
          phone: newCustomerForm.phone,
          address: newCustomerForm.address
        }
      : selectedCustomer || {
          id: 'walk-in',
          name: 'সাধারণ দোকানদার (Walk-in)',
          phone: '',
          address: ''
        };

    const newOrder = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      orderToken: Math.floor(1000 + Math.random() * 9000),
      createdAt: new Date().toISOString(),
      dateStr: new Date().toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US'),
      expectedDeliveryDate: deliveryDate,
      salesman: {
        id: user?.id || 'salesman-1',
        name: user?.name || user?.email || (lang === 'bn' ? 'মাঠ সেলসম্যান' : 'Field Salesman')
      },
      customer: customerData,
      items: [...cart],
      totalQty: cart.reduce((sum, i) => sum + i.qty, 0),
      totalAmount: subtotal,
      notes: orderNotes,
      status: 'pending_delivery' // 'pending_delivery' | 'out_for_delivery' | 'delivered' | 'cancelled'
    };

    // Save to persistent storage
    try {
      const existing = JSON.parse(localStorage.getItem('hk360_sales_orders') || '[]');
      const updated = [newOrder, ...existing];
      localStorage.setItem('hk360_sales_orders', JSON.stringify(updated));
    } catch {}

    playSuccessChime();
    hapticFeedback.success();
    setBookedSuccessOrder(newOrder);
    clearCart();
    setOrderNotes('');
    showToast(
      lang === 'bn'
        ? `✓ অর্ডার #${newOrder.id} সফলভাবে কাটা হয়েছে! এটি এসআর (SR)-এর ডেলিভারি বোর্ডে গেছে।`
        : `✓ Order #${newOrder.id} booked! Sent to SR delivery hub.`,
      'success'
    );
  };

  return (
    <div
      className="salesman-order-booking animate-fade-in"
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0.85rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}
    >
      {/* Top Header */}
      <div
        className="glass-card"
        style={{
          padding: '0.85rem 1.25rem',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.12), rgba(16, 185, 129, 0.08))',
          borderLeft: '4px solid #6366f1',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: '#6366f1',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
            }}
          >
            <FileText size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'সেলসম্যান অর্ডার বুকিং মোড' : 'Salesman Order Booking Mode'}
              </h2>
              <span style={{ fontSize: '0.68rem', fontWeight: '800', padding: '2px 8px', borderRadius: '10px', background: '#6366f122', color: '#6366f1', border: '1px solid #6366f1' }}>
                FIELD SALES
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {lang === 'bn'
                ? 'দোকানে দোকানে ঘুরে পণ্যের অর্ডার কাটুন (ডেলিভারি এসআর করবে)'
                : 'Book retailer orders in the market (SR will deliver & collect cash)'}
            </p>
          </div>
        </div>

        {onSwitchToSR && (
          <button
            type="button"
            onClick={onSwitchToSR}
            style={{
              padding: '7px 12px',
              borderRadius: '10px',
              border: '1.5px solid #10b981',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              fontSize: '0.76rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🚚 এসআর ডেলিভারি হাব দেখুন</span>
          </button>
        )}
      </div>

      {/* Main Grid: Left Catalog, Right Order Memo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        {/* Left: Product Catalog */}
        <div className="glass-card" style={{ padding: '1rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder={lang === 'bn' ? 'পণ্য বা ব্র্যান্ড বা বারকোড খুঁজুন...' : 'Search products...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-main)',
                fontSize: '0.86rem',
                fontWeight: '700'
              }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', maxHeight: '480px', overflowY: 'auto', paddingRight: '4px' }}>
            {filteredProducts.map((p) => {
              const inCart = cart.find((i) => i.id === p.id);
              const price = Number(p.sellingPrice || p.price || 0);
              return (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="press-scale"
                  style={{
                    padding: '10px',
                    borderRadius: '12px',
                    border: inCart ? '2px solid #6366f1' : '1px solid var(--border-color)',
                    background: inCart ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '90px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-main)', lineHeight: 1.25 }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {p.category || 'পণ্য'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: '900', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                      ৳{price}
                    </span>
                    {inCart && (
                      <span style={{ fontSize: '0.7rem', fontWeight: '800', padding: '1px 6px', borderRadius: '10px', background: '#6366f1', color: '#fff' }}>
                        x{inCart.qty}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Booking Details & Cart Memo */}
        <div className="glass-card" style={{ padding: '1rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Customer Selection */}
          <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Store size={14} color="#6366f1" />
                <span>{lang === 'bn' ? 'দোকানদার / কাস্টমার নির্বাচন:' : 'Select Retailer / Customer:'}</span>
              </span>
              <button
                type="button"
                onClick={() => setIsNewCustomer(!isNewCustomer)}
                style={{ background: 'transparent', border: 'none', color: '#6366f1', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' }}
              >
                {isNewCustomer ? (lang === 'bn' ? 'লিস্ট থেকে বাছুন' : 'From List') : (lang === 'bn' ? '+ নতুন দোকানদার' : '+ New Customer')}
              </button>
            </div>

            {isNewCustomer ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'দোকানের নাম...' : 'Shop Name...'}
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.8rem' }}
                />
                <input
                  type="tel"
                  placeholder={lang === 'bn' ? 'মোবাইল নম্বর...' : 'Phone...'}
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.8rem' }}
                />
              </div>
            ) : (
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                style={{ width: '100%', padding: '7px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.82rem', fontWeight: '700' }}
              >
                <option value="">সাধারণ দোকানদার (Walk-in Customer)</option>
                {(customers || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Delivery Date & Notes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                {lang === 'bn' ? 'প্রত্যাশিত ডেলিভারি তারিখ:' : 'Delivery Date:'}
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                style={{ width: '100%', padding: '6px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-main)', fontSize: '0.78rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                {lang === 'bn' ? 'অর্ডার নোট (ঐচ্ছিক):' : 'Notes:'}
              </label>
              <input
                type="text"
                placeholder={lang === 'bn' ? 'যেমন: বাকিতে বা বিকেলে' : 'Notes...'}
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                style={{ width: '100%', padding: '6px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-main)', fontSize: '0.78rem' }}
              />
            </div>
          </div>

          {/* Selected Order Items List */}
          <div style={{ flex: 1, minHeight: '140px', maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '8px', background: 'var(--bg-primary)' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '20px 0' }}>
                🛒 বাম পাশ থেকে পণ্য নির্বাচন করে কার্টে যোগ করুন
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {cart.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-main)' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        ৳{item.price} x {item.qty} = ৳{item.price * item.qty}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button type="button" onClick={() => updateQty(item.id, -1)} style={{ padding: '3px 6px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer' }}>
                        <Minus size={11} />
                      </button>
                      <span style={{ fontSize: '0.82rem', fontWeight: '800', minWidth: '18px', textAlign: 'center' }}>
                        {item.qty}
                      </span>
                      <button type="button" onClick={() => updateQty(item.id, 1)} style={{ padding: '3px 6px', borderRadius: '6px', border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer' }}>
                        <Plus size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Summary & Book Button */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'অর্ডারের মোট মূল্য:' : 'Order Total:'}
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: '900', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                ৳{subtotal.toLocaleString()}
              </span>
            </div>

            <button
              type="button"
              onClick={handleBookOrder}
              disabled={cart.length === 0}
              className="btn btn-primary press-scale"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                fontWeight: '800',
                fontSize: '0.94rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
                opacity: cart.length > 0 ? 1 : 0.6,
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)'
              }}
            >
              <CheckCircle2 size={18} />
              <span>{lang === 'bn' ? '✓ অর্ডার নিশ্চিত করুন (Book Order)' : '✓ Confirm Order Booking'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
