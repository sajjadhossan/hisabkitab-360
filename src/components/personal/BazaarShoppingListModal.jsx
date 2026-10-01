import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShoppingCart,
  Plus,
  Check,
  Trash2,
  Edit2,
  X,
  Scale,
  Printer,
  Copy,
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  Layers,
  User,
  Filter
} from 'lucide-react';

export const BazaarShoppingListModal = ({ isOpen, onClose, onOpenExpenseModal }) => {
  const {
    bazaarShoppingList = [],
    addBazaarItem,
    updateBazaarItem,
    deleteBazaarItem,
    toggleBazaarItemPurchased,
    convertBazaarItemToExpense,
    clearPurchasedBazaarItems,
    categories = {},
    lang,
    showToast
  } = useApp();

  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'purchased'
  const [editingId, setEditingId] = useState(null);

  // Form State for new item
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: '1',
    unit: 'কেজি (kg)',
    estimatedPrice: '',
    category: 'bazaar',
    subCategory: 'কাঁচা শাকসবজি',
    familyMember: 'পুরো পরিবার (সবার জন্য)',
    note: ''
  });

  // Convert Modal / Prompt State
  const [convertingItem, setConvertingItem] = useState(null);
  const [actualExpenseAmount, setActualExpenseAmount] = useState('');

  const availableUnits = categories.expenseUnits || [
    'কেজি (kg)', 'গ্রাম (g)', 'লিটার (L)', 'মিলি (ml)', 'পিস (Pcs)', 'ডজন (Dzn)', 'প্যাকেট (Pkt)', 'বস্তা'
  ];

  const availableMembers = categories.familyMembers || [
    'পুরো পরিবার (সবার জন্য)', 'নিজে (Self)', 'স্ত্রী (Wife)', 'ছেলে (Son)', 'মেয়ে (Daughter)'
  ];

  const quickPresets = [
    { name: 'আটা', quantity: 2, unit: 'কেজি (kg)', estimatedPrice: 110, subCategory: 'চাল ও আটা' },
    { name: 'মিনিকেট চাল', quantity: 5, unit: 'কেজি (kg)', estimatedPrice: 360, subCategory: 'চাল ও আটা' },
    { name: 'সয়াবিন তেল', quantity: 2, unit: 'লিটার (L)', estimatedPrice: 380, subCategory: 'ডাল ও সয়াবিন তেল' },
    { name: 'ফার্মের ডিম', quantity: 1, unit: 'ডজন (Dzn)', estimatedPrice: 155, subCategory: 'ডিম ও দুধ' },
    { name: 'পেঁয়াজ', quantity: 1, unit: 'কেজি (kg)', estimatedPrice: 85, subCategory: 'কাঁচা শাকসবজি' },
    { name: 'আলু', quantity: 2, unit: 'কেজি (kg)', estimatedPrice: 70, subCategory: 'কাঁচা শাকসবজি' },
    { name: 'মুরগির মাংস', quantity: 1, unit: 'কেজি (kg)', estimatedPrice: 190, subCategory: 'মুরগি / গরুর মাংস' }
  ];

  // Metrics
  const totalCount = bazaarShoppingList.length;
  const pendingItems = useMemo(() => bazaarShoppingList.filter(i => !i.isPurchased), [bazaarShoppingList]);
  const purchasedItems = useMemo(() => bazaarShoppingList.filter(i => i.isPurchased), [bazaarShoppingList]);
  const estimatedTotal = useMemo(() => {
    return bazaarShoppingList.reduce((sum, i) => sum + (Number(i.estimatedPrice) || 0), 0);
  }, [bazaarShoppingList]);

  // Filtered List
  const displayList = useMemo(() => {
    if (filter === 'pending') return pendingItems;
    if (filter === 'purchased') return purchasedItems;
    return bazaarShoppingList;
  }, [filter, pendingItems, purchasedItems, bazaarShoppingList]);

  const handleAddItem = (e) => {
    e?.preventDefault();
    if (!newItem.name.trim()) return;

    addBazaarItem(newItem);
    setNewItem({
      name: '',
      quantity: '1',
      unit: newItem.unit || 'কেজি (kg)',
      estimatedPrice: '',
      category: 'bazaar',
      subCategory: newItem.subCategory || 'কাঁচা শাকসবজি',
      familyMember: newItem.familyMember || 'পুরো পরিবার (সবার জন্য)',
      note: ''
    });
  };

  const handleAddPreset = (preset) => {
    addBazaarItem({
      ...preset,
      category: 'bazaar',
      familyMember: 'পুরো পরিবার (সবার জন্য)'
    });
  };

  // Convert to Expense Flow
  const handleOpenConvert = (item) => {
    setConvertingItem(item);
    setActualExpenseAmount(item.estimatedPrice || '');
  };

  const handleConfirmConvert = () => {
    if (!convertingItem) return;
    const finalAmount = Number(actualExpenseAmount) || Number(convertingItem.estimatedPrice) || 0;
    convertBazaarItemToExpense(convertingItem.id, finalAmount);
    setConvertingItem(null);
    setActualExpenseAmount('');
  };

  // Copy shopping list to clipboard
  const handleCopyList = () => {
    const lines = [
      `🛒 ${lang === 'bn' ? 'বাজারের ফর্দ (শপিং লিস্ট)' : 'Bazaar Shopping List'} - ${new Date().toLocaleDateString('bn-BD')}`,
      '----------------------------------------'
    ];

    bazaarShoppingList.forEach((item, idx) => {
      const status = item.isPurchased ? '✓ [কেনা হয়েছে]' : '◻ [বাকি]';
      const qtyStr = `${item.quantity} ${item.unit}`;
      const priceStr = item.estimatedPrice ? `(আনুমানিক: ৳${item.estimatedPrice})` : '';
      lines.push(`${idx + 1}. ${item.name} - ${qtyStr} ${priceStr} ${status}`);
    });

    lines.push('----------------------------------------');
    lines.push(`${lang === 'bn' ? 'মোট আইটেম:' : 'Total items:'} ${totalCount}টি | ${lang === 'bn' ? 'বাকি:' : 'Pending:'} ${pendingItems.length}টি`);

    navigator.clipboard.writeText(lines.join('\n'));
    showToast(lang === 'bn' ? 'বাজারের ফর্দ কপি করা হয়েছে! মেসেজ বা হোয়াটসঅ্যাপে পেস্ট করুন' : 'Shopping list copied to clipboard!');
  };

  // Print list
  const handlePrintList = () => {
    window.print();
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
          maxWidth: '740px',
          width: '96%',
          marginTop: '10px',
          background: 'var(--bg-card)',
          borderRadius: '18px',
          border: '1.5px solid rgba(16, 185, 129, 0.4)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 20px rgba(16, 185, 129, 0.15)',
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
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ShoppingCart size={18} />
              </div>
              <span>{lang === 'bn' ? 'বাজারের ফর্দ ও শপিং লিস্ট (Shopping Checklist)' : 'Bazaar Shopping Checklist'}</span>
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {lang === 'bn'
                ? 'বাজারে যাওয়ার আগে ফর্দ তৈরি করুন। কেনার পর এক ক্লিকেই টিক দিন এবং সরাসরি দৈনিক খরচে যুক্ত করুন।'
                : 'Prepare shopping checklist, check off bought items, and convert directly to daily expenses.'}
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '8px',
            marginBottom: '1rem'
          }}
        >
          <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '8px 12px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'মোট আইটেম' : 'Total Items'}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>{totalCount}টি</div>
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '10px', padding: '8px 12px' }}>
            <div style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: '700' }}>{lang === 'bn' ? 'কেনা বাকি' : 'Pending to Buy'}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#ef4444' }}>{pendingItems.length}টি</div>
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '10px', padding: '8px 12px' }}>
            <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: '700' }}>{lang === 'bn' ? 'কেনা সম্পন্ন' : 'Purchased'}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#10b981' }}>{purchasedItems.length}টি</div>
          </div>

          <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '8px 12px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'আনুমানিক বাজেট' : 'Estimated Cost'}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#f59e0b' }}>৳{estimatedTotal.toLocaleString('en-IN')}</div>
          </div>
        </div>

        {/* Quick Add Input Bar */}
        <form
          onSubmit={handleAddItem}
          style={{
            background: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '10px 12px',
            marginBottom: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1.2fr auto', gap: '8px', alignItems: 'center' }}>
            {/* Product Name */}
            <div>
              <input
                type="text"
                required
                placeholder={lang === 'bn' ? 'আইটেমের নাম (যেমন: আটা, সয়াবিন তেল)...' : 'Item name...'}
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.86rem',
                  fontWeight: '600'
                }}
              />
            </div>

            {/* Quantity */}
            <div>
              <input
                type="number"
                step="any"
                min="0.1"
                required
                placeholder={lang === 'bn' ? 'পরিমাণ (যেমন: ২ বা ৫০০)' : 'Qty (e.g. 2)'}
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.86rem',
                  fontWeight: '700'
                }}
              />
            </div>

            {/* Unit */}
            <div>
              <select
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.84rem'
                }}
              >
                {availableUnits.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            {/* Estimated Price */}
            <div>
              <input
                type="number"
                placeholder={lang === 'bn' ? 'আনুমানিক ৳ (ঐচ্ছিক)' : 'Est. ৳'}
                value={newItem.estimatedPrice}
                onChange={(e) => setNewItem({ ...newItem, estimatedPrice: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.86rem'
                }}
              />
            </div>

            {/* Submit Add */}
            <button
              type="submit"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '8px 16px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                border: 'none',
                fontWeight: '700',
                fontSize: '0.86rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Plus size={16} />
              <span>{lang === 'bn' ? 'ফর্দে যোগ' : 'Add'}</span>
            </button>
          </div>

          {/* Quick preset chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700' }}>
              ⚡ {lang === 'bn' ? 'কুইক ফর্দ:' : 'Quick Add:'}
            </span>
            {quickPresets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddPreset(p)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: '600',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                <span>+ {p.name} ({p.quantity} {p.unit.split(' ')[0]})</span>
              </button>
            ))}
          </div>
        </form>

        {/* Toolbar: Filters & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '8px' }}>
          {/* Tabs */}
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
              {lang === 'bn' ? 'সব আইটেম' : 'All'} ({totalCount})
            </button>
            <button
              onClick={() => setFilter('pending')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: '700',
                background: filter === 'pending' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                color: filter === 'pending' ? '#ef4444' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              {lang === 'bn' ? 'বাকি আছে' : 'Pending'} ({pendingItems.length})
            </button>
            <button
              onClick={() => setFilter('purchased')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: '700',
                background: filter === 'purchased' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                color: filter === 'purchased' ? '#10b981' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              {lang === 'bn' ? 'কেনা শেষ' : 'Bought'} ({purchasedItems.length})
            </button>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={handleCopyList}
              title={lang === 'bn' ? 'মেসেজে পাঠাতে লিস্টটি কপি করুন' : 'Copy list'}
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
              <span>{lang === 'bn' ? 'ফর্দ কপি' : 'Copy'}</span>
            </button>

            {purchasedItems.length > 0 && (
              <button
                onClick={clearPurchasedBazaarItems}
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
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <span>{lang === 'bn' ? 'কেনাগুলো মুছুন' : 'Clear Bought'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Checklist Container */}
        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-card)' }}>
          {displayList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
              <ShoppingCart size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <div style={{ fontSize: '0.9rem', fontWeight: '700' }}>
                {filter === 'pending'
                  ? (lang === 'bn' ? 'কোনো আইটেম বাকি নেই! সব কেনা হয়ে গেছে 🎉' : 'All items purchased!')
                  : (lang === 'bn' ? 'ফর্দে কোনো পণ্য নেই। উপরে লিখে ফর্দ তৈরি করুন।' : 'No items in shopping list.')}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {displayList.map((item, idx) => {
                const isBought = item.isPurchased;
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderBottom: idx !== displayList.length - 1 ? '1px solid var(--border-color)' : 'none',
                      background: isBought ? 'rgba(16, 185, 129, 0.04)' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    {/* Checkbox & Item Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                      <button
                        onClick={() => toggleBazaarItemPurchased(item.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: isBought ? '#10b981' : 'var(--text-muted)',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {isBought ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                      </button>

                      <div>
                        <div
                          style={{
                            fontWeight: '700',
                            fontSize: '0.92rem',
                            color: isBought ? 'var(--text-muted)' : 'var(--text-main)',
                            textDecoration: isBought ? 'line-through' : 'none'
                          }}
                        >
                          {item.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              background: 'var(--bg-main)',
                              border: '1px solid var(--border-color)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              color: 'var(--text-main)'
                            }}
                          >
                            <Scale size={10} style={{ color: '#06b6d4' }} />
                            <span>{item.quantity} {item.unit}</span>
                          </span>

                          {item.estimatedPrice ? (
                            <span style={{ fontSize: '0.74rem', color: '#f59e0b', fontWeight: '700' }}>
                              ~৳{item.estimatedPrice}
                            </span>
                          ) : null}

                          {item.subCategory && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              • {item.subCategory}
                            </span>
                          )}

                          {item.convertedToExpense && (
                            <span
                              style={{
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#10b981',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontSize: '0.68rem',
                                fontWeight: '800'
                              }}
                            >
                              ✓ খরচে যুক্ত
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {/* Convert to Daily Expense button */}
                      {!item.convertedToExpense ? (
                        <button
                          onClick={() => handleOpenConvert(item)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: isBought ? '#10b981' : 'rgba(16, 185, 129, 0.12)',
                            color: isBought ? '#ffffff' : '#059669',
                            border: 'none',
                            fontSize: '0.76rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <Plus size={13} />
                          <span>{lang === 'bn' ? 'খরচে যোগ' : 'To Expense'}</span>
                        </button>
                      ) : null}

                      {/* Delete button */}
                      <button
                        onClick={() => deleteBazaarItem(item.id)}
                        style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '4px' }}
                        title={lang === 'bn' ? 'ফর্দ থেকে মুছুন' : 'Delete'}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Convert to Expense Quick Popover */}
        {convertingItem && (
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
                💸 {lang === 'bn' ? 'দৈনিক খরচের খাতায় যোগ করুন' : 'Add to Daily Expense'}
              </h4>
              <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <strong>{convertingItem.name}</strong> ({convertingItem.quantity} {convertingItem.unit}) কিনতে কত টাকা লাগলো লিখুন:
              </p>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '4px' }}>
                  {lang === 'bn' ? 'আসল খরচের পরিমাণ (টাকা ৳) *' : 'Actual Amount (৳) *'}
                </label>
                <input
                  type="number"
                  required
                  autoFocus
                  placeholder="টাকার পরিমাণ..."
                  value={actualExpenseAmount}
                  onChange={(e) => setActualExpenseAmount(e.target.value)}
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
                  onClick={() => setConvertingItem(null)}
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
                  onClick={handleConfirmConvert}
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
                  ✓ {lang === 'bn' ? 'খরচে যোগ করুন' : 'Confirm & Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Bottom Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            💡 {lang === 'bn' ? 'টিপ: ফর্দে টিক দিলে সহজেই বোঝা যাবে বাজারে আর কি কি কেনা বাকি আছে।' : 'Tip: Check items off as you buy them.'}
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
