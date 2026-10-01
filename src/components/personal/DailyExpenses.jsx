import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShoppingCart,
  Plus,
  Search,
  Calendar,
  Tag,
  Trash2,
  Edit2,
  Scale,
  X,
  ArrowUpRight,
  Filter,
  Sparkles,
  Home,
  FileSpreadsheet,
  User,
  Users,
  Layers,
  Compass,
  Check,
  FolderOpen,
  MoreVertical
} from 'lucide-react';
import { CategoryManagerModal } from '../common/CategoryManagerModal';
import { DataExportImportModal } from '../common/DataExportImportModal';
import { BazaarShoppingListModal } from './BazaarShoppingListModal';
import { MasterHubModal } from '../common/MasterHubModal';
import { DailyExpenseAddEditModal } from './DailyExpenseAddEditModal';

const DEFAULT_CATEGORY_SUB_MAP = {
  transport: ['বাস ভাড়া', 'অটো / সিএনজি ভাড়া', 'রিকশা ভাড়া', 'উবার / পাঠাও রাইড', 'মেট্রোরেল ভাড়া', 'মোটরসাইকেল তেল', 'ট্রেন / লঞ্চ ভাড়া'],
  education: ['স্কুলের মাসিক বেতন', 'কোচিং ফি', 'প্রাইভেট টিউটর বেতন', 'বই ও খাতা কেনা', 'স্কুল ড্রেস / জুতো', 'টিফিন খরচ', 'পরীক্ষার ফি'],
  bazaar: ['কাঁচা শাকসবজি', 'তাজা মাছ', 'মাংস (মুরগি/গরু)', 'চাল ও আটা', 'ডাল ও সয়াবিন তেল', 'ডিম ও দুধ', 'ফলমূল'],
  medical: ['ডাক্তারের ভিজিট ফি', 'প্রেসক্রিপশনের ওষুধ', 'ল্যাব ও প্যাথলজি টেস্ট', 'হাসপাতাল চার্জ'],
  utility: ['বিদ্যুৎ বিল (ডেসকো/ডিপিডিসি)', 'গ্যাস বিল', 'পানির বিল (ওয়াসা)', 'ইন্টারনেট / ওয়াইফাই বিল', 'মোবাইল রিচার্জ', 'ময়লার বিল'],
  rent: ['মাসিক ফ্ল্যাট বাসা ভাড়া', 'গ্যারেজ ভাড়া', 'সার্ভিস চার্জ ও সিকিউরিটি'],
  food: ['রেস্টুরেন্টে খাবার', 'ফাস্টফুড ও স্ন্যাক্স', 'চা ও বিস্কুট', 'মেহমান আপ্যায়ন'],
  other: ['বিবিধ কেনাকাটা', 'জরুরি খরচ', 'দান ও সদকা']
};

