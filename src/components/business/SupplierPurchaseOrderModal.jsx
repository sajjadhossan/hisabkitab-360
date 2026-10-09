import React, { useState, useMemo } from 'react';
import {
  Truck,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  FileText,
  DollarSign,
  PackageCheck,
  Send,
  AlertCircle,
  Printer,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SupplierPurchaseOrderModal = ({ isOpen, onClose }) => {
  const {
    suppliers = [],
    products = [],
    adjustStock,
    businessDebts = [],
    setBusinessDebts,
    showToast,
    lang = 'bn'
  } = useApp();

  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('hk360_purchase_orders');
      if (saved) return JSON.parse(saved);
    } catch { }
    return [
      {
        id: 'PO-2026-001',
        supplierId: suppliers[0]?.id || 'sup-1',
        supplierName: suppliers[0]?.name || 'মেঘনা গ্রুপ অব ইন্ডাস্ট্রিজ',
        date: '2026-10-05',
        expectedDate: '2026-10-12',
        status: 'ordered', // 'draft' | 'ordered' | 'received'
        items: [
          { productId: products[0]?.id || 'prod-1', name: products[0]?.name || 'মিনিকেট চাল', quantity: 20, unitCost: 1750, total: 35000 }
        ],
        totalAmount: 35000,
        paidAmount: 15000,
        note: 'অগ্রিম ১৫,০০০ টাকা প্রদান করা হয়েছে।'
      }
    ];
  });

  const [isCreating, setIsCreating] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);

  // New PO Form state
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [expectedDate, setExpectedDate] = useState('');
  const [note, setNote] = useState('');
  const [orderItems, setOrderItems] = useState([
    { productId: products[0]?.id || '', quantity: 10, unitCost: products[0]?.costPrice || 0 }
  ]);
  const [paidAdvance, setPaidAdvance] = useState('');

  // Save orders to localStorage
  const saveOrders = (updated) => {
    setOrders(updated);
    try {
      localStorage.setItem('hk360_purchase_orders', JSON.stringify(updated));
    } catch { }
  };

  const handleAddItemRow = () => {
    const firstProd = products[0];
    setOrderItems(prev => [
      ...prev,
      { productId: firstProd ? firstProd.id : '', quantity: 1, unitCost: firstProd ? firstProd.costPrice : 0 }
    ]);
  };

  const handleRemoveItemRow = (idx) => {
    setOrderItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, value) => {
    setOrderItems(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      if (field === 'productId') {
        const prod = products.find(p => p.id === value);
        if (prod) {
          copy[idx].unitCost = prod.costPrice || 0;
        }
      }
      return copy;
    });
  };

  const currentFormTotal = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.unitCost) || 0)), 0);
  }, [orderItems]);

  const handleCreatePO = (e) => {
    e.preventDefault();
    if (!selectedSupplierId || orderItems.length === 0) return;

    const supplier = suppliers.find(s => s.id === selectedSupplierId) || { name: 'সাধারণ মহাজন / সাপ্লায়ার' };
    const validItems = orderItems.map(item => {
      const prod = products.find(p => p.id === item.productId);
      const qty = Number(item.quantity) || 1;
      const cost = Number(item.unitCost) || 0;
      return {
        productId: item.productId,
        name: prod ? prod.name : 'পণ্য',
        quantity: qty,
        unitCost: cost,
        total: qty * cost
      };
    });

    const newPO = {
      id: `PO-${Date.now().toString().slice(-6)}`,
      supplierId: selectedSupplierId,
      supplierName: supplier.name,
      date: new Date().toISOString().split('T')[0],
      expectedDate: expectedDate || new Date().toISOString().split('T')[0],
      status: 'ordered',
      items: validItems,
      totalAmount: currentFormTotal,
      paidAmount: Number(paidAdvance) || 0,
      note: note
    };

    saveOrders([newPO, ...orders]);
    setIsCreating(false);
    setOrderItems([{ productId: products[0]?.id || '', quantity: 10, unitCost: products[0]?.costPrice || 0 }]);
    setPaidAdvance('');
    setNote('');
    if (showToast) showToast('সাপ্লায়ার পারচেজ অর্ডার সফলভাবে তৈরি হয়েছে!', 'success');
  };

  // 1-Click Receive Goods & Stock-In
  const handleReceiveGoods = (po) => {
    if (po.status === 'received') return;
    if (!window.confirm(`আপনি কি এই অর্ডারের মালামাল গ্রহণ করে সরাসরি ইনভেন্টরি স্টকে যুক্ত করতে চান?`)) return;

    // 1. Update product stocks
    po.items.forEach(item => {
      if (item.productId && typeof adjustStock === 'function') {
        adjustStock(item.productId, item.quantity, 'in', `PO গ্রহণ: ${po.id}`);
      }
    });

    // 2. If there is due balance, add to business debts (মহাজনী বাকি)
    const dueAmount = po.totalAmount - (po.paidAmount || 0);
    if (dueAmount > 0 && typeof setBusinessDebts === 'function') {
      const newDebt = {
        id: `bdeb-${Date.now()}`,
        type: 'payable', // আমরা মহাজনকে দেব
        personName: po.supplierName,
        personPhone: '',
        amount: dueAmount,
        date: new Date().toISOString().split('T')[0],
        dueDate: po.expectedDate,
        note: `পারচেজ অর্ডার চালান বকেয়া: ${po.id}`,
        status: 'pending'
      };
      setBusinessDebts(prev => [newDebt, ...(prev || [])]);
    }

    // 3. Mark PO as received
    const updated = orders.map(o => o.id === po.id ? { ...o, status: 'received' } : o);
    saveOrders(updated);
    if (showToast) showToast('মালামাল সফলভাবে স্টকে যুক্ত ও বকেয়া হিসাব সংরক্ষণ করা হয়েছে!', 'success');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface)',
          borderRadius: '18px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--header-bg, rgba(255,255,255,0.03))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(14, 165, 233, 0.35)'
              }}
            >
              <Truck size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'সাপ্লায়ার পারচেজ অর্ডার ও চালান (PO Manager)' : 'Supplier Purchase Orders & Stock In'}
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'মহাজনের কাছে অর্ডার পাঠানো, চালান রিসিভ ও ১-ক্লিকে ইনভেন্টরি স্টক বৃদ্ধি' : 'Send orders, receive shipments & 1-click stock update'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              মোট পারচেজ অর্ডার: <strong style={{ color: 'var(--text-main)' }}>{orders.length} টি</strong>
            </div>
            {!isCreating && (
              <button
                className="btn btn-primary"
                onClick={() => setIsCreating(true)}
                style={{ padding: '7px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} /> নতুন অর্ডার তৈরি করুন
              </button>
            )}
          </div>

          {/* Create Order Form */}
          {isCreating && (
            <form onSubmit={handleCreatePO} style={{ background: 'var(--bg-subtle, rgba(255,255,255,0.03))', border: '1px dashed var(--border-color)', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#0ea5e9" /> নতুন ক্রয়াদেশ / পারচেজ অর্ডার বিবরণ
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>সাপ্লায়ার / মহাজন</label>
                  <select
                    className="form-control"
                    value={selectedSupplierId}
                    onChange={e => setSelectedSupplierId(e.target.value)}
                    required
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.company || 'মহাজন'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>মালামাল পৌঁছানোর সম্ভাব্য তারিখ</label>
                  <input
                    type="date"
                    className="form-control"
                    value={expectedDate}
                    onChange={e => setExpectedDate(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>অগ্রিম পরিশোধ (৳)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="৳ ০"
                    value={paidAdvance}
                    onChange={e => setPaidAdvance(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>অর্ডারের পণ্য তালিকা:</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {orderItems.map((item, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                      <select
                        className="form-control"
                        value={item.productId}
                        onChange={e => handleItemChange(idx, 'productId', e.target.value)}
                        required
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (বর্তমান স্টক: {p.stock})</option>
                        ))}
                      </select>

                      <input
                        type="number"
                        className="form-control"
                        placeholder="পরিমাণ"
                        value={item.quantity}
                        onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                        required
                        min="1"
                      />

                      <input
                        type="number"
                        className="form-control"
                        placeholder="দর (৳)"
                        value={item.unitCost}
                        onChange={e => handleItemChange(idx, 'unitCost', e.target.value)}
                        required
                        min="0"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        disabled={orderItems.length === 1}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddItemRow}
                  className="btn btn-secondary"
                  style={{ marginTop: '8px', padding: '4px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={14} /> আরও পণ্য যোগ করুন
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  মোট অর্ডারের মূল্য: <span style={{ color: '#0ea5e9' }}>৳{currentFormTotal.toLocaleString()}</span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsCreating(false)} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>বাতিল</button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '6px 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Send size={15} /> অর্ডার কনফার্ম করুন
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* PO List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {orders.map(po => {
              const isReceived = po.status === 'received';
              const due = po.totalAmount - (po.paidAmount || 0);

              return (
                <div
                  key={po.id}
                  style={{
                    background: 'var(--bg-card, rgba(255,255,255,0.02))',
                    border: `1px solid ${isReceived ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'}`,
                    borderRadius: '14px',
                    padding: '1.2rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                          {po.id}
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          • {po.supplierName}
                        </span>
                        {isReceived ? (
                          <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '12px' }}>
                            ✓ মালামাল রিসিভড
                          </span>
                        ) : (
                          <span style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '12px' }}>
                            📦 ট্রানজিট / অর্ডার পাঠানো হয়েছে
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        📅 অর্ডার তারিখ: {po.date} | সম্ভাব্য ডেলিভারি: {po.expectedDate} {po.note && `| নোট: ${po.note}`}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                          ৳{po.totalAmount.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: due > 0 ? '#ef4444' : '#10b981' }}>
                          {due > 0 ? `বকেয়া: ৳${due.toLocaleString()}` : 'সম্পূর্ণ পরিশোধিত'}
                        </div>
                      </div>

                      {!isReceived && (
                        <button
                          className="btn btn-primary"
                          onClick={() => handleReceiveGoods(po)}
                          style={{
                            padding: '6px 14px',
                            fontSize: '0.82rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#10b981',
                            borderColor: '#10b981'
                          }}
                        >
                          <PackageCheck size={16} /> মালামাল রিসিভ ও স্টক ইন
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Items summary */}
                  <div style={{ background: 'var(--bg-subtle, rgba(255,255,255,0.03))', borderRadius: '10px', padding: '8px 12px', marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {po.items.map((it, idx) => (
                      <span key={idx} style={{ marginRight: '14px' }}>
                        • {it.name} ({it.quantity} টি @ ৳{it.unitCost})
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'var(--header-bg, rgba(255,255,255,0.02))'
          }}
        >
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '7px 20px' }}>
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
