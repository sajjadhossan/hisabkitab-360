import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Printer,
  X,
  Tag,
  Copy,
  Check,
  Download,
  Barcode as BarcodeIcon,
  Sliders,
  Sparkles,
  Layers,
  Store
} from 'lucide-react';
import { hapticFeedback } from '../../services/nativeAppService';
import { playButtonClick, playSuccessChime } from '../../services/soundFeedback';

export const BarcodeShelfLabelModal = ({
  isOpen,
  onClose,
  product = null,
  businessSettings = {},
  lang = 'bn'
}) => {
  const [copies, setCopies] = useState(1);
  const [labelSize, setLabelSize] = useState('50x30'); // '50x30' | '38x25' | 'qr_square'
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [customPrice, setCustomPrice] = useState(product?.sellingPrice || product?.price || 0);
  const [customBarcode, setCustomBarcode] = useState(product?.barcode || product?.sku || 'HK-' + Math.floor(100000 + Math.random() * 900000));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (product) {
      setCustomPrice(product.sellingPrice || product.price || 0);
      setCustomBarcode(product.barcode || product.sku || 'HK-' + Math.floor(100000 + Math.random() * 900000));
    }
  }, [product]);

  // Generate QR code data URL
  useEffect(() => {
    if (!isOpen) return;
    const barcodeText = String(customBarcode || 'HK-000000');
    QRCode.toDataURL(barcodeText, {
      width: 180,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.warn('QR gen error:', err));
  }, [isOpen, customBarcode]);

  if (!isOpen) return null;

  const storeName = businessSettings?.shopName || businessSettings?.storeName || (lang === 'bn' ? 'হিসাবকিতাব ৩৬০' : 'HisabKitab 360');
  const prodName = product?.name || (lang === 'bn' ? 'পণ্যের নাম' : 'Product Name');

  // Simple clean SVG Barcode generator for Code128-like retail display
  const renderSimpleBarcodeSvg = (code) => {
    const bars = [];
    let hash = 0;
    const str = String(code);
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);
    const pattern = (absHash.toString(2) + '1010110010100110101011101').slice(0, 32);

    let x = 4;
    for (let i = 0; i < pattern.length; i++) {
      const isBlack = pattern[i] === '1';
      const width = isBlack ? (i % 3 === 0 ? 3 : 2) : 2;
      if (isBlack) {
        bars.push(
          <rect key={i} x={x} y={2} width={width} height={36} fill="#000000" />
        );
      }
      x += width + 1;
    }

    return (
      <svg viewBox={`0 0 ${x + 6} 42`} style={{ width: '100%', maxHeight: '42px', display: 'block' }}>
        {bars}
      </svg>
    );
  };

  const handlePrint = () => {
    playSuccessChime();
    hapticFeedback.medium();
    window.print();
  };

  const handleCopyBarcode = () => {
    playButtonClick();
    hapticFeedback.light();
    navigator.clipboard?.writeText(customBarcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 10000,
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain'
      }}
    >
      <div
        className="modal-content animate-fade-in"
        style={{
          maxWidth: '460px',
          width: '94%',
          maxHeight: '92vh',
          overflowY: 'auto',
          borderRadius: '20px',
          padding: '1.25rem',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
        }}
      >
        {/* Header */}
        <div
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
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #10b981)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}
            >
              <Tag size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'শেল্ফ প্রাইস ট্যাগ ও বারকোড লেবেল' : 'Shelf Price Tag & Barcode Label'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'থার্মাল স্টিকার ও তাকের মূল্যের ট্যাগ প্রিন্ট করুন' : 'Print shelf tags & thermal stickers'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            style={{ width: '32px', height: '32px', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Preview Box */}
        <div
          style={{
            background: '#ffffff',
            color: '#000000',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '1rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            border: '2px dashed #94a3b8',
            textAlign: 'center'
          }}
          id="shelf-label-printable-area"
        >
          <div style={{ fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#475569' }}>
            {storeName}
          </div>
          <div style={{ fontSize: '0.98rem', fontWeight: '900', margin: '4px 0', color: '#0f172a' }}>
            {prodName}
          </div>

          {labelSize === 'qr_square' ? (
            <div style={{ margin: '6px auto', display: 'flex', justifyContent: 'center' }}>
              {qrDataUrl && <img src={qrDataUrl} alt="QR Code" style={{ width: '100px', height: '100px', borderRadius: '6px' }} />}
            </div>
          ) : (
            <div style={{ margin: '6px 0', padding: '0 8px' }}>
              {renderSimpleBarcodeSvg(customBarcode)}
            </div>
          )}

          <div style={{ fontSize: '0.74rem', fontFamily: 'monospace', fontWeight: '700', letterSpacing: '1px', color: '#334155' }}>
            {customBarcode}
          </div>

          <div style={{ marginTop: '6px', borderTop: '1px solid #e2e8f0', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
              {lang === 'bn' ? 'মূল্য (ভ্যাটসহ):' : 'Price (incl. VAT):'}
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: '900', color: '#047857' }}>
              ৳{Number(customPrice).toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* Control Customizations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.2rem' }}>
          {/* Label Type */}
          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
              {lang === 'bn' ? 'লেবেল ফরম্যাট ও সাইজ:' : 'Label Format:'}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setLabelSize('50x30')}
                style={{
                  padding: '7px 4px',
                  borderRadius: '8px',
                  border: labelSize === '50x30' ? '2px solid var(--business-primary)' : '1px solid var(--border-color)',
                  background: labelSize === '50x30' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: labelSize === '50x30' ? 'var(--business-primary)' : 'var(--text-main)',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                ৫০x৩০মিমি শেল্ফ
              </button>
              <button
                type="button"
                onClick={() => setLabelSize('38x25')}
                style={{
                  padding: '7px 4px',
                  borderRadius: '8px',
                  border: labelSize === '38x25' ? '2px solid var(--business-primary)' : '1px solid var(--border-color)',
                  background: labelSize === '38x25' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: labelSize === '38x25' ? 'var(--business-primary)' : 'var(--text-main)',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                ৩৮x২৫মিমি মিনি
              </button>
              <button
                type="button"
                onClick={() => setLabelSize('qr_square')}
                style={{
                  padding: '7px 4px',
                  borderRadius: '8px',
                  border: labelSize === 'qr_square' ? '2px solid var(--business-primary)' : '1px solid var(--border-color)',
                  background: labelSize === 'qr_square' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: labelSize === 'qr_square' ? 'var(--business-primary)' : 'var(--text-main)',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                QR কোড ট্যাগ
              </button>
            </div>
          </div>

          {/* Barcode & Price Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '2px', display: 'block' }}>
                {lang === 'bn' ? 'বারকোড নম্বর:' : 'Barcode:'}
              </label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  type="text"
                  value={customBarcode}
                  onChange={(e) => setCustomBarcode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-main)',
                    fontSize: '0.78rem',
                    fontFamily: 'monospace'
                  }}
                />
                <button
                  type="button"
                  onClick={handleCopyBarcode}
                  title="কপি করুন"
                  style={{
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: copied ? '#10b981' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '2px', display: 'block' }}>
                {lang === 'bn' ? 'ট্যাগ বিক্রয়মূল্য (৳):' : 'Tag Price (৳):'}
              </label>
              <input
                type="number"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-main)',
                  fontSize: '0.82rem',
                  fontWeight: '700'
                }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-primary"
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '12px',
              fontWeight: '800',
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Printer size={16} />
            <span>{lang === 'bn' ? 'স্টিকার প্রিন্ট করুন' : 'Print Label'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              fontWeight: '700',
              fontSize: '0.84rem'
            }}
          >
            {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
