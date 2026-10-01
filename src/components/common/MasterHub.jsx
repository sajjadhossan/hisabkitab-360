import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import HealthcareHub from '../healthcare/HealthcareHub';
import {
  FolderOpen,
  Boxes,
  Scale,
  Building2,
  Utensils,
  Briefcase,
  HandCoins,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  Tag,
  ArrowRight,
  SlidersHorizontal,
  Home
} from 'lucide-react';

const EMOJI_PALETTE = ['🏷️', '🛢️', '🍚', '🫘', '🥛', '🥤', '🧂', '🍪', '🧴', '🥩', '🐟', '🍎', '👕', '📱', '💊', '🍞', '☕', '🍗', '📦', '⭐', '🔥'];

const POPULAR_CATEGORY_PRESETS = [
  'মুদি পণ্য', 'তেল ও ঘি', 'চাল ও শস্য', 'ডাল ও ডালজাতীয়', 'দুধ ও দুগ্ধজাত',
  'পানীয় ও কোমল ড্রিংকস', 'মসলা ও নিত্যপণ্য', 'স্ন্যাক্স ও বিস্কুট', 'বেকারি ও মিষ্টি',
  'কসমেটিকস ও রূপচর্চা', 'ব্যক্তিগত হাইজিন', 'পরিষ্কারক সামগ্রী', 'স্টেশনারি ও খাতা',
  'মাছ ও মাংস', 'ফলমূল ও শাকসবজি', 'ওষুধ ও ফার্মেসি', 'পোশাক ও ফ্যাশন', 'ইলেকট্রনিক্স ও গেজেট'
];

const POPULAR_UNIT_PRESETS = [
  'কেজি (kg)', 'গ্রাম (gm)', 'লিটার (L)', 'মিলি (ml)', 'পিস (pcs)', 'প্যাকেট (pkt)',
  'ডজন (doz)', 'বস্তা (sack)', 'কার্টন (ctn)', 'বক্স (box)', 'গজ (yd)', 'মিটার (m)',
  'প্লেট (plate)', 'কাপ (cup)', 'স্ট্রিপ / পাতা (strip)'
];

const POPULAR_BRAND_PRESETS = [
  'রূপচাঁদা (Rupchanda)', 'তীর (Teer)', 'ফ্রেশ (Fresh)', 'বসুন্ধরা (Bashundhara)',
  'প্রাণ (PRAN)', 'স্কয়ার (Square)', 'এসিআই (ACI)', 'নেসলে (Nestle)',
  'ইউনিলিভার (Unilever)', 'ইস্পাহানি (Ispahani)', 'রাধুনী (Radhuni)', 'আকিজ (Akij)',
  'ডানো (Dano)', 'ম্যাগি (Maggi)', 'কোকাকোলা (Coca-Cola)', 'পেপসি (Pepsi)', 'সাধারণ / নন-ব্র্যান্ড'
];

const POPULAR_TABLE_PRESETS = [
  'টেবিল ০১', 'টেবিল ০২', 'টেবিল ০৩', 'টেবিল ০৪', 'টেবিল ০৫', 'টেবিল ০৬',
  'টেবিল ০৭', 'টেবিল ০৮', 'টেবিল ০৯', 'টেবিল ১০', 'ভিআইপি কেবিন ১', 'ভিআইপি কেবিন ২',
  'রুফটপ ১', 'রুফটপ ২', 'পার্সেল / টেকঅ্যাওয়ে কাউন্টার'
];

