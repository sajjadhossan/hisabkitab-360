import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
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
  FileText
} from 'lucide-react';

export const SRFieldManager = () => {
  const {
    customers,
    products,
    collectDue,
    completeSale,
    salesHistory,
    activeBranch,
    lang
  } = useApp();

  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState('customers'); // 'customers' | 'order' | 'collection' | 'history'

  // Collection form state
  const [collectionAmount, setCollectionAmount] = useState('');
  const [collectionMethod, setCollectionMethod] = useState('cash'); // 'cash' | 'bkash'
  const [collectionNote, setCollectionNote] = useState('');
  const [lastReceipt, setLastReceipt] = useState(null);

  // Field order form state
  const [orderItems, setOrderItems] = useState([]); // [{ productId, name, price, qty, subtotal }]
  const [orderProductSearch, setOrderProductSearch] = useState('');

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm)) ||
    (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const today = new Date().toISOString().split('T')[0];

  // Handle Due Collection
  const handleCollectDue = (e) => {
    e.preventDefault();
    if (!selectedCustomer || !collectionAmount) return;

    const amount = Number(collectionAmount);
    if (amount <= 0) return;

    collectDue(selectedCustomer.id, amount);

    const receipt = {
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

  // Submit Field Order
  const handleSubmitFieldOrder = () => {
    if (!selectedCustomer || orderItems.length === 0) return;

    const total = orderItems.reduce((acc, i) => acc + i.subtotal, 0);

    completeSale({
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      paymentMethod: 'due', // Field orders default to credit/delivery
      discount: 0,
      paidAmount: 0
    });

    setOrderItems([]);
    setActiveTab('customers');
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
        <div class="flex pad-y bold" style="font-size: 14px;"><span>আদায়কৃত টাকা:</span><span>৳${item.amount.toLocaleString()}</span></div>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', fontWeight: '700' }}>
            👤 এসআর: {user?.name || 'অফিসার'}
          </span>
          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: '700' }}>
            🏢 {activeBranch?.name}
          </span>
        </div>
      </div>

      {/* Main Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
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
    </div>
  );
};
