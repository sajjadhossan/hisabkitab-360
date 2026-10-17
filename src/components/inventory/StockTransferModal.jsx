import React, { useState } from 'react';
import {
  Truck,
  ArrowRight,
  Package,
  Plus,
  Trash2,
  CheckCircle2,
  Printer,
  X,
  Building2,
  Calendar,
  FileText,
  User,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { soundService } from '../../services/soundService';

export const StockTransferModal = ({
  isOpen,
  onClose,
  products = [],
  branches = [],
  onConfirmTransfer,
  lang = 'bn'
}) => {
  const [fromBranch, setFromBranch] = useState('main');
  const [toBranch, setToBranch] = useState(branches[1]?.id || 'branch_2');
  const [challanNo, setChallanNo] = useState(() => `CHL-${Date.now().toString().slice(-6)}`);
  const [driverName, setDriverName] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [qtyInput, setQtyInput] = useState('1');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!selectedProductId || !qtyInput || Number(qtyInput) <= 0) return;

    const prod = products.find((p) => String(p.id) === String(selectedProductId));
    if (!prod) return;

    const qty = Number(qtyInput);
    if (qty > (Number(prod.stock) || 0)) {
      soundService.playWarningTone();
      alert(lang === 'bn' ? `পর্যাপ্ত স্টক নেই! উপলব্ধ স্টক: ${prod.stock} ${prod.unit || 'পিস'}` : `Not enough stock available! Max: ${prod.stock}`);
      return;
    }

    const existingIdx = items.findIndex((it) => it.productId === prod.id);
    if (existingIdx >= 0) {
      const updated = [...items];
      updated[existingIdx].qty += qty;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          productId: prod.id,
          name: prod.name,
          unit: prod.unit || 'পিস',
          availableStock: Number(prod.stock) || 0,
          costPrice: Number(prod.costPrice) || 0,
          qty
        }
      ]);
    }

    soundService.playBeep();
    setSelectedProductId('');
    setQtyInput('1');
  };

  const handleRemoveItem = (index) => {
    soundService.playDeleteTone();
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleCompleteTransfer = () => {
    if (items.length === 0) {
      soundService.playWarningTone();
      alert(lang === 'bn' ? 'অনুগ্রহ করে অন্তত একটি পণ্য যোগ করুন' : 'Please add at least one product');
      return;
    }

    if (fromBranch === toBranch) {
      soundService.playWarningTone();
      alert(lang === 'bn' ? 'উৎস ও গন্তব্য শাখা একই হতে পারে না!' : 'Source and destination branches cannot be the same');
      return;
    }

    soundService.playSuccessChime();
    if (onConfirmTransfer) {
      onConfirmTransfer({
        challanNo,
        fromBranch,
        toBranch,
        driverName: driverName.trim(),
        vehicleNo: vehicleNo.trim(),
        transferDate,
        items,
        notes: notes.trim(),
        totalItemsCount: items.reduce((sum, i) => sum + i.qty, 0),
        status: 'in_transit'
      });
    }
    onClose();
  };

  const availableProducts = products.filter((p) => (Number(p.stock) || 0) > 0);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '740px',
          background: 'var(--color-bg-card, #0f172a)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.18), rgba(99, 102, 241, 0.1))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
              }}
            >
              <Truck size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                {lang === 'bn' ? 'আন্তঃশাখা স্টক ট্রান্সফার চালান' : 'Inter-Branch Stock Transfer'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                {lang === 'bn' ? 'প্রধান শোরুম থেকে শাখা বা ভ্যানে মাল পাঠানো ও গেটপাস' : 'Transfer inventory between stores with gate pass'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Branch Transfer Route Box */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                {lang === 'bn' ? 'উৎস শাখা (From)' : 'Origin Branch'}
              </label>
              <select
                value={fromBranch}
                onChange={(e) => setFromBranch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}
              >
                <option value="main">🏢 {lang === 'bn' ? 'প্রধান শোরুম / ওয়্যারহাউজ' : 'Main Warehouse'}</option>
                {branches.filter((b) => b.id !== 'main').map((b) => (
                  <option key={b.id} value={b.id}>🏢 {b.name}</option>
                ))}
              </select>
            </div>

            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(2, 132, 199, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
              <ArrowRight size={18} />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                {lang === 'bn' ? 'গন্তব্য শাখা / ভ্যান (To)' : 'Destination Branch / Van'}
              </label>
              <select
                value={toBranch}
                onChange={(e) => setToBranch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}
              >
                {branches.length > 0 ? (
                  branches.map((b) => (
                    <option key={b.id} value={b.id}>🏬 {b.name}</option>
                  ))
                ) : (
                  <>
                    <option value="branch_2">🏬 {lang === 'bn' ? 'ধানমন্ডি শাখা' : 'Dhanmondi Branch'}</option>
                    <option value="mobile_van">🚐 {lang === 'bn' ? 'সেলস ডেলিভারি ভ্যান' : 'Sales Van'}</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Logistics & Driver Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                {lang === 'bn' ? 'চালান নম্বর' : 'Challan #'}
              </label>
              <input
                type="text"
                value={challanNo}
                onChange={(e) => setChallanNo(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                {lang === 'bn' ? 'ড্রাইভার / বহনকারী' : 'Driver / Carrier'}
              </label>
              <input
                type="text"
                placeholder={lang === 'bn' ? 'যেমন: রহিম মিয়া' : 'Driver Name'}
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                {lang === 'bn' ? 'গাড়ি / রিকশা নং' : 'Vehicle / Truck #'}
              </label>
              <input
                type="text"
                placeholder={lang === 'bn' ? 'যেমন: ঢাকা মেট্রো-ট-১২৩৪' : 'Vehicle #'}
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Add Product Line Strip */}
          <form onSubmit={handleAddItem} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '8px', alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                {lang === 'bn' ? 'স্থানান্তরের পণ্য বাছাই করুন' : 'Select Product'}
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.82rem' }}
              >
                <option value="">{lang === 'bn' ? '-- পণ্য নির্বাচন করুন --' : '-- Choose Product --'}</option>
                {availableProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (স্টক: {p.stock} {p.unit || 'পিস'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                {lang === 'bn' ? 'পরিমাণ (Qty)' : 'Transfer Qty'}
              </label>
              <input
                type="number"
                min="1"
                value={qtyInput}
                onChange={(e) => setQtyInput(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                background: '#0284c7',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Plus size={15} />
              <span>{lang === 'bn' ? 'যোগ' : 'Add'}</span>
            </button>
          </form>

          {/* Transfer Items Table */}
          <div style={{ borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.04)', color: '#94a3b8', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <th style={{ padding: '8px 12px' }}>{lang === 'bn' ? 'পণ্যের নাম' : 'Product'}</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>{lang === 'bn' ? 'বর্তমান স্টক' : 'Current Stock'}</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>{lang === 'bn' ? 'প্রেরণ পরিমাণ' : 'Transfer Qty'}</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#f8fafc' }}>{it.name}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', color: '#94a3b8' }}>
                      {it.availableStock} {it.unit}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 800, color: '#38bdf8' }}>
                      {it.qty} {it.unit}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                      {lang === 'bn' ? 'চালানে কোনো পণ্য যোগ করা হয়নি' : 'No items added to challan'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.25)'
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            {lang === 'bn' ? `মোট পণ্য: ${items.length}টি | পরিমাণ: ${items.reduce((s, i) => s + i.qty, 0)}টি` : `Total Items: ${items.length}`}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'transparent',
                color: '#94a3b8',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handleCompleteTransfer}
              style={{
                padding: '9px 20px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
              }}
            >
              <ShieldCheck size={16} />
              <span>{lang === 'bn' ? 'চালান ইস্যু ও প্রেরণ করুন' : 'Issue Challan & Dispatch'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default StockTransferModal;
