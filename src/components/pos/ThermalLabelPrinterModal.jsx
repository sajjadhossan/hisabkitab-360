import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  Barcode,
  Layers,
  Sparkles,
  CheckCircle2,
  Tag,
  Building2,
  Sliders,
  Copy
} from 'lucide-react';
import { generateBarcodeSVG } from '../../services/barcodeService';
import { printHtmlContent } from '../../services/printService';
import { playButtonClick, playSuccessChime } from '../../services/soundFeedback';

const LABEL_SIZES = [
  { id: '52x38', label: '৫২ x ৩৮ মিমি (স্ট্যান্ডার্ড স্টিকার)', width: '52mm', height: '38mm', widthMm: 52, heightMm: 38 },
  { id: '50x30', label: '৫০ x ৩০ মিমি (কমপ্যাক্ট রিটেল)', width: '50mm', height: '30mm', widthMm: 50, heightMm: 30 },
  { id: '38x25', label: '৩৮ x ২৫ মিমি (মাইক্রো বারকোড)', width: '38mm', height: '25mm', widthMm: 38, heightMm: 25 },
  { id: '40x30', label: '৪০ x ৩০ মিমি (ফার্মেসি ও মুদি)', width: '40mm', height: '30mm', widthMm: 40, heightMm: 30 }
];

