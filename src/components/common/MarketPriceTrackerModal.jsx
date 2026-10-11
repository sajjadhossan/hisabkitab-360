import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Search,
  Plus,
  Tag,
  Store,
  Calendar,
  CheckCircle2,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Clock,
  Trash2,
  ExternalLink,
  Sparkles,
  ShoppingBag,
  Layers,
  ArrowRight
} from 'lucide-react';
import { hapticFeedback } from '../../services/nativeAppService';
import { guessFolderFromText } from '../../services/exportImportService';

const STORAGE_KEY = 'hk360_market_price_logs';

export const MarketPriceTrackerModal = ({
  isOpen,
  onClose,
  defaultProfile = 'personal'
}) => {
  const {
    profile,
    addPersonalExpense,
    addBusinessExpense,
    showToast,
    lang
  } = useApp();

  const [activeProfile, setActiveProfile] = useState(defaultProfile || profile || 'personal');
  const [activeTab, setActiveTab] = useState('wishlist'); // 'wishlist' | 'logs' | 'purchased'
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('কেজি');
  const [marketName, setMarketName] = useState('');
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [categoryFolder, setCategoryFolder] = useState('');

  // Price Logs State
  const [priceLogs, setPriceLogs] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse price logs:', e);
    }
    // Default starter items
    return [
      {
        id: 'p-1',
        name: 'মিনিকেট চাল (৫০ কেজি বস্তা)',
        price: 3450,
        quantity: 1,
        unit: 'বস্তা',
        marketName: 'কাওরান বাজার পাইকারি',
        date: new Date().toISOString().split('T')[0],
        status: 'wishlist',
        profile: 'personal',
        folder: 'গৃহস্থালি ও নিত্য কেনাকাটা',
        notes: 'আগের মাসের চেয়ে ৳৫০ কমছে'
      },
      {
        id: 'p-2',
        name: 'সয়াবিন তেল (৫ লিটার জার)',
        price: 890,
        quantity: 1,
        unit: 'জার',
        marketName: 'পাইকারি ডিপো',
        date: new Date().toISOString().split('T')[0],
        status: 'wishlist',
        profile: 'personal',
        folder: 'গৃহস্থালি ও নিত্য কেনাকাটা',
        notes: 'ভবিষ্যতে কিনব'
      },
      {
        id: 'p-3',
        name: 'প্যাকেজিং পলিথিন ও স্টেশনারি',
        price: 1200,
        quantity: 5,
        unit: 'কেজি',
        marketName: 'চকবাজার পাইকারি মার্কেট',
        date: new Date().toISOString().split('T')[0],
        status: 'wishlist',
        profile: 'business',
        folder: 'প্যাকেজিং ও সরবরাহ',
        notes: 'দোকানের জন্য লাগবে'
      }
    ];
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(priceLogs));
    } catch (e) {
      console.warn('Failed to save price logs:', e);
    }
  }, [priceLogs]);

  // Set category folder automatically when item name changes
  useEffect(() => {
    if (itemName && !categoryFolder) {
      setCategoryFolder(guessFolderFromText(itemName, activeProfile === 'business' ? 'biz_expense' : 'family'));
    }
  }, [itemName, activeProfile, categoryFolder]);

  // Handle Add Price Item
  const handleSavePriceItem = (e) => {
    e.preventDefault();
    if (!itemName.trim()) {
      showToast(lang === 'bn' ? 'পণ্যের নাম লিখুন' : 'Enter item name', 'warning');
      return;
    }
    const parsedPrice = parseFloat(itemPrice) || 0;
    if (parsedPrice <= 0) {
      showToast(lang === 'bn' ? 'সঠিক দাম উল্লেখ করুন' : 'Enter valid price', 'warning');
      return;
    }

    const newItem = {
      id: `price-${Date.now()}`,
      name: itemName.trim(),
      price: parsedPrice,
      quantity: parseFloat(quantity) || 1,
      unit: unit.trim() || 'পিস',
      marketName: marketName.trim() || (lang === 'bn' ? 'স্থানীয় বাজার' : 'Local Market'),
      date: targetDate || new Date().toISOString().split('T')[0],
      status: activeTab === 'logs' ? 'checked' : 'wishlist',
      profile: activeProfile,
      folder: categoryFolder || guessFolderFromText(itemName, activeProfile === 'business' ? 'biz_expense' : 'family'),
      notes: notes.trim()
    };

    hapticFeedback.light();
    setPriceLogs(prev => [newItem, ...prev]);
    showToast(lang === 'bn' ? `✓ "${newItem.name}" তালিকায় যুক্ত হয়েছে!` : 'Price entry saved!', 'success');

    // Reset Form
    setItemName('');
    setItemPrice('');
    setQuantity('1');
    setMarketName('');
    setNotes('');
    setCategoryFolder('');
    setShowAddForm(false);
  };

  // Convert Price Item to Real Expense (1-Click Buy)
  const handleConvertToExpense = (item) => {
    hapticFeedback.medium();
    const finalAmount = Number(item.price) || 0;

    if (item.profile === 'business') {
      addBusinessExpense({
        title: item.name,
        amount: finalAmount,
        category: item.folder || 'other',
        date: new Date().toISOString().split('T')[0],
        note: `মার্কেট প্রাইস খাতা থেকে সংগৃহীত (${item.marketName || 'বাজার'})`
      });
    } else {
      addPersonalExpense({
        title: item.name,
        item: item.name,
        amount: finalAmount,
        quantity: item.quantity,
        unit: item.unit,
        folder: item.folder || 'গৃহস্থালি ও নিত্য কেনাকাটা',
        category: item.folder || 'গৃহস্থালি ও নিত্য কেনাকাটা',
        type: 'family',
        date: new Date().toISOString().split('T')[0],
        note: `মার্কেট প্রাইস খাতা থেকে সংগৃহীত (${item.marketName || 'বাজার'})`
      });
    }

    // Mark as purchased
    setPriceLogs(prev => prev.map(p => p.id === item.id ? { ...p, status: 'purchased', purchasedAt: new Date().toISOString() } : p));
    showToast(lang === 'bn' ? `🎉 "${item.name}" (৳${finalAmount.toLocaleString('en-IN')}) রানিং খরচে যুক্ত হয়েছে!` : 'Converted to active expense!', 'success');
  };

  // Delete Price Item
  const handleDeleteItem = (id) => {
    hapticFeedback.light();
    setPriceLogs(prev => prev.filter(p => p.id !== id));
    showToast(lang === 'bn' ? 'আইটেমটি তালিকা থেকে মোছা হয়েছে' : 'Item removed');
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return priceLogs.filter(p => {
      const matchProfile = p.profile === activeProfile;
      const matchTab = activeTab === 'all' 
        ? true 
        : activeTab === 'wishlist' 
          ? p.status === 'wishlist' 
          : activeTab === 'purchased' 
            ? p.status === 'purchased' 
            : p.status === 'checked';
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.marketName && p.marketName.toLowerCase().includes(q));
      return matchProfile && matchTab && matchSearch;
    });
  }, [priceLogs, activeProfile, activeTab, searchQuery]);

  // Overall Totals
  const tabTotals = useMemo(() => {
    const list = priceLogs.filter(p => p.profile === activeProfile);
    const wishlistItems = list.filter(p => p.status === 'wishlist');
    const checkedItems = list.filter(p => p.status === 'checked');
    const purchasedItems = list.filter(p => p.status === 'purchased');
    return {
      wishlistCount: wishlistItems.length,
      wishlistSum: wishlistItems.reduce((s, i) => s + (Number(i.price) || 0), 0),
      checkedCount: checkedItems.length,
      purchasedCount: purchasedItems.length
    };
  }, [priceLogs, activeProfile]);

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
        zIndex: 1350,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: 'max(12px, env(safe-area-inset-top, 12px)) 10px max(16px, env(safe-area-inset-bottom, 16px))',
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-content animate-scale-up android-scroll-view"
        style={{
          maxWidth: '680px',
          width: '96%',
          marginTop: '6px',
          background: 'var(--bg-card)',
          borderRadius: '18px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          padding: '1.25rem',
          maxHeight: 'calc(100dvh - 24px)',
          overflowY: 'auto'
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
              }}
            >
              <Tag size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🏷️ মার্কেট প্রাইস চেকার ও উইশলিস্ট</span>
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'বাজারের যাচাইকৃত দরদাম লিখে রাখুন এবং ভবিষ্যতে ১-ক্লিকে কিনুন' : 'Track verified market prices & buy later in 1-click'}
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Profile Mode Switcher (Personal vs Business) */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button
            type="button"
            onClick={() => setActiveProfile('personal')}
            style={{
              flex: 1,
              padding: '7px 12px',
              borderRadius: '8px',
              border: activeProfile === 'personal' ? '2px solid #10b981' : '1px solid var(--border-color)',
              background: activeProfile === 'personal' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-main)',
              color: activeProfile === 'personal' ? '#10b981' : 'var(--text-muted)',
              fontWeight: '800',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>👤 পার্সোনাল / পারিবারিক বাজার</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveProfile('business')}
            style={{
              flex: 1,
              padding: '7px 12px',
              borderRadius: '8px',
              border: activeProfile === 'business' ? '2px solid var(--business-primary)' : '1px solid var(--border-color)',
              background: activeProfile === 'business' ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-main)',
              color: activeProfile === 'business' ? 'var(--business-primary)' : 'var(--text-muted)',
              fontWeight: '800',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>💼 দোকান / ব্যবসায়িক কেনাকাটা</span>
          </button>
        </div>

        {/* Wishlist KPI Hero Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(217, 119, 6, 0.08))',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '12px',
          padding: '12px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#d97706', textTransform: 'uppercase' }}>
              {lang === 'bn' ? '🛒 মোট পরিকল্পিত কেনাকাটার বাজেট:' : 'Total Planned Budget:'}
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: '900', color: 'var(--text-main)', marginTop: '2px' }}>
              ৳{tabTotals.wishlistSum.toLocaleString('en-IN')}
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginLeft: '6px' }}>
                ({tabTotals.wishlistCount}টি আইটেম পেন্ডিং)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              padding: '8px 14px',
              borderRadius: '9px',
              background: showAddForm ? 'var(--bg-card)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: showAddForm ? 'var(--text-main)' : '#ffffff',
              border: showAddForm ? '1px solid var(--border-color)' : 'none',
              fontWeight: '800',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: showAddForm ? 'none' : '0 4px 12px rgba(245, 158, 11, 0.35)'
            }}
          >
            {showAddForm ? <X size={15} /> : <Plus size={15} />}
            <span>{showAddForm ? (lang === 'bn' ? 'ফর্ম বন্ধ' : 'Close') : (lang === 'bn' ? 'নতুন দরদাম লিখুন' : 'Log New Price')}</span>
          </button>
        </div>

        {/* Add Price Item Form Modal Drawer */}
        {showAddForm && (
          <form onSubmit={handleSavePriceItem} style={{
            background: 'var(--bg-main)',
            border: '1.5px solid var(--border-color)',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ fontSize: '0.86rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={15} style={{ color: '#f59e0b' }} />
              <span>{lang === 'bn' ? 'নতুন পণ্যের বাজার দর বা উইশলিস্ট এন্ট্রি' : 'Add Price / Wishlist Item'}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: '700' }}>
                  {lang === 'bn' ? 'পণ্যের নাম / বিবরণ *' : 'Product Name *'}
                </label>
                <input
                  type="text"
                  placeholder="যেমন: মিনিকেট চাল, সয়াবিন তেল, ইত্যাদি"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.82rem', fontWeight: '700' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: '700' }}>
                  {lang === 'bn' ? 'যাচাইকৃত দর / দাম (৳) *' : 'Price (BDT) *'}
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="যেমন: ৩৪৫০"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: '#10b981', fontSize: '0.88rem', fontWeight: '900' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  {lang === 'bn' ? 'পরিমাণ' : 'Qty'}
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.78rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  {lang === 'bn' ? 'একক' : 'Unit'}
                </label>
                <input
                  type="text"
                  placeholder="কেজি/পিস"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.78rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  {lang === 'bn' ? 'দোকান বা বাজারের নাম' : 'Market / Shop Name'}
                </label>
                <input
                  type="text"
                  placeholder="যেমন: কাওরান বাজার, পাইকারি আড়ত"
                  value={marketName}
                  onChange={(e) => setMarketName(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.78rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  {lang === 'bn' ? 'তারিখ' : 'Date'}
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.78rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  {lang === 'bn' ? 'খরচের ক্যাটাগরি' : 'Category'}
                </label>
                <input
                  type="text"
                  value={categoryFolder}
                  onChange={(e) => setCategoryFolder(e.target.value)}
                  placeholder="যেমন: গৃহস্থালি ও নিত্য কেনাকাটা"
                  style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.78rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                {lang === 'bn' ? 'বিশেষ নোট / মন্তব্য' : 'Notes'}
              </label>
              <input
                type="text"
                placeholder="যেমন: দোকানে স্টক কম, আগামী সপ্তাহে কিনব"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.78rem' }}
              />
            </div>

            <button
              type="submit"
              style={{
                marginTop: '4px',
                padding: '9px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#fff',
                border: 'none',
                fontWeight: '800',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <CheckCircle2 size={16} />
              <span>{lang === 'bn' ? 'তালিকায় সেভ করুন' : 'Save to Price List'}</span>
            </button>
          </form>
        )}

        {/* Tab Filter & Search Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-main)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={() => setActiveTab('wishlist')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'wishlist' ? 'var(--bg-card)' : 'transparent',
                color: activeTab === 'wishlist' ? '#f59e0b' : 'var(--text-muted)',
                fontWeight: '800',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              🛒 {lang === 'bn' ? `উইশলিস্ট (${tabTotals.wishlistCount})` : `Wishlist (${tabTotals.wishlistCount})`}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'logs' ? 'var(--bg-card)' : 'transparent',
                color: activeTab === 'logs' ? '#0ea5e9' : 'var(--text-muted)',
                fontWeight: '800',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              🏷️ {lang === 'bn' ? `দর যাচাই (${tabTotals.checkedCount})` : `Price Logs (${tabTotals.checkedCount})`}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('purchased')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'purchased' ? 'var(--bg-card)' : 'transparent',
                color: activeTab === 'purchased' ? '#10b981' : 'var(--text-muted)',
                fontWeight: '800',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              ✅ {lang === 'bn' ? `কেনা সম্পন্ন (${tabTotals.purchasedCount})` : `Purchased (${tabTotals.purchasedCount})`}
            </button>
          </div>

          <div style={{ position: 'relative', minWidth: '160px', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={lang === 'bn' ? 'পণ্য বা বাজার খুঁজুন...' : 'Search item or market...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '5px 8px 5px 28px', borderRadius: '7px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.75rem' }}
            />
          </div>
        </div>

        {/* Price & Wishlist Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto' }}>
          {filteredList.length === 0 ? (
            <div style={{ padding: '30px 16px', textAlign: 'center', background: 'var(--bg-main)', borderRadius: '10px', border: '1px dashed var(--border-color)' }}>
              <ShoppingBag size={32} style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: '6px' }} />
              <div style={{ fontSize: '0.86rem', fontWeight: '700', color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'কোনো রেকর্ড পাওয়া যায়নি' : 'No records found'}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {lang === 'bn' ? 'উপরের "নতুন দরদাম লিখুন" বাটনে ক্লিক করে যোগ করুন।' : 'Click Log New Price to add one.'}
              </div>
            </div>
          ) : (
            filteredList.map((item) => (
              <div
                key={item.id}
                style={{
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '11px',
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '800', fontSize: '0.88rem', color: 'var(--text-main)' }}>
                      {item.name}
                    </span>
                    <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '8px', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', fontWeight: '700' }}>
                      {item.quantity} {item.unit}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {item.marketName && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Store size={12} color="#f59e0b" />
                        {item.marketName}
                      </span>
                    )}
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Calendar size={12} />
                      {item.date}
                    </span>
                  </div>

                  {item.notes && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontStyle: 'italic', marginTop: '1px' }}>
                      💬 {item.notes}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: '900', color: '#10b981' }}>
                      ৳{Number(item.price).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      {item.folder}
                    </div>
                  </div>

                  {/* 1-Click Buy / Convert Button */}
                  {item.status !== 'purchased' ? (
                    <button
                      type="button"
                      onClick={() => handleConvertToExpense(item)}
                      title={lang === 'bn' ? '১-ক্লিকে আসল খরচে যোগ করুন' : 'Convert to Active Expense'}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: '800',
                        fontSize: '0.74rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <ShoppingCart size={13} />
                      <span>{lang === 'bn' ? 'কিনুন' : 'Buy'}</span>
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: '800' }}>
                      ✓ কেনা হয়েছে
                    </span>
                  )}

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '3px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketPriceTrackerModal;
