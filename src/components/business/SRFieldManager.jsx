import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { geotagTransaction } from '../../services/fieldGpsTrackerService';
import {
  Users,
  MapPin,
  Phone,
  HandCoins,
  ShoppingCart,
  Plus,
  Search,
  CheckCircle2,
  Printer,
  Calendar,
  Clock,
  Sparkles,
  TrendingUp,
  FileText,
  Truck,
  Package,
  AlertTriangle
} from 'lucide-react';

export const SRFieldManager = () => {
  const {
    customers,
    products,
    collectDue,
    completeSale,
    salesHistory,
    activeBranch,
    lang,
    fieldOrders = [],
    createFieldOrder,
    updateFieldOrderDelivery,
    markOrderFullyDelivered,
    deleteFieldOrder
  } = useApp();

  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState('customers'); // 'customers' | 'order' | 'collection' | 'delivery_status'

  // Collection form state
  const [collectionAmount, setCollectionAmount] = useState('');
  const [collectionMethod, setCollectionMethod] = useState('cash'); // 'cash' | 'bkash'
  const [collectionNote, setCollectionNote] = useState('');
  const [lastReceipt, setLastReceipt] = useState(null);

  // Field order form state
  const [orderItems, setOrderItems] = useState([]); // [{ productId, name, price, qty, subtotal }]
  const [activeUpdatingOrder, setActiveUpdatingOrder] = useState(null);
  const [updatingItems, setUpdatingItems] = useState([]);
  const [updatingNote, setUpdatingNote] = useState('');
  const [orderProductSearch, setOrderProductSearch] = useState('');

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm)) ||
    (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const today = new Date().toISOString().split('T')[0];

  // Handle Due Collection with Real-Time GPS Geotagging
  const handleCollectDue = async (e) => {
    e.preventDefault();
    if (!selectedCustomer || !collectionAmount) return;

    const amount = Number(collectionAmount);
    if (amount <= 0) return;

    collectDue(selectedCustomer.id, amount);

    const baseReceipt = {
      id: `SR-REC-${Date.now()}`,
      srName: user?.name || 'এসআর (ফিল্ড অফিসার)',
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      branchName: activeBranch?.name || 'প্রধান শাখা',
      amount,
      method: collectionMethod,
      date: new Date().toLocaleString(),
      note: collectionNote,
      previousDue: selectedCustomer.outstandingDue,
      remainingDue: Math.max(0, selectedCustomer.outstandingDue - amount)
    };

    const receipt = await geotagTransaction(baseReceipt, selectedCustomer);

    setLastReceipt(receipt);
    setCollectionAmount('');
    setCollectionNote('');
  };

  // Add Item to Field Order
  const handleAddOrderItem = (product) => {
    const existing = orderItems.find(i => i.productId === product.id);
    if (existing) {
      setOrderItems(orderItems.map(i => i.productId === product.id ? { ...i, qty: i.qty + 1, subtotal: (i.qty + 1) * i.price } : i));
    } else {
      setOrderItems([...orderItems, {
        productId: product.id,
        name: product.name,
        price: product.sellPrice,
        qty: 1,
        subtotal: product.sellPrice
      }]);
    }
  };

  // Submit Field Order with GPS Geotagging
  const handleSubmitFieldOrder = async () => {
    if (!selectedCustomer || orderItems.length === 0) return;

    const baseOrder = {
      employeeId: user?.id || 'sr-1',
      employeeName: user?.name || 'এসআর (ফিল্ড অফিসার)',
      employeeRole: 'এসআর / ফিল্ড অফিসার',
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      items: orderItems.map(i => ({
        productId: i.productId,
        name: i.name,
        price: i.price,
        orderedQty: i.qty,
        deliveredQty: 0,
        subtotal: i.subtotal
      })),
      deliveryNote: 'ফিল্ডে অর্ডার কাটা হয়েছে'
    };

    const enrichedOrder = await geotagTransaction(baseOrder, selectedCustomer);
    createFieldOrder(enrichedOrder);

    setOrderItems([]);
    setActiveTab('delivery_status');
  };

  // Print Collection Receipt
  const handlePrintReceipt = (receipt) => {
    const item = receipt || lastReceipt;
    if (!item) return;

    const printWin = window.open('', '_blank', 'width=420,height=550');
    if (!printWin) return;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SR Collection Receipt</title>
        <style>
          body { font-family: 'Courier New', monospace; padding: 15px; font-size: 13px; color: #000; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-bottom: 1px dashed #000; margin: 8px 0; }
          .flex { display: flex; justify-content: space-between; }
          .pad-y { padding: 3px 0; }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size: 16px;">${item.branchName}</div>
        <div class="center">ফিল্ড মানি রিসিট (SR Due Collection)</div>
        <div class="line"></div>
        <div class="flex pad-y"><span>রসিদ নং:</span><span>${item.id}</span></div>
        <div class="flex pad-y"><span>তারিখ:</span><span>${item.date}</span></div>
        <div class="flex pad-y"><span>এসআর অফিসার:</span><span>${item.srName}</span></div>
        <div class="line"></div>
        <div class="flex pad-y bold"><span>দোকান / গ্রাহক:</span><span>${item.customerName}</span></div>
        <div class="flex pad-y"><span>মোবাইল:</span><span>${item.customerPhone || 'N/A'}</span></div>
        <div class="line"></div>
        <div class="flex pad-y"><span>পূর্ববর্তী বকেয়া:</span><span>৳${item.previousDue.toLocaleString()}</span></div>
        <div class="flex pad-y bold" style="font-size: 14px;"><span>আদায়কৃত টাকা:</span><span>৳${ite(Number(m?.amount) || 0).toLocaleString()}</span></div>
        <div class="flex pad-y bold"><span>অবশিষ্ট বকেয়া:</span><span>৳${item.remainingDue.toLocaleString()}</span></div>
        <div class="flex pad-y"><span>পদ্ধতি:</span><span>${item.method === 'cash' ? 'নগদ ক্যাশ' : 'বিকাশ / ডিজিটাল'}</span></div>
        ${item.note ? `<div class="pad-y">মন্তব্য: ${item.note}</div>` : ''}
        <div class="line"></div>
        <div style="margin-top: 35px; display: flex; justify-content: space-between;">
          <span>গ্রাহকের স্বাক্ষর</span>
          <span>এসআর-এর স্বাক্ষর</span>
        </div>
      </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
      printWin.close();
    }, 300);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={24} style={{ color: 'var(--business-primary)' }} />
            <span>{lang === 'bn' ? 'এসআর ফিল্ড অপারেশন ও বকেয়া কালেকশন হাব' : 'SR Field Operations & Collection Hub'}</span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {lang === 'bn' ? 'ফিল্ডে দোকানে দোকানে গিয়ে অর্ডার বুকিং এবং বকেয়া ক্যাশ কালেকশন রসিদ প্রিন্ট' : 'Field customer visits, order taking, and due collection receipts'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              if (window.__openFieldForceRadar) window.__openFieldForceRadar();
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 12px',
              borderRadius: '20px',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              background: 'rgba(16, 185, 129, 0.14)',
              color: '#10b981',
              fontSize: '0.78rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
            title={lang === 'bn' ? 'লাইভ ফিল্ড জিপিএস রাডার দেখুন' : 'View Live GPS Radar'}
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981', animation: 'pulse 1.5s infinite' }}></span>
            <span>{lang === 'bn' ? '📍 জিপিএস রাডার' : 'GPS Radar'}</span>
          </button>
          <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', fontWeight: '700' }}>
            👤 এসআর: {user?.name || 'অফিসার'}
          </span>
          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: '700' }}>
            🏢 {activeBranch?.name}
          </span>
        </div>
      </div>

      {/* Main Tabs (Swipeable on Mobile) */}
      <div className="horizontal-touch-strip" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '8px' }}>
        <button
          onClick={() => setActiveTab('customers')}
          className={`btn ${activeTab === 'customers' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
        >
          <MapPin size={16} />
          <span>{lang === 'bn' ? 'দোকান তালিকা ও বকেয়া' : 'Customer Route'}</span>
        </button>
        <button
          onClick={() => {
            if (!selectedCustomer && customers.length > 0) setSelectedCustomer(customers[0]);
            setActiveTab('collection');
          }}
          className={`btn ${activeTab === 'collection' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
        >
          <HandCoins size={16} />
          <span>{lang === 'bn' ? 'বকেয়া কালেকশন ও রসিদ' : 'Due Collection'}</span>
        </button>
        <button
          onClick={() => {
            if (!selectedCustomer && customers.length > 0) setSelectedCustomer(customers[0]);
            setActiveTab('order');
          }}
          className={`btn ${activeTab === 'order' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
        >
          <ShoppingCart size={16} />
          <span>{lang === 'bn' ? 'ফিল্ড অর্ডার বুকিং' : 'Book Field Order'}</span>
        </button>
        <button
          onClick={() => setActiveTab('delivery_status')}
          className={`btn ${activeTab === 'delivery_status' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
        >
          <Truck size={16} />
          <span>{lang === 'bn' ? 'অর্ডার ও ডেলিভারি ট্র্যাকিং' : 'Delivery Tracking'}</span>
          <span className="badge" style={{ marginLeft: '4px', background: 'rgba(255,255,255,0.2)', padding: '2px 6px', fontSize: '0.72rem' }}>
            {fieldOrders.length}
          </span>
        </button>
      </div>

      {/* TAB 1: CUSTOMERS ROUTE LIST */}
      {activeTab === 'customers' && (
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                className="input-field"
                placeholder={lang === 'bn' ? 'দোকানের নাম, ঠিকানা বা মোবাইল দিয়ে খুঁজুন...' : 'Search by shop name, address or phone...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {filteredCustomers.map(c => (
              <div
                key={c.id}
                style={{
                  background: 'var(--bg-primary)',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong style={{ fontSize: '0.98rem', color: 'var(--text-main)' }}>{c.name}</strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <Phone size={12} />
                      <span>{c.phone || 'মোবাইল নেই'}</span>
                    </div>
                    {c.address && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <MapPin size={12} />
                        <span>{c.address}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>বকেয়া পাওনা</div>
                    <div style={{ fontWeight: '800', fontSize: '1.05rem', color: (c.outstandingDue || 0) > 0 ? '#ef4444' : '#10b981' }}>
                      ৳{(c.outstandingDue || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => { setSelectedCustomer(c); setActiveTab('collection'); }}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '6px', fontSize: '0.78rem', fontWeight: '700', color: '#10b981', border: '1px solid #10b981' }}
                  >
                    <HandCoins size={14} />
                    <span>কালেকশন</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedCustomer(c); setActiveTab('order'); }}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '6px', fontSize: '0.78rem', fontWeight: '700' }}
                  >
                    <ShoppingCart size={14} />
                    <span>অর্ডার কাটুন</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: DUE COLLECTION FORM */}
      {activeTab === 'collection' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HandCoins size={20} style={{ color: '#10b981' }} />
              <span>{lang === 'bn' ? 'ফিল্ডে বকেয়া টাকা জমা গ্রহণ' : 'Field Due Collection'}</span>
            </h3>

            <form onSubmit={handleCollectDue}>
              {/* Select Customer */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>দোকান / কাস্টমার নির্বাচন করুন *</label>
                <select
                  className="input-field"
                  value={selectedCustomer?.id || ''}
                  onChange={(e) => {
                    const found = customers.find(c => c.id === e.target.value);
                    setSelectedCustomer(found);
                  }}
                  required
                >
                  <option value="">-- কাস্টমার বাছাই করুন --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (বকেয়া: ৳{(c.outstandingDue || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {selectedCustomer && (
                <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '8px', marginBottom: '1rem', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>বর্তমান বকেয়া:</span>
                  <strong style={{ color: '#ef4444', fontSize: '1rem' }}>৳{(selectedCustomer.outstandingDue || 0).toLocaleString()}</strong>
                </div>
              )}

              {/* Amount */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>আদায়কৃত টাকার পরিমাণ (৳) *</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="যেমন: ৫০০০"
                  value={collectionAmount}
                  onChange={(e) => setCollectionAmount(e.target.value)}
                  style={{ fontSize: '1.1rem', fontWeight: '800' }}
                  required
                />
              </div>

              {/* Payment Method */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>পেমেন্ট মাধ্যম</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setCollectionMethod('cash')}
                    className={`btn ${collectionMethod === 'cash' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '8px', fontSize: '0.82rem' }}
                  >
                    💵 নগদ ক্যাশ
                  </button>
                  <button
                    type="button"
                    onClick={() => setCollectionMethod('bkash')}
                    className={`btn ${collectionMethod === 'bkash' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '8px', fontSize: '0.82rem' }}
                  >
                    📱 বিকাশ / নগদ
                  </button>
                </div>
              </div>

              {/* Note */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '700' }}>মন্তব্য / রসিদ নোট</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="যেমন: দোকানদার আজ নগদ পরিশোধ করেছেন"
                  value={collectionNote}
                  onChange={(e) => setCollectionNote(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: '800' }}
              >
                <CheckCircle2 size={18} />
                <span>টাকা জমা গ্রহণ ও রসিদ তৈরি করুন</span>
              </button>
            </form>
          </div>

          {/* Last Receipt Preview Card */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} style={{ color: 'var(--business-primary)' }} />
              <span>{lang === 'bn' ? 'মানি রসিদ প্রিভিউ' : 'Receipt Preview'}</span>
            </h3>

            {lastReceipt ? (
              <div style={{ background: '#f8fafc', color: '#0f172a', padding: '16px', borderRadius: '10px', border: '1px solid #cbd5e1', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ textAlign: 'center', fontWeight: '800', fontSize: '1.1rem', borderBottom: '1px dashed #94a3b8', paddingBottom: '6px' }}>
                    {lastReceipt.branchName}
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#64748b', margin: '4px 0 10px' }}>
                    ফিল্ড বকেয়া আদায় রসিদ
                  </div>

                  <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>রসিদ নং:</span>
                      <strong>{lastReceipt.id}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>দোকান / গ্রাহক:</span>
                      <strong>{lastReceipt.customerName}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>এসআর অফিসার:</span>
                      <span>{lastReceipt.srName}</span>
                    </div>
                    <div style={{ height: '1px', background: '#cbd5e1', margin: '6px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: '800', color: '#059669' }}>
                      <span>আদায়কৃত টাকা:</span>
                      <span>৳{lastReceipt.amount.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                      <span>অবশিষ্ট বকেয়া:</span>
                      <strong>৳{lastReceipt.remainingDue.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handlePrintReceipt(lastReceipt)}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Printer size={16} />
                  <span>গ্রাহককে প্রিন্ট কপি দিন</span>
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <Printer size={36} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                <p>কালেকশন সম্পন্ন করলে এখানে প্রিন্ট উপযোগী রসিদ দেখতে পাবেন</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: FIELD ORDER BOOKING */}
      {activeTab === 'order' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* Products Catalog */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '1.05rem', fontWeight: '800' }}>পণ্য তালিকা থেকে যোগ করুন</h3>
            <input
              type="text"
              className="input-field"
              placeholder="পণ্য খুঁজুন..."
              value={orderProductSearch}
              onChange={(e) => setOrderProductSearch(e.target.value)}
              style={{ marginBottom: '12px' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto' }}>
              {products
                .filter(p => p.name.toLowerCase().includes(orderProductSearch.toLowerCase()))
                .map(prod => (
                  <div
                    key={prod.id}
                    style={{
                      padding: '10px 12px',
                      background: 'var(--bg-secondary)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.88rem' }}>{prod.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        বিক্রয় মূল্য: ৳{prod.sellPrice} • স্টক: {prod.stock}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddOrderItem(prod)}
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.78rem', fontWeight: '700' }}
                    >
                      + কার্ট
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Booked Order Summary */}
          <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: '0 0 10px', fontSize: '1.05rem', fontWeight: '800' }}>
                অর্ডার কার্ট ({selectedCustomer?.name || 'কাস্টমার নির্বাচন করুন'})
              </h3>

              <div className="form-group" style={{ marginBottom: '10px' }}>
                <select
                  className="input-field"
                  value={selectedCustomer?.id || ''}
                  onChange={(e) => {
                    const found = customers.find(c => c.id === e.target.value);
                    setSelectedCustomer(found);
                  }}
                >
                  <option value="">-- কাস্টমার নির্বাচন করুন --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {orderItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                  বাম পাশের তালিকা থেকে পণ্য যুক্ত করুন
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {orderItems.map(item => (
                    <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>{item.name} x {item.qty}</span>
                      <strong>৳{item.subtotal.toLocaleString()}</strong>
                    </div>
                  ))}
                  <div style={{ height: '1px', background: 'var(--border-color)', margin: '8px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: '800' }}>
                    <span>মোট অর্ডার মূল্য:</span>
                    <span style={{ color: 'var(--business-primary)' }}>
                      ৳{orderItems.reduce((acc, i) => acc + i.subtotal, 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={orderItems.length === 0 || !selectedCustomer}
              onClick={handleSubmitFieldOrder}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem', padding: '12px', fontSize: '0.95rem', fontWeight: '800' }}
            >
              <CheckCircle2 size={18} />
              <span>ফিল্ড অর্ডার বুক করুন</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: DELIVERY STATUS & TRACKING */}
      {activeTab === 'delivery_status' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={20} style={{ color: 'var(--business-primary)' }} />
              <span>{lang === 'bn' ? 'ফিল্ডে কাটা পণ্যের ডেলিভারি অবস্থা' : 'Field Orders Delivery Status'}</span>
            </h3>

            <div style={{ display: 'flex', gap: '6px' }}>
              <span className="badge badge-success">
                🟢 সম্পন্ন: {fieldOrders.filter(o => o.deliveryStatus === 'delivered').length}
              </span>
              <span className="badge badge-warning">
                🟡 আংশিক: {fieldOrders.filter(o => o.deliveryStatus === 'partial').length}
              </span>
              <span className="badge badge-danger">
                🔴 বাকি: {fieldOrders.filter(o => o.deliveryStatus === 'pending').length}
              </span>
            </div>
          </div>

          {fieldOrders.length === 0 ? (
            <div className="glass-card" style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Package size={36} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <p>{lang === 'bn' ? 'এখনও কোনো ফিল্ড অর্ডার কাটা হয়নি' : 'No field orders recorded yet'}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {fieldOrders.map(order => {
                const isDelivered = order.deliveryStatus === 'delivered';
                const isPartial = order.deliveryStatus === 'partial';
                const isPending = order.deliveryStatus === 'pending';

                let badgeColor = isDelivered ? '#10b981' : (isPartial ? '#f59e0b' : '#ef4444');
                let badgeBg = isDelivered ? 'rgba(16, 185, 129, 0.12)' : (isPartial ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)');
                let badgeText = isDelivered ? '🟢 ডেলিভারি সম্পন্ন' : (isPartial ? '🟡 আংশিক ডেলিভারি' : '🔴 ডেলিভারি হয়নি');

                return (
                  <div
                    key={order.id}
                    className="glass-card"
                    style={{
                      padding: '14px',
                      borderLeft: `4px solid ${badgeColor}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '6px' }}>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                          {order.customerName}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          অর্ডার নং: {order.id} • স্টাফ: {order.employeeName}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '12px', background: badgeBg, color: badgeColor, fontWeight: '800', fontSize: '0.8rem', border: `1px solid ${badgeColor}` }}>
                          {badgeText}
                        </span>
                        <div style={{ fontSize: '0.74rem', color: badgeColor, fontWeight: '700', marginTop: '2px' }}>
                          {order.deliverySummary}
                        </div>
                      </div>
                    </div>

                    {/* Products details list */}
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: '6px', padding: '8px 10px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                      {order.items.map((it, idx) => {
                        const remaining = Math.max(0, it.orderedQty - (it.deliveredQty || 0));
                        return (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                            <span>{it.name}</span>
                            <span>
                              অর্ডার: <strong>{it.orderedQty}</strong> • ডেলিভারি: <strong style={{ color: (it.deliveredQty || 0) === it.orderedQty ? '#10b981' : '#f59e0b' }}>{it.deliveredQty || 0}</strong>
                              {remaining > 0 && <span style={{ color: '#ef4444', marginLeft: '6px', fontWeight: '800' }}>({remaining} বাকি)</span>}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--business-primary)' }}>
                        মোট: ৳{order.totalAmount.toLocaleString()}
                      </span>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        {!isDelivered && (
                          <button
                            type="button"
                            onClick={() => markOrderFullyDelivered(order.id)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#10b981', borderColor: '#10b981', fontWeight: '700' }}
                          >
                            ✓ সব ডেলিভারি
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveUpdatingOrder(order);
                            setUpdatingItems(order.items.map(i => ({ ...i })));
                            setUpdatingNote(order.deliveryNote || '');
                          }}
                          className="btn btn-primary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: '700' }}
                        >
                          <Truck size={13} />
                          <span>আপডেট</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: UPDATE DELIVERY STATUS */}
      {activeUpdatingOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px', width: '95%' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '8px' }}>
              ডেলিভারি আপডেট ({activeUpdatingOrder.customerName})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', marginBottom: '12px' }}>
              {updatingItems.map((item, idx) => {
                const rem = Math.max(0, item.orderedQty - (Number(item.deliveredQty) || 0));
                return (
                  <div key={idx} style={{ padding: '8px', background: 'var(--bg-secondary)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{item.name}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        অর্ডার: {item.orderedQty} | বাকি: <span style={{ color: rem > 0 ? '#ef4444' : '#10b981', fontWeight: '800' }}>{rem}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="number"
                        min="0"
                        max={item.orderedQty}
                        value={item.deliveredQty}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(item.orderedQty, Number(e.target.value) || 0));
                          setUpdatingItems(updatingItems.map((it, i) => i === idx ? { ...it, deliveredQty: val } : it));
                        }}
                        className="input-field"
                        style={{ width: '60px', textAlign: 'center', fontWeight: '800', height: '32px' }}
                      />
                      <span style={{ fontSize: '0.78rem' }}>/ {item.orderedQty}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={() => setUpdatingItems(updatingItems.map(it => ({ ...it, deliveredQty: it.orderedQty })))}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '6px', fontSize: '0.78rem', color: '#10b981', borderColor: '#10b981' }}
              >
                সবগুলো ১০০% ডেলিভারি সেট করুন
              </button>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700' }}>মন্তব্য</label>
              <input
                type="text"
                className="input-field"
                placeholder="যেমন: আংশিক ডেলিভারি দেওয়া হয়েছে..."
                value={updatingNote}
                onChange={(e) => setUpdatingNote(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  updateFieldOrderDelivery(activeUpdatingOrder.id, updatingItems, updatingNote);
                  setActiveUpdatingOrder(null);
                }}
                className="btn btn-primary"
                style={{ flex: 1, padding: '8px', fontWeight: '700' }}
              >
                সংরক্ষণ করুন
              </button>
              <button
                type="button"
                onClick={() => setActiveUpdatingOrder(null)}
                className="btn btn-secondary"
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
