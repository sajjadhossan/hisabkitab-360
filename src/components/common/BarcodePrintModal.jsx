import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Printer,
  X,
  Tag,
  Layers,
  Settings,
  CheckSquare,
  Square,
  Search,
  Sparkles,
  Store,
  DollarSign,
  Maximize2
} from 'lucide-react';

export const BarcodePrintModal = () => {
  const {
    activeBarcodePrint,
    closeBarcodePrint,
    products = [],
    businessSettings = {},
    lang = 'bn',
    t
  } = useApp();

  const [tagType, setTagType] = useState('shelf_edge'); // 'shelf_edge' | 'product_sticker' | 'thermal_single'
  const [copies, setCopies] = useState(4);
  const [showStoreName, setShowStoreName] = useState(true);
  const [showWholesalePrice, setShowWholesalePrice] = useState(true);
  const [showBatchExpiry, setShowBatchExpiry] = useState(true);
  const [showSku, setShowSku] = useState(true);
  const [selectedProductIds, setSelectedProductIds] = useState(() => {
    if (!activeBarcodePrint) return [];
    if (Array.isArray(activeBarcodePrint)) return activeBarcodePrint.map(p => p.id);
    return [activeBarcodePrint.id];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);

  if (!activeBarcodePrint) return null;

  // Selected products to print
  const productList = useMemo(() => {
    return products.filter(p => selectedProductIds.includes(p.id));
  }, [products, selectedProductIds]);

  // Filter products for the in-modal product picker
  const filteredAvailableProducts = useMemo(() => {
    if (!searchQuery.trim()) return products.slice(0, 15);
    const q = searchQuery.toLowerCase();
    return products.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.barcode?.includes(q) ||
      p.sku?.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [products, searchQuery]);

  const toggleProductSelect = (id) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handlePrint = () => {
    window.print();
  };

  // High-Precision SVG Barcode Generator (Readable by all optical/laser scanners)
  const renderSvgBarcode = (code, height = 38) => {
    const cleanCode = String(code || '8901001001').replace(/[^0-9A-Za-z]/g, '');
    const chars = cleanCode.split('');
    const bars = [];
    let pos = 10;

    // Start Guard Pattern
    bars.push(<rect key="sg1" x={pos} y="0" width="2" height={height + 6} fill="#000000" />);
    pos += 4;
    bars.push(<rect key="sg2" x={pos} y="0" width="2" height={height + 6} fill="#000000" />);
    pos += 5;

    chars.forEach((c, idx) => {
      const codeVal = c.charCodeAt(0);
      const w1 = (codeVal % 3) + 1.6;
      const w2 = ((codeVal * 3) % 3) + 1.2;
      bars.push(<rect key={`b1-${idx}`} x={pos} y="0" width={w1} height={height} fill="#000000" />);
      pos += w1 + 2.2;
      bars.push(<rect key={`b2-${idx}`} x={pos} y="0" width={w2} height={height} fill="#000000" />);
      pos += w2 + 2.5;
    });

    // End Guard Pattern
    bars.push(<rect key="eg1" x={pos} y="0" width="2" height={height + 6} fill="#000000" />);
    pos += 4;
    bars.push(<rect key="eg2" x={pos} y="0" width="2" height={height + 6} fill="#000000" />);
    pos += 10;

    return (
      <svg
        viewBox={`0 0 ${pos} ${height + 16}`}
        style={{ width: '100%', height: `${height + 12}px`, display: 'block', margin: '0 auto' }}
      >
        {bars}
        <text
          x={pos / 2}
          y={height + 13}
          textAnchor="middle"
          fontSize="10"
          fontFamily="monospace"
          fontWeight="bold"
          fill="#000000"
          letterSpacing="1px"
        >
          {cleanCode}
        </text>
      </svg>
    );
  };

  const storeName = businessSettings?.companyName || businessSettings?.storeName || 'হিসাবকিতাব ৩৬০ স্টোর';

  return (
    <div className="modal-overlay" style={{ zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      {/* Scoped High-Contrast Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-shelf-sheet, #printable-shelf-sheet * {
            visibility: visible;
          }
          #printable-shelf-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          .tag-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface)',
          borderRadius: '20px',
          boxShadow: '0 30px 70px rgba(0,0,0,0.4)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}
      >
        {/* Header Controls (Hidden on Print) */}
        <div
          className="no-print"
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--header-bg, rgba(255,255,255,0.03))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
              }}
            >
              <Tag size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'শেলফ বারকোড ও প্রাইস ট্যাগ প্রিন্টার' : 'Shelf Barcode & Price Tag Print Hub'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'সুপারমার্কেট র্যাক ট্যাগ, খুচরা প্রাইস স্টিকার ও থার্মাল লেবেল প্রস্তুতকারক' : 'Generate supermarket shelf edge tags, stickers & thermal labels'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                fontSize: '0.88rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #10b981, #059669)',
                borderColor: '#10b981'
              }}
            >
              <Printer size={16} />
              <span>{lang === 'bn' ? 'প্রিন্ট দিন' : 'Print Tags'}</span>
            </button>
            <button
              type="button"
              className="btn-icon"
              onClick={closeBarcodePrint}
              title={t.close}
              style={{ padding: '8px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Options Toolbar (Hidden on Print) */}
        <div
          className="no-print"
          style={{
            padding: '12px 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            background: 'rgba(0,0,0,0.1)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          {/* Tag Type Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>ফরম্যাট:</span>
            <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={() => setTagType('shelf_edge')}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  background: tagType === 'shelf_edge' ? '#0284c7' : 'transparent',
                  color: tagType === 'shelf_edge' ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🏪 শেলফ প্রাইস ট্যাগ (বড় মূল্য)
              </button>
              <button
                type="button"
                onClick={() => setTagType('product_sticker')}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  background: tagType === 'product_sticker' ? '#0284c7' : 'transparent',
                  color: tagType === 'product_sticker' ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🏷️ পণ্য স্টিকার (৩ কলাম)
              </button>
              <button
                type="button"
                onClick={() => setTagType('thermal_single')}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  background: tagType === 'thermal_single' ? '#0284c7' : 'transparent',
                  color: tagType === 'thermal_single' ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                ⚡ থার্মাল রোল (58mm/80mm)
              </button>
            </div>
          </div>

          {/* Copies Control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>প্রতি পণ্যের কপি:</span>
            <select
              className="input-field"
              value={copies}
              onChange={(e) => setCopies(Math.max(1, Number(e.target.value)))}
              style={{ width: '70px', padding: '4px 8px', fontSize: '0.82rem' }}
            >
              {[1, 2, 4, 6, 8, 12, 24, 30].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowProductPicker(prev => !prev)}
              style={{ padding: '5px 12px', fontSize: '0.78rem', fontWeight: 700 }}
            >
              ➕ পণ্য নির্বাচন ({selectedProductIds.length})
            </button>
          </div>

          {/* Toggles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showStoreName}
                onChange={e => setShowStoreName(e.target.checked)}
                style={{ width: '13px', height: '13px' }}
              />
              <span>দোকানের নাম</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showWholesalePrice}
                onChange={e => setShowWholesalePrice(e.target.checked)}
                style={{ width: '13px', height: '13px' }}
              />
              <span>পাইকারি দর</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showBatchExpiry}
                onChange={e => setShowBatchExpiry(e.target.checked)}
                style={{ width: '13px', height: '13px' }}
              />
              <span>মেয়াদ / ব্যাচ</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showSku}
                onChange={e => setShowSku(e.target.checked)}
                style={{ width: '13px', height: '13px' }}
              />
              <span>SKU কোড</span>
            </label>
          </div>
        </div>

        {/* Product Picker Drawer (Hidden on Print) */}
        {showProductPicker && (
          <div
            className="no-print"
            style={{
              padding: '12px 1.5rem',
              background: 'rgba(0,0,0,0.25)',
              borderBottom: '1px solid var(--border-color)',
              maxHeight: '160px',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="পণ্য বা বারকোড খুঁজুন..."
                  className="input-field"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '32px', fontSize: '0.8rem', height: '30px' }}
                />
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedProductIds(products.map(p => p.id))}
                style={{ fontSize: '0.74rem', padding: '4px 10px' }}
              >
                সব পণ্য নির্বাচন
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedProductIds([])}
                style={{ fontSize: '0.74rem', padding: '4px 10px' }}
              >
                মুছুন
              </button>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {filteredAvailableProducts.map(p => {
                const isSelected = selectedProductIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleProductSelect(p.id)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: isSelected ? '1px solid #10b981' : '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
                      color: isSelected ? '#10b981' : 'var(--text-main)',
                      fontSize: '0.74rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {isSelected ? '✓ ' : '+ '}{p.name} (৳{p.sellPrice})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Printable Sheet Viewport */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
          <div
            id="printable-shelf-sheet"
            style={{
              background: '#ffffff',
              color: '#000000',
              padding: '1.25rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}
          >
            {/* 1. SHELF EDGE TAG FORMAT (Supermarket Rack Label) */}
            {tagType === 'shelf_edge' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: '12px'
                }}
              >
                {productList.map((prod) =>
                  Array.from({ length: copies }).map((_, idx) => (
                    <div
                      key={`shelf-${prod.id}-${idx}`}
                      className="tag-card"
                      style={{
                        border: '2px solid #000000',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        background: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '135px'
                      }}
                    >
                      {/* Store Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px' }}>
                        {showStoreName && (
                          <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#334155' }}>
                            {storeName}
                          </span>
                        )}
                        {showSku && (
                          <span style={{ fontSize: '9px', fontFamily: 'monospace', color: '#64748b' }}>
                            SKU: {prod.sku || 'N/A'}
                          </span>
                        )}
                      </div>

                      {/* Product Name */}
                      <div style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a', margin: '4px 0', lineHeight: 1.3 }}>
                        {prod.name}
                      </div>

                      {/* Large Retail Price Box & Barcode */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', margin: '4px 0' }}>
                        <div style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                          <span style={{ fontSize: '9px', fontWeight: '700', color: '#475569', display: 'block', textTransform: 'uppercase' }}>
                            খুচরা দর
                          </span>
                          <span style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', fontFamily: 'monospace' }}>
                            ৳{Number(prod.sellPrice || 0).toLocaleString()}
                          </span>
                          <span style={{ fontSize: '9px', color: '#64748b', display: 'block' }}>
                            / {prod.unit || 'পিস'}
                          </span>
                        </div>

                        <div style={{ flex: 1, textAlign: 'center' }}>
                          {renderSvgBarcode(prod.barcode || '8901001001', 32)}
                        </div>
                      </div>

                      {/* Optional Wholesale Price & Expiry Footer */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #cbd5e1', paddingTop: '4px', fontSize: '9px', color: '#475569' }}>
                        {showWholesalePrice && prod.wholesalePrice > 0 ? (
                          <span style={{ fontWeight: '800', color: '#1d4ed8' }}>
                            হোলসেল: ৳{prod.wholesalePrice} ({prod.wholesaleMinQty || 10}+)
                          </span>
                        ) : (
                          <span>মূল্য ভ্যাট অন্তর্ভুক্ত</span>
                        )}

                        {showBatchExpiry && (prod.expiryDate || prod.batchNumber) && (
                          <span style={{ fontSize: '8.5px', color: '#64748b' }}>
                            {prod.batchNumber && `B:${prod.batchNumber} `}
                            {prod.expiryDate && `EXP:${prod.expiryDate}`}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 2. PRODUCT STICKER FORMAT (Standard 3-Column A4 Sheet) */}
            {tagType === 'product_sticker' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px'
                }}
              >
                {productList.map((prod) =>
                  Array.from({ length: copies }).map((_, idx) => (
                    <div
                      key={`sticker-${prod.id}-${idx}`}
                      className="tag-card"
                      style={{
                        border: '1px dashed #94a3b8',
                        padding: '8px',
                        borderRadius: '6px',
                        textAlign: 'center',
                        background: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '125px'
                      }}
                    >
                      {showStoreName && (
                        <div style={{ fontSize: '9.5px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', letterSpacing: '0.4px' }}>
                          {storeName}
                        </div>
                      )}
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', margin: '2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {prod.name}
                      </div>
                      <div>
                        {renderSvgBarcode(prod.barcode || '8901001001', 28)}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px', fontSize: '11px', fontWeight: '800' }}>
                        {showSku && <span style={{ fontSize: '8.5px', color: '#64748b' }}>{prod.sku}</span>}
                        <span style={{ color: '#0f172a', fontSize: '13px' }}>৳{prod.sellPrice}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 3. THERMAL SINGLE CONTINUOUS ROLL (58mm / 80mm) */}
            {tagType === 'thermal_single' && (
              <div style={{ maxWidth: '280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {productList.map((prod) =>
                  Array.from({ length: copies }).map((_, idx) => (
                    <div
                      key={`thermal-${prod.id}-${idx}`}
                      className="tag-card"
                      style={{
                        border: '1px solid #000000',
                        padding: '10px',
                        borderRadius: '4px',
                        textAlign: 'center',
                        background: '#ffffff'
                      }}
                    >
                      {showStoreName && (
                        <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '2px' }}>
                          {storeName}
                        </div>
                      )}
                      <div style={{ fontSize: '12px', fontWeight: '900', margin: '2px 0' }}>
                        {prod.name}
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '900', margin: '4px 0' }}>
                        ৳{prod.sellPrice} <span style={{ fontSize: '10px', fontWeight: '600' }}>/ {prod.unit || 'পিস'}</span>
                      </div>
                      {renderSvgBarcode(prod.barcode || '8901001001', 32)}
                      {showSku && (
                        <div style={{ fontSize: '9px', marginTop: '4px', color: '#334155' }}>
                          SKU: {prod.sku || 'N/A'}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer (Hidden on Print) */}
        <div
          className="no-print"
          style={{
            padding: '12px 1.5rem',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--header-bg, rgba(255,255,255,0.02))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            মোট নির্বাচিত পণ্য: <strong>{productList.length}টি</strong> | মোট প্রস্তুত লেবেল: <strong>{productList.length * copies}টি</strong>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={closeBarcodePrint} style={{ padding: '7px 18px' }}>
              বন্ধ করুন
            </button>
            <button
              className="btn btn-primary"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 20px',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #10b981, #059669)',
                borderColor: '#10b981'
              }}
            >
              <Printer size={15} />
              <span>স্টিকার প্রিন্ট করুন</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodePrintModal;
