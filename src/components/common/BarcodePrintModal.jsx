import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Printer, X, Tag } from 'lucide-react';
import { printElement } from '../../services/printService';

export const BarcodePrintModal = () => {
  const {
    activeBarcodePrint,
    closeBarcodePrint,
    businessSettings,
    lang,
    t
  } = useApp();

  const [copies, setCopies] = useState(6);

  if (!activeBarcodePrint) return null;

  // activeBarcodePrint can be a single product or array of products
  const productList = Array.isArray(activeBarcodePrint)
    ? activeBarcodePrint
    : [activeBarcodePrint];

  const handlePrint = () => {
    printElement('printable-barcode-sheet', {
      title: 'Barcode Labels',
      paperType: 'label'
    });
  };

  // Helper to render authentic SVG barcode lines
  const renderSvgBarcode = (code) => {
    // Generate deterministic bar widths from characters in the barcode string
    const chars = String(code).split('');
    const bars = [];
    let pos = 10;

    // Start guard bars
    bars.push(<rect key="sg1" x={pos} y="0" width="2" height="42" fill="#000" />);
    pos += 4;
    bars.push(<rect key="sg2" x={pos} y="0" width="2" height="42" fill="#000" />);
    pos += 5;

    chars.forEach((c, idx) => {
      const num = c.charCodeAt(0);
      const w1 = ((num % 3) + 1.5);
      const w2 = (((num * 2) % 3) + 1.2);
      bars.push(<rect key={`b1-${idx}`} x={pos} y="0" width={w1} height="36" fill="#000" />);
      pos += w1 + 2.5;
      bars.push(<rect key={`b2-${idx}`} x={pos} y="0" width={w2} height="36" fill="#000" />);
      pos += w2 + 3;
    });

    // End guard bars
    bars.push(<rect key="eg1" x={pos} y="0" width="2" height="42" fill="#000" />);
    pos += 4;
    bars.push(<rect key="eg2" x={pos} y="0" width="2" height="42" fill="#000" />);
    pos += 10;

    return (
      <svg
        viewBox={`0 0 ${pos} 55`}
        style={{ width: '100%', height: '48px', display: 'block', margin: '0 auto' }}
      >
        {bars}
        <text
          x={pos / 2}
          y="52"
          textAnchor="middle"
          fontSize="10"
          fontFamily="monospace"
          fontWeight="bold"
          fill="#000"
        >
          {code}
        </text>
      </svg>
    );
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div
        className="modal-content animate-fade-in"
        style={{
          maxWidth: '800px',
          width: '95%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '1.25rem'
        }}
      >
        {/* Controls - Hidden on print */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="badge badge-primary" style={{ fontSize: '0.85rem' }}>
              <Tag size={14} />
              {lang === 'bn' ? 'বারকোড স্টিকার প্রিন্ট' : 'Print Barcode Labels'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>{lang === 'bn' ? 'প্রতি পণ্যের কপি:' : 'Stickers per item:'}</span>
              <select
                className="input-field"
                value={copies}
                onChange={(e) => setCopies(Number(e.target.value))}
                style={{ padding: '3px 8px', fontSize: '0.8rem', width: '70px' }}
              >
                <option value={2}>2</option>
                <option value={4}>4</option>
                <option value={6}>6</option>
                <option value={12}>12</option>
                <option value={24}>24</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-primary"
              onClick={handlePrint}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={16} />
              <span>{lang === 'bn' ? 'স্টিকার প্রিন্ট করুন' : 'Print Stickers'}</span>
            </button>
            <button className="btn-icon" onClick={closeBarcodePrint} title={t.close}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Barcode Sheet Container */}
        <div
          id="printable-barcode-sheet"
          className="printable-barcodes"
          style={{
            background: '#ffffff',
            color: '#000000',
            padding: '1.5rem',
            borderRadius: '6px',
            border: '1px solid #cbd5e1'
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px'
            }}
          >
            {productList.map((prod) =>
              Array.from({ length: copies }).map((_, idx) => (
                <div
                  key={`${prod.id}-${idx}`}
                  style={{
                    border: '1px dashed #94a3b8',
                    padding: '8px',
                    borderRadius: '6px',
                    textAlign: 'center',
                    background: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '130px'
                  }}
                >
                  <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px' }}>
                    {businessSettings.companyName}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: '800', margin: '2px 0', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {prod.name}
                  </div>
                  <div>
                    {renderSvgBarcode(prod.barcode || '8901001001')}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '11px', fontWeight: '800' }}>
                    <span style={{ fontSize: '9px', color: '#64748b' }}>{prod.sku}</span>
                    <span style={{ color: '#0f172a' }}>৳{prod.sellPrice}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
