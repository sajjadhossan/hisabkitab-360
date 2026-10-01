import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Boxes,
  Plus,
  Check,
  Trash2,
  Edit2,
  X,
  Scale,
  RefreshCw,
  Printer,
  Copy,
  AlertTriangle,
  PackageCheck,
  Building2,
  Clock,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  MessageCircle
} from 'lucide-react';
import { SmartVoiceFormBanner } from '../common/SmartVoiceFormBanner';
import { VoiceInputButton } from '../common/VoiceInputButton';
import { buildSupplierOrderMessage, openWhatsAppDirect } from '../../services/messagingService';

export const BusinessReorderModal = ({ isOpen, onClose }) => {
  const {
    products = [],
    businessReorderList = [],
    addBusinessReorderItem,
    updateBusinessReorderItem,
    deleteBusinessReorderItem,
    syncReorderWithLowStock,
    receiveReorderStock,
    categories = {},
    businessSettings,
    lang,
    showToast
  } = useApp();

  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'received'
  const [receivingItem, setReceivingItem] = useState(null);
  const [receivedQtyInput, setReceivedQtyInput] = useState('');

  // Form for manual item addition
  const [manualItem, setManualItem] = useState({
    productName: '',
    reorderQty: '10',
    unit: 'পিস (pcs)',
    costPrice: '',
    supplier: '',
    note: ''
  });

  const availableUnits = categories.productUnits || [
    'কেজি (kg)', 'গ্রাম (gm)', 'লিটার (L)', 'মিলি (ml)', 'পিস (pcs)', 'প্যাকেট (pkt)', 'ডজন (doz)', 'বস্তা (sack)', 'কার্টন (ctn)'
  ];

  // Low stock products count
  const lowStockProducts = useMemo(() => {
    return products.filter(p => Number(p.stock) <= Number(p.minAlert));
  }, [products]);

  // Metrics
  const pendingItems = useMemo(() => businessReorderList.filter(i => i.status !== 'received'), [businessReorderList]);
  const receivedItems = useMemo(() => businessReorderList.filter(i => i.status === 'received'), [businessReorderList]);
  const estimatedCost = useMemo(() => {
    return pendingItems.reduce((sum, i) => sum + ((Number(i.costPrice) || 0) * (Number(i.reorderQty) || 0)), 0);
  }, [pendingItems]);

  const displayList = useMemo(() => {
    if (filter === 'pending') return pendingItems;
    if (filter === 'received') return receivedItems;
    return businessReorderList;
  }, [filter, pendingItems, receivedItems, businessReorderList]);

  const handleManualAdd = (e) => {
    e?.preventDefault();
    if (!manualItem.productName.trim()) return;

    addBusinessReorderItem(manualItem);
    setManualItem({
      productName: '',
      reorderQty: '10',
      unit: manualItem.unit || 'পিস (pcs)',
      costPrice: '',
      supplier: '',
      note: ''
    });
  };

  const handleOpenReceive = (item) => {
    setReceivingItem(item);
    setReceivedQtyInput(item.reorderQty || '');
  };

  const handleConfirmReceive = () => {
    if (!receivingItem) return;
    const qty = Number(receivedQtyInput) || Number(receivingItem.reorderQty) || 0;
    receiveReorderStock(receivingItem.id, qty);
    setReceivingItem(null);
    setReceivedQtyInput('');
  };

  const handleCopyReorderList = () => {
    const lines = [
      `📦 ${lang === 'bn' ? 'দোকানের মালের ক্রয়ের ফর্দ (Reorder Requisition)' : 'Business Reorder List'} - ${new Date().toLocaleDateString('bn-BD')}`,
      '----------------------------------------'
    ];

    pendingItems.forEach((item, idx) => {
      const priceStr = item.costPrice ? `@ ৳${item.costPrice}` : '';
      const totalStr = item.costPrice ? `(মোট: ৳${item.costPrice * item.reorderQty})` : '';
      const supplierStr = item.supplier ? `[সাপ্লায়ার: ${item.supplier}]` : '';
      lines.push(`${idx + 1}. ${item.productName} - ${item.reorderQty} ${item.unit} ${priceStr} ${totalStr} ${supplierStr}`);
    });

    lines.push('----------------------------------------');
    lines.push(`${lang === 'bn' ? 'মোট মাল আইটেম:' : 'Total items:'} ${pendingItems.length}টি | ${lang === 'bn' ? 'আনুমানিক ক্রয় বাজেট:' : 'Estimated Cost:'} ৳${estimatedCost.toLocaleString('en-IN')}`);

    navigator.clipboard.writeText(lines.join('\n'));
    showToast(lang === 'bn' ? 'মালের ক্রয়ের ফর্দ কপি হয়েছে! মহাজন বা সাপ্লায়ারকে পাঠাতে পারেন' : 'Reorder list copied to clipboard!');
  };

  const handleSendWhatsAppReorder = () => {
    if (pendingItems.length === 0) {
      showToast(lang === 'bn' ? 'ফর্দে কোনো পেন্ডিং পণ্য নেই' : 'No pending items in reorder list', 'warning');
      return;
    }
    const message = buildSupplierOrderMessage({
      supplierName: 'মহাজন / সাপ্লায়ার',
      items: pendingItems.map(it => ({ name: it.productName, qty: it.reorderQty, unit: it.unit })),
      companyName: businessSettings?.companyName || 'আমাদের দোকান',
      companyPhone: businessSettings?.phone || '',
      notes: `${lang === 'bn' ? 'মোট মাল আইটেম:' : 'Total Items:'} ${pendingItems.length}টি | আনুমানিক বাজেট: ৳${estimatedCost.toLocaleString('bn-BD')}`
    });
    openWhatsAppDirect({ phone: '', message });
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay modal-backdrop modal-top-align"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '20px 14px',
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-content animate-scale-up"
        style={{
          maxWidth: '800px',
          width: '96%',
          marginTop: '10px',
          background: 'var(--bg-card)',
          borderRadius: '18px',
          border: '1.5px solid rgba(59, 130, 246, 0.4)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 20px rgba(59, 130, 246, 0.15)',
          padding: '1.5rem',
          maxHeight: 'calc(100vh - 50px)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Boxes size={18} />
              </div>
              <span>{lang === 'bn' ? 'মালের ক্রয়ের ফর্দ ও রি-অর্ডার রিকুইজিশন (Reorder List)' : 'Low Stock & Reorder List'}</span>
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {lang === 'bn'
                ? 'কোন কোন মালের স্টক শেষ বা কমে গেছে তার তালিকা। সাপ্লায়ার থেকে মাল কিনে সরাসরি স্টকে যুক্ত করুন।'
                : 'Track items running low on stock and manage purchase orders to replenish inventory.'}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Summary Badges Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '8px',
            marginBottom: '1rem'
          }}
        >
          <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '10px', padding: '8px 12px' }}>
            <div style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: '700' }}>{lang === 'bn' ? 'স্টক কমেছে' : 'Low Stock'}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#ef4444' }}>{lowStockProducts.length}টি পণ্য</div>
          </div>

          <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '8px 12px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'ক্রয় তালিকায় বাকি' : 'Pending to Buy'}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#f59e0b' }}>{pendingItems.length}টি আইটেম</div>
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '10px', padding: '8px 12px' }}>
            <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: '700' }}>{lang === 'bn' ? 'স্টকে গৃহীত' : 'Received Stock'}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#10b981' }}>{receivedItems.length}টি</div>
          </div>

          <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '8px 12px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'আনুমানিক মোট বাজেট' : 'Estimated Cost'}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>৳{estimatedCost.toLocaleString('en-IN')}</div>
          </div>
        </div>

        {/* Auto Sync Banner from Low Stock */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(217, 119, 6, 0.08))',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
            padding: '10px 14px',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'ইনভেন্টরির শেষ হয়ে যাওয়া মালের হিসাব' : 'Inventory Low Stock Sync'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {lowStockProducts.length > 0
                  ? (lang === 'bn' ? `দোকানে ${lowStockProducts.length}টি পণ্যের স্টক এলার্ট লেভেলের নিচে নেমে গেছে!` : `${lowStockProducts.length} products need replenishment!`)
                  : (lang === 'bn' ? 'বর্তমানে সব মালের স্টক পর্যাপ্ত রয়েছে।' : 'All products have sufficient stock.')}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={syncReorderWithLowStock}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              background: '#f59e0b',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
            }}
          >
            <RefreshCw size={14} />
            <span>{lang === 'bn' ? 'শেষ মালগুলো ফর্দে আনুন' : 'Sync Low Stock'}</span>
          </button>
        </div>

        {/* Smart Voice Shopping List Auto-Fill Banner */}
        <div style={{ marginBottom: '1rem' }}>
          <SmartVoiceFormBanner
            mode="shopping_list"
            lang={lang}
            onParsed={(items) => {
              if (Array.isArray(items) && items.length > 0) {
                items.forEach(it => {
                  addBusinessReorderItem({
                    productName: it.name,
                    reorderQty: it.qty || '1',
                    unit: it.unit || 'পিস (pcs)',
                    costPrice: '',
                    supplier: '',
                    note: 'ভয়েসে যোগ করা'
                  });
                });
                if (showToast) {
                  showToast(lang === 'bn' ? `🎙️ ${items.length}টি পণ্য ফর্দে যোগ হয়েছে!` : `🎙️ ${items.length} items added to reorder list!`, 'success');
                }
              }
            }}
          />
        </div>

        {/* Quick Add Custom Item */}
        <form
          onSubmit={handleManualAdd}
          style={{
            background: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '10px 12px',
            marginBottom: '1rem',
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1.2fr 1.2fr 1.5fr auto',
            gap: '8px',
            alignItems: 'center'
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              required
              placeholder={lang === 'bn' ? 'পণ্যের নাম...' : 'Product name...'}
              value={manualItem.productName}
              onChange={(e) => setManualItem({ ...manualItem, productName: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 36px 8px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                fontSize: '0.84rem'
              }}
            />
            <div style={{ position: 'absolute', right: '4px' }}>
              <VoiceInputButton
                onTranscript={(txt) => setManualItem(prev => ({ ...prev, productName: txt }))}
                title="মুখে বলুন পণ্যের নাম"
                size={13}
                style={{ padding: '2px 5px', background: 'transparent', border: 'none' }}
              />
            </div>
          </div>

          <input
            type="number"
            min="1"
            required
            placeholder={lang === 'bn' ? 'পরিমাণ' : 'Qty'}
            value={manualItem.reorderQty}
            onChange={(e) => setManualItem({ ...manualItem, reorderQty: e.target.value })}
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '0.84rem',
              fontWeight: '700'
            }}
          />

          <select
            value={manualItem.unit}
            onChange={(e) => setManualItem({ ...manualItem, unit: e.target.value })}
            style={{
              padding: '8px 8px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '0.82rem'
            }}
          >
            {availableUnits.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder={lang === 'bn' ? 'ক্রয়মূল্য (৳)' : 'Cost Price ৳'}
            value={manualItem.costPrice}
            onChange={(e) => setManualItem({ ...manualItem, costPrice: e.target.value })}
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '0.84rem'
            }}
          />

          <input
            type="text"
            placeholder={lang === 'bn' ? 'মহাজন / সাপ্লায়ার' : 'Supplier'}
            value={manualItem.supplier}
            onChange={(e) => setManualItem({ ...manualItem, supplier: e.target.value })}
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '0.84rem'
            }}
          />

          <button
            type="submit"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 14px',
              borderRadius: '6px',
              background: '#f59e0b',
              color: '#fff',
              border: 'none',
              fontWeight: '700',
              fontSize: '0.84rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Plus size={15} />
            <span>{lang === 'bn' ? 'যোগ' : 'Add'}</span>
          </button>
        </form>

        {/* Toolbar: Filters & Copy */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', background: 'var(--bg-main)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: '700',
                background: filter === 'all' ? 'var(--bg-card)' : 'transparent',
                color: filter === 'all' ? 'var(--text-main)' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              {lang === 'bn' ? 'সব ফর্দ' : 'All'} ({businessReorderList.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: '700',
                background: filter === 'pending' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                color: filter === 'pending' ? '#d97706' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              {lang === 'bn' ? 'কিনতে হবে' : 'Pending'} ({pendingItems.length})
            </button>
            <button
              onClick={() => setFilter('received')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: '700',
                background: filter === 'received' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                color: filter === 'received' ? '#10b981' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              {lang === 'bn' ? 'স্টকে এসেছে' : 'Received'} ({receivedItems.length})
            </button>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={handleCopyReorderList}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                borderRadius: '6px',
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                fontSize: '0.75rem',
                fontWeight: '700',
                color: 'var(--text-main)',
                cursor: 'pointer'
              }}
            >
              <Copy size={13} />
              <span>{lang === 'bn' ? 'ফর্দ কপি করুন' : 'Copy Reorder List'}</span>
            </button>

            <button
              onClick={handleSendWhatsAppReorder}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 12px',
                borderRadius: '6px',
                background: '#25D366',
                border: '1px solid #25D366',
                fontSize: '0.75rem',
                fontWeight: '700',
                color: '#fff',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(37, 211, 102, 0.3)'
              }}
              title={lang === 'bn' ? 'সাপ্লায়ার বা মহাজনকে হোয়াটসঅ্যাপে ফর্দ পাঠান' : 'Send Reorder list to Supplier via WhatsApp'}
            >
              <MessageCircle size={13} />
              <span>{lang === 'bn' ? 'WhatsApp-এ পাঠান' : 'WhatsApp Order'}</span>
            </button>
          </div>
        </div>

        {/* List Table */}
        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-card)' }}>
          {displayList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
              <Boxes size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <div style={{ fontSize: '0.9rem', fontWeight: '700' }}>
                {lang === 'bn' ? 'মালের কোনো ক্রয়ের ফর্দ পাওয়া যায়নি।' : 'No items in reorder list.'}
              </div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px 12px' }}>{lang === 'bn' ? 'পণ্য' : 'Product'}</th>
                  <th style={{ padding: '8px 12px' }}>{lang === 'bn' ? 'বর্তমান স্টক' : 'Current Stock'}</th>
                  <th style={{ padding: '8px 12px' }}>{lang === 'bn' ? 'ক্রয় চাহিদা' : 'Order Qty'}</th>
                  <th style={{ padding: '8px 12px' }}>{lang === 'bn' ? 'আনুমানিক ক্রয়মূল্য' : 'Est. Cost'}</th>
                  <th style={{ padding: '8px 12px' }}>{lang === 'bn' ? 'মহাজন / সাপ্লায়ার' : 'Supplier'}</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>{lang === 'bn' ? 'স্ট্যাটাস ও অ্যাকশন' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {displayList.map((item) => {
                  const isReceived = item.status === 'received';
                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        background: isReceived ? 'rgba(16, 185, 129, 0.03)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{item.productName}</div>
                        {item.note && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.note}</div>}
                      </td>

                      <td style={{ padding: '10px 12px' }}>
                        {item.currentStock !== undefined ? (
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.74rem',
                              fontWeight: '800',
                              background: item.currentStock <= (item.minAlert || 5) ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-main)',
                              color: item.currentStock <= (item.minAlert || 5) ? '#ef4444' : 'var(--text-main)'
                            }}
                          >
                            {item.currentStock} {item.unit}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td style={{ padding: '10px 12px', fontWeight: '800', color: '#f59e0b' }}>
                        {item.reorderQty} {item.unit}
                      </td>

                      <td style={{ padding: '10px 12px' }}>
                        {item.costPrice ? (
                          <div>
                            <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                              ৳{(item.costPrice * item.reorderQty).toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              (@ ৳{item.costPrice}/{item.unit})
                            </div>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                        {item.supplier || '—'}
                      </td>

                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {!isReceived ? (
                            <button
                              onClick={() => handleOpenReceive(item)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: '#fff',
                                border: 'none',
                                fontSize: '0.75rem',
                                fontWeight: '800',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <PackageCheck size={14} />
                              <span>{lang === 'bn' ? 'স্টকে যোগ' : 'Receive'}</span>
                            </button>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#10b981',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: '800'
                              }}
                            >
                              <CheckCircle2 size={12} />
                              <span>{lang === 'bn' ? 'স্টকে গৃহীত' : 'Received'}</span>
                            </span>
                          )}

                          <button
                            onClick={() => deleteBusinessReorderItem(item.id)}
                            style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '4px' }}
                            title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Receive Stock Prompt */}
        {receivingItem && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 1300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              style={{
                width: '90%',
                maxWidth: '380px',
                background: 'var(--bg-card)',
                borderRadius: '14px',
                border: '1px solid var(--border-color)',
                padding: '1.25rem',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
              }}
            >
              <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                📦 {lang === 'bn' ? 'ইনভেন্টরিতে স্টক যুক্ত করুন' : 'Receive Stock into Inventory'}
              </h4>
              <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <strong>{receivingItem.productName}</strong> কতটুকু মাল দোকানে এসেছে লিখুন (ইনভেন্টরির স্টকে সরাসরি যুক্ত হবে):
              </p>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '4px' }}>
                  {lang === 'bn' ? 'গৃহীত পরিমাণ (সংখ্যা)' : 'Received Quantity'} ({receivingItem.unit})
                </label>
                <input
                  type="number"
                  required
                  autoFocus
                  placeholder="পরিমাণ লিখুন..."
                  value={receivedQtyInput}
                  onChange={(e) => setReceivedQtyInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: '1.1rem',
                    fontWeight: '800'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setReceivingItem(null)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReceive}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                >
                  ✓ {lang === 'bn' ? 'স্টকে যোগ করুন' : 'Confirm Stock'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Bottom Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            💡 {lang === 'bn' ? 'টিপ: ফর্দের আইটেম স্টকে যোগ করলে তা স্বয়ংক্রিয়ভাবে ইনভেন্টরিতে যুক্ত হয়ে যায়।' : 'Tip: Receiving stock automatically updates inventory balance.'}
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              background: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              fontWeight: '700',
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
