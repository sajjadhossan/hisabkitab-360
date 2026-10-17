import React, { useState } from 'react';
import {
  Layers,
  X,
  Check,
  Calendar,
  AlertTriangle,
  Plus
} from 'lucide-react';
import { soundService } from '../../services/soundService';

export const FastVariantBatchModal = ({
  isOpen,
  onClose,
  product,
  onSelectVariantOrBatch,
  lang = 'bn'
}) => {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);

  if (!isOpen || !product) return null;

  const variants = product.variants || [
    { id: 'v1', name: 'ছোট (Small)', priceDiff: 0, stock: product.stock || 10 },
    { id: 'v2', name: 'মাঝারি (Medium)', priceDiff: 50, stock: 15 },
    { id: 'v3', name: 'বড় (Large / XL)', priceDiff: 100, stock: 8 }
  ];

  const batches = product.batches || [
    { id: 'b1', batchNo: 'B-2026-A', expiryDate: '2026-12-31', stock: 25, isExpiringSoon: false },
    { id: 'b2', batchNo: 'B-2026-B', expiryDate: '2027-06-30', stock: 40, isExpiringSoon: false }
  ];

  const handleConfirm = () => {
    soundService.playSuccessChime();
    const finalItem = {
      ...product,
      selectedVariant: selectedVariant || variants[0],
      selectedBatch: selectedBatch || (batches.length > 0 ? batches[0] : null),
      price: (Number(product.sellingPrice || product.price) || 0) + (selectedVariant ? selectedVariant.priceDiff : 0)
    };
    onSelectVariantOrBatch(finalItem);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        background: 'rgba(5, 10, 20, 0.75)',
        backdropFilter: 'blur(12px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.18s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'linear-gradient(145deg, #131c2e, #0b111d)',
          borderRadius: '20px',
          border: '1.5px solid rgba(56, 189, 248, 0.35)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'scaleUp 0.18s ease-out'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(56, 189, 248, 0.05)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={18} style={{ color: '#38bdf8' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#f8fafc' }}>
                {product.name}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#94a3b8' }}>
                ভ্যারিয়েন্ট বা ড্রাগ ব্যাচ নির্বাচন করুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Size / Variant Options */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '8px' }}>
              সাইজ / ভ্যারিয়েন্ট (Variant)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
              {variants.map((v) => {
                const isSelected = selectedVariant?.id === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => {
                      soundService.playBeep();
                      setSelectedVariant(v);
                    }}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      background: isSelected ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                      border: isSelected ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                      color: isSelected ? '#38bdf8' : '#f8fafc',
                      fontWeight: '700',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div>{v.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                      {v.priceDiff > 0 ? `+৳${v.priceDiff}` : 'মূল দাম'} • স্টক: {v.stock}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pharmacy / Expiry Batch Options */}
          {batches.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '8px' }}>
                মেয়াদ ও ব্যাচ নম্বর (FEFO Expiry Batch)
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {batches.map((b) => {
                  const isSelected = selectedBatch?.id === b.id;
                  return (
                    <div
                      key={b.id}
                      onClick={() => {
                        soundService.playBeep();
                        setSelectedBatch(b);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected ? '1.5px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: isSelected ? '#10b981' : '#f8fafc' }}>
                          ব্যাচ: {b.batchNo}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          মেয়াদ: {b.expiryDate} • স্টক: {b.stock}
                        </div>
                      </div>
                      {isSelected && <Check size={16} style={{ color: '#10b981' }} />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.2)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px'
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#94a3b8',
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            বাতিল
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              border: 'none',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '0.84rem',
              cursor: 'pointer'
            }}
          >
            কার্টে যোগ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
