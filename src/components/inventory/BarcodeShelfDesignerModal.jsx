import React, { useState } from 'react';
import {
  Printer,
  Barcode,
  QrCode,
  Tag,
  Check,
  X,
  Layers,
  Sparkles,
  Sliders,
  DollarSign,
  Maximize2
} from 'lucide-react';
import { soundService } from '../../services/soundService';

export const LABEL_SIZES = [
  { id: '38x25', label: '৩৮ × ২৫ মিমি (ছোট স্টিকার)', width: '38mm', height: '25mm' },
  { id: '50x30', label: '৫০ × ৩০ মিমি (স্ট্যান্ডার্ড থার্মাল)', width: '50mm', height: '30mm' },
  { id: '58x40', label: '৫৮ × ৪০ মিমি (বড় প্রোডাক্ট স্টিকার)', width: '58mm', height: '40mm' },
  { id: 'shelf_talker', label: '১০০ × ৬০ মিমি (শেলফ টকার / তাকের মূল্য ট্যাগ)', width: '100mm', height: '60mm' }
];

export const BarcodeShelfDesignerModal = ({
  isOpen,
  onClose,
  products = [],
  initialProduct = null,
  businessSettings = {},
  lang = 'bn'
}) => {
  const [selectedProduct, setSelectedProduct] = useState(initialProduct || products[0] || null);
  const [labelSize, setLabelSize] = useState('50x30');
  const [copies, setCopies] = useState(1);
  const [showStoreName, setShowStoreName] = useState(true);
  const [showBarcode, setShowBarcode] = useState(true);
  const [showQrCode, setShowQrCode] = useState(false);
  const [showExpiry, setShowExpiry] = useState(true);
  const [showSavingsBadge, setShowSavingsBadge] = useState(true);

  if (!isOpen) return null;

  const currentSizeObj = LABEL_SIZES.find((s) => s.id === labelSize) || LABEL_SIZES[1];
  const prod = selectedProduct || {
    name: 'পণ্য নির্বাচন করুন',
    barcode: '8941234567890',
    sellPrice: 120,
    costPrice: 100,
    unit: 'পিস'
  };

  const storeName = businessSettings?.companyName || 'হিসাবকিতাব ৩৬০';

  const handlePrint = () => {
    soundService.playSuccessChime();
    window.print();
  };

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
          maxWidth: '780px',
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
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(99, 102, 241, 0.1))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
              }}
            >
              <Barcode size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                {lang === 'bn' ? 'বারকোড ও সেলফ প্রাইস ট্যাগ স্টুডিও' : 'Barcode & Shelf Label Studio'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                {lang === 'bn' ? 'থার্মাল প্রিন্টার ও সুপারশপের তাকের জন্য আকর্ষণীয় প্রাইস ট্যাগ তৈরি' : 'Custom thermal stickers & supermarket shelf talkers'}
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

        {/* Body Split */}
        <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '20px' }}>
          {/* Controls Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Product Selector */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px', display: 'block' }}>
                {lang === 'bn' ? 'পণ্য নির্বাচন করুন' : 'Select Product'}
              </label>
              <select
                value={selectedProduct?.id || ''}
                onChange={(e) => {
                  const found = products.find((p) => String(p.id) === e.target.value);
                  if (found) setSelectedProduct(found);
                  soundService.playBeep();
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  fontSize: '0.85rem'
                }}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (৳{p.sellPrice})
                  </option>
                ))}
              </select>
            </div>

            {/* Label Size Presets */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px', display: 'block' }}>
                {lang === 'bn' ? 'লেবেল সাইজ নির্বাচন' : 'Label Dimensions'}
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {LABEL_SIZES.map((sz) => {
                  const isSelected = labelSize === sz.id;
                  return (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => {
                        setLabelSize(sz.id);
                        soundService.playBeep();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: isSelected ? '1.5px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                        background: isSelected ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        color: isSelected ? '#fef08a' : '#94a3b8',
                        fontSize: '0.8rem',
                        fontWeight: isSelected ? 800 : 500,
                        cursor: 'pointer'
                      }}
                    >
                      <span>{sz.label}</span>
                      {isSelected && <Check size={14} color="#f59e0b" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Element Toggles */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px', display: 'block' }}>
                {lang === 'bn' ? 'উপাদান কাস্টমাইজেশন' : 'Label Elements'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {[
                  { label: 'দোকানের নাম', checked: showStoreName, toggle: () => setShowStoreName(!showStoreName) },
                  { label: 'বারকোড লাইন', checked: showBarcode, toggle: () => setShowBarcode(!showBarcode) },
                  { label: 'QR কোড মোড', checked: showQrCode, toggle: () => setShowQrCode(!showQrCode) },
                  { label: 'মেয়াদ তারিখ', checked: showExpiry, toggle: () => setShowExpiry(!showExpiry) }
                ].map((item, idx) => (
                  <label
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      fontSize: '0.78rem',
                      color: item.checked ? '#fff' : '#64748b',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={item.toggle}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Print Quantity */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px', display: 'block' }}>
                {lang === 'bn' ? 'প্রিন্ট সংখ্যা (Copies)' : 'Print Quantity'}
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={copies}
                onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value, 10) || 1))}
                style={{
                  width: '100px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '0.85rem'
                }}
              />
            </div>
          </div>

          {/* Live Label Canvas Preview Column */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '8px', fontWeight: 700 }}>
              {lang === 'bn' ? 'লাইভ প্রিভিউ (সরাসরি প্রিন্ট ফরম্যাট)' : 'Live Print Preview'}
            </div>

            {/* Simulated Sticker Label */}
            <div
              id="printable-shelf-label"
              style={{
                width: labelSize === 'shelf_talker' ? '300px' : '230px',
                minHeight: labelSize === 'shelf_talker' ? '180px' : '130px',
                background: '#ffffff',
                color: '#000000',
                borderRadius: '8px',
                padding: '12px 14px',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                fontFamily: "'Hind Siliguri', 'Inter', sans-serif",
                border: '1px dashed #cbd5e1',
                boxSizing: 'border-box'
              }}
            >
              {/* Label Top: Store Name & Unit */}
              <div>
                {showStoreName && (
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#475569', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px', marginBottom: '4px' }}>
                    {storeName}
                  </div>
                )}
                <div style={{ fontSize: labelSize === 'shelf_talker' ? '1rem' : '0.85rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>
                  {prod.name}
                </div>
              </div>

              {/* Price Display */}
              <div style={{ margin: '6px 0', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>MRP: </span>
                  <span style={{ fontSize: labelSize === 'shelf_talker' ? '1.8rem' : '1.35rem', fontWeight: 900, color: '#0284c7', fontFamily: 'monospace' }}>
                    ৳{prod.sellPrice}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#64748b' }}> /{prod.unit || 'পিস'}</span>
                </div>

                {labelSize === 'shelf_talker' && showSavingsBadge && (
                  <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                    সেরা দাম
                  </span>
                )}
              </div>

              {/* Barcode & Expiry Bottom Strip */}
              <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {showBarcode && (
                  <div>
                    {/* Simulated SVG Barcode Bars */}
                    <div style={{ display: 'flex', gap: '2px', height: '22px', alignItems: 'center' }}>
                      {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 2, 3, 1, 4, 2, 1, 3, 2].map((w, i) => (
                        <span key={i} style={{ width: `${w}px`, height: '100%', background: '#000000', display: 'inline-block' }} />
                      ))}
                    </div>
                    <div style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: '#334155', letterSpacing: '1px' }}>
                      {prod.barcode || '894123456789'}
                    </div>
                  </div>
                )}

                {showExpiry && prod.expiryDate && (
                  <div style={{ fontSize: '0.62rem', color: '#64748b', textAlign: 'right' }}>
                    মেয়াদ: {prod.expiryDate}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
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
            {copies}টি স্টিকার প্রস্তুত হবে ({currentSizeObj.label})
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
              onClick={handlePrint}
              style={{
                padding: '9px 20px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#000000',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
              }}
            >
              <Printer size={16} />
              <span>{lang === 'bn' ? 'প্রিন্ট করুন' : 'Print Sticker'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default BarcodeShelfDesignerModal;
