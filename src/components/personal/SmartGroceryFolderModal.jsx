import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  ShoppingCart,
  Plus,
  Scale,
  TrendingUp,
  TrendingDown,
  Clock,
  Check,
  FolderPlus,
  Tag,
  DollarSign,
  User,
  Calendar,
  Sparkles,
  ArrowRight,
  History,
  Trash2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  getAllGroceryFolders,
  getItemPriceMemory,
  recordItemPrice,
  comparePrice,
  saveCustomFolder,
  addCustomItemToFolder,
  getPriceMemory
} from '../../services/groceryPriceMemoryService';
import { hapticFeedback } from '../../services/nativeAppService';

export default function SmartGroceryFolderModal({ isOpen, onClose }) {
  const {
    addPersonalExpense,
    categories = {},
    lang = 'bn',
    showToast = () => {}
  } = useApp();

  const [folders, setFolders] = useState(() => getAllGroceryFolders());
  const [activeFolderId, setActiveFolderId] = useState('veg');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedMember, setSelectedMember] = useState('পরিবার');

  // Currently active item being configured in calculator popover
  const [activeItem, setActiveItem] = useState(null);
  const [kgInput, setKgInput] = useState('');
  const [gmInput, setGmInput] = useState('');
  const [rateInput, setRateInput] = useState('');
  const [customAmountOverride, setCustomAmountOverride] = useState('');
  const [itemNote, setItemNote] = useState('');

  // Shopping Basket for multi-item quick check-out
  const [basket, setBasket] = useState([]);
  const [showPriceHistoryView, setShowPriceHistoryView] = useState(false);

  // New Folder creation state
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderIcon, setNewFolderIcon] = useState('📁');

  // New Custom Item state
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('কেজি');
  const [newItemRate, setNewItemRate] = useState('');

  const availableMembers = useMemo(() => {
    return categories.familyMembers || ['পরিবার', 'বাবা', 'মা', 'আমি', 'ভাই', 'বোন'];
  }, [categories]);

  const currentFolder = useMemo(() => {
    return folders.find(f => f.id === activeFolderId) || folders[0];
  }, [folders, activeFolderId]);

  // Filtered items based on search or folder
  const displayedItems = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const allItems = [];
      folders.forEach(f => {
        f.items.forEach(it => {
          if (it.name.toLowerCase().includes(q)) {
            allItems.push({ ...it, folderName: f.folderName, folderColor: f.color });
          }
        });
      });
      return allItems;
    }
    return currentFolder ? currentFolder.items.map(it => ({ ...it, folderName: currentFolder.folderName, folderColor: currentFolder.color })) : [];
  }, [folders, activeFolderId, searchQuery, currentFolder]);

  // Calculation for current configuring item
  const calculatedTotal = useMemo(() => {
    if (customAmountOverride && Number(customAmountOverride) > 0) {
      return Number(customAmountOverride);
    }
    const kg = Number(kgInput) || 0;
    const gm = Number(gmInput) || 0;
    const rate = Number(rateInput) || 0;
    const totalKg = kg + (gm / 1000);

    if (totalKg > 0 && rate > 0) {
      return Math.round(totalKg * rate);
    } else if (rate > 0 && !kgInput && !gmInput) {
      // If user only entered rate for 1 unit
      return rate;
    }
    return 0;
  }, [kgInput, gmInput, rateInput, customAmountOverride]);

  // Price comparison for current configuring item
  const priceComparison = useMemo(() => {
    if (!activeItem || !rateInput) return null;
    return comparePrice(activeItem.name, Number(rateInput));
  }, [activeItem, rateInput]);

  if (!isOpen) return null;

  // Handler to open calculator for an item
  const handleSelectItem = (item) => {
    hapticFeedback?.selection?.();
    const memory = getItemPriceMemory(item.name);
    const initialRate = memory?.lastRate || item.defaultRate || '';
    setActiveItem(item);
    setRateInput(String(initialRate));
    setKgInput(item.defaultUnit === 'কেজি' ? '১' : '');
    setGmInput('');
    setCustomAmountOverride('');
    setItemNote('');
  };

  const handleApplyPreset = (kgVal, gmVal) => {
    hapticFeedback?.light?.();
    setKgInput(kgVal);
    setGmInput(gmVal);
    setCustomAmountOverride('');
  };

  const buildQuantityString = () => {
    const kg = Number(kgInput) || 0;
    const gm = Number(gmInput) || 0;
    const parts = [];
    if (kg > 0) parts.push(`${kg} কেজি`);
    if (gm > 0) parts.push(`${gm} গ্রাম`);
    if (parts.length === 0 && activeItem) {
      return `১ ${activeItem.defaultUnit || 'একক'}`;
    }
    return parts.join(' ');
  };

  // Add directly to family expenses
  const handleDirectSaveExpense = () => {
    if (!activeItem || calculatedTotal <= 0) {
      showToast(lang === 'bn' ? 'দয়া করে পরিমাণ ও দর উল্লেখ করুন' : 'Please provide quantity and rate');
      return;
    }

    const qtyStr = buildQuantityString();
    const rateVal = Number(rateInput) || 0;

    // Record price memory
    recordItemPrice(activeItem.name, {
      rate: rateVal,
      unit: activeItem.defaultUnit || 'কেজি',
      amount: calculatedTotal,
      quantity: qtyStr,
      date: selectedDate
    });

    // Save to AppContext personalExpenses
    addPersonalExpense({
      folder: 'গৃহস্থালি ও নিত্য কেনাকাটা',
      category: activeItem.folderName || currentFolder?.folderName || 'কাঁচাবাজার',
      item: activeItem.name,
      amount: calculatedTotal,
      quantity: qtyStr,
      rate: rateVal,
      unit: activeItem.defaultUnit || 'কেজি',
      person: selectedMember,
      date: selectedDate,
      note: itemNote || (priceComparison?.hasHistory ? `[দর মেমোরি: ${priceComparison.label}]` : '')
    });

    hapticFeedback?.success?.();
    showToast(lang === 'bn' ? `✓ ${activeItem.name} (৳${calculatedTotal}) খরচে যোগ হয়েছে!` : `Added ${activeItem.name} to expenses!`);
    setActiveItem(null);
  };

  // Add to basket
  const handleAddToBasket = () => {
    if (!activeItem || calculatedTotal <= 0) {
      showToast(lang === 'bn' ? 'দয়া করে পরিমাণ ও দর উল্লেখ করুন' : 'Please provide quantity and rate');
      return;
    }

    const qtyStr = buildQuantityString();
    const rateVal = Number(rateInput) || 0;

    const basketItem = {
      id: 'basket_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      name: activeItem.name,
      folderName: activeItem.folderName || currentFolder?.folderName || 'কাঁচাবাজার',
      unit: activeItem.defaultUnit || 'কেজি',
      quantity: qtyStr,
      rate: rateVal,
      amount: calculatedTotal,
      note: itemNote
    };

    setBasket(prev => [basketItem, ...prev]);
    hapticFeedback?.light?.();
    showToast(lang === 'bn' ? `✓ ${activeItem.name} ঝুড়িতে যুক্ত হয়েছে` : `Added ${activeItem.name} to basket`);
    setActiveItem(null);
  };

  // Save all items from basket
  const handleSaveAllFromBasket = () => {
    if (basket.length === 0) return;

    basket.forEach(item => {
      recordItemPrice(item.name, {
        rate: item.rate,
        unit: item.unit,
        amount: item.amount,
        quantity: item.quantity,
        date: selectedDate
      });

      addPersonalExpense({
        folder: 'গৃহস্থালি ও নিত্য কেনাকাটা',
        category: item.folderName,
        item: item.name,
        amount: item.amount,
        quantity: item.quantity,
        rate: item.rate,
        unit: item.unit,
        person: selectedMember,
        date: selectedDate,
        note: item.note || ''
      });
    });

    hapticFeedback?.success?.();
    showToast(lang === 'bn' ? `✓ ঝুড়ির মোট ${basket.length}টি বাজার সফলভাবে খরচে যোগ হয়েছে!` : `Successfully saved ${basket.length} items to expenses!`);
    setBasket([]);
  };

  // Handle adding new custom folder
  const handleCreateNewFolder = (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    saveCustomFolder(newFolderName.trim(), newFolderIcon || '📁');
    setFolders(getAllGroceryFolders());
    setNewFolderName('');
    setShowNewFolderModal(false);
    showToast(lang === 'bn' ? 'নতুন ফোল্ডার তৈরি হয়েছে!' : 'New folder created!');
  };

  // Handle adding new item to current folder
  const handleCreateNewItem = (e) => {
    e.preventDefault();
    if (!newItemName.trim() || !activeFolderId) return;
    addCustomItemToFolder(activeFolderId, newItemName.trim(), newItemUnit, Number(newItemRate) || 0);
    setFolders(getAllGroceryFolders());
    setNewItemName('');
    setNewItemRate('');
    setShowNewItemModal(false);
    showToast(lang === 'bn' ? 'নতুন বাজার আইটেম যুক্ত হয়েছে!' : 'New item added to folder!');
  };

  const allPriceMemory = getPriceMemory();
  const priceHistoryList = Object.values(allPriceMemory).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '880px',
          maxHeight: '92vh',
          backgroundColor: 'var(--surface-color, #1e2230)',
          borderRadius: '24px',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6), 0 0 40px rgba(59, 130, 246, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: 'var(--text-primary, #f8fafc)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}
            >
              <ShoppingCart size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                  {lang === 'bn' ? 'রেগুলার বাজার ফোল্ডার ও প্রাইস মেমোরি' : 'Smart Grocery Folders & Price Memory'}
                </h2>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    fontWeight: 600
                  }}
                >
                  {lang === 'bn' ? 'প্রাইস ইন্টেলিজেন্স' : 'Price Intelligence'}
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)' }}>
                {lang === 'bn'
                  ? 'ফোল্ডার থেকে আইটেম বেছে নিন, কেজি/গ্রাম হিসাব করুন এবং পূর্বের দর যাচাই করুন'
                  : 'Pick items by category folders, calculate weight in kg/gm and compare price trends'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setShowPriceHistoryView(prev => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                backgroundColor: showPriceHistoryView ? '#3b82f6' : 'rgba(255, 255, 255, 0.06)',
                color: showPriceHistoryView ? '#ffffff' : 'var(--text-primary, #f8fafc)',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              <History size={16} />
              {lang === 'bn' ? 'দর হিস্ট্রি' : 'Price History'}
            </button>
            <button
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-secondary, #94a3b8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Global Toolbar: Date, Member, Search */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {/* Search */}
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary, #94a3b8)'
              }}
            />
            <input
              type="text"
              placeholder={lang === 'bn' ? 'বাজারের আইটেম খুঁজুন (আলু, পেঁয়াজ, তেল, ডিম...)' : 'Search items...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 38px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                color: '#ffffff',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Member Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={16} style={{ color: 'var(--text-secondary, #94a3b8)' }} />
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                color: '#ffffff',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            >
              {availableMembers.map(m => (
                <option key={m} value={m} style={{ backgroundColor: '#1e2230', color: '#fff' }}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} style={{ color: 'var(--text-secondary, #94a3b8)' }} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                color: '#ffffff',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Body Area */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {showPriceHistoryView ? (
            /* Price History View */
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <History size={18} color="#3b82f6" />
                  {lang === 'bn' ? 'পূর্বের ক্রয়ের দর হিস্ট্রি ও মেমোরি' : 'Historical Price Memory'}
                </h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)' }}>
                  {priceHistoryList.length} {lang === 'bn' ? 'টি আইটেম সংরক্ষিত' : 'items memorized'}
                </span>
              </div>

              {priceHistoryList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary, #94a3b8)' }}>
                  <ShoppingCart size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                  <p>{lang === 'bn' ? 'এখনো কোনো বাজার খরচের দর রেকর্ড করা হয়নি।' : 'No price records saved yet.'}</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                  {priceHistoryList.map(mem => (
                    <div
                      key={mem.itemName}
                      style={{
                        padding: '14px',
                        borderRadius: '14px',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{mem.itemName}</span>
                        <span
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            padding: '2px 8px',
                            borderRadius: '6px'
                          }}
                        >
                          ৳{mem.lastRate}/{mem.lastUnit || 'কেজি'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>সর্বশেষ কেনা: {mem.lastDate}</span>
                        {mem.lastQuantity && <span>পরিমাণ: {mem.lastQuantity}</span>}
                      </div>
                      {mem.previousRate && (
                        <div style={{ fontSize: '0.75rem', color: mem.lastRate > mem.previousRate ? '#f59e0b' : '#10b981' }}>
                          আগের দর ছিল: ৳{mem.previousRate} ({mem.lastRate > mem.previousRate ? 'বেড়েছে' : 'কমেছে'})
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Left Sidebar: Folder Tabs */}
              <div
                style={{
                  width: '240px',
                  borderRight: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                  backgroundColor: 'rgba(0, 0, 0, 0.15)',
                  padding: '12px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary, #94a3b8)', padding: '4px 8px', fontWeight: 600 }}>
                  {lang === 'bn' ? 'বাজারের ফোল্ডারসমূহ' : 'Grocery Folders'}
                </div>

                {folders.map(f => {
                  const isActive = f.id === activeFolderId && !searchQuery.trim();
                  return (
                    <button
                      key={f.id}
                      onClick={() => {
                        hapticFeedback?.light?.();
                        setActiveFolderId(f.id);
                        setSearchQuery('');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: isActive ? 'rgba(59, 130, 246, 0.18)' : 'transparent',
                        color: isActive ? '#60a5fa' : 'var(--text-secondary, #94a3b8)',
                        fontWeight: isActive ? 600 : 500,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>{f.icon}</span>
                      <span style={{ flex: 1, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {f.folderName}
                      </span>
                      <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                        {f.items.length}
                      </span>
                    </button>
                  );
                })}

                <button
                  onClick={() => setShowNewFolderModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: '1px dashed rgba(255, 255, 255, 0.2)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-secondary, #94a3b8)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    marginTop: '8px'
                  }}
                >
                  <FolderPlus size={16} />
                  {lang === 'bn' ? '+ নতুন ফোল্ডার' : '+ Add Folder'}
                </button>
              </div>

              {/* Center Content: Items Grid */}
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                      {searchQuery.trim()
                        ? `অনুসন্ধান ফলাফল ("${searchQuery}")`
                        : `${currentFolder?.icon || '📁'} ${currentFolder?.folderName || ''}`}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)' }}>
                      {displayedItems.length} {lang === 'bn' ? 'টি আইটেম উপলভ্য' : 'items available'}
                    </span>
                  </div>

                  {!searchQuery.trim() && (
                    <button
                      onClick={() => setShowNewItemModal(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        color: '#60a5fa',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={14} />
                      {lang === 'bn' ? 'নতুন আইটেম যোগ' : 'Add Item'}
                    </button>
                  )}
                </div>

                {/* Items Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: '12px'
                  }}
                >
                  {displayedItems.map(item => {
                    const memory = getItemPriceMemory(item.name);
                    const isSelected = activeItem?.name === item.name;

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectItem(item)}
                        style={{
                          padding: '12px',
                          borderRadius: '16px',
                          backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                          border: isSelected
                            ? '1px solid #3b82f6'
                            : '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          transition: 'all 0.15s',
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.name}</span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary, #94a3b8)',
                              backgroundColor: 'rgba(255, 255, 255, 0.06)',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}
                          >
                            {item.defaultUnit || 'কেজি'}
                          </span>
                        </div>

                        {/* Price Memory Tag */}
                        {memory ? (
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: '#10b981',
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                              padding: '4px 8px',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              marginTop: 'auto'
                            }}
                          >
                            <Sparkles size={12} />
                            <span>পূর্বের দর: ৳{memory.lastRate}/{memory.lastUnit || 'একক'}</span>
                          </div>
                        ) : (
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary, #94a3b8)',
                              marginTop: 'auto'
                            }}
                          >
                            দর: ৳{item.defaultRate || '০'}/{item.defaultUnit}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Active Item Weight & Rate Calculator Drawer/Sheet */}
        {activeItem && (
          <div
            style={{
              padding: '18px 24px',
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              borderTop: '2px solid #3b82f6',
              boxShadow: '0 -10px 25px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              animation: 'slideUp 0.2s ease-out'
            }}
          >
            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#60a5fa' }}>
                  {activeItem.name}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)' }}>
                  ({activeItem.defaultUnit || 'কেজি'})
                </span>

                {/* Price intelligence indicator */}
                {priceComparison && priceComparison.hasHistory && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '999px',
                      backgroundColor:
                        priceComparison.trend === 'up'
                          ? 'rgba(239, 68, 68, 0.2)'
                          : priceComparison.trend === 'down'
                          ? 'rgba(16, 185, 129, 0.2)'
                          : 'rgba(59, 130, 246, 0.2)',
                      color:
                        priceComparison.trend === 'up'
                          ? '#f87171'
                          : priceComparison.trend === 'down'
                          ? '#34d399'
                          : '#60a5fa',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    {priceComparison.label}
                  </span>
                )}
              </div>

              <button
                onClick={() => setActiveItem(null)}
                style={{
                  border: 'none',
                  background: 'none',
                  color: 'var(--text-secondary, #94a3b8)',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Presets for weight */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', fontWeight: 500 }}>
                {lang === 'bn' ? 'দ্রুত ওজন:' : 'Quick Weight:'}
              </span>
              {[
                { label: '২৫০ গ্রাম', kg: '0', gm: '250' },
                { label: '৫০০ গ্রাম', kg: '0', gm: '500' },
                { label: '৭৫০ গ্রাম', kg: '0', gm: '750' },
                { label: '১ কেজি', kg: '1', gm: '0' },
                { label: '১.৫ কেজি', kg: '1', gm: '500' },
                { label: '২ কেজি', kg: '2', gm: '0' },
                { label: '৫ কেজি', kg: '5', gm: '0' }
              ].map(preset => (
                <button
                  key={preset.label}
                  onClick={() => handleApplyPreset(preset.kg, preset.gm)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    backgroundColor:
                      kgInput === preset.kg && gmInput === preset.gm
                        ? '#3b82f6'
                        : 'rgba(255, 255, 255, 0.08)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer'
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Granular Weight Inputs & Rate */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '12px',
                alignItems: 'center'
              }}
            >
              {/* Kg Input */}
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'bn' ? 'কেজি (Kg)' : 'Kilograms'}
                </label>
                <input
                  type="number"
                  placeholder="১"
                  value={kgInput}
                  onChange={(e) => {
                    setKgInput(e.target.value);
                    setCustomAmountOverride('');
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Gm Input */}
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'bn' ? 'গ্রাম (Gm)' : 'Grams'}
                </label>
                <input
                  type="number"
                  placeholder="২৫০"
                  value={gmInput}
                  onChange={(e) => {
                    setGmInput(e.target.value);
                    setCustomAmountOverride('');
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Rate / Kg Input */}
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'bn' ? 'দর / প্রতি কেজি রেট (৳)' : 'Rate / Kg (BDT)'}
                </label>
                <input
                  type="number"
                  placeholder="৬০"
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Total Calculated BDT Display */}
              <div
                style={{
                  padding: '8px 14px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                  {lang === 'bn' ? 'মোট খরচ (৳)' : 'Total BDT'}
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>
                  ৳{calculatedTotal}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button
                onClick={handleAddToBasket}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <ShoppingCart size={16} />
                {lang === 'bn' ? 'ঝুড়িতে রাখুন' : 'Add to Basket'}
              </button>

              <button
                onClick={handleDirectSaveExpense}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 20px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
                }}
              >
                <Check size={16} />
                {lang === 'bn' ? 'সরাসরি খরচে যোগ করুন' : 'Instant Add to Expenses'}
              </button>
            </div>
          </div>
        )}

        {/* Floating Shopping Basket Tray (if items are in basket) */}
        {basket.length > 0 && !activeItem && (
          <div
            style={{
              padding: '12px 24px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              borderTop: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700
                }}
              >
                {basket.length}
              </div>
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  {lang === 'bn' ? 'বাজারের ঝুড়ি প্রস্তুত' : 'Basket Ready'}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)', marginLeft: '8px' }}>
                  মোট: ৳{basket.reduce((sum, it) => sum + it.amount, 0)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setBasket([])}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#f87171',
                  border: 'none',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                {lang === 'bn' ? 'ঝুড়ি খালি করুন' : 'Clear Basket'}
              </button>
              <button
                onClick={handleSaveAllFromBasket}
                style={{
                  padding: '7px 18px',
                  borderRadius: '8px',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Check size={16} />
                {lang === 'bn' ? 'সবগুলো সেভ করুন' : 'Save All Items'}
              </button>
            </div>
          </div>
        )}

        {/* Modal: New Custom Folder */}
        {showNewFolderModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: '16px'
            }}
          >
            <form
              onSubmit={handleCreateNewFolder}
              style={{
                width: '100%',
                maxWidth: '400px',
                backgroundColor: '#1e2230',
                borderRadius: '18px',
                padding: '20px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <h4 style={{ margin: 0, fontSize: '1.1rem' }}>
                {lang === 'bn' ? 'নতুন বাজার ফোল্ডার তৈরি' : 'Create Grocery Folder'}
              </h4>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  {lang === 'bn' ? 'ফোল্ডারের নাম:' : 'Folder Name:'}
                </label>
                <input
                  type="text"
                  placeholder="যেমন: মসলাপাতি বা ফ্রোজেন ফুড"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    outline: 'none'
                  }}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {lang === 'bn' ? 'তৈরি করুন' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: New Custom Item */}
        {showNewItemModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: '16px'
            }}
          >
            <form
              onSubmit={handleCreateNewItem}
              style={{
                width: '100%',
                maxWidth: '400px',
                backgroundColor: '#1e2230',
                borderRadius: '18px',
                padding: '20px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <h4 style={{ margin: 0, fontSize: '1.1rem' }}>
                {lang === 'bn' ? 'ফোল্ডারে নতুন আইটেম যুক্ত করুন' : 'Add Item to Folder'}
              </h4>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  {lang === 'bn' ? 'আইটেমের নাম:' : 'Item Name:'}
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ক্যাপসিকাম বা মাশরুম"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    outline: 'none'
                  }}
                  autoFocus
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    {lang === 'bn' ? 'পরিমাপের একক:' : 'Unit:'}
                  </label>
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#fff',
                      outline: 'none'
                    }}
                  >
                    <option value="কেজি">কেজি</option>
                    <option value="গ্রাম">গ্রাম</option>
                    <option value="লিটার">লিটার</option>
                    <option value="ডজন">ডজন</option>
                    <option value="হালি">হালি</option>
                    <option value="পিস">পিস</option>
                    <option value="প্যাকেট">প্যাকেট</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    {lang === 'bn' ? 'ডিফল্ট রেট (৳):' : 'Default Rate:'}
                  </label>
                  <input
                    type="number"
                    placeholder="১০০"
                    value={newItemRate}
                    onChange={(e) => setNewItemRate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#fff',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowNewItemModal(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#10b981',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {lang === 'bn' ? 'যোগ করুন' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