export const MasterHub = ({ onNavigateToPos, onNavigateToInventory }) => {
  const {
    categories,
    addCategory,
    renameCategory,
    deleteCategory,
    resetCategories,
    products = [],
    personalExpenses = [],
    businessExpenses = [],
    personalDebts = [],
    businessDebts = [],
    lang = 'bn',
    showToast
  } = useApp();

  // Active sub-tab in Master Hub
  // 'folders' | 'categories' | 'units' | 'brands' | 'tables' | 'expenses' | 'debts'
  const [activeTab, setActiveTab] = useState('folders');

  // Search input for quick lookup inside active tab
  const [searchTerm, setSearchTerm] = useState('');

  // Editing state for rename: { group, originalName, currentInput }
  const [editingItem, setEditingItem] = useState(null);

  // Single item quick add input
  const [quickAddInput, setQuickAddInput] = useState('');

  // ------------------------------------------------------------------
  // POS QUICK FILTER FOLDERS (Managed from localStorage & synced with POS)
  // ------------------------------------------------------------------
  const [posFolders, setPosFolders] = useState(() => {
    try {
      const saved = localStorage.getItem('hk360_pos_quick_filters');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'all',
        label: 'সব পণ্য',
        enLabel: 'All Products',
        icon: '📦',
        keywords: [],
        subFilters: []
      },
      {
        id: 'oil',
        label: 'তেল ও ঘি',
        enLabel: 'Edible Oil',
        icon: '🛢️',
        keywords: ['তেল', 'oil', 'ঘি', 'ghee', 'সয়াবিন', 'সরিষা', 'soyabean', 'mustard'],
        subFilters: [
          { label: 'সব তেল', keyword: '' },
          { label: 'রূপচাঁদা', keyword: 'রূপচাঁদা' },
          { label: 'তীর', keyword: 'তীর' },
          { label: 'ফ্রেশ', keyword: 'ফ্রেশ' },
          { label: 'বসুন্ধরা', keyword: 'বসুন্ধরা' },
          { label: 'সয়াবিন', keyword: 'সয়াবিন' },
          { label: 'সরিষা', keyword: 'সরিষা' },
          { label: 'ঘি', keyword: 'ঘি' }
        ]
      },
      {
        id: 'rice',
        label: 'চাল ও শস্য',
        enLabel: 'Rice & Grains',
        icon: '🍚',
        keywords: ['চাল', 'rice', 'নাজিরশাইল', 'মিনিকেট', 'বাসমতী', 'পোলাও', 'চিনিগুঁড়া', 'আমন'],
        subFilters: [
          { label: 'সব চাল', keyword: '' },
          { label: 'নাজিরশাইল', keyword: 'নাজিরশাইল' },
          { label: 'মিনিকেট', keyword: 'মিনিকেট' },
          { label: 'বাসমতী', keyword: 'বাসমতী' },
          { label: 'চিনিগুঁড়া', keyword: 'চিনিগুঁড়া' },
          { label: 'প্রাণ চাল', keyword: 'প্রাণ' }
        ]
      },
      {
        id: 'dal',
        label: 'ডাল ও ডালজাতীয়',
        enLabel: 'Lentils & Pulses',
        icon: '🫘',
        keywords: ['ডাল', 'dal', 'মসুর', 'মুগ', 'খেসারি', 'ছোলা', 'বুট', 'অড়হর'],
        subFilters: [
          { label: 'সব ডাল', keyword: '' },
          { label: 'মসুর ডাল', keyword: 'মসুর' },
          { label: 'মুগ ডাল', keyword: 'মুগ' },
          { label: 'ছোলা বুট', keyword: 'ছোলা' }
        ]
      },
      {
        id: 'dairy',
        label: 'দুধ ও মিষ্টি',
        enLabel: 'Dairy & Sweets',
        icon: '🥛',
        keywords: ['দুধ', 'milk', 'দই', 'মিষ্টি', 'পনির', 'মাখন', 'ছানা', 'ডানো', 'মিল্কভিটা'],
        subFilters: [
          { label: 'সব দুগ্ধজাত', keyword: '' },
          { label: 'তরল দুধ', keyword: 'তরল' },
          { label: 'গুঁড়ো দুধ', keyword: 'গুঁড়ো' },
          { label: 'দই ও মিষ্টি', keyword: 'মিষ্টি' }
        ]
      },
      {
        id: 'drinks',
        label: 'পানীয় ও জুস',
        enLabel: 'Beverages & Juice',
        icon: '🥤',
        keywords: ['পানি', 'ড্রিংক', 'জুস', 'কোক', 'স্প্রাইট', 'সেভেনআপ', 'চা', 'কফি', 'tea', 'coffee'],
        subFilters: [
          { label: 'সব পানীয়', keyword: '' },
          { label: 'কোমল পানীয়', keyword: 'কোক' },
          { label: 'জুস ও লাচ্ছি', keyword: 'জুস' },
          { label: 'চা ও কফি', keyword: 'চা' },
          { label: 'মিনারেল ওয়াটার', keyword: 'পানি' }
        ]
      },
      {
        id: 'spices',
        label: 'মসলা ও নিত্যপণ্য',
        enLabel: 'Spices & Essentials',
        icon: '🧂',
        keywords: ['মসলা', 'মরিচ', 'হলুদ', 'লবণ', 'চিনি', 'জিরা', 'লবঙ্গ', 'দারুচিনি', 'এলাচ'],
        subFilters: [
          { label: 'সব মসলা', keyword: '' },
          { label: 'হলুদ ও মরিচ', keyword: 'মরিচ' },
          { label: 'লবণ ও চিনি', keyword: 'লবণ' },
          { label: 'গরম মসলা', keyword: 'জিরা' }
        ]
      },
      {
        id: 'snacks',
        label: 'স্ন্যাক্স ও বিস্কুট',
        enLabel: 'Snacks & Bakery',
        icon: '🍪',
        keywords: ['বিস্কুট', 'চিপস', 'চানাচুর', 'নুডলস', 'কেক', 'ট্রিট', 'রুটি', 'পাউরুটি'],
        subFilters: [
          { label: 'সব স্ন্যাক্স', keyword: '' },
          { label: 'বিস্কুট', keyword: 'বিস্কুট' },
          { label: 'চানাচুর ও চিপস', keyword: 'চিপস' },
          { label: 'নুডলস ও পাস্তা', keyword: 'নুডলস' }
        ]
      },
      {
        id: 'care',
        label: 'কসমেটিকস ও কেয়ার',
        enLabel: 'Personal Care',
        icon: '🧴',
        keywords: ['সাবান', 'শ্যাম্পু', 'ক্রিম', 'তেল', 'পেস্ট', 'ব্রাশ', 'লোশন', 'হ্যান্ডওয়াশ'],
        subFilters: [
          { label: 'সব কেয়ার', keyword: '' },
          { label: 'সাবান ও শ্যাম্পু', keyword: 'সাবান' },
          { label: 'টুথপেস্ট ও ব্রাশ', keyword: 'পেস্ট' },
          { label: 'লোশন ও ক্রিম', keyword: 'লোশন' }
        ]
      }
    ];
  });

  // Folder creation form state
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [folderForm, setFolderForm] = useState({
    label: '',
    enLabel: '',
    icon: '🏷️',
    keywords: '',
    subFilters: ''
  });

  // Save POS folders to localStorage
  const savePosFolders = (updated) => {
    setPosFolders(updated);
    try {
      localStorage.setItem('hk360_pos_quick_filters', JSON.stringify(updated));
      showToast(lang === 'bn' ? 'ফোল্ডার তালিকা সফলভাবে সংরক্ষিত হয়েছে' : 'Folders saved successfully');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteFolder = (folderId) => {
    if (folderId === 'all') {
      showToast(lang === 'bn' ? 'সব পণ্য ফোল্ডারটি মোছা যাবে না' : 'Default folder cannot be deleted', 'warning');
      return;
    }
    if (window.confirm(lang === 'bn' ? 'আপনি কি এই ফোল্ডার শর্টকাটটি মুছে ফেলতে চান?' : 'Delete this folder shortcut?')) {
      const updated = posFolders.filter(f => f.id !== folderId);
      savePosFolders(updated);
    }
  };

  const handleCreateFolder = (e) => {
    e.preventDefault();
    if (!folderForm.label.trim()) {
      showToast(lang === 'bn' ? 'ফোল্ডারের নাম লিখুন' : 'Folder name required', 'warning');
      return;
    }

    const keywordsArray = folderForm.keywords
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(Boolean);

    const subFiltersArray = folderForm.subFilters
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => ({
        label: s,
        keyword: s.toLowerCase()
      }));

    const newFolder = {
      id: `folder-${Date.now()}`,
      label: folderForm.label.trim(),
      enLabel: folderForm.enLabel.trim() || folderForm.label.trim(),
      icon: folderForm.icon || '🏷️',
      keywords: keywordsArray.length > 0 ? keywordsArray : [folderForm.label.trim().toLowerCase()],
      subFilters: subFiltersArray.length > 0 ? [
        { label: lang === 'bn' ? `সব ${folderForm.label.trim()}` : `All ${folderForm.label.trim()}`, keyword: '' },
        ...subFiltersArray
      ] : []
    };

    const updated = [...posFolders, newFolder];
    savePosFolders(updated);

    // Reset form
    setFolderForm({
      label: '',
      enLabel: '',
      icon: '🏷️',
      keywords: '',
      subFilters: ''
    });
    setShowAddFolderModal(false);
  };

  // ------------------------------------------------------------------
  // GENERIC CATEGORY LIST HELPERS (for productCategories, productUnits, etc.)
  // ------------------------------------------------------------------
  const getActiveGroupKey = () => {
    switch (activeTab) {
      case 'categories': return 'productCategories';
      case 'units': return 'productUnits';
      case 'brands': return 'productBrands';
      case 'tables': return 'restaurantTables';
      case 'familyMembers': return 'familyMembers';
      case 'subCategories': return 'expenseSubCategories';
      case 'purposes': return 'expensePurposes';
      case 'expenses': return 'businessExpenseCategories';
      case 'debts': return 'debtBusinessRelations';
      default: return 'productCategories';
    }
  };

  const currentList = categories[getActiveGroupKey()] || [];

  // Count usage of items
  const getItemUsageCount = (item) => {
    const key = getActiveGroupKey();
    if (key === 'productCategories') {
      return products.filter(p => p.category === item).length;
    }
    if (key === 'productUnits') {
      const pCount = products.filter(p => p.unit === item).length;
      const eCount = personalExpenses.filter(e => e.unit === item).length;
      return pCount + eCount;
    }
    if (key === 'productBrands') {
      return products.filter(p => p.brand === item || (p.name && p.name.includes(item))).length;
    }
    if (key === 'businessExpenseCategories') {
      return businessExpenses.filter(e => e.category === item).length;
    }
    if (key === 'debtBusinessRelations') {
      return businessDebts.filter(d => d.relation === item).length;
    }
    if (key === 'familyMembers') {
      return personalExpenses.filter(e => e.familyMember === item).length;
    }
    if (key === 'expenseSubCategories') {
      return personalExpenses.filter(e => e.subCategory === item).length;
    }
    if (key === 'expensePurposes') {
      return personalExpenses.filter(e => e.purpose === item).length;
    }
    return 0;
  };

  const handleQuickAdd = (nameToAdd) => {
    const clean = (nameToAdd || quickAddInput).trim();
    if (!clean) return;
    const groupKey = getActiveGroupKey();
    const success = addCategory(groupKey, clean);
    if (success) {
      setQuickAddInput('');
    }
  };

  const handleStartRename = (item) => {
    setEditingItem({
      group: getActiveGroupKey(),
      originalName: item,
      currentInput: item
    });
  };

  const handleSaveRename = () => {
    if (!editingItem) return;
    const success = renameCategory(editingItem.group, editingItem.originalName, editingItem.currentInput);
    if (success) {
      setEditingItem(null);
    }
  };

  const handleDeleteItem = (item) => {
    const usage = getItemUsageCount(item);
    let msg = lang === 'bn' ? `আপনি কি "${item}" মুছে ফেলতে চান?` : `Delete "${item}"?`;
    if (usage > 0) {
      msg = lang === 'bn'
        ? `সতর্কতা: এই আইটেমটি ${usage}টি রেকর্ডে ব্যবহৃত হচ্ছে। মুছে ফেললে রেকর্ডগুলোতে তথ্য খালি হতে পারে। নিশ্চিত মুছে ফেলবেন?`
        : `Warning: This is used in ${usage} records. Delete anyway?`;
    }
    if (window.confirm(msg)) {
      deleteCategory(getActiveGroupKey(), item);
    }
  };

  // Filter items by search
  const filteredItems = currentList.filter(item =>
    item.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const filteredFolders = posFolders.filter(f =>
    f.label.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
    (f.enLabel && f.enLabel.toLowerCase().includes(searchTerm.toLowerCase().trim())) ||
    f.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase().trim()))
  );

  // Tab definitions
  const tabs = [
    { id: 'folders', label: lang === 'bn' ? '📁 ফোল্ডার ও পিওএস শর্টকাট' : '📁 Folders & Shortcuts', count: posFolders.length, color: '#6366f1' },
    { id: 'healthcare_template', label: lang === 'bn' ? '🏥 হেলথকেয়ার ৩-ইন-১ টেমপ্লেট' : '🏥 Healthcare 3-in-1 Template', count: '৩ মডিউল', color: '#0d9488' },
    { id: 'categories', label: lang === 'bn' ? '🏷️ পণ্যের ক্যাটাগরি' : '🏷️ Product Categories', count: (categories.productCategories || []).length, color: '#10b981' },
    { id: 'units', label: lang === 'bn' ? '⚖️ পরিমাপ ও ইউনিট' : '⚖️ Units of Measure', count: (categories.productUnits || []).length, color: '#06b6d4' },
    { id: 'brands', label: lang === 'bn' ? '🏢 কোম্পানি ও ব্র্যান্ড' : '🏢 Brands & Companies', count: (categories.productBrands || []).length, color: '#f59e0b' },
    { id: 'tables', label: lang === 'bn' ? '🍽️ রেস্টুরেন্ট টেবিল ও জোন' : '🍽️ Tables & Dining', count: (categories.restaurantTables || []).length, color: '#ec4899' },
    { id: 'expenses', label: lang === 'bn' ? '💼 খরচের খাত ও ফোল্ডার' : '💼 Expense Folders', count: (categories.businessExpenseCategories || []).length, color: '#f43f5e' },
    { id: 'debts', label: lang === 'bn' ? '📒 দেনা-পাওনা সম্পর্ক' : '📒 Debt Relations', count: (categories.debtBusinessRelations || []).length, color: '#8b5cf6' },
    { id: 'familyMembers', label: lang === 'bn' ? '👥 পরিবারের সদস্য' : '👥 Family Members', count: (categories.familyMembers || []).length, color: '#059669' },
    { id: 'subCategories', label: lang === 'bn' ? '🔀 খরচের সাব-ক্যাটাগরি' : '🔀 Sub-Categories', count: (categories.expenseSubCategories || []).length, color: '#0ea5e9' },
    { id: 'purposes', label: lang === 'bn' ? '🎯 উদ্দেশ্য ও ইভেন্ট' : '🎯 Purposes & Tags', count: (categories.expensePurposes || []).length, color: '#d97706' }
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.25rem' }} className="animate-fade-in">
      
      {/* Top Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(16, 185, 129, 0.08))',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1, #10b981)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 6px 20px rgba(99, 102, 241, 0.35)',
            fontSize: '1.75rem'
          }}>
            📁
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-main)' }}>
              {lang === 'bn' ? 'মাস্টার ডাটা ও ফোল্ডার সেটআপ হাব' : 'Master Setup & Folder Hub'}
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              {lang === 'bn'
                ? 'এক স্থান থেকেই দোকানের সকল ফোল্ডার, পিওএস শর্টকাট, ক্যাটাগরি, পরিমাপের ইউনিট, ব্র্যান্ড ও টেবিল যোগ ও নিয়ন্ত্রণ করুন'
                : 'Centralized control center for POS Folders, Categories, Units, Brands, and Tables'}
            </p>
          </div>
        </div>

        {/* Quick Shortcut Buttons to POS / Inventory */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {onNavigateToPos && (
            <button
              onClick={onNavigateToPos}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              <span>🛒 পিওএস টার্মিনালে যান</span>
              <ArrowRight size={14} />
            </button>
          )}
          {onNavigateToInventory && (
            <button
              onClick={onNavigateToInventory}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              <Boxes size={14} />
              <span>ইনভেন্টরি পণ্য তালিকা</span>
            </button>
          )}
          <button
            onClick={() => {
              if (window.confirm(lang === 'bn' ? 'আপনি কি এই সেকশনের ডিফল্ট ডাটা রিস্টোর করতে চান?' : 'Reset this section to defaults?')) {
                if (activeTab === 'folders') {
                  localStorage.removeItem('hk360_pos_quick_filters');
                  window.location.reload();
                } else {
                  resetCategories(getActiveGroupKey());
                }
              }
            }}
            className="btn"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem'
            }}
            title="ডিফল্ট ডাটা রিস্টোর করুন"
          >
            <RotateCcw size={14} />
            <span>ডিফল্ট রিস্টোর</span>
          </button>
        </div>
      </div>

      {/* Main Tab Navigation Strip */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '8px',
        marginBottom: '1.25rem',
        borderBottom: '1px solid var(--border-color)'
      }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchTerm('');
                setEditingItem(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '12px',
                fontWeight: isActive ? '800' : '600',
                fontSize: '0.9rem',
                border: isActive ? `2px solid ${tab.color}` : '1px solid var(--border-color)',
                background: isActive ? `${tab.color}18` : 'var(--bg-secondary)',
                color: isActive ? tab.color : 'var(--text-main)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                background: isActive ? tab.color : 'var(--border-color)',
                color: isActive ? '#fff' : 'var(--text-muted)',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '0.75rem',
                fontWeight: '800'
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* VIEW: HEALTHCARE MASTER 3-IN-1 TEMPLATE TAB */}
      {activeTab === 'healthcare_template' && (
        <div style={{ marginTop: '0.5rem' }}>
          <HealthcareHub embeddedMode={true} />
        </div>
      )}

      {/* Search and Action Bar (Only for standard folder/category tabs) */}
      {activeTab !== 'healthcare_template' && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem'
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '420px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                activeTab === 'folders'
                  ? (lang === 'bn' ? 'ফোল্ডার বা কি-ওয়ার্ড খুঁজুন...' : 'Search folders or keywords...')
                  : (lang === 'bn' ? 'আইটেম বা নাম খুঁজুন...' : 'Search items...')
              }
              style={{ paddingLeft: '36px', height: '42px', borderRadius: '10px', fontSize: '0.9rem' }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Right Action: Add Button or Form */}
          {activeTab === 'folders' ? (
            <button
              onClick={() => setShowAddFolderModal(true)}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                height: '42px',
                padding: '0 18px',
                borderRadius: '10px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
              }}
            >
              <Plus size={18} />
              <span>+ নতুন ফোল্ডার তৈরি করুন</span>
            </button>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleQuickAdd();
              }}
              style={{ display: 'flex', gap: '8px', flex: '1 1 320px', maxWidth: '500px' }}
            >
              <input
                type="text"
                className="form-control"
                value={quickAddInput}
                onChange={(e) => setQuickAddInput(e.target.value)}
                placeholder={
                  activeTab === 'categories' ? 'নতুন ক্যাটাগরির নাম (যেমন: বেকারি)...' :
                  activeTab === 'units' ? 'নতুন ইউনিট (যেমন: বস্তা, ডজন, গজ)...' :
                  activeTab === 'brands' ? 'নতুন ব্র্যান্ড (যেমন: তীর, ফ্রেশ)...' :
                  activeTab === 'tables' ? 'নতুন টেবিল (যেমন: টেবিল ০৭, কেবিন ১)...' :
                  'নতুন আইটেমের নাম লিখুন...'
                }
                style={{ height: '42px', borderRadius: '10px', fontSize: '0.9rem' }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!quickAddInput.trim()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  height: '42px',
                  padding: '0 16px',
                  borderRadius: '10px',
                  fontWeight: '800',
                  whiteSpace: 'nowrap'
                }}
              >
                <Plus size={18} />
                <span>যোগ করুন</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* VIEW 1: POS FOLDERS & SHORTCUTS TAB                                */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'folders' && (
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            {filteredFolders.map(folder => {
              // Calculate matching products
              const matchCount = folder.id === 'all'
                ? products.length
                : products.filter(p => {
                    const name = (p.name || '').toLowerCase();
                    const cat = (p.category || '').toLowerCase();
                    return folder.keywords.some(k => name.includes(k) || cat.includes(k));
                  }).length;

              return (
                <div
                  key={folder.id}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: 'rgba(99, 102, 241, 0.12)',
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem'
                      }}>
                        {folder.icon || '🏷️'}
                      </div>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--text-main)' }}>
                          {folder.label}
                        </div>
                        {folder.enLabel && folder.enLabel !== folder.label && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {folder.enLabel}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        background: 'rgba(16, 185, 129, 0.12)',
                        color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '800'
                      }}>
                        {matchCount}টি পণ্য
                      </span>
                      {folder.id !== 'all' && (
                        <button
                          onClick={() => handleDeleteFolder(folder.id)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: 'none',
                            color: '#ef4444',
                            borderRadius: '8px',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                          title="মুছে ফেলুন"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Matching Keywords */}
                  {folder.keywords && folder.keywords.length > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        ম্যাচিং কি-ওয়ার্ডসমূহ:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {folder.keywords.map((kw, i) => (
                          <span
                            key={i}
                            style={{
                              background: 'var(--bg-primary)',
                              border: '1px solid var(--border-color)',
                              padding: '2px 7px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              color: 'var(--text-main)'
                            }}
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sub-Filters / Sub-brands */}
                  {folder.subFilters && folder.subFilters.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        সাব-গ্রুপ / ফিল্টার চিপস ({folder.subFilters.length}):
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {folder.subFilters.map((sub, i) => (
                          <span
                            key={i}
                            style={{
                              background: 'rgba(99, 102, 241, 0.08)',
                              border: '1px solid rgba(99, 102, 241, 0.2)',
                              color: '#6366f1',
                              padding: '2px 7px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}
                          >
                            {sub.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* VIEW 2: GENERIC LISTS (Categories, Units, Brands, Tables, etc.)   */}
      {/* ------------------------------------------------------------------ */}
      {activeTab !== 'folders' && (
        <div>
          {/* Quick Presets for Current Tab */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>
              <Sparkles size={15} color="#f59e0b" />
              <span>জনপ্রিয় পরামর্শ (১-ক্লিকে যোগ করুন):</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {(
                activeTab === 'categories' ? POPULAR_CATEGORY_PRESETS :
                activeTab === 'units' ? POPULAR_UNIT_PRESETS :
                activeTab === 'brands' ? POPULAR_BRAND_PRESETS :
                activeTab === 'tables' ? POPULAR_TABLE_PRESETS :
                []
              ).map((preset, idx) => {
                const alreadyExists = currentList.includes(preset);
                return (
                  <button
                    key={idx}
                    onClick={() => !alreadyExists && handleQuickAdd(preset)}
                    disabled={alreadyExists}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      border: alreadyExists ? '1px solid var(--border-color)' : '1px dashed #6366f1',
                      background: alreadyExists ? 'transparent' : 'rgba(99, 102, 241, 0.08)',
                      color: alreadyExists ? 'var(--text-muted)' : '#6366f1',
                      cursor: alreadyExists ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {alreadyExists ? <Check size={12} /> : <Plus size={12} />}
                    <span>{preset}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* List of Current Items */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: '800', fontSize: '0.88rem', color: 'var(--text-main)' }}>
                তালিকাভুক্ত আইটেম ({filteredItems.length})
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                নামের উপর ক্লিক করে সরাসরি এডিট করতে পারবেন
              </span>
            </div>

            {filteredItems.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <AlertCircle size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <div>কোনো আইটেম পাওয়া যায়নি</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px', padding: '12px' }}>
                {filteredItems.map((item, idx) => {
                  const isEditing = editingItem && editingItem.originalName === item;
                  const usageCount = getItemUsageCount(item);

                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        gap: '8px'
                      }}
                    >
                      {isEditing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                          <input
                            type="text"
                            className="form-control"
                            value={editingItem.currentInput}
                            onChange={(e) => setEditingItem({ ...editingItem, currentInput: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename();
                              if (e.key === 'Escape') setEditingItem(null);
                            }}
                            autoFocus
                            style={{ height: '32px', fontSize: '0.85rem' }}
                          />
                          <button
                            onClick={handleSaveRename}
                            style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            title="সংরক্ষণ করুন"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setEditingItem(null)}
                            style={{ background: 'var(--border-color)', color: 'var(--text-main)', border: 'none', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            title="বাতিল করুন"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                            <Tag size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item}
                            </span>
                            {usageCount > 0 && (
                              <span style={{
                                background: 'rgba(16, 185, 129, 0.1)',
                                color: '#10b981',
                                fontSize: '0.7rem',
                                fontWeight: '800',
                                padding: '2px 6px',
                                borderRadius: '10px'
                              }}>
                                {usageCount}
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                            <button
                              onClick={() => handleStartRename(item)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                              title="নাম পরিবর্তন করুন"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                              title="মুছে ফেলুন"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: ADD NEW POS FOLDER                                          */}
      {/* ------------------------------------------------------------------ */}
      {showAddFolderModal && (
        <div
          className="modal-overlay modal-backdrop modal-top-align"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1500,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '24px 14px',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            overflowY: 'auto'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddFolderModal(false);
          }}
        >
          <div
            className="modal-content animate-fade-in"
            style={{
              maxWidth: '580px',
              width: '95%',
              marginTop: '10px',
              padding: '1.5rem',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
              border: '1.5px solid rgba(99, 102, 241, 0.4)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', fontSize: '1.25rem' }}>
                  📁
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800' }}>
                    নতুন ফোল্ডার ও পিওএস শর্টকাট তৈরি করুন
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    পিওএস টার্মিনালে পণ্য দ্রুত ফিল্টার করার জন্য ফোল্ডার যুক্ত করুন
                  </p>
                </div>
              </div>
              <button onClick={() => setShowAddFolderModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateFolder}>
              {/* Folder Label */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px' }}>
                  ফোল্ডারের নাম (বাংলা) *
                </label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="যেমন: কোমল পানীয়, বেকারি, মসলা..."
                  value={folderForm.label}
                  onChange={(e) => setFolderForm({ ...folderForm, label: e.target.value })}
                />
              </div>

              {/* Emoji Icon Picker */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px' }}>
                  আইকন / ইমোজি নির্বাচন করুন
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ width: '45px', height: '45px', borderRadius: '10px', background: 'var(--bg-primary)', border: '2px solid #6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                    {folderForm.icon}
                  </div>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="ইমোজি লিখুন বা নিচের তালিকা থেকে চাপুন"
                    value={folderForm.icon}
                    onChange={(e) => setFolderForm({ ...folderForm, icon: e.target.value })}
                    style={{ flex: 1 }}
                  />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {EMOJI_PALETTE.map((emoji, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setFolderForm({ ...folderForm, icon: emoji })}
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        border: folderForm.icon === emoji ? '2px solid #6366f1' : '1px solid var(--border-color)',
                        background: folderForm.icon === emoji ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-secondary)',
                        fontSize: '1.1rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Match Keywords */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px' }}>
                  ম্যাচিং কি-ওয়ার্ডসমূহ (কমা দিয়ে আলাদা করুন)
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="যেমন: কোক, স্প্রাইট, জুস, ফান্টা, পানি"
                  value={folderForm.keywords}
                  onChange={(e) => setFolderForm({ ...folderForm, keywords: e.target.value })}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  পণ্যের নামের সাথে এই শব্দগুলো মিললে পণ্যের তালিকায় এই ফোল্ডারের অধীনে দেখাবে
                </span>
              </div>

              {/* Sub-Filters */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px' }}>
                  সাব-গ্রুপ / কোম্পানি ভ্যারাইটি (ঐচ্ছিক, কমা দিয়ে লিখুন)
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="যেমন: কোকাকোলা, পেপসি, প্রাণ জুস, মাম পানি"
                  value={folderForm.subFilters}
                  onChange={(e) => setFolderForm({ ...folderForm, subFilters: e.target.value })}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  এই ফোল্ডারে ক্লিক করলে উপরে ছোট সাব-ট্যাব হিসেবে এগুলো দৃশ্যমান হবে
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddFolderModal(false)}
                  className="btn btn-secondary"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontWeight: '800', padding: '0 20px' }}
                >
                  ✓ ফোল্ডার সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