export const DailyExpenses = () => {
  const {
    personalExpenses,
    personalEvents = [],
    bazaarShoppingList = [],
    addPersonalExpense,
    updatePersonalExpense,
    deletePersonalExpense,
    categories = {},
    addCategory,
    t,
    lang
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedUnit, setSelectedUnit] = useState('all');
  const [selectedMember, setSelectedMember] = useState('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState('all');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showExportImportModal, setShowExportImportModal] = useState(false);
  const [showShoppingListModal, setShowShoppingListModal] = useState(false);
  const [showMasterHubModal, setShowMasterHubModal] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const availableMembers = categories.familyMembers || [
    'নিজে (Self)',
    'স্ত্রী (Wife)',
    'ছেলে (Son)',
    'মেয়ে (Daughter)',
    'বাবা (Father)',
    'মা (Mother)',
    'ছোট ভাই / বোন',
    'পুরো পরিবার (সবার জন্য)'
  ];

  const dailyList = useMemo(() => {
    return personalExpenses.filter(e => e.type === 'daily');
  }, [personalExpenses]);

  const filteredExpenses = useMemo(() => {
    return dailyList.filter(item => {
      const search = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !search ||
        (item.title && item.title.toLowerCase().includes(search)) ||
        (item.item && item.item.toLowerCase().includes(search)) ||
        (item.note && item.note.toLowerCase().includes(search)) ||
        (item.subCategory && item.subCategory.toLowerCase().includes(search)) ||
        (item.familyMember && item.familyMember.toLowerCase().includes(search)) ||
        (item.purpose && item.purpose.toLowerCase().includes(search));

      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesUnit = selectedUnit === 'all' || item.unit === selectedUnit;
      const matchesMember = selectedMember === 'all' || item.familyMember === selectedMember;
      const matchesSubCat = selectedSubCategory === 'all' || item.subCategory === selectedSubCategory;

      return matchesSearch && matchesCat && matchesUnit && matchesMember && matchesSubCat;
    });
  }, [dailyList, searchTerm, selectedCategory, selectedUnit, selectedMember, selectedSubCategory]);

  const totalDaily = useMemo(() => {
    return dailyList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [dailyList]);

  const totalFiltered = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpenses]);

  const pendingShoppingCount = useMemo(() => {
    return (bazaarShoppingList || []).filter(i => !i.isPurchased).length;
  }, [bazaarShoppingList]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingExpense(null);
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (expense) => {
    setEditingExpense(expense);
    setShowModal(true);
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              <ShoppingCart size={22} />
            </div>
            <span>{t.personal.dailyTitle}</span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {lang === 'bn'
              ? 'প্রতিদিনের বাজার, নাস্তা ও খরচের হিসাব আইটেম, পরিমাণ ও একক (গ্রাম, কেজি, লিটার, অটো ভাড়া) সহ লিখে রাখুন'
              : t.personal.dailySubtitle}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Total Badge */}
          <div
            style={{
              background: 'var(--bg-card)',
              padding: '7px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              {lang === 'bn' ? 'মোট:' : 'Total:'}
            </span>
            <span style={{ fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#ef4444', fontSize: '1.05rem' }}>
              ৳{totalDaily.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Bazaar Shopping List Button */}
          <button
            onClick={() => setShowShoppingListModal(true)}
            title={lang === 'bn' ? 'বাজারের ফর্দ ও শপিং লিস্ট ওপেন করুন' : 'Open Bazaar Shopping List'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#059669',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            <ShoppingCart size={16} />
            <span>{lang === 'bn' ? 'বাজারের ফর্দ' : 'Shopping List'}</span>
            {pendingShoppingCount > 0 && (
              <span
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '0.7rem',
                  fontWeight: '800'
                }}
              >
                {pendingShoppingCount}
              </span>
            )}
          </button>

          {/* Add Daily Expense Button */}
          <button
            onClick={handleOpenAddModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: '800',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
            }}
          >
            <Plus size={16} />
            <span>{t.personal.addDailyExpense}</span>
          </button>

          {/* More Tools Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowToolsMenu(prev => !prev)}
              title={lang === 'bn' ? 'আরও অপশন ও সেটিংস' : 'More Tools'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'var(--bg-card)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer'
              }}
            >
              <MoreVertical size={18} />
            </button>

            {showToolsMenu && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '110%',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '6px',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.25)',
                  minWidth: '200px',
                  zIndex: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <button
                  onClick={() => {
                    setShowUnitModal(true);
                    setShowToolsMenu(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    fontSize: '0.84rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <Scale size={15} style={{ color: '#06b6d4' }} />
                  <span>{lang === 'bn' ? 'পরিমাপক একক তালিকা' : 'Manage Units'}</span>
                </button>

                <button
                  onClick={() => {
                    setShowMasterHubModal(true);
                    setShowToolsMenu(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    fontSize: '0.84rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <FolderOpen size={15} style={{ color: '#f97316' }} />
                  <span>{lang === 'bn' ? 'মাস্টার ডাটা হাব' : 'Master Data Hub'}</span>
                </button>

                <button
                  onClick={() => {
                    setShowExportImportModal(true);
                    setShowToolsMenu(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    fontSize: '0.84rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <FileSpreadsheet size={15} style={{ color: '#0f766e' }} />
                  <span>{lang === 'bn' ? 'এক্সপোর্ট / ইমপোর্ট' : 'Export / Import'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Quick Bazaar Banner (Always visible at the top when items are in list) */}
      {pendingShoppingCount > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))',
            border: '1.5px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '14px',
            padding: '10px 16px',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
              }}
            >
              <ShoppingCart size={17} />
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{lang === 'bn' ? '📌 আজকের বাজারের ফর্দ (Shopping List):' : '📌 Today\'s Bazaar Shopping List:'}</span>
                <span
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.72rem',
                    fontWeight: '800'
                  }}
                >
                  {lang === 'bn' ? `${pendingShoppingCount} টি আইটেম বাকি` : `${pendingShoppingCount} items remaining`}
                </span>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '3px' }}>
                {(bazaarShoppingList || []).filter(i => !i.isPurchased).slice(0, 4).map(item => (
                  <span
                    key={item.id}
                    style={{
                      background: 'var(--bg-card)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      fontWeight: '600'
                    }}
                  >
                    • {item.name} {item.quantity ? `(${item.quantity} ${item.unit || ''})` : ''}
                  </span>
                ))}
                {pendingShoppingCount > 4 && (
                  <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>+{pendingShoppingCount - 4} আরও...</span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setShowShoppingListModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
              }}
            >
              <ShoppingCart size={14} />
              <span>{lang === 'bn' ? 'ফর্দ ওপেন করুন ↗' : 'Open Full List ↗'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '0.875rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '200px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-dim)'
            }}
          />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '36px', width: '100%', borderRadius: '8px' }}
            placeholder={lang === 'bn' ? 'আইটেম, পণ্য বা নোট দিয়ে খুঁজুন...' : 'Search item or notes...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <select
          className="select-field"
          style={{ width: 'auto', minWidth: '160px', borderRadius: '8px' }}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">{lang === 'bn' ? 'সব ক্যাটাগরি' : 'All Categories'}</option>
          {Object.entries(t.personal.expenseCategories).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
          {(categories.personalExpenseCategories || [])
            .filter(cat => !Object.keys(t.personal.expenseCategories || {}).includes(cat) && !Object.values(t.personal.expenseCategories || {}).includes(cat))
            .map((cat) => (
              <option key={cat} value={cat}>🏷️ {cat}</option>
            ))}
        </select>

        {/* Family Member Filter */}
        <select
          className="select-field"
          style={{ width: 'auto', minWidth: '160px', borderRadius: '8px' }}
          value={selectedMember}
          onChange={(e) => setSelectedMember(e.target.value)}
        >
          <option value="all">👤 {lang === 'bn' ? 'সকল ফ্যামিলি মেম্বার' : 'All Family Members'}</option>
          {availableMembers.map((m) => (
            <option key={m} value={m}>👤 {m}</option>
          ))}
        </select>

        {/* Sub-Category Filter */}
        <select
          className="select-field"
          style={{ width: 'auto', minWidth: '160px', borderRadius: '8px' }}
          value={selectedSubCategory}
          onChange={(e) => setSelectedSubCategory(e.target.value)}
        >
          <option value="all">🔀 {lang === 'bn' ? 'সকল সাব-ক্যাটাগরি' : 'All Sub-Categories'}</option>
          {(categories.expenseSubCategories || []).map((s) => (
            <option key={s} value={s}>🔀 {s}</option>
          ))}
        </select>

        {/* Clear Filters Button if any filter active */}
        {(selectedCategory !== 'all' || selectedMember !== 'all' || selectedSubCategory !== 'all' || searchTerm) && (
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setSelectedMember('all');
              setSelectedSubCategory('all');
              setSearchTerm('');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <X size={14} />
            <span>{lang === 'bn' ? 'ফিল্টার রিসেট' : 'Reset'}</span>
          </button>
        )}

        {filteredExpenses.length !== dailyList.length && (
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {lang === 'bn' ? 'ফিল্টারকৃত মোট:' : 'Filtered Total:'}{' '}
            <strong style={{ color: '#ef4444', fontSize: '0.95rem' }}>৳{totalFiltered.toLocaleString('en-IN')}</strong> ({filteredExpenses.length}টি)
          </div>
        )}
      </div>

      {/* Expense Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 14px' }}>{t.date}</th>
                <th style={{ padding: '10px 14px' }}>{t.category}</th>
                <th style={{ padding: '10px 14px' }}>{lang === 'bn' ? 'কি কিনলাম / আইটেম' : 'Item Description'}</th>
                <th style={{ padding: '10px 14px' }}>{lang === 'bn' ? 'পরিমাণ ও একক' : 'Quantity & Unit'}</th>
                <th style={{ padding: '10px 14px' }}>{t.note}</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>{t.amount}</th>
                <th style={{ padding: '10px 14px', textAlign: 'center' }}>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '1.2rem', marginBottom: '6px' }}>🛒</div>
                    <div>{lang === 'bn' ? 'কোনো দৈনিক খরচের রেকর্ড পাওয়া যায়নি' : 'No daily expenses found'}</div>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((item) => {
                  const hasQty = item.quantity !== null && item.quantity !== undefined && item.quantity !== '';

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                          <span>{item.date}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--personal-primary)' }}>
                          <Tag size={12} />
                          {t.personal.expenseCategories[item.category] || item.category}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                          {item.item || item.title}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                          {item.subCategory && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                background: 'rgba(14, 165, 233, 0.12)',
                                color: '#0ea5e9',
                                fontSize: '0.72rem',
                                fontWeight: '700'
                              }}
                            >
                              <Layers size={10} />
                              <span>{item.subCategory}</span>
                            </span>
                          )}
                          {item.familyMember && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                background: 'rgba(5, 150, 105, 0.12)',
                                color: '#059669',
                                fontSize: '0.72rem',
                                fontWeight: '700'
                              }}
                            >
                              <User size={10} />
                              <span>{item.familyMember}</span>
                            </span>
                          )}
                          {item.purpose && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                background: 'rgba(217, 119, 6, 0.12)',
                                color: '#d97706',
                                fontSize: '0.72rem',
                                fontWeight: '700'
                              }}
                            >
                              <Compass size={10} />
                              <span>{item.purpose}</span>
                            </span>
                          )}
                          {item.eventName && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                background: 'rgba(236, 72, 153, 0.12)',
                                color: '#ec4899',
                                fontSize: '0.72rem',
                                fontWeight: '700'
                              }}
                            >
                              <Sparkles size={10} />
                              <span>{item.eventName}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        {hasQty ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: 'var(--bg-main)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-main)',
                              fontWeight: '700',
                              fontSize: '0.8rem'
                            }}
                          >
                            <Scale size={13} style={{ color: '#06b6d4' }} />
                            <span>
                              {item.quantity} {item.unit}
                            </span>
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {item.note || '—'}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#ef4444', fontSize: '0.95rem' }}>
                        -৳{Number(item.amount).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '4px' }}>
                          <button
                            className="btn-icon"
                            onClick={() => handleOpenEditModal(item)}
                            title={lang === 'bn' ? 'সম্পাদনা করুন' : 'Edit'}
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => {
                              if (window.confirm(lang === 'bn' ? 'এই খরচের রেকর্ডটি মুছে ফেলতে চান?' : 'Delete this daily expense?')) {
                                deletePersonalExpense(item.id);
                              }
                            }}
                            title={t.delete}
                            style={{ color: '#ef4444' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal (Unified Component) */}
      <DailyExpenseAddEditModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingExpense(null);
        }}
        editingExpense={editingExpense}
        initialType="daily"
      />

      {/* Units Manager Modal */}
      <CategoryManagerModal
        isOpen={showUnitModal}
        onClose={() => setShowUnitModal(false)}
        defaultGroup="expenseUnits"
      />

      {/* Export / Import Modal */}
      <DataExportImportModal
        isOpen={showExportImportModal}
        onClose={() => setShowExportImportModal(false)}
        defaultTab="export"
        initialTarget="daily"
      />

      {/* Bazaar Shopping List Modal */}
      <BazaarShoppingListModal
        isOpen={showShoppingListModal}
        onClose={() => setShowShoppingListModal(false)}
        onOpenExpenseModal={handleOpenAddModal}
      />

      {/* Master Hub Modal */}
      <MasterHubModal
        isOpen={showMasterHubModal}
        onClose={() => setShowMasterHubModal(false)}
        defaultTab="units"
      />
    </div>
  );
};

export default DailyExpenses;
