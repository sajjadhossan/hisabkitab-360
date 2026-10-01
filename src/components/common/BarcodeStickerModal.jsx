import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  Barcode,
  QrCode,
  Tag,
  Layers,
  Sparkles,
  Check,
  Building
} from 'lucide-react';
import { generateBarcodeSVG } from '../../services/barcodeService';

export const BarcodeStickerModal = ({
  isOpen,
  onClose,
  products = [],
  businessSettings = {},
  initialProduct = null,
  lang = 'bn',
  showToast
}) => {
  if (!isOpen) return null;

  const [selectedProductId, setSelectedProductId] = useState(
    initialProduct?.id || (products[0]?.id || '')
  );
  const [customName, setCustomName] = useState(initialProduct?.name || '');
  const [customPrice, setCustomPrice] = useState(initialProduct?.sellPrice || '');
  const [customCode, setCustomCode] = useState(
    initialProduct?.barcode || initialProduct?.sku || '894110012345'
  );

  const [stickerSize, setStickerSize] = useState('50x25'); // '50x25' | '38x25' | '40x30' | 'a4_sheet'
  const [codeType, setCodeType] = useState('barcode'); // 'barcode' | 'qr'
  const [copies, setCopies] = useState(12);

  const [showShopName, setShowShopName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showCodeText, setShowCodeText] = useState(true);

  // Sync when product selection changes
  const handleProductSelect = (prodId) => {
    setSelectedProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setCustomName(prod.name);
      setCustomPrice(prod.sellPrice);
      setCustomCode(prod.barcode || prod.sku || `PROD-${prod.id}`);
    }
  };

  const barcodeSvg = useMemo(() => {
    return generateBarcodeSVG(customCode || '12345678', {
      barWidth: 1.5,
      height: stickerSize === '38x25' ? 28 : 36,
      showText: showCodeText,
      fontSize: 10
    });
  }, [customCode, stickerSize, showCodeText]);

  // Handle Direct Print
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      if (showToast) showToast('Pop-up blocked! Allow pop-ups to print.', 'warning');
      return;
    }

    const shopName = businessSettings.companyName || 'হিসাব কিতাব ৩৬০';
    const priceText = showPrice ? `৳ ${Number(customPrice || 0).toLocaleString()}` : '';

    let pageCss = '';
    if (stickerSize === '50x25') {
      pageCss = `@page { size: 50mm 25mm; margin: 0; } body { margin: 0; padding: 0; }`;
    } else if (stickerSize === '38x25') {
      pageCss = `@page { size: 38mm 25mm; margin: 0; } body { margin: 0; padding: 0; }`;
    } else if (stickerSize === '40x30') {
      pageCss = `@page { size: 40mm 30mm; margin: 0; } body { margin: 0; padding: 0; }`;
    } else {
      // A4 Sheet
      pageCss = `@page { size: A4 portrait; margin: 8mm; }`;
    }

    const singleStickerHtml = `
      <div class="sticker-card">
        ${showShopName ? `<div class="shop-name">${shopName}</div>` : ''}
        <div class="prod-name">${customName || 'পণ্যের নাম'}</div>
        <div class="barcode-container">
          ${barcodeSvg}
        </div>
        ${showPrice ? `<div class="price-tag">${priceText}</div>` : ''}
      </div>
    `;

    let stickersHtml = '';
    for (let i = 0; i < copies; i++) {
      stickersHtml += singleStickerHtml;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Barcode Stickers - ${shopName}</title>
        <style>
          ${pageCss}
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #ffffff;
            color: #000000;
            display: flex;
            flex-wrap: wrap;
            align-content: flex-start;
          }
          .sticker-card {
            width: ${stickerSize === '50x25' ? '48mm' : stickerSize === '38x25' ? '36mm' : stickerSize === '40x30' ? '38mm' : '48mm'};
            height: ${stickerSize === '50x25' ? '24mm' : stickerSize === '38x25' ? '24mm' : stickerSize === '40x30' ? '28mm' : '26mm'};
            margin: ${stickerSize === 'a4_sheet' ? '2mm' : '0 auto'};
            padding: 2px 4px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justifyContent: center;
            text-align: center;
            overflow: hidden;
            page-break-inside: avoid;
            ${stickerSize === 'a4_sheet' ? 'border: 0.5px dashed #ccc; border-radius: 4px;' : ''}
          }
          .shop-name {
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            white-space: nowrap;
            overflow: hidden;
            max-width: 95%;
          }
          .prod-name {
            font-size: 9px;
            font-weight: 800;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 95%;
            margin-bottom: 1px;
          }
          .barcode-container svg {
            max-width: 100%;
            height: auto;
            max-height: ${stickerSize === '38x25' ? '18mm' : '20mm'};
          }
          .price-tag {
            font-size: 11px;
            font-weight: 900;
            font-family: monospace;
            margin-top: 1px;
          }
        </style>
      </head>
      <body>
        ${stickersHtml}
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1250 }}>
      <div
        className="modal-content animate-fade-in"
        style={{
          maxWidth: '750px',
          width: '95%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '1.5rem'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--business-primary)' }}>
              <Barcode size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'বারকোড ও স্টিকার প্রিন্টার স্টুডিও' : 'Barcode Label & Sticker Studio'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'দোকানের মালের জন্য কাস্টম সাইজের স্টিকার প্রিন্ট করুন' : 'Print shelf & price barcode stickers'}
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Content Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
          {/* Controls Column */}
          <div>
            {/* Select existing product */}
            <div style={{ marginBottom: '10px' }}>
              <label className="field-label">{lang === 'bn' ? 'দোকানের পণ্য নির্বাচন:' : 'Select Product:'}</label>
              <select
                className="input-field"
                value={selectedProductId}
                onChange={(e) => handleProductSelect(e.target.value)}
              >
                <option value="">-- কাস্টম পণ্য লিখুন --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} - ৳{p.sellPrice} ({p.barcode || p.sku || 'No code'})
                  </option>
                ))}
              </select>
            </div>

            {/* Product Name */}
            <div style={{ marginBottom: '10px' }}>
              <label className="field-label">{lang === 'bn' ? 'পণ্যের নাম:' : 'Product Name:'}</label>
              <input
                type="text"
                className="input-field"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="পণ্যের নাম লিখুন"
              />
            </div>

            {/* Price & Code Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <div>
                <label className="field-label">{lang === 'bn' ? 'বিক্রয়মূল্য (৳):' : 'Price (৳):'}</label>
                <input
                  type="number"
                  className="input-field"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="field-label">{lang === 'bn' ? 'বারকোড / SKU:' : 'Barcode / SKU:'}</label>
                <input
                  type="text"
                  className="input-field"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  placeholder="8941100..."
                />
              </div>
            </div>

            {/* Label Size Preset */}
            <div style={{ marginBottom: '12px' }}>
              <label className="field-label">{lang === 'bn' ? 'স্টিকার সাইজ (Preset):' : 'Sticker Size:'}</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                {[
                  { id: '50x25', label: '50mm × 25mm (Standard)' },
                  { id: '38x25', label: '38mm × 25mm (Compact)' },
                  { id: '40x30', label: '40mm × 30mm (Medium)' },
                  { id: 'a4_sheet', label: 'A4 Sheet (24 Grid)' }
                ].map(sz => (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() => setStickerSize(sz.id)}
                    style={{
                      padding: '7px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      border: stickerSize === sz.id ? '2px solid var(--business-primary)' : '1px solid var(--border-color)',
                      background: stickerSize === sz.id ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-primary)',
                      color: stickerSize === sz.id ? 'var(--business-primary)' : 'var(--text-muted)'
                    }}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Copies */}
            <div style={{ marginBottom: '12px' }}>
              <label className="field-label">{lang === 'bn' ? 'প্রিন্ট সংখ্যা (Copies):' : 'Copies:'}</label>
              <input
                type="number"
                min="1"
                max="500"
                className="input-field"
                value={copies}
                onChange={(e) => setCopies(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>

            {/* Toggle checkboxes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showShopName}
                  onChange={(e) => setShowShopName(e.target.checked)}
                  style={{ accentColor: 'var(--business-primary)' }}
                />
                <span>{lang === 'bn' ? 'দোকানের নাম দেখান' : 'Show Shop Name'}</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                  style={{ accentColor: 'var(--business-primary)' }}
                />
                <span>{lang === 'bn' ? 'দাম বা মূল্য ট্যাগ দেখান' : 'Show Price Tag'}</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showCodeText}
                  onChange={(e) => setShowCodeText(e.target.checked)}
                  style={{ accentColor: 'var(--business-primary)' }}
                />
                <span>{lang === 'bn' ? 'বারকোড নম্বর টেক্সট দেখান' : 'Show Code Number Text'}</span>
              </label>
            </div>
          </div>

          {/* Live Preview Column */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', borderRadius: '12px', padding: '1.25rem', border: '1px dashed var(--border-color)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '12px' }}>
              {lang === 'bn' ? 'লাইভ স্টিকার প্রিভিউ (প্রকৃত সাইজ):' : 'Live Sticker Preview:'}
            </div>

            {/* Visual Sticker Box */}
            <div
              style={{
                width: stickerSize === '50x25' ? '240px' : stickerSize === '38x25' ? '190px' : '220px',
                minHeight: '120px',
                background: '#ffffff',
                color: '#000000',
                border: '1.5px solid #000000',
                borderRadius: '6px',
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
              }}
            >
              {showShopName && (
                <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#333' }}>
                  {businessSettings.companyName || 'হিসাব কিতাব ৩৬০'}
                </div>
              )}
              <div style={{ fontSize: '12px', fontWeight: '900', margin: '2px 0', color: '#000', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {customName || 'পণ্যের নাম'}
              </div>
              <div
                style={{ margin: '4px 0', maxWidth: '100%' }}
                dangerouslySetInnerHTML={{ __html: barcodeSvg }}
              />
              {showPrice && (
                <div style={{ fontSize: '14px', fontWeight: '900', fontFamily: 'monospace', color: '#000' }}>
                  ৳ {Number(customPrice || 0).toLocaleString()}
                </div>
              )}
            </div>

            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '12px', textAlign: 'center' }}>
              {copies} {lang === 'bn' ? 'টি স্টিকার প্রিন্ট হবে' : 'stickers will be printed'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            {lang === 'bn' ? 'বাতিল' : 'Cancel'}
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handlePrint}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              fontWeight: '700'
            }}
          >
            <Printer size={18} />
            <span>{lang === 'bn' ? 'স্টিকার প্রিন্ট করুন' : 'Print Stickers'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
