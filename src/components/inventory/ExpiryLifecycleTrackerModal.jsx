import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  Trash2,
  Tag,
  RotateCcw,
  X,
  Search,
  Filter,
  Package,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { soundService } from '../../services/soundService';

export const ExpiryLifecycleTrackerModal = ({
  isOpen,
  onClose,
  products = [],
  onApplyDiscount,
  onWriteOffDamage,
  lang = 'bn'
}) => {
  const [filterType, setFilterType] = useState('all'); // 'all' | 'expired' | 'urgent_15' | 'urgent_30'
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Extract products with expiry dates or batches
  const itemsWithExpiry = useMemo(() => {
    const list = [];
    products.forEach((p) => {
      // Check if product has batches array or direct expiryDate
      if (Array.isArray(p.batches) && p.batches.length > 0) {
        p.batches.forEach((b) => {
          if (b.expiryDate) {
            const exp = new Date(b.expiryDate);
            const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
            list.push({
              id: `${p.id}-${b.batchNumber || 'def'}`,
              productId: p.id,
              name: p.name,
              category: p.category || 'সাধারণ',
              batchNumber: b.batchNumber || 'N/A',
              expiryDate: b.expiryDate,
              stock: Number(b.stock || b.quantity || p.stock || 0),
              unit: p.unit || 'পিস',
              sellPrice: Number(p.sellPrice || 0),
              diffDays
            });
          }
        });
      } else if (p.expiryDate) {
        const exp = new Date(p.expiryDate);
        const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
        list.push({
          id: p.id,
          productId: p.id,
          name: p.name,
          category: p.category || 'সাধারণ',
          batchNumber: p.batchNumber || 'ডিফল্ট',
          expiryDate: p.expiryDate,
          stock: Number(p.stock || 0),
          unit: p.unit || 'পিস',
          sellPrice: Number(p.sellPrice || 0),
          diffDays
        });
      }
    });

    return list.sort((a, b) => a.diffDays - b.diffDays);
  }, [products]);

  const filteredItems = useMemo(() => {
    return itemsWithExpiry.filter((item) => {
      const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.batchNumber.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (filterType === 'expired') return item.diffDays <= 0;
      if (filterType === 'urgent_15') return item.diffDays > 0 && item.diffDays <= 15;
      if (filterType === 'urgent_30') return item.diffDays > 0 && item.diffDays <= 30;
      return true;
    });
  }, [itemsWithExpiry, filterType, searchQuery]);

  const expiredCount = itemsWithExpiry.filter((i) => i.diffDays <= 0).length;
  const urgent15Count = itemsWithExpiry.filter((i) => i.diffDays > 0 && i.diffDays <= 15).length;
  const urgent30Count = itemsWithExpiry.filter((i) => i.diffDays > 15 && i.diffDays <= 30).length;

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
          maxWidth: '820px',
          background: 'var(--color-bg-card, #0f172a)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
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
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(245, 158, 11, 0.1))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ef4444, #f97316)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
              }}
            >
              <Clock size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                {lang === 'bn' ? 'মেয়াদোত্তীর্ণ ও ব্যাচ লাইফসাইকেল ট্র্যাকার (FEFO)' : 'Batch Expiry & FEFO Lifecycle Tracker'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                {lang === 'bn' ? 'ওষুধ, খাদ্যপণ্য ও প্রসাধনীর দ্রুত মেয়াদোত্তীর্ণ পণ্যের অগ্রিম সতর্কতা' : 'Track expiring stock, prevent dead inventory'}
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

        {/* Filter Ribbon */}
        <div style={{ padding: '16px 24px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: lang === 'bn' ? 'সব মেয়াদযুক্ত পণ্য' : 'All', count: itemsWithExpiry.length, color: '#94a3b8' },
              { id: 'expired', label: lang === 'bn' ? 'মেয়াদ শেষ (লাল)' : 'Expired', count: expiredCount, color: '#ef4444' },
              { id: 'urgent_15', label: lang === 'bn' ? '১৫ দিনে শেষ' : '15 Days', count: urgent15Count, color: '#f97316' },
              { id: 'urgent_30', label: lang === 'bn' ? '৩০ দিনে শেষ' : '30 Days', count: urgent30Count, color: '#f59e0b' }
            ].map((f) => {
              const isSelected = filterType === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setFilterType(f.id);
                    soundService.playBeep();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    border: isSelected ? `1.5px solid ${f.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isSelected ? `${f.color}20` : 'rgba(255, 255, 255, 0.03)',
                    color: isSelected ? '#fff' : '#94a3b8',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <span>{f.label}</span>
                  <span style={{ padding: '1px 6px', borderRadius: '8px', background: isSelected ? f.color : 'rgba(255, 255, 255, 0.08)', color: isSelected ? '#000' : '#cbd5e1', fontSize: '0.7rem', fontWeight: 800 }}>
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder={lang === 'bn' ? 'পণ্য বা ব্যাচ খুঁজুন...' : 'Search product/batch...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '0.8rem',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Table List */}
        <div style={{ padding: '8px 24px 20px', flex: 1, overflowY: 'auto' }}>
          <div style={{ borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.04)', color: '#94a3b8', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <th style={{ padding: '10px 14px' }}>{lang === 'bn' ? 'পণ্য ও ব্যাচ' : 'Product & Batch'}</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>{lang === 'bn' ? 'মেয়াদ তারিখ' : 'Expiry Date'}</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>{lang === 'bn' ? 'অবশিষ্ট দিন' : 'Status'}</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>{lang === 'bn' ? 'মজুদ স্টক' : 'Stock'}</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const isExpired = item.diffDays <= 0;
                  const isUrgent = item.diffDays > 0 && item.diffDays <= 15;
                  const statusBg = isExpired ? 'rgba(239, 68, 68, 0.15)' : isUrgent ? 'rgba(249, 115, 22, 0.15)' : 'rgba(245, 158, 11, 0.15)';
                  const statusColor = isExpired ? '#ef4444' : isUrgent ? '#f97316' : '#f59e0b';

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#f8fafc' }}>{item.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          ব্যাচ: <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{item.batchNumber}</span> • {item.category}
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 600, color: '#cbd5e1' }}>
                        {item.expiryDate}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '6px', background: statusBg, color: statusColor, fontWeight: 800, fontSize: '0.72rem' }}>
                          {isExpired ? (lang === 'bn' ? 'মেয়াদ শেষ!' : 'Expired!') : (lang === 'bn' ? `${item.diffDays} দিন বাকি` : `${item.diffDays}d left`)}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 800, color: '#f8fafc' }}>
                        {item.stock} {item.unit}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              soundService.playSuccessChime();
                              if (onApplyDiscount) onApplyDiscount(item);
                            }}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              background: 'rgba(245, 158, 11, 0.15)',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              color: '#f59e0b',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                            title="দ্রুত ক্লিয়ারেন্স ছাড় দিন"
                          >
                            🏷️ {lang === 'bn' ? 'ছাড় দিন' : 'Discount'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              soundService.playDeleteTone();
                              if (onWriteOffDamage) onWriteOffDamage(item);
                            }}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#ef4444',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                            title="নষ্ট পণ্য হিসেবে ড্যামেজ খাতায় নিন"
                          >
                            🗑️ {lang === 'bn' ? 'ড্যামেজ' : 'Damage'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      {lang === 'bn' ? 'কোনো মেয়াদোত্তীর্ণ পণ্য নেই' : 'No expiring products found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            {lang === 'bn' ? `মোট মেয়াদযুক্ত পণ্য: ${itemsWithExpiry.length}টি` : `Total Tracked: ${itemsWithExpiry.length}`}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ef4444, #f97316)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default ExpiryLifecycleTrackerModal;