export const ThermalLabelPrinterModal = ({
  isOpen,
  onClose,
  products = [],
  businessSettings = {},
  initialProduct = null,
  lang = 'bn',
  showToast
}) => {
  const [selectedProductId, setSelectedProductId] = useState(
    initialProduct?.id || (products[0]?.id || '')
  );

  const [productName, setProductName] = useState(
    initialProduct?.name || products[0]?.name || 'পণ্য'
  );
  const [sellPrice, setSellPrice] = useState(
    initialProduct?.sellPrice || products[0]?.sellPrice || 100
  );
  const [mrpPrice, setMrpPrice] = useState(
    initialProduct?.mrp || (Number(initialProduct?.sellPrice || 100) * 1.1).toFixed(0)
  );
  const [barcodeCode, setBarcodeCode] = useState(
    initialProduct?.barcode || initialProduct?.sku || '894110012345'
  );
  const [batchNo, setBatchNo] = useState(initialProduct?.batchNo || 'B-101');
  const [expiryDate, setExpiryDate] = useState(initialProduct?.expiryDate || '');

  const [selectedSize, setSelectedSize] = useState('52x38');
  const [copies, setCopies] = useState(1);
  const [includeShopName, setIncludeShopName] = useState(true);
  const [includeBatch, setIncludeBatch] = useState(false);
  const [includeMrp, setIncludeMrp] = useState(true);

  const activeSizeObj = LABEL_SIZES.find(s => s.id === selectedSize) || LABEL_SIZES[0];
  const shopName = businessSettings.companyName || 'হিসাবকিতাব ৩৬০';

  const handleProductSelect = (id) => {
    setSelectedProductId(id);
    const prod = products.find(p => p.id === id);
    if (prod) {
      setProductName(prod.name);
      setSellPrice(prod.sellPrice);
      setMrpPrice(prod.mrp || (Number(prod.sellPrice) * 1.1).toFixed(0));
      setBarcodeCode(prod.barcode || prod.sku || `PROD-${prod.id}`);
      if (prod.batchNo) setBatchNo(prod.batchNo);
      if (prod.expiryDate) setExpiryDate(prod.expiryDate);
    }
  };

  const barcodeSvg = useMemo(() => {
    return generateBarcodeSVG(barcodeCode || '12345678', {
      barWidth: selectedSize === '38x25' ? 1.2 : 1.4,
      height: selectedSize === '38x25' ? 24 : 30,
      showText: true,
      fontSize: 9
    });
  }, [barcodeCode, selectedSize]);

  const handlePrintLabels = () => {
    playButtonClick();

    const stickerCss = `
      @page {
        size: ${activeSizeObj.width} ${activeSizeObj.height};
        margin: 0mm;
      }
      body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        font-family: 'Hind Siliguri', 'Plus Jakarta Sans', sans-serif;
        -webkit-print-color-adjust: exact;
      }
      .label-page {
        width: ${activeSizeObj.width};
        height: ${activeSizeObj.height};
        page-break-after: always;
        box-sizing: border-box;
        padding: 1.5mm 2mm;
        display: flex;
        flex-direction: column;
        justifyContent: space-between;
        align-items: center;
        text-align: center;
        overflow: hidden;
      }
      .label-shop {
        font-size: 8px;
        font-weight: 800;
        color: #000;
        text-transform: uppercase;
        line-height: 1.1;
      }
      .label-name {
        font-size: 9px;
        font-weight: 700;
        color: #000;
        line-height: 1.1;
        max-height: 20px;
        overflow: hidden;
        margin: 0.5mm 0;
      }
      .label-barcode {
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 0.5mm 0;
      }
      .label-barcode svg {
        max-width: 95%;
        height: auto;
      }
      .label-price-row {
        display: flex;
        justify-content: center;
        align-items: baseline;
        gap: 6px;
        font-weight: 900;
        font-size: 10px;
        line-height: 1;
      }
      .label-mrp {
        font-size: 7.5px;
        color: #555;
        text-decoration: line-through;
      }
      .label-meta {
        font-size: 7px;
        color: #333;
        line-height: 1;
      }
    `;

    const singleSticker = `
      <div class="label-page">
        ${includeShopName ? `<div class="label-shop">${shopName}</div>` : ''}
        <div class="label-name">${productName}</div>
        <div class="label-barcode">
          ${barcodeSvg}
        </div>
        <div class="label-price-row">
          ${includeMrp && Number(mrpPrice) > Number(sellPrice) ? `<span class="label-mrp">MRP ৳${mrpPrice}</span>` : ''}
          <span class="label-sell">৳${Number(sellPrice).toLocaleString()}</span>
        </div>
        ${includeBatch && batchNo ? `<div class="label-meta">Batch: ${batchNo} ${expiryDate ? `| Exp: ${expiryDate}` : ''}</div>` : ''}
      </div>
    `;

    let allStickers = '';
    const numCopies = Math.max(1, parseInt(copies, 10) || 1);
    for (let i = 0; i < numCopies; i++) {
      allStickers += singleSticker;
    }

    const fullHtml = `
      <style>${stickerCss}</style>
      <div>${allStickers}</div>
    `;

    printHtmlContent(fullHtml, {
      title: `Barcode Sticker - ${productName}`,
      paperType: 'label'
    });

    playSuccessChime();
    if (showToast) {
      showToast(
        lang === 'bn' ? `✓ ${numCopies}টি স্টিকার প্রিন্টারে পাঠানো হয়েছে!` : `✓ Sent ${numCopies} labels to printer!`,
        'success'
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface-color, #1e293b)',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          color: '#f8fafc',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(14, 165, 233, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Tag size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800' }}>
                {lang === 'bn' ? 'থার্মাল স্টিকার ও বারকোড প্রিন্টার' : 'Thermal Label & Barcode Printer'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                {lang === 'bn' ? '৫২x৩৮ ও ৩৮x২৫ সাইজের স্টিকার সরাসরি প্রিন্ট করুন' : 'Direct thermal sticker roll label printing'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
          {/* Left Form Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Product Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '6px', color: '#cbd5e1' }}>
                {lang === 'bn' ? 'পণ্য নির্বাচন করুন' : 'Select Product'}
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => handleProductSelect(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '0.88rem'
                }}
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (৳{p.sellPrice})
                  </option>
                ))}
              </select>
            </div>

            {/* Label Roll Size */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '6px', color: '#cbd5e1' }}>
                {lang === 'bn' ? 'স্টিকার রোল সাইজ' : 'Label Roll Size'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {LABEL_SIZES.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSize(s.id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: selectedSize === s.id ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: selectedSize === s.id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.5)',
                      color: selectedSize === s.id ? '#38bdf8' : '#94a3b8',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price & Code Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px', color: '#cbd5e1' }}>
                  {lang === 'bn' ? 'বিক্রয়মূল্য (৳)' : 'Sell Price (৳)'}
                </label>
                <input
                  type="number"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    fontWeight: '800'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px', color: '#cbd5e1' }}>
                  {lang === 'bn' ? 'বারকোড নম্বর' : 'Barcode / SKU'}
                </label>
                <input
                  type="text"
                  value={barcodeCode}
                  onChange={(e) => setBarcodeCode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
            </div>

            {/* Copies */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#cbd5e1' }}>
                {lang === 'bn' ? 'কপি সংখ্যা (Copies)' : 'Print Copies'}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {[1, 5, 10, 20].map(cnt => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setCopies(cnt)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: copies === cnt ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: copies === cnt ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      color: copies === cnt ? '#38bdf8' : '#94a3b8',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {cnt}
                  </button>
                ))}
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={copies}
                  onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  style={{
                    width: '50px',
                    textAlign: 'center',
                    padding: '4px',
                    borderRadius: '6px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    fontWeight: '800'
                  }}
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: '#cbd5e1' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeShopName}
                  onChange={(e) => setIncludeShopName(e.target.checked)}
                />
                <span>{lang === 'bn' ? 'দোকানের নাম প্রদর্শন করুন' : 'Show shop name'}</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeMrp}
                  onChange={(e) => setIncludeMrp(e.target.checked)}
                />
                <span>{lang === 'bn' ? 'MRP মূল্য প্রদর্শন করুন' : 'Show MRP strike-through'}</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeBatch}
                  onChange={(e) => setIncludeBatch(e.target.checked)}
                />
                <span>{lang === 'bn' ? 'ব্যাচ ও মেয়াদোত্তীর্ণ তারিখ' : 'Show Batch & Expiry'}</span>
              </label>
            </div>
          </div>

          {/* Right Live Sticker Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#94a3b8', marginBottom: '8px' }}>
              লাইভ স্টিকার প্রিভিউ ({activeSizeObj.width} × {activeSizeObj.height})
            </div>

            {/* Visual Sticker Card */}
            <div
              style={{
                width: '210px',
                height: `${Math.round(210 * (activeSizeObj.heightMm / activeSizeObj.widthMm))}px`,
                background: '#ffffff',
                borderRadius: '8px',
                padding: '10px',
                boxShadow: '0 12px 24px rgba(0, 0, 0, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                textAlign: 'center',
                color: '#000000',
                boxSizing: 'border-box'
              }}
            >
              {includeShopName && (
                <div style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '0.5px' }}>
                  {shopName}
                </div>
              )}

              <div style={{ fontSize: '11px', fontWeight: '700', lineHeight: 1.2, margin: '2px 0' }}>
                {productName}
              </div>

              <div
                style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                dangerouslySetInnerHTML={{ __html: barcodeSvg }}
              />

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                {includeMrp && Number(mrpPrice) > Number(sellPrice) && (
                  <span style={{ fontSize: '9px', color: '#666', textDecoration: 'line-through' }}>
                    MRP ৳{mrpPrice}
                  </span>
                )}
                <span style={{ fontSize: '13px', fontWeight: '900', color: '#000' }}>
                  ৳{Number(sellPrice).toLocaleString()}
                </span>
              </div>

              {includeBatch && batchNo && (
                <div style={{ fontSize: '8px', color: '#444' }}>
                  Batch: {batchNo} {expiryDate ? `| ${expiryDate}` : ''}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
              fontWeight: '700'
            }}
          >
            {lang === 'bn' ? 'বাতিল' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handlePrintLabels}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              color: '#ffffff',
              fontWeight: '800',
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(2, 132, 199, 0.4)'
            }}
          >
            <Printer size={18} />
            <span>{lang === 'bn' ? `${copies}টি স্টিকার প্রিন্ট করুন` : `Print ${copies} Labels`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
