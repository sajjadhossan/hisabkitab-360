import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Printer,
  TrendingDown,
  TrendingUp,
  PackageCheck,
  ShieldAlert,
  ClipboardList
} from 'lucide-react';
import { playButtonClick, playSuccessChime, playWarningTone } from '../../services/soundFeedback';
import { hapticFeedback } from '../../services/nativeAppService';

export const StockAuditModal = ({
  isOpen,
  onClose,
  products = [],
  onApplyStockReconciliation,
  lang = 'bn',
  showToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterVarianceOnly, setFilterVarianceOnly] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);

  // Store physical counts and reasons indexed by product id
  // { [productId]: { physicalCount: number, reason: string } }
  const [auditRecords, setAuditRecords] = useState(() => {
    const initial = {};
    (products || []).forEach(p => {
      initial[p.id] = {
        physicalCount: Number(p.stock) || 0,
        reason: 'হিসাবে গরমিল'
      };
    });
    return initial;
  });

  if (!isOpen) return null;

  const categories = useMemo(() => {
    const cats = new Set(['all']);
    (products || []).forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [products]);

  const handlePhysicalCountChange = (productId, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setAuditRecords(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        physicalCount: num
      }
    }));
  };

  const handleReasonChange = (productId, reason) => {
    setAuditRecords(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        reason
      }
    }));
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return (products || []).filter(p => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.barcode && p.barcode.includes(searchTerm));
      const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;

      const record = auditRecords[p.id];
      const systemStock = Number(p.stock) || 0;
      const physicalCount = record ? record.physicalCount : systemStock;
      const hasVariance = physicalCount !== systemStock;

      if (filterVarianceOnly && !hasVariance) return false;
      return matchSearch && matchCategory;
    });
  }, [products, searchTerm, selectedCategory, filterVarianceOnly, auditRecords]);

  // Overall calculations
  const stats = useMemo(() => {
    let totalSystemStock = 0;
    let totalPhysicalStock = 0;
    let totalShortageQty = 0;
    let totalExcessQty = 0;
    let totalLossValue = 0;
    let itemsWithVarianceCount = 0;

    (products || []).forEach(p => {
      const systemStock = Number(p.stock) || 0;
      const record = auditRecords[p.id];
      const physicalCount = record !== undefined ? record.physicalCount : systemStock;
      const variance = physicalCount - systemStock;
      const costPrice = Number(p.costPrice) || Number(p.sellPrice) || 0;

      totalSystemStock += systemStock;
      totalPhysicalStock += physicalCount;

      if (variance < 0) {
        const shortage = Math.abs(variance);
        totalShortageQty += shortage;
        totalLossValue += shortage * costPrice;
        itemsWithVarianceCount++;
      } else if (variance > 0) {
        totalExcessQty += variance;
        itemsWithVarianceCount++;
      }
    });

    return {
      totalSystemStock,
      totalPhysicalStock,
      totalShortageQty,
      totalExcessQty,
      totalLossValue,
      itemsWithVarianceCount
    };
  }, [products, auditRecords]);

  const handleConfirmReconciliation = async () => {
    if (stats.itemsWithVarianceCount === 0) {
      showToast(lang === 'bn' ? 'কোনো পার্থক্যের তথ্য পাওয়া যায়নি' : 'No discrepancies found', 'info');
      onClose();
      return;
    }

    playButtonClick();
    hapticFeedback.warning();

    const confirmed = window.confirm(
      lang === 'bn'
        ? `আপনি কি নিশ্চিত যে ${stats.itemsWithVarianceCount}টি পণ্যের স্টক সমন্বয় করবেন? মোট আর্থিক ঘাটতি: ৳${stats.totalLossValue.toLocaleString()}`
        : `Are you sure you want to reconcile ${stats.itemsWithVarianceCount} items? Total shortage loss: ৳${stats.totalLossValue.toLocaleString()}`
    );

    if (!confirmed) return;

    setIsReconciling(true);
    try {
      const updates = [];
      (products || []).forEach(p => {
        const record = auditRecords[p.id];
        const systemStock = Number(p.stock) || 0;
        const physicalCount = record !== undefined ? record.physicalCount : systemStock;
        if (physicalCount !== systemStock) {
          updates.push({
            productId: p.id,
            productName: p.name,
            oldStock: systemStock,
            newStock: physicalCount,
            variance: physicalCount - systemStock,
            costPrice: Number(p.costPrice) || 0,
            reason: record?.reason || 'হিসাবে গরমিল',
            auditedAt: new Date().toISOString()
          });
        }
      });

      if (typeof onApplyStockReconciliation === 'function') {
        await onApplyStockReconciliation(updates);
      }

      playSuccessChime();
      showToast(
        lang === 'bn'
          ? `✓ সফলভাবে ${updates.length}টি পণ্যের স্টক অডিট সমন্বয় সম্পন্ন হয়েছে!`
          : `✓ Reconciled ${updates.length} items successfully!`,
        'success'
      );
      onClose();
    } catch (err) {
      playWarningTone();
      showToast(lang === 'bn' ? 'স্টক সমন্বয়ে সমস্যা হয়েছে' : 'Reconciliation error', 'error');
    } finally {
      setIsReconciling(false);
    }
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
          maxWidth: '1100px',
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
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(16, 185, 129, 0.08))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}
            >
              <ClipboardList size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800' }}>
                {lang === 'bn' ? 'শারীরিক স্টক গণনা ও অডিট সমন্বয় (Stock Take)' : 'Physical Stock Audit & Reconciliation'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'দোকানের তাকের বাস্তব সংখ্যা গুনে ঘাটতি বা উদ্বৃত্ত সমন্বয় করুন' : 'Reconcile on-shelf physical counts with software inventory'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Live Discrepancy KPI Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px',
            padding: '1rem 1.25rem',
            background: 'var(--bg-secondary, #f8fafc)',
            borderBottom: '1px solid var(--border-color)'
          }}
        >
          <div className="glass-card" style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)' }}>সিস্টেম মোট স্টক</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>{stats.totalSystemStock.toLocaleString()}</div>
          </div>
          <div className="glass-card" style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)' }}>বাস্তব গণনা স্টক</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#3b82f6' }}>{stats.totalPhysicalStock.toLocaleString()}</div>
          </div>
          <div className="glass-card" style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#ef4444' }}>মোট ঘাটতি (Shortage)</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#ef4444' }}>-{stats.totalShortageQty.toLocaleString()}</div>
          </div>
          <div className="glass-card" style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(220, 38, 38, 0.4)', background: 'rgba(220, 38, 38, 0.08)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#b91c1c' }}>ঘাটতির আর্থিক ক্ষতি (Loss)</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#b91c1c' }}>৳{stats.totalLossValue.toLocaleString()}</div>
          </div>
        </div>

        {/* Search & Filters Bar */}
        <div
          style={{
            padding: '0.75rem 1.25rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-color)'
          }}
        >
          <div style={{ display: 'flex', gap: '8px', flex: '1 1 300px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={lang === 'bn' ? 'বারকোড বা পণ্যের নাম দিয়ে খুঁজুন...' : 'Scan barcode or search name...'}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-main)',
                fontSize: '0.82rem'
              }}
            >
              {categories.map(c => (
                <option key={c} value={c}>{c === 'all' ? (lang === 'bn' ? 'সকল ক্যাটাগরি' : 'All Categories') : c}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setFilterVarianceOnly(!filterVarianceOnly)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: filterVarianceOnly ? '1.5px solid #ef4444' : '1px solid var(--border-color)',
                background: filterVarianceOnly ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
                color: filterVarianceOnly ? '#ef4444' : 'var(--text-muted)',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {filterVarianceOnly ? '✓ কেবল গরমিল পণ্য' : 'গরমিল ফিল্টার'}
            </button>
          </div>
        </div>

        {/* Product Items Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 1.25rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '8px 6px' }}>পণ্যের নাম ও বারকোড</th>
                <th style={{ padding: '8px 6px', textAlign: 'center' }}>সিস্টেম স্টক</th>
                <th style={{ padding: '8px 6px', textAlign: 'center', width: '130px' }}>বাস্তব গণনা</th>
                <th style={{ padding: '8px 6px', textAlign: 'center' }}>পার্থক্য</th>
                <th style={{ padding: '8px 6px', textAlign: 'right' }}>আর্থিক ক্ষতি/লাভ</th>
                <th style={{ padding: '8px 6px', width: '180px' }}>পার্থক্যের কারণ</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => {
                const systemStock = Number(p.stock) || 0;
                const record = auditRecords[p.id];
                const physicalCount = record !== undefined ? record.physicalCount : systemStock;
                const variance = physicalCount - systemStock;
                const costPrice = Number(p.costPrice) || Number(p.sellPrice) || 0;
                const valueDelta = variance * costPrice;

                return (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      background: variance !== 0 ? (variance < 0 ? 'rgba(239, 68, 68, 0.04)' : 'rgba(16, 185, 129, 0.04)') : 'transparent'
                    }}
                  >
                    <td style={{ padding: '8px 6px' }}>
                      <div style={{ fontWeight: '700' }}>{p.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {p.barcode ? `BAR: ${p.barcode}` : (p.sku ? `SKU: ${p.sku}` : '')}
                      </div>
                    </td>
                    <td style={{ padding: '8px 6px', textAlign: 'center', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                      {systemStock}
                    </td>
                    <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                      <input
                        type="number"
                        min="0"
                        value={physicalCount}
                        onChange={e => handlePhysicalCountChange(p.id, e.target.value)}
                        style={{
                          width: '90px',
                          padding: '6px 8px',
                          textAlign: 'center',
                          borderRadius: '6px',
                          border: variance !== 0 ? (variance < 0 ? '2px solid #ef4444' : '2px solid #10b981') : '1px solid var(--border-color)',
                          background: 'var(--bg-primary)',
                          color: 'var(--text-main)',
                          fontWeight: '800',
                          fontFamily: 'var(--font-mono)'
                        }}
                      />
                    </td>
                    <td style={{ padding: '8px 6px', textAlign: 'center', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
                      {variance === 0 ? (
                        <span style={{ color: 'var(--text-muted)' }}>০</span>
                      ) : variance < 0 ? (
                        <span style={{ color: '#ef4444' }}>{variance} (ঘাটতি)</span>
                      ) : (
                        <span style={{ color: '#10b981' }}>+{variance} (উদ্বৃত্ত)</span>
                      )}
                    </td>
                    <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                      {valueDelta === 0 ? (
                        <span style={{ color: 'var(--text-muted)' }}>৳০</span>
                      ) : (
                        <span style={{ color: valueDelta < 0 ? '#ef4444' : '#10b981' }}>
                          ৳{Math.abs(valueDelta).toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '8px 6px' }}>
                      {variance !== 0 ? (
                        <select
                          value={record?.reason || 'হিসাবে গরমিল'}
                          onChange={e => handleReasonChange(p.id, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '4px 6px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-main)',
                            fontSize: '0.75rem'
                          }}
                        >
                          <option value="নষ্ট / পচা পণ্য">নষ্ট / পচা পণ্য (Damaged)</option>
                          <option value="চুরি / অজ্ঞাত ঘাটতি">চুরি / অজ্ঞাত ঘাটতি (Theft)</option>
                          <option value="হিসাবে গরমিল">হিসাবে গরমিল (Counting Error)</option>
                          <option value="স্যাম্পল বিতরণ">স্যাম্পল বিতরণ (Sample)</option>
                          <option value="অন্যান্য">অন্যান্য (Other)</option>
                        </select>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-secondary, #f8fafc)'
          }}
        >
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            গরমিলযুক্ত পণ্যের সংখ্যা: <strong>{stats.itemsWithVarianceCount}</strong>টি
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
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
              disabled={isReconciling || stats.itemsWithVarianceCount === 0}
              onClick={handleConfirmReconciliation}
              className="btn btn-primary"
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #4f46e5, #10b981)',
                opacity: stats.itemsWithVarianceCount === 0 ? 0.6 : 1,
                cursor: stats.itemsWithVarianceCount === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {isReconciling ? 'সমন্বয় হচ্ছে...' : `✓ ১-ক্লিকে স্টক সমন্বয় সম্পন্ন করুন (${stats.itemsWithVarianceCount})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
