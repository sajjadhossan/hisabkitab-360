import React, { useState } from 'react';
import { X, Pill, Calculator, ShoppingCart, Check, HeartPulse, Search, Calendar } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

/**
 * PharmacyUnitModal
 * -----------------
 * Pharmacy Strip-to-Tablet Fraction Converter & Batch/Expiry Calculator:
 * - 1 Strip (পাতা) = 10, 12, 14 or 15 Tablets (পিস)
 * - Enter Strips OR Loose Tablets ➔ Exact fractional price & stock deduction
 * - Generic name reference
 * - Batch No & FEFO Expiry Date
 * - Pushes to POS Cart!
 */
export const PharmacyUnitModal = ({ isOpen, onClose }) => {
  const { addToCart, showToast } = useApp();

  const [medicineName, setMedicineName] = useState('Napa Extra 500mg+65mg');
  const [genericName, setGenericName] = useState('Paracetamol + Caffeine');
  const [tabletsPerStrip, setTabletsPerStrip] = useState('10');
  const [stripSellPrice, setStripSellPrice] = useState('30');
  const [batchNo, setBatchNo] = useState('B24-890');
  const [expiryDate, setExpiryDate] = useState('2027-12-31');

  // Input Type: 'strip' | 'loose'
  const [inputType, setInputType] = useState('loose');
  const [stripQty, setStripQty] = useState('1');
  const [looseQty, setLooseQty] = useState('4');

  if (!isOpen) return null;

  const perStrip = parseInt(tabletsPerStrip) || 10;
  const stripPrice = parseFloat(stripSellPrice) || 30;
  const pricePerTablet = stripPrice / perStrip;

  let totalTablets = 0;
  let totalCost = 0;

  if (inputType === 'strip') {
    const s = parseFloat(stripQty) || 0;
    totalTablets = s * perStrip;
    totalCost = Math.round(s * stripPrice);
  } else {
    const l = parseFloat(looseQty) || 0;
    totalTablets = l;
    totalCost = Math.round(l * pricePerTablet);
  }

  const handleAddToCart = () => {
    if (totalCost <= 0) {
      if (showToast) showToast('অনুগ্রহ করে সঠিক পরিমাণ লিখুন', 'error');
      return;
    }

    const unitText = inputType === 'strip' ? `${stripQty} পাতা (${totalTablets} পিস)` : `${looseQty} পিস ট্যাবলেট`;

    const pharmaProduct = {
      id: `med_${Date.now()}`,
      name: `${medicineName} (${unitText})`,
      category: 'ফার্মেসি ও ওষুধ',
      costPrice: Math.round(totalCost * 0.8),
      sellPrice: totalCost,
      unit: inputType === 'strip' ? 'পাতা' : 'পিস',
      stock: 500,
      isPharmaItem: true,
      pharmaDetails: {
        medicineName,
        genericName,
        batchNo,
        expiryDate,
        totalTablets,
        tabletsPerStrip: perStrip,
        soldType: inputType
      }
    };

    addToCart(pharmaProduct);
    if (showToast) {
      showToast(`💊 ${medicineName} কার্টে যুক্ত হয়েছে (৳${totalCost.toLocaleString()})`, 'success');
    }
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content glass-card" style={{ maxWidth: '560px', width: '95%', padding: '1.25rem', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <Pill size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                ফার্মেসি পাতা ➔ পিস কনভার্টার
              </h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                খুচরা ট্যাবলেট বিক্রি, ব্যাচ ও এক্সপায়ারি ট্র্যাকার
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Medicine Name & Generic */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              ওষুধের নাম (Brand Name):
            </label>
            <input
              type="text"
              className="input-field"
              value={medicineName}
              onChange={(e) => setMedicineName(e.target.value)}
              placeholder="যেমন: Napa Extra, Seclo..."
            />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              জেনেরিক নাম (Generic Group):
            </label>
            <input
              type="text"
              className="input-field"
              value={genericName}
              onChange={(e) => setGenericName(e.target.value)}
              placeholder="যেমন: Paracetamol..."
            />
          </div>
        </div>

        {/* Packing & Price */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              ১ পাতায় কয়টি ট্যাবলেট থাকে?
            </label>
            <select
              className="input-field"
              value={tabletsPerStrip}
              onChange={(e) => setTabletsPerStrip(e.target.value)}
              style={{ fontWeight: '800' }}
            >
              <option value="10">১০ পিস (স্ট্যান্ডার্ড)</option>
              <option value="12">১২ পিস</option>
              <option value="14">১৪ পিস</option>
              <option value="15">১৫ পিস</option>
              <option value="20">২০ পিস</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              ১ পাতার বিক্রয়মূল্য (৳):
            </label>
            <input
              type="number"
              className="input-field"
              value={stripSellPrice}
              onChange={(e) => setStripSellPrice(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', color: '#ef4444' }}
            />
          </div>
        </div>

        {/* Sale Mode Selector */}
        <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-main)' }}>
              গ্রাহক কীভাবে নিচ্ছেন?
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setInputType('loose')}
                style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  border: 'none',
                  background: inputType === 'loose' ? '#ef4444' : 'rgba(255,255,255,0.06)',
                  color: inputType === 'loose' ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                খুচরা পিস (Loose)
              </button>
              <button
                type="button"
                onClick={() => setInputType('strip')}
                style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  border: 'none',
                  background: inputType === 'strip' ? '#ef4444' : 'rgba(255,255,255,0.06)',
                  color: inputType === 'strip' ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                পুরো পাতা (Full Strip)
              </button>
            </div>
          </div>

          {inputType === 'loose' ? (
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                কয়টি ট্যাবলেট দিচ্ছেন? (প্রতি পিস ৳{pricePerTablet.toFixed(2)})
              </label>
              <input
                type="number"
                min="1"
                className="input-field"
                value={looseQty}
                onChange={(e) => setLooseQty(e.target.value)}
                style={{ fontSize: '1.15rem', fontWeight: '800', textAlign: 'center' }}
              />
            </div>
          ) : (
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                কয় পাতা দিচ্ছেন?
              </label>
              <input
                type="number"
                min="1"
                className="input-field"
                value={stripQty}
                onChange={(e) => setStripQty(e.target.value)}
                style={{ fontSize: '1.15rem', fontWeight: '800', textAlign: 'center' }}
              />
            </div>
          )}
        </div>

        {/* Batch & Expiry */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              ব্যাচ নম্বর (Batch No):
            </label>
            <input
              type="text"
              className="input-field"
              value={batchNo}
              onChange={(e) => setBatchNo(e.target.value)}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              মেয়াদ (Expiry Date):
            </label>
            <input
              type="date"
              className="input-field"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>
        </div>

        {/* Live HUD */}
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '10px 12px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              মোট ট্যাবলেট: <strong style={{ color: '#ef4444' }}>{totalTablets} পিস</strong>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              প্রতি পিস: ৳{pricePerTablet.toFixed(2)} | ব্যাচ: {batchNo}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>মোট বিক্রয়মূল্য:</div>
            <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#ef4444', fontFamily: 'var(--font-mono)' }}>
              ৳{totalCost.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleAddToCart}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '0.95rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            borderRadius: '10px',
            cursor: 'pointer'
          }}
        >
          <ShoppingCart size={18} />
          <span>কার্টে যুক্ত করুন (৳{totalCost.toLocaleString()})</span>
        </button>
      </div>
    </div>
  );
};
