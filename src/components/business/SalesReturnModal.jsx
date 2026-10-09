import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  Package,
  Trash2,
  DollarSign,
  Printer,
  FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SalesReturnModal = ({ isOpen, onClose }) => {
  const {
    salesHistory = [],
    products = [],
    adjustStock,
    recordDamagedGoods,
    showToast,
    lang = 'bn'
  } = useApp();

  const [searchInvoice, setSearchInvoice] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [returnItems, setReturnItems] = useState({}); // { [productId]: { quantity: 1, condition: 'restock' | 'damaged', reason: '' } }
  const [refundMethod, setRefundMethod] = useState('cash'); // 'cash' | 'credit'
  const [returnNotes, setReturnNotes] = useState('');

  // Find sales match
  const filteredSales = useMemo(() => {
    if (!searchInvoice.trim()) return salesHistory.slice(0, 8);
    const q = searchInvoice.toLowerCase();
    return salesHistory.filter(s =>
      (s.id && s.id.toLowerCase().includes(q)) ||
      (s.customerName && s.customerName.toLowerCase().includes(q)) ||
      (s.customerPhone && s.customerPhone.includes(q))
    ).slice(0, 10);
  }, [salesHistory, searchInvoice]);

  if (!isOpen) return null;

  const handleSelectSale = (sale) => {
    setSelectedSale(sale);
    const initialReturns = {};
    (sale.items || []).forEach(item => {
      initialReturns[item.id || item.productId] = {
        selected: false,
        quantity: 1,
        maxQuantity: item.quantity || 1,
        unitPrice: item.price || item.sellPrice || 0,
        name: item.name || 'পণ্য',
        condition: 'restock', // 'restock' or 'damaged'
        reason: 'গ্রাহকের পছন্দ হয়নি / অতিরিক্ত নেওয়া'
      };
    });
    setReturnItems(initialReturns);
  };

  const handleToggleItem = (itemId) => {
    setReturnItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        selected: !prev[itemId].selected
      }
    }));
  };

  const handleUpdateItem = (itemId, field, value) => {
    setReturnItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  };

  // Compute total refund
  const totalRefundAmount = useMemo(() => {
    return Object.values(returnItems)
      .filter(it => it.selected)
      .reduce((sum, it) => sum + ((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)), 0);
  }, [returnItems]);

  const handleProcessReturn = (e) => {
    e.preventDefault();
    const itemsToReturn = Object.entries(returnItems).filter(([_, it]) => it.selected);
    if (itemsToReturn.length === 0) {
      alert('অনুগ্রহ করে অন্তত একটি ফেরত নেওয়ার পণ্য নির্বাচন করুন।');
      return;
    }

    if (!window.confirm(`মোট ৳${totalRefundAmount.toLocaleString()} রিফান্ড দিয়ে বিক্রিত মাল ফেরত নিবেন?`)) return;

    itemsToReturn.forEach(([prodId, it]) => {
      const qty = Number(it.quantity) || 1;
      const matchedProd = products.find(p => p.id === prodId || p.name === it.name);

      if (it.condition === 'restock') {
        // Restore stock
        if (matchedProd && typeof adjustStock === 'function') {
          adjustStock(matchedProd.id, qty, 'in', `সেলস রিটার্ন (ইনভয়েস: ${selectedSale.id})`);
        }
      } else {
        // Damaged / waste
        if (typeof recordDamagedGoods === 'function') {
          recordDamagedGoods({
            productId: matchedProd?.id || prodId,
            productName: it.name,
            quantity: qty,
            costPrice: matchedProd?.costPrice || it.unitPrice,
            reason: `সেলস রিটার্ন ড্যামেজ: ${it.reason || 'নষ্ট/মেয়াদোত্তীর্ণ'}`,
            date: new Date().toISOString().split('T')[0]
          });
        }
      }
    });

    // Record return transaction log in localStorage
    try {
      const savedReturns = JSON.parse(localStorage.getItem('hk360_sales_returns') || '[]');
      const returnRecord = {
        id: `RET-${Date.now().toString().slice(-6)}`,
        invoiceId: selectedSale.id,
        customerName: selectedSale.customerName || 'খুচরা ক্রেতা',
        date: new Date().toISOString().split('T')[0],
        refundAmount: totalRefundAmount,
        refundMethod: refundMethod,
        items: itemsToReturn.map(([id, it]) => ({ name: it.name, quantity: it.quantity, condition: it.condition })),
        note: returnNotes
      };
      localStorage.setItem('hk360_sales_returns', JSON.stringify([returnRecord, ...savedReturns]));
    } catch { }

    if (showToast) showToast('সেলস রিটার্ন সফলভাবে সম্পন্ন এবং ইনভেন্টরি আপডেট হয়েছে!', 'success');
    setSelectedSale(null);
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '880px',
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
                background: 'linear-gradient(135deg, #f97316, #ef4444)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.35)'
              }}
            >
              <RotateCcw size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'বিক্রিত মাল ফেরত ও ক্ষতি নির্ধারণ (Sales Return)' : 'Sales Return & Damage Management'}
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'কাস্টমার থেকে পণ্য ফেরত নেওয়া, ক্যাশ রিফান্ড ও ভালো/নষ্ট মালের স্টক রিস্টোরেশন' : 'Process customer return, stock restoration and damage logging'}
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
          {!selectedSale ? (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                  ইনভয়েস নং বা কাস্টমারের নাম/ফোন দিয়ে অনুসন্ধান করুন:
                </label>
                <div style={{ position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="যেমন: INV-1002 বা 01700..."
                    value={searchInvoice}
                    onChange={e => setSearchInvoice(e.target.value)}
                    style={{ paddingLeft: '38px' }}
                    autoFocus
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredSales.map(sale => (
                  <div
                    key={sale.id}
                    onClick={() => handleSelectSale(sale)}
                    style={{
                      background: 'var(--bg-card, rgba(255,255,255,0.02))',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {sale.id} • {sale.customerName || 'সাধারণ ক্রেতা'}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        📅 তারিখ: {sale.date} | পণ্য: {(sale.items || []).length} টি
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981' }}>
                        ৳{Number(sale.totalAmount || sale.finalTotal || 0).toLocaleString()}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#0ea5e9', fontWeight: 600 }}>
                        রিটার্ন করুন →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleProcessReturn}>
              <div style={{ background: 'rgba(14, 165, 233, 0.08)', border: '1px solid rgba(14, 165, 233, 0.25)', borderRadius: '12px', padding: '12px 16px', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>
                    ইনভয়েস: {selectedSale.id} ({selectedSale.customerName || 'ক্রেতা'})
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    তারিখ: {selectedSale.date} | মোট বিক্রি ছিল: ৳{Number(selectedSale.totalAmount || selectedSale.finalTotal || 0).toLocaleString()}
                  </div>
                </div>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedSale(null)} style={{ padding: '4px 12px', fontSize: '0.78rem' }}>
                  অন্য ইনভয়েস খুঁজুন
                </button>
              </div>

              {/* Items Return Table */}
              <h4 style={{ margin: '0 0 10px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                ফেরত দেওয়া পণ্য ও কন্ডিশন সিলেক্ট করুন:
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' }}>
                {Object.entries(returnItems).map(([id, it]) => (
                  <div
                    key={id}
                    style={{
                      background: it.selected ? 'rgba(249, 115, 22, 0.06)' : 'var(--bg-card, rgba(255,255,255,0.02))',
                      border: `1px solid ${it.selected ? 'rgba(249, 115, 22, 0.4)' : 'var(--border-color)'}`,
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'grid',
                      gridTemplateColumns: 'auto 2fr 1fr 1.5fr',
                      gap: '12px',
                      alignItems: 'center'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={it.selected}
                      onChange={() => handleToggleItem(id)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />

                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        {it.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        দর: ৳{it.unitPrice} (সর্বোচ্চ ফেরতযোগ্য: {it.maxQuantity} টি)
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>ফেরত পরিমাণ:</label>
                      <input
                        type="number"
                        className="form-control"
                        value={it.quantity}
                        onChange={e => handleUpdateItem(id, 'quantity', Math.min(it.maxQuantity, Math.max(1, Number(e.target.value))))}
                        disabled={!it.selected}
                        min="1"
                        max={it.maxQuantity}
                        style={{ height: '32px', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>পণ্যের অবস্থা:</label>
                      <select
                        className="form-control"
                        value={it.condition}
                        onChange={e => handleUpdateItem(id, 'condition', e.target.value)}
                        disabled={!it.selected}
                        style={{ height: '32px', fontSize: '0.82rem' }}
                      >
                        <option value="restock">✅ ভালো পণ্য (স্টকে যুক্ত হবে)</option>
                        <option value="damaged">⚠️ নষ্ট/ড্যামেজ (ক্ষতির খাতায়)</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {/* Refund Options */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem', background: 'var(--bg-subtle, rgba(255,255,255,0.02))', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>রিফান্ড মাধ্যম:</label>
                  <select
                    className="form-control"
                    value={refundMethod}
                    onChange={e => setRefundMethod(e.target.value)}
                  >
                    <option value="cash">নগদ ক্যাশ ফেরত (Cash Refund)</option>
                    <option value="credit">দোকানের ব্যালেন্সে জমা (Customer Store Credit)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>নোট বা ফেরতের কারণ:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="যেমন: মেয়াদোত্তীর্ণ হওয়ায় ফেরত"
                    value={returnNotes}
                    onChange={e => setReturnNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Total & Submit */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  মোট রিফান্ড পরিমাণ: <span style={{ color: '#ef4444' }}>৳{totalRefundAmount.toLocaleString()}</span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedSale(null)} style={{ padding: '7px 16px', fontSize: '0.85rem' }}>বাতিল</button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={totalRefundAmount <= 0}
                    style={{ padding: '7px 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', background: '#f97316', borderColor: '#f97316' }}
                  >
                    <CheckCircle2 size={16} /> রিটার্ন ও রিফান্ড সম্পন্ন করুন
                  </button>
                </div>
              </div>
            </form>
          )}
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
