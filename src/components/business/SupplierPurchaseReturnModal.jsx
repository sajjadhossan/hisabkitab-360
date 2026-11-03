import React, { useState, useMemo } from 'react';
import {
  X,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  Printer,
  Building,
  AlertTriangle,
  FileText,
  DollarSign
} from 'lucide-react';
import { playButtonClick, playSuccessChime, playWarningTone } from '../../services/soundFeedback';
import { hapticFeedback } from '../../services/nativeAppService';

export const SupplierPurchaseReturnModal = ({
  isOpen,
  onClose,
  suppliers = [],
  products = [],
  onConfirmPurchaseReturn,
  lang = 'bn',
  showToast
}) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [returnQty, setReturnQty] = useState('1');
  const [returnReason, setReturnReason] = useState('মেয়াদোত্তীর্ণ বা নষ্ট পণ্য');
  const [adjustmentType, setAdjustmentType] = useState('deduct_due'); // 'deduct_due' | 'cash_refund'
  const [notes, setNotes] = useState('');
  const [debitNoteNo, setDebitNoteNo] = useState(() => `DBN-${Date.now().toString().slice(-6)}`);

  // Cart of items to return to this supplier
  const [returnItems, setReturnItems] = useState([]);
  const [completedDebitNote, setCompletedDebitNote] = useState(null);

  if (!isOpen) return null;

  const currentSupplier = useMemo(() => {
    return suppliers.find(s => s.id === selectedSupplierId) || suppliers[0];
  }, [suppliers, selectedSupplierId]);

  const currentProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId);
  }, [products, selectedProductId]);

  const handleAddItem = (e) => {
    e?.preventDefault();
    if (!currentProduct) {
      showToast(lang === 'bn' ? 'পণ্য নির্বাচন করুন' : 'Select product', 'warning');
      return;
    }
    const qty = Math.max(1, parseInt(returnQty, 10) || 1);
    const available = Number(currentProduct.stock) || 0;

    if (qty > available) {
      playWarningTone();
      showToast(
        lang === 'bn'
          ? `পর্যাপ্ত স্টক নেই! উপলব্ধ স্টক: ${available}টি`
          : `Insufficient stock! Available: ${available}`,
        'warning'
      );
      return;
    }

    const unitCost = Number(currentProduct.costPrice) || Number(currentProduct.sellPrice) || 0;
    const existingIdx = returnItems.findIndex(it => it.productId === currentProduct.id);

    if (existingIdx >= 0) {
      const updated = [...returnItems];
      const nextQty = updated[existingIdx].qty + qty;
      if (nextQty > available) {
        showToast(lang === 'bn' ? 'মোট ফেরত স্টক সীমার চেয়ে বেশি' : 'Exceeds stock limit', 'warning');
        return;
      }
      updated[existingIdx].qty = nextQty;
      updated[existingIdx].total = nextQty * unitCost;
      setReturnItems(updated);
    } else {
      setReturnItems(prev => [
        ...prev,
        {
          productId: currentProduct.id,
          name: currentProduct.name,
          sku: currentProduct.sku || '',
          barcode: currentProduct.barcode || '',
          unit: currentProduct.unit || 'পিস',
          unitCost,
          qty,
          total: qty * unitCost
        }
      ]);
    }

    playButtonClick();
    setReturnQty('1');
    setSelectedProductId('');
  };

  const handleRemoveItem = (productId) => {
    playButtonClick();
    setReturnItems(prev => prev.filter(it => it.productId !== productId));
  };

  const totalReturnAmount = useMemo(() => {
    return returnItems.reduce((sum, it) => sum + (it.total || 0), 0);
  }, [returnItems]);

  const handleSubmitReturn = async (e) => {
    e?.preventDefault();
    if (!currentSupplier) {
      showToast(lang === 'bn' ? 'সাপ্লায়ার নির্বাচন করুন' : 'Select supplier', 'warning');
      return;
    }
    if (returnItems.length === 0) {
      showToast(lang === 'bn' ? 'কমপক্ষে একটি পণ্য তালিকায় যোগ করুন' : 'Add at least one item', 'warning');
      return;
    }

    playButtonClick();
    hapticFeedback.medium();

    const debitNoteData = {
      debitNoteNo,
      supplierId: currentSupplier.id,
      supplierName: currentSupplier.name,
      supplierPhone: currentSupplier.phone || '',
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      items: returnItems,
      totalAmount: totalReturnAmount,
      adjustmentType,
      reason: returnReason,
      notes
    };

    if (typeof onConfirmPurchaseReturn === 'function') {
      await onConfirmPurchaseReturn(debitNoteData);
    }

    playSuccessChime();
    setCompletedDebitNote(debitNoteData);
    showToast(
      lang === 'bn'
        ? `✓ ডেবিট নোট #${debitNoteNo} সফলভাবে তৈরি ও স্টক হ্রাস করা হয়েছে!`
        : `✓ Debit Note #${debitNoteNo} created successfully!`,
      'success'
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        className="glass-card animate-scale-up"
        style={{
          width: '100%',
          maxWidth: completedDebitNote ? '650px' : '900px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-primary, #ffffff)',
          color: 'var(--text-main, #0f172a)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1.5px solid var(--border-color, #e2e8f0)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(245, 158, 11, 0.08))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #ef4444, #f59e0b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}
            >
              <RotateCcw size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800' }}>
                {completedDebitNote
                  ? (lang === 'bn' ? '📄 ডেবিট নোট / ক্রয় ফেরত ভাউচার' : '📄 Debit Note Voucher')
                  : (lang === 'bn' ? 'সাপ্লায়ার ক্রয় ফেরত ও ডেবিট নোট (Purchase Return)' : 'Supplier Purchase Return & Debit Note')}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'মহাজনের কাছে পণ্য ফেরত পাঠিয়ে দেনা হ্রাস করুন' : 'Return goods to supplier and reduce payable due'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* COMPLETED DEBIT NOTE VOUCHER PRINT VIEW */}
        {completedDebitNote ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
            <div
              id="printable-debit-note"
              style={{
                background: '#ffffff',
                color: '#0f172a',
                padding: '24px',
                borderRadius: '12px',
                border: '2px solid #cbd5e1'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#dc2626' }}>
                    {lang === 'bn' ? 'ডেবিট নোট (DEBIT NOTE)' : 'DEBIT NOTE'}
                  </h2>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>
                    {lang === 'bn' ? 'পণ্য ক্রয় ফেরত ও দেনা সমন্বয় চালান' : 'Goods Purchase Return & Adjustment Voucher'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1rem', fontWeight: '800', fontFamily: 'monospace' }}>#{completedDebitNote.debitNoteNo}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>তারিখ: {completedDebitNote.date}</div>
                </div>
              </div>

              {/* Supplier Info */}
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', display: 'block' }}>মহাজন / সরবরাহকারী:</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: '800' }}>{completedDebitNote.supplierName}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', display: 'block' }}>ফেরতের কারণ:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#ea580c' }}>{completedDebitNote.reason}</span>
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '16px' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#ffffff', textAlign: 'left' }}>
                    <th style={{ padding: '6px 8px' }}>#</th>
                    <th style={{ padding: '6px 8px' }}>ফেরতকৃত পণ্যের বিবরণ</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>পরিমাণ</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>ক্রয়দর (৳)</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>মোট (৳)</th>
                  </tr>
                </thead>
                <tbody>
                  {completedDebitNote.items.map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '6px 8px', color: '#64748b' }}>{idx + 1}</td>
                      <td style={{ padding: '6px 8px', fontWeight: '700' }}>{it.name}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: '700' }}>{it.qty} {it.unit}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace' }}>৳{it.unitCost.toLocaleString()}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '800', fontFamily: 'monospace' }}>৳{it.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total & Adjustment */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                <div style={{ width: '250px', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569' }}>
                    <span>মোট ফেরত মূল্য:</span>
                    <span style={{ fontWeight: '800', fontFamily: 'monospace' }}>৳{completedDebitNote.totalAmount.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: '800', color: '#dc2626', borderTop: '1px dashed #cbd5e1', marginTop: '6px', paddingTop: '6px' }}>
                    <span>দেনা সমন্বয়:</span>
                    <span style={{ fontFamily: 'monospace' }}>- ৳{completedDebitNote.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', paddingTop: '10px', borderTop: '1px dotted #cbd5e1' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ borderTop: '1px solid #475569', width: '120px', paddingTop: '4px', fontSize: '0.75rem', color: '#475569' }}>
                    দোকান প্রতিনিধির স্বাক্ষর
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ borderTop: '1px solid #475569', width: '120px', paddingTop: '4px', fontSize: '0.75rem', color: '#475569' }}>
                    মহাজনের স্বাক্ষর / সিল
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                type="button"
                onClick={handlePrint}
                className="btn btn-primary"
                style={{ padding: '8px 18px', borderRadius: '8px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Printer size={16} />
                <span>{lang === 'bn' ? 'ভাউচার প্রিন্ট করুন' : 'Print Voucher'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{ padding: '8px 18px', borderRadius: '8px', fontWeight: '700' }}
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        ) : (
          /* RETURN CREATION FORM */
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
            {/* Supplier & Debit Note Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', marginBottom: '4px' }}>
                  🏢 মহাজন / সরবরাহকারী নির্বাচন করুন:
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={e => setSelectedSupplierId(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700' }}
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} (বর্তমান পাওনা: ৳{(Number(s.payableBalance) || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', marginBottom: '4px' }}>
                  📄 ডেবিট নোট নম্বর:
                </label>
                <input
                  type="text"
                  value={debitNoteNo}
                  onChange={e => setDebitNoteNo(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: '700' }}
                />
              </div>
            </div>

            {/* Add Products to Return Container */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                marginBottom: '1rem'
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px' }}>
                ➕ ফেরতযোগ্য পণ্য তালিকায় যোগ করুন:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '8px', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '2px' }}>পণ্য বাছাই করুন:</label>
                  <select
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', fontSize: '0.82rem' }}
                  >
                    <option value="">-- পণ্য নির্বাচন --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (মজুদ: {p.stock} {p.unit || 'পিস'} | কেনা দর: ৳{p.costPrice || 0})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '2px' }}>ফেরত সংখ্যা:</label>
                  <input
                    type="number"
                    min="1"
                    value={returnQty}
                    onChange={e => setReturnQty(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '800', textAlign: 'center' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '2px' }}>ক্রয়দর (৳):</label>
                  <input
                    type="text"
                    disabled
                    value={currentProduct ? `৳${Number(currentProduct.costPrice || currentProduct.sellPrice || 0).toLocaleString()}` : '৳০'}
                    className="input-field"
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '700', background: 'rgba(0,0,0,0.05)' }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="btn btn-primary"
                  style={{ padding: '7px 14px', borderRadius: '6px', fontWeight: '700', fontSize: '0.82rem', height: '34px' }}
                >
                  <Plus size={16} /> যোগ
                </button>
              </div>
            </div>

            {/* Return Items Table */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden', marginBottom: '1rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '8px 10px' }}>পণ্য</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>ফেরত পরিমাণ</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>ক্রয়দর</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>মোট টাকা</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {returnItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        ফেরতের জন্য কোনো পণ্য যোগ করা হয়নি। উপরের বক্স থেকে নির্বাচন করে যোগ করুন।
                      </td>
                    </tr>
                  ) : (
                    returnItems.map(it => (
                      <tr key={it.productId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '8px 10px', fontWeight: '700' }}>{it.name}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '800' }}>{it.qty} {it.unit}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>৳{it.unitCost.toLocaleString()}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#ef4444' }}>৳{it.total.toLocaleString()}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(it.productId)}
                            className="btn-icon"
                            style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Reasons and Adjustment Options */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', marginBottom: '4px' }}>
                  ফেরতের কারণ:
                </label>
                <select
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', fontSize: '0.82rem' }}
                >
                  <option value="মেয়াদোত্তীর্ণ বা নষ্ট পণ্য">মেয়াদোত্তীর্ণ বা নষ্ট পণ্য (Expired / Damaged)</option>
                  <option value="ত্রুটিপূর্ণ প্যাকেজিং">ত্রুটিপূর্ণ প্যাকেজিং (Defective Packaging)</option>
                  <option value="ভুল পণ্য সরবরাহ">ভুল পণ্য সরবরাহ (Wrong Item Delivered)</option>
                  <option value="চাহিদা না থাকায় চুক্তি অনুযায়ী ফেরত">চাহিদা না থাকায় চুক্তি অনুযায়ী ফেরত (Unsold Return)</option>
                  <option value="অন্যান্য কারণ">অন্যান্য কারণ (Other)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', marginBottom: '4px' }}>
                  টাকা সমন্বয় পদ্ধতি:
                </label>
                <select
                  value={adjustmentType}
                  onChange={e => setAdjustmentType(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '700' }}
                >
                  <option value="deduct_due">পাওনাদার দেনা থেকে কর্তন (Deduct from Payable Due)</option>
                  <option value="cash_refund">মহাজনের কাছ থেকে নগদ ফেরত গ্রহণ (Cash Refund)</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '10px',
                borderTop: '1px solid var(--border-color)'
              }}
            >
              <div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>মোট ফেরত মূল্য:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ef4444', fontFamily: 'var(--font-mono)', marginLeft: '6px' }}>
                  ৳{totalReturnAmount.toLocaleString()}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: '700' }}
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={returnItems.length === 0}
                  onClick={handleSubmitReturn}
                  className="btn btn-primary"
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #ef4444, #f59e0b)',
                    opacity: returnItems.length === 0 ? 0.6 : 1,
                    cursor: returnItems.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  ✓ ডেবিট নোট ইস্যু ও স্টক হ্রাস করুন
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
