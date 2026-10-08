import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  CheckCircle,
  Clock,
  Phone,
  MapPin,
  Package,
  Calendar,
  AlertCircle,
  Banknote,
  Smartphone,
  ChevronRight,
  Filter,
  Search,
  Sparkles,
  User,
  Store,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { hapticFeedback } from '../../services/nativeAppService';
import { playButtonClick, playSuccessChime } from '../../services/soundFeedback';

export const SRDeliveryHub = ({ onSwitchToSalesman = null }) => {
  const { lang, showToast, products, setProducts, salesHistory = [], setSalesHistory } = useApp();
  const { user } = useAuth();

  const [orders, setOrders] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('hk360_sales_orders') || '[]');
    } catch {
      return [];
    }
  });

  const [activeFilter, setActiveFilter] = useState('pending'); // 'pending' | 'delivered' | 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'bkash' | 'due'
  const [receivedAmount, setReceivedAmount] = useState('');

  const reloadOrders = () => {
    try {
      const data = JSON.parse(localStorage.getItem('hk360_sales_orders') || '[]');
      setOrders(data);
    } catch {}
  };

  useEffect(() => {
    reloadOrders();
  }, []);

  const saveOrders = (updatedList) => {
    setOrders(updatedList);
    try {
      localStorage.setItem('hk360_sales_orders', JSON.stringify(updatedList));
    } catch {}
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchFilter =
        activeFilter === 'all'
          ? true
          : activeFilter === 'pending'
          ? o.status === 'pending_delivery'
          : o.status === 'delivered';

      const text = `${o.id} ${o.customer?.name || ''} ${o.customer?.phone || ''} ${o.salesman?.name || ''}`.toLowerCase();
      const matchSearch = !searchTerm ? true : text.includes(searchTerm.toLowerCase());

      return matchFilter && matchSearch;
    });
  }, [orders, activeFilter, searchTerm]);

  // Open delivery confirmation modal
  const handleOpenDelivery = (order) => {
    hapticFeedback.light();
    setSelectedOrderForDelivery(order);
    setReceivedAmount(String(order.totalAmount || 0));
  };

  // Complete delivery: deduct inventory, record sale, update order
  const handleConfirmDelivery = () => {
    if (!selectedOrderForDelivery) return;

    const order = selectedOrderForDelivery;
    const paid = Number(receivedAmount) || 0;

    // 1. Deduct stock from products
    if (setProducts && products && products.length > 0) {
      setProducts((prev) =>
        prev.map((p) => {
          const item = order.items.find((i) => i.id === p.id);
          if (item) {
            const currentStock = Number(p.stock || p.stockQuantity || 0);
            return {
              ...p,
              stock: Math.max(0, currentStock - item.qty),
              stockQuantity: Math.max(0, currentStock - item.qty)
            };
          }
          return p;
        })
      );
    }

    // 2. Record in sales history
    const completedSale = {
      id: order.id,
      date: new Date().toISOString(),
      grandTotal: order.totalAmount,
      paidAmount: paid,
      paymentMethod,
      customerName: order.customer?.name || 'Walk-in',
      customerPhone: order.customer?.phone || '',
      items: order.items,
      deliveredBy: user?.name || user?.email || (lang === 'bn' ? 'এসআর ডেলিভারিম্যান' : 'Delivery SR'),
      salesman: order.salesman?.name || '',
      status: 'completed'
    };

    if (setSalesHistory) {
      setSalesHistory((prev) => [completedSale, ...(prev || [])]);
    }

    // 3. Update order in sales_orders storage
    const updated = orders.map((o) =>
      o.id === order.id
        ? {
            ...o,
            status: 'delivered',
            deliveredAt: new Date().toISOString(),
            deliveredBy: user?.name || 'SR',
            paidAmount: paid,
            paymentMethod
          }
        : o
    );
    saveOrders(updated);

    confetti({ particleCount: 40, spread: 60 });
    playSuccessChime();
    hapticFeedback.success();
    setSelectedOrderForDelivery(null);
    showToast(
      lang === 'bn'
        ? `✓ অর্ডার #${order.id} মাল ডেলিভারি ও টাকা সংগ্রহ সম্পন্ন হয়েছে!`
        : `✓ Order #${order.id} delivered and payment collected!`,
      'success'
    );
  };

  const pendingCount = orders.filter((o) => o.status === 'pending_delivery').length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;

  return (
    <div
      className="sr-delivery-hub animate-fade-in"
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
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.08))',
          borderLeft: '4px solid #10b981',
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
              background: '#10b981',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
            }}
          >
            <Truck size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'এসআর (SR) ডেলিভারি ও কালেকশন হাব' : 'SR Delivery & Collection Hub'}
              </h2>
              <span style={{ fontSize: '0.68rem', fontWeight: '800', padding: '2px 8px', borderRadius: '10px', background: '#10b98122', color: '#10b981', border: '1px solid #10b981' }}>
                DISPATCH HUB
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {lang === 'bn'
                ? 'সেলসম্যানদের কাটা অর্ডার অনুযায়ী দোকানে মাল পৌঁছে দিন ও টাকা বুঝে নিন'
                : 'Deliver booked orders to retailers and collect cash/payments'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={reloadOrders}
            className="btn-icon"
            title="রিফ্রেশ করুন"
            style={{ width: '34px', height: '34px', borderRadius: '8px' }}
          >
            <RefreshCw size={14} />
          </button>

          {onSwitchToSalesman && (
            <button
              type="button"
              onClick={onSwitchToSalesman}
              style={{
                padding: '7px 12px',
                borderRadius: '10px',
                border: '1.5px solid #6366f1',
                background: 'rgba(99, 102, 241, 0.12)',
                color: '#6366f1',
                fontSize: '0.76rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>📝 নতুন অর্ডার কাটুন (Salesman)</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setActiveFilter('pending')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: activeFilter === 'pending' ? '2px solid #f59e0b' : '1px solid var(--border-color)',
              background: activeFilter === 'pending' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: activeFilter === 'pending' ? '#f59e0b' : 'var(--text-muted)',
              fontSize: '0.78rem',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            ⏳ ডেলিভারি বাকি ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('delivered')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: activeFilter === 'delivered' ? '2px solid #10b981' : '1px solid var(--border-color)',
              background: activeFilter === 'delivered' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              color: activeFilter === 'delivered' ? '#10b981' : 'var(--text-muted)',
              fontSize: '0.78rem',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            ✓ সম্পন্ন ({deliveredCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: activeFilter === 'all' ? '2px solid #6366f1' : '1px solid var(--border-color)',
              background: activeFilter === 'all' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeFilter === 'all' ? '#6366f1' : 'var(--text-muted)',
              fontSize: '0.78rem',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            সকল অর্ডার ({orders.length})
          </button>
        </div>

        <div style={{ position: 'relative', minWidth: '220px' }}>
          <input
            type="text"
            placeholder={lang === 'bn' ? 'অর্ডার বা দোকানদার খুঁজুন...' : 'Search order/retailer...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px 6px 30px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-main)',
              fontSize: '0.8rem'
            }}
          />
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
      </div>

      {/* Orders List Cards */}
      {filteredOrders.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', borderRadius: '16px' }}>
          <Truck size={38} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
          <h4 style={{ margin: '0 0 4px', color: 'var(--text-main)', fontSize: '1rem', fontWeight: '800' }}>
            {lang === 'bn' ? 'কোনো অর্ডার পাওয়া যায়নি' : 'No Orders Found'}
          </h4>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {lang === 'bn' ? 'সেলসম্যান নতুন অর্ডার কাটলে এখানে স্বয়ংক্রিয়ভাবে জমা হবে।' : 'New orders booked by salesmen will appear here.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '10px' }}>
          {filteredOrders.map((order) => {
            const isDelivered = order.status === 'delivered';
            return (
              <div
                key={order.id}
                className="glass-card press-scale"
                style={{
                  padding: '1rem',
                  borderRadius: '14px',
                  borderLeft: `4px solid ${isDelivered ? '#10b981' : '#f59e0b'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}
              >
                {/* Order Top Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.86rem', fontWeight: '900', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                      #{order.id}
                    </span>
                    <span
                      style={{
                        fontSize: '0.66rem',
                        fontWeight: '800',
                        padding: '1px 6px',
                        borderRadius: '6px',
                        background: isDelivered ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: isDelivered ? '#10b981' : '#f59e0b'
                      }}
                    >
                      {isDelivered ? '✓ ডেলিভার্ড' : '⏳ ডেলিভারি বাকি'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    📅 {order.expectedDeliveryDate || order.dateStr}
                  </div>
                </div>

                {/* Customer Details */}
                <div style={{ background: 'var(--bg-primary)', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Store size={14} color="#6366f1" />
                    <span>{order.customer?.name || 'Walk-in Retailer'}</span>
                  </div>
                  {order.customer?.phone && (
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                      <Phone size={12} color="#10b981" />
                      <a href={`tel:${order.customer.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {order.customer.phone}
                      </a>
                    </div>
                  )}
                  {order.customer?.address && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      📍 {order.customer.address}
                    </div>
                  )}
                </div>

                {/* Items Summary Pill */}
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  <strong>পণ্যসমূহ:</strong>{' '}
                  {order.items?.map((it) => `${it.name} (${it.qty})`).join(', ')}
                </div>

                {/* Salesman info */}
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  সেলসম্যান: <strong style={{ color: 'var(--text-main)' }}>{order.salesman?.name || 'Field Salesman'}</strong>
                  {order.notes && <span> • নোট: {order.notes}</span>}
                </div>

                {/* Bottom Total & Deliver Action */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '2px' }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>মোট বিল:</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                      ৳{Number(order.totalAmount || 0).toLocaleString()}
                    </div>
                  </div>

                  {!isDelivered ? (
                    <button
                      type="button"
                      onClick={() => handleOpenDelivery(order)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff',
                        fontWeight: '800',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
                      }}
                    >
                      <Truck size={14} />
                      <span>ডেলিভারি সম্পন্ন করুন</span>
                    </button>
                  ) : (
                    <div style={{ fontSize: '0.74rem', fontWeight: '700', color: '#10b981' }}>
                      ✓ {order.deliveredBy || 'SR'} ডেলিভারি করেছে
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Delivery & Cash Collection */}
      {selectedOrderForDelivery && (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 10000 }}>
          <div className="modal-content" style={{ maxWidth: '420px', width: '92%', borderRadius: '18px', padding: '1.25rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={20} color="#10b981" />
              <span>ডেলিভারি ও টাকা সংগ্রহ নিশ্চিতকরণ</span>
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              অর্ডার #{selectedOrderForDelivery.id} মাল দোকানদারকে বুঝিয়ে দেওয়া হয়েছে?
            </p>

            {/* Total and Payment selection */}
            <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.84rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>বিলের পরিমাণ:</span>
                <span style={{ fontWeight: '900', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                  ৳{Number(selectedOrderForDelivery.totalAmount || 0).toLocaleString()}
                </span>
              </div>

              <label style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                টাকা আদায়ের মাধ্যম:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '8px' }}>
                {[
                  { id: 'cash', label: 'নগদ (Cash)' },
                  { id: 'bkash', label: 'বিকাশ/অনলাইন' },
                  { id: 'due', label: 'বাকি (Due)' }
                ].map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id)}
                    style={{
                      padding: '6px 4px',
                      borderRadius: '8px',
                      border: paymentMethod === pm.id ? '2px solid #10b981' : '1px solid var(--border-color)',
                      background: paymentMethod === pm.id ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                      color: paymentMethod === pm.id ? '#10b981' : 'var(--text-main)',
                      fontSize: '0.74rem',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>

              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                প্রাপ্ত টাকার পরিমাণ (৳):
              </label>
              <input
                type="number"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-main)',
                  fontWeight: '800',
                  fontSize: '0.94rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleConfirmDelivery}
                className="btn btn-primary"
                style={{ flex: 1, padding: '10px', borderRadius: '10px', fontWeight: '800', fontSize: '0.88rem' }}
              >
                ✓ ডেলিভারি ও রিসিভ সম্পন্ন
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrderForDelivery(null)}
                className="btn btn-secondary"
                style={{ padding: '10px 16px', borderRadius: '10px', fontWeight: '700', fontSize: '0.84rem' }}
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
